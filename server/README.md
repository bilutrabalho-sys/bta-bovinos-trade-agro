# BTA — Backend HTTP (Node + Express + TypeScript + PostgreSQL)

Servidor **standalone** que substitui o mock (`src/data/mock.ts`) do frontend por
dados reais de um **PostgreSQL puro** (driver `pg`, sem ORM, sem Firebase).
Ele lê o banco em `snake_case` e devolve JSON no `camelCase` exato que as telas
React esperam.

> **Não toca em `src/`, `db/` nem no `package.json` da raiz.** Tudo vive em `server/`.

---

## Pré-requisitos

- **Node.js 18+** (testado com Node 20/22).
- **PostgreSQL** rodando, com um banco vazio chamado `bta` (ou o nome que você
  colocar na `DATABASE_URL`).
- Conectar como um usuário **dono/superuser** do banco (em dev, `postgres`). O
  `seed.sql` faz `TRUNCATE` e roda como owner (a RLS do hardening não filtra o owner).

Criar o banco local (uma vez):

```bash
createdb bta
# ou:  psql -U postgres -c "create database bta;"
```

---

## Configuração

```bash
cd server
cp .env.example .env      # no Windows/PowerShell:  copy .env.example .env
npm install
```

Edite `.env` se necessário:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bta
PORT=3001
```

---

## Preparar o banco (migrations + hardening + seed)

Existem **dois modos de seed** — a estrutura (migrations + hardening) é a mesma
nos dois; só muda **quais dados** entram:

| Modo | Comando | Seed aplicado | O que popula |
| --- | --- | --- | --- |
| **Produção** (padrão) | `npm run db:setup` | `db/seed/seed-platform.sql` | **Só dados de plataforma** (categorias, raças, finalidades, mercado, BTA Academy, planos, serviços, settings). **Tabelas de usuário nascem VAZIAS** (0 usuários, 0 fazendas, 0 lotes, 0 propostas…). |
| **Demo / cheio** | `npm run db:setup:demo` | `db/seed/seed.sql` | Plataforma **+ dados fictícios de usuário** (Rafael, 10 fazendas, 20 lotes, oportunidades, radares, negociação, notificações etc.). Para **dev, CI e demonstração**. |

**Quando usar cada um:**

- **`db:setup` (produção)** — para provisionar um banco novo de produção/staging:
  a plataforma já sobe com todo o catálogo pronto, mas **sem nenhum dado
  fictício de usuário**. É o que o app usa no lançamento (o usuário real começa
  do zero: se cadastra, cria fazenda, anuncia lote…).
- **`db:setup:demo` (cheio)** — para desenvolver e demonstrar com **todas as
  telas já navegáveis** (vitrine, mercado, radar, match, negociação, academy,
  simulador, perfil), reproduzindo o mock (`src/data/mock.ts`) num banco real.

O runner (`src/migrate.ts`, **Node puro, não depende de `psql` no PATH**) aplica,
em ordem, contra a `DATABASE_URL`:

1. `db/migrations/000_schema_migrations.sql` (tabela de controle, se existir);
2. todos os `db/migrations/0NN_*.up.sql` em ordem numérica;
3. `db/schema/dba_hardening.sql` (idempotente);
4. o **seed do modo escolhido** (idempotente: `TRUNCATE` + `INSERT`):
   - **produção** → `db/seed/seed-platform.sql`;
   - **demo** (`--demo`) → `db/seed/seed.sql`.

O log mostra em qual modo rodou (ex.: `modo: PRODUÇÃO (usuário vazio)`). As
migrations `001..014` **não são idempotentes** (`create type/table`), então o
runner registra cada versão aplicada em `schema_migrations` e **pula as já
aplicadas**. `hardening` e `seed` são idempotentes e rodam sempre (re-executar o
comando só **re-semeia** os dados).

> **Os dois seeds fazem `TRUNCATE`** de todas as tabelas populadas antes de
> inserir. O `seed-platform.sql` trunca tudo e reinsere **apenas** a plataforma
> — ou seja, rodar o modo produção sobre um banco que tinha dados demo **zera as
> tabelas de usuário**. Por isso ambos são para **provisionar/re-semear** bancos
> de dev/staging/produção-nova, não para rodar sobre uma base com usuários reais
> já em uso.

Para **reconstruir do zero** (dropa e recria o schema `public`) — funciona nos
dois modos, passando `--reset` depois do `--`:

```bash
npm run db:setup -- --reset          # produção, do zero
npm run db:setup:demo -- --reset     # demo/cheio, do zero
```

---

## Rodar o servidor

```bash
npm run dev      # tsx watch (reinicia ao salvar)
# ou
npm start        # execução única
```

Sobe em `http://localhost:3001/api`. Teste rápido:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/lots
```

### Ligar o frontend a este backend

O app Vite roda em `http://localhost:5173` (CORS já liberado para essa origem).
Troque as leituras de `src/data/mock.ts` por `fetch('http://localhost:3001/api/...')`
— as formas de resposta são idênticas às constantes exportadas pelo mock.

