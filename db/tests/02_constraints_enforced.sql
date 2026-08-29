-- ============================================================================
--  BTA — Testes de banco · 02_constraints_enforced.sql
--  Testes NEGATIVOS: cada INSERT inválido DEVE ser rejeitado. Se o banco aceitar
--  um dado que deveria barrar, o teste FALHA. Prova que as constraints existem
--  e funcionam (não só que estão no catálogo).
--
--  Depende do SEED (referencia category 'Boi Gordo'/'Nelore', farm 1, lot 1,
--  user 1, favorito (user1,lot1)). Roda: migrations -> hardening -> seed -> este.
--
--  Todo o arquivo roda dentro de UMA transação que termina em ROLLBACK: mesmo
--  que algum insert "ruim" passasse, nada persiste. Rode com ON_ERROR_STOP=1.
-- ============================================================================
begin;
set local client_min_messages = notice;

-- 1) CHECK: lots.price >= 0 ---------------------------------------------------
do $$
begin
  begin
    insert into lots (title, category_id, breed_id, quantity, weight, price, price_unit, seller_id)
    values ('t-negativo',
            (select id from cattle_category where name = 'Boi Gordo'),
            (select id from breed where name = 'Nelore'),
            1, 100, -1, '/@', 1);
    raise exception 'FAIL: aceitou lots.price negativo (CHECK price >= 0 ausente/inativa)';
  exception when check_violation then
    raise notice 'PASS: lots.price < 0 rejeitado (CHECK)';
  end;
end $$;

-- 2) GENERATED: não pode inserir em lots.price_total --------------------------
do $$
begin
  begin
    insert into lots (title, category_id, breed_id, quantity, weight, price, price_unit, seller_id, price_total)
    values ('t-generated',
            (select id from cattle_category where name = 'Boi Gordo'),
            (select id from breed where name = 'Nelore'),
            1, 100, 10, '/@', 1, 999);
    raise exception 'FAIL: aceitou INSERT em coluna GENERATED lots.price_total';
  exception when others then
    if sqlstate = '428C9' then
      raise notice 'PASS: INSERT em lots.price_total (GENERATED ALWAYS) rejeitado';
    else raise; end if;
  end;
end $$;

-- 3) CHECK exclusive arc: favorites com DOIS alvos ----------------------------
do $$
begin
  begin
    insert into favorites (user_id, lot_id, farm_id) values (1, 2, 5);  -- 2 alvos
    raise exception 'FAIL: aceitou favorite com 2 alvos (chk_favorites_one_target)';
  exception when check_violation then
    raise notice 'PASS: favorite com 2 alvos rejeitado (exclusive arc)';
  end;
end $$;

-- 4) CHECK exclusive arc: favorites SEM alvo ----------------------------------
do $$
begin
  begin
    insert into favorites (user_id) values (1);  -- 0 alvos
    raise exception 'FAIL: aceitou favorite sem alvo (chk_favorites_one_target)';
  exception when check_violation then
    raise notice 'PASS: favorite sem alvo rejeitado (exclusive arc)';
  end;
end $$;

-- 5) CHECK: transação '/@' exige weight_snapshot ------------------------------
do $$
begin
  begin
    insert into transactions (lot_id, buyer_user_id, seller_farm_id, quantity, agreed_price, price_unit, total_value)
    values (1, 1, 1, 1, 300, '/@', 1000);  -- weight_snapshot omitido
    raise exception 'FAIL: aceitou transação /@ sem weight_snapshot (chk_tx_weight_snapshot_for_arroba)';
  exception when check_violation then
    raise notice 'PASS: transação /@ sem weight_snapshot rejeitada';
  end;
end $$;

-- 5b) Contraprova: transação '/cab' SEM weight_snapshot é PERMITIDA -----------
do $$
begin
  insert into transactions (lot_id, buyer_user_id, seller_farm_id, quantity, agreed_price, price_unit, total_value)
  values (3, 1, 4, 1, 2400, '/cab', 2400);  -- '/cab' dispensa weight_snapshot
  raise notice 'PASS: transação /cab sem weight_snapshot aceita (constraint só exige em /@)';
