import { Router } from 'express';
import { pool, DEFAULT_USER_ID } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { mapOpportunity, mapRadarAlert, mapMatchResult } from '../mappers';

const router = Router();

// GET /api/opportunities -> OPPORTUNITIES[]  (feed global: user_id NULL)
router.get(
  '/opportunities',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select o.id, o.lot_id, o.title, o.avg_regional, o.price_diff,
              o.distance, o.freight, o.score, o.reason
       from opportunities o
       where o.user_id is null
       order by o.id`,
    );
    res.json(rows.map(mapOpportunity));
  }),
);

// GET /api/radar-alerts -> RADAR_ALERTS[]  (radares do usuário logado)
router.get(
  '/radar-alerts',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select r.id, r.title, r.criteria_text, r.active, r.matches
       from radars r
       where r.user_id = $1 and r.deleted_at is null
       order by r.id`,
      [DEFAULT_USER_ID],
    );
    res.json(rows.map(mapRadarAlert));
  }),
);

// GET /api/match-results -> MATCH_RESULTS[]  (da busca do BTA Match do usuário)
router.get(
  '/match-results',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select mr.lot_id, mr.compatibility, mr.highlight
       from match_results mr
       join match_searches ms on ms.id = mr.match_search_id
       where ms.user_id = $1
       order by mr.compatibility desc, mr.id`,
      [DEFAULT_USER_ID],
    );
    res.json(rows.map(mapMatchResult));
  }),
);

export default router;