---

## Endpoints

Todos sob `/api`, JSON.

### Leitura (GET)

| Método | Caminho | Retorna (forma do mock) |
| --- | --- | --- |
| GET | `/api/lots` | `Lot[]` |
| GET | `/api/farms` | `Farm[]` |
| GET | `/api/market` | `MARKET_DATA` (objeto por categoria com `history7/30/90`) |
| GET | `/api/opportunities` | `OPPORTUNITIES[]` |
| GET | `/api/notifications` | `NOTIFICATIONS[]` |
| GET | `/api/courses` | `COURSES[]` |
| GET | `/api/lessons` | `LESSONS[]` (com `sections[]`, `keyConcepts[]`, `quiz[]`) |
| GET | `/api/radar-alerts` | `RADAR_ALERTS[]` |
| GET | `/api/match-results` | `MATCH_RESULTS[]` |
| GET | `/api/chat-messages` | `CHAT_MESSAGES[]` |
| GET | `/api/transporters` | `TRANSPORTERS[]` |
| GET | `/api/services` | `SERVICES[]` |
| GET | `/api/saved-simulations` | `SAVED_SIMULATIONS[]` |
| GET | `/api/health` | `{ ok: true }` (sanidade) |

`AI_SUGGESTIONS` **não tem endpoint** (é constante de UI no front).

### Escrita (POST)

| Método | Caminho | Body | Retorna |
| --- | --- | --- | --- |
| POST | `/api/favorites` | `{ userId, lotId? , farmId?, opportunityId?, simulationId?, lessonId? }` | favorito criado (201) |
| POST | `/api/proposals` | `{ lotId, buyerUserId, quantity, pricePerUnit, priceUnit }` | proposta criada (201) |

- **`/api/favorites`** respeita o *exclusive arc*: **exatamente 1** alvo por
  favorito (0 ou 2+ → `400`). Favorito duplicado → `409`.
- **`/api/proposals`** deriva `seller_farm_id` **server-side** de `lots.seller_id`
  (nunca confia no cliente). Lote inexistente → `404`.

Exemplos:

```bash
curl -X POST http://localhost:3001/api/favorites \
  -H 'content-type: application/json' \
  -d '{"userId":1,"lotId":3}'

curl -X POST http://localhost:3001/api/proposals \
  -H 'content-type: application/json' \
  -d '{"lotId":2,"buyerUserId":1,"quantity":80,"pricePerUnit":310,"priceUnit":"/@"}'
```

---

## Apontar para a nuvem

Basta trocar a `DATABASE_URL` no `.env` por um Postgres gerenciado (Supabase,
Neon, RDS, Railway...). A maioria exige SSL — acrescente `?sslmode=require`:

```
DATABASE_URL=postgres://usuario:senha@host:5432/banco?sslmode=require
```

Rode `npm run db:setup` apontando para lá (cuidado: o `seed` faz `TRUNCATE`;
use apenas em bancos de dev/staging). Depois `npm start`.

---

## Deploy (Neon + Render) — passo a passo

Objetivo: colocar a API no ar de graça, com o Postgres num serviço gerenciado
(**Neon**) e a API num serviço web (**Render**). Nada disso quebra o seu ambiente
local — você continua usando `npm run dev` normalmente.

> **Como funciona a divisão:** o **Neon** guarda o banco. O **Render** roda a API.
> As **migrations você aplica UMA vez, do seu PC, apontando para o Neon** (o
> Render não roda migrations — ele só sobe o servidor).

### Passo 1 — Criar o banco no Neon (grátis, sem cartão)

1. Acesse **neon.tech** e crie a conta (pode entrar com o GitHub).
2. **Create project**. Dê um nome (ex.: `bta`). Em região, escolha **US East**
   (ex.: *US East (Ohio)*) — combina com a região sugerida do Render e reduz a
   latência entre API e banco.
3. Na tela do projeto, copie a **connection string** (Neon chama de
   *Connection string* / *Database URL*). Ela se parece com:

   ```
   postgres://SEU_USUARIO:SUA_SENHA@ep-xxxx-xxxx.us-east-2.aws.neon.tech/bta?sslmode=require
   ```

   > **Mantenha o `?sslmode=require` no final** — é ele que liga a criptografia
   > SSL (obrigatória no Neon). Guarde essa string; é seu `DATABASE_URL`.