end $$;

-- 6) UNIQUE parcial: no máx. 1 capa por lote (ux_lot_images_one_cover) --------
do $$
begin
  begin
    insert into lot_images (lot_id, url, position, is_cover) values (1, 'http://x/extra', 99, true);
    raise exception 'FAIL: aceitou 2ª capa no lote 1 (ux_lot_images_one_cover)';
  exception when unique_violation then
    raise notice 'PASS: 2ª capa no mesmo lote rejeitada';
  end;
end $$;

-- 7) UNIQUE parcial: favorito duplicado (user1, lot1) já existe no seed -------
do $$
begin
  begin
    insert into favorites (user_id, lot_id) values (1, 1);
    raise exception 'FAIL: aceitou favorito duplicado (ux_favorites_user_lot)';
  exception when unique_violation then
    raise notice 'PASS: favorito duplicado (user,lot) rejeitado';
  end;
end $$;

-- 8) FK: lot com breed_id inexistente -----------------------------------------
do $$
begin
  begin
    insert into lots (title, category_id, breed_id, quantity, weight, price, price_unit, seller_id)
    values ('t-fk',
            (select id from cattle_category where name = 'Boi Gordo'),
            999999, 1, 100, 10, '/@', 1);
    raise exception 'FAIL: aceitou lot com breed_id inexistente (FK ausente)';
  exception when foreign_key_violation then
    raise notice 'PASS: lot com breed_id inexistente rejeitado (FK)';
  end;
end $$;

-- 9) CHECK: users.state deve ter 2 caracteres ---------------------------------
do $$
begin
  begin
    insert into users (name, state) values ('Teste UF', 'ABC');
    raise exception 'FAIL: aceitou users.state com 3 chars (CHECK char_length=2)';
  exception when check_violation then
    raise notice 'PASS: users.state fora de 2 chars rejeitado';
  end;
end $$;

-- 10) CHECK: match_results.compatibility entre 0 e 100 ------------------------
do $$
begin
  begin
    insert into match_results (match_search_id, lot_id, compatibility) values (1, 5, 150);
    raise exception 'FAIL: aceitou compatibility=150 (CHECK 0..100)';
  exception when check_violation then
    raise notice 'PASS: compatibility fora de 0..100 rejeitada';
  end;
end $$;

-- ============================================================================
--  SEÇÃO 15 — NOVOS DOMÍNIOS: inserts inválidos que DEVEM falhar
--  (usam dados do seed: vet 'Dr. Carlos Mendes', video/campanha por título, etc.)
-- ============================================================================

-- 11) CHECK: supplier_offer.preco negativo ------------------------------------
--     usa um par (produto, fornecedor) SEM oferta no seed p/ isolar o CHECK
--     (evita que o UNIQUE dispare antes).
do $$
begin
  begin
    insert into supplier_offer (product_id, supplier_id, preco)
    values ((select id from insumo_product where name = 'Sal Mineral Bovinos Corte (30kg)'),
            (select id from supplier where name = 'Zoetis Distribuidora'),
            -1);
    raise exception 'FAIL: aceitou supplier_offer.preco negativo (chk_supplier_offer_preco)';
  exception when check_violation then
    raise notice 'PASS: supplier_offer.preco < 0 rejeitado (CHECK)';
  end;
end $$;

-- 12) CHECK: vet.rating > 5 ---------------------------------------------------
do $$
begin
  begin
    insert into vet (name, kind, rating) values ('Vet Rating Inválido', 'vet', 5.5);
    raise exception 'FAIL: aceitou vet.rating > 5 (chk_vet_rating)';
  exception when check_violation then
    raise notice 'PASS: vet.rating fora de 0..5 rejeitado (CHECK)';
  end;
end $$;

