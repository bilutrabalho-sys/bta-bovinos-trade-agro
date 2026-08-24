-- ============================================================================
--  007 · Descoberta (seção 7): opportunities, radars, radar_state,
--        match_searches, match_results.
--  Depende de: 002 (lot_sex, price_unit), 003 (cattle_category, breed, purpose),
--  004 (users), 005 (lots).
-- ============================================================================
begin;

-- opportunities --------------------------------------------------------------
create table if not exists opportunities (
  id          bigint generated always as identity primary key,
  lot_id      bigint not null references lots(id)  on update cascade on delete cascade,
  user_id     bigint references users(id) on update cascade on delete cascade,  -- NULL = feed global; preenchido = personalizado
  title       text   not null,
  avg_regional numeric(8,2),   -- preço médio regional de referência
  price_diff  numeric(5,2),    -- % abaixo/acima da média
  distance    numeric(7,2),
  freight     numeric(14,2),
  score       smallint check (score between 0 and 100),
  reason      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table opportunities is 'Oportunidade destacada. Opportunity N:1 Lot; user_id NULL = feed global.';

-- radars (RadarAlert) --------------------------------------------------------
create table if not exists radars (
  id            bigint generated always as identity primary key,
  user_id       bigint not null references users(id) on update cascade on delete cascade,
  title         text   not null,
  criteria_text text,                          -- texto de exibição (mock RadarAlert.criteria)
  category_id   bigint references cattle_category(id) on update cascade on delete set null,
  breed_id      bigint references breed(id)           on update cascade on delete set null,
  purpose_id    bigint references purpose(id)         on update cascade on delete set null,
  sex           lot_sex,
  max_price     numeric(8,2),
  price_unit    price_unit,
  max_distance  numeric(7,2),
  active        boolean not null default true,
  matches       integer not null default 0 check (matches >= 0),  -- DERIVADO: nº de lotes compatíveis
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
comment on table  radars is 'Alerta de radar (RadarAlert). criteria_text = exibição; demais colunas = critérios estruturados.';
comment on column radars.matches is 'DERIVADO/denormalizado: contagem de lotes compatíveis. Mantido pela aplicação.';

create table if not exists radar_state (
  id         bigint generated always as identity primary key,
  radar_id   bigint not null references radars(id) on update cascade on delete cascade,
  state      text   not null check (char_length(state) = 2),   -- UF-alvo do radar
  created_at timestamptz not null default now(),
  unique (radar_id, state)
);
comment on table radar_state is 'UFs-alvo de um radar (states[] do critério). 1:N com radars.';

-- match_searches / match_results --------------------------------------------
create table if not exists match_searches (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id) on update cascade on delete cascade,
  query        text,                          -- busca livre (BuyFilters.query)
  category_id  bigint references cattle_category(id) on update cascade on delete set null,
  breed_id     bigint references breed(id)           on update cascade on delete set null,
  purpose_id   bigint references purpose(id)         on update cascade on delete set null,
  sex          lot_sex,
  min_quantity integer check (min_quantity is null or min_quantity >= 0),
  max_quantity integer check (max_quantity is null or max_quantity >= 0),
  min_weight   numeric(6,2),
  max_weight   numeric(6,2),
  max_distance numeric(7,2),
  max_price    numeric(8,2),
  price_unit   price_unit,
  min_score    smallint check (min_score is null or min_score between 0 and 100),
  state        text  check (state is null or char_length(state) = 2),
  created_at   timestamptz not null default now()
);
comment on table match_searches is 'Busca do BTA Match / BuyFilters (critérios de compra). 1:N match_results.';

create table if not exists match_results (
  id              bigint generated always as identity primary key,
  match_search_id bigint not null references match_searches(id) on update cascade on delete cascade,
  lot_id          bigint not null references lots(id)           on update cascade on delete cascade,
  compatibility   smallint not null check (compatibility between 0 and 100),  -- %
  highlight       text,                          -- resumo (ex.: 'Nelore 380kg · R$ 315/@ · 92km')
  created_at      timestamptz not null default now(),
  unique (match_search_id, lot_id)
);
comment on table match_results is 'Resultado de uma busca do Match. MatchResult N:1 MatchSearch, N:1 Lot.';

commit;
