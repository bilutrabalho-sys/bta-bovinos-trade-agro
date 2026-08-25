import { Router } from 'express';
import { pool, withUser } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { optionalAuth } from '../auth';
import { mapOpportunity, mapRadarAlert, mapMatchResult } from '../mappers';

const router = Router();

// GET /api/opportunities -> OPPORTUNITIES[]  (feed GLOBAL: user_id NULL — PÚBLICO)
// Continua sem login: é a vitrine de oportunidades da plataforma.
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

// GET /api/radar-alerts -> RADAR_ALERTS[]  (radares do usuário logado; RLS enforced)
// Anônimo => lista vazia.
router.get(
  '/radar-alerts',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.userId === undefined) {
      res.json([]);
      return;
    }
    const rows = await withUser(req.userId, async (client) => {
      const r = await client.query<Row>(
        `select r.id, r.title, r.criteria_text, r.active, r.matches
           from radars r
          where r.user_id = $1 and r.deleted_at is null
          order by r.id`,
        [req.userId],
      );
      return r.rows;
    });
    res.json(rows.map(mapRadarAlert));
  }),
);

// GET /api/match-results -> MATCH_RESULTS[]  (do BTA Match do usuário; RLS enforced)
// Anônimo => lista vazia.
router.get(
  '/match-results',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.userId === undefined) {
      res.json([]);
      return;
    }
    const rows = await withUser(req.userId, async (client) => {
      const r = await client.query<Row>(
        `select mr.lot_id, mr.compatibility, mr.highlight
           from match_results mr
           join match_searches ms on ms.id = mr.match_search_id
          where ms.user_id = $1
          order by mr.compatibility desc, mr.id`,
        [req.userId],
      );
      return r.rows;
    });
    res.json(rows.map(mapMatchResult));
  }),
);

export default router;
