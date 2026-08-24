# BTA — Migrations do banco (PostgreSQL)

Migrations versionadas e reversíveis que constroem o schema do **BTA — Bovinos
Trade Agro** a partir de `db/schema/schema.sql`. Este diretório é a **fonte de
verdade de evolução do banco**: o `schema.sql` é o retrato consolidado; estas
migrations são o caminho incremental para chegar (e voltar) até ele.

---

## 1. Convenção de nomes

```
NNN_descricao.up.sql     -- aplica a mudança
NNN_descricao.down.sql   -- reverte EXATAMENTE aquela mudança
```

- `NNN` = número sequencial de 3 dígitos (`001`, `002`, …). Define a ordem.
- Todo `up` tem um `down` correspondente. O `down` desfaz somente o que aquele
  `up` criou, na **ordem inversa**, com drops **idempotentes** (`drop ... if exists`).
- Cada arquivo é **transacional**: envolto em `begin; … commit;`. Se qualquer
  statement falhar, a migration inteira faz rollback (nada aplicado pela metade).
- Nenhuma migration usa `CREATE INDEX CONCURRENTLY` (o schema base não exige),
  portanto **todas** podem rodar dentro de transação. Se no futuro for preciso
  criar índice concorrente em tabela grande, ele deve ficar em migration própria,
  **fora** de `begin/commit`, e sinalizado no cabeçalho.

### Idempotência (reexecução segura)
- Tabelas: `create table if not exists`.
- Índices: `create [unique] index if not exists`.
- Enums (`CREATE TYPE` não aceita `IF NOT EXISTS`): bloco
  `do $$ begin create type … exception when duplicate_object then null; end $$;`.
- Triggers (`CREATE TRIGGER` não tem `IF NOT EXISTS` portável): `drop trigger if
  exists … ; create trigger …`.
- Função: `create or replace function`.
- Extensões: `create extension if not exists`.

---

## 2. Ordem de aplicação (up)

Respeita as dependências de FK (uma tabela só é criada depois das que ela
referencia). **Aplique nesta ordem:**

| Nº  | Arquivo | Conteúdo |
|-----|---------|----------|
| 000 | `000_schema_migrations.sql` | (opcional) tabela de controle manual — ver §4 |
| 001 | `001_extensions_and_audit` | extensões `citext`, `pgcrypto` + função `set_updated_at()` |
| 002 | `002_enums` | os 15 `CREATE TYPE … AS ENUM` |
| 003 | `003_reference_tables` | `cattle_category`, `breed`, `purpose`, `course_category` |
| 004 | `004_identity` | `users`, `user_preference` (auth em provedor externo; vínculo `users.external_auth_id`) |
| 005 | `005_farms_and_lots` | `farms`, `farm_specialty`, `lots` (generated `price_total`), `lot_images` (+ `ux_lot_images_one_cover`) |
| 006 | `006_market` | `market_prices` (+ `ux_market_prices_scope`), `market_price_points` (+ `ux_market_points_scope_date`) |
| 007 | `007_discovery` | `opportunities`, `radars`, `radar_state`, `match_searches`, `match_results` |
| 008 | `008_negotiation` | `proposals`, `negotiation_messages`, `transactions` (generated `fee_amount`), `transaction_steps`, `transporters`, `transports` |
| 009 | `009_academy` | `courses`, `user_course_progress`, `lessons`, `lesson_sections`, `lesson_key_concepts`, `lesson_quiz_questions`, `lesson_quiz_options`, `user_lesson_progress` |
| 010 | `010_simulator` | `simulations` |
| 011 | `011_engagement` | `notifications`, `favorites` (exclusive arc + 5 índices únicos parciais), `follows` |
| 012 | `012_monetization` | `subscription_plans`, `subscriptions`, `lot_boosts`, `services`, `platform_settings` |
| 013 | `013_indexes` | índices de performance (não-únicos) da seção 13 do schema |
| 014 | `014_triggers_updated_at` | os 19 `CREATE TRIGGER` de `updated_at` |

**Total: 40 tabelas.** (4 referência + 2 identidade + 4 fazendas/lotes +
2 mercado + 5 descoberta + 6 negociação + 8 academy + 1 simulador +
3 engajamento + 5 monetização.)

### Onde ficam os índices — decisão
- Índices **ÚNICOS de negócio/escopo** ficam **junto da tabela** a que pertencem,
  não na 013 — porque fazem parte da definição de integridade da tabela e devem
  nascer/morrer com ela:
  - `ux_lot_images_one_cover` → migration **005**
  - `ux_market_prices_scope`, `ux_market_points_scope_date` → migration **006**
  - `ux_favorites_user_{lot,farm,opportunity,simulation,lesson}` → migration **011**
- A migration **013** contém **apenas** os índices `ix_*` de **performance**
  (não-únicos) da seção 13. Não há duplicação com as migrations anteriores.

---

## 3. Ordem de reversão (down)

Os `down` rodam na **ordem numérica inversa**: `014 → 013 → … → 002 → 001`.

```
014 down  drop dos triggers
013 down  drop dos índices de performance
012 down  drop tabelas de monetização
011 down  drop engajamento (índices parciais de favorites + tabelas)
010 down  drop simulations
009 down  drop academy
008 down  drop negociação
007 down  drop descoberta
006 down  drop mercado (+ índices de escopo)
005 down  drop fazendas/lotes (+ ux_lot_images_one_cover)
004 down  drop identidade
003 down  drop tabelas de referência
002 down  drop os 15 enums
001 down  drop function set_updated_at()  (extensões: NÃO — ver abaixo)
```

