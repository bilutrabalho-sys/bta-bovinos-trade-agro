-- ============================================================================
--  011 · DOWN — dropa engajamento (ordem inversa).
--  Índices parciais de favorites caem junto da tabela; dropados
--  explicitamente antes por fidelidade ao up.
-- ============================================================================
begin;

drop table if exists follows cascade;

drop index if exists ux_favorites_user_lesson;
drop index if exists ux_favorites_user_simulation;
drop index if exists ux_favorites_user_opportunity;
drop index if exists ux_favorites_user_farm;
drop index if exists ux_favorites_user_lot;
drop table if exists favorites cascade;

drop table if exists notifications cascade;

commit;
