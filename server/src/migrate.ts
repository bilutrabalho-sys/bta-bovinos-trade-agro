// ============================================================================
//  migrate.ts — Runner de migrations em Node puro (driver pg, sem psql).
// ----------------------------------------------------------------------------
//  Aplica, na DATABASE_URL, nesta ordem:
//    1. db/migrations/000_schema_migrations.sql   (se existir — tabela de controle)
//    2. db/migrations/0NN_*.up.sql                (em ordem numérica)
//    3. db/schema/dba_hardening.sql               (idempotente — sempre)
//    4. SEED (idempotente: truncate+insert) — qual depende do modo:
//         • PRODUÇÃO (padrão):  db/seed/seed-platform.sql
//             -> só dados de PLATAFORMA (catálogo, mercado, academy, planos,
//                serviços, settings). Tabelas de USUÁRIO nascem VAZIAS.
//         • DEMO (flag --demo): db/seed/seed.sql
//             -> plataforma + dados fictícios de usuário (dev/CI/demonstração).
//
//  Cada arquivo .sql é executado como um SCRIPT via pool.query(fileText): o
//  protocolo "simple query" do pg aceita múltiplos comandos por chamada desde
//  que NÃO haja parâmetros ($1...). É exatamente o nosso caso.
//
//  As migrations 001..014 NÃO são idempotentes (create type/table sem guard),
//  então registramos cada versão aplicada em schema_migrations e PULAMOS as já
//  aplicadas. hardening e seed são idempotentes e rodam sempre.
//
//  Uso:
//    npm run db:setup                    -> migrations + seed de PRODUÇÃO (usuário vazio)
//    npm run db:setup:demo               -> migrations + seed DEMO (cheio)
//    npm run db:setup -- --reset         -> dropa/recria o schema antes (produção)
//    npm run db:setup:demo -- --reset    -> dropa/recria o schema antes (demo)
//  Flags equivalentes (ao chamar `tsx src/migrate.ts` direto): --demo, --reset.
// ============================================================================
import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type { Pool as PoolType } from 'pg';

const { Pool } = pg;

const HERE = path.dirname(fileURLToPath(import.meta.url)); // .../server/src
const DB_DIR = path.resolve(HERE, '..', '..', 'db'); // .../db (raiz do projeto)
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');
const BOOTSTRAP = path.join(MIGRATIONS_DIR, '000_schema_migrations.sql');
const HARDENING = path.join(DB_DIR, 'schema', 'dba_hardening.sql');
const SEED_PLATFORM = path.join(DB_DIR, 'seed', 'seed-platform.sql'); // produção (padrão)
const SEED_DEMO = path.join(DB_DIR, 'seed', 'seed.sql'); // cheio (--demo)

const RESET = process.argv.includes('--reset');
const DEMO = process.argv.includes('--demo');

// Modo escolhido a partir das flags (produção é o padrão, sem --demo).
const SEED = DEMO ? SEED_DEMO : SEED_PLATFORM;
const SEED_LABEL = DEMO
  ? 'seed/seed.sql (DEMO — plataforma + dados fictícios de usuário)'
  : 'seed/seed-platform.sql (PRODUÇÃO — só plataforma, usuário vazio)';

/** Executa um arquivo .sql inteiro como script, com erro claro apontando o arquivo. */
async function runFile(pool: PoolType, filePath: string, label: string): Promise<void> {
  const sql = await readFile(filePath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao aplicar "${label}"\n    arquivo: ${filePath}\n    causa:   ${msg}`);
  }
}

/** Esconde a senha na URL ao logar. */
function redact(cs: string): string {
  return cs.replace(/\/\/([^:/@]+):[^@]*@/, '//$1:***@');
}

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/bta';
  console.log(`[db:setup] alvo: ${redact(connectionString)}`);
  console.log(`[db:setup] modo: ${DEMO ? 'DEMO (cheio)' : 'PRODUÇÃO (usuário vazio)'}  |  seed: ${SEED_LABEL}`);

  const pool = new Pool({ connectionString });
  try {
    if (RESET) {
      console.log('[db:setup] --reset: DROP SCHEMA public CASCADE + CREATE SCHEMA public');
      await pool.query('drop schema if exists public cascade; create schema public;');
    }

    // 1. Tabela de controle (000 se existir) + rede de segurança idempotente.
    if (existsSync(BOOTSTRAP)) {
      await runFile(pool, BOOTSTRAP, 'migrations/000_schema_migrations.sql');
    }
    await pool.query(
      `create table if not exists schema_migrations (
         version    text        primary key,
         applied_at timestamptz not null default now()
       )`,
    );

    // 2. Migrations 0NN_*.up.sql em ordem, pulando as já aplicadas.
    const files = await readdir(MIGRATIONS_DIR);
    const ups = files.filter((f) => /^\d{3}_.+\.up\.sql$/.test(f)).sort();
    console.log(`[db:setup] ${ups.length} migrations encontradas em db/migrations/`);

    for (const file of ups) {
      const applied = await pool.query('select 1 from schema_migrations where version = $1', [file]);
      if ((applied.rowCount ?? 0) > 0) {
        console.log(`  • ${file} (já aplicada, pulando)`);
        continue;
      }
      await runFile(pool, path.join(MIGRATIONS_DIR, file), `migrations/${file}`);
      await pool.query(
        'insert into schema_migrations (version) values ($1) on conflict (version) do nothing',
        [file],
      );
    }

    // 3. Hardening (idempotente) — sempre.
    if (existsSync(HARDENING)) {
      await runFile(pool, HARDENING, 'schema/dba_hardening.sql');
    } else {
      console.warn('[db:setup] aviso: dba_hardening.sql não encontrado, pulando.');
    }

    // 4. Seed (idempotente: truncate+insert) — sempre. Produção por padrão; --demo => cheio.
    if (existsSync(SEED)) {
      await runFile(pool, SEED, SEED_LABEL);
    } else {
      console.warn(`[db:setup] aviso: ${path.basename(SEED)} não encontrado, pulando.`);
    }

    console.log(
      `[db:setup] ✅ concluído com sucesso (${DEMO ? 'DEMO — cheio' : 'PRODUÇÃO — usuário vazio'}).`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('\n[db:setup] ❌ ERRO:');
  console.error(err instanceof Error ? err.message : err);
  console.error(
    '\nDica: se o erro for "type/table already exists", o banco já tem parte do schema.' +
      '\nRode com reset para reconstruir do zero (DEV):  npm run db:setup -- --reset',
  );
  process.exit(1);
});
