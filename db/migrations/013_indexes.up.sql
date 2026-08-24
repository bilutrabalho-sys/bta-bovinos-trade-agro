-- ============================================================================
--  013 · Índices de performance (seção 13 do schema).
-- ----------------------------------------------------------------------------
--  Postgres NÃO indexa FKs automaticamente -> indexamos as principais.
--  NÃO estão aqui os índices ÚNICOS de escopo/negócio (ux_lot_images_one_cover,
--  ux_market_prices_scope, ux_market_points_scope_date, ux_favorites_*): esses
--  moram nas migrations das respectivas tabelas (005, 006, 011). Esta migration
--  contém APENAS os índices "de performance" (não-únicos) da seção 13.
--  UNIQUE de users(email)/users(phone) já vêm das constraints de coluna (004).
--  EXCEÇÃO: o índice ÚNICO PARCIAL de users(external_auth_id) — vínculo de auth
--  externo (Firebase/Auth0) — mora aqui, na seção "Identidade" (nullable, mas
--  único quando preenchido).
-- ============================================================================
begin;

-- Lots: filtros/joins mais frequentes
create index if not exists ix_lots_status      on lots (status);
create index if not exists ix_lots_seller      on lots (seller_id);
create index if not exists ix_lots_category    on lots (category_id);
create index if not exists ix_lots_breed       on lots (breed_id);
create index if not exists ix_lots_purpose     on lots (purpose_id);
create index if not exists ix_lots_state       on lots (state);
create index if not exists ix_lots_score       on lots (score);
create index if not exists ix_lot_images_lot   on lot_images (lot_id);

-- Farms
create index if not exists ix_farms_owner      on farms (owner_user_id);
create index if not exists ix_farm_specialty_farm on farm_specialty (farm_id);

-- Mercado
create index if not exists ix_market_prices_category    on market_prices (category_id);
create index if not exists ix_market_points_cat_date    on market_price_points (category_id, price_date);

-- Descoberta
create index if not exists ix_opportunities_lot    on opportunities (lot_id);
create index if not exists ix_opportunities_user   on opportunities (user_id);
create index if not exists ix_radars_user_active   on radars (user_id, active);
create index if not exists ix_radar_state_radar    on radar_state (radar_id);
create index if not exists ix_match_searches_user  on match_searches (user_id);
create index if not exists ix_match_results_search on match_results (match_search_id);
create index if not exists ix_match_results_lot    on match_results (lot_id);

-- Negociação
create index if not exists ix_proposals_buyer      on proposals (buyer_user_id);
create index if not exists ix_proposals_seller     on proposals (seller_farm_id);
create index if not exists ix_proposals_lot        on proposals (lot_id);
create index if not exists ix_proposals_status     on proposals (status);
create index if not exists ix_neg_messages_proposal on negotiation_messages (proposal_id);
create index if not exists ix_transactions_buyer   on transactions (buyer_user_id);
create index if not exists ix_transactions_seller  on transactions (seller_farm_id);
create index if not exists ix_transactions_lot     on transactions (lot_id);
create index if not exists ix_transactions_status  on transactions (status);
create index if not exists ix_transaction_steps_tx on transaction_steps (transaction_id);
create index if not exists ix_transports_tx        on transports (transaction_id);
create index if not exists ix_transports_transporter on transports (transporter_id);

-- Academy
create index if not exists ix_lessons_course       on lessons (course_id);
create index if not exists ix_lesson_sections_lesson on lesson_sections (lesson_id);
create index if not exists ix_lesson_concepts_lesson on lesson_key_concepts (lesson_id);
create index if not exists ix_lesson_quiz_lesson   on lesson_quiz_questions (lesson_id);
create index if not exists ix_lesson_quiz_options_q on lesson_quiz_options (question_id);
create index if not exists ix_ucp_user             on user_course_progress (user_id);
create index if not exists ix_ucp_course           on user_course_progress (course_id);
create index if not exists ix_ulp_user             on user_lesson_progress (user_id);
create index if not exists ix_ulp_lesson           on user_lesson_progress (lesson_id);

-- Simulador
create index if not exists ix_simulations_user     on simulations (user_id);
create index if not exists ix_simulations_lot      on simulations (lot_id);

-- Engajamento
create index if not exists ix_notifications_user_read on notifications (user_id, read);
create index if not exists ix_favorites_user       on favorites (user_id);
create index if not exists ix_follows_user         on follows (user_id);
create index if not exists ix_follows_farm         on follows (farm_id);

-- Monetização
create index if not exists ix_subscriptions_user   on subscriptions (user_id);
create index if not exists ix_subscriptions_plan   on subscriptions (plan_id);
create index if not exists ix_lot_boosts_lot       on lot_boosts (lot_id);

-- Identidade
create index if not exists ix_user_preference_user on user_preference (user_id);
-- Vínculo de auth externo: único quando preenchido (nullable p/ visitantes sem cadastro).
create unique index if not exists ux_users_external_auth_id
  on users (external_auth_id) where external_auth_id is not null;

commit;
