// ============================================================================
//  admin-auth.ts — Middleware de autenticação do painel administrativo.
// ----------------------------------------------------------------------------
//  MODELO (Fase 1, propositalmente simples e DESACOPLADO do login de usuário):
//    - Exige o header  `Authorization: Bearer <ADMIN_TOKEN>`.
//    - `ADMIN_TOKEN` vem SEMPRE de process.env (nunca versionado no repo).
//    - Se `ADMIN_TOKEN` NÃO estiver setado, as rotas admin respondem 503
//      ("admin desabilitado"). É um "fail-closed": jamais ficam abertas por
//      engano num ambiente onde ninguém configurou o token.
//
//  A comparação do token é feita em tempo constante (crypto.timingSafeEqual)
//  para não vazar o tamanho/prefixo do segredo por timing attack.
//
//  FASE 2 (NÃO implementada aqui): login real de usuário, RBAC e RLS no banco.
// ============================================================================
import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** Comparação em tempo constante de duas strings (evita timing attack). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual exige buffers do MESMO tamanho; se diferem, já não batem.
  // Comparamos contra um buffer do próprio tamanho de `a` para não sair cedo.
  if (bufA.length !== bufB.length) {
    // ainda gasta uma comparação para uniformizar o tempo de resposta
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Middleware que protege as rotas administrativas.
 *  - 503 se ADMIN_TOKEN não configurado (painel desabilitado).
 *  - 401 se o header Authorization estiver ausente ou o token não bater.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = process.env.ADMIN_TOKEN;

  if (!token || token.trim() === '') {
    res.status(503).json({
      error: 'Painel administrativo desabilitado (ADMIN_TOKEN não configurado no servidor).',
    });
    return;
  }

  const header = req.headers.authorization ?? '';
  const prefix = 'Bearer ';
  const provided = header.startsWith(prefix) ? header.slice(prefix.length) : '';

  if (provided === '' || !safeEqual(provided, token)) {
    res.status(401).json({ error: 'Não autorizado. Envie o header Authorization: Bearer <token>.' });
    return;
  }

  next();
}
