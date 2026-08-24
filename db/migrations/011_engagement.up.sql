-- ============================================================================
--  011 · Engajamento (seção 11): notifications, favorites, follows.
--  Depende de: 002 (notification_type), 004 (users), 005 (lots, farms),
--  007 (opportunities), 009 (lessons), 010 (simulations), 008 (proposals).
--  favorites usa EXCLUSIVE ARC + 5 índices únicos parciais (mantidos aqui,
--  junto da tabela, não na 013).
-- ============================================================================
begin;

-- notifications --------------------------------------------------------------
--  FKs opcionais para a entidade relacionada (lot/proposal). Hard delete.
create table if not exists notifications (
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

-- favorites (polimórfico via EXCLUSIVE ARC) ----------------------------------
--  Exatamente UMA coluna-alvo preenchida (num_nonnulls = 1). Cada alvo tem FK
--  real, preservando integridade referencial (impossível num type+id puro).
create table if not exists favorites (
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
create unique index if not exists ux_favorites_user_lot         on favorites (user_id, lot_id)         where lot_id         is not null;
create unique index if not exists ux_favorites_user_farm        on favorites (user_id, farm_id)        where farm_id        is not null;
create unique index if not exists ux_favorites_user_opportunity on favorites (user_id, opportunity_id) where opportunity_id is not null;
create unique index if not exists ux_favorites_user_simulation  on favorites (user_id, simulation_id)  where simulation_id  is not null;
create unique index if not exists ux_favorites_user_lesson      on favorites (user_id, lesson_id)      where lesson_id      is not null;
comment on table favorites is 'Favorito polimórfico (exclusive arc): exatamente 1 alvo por linha, cada um com FK real. Hard delete.';

-- follows (N:N user <-> farm) ------------------------------------------------
create table if not exists follows (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on update cascade on delete cascade,
  farm_id    bigint not null references farms(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, farm_id)
);
comment on table follows is 'Usuário segue fazenda (botão "Seguir"). N:N via (user_id, farm_id). Hard delete.';

commit;
