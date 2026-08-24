# BTA — Seed de desenvolvimento (`db/seed/`)

Dados fictícios que reproduzem o mock (`src/data/mock.ts`) num banco real, para o
app nascer **navegável** (todas as telas com dados). Um único arquivo:
`seed.sql` (idempotente, transacional).

## Ordem de aplicação

```
migrations 001..014  ->  dba_hardening.sql  ->  seed.sql  ->  (tests)
```

O seed **assume** que o schema já existe (migrations + hardening). Rode como o
**dono das tabelas** (ou `bta_admin`/superuser) — NÃO como um login `bta_app`,
que é filtrado por RLS.

```bash
# exemplo (psql)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed/seed.sql
```

## O que ele carrega

11 users (1 comprador "Rafael" + 10 donos de fazenda), 10 farms, 20 lots (+60
imagens), 5 categorias/6 raças/5 finalidades, 5 market_prices + série diária de
~91 dias por categoria, 10 opportunities, 3 radars, 1 match_search + 4 results,
2 proposals + 6 mensagens de chat, 1 transaction fechada (+5 etapas, 3
transportadoras, 1 frete), 10 courses + progresso, 10 lessons (+30 seções, 40
conceitos, 20 questões, 60 opções de quiz), 3 simulações, 10 notificações, 5
favoritos (um de cada tipo do exclusive arc), 2 follows, 3 planos + 1 assinatura,
1 boost ativo, 6 serviços e `platform_settings.take_rate_percent`.

## Decisões e fatos respeitados (leia antes de editar)

- **Idempotente:** começa com `TRUNCATE ... RESTART IDENTITY CASCADE` de todas as
  tabelas populadas. Pode reexecutar. (É para dev/CI — nunca rode em produção.)
- **Colunas GENERATED omitidas** (inserir nelas é erro):
  - `lots.price_total` (`'/@'` ⇒ `price*(weight/15)*qty`; `'/cab'` ⇒ `price*qty`).
    Os `priceTotal` `'/@'` do mock estavam **errados** (hand-authored) e foram
    ignorados — o banco recalcula o canônico. Os `'/cab'` do mock batem.
  - `transactions.fee_amount` (`total_value * fee_percent/100`).
- **`transactions.weight_snapshot`** preenchido em toda transação `'/@'`
  (constraint `chk_tx_weight_snapshot_for_arroba`) com o peso do lote no momento.
- **Ids do mock preservados** via `OVERRIDING SYSTEM VALUE` (lots 1..20, farms
  1..10, opportunities 1..10, courses/lessons 1..10, transporters/services etc.).
  Assim `Lot.sellerId` (mock) continua casando com `farms.id`. Ao final, as
  **sequences** das tabelas com id explícito são **ressincronizadas** com
  `setval(pg_get_serial_sequence(...), max(id))`.
- **Dimensões por NOME:** `lots`/`radars`/`market_prices` resolvem
  `category_id/breed_id/purpose_id` por JOIN no nome (ex.: `cattle_category.name`),
  então a ordem dos ids das dimensões não importa.
- **`market_price_points`:** série **sintética plausível** (~91 dias, oscilação
  ~±7% via senoides determinísticas em torno do valor-base), suficiente para as
  janelas `history7/30/90` (que são só `WHERE price_date >= hoje - N`). **Não**
  reproduz o RNG exato do mock (`generateHistory`) — desnecessário para o app.
- **RLS:** o seed roda como owner e o hardening habilitou RLS **sem** `FORCE`, então
  o owner **não** é filtrado — o seed funciona normalmente.
- **Sem segredos reais:** e-mails `@example.com`, telefones e nomes fictícios.

## Notas de coerência que podem surpreender

- Todos os 20 lots entram como `status='published'` (visíveis na vitrine / RLS
  público de leitura).
- Há 2 propostas: **1 aceita** no lote 1 (que gerou a transação fechada, ligada à
  negociação do chat) e **1 ativa** no lote 2 (80 Brangus) para a BusinessScreen.
- A transação 1 está em `status='transport'` com as 2 primeiras etapas concluídas
  (coerente com a DealClosedScreen).
