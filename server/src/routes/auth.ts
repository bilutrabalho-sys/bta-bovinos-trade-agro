// ============================================================================
//  routes/auth.ts — Autenticação de usuário (login próprio) sob /api/auth.
// ----------------------------------------------------------------------------
//    POST   /api/auth/register   { name, email, password }   -> { token, user }
//    POST   /api/auth/login      { email, password }          -> { token, user }
//    GET    /api/auth/me         (Bearer)                     -> { user }
//    POST   /api/auth/logout                                  -> 204
//    DELETE /api/auth/account    (Bearer)                     -> 204  (Play Store)
//
//  Regras de segurança aplicadas aqui:
//    * senha nunca em texto (bcrypt); password_hash nunca retornado;
//    * respostas de login/registro genéricas o suficiente p/ não vazar se um
//      e-mail existe (mesma mensagem 401 e tempo ~constante no login);
//    * validação estrita de input (e-mail válido, senha >= 8, nome não vazio).
// ============================================================================
import { Router } from 'express';
import { pool } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import {
  hashPassword,
  verifyPassword,
  dummyCompare,
  signToken,
  serializeUser,
  requireAuth,
  type PublicUser,
} from '../auth';

const router = Router();

// Papel padrão de quem se cadastra pelo login próprio: comprador (usuário real
// da vitrine). Pode virar vendedor/empreendedor depois (fluxo de "abrir fazenda").
const DEFAULT_ROLE = 'comprador';

// ---------------------------------------------------------------------------
//  Validação de input.
// ---------------------------------------------------------------------------
// E-mail: checagem pragmática (algo@algo.tld, sem espaços). O banco (citext
// unique) é a fonte da verdade de unicidade; aqui só barramos lixo óbvio.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200; // bcrypt trunca em 72 bytes; limitamos p/ evitar DoS de hash.

function normalizeEmail(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

// ---------------------------------------------------------------------------
//  POST /api/auth/register
// ---------------------------------------------------------------------------
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    const errors: string[] = [];
    if (name.length === 0 || name.length > MAX_NAME) errors.push(`name (1..${MAX_NAME} caracteres)`);
    if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL) errors.push('email (formato válido)');
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD)
      errors.push(`password (${MIN_PASSWORD}..${MAX_PASSWORD} caracteres)`);
    if (errors.length > 0) {
      res.status(400).json({ error: `Campos inválidos ou ausentes: ${errors.join(', ')}.` });
      return;
    }

    // Pré-checagem amigável de e-mail único (o índice UNIQUE é o guard real).
    const existing = await pool.query('select 1 from users where email = $1', [email]);
    if ((existing.rowCount ?? 0) > 0) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    const passwordHash = await hashPassword(password);

    let rows: Row[];
    try {
      const result = await pool.query<Row>(
        `insert into users (name, email, password_hash, role)
         values ($1, $2, $3, $4::user_role)
         returning id, name, email, role, location`,
        [name, email, passwordHash, DEFAULT_ROLE],
      );
      rows = result.rows;
    } catch (err) {
      // Corrida: dois registros simultâneos com o mesmo e-mail -> 23505.
      if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
        res.status(409).json({ error: 'E-mail já cadastrado.' });
        return;
      }
      throw err;
    }

    const user: PublicUser = serializeUser(rows[0]);
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  }),
);

// ---------------------------------------------------------------------------
//  POST /api/auth/login
// ---------------------------------------------------------------------------
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (email === '' || password === '') {
      res.status(400).json({ error: 'Informe email e password.' });
      return;
    }

    const { rows } = await pool.query<Row>(
      `select id, name, email, role, location, password_hash
         from users
        where email = $1 and deleted_at is null`,
      [email],
    );

    // Mensagem e tempo uniformes p/ não revelar se o e-mail existe.
    const row = rows[0];
    const hash = row && typeof row.password_hash === 'string' ? row.password_hash : null;
    const ok = hash ? await verifyPassword(password, hash) : (await dummyCompare(), false);

    if (!ok || !row) {
      res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      return;
    }

    const user: PublicUser = serializeUser(row);
    const token = signToken(user.id);
    res.json({ token, user });
  }),
);

// ---------------------------------------------------------------------------
//  GET /api/auth/me  (Bearer) — requireAuth já carregou o usuário ativo.
// ---------------------------------------------------------------------------
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.authUser });
  }),
);

