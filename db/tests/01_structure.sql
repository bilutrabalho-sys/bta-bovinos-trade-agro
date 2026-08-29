-- ============================================================================
--  BTA — Testes de banco · 01_structure.sql
--  Verifica que os OBJETOS de integridade EXISTEM (constraints, generated
--  columns, índices únicos/parciais). Se um deles sumir num refactor, o teste
--  falha com mensagem clara. Somente leitura de catálogo (pg_*). Não depende de seed.
--
--  Framework: SQL puro (DO $$ ... RAISE EXCEPTION). Rode com:
--    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/tests/01_structure.sql
-- ============================================================================

-- ---- helper: falha se uma condição booleana não for verdadeira -------------
-- (inline em cada bloco; sem criar função para não sujar o schema de teste)

-- 1) Colunas GENERATED existem e são STORED -----------------------------------
do $$
declare g char;
begin
  select attgenerated into g from pg_attribute
   where attrelid = 'lots'::regclass and attname = 'price_total';
  if g is distinct from 's' then
    raise exception 'FAIL: lots.price_total deveria ser GENERATED STORED (attgenerated=%)', coalesce(g,'<null>');
  end if;

  select attgenerated into g from pg_attribute
   where attrelid = 'transactions'::regclass and attname = 'fee_amount';
  if g is distinct from 's' then
    raise exception 'FAIL: transactions.fee_amount deveria ser GENERATED STORED (attgenerated=%)', coalesce(g,'<null>');
  end if;

  raise notice 'PASS: generated columns lots.price_total e transactions.fee_amount presentes (STORED)';
end $$;

-- 2) CHECK constraints de negócio existem -------------------------------------
do $$
declare
  wanted text[] := array[
    'chk_tx_weight_snapshot_for_arroba',  -- '/@' exige weight_snapshot
    'chk_favorites_one_target'            -- exclusive arc: exatamente 1 alvo
  ];
  c text;
begin
  foreach c in array wanted loop
    if not exists (select 1 from pg_constraint where conname = c) then
      raise exception 'FAIL: constraint % ausente', c;
    end if;
  end loop;
  raise notice 'PASS: constraints de negócio presentes (%)', array_to_string(wanted, ', ');
end $$;

-- 3) Índices únicos / parciais de integridade existem -------------------------
do $$
declare
  wanted text[] := array[
    'ux_lot_images_one_cover',            -- no máx. 1 capa por lote
    'ux_market_prices_scope',             -- snapshot corrente único por escopo
    'ux_market_points_scope_date',        -- 1 ponto por (cat, região, data)
    'ux_favorites_user_lot',
    'ux_favorites_user_farm',
    'ux_favorites_user_opportunity',
    'ux_favorites_user_simulation',
    'ux_favorites_user_lesson'
  ];
  i text;
begin
  foreach i in array wanted loop
    if not exists (select 1 from pg_class where relkind = 'i' and relname = i) then
      raise exception 'FAIL: índice % ausente', i;
    end if;
  end loop;
  raise notice 'PASS: índices únicos/parciais de integridade presentes (% itens)', array_length(wanted,1);
end $$;

-- 4) FKs essenciais existem com o ON DELETE esperado --------------------------
--    (regra de negócio: apagar um lote NÃO deve apagar a fazenda; seller_id é
--     RESTRICT. Favoritar e depois apagar o lote DEVE limpar o favorito; CASCADE.)
do $$
declare d char;
begin
  -- lots.seller_id -> farms : RESTRICT ('r')
  select confdeltype into d from pg_constraint
   where conrelid = 'lots'::regclass and contype = 'f'
     and conkey = (select array_agg(attnum) from pg_attribute
                    where attrelid = 'lots'::regclass and attname = 'seller_id');
  if d is distinct from 'r' then
    raise exception 'FAIL: lots.seller_id deveria ser ON DELETE RESTRICT (confdeltype=%)', coalesce(d,'<null>');
  end if;

  -- favorites.lot_id -> lots : CASCADE ('c')
  select confdeltype into d from pg_constraint
   where conrelid = 'favorites'::regclass and contype = 'f'
     and conkey = (select array_agg(attnum) from pg_attribute
                    where attrelid = 'favorites'::regclass and attname = 'lot_id');
  if d is distinct from 'c' then
    raise exception 'FAIL: favorites.lot_id deveria ser ON DELETE CASCADE (confdeltype=%)', coalesce(d,'<null>');
  end if;

  -- transactions.lot_id -> lots : RESTRICT ('r')  (não apagar histórico ao mexer no lote)
  select confdeltype into d from pg_constraint
   where conrelid = 'transactions'::regclass and contype = 'f'
     and conkey = (select array_agg(attnum) from pg_attribute
                    where attrelid = 'transactions'::regclass and attname = 'lot_id');
  if d is distinct from 'r' then
    raise exception 'FAIL: transactions.lot_id deveria ser ON DELETE RESTRICT (confdeltype=%)', coalesce(d,'<null>');
  end if;

  raise notice 'PASS: ON DELETE das FKs críticas conforme esperado (seller RESTRICT, favorite CASCADE, tx RESTRICT)';
end $$;

-- ============================================================================
--  SEÇÃO 15 — NOVOS DOMÍNIOS (insumos, vet, usados, vídeos)
-- ============================================================================

