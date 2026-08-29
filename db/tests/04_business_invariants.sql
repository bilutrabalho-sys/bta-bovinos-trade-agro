-- ============================================================================
--  BTA — Testes de banco · 04_business_invariants.sql
--  Verifica generated columns, invariantes de negócio e um "smoke test" do seed
--  (contagens + contrato de ids do mock). Somente leitura. Rode DEPOIS do seed.
-- ============================================================================

-- 1) GENERATED lots.price_total confere com a fórmula -------------------------
do $$
declare bad int;
begin
  select count(*) into bad from lots
   where price_total <> round(
     case price_unit
       when '/@'   then price * (weight / 15.0) * quantity
       when '/cab' then price * quantity
     end, 2);
  if bad > 0 then
    raise exception 'FAIL: % lote(s) com price_total divergente da fórmula canônica', bad;
  end if;
  raise notice 'PASS: lots.price_total confere com a fórmula em todos os lotes';
end $$;

-- 2) GENERATED transactions.fee_amount = total_value * fee_percent/100 --------
do $$
declare bad int;
begin
  select count(*) into bad from transactions
   where fee_amount <> round(total_value * fee_percent / 100.0, 2);
  if bad > 0 then
    raise exception 'FAIL: % transação(ões) com fee_amount divergente', bad;
  end if;
  raise notice 'PASS: transactions.fee_amount confere (total_value * fee_percent/100)';
end $$;

-- 3) Invariante '/@': total_value = agreed_price*(weight_snapshot/15)*qty -----
--    e weight_snapshot obrigatório (nunca NULL) em '/@'.
do $$
declare bad int;
begin
  select count(*) into bad from transactions
   where price_unit = '/@'
     and (weight_snapshot is null
          or total_value <> round(agreed_price * (weight_snapshot / 15.0) * quantity, 2));
  if bad > 0 then
    raise exception 'FAIL: % transação /@ com weight_snapshot nulo ou total_value fora da fórmula', bad;
  end if;
  raise notice 'PASS: transações /@ com weight_snapshot e total_value coerentes';
end $$;

-- 4) Exclusive arc: toda linha de favorites tem exatamente 1 alvo -------------
do $$
declare bad int;
begin
  select count(*) into bad from favorites
   where num_nonnulls(lot_id, farm_id, opportunity_id, simulation_id, lesson_id) <> 1;
  if bad > 0 then
    raise exception 'FAIL: % favorito(s) com número de alvos <> 1', bad;
  end if;
  -- e o seed cobre os 5 tipos do arc:
  if (select count(distinct kind) from (
        select case when lot_id is not null then 'lot'
                    when farm_id is not null then 'farm'
                    when opportunity_id is not null then 'opp'
                    when simulation_id is not null then 'sim'
                    when lesson_id is not null then 'lesson' end as kind
        from favorites where user_id = 1) t) < 5 then
    raise exception 'FAIL: favoritos do Rafael não cobrem os 5 tipos do exclusive arc';
  end if;
  raise notice 'PASS: exclusive arc íntegro e os 5 tipos exercitados';
end $$;

-- 5) lot_images: exatamente 1 capa por lote + posição 0 presente -------------
do $$
declare bad int;
begin
  select count(*) into bad from (
    select lot_id,
           count(*) filter (where is_cover) as covers,
           count(*) filter (where position = 0) as pos0
      from lot_images group by lot_id
  ) s where covers <> 1 or pos0 <> 1;
  if bad > 0 then
    raise exception 'FAIL: % lote(s) sem exatamente 1 capa / sem posição 0', bad;
  end if;
  raise notice 'PASS: cada lote tem exatamente 1 capa (is_cover) na posição 0';
end $$;