// ---------------------------------------------------------------------------
//  POST /api/auth/logout — stateless: o cliente descarta o token. 204.
// ---------------------------------------------------------------------------
router.post('/logout', (_req, res) => {
  res.status(204).end();
});

// ---------------------------------------------------------------------------
//  DELETE /api/auth/account  (Bearer) — EXCLUSÃO DE CONTA (exigência Play Store).
// ----------------------------------------------------------------------------
//  Roda como owner (pool direto) numa ÚNICA transação — é uma operação
//  PRIVILEGIADA de sistema, escopada rigorosamente a req.userId em todo WHERE.
//  (bta_app não poderia: não há policy de DELETE em opportunities, p.ex.)
//
//  APAGA (hard-delete) — dado que é SÓ do usuário:
//    favorites, radars (+radar_state via cascade), simulations, notifications,
//    user_course_progress, user_lesson_progress, match_searches (+match_results
//    via cascade), user_preference, follows, subscriptions, e as opportunities
//    personalizadas dele (user_id = ele; o feed global user_id IS NULL é poupado).
//
//  ANONIMIZA / SOFT-DELETE — conteúdo referenciado por TERCEIROS (não pode
//  virar FK órfã; o vendedor/comprador do outro lado tem interesse legítimo):
//    * a própria linha users: PII zerada (name -> 'Usuário removido', email/phone/
//      location/state/external_auth_id/password_hash -> NULL, role -> visitante)
//      e deleted_at = now(). A linha PERMANECE p/ manter válidas as FKs
//      RESTRICT de proposals/transactions (onde ele foi comprador).
//    * farms do usuário (se houver) e seus lots: soft-delete (deleted_at=now())
//      -> saem da vitrine, mas as FKs de propostas/transações seguem válidas.
//    * proposals / negotiation_messages / transactions / transaction_steps /
//      transports: PRESERVADOS como registro da negociação de duas partes; o
//      lado do usuário fica de-identificado porque a linha users foi anonimizada.
//
//  Após isto o token dele morre (requireAuth/optionalAuth exigem deleted_at IS
//  NULL) e o login falha (email virou NULL).
// ---------------------------------------------------------------------------
router.delete(
  '/account',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId as number; // garantido por requireAuth
    const client = await pool.connect();
    try {
      await client.query('begin');

      // 1) Hard-delete do dado puramente pessoal (filhas caem por cascade).
      const personal = [
        'delete from favorites where user_id = $1',
        'delete from radars where user_id = $1', // radar_state -> cascade
        'delete from simulations where user_id = $1',
        'delete from notifications where user_id = $1',
        'delete from user_course_progress where user_id = $1',
        'delete from user_lesson_progress where user_id = $1',
        'delete from match_searches where user_id = $1', // match_results -> cascade
        'delete from user_preference where user_id = $1',
        'delete from follows where user_id = $1',
        'delete from subscriptions where user_id = $1',
        'delete from opportunities where user_id = $1', // só as personalizadas; global é NULL
      ];
      for (const sql of personal) {
        await client.query(sql, [userId]);
      }

      // 2) Soft-delete de conteúdo do usuário referenciável por terceiros:
      //    lots das farms dele, depois as farms. (deleted_at some da vitrine;
      //    as FKs de proposals/transactions continuam válidas.)
      await client.query(
        `update lots set deleted_at = now()
           where deleted_at is null
             and seller_id in (select id from farms where owner_user_id = $1)`,
        [userId],
      );
      await client.query(
        `update farms set deleted_at = now()
           where deleted_at is null and owner_user_id = $1`,
        [userId],
      );

      // 3) Anonimiza a própria linha users e a marca como excluída.
      await client.query(
        `update users set
            name             = 'Usuário removido',
            email            = null,
            phone            = null,
            location         = null,
            state            = null,
            external_auth_id = null,
            password_hash    = null,
            role             = 'visitante',
            deleted_at       = now(),
            updated_at       = now()
          where id = $1`,
        [userId],
      );

      await client.query('commit');
    } catch (err) {
      try {
        await client.query('rollback');
      } catch {
        /* best-effort */
      }
      throw err;
    } finally {
      client.release();
    }

    res.status(204).end();
  }),
);

export default router;
