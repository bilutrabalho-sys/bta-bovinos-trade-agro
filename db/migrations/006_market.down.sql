-- ============================================================================
--  006 · DOWN — dropa mercado (ordem inversa).
--  Índices de escopo caem junto das tabelas; dropados explicitamente antes
--  por fidelidade ao up.
-- ============================================================================
begin;

drop index if exists ux_market_points_scope_date;
drop table if exists market_price_points cascade;
drop index if exists ux_market_prices_scope;
drop table if exists market_prices       cascade;

commit;
