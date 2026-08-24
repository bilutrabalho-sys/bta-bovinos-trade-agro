import { Router } from 'express';
import { pool } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { mapTransporter, mapService } from '../mappers';

const router = Router();

// GET /api/transporters -> TRANSPORTERS[]  (mock não expõe state)
router.get(
  '/transporters',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select t.id, t.name, t.rating, t.trips, t.capacity,
              t.price_per_km, t.verified, t.location, t.available
       from transporters t
       order by t.id`,
    );
    res.json(rows.map(mapTransporter));
  }),
);

// GET /api/services -> SERVICES[]
router.get(
  '/services',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select s.id, s.name, s.icon, s.description, s.status
       from services s
       order by s.id`,
    );
    res.json(rows.map(mapService));
  }),
);

export default router;
