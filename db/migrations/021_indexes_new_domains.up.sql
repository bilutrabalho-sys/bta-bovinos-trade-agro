-- ============================================================================
--  021 · Índices de performance dos novos domínios (seção 15.g do schema).
-- ----------------------------------------------------------------------------
--  Postgres NÃO indexa FKs automaticamente -> indexamos os filtros/joins do app.
--  NÃO estão aqui os índices ÚNICOS de negócio (uniques de tag/oferta/adesão,
--  ux_vet_review_appointment, uniques de saved/like/save/follow): esses moram nas
--  migrations de domínio (017–020). Esta migration contém APENAS os ix_* de
--  performance (não-únicos) da seção 15.g.
--  OMITIDOS de propósito os single-column cuja coluna já é LÍDER de um UNIQUE
--  composto (redundantes): supplier_offer(product_id), group_buy_participation
--  (group_buy_id), vet_service(vet_id), used_saved(user_id), video_like(user_id),
--  video_save(user_id), vet_follow(user_id). Indexamos só a coluna NÃO-líder.
--  Depende de: 017 (insumos), 018 (vet), 019 (usados), 020 (vídeos).
-- ============================================================================
begin;

-- Insumos
create index if not exists ix_insumo_product_category      on insumo_product (category_id);
create index if not exists ix_supplier_offer_supplier      on supplier_offer (supplier_id);
create index if not exists ix_farm_stock_item_user         on farm_stock_item (user_id);
create index if not exists ix_farm_stock_item_validade     on farm_stock_item (validade);
create index if not exists ix_group_buy_status             on group_buy (status);
create index if not exists ix_group_buy_deadline           on group_buy (deadline);
create index if not exists ix_group_buy_participation_user on group_buy_participation (user_id);
create index if not exists ix_price_alert_user             on price_alert (user_id);
create index if not exists ix_insumo_purchase_user_date    on insumo_purchase (user_id, purchased_at);

-- Vet
create index if not exists ix_vet_uf                       on vet (uf);
create index if not exists ix_vet_kind                     on vet (kind);
create index if not exists ix_vet_owner                    on vet (owner_user_id);
create index if not exists ix_vet_appointment_user         on vet_appointment (user_id);
create index if not exists ix_vet_appointment_vet          on vet_appointment (vet_id);
create index if not exists ix_vet_appointment_scheduled    on vet_appointment (scheduled_at);
create index if not exists ix_vet_review_vet               on vet_review (vet_id);
create index if not exists ix_vet_review_author            on vet_review (author_user_id);

-- Usados
create index if not exists ix_used_listing_category        on used_listing (category_id);
create index if not exists ix_used_listing_uf              on used_listing (uf);
create index if not exists ix_used_listing_featured        on used_listing (featured);
create index if not exists ix_used_listing_seller          on used_listing (seller_user_id);
create index if not exists ix_used_saved_listing           on used_saved (listing_id);
create index if not exists ix_used_contact_user            on used_contact (user_id);
create index if not exists ix_used_contact_listing         on used_contact (listing_id);

-- Vídeos
create index if not exists ix_vet_video_category           on vet_video (category_id);
create index if not exists ix_vet_video_vet                on vet_video (vet_id);
create index if not exists ix_vet_video_featured           on vet_video (featured);
create index if not exists ix_video_like_video             on video_like (video_id);
create index if not exists ix_video_save_video             on video_save (video_id);
create index if not exists ix_vet_follow_vet               on vet_follow (vet_id);

commit;
