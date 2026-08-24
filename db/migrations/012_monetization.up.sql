-- ============================================================================
--  012 · Monetização (seção 12): subscription_plans, subscriptions,
--        lot_boosts, services, platform_settings.
--  Depende de: 002 (subscription_plan, subscription_status, boost_tier,
--  service_status), 004 (users), 005 (lots).
-- ============================================================================
begin;

-- subscription_plans (catálogo) ----------------------------------------------
create table if not exists subscription_plans (
  id          bigint generated always as identity primary key,
  code        subscription_plan not null unique,   -- 'free' | 'pro' | 'enterprise'
  name        text   not null,                      -- 'Gratuito' | 'BTA PRO' | 'Empresa'
  price       numeric(8,2) not null default 0 check (price >= 0),  -- 0 no free; enterprise pode ser 'Consulte' (0 + flag na app)
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table subscription_plans is 'Catálogo de planos (BTA PRO). price=0 no Gratuito; Enterprise = "Consulte" (tratado na app).';

-- subscriptions --------------------------------------------------------------
create table if not exists subscriptions (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references users(id)              on update cascade on delete cascade,
  plan_id     bigint not null references subscription_plans(id) on update cascade on delete restrict,
  status      subscription_status not null default 'active',
  started_at  timestamptz not null default now(),
  renews_at   timestamptz,
  canceled_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
comment on table subscriptions is 'Assinatura do usuário. N:1 users, N:1 subscription_plans.';

-- lot_boosts (Impulsionar lote, §35) -----------------------------------------
create table if not exists lot_boosts (
  id         bigint generated always as identity primary key,
  lot_id     bigint not null references lots(id) on update cascade on delete cascade,
  tier       boost_tier not null,
  status     text not null default 'scheduled'
             check (status in ('scheduled', 'active', 'expired', 'canceled')),
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table lot_boosts is 'Impulsionamento pago de um lote (§35). N:1 lots.';

-- services (Central de Serviços) ---------------------------------------------
create table if not exists services (
  id          bigint generated always as identity primary key,
  name        text   not null,
  icon        text,                  -- nome do ícone (ex.: 'truck','shield','credit-card')
  description text,
  status      service_status not null default 'soon',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table services is 'Central de Serviços (BTA Log, Seguro, Financiamento...). status available|soon.';

-- platform_settings ----------------------------------------------------------
--  Config chave-valor (take rate configurável §32, e outros). value em jsonb.
create table if not exists platform_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);
comment on table platform_settings is 'Configurações da plataforma (chave-valor). Ex.: take rate configurável (§32).';
-- Seed NÃO incluído aqui (outro agente cuida do seed). Chave prevista:
--   INSERT INTO platform_settings(key, value, description)
--   VALUES ('take_rate_percent', '1.0'::jsonb, 'Comissão padrão da plataforma (%)');

commit;
