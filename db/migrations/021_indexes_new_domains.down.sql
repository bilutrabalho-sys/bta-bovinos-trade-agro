-- ============================================================================
--  021 · DOWN — dropa os índices de performance dos novos domínios (seção 15.g).
--  (Estes índices também cairiam junto das tabelas nos downs 017–020; dropados
--   explicitamente aqui por fidelidade ao up. NÃO toca nos índices únicos de
--   negócio, que pertencem a 017–020.)
-- ============================================================================
begin;

-- Vídeos
drop index if exists ix_vet_follow_vet;
drop index if exists ix_video_save_video;
drop index if exists ix_video_like_video;
drop index if exists ix_vet_video_featured;
drop index if exists ix_vet_video_vet;
drop index if exists ix_vet_video_category;

-- Usados
drop index if exists ix_used_contact_listing;
drop index if exists ix_used_contact_user;
drop index if exists ix_used_saved_listing;
drop index if exists ix_used_listing_seller;
drop index if exists ix_used_listing_featured;
drop index if exists ix_used_listing_uf;
drop index if exists ix_used_listing_category;

-- Vet
drop index if exists ix_vet_review_author;
drop index if exists ix_vet_review_vet;
drop index if exists ix_vet_appointment_scheduled;
drop index if exists ix_vet_appointment_vet;
drop index if exists ix_vet_appointment_user;
drop index if exists ix_vet_owner;
drop index if exists ix_vet_kind;
drop index if exists ix_vet_uf;

-- Insumos
drop index if exists ix_insumo_purchase_user_date;
drop index if exists ix_price_alert_user;
drop index if exists ix_group_buy_participation_user;
drop index if exists ix_group_buy_deadline;
drop index if exists ix_group_buy_status;
drop index if exists ix_farm_stock_item_validade;
drop index if exists ix_farm_stock_item_user;
drop index if exists ix_supplier_offer_supplier;
drop index if exists ix_insumo_product_category;

commit;
