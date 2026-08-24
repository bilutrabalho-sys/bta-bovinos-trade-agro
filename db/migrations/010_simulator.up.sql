-- ============================================================================
--  010 · Simulador (seção 10): simulations.
--  Depende de: 002 (scenario), 004 (users), 005 (lots).
-- ============================================================================
begin;

create table if not exists simulations (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id) on update cascade on delete cascade,
  lot_id       bigint references lots(id)           on update cascade on delete set null,  -- prefill opcional
  name         text   not null,
  scenario     scenario not null default 'base',
  -- inputs
  quantity     integer check (quantity >= 0),
  buy_price    numeric(8,2),      -- R$/cab
  freight      numeric(14,2),     -- R$ total
  feed         numeric(14,2),     -- alimentação total R$
  period_days  integer check (period_days is null or period_days >= 0),
  sell_price   numeric(8,2),      -- R$/@
  final_weight numeric(6,2),      -- kg
  -- outputs
  investment   numeric(14,2),     -- custo total / capital investido (mock SavedSimulation.investment)
  revenue      numeric(14,2),
  margin       numeric(6,2),      -- % (mock SavedSimulation.margin)
  break_even   numeric(8,2),      -- R$/@ ponto de equilíbrio
  created_at   timestamptz not null default now(),   -- mapeia SavedSimulation.date
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
comment on table  simulations is 'Simulação salva (SavedSimulation). Guarda inputs e outputs por cenário.';
comment on column simulations.investment is 'Custo total / capital investido do cenário. Mapeia SavedSimulation.investment.';
comment on column simulations.created_at is 'Data da simulação (mapeia SavedSimulation.date).';

commit;
