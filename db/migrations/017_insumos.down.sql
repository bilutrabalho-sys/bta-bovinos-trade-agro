-- ============================================================================
--  017 · DOWN — dropa a área INSUMOS (ordem inversa do up).
--  Triggers primeiro; depois as tabelas em ordem inversa de criação (filhas
--  antes das pais, respeitando FK); por fim o enum group_buy_status (só depois
--  das tabelas que o usam). Drops idempotentes com cascade como rede.
-- ============================================================================
begin;

-- Triggers (ordem inversa) ---------------------------------------------------
drop trigger if exists trg_price_alert_updated_at     on price_alert;
drop trigger if exists trg_group_buy_updated_at       on group_buy;
drop trigger if exists trg_farm_stock_item_updated_at on farm_stock_item;
drop trigger if exists trg_supplier_offer_updated_at  on supplier_offer;
drop trigger if exists trg_supplier_updated_at        on supplier;
drop trigger if exists trg_insumo_product_updated_at  on insumo_product;

-- Tabelas (ordem inversa) ----------------------------------------------------
drop table if exists insumo_purchase        cascade;
drop table if exists price_alert            cascade;
drop table if exists group_buy_participation cascade;
drop table if exists group_buy              cascade;
drop table if exists farm_stock_item        cascade;
drop table if exists supplier_offer         cascade;
drop table if exists supplier               cascade;
drop table if exists insumo_product_tag     cascade;
drop table if exists insumo_product         cascade;
drop table if exists insumo_category        cascade;

-- Enum (depois das tabelas que o usam) ---------------------------------------
drop type if exists group_buy_status;

commit;
