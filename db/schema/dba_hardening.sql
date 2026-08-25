-- ============================================================================
--  BTA — Bovinos Trade Agro
--  dba_hardening.sql — Endurecimento operacional (DBA)
-- ----------------------------------------------------------------------------
--  Rode DEPOIS de schema.sql. Este arquivo NÃO reescreve o schema base:
--  apenas ADICIONA índices, constraints, RLS, roles/grants, parâmetros de
--  storage e templates opcionais (particionamento, geo, cache de distância).
--
--  Idempotente: pode rodar mais de uma vez sem erro (IF NOT EXISTS,
--  CREATE OR REPLACE, DROP POLICY IF EXISTS + CREATE, DO-guards em constraints).
--
--  Quem roda o quê:
--    * Migrations/seed: rodam como o OWNER das tabelas (ou bta_admin) — o owner
--      NÃO é afetado por RLS (não usamos FORCE), então o seed continua funcionando.
--    * Aplicação: conecta como um login membro de bta_app (sujeito a RLS).
--    * BI/analytics: conecta como membro de bta_readonly (BYPASSRLS, só SELECT).
--
--  ATENÇÃO (RLS): a seção 6 muda o comportamento de leitura para o role da app.
--  Ela SÓ funciona se o backend setar o GUC de sessão a cada transação:
--        SET LOCAL app.current_user_id = '<id do usuário autenticado>';
--  Sem isso, as tabelas com RLS retornam 0 linhas (exceto leitura pública de
--  lots/farms publicados). Se o backend ainda não seta o GUC, aplique as
--  seções 1–5 e 7–8 agora e habilite a seção 6 quando o wiring estiver pronto.
-- ============================================================================

set client_min_messages = warning;


-- ============================================================================
--  0. EXTENSÕES ADICIONAIS
-- ----------------------------------------------------------------------------
--  pg_trgm: busca textual por similaridade/ILIKE '%termo%' (BuyFilters.query
--  sobre lots.title/description e busca de fazendas). Contrib padrão do core.
-- ============================================================================
create extension if not exists pg_trgm;


-- ============================================================================
--  1. FUNÇÕES DE APOIO A RLS
-- ----------------------------------------------------------------------------
--  app_current_user_id(): lê o usuário logado do GUC de sessão. Retorna NULL
--  se não setado (navegação anônima) -> políticas de dado privado negam tudo.
--  app_owns_farm(): true se a farm pertence ao usuário logado (para lots e
--  para o lado "vendedor" das negociações).
-- ============================================================================
create or replace function app_current_user_id()
returns bigint
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::bigint
$$;
comment on function app_current_user_id() is
  'Usuário logado a partir do GUC app.current_user_id (SET LOCAL pelo backend). NULL se anônimo.';

create or replace function app_owns_farm(fid bigint)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from farms f
    where f.id = fid
      and f.owner_user_id = app_current_user_id()
  )
$$;
comment on function app_owns_farm(bigint) is
  'True se a farm fid pertence ao usuário logado. Usada nas políticas de lots/proposals/transactions.';


-- ============================================================================
--  2. ÍNDICES ADICIONAIS (parciais "vivos", compostos por padrão de acesso,
--     lacunas de FK, busca textual)
-- ----------------------------------------------------------------------------
--  Trade-off geral: todo índice acelera leitura mas ONERA escrita (INSERT/
--  UPDATE/DELETE reescrevem o índice) e ocupa disco. Os parciais WHERE
--  deleted_at IS NULL indexam SÓ as linhas vivas — menores e mais baratos
--  exatamente porque quase toda query de app filtra "não deletado".
-- ============================================================================

-- --- LOTS: listagem pública (BuyScreen) e "meus lotes" -----------------------
-- Filtro público típico: status='published' + estado + categoria, só vivos.
create index if not exists ix_lots_pub_cat_state
  on lots (category_id, state)
  where deleted_at is null and status = 'published';
