-- ============================================================================
--  008 · DOWN — dropa fluxo de negociação (ordem inversa).
-- ============================================================================
begin;

drop table if exists transports          cascade;
drop table if exists transporters        cascade;
drop table if exists transaction_steps   cascade;
drop table if exists transactions        cascade;
drop table if exists negotiation_messages cascade;
drop table if exists proposals           cascade;

commit;
