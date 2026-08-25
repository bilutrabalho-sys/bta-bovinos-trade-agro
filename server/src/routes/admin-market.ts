// ============================================================================
//  admin-market.ts — Rotas do painel administrativo de PREÇOS DE MERCADO.
//  Montado em /api/admin/market (ver index.ts). Protegido por requireAdmin.
// ----------------------------------------------------------------------------
//  GET  /api/admin/market/prices   -> snapshot corrente nacional de todas as
//                                     categorias (para o painel exibir os valores).
//  POST /api/admin/market/prices   -> equipe grava o novo preço de referência.
//        body: { items: [{ category, value, priceDate?, source? }] }
//        Para cada item, server-side (nunca confia no cliente):
//          1. resolve category_id pelo NOME e define `unit` pela categoria;
//          2. upsert em market_price_points (série diária, escopo nacional);
//          3. upsert em market_prices (snapshot corrente): current=value,
//             change = variação % vs. o ponto do dia ANTERIOR mais recente
//             (0 se não houver), source = source ?? 'Cotação de referência BTA'.
//             `color` é preservada (o do..update não a toca).
// ============================================================================
import { Router } from 'express';
import { pool } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { requireAdmin } from '../admin-auth';

const router = Router();

// Todas as rotas deste router exigem o token de admin.
router.use(requireAdmin);

const DEFAULT_SOURCE = 'Cotação de referência BTA';

// Unidade canônica por categoria (Bezerro/Garrote são vendidos por cabeça).
function unitForCategory(name: string): '/@' | '/cab' {
  return name === 'Bezerro' || name === 'Garrote' ? '/cab' : '/@';
}

// Valida uma data no formato YYYY-MM-DD que seja um dia de calendário real.
function isValidIsoDate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// ---------------------------------------------------------------------------
//  GET /prices — snapshot corrente nacional de TODAS as categorias.
//  LEFT JOIN a partir de cattle_category: categorias sem snapshot aparecem
//  com valores null (o painel ainda as lista para receber o primeiro preço).
// ---------------------------------------------------------------------------
const LIST_SQL = `
  select cc.id   as category_id,
         cc.name as category,
         mp.current,
         mp.change,
         mp.unit,
         mp.color,
         mp.source,
         to_char(mp.snapshot_at, 'YYYY-MM-DD') as updated_at
  from cattle_category cc
  left join market_prices mp
    on mp.category_id = cc.id and mp.region is null and mp.state is null
  order by cc.id`;

router.get(
  '/prices',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(LIST_SQL);
    const prices = rows.map((r) => ({
      categoryId: r.category_id === null ? null : Number(r.category_id),
      category: String(r.category),
      current: r.current === null ? null : Number(r.current),
      change: r.change === null ? null : Number(r.change),
      unit: r.unit === null ? unitForCategory(String(r.category)) : String(r.unit),
      color: r.color === null ? null : String(r.color),
      source: r.source === null ? null : String(r.source),
      updatedAt: r.updated_at === null ? null : String(r.updated_at),
    }));
    res.json({ prices });
  }),
);

// ---------------------------------------------------------------------------
//  POST /prices — grava os novos preços de referência.
// ---------------------------------------------------------------------------
interface ParsedItem {
  category: string;
  value: number;
  priceDate: string | null; // null => usa current_date no banco
  source: string;
}

router.post(
  '/prices',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { items?: unknown };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Body inválido: esperado { items: [...] } não vazio.' });
      return;
    }

    // Nomes de categoria válidos (id por nome) direto do banco.
    const catRows = await pool.query<Row>('select id, name from cattle_category');
    const catIdByName = new Map<string, number>();
    for (const r of catRows.rows) catIdByName.set(String(r.name), Number(r.id));

    // 1) Validação ESTRITA de todos os itens ANTES de qualquer escrita.
    const parsed: ParsedItem[] = [];
    for (let i = 0; i < body.items.length; i++) {
      const raw = (body.items[i] ?? {}) as Record<string, unknown>;
      const category = typeof raw.category === 'string' ? raw.category.trim() : '';
      if (category === '' || !catIdByName.has(category)) {
        res.status(400).json({ error: `Item ${i}: categoria inválida ou inexistente ("${category}").` });
        return;
      }
      const value = typeof raw.value === 'number' ? raw.value : Number(raw.value);
      if (!Number.isFinite(value) || value <= 0) {
        res.status(400).json({ error: `Item ${i} (${category}): "value" deve ser um número > 0.` });
        return;
      }
      let priceDate: string | null = null;
      if (raw.priceDate !== undefined && raw.priceDate !== null && raw.priceDate !== '') {
        if (!isValidIsoDate(raw.priceDate)) {
          res.status(400).json({ error: `Item ${i} (${category}): "priceDate" deve ser YYYY-MM-DD válida.` });
          return;
        }
        priceDate = raw.priceDate;
      }
      const source =
        typeof raw.source === 'string' && raw.source.trim() !== '' ? raw.source.trim() : DEFAULT_SOURCE;
      parsed.push({ category, value, priceDate, source });
    }

    // 2) Escrita atômica (todos os itens numa transação).
    const client = await pool.connect();
    const updated: Array<Record<string, unknown>> = [];
    try {
      await client.query('begin');

      for (const item of parsed) {
        const categoryId = catIdByName.get(item.category) as number;
        const unit = unitForCategory(item.category);

        // Data efetiva (default: hoje no banco). Resolvida no servidor de BD.
        const dr = await client.query<Row>('select coalesce($1::date, current_date)::text as d', [
          item.priceDate,
        ]);
        const priceDate = String(dr.rows[0].d);

        // change = variação % vs. o ponto do dia ANTERIOR mais recente (nacional).
        const pr = await client.query<Row>(
          `select value from market_price_points
             where category_id = $1 and region is null and price_date < $2::date
             order by price_date desc
             limit 1`,
          [categoryId, priceDate],
        );
        const prev = pr.rowCount ? Number(pr.rows[0].value) : null;
        const change =
          prev !== null && prev > 0 ? Math.round(((item.value - prev) / prev) * 10000) / 100 : 0;

        // Upsert do ponto diário (escopo nacional: region NULL).
        await client.query(
          `insert into market_price_points (category_id, region, price_date, value)
             values ($1, null, $2::date, $3)
           on conflict (category_id, coalesce(region, '*'), price_date)
             do update set value = excluded.value`,
          [categoryId, priceDate, item.value],
        );

        // Upsert do snapshot corrente (escopo nacional: region/state NULL).
        // `color` NÃO é tocada no do..update — preserva o valor existente.
        const snap = await client.query<Row>(
          `insert into market_prices
             (category_id, current, change, unit, color, region, state, source, snapshot_at, updated_at)
             values ($1, $2, $3, $4::price_unit, null, null, null, $5, now(), now())
           on conflict (category_id, coalesce(region, '*'), coalesce(state, '*'))
             do update set current     = excluded.current,
                           change      = excluded.change,
                           unit        = excluded.unit,
                           source      = excluded.source,
                           snapshot_at = now(),
                           updated_at  = now()
           returning current, change, unit, source,
                     to_char(snapshot_at, 'YYYY-MM-DD') as updated_at`,
          [categoryId, item.value, change, unit, item.source],
        );

        const row = snap.rows[0];
        updated.push({
          category: item.category,
          categoryId,
          priceDate,
          current: Number(row.current),
          change: Number(row.change),
          unit: String(row.unit),
          source: String(row.source),
          updatedAt: String(row.updated_at),
        });
      }

      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }

    res.status(200).json({ updated });
  }),
);

export default router;