-- Ordenações de vitrine (mais relevante / mais novo), só vivos publicados.
create index if not exists ix_lots_pub_score
  on lots (score desc)
  where deleted_at is null and status = 'published';
create index if not exists ix_lots_pub_created
  on lots (created_at desc)
  where deleted_at is null and status = 'published';
-- "Lotes da minha fazenda" (dashboard do vendedor), qualquer status, vivos.
create index if not exists ix_lots_seller_live
  on lots (seller_id, status)
  where deleted_at is null;
-- Busca textual (ILIKE) por título de lote e nome de fazenda.
create index if not exists ix_lots_title_trgm
  on lots using gin (title gin_trgm_ops)
  where deleted_at is null;
create index if not exists ix_farms_name_trgm
  on farms using gin (name gin_trgm_ops)
  where deleted_at is null;

-- --- FARMS: listagem por estado (só vivas) -----------------------------------
create index if not exists ix_farms_state_live
  on farms (state)
  where deleted_at is null;

-- --- PROPOSALS: padrões (vendedor+status, comprador+status), só vivas --------
create index if not exists ix_proposals_seller_status_live
  on proposals (seller_farm_id, status)
  where deleted_at is null;
create index if not exists ix_proposals_buyer_status_live
  on proposals (buyer_user_id, status)
  where deleted_at is null;
create index if not exists ix_proposals_lot_live
  on proposals (lot_id)
  where deleted_at is null;

-- --- TRANSACTIONS: por comprador/vendedor+status (vivas) + FK faltante -------
create index if not exists ix_transactions_buyer_live
  on transactions (buyer_user_id, status)
  where deleted_at is null;
create index if not exists ix_transactions_seller_live
  on transactions (seller_farm_id, status)
  where deleted_at is null;
-- FK transactions.proposal_id NÃO tinha índice no schema base (frequentemente
-- NULL -> índice parcial). Acelera o SET NULL ao purgar uma proposal e joins.
create index if not exists ix_transactions_proposal
  on transactions (proposal_id)
  where proposal_id is not null;

-- --- NOTIFICATIONS: badge de não-lidas + feed cronológico --------------------
-- Índice parcial minúsculo p/ o contador/aba "não lidas" (a maioria fica lida).
create index if not exists ix_notifications_unread
  on notifications (user_id, created_at desc)
  where read = false;
-- Feed completo do usuário, mais novas primeiro.
create index if not exists ix_notifications_user_created
  on notifications (user_id, created_at desc);
-- FKs opcionais de deep-link (quase sempre NULL -> parciais).
create index if not exists ix_notifications_lot
  on notifications (lot_id)
  where lot_id is not null;
create index if not exists ix_notifications_proposal
  on notifications (proposal_id)
  where proposal_id is not null;

-- --- RADARS / SIMULATIONS / SUBSCRIPTIONS: "ativos do usuário" ----------------
create index if not exists ix_radars_user_live
  on radars (user_id)
  where deleted_at is null and active;
create index if not exists ix_simulations_user_live
  on simulations (user_id, created_at desc)
  where deleted_at is null;
create index if not exists ix_subscriptions_user_active
  on subscriptions (user_id)
  where deleted_at is null and status = 'active';

-- --- OPPORTUNITIES: feed global (user_id NULL) -------------------------------
create index if not exists ix_opportunities_global
  on opportunities (created_at desc)
  where user_id is null;

-- --- LOT_BOOSTS: boosts ativos (afetam ranking de vitrine) -------------------
create index if not exists ix_lot_boosts_active
  on lot_boosts (lot_id)
  where status = 'active';