Por que essa ordem funciona: quando um `down` dropa uma tabela referenciada por
outra (ex.: `users`), a tabela filha já caiu num `down` de número maior, que roda
antes. Todos os `drop table` usam `cascade` como rede de segurança extra.

### Política de reversão — pontos de atenção
- **Perda de dados:** todo `down` que dropa tabela **apaga os dados** daquela
  tabela. Nenhum `down` aqui é "seguro para produção com dados reais" — downs são
  para dev/CI/rollback de deploy recém-aplicado. Em produção, prefira uma
  migration **corretiva** (novo `NNN`) a rodar um `down`.
- **Extensões (`down 001`):** `citext` e `pgcrypto` **NÃO** são dropadas por
  padrão — podem ser usadas por outros objetos/schemas/bancos no mesmo cluster.
  Os comandos `drop extension` estão **comentados** no `001_..._down.sql`.
- **Função `set_updated_at()`:** dropada no `down 001`; os triggers que a usam já
  foram removidos no `down 014`.
- **Enums (`down 002`):** dropados só depois de todas as tabelas que os usam
  (garantido pela ordem inversa).

---

## 4. Como aplicar

Não há ferramenta de migration instalada no projeto (é um frontend React/Vite
puro). Os arquivos são **SQL portável** e funcionam em três caminhos:

### A) Manual via `psql` (mais simples, sem dependências)
```bash
# subir tudo, em ordem
for f in db/migrations/0[0-9][0-9]_*.up.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

# reverter tudo (ordem inversa)
ls -r db/migrations/0[0-9][0-9]_*.down.sql | while read f; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```
> No PowerShell/Windows, aplique na ordem `001 → 014` manualmente ou via
> `Get-ChildItem`. Sempre com `-v ON_ERROR_STOP=1` para abortar no 1º erro.

O `000_schema_migrations.sql` é **opcional** e serve só a este caminho manual:
cria `schema_migrations(version, applied_at)` para você registrar à mão o que já
subiu. As migrations **não** escrevem nessa tabela sozinhas (de propósito — ver §5).

### B) [golang-migrate](https://github.com/golang-migrate/migrate)
O padrão `NNN_nome.up.sql`/`NNN_nome.down.sql` é **exatamente** o formato dele.
```bash
migrate -path db/migrations -database "$DATABASE_URL" up
migrate -path db/migrations -database "$DATABASE_URL" down
```
Ele gerencia a própria tabela `schema_migrations` — **não** aplique o `000`.

### C) [dbmate](https://github.com/amacneil/dbmate)
Também consome `NNN_nome.sql` com blocos `-- migrate:up` / `-- migrate:down`.
Aqui optou-se por **arquivos up/down separados** (compatível com golang-migrate e
psql). Para usar dbmate, basta concatenar cada par num único arquivo com os
marcadores; ou fique com golang-migrate/psql. dbmate também gerencia a própria
`schema_migrations` — **não** aplique o `000`.

### Recomendação
Para este projeto (sem backend ainda), **golang-migrate** é a escolha mais direta:
consome estes arquivos sem nenhuma alteração e gerencia o controle de versão.
Enquanto não houver runner, o caminho **A (psql)** já cobre dev e CI. Flyway
também funciona, mas espera o prefixo `V1__`, `V2__` (renomeação necessária) e é
mais pesado (JVM) — não recomendado aqui.

---

## 5. Decisões registradas

1. **Formato SQL puro up/down** (não Prisma/Alembic/Knex/TypeORM): o projeto é
   frontend React/Vite sem ORM. Este formato é o mais portável e é nativo do
   golang-migrate e do `psql`.
2. **15 enums, não 14:** a seção 2 do `schema.sql` tem 15 `CREATE TYPE`
   (`price_unit, lot_sex, lot_status, proposal_status, transaction_status,
   transport_status, notification_type, user_role, subscription_plan,
   subscription_status, service_status, scenario, course_level, boost_tier,
   message_sender`). Todos os 15 estão em `002_enums`.
3. **Índices únicos junto da tabela; performance na 013** (ver §2). Sem duplicação.
4. **Migrations não escrevem em `schema_migrations`:** manter o corpo como DDL
   puro garante compatibilidade com golang-migrate/dbmate, que usam a **própria**
   tabela de controle (com esquema diferente). Embutir `insert into
   schema_migrations` quebraria essas ferramentas. Por isso o registro de versão
   é responsabilidade do runner (ou manual, no caminho A).
5. **`000_schema_migrations.sql` incluído, porém opcional:** bootstrap só do
   caminho manual `psql`. Com qualquer ferramenta, ignore-o.
6. **Comentários (`comment on …`) preservados** dentro de cada `up`, para que cada
   migration seja um recorte fiel e autodocumentado do `schema.sql`.
7. **Extensões não são revertidas** por padrão (risco de afetar terceiros no
   cluster) — `drop extension` comentado no `down 001`.

---

## 6. Validação

Validação feita de forma **estática** (por inspeção): `psql` não está disponível
no ambiente e nada foi instalado. Conferido: ordem de dependências de FK na
criação, ordem inversa nos `down`, idempotência dos statements, e que cada `up`
tem `down` par. Para validar em banco descartável quando houver `psql`:

```bash
createdb bta_test
for f in db/migrations/0[0-9][0-9]_*.up.sql;   do psql -d bta_test -v ON_ERROR_STOP=1 -f "$f"; done
ls -r db/migrations/0[0-9][0-9]_*.down.sql | while read f; do psql -d bta_test -v ON_ERROR_STOP=1 -f "$f"; done
dropdb bta_test
```

> Seed e testes **não** fazem parte deste diretório (outro agente cuida de
> `db/seed/` e `db/tests/`).