-- 13) CHECK: vet_review.rating = 0 (deve ser 1..5) ----------------------------
do $$
begin
  begin
    insert into vet_review (vet_id, rating)
    values ((select id from vet where name = 'Dr. Carlos Mendes'), 0);
    raise exception 'FAIL: aceitou vet_review.rating = 0 (chk_vet_review_rating)';
  exception when check_violation then
    raise notice 'PASS: vet_review.rating fora de 1..5 rejeitado (CHECK)';
  end;
end $$;

-- 14) GENERATED: não pode inserir em vet_appointment.total --------------------
do $$
begin
  begin
    insert into vet_appointment (user_id, vet_id, service_id, scheduled_at, location, payment_method, subtotal, total)
    select 1, vt.id, vs.id, now(), 'clinica', 'pix', 100, 999
    from vet vt join vet_service vs on vs.vet_id = vt.id and vs.position = 0
    where vt.name = 'Dr. Carlos Mendes';
    raise exception 'FAIL: aceitou INSERT em coluna GENERATED vet_appointment.total';
  exception when others then
    if sqlstate = '428C9' then
      raise notice 'PASS: INSERT em vet_appointment.total (GENERATED ALWAYS) rejeitado';
    else raise; end if;
  end;
end $$;

-- 15) CHECK: vet_appointment com pix_discount > subtotal+travel_fee -----------
--     (chk_vet_appointment_total_nonneg): total ficaria negativo.
do $$
begin
  begin
    insert into vet_appointment (user_id, vet_id, service_id, scheduled_at, location, payment_method, subtotal, travel_fee, pix_discount)
    select 1, vt.id, vs.id, now(), 'fazenda', 'pix', 100, 0, 200
    from vet vt join vet_service vs on vs.vet_id = vt.id and vs.position = 0
    where vt.name = 'Dr. Carlos Mendes';
    raise exception 'FAIL: aceitou pix_discount > subtotal+travel_fee (chk_vet_appointment_total_nonneg)';
  exception when check_violation then
    raise notice 'PASS: desconto pix que zeraria/negativaria o total rejeitado (CHECK)';
  end;
end $$;

-- 16) UNIQUE: video_like duplicado (user1, vídeo v1 já curtido no seed) --------
do $$
begin
  begin
    insert into video_like (user_id, video_id)
    select 1, id from vet_video where title = 'Vacinação contra Febre Aftosa — passo a passo completo';
    raise exception 'FAIL: aceitou video_like duplicado (unique user_id, video_id)';
  exception when unique_violation then
    raise notice 'PASS: video_like duplicado (user,video) rejeitado';
  end;
end $$;

-- 17) UNIQUE: group_buy_participation duplicada (user1 já aderiu à aftosa) -----
do $$
begin
  begin
    insert into group_buy_participation (group_buy_id, user_id, quantity)
    select id, 1, 10 from group_buy where title = 'Vacina Febre Aftosa 100d';
    raise exception 'FAIL: aceitou participação duplicada (unique group_buy_id, user_id)';
  exception when unique_violation then
    raise notice 'PASS: group_buy_participation duplicada (campanha,user) rejeitada';
  end;
end $$;

-- 18) FK: vet_appointment com vet_id inexistente ------------------------------
do $$
begin
  begin
    insert into vet_appointment (user_id, vet_id, service_id, scheduled_at, location, payment_method, subtotal)
    select 1, 999999, vs.id, now(), 'clinica', 'pix', 100
    from vet vt join vet_service vs on vs.vet_id = vt.id and vs.position = 0
    where vt.name = 'Dr. Carlos Mendes';
    raise exception 'FAIL: aceitou vet_appointment com vet_id inexistente (FK)';
  exception when foreign_key_violation then
    raise notice 'PASS: vet_appointment com vet_id inexistente rejeitado (FK)';
  end;
end $$;

rollback;
\echo '== 02_constraints_enforced OK (transação revertida, nada persistido) =='
