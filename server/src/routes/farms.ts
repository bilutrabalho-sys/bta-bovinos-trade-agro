import { Router } from 'express';
import { pool } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { mapFarm } from '../mappers';

const router = Router();

// GET /api/farms -> Farm[]
// specialties[] agregadas de farm_specialty; since = since_year (cast p/ string na API).
router.get(
  '/farms',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select
         f.id,
         f.name,
         f.rating,
         f.deals,
         f.completion,
         f.location,
         f.state,
         f.verified,
         f.active_lots,
         f.since_year,
         f.description,
         coalesce(
           array_agg(fs.specialty order by fs.id) filter (where fs.specialty is not null),
           '{}'
         ) as specialties
       from farms f
       left join farm_specialty fs on fs.farm_id = f.id
       where f.deleted_at is null
       group by f.id
       order by f.id`,
    );
    res.json(rows.map(mapFarm));
  }),
);

export default router;
