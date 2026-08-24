-- ============================================================================
--  004 · Identidade (seção 4): users, user_preference.
--  Depende de: 001 (citext, pgcrypto), 002 (user_role).
-- ============================================================================
begin;

-- users ----------------------------------------------------------------------
create table if not exists users (
  id                 bigint generated always as identity primary key,
  public_id          uuid   not null default gen_random_uuid() unique,  -- id público opaco (deep-links, etc.)
  name               text   not null,
  role               user_role not null default 'visitante',
  email              citext unique,                    -- case-insensitive; múltiplos NULL permitidos
  phone              text   unique,                    -- telefone de contato; único (múltiplos NULL permitidos)
  location           text,                             -- cidade (ex.: 'São José do Rio Preto')
  state              text   check (state is null or char_length(state) = 2),  -- UF
  level              text   not null default 'Iniciante',  -- gamificação (ex.: 'Iniciante')
  xp                 integer not null default 0 check (xp >= 0),
  negotiations_count integer not null default 0 check (negotiations_count >= 0),
  external_auth_id   text,                             -- id no provedor externo de auth (ex.: Firebase UID / Auth0 sub). Único quando preenchido (ux_users_external_auth_id em 013).
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
comment on table  users is 'Usuário da plataforma. Um user PODE possuir uma farm (role vendedor/empreendedor).';
comment on column users.external_auth_id is 'Vínculo OFICIAL de auth: usuário autenticado por provedor externo (Firebase/Auth0). Nullable (visitante), ÚNICO quando preenchido (índice parcial ux_users_external_auth_id).';
comment on column users.level is 'Nível de gamificação exibido no perfil (não confundir com role).';

-- user_preference ------------------------------------------------------------
create table if not exists user_preference (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on update cascade on delete cascade,
  tag        text   not null,
  created_at timestamptz not null default now(),
  unique (user_id, tag)
);
comment on table user_preference is 'Tags de preferência exibidas no perfil (string livre). 1:N com users.';

-- Nota: sem tabela de OTP. A autenticação reside em provedor externo
-- (Firebase/Auth0); o vínculo é users.external_auth_id (único quando preenchido,
-- ver índice ux_users_external_auth_id na migration 013).

commit;
