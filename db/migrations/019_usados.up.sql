-- ============================================================================
--  019 · Área 3 — USADOS (seção 15.e do schema).
-- ----------------------------------------------------------------------------
--  Enum used_condition; tabelas used_category, used_listing, used_saved,
--  used_contact. O índice único de negócio (unique user_id/listing_id de
--  used_saved) fica junto da tabela; os ix_* de performance moram na 021.
--  Trigger de updated_at de used_listing ao final.
--  Depende de: 001 (set_updated_at), 004 (users).
--  Enum idempotente (DO ... EXCEPTION duplicate_object). CHECKs nomeados.
-- ============================================================================
begin;

-- Enum -----------------------------------------------------------------------
do $$ begin create type used_condition       as enum ('otimo', 'bom', 'regular'); exception when duplicate_object then null; end $$;

-- used_category (referência; dimensão extensível por admin) -------------------
create table if not exists used_category (
  id         bigint generated always as identity primary key,
  slug       text   not null unique,
  label      text   not null,
  icon       text,
  created_at timestamptz not null default now()
);
comment on table used_category is 'Categoria de anúncio de usado (referência). slug = id estável do front; leitura pública, admin escreve.';

-- used_listing (anúncio de usado — CONTEÚDO DO DONO; leitura pública) --------
create table if not exists used_listing (
  id             bigint generated always as identity primary key,
  public_id      uuid   not null default gen_random_uuid() unique,  -- deep-link
  seller_user_id bigint references users(id)              on update cascade on delete set null,  -- dono; anúncio sobrevive ao user (e p/ seed)
  category_id    bigint not null references used_category(id) on update cascade on delete restrict,
  title          text   not null,
  price          numeric(14,2) not null constraint chk_used_listing_price check (price >= 0),
  condition      used_condition,
  city           text,
  uf             text   constraint chk_used_listing_uf check (uf is null or char_length(uf) = 2),
  distance       numeric(7,2),                    -- referência [GEO]
  photo_url      text,
  description    text,
  views          integer not null default 0 constraint chk_used_listing_views check (views >= 0),
  seller_name    text,                            -- nome livre (mock) quando sem user vinculado
  seller_rating  numeric(3,2) constraint chk_used_listing_seller_rating check (seller_rating between 0 and 5),
  featured       boolean not null default false,  -- destaque
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
comment on table  used_listing is 'Anúncio de equipamento/insumo usado (conteúdo do dono). Leitura pública dos vivos; escrita do dono (RLS pelo DBA). seller_user_id nullable p/ seed e p/ sobreviver à exclusão do dono.';
comment on column used_listing.views is 'DERIVADO/denormalizado: nº de visualizações. Mantido pela aplicação.';

-- used_saved (salvos — DADO PRIVADO DO USUÁRIO) -----------------------------
create table if not exists used_saved (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)        on update cascade on delete cascade,
  listing_id bigint not null references used_listing(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
comment on table used_saved is 'Anúncio de usado salvo pelo usuário (dado privado). 1 por (usuário, anúncio). Hard delete.';

-- used_contact (contato registrado — DADO PRIVADO DO USUÁRIO) ---------------
create table if not exists used_contact (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)        on update cascade on delete cascade,
  listing_id bigint not null references used_listing(id) on update cascade on delete cascade,
  message    text,
  created_at timestamptz not null default now()
);
comment on table used_contact is 'Contato do usuário com o anunciante (dado privado). Pode repetir (sem unique). Hard delete.';

-- Trigger de updated_at (tabela mutável desta área) --------------------------
drop trigger if exists trg_used_listing_updated_at    on used_listing;
create trigger trg_used_listing_updated_at    before update on used_listing    for each row execute function set_updated_at();

commit;