-- ============================================================================
--  3. ÍNDICES REDUNDANTES DO SCHEMA BASE  (revisão — DROPs COMENTADOS)
-- ----------------------------------------------------------------------------
--  O schema base criou índices de FK single-column em colunas que JÁ SÃO a
--  coluna-líder de um índice UNIQUE composto. Nesses casos o índice single é
--  redundante (o UNIQUE já serve buscas por prefixo) e só custa escrita/disco.
--  Deixados COMENTADOS porque este arquivo é "só adicione"; o db-architect
--  decide dropar. Cada linha diz qual UNIQUE já cobre.
-- ============================================================================
-- drop index if exists ix_lot_images_lot;        -- coberto por UNIQUE(lot_id, position)
-- drop index if exists ix_farm_specialty_farm;   -- coberto por UNIQUE(farm_id, specialty)
-- drop index if exists ix_market_prices_category; -- coberto por ux_market_prices_scope (category_id líder)
-- drop index if exists ix_radar_state_radar;     -- coberto por UNIQUE(radar_id, state)
-- drop index if exists ix_match_results_search;  -- coberto por UNIQUE(match_search_id, lot_id)
-- drop index if exists ix_transaction_steps_tx;  -- coberto por UNIQUE(transaction_id, step_order)
-- drop index if exists ix_lesson_sections_lesson; -- coberto por UNIQUE(lesson_id, position)
-- drop index if exists ix_lesson_concepts_lesson; -- coberto por UNIQUE(lesson_id, position)
-- drop index if exists ix_lesson_quiz_lesson;    -- coberto por UNIQUE(lesson_id, position)
-- drop index if exists ix_lesson_quiz_options_q; -- coberto por UNIQUE(question_id, position)
-- drop index if exists ix_ucp_user;              -- coberto por UNIQUE(user_id, course_id)
-- drop index if exists ix_ulp_user;              -- coberto por UNIQUE(user_id, lesson_id)
-- drop index if exists ix_user_preference_user;  -- coberto por UNIQUE(user_id, tag)
-- drop index if exists ix_follows_user;          -- coberto por UNIQUE(user_id, farm_id)
--
-- NÃO são redundantes (mantenha): ix_ucp_course, ix_ulp_lesson, ix_follows_farm,
--   ix_match_results_lot, ix_favorites_user (varre TODOS os alvos do usuário;
--   os uniques parciais são por-alvo).
-- Após a listagem estabilizar em produção, cheque uso real com:
--   SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan;
-- e remova os que ficarem com idx_scan ~ 0.


-- ============================================================================
--  4. CONSTRAINTS EXTRAS DE INTEGRIDADE  (DO-guarded p/ idempotência)
-- ----------------------------------------------------------------------------
--  ADD CONSTRAINT não aceita IF NOT EXISTS -> guardamos por pg_constraint.
--  NOT VALID onde pode haver linhas legadas: valida dados novos sem varrer os
--  antigos (rode VALIDATE CONSTRAINT depois de limpar, se quiser).
-- ============================================================================

-- lot_boosts: janela coerente (fim depois do início).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chk_lot_boosts_window') then
    alter table lot_boosts
      add constraint chk_lot_boosts_window
      check (starts_at is null or ends_at is null or ends_at > starts_at);
  end if;
end $$;

-- subscriptions: renovação depois do início (quando ambos setados).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chk_subscriptions_renews') then
    alter table subscriptions
      add constraint chk_subscriptions_renews
      check (renews_at is null or renews_at >= started_at) not valid;
  end if;
end $$;

-- transactions: completed_at não pode ser antes de closed_at.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chk_transactions_completed_after_closed') then
    alter table transactions
      add constraint chk_transactions_completed_after_closed
      check (completed_at is null or closed_at is null or completed_at >= closed_at) not valid;
  end if;
end $$;