-- 5) GENERATED: vet_appointment.total é STORED --------------------------------
do $$
declare g char;
begin
  select attgenerated into g from pg_attribute
   where attrelid = 'vet_appointment'::regclass and attname = 'total';
  if g is distinct from 's' then
    raise exception 'FAIL: vet_appointment.total deveria ser GENERATED STORED (attgenerated=%)', coalesce(g,'<null>');
  end if;
  raise notice 'PASS: vet_appointment.total é GENERATED STORED';
end $$;

-- 6) Índices/constraints únicos dos novos domínios existem --------------------
--    ux_vet_review_appointment é índice NOMEADO (create unique index); os uniques
--    de junction são constraints de tabela (nome auto) -> verifica-se por colunas.
do $$
begin
  if not exists (select 1 from pg_class where relkind = 'i' and relname = 'ux_vet_review_appointment') then
    raise exception 'FAIL: índice ux_vet_review_appointment ausente';
  end if;
  raise notice 'PASS: ux_vet_review_appointment presente';
end $$;

do $$
declare
  targets text[][] := array[
    array['video_like','user_id','video_id'],
    array['video_save','user_id','video_id'],
    array['group_buy_participation','group_buy_id','user_id'],
    array['used_saved','user_id','listing_id'],
    array['vet_follow','user_id','vet_id']
  ];
  i int; tbl text; a1 smallint; a2 smallint; ok boolean;
begin
  for i in 1 .. array_length(targets,1) loop
    tbl := targets[i][1];
    select attnum into a1 from pg_attribute where attrelid = tbl::regclass and attname = targets[i][2];
    select attnum into a2 from pg_attribute where attrelid = tbl::regclass and attname = targets[i][3];
    ok := exists (
      select 1 from pg_constraint c
       where c.conrelid = tbl::regclass and c.contype = 'u'
         and array_length(c.conkey,1) = 2
         and c.conkey @> array[a1,a2]::smallint[]
    );
    if not ok then
      raise exception 'FAIL: constraint UNIQUE composto (%, %) ausente em %', targets[i][2], targets[i][3], tbl;
    end if;
  end loop;
  raise notice 'PASS: uniques de junction dos novos domínios presentes (% tabelas)', array_length(targets,1);
end $$;

-- 7) ON DELETE crítico dos novos domínios -------------------------------------
--    vet_appointment.vet_id/service_id RESTRICT (preserva histórico financeiro);
--    used_saved.listing_id / video_like.video_id CASCADE (o salvo/like some com o
--    item); farm_stock_item.product_id SET NULL (estoque sobrevive ao catálogo).
do $$
declare
  wanted text[][] := array[
    array['vet_appointment','vet_id','r'],
    array['vet_appointment','service_id','r'],
    array['used_saved','listing_id','c'],
    array['video_like','video_id','c'],
    array['video_save','video_id','c'],
    array['farm_stock_item','product_id','n']
  ];
  i int; d char;
begin
  for i in 1 .. array_length(wanted,1) loop
    select confdeltype into d from pg_constraint
     where conrelid = wanted[i][1]::regclass and contype = 'f'
       and conkey = (select array_agg(attnum) from pg_attribute
                      where attrelid = wanted[i][1]::regclass and attname = wanted[i][2]);
    if d is distinct from wanted[i][3] then
      raise exception 'FAIL: %.% deveria ter ON DELETE % (confdeltype=%)',
        wanted[i][1], wanted[i][2], wanted[i][3], coalesce(d,'<null>');
    end if;
  end loop;
  raise notice 'PASS: ON DELETE das FKs críticas dos novos domínios conforme esperado (RESTRICT/CASCADE/SET NULL)';
end $$;

-- 8) CHECK constraints nomeados dos novos domínios existem --------------------
do $$
declare
  wanted text[] := array[
    'chk_vet_appointment_total_nonneg',  -- pix_discount não deixa total < 0
    'chk_supplier_offer_preco',          -- preço >= 0
    'chk_vet_rating',                    -- rating 0..5
    'chk_vet_review_rating',             -- rating 1..5
    'chk_group_buy_precos',              -- preco_grupo <= preco_base
    'chk_group_buy_participation_quantity' -- quantidade > 0
  ];
  c text;
begin
  foreach c in array wanted loop
    if not exists (select 1 from pg_constraint where conname = c) then
      raise exception 'FAIL: constraint % ausente', c;
    end if;
  end loop;
  raise notice 'PASS: CHECKs de negócio dos novos domínios presentes (%)', array_to_string(wanted, ', ');
end $$;

-- 9) Funções de contador (SECURITY DEFINER) e de view bump existem ------------
do $$
declare
  wanted text[] := array[
    'bump_used_listing_views',
    'bump_vet_video_views',
    'trg_group_buy_participation_counts',
    'trg_vet_reviews_count',
    'trg_video_like_count',
    'trg_video_save_count'
  ];
  fn text;
begin
  foreach fn in array wanted loop
    if not exists (select 1 from pg_proc where proname = fn) then
      raise exception 'FAIL: função % ausente', fn;
    end if;
  end loop;
  raise notice 'PASS: funções de contador/view-bump dos novos domínios presentes (%)', array_to_string(wanted, ', ');
end $$;

\echo '== 01_structure OK =='
