-- ============================================================================
--  007 · DOWN — dropa descoberta (ordem inversa).
-- ============================================================================
begin;

drop table if exists match_results  cascade;
drop table if exists match_searches cascade;
drop table if exists radar_state    cascade;
drop table if exists radars         cascade;
drop table if exists opportunities  cascade;

commit;
