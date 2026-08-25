import 'dotenv/config';
import pg from 'pg';
import type { PoolClient } from 'pg';

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

// ---------------------------------------------------------------------------
//  withUser — executa um bloco de queries JÁ AUTENTICADO como o usuário `userId`,
//  com a ROW-LEVEL SECURITY do Postgres ENFORÇADA.
// ---------------------------------------------------------------------------
//  Como o pool conecta como `postgres` (superuser, que IGNORA RLS), aqui, DENTRO
//  de uma transação, nós:
//    1. SET LOCAL app.current_user_id = <userId>   (via set_config, transaction-local)
//       -> alimenta a função app_current_user_id() usada em TODAS as policies.
//    2. SET LOCAL ROLE bta_app                      (role NÃO-superuser, NÃO-BYPASSRLS)
//       -> a partir daqui a sessão é `bta_app` e as policies passam a valer:
//          cada tabela pessoal (radars, simulations, notifications, favorites,
//          proposals, negotiation_messages, ...) só devolve/aceita as linhas do
//          usuário logado. Um usuário JAMAIS enxerga o dado de outro.
//  Ambos os SET são LOCAL: some no COMMIT/ROLLBACK e a conexão volta ao pool
//  limpa (role de volta a `postgres`), sem vazar estado entre requisições.
//
//  Use SEMPRE que a query tocar dado pessoal do usuário. Operações privilegiadas
//  (auth, exclusão de conta, jobs) usam o `pool` direto (owner), de propósito.
// ---------------------------------------------------------------------------
export async function withUser<T>(
  userId: number,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  if (!Number.isInteger(userId) || userId <= 0) {
    // Guarda de sanidade: nunca abrir uma sessão RLS sem um id válido.
    throw new Error('withUser: userId deve ser um inteiro positivo.');
  }
  const client = await pool.connect();
  try {
    await client.query('begin');
    // 1) GUC transaction-local (parametrizado -> sem risco de injection no SET).
    await client.query("select set_config('app.current_user_id', $1, true)", [String(userId)]);
    // 2) Vira bta_app (constante controlada pelo servidor; SET não aceita param).
    await client.query('set local role bta_app');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    try {
      await client.query('rollback');
    } catch {
      /* rollback best-effort; o erro original é o que importa */
    }
    throw err;
  } finally {
    client.release();
  }
}
