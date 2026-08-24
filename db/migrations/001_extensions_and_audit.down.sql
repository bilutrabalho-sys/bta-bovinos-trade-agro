-- ============================================================================
--  001 · DOWN — reverte 001 (ordem inversa).
-- ============================================================================
begin;

-- Função de auditoria (os triggers que a usam já foram dropados no down 014).
drop function if exists set_updated_at();

-- ATENÇÃO — EXTENSÕES NÃO SÃO DROPADAS POR PADRÃO.
--  citext e pgcrypto podem ser usadas por outros schemas/objetos no mesmo
--  banco ou cluster. Dropá-las aqui poderia quebrar terceiros. Descomente
--  APENAS se tiver certeza absoluta de que nada mais depende delas.
-- drop extension if exists pgcrypto;
-- drop extension if exists citext;

commit;
