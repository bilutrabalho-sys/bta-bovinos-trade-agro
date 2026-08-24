import 'dotenv/config';
import pg from 'pg';

const { Pool, types } = pg;

// ---------------------------------------------------------------------------
//  Type parsers: entregam NÚMERO em vez de STRING.
// ---------------------------------------------------------------------------
//  Por padrão o driver `pg` retorna bigint (int8) e numeric como string, para
//  não perder precisão. Neste app todos os ids e valores monetários cabem com
//  folga no Number do JS (< 2^53), e o CONTRATO do frontend (src/data/mock.ts)
//  espera `number` (price, priceTotal, freight, rating, id, sellerId, etc.).
//  Por isso convertemos globalmente aqui — os mappers ficam limpos.
types.setTypeParser(20, (v: string) => Number(v)); // int8 / bigint
types.setTypeParser(1700, (v: string) => Number(v)); // numeric / decimal

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/bta';

export const pool = new Pool({ connectionString });

pool.on('error', (err: Error) => {
  // Erros de conexões ociosas no pool não devem derrubar o processo.
  console.error('[db] erro inesperado em conexão ociosa do pool:', err.message);
});

// ---------------------------------------------------------------------------
//  Linha genérica de resultado. `unknown` obriga a coerção explícita nos
//  mappers (sem `any` solto). Satisfaz o constraint QueryResultRow do pg.
// ---------------------------------------------------------------------------
export type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
//  Usuário de serviço/dev. No seed, o user 1 é o "Rafael Mendonça" (comprador),
//  dono de radars/simulações/notificações/match. Em DEV rodamos como superuser
//  (sem RLS forçada), então basta este id para reconstruir as telas "do usuário".
//
//  PRODUÇÃO (RLS): quando a RLS for forçada, o backend deverá, por transação,
//  autenticar e executar `SET LOCAL app.current_user_id = <id>` antes das queries
//  (ver README e dba_hardening.sql seção 6). Aí este valor fixo sai de cena.
// ---------------------------------------------------------------------------
export const DEFAULT_USER_ID = 1;

// Proposta seed (lote 120 Nelore) que carrega o chat de negociação exibido no app.
export const DEFAULT_PROPOSAL_ID = 1;
