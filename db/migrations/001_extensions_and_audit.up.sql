-- ============================================================================
--  001 · Extensões + função de auditoria set_updated_at()
--  Fonte: db/schema/schema.sql seções 0 e 1.
-- ============================================================================
begin;

-- 0. EXTENSÕES ---------------------------------------------------------------
create extension if not exists citext;     -- e-mails case-insensitive
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- 1. AUDITORIA — função de trigger de updated_at -----------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Trigger BEFORE UPDATE: mantém updated_at = now() em toda tabela mutável.';

commit;
