import { Router } from 'express';
import { pool, DEFAULT_USER_ID, DEFAULT_PROPOSAL_ID } from '../db';
import type { Row } from '../db';
import { asyncHandler, parseRequiredId, parseMoney, parsePriceUnit } from '../helpers';
import { mapChatMessage, mapSavedSimulation, mapProposal } from '../mappers';

const router = Router();

// GET /api/chat-messages -> CHAT_MESSAGES[]  (da negociação seed, proposta 1)
// time = HH:MM no fuso America/Sao_Paulo (independe do timezone do servidor).
router.get(
  '/chat-messages',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select m.id, m.sender as "from", m.text,
              to_char(m.sent_at at time zone 'America/Sao_Paulo', 'HH24:MI') as time
       from negotiation_messages m
       where m.proposal_id = $1
       order by m.sent_at, m.id`,
      [DEFAULT_PROPOSAL_ID],
    );
    res.json(rows.map(mapChatMessage));
  }),
);

// GET /api/saved-simulations -> SAVED_SIMULATIONS[]  (do usuário logado)
// date = dd/mm/aaaa; scenario capitalizado ('base' -> 'Base').
router.get(
  '/saved-simulations',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select s.id, s.name,
              to_char(s.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as date,
              s.margin, s.investment, s.scenario
       from simulations s
       where s.user_id = $1 and s.deleted_at is null
       order by s.created_at desc, s.id`,
      [DEFAULT_USER_ID],
    );
    res.json(rows.map(mapSavedSimulation));
  }),
);

// POST /api/proposals
// body { lotId, buyerUserId, quantity, pricePerUnit, priceUnit }
// seller_farm_id é DERIVADO server-side de lots.seller_id (nunca vem do cliente).
// INSERT ... SELECT torna a derivação + inserção atômica; 0 linhas => lote inexistente.
router.post(
  '/proposals',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const lotId = parseRequiredId(body.lotId);
    const buyerUserId = parseRequiredId(body.buyerUserId);
    const quantity = parseRequiredId(body.quantity);
    const pricePerUnit = parseMoney(body.pricePerUnit);
    const priceUnit = parsePriceUnit(body.priceUnit);

    const errors: string[] = [];
    if (lotId === null) errors.push('lotId (inteiro positivo)');
    if (buyerUserId === null) errors.push('buyerUserId (inteiro positivo)');
    if (quantity === null) errors.push('quantity (inteiro positivo)');
    if (pricePerUnit === null) errors.push('pricePerUnit (número >= 0)');
    if (priceUnit === null) errors.push("priceUnit ('/@' ou '/cab')");
    if (errors.length > 0) {
      res.status(400).json({ error: `Campos inválidos ou ausentes: ${errors.join(', ')}.` });
      return;
    }

    const { rows, rowCount } = await pool.query<Row>(
      `insert into proposals
         (lot_id, buyer_user_id, seller_farm_id, proposed_price, price_unit, quantity)
       select $1::bigint, $2::bigint, l.seller_id, $3::numeric, $4::price_unit, $5::int
       from lots l
       where l.id = $1::bigint and l.deleted_at is null
       returning id, lot_id, buyer_user_id, seller_farm_id,
                 proposed_price, price_unit, quantity, status, created_at`,
      [lotId, buyerUserId, pricePerUnit, priceUnit, quantity],
    );

    if ((rowCount ?? 0) === 0) {
      res.status(404).json({ error: `Lote ${lotId} não encontrado ou indisponível.` });
      return;
    }

    res.status(201).json(mapProposal(rows[0]));
  }),
);

export default router;
