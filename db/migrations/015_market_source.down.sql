-- ============================================================================
--  015 · DOWN — remove a coluna de fonte da cotação.
-- ============================================================================
begin;

alter table market_prices
  drop column if exists source;

commit;
