-- ============================================================================
--  016 · Senha própria (login e-mail + senha + JWT).
-- ----------------------------------------------------------------------------
--  Adiciona users.password_hash (hash bcrypt). NULLABLE de propósito:
--    * usuários de SEED e futuros usuários de provedor externo (external_auth_id)
--      NÃO têm senha local — password_hash fica NULL e o login por senha nega.
--  A coluna NUNCA é exposta pela API (serializeUser a remove) e a app role
--  (bta_app) tem o SELECT dela REVOGADO em dba_hardening.sql (defense-in-depth).
--  Depende de: 004 (users).
-- ============================================================================
begin;

alter table users
  add column if not exists password_hash text;

comment on column users.password_hash is
  'Hash bcrypt da senha (login próprio e-mail+senha). NULLABLE: seed/usuários externos não têm senha. Nunca retornado pela API; SELECT revogado de bta_app.';

commit;
