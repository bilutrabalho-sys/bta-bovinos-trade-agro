-- ============================================================================
--  004 · DOWN — dropa identidade (ordem inversa).
--  CASCADE: tabelas que referenciam users (farms, lots, radars, ...) já caíram
--  nos downs posteriores (005–012).
-- ============================================================================
begin;

drop table if exists user_preference cascade;
drop table if exists users           cascade;

commit;
