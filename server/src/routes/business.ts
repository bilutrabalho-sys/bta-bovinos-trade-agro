import { Router } from 'express';
import { withUser, DEFAULT_PROPOSAL_ID } from '../db';
import type { Row } from '../db';
import { asyncHandler, parseRequiredId, parseMoney, parsePriceUnit } from '../helpers';
import { optionalAuth, requireAuth } from '../auth';
import { mapChatMessage, mapSavedSimulation, mapProposal } from '../mappers';

const router = Router();

// GET /api/chat-messages -> CHAT_MESSAGES[]  (negociação seed, proposta 1).
// RLS enforced: só as PARTES da proposta (comprador/dono da farm) enxergam o
// chat. Anônimo ou usuário não-parte => lista vazia.
router.get(
  '/chat-messages',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.userId === undefined) {
      res.json([]);
      return;
    }
    const rows = await withUser(req.userId, async (client) => {
      const r = await client.query<Row>(
        `select m.id, m.sender as "from", m.text,
                to_char(m.sent_at at time zone 'America/Sao_Paulo', 'HH24:MI') as time
           from negotiation_messages m
          where m.proposal_id = $1
          order by m.sent_at, m.id`,
        [DEFAULT_PROPOSAL_ID],
      );
      return r.rows;
    });
    res.json(rows.map(mapChatMessage));
  }),
);

// GET /api/saved-simulations -> SAVED_SIMULATIONS[]  (do usuário logado; RLS enforced)
// Anônimo => lista vazia.
router.get(
  '/saved-simulations',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (req.userId === undefined) {
      res.json([]);
      return;
    }
    const rows = await withUser(req.userId, async (client) => {
      const r = await client.query<Row>(
        `select s.id, s.name,
                to_char(s.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as date,
                s.margin, s.investment, s.scenario
           from simulations s
          where s.user_id = $1 and s.deleted_at is null
          order by s.created_at desc, s.id`,
        [req.userId],
      );
      return r.rows;
    });
    res.json(rows.map(mapSavedSimulation));
  }),
);

// POST /api/proposals  (Bearer) — cria proposta do COMPRADOR logado.
// body { lotId, quantity, pricePerUnit, priceUnit }
// buyer_user_id vem do TOKEN; seller_farm_id é DERIVADO server-side de
// lots.seller_id (nunca do cliente). RLS garante buyer = usuário logado.
// INSERT ... SELECT torna a derivação + inserção atômica; 0 linhas => lote inexistente.
router.post(
  '/proposals',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const buyerUserId = req.userId as number; // garantido por requireAuth

    const lotId = parseRequiredId(body.lotId);
    const quantity = parseRequiredId(body.quantity);
    const pricePerUnit = parseMoney(body.pricePerUnit);
    const priceUnit = parsePriceUnit(body.priceUnit);

    const errors: string[] = [];
    if (lotId === null) errors.push('lotId (inteiro positivo)');
    if (quantity === null) errors.push('quantity (inteiro positivo)');
    if (pricePerUnit === null) errors.push('pricePerUnit (número >= 0)');
    if (priceUnit === null) errors.push("priceUnit ('/@' ou '/cab')");
    if (errors.length > 0) {
      res.status(400).json({ error: `Campos inválidos ou ausentes: ${errors.join(', ')}.` });
      return;
    }

    const result = await withUser(buyerUserId, async (client) => {
      return client.query<Row>(
        `insert into proposals
           (lot_id, buyer_user_id, seller_farm_id, proposed_price, price_unit, quantity)
         select $1::bigint, $2::bigint, l.seller_id, $3::numeric, $4::price_unit, $5::int
         from lots l
         where l.id = $1::bigint and l.deleted_at is null
         returning id, lot_id, buyer_user_id, seller_farm_id,
                   proposed_price, price_unit, quantity, status, created_at`,
        [lotId, buyerUserId, pricePerUnit, priceUnit, quantity],
      );
    });

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: `Lote ${lotId} não encontrado ou indisponível.` });
      return;
    }

    res.status(201).json(mapProposal(result.rows[0]));
  }),
);

export default router;
