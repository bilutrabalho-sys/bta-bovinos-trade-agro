// ============================================================================
//  auth.ts — Autenticação de USUÁRIO (login próprio: e-mail + senha + JWT).
// ----------------------------------------------------------------------------
//  DESACOPLADO do admin-auth.ts (aquele protege o painel de preços com um token
//  estático). Aqui é o login real dos usuários da plataforma.
//
//  Modelo:
//    * Senha guardada como hash bcrypt (users.password_hash). NUNCA em texto.
//    * Sessão sem estado no servidor (stateless): um JWT assinado com JWT_SECRET,
//      payload { userId }, validade ~30 dias. O cliente guarda o token e o envia
//      em `Authorization: Bearer <jwt>`. Logout = cliente descarta o token.
//    * external_auth_id (Firebase/OTP) fica RESERVADO para o futuro; não usado.
//
//  Segurança:
//    * JWT_SECRET é OBRIGATÓRIO — o módulo falha ao carregar se não houver
//      segredo forte (fail-closed). Migrations/seed não importam este arquivo,
//      então `db:setup` não exige o segredo.
//    * As consultas de auth usam o `pool` (owner) de propósito: autenticação é a
//      camada CONFIÁVEL que estabelece a identidade; a RLS por-usuário (bta_app)
//      só entra DEPOIS, nas queries de dado pessoal (ver db.ts withUser).
//    * password_hash JAMAIS é retornado pela API (serializeUser o remove).
// ============================================================================
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { pool } from './db';
import type { Row } from './db';

// ---------------------------------------------------------------------------
//  Configuração / segredo.
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (JWT_SECRET.length < 16) {
  // Fail-closed: sem um segredo forte, NÃO subimos a autenticação. Assim nunca
  // rodamos com um segredo vazio/fraco por engano em nenhum ambiente.
  throw new Error(
    'JWT_SECRET ausente ou muito curto (mín. 16 chars). Defina-o no ambiente ' +
      '(server/.env em dev; variável de ambiente em produção) antes de subir a API.',
  );
}

const JWT_EXPIRES_IN: SignOptions['expiresIn'] = '30d';
const BCRYPT_COST = 12; // custo do bcrypt (2^12 rounds) — forte e ainda rápido o bastante.

// ---------------------------------------------------------------------------
//  Tipos.
// ---------------------------------------------------------------------------
/** Projeção segura do usuário devolvida pela API (NUNCA inclui hash/PII sensível). */
export interface PublicUser {
  id: number;
  name: string;
  email: string | null;
  userType: string; // = users.role (visitante, comprador, vendedor, ...)
  location: string | null;
}

interface TokenPayload {
  userId: number;
}

// Aumenta o Request do Express com o usuário resolvido pelos middlewares.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
      authUser?: PublicUser;
    }
  }
}

// ---------------------------------------------------------------------------
//  Senha (bcrypt).
// ---------------------------------------------------------------------------
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Hash "descartável" de tempo constante para o caminho "usuário não existe" no
// login — gasta o mesmo tempo de um compare real e evita user-enumeration por timing.
const DUMMY_HASH = bcrypt.hashSync('bta-dummy-password-para-timing', BCRYPT_COST);
export async function dummyCompare(): Promise<void> {
  await bcrypt.compare('bta-dummy-password-para-timing', DUMMY_HASH);
}

// ---------------------------------------------------------------------------
//  JWT.
// ---------------------------------------------------------------------------
export function signToken(userId: number): string {
  const payload: TokenPayload = { userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Verifica o JWT e devolve o userId, ou null se ausente/inválido/expirado. */
export function verifyToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null) {
      const uid = (decoded as Record<string, unknown>).userId;
      const n = typeof uid === 'number' ? uid : Number(uid);
      if (Number.isInteger(n) && n > 0) return n;
    }
    return null;
  } catch {
    return null;
  }
}

/** Extrai o token de `Authorization: Bearer <jwt>` (string vazia se ausente). */
function extractBearer(req: Request): string {
  const header = req.headers.authorization ?? '';
  const prefix = 'Bearer ';
  return header.startsWith(prefix) ? header.slice(prefix.length).trim() : '';
}

// ---------------------------------------------------------------------------
//  Serialização segura + carga do usuário ATIVO.
// ---------------------------------------------------------------------------
export function serializeUser(row: Row): PublicUser {
  return {
    id: Number(row.id),
    name: row.name === null || row.name === undefined ? '' : String(row.name),
    email: row.email === null || row.email === undefined ? null : String(row.email),
    userType: row.role === null || row.role === undefined ? 'visitante' : String(row.role),
    location: row.location === null || row.location === undefined ? null : String(row.location),
  };
}

/**
 * Carrega o usuário ATIVO (não soft-deletado) pelo id, projetando só campos
 * seguros. Usa o `pool` (owner) — users não tem RLS e a auth é a camada
 * confiável. Retorna null se o usuário não existe ou foi excluído/anonimizado.
 */
export async function loadActiveUser(userId: number): Promise<PublicUser | null> {
  const { rows } = await pool.query<Row>(
    `select id, name, email, role, location
       from users
      where id = $1 and deleted_at is null`,
    [userId],
  );
  return rows.length > 0 ? serializeUser(rows[0]) : null;
}

// ---------------------------------------------------------------------------
//  Middlewares.
// ---------------------------------------------------------------------------
/**
 * requireAuth — exige um Bearer JWT VÁLIDO de um usuário ATIVO.
 *  - 401 se ausente, inválido, expirado, ou de um usuário excluído.
 *  - Em sucesso: seta req.userId e req.authUser.
 * Use nas ESCRITAS de dado pessoal e em ações de alto valor.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req);
  if (token === '') {
    res.status(401).json({ error: 'Autenticação necessária. Envie Authorization: Bearer <token>.' });
    return;
  }
  const userId = verifyToken(token);
  if (userId === null) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
    return;
  }
  try {
    const user = await loadActiveUser(userId);
    if (!user) {
      res.status(401).json({ error: 'Sessão inválida (usuário inexistente ou excluído).' });
      return;
    }
    req.userId = user.id;
    req.authUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * optionalAuth — NÃO bloqueia. Se houver um Bearer JWT válido de usuário ativo,
 * seta req.userId/req.authUser; caso contrário segue anônimo (sem erro).
 * Use nas LEITURAS de dado pessoal: anônimo => a rota devolve lista vazia.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req);
  if (token === '') {
    next();
    return;
  }
  const userId = verifyToken(token);
  if (userId === null) {
    next();
    return;
  }
  try {
    const user = await loadActiveUser(userId);
    if (user) {
      req.userId = user.id;
      req.authUser = user;
    }
    next();
  } catch (err) {
    next(err);
  }
}
