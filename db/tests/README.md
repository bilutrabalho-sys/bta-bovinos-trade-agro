# BTA — Testes de banco (`db/tests/`)

Testes de integridade escritos em **SQL puro** (sem dependência de pgTAP), no
padrão `DO $$ ... RAISE EXCEPTION`. Cada asserção imprime `PASS: ...` (via
`RAISE NOTICE`) ou aborta com `FAIL: ...` (via `RAISE EXCEPTION`). Rodar com
`-v ON_ERROR_STOP=1` faz o primeiro `FAIL` parar a suíte com exit code ≠ 0 — ideal
para CI.

> **Por que não pgTAP?** pgTAP exige a extensão instalada (`CREATE EXTENSION
> pgtap`), que não está disponível no ambiente atual. Os scripts abaixo rodam em
> qualquer PostgreSQL 12+ sem instalar nada. Se um dia adotarem pgTAP, estes
> mesmos casos migram 1:1 para `ok()/is()/throws_ok()`.

## Arquivos

| Arquivo | O que cobre | Precisa do seed? |
|---|---|---|
| `01_structure.sql` | Existência de generated columns, CHECKs de negócio, índices únicos/parciais e `ON DELETE` das FKs críticas (catálogo `pg_*`). | Não |
| `02_constraints_enforced.sql` | Testes **negativos**: cada INSERT inválido deve ser **rejeitado** (price<0, insert em GENERATED, exclusive arc, `/@` sem weight_snapshot, capa duplicada, favorito duplicado, FK inexistente, UF!=2 chars, compatibility fora de 0..100). Roda numa transação com **ROLLBACK** (nada persiste). | **Sim** |
| `03_referential_integrity.sql` | Varre **todas** as FKs single-column do schema e garante **zero órfãos**; + checagens direcionadas ao contrato do mock. | Sim (recomendado) |
| `04_business_invariants.sql` | Generated columns corretas, invariante de `total_value` em `/@`, exclusive arc, 1 capa/lote, coerência proposta→transação→etapas, quiz, janelas de mercado, **ressync de sequences** e **smoke test** de contagens + ids 1..N. | **Sim** |

## Como rodar

Ordem completa (banco descartável):

```bash
# 1) schema
for f in db/migrations/0[0-9][0-9]_*.up.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema/dba_hardening.sql
# 2) seed
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed/seed.sql
# 3) testes (na ordem)
for f in db/tests/0[0-9]_*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

Sucesso = todos os arquivos terminam imprimindo `== NN_... OK ==` e o `psql` sai
com código 0. Qualquer `FAIL:` aborta com código ≠ 0 e mensagem apontando a
tabela/coluna/constraint afetada.

Um runner pronto (cria banco efêmero, aplica tudo, roda os testes, testa os
`down` e derruba o banco) está em `db/validate.sh` (Postgres/psql necessários).

## Observações

- `02` referencia linhas do seed (category `Boi Gordo`/`Nelore`, farm 1, lot 1,
  user 1, favorito `(user1,lot1)`). Rode-o **depois** do seed.
- Todos os arquivos são idempotentes na leitura; `02` reverte a própria transação,
  então não deixa resíduo mesmo se um insert "ruim" passasse.
- Os testes rodam como **owner** (não filtrados por RLS).
