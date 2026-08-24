-- ============================================================================
--  014 · Triggers de updated_at (seção 14) — tabelas mutáveis.
--  Depende de: 001 (função set_updated_at) e das tabelas alvo (004–012).
--  CREATE TRIGGER não suporta IF NOT EXISTS de forma portável; para reexecução
--  segura cada trigger é recriado (drop if exists + create).
-- ============================================================================
begin;

drop trigger if exists trg_users_updated_at               on users;
create trigger trg_users_updated_at               before update on users               for each row execute function set_updated_at();

drop trigger if exists trg_farms_updated_at                on farms;
create trigger trg_farms_updated_at                before update on farms               for each row execute function set_updated_at();

drop trigger if exists trg_lots_updated_at                 on lots;
create trigger trg_lots_updated_at                 before update on lots                for each row execute function set_updated_at();

drop trigger if exists trg_market_prices_updated_at        on market_prices;
create trigger trg_market_prices_updated_at        before update on market_prices       for each row execute function set_updated_at();

drop trigger if exists trg_opportunities_updated_at        on opportunities;
create trigger trg_opportunities_updated_at        before update on opportunities       for each row execute function set_updated_at();

drop trigger if exists trg_radars_updated_at               on radars;
create trigger trg_radars_updated_at               before update on radars              for each row execute function set_updated_at();

drop trigger if exists trg_proposals_updated_at            on proposals;
create trigger trg_proposals_updated_at            before update on proposals           for each row execute function set_updated_at();

drop trigger if exists trg_transactions_updated_at         on transactions;
create trigger trg_transactions_updated_at         before update on transactions        for each row execute function set_updated_at();

drop trigger if exists trg_transporters_updated_at         on transporters;
create trigger trg_transporters_updated_at         before update on transporters        for each row execute function set_updated_at();

drop trigger if exists trg_transports_updated_at           on transports;
create trigger trg_transports_updated_at           before update on transports          for each row execute function set_updated_at();

drop trigger if exists trg_courses_updated_at              on courses;
create trigger trg_courses_updated_at              before update on courses             for each row execute function set_updated_at();

drop trigger if exists trg_user_course_progress_updated_at on user_course_progress;
create trigger trg_user_course_progress_updated_at before update on user_course_progress for each row execute function set_updated_at();

drop trigger if exists trg_lessons_updated_at              on lessons;
create trigger trg_lessons_updated_at              before update on lessons             for each row execute function set_updated_at();

drop trigger if exists trg_simulations_updated_at          on simulations;
create trigger trg_simulations_updated_at          before update on simulations         for each row execute function set_updated_at();

drop trigger if exists trg_subscription_plans_updated_at   on subscription_plans;
create trigger trg_subscription_plans_updated_at   before update on subscription_plans  for each row execute function set_updated_at();

drop trigger if exists trg_subscriptions_updated_at        on subscriptions;
create trigger trg_subscriptions_updated_at        before update on subscriptions       for each row execute function set_updated_at();

drop trigger if exists trg_lot_boosts_updated_at           on lot_boosts;
create trigger trg_lot_boosts_updated_at           before update on lot_boosts          for each row execute function set_updated_at();

drop trigger if exists trg_services_updated_at             on services;
create trigger trg_services_updated_at             before update on services            for each row execute function set_updated_at();

drop trigger if exists trg_platform_settings_updated_at    on platform_settings;
create trigger trg_platform_settings_updated_at    before update on platform_settings   for each row execute function set_updated_at();

commit;
