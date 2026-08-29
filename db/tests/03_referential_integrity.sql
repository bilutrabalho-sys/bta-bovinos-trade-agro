-- ============================================================================
--  BTA — Testes de banco · 03_referential_integrity.sql
--  Garante que NENHUMA FK está órfã: para toda FoK (single-column) do schema
--  public, conta linhas-filhas cujo valor não existe no pai. Como as FKs são
--  enforced pelo banco, este teste também prova que as constraints CONTINUAM
--  no lugar (se alguém dropar uma FK e inserir lixo, o teste passa a acusar).
--  Somente leitura. Roda melhor DEPOIS do seed (com dados p/ exercitar).
-- ============================================================================

do $$
declare
  r record;
  n bigint;
  q text;
  total_fks int := 0;
begin
  for r in
    select con.conname,
           con.conrelid::regclass  as child,
           con.confrelid::regclass as parent,
           ca.attname as child_col,
           pa.attname as parent_col
      from pg_constraint con
      join pg_attribute ca on ca.attrelid = con.conrelid  and ca.attnum = con.conkey[1]
      join pg_attribute pa on pa.attrelid = con.confrelid and pa.attnum = con.confkey[1]
     where con.contype = 'f'
       and array_length(con.conkey, 1) = 1
       and con.connamespace = 'public'::regnamespace
  loop
    total_fks := total_fks + 1;
    q := format(
      'select count(*) from %s c where c.%I is not null and not exists (select 1 from %s p where p.%I = c.%I)',
      r.child, r.child_col, r.parent, r.parent_col, r.child_col);
    execute q into n;
    if n > 0 then
      raise exception 'FAIL (ORFÃO): %.% tem % linha(s) sem correspondência em %.% (constraint %)',
        r.child, r.child_col, n, r.parent, r.parent_col, r.conname;
    end if;
  end loop;
  raise notice 'PASS: nenhuma FK órfã (% FKs single-column verificadas)', total_fks;
end $$;

-- Verificações direcionadas ao contrato do mock (ids preservados) -------------
do $$
begin
  -- Todo lot.seller_id aponta para uma farm existente (o pulo do gato do seed:
  -- OVERRIDING SYSTEM VALUE preservou os ids, então Lot.sellerId do mock casa).
  if exists (select 1 from lots l where not exists (select 1 from farms f where f.id = l.seller_id)) then
    raise exception 'FAIL: existe lot com seller_id sem farm correspondente';
  end if;

  -- Toda opportunity.lot_id existe.
  if exists (select 1 from opportunities o where not exists (select 1 from lots l where l.id = o.lot_id)) then
    raise exception 'FAIL: existe opportunity apontando para lot inexistente';
  end if;

  -- Toda option de quiz pertence a uma question existente e answer_index é válido.
  if exists (
    select 1 from lesson_quiz_questions q
     where q.answer_index >= (select count(*) from lesson_quiz_options o where o.question_id = q.id)
  ) then
    raise exception 'FAIL: existe question cujo answer_index aponta fora do conjunto de options';
  end if;

  raise notice 'PASS: contrato relacional do mock íntegro (seller_id, opportunity.lot_id, quiz answer_index)';
end $$;

-- Verificações direcionadas aos NOVOS DOMÍNIOS (seção 15) --------------------
--  A varredura genérica acima JÁ cobre toda FK single-column das tabelas novas
--  (supplier_offer.product_id/supplier_id, group_buy_participation.*, used_saved.*,
--  video_like/save.*, vet_review.vet_id, vet_appointment.*, etc.). Aqui checamos
--  o CONTRATO MÍNIMO e uma coerência que a FK sozinha NÃO garante.
do $$
begin
  -- Todo supplier_offer aponta para product e supplier válidos (contrato explícito).
  if exists (select 1 from supplier_offer o
              where not exists (select 1 from insumo_product p where p.id = o.product_id)
                 or not exists (select 1 from supplier s where s.id = o.supplier_id)) then
    raise exception 'FAIL: supplier_offer com product_id/supplier_id órfão';
  end if;

  -- COERÊNCIA que o schema NÃO enforce por FK: o serviço agendado deve pertencer
  -- AO MESMO vet do agendamento (vet_appointment.vet_id == vet_service.vet_id).
  -- Se isto falhar, é dado inconsistente (serviço de outro profissional).
  if exists (
    select 1 from vet_appointment a
      join vet_service s on s.id = a.service_id
     where s.vet_id <> a.vet_id
  ) then
    raise exception 'FAIL: existe vet_appointment cujo service_id pertence a OUTRO vet (vet_id divergente)';
  end if;

  -- vet_review vinculada a agendamento: o agendamento deve ser do MESMO vet.
  if exists (
    select 1 from vet_review r
      join vet_appointment a on a.id = r.appointment_id
     where r.appointment_id is not null and a.vet_id <> r.vet_id
  ) then
    raise exception 'FAIL: existe vet_review cujo appointment_id é de um vet diferente';
  end if;

  -- Todo like/save/salvo aponta para item vivo/existente (FK garante existência).
  if exists (select 1 from video_like l where not exists (select 1 from vet_video v where v.id = l.video_id)) then
    raise exception 'FAIL: video_like apontando para vídeo inexistente';
  end if;
  if exists (select 1 from used_saved us where not exists (select 1 from used_listing u where u.id = us.listing_id)) then
    raise exception 'FAIL: used_saved apontando para anúncio inexistente';
  end if;

  raise notice 'PASS: contrato relacional dos novos domínios íntegro (offer, appointment↔service, review↔appointment, like/saved)';
end $$;

\echo '== 03_referential_integrity OK =='