-- 6) Coerência negociação -> transação ---------------------------------------
do $$
begin
  if not exists (select 1 from proposals where id = 1 and status = 'accepted') then
    raise exception 'FAIL: proposta 1 deveria estar accepted';
  end if;
  if not exists (select 1 from proposals where id = 2 and status = 'active') then
    raise exception 'FAIL: proposta 2 deveria estar active';
  end if;
  if not exists (select 1 from transactions where id = 1 and proposal_id = 1 and lot_id = 1) then
    raise exception 'FAIL: transação 1 deveria referenciar proposta 1 e lote 1';
  end if;
  if (select count(*) from transaction_steps where transaction_id = 1) <> 5 then
    raise exception 'FAIL: transação 1 deveria ter 5 etapas';
  end if;
  if (select count(*) from transaction_steps where transaction_id = 1 and done) <> 2 then
    raise exception 'FAIL: transação 1 deveria ter exatamente 2 etapas concluídas (DealClosedScreen)';
  end if;
  if not exists (select 1 from transaction_steps where transaction_id = 1 and step_order in (1,2) and done)
     or exists (select 1 from transaction_steps where transaction_id = 1 and step_order in (3,4,5) and done) then
    raise exception 'FAIL: etapas concluídas deveriam ser exatamente as 1 e 2';
  end if;
  raise notice 'PASS: fluxo proposta->transação->etapas coerente (2/5 etapas done)';
end $$;

-- 7) Quiz: cada questão tem >= 2 opções e answer_index dentro do intervalo ----
do $$
declare bad int;
begin
  select count(*) into bad from lesson_quiz_questions q
   where (select count(*) from lesson_quiz_options o where o.question_id = q.id) < 2
      or q.answer_index >= (select count(*) from lesson_quiz_options o where o.question_id = q.id);
  if bad > 0 then
    raise exception 'FAIL: % questão(ões) com opções insuficientes ou answer_index inválido', bad;
  end if;
  raise notice 'PASS: quiz consistente (>=2 opções, answer_index válido)';
end $$;

-- 8) market_price_points: série por categoria alimenta as janelas 7/30/90 ----
do $$
declare bad int;
begin
  select count(*) into bad from (
    select category_id,
           count(*) as pts,
           count(*) filter (where price_date >= current_date - 7) as w7,
           count(*) filter (where price_date >= current_date - 30) as w30,
           count(*) filter (where price_date >= current_date - 90) as w90
      from market_price_points group by category_id
  ) s where pts <> 91 or w7 < 1 or w30 <= w7 or w90 <= w30;
  if bad > 0 then
    raise exception 'FAIL: % categoria(s) com série de preços fora do esperado', bad;
  end if;
  raise notice 'PASS: cada categoria tem 91 pontos e janelas 7<30<90 populadas';
end $$;

-- 9) Sequences ressincronizadas (last_value >= max(id)) ----------------------
do $$
declare t text; lv bigint; mx bigint;
begin
  foreach t in array array[
    'users','farms','lots','opportunities','radars','match_searches','proposals',
    'transactions','transporters','courses','lessons','simulations','notifications',
    'subscription_plans','services'
  ] loop
    execute format('select max(id) from %I', t) into mx;
    lv := pg_sequence_last_value(pg_get_serial_sequence(t, 'id')::regclass);
    if mx is not null and (lv is null or lv < mx) then
      raise exception 'FAIL: sequence de % não ressincronizada (last_value=%, max(id)=%)', t, lv, mx;
    end if;
  end loop;
  raise notice 'PASS: sequences ressincronizadas em todas as tabelas com id explícito';
end $$;

-- 10) SMOKE TEST do seed: contagens e contrato de ids do mock ----------------
do $$
declare
  checks text[][] := array[
    ['cattle_category','5'], ['breed','6'], ['purpose','5'], ['course_category','9'],
    ['users','11'], ['farms','10'], ['lots','20'], ['lot_images','60'],
    ['market_prices','5'], ['market_price_points','455'],
    ['opportunities','10'], ['radars','3'], ['radar_state','3'],
    ['match_searches','1'], ['match_results','4'],
    ['proposals','2'], ['negotiation_messages','6'], ['transactions','1'],
    ['transaction_steps','5'], ['transporters','3'], ['transports','1'],
    ['courses','10'], ['lessons','10'], ['lesson_sections','30'],
    ['lesson_key_concepts','40'], ['lesson_quiz_questions','20'], ['lesson_quiz_options','60'],
    ['simulations','3'], ['notifications','10'], ['favorites','5'], ['follows','2'],
    ['subscription_plans','3'], ['subscriptions','1'], ['lot_boosts','1'],
    ['services','6'], ['platform_settings','1']
  ];
  i int; t text; expected bigint; got bigint;
