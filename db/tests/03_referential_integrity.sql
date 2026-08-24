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

\echo '== 03_referential_integrity OK =='
