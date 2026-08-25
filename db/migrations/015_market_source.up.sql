-- ============================================================================
--  015 · Fonte da cotação (market_prices.source).
--  Rótulo textual da PROCEDÊNCIA do preço corrente (ex.: 'Cotação de referência
--  BTA', 'Demonstração'). Nullable: snapshots antigos ficam sem fonte até o
--  próximo update pelo painel admin. O app exibe a fonte + data + disclaimer
--  para deixar claro ao usuário de onde vem o número (transparência legal).
--  Depende de: 006 (market_prices).
-- ============================================================================
begin;

alter table market_prices
  add column if not exists source text;   -- rótulo da fonte da cotação; NULL = não informada

comment on column market_prices.source is
  'Fonte/procedência do preço corrente (ex.: ''Cotação de referência BTA'', ''Demonstração''). Exibida no app com data e disclaimer.';

commit;