-- ============================================================================
--  5. transactions.weight_snapshot — CONGELAR O PESO NA TRANSAÇÃO (ponto 6)
-- ----------------------------------------------------------------------------
--  RESOLVIDO NO SCHEMA BASE: a recomendação do DBA foi ACEITA pelo db-architect
--  e a coluna `transactions.weight_snapshot numeric(6,2)` + a constraint
--  `chk_tx_weight_snapshot_for_arroba` (exige o peso em transações '/@') já
--  fazem parte de schema.sql e da migration 008_negotiation.up.sql.
--
--  Por isso NÃO repetimos o ALTER TABLE aqui (evita constraint duplicada). O
--  bloco abaixo fica só como rede de idempotência: se este hardening rodar
--  contra um banco antigo criado ANTES da mudança do base, ele adiciona a
--  coluna/constraint; num banco novo é no-op.
-- ============================================================================
alter table transactions
  add column if not exists weight_snapshot numeric(6,2)
  check (weight_snapshot is null or weight_snapshot > 0);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chk_tx_weight_snapshot_for_arroba') then
    alter table transactions
      add constraint chk_tx_weight_snapshot_for_arroba
      check (price_unit <> '/@' or weight_snapshot is not null) not valid;
  end if;
end $$;


-- ============================================================================
--  6. ROW-LEVEL SECURITY (multiusuário)
-- ----------------------------------------------------------------------------
--  Modelo: cada transação do backend faz `SET LOCAL app.current_user_id = <id>`.
--  Owner das tabelas e roles BYPASSRLS (bta_admin/bta_readonly) NÃO são
--  filtrados. Não usamos FORCE ROW LEVEL SECURITY para não travar migrations/
--  seed que rodam como owner.
--
--  Grupos:
--    A) Dado privado do usuário (user_id = eu): CRUD só do dono.
--    B) Negociação de duas partes (comprador OU dono da farm vendedora).
--    C) Conteúdo com leitura pública + escrita do dono (lots, farms).
--    D) opportunities: leitura (global OU minha); escrita via job privilegiado.
--  Catálogos públicos (categorias, raças, cursos, aulas, serviços, planos,
--  market_prices/points, transporters) NÃO recebem RLS — são públicos e a
--  escrita é controlada por GRANT (seção 7).
-- ============================================================================

-- ---- GRUPO A: dado privado do usuário --------------------------------------
alter table radars               enable row level security;
alter table simulations          enable row level security;
alter table notifications        enable row level security;
alter table favorites            enable row level security;
alter table follows              enable row level security;
alter table user_preference      enable row level security;
alter table match_searches       enable row level security;
alter table subscriptions        enable row level security;
alter table user_course_progress enable row level security;
alter table user_lesson_progress enable row level security;

drop policy if exists rls_owner on radars;
create policy rls_owner on radars for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on simulations;
create policy rls_owner on simulations for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on notifications;
create policy rls_owner on notifications for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on favorites;
create policy rls_owner on favorites for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on follows;
create policy rls_owner on follows for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on user_preference;
create policy rls_owner on user_preference for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on match_searches;
create policy rls_owner on match_searches for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on subscriptions;
create policy rls_owner on subscriptions for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on user_course_progress;
create policy rls_owner on user_course_progress for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

drop policy if exists rls_owner on user_lesson_progress;
create policy rls_owner on user_lesson_progress for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

-- Filhas de dado privado (dono via tabela-pai).
alter table radar_state   enable row level security;
alter table match_results enable row level security;

drop policy if exists rls_owner on radar_state;
create policy rls_owner on radar_state for all
  using (exists (select 1 from radars r
                 where r.id = radar_state.radar_id
                   and r.user_id = app_current_user_id()))
  with check (exists (select 1 from radars r
                 where r.id = radar_state.radar_id
                   and r.user_id = app_current_user_id()));

drop policy if exists rls_owner on match_results;
create policy rls_owner on match_results for all
  using (exists (select 1 from match_searches s
                 where s.id = match_results.match_search_id
                   and s.user_id = app_current_user_id()))
  with check (exists (select 1 from match_searches s
                 where s.id = match_results.match_search_id
                   and s.user_id = app_current_user_id()));

