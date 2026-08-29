-- ============================================================================
--  019 · DOWN — dropa a área USADOS (ordem inversa do up).
--  Trigger primeiro; depois as tabelas em ordem inversa (used_contact/used_saved
--  antes de used_listing, que vem antes de used_category — respeitando FKs); por
--  fim o enum used_condition (só depois das tabelas que o usam). Cascade como rede.
-- ============================================================================
begin;

-- Trigger --------------------------------------------------------------------
drop trigger if exists trg_used_listing_updated_at    on used_listing;

-- Tabelas (ordem inversa) ----------------------------------------------------
drop table if exists used_contact  cascade;
drop table if exists used_saved    cascade;
drop table if exists used_listing  cascade;
drop table if exists used_category cascade;

-- Enum (depois das tabelas que o usam) ---------------------------------------
drop type if exists used_condition;

commit;
