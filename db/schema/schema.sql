-- ============================================================================
--  BTA — Bovinos Trade Agro
--  Schema PostgreSQL consolidado (DDL)
-- ----------------------------------------------------------------------------
--  Objetivo: substituir a camada de mock (src/data/mock.ts) por um banco real
--  SEM remodelar o frontend React/TS. Nomes de tabelas/colunas mapeiam de forma
--  limpa para as interfaces TS existentes (Lot, Farm, Opportunity, RadarAlert,
--  ChatMessage, SavedSimulation, etc.). A camada de acesso a dados converte
--  snake_case (banco) -> camelCase (frontend).
--
--  Decisões de arquitetura (fixadas pelo db-architect, NÃO divergir):
--    * PK: bigint GENERATED ALWAYS AS IDENTITY em todas as tabelas
--      (o frontend usa `id: number`, contrato preservado). Onde há necessidade
--      de identificador público opaco, coluna extra `public_id uuid`.
--    * Dinheiro: numeric(14,2) p/ totais BRL; numeric(8,2) p/ preços unitários
--      (R$/@, R$/cab, R$/km). Moeda BRL implícita. Nunca float/double.
--    * Auditoria: created_at/updated_at timestamptz (trigger set_updated_at()).
--    * Soft delete: coluna deleted_at nas entidades de conteúdo do usuário.
--    * Normalização 3NF; denormalizações permitidas explicitamente comentadas.
--    * Geo: por ora location = cidade (text) + state (UF). PostGIS fica p/ o
--      futuro — ver notas "[GEO]".
--
--  Convenção de nomes: tabelas no plural, snake_case; FK = {tabela_singular}_id.
-- ============================================================================


-- ============================================================================
--  0. EXTENSÕES
-- ============================================================================
create extension if not exists citext;    -- e-mails case-insensitive
create extension if not exists pgcrypto;   -- gen_random_uuid()


-- ============================================================================
--  1. AUDITORIA — função e convenção de trigger de updated_at
-- ----------------------------------------------------------------------------
--  Toda tabela mutável tem created_at/updated_at NOT NULL default now().
--  Os triggers BEFORE UPDATE que chamam set_updated_at() estão agrupados na
--  seção 14 (perto do fim do arquivo), após a criação de todas as tabelas.
-- ============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Trigger BEFORE UPDATE: mantém updated_at = now() em toda tabela mutável.';


-- ============================================================================
--  2. TIPOS ENUM (conjuntos fixos e pequenos)
-- ----------------------------------------------------------------------------
--  Conjuntos EXTENSÍVEIS por admin (categoria, raça, finalidade, categoria de
--  curso) NÃO são enums: viram tabelas de referência (seção 3), para adicionar
--  valores sem migration.
-- ============================================================================
create type price_unit          as enum ('/@', '/cab');
create type lot_sex             as enum ('Macho', 'Fêmea');
create type lot_status          as enum ('draft', 'published', 'active', 'sold', 'paused');
create type proposal_status     as enum ('active', 'accepted', 'refused', 'countered', 'closed');
create type transaction_status  as enum ('confirmed', 'documentation', 'transport', 'delivery', 'completed', 'canceled');
create type transport_status    as enum ('requested', 'confirmed', 'in_transit', 'delivered');
create type notification_type   as enum ('match', 'proposal', 'price', 'radar', 'academy', 'system');
create type user_role           as enum ('visitante', 'comprador', 'vendedor', 'empreendedor');
create type subscription_plan   as enum ('free', 'pro', 'enterprise');
create type subscription_status as enum ('active', 'canceled', 'past_due');
create type service_status      as enum ('available', 'soon');
create type scenario            as enum ('pessimista', 'base', 'otimista');
create type course_level        as enum ('Iniciante', 'Intermediário', 'Avançado');
create type boost_tier          as enum ('basic', 'premium', 'regional');
create type message_sender      as enum ('buyer', 'seller');


-- ============================================================================
--  3. TABELAS DE REFERÊNCIA (dimensões extensíveis por admin)
-- ----------------------------------------------------------------------------
--  cattle_category / breed / purpose / course_category: listas de domínio que
--  crescem sem migration. Lots referenciam por FK; o frontend recebe a string
--  do `name` via JOIN (ex.: SELECT c.name AS category). Optou-se por NÃO
--  duplicar o texto em lots para evitar anomalia de atualização (3NF); se a
--  leitura exigir, o DBA pode adicionar coluna-cache — ver notas para o DBA.
-- ============================================================================
create table cattle_category (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Boi Gordo','Garrote','Novilha','Bezerro','Vaca'
  created_at timestamptz not null default now()
);
comment on table cattle_category is 'Categoria de gado (dimensão). Também é a dimensão de market_prices.';

create table breed (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Nelore','Angus','Brangus','Brahman','Guzerá','Cruzamento'...
  created_at timestamptz not null default now()
);
comment on table breed is 'Raça / tipo racial (dimensão extensível).';

create table purpose (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Corte','Recria','Engorda','Cria' (mock usa também 'Recria/Cria')
  created_at timestamptz not null default now()
);
comment on table purpose is 'Finalidade / aptidão do lote (dimensão extensível).';

create table course_category (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Comece aqui','Compra','Venda','Recria','Engorda','Mercado',...
  created_at timestamptz not null default now()
);
comment on table course_category is 'Categoria/trilha de curso da BTA Academy (dimensão extensível).';


-- ============================================================================
--  4. IDENTIDADE
-- ============================================================================