-- ---- GRUPO B: negociação de duas partes ------------------------------------
alter table proposals            enable row level security;
alter table negotiation_messages enable row level security;
alter table transactions         enable row level security;
alter table transaction_steps    enable row level security;
alter table transports           enable row level security;

-- proposals: comprador OU dono da farm vendedora (vendedor aceita/recusa).
drop policy if exists rls_party on proposals;
create policy rls_party on proposals for all
  using (buyer_user_id = app_current_user_id() or app_owns_farm(seller_farm_id))
  with check (buyer_user_id = app_current_user_id() or app_owns_farm(seller_farm_id));

-- negotiation_messages: via proposal (qualquer das duas partes).
drop policy if exists rls_party on negotiation_messages;
create policy rls_party on negotiation_messages for all
  using (exists (select 1 from proposals p
                 where p.id = negotiation_messages.proposal_id
                   and (p.buyer_user_id = app_current_user_id()
                        or app_owns_farm(p.seller_farm_id))))
  with check (exists (select 1 from proposals p
                 where p.id = negotiation_messages.proposal_id
                   and (p.buyer_user_id = app_current_user_id()
                        or app_owns_farm(p.seller_farm_id))));

-- transactions: comprador OU dono da farm vendedora.
drop policy if exists rls_party on transactions;
create policy rls_party on transactions for all
  using (buyer_user_id = app_current_user_id() or app_owns_farm(seller_farm_id))
  with check (buyer_user_id = app_current_user_id() or app_owns_farm(seller_farm_id));

-- transaction_steps / transports: via transaction.
drop policy if exists rls_party on transaction_steps;
create policy rls_party on transaction_steps for all
  using (exists (select 1 from transactions t
                 where t.id = transaction_steps.transaction_id
                   and (t.buyer_user_id = app_current_user_id()
                        or app_owns_farm(t.seller_farm_id))))
  with check (exists (select 1 from transactions t
                 where t.id = transaction_steps.transaction_id
                   and (t.buyer_user_id = app_current_user_id()
                        or app_owns_farm(t.seller_farm_id))));

drop policy if exists rls_party on transports;
create policy rls_party on transports for all
  using (exists (select 1 from transactions t
                 where t.id = transports.transaction_id
                   and (t.buyer_user_id = app_current_user_id()
                        or app_owns_farm(t.seller_farm_id))))
  with check (exists (select 1 from transactions t
                 where t.id = transports.transaction_id
                   and (t.buyer_user_id = app_current_user_id()
                        or app_owns_farm(t.seller_farm_id))));

-- ---- GRUPO C: conteúdo público na leitura, escrita do dono -----------------
alter table lots  enable row level security;
alter table farms enable row level security;

-- lots: leitura pública dos publicados/vivos; o dono (via farm) vê seus drafts.
drop policy if exists rls_public_read on lots;
create policy rls_public_read on lots for select
  using ((deleted_at is null and status = 'published') or app_owns_farm(seller_id));
-- escrita: só o dono da farm vendedora.
drop policy if exists rls_owner_write on lots;
create policy rls_owner_write on lots for all
  using (app_owns_farm(seller_id))
  with check (app_owns_farm(seller_id));

-- farms: leitura pública das vivas; dono também vê a sua se soft-deletada.
drop policy if exists rls_public_read on farms;
create policy rls_public_read on farms for select
  using (deleted_at is null or owner_user_id = app_current_user_id());
drop policy if exists rls_owner_write on farms;
create policy rls_owner_write on farms for all
  using (owner_user_id = app_current_user_id())
  with check (owner_user_id = app_current_user_id());

-- ---- GRUPO D: opportunities (leitura global OU minha) ----------------------
--  Sem policy de escrita -> INSERT/UPDATE/DELETE negados p/ bta_app.
--  A GERAÇÃO de oportunidades roda como job privilegiado (bta_admin / BYPASSRLS).
alter table opportunities enable row level security;
drop policy if exists rls_read on opportunities;
create policy rls_read on opportunities for select
  using (user_id is null or user_id = app_current_user_id());


