-- ============================================================================
--  000 · Tabela de controle de migrations (BOOTSTRAP — apenas caminho manual)
-- ----------------------------------------------------------------------------
--  Este arquivo é OPCIONAL e destina-se ao caminho de aplicação MANUAL via
--  `psql -f` (sem ferramenta). Ele cria uma tabela onde você registra à mão
--  qual versão já foi aplicada.
--
--  Se você adotar uma ferramenta (dbmate, golang-migrate, Flyway...), ela
--  gerencia a PRÓPRIA tabela de controle (schema_migrations / flyway_schema_history)
--  e você NÃO deve aplicar este 000 — veja README.md.
--
--  Não é um par up/down: é um bootstrap idempotente, aplicado uma única vez.
-- ============================================================================
begin;

create table if not exists schema_migrations (
  version    text        primary key,
  applied_at timestamptz not null default now()
);

comment on table schema_migrations is
  'Controle manual de migrations aplicadas (caminho psql -f). Ferramentas de migration gerenciam a própria tabela e dispensam esta.';

commit;
