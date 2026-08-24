-- ============================================================================
--  003 · DOWN — dropa as tabelas de referência (ordem inversa).
--  CASCADE por segurança; as tabelas que as referenciam já caíram nos
--  downs posteriores (005, 007, 009).
-- ============================================================================
begin;

drop table if exists course_category cascade;
drop table if exists purpose         cascade;
drop table if exists breed           cascade;
drop table if exists cattle_category cascade;

commit;