-- users --------------------------------------------------------------------
create table users (
  id                 bigint generated always as identity primary key,
  public_id          uuid   not null default gen_random_uuid() unique,  -- id público opaco (deep-links, etc.)
  name               text   not null,
  role               user_role not null default 'visitante',
  email              citext unique,                    -- case-insensitive; múltiplos NULL permitidos
  phone              text   unique,                    -- telefone de contato; único (múltiplos NULL permitidos)
  location           text,                             -- cidade (ex.: 'São José do Rio Preto')
  state              text   check (state is null or char_length(state) = 2),  -- UF
  level              text   not null default 'Iniciante',  -- gamificação (ex.: 'Iniciante')
  xp                 integer not null default 0 check (xp >= 0),
  negotiations_count integer not null default 0 check (negotiations_count >= 0),
  external_auth_id   text,                             -- id no provedor externo de auth (ex.: Firebase UID / Auth0 sub). Único quando preenchido (ux_users_external_auth_id).
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
comment on table  users is 'Usuário da plataforma. Um user PODE possuir uma farm (role vendedor/empreendedor).';
comment on column users.external_auth_id is 'Vínculo OFICIAL de auth: usuário autenticado por provedor externo (Firebase/Auth0). Nullable (visitante sem cadastro), mas ÚNICO quando preenchido (índice parcial ux_users_external_auth_id).';
comment on column users.level is 'Nível de gamificação exibido no perfil (não confundir com role).';

-- user_preference ----------------------------------------------------------
--  Preferências do perfil são tags livres (['Comprador','Nelore','SP','Até 200 km']).
--  Modeladas como tabela filha (1:N) em vez de text[]: permite índice/constraint
--  simples por tag e admin editar sem parsing de array. Hard delete (efêmero).
create table user_preference (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on update cascade on delete cascade,
  tag        text   not null,
  created_at timestamptz not null default now(),
  unique (user_id, tag)
);
comment on table user_preference is 'Tags de preferência exibidas no perfil (string livre). 1:N com users.';

-- Nota: a autenticação NÃO reside no banco. O usuário é autenticado por um
-- provedor externo (Firebase/Auth0); o vínculo é users.external_auth_id (único
-- quando preenchido — ver ux_users_external_auth_id na seção 13). Por isso não
-- há tabela de OTP neste schema.


-- ============================================================================
--  5. FAZENDAS E LOTES
-- ============================================================================

-- farms --------------------------------------------------------------------
create table farms (
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

-- farm_specialty -----------------------------------------------------------
--  specialties[] do mock são tags livres que misturam raça ('Nelore') e
--  categoria ('Garrotes','Boi Gordo') — por isso ficam como texto, não FK.
create table farm_specialty (
  id         bigint generated always as identity primary key,
  farm_id    bigint not null references farms(id) on update cascade on delete cascade,
  specialty  text   not null,
  created_at timestamptz not null default now(),
  unique (farm_id, specialty)
);
comment on table farm_specialty is 'Especialidades da fazenda (tags livres). Mapeia Farm.specialties[].';

-- lots ---------------------------------------------------------------------
create table lots (
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

-- lot_images ---------------------------------------------------------------
--  Mapeia Lot.image (capa) + Lot.images[] (galeria). A app reconstrói
--  image = imagem com is_cover=true e images[] = ordenado por position.
create table lot_images (
  id         bigint generated always as identity primary key,
  lot_id     bigint not null references lots(id) on update cascade on delete cascade,
  url        text   not null,
  position   integer not null default 0,
  is_cover   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (lot_id, position)
);
-- garante no máximo UMA capa por lote
create unique index ux_lot_images_one_cover on lot_images (lot_id) where is_cover;
comment on table lot_images is 'Imagens do lote. is_cover=true reconstrói Lot.image; ordem por position reconstrói Lot.images[].';


-- ============================================================================
--  6. MERCADO
-- ============================================================================

-- market_prices ------------------------------------------------------------
--  1 linha = snapshot atual por categoria/região (region/state NULL = nacional).
create table market_prices (
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
create unique index ux_market_prices_scope
  on market_prices (category_id, coalesce(region, '*'), coalesce(state, '*'));
comment on table  market_prices is 'Snapshot corrente de preço por categoria/região. Mapeia MARKET_DATA[categoria].';
comment on column market_prices.change is 'Variação percentual do preço (Ex.: +2.3 / -0.8).';

-- market_price_points ------------------------------------------------------
--  Série temporal diária. As janelas history7/30/90 do mock são apenas
--  WHERE price_date >= current_date - N sobre esta tabela.
create table market_price_points (
  id          bigint generated always as identity primary key,
  category_id bigint not null references cattle_category(id) on update cascade on delete restrict,
  region      text,                       -- NULL = nacional
  price_date  date   not null,
  value       numeric(8,2) not null,
  created_at  timestamptz not null default now()
);
-- Unicidade por (categoria, região, data): via índice, pois constraint de tabela
-- não aceita expressão (coalesce trata nacional/NULL como '*').
create unique index ux_market_points_scope_date
  on market_price_points (category_id, coalesce(region, '*'), price_date);
comment on table market_price_points is 'Série histórica diária de preços. history7/30/90 são janelas desta série. [DBA: forte candidata a PARTICIONAMENTO por price_date (RANGE mensal/anual).]';


-- ============================================================================
--  7. DESCOBERTA
-- ============================================================================

-- opportunities ------------------------------------------------------------
create table opportunities (
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

-- radars (RadarAlert) ------------------------------------------------------
--  Mantém criteria_text (exibição, mock RadarAlert.criteria) + critérios
--  estruturados (para o motor de matching real). states via tabela filha.
create table radars (
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

create table radar_state (
  id         bigint generated always as identity primary key,
  radar_id   bigint not null references radars(id) on update cascade on delete cascade,
  state      text   not null check (char_length(state) = 2),   -- UF-alvo do radar
  created_at timestamptz not null default now(),
  unique (radar_id, state)
);
comment on table radar_state is 'UFs-alvo de um radar (states[] do critério). 1:N com radars.';

-- match_searches / match_results ------------------------------------------
--  Família de campos do BuyFilters (BuyScreen) + faixas do BTA Match.
create table match_searches (
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

create table match_results (
  id              bigint generated always as identity primary key,
  match_search_id bigint not null references match_searches(id) on update cascade on delete cascade,
  lot_id          bigint not null references lots(id)           on update cascade on delete cascade,
  compatibility   smallint not null check (compatibility between 0 and 100),  -- %
  highlight       text,                          -- resumo (ex.: 'Nelore 380kg · R$ 315/@ · 92km')
  created_at      timestamptz not null default now(),
  unique (match_search_id, lot_id)
);
comment on table match_results is 'Resultado de uma busca do Match. MatchResult N:1 MatchSearch, N:1 Lot.';


-- ============================================================================
--  8. FLUXO DE NEGOCIAÇÃO
-- ============================================================================

-- proposals ----------------------------------------------------------------
create table proposals (
  id             bigint generated always as identity primary key,
  lot_id         bigint not null references lots(id)   on update cascade on delete restrict,
  buyer_user_id  bigint not null references users(id)  on update cascade on delete restrict,
  seller_farm_id bigint not null references farms(id)  on update cascade on delete restrict,
  proposed_price numeric(8,2) not null check (proposed_price >= 0),
  price_unit     price_unit not null,
  quantity       integer not null check (quantity > 0),
  status         proposal_status not null default 'active',
  closed_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
comment on table proposals is 'Proposta de negociação. Liga Lot + comprador(User) + vendedor(Farm). 1:N negotiation_messages.';

-- negotiation_messages (ChatMessage) ---------------------------------------
create table negotiation_messages (
  id          bigint generated always as identity primary key,
  proposal_id bigint not null references proposals(id) on update cascade on delete cascade,
  sender      message_sender not null,        -- 'buyer' | 'seller' (mock ChatMessage.from)
  text        text   not null,
  sent_at     timestamptz not null default now()   -- mapeia ChatMessage.time
);
comment on table negotiation_messages is 'Mensagens do chat de negociação (ChatMessage). N:1 proposals. Hard delete (efêmero).';

-- transactions (Negócio Fechado / Deal) ------------------------------------
create table transactions (
  id             bigint generated always as identity primary key,
  lot_id         bigint not null references lots(id)      on update cascade on delete restrict,
  buyer_user_id  bigint not null references users(id)     on update cascade on delete restrict,
  seller_farm_id bigint not null references farms(id)     on update cascade on delete restrict,
  proposal_id    bigint references proposals(id)          on update cascade on delete set null,
  quantity       integer not null check (quantity > 0),
  agreed_price   numeric(8,2) not null check (agreed_price >= 0),
  price_unit     price_unit not null,
  -- weight_snapshot: peso médio (kg) do lote CONGELADO no fechamento. Base de
  -- auditoria de total_value p/ '/@' (que depende do peso, e lots.weight pode
  -- mudar depois). Recomendação do postgres-dba. Obrigatório em transações '/@'
  -- (ver constraint chk_tx_weight_snapshot_for_arroba abaixo); dispensável em '/cab'.
  weight_snapshot numeric(6,2) check (weight_snapshot is null or weight_snapshot > 0),
  total_value    numeric(14,2) not null check (total_value >= 0),  -- calculado pela app (precisa do peso p/ '/@')
  status         transaction_status not null default 'confirmed',
  fee_percent    numeric(5,2) not null default 1.00 check (fee_percent >= 0),  -- take rate (§32, ~1%)
  -- fee_amount: DENORMALIZAÇÃO permitida (generated stored) = total_value * fee_percent/100
  fee_amount     numeric(14,2) generated always as (round(total_value * fee_percent / 100.0, 2)) stored,
  closed_at      timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  -- toda transação por arroba ('/@') precisa carregar o peso congelado p/ auditoria
  constraint chk_tx_weight_snapshot_for_arroba
    check (price_unit <> '/@' or weight_snapshot is not null)
);
comment on table  transactions is 'Negócio fechado. Liga Lot + comprador + vendedor (+ proposal opcional). 1:N transaction_steps/transports.';
comment on column transactions.weight_snapshot is 'Peso médio (kg) do lote congelado no fechamento. Base de auditoria de total_value p/ ''/@''. Preenchido pela app.';
comment on column transactions.total_value is 'Valor total acordado (BRL). Calculado pela app: p/ ''/@'' usa o peso do lote no momento do fechamento.';
comment on column transactions.fee_amount is 'DENORMALIZADO (generated): total_value * fee_percent/100. Comissão da plataforma.';

-- transaction_steps (timeline da tela "Negócio Fechado") -------------------
--  5 etapas: confirmado, documentação, transporte, entrega, conclusão.
--  Tabela própria (em vez de derivar do status) para rastrear timestamps.
create table transaction_steps (
  id             bigint generated always as identity primary key,
  transaction_id bigint not null references transactions(id) on update cascade on delete cascade,
  step_order     smallint not null check (step_order between 1 and 5),
  label          text   not null,               -- 'Negócio confirmado','Documentação (GTA)','Transporte','Entrega','Conclusão'
  done           boolean not null default false,
  done_at        timestamptz,
  created_at     timestamptz not null default now(),
  unique (transaction_id, step_order)
);
comment on table transaction_steps is 'Etapas do pós-fechamento (timeline). 1:N com transactions.';

-- transporters -------------------------------------------------------------
create table transporters (
  id            bigint generated always as identity primary key,
  name          text   not null,
  rating        numeric(3,2) check (rating between 0 and 5),
  trips         integer not null default 0 check (trips >= 0),
  capacity      integer check (capacity >= 0),          -- cabeças por viagem
  price_per_km  numeric(8,2) check (price_per_km >= 0), -- R$/km
  verified      boolean not null default false,
  location      text,
  state         text check (state is null or char_length(state) = 2),
  available     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table transporters is 'Transportadora (BTA Log). Transport N:1 Transporter.';

-- transports (BTA Log) -----------------------------------------------------
create table transports (
  id             bigint generated always as identity primary key,
  transaction_id bigint not null references transactions(id) on update cascade on delete cascade,
  transporter_id bigint references transporters(id)          on update cascade on delete set null,
  origin         text,
  destination    text,
  distance       numeric(7,2),
  freight        numeric(14,2),
  status         transport_status not null default 'requested',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table transports is 'Frete de uma transação (BTA Log). N:1 transactions, N:1 transporters. [GEO: rota origem->destino].';


-- ============================================================================
--  9. APRENDIZADO (BTA Academy)
-- ============================================================================

-- courses ------------------------------------------------------------------
create table courses (
  id          bigint generated always as identity primary key,
  title       text   not null,
  category_id bigint references course_category(id) on update cascade on delete restrict,
  duration    text,                          -- ex.: '8 min' (string livre no mock)
  level       course_level,
  xp          integer not null default 0 check (xp >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table courses is 'Curso da BTA Academy. Course 1:N Lesson. Progresso é por usuário (user_course_progress).';

-- user_course_progress (N:N user<->course) ---------------------------------
create table user_course_progress (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id)   on update cascade on delete cascade,
  course_id    bigint not null references courses(id) on update cascade on delete cascade,
  progress     smallint not null default 0 check (progress between 0 and 100),  -- mock Course.progress
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, course_id)
);
comment on table user_course_progress is 'Progresso do usuário em um curso. O Course.progress do mock é o do usuário logado.';

-- lessons ------------------------------------------------------------------
--  No mock a aula é 1:1 com o curso, mas modelamos 1:N (course -> lessons).
create table lessons (
  id          bigint generated always as identity primary key,
  course_id   bigint not null references courses(id) on update cascade on delete cascade,
  title       text   not null,
  category_id bigint references course_category(id) on update cascade on delete restrict,
  level       course_level,
  duration    text,
  xp          integer not null default 0 check (xp >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table lessons is 'Aula. Lesson N:1 Course; 1:N sections/key_concepts/quiz_questions.';

create table lesson_sections (
  id         bigint generated always as identity primary key,
  lesson_id  bigint not null references lessons(id) on update cascade on delete cascade,
  position   integer not null default 0,
  heading    text   not null,
  body       text   not null,
  created_at timestamptz not null default now(),
  unique (lesson_id, position)
);
comment on table lesson_sections is 'Seções de conteúdo da aula (sections[{heading, body}]).';

create table lesson_key_concepts (
  id         bigint generated always as identity primary key,
  lesson_id  bigint not null references lessons(id) on update cascade on delete cascade,
  position   integer not null default 0,
  concept    text   not null,
  created_at timestamptz not null default now(),
  unique (lesson_id, position)
);
comment on table lesson_key_concepts is 'Conceitos-chave da aula (keyConcepts[]).';

create table lesson_quiz_questions (
  id           bigint generated always as identity primary key,
  lesson_id    bigint not null references lessons(id) on update cascade on delete cascade,
  position     integer not null default 0,
  question     text   not null,               -- quiz[].q
  answer_index smallint not null check (answer_index >= 0),  -- quiz[].answer (índice da opção correta)
  created_at   timestamptz not null default now(),
  unique (lesson_id, position)
);
comment on table lesson_quiz_questions is 'Questões do quiz da aula. 1:N lesson_quiz_options. answer_index aponta a opção correta.';

create table lesson_quiz_options (
  id          bigint generated always as identity primary key,
  question_id bigint not null references lesson_quiz_questions(id) on update cascade on delete cascade,
  position    integer not null default 0,      -- índice referenciado por answer_index
  option_text text   not null,                 -- quiz[].opts[]
  created_at  timestamptz not null default now(),
  unique (question_id, position)
);
comment on table lesson_quiz_options is 'Opções de uma questão de quiz (opts[]). answer_index da questão referencia position.';

-- user_lesson_progress (N:N user<->lesson) ---------------------------------
create table user_lesson_progress (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id)     on update cascade on delete cascade,
  lesson_id    bigint not null references lessons(id)   on update cascade on delete cascade,
  completed_at timestamptz,
  xp_earned    integer not null default 0 check (xp_earned >= 0),
  created_at   timestamptz not null default now(),
  unique (user_id, lesson_id)
);
comment on table user_lesson_progress is 'Progresso/conclusão do usuário por aula (concede XP).';


-- ============================================================================
--  10. SIMULADOR
-- ============================================================================
create table simulations (
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


-- ============================================================================
--  11. ENGAJAMENTO
-- ============================================================================

-- notifications ------------------------------------------------------------
--  FKs opcionais para a entidade relacionada (lot/proposal). Hard delete.
create table notifications (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references users(id) on update cascade on delete cascade,
  type        notification_type not null,
  title       text   not null,
  body        text,
  read        boolean not null default false,
  lot_id      bigint references lots(id)      on update cascade on delete set null,
  proposal_id bigint references proposals(id) on update cascade on delete set null,
  created_at  timestamptz not null default now()   -- mock Notification.time é relativo à app
);
comment on table notifications is 'Notificação do usuário. Hard delete (efêmero). lot_id/proposal_id opcionais p/ deep-link.';

-- favorites (polimórfico via EXCLUSIVE ARC) --------------------------------
--  Exatamente UMA coluna-alvo preenchida (num_nonnulls = 1). Cada alvo tem FK
--  real, preservando integridade referencial (impossível num type+id puro).
create table favorites (
  id             bigint generated always as identity primary key,
  user_id        bigint not null references users(id) on update cascade on delete cascade,
  lot_id         bigint references lots(id)          on update cascade on delete cascade,
  farm_id        bigint references farms(id)         on update cascade on delete cascade,
  opportunity_id bigint references opportunities(id) on update cascade on delete cascade,
  simulation_id  bigint references simulations(id)   on update cascade on delete cascade,
  lesson_id      bigint references lessons(id)       on update cascade on delete cascade,
  created_at     timestamptz not null default now(),
  constraint chk_favorites_one_target
    check (num_nonnulls(lot_id, farm_id, opportunity_id, simulation_id, lesson_id) = 1)
);
-- Unicidade por (user, alvo): índices únicos parciais (NULLs não conflitam).
create unique index ux_favorites_user_lot         on favorites (user_id, lot_id)         where lot_id         is not null;
create unique index ux_favorites_user_farm        on favorites (user_id, farm_id)        where farm_id        is not null;
create unique index ux_favorites_user_opportunity on favorites (user_id, opportunity_id) where opportunity_id is not null;
create unique index ux_favorites_user_simulation  on favorites (user_id, simulation_id)  where simulation_id  is not null;
create unique index ux_favorites_user_lesson      on favorites (user_id, lesson_id)      where lesson_id      is not null;
comment on table favorites is 'Favorito polimórfico (exclusive arc): exatamente 1 alvo por linha, cada um com FK real. Hard delete.';

-- follows (N:N user <-> farm) ----------------------------------------------
create table follows (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on update cascade on delete cascade,
  farm_id    bigint not null references farms(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, farm_id)
);
comment on table follows is 'Usuário segue fazenda (botão "Seguir"). N:N via (user_id, farm_id). Hard delete.';


-- ============================================================================
--  12. MONETIZAÇÃO
-- ============================================================================

-- subscription_plans (catálogo) --------------------------------------------
create table subscription_plans (
  id          bigint generated always as identity primary key,
  code        subscription_plan not null unique,   -- 'free' | 'pro' | 'enterprise'
  name        text   not null,                      -- 'Gratuito' | 'BTA PRO' | 'Empresa'
  price       numeric(8,2) not null default 0 check (price >= 0),  -- 0 no free; enterprise pode ser 'Consulte' (0 + flag na app)
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table subscription_plans is 'Catálogo de planos (BTA PRO). price=0 no Gratuito; Enterprise = "Consulte" (tratado na app).';

-- subscriptions ------------------------------------------------------------
create table subscriptions (
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

-- lot_boosts (Impulsionar lote, §35) ---------------------------------------
create table lot_boosts (
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

-- services (Central de Serviços) -------------------------------------------
create table services (
  id          bigint generated always as identity primary key,
  name        text   not null,
  icon        text,                  -- nome do ícone (ex.: 'truck','shield','credit-card')
  description text,
  status      service_status not null default 'soon',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table services is 'Central de Serviços (BTA Log, Seguro, Financiamento...). status available|soon.';

-- platform_settings --------------------------------------------------------
--  Config chave-valor (take rate configurável §32, e outros). value em jsonb.
create table platform_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);
comment on table platform_settings is 'Configurações da plataforma (chave-valor). Ex.: take rate configurável (§32).';
-- Seed NÃO incluído aqui (outro agente cuida do seed). Chave prevista:
--   INSERT INTO platform_settings(key, value, description)
--   VALUES ('take_rate_percent', '1.0'::jsonb, 'Comissão padrão da plataforma (%)');


-- ============================================================================
--  13. ÍNDICES (os óbvios; o postgres-dba refina depois)
-- ----------------------------------------------------------------------------
--  Postgres NÃO indexa FKs automaticamente -> indexamos as principais.
--  UNIQUE de users(email)/users(phone) já vêm das constraints de coluna.
-- ============================================================================

-- Lots: filtros/joins mais frequentes
create index ix_lots_status      on lots (status);
create index ix_lots_seller      on lots (seller_id);
create index ix_lots_category    on lots (category_id);
create index ix_lots_breed       on lots (breed_id);
create index ix_lots_purpose     on lots (purpose_id);
create index ix_lots_state       on lots (state);
create index ix_lots_score       on lots (score);
create index ix_lot_images_lot   on lot_images (lot_id);

-- Farms
create index ix_farms_owner      on farms (owner_user_id);
create index ix_farm_specialty_farm on farm_specialty (farm_id);

-- Mercado
create index ix_market_prices_category    on market_prices (category_id);
create index ix_market_points_cat_date    on market_price_points (category_id, price_date);

-- Descoberta
create index ix_opportunities_lot    on opportunities (lot_id);
create index ix_opportunities_user   on opportunities (user_id);
create index ix_radars_user_active   on radars (user_id, active);
create index ix_radar_state_radar    on radar_state (radar_id);
create index ix_match_searches_user  on match_searches (user_id);
create index ix_match_results_search on match_results (match_search_id);
create index ix_match_results_lot    on match_results (lot_id);

-- Negociação
create index ix_proposals_buyer      on proposals (buyer_user_id);
create index ix_proposals_seller     on proposals (seller_farm_id);
create index ix_proposals_lot        on proposals (lot_id);
create index ix_proposals_status     on proposals (status);
create index ix_neg_messages_proposal on negotiation_messages (proposal_id);
create index ix_transactions_buyer   on transactions (buyer_user_id);
create index ix_transactions_seller  on transactions (seller_farm_id);
create index ix_transactions_lot     on transactions (lot_id);
create index ix_transactions_status  on transactions (status);
create index ix_transaction_steps_tx on transaction_steps (transaction_id);
create index ix_transports_tx        on transports (transaction_id);
create index ix_transports_transporter on transports (transporter_id);

-- Academy
create index ix_lessons_course       on lessons (course_id);
create index ix_lesson_sections_lesson on lesson_sections (lesson_id);
create index ix_lesson_concepts_lesson on lesson_key_concepts (lesson_id);
create index ix_lesson_quiz_lesson   on lesson_quiz_questions (lesson_id);
create index ix_lesson_quiz_options_q on lesson_quiz_options (question_id);
create index ix_ucp_user             on user_course_progress (user_id);
create index ix_ucp_course           on user_course_progress (course_id);
create index ix_ulp_user             on user_lesson_progress (user_id);
create index ix_ulp_lesson           on user_lesson_progress (lesson_id);

-- Simulador
create index ix_simulations_user     on simulations (user_id);
create index ix_simulations_lot      on simulations (lot_id);

-- Engajamento
create index ix_notifications_user_read on notifications (user_id, read);
create index ix_favorites_user       on favorites (user_id);
create index ix_follows_user         on follows (user_id);
create index ix_follows_farm         on follows (farm_id);

-- Monetização
create index ix_subscriptions_user   on subscriptions (user_id);
create index ix_subscriptions_plan   on subscriptions (plan_id);
create index ix_lot_boosts_lot       on lot_boosts (lot_id);

-- Identidade
create index ix_user_preference_user on user_preference (user_id);
-- Vínculo de auth externo: único quando preenchido (nullable p/ visitantes sem cadastro).
create unique index ux_users_external_auth_id
  on users (external_auth_id) where external_auth_id is not null;


-- ============================================================================
--  14. TRIGGERS DE updated_at (tabelas mutáveis)
-- ============================================================================
create trigger trg_users_updated_at               before update on users               for each row execute function set_updated_at();
create trigger trg_farms_updated_at                before update on farms               for each row execute function set_updated_at();
create trigger trg_lots_updated_at                 before update on lots                for each row execute function set_updated_at();
create trigger trg_market_prices_updated_at        before update on market_prices       for each row execute function set_updated_at();
create trigger trg_opportunities_updated_at        before update on opportunities       for each row execute function set_updated_at();
create trigger trg_radars_updated_at               before update on radars              for each row execute function set_updated_at();
create trigger trg_proposals_updated_at            before update on proposals           for each row execute function set_updated_at();
create trigger trg_transactions_updated_at         before update on transactions        for each row execute function set_updated_at();
create trigger trg_transporters_updated_at         before update on transporters        for each row execute function set_updated_at();
create trigger trg_transports_updated_at           before update on transports          for each row execute function set_updated_at();
create trigger trg_courses_updated_at              before update on courses             for each row execute function set_updated_at();
create trigger trg_user_course_progress_updated_at before update on user_course_progress for each row execute function set_updated_at();
create trigger trg_lessons_updated_at              before update on lessons             for each row execute function set_updated_at();
create trigger trg_simulations_updated_at          before update on simulations         for each row execute function set_updated_at();
create trigger trg_subscription_plans_updated_at   before update on subscription_plans  for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at        before update on subscriptions       for each row execute function set_updated_at();
create trigger trg_lot_boosts_updated_at           before update on lot_boosts          for each row execute function set_updated_at();
create trigger trg_services_updated_at             before update on services            for each row execute function set_updated_at();
create trigger trg_platform_settings_updated_at    before update on platform_settings   for each row execute function set_updated_at();


-- ============================================================================
--  15. NOVOS DOMÍNIOS — INSUMOS, VET/VetConnect, USADOS, VÍDEOS
-- ----------------------------------------------------------------------------
--  4 áreas hoje mockadas no frontend, agora modeladas. Classificação p/ RLS
--  (o postgres-dba liga as policies; aqui só modelamos as colunas de posse):
--    * CATÁLOGO PÚBLICO (admin escreve):  insumo_category, insumo_product,
--      insumo_product_tag, supplier, supplier_offer, group_buy, used_category,
--      video_category, vet_video, vet_specialty, vet_certification,
--      vet_service, vet_availability_day. Leitura pública.
--    * CONTEÚDO DO DONO (leitura pública dos vivos + escrita do dono):
--      vet (owner_user_id, auto-claim), used_listing (seller_user_id),
--      vet_review (author_user_id).
--    * DADO PRIVADO DO USUÁRIO (só o dono lê/escreve, via user_id NOT NULL):
--      farm_stock_item, group_buy_participation, price_alert, insumo_purchase,
--      vet_appointment (sensível/financeiro), used_saved, used_contact,
--      video_like, video_save, vet_follow.
--  Enums no estilo idempotente (DO ... EXCEPTION duplicate_object), como nas
--  migrations. CHECKs nomeados chk_<tabela>_<regra>. Denormalizações mantidas
--  pela app são comentadas (padrão de farms.deals / lots.price_total).
-- ============================================================================

-- 15.a ENUMS NOVOS -----------------------------------------------------------
do $$ begin create type vet_kind             as enum ('vet', 'clinica', 'tecnico'); exception when duplicate_object then null; end $$;
do $$ begin create type vet_availability     as enum ('hoje', 'amanha', 'lotado'); exception when duplicate_object then null; end $$;
do $$ begin create type agenda_status        as enum ('on', 'partial', 'off'); exception when duplicate_object then null; end $$;
do $$ begin create type appointment_location as enum ('fazenda', 'clinica'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_method       as enum ('pix', 'cartao', 'presencial'); exception when duplicate_object then null; end $$;
do $$ begin create type appointment_status   as enum ('pendente', 'confirmado', 'cancelado', 'concluido'); exception when duplicate_object then null; end $$;
do $$ begin create type used_condition       as enum ('otimo', 'bom', 'regular'); exception when duplicate_object then null; end $$;
do $$ begin create type group_buy_status     as enum ('open', 'reached', 'ordered', 'canceled'); exception when duplicate_object then null; end $$;


-- 15.b TABELAS DE REFERÊNCIA (dimensões extensíveis por admin) ----------------
--  Padrão de cattle_category, mas com slug = id textual estável usado pelo front
--  ('vacinas','manejo','vacinacao'...) + label exibível + estilo (color/icon).

create table insumo_category (
  id            bigint generated always as identity primary key,
  slug          text   not null unique,          -- id estável do front ('vacinas','manejo',...)
  label         text   not null,                 -- rótulo exibível
  color         text,                            -- cor de UI (hex/tailwind), opcional
  icon          text,                            -- nome do ícone, opcional
  product_count integer not null default 0 constraint chk_insumo_category_product_count check (product_count >= 0),
  created_at    timestamptz not null default now()
);
comment on table  insumo_category is 'Categoria de insumo (referência). slug = id estável do front; leitura pública, admin escreve.';
comment on column insumo_category.product_count is 'DERIVADO/denormalizado: nº de insumo_product na categoria. Mantido pela aplicação (padrão farms.deals).';

create table used_category (
  id         bigint generated always as identity primary key,
  slug       text   not null unique,
  label      text   not null,
  icon       text,
  created_at timestamptz not null default now()
);
comment on table used_category is 'Categoria de anúncio de usado (referência). slug = id estável do front; leitura pública, admin escreve.';

create table video_category (
  id         bigint generated always as identity primary key,
  slug       text   not null unique,
  label      text   not null,
  icon       text,
  created_at timestamptz not null default now()
);
comment on table video_category is 'Categoria de vídeo (referência). slug = id estável do front; leitura pública, admin escreve.';


-- 15.c ÁREA 1 — INSUMOS ------------------------------------------------------

-- insumo_product (catálogo, admin) ------------------------------------------
create table insumo_product (
  id          bigint generated always as identity primary key,
  public_id   uuid   not null default gen_random_uuid() unique,  -- deep-link
  category_id bigint not null references insumo_category(id) on update cascade on delete restrict,
  name        text   not null,
  cold_chain  boolean not null default false,     -- cadeia fria ("frio")
  temp_range  text,                               -- faixa de temperatura, ex.: '2°C–8°C'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table insumo_product is 'Insumo do catálogo (vacina, medicamento, manejo...). Catálogo admin; leitura pública.';

-- insumo_product_tag (tags livres, normaliza tags[] como farm_specialty) -----
create table insumo_product_tag (
  id         bigint generated always as identity primary key,
  product_id bigint not null references insumo_product(id) on update cascade on delete cascade,
  tag        text   not null,
  created_at timestamptz not null default now(),
  unique (product_id, tag)
);
comment on table insumo_product_tag is 'Tags livres do insumo (1:N). Normaliza tags[] (padrão farm_specialty).';

-- supplier (CONTEÚDO DO DONO + catálogo admin) ------------------------------
create table supplier (
  id            bigint generated always as identity primary key,
  public_id     uuid   not null default gen_random_uuid() unique,
  owner_user_id bigint references users(id) on update cascade on delete set null,  -- dono reivindicante; NULL = fornecedor de catálogo (admin). SET NULL: sobrevive ao user
  name          text   not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
comment on table supplier is 'Fornecedor de insumos. CONTEÚDO DO DONO (owner_user_id) OU catálogo admin (owner NULL). Leitura pública dos ativos; escrita do dono (via RLS) ou do admin. Mesma família de used_listing/vet.';

-- supplier_offer (oferta de um fornecedor p/ um produto) --------------------
create table supplier_offer (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references insumo_product(id) on update cascade on delete cascade,
  supplier_id bigint not null references supplier(id)       on update cascade on delete cascade,
  preco       numeric(12,2) not null constraint chk_supplier_offer_preco  check (preco >= 0),
  frete       numeric(12,2) not null default 0 constraint chk_supplier_offer_frete check (frete >= 0),
  prazo_dias  smallint constraint chk_supplier_offer_prazo check (prazo_dias is null or prazo_dias >= 0),
  rating      numeric(3,2) constraint chk_supplier_offer_rating check (rating between 0 and 5),
  estoque     integer  constraint chk_supplier_offer_estoque check (estoque is null or estoque >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, supplier_id)
);
comment on table supplier_offer is 'Oferta de um fornecedor para um insumo (preço/frete/prazo/estoque). N:1 insumo_product, N:1 supplier.';

-- farm_stock_item (estoque da fazenda — DADO PRIVADO DO USUÁRIO) ------------
create table farm_stock_item (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id)   on update cascade on delete cascade,   -- dono do estoque
  farm_id      bigint references farms(id)            on update cascade on delete set null,
  product_id   bigint references insumo_product(id)   on update cascade on delete set null,  -- link opcional ao catálogo
  category_id  bigint references insumo_category(id)  on update cascade on delete set null,
  name         text   not null,
  quantity     numeric(12,2) not null constraint chk_farm_stock_item_quantity check (quantity >= 0),
  unit         text   not null,
  min_quantity numeric(12,2) not null default 0 constraint chk_farm_stock_item_min_quantity check (min_quantity >= 0),
  lote         text,
  validade     date,
  local        text,
  temperatura  numeric(4,1),
  unit_price   numeric(12,2) constraint chk_farm_stock_item_unit_price check (unit_price is null or unit_price >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
comment on table  farm_stock_item is 'Item de estoque da fazenda (dado privado do usuário). Alertas (crítico qty<=min, vencendo validade<=30d) são DERIVADOS por query, não colunas.';
comment on column farm_stock_item.product_id is 'Link opcional ao catálogo (insumo_product). SET NULL: o item de estoque sobrevive à remoção do produto do catálogo.';

-- group_buy (compra coletiva — PLATAFORMA/admin) ----------------------------
create table group_buy (
  id                 bigint generated always as identity primary key,
  public_id          uuid   not null default gen_random_uuid() unique,  -- deep-link
  product_id         bigint references insumo_product(id)  on update cascade on delete set null,
  category_id        bigint references insumo_category(id) on update cascade on delete set null,
  title              text   not null,
  unit               text   not null,
  qty_meta           numeric(12,2) not null constraint chk_group_buy_qty_meta check (qty_meta > 0),
  qty_current        numeric(12,2) not null default 0 constraint chk_group_buy_qty_current check (qty_current >= 0),
  participants_count integer not null default 0 constraint chk_group_buy_participants check (participants_count >= 0),
  deadline           date   not null,
  preco_base         numeric(12,2) constraint chk_group_buy_preco_base check (preco_base is null or preco_base >= 0),
  preco_grupo        numeric(12,2) constraint chk_group_buy_preco_grupo check (preco_grupo is null or preco_grupo >= 0),
  regiao             text,
  status             group_buy_status not null default 'open',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint chk_group_buy_precos check (preco_grupo is null or preco_base is null or preco_grupo <= preco_base)
);
comment on table  group_buy is 'Campanha de compra coletiva (plataforma/admin). A adesão do usuário é group_buy_participation.';
comment on column group_buy.qty_current is 'DERIVADO/denormalizado: soma das adesões (group_buy_participation.quantity). Mantido pela aplicação.';
comment on column group_buy.participants_count is 'DERIVADO/denormalizado: nº de participações. Mantido pela aplicação.';

-- group_buy_participation (adesão — DADO PRIVADO DO USUÁRIO) ----------------
create table group_buy_participation (
  id           bigint generated always as identity primary key,
  group_buy_id bigint not null references group_buy(id) on update cascade on delete cascade,
  user_id      bigint not null references users(id)     on update cascade on delete cascade,
  farm_id      bigint references farms(id)              on update cascade on delete set null,
  quantity     numeric(12,2) not null constraint chk_group_buy_participation_quantity check (quantity > 0),
  created_at   timestamptz not null default now(),
  unique (group_buy_id, user_id)
);
comment on table group_buy_participation is 'Adesão do usuário a uma compra coletiva (dado privado). 1 adesão por (campanha, usuário).';

-- price_alert (alerta de preço — DADO PRIVADO DO USUÁRIO) -------------------
create table price_alert (
  id            bigint generated always as identity primary key,
  user_id       bigint not null references users(id)  on update cascade on delete cascade,
  product_id    bigint references insumo_product(id)  on update cascade on delete set null,
  product_name  text   not null,                       -- nome livre (funciona sem link ao catálogo)
  target_price  numeric(12,2) not null constraint chk_price_alert_target check (target_price >= 0),
  current_price numeric(12,2) constraint chk_price_alert_current check (current_price is null or current_price >= 0),
  active        boolean not null default true,
  reached       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table price_alert is 'Alerta de preço-alvo de um insumo (dado privado do usuário). product_name permite alerta sem link ao catálogo.';

-- insumo_purchase (lançamento de compra — DADO PRIVADO; base dos relatórios)-
create table insumo_purchase (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id)   on update cascade on delete cascade,
  farm_id      bigint references farms(id)            on update cascade on delete set null,
  product_id   bigint references insumo_product(id)   on update cascade on delete set null,
  category_id  bigint references insumo_category(id)  on update cascade on delete set null,
  description  text,
  quantity     numeric(12,2) constraint chk_insumo_purchase_quantity check (quantity is null or quantity >= 0),
  unit         text,
  unit_price   numeric(12,2) constraint chk_insumo_purchase_unit_price check (unit_price is null or unit_price >= 0),
  total_amount numeric(14,2) not null constraint chk_insumo_purchase_total check (total_amount >= 0),
  purchased_at date   not null default current_date,
  created_at   timestamptz not null default now()
);
comment on table  insumo_purchase is 'Lançamento de compra de insumo (dado privado). Base dos relatórios de gasto: agregados por query, NÃO guardamos totais mensais prontos.';
comment on column insumo_purchase.total_amount is 'Total do lançamento (BRL). EXPLÍCITO (não generated): permite frete/impostos/outros além de quantity*unit_price.';


-- 15.d ÁREA 2 — VET / VetConnect ---------------------------------------------
--  Ordem de criação p/ FKs cruzadas: vet -> filhas -> vet_appointment ->
--  vet_review (que referencia vet_appointment). Sem FK circular real.

-- vet (catálogo + auto-claim futuro — CONTEÚDO DO DONO quando reivindicado) --
create table vet (
  id               bigint generated always as identity primary key,
  public_id        uuid   not null default gen_random_uuid() unique,
  owner_user_id    bigint references users(id) on update cascade on delete set null,  -- auto-claim futuro; vet sobrevive ao user
  name             text   not null,
  kind             vet_kind not null,
  kind_label       text,                            -- rótulo livre (mock tipoLabel)
  verified         boolean not null default false,
  city             text,
  uf               text   constraint chk_vet_uf check (uf is null or char_length(uf) = 2),
  distance         numeric(7,2),                    -- referência; geo real fica p/ depois [GEO]
  rating           numeric(3,2) constraint chk_vet_rating check (rating between 0 and 5),
  reviews_count    integer not null default 0 constraint chk_vet_reviews_count check (reviews_count >= 0),
  years_experience smallint constraint chk_vet_years check (years_experience is null or years_experience >= 0),
  formacao         text,
  photo_url        text,
  cover_url        text,
  price_label      text,
  availability     vet_availability,
  response_time    text,
  about            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
comment on table  vet is 'Profissional/clínica veterinária (catálogo admin com auto-claim futuro). owner_user_id nullable: o dono reivindica e edita o próprio perfil (padrão farms.owner).';
comment on column vet.distance is 'Valor de REFERÊNCIA (geo real por usuário fica p/ depois). Mesma ressalva de lots.distance. [GEO]';
comment on column vet.reviews_count is 'DERIVADO/denormalizado: nº de vet_review. Mantido pela aplicação.';

-- vet_specialty (tags livres) -----------------------------------------------
create table vet_specialty (
  id         bigint generated always as identity primary key,
  vet_id     bigint not null references vet(id) on update cascade on delete cascade,
  specialty  text   not null,
  created_at timestamptz not null default now(),
  unique (vet_id, specialty)
);
comment on table vet_specialty is 'Especialidades do vet (tags livres, 1:N). Padrão farm_specialty.';

-- vet_certification ----------------------------------------------------------
create table vet_certification (
  id          bigint generated always as identity primary key,
  vet_id      bigint not null references vet(id) on update cascade on delete cascade,
  title       text   not null,
  institution text,
  year_label  text,                               -- ano livre, ex.: 'válido até 2028'
  icon        text,
  position    smallint not null default 0,
  created_at  timestamptz not null default now(),
  unique (vet_id, position)
);
comment on table vet_certification is 'Certificações/formações do vet (ordenadas por position). 1:N.';

-- vet_service (serviço ofertado; agendamento referencia isto) ----------------
create table vet_service (
  id             bigint generated always as identity primary key,
  public_id      uuid   not null default gen_random_uuid() unique,
  vet_id         bigint not null references vet(id) on update cascade on delete cascade,
  name           text   not null,
  price_label    text,                             -- exibição livre, ex.: 'R$ 8,00/cabeça'
  price_amount   numeric(12,2) constraint chk_vet_service_price check (price_amount is null or price_amount >= 0),
  price_unit     text,
  per_head       boolean not null default false,   -- se o preço é por cabeça
  duration_label text,
  icon           text,
  position       smallint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (vet_id, position),
  unique (id, vet_id)          -- alvo da FK composta de vet_appointment (garante serviço∈vet)
);
comment on table vet_service is 'Serviço ofertado por um vet. vet_appointment referencia por FK COMPOSTA (id, vet_id) p/ garantir que o serviço pertence ao vet do agendamento (RESTRICT preserva histórico).';

-- vet_availability_day (agenda semanal) --------------------------------------
create table vet_availability_day (
  id          bigint generated always as identity primary key,
  vet_id      bigint not null references vet(id) on update cascade on delete cascade,
  weekday     smallint not null constraint chk_vet_availability_day_weekday check (weekday between 0 and 6),
  day_label   text,
  status      agenda_status,
  hours_label text,
  created_at  timestamptz not null default now(),
  unique (vet_id, weekday)
);
comment on table vet_availability_day is 'Agenda semanal do vet (0=domingo..6=sábado). 1 linha por (vet, weekday).';

-- vet_appointment (agendamento — DADO PRIVADO/FINANCEIRO/SENSÍVEL) -----------
create table vet_appointment (
  id             bigint generated always as identity primary key,
  public_id      uuid   not null default gen_random_uuid() unique,
  user_id        bigint not null references users(id)       on update cascade on delete cascade,   -- o cliente
  vet_id         bigint not null references vet(id)         on update cascade on delete restrict,  -- preserva histórico
  service_id     bigint not null,                           -- FK COMPOSTA (service_id, vet_id) abaixo — garante serviço∈vet
  scheduled_at   timestamptz not null,
  location       appointment_location not null,
  animal_count   integer constraint chk_vet_appointment_animal_count check (animal_count is null or animal_count > 0),
  payment_method payment_method not null,
  subtotal       numeric(14,2) not null constraint chk_vet_appointment_subtotal check (subtotal >= 0),
  travel_fee     numeric(14,2) not null default 0 constraint chk_vet_appointment_travel_fee check (travel_fee >= 0),
  pix_discount   numeric(14,2) not null default 0 constraint chk_vet_appointment_pix_discount check (pix_discount >= 0),
  total          numeric(14,2) generated always as (subtotal + travel_fee - pix_discount) stored,
  status         appointment_status not null default 'pendente',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint chk_vet_appointment_total_nonneg check (subtotal + travel_fee - pix_discount >= 0),  -- desconto pix nunca > (subtotal+frete)
  constraint fk_vet_appointment_service foreign key (service_id, vet_id)
    references vet_service (id, vet_id) on update cascade on delete restrict  -- serviço DEVE pertencer ao vet do agendamento
);
comment on table  vet_appointment is 'Agendamento veterinário — a tabela MAIS SENSÍVEL do domínio (dado financeiro/pessoal do usuário). FK RESTRICT p/ vet e vet_service preserva o histórico financeiro.';
comment on column vet_appointment.total is 'DENORMALIZADO (generated stored) = subtotal + travel_fee - pix_discount. Dinheiro canônico do agendamento (padrão dos generated do projeto).';

-- vet_review (avaliação — CONTEÚDO DO DONO/AUTOR; leitura pública) -----------
--  Criada APÓS vet_appointment (FK appointment_id) — sem circularidade real.
create table vet_review (
  id             bigint generated always as identity primary key,
  vet_id         bigint not null references vet(id)             on update cascade on delete cascade,
  author_user_id bigint references users(id)                   on update cascade on delete set null,
  appointment_id bigint references vet_appointment(id)         on update cascade on delete set null,
  author_name    text,
  review_date    date,
  rating         smallint not null constraint chk_vet_review_rating check (rating between 1 and 5),
  comment        text,
  service_label  text,
  created_at     timestamptz not null default now()
);
-- 1 review por agendamento (quando vinculado); múltiplos NULL não conflitam.
create unique index ux_vet_review_appointment on vet_review (appointment_id) where appointment_id is not null;
comment on table vet_review is 'Avaliação de um vet. Leitura pública; escrita do autor (RLS pelo DBA). 1 review por vet_appointment quando vinculada.';


-- 15.e ÁREA 3 — USADOS -------------------------------------------------------

-- used_listing (anúncio de usado — CONTEÚDO DO DONO; leitura pública) --------
create table used_listing (
  id             bigint generated always as identity primary key,
  public_id      uuid   not null default gen_random_uuid() unique,  -- deep-link
  seller_user_id bigint references users(id)              on update cascade on delete set null,  -- dono; anúncio sobrevive ao user (e p/ seed)
  category_id    bigint not null references used_category(id) on update cascade on delete restrict,
  title          text   not null,
  price          numeric(14,2) not null constraint chk_used_listing_price check (price >= 0),
  condition      used_condition,
  city           text,
  uf             text   constraint chk_used_listing_uf check (uf is null or char_length(uf) = 2),
  distance       numeric(7,2),                    -- referência [GEO]
  photo_url      text,
  description    text,
  views          integer not null default 0 constraint chk_used_listing_views check (views >= 0),
  seller_name    text,                            -- nome livre (mock) quando sem user vinculado
  seller_rating  numeric(3,2) constraint chk_used_listing_seller_rating check (seller_rating between 0 and 5),
  featured       boolean not null default false,  -- destaque
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
comment on table  used_listing is 'Anúncio de equipamento/insumo usado (conteúdo do dono). Leitura pública dos vivos; escrita do dono (RLS pelo DBA). seller_user_id nullable p/ seed e p/ sobreviver à exclusão do dono.';
comment on column used_listing.views is 'DERIVADO/denormalizado: nº de visualizações. Mantido pela aplicação.';

-- used_saved (salvos — DADO PRIVADO DO USUÁRIO) -----------------------------
create table used_saved (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)        on update cascade on delete cascade,
  listing_id bigint not null references used_listing(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
comment on table used_saved is 'Anúncio de usado salvo pelo usuário (dado privado). 1 por (usuário, anúncio). Hard delete.';

-- used_contact (contato registrado — DADO PRIVADO DO USUÁRIO) ---------------
create table used_contact (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)        on update cascade on delete cascade,
  listing_id bigint not null references used_listing(id) on update cascade on delete cascade,
  message    text,
  created_at timestamptz not null default now()
);
comment on table used_contact is 'Contato do usuário com o anunciante (dado privado). Pode repetir (sem unique). Hard delete.';


-- 15.f ÁREA 4 — VÍDEOS -------------------------------------------------------

-- vet_video (catálogo de vídeos, admin; autor opcional em vet) ---------------
create table vet_video (
  id                bigint generated always as identity primary key,
  public_id         uuid   not null default gen_random_uuid() unique,  -- deep-link
  category_id       bigint not null references video_category(id) on update cascade on delete restrict,
  vet_id            bigint references vet(id)                     on update cascade on delete set null,  -- autor se existir no catálogo de vets
  author_name       text,                            -- ex.: 'Dr. Fernando Melo'
  author_credential text,                            -- ex.: CRMV
  title             text   not null,
  description       text,
  thumb_url         text,
  video_url         text,
  duration_label    text,                            -- ex.: '14:32'
  duration_seconds  integer constraint chk_vet_video_duration check (duration_seconds is null or duration_seconds >= 0),
  views             integer not null default 0 constraint chk_vet_video_views check (views >= 0),
  likes_count       integer not null default 0 constraint chk_vet_video_likes check (likes_count >= 0),
  saves_count       integer not null default 0 constraint chk_vet_video_saves check (saves_count >= 0),
  featured          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
comment on table  vet_video is 'Vídeo educativo do catálogo (admin). Leitura pública. vet_id liga ao autor no catálogo de vets (SET NULL se o vet sair).';
comment on column vet_video.views is 'DERIVADO/denormalizado (views/likes_count/saves_count): stats mantidos pela aplicação.';

-- video_like (DADO PRIVADO DO USUÁRIO) --------------------------------------
create table video_like (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)     on update cascade on delete cascade,
  video_id   bigint not null references vet_video(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);
comment on table video_like is 'Like do usuário em um vídeo (dado privado). 1 por (usuário, vídeo). Hard delete.';

-- video_save (DADO PRIVADO DO USUÁRIO) --------------------------------------
create table video_save (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id)     on update cascade on delete cascade,
  video_id   bigint not null references vet_video(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);
comment on table video_save is 'Vídeo salvo pelo usuário (dado privado). 1 por (usuário, vídeo). Hard delete.';

-- vet_follow (seguir vet — DADO PRIVADO DO USUÁRIO) -------------------------
create table vet_follow (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on update cascade on delete cascade,
  vet_id     bigint not null references vet(id)   on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vet_id)
);
comment on table vet_follow is 'Usuário segue um vet (dado privado). 1 por (usuário, vet). Hard delete (padrão follows).';


-- 15.g ÍNDICES DE PERFORMANCE (novos domínios) -------------------------------
--  Cobrem os filtros/joins do app. OMITIDOS de propósito os índices
--  single-column cuja coluna já é LÍDER de um UNIQUE composto (redundantes,
--  como o dba_hardening documenta): supplier_offer(product_id) [ux product_id,
--  supplier_id]; group_buy_participation(group_buy_id) [ux group_buy_id,
--  user_id]; vet_service(vet_id) [ux vet_id, position]; used_saved(user_id),
--  video_like(user_id), video_save(user_id), vet_follow(user_id) [ux user_id,
--  <alvo>]. Indexamos apenas a coluna NÃO-líder de cada junction.

-- Insumos
create index ix_insumo_product_category      on insumo_product (category_id);
create index ix_supplier_owner               on supplier (owner_user_id);   -- "meu perfil de fornecedor" (dono)
create index ix_supplier_offer_supplier      on supplier_offer (supplier_id);
create index ix_farm_stock_item_user         on farm_stock_item (user_id);
create index ix_farm_stock_item_validade     on farm_stock_item (validade);
create index ix_group_buy_status             on group_buy (status);
create index ix_group_buy_deadline           on group_buy (deadline);
create index ix_group_buy_participation_user on group_buy_participation (user_id);
create index ix_price_alert_user             on price_alert (user_id);
create index ix_insumo_purchase_user_date    on insumo_purchase (user_id, purchased_at);

-- Vet
create index ix_vet_uf                       on vet (uf);
create index ix_vet_kind                     on vet (kind);
create index ix_vet_owner                    on vet (owner_user_id);
create index ix_vet_appointment_user         on vet_appointment (user_id);
create index ix_vet_appointment_vet          on vet_appointment (vet_id);
create index ix_vet_appointment_scheduled    on vet_appointment (scheduled_at);
create index ix_vet_review_vet               on vet_review (vet_id);
create index ix_vet_review_author            on vet_review (author_user_id);

-- Usados
create index ix_used_listing_category        on used_listing (category_id);
create index ix_used_listing_uf              on used_listing (uf);
create index ix_used_listing_featured        on used_listing (featured);
create index ix_used_listing_seller          on used_listing (seller_user_id);
create index ix_used_saved_listing           on used_saved (listing_id);
create index ix_used_contact_user            on used_contact (user_id);
create index ix_used_contact_listing         on used_contact (listing_id);

-- Vídeos
create index ix_vet_video_category           on vet_video (category_id);
create index ix_vet_video_vet                on vet_video (vet_id);
create index ix_vet_video_featured           on vet_video (featured);
create index ix_video_like_video             on video_like (video_id);
create index ix_video_save_video             on video_save (video_id);
create index ix_vet_follow_vet               on vet_follow (vet_id);


-- 15.h TRIGGERS DE updated_at (novas tabelas mutáveis) -----------------------
create trigger trg_insumo_product_updated_at  before update on insumo_product  for each row execute function set_updated_at();
create trigger trg_supplier_updated_at        before update on supplier        for each row execute function set_updated_at();
create trigger trg_supplier_offer_updated_at  before update on supplier_offer  for each row execute function set_updated_at();
create trigger trg_farm_stock_item_updated_at before update on farm_stock_item for each row execute function set_updated_at();
create trigger trg_group_buy_updated_at       before update on group_buy       for each row execute function set_updated_at();
create trigger trg_price_alert_updated_at     before update on price_alert     for each row execute function set_updated_at();
create trigger trg_vet_updated_at             before update on vet             for each row execute function set_updated_at();
create trigger trg_vet_service_updated_at     before update on vet_service     for each row execute function set_updated_at();
create trigger trg_vet_appointment_updated_at before update on vet_appointment for each row execute function set_updated_at();
create trigger trg_used_listing_updated_at    before update on used_listing    for each row execute function set_updated_at();
create trigger trg_vet_video_updated_at       before update on vet_video       for each row execute function set_updated_at();


-- 15.i MANUTENÇÃO DE CONTADORES DENORMALIZADOS (SECURITY DEFINER) -------------
--  PROBLEMA: os contadores denormalizados abaixo são incrementados por uma
--  AÇÃO DE OUTRO USUÁRIO (ou por não-donos), e o modelo de segurança (RLS de
--  dono + DML de catálogo revogado de bta_app no dba_hardening) BLOQUEIA essa
--  escrita — se deixássemos a app fazê-la, os contadores travariam em zero OU
--  seria preciso afrouxar a RLS (reabrindo o buraco).
--  SOLUÇÃO: funções SECURITY DEFINER (rodam como o OWNER das tabelas, que NÃO é
--  sujeito a RLS e tem DML pleno). `search_path = public` fixo evita sequestro
--  de search_path (boa prática obrigatória em SECURITY DEFINER). São o ÚNICO
--  caminho de escrita nesses contadores — a app só dispara os inserts/deletes
--  nas tabelas-filhas (que a RLS já autoriza para o dono).
--
--  Contadores mantidos:
--    group_buy.qty_current / participants_count   <- group_buy_participation
--    vet.reviews_count                            <- vet_review
--    vet_video.likes_count                        <- video_like
--    vet_video.saves_count                        <- video_save
--    used_listing.views / vet_video.views         <- funções de "view bump" (a app chama)

-- group_buy: adesões somam quantidade e nº de participantes -------------------
create or replace function trg_group_buy_participation_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update group_buy
       set qty_current        = qty_current + new.quantity,
           participants_count = participants_count + 1
     where id = new.group_buy_id;
    return new;
  elsif tg_op = 'UPDATE' then
    -- só a quantidade muda na prática (group_buy_id é estável); ajusta o delta.
    update group_buy
       set qty_current = greatest(0, qty_current - old.quantity + new.quantity)
     where id = new.group_buy_id;
    return new;
  else -- DELETE
    update group_buy
       set qty_current        = greatest(0, qty_current - old.quantity),
           participants_count = greatest(0, participants_count - 1)
     where id = old.group_buy_id;
    return old;
  end if;
end;
$$;
comment on function trg_group_buy_participation_counts() is
  'SECURITY DEFINER: mantém group_buy.qty_current/participants_count a partir de group_buy_participation (a app não tem DML no catálogo group_buy).';

create trigger trg_gbp_counts
  after insert or update or delete on group_buy_participation
  for each row execute function trg_group_buy_participation_counts();

-- vet.reviews_count a partir de vet_review -----------------------------------
create or replace function trg_vet_reviews_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update vet set reviews_count = reviews_count + 1 where id = new.vet_id;
    return new;
  else -- DELETE
    update vet set reviews_count = greatest(0, reviews_count - 1) where id = old.vet_id;
    return old;
  end if;
end;
$$;
comment on function trg_vet_reviews_count() is
  'SECURITY DEFINER: mantém vet.reviews_count a partir de vet_review (o autor da review não é o dono do vet; a RLS de escrita de vet negaria o UPDATE).';

create trigger trg_vet_review_count
  after insert or delete on vet_review
  for each row execute function trg_vet_reviews_count();

-- vet_video.likes_count / saves_count a partir de video_like / video_save ----
create or replace function trg_video_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update vet_video set likes_count = likes_count + 1 where id = new.video_id;
    return new;
  else
    update vet_video set likes_count = greatest(0, likes_count - 1) where id = old.video_id;
    return old;
  end if;
end;
$$;
comment on function trg_video_like_count() is
  'SECURITY DEFINER: mantém vet_video.likes_count a partir de video_like (vet_video é catálogo; app sem DML).';

create trigger trg_video_like_count_t
  after insert or delete on video_like
  for each row execute function trg_video_like_count();

create or replace function trg_video_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update vet_video set saves_count = saves_count + 1 where id = new.video_id;
    return new;
  else
    update vet_video set saves_count = greatest(0, saves_count - 1) where id = old.video_id;
    return old;
  end if;
end;
$$;
comment on function trg_video_save_count() is
  'SECURITY DEFINER: mantém vet_video.saves_count a partir de video_save.';

create trigger trg_video_save_count_t
  after insert or delete on video_save
  for each row execute function trg_video_save_count();

-- insumo_category.product_count a partir de insumo_product --------------------
--  product_count é o nº de produtos do catálogo por categoria (badge "N itens").
--  insumo_product é catálogo admin; ambas as tabelas são escritas por admin, mas
--  usamos SECURITY DEFINER por consistência (e p/ o caso de manutenção via app).
create or replace function trg_insumo_product_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update insumo_category set product_count = product_count + 1 where id = new.category_id;
    return new;
  elsif tg_op = 'DELETE' then
    update insumo_category set product_count = greatest(0, product_count - 1) where id = old.category_id;
    return old;
  else -- UPDATE: produto trocou de categoria
    if new.category_id is distinct from old.category_id then
      update insumo_category set product_count = greatest(0, product_count - 1) where id = old.category_id;
      update insumo_category set product_count = product_count + 1              where id = new.category_id;
    end if;
    return new;
  end if;
end;
$$;
comment on function trg_insumo_product_count() is
  'SECURITY DEFINER: mantém insumo_category.product_count = nº de insumo_product da categoria. Substitui o set manual do seed.';

create trigger trg_insumo_product_count_t
  after insert or update or delete on insumo_product
  for each row execute function trg_insumo_product_count();

-- vet_review: só após agendamento CONCLUÍDO (anti-spam + fecha furo #2) --------
--  Um usuário só pode avaliar um vet se tiver um vet_appointment 'concluido'
--  DELE (author_user_id) para AQUELE vet, referenciado por appointment_id — o
--  que também garante que o appointment pertence ao mesmo vet da review (furo #2
--  do QA). Reviews CURADAS pelo admin/seed (author_user_id NULL) são permitidas
--  (catálogo). SECURITY DEFINER p/ ler vet_appointment de forma confiável apesar
--  da RLS (a checagem confere user_id = author explicitamente).
create or replace function trg_vet_review_requires_completed_appt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author_user_id is null then
    return new;  -- review curada por admin/seed
  end if;
  if new.appointment_id is null then
    raise exception 'vet_review: avaliacao de usuario exige appointment_id de um agendamento CONCLUIDO (anti-spam).'
      using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from vet_appointment a
    where a.id = new.appointment_id
      and a.user_id = new.author_user_id
      and a.vet_id  = new.vet_id
      and a.status  = 'concluido'
      and a.deleted_at is null
  ) then
    raise exception 'vet_review: appointment % nao e um agendamento CONCLUIDO do autor % para o vet % (anti-spam / furo #2).',
      new.appointment_id, new.author_user_id, new.vet_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
comment on function trg_vet_review_requires_completed_appt() is
  'SECURITY DEFINER: só permite vet_review de usuário (author_user_id NOT NULL) se houver vet_appointment concluído do mesmo autor para o mesmo vet (anti-spam + garante vet do appointment = vet da review).';

create trigger trg_vet_review_requires_appt
  before insert on vet_review
  for each row execute function trg_vet_review_requires_completed_appt();

-- VIEW BUMP: contagem de visualizações (a app chama; não há tabela-filha) -----
--  used_listing.views e vet_video.views crescem quando QUALQUER usuário abre o
--  item — quem vê não é o dono, então a RLS/privilégio negaria o UPDATE direto.
--  Expostas como funções SECURITY DEFINER que só incrementam +1 uma linha viva.
--  REVOKE de PUBLIC + GRANT a bta_app/bta_admin (privilégio mínimo).
create or replace function bump_used_listing_views(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update used_listing set views = views + 1 where id = p_id and deleted_at is null;
$$;
comment on function bump_used_listing_views(bigint) is
  'SECURITY DEFINER: incrementa used_listing.views (+1) de um anúncio vivo. Único caminho da app para contar visualização (RLS de escrita é do dono).';

create or replace function bump_vet_video_views(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update vet_video set views = views + 1 where id = p_id and deleted_at is null;
$$;
comment on function bump_vet_video_views(bigint) is
  'SECURITY DEFINER: incrementa vet_video.views (+1) de um vídeo vivo. Único caminho da app (vet_video é catálogo, sem DML p/ bta_app).';

--  NOTA: por padrão, funções nascem com EXECUTE para PUBLIC — logo bta_app já
--  consegue chamar bump_used_listing_views/bump_vet_video_views. O endurecimento
--  de privilégio mínimo (REVOKE de PUBLIC + GRANT só a bta_app/bta_admin) fica em
--  dba_hardening.sql (seção 7d), pois lá os roles já existem (schema.sql/migrations
--  rodam ANTES da criação dos roles).

-- FIM do schema.sql
