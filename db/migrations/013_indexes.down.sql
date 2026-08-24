-- ============================================================================
--  013 · DOWN — dropa os índices de performance da seção 13.
--  (Estes índices também cairiam junto das tabelas nos downs 004–012; dropados
--   explicitamente aqui por fidelidade ao up. NÃO toca nos índices únicos de
--   escopo, que pertencem a 005/006/011.)
-- ============================================================================
begin;

-- Identidade
drop index if exists ux_users_external_auth_id;
drop index if exists ix_user_preference_user;

-- Monetização
drop index if exists ix_lot_boosts_lot;
drop index if exists ix_subscriptions_plan;
drop index if exists ix_subscriptions_user;

-- Engajamento
drop index if exists ix_follows_farm;
drop index if exists ix_follows_user;
drop index if exists ix_favorites_user;
drop index if exists ix_notifications_user_read;

-- Simulador
drop index if exists ix_simulations_lot;
drop index if exists ix_simulations_user;

-- Academy
drop index if exists ix_ulp_lesson;
drop index if exists ix_ulp_user;
drop index if exists ix_ucp_course;
drop index if exists ix_ucp_user;
drop index if exists ix_lesson_quiz_options_q;
drop index if exists ix_lesson_quiz_lesson;
drop index if exists ix_lesson_concepts_lesson;
drop index if exists ix_lesson_sections_lesson;
drop index if exists ix_lessons_course;

-- Negociação
drop index if exists ix_transports_transporter;
drop index if exists ix_transports_tx;
drop index if exists ix_transaction_steps_tx;
drop index if exists ix_transactions_status;
drop index if exists ix_transactions_lot;
drop index if exists ix_transactions_seller;
drop index if exists ix_transactions_buyer;
drop index if exists ix_neg_messages_proposal;
drop index if exists ix_proposals_status;
drop index if exists ix_proposals_lot;
drop index if exists ix_proposals_seller;
drop index if exists ix_proposals_buyer;

-- Descoberta
drop index if exists ix_match_results_lot;
drop index if exists ix_match_results_search;
drop index if exists ix_match_searches_user;
drop index if exists ix_radar_state_radar;
drop index if exists ix_radars_user_active;
drop index if exists ix_opportunities_user;
drop index if exists ix_opportunities_lot;

-- Mercado
drop index if exists ix_market_points_cat_date;
drop index if exists ix_market_prices_category;

-- Farms
drop index if exists ix_farm_specialty_farm;
drop index if exists ix_farms_owner;

-- Lots
drop index if exists ix_lot_images_lot;
drop index if exists ix_lots_score;
drop index if exists ix_lots_state;
drop index if exists ix_lots_purpose;
drop index if exists ix_lots_breed;
drop index if exists ix_lots_category;
drop index if exists ix_lots_seller;
drop index if exists ix_lots_status;

commit;
