import { Router } from 'express';
import { pool } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { mapLot } from '../mappers';

const router = Router();

// GET /api/lots -> Lot[]
// Reconstrói o mock: category/breed/purpose por JOIN (nome), image = capa
// (is_cover), images[] = galeria ordenada por position.
router.get(
  '/lots',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select
         l.id,
         l.title,
         cc.name  as category,
         br.name  as breed,
         l.quantity,
         l.weight,
         l.price,
         l.price_unit,
         l.price_total,
         l.location,
         l.state,
         l.distance,
         l.freight,
         l.score,
         l.verified,
         l.seller_id,
         l.age,
         l.sex,
         pp.name  as purpose,
         l.description,
         cover.url as image,
         coalesce(gallery.images, '{}') as images
       from lots l
       join cattle_category cc on cc.id = l.category_id
       join breed br          on br.id = l.breed_id
       left join purpose pp    on pp.id = l.purpose_id
       left join lateral (
         select li.url
         from lot_images li
         where li.lot_id = l.id and li.is_cover
         order by li.position
         limit 1
       ) cover on true
       left join lateral (
         select array_agg(li.url order by li.position) as images
         from lot_images li
         where li.lot_id = l.id
       ) gallery on true
       where l.deleted_at is null
       order by l.id`,
    );
    res.json(rows.map(mapLot));
  }),
);

export default router;
