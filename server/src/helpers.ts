import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ---------------------------------------------------------------------------
//  asyncHandler: encapsula handlers async para que exceções virem next(err)
//  e caiam no middleware de erro central (Express 4 não faz isso sozinho).
// ---------------------------------------------------------------------------
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// ---------------------------------------------------------------------------
//  Parsers de input com validação estrita (nunca confiar no cliente).
// ---------------------------------------------------------------------------

/** Inteiro positivo obrigatório. Retorna null se ausente ou inválido. */
export function parseRequiredId(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Inteiro positivo OPCIONAL, distinguindo os três casos:
 *  - null       => campo ausente (ok, não fornecido)
 *  - 'invalid'  => campo presente porém inválido (deve virar 400)
 *  - number     => valor válido
 */
export type OptionalId = number | null | 'invalid';
export function parseOptionalId(v: unknown): OptionalId {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n) || n <= 0) return 'invalid';
  return n;
}

/** Número real >= 0 (preços). Retorna null se ausente/ inválido/ negativo. */
export function parseMoney(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Unidade de preço válida do domínio. */
export function parsePriceUnit(v: unknown): '/@' | '/cab' | null {
  return v === '/@' || v === '/cab' ? v : null;
}

// ---------------------------------------------------------------------------
//  Mapeamento de erro do Postgres -> status HTTP.
//  (SQLSTATE: https://www.postgresql.org/docs/current/errcodes-appendix.html)
// ---------------------------------------------------------------------------
export function pgErrorStatus(code: string | undefined): number {
  switch (code) {
    case '23505':
      return 409; // unique_violation (favorito duplicado, etc.)
    case '23503':
      return 400; // foreign_key_violation (id de entidade inexistente)
    case '23514':
      return 400; // check_violation (ex.: exclusive arc de favorites)
    case '23502':
      return 400; // not_null_violation
    case '22P02':
      return 400; // invalid_text_representation (enum/número inválido)
    case '22003':
      return 400; // numeric_value_out_of_range
    default:
      return 500;
  }
}
