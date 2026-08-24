#!/usr/bin/env bash
# ============================================================================
#  BTA — validate.sh
#  Valida o conjunto migrations + hardening + seed + tests num banco EFÊMERO e o
#  destrói ao final (nunca rode contra produção). Requer psql/createdb no PATH.
#
#  Uso:
#     ./db/validate.sh                # usa um banco local temporário via createdb
#     PGHOST=... PGUSER=... ./db/validate.sh
#
#  Passos: createdb -> up 001..014 -> dba_hardening -> seed -> tests ->
#          down 014..001 (verifica reversibilidade) -> dropdb.
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${BTA_TEST_DB:-bta_validate_$$}"
PSQL=(psql -v ON_ERROR_STOP=1 -X -q)

cleanup() {
  echo "-- limpando banco efêmero: $DB"
  dropdb --if-exists "$DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "== criando banco efêmero: $DB =="
createdb "$DB"

echo "== 1) migrations up (001..014) =="
for f in "$ROOT"/db/migrations/0[0-9][0-9]_*.up.sql; do
  echo "   -> $(basename "$f")"
  "${PSQL[@]}" -d "$DB" -f "$f"
done

echo "== 2) dba_hardening.sql =="
"${PSQL[@]}" -d "$DB" -f "$ROOT/db/schema/dba_hardening.sql"

echo "== 3) seed.sql =="
"${PSQL[@]}" -d "$DB" -f "$ROOT/db/seed/seed.sql"

echo "== 4) tests =="
for f in "$ROOT"/db/tests/0[0-9]_*.sql; do
  echo "   -> $(basename "$f")"
  "${PSQL[@]}" -d "$DB" -f "$f"
done

echo "== 5) migrations down (014..001) — verifica reversibilidade =="
for f in $(ls -r "$ROOT"/db/migrations/0[0-9][0-9]_*.down.sql); do
  echo "   -> $(basename "$f")"
  "${PSQL[@]}" -d "$DB" -f "$f"
done

echo "== TUDO OK =="
