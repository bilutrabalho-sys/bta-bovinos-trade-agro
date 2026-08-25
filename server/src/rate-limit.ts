// ============================================================================
//  rate-limit.ts — Middlewares de rate limiting (proteção contra força-bruta
//  e abuso). Depende de `app.set('trust proxy', 1)` (feito em index.ts) para
//  que a contagem por IP enxergue o cliente real atrás do proxy da Render.
// ----------------------------------------------------------------------------
//  Camadas:
//    * loginLimiter    -> POST /api/auth/login    (10 tentativas / 15 min / IP)
//    * registerLimiter -> POST /api/auth/register (5 cadastros  / 60 min / IP)
//    * apiLimiter      -> global em /api          (300 req / min / IP) — folga
//                         grande, só corta rajada anômala; não atrapalha o boot
//                         do app (vários fetches) nem o painel /admin.
//
//  Todas respondem 429 com JSON { error: "muitas tentativas..." } e usam os
//  headers padrão modernos (RateLimit-*), sem os legados (X-RateLimit-*).
// ============================================================================
import rateLimit from 'express-rate-limit';
import type { Options } from 'express-rate-limit';
import type { Request, Response } from 'express';

const MINUTE = 60 * 1000;

// Mensagem única e propositalmente genérica (não revela qual limite estourou).
const TOO_MANY_MESSAGE = 'muitas tentativas, tente novamente em instantes';

/**
 * Fábrica de limitadores com os padrões de segurança do projeto já aplicados:
 * janela deslizante por IP, headers modernos, 429 em JSON no formato do app.
 */
function makeLimiter(windowMs: number, limit: number) {
  const options: Partial<Options> = {
    windowMs,
    limit,
    standardHeaders: true, // expõe RateLimit-* (draft moderno)
    legacyHeaders: false, // esconde X-RateLimit-* (legado)
    // Resposta uniforme no mesmo shape de erro que o resto da API usa.
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ error: TOO_MANY_MESSAGE });
    },
  };
  return rateLimit(options);
}

// Login: alvo clássico de brute-force de senha. 10 tentativas por IP a cada
// 15 min — folgado para o usuário que erra a senha algumas vezes, apertado o
// bastante para inviabilizar varredura de senhas.
export const loginLimiter = makeLimiter(15 * MINUTE, 10);

// Registro: 5 cadastros por IP por hora — barra criação em massa de contas
// (spam/abuso) sem incomodar uso legítimo (raríssimo alguém criar >5 contas/h).
export const registerLimiter = makeLimiter(60 * MINUTE, 5);

// Proteção geral bem folgada sobre toda a API: 300 req/min por IP. Fica muito
// acima do tráfego normal do app (dezenas de fetches no boot) e do painel
// admin; só corta rajadas anômalas (scraping/DoS leve).
export const apiLimiter = makeLimiter(1 * MINUTE, 300);
