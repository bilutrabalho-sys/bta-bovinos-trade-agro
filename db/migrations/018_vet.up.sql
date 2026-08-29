-- ============================================================================
--  018 · Área 2 — VET / VetConnect (seção 15.d do schema).
-- ----------------------------------------------------------------------------
--  Enums vet_kind, vet_availability, agenda_status, appointment_location,
--  payment_method, appointment_status; tabelas vet, vet_specialty,
--  vet_certification, vet_service, vet_availability_day, vet_appointment,
--  vet_review. Ordem de criação p/ FKs cruzadas: vet -> filhas ->
--  vet_appointment -> vet_review (que referencia vet_appointment). Sem FK
--  circular real.
--  O índice único ux_vet_review_appointment fica junto de vet_review; os ix_*
--  de performance moram na 021. Triggers de updated_at ao final.
--  Depende de: 001 (set_updated_at), 004 (users).
--  Enums idempotentes (DO ... EXCEPTION duplicate_object). CHECKs nomeados.
-- ============================================================================
begin;

-- Enums ----------------------------------------------------------------------
do $$ begin create type vet_kind             as enum ('vet', 'clinica', 'tecnico'); exception when duplicate_object then null; end $$;
do $$ begin create type vet_availability     as enum ('hoje', 'amanha', 'lotado'); exception when duplicate_object then null; end $$;
do $$ begin create type agenda_status        as enum ('on', 'partial', 'off'); exception when duplicate_object then null; end $$;
do $$ begin create type appointment_location as enum ('fazenda', 'clinica'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_method       as enum ('pix', 'cartao', 'presencial'); exception when duplicate_object then null; end $$;
do $$ begin create type appointment_status   as enum ('pendente', 'confirmado', 'cancelado', 'concluido'); exception when duplicate_object then null; end $$;

-- vet (catálogo + auto-claim futuro — CONTEÚDO DO DONO quando reivindicado) --
create table if not exists vet (
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
create table if not exists vet_specialty (
  id         bigint generated always as identity primary key,
  vet_id     bigint not null references vet(id) on update cascade on delete cascade,
  specialty  text   not null,
  created_at timestamptz not null default now(),
  unique (vet_id, specialty)
);
comment on table vet_specialty is 'Especialidades do vet (tags livres, 1:N). Padrão farm_specialty.';

-- vet_certification ----------------------------------------------------------
create table if not exists vet_certification (
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
create table if not exists vet_service (
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
create table if not exists vet_availability_day (
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
create table if not exists vet_appointment (
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
create table if not exists vet_review (
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
create unique index if not exists ux_vet_review_appointment on vet_review (appointment_id) where appointment_id is not null;
comment on table vet_review is 'Avaliação de um vet. Leitura pública; escrita do autor (RLS pelo DBA). 1 review por vet_appointment quando vinculada.';

-- Triggers de updated_at (tabelas mutáveis desta área) -----------------------
drop trigger if exists trg_vet_updated_at             on vet;
create trigger trg_vet_updated_at             before update on vet             for each row execute function set_updated_at();

drop trigger if exists trg_vet_service_updated_at     on vet_service;
create trigger trg_vet_service_updated_at     before update on vet_service     for each row execute function set_updated_at();

drop trigger if exists trg_vet_appointment_updated_at on vet_appointment;
create trigger trg_vet_appointment_updated_at before update on vet_appointment for each row execute function set_updated_at();

commit;
