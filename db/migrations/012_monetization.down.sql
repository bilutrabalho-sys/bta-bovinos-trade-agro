-- ============================================================================
--  012 · DOWN — dropa monetização (ordem inversa).
-- ============================================================================
begin;

drop table if exists platform_settings  cascade;
drop table if exists services           cascade;
drop table if exists lot_boosts         cascade;
drop table if exists subscriptions      cascade;
drop table if exists subscription_plans cascade;

commit;
