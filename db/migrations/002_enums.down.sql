-- ============================================================================
--  002 · DOWN — dropa os 15 tipos ENUM (ordem inversa).
--  Seguro: quando este down roda, todas as tabelas que usam estes tipos
--  (migrations 003–012) já foram derrubadas pelos downs posteriores.
-- ============================================================================
begin;

drop type if exists message_sender;
drop type if exists boost_tier;
drop type if exists course_level;
drop type if exists scenario;
drop type if exists service_status;
drop type if exists subscription_status;
drop type if exists subscription_plan;
drop type if exists user_role;
drop type if exists notification_type;
drop type if exists transport_status;
drop type if exists transaction_status;
drop type if exists proposal_status;
drop type if exists lot_status;
drop type if exists lot_sex;
drop type if exists price_unit;

commit;
