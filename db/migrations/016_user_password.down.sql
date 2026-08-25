-- ============================================================================
--  016 · DOWN — remove users.password_hash.
--  (Reverte 016_user_password.up.sql.)
-- ============================================================================
begin;

alter table users
  drop column if exists password_hash;

commit;