begin
  for i in 1 .. array_length(checks, 1) loop
    t := checks[i][1];
    expected := checks[i][2]::bigint;
    execute format('select count(*) from %I', t) into got;
    if got <> expected then
      raise exception 'FAIL: % tem % linhas (esperado %)', t, got, expected;
    end if;
  end loop;

  -- contrato de ids do mock (frontend usa id numérico 1..N)
  if (select min(id) from farms) <> 1 or (select max(id) from farms) <> 10 then
    raise exception 'FAIL: farms.id não cobre 1..10';
  end if;
  if (select min(id) from lots) <> 1 or (select max(id) from lots) <> 20 then
    raise exception 'FAIL: lots.id não cobre 1..20';
  end if;
  if (select min(id) from opportunities) <> 1 or (select max(id) from opportunities) <> 10 then
    raise exception 'FAIL: opportunities.id não cobre 1..10';
  end if;

  raise notice 'PASS: smoke test do seed OK (contagens + contrato de ids 1..N)';
end $$;

-- ============================================================================
--  SEÇÃO 15 — NOVOS DOMÍNIOS (invariantes de negócio)
-- ============================================================================

-- 11) GENERATED vet_appointment.total = subtotal + travel_fee - pix_discount --
do $$
declare bad int;
begin
  select count(*) into bad from vet_appointment
   where total <> (subtotal + travel_fee - pix_discount) or total < 0;
  if bad > 0 then
    raise exception 'FAIL: % agendamento(s) com total divergente da fórmula (subtotal+travel_fee-pix_discount) ou negativo', bad;
  end if;
  raise notice 'PASS: vet_appointment.total confere com a fórmula e é >= 0 em todos os agendamentos';
end $$;

-- 12) MECANISMO do trigger de contador: group_buy_participation (delta) --------
--     Testa o MECANISMO (não o valor de mock, que diverge de propósito): insere
--     UMA adesão nova (user 2, campanha sem adesão dele) e mede o delta; ROLLBACK.
begin;
  do $$
  declare gb bigint; pc_before int; qc_before numeric; pc_after int; qc_after numeric;
  begin
    select id, participants_count, qty_current into gb, pc_before, qc_before
      from group_buy where title = 'Ração Confinamento 23%';
    insert into group_buy_participation (group_buy_id, user_id, quantity) values (gb, 2, 50);
    select participants_count, qty_current into pc_after, qc_after from group_buy where id = gb;
    if pc_after <> pc_before + 1 then
      raise exception 'FAIL: participants_count não subiu +1 (% -> %)', pc_before, pc_after;
    end if;
    if qc_after <> qc_before + 50 then
      raise exception 'FAIL: qty_current não subiu +50 (% -> %)', qc_before, qc_after;
    end if;
    raise notice 'PASS: trigger de group_buy_participation incrementa participants_count(+1) e qty_current(+quantidade)';
  end $$;
rollback;

-- 13) MECANISMO do trigger de contador: video_like -> vet_video.likes_count ----
begin;
  do $$
  declare vid bigint; lc_before int; lc_after int;
  begin
    select id, likes_count into vid, lc_before
      from vet_video where title = 'Diagnóstico de gestação por ultrassom em bovinos';
    insert into video_like (user_id, video_id) values (2, vid);
    select likes_count into lc_after from vet_video where id = vid;
    if lc_after <> lc_before + 1 then
      raise exception 'FAIL: vet_video.likes_count não subiu +1 (% -> %)', lc_before, lc_after;
    end if;
    raise notice 'PASS: trigger de video_like incrementa vet_video.likes_count (+1)';
  end $$;
rollback;

