-- ============================================================================
--  002 · Tipos ENUM (seção 2 do schema).
-- ----------------------------------------------------------------------------
--  CREATE TYPE não suporta IF NOT EXISTS. Para reexecução segura (idempotência)
--  cada tipo é envolto em DO ... EXCEPTION WHEN duplicate_object THEN NULL.
--  Conjuntos EXTENSÍVEIS por admin (categoria, raça, finalidade, categoria de
--  curso) são tabelas de referência (migration 003), não enums.
-- ============================================================================
begin;

do $$ begin create type price_unit          as enum ('/@', '/cab'); exception when duplicate_object then null; end $$;
do $$ begin create type lot_sex             as enum ('Macho', 'Fêmea'); exception when duplicate_object then null; end $$;
do $$ begin create type lot_status          as enum ('draft', 'published', 'active', 'sold', 'paused'); exception when duplicate_object then null; end $$;
do $$ begin create type proposal_status     as enum ('active', 'accepted', 'refused', 'countered', 'closed'); exception when duplicate_object then null; end $$;
do $$ begin create type transaction_status  as enum ('confirmed', 'documentation', 'transport', 'delivery', 'completed', 'canceled'); exception when duplicate_object then null; end $$;
do $$ begin create type transport_status    as enum ('requested', 'confirmed', 'in_transit', 'delivered'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type   as enum ('match', 'proposal', 'price', 'radar', 'academy', 'system'); exception when duplicate_object then null; end $$;
do $$ begin create type user_role           as enum ('visitante', 'comprador', 'vendedor', 'empreendedor'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_plan   as enum ('free', 'pro', 'enterprise'); exception when duplicate_object then null; end $$;
do $$ begin create type subscription_status as enum ('active', 'canceled', 'past_due'); exception when duplicate_object then null; end $$;
do $$ begin create type service_status      as enum ('available', 'soon'); exception when duplicate_object then null; end $$;
do $$ begin create type scenario            as enum ('pessimista', 'base', 'otimista'); exception when duplicate_object then null; end $$;
do $$ begin create type course_level        as enum ('Iniciante', 'Intermediário', 'Avançado'); exception when duplicate_object then null; end $$;
do $$ begin create type boost_tier          as enum ('basic', 'premium', 'regional'); exception when duplicate_object then null; end $$;
do $$ begin create type message_sender      as enum ('buyer', 'seller'); exception when duplicate_object then null; end $$;

commit;
