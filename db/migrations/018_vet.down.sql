-- ============================================================================
--  018 · DOWN — dropa a área VET / VetConnect (ordem inversa do up).
--  Triggers primeiro; depois o índice único ux_vet_review_appointment; então as
--  tabelas em ordem inversa de criação (vet_review antes de vet_appointment,
--  que vem antes de vet_service/vet — respeitando as FKs RESTRICT); por fim os
--  6 enums (só depois das tabelas que os usam). Drops idempotentes com cascade.
-- ============================================================================
begin;

-- Triggers (ordem inversa) ---------------------------------------------------
drop trigger if exists trg_vet_appointment_updated_at on vet_appointment;
drop trigger if exists trg_vet_service_updated_at     on vet_service;
drop trigger if exists trg_vet_updated_at             on vet;

-- Índice único de negócio (cai junto de vet_review; explícito por fidelidade) -
drop index if exists ux_vet_review_appointment;

-- Tabelas (ordem inversa) ----------------------------------------------------
drop table if exists vet_review           cascade;
drop table if exists vet_appointment      cascade;
drop table if exists vet_availability_day cascade;
drop table if exists vet_service          cascade;
drop table if exists vet_certification    cascade;
drop table if exists vet_specialty        cascade;
drop table if exists vet                  cascade;

-- Enums (depois das tabelas que os usam) -------------------------------------
drop type if exists appointment_status;
drop type if exists payment_method;
drop type if exists appointment_location;
drop type if exists agenda_status;
drop type if exists vet_availability;
drop type if exists vet_kind;

commit;
