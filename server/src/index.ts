import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import lotsRouter from './routes/lots';
import farmsRouter from './routes/farms';
import marketRouter from './routes/market';
import adminMarketRouter from './routes/admin-market';
import discoveryRouter from './routes/discovery';
import academyRouter from './routes/academy';
import engagementRouter from './routes/engagement';
import logisticsRouter from './routes/logistics';
import businessRouter from './routes/business';
import { pgErrorStatus } from './helpers';
import { apiLimiter } from './rate-limit';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // .../server/src
const PUBLIC_DIR = path.resolve(HERE, '..', 'public'); // .../server/public

const app = express();

// Render (e outros PaaS) ficam atrás de um proxy reverso. Confiar no 1º hop faz
// req.ip / protocolo / futuros rate-limits e cookies "secure" enxergarem o
// cliente real em vez do proxy.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
//  CORS por ambiente (via env ALLOWED_ORIGINS).
//  - ALLOWED_ORIGINS definido (lista separada por vírgula) => restringe a
//    EXATAMENTE essas origens. É assim que se protege a API em produção. Ex.:
//      ALLOWED_ORIGINS=https://app.bta.com.br,https://www.bta.com.br
//  - ALLOWED_ORIGINS ausente (dev) => libera geral (reflete a origem da
//    requisição). Assim o Vite em localhost:5173, previews e etc. nunca quebram.
//  - Curinga explícito: ALLOWED_ORIGINS=* também libera geral.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOrigin: boolean | string[] =
  allowedOrigins.length === 0 || allowedOrigins.includes('*') ? true : allowedOrigins;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Sanidade / health-check.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'bta-server' });
});

// Painel administrativo interno (HTML estático em server/public).
// `/admin` serve o formulário; o restante do diretório é servido como arquivos.
app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});
app.use(express.static(PUBLIC_DIR));

// Proteção geral bem folgada sobre TODA a API (300 req/min/IP). Fica muito
// acima do tráfego normal do app (vários fetches no boot) e do painel admin;
// só corta rajadas anômalas. Vem ANTES dos routers /api, mas DEPOIS do
// health-check e do /admin (que ficam de fora, isentos do limite).
app.use('/api', apiLimiter);

// Autenticação de usuário (login próprio: e-mail + senha + JWT).
app.use('/api/auth', authRouter);

// Rotas de domínio (todas sob /api).
app.use('/api', lotsRouter);
app.use('/api', farmsRouter);
app.use('/api', marketRouter);
// Painel admin de preços (protegido por token; ver admin-auth.ts).
app.use('/api/admin/market', adminMarketRouter);
app.use('/api', discoveryRouter);
app.use('/api', academyRouter);
app.use('/api', engagementRouter);
app.use('/api', logisticsRouter);
app.use('/api', businessRouter);

// 404 padrão.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

// Middleware de erro central (4 args -> Express reconhece como error handler).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const code = isRecord(err) && typeof err.code === 'string' ? err.code : undefined;
  const status = pgErrorStatus(code);
  const detail =
    isRecord(err) && typeof err.message === 'string' ? err.message : 'Erro desconhecido';
  if (status >= 500) {
    console.error('[api] erro não tratado:', err);
  }
  res.status(status).json({
    error: status >= 500 ? 'Erro interno do servidor' : detail,
    ...(code ? { code } : {}),
  });
});

// Render injeta a porta via env; em dev cai no 3001.
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  const corsMode = corsOrigin === true ? 'liberado (dev)' : `restrito a ${allowedOrigins.join(', ')}`;
  console.log(`[bta-server] escutando na porta ${port} — rotas sob /api — CORS: ${corsMode}`);
});
