-- ============================================================================
--  006 · Mercado (seção 6): market_prices, market_price_points.
--  Depende de: 002 (price_unit), 003 (cattle_category).
--  Inclui os índices únicos de escopo (ux_market_prices_scope,
--  ux_market_points_scope_date) — mantidos junto das tabelas, não na 013.
-- ============================================================================
begin;

-- market_prices --------------------------------------------------------------
--  1 linha = snapshot atual por categoria/região (region/state NULL = nacional).
create table if not exists market_prices (
  id          bigint generated always as identity primary key,
  category_id bigint not null references cattle_category(id) on update cascade on delete restrict,
  current     numeric(8,2) not null,      -- preço atual
  change      numeric(5,2),               -- % variação (pode ser negativa)
  unit        price_unit not null,
  color       text,                       -- cor hex para o gráfico (ex.: '#123B2A')
  region      text,                       -- nome de região; NULL = nacional
  state       text check (state is null or char_length(state) = 2),
  snapshot_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- unicidade do snapshot corrente por (categoria, região, uf); NULLs tratados como '*'
create unique index if not exists ux_market_prices_scope
  on market_prices (category_id, coalesce(region, '*'), coalesce(state, '*'));
comment on table  market_prices is 'Snapshot corrente de preço por categoria/região. Mapeia MARKET_DATA[categoria].';
comment on column market_prices.change is 'Variação percentual do preço (Ex.: +2.3 / -0.8).';

-- market_price_points --------------------------------------------------------
--  Série temporal diária. As janelas history7/30/90 do mock são apenas
--  WHERE price_date >= current_date - N sobre esta tabela.
create table if not exists market_price_points (
  id          bigint generated always as identity primary key,
  category_id bigint not null references cattle_category(id) on update cascade on delete restrict,
  region      text,                       -- NULL = nacional
  price_date  date   not null,
  value       numeric(8,2) not null,
  created_at  timestamptz not null default now()
);
-- Unicidade por (categoria, região, data): via índice, pois constraint de tabela
-- não aceita expressão (coalesce trata nacional/NULL como '*').
create unique index if not exists ux_market_points_scope_date
  on market_price_points (category_id, coalesce(region, '*'), price_date);
comment on table market_price_points is 'Série histórica diária de preços. history7/30/90 são janelas desta série. [DBA: forte candidata a PARTICIONAMENTO por price_date (RANGE mensal/anual).]';

commit;
