-- ============================================================================
--  014 · DOWN — dropa os triggers de updated_at (ordem inversa).
--  A função set_updated_at() NÃO é dropada aqui: pertence ao down 001.
--  (Os triggers também cairiam junto das tabelas nos downs 004–012; dropados
--   explicitamente aqui por fidelidade ao up e para permitir re-migrar só a 014.)
-- ============================================================================
begin;

drop trigger if exists trg_platform_settings_updated_at    on platform_settings;
drop trigger if exists trg_services_updated_at             on services;
drop trigger if exists trg_lot_boosts_updated_at           on lot_boosts;
drop trigger if exists trg_subscriptions_updated_at        on subscriptions;
drop trigger if exists trg_subscription_plans_updated_at   on subscription_plans;
drop trigger if exists trg_simulations_updated_at          on simulations;
drop trigger if exists trg_lessons_updated_at              on lessons;
drop trigger if exists trg_user_course_progress_updated_at on user_course_progress;
drop trigger if exists trg_courses_updated_at              on courses;
drop trigger if exists trg_transports_updated_at           on transports;
drop trigger if exists trg_transporters_updated_at         on transporters;
drop trigger if exists trg_transactions_updated_at         on transactions;
drop trigger if exists trg_proposals_updated_at            on proposals;
drop trigger if exists trg_radars_updated_at               on radars;
drop trigger if exists trg_opportunities_updated_at        on opportunities;
drop trigger if exists trg_market_prices_updated_at        on market_prices;
drop trigger if exists trg_lots_updated_at                 on lots;
drop trigger if exists trg_farms_updated_at                on farms;
drop trigger if exists trg_users_updated_at                on users;

commit;