-- 14) insumo_category.product_count == contagem real de insumo_product ---------
--     (após o seed AUTORITATIVO, que fixa o contador pela contagem real).
do $$
declare bad int;
begin
  select count(*) into bad from insumo_category c
   where c.product_count <> (select count(*) from insumo_product p where p.category_id = c.id);
  if bad > 0 then
    raise exception 'FAIL: % categoria(s) de insumo com product_count divergente da contagem real', bad;
  end if;
  raise notice 'PASS: insumo_category.product_count == contagem real de insumo_product por categoria';
end $$;

-- 15) Sequences das novas tabelas em sincronia (last_value >= max(id)) ---------
--     As 26 tabelas usam identity com id AUTO (nenhum id forçado no seed); este
--     check prova que as sequences avançaram com os inserts (sem drift).
do $$
declare t text; lv bigint; mx bigint;
begin
  foreach t in array array[
    'insumo_category','insumo_product','insumo_product_tag','supplier','supplier_offer',
    'farm_stock_item','group_buy','group_buy_participation','price_alert','insumo_purchase',
    'vet','vet_specialty','vet_certification','vet_service','vet_availability_day',
    'vet_appointment','vet_review',
    'used_category','used_listing','used_saved','used_contact',
    'video_category','vet_video','video_like','video_save','vet_follow'
  ] loop
    execute format('select max(id) from %I', t) into mx;
    lv := pg_sequence_last_value(pg_get_serial_sequence(t, 'id')::regclass);
    if mx is not null and (lv is null or lv < mx) then
      raise exception 'FAIL: sequence de % não sincronizada (last_value=%, max(id)=%)', t, lv, mx;
    end if;
  end loop;
  raise notice 'PASS: sequences das 26 tabelas novas em sincronia (id auto, sem drift)';
end $$;

-- 16) SMOKE TEST dos novos domínios (contagens do DEMO) ----------------------
do $$
declare
  checks text[][] := array[
    ['insumo_category','6'], ['insumo_product','4'], ['insumo_product_tag','9'],
    ['supplier','11'], ['supplier_offer','11'],
    ['farm_stock_item','5'], ['group_buy','3'], ['group_buy_participation','1'],
    ['price_alert','3'], ['insumo_purchase','30'],
    ['vet','4'], ['vet_specialty','12'], ['vet_certification','12'],
    ['vet_service','15'], ['vet_availability_day','28'],
    ['vet_appointment','1'], ['vet_review','8'],
    ['used_category','5'], ['used_listing','5'], ['used_saved','1'], ['used_contact','1'],
    ['video_category','5'], ['vet_video','5'], ['video_like','1'], ['video_save','1'], ['vet_follow','1']
  ];
  i int; t text; expected bigint; got bigint;
begin
  for i in 1 .. array_length(checks, 1) loop
    t := checks[i][1];
    expected := checks[i][2]::bigint;
    execute format('select count(*) from %I', t) into got;
    if got <> expected then
      raise exception 'FAIL: % tem % linhas (esperado %)', t, got, expected;
    end if;
  end loop;

  -- contadores autoritativos batem com o mock (representam muitos usuários) -----
  if (select qty_current from group_buy where title = 'Vacina Febre Aftosa 100d') <> 3800
     or (select participants_count from group_buy where title = 'Vacina Febre Aftosa 100d') <> 28 then
    raise exception 'FAIL: contadores da compra coletiva de aftosa não batem com o mock (esperado 3800/28)';
  end if;
  if (select reviews_count from vet where name = 'Dr. Carlos Mendes') <> 127 then
    raise exception 'FAIL: vet Dr. Carlos reviews_count deveria ser 127 (mock), independente das reviews semeadas';
  end if;
  if (select likes_count from vet_video where title = 'Vacinação contra Febre Aftosa — passo a passo completo') <> 3840 then
    raise exception 'FAIL: vet_video likes_count deveria ser 3840 (mock), independente do like do user 1';
  end if;

  raise notice 'PASS: smoke test dos novos domínios OK (26 contagens + contadores autoritativos = mock)';
end $$;

\echo '== 04_business_invariants OK =='
