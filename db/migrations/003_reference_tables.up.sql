-- ============================================================================
--  003 · Tabelas de referência (seção 3): dimensões extensíveis por admin.
--  cattle_category / breed / purpose / course_category — crescem sem migration.
-- ============================================================================
begin;

create table if not exists cattle_category (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Boi Gordo','Garrote','Novilha','Bezerro','Vaca'
  created_at timestamptz not null default now()
);
comment on table cattle_category is 'Categoria de gado (dimensão). Também é a dimensão de market_prices.';

create table if not exists breed (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Nelore','Angus','Brangus','Brahman','Guzerá','Cruzamento'...
  created_at timestamptz not null default now()
);
comment on table breed is 'Raça / tipo racial (dimensão extensível).';

create table if not exists purpose (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Corte','Recria','Engorda','Cria' (mock usa também 'Recria/Cria')
  created_at timestamptz not null default now()
);
comment on table purpose is 'Finalidade / aptidão do lote (dimensão extensível).';

create table if not exists course_category (
  id         bigint generated always as identity primary key,
  name       text   not null unique,          -- 'Comece aqui','Compra','Venda','Recria','Engorda','Mercado',...
  created_at timestamptz not null default now()
);
comment on table course_category is 'Categoria/trilha de curso da BTA Academy (dimensão extensível).';

commit;
