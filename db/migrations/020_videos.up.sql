-- ============================================================================
--  020 · Área 4 — VÍDEOS (seção 15.f do schema).
-- ----------------------------------------------------------------------------
--  Tabelas video_category, vet_video, video_like, video_save, vet_follow.
--  Sem enums novos. Os índices únicos de negócio (unique user_id/video_id de
--  video_like/video_save; unique user_id/vet_id de vet_follow) ficam junto das
--  tabelas; os ix_* de performance moram na 021. Trigger de updated_at de
--  vet_video ao final.
--  Depende de: 001 (set_updated_at), 004 (users), 018 (vet — vet_video.vet_id
--  e vet_follow.vet_id referenciam vet).
--  CHECKs nomeados chk_<tabela>_<regra>.
-- ============================================================================
begin;

-- video_category (referência; dimensão extensível por admin) -----------------
create table if not exists video_category (
  id         bigint generated always as identity primary key,
  slug       text   not null unique,
  label      text   not null,
  icon       text,
  created_at timestamptz not null default now()
);
comment on table video_category is 'Categoria de vídeo (referência). slug = id estável do front; leitura pública, admin escreve.';

-- vet_video (catálogo de vídeos, admin; autor opcional em vet) ---------------
create table if not exists vet_video (
  id                bigint generated always as identity primary key,
  public_id         uuid   not null default gen_random_uuid() unique,  -- deep-link
  category_id       bigint not null references video_category(id) on update cascade on delete restrict,
  vet_id            bigint references vet(id)                     on update cascade on delete set null,  -- autor se existir no catálogo de vets
  author_name       text,                            -- ex.: 'Dr. Fernando Melo'
  author_credential text,                            -- ex.: CRMV
  title             text   not null,
  description       text,
  thumb_url         text,
  video_url         text,
  duration_label    text,                            -- ex.: '14:32'
  duration_seconds  integer constraint chk_vet_video_duration check (duration_seconds is null or duration_seconds >= 0),
  views             integer not null default 0 constraint chk_vet_video_views check (views >= 0),
  likes_count       integer not null default 0 constraint chk_vet_video_likes check (likes_count >= 0),
  saves_count       integer not null default 0 constraint chk_vet_video_saves check (saves_count >= 0),
  featured          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
comment on table  vet_video is 'Vídeo educativo do catálogo (admin). Leitura pública. vet_id liga ao autor no catálogo de vets (SET NULL se o vet sair).';
comment on column vet_video.views is 'DERIVADO/denormalizado (views/likes_count/saves_count): stats mantidos pela aplicação.';

-- video_like (DADO PRIVADO DO USUÁRIO) --------------------------------------
create table if not exists video_like (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)     on update cascade on delete cascade,
  video_id   bigint not null references vet_video(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);
comment on table video_like is 'Like do usuário em um vídeo (dado privado). 1 por (usuário, vídeo). Hard delete.';

-- video_save (DADO PRIVADO DO USUÁRIO) --------------------------------------
create table if not exists video_save (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)     on update cascade on delete cascade,
  video_id   bigint not null references vet_video(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);
comment on table video_save is 'Vídeo salvo pelo usuário (dado privado). 1 por (usuário, vídeo). Hard delete.';

-- vet_follow (seguir vet — DADO PRIVADO DO USUÁRIO) -------------------------
create table if not exists vet_follow (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on update cascade on delete cascade,
  vet_id     bigint not null references vet(id)   on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vet_id)
);
comment on table vet_follow is 'Usuário segue um vet (dado privado). 1 por (usuário, vet). Hard delete (padrão follows).';

-- Trigger de updated_at (tabela mutável desta área) --------------------------
drop trigger if exists trg_vet_video_updated_at       on vet_video;
create trigger trg_vet_video_updated_at       before update on vet_video       for each row execute function set_updated_at();

commit;
