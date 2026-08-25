import { Router } from 'express';
import { withUser } from '../db';
import type { Row } from '../db';
import { asyncHandler, parseOptionalId } from '../helpers';
import type { OptionalId } from '../helpers';
import { optionalAuth, requireAuth } from '../auth';
import { mapNotification, mapFavorite } from '../mappers';

const router = Router();

// GET /api/notifications -> NOTIFICATIONS[]  (do usuário logado; RLS enforced)
// Anônimo => lista vazia (o app tem empty state).
router.get(
  '/notifications',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.userId === undefined) {
      res.json([]);
      return;
    }
    const rows = await withUser(req.userId, async (client) => {
      const r = await client.query<Row>(
        `select n.id, n.type, n.title, n.body, n.read, n.created_at
           from notifications n
          where n.user_id = $1
          order by n.id`,
        [req.userId],
      );
      return r.rows;
    });
    res.json(rows.map(mapNotification));
  }),
);

// GET /api/favorites -> Favorite[]  (favoritos do usuário logado; RLS enforced)
// Anônimo => lista vazia.
router.get(
  '/favorites',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.userId === undefined) {
      res.json([]);
      return;
    }
    const rows = await withUser(req.userId, async (client) => {
      const r = await client.query<Row>(
        `select id, user_id, lot_id, farm_id, opportunity_id, simulation_id, lesson_id, created_at
           from favorites
          where user_id = $1
          order by id`,
        [req.userId],
      );
      return r.rows;
    });
    res.json(rows.map(mapFavorite));
  }),
);

// POST /api/favorites  (Bearer) — cria favorito do usuário LOGADO.
// body { lotId?, farmId?, opportunityId?, simulationId?, lessonId? }
// user_id vem do TOKEN (nunca do cliente). Respeita o "exclusive arc":
// EXATAMENTE 1 alvo por favorito. RLS garante que só grava p/ o próprio usuário.
router.post(
  '/favorites',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const userId = req.userId as number; // garantido por requireAuth

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

    const favorite = await withUser(userId, async (client) => {
      const r = await client.query<Row>(
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
      return r.rows[0];
    });

    res.status(201).json(mapFavorite(favorite));
  }),
);

export default router;