-- ============================================================================
--  7. ROLES E GRANTS (privilégio mínimo)
-- ----------------------------------------------------------------------------
--  Criamos roles-GRUPO (NOLOGIN). Os usuários de login reais são criados
--  fora deste arquivo (sem senha versionada) e recebem GRANT do grupo, ex.:
--     CREATE ROLE bta_app_login LOGIN PASSWORD '***';
--     GRANT bta_app TO bta_app_login;
--
--    * bta_app      -> DML operacional. SEM DDL, SEM TRUNCATE. Sujeito a RLS.
--    * bta_readonly -> só SELECT (BI/analytics). BYPASSRLS (visão global).
--    * bta_admin    -> DML amplo + TRUNCATE, BYPASSRLS (jobs/backoffice).
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'bta_app') then
    create role bta_app nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'bta_readonly') then
    create role bta_readonly nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'bta_admin') then
    create role bta_admin nologin;
  end if;
end $$;

-- BYPASSRLS é ATRIBUTO de role (requer superuser p/ setar). Se este arquivo
-- não rodar como superuser, aplique estas 2 linhas manualmente depois.
alter role bta_readonly bypassrls;
alter role bta_admin    bypassrls;

grant usage on schema public to bta_app, bta_readonly, bta_admin;

-- App: DML nas tabelas operacionais + uso das sequences (identity).
grant select, insert, update, delete on all tables in schema public to bta_app;
grant usage, select on all sequences in schema public to bta_app;
-- App NÃO altera configuração sensível: platform_settings (take rate) é read-only.
revoke insert, update, delete on platform_settings from bta_app;

-- Readonly: só leitura.
grant select on all tables in schema public to bta_readonly;

-- Admin: DML + TRUNCATE + gatilhos/referências.
grant select, insert, update, delete, truncate, references, trigger
  on all tables in schema public to bta_admin;
grant usage, select, update on all sequences in schema public to bta_admin;

-- Objetos FUTUROS (assumindo que este role roda as próximas migrations).
alter default privileges in schema public
  grant select, insert, update, delete on tables to bta_app;
alter default privileges in schema public
  grant usage, select on sequences to bta_app;
alter default privileges in schema public
  grant select on tables to bta_readonly;


-- ---- BLINDAGEM DA SENHA (users.password_hash) ------------------------------
--  A senha NUNCA é lida pelas roles não-owner: a autenticação roda como o OWNER
--  (login/registro/me/exclusão), não como bta_app/bta_readonly. Blindamos a
--  coluna (defense-in-depth) para que NENHUMA query acidental sob RLS leia o hash.
--
--  ATENÇÃO ao gotcha do Postgres: um GRANT em nível de TABELA (os `grant ... on
--  all tables ... to <role>` acima) cobre TODAS as colunas, e um `revoke
--  (coluna)` isolado NÃO tem efeito enquanto o grant de tabela existir. Por isso,
--  para `users`, REMOVEMOS o privilégio de tabela e RE-CONCEDEMOS coluna-a-coluna,
--  exceto password_hash. Este bloco fica DEPOIS de todos os grants amplos de
--  seção 7 de propósito (senão eles re-concederiam a coluna). Dinâmico (cobre
--  colunas novas de futuras migrations) e idempotente. (do-guard: só após 016.)
--  bta_admin (BYPASSRLS, jobs/backoffice privilegiados) fica intacto.
do $$
declare
  cols text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'password_hash'
  ) then
    select string_agg(quote_ident(column_name), ', ')
      into cols
      from information_schema.columns
     where table_schema = 'public' and table_name = 'users'
       and column_name <> 'password_hash';

    -- App: troca o grant amplo de tabela por grants de coluna (sem o hash).
    -- (DELETE é sempre de tabela — não há coluna a excluir — e fica intacto.)
    execute 'revoke select, insert, update on users from bta_app';
    execute format(
      'grant select (%1$s), insert (%1$s), update (%1$s) on users to bta_app', cols
    );

    -- Readonly (BI): só SELECT nas colunas não sensíveis.
    execute 'revoke select on users from bta_readonly';
    execute format('grant select (%s) on users to bta_readonly', cols);
  end if;
