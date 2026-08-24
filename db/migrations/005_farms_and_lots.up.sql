-- ============================================================================
--  005 · Fazendas e lotes (seção 5): farms, farm_specialty, lots, lot_images.
--  Depende de: 002 (price_unit, lot_sex, lot_status), 003 (cattle_category,
--  breed, purpose), 004 (users).
--  Inclui a generated column lots.price_total e o índice único de capa
--  ux_lot_images_one_cover (mantido junto da sua tabela, não na 013).
-- ============================================================================
begin;

-- farms ----------------------------------------------------------------------
create table if not exists farms (
  id            bigint generated always as identity primary key,
  owner_user_id bigint references users(id) on update cascade on delete set null,  -- vendedor dono; farm sobrevive ao user
  name          text   not null,
  rating        numeric(3,2) check (rating between 0 and 5),
  deals         integer not null default 0 check (deals >= 0),        -- DERIVADO: nº de negócios concluídos (mantido pela app)
  completion    smallint check (completion between 0 and 100),         -- % de conclusão de negócios
  location      text,
  state         text   check (state is null or char_length(state) = 2),
  verified      boolean not null default false,                        -- selo BTA Verified
  since_year    smallint,                                              -- ano de fundação (mock Farm.since = '2021')
  description   text,
  active_lots   integer not null default 0 check (active_lots >= 0),   -- DERIVADO: nº de lotes ativos (mantido pela app)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
comment on table  farms is 'Fazenda/produtor vendedor. Farm N:1 User (owner). Lot N:1 Farm (seller_id).';
comment on column farms.deals is 'DERIVADO/denormalizado: contagem de transações concluídas. Mantido pela aplicação.';
comment on column farms.active_lots is 'DERIVADO/denormalizado: contagem de lots ativos. Mantido pela aplicação.';
comment on column farms.since_year is 'Ano de fundação. Frontend (Farm.since) espera string; a API faz o cast.';

-- farm_specialty -------------------------------------------------------------
create table if not exists farm_specialty (
  id         bigint generated always as identity primary key,
  farm_id    bigint not null references farms(id) on update cascade on delete cascade,
  specialty  text   not null,
  created_at timestamptz not null default now(),
  unique (farm_id, specialty)
);
comment on table farm_specialty is 'Especialidades da fazenda (tags livres). Mapeia Farm.specialties[].';

-- lots -----------------------------------------------------------------------
create table if not exists lots (
  id             bigint generated always as identity primary key,
  title          text   not null,
  category_id    bigint not null references cattle_category(id) on update cascade on delete restrict,
  breed_id       bigint not null references breed(id)           on update cascade on delete restrict,
  quantity       integer not null check (quantity > 0),
  weight         numeric(6,2) not null check (weight > 0),      -- kg, peso médio
  price          numeric(8,2) not null check (price >= 0),      -- R$ por unidade (arroba ou cabeça)
  price_unit     price_unit   not null,
  -- price_total: DENORMALIZAÇÃO permitida (generated STORED). Fórmula depende da unidade:
  --   '/@'   -> price * (weight/15) * quantity   (15 kg = 1 arroba)
  --   '/cab' -> price * quantity
  price_total    numeric(14,2) generated always as (
                   round(
                     case price_unit
                       when '/@'   then price * (weight / 15.0) * quantity
                       when '/cab' then price * quantity
                     end
                   , 2)
                 ) stored,
  location       text,                                          -- cidade, ex.: 'Barretos, SP'   [GEO: futura lat/long PostGIS]
  state          text   check (state is null or char_length(state) = 2),
  distance       numeric(7,2),   -- km. ATENÇÃO: no domínio real é relativo ao comprador (ver nota abaixo)
  freight        numeric(14,2),  -- R$. Idem distance: relativo ao comprador
  score          smallint check (score between 0 and 100),      -- BTA Score
  verified       boolean not null default false,
  seller_id      bigint not null references farms(id) on update cascade on delete restrict,  -- mock Lot.sellerId -> Farm.id
  age            text,                                          -- ex.: '36 meses' (string livre no mock)
  sex            lot_sex,
  purpose_id     bigint references purpose(id) on update cascade on delete restrict,
  description    text,
  status         lot_status not null default 'draft',
  views          integer not null default 0 check (views >= 0),            -- DERIVADO (stat de anúncio)
  favorites_count integer not null default 0 check (favorites_count >= 0), -- DERIVADO
  proposals_count integer not null default 0 check (proposals_count >= 0), -- DERIVADO
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
comment on table  lots is 'Lote de gado anunciado. Lot N:1 Farm (seller_id), N:1 cattle_category/breed/purpose.';
comment on column lots.price_total is 'DENORMALIZADO (generated stored). @ => price*(weight/15)*qty; /cab => price*qty. Ver nota p/ DBA sobre valores de mock inconsistentes.';
comment on column lots.distance is 'DERIVADO por comprador no domínio real. Aqui é um valor de referência (origem->comprador fixo do mock). Recomenda-se calcular via view/serviço por comprador. [GEO]';
comment on column lots.freight is 'Idem distance: relativo ao comprador. Valor de referência.';
comment on column lots.views is 'DERIVADO: stat do anúncio, mantido pela aplicação.';

-- lot_images -----------------------------------------------------------------
create table if not exists lot_images (
  id         bigint generated always as identity primary key,
  lot_id     bigint not null references lots(id) on update cascade on delete cascade,
  url        text   not null,
  position   integer not null default 0,
  is_cover   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (lot_id, position)
);
-- garante no máximo UMA capa por lote
create unique index if not exists ux_lot_images_one_cover on lot_images (lot_id) where is_cover;
comment on table lot_images is 'Imagens do lote. is_cover=true reconstrói Lot.image; ordem por position reconstrói Lot.images[].';

commit;
