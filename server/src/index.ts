import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import lotsRouter from './routes/lots';
import farmsRouter from './routes/farms';
import marketRouter from './routes/market';
import discoveryRouter from './routes/discovery';
import academyRouter from './routes/academy';
import engagementRouter from './routes/engagement';
import logisticsRouter from './routes/logistics';
import businessRouter from './routes/business';
import { pgErrorStatus } from './helpers';

const app = express();

// CORS liberado para o dev server do Vite (localhost:5173).
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  }),
);
app.use(express.json());

// Sanidade / health-check.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'bta-server' });
});

// Rotas de domínio (todas sob /api).
app.use('/api', lotsRouter);
app.use('/api', farmsRouter);
app.use('/api', marketRouter);
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

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[bta-server] escutando em http://localhost:${port}/api`);
});