end $$;


-- ============================================================================
--  7b. VIEW PÚBLICA DE USUÁRIO (minimizar exposição de PII — LGPD)
-- ----------------------------------------------------------------------------
--  A app precisa mostrar nome/cidade de OUTROS usuários (dono de farm, etc.),
--  mas NUNCA telefone/e-mail alheios. Exponha o cross-user por esta view e
--  mantenha SELECT direto em `users` restrito ao próprio registro na app.
-- ============================================================================
create or replace view v_users_public as
  select id, public_id, name, role, location, state, level
  from users
  where deleted_at is null;
comment on view v_users_public is
  'Projeção pública de users (sem phone/email/external_auth_id). Use para exibir dados de terceiros.';
grant select on v_users_public to bta_app, bta_readonly;


-- ============================================================================
--  8. STORAGE / AUTOVACUUM DAS TABELAS QUENTES
-- ----------------------------------------------------------------------------
--  Tabelas com muita escrita/UPDATE acumulam tuplas mortas -> índices incham
--  (bloat) e o planner erra. Baixamos os thresholds de autovacuum/analyze e
--  usamos fillfactor 90 nas tabelas cujos UPDATEs mexem em colunas NÃO
--  indexadas (views/contadores, flag read, status) para habilitar HOT updates
--  (atualização sem reescrever índices).
-- ============================================================================
-- lots: UPDATE frequente de contadores (views/favorites/proposals_count).
alter table lots set (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 90
);
-- notifications: alto INSERT + UPDATE (flag read).
alter table notifications set (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 90
);
-- proposals / transactions: UPDATE de status ao longo do fluxo.
alter table proposals set (
  autovacuum_vacuum_scale_factor = 0.05,
  fillfactor = 90
);
alter table transactions set (
  autovacuum_vacuum_scale_factor = 0.05,
  fillfactor = 90
);
-- farms: UPDATE de contadores (deals/active_lots).
alter table farms set (fillfactor = 90);
-- negotiation_messages: INSERT-only e volumoso -> analisar mais cedo.
alter table negotiation_messages set (
  autovacuum_analyze_scale_factor = 0.02
);
-- market_price_points: INSERT-only diário e pequeno (ver seção 9). Sem tuning.


-- ============================================================================
--  9. OPCIONAL — PARTICIONAMENTO de market_price_points  (NÃO aplicar agora)
-- ----------------------------------------------------------------------------
--  RECOMENDAÇÃO: NÃO particionar por enquanto. Volume atual ~1.825 linhas/ano
--  (5 categorias x 1/dia). Mesmo com 27 UFs seriam ~50k linhas/ano — um btree
--  simples resolve as janelas history7/30/90 com folga. Particionar agora só
--  adiciona complexidade (roteamento, tuple routing, planejamento) sem ganho.
--
--  QUANDO valer a pena (gatilho): quando a tabela passar de ~dezenas de milhões
--  de linhas OU quando você precisar de RETENÇÃO barata (dropar meses antigos
--  em O(1) via DROP PARTITION em vez de DELETE + VACUUM). Aí migre para RANGE
--  por price_date (partições mensais). Template abaixo (recriar como tabela
--  particionada + migrar dados; PK precisa incluir price_date):
--
--  create table market_price_points_part (
--    id          bigint generated always as identity,
--    category_id bigint not null references cattle_category(id),
--    region      text,
--    price_date  date   not null,
--    value       numeric(8,2) not null,
--    created_at  timestamptz not null default now(),
--    primary key (id, price_date)                    -- chave de partição na PK
--  ) partition by range (price_date);
--  -- unicidade de negócio precisa incluir a coluna de partição:
--  create unique index ux_mpp_scope_date
--    on market_price_points_part (category_id, coalesce(region,'*'), price_date);
--  -- partições mensais (crie por script/pg_partman-like no core, ou manualmente):
--  create table market_price_points_2026_08
--    partition of market_price_points_part
--    for values from ('2026-08-01') to ('2026-09-01');
--  -- retenção: drop O(1) de um mês inteiro
--  -- drop table market_price_points_2026_08;
--  TRADE-OFF: ganha retenção/vacuum baratos; perde simplicidade e FK apontando
--  para a tabela (particionadas têm restrições de FK/uniqueness — por isso a
--  unique precisa conter price_date).


