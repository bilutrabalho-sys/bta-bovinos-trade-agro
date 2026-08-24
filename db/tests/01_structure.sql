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

\echo '== 01_structure OK =='
