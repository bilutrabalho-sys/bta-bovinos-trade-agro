-- ============================================================================
--  022 · Manutenção de contadores denormalizados (SECURITY DEFINER).
-- ----------------------------------------------------------------------------
--  Os contadores denormalizados das novas áreas (compra coletiva, vet, vídeos,
--  usados) são incrementados por AÇÃO DE OUTRO USUÁRIO / não-dono. O modelo de
--  segurança (RLS de dono + DML de catálogo revogado de bta_app no
--  dba_hardening) BLOQUEIA essa escrita. Estas funções SECURITY DEFINER rodam
--  como o OWNER (sem RLS, com DML pleno) e são o ÚNICO caminho de escrita nos
--  contadores; a app só dispara os inserts/deletes nas tabelas-filhas.
--  `search_path = public` fixo evita sequestro de search_path (obrigatório em
--  SECURITY DEFINER).
--
--  Contadores mantidos:
--    group_buy.qty_current / participants_count   <- group_buy_participation
--    vet.reviews_count                            <- vet_review
--    vet_video.likes_count                        <- video_like
--    vet_video.saves_count                        <- video_save
--    used_listing.views / vet_video.views         <- bump_*_views (a app chama)
--
--  Idempotente: create or replace function + drop trigger if exists/create.
--  O REVOKE/GRANT de privilégio mínimo nas funções de view bump fica em
--  dba_hardening.sql (seção 7d) — aqui os roles ainda não existem.
--  Depende de: 017 (group_buy, group_buy_participation), 018 (vet, vet_review),
--  020 (vet_video, video_like, video_save), 019 (used_listing).
-- ============================================================================
begin;

-- group_buy: adesões somam quantidade e nº de participantes -------------------
create or replace function trg_group_buy_participation_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update group_buy
       set qty_current        = qty_current + new.quantity,
           participants_count = participants_count + 1
     where id = new.group_buy_id;
    return new;
  elsif tg_op = 'UPDATE' then
    update group_buy
       set qty_current = greatest(0, qty_current - old.quantity + new.quantity)
     where id = new.group_buy_id;
    return new;
  else -- DELETE
    update group_buy
       set qty_current        = greatest(0, qty_current - old.quantity),
           participants_count = greatest(0, participants_count - 1)
     where id = old.group_buy_id;
    return old;
  end if;
end;
$$;
comment on function trg_group_buy_participation_counts() is
  'SECURITY DEFINER: mantém group_buy.qty_current/participants_count a partir de group_buy_participation (a app não tem DML no catálogo group_buy).';

drop trigger if exists trg_gbp_counts on group_buy_participation;
create trigger trg_gbp_counts
  after insert or update or delete on group_buy_participation
  for each row execute function trg_group_buy_participation_counts();

-- vet.reviews_count a partir de vet_review -----------------------------------
create or replace function trg_vet_reviews_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update vet set reviews_count = reviews_count + 1 where id = new.vet_id;
    return new;
  else -- DELETE
    update vet set reviews_count = greatest(0, reviews_count - 1) where id = old.vet_id;
    return old;
  end if;
end;
$$;
comment on function trg_vet_reviews_count() is
  'SECURITY DEFINER: mantém vet.reviews_count a partir de vet_review (o autor não é o dono do vet; a RLS de escrita de vet negaria o UPDATE).';

drop trigger if exists trg_vet_review_count on vet_review;
create trigger trg_vet_review_count
  after insert or delete on vet_review
  for each row execute function trg_vet_reviews_count();

-- vet_video.likes_count / saves_count ----------------------------------------
create or replace function trg_video_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update vet_video set likes_count = likes_count + 1 where id = new.video_id;
    return new;
  else
    update vet_video set likes_count = greatest(0, likes_count - 1) where id = old.video_id;
    return old;
  end if;
end;
$$;
comment on function trg_video_like_count() is
  'SECURITY DEFINER: mantém vet_video.likes_count a partir de video_like (vet_video é catálogo; app sem DML).';

drop trigger if exists trg_video_like_count_t on video_like;
create trigger trg_video_like_count_t
  after insert or delete on video_like
  for each row execute function trg_video_like_count();

create or replace function trg_video_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update vet_video set saves_count = saves_count + 1 where id = new.video_id;
    return new;
  else
    update vet_video set saves_count = greatest(0, saves_count - 1) where id = old.video_id;
    return old;
  end if;
end;
$$;
comment on function trg_video_save_count() is
  'SECURITY DEFINER: mantém vet_video.saves_count a partir de video_save.';

drop trigger if exists trg_video_save_count_t on video_save;
create trigger trg_video_save_count_t
  after insert or delete on video_save
  for each row execute function trg_video_save_count();

-- VIEW BUMP: contagem de visualizações (a app chama; não há tabela-filha) -----
create or replace function bump_used_listing_views(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update used_listing set views = views + 1 where id = p_id and deleted_at is null;
$$;
comment on function bump_used_listing_views(bigint) is
  'SECURITY DEFINER: incrementa used_listing.views (+1) de um anúncio vivo. Único caminho da app para contar visualização.';

create or replace function bump_vet_video_views(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update vet_video set views = views + 1 where id = p_id and deleted_at is null;
$$;
comment on function bump_vet_video_views(bigint) is
  'SECURITY DEFINER: incrementa vet_video.views (+1) de um vídeo vivo. Único caminho da app (vet_video é catálogo, sem DML p/ bta_app).';

commit;
