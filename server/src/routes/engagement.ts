import { Router } from 'express';
import { pool, DEFAULT_USER_ID } from '../db';
import type { Row } from '../db';
import { asyncHandler, parseRequiredId, parseOptionalId } from '../helpers';
import type { OptionalId } from '../helpers';
import { mapNotification, mapFavorite } from '../mappers';

const router = Router();

// GET /api/notifications -> NOTIFICATIONS[]  (time reconstruído de created_at)
router.get(
  '/notifications',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select n.id, n.type, n.title, n.body, n.read, n.created_at
       from notifications n
       where n.user_id = $1
       order by n.id`,
      [DEFAULT_USER_ID],
    );
    res.json(rows.map(mapNotification));
  }),
);

// POST /api/favorites
// body { userId, lotId?, farmId?, opportunityId?, simulationId?, lessonId? }
// Respeita o "exclusive arc": EXATAMENTE 1 alvo por favorito.
router.post(
  '/favorites',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const userId = parseRequiredId(body.userId);
    if (userId === null) {
      res.status(400).json({ error: 'userId é obrigatório e deve ser um inteiro positivo.' });
      return;
    }

    // Cada alvo: null (ausente) | 'invalid' (presente mas inválido) | number.
    const targets: Record<string, OptionalId> = {
      lot_id: parseOptionalId(body.lotId),
      farm_id: parseOptionalId(body.farmId),
      opportunity_id: parseOptionalId(body.opportunityId),
      simulation_id: parseOptionalId(body.simulationId),
      lesson_id: parseOptionalId(body.lessonId),
    };

    const invalid = Object.entries(targets).find(([, v]) => v === 'invalid');
    if (invalid) {
      res.status(400).json({ error: `Alvo inválido: ${invalid[0]} deve ser um inteiro positivo.` });
      return;
    }

    const provided = Object.values(targets).filter((v): v is number => typeof v === 'number');
    if (provided.length !== 1) {
      res.status(400).json({
        error:
          'Forneça EXATAMENTE 1 alvo entre lotId, farmId, opportunityId, simulationId ou lessonId.',
      });
      return;
    }

    const toParam = (v: OptionalId): number | null => (typeof v === 'number' ? v : null);

    const { rows } = await pool.query<Row>(
      `insert into favorites (user_id, lot_id, farm_id, opportunity_id, simulation_id, lesson_id)
       values ($1, $2, $3, $4, $5, $6)
       returning id, user_id, lot_id, farm_id, opportunity_id, simulation_id, lesson_id, created_at`,
      [
        userId,
        toParam(targets.lot_id),
        toParam(targets.farm_id),
        toParam(targets.opportunity_id),
        toParam(targets.simulation_id),
        toParam(targets.lesson_id),
      ],
    );

    res.status(201).json(mapFavorite(rows[0]));
  }),
);

export default router;
