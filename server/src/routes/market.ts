import { Router } from 'express';
import { pool } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { buildMarketData } from '../mappers';

const router = Router();

// Snapshot corrente por categoria (region/state NULL = nacional).
// source: fonte da cotação (fallback "—" quando não informada).
// updated_at: data (YYYY-MM-DD) do snapshot_at, para o app exibir "atualizado em".
const SNAPSHOT_SQL = `
  select cc.name as category, mp.current, mp.change, mp.unit, mp.color,
         coalesce(mp.source, '—') as source,
         to_char(mp.snapshot_at, 'YYYY-MM-DD') as updated_at
  from market_prices mp
  join cattle_category cc on cc.id = mp.category_id
  where mp.region is null and mp.state is null
  order by mp.id`;

// Série de preços na janela de N dias (nacional). day formatado dd/mm (pt-BR).
const SERIES_SQL = `
  select cc.name as category, to_char(p.price_date, 'DD/MM') as day, p.value
  from market_price_points p
  join cattle_category cc on cc.id = p.category_id
  where p.region is null and p.price_date >= current_date - $1::int
  order by cc.name, p.price_date`;

// GET /api/market -> MARKET_DATA
// { 'Boi Gordo': { current, change, unit, color, history7, history30, history90 }, ... }
router.get(
  '/market',
  asyncHandler(async (_req, res) => {
    const [snapshots, s7, s30, s90] = await Promise.all([
      pool.query<Row>(SNAPSHOT_SQL),
      pool.query<Row>(SERIES_SQL, [7]),
      pool.query<Row>(SERIES_SQL, [30]),
      pool.query<Row>(SERIES_SQL, [90]),
    ]);
    res.json(buildMarketData(snapshots.rows, s7.rows, s30.rows, s90.rows));
  }),
);

export default router;
