-- ============================================================================
--  008 · Fluxo de negociação (seção 8): proposals, negotiation_messages,
--        transactions, transaction_steps, transporters, transports.
--  Depende de: 002 (price_unit, proposal_status, transaction_status,
--  transport_status, message_sender), 004 (users), 005 (lots, farms).
--  Inclui a generated column transactions.fee_amount.
-- ============================================================================
begin;

-- proposals ------------------------------------------------------------------
create table if not exists proposals (
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

-- negotiation_messages (ChatMessage) -----------------------------------------
create table if not exists negotiation_messages (
  id          bigint generated always as identity primary key,
  proposal_id bigint not null references proposals(id) on update cascade on delete cascade,
  sender      message_sender not null,        -- 'buyer' | 'seller' (mock ChatMessage.from)
  text        text   not null,
  sent_at     timestamptz not null default now()   -- mapeia ChatMessage.time
);
comment on table negotiation_messages is 'Mensagens do chat de negociação (ChatMessage). N:1 proposals. Hard delete (efêmero).';

-- transactions (Negócio Fechado / Deal) --------------------------------------
create table if not exists transactions (
  id             bigint generated always as identity primary key,
  lot_id         bigint not null references lots(id)      on update cascade on delete restrict,
  buyer_user_id  bigint not null references users(id)     on update cascade on delete restrict,
  seller_farm_id bigint not null references farms(id)     on update cascade on delete restrict,
  proposal_id    bigint references proposals(id)          on update cascade on delete set null,
  quantity       integer not null check (quantity > 0),
  agreed_price   numeric(8,2) not null check (agreed_price >= 0),
  price_unit     price_unit not null,
  -- weight_snapshot: peso (kg) do lote congelado no fechamento p/ auditoria de
  -- total_value em '/@' (recomendação postgres-dba). Obrigatório em '/@' via
  -- constraint chk_tx_weight_snapshot_for_arroba; dispensável em '/cab'.
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
comment on column transactions.total_value is 'Valor total acordado (BRL). Calculado pela app: p/ ''/@'' usa o peso do lote no momento do fechamento.';
comment on column transactions.weight_snapshot is 'Peso médio (kg) do lote congelado no fechamento. Base de auditoria de total_value p/ ''/@''. Preenchido pela app.';
comment on column transactions.fee_amount is 'DENORMALIZADO (generated): total_value * fee_percent/100. Comissão da plataforma.';

-- transaction_steps (timeline da tela "Negócio Fechado") ---------------------
create table if not exists transaction_steps (
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

-- transporters ---------------------------------------------------------------
create table if not exists transporters (
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

-- transports (BTA Log) -------------------------------------------------------
create table if not exists transports (
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

commit;