### Passo 2 — Aplicar o banco no Neon (rodando do seu PC)

No **PowerShell**, dentro da pasta `server`, defina a variável e rode o setup.
Escolha um dos dois modos:

```powershell
cd server

# Modo DEMO/cheio (recomendado para testar tudo navegável — Rafael, lotes, etc.):
$env:DATABASE_URL = "postgres://...neon.tech/bta?sslmode=require"
npm run db:setup:demo

# OU modo PRODUÇÃO (só o catálogo da plataforma; tabelas de usuário vazias):
$env:DATABASE_URL = "postgres://...neon.tech/bta?sslmode=require"
npm run db:setup
```

> A `DATABASE_URL` acima vale só para essa janela do PowerShell (não altera seu
> `.env` local). Ao fechar o terminal, ela some. Se quiser limpar antes de
> voltar ao dev local: `Remove-Item Env:DATABASE_URL`.
>
> No macOS/Linux o equivalente é:
> `DATABASE_URL="postgres://...?sslmode=require" npm run db:setup:demo`
>
> Um aviso `sslmode=require` marcado como *deprecated* pode aparecer nos logs do
> driver — é **cosmético**, a conexão funciona e é criptografada.

Deu certo quando aparecer `✅ concluído com sucesso`.

### Passo 3 — Subir a API no Render (grátis)

**Caminho recomendado (mais simples, sem arquivo de config):**

1. Acesse **render.com** e crie a conta com o **GitHub**.
2. **New → Web Service** e selecione o repositório `bta-bovinos-trade-agro`.
3. Preencha:
   - **Root Directory:** `server`
   - **Runtime/Environment:** `Node`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
   - **Instance Type / Plan:** `Free`
   - **Region:** *US East (Ohio/Virginia)* (mesma família do Neon).
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = a connection string do Neon (a mesma do Passo 2, **com
     `?sslmode=require`**).
   - `ALLOWED_ORIGINS` *(opcional)* = as origens do seu app, separadas por
     vírgula (ex.: `https://app.bta.com.br,https://www.bta.com.br`). Se deixar
     em branco, a API aceita qualquer origem (bom para testar).
5. **Create Web Service**. O Render instala e sobe. Acompanhe em *Logs* até ver
   `[bta-server] escutando na porta ...`.

**Caminho alternativo (Blueprint / Infra as Code):** existe um `server/render.yaml`
pronto. Como o Render só detecta esse arquivo na **raiz** do repositório, para
usar o Blueprint copie `server/render.yaml` para a raiz e então use
**New → Blueprint**. Para a maioria dos casos, o caminho recomendado acima é
mais fácil.

### Passo 4 — Pegar a URL pública e testar

O Render te dá uma URL tipo `https://bta-server.onrender.com`. Teste no
navegador (ou `curl`):

```
https://bta-server.onrender.com/api/health   ->  {"ok":true,"service":"bta-server"}
https://bta-server.onrender.com/api/lots      ->  lista de lotes (JSON)
```

Se `/api/health` responde `{"ok":true}`, a API está no ar. Se `/api/lots` vier
vazio, você provavelmente aplicou o seed de **produção** (Passo 2) em vez do
**demo** — rode `npm run db:setup:demo` apontando para o Neon novamente.

> **Plano Free do Render:** o serviço "dorme" após ~15 min sem acesso; a primeira
> chamada depois disso leva alguns segundos para "acordar". Normal no grátis.

### Passo 5 — Ligar o app do frontend

No app/deploy do frontend, aponte as chamadas para a URL pública do Render
(ex.: `https://bta-server.onrender.com/api/...`) e coloque a origem do frontend
em `ALLOWED_ORIGINS` no Render para travar o CORS.

---

## Nota sobre RLS / segurança (dev x produção)

Em **dev** conectamos como o **dono do banco** (usuário de serviço único), então
a Row-Level Security do `dba_hardening.sql` **não filtra** — não é preciso
configurar nada por request agora. As telas "do usuário" (radares, simulações,
notificações, match, progresso de curso) usam `DEFAULT_USER_ID = 1` (o "Rafael"
do seed).

Quando for para **produção com RLS forçada**, o backend deverá, **por transação**,
autenticar o usuário e executar:

```sql
SET LOCAL app.current_user_id = <id do usuário autenticado>;
```

antes das queries (ver `db/schema/dba_hardening.sql`, seção 6). A partir daí o
`DEFAULT_USER_ID` fixo sai de cena e cada request passa a enxergar só os próprios
dados. A app deve conectar como um login membro do role `bta_app` (DML, sem DDL,
sujeito a RLS), não como superuser.
