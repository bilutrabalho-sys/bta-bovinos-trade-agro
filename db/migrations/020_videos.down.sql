-- ============================================================================
--  020 · DOWN — dropa a área VÍDEOS (ordem inversa do up).
--  Trigger primeiro; depois as tabelas em ordem inversa (vet_follow/video_save/
--  video_like antes de vet_video, que vem antes de video_category — respeitando
--  FKs). Sem enums próprios (nada de drop type aqui). Cascade como rede.
--  vet (referenciada por vet_video/vet_follow) é dropada pelo down 018.
-- ============================================================================
begin;

-- Trigger --------------------------------------------------------------------
drop trigger if exists trg_vet_video_updated_at       on vet_video;

-- Tabelas (ordem inversa) ----------------------------------------------------
drop table if exists vet_follow     cascade;
drop table if exists video_save     cascade;
drop table if exists video_like     cascade;
drop table if exists vet_video      cascade;
drop table if exists video_category cascade;

commit;