-- ============================================================================
--  10. OPCIONAL — GEO/PostGIS e cache de distância por comprador (ponto 2)
-- ----------------------------------------------------------------------------
--  lots.distance / lots.freight HOJE são relativos a um comprador fixo (herança
--  do mock) — semanticamente errado no domínio real (distância depende de QUEM
--  está olhando). RECOMENDAÇÃO:
--    (a) Curto prazo: tratar lots.distance/freight como valores de REFERÊNCIA
--        (ou NULL) e calcular por comprador na camada de serviço, exibindo
--        "a calcular" quando não houver origem/destino.
--    (b) Médio prazo: adicionar geografia com PostGIS e computar por consulta;
--        cachear o par (lot, comprador) quando o cálculo for caro.
--
--  -- PostGIS (extensão fora do core; só habilite quando for fazer geo de fato):
--  -- create extension if not exists postgis;
--  -- alter table farms add column geo geography(Point,4326);
--  -- alter table lots  add column geo geography(Point,4326);  -- origem do lote
--  -- create index ix_farms_geo on farms using gist (geo);
--  -- create index ix_lots_geo  on lots  using gist (geo);
--  -- distância = ST_Distance(lot.geo, buyer_origin.geo) / 1000.0  (km)
--
--  -- Cache por comprador (evita recomputar a cada scroll de vitrine):
--  -- create table lot_distance_cache (
--  --   lot_id        bigint not null references lots(id)  on delete cascade,
--  --   buyer_user_id bigint not null references users(id) on delete cascade,
--  --   distance_km   numeric(7,2),
--  --   freight       numeric(14,2),
--  --   computed_at   timestamptz not null default now(),
--  --   primary key (lot_id, buyer_user_id)
--  -- );
--  -- create index ix_ldc_buyer on lot_distance_cache (buyer_user_id);
--  TRADE-OFF do cache: leitura instantânea vs. invalidação (mudou origem do
--  comprador ou geo do lote -> invalidar/expirar por computed_at).


-- ============================================================================
--  11. AUTENTICAÇÃO EXTERNA (Firebase/Auth0) — sem OTP no banco
-- ----------------------------------------------------------------------------
--  DECISÃO DE PRODUTO: a autenticação NÃO reside no banco. O usuário é
--  autenticado por um provedor externo (Firebase/Auth0), que cuida de entrega
--  de SMS, rate-limit e antifraude. O único vínculo persistido é
--  users.external_auth_id.
--  Histórico: a antiga tabela de OTP por SMS foi REMOVIDA do schema por conta
--  desta decisão (não há mais códigos/segredos de auth no banco).
--    * external_auth_id é nullable (permite visitante sem cadastro) e ÚNICO
--      quando preenchido — garantido pelo índice parcial
--      ux_users_external_auth_id (migration 013 / seção 13 do schema.sql).
--    * Nenhum segredo de auth (hash de código, etc.) deve ser gravado no banco.
-- ============================================================================

-- FIM do dba_hardening.sql
