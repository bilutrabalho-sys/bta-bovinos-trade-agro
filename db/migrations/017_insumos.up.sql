-- ============================================================================
--  017 · Área 1 — INSUMOS (seção 15.c do schema).
-- ----------------------------------------------------------------------------
--  Enum group_buy_status; tabelas insumo_category, insumo_product,
--  insumo_product_tag, supplier, supplier_offer, farm_stock_item, group_buy,
--  group_buy_participation, price_alert, insumo_purchase.
--  Índices ÚNICOS de negócio ficam junto da tabela (uniques de tag/oferta/
--  adesão); os ix_* de performance moram na 021. Triggers de updated_at das
--  tabelas mutáveis ao final.
--  Depende de: 001 (set_updated_at), 004 (users), 005 (farms).
--  Enum idempotente (DO ... EXCEPTION duplicate_object). CHECKs nomeados
--  chk_<tabela>_<regra>. Denormalizações mantidas pela app são comentadas.
-- ============================================================================
begin;

-- Enum -----------------------------------------------------------------------
do $$ begin create type group_buy_status     as enum ('open', 'reached', 'ordered', 'canceled'); exception when duplicate_object then null; end $$;

-- insumo_category (referência; dimensão extensível por admin) -----------------
--  Padrão de cattle_category, mas com slug = id textual estável usado pelo front
--  ('vacinas','manejo','vacinacao'...) + label exibível + estilo (color/icon).
create table if not exists insumo_category (
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

-- insumo_product (catálogo, admin) ------------------------------------------
create table if not exists insumo_product (
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
create table if not exists insumo_product_tag (
  id         bigint generated always as identity primary key,
  product_id bigint not null references insumo_product(id) on update cascade on delete cascade,
  tag        text   not null,
  created_at timestamptz not null default now(),
  unique (product_id, tag)
);
comment on table insumo_product_tag is 'Tags livres do insumo (1:N). Normaliza tags[] (padrão farm_specialty).';

-- supplier (CONTEÚDO DO DONO + catálogo admin) ------------------------------
create table if not exists supplier (
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
create table if not exists supplier_offer (
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
create table if not exists farm_stock_item (
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
create table if not exists group_buy (
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
create table if not exists group_buy_participation (
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
create table if not exists price_alert (
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
create table if not exists insumo_purchase (
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

-- Triggers de updated_at (tabelas mutáveis desta área) -----------------------
drop trigger if exists trg_insumo_product_updated_at  on insumo_product;
create trigger trg_insumo_product_updated_at  before update on insumo_product  for each row execute function set_updated_at();

drop trigger if exists trg_supplier_updated_at        on supplier;
create trigger trg_supplier_updated_at        before update on supplier        for each row execute function set_updated_at();

drop trigger if exists trg_supplier_offer_updated_at  on supplier_offer;
create trigger trg_supplier_offer_updated_at  before update on supplier_offer  for each row execute function set_updated_at();

drop trigger if exists trg_farm_stock_item_updated_at on farm_stock_item;
create trigger trg_farm_stock_item_updated_at before update on farm_stock_item for each row execute function set_updated_at();

drop trigger if exists trg_group_buy_updated_at       on group_buy;
create trigger trg_group_buy_updated_at       before update on group_buy       for each row execute function set_updated_at();

drop trigger if exists trg_price_alert_updated_at     on price_alert;
create trigger trg_price_alert_updated_at     before update on price_alert     for each row execute function set_updated_at();

commit;
