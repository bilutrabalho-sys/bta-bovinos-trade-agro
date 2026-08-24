-- ============================================================================
--  005 · DOWN — dropa fazendas e lotes (ordem inversa).
--  O índice ux_lot_images_one_cover cai junto de lot_images; dropado
--  explicitamente antes por fidelidade ao up.
-- ============================================================================
begin;

drop index if exists ux_lot_images_one_cover;
drop table if exists lot_images     cascade;
drop table if exists lots           cascade;
drop table if exists farm_specialty cascade;
drop table if exists farms          cascade;

commit;
