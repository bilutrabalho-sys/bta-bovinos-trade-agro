-- ============================================================================
--  022 · DOWN — remove triggers e funções de manutenção de contadores.
--  (Reverte 022_counters.up.sql.) Drops idempotentes na ordem inversa:
--  triggers antes das funções.
-- ============================================================================
begin;

drop trigger if exists trg_gbp_counts         on group_buy_participation;
drop trigger if exists trg_vet_review_count   on vet_review;
drop trigger if exists trg_video_like_count_t on video_like;
drop trigger if exists trg_video_save_count_t on video_save;

drop function if exists trg_group_buy_participation_counts();
drop function if exists trg_vet_reviews_count();
drop function if exists trg_video_like_count();
drop function if exists trg_video_save_count();
drop function if exists bump_used_listing_views(bigint);
drop function if exists bump_vet_video_views(bigint);

commit;
