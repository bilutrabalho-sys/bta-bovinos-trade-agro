-- ============================================================================
--  BTA — Bovinos Trade Agro
--  seed.sql — Dados fictícios de desenvolvimento/teste
-- ----------------------------------------------------------------------------
--  Ordem de aplicação: migrations 001..014  ->  dba_hardening.sql  ->  ESTE arquivo.
--
--  Objetivo: reproduzir o mock (src/data/mock.ts) num banco real, de forma que
--  TODAS as telas do app nasçam navegáveis (vitrine, mercado, radar, match,
--  negociação, academy, simulador, perfil, engajamento, monetização).
--
--  DECISÕES / FATOS RESPEITADOS:
--    * PKs são GENERATED ALWAYS AS IDENTITY. Onde o frontend depende do id do
--      mock (lots 1..20, farms 1..10, opportunities 1..10, courses/lessons 1..10,
--      transporters/services etc.), inserimos com OVERRIDING SYSTEM VALUE e, ao
--      final, RESSINCRONIZAMOS as sequences (setval). Assim Lot.seller_id (mock
--      sellerId) continua apontando para o Farm certo.
--    * COLUNAS GENERATED são OMITIDAS (é erro inserir):
--        - lots.price_total  (calculada: '/@' => price*(weight/15)*qty; '/cab' => price*qty)
--        - transactions.fee_amount (calculada: total_value * fee_percent/100)
--      Os priceTotal '/@' do mock estavam errados (hand-authored) — ignorados:
--      o banco recalcula o canônico.
--    * transactions.weight_snapshot é OBRIGATÓRIO em '/@' (chk_tx_weight_snapshot_for_arroba):
--      usamos o peso do lote no fechamento.
--    * RLS: o dba_hardening habilitou RLS SEM force. Este seed roda como OWNER
--      das tabelas (ou bta_admin/superuser) => NÃO é filtrado por RLS. Rode como
--      dono das tabelas; NÃO rode como um login membro de bta_app.
--
--  IDEMPOTÊNCIA: começa com TRUNCATE ... RESTART IDENTITY CASCADE de todas as
--  tabelas populadas — pode reexecutar à vontade. (TRUNCATE exige ser o dono /
--  ter privilégio de TRUNCATE; o seed é para dev/CI, não para produção.)
--
--  SEM SEGREDOS REAIS: e-mails @example.com, telefones fictícios, nenhum dado
--  pessoal real. "Rafael Mendonça" é o nome de perfil do próprio mock.
-- ============================================================================

begin;
set local client_min_messages = warning;

-- ---------------------------------------------------------------------------
--  0. LIMPEZA (idempotência). CASCADE cobre quaisquer dependentes.
-- ---------------------------------------------------------------------------
truncate table
  users, user_preference,
  farms, farm_specialty, lots, lot_images,
  cattle_category, breed, purpose, course_category,
  market_prices, market_price_points,
  opportunities, radars, radar_state, match_searches, match_results,
  proposals, negotiation_messages, transactions, transaction_steps,
  transporters, transports,
  courses, user_course_progress, lessons, lesson_sections,
  lesson_key_concepts, lesson_quiz_questions, lesson_quiz_options,
  user_lesson_progress,
  simulations,
  notifications, favorites, follows,
  subscription_plans, subscriptions, lot_boosts, services, platform_settings,
  -- SEÇÃO 15 (novos domínios: insumos, vet, usados, vídeos) — as 26 tabelas novas.
  -- Ordem não importa no TRUNCATE (CASCADE cobre as dependências).
  insumo_category, insumo_product, insumo_product_tag, supplier, supplier_offer,
  farm_stock_item, group_buy, group_buy_participation, price_alert, insumo_purchase,
  vet, vet_specialty, vet_certification, vet_service, vet_availability_day,
  vet_appointment, vet_review,
  used_category, used_listing, used_saved, used_contact,
  video_category, vet_video, video_like, video_save, vet_follow
restart identity cascade;


-- ============================================================================
--  1. DIMENSÕES DE REFERÊNCIA (populadas primeiro; lots/radars/market referenciam
--     por FK, resolvidas por NOME nas seções seguintes). Ids auto (não forçados).
-- ============================================================================
insert into cattle_category (name) values
  ('Boi Gordo'), ('Vaca'), ('Novilha'), ('Bezerro'), ('Garrote');

insert into breed (name) values
  ('Nelore'), ('Brangus'), ('Angus'), ('Guzerá'), ('Brahman'), ('Cruzamento Industrial');

insert into purpose (name) values
  ('Corte'), ('Recria'), ('Engorda'), ('Cria'), ('Recria/Cria');

insert into course_category (name) values
  ('Comece aqui'), ('Compra'), ('Venda'), ('Recria'), ('Engorda'),
  ('Mercado'), ('Finanças'), ('Genética'), ('Gestão');


-- ============================================================================
--  2. IDENTIDADE
--  user 1 = Rafael (comprador, perfil da ProfileScreen). users 2..11 = donos
--  das 10 fazendas (1 dono por farm), role 'vendedor'.
-- ============================================================================
insert into users (id, name, role, email, phone, location, state, level, xp, negotiations_count)
overriding system value
values
  (1, 'Rafael Mendonça', 'comprador', 'rafael.mendonca@example.com', '+5517991230001', 'São José do Rio Preto', 'SP', 'Iniciante', 380, 12),
  (2, 'João Batista Ferreira', 'vendedor', null, '+5517991230002', 'Barretos', 'SP', 'Iniciante', 0, 0),
  (3, 'Marcos Antônio Silva', 'vendedor', null, '+5534991230003', 'Uberaba', 'MG', 'Iniciante', 0, 0),
  (4, 'Carlos Eduardo Nunes', 'vendedor', null, '+5567991230004', 'Campo Grande', 'MS', 'Iniciante', 0, 0),
  (5, 'Ana Paula Rezende', 'vendedor', null, '+5516991230005', 'Ribeirão Preto', 'SP', 'Iniciante', 0, 0),
  (6, 'Roberto Carvalho', 'vendedor', null, '+5518991230006', 'Araçatuba', 'SP', 'Iniciante', 0, 0),
  (7, 'Fernando Gomes', 'vendedor', null, '+5562991230007', 'Goiânia', 'GO', 'Iniciante', 0, 0),
  (8, 'Luiz Henrique Prado', 'vendedor', null, '+5565991230008', 'Cuiabá', 'MT', 'Iniciante', 0, 0),
  (9, 'Patrícia Almeida', 'vendedor', null, '+5514991230009', 'Bauru', 'SP', 'Iniciante', 0, 0),
  (10, 'José Ricardo Barros', 'vendedor', null, '+5518991230010', 'Presidente Prudente', 'SP', 'Iniciante', 0, 0),
  (11, 'Sandra Regina Lima', 'vendedor', null, '+5567991230011', 'Campo Grande', 'MS', 'Iniciante', 0, 0);

-- Tags de preferência do perfil do Rafael (mock: ['Comprador','Nelore','SP','Até 200 km']).
insert into user_preference (user_id, tag) values
  (1, 'Comprador'), (1, 'Nelore'), (1, 'SP'), (1, 'Até 200 km');


-- ============================================================================
--  3. FAZENDAS E LOTES
-- ============================================================================
insert into farms (id, owner_user_id, name, rating, deals, completion, location, state, verified, since_year, description, active_lots)
overriding system value
values
  (1, 2, 'Fazenda Santa Helena', 4.9, 1248, 97, 'Barretos, SP', 'SP', true, 2021, 'Fazenda de 4.800 hectares especializada em Nelore e cruzamentos. Rastreamento 100% do rebanho.', 3),
  (2, 3, 'Agropecuária Três Irmãos', 4.8, 892, 95, 'Uberaba, MG', 'MG', true, 2022, 'Referência em cruzamento industrial no Triângulo Mineiro. Confinamento próprio com 2.000 cabeças.', 2),
  (3, 4, 'Pecuária Pantanal Verde', 4.7, 634, 93, 'Campo Grande, MS', 'MS', true, 2020, 'Pecuária extensiva no Pantanal Sul-Mato-Grossense. Gado rústico e adaptado ao bioma.', 2),
  (4, 5, 'Fazenda Boa Vista', 4.9, 1856, 98, 'Ribeirão Preto, SP', 'SP', true, 2019, 'Maior produtor de Angus certificado da região de Ribeirão Preto. Parceiro de frigoríficos premium.', 4),
  (5, 6, 'Confinamento Rio Claro', 4.6, 423, 91, 'Araçatuba, SP', 'SP', true, 2023, 'Confinamento moderno com capacidade de 5.000 cabeças. Dieta formulada por nutrólogos.', 2),
  (6, 7, 'Fazenda São Lucas', 4.5, 312, 89, 'Goiânia, GO', 'GO', false, 2022, 'Especialista em zebuínos do Cerrado. Foco em matrizes e reprodutores de alta genética.', 2),
  (7, 8, 'Agro Cuiabá Pecuária', 4.8, 768, 94, 'Cuiabá, MT', 'MT', true, 2021, 'Produção em larga escala no Mato Grosso. Rebanho rastreado, vacinado e documentado.', 2),
  (8, 9, 'Fazenda Nova Esperança', 4.7, 534, 92, 'Bauru, SP', 'SP', false, 2022, 'Produção familiar de alta qualidade. Foco em bem-estar animal e sustentabilidade.', 1),
  (9, 10, 'Haras e Pecuária JB', 4.4, 198, 87, 'Presidente Prudente, SP', 'SP', false, 2023, 'Operação diversificada com pecuária de cria e recria. Bezerros de boa procedência.', 1),
  (10, 11, 'Fazenda São Judas', 4.6, 445, 90, 'Campo Grande, MS', 'MS', false, 2022, 'Pecuária tradicional do MS com foco em bezerros desmamados e garrotes.', 1);

-- Especialidades (Farm.specialties[]) — tags livres (misturam raça e categoria).
insert into farm_specialty (farm_id, specialty) values
  (1, 'Nelore'), (1, 'Brangus'),
  (2, 'Cruzamento'), (2, 'Brangus'),
  (3, 'Nelore'), (3, 'Garrotes'),
  (4, 'Angus'), (4, 'Nelore'), (4, 'Brangus'),
  (5, 'Novilha'), (5, 'Boi Gordo'),
  (6, 'Guzerá'), (6, 'Brahman'),
  (7, 'Nelore'), (7, 'Garrotes'),
  (8, 'Nelore'), (8, 'Novilha'),
  (9, 'Nelore'), (9, 'Bezerros'),
  (10, 'Nelore'), (10, 'Bezerros');

-- lots (20). price_total OMITIDO (GENERATED). category/breed/purpose resolvidos
-- por NOME (FK). status='published' => visíveis na vitrine. seller_id = mock sellerId.
insert into lots
  (id, title, category_id, breed_id, quantity, weight, price, price_unit,
   location, state, distance, freight, score, verified, seller_id, age, sex, purpose_id, status, description)
overriding system value
select v.id, v.title, cc.id, br.id, v.quantity, v.weight, v.price, v.price_unit::price_unit,
       v.location, v.state, v.distance, v.freight, v.score, v.verified, v.seller_id, v.age,
       v.sex::lot_sex, pp.id, v.status::lot_status, v.description
from (values
  (1, '120 Nelore', 'Boi Gordo', 'Nelore', 120, 380, 315, '/@', 'Barretos, SP', 'SP', 92, 4200, 94, true, 1, '36 meses', 'Macho', 'Corte', 'published', 'Lote homogêneo de Nelore puro de origem, terminado em pasto com suplementação. Todos vacinados e documentados. Prontos para abate.'),
  (2, '80 Brangus', 'Boi Gordo', 'Brangus', 80, 390, 318, '/@', 'Uberaba, MG', 'MG', 145, 3800, 88, true, 2, '38 meses', 'Macho', 'Corte', 'published', 'Brangus com excelente acabamento de gordura. Criados em pastagem rotacionada. Documentação GTA em dia.'),
  (3, '200 Nelore', 'Garrote', 'Nelore', 200, 220, 2400, '/cab', 'Ribeirão Preto, SP', 'SP', 67, 5200, 91, true, 4, '18 meses', 'Macho', 'Recria', 'published', 'Garrotes Nelore de alta genética, filhos de touros PO. Ótimo potencial de ganho. Vacinação completa.'),
  (4, '50 Angus', 'Boi Gordo', 'Angus', 50, 420, 325, '/@', 'Campo Grande, MS', 'MS', 312, 6800, 85, false, 3, '40 meses', 'Macho', 'Corte', 'published', 'Angus com acabamento premium. Alto rendimento de carcaça. Confinados nos últimos 90 dias.'),
  (5, '150 Nelore', 'Novilha', 'Nelore', 150, 260, 268, '/@', 'Bauru, SP', 'SP', 180, 4900, 79, false, 8, '24 meses', 'Fêmea', 'Recria/Cria', 'published', 'Novilhas Nelore em ótimas condições. Prontas para coberta ou engorda. Criadas em pastagem nativa.'),
  (6, '300 Nelore', 'Garrote', 'Nelore', 300, 210, 2280, '/cab', 'Cuiabá, MT', 'MT', 580, 8500, 87, true, 7, '15 meses', 'Macho', 'Recria', 'published', 'Grande lote de garrotes Nelore do Pantanal. Rusticidade e adaptabilidade garantidas.'),
  (7, '40 Guzerá', 'Vaca', 'Guzerá', 40, 380, 225, '/@', 'Goiânia, GO', 'GO', 420, 5600, 82, false, 6, '48 meses', 'Fêmea', 'Cria', 'published', 'Vacas Guzerá com histórico de boa produção. Algumas prenhes. Ideal para reposição de rebanho.'),
  (8, '90 Brangus', 'Novilha', 'Brangus', 90, 270, 272, '/@', 'Araçatuba, SP', 'SP', 88, 3200, 93, true, 5, '22 meses', 'Fêmea', 'Engorda', 'published', 'Novilhas Brangus com excelente conformação. Ganho de peso superior à média. Documentação completa.'),
  (9, '180 Nelore', 'Bezerro', 'Nelore', 180, 180, 1850, '/cab', 'Presidente Prudente, SP', 'SP', 220, 7200, 76, false, 9, '8 meses', 'Macho', 'Recria', 'published', 'Bezerros Nelore desmamados, saudáveis. Prontos para recria em pasto ou confinamento.'),
  (10, '60 Cruzamento', 'Boi Gordo', 'Cruzamento Industrial', 60, 410, 320, '/@', 'Uberaba, MG', 'MG', 160, 4100, 90, true, 2, '36 meses', 'Macho', 'Corte', 'published', 'Cruzamento industrial com alto rendimento. Terminados em confinamento. Frigoríficos já interessados.'),
  (11, '120 Nelore', 'Garrote', 'Nelore', 120, 230, 2350, '/cab', 'Campo Grande, MS', 'MS', 290, 6100, 86, true, 3, '16 meses', 'Macho', 'Recria', 'published', 'Garrotes de boa procedência. Rebanho rastreado desde o nascimento.'),
  (12, '45 Brahman', 'Boi Gordo', 'Brahman', 45, 395, 312, '/@', 'Goiânia, GO', 'GO', 440, 6300, 78, false, 6, '38 meses', 'Macho', 'Corte', 'published', 'Brahman adaptados ao cerrado. Excelente rusticidade e conversão alimentar.'),
  (13, '70 Brangus', 'Bezerro', 'Brangus', 70, 190, 1950, '/cab', 'Barretos, SP', 'SP', 95, 3700, 89, true, 1, '9 meses', 'Macho', 'Recria', 'published', 'Bezerros Brangus de alta genética. Filhos de matrizes PO. Ótima evolução esperada.'),
  (14, '250 Nelore', 'Garrote', 'Nelore', 250, 220, 2320, '/cab', 'Cuiabá, MT', 'MT', 560, 9200, 84, false, 7, '17 meses', 'Macho', 'Recria', 'published', 'Grande lote para recria. Animais de boa conformação, adaptados ao clima quente.'),
  (15, '30 Angus', 'Boi Gordo', 'Angus', 30, 430, 330, '/@', 'Ribeirão Preto, SP', 'SP', 75, 2800, 96, true, 4, '42 meses', 'Macho', 'Corte', 'published', 'Lote premium de Angus confinado. Rendimento de carcaça acima de 60%. Documentação impecável.'),
  (16, '100 Nelore', 'Vaca', 'Nelore', 100, 360, 218, '/@', 'Araçatuba, SP', 'SP', 92, 3400, 80, false, 5, '60 meses', 'Fêmea', 'Cria', 'published', 'Vacas Nelore com bom histórico reprodutivo. Paridas recentemente. Matrizes selecionadas.'),
  (17, '80 Guzerá', 'Novilha', 'Guzerá', 80, 255, 265, '/@', 'Goiânia, GO', 'GO', 430, 5900, 75, false, 6, '20 meses', 'Fêmea', 'Recria', 'published', 'Novilhas Guzerá para recria. Animais saudáveis em bom estado nutricional.'),
  (18, '160 Nelore', 'Boi Gordo', 'Nelore', 160, 370, 311, '/@', 'Barretos, SP', 'SP', 95, 4600, 92, true, 1, '34 meses', 'Macho', 'Corte', 'published', 'Nelore de excelente padrão racial. Lote uniforme, prontos para o abate. Fazenda BTA Verified há 3 anos.'),
  (19, '55 Cruzamento', 'Garrote', 'Cruzamento Industrial', 55, 240, 2420, '/cab', 'Uberaba, MG', 'MG', 150, 4300, 88, true, 2, '18 meses', 'Macho', 'Recria', 'published', 'Cruzamento industrial de alta performance. Genética selecionada para engorda rápida.'),
  (20, '200 Nelore', 'Bezerro', 'Nelore', 200, 175, 1780, '/cab', 'Campo Grande, MS', 'MS', 310, 7800, 83, false, 10, '7 meses', 'Macho', 'Recria', 'published', 'Bezerros recém-desmamados, saudáveis. Ótima genética materna. Prontos para recria.')
) as v(id, title, category, breed, quantity, weight, price, price_unit, location, state, distance, freight, score, verified, seller_id, age, sex, purpose, status, description)
join cattle_category cc on cc.name = v.category
join breed br on br.name = v.breed
left join purpose pp on pp.name = v.purpose;

-- lot_images: Lot.image (capa) + Lot.images[] (galeria). position 0 = capa (is_cover).
with img(idx, url) as (values
  (0, 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=500&fit=crop&auto=format'),
  (1, 'https://images.unsplash.com/photo-1440428099904-c6d459a7e7b5?w=800&h=500&fit=crop&auto=format'),
  (2, 'https://images.unsplash.com/photo-1561043394-9f7d16d9ae37?w=800&h=500&fit=crop&auto=format'),
  (3, 'https://images.unsplash.com/photo-1563308294-6d63bb78d61e?w=800&h=500&fit=crop&auto=format'),
  (4, 'https://images.unsplash.com/photo-1498191923457-88552caeccb3?w=800&h=500&fit=crop&auto=format'),
  (5, 'https://images.unsplash.com/photo-1569858241634-5aee6e47091a?w=800&h=500&fit=crop&auto=format'),
  (6, 'https://images.unsplash.com/photo-1580570598977-4b2412d01bbc?w=800&h=500&fit=crop&auto=format'),
  (7, 'https://images.unsplash.com/photo-1589248529232-69c286cf2cb4?w=800&h=500&fit=crop&auto=format')
),
lot_img(lot_id, position, idx) as (values
  (1,0,0),(1,1,2),(1,2,4),
  (2,0,1),(2,1,5),(2,2,3),
  (3,0,2),(3,1,0),(3,2,6),
  (4,0,3),(4,1,7),(4,2,1),
  (5,0,4),(5,1,2),(5,2,5),
  (6,0,5),(6,1,3),(6,2,0),
  (7,0,6),(7,1,4),(7,2,2),
  (8,0,7),(8,1,1),(8,2,3),
  (9,0,0),(9,1,6),(9,2,4),
  (10,0,1),(10,1,7),(10,2,5),
  (11,0,2),(11,1,0),(11,2,7),
  (12,0,3),(12,1,5),(12,2,1),
  (13,0,4),(13,1,2),(13,2,6),
  (14,0,5),(14,1,3),(14,2,7),
  (15,0,6),(15,1,0),(15,2,4),
  (16,0,7),(16,1,5),(16,2,3),
  (17,0,0),(17,1,2),(17,2,6),
  (18,0,1),(18,1,4),(18,2,2),
  (19,0,2),(19,1,7),(19,2,5),
  (20,0,3),(20,1,1),(20,2,6)
)
insert into lot_images (lot_id, url, position, is_cover)
select li.lot_id, img.url, li.position, (li.position = 0)
from lot_img li
join img on img.idx = li.idx;


-- ============================================================================
--  4. MERCADO
--  market_prices: 1 linha por categoria (snapshot corrente; region/state NULL = nacional).
-- ============================================================================
insert into market_prices (category_id, current, change, unit, color, region, state, source)
select cc.id, v.current, v.change, v.unit::price_unit, v.color, null, null, 'Demonstração'
from (values
  ('Boi Gordo', 315.40, 2.30, '/@', '#123B2A'),
  ('Vaca', 220.80, -0.80, '/@', '#1E5A40'),
  ('Novilha', 268.20, 1.20, '/@', '#2E7D52'),
  ('Bezerro', 1852.00, 3.10, '/cab', '#D6A84F'),
  ('Garrote', 2380.00, 0.90, '/cab', '#68736D')
) as v(name, current, change, unit, color)
join cattle_category cc on cc.name = v.name;

-- market_price_points: série DIÁRIA de ~91 dias (current_date-90 .. current_date)
-- por categoria (region NULL = nacional). ABORDAGEM: série SINTÉTICA plausível
-- (oscila ~±7% em torno do valor-base via senoides determinísticas), suficiente
-- para as janelas history7/30/90 do app (que são só WHERE price_date >= hoje-N).
-- Não reproduz o RNG exato do mock (generateHistory) — desnecessário p/ o app.
insert into market_price_points (category_id, region, price_date, value)
select cc.id,
       null::text,
       (current_date - (90 - gs))::date,
       round((c.base::float8 * (1
             + 0.05 * sin(((gs + c.phase) / 8.0)::float8)
             + 0.02 * sin(((gs + c.phase) / 3.0)::float8)))::numeric, 2)
from (values
  ('Boi Gordo', 315.0, 1.0),
  ('Vaca', 220.0, 2.0),
  ('Novilha', 268.0, 3.0),
  ('Bezerro', 1852.0, 4.0),
  ('Garrote', 2380.0, 5.0)
) as c(name, base, phase)
join cattle_category cc on cc.name = c.name
cross join generate_series(0, 90) as gs;


-- ============================================================================
--  5. DESCOBERTA
--  opportunities: feed GLOBAL (user_id NULL). lot_id do mock.
-- ============================================================================
insert into opportunities (id, lot_id, user_id, title, avg_regional, price_diff, distance, freight, score, reason)
overriding system value
values
  (1, 15, null, 'Angus Premium', 318, -3.6, 75, 2800, 96, 'Preço 3,6% abaixo da média regional para Angus. Fazenda com 98% de conclusão de negócios.'),
  (2, 1, null, 'Nelore Gordo', 319, -1.3, 92, 4200, 94, 'Fazenda BTA Verified com histórico impecável. Lote homogêneo, ideal para abate direto.'),
  (3, 8, null, 'Brangus Novilha', 280, -2.9, 88, 3200, 93, 'Novilhas Brangus com excelente conformação, 2,9% abaixo do mercado. Frete acessível.'),
  (4, 18, null, 'Nelore Gordo', 315, -1.3, 95, 4600, 92, 'Segunda oportunidade na Fazenda Santa Helena. Uniformidade acima da média.'),
  (5, 10, null, 'Cruzamento Gordo', 322, -0.6, 160, 4100, 90, 'Cruzamento industrial com rendimento de carcaça excepcional.'),
  (6, 3, null, 'Garrotes Nelore', 2450, -2.0, 67, 5200, 91, 'Garrotes com genética superior 2% abaixo do mercado. Distância curta, frete competitivo.'),
  (7, 19, null, 'Garrotes Cruzamento', 2480, -2.4, 150, 4300, 88, 'Alta performance de ganho estimada. Fazenda verificada com bom histórico.'),
  (8, 13, null, 'Bezerros Brangus', 2020, -3.5, 95, 3700, 89, 'Bezerros Brangus 3,5% abaixo da média. Boa genética para recria.'),
  (9, 2, null, 'Brangus Gordo', 322, -1.2, 145, 3800, 88, 'Excelente acabamento de gordura. Indicado para frigoríficos exportadores.'),
  (10, 11, null, 'Garrotes Nelore MS', 2390, -1.7, 290, 6100, 86, 'Lote de 120 garrotes homogêneos. Bom custo por cabeça considerando a qualidade.');

-- radars (RadarAlert do Rafael) + critérios estruturados quando dá p/ inferir.
insert into radars (id, user_id, title, criteria_text, category_id, breed_id, purpose_id, sex, max_price, price_unit, max_distance, active, matches)
overriding system value
values
  (1, 1, 'Garrotes Nelore', 'Até R$ 2.400/cab · Até 200 km · SP/MG',
     (select id from cattle_category where name = 'Garrote'),
     (select id from breed where name = 'Nelore'),
     null, null, 2400, '/cab', 200, true, 3),
  (2, 1, 'Boi Gordo Premium', 'R$ 310–325/@ · Score ≥ 90 · Qualquer estado',
     (select id from cattle_category where name = 'Boi Gordo'),
     null, null, null, 325, '/@', null, true, 1),
  (3, 1, 'Bezerros para Recria', 'Até R$ 2.000/cab · Macho · SP',
     (select id from cattle_category where name = 'Bezerro'),
     null,
     (select id from purpose where name = 'Recria'),
     'Macho', 2000, '/cab', null, false, 0);

insert into radar_state (radar_id, state) values
  (1, 'SP'), (1, 'MG'), (3, 'SP');

-- match_searches (1, do Rafael) + match_results (4, do MATCH_RESULTS).
insert into match_searches (id, user_id, query, category_id, breed_id, sex, max_distance, max_price, price_unit, min_score, state)
overriding system value
values
  (1, 1, null,
     (select id from cattle_category where name = 'Boi Gordo'),
     (select id from breed where name = 'Nelore'),
     'Macho', 200, 320, '/@', 90, null);

insert into match_results (match_search_id, lot_id, compatibility, highlight) values
  (1, 1, 96, 'Nelore 380kg · R$ 315/@ · 92km'),
  (1, 18, 94, 'Nelore 370kg · R$ 311/@ · 95km'),
  (1, 10, 91, 'Cruzamento 410kg · R$ 320/@ · 160km'),
  (1, 4, 87, 'Angus 420kg · R$ 325/@ · 312km');


-- ============================================================================
--  6. FLUXO DE NEGOCIAÇÃO
--  proposal 1 (lot 1, 120 Nelore) => negociação do chat => transação fechada.
--  proposal 2 (lot 2, 80 Brangus) => proposta ATIVA (BusinessScreen).
-- ============================================================================
insert into proposals (id, lot_id, buyer_user_id, seller_farm_id, proposed_price, price_unit, quantity, status, closed_at)
overriding system value
values
  (1, 1, 1, 1, 312, '/@', 120, 'accepted', timestamptz '2026-08-22 14:40:00-03'),
  (2, 2, 1, 2, 315, '/@', 80, 'active', null);

-- negotiation_messages (ChatMessage) da proposta 1 (lote 120 Nelore).
insert into negotiation_messages (proposal_id, sender, text, sent_at) values
  (1, 'buyer',  'Tenho interesse no lote de 120 Nelore. Ainda disponível?',                        timestamptz '2026-08-22 14:22:00-03'),
  (1, 'seller', 'Sim, disponível! O lote está em ótimas condições, prontos para abate.',            timestamptz '2026-08-22 14:25:00-03'),
  (1, 'buyer',  'Consegue fazer R$ 310/@? Pago à vista.',                                           timestamptz '2026-08-22 14:28:00-03'),
  (1, 'seller', 'Minha base é R$ 315. Posso chegar a R$ 312 à vista, mas não consigo ir além.',     timestamptz '2026-08-22 14:31:00-03'),
  (1, 'buyer',  'Fechamos a R$ 312/@. Como procedemos?',                                            timestamptz '2026-08-22 14:35:00-03'),
  (1, 'seller', 'Perfeito! Vou emitir a proposta formal pelo BTA. Pode aceitar por lá.',            timestamptz '2026-08-22 14:36:00-03');

-- transactions: negócio fechado no lote 1. price_unit '/@' => weight_snapshot
-- OBRIGATÓRIO (= peso do lote 1 = 380). total_value calculado pela mesma fórmula
-- do '/@' (agreed_price * (weight/15) * qty). fee_amount OMITIDO (GENERATED).
-- status 'transport' (2 primeiras etapas concluídas na DealClosedScreen).
insert into transactions
  (id, lot_id, buyer_user_id, seller_farm_id, proposal_id, quantity, agreed_price, price_unit,
   weight_snapshot, total_value, status, fee_percent, closed_at, completed_at)
overriding system value
values
  (1, 1, 1, 1, 1, 120, 312, '/@', 380,
   round(312 * (380 / 15.0) * 120, 2), 'transport', 1.00,
   timestamptz '2026-08-22 14:45:00-03', null);

-- transaction_steps: 5 etapas; as 2 primeiras done (DealClosedScreen).
insert into transaction_steps (transaction_id, step_order, label, done, done_at) values
  (1, 1, 'Negócio confirmado',  true,  timestamptz '2026-08-22 14:45:00-03'),
  (1, 2, 'Documentação (GTA)',  true,  timestamptz '2026-08-22 16:00:00-03'),
  (1, 3, 'Transporte',          false, null),
  (1, 4, 'Entrega',             false, null),
  (1, 5, 'Conclusão',           false, null);

-- transporters (BTA Log). state derivado da location.
insert into transporters (id, name, rating, trips, capacity, price_per_km, verified, location, state, available)
overriding system value
values
  (1, 'Transportadora JB Cargas', 4.8, 234, 40, 4.5, true, 'Barretos, SP', 'SP', true),
  (2, 'Fretes Agro SP', 4.6, 167, 26, 3.8, true, 'Ribeirão Preto, SP', 'SP', true),
  (3, 'Transporte Rural Centro-Oeste', 4.4, 89, 52, 4.2, false, 'Uberaba, MG', 'MG', false);

-- transports: frete da transação 1, ligado à transportadora 1 (JB Cargas, Barretos).
insert into transports (transaction_id, transporter_id, origin, destination, distance, freight, status) values
  (1, 1, 'Barretos, SP', 'São José do Rio Preto, SP', 92, 4200, 'confirmed');


-- ============================================================================
--  7. APRENDIZADO (BTA Academy)
--  courses (10) e lessons (10, 1:1 com o curso no mock => lesson.id = course.id).
-- ============================================================================
insert into courses (id, title, category_id, duration, level, xp)
overriding system value
select v.id, v.title, cc.id, v.duration, v.level::course_level, v.xp
from (values
  (1, 'O que é arroba e como calcular', 'Comece aqui', '8 min', 'Iniciante', 50),
  (2, 'Como analisar um lote antes de comprar', 'Compra', '15 min', 'Iniciante', 80),
  (3, 'Entendendo o custo de frete na pecuária', 'Compra', '12 min', 'Iniciante', 70),
  (4, 'Como precificar seu gado para venda', 'Venda', '18 min', 'Intermediário', 100),
  (5, 'Recria: do bezerro ao garrote', 'Recria', '22 min', 'Intermediário', 120),
  (6, 'Confinamento: custo, dieta e resultado', 'Engorda', '30 min', 'Avançado', 150),
  (7, 'Leitura de mercado e timing de compra', 'Mercado', '20 min', 'Intermediário', 110),
  (8, 'Calculando margem e ponto de equilíbrio', 'Finanças', '25 min', 'Intermediário', 130),
  (9, 'Genética Nelore: o que avaliar no lote', 'Genética', '28 min', 'Avançado', 140),
  (10, 'Gestão de rebanho com tecnologia', 'Gestão', '20 min', 'Intermediário', 110)
) as v(id, title, category, duration, level, xp)
join course_category cc on cc.name = v.category;

-- user_course_progress (Rafael): curso 1=100% (concluído), curso 2=60%, demais 0.
insert into user_course_progress (user_id, course_id, progress, completed_at) values
  (1, 1, 100, timestamptz '2026-08-15 10:00:00-03'),
  (1, 2, 60, null),
  (1, 3, 0, null), (1, 4, 0, null), (1, 5, 0, null), (1, 6, 0, null),
  (1, 7, 0, null), (1, 8, 0, null), (1, 9, 0, null), (1, 10, 0, null);

insert into lessons (id, course_id, title, category_id, level, duration, xp)
overriding system value
select v.id, v.id, v.title, cc.id, v.level::course_level, v.duration, v.xp
from (values
  (1, 'O que é arroba e como calcular', 'Comece aqui', 'Iniciante', '8 min', 50),
  (2, 'Como analisar um lote antes de comprar', 'Compra', 'Iniciante', '15 min', 80),
  (3, 'Entendendo o custo de frete na pecuária', 'Compra', 'Iniciante', '12 min', 70),
  (4, 'Como precificar seu gado para venda', 'Venda', 'Intermediário', '18 min', 100),
  (5, 'Recria: do bezerro ao garrote', 'Recria', 'Intermediário', '22 min', 120),
  (6, 'Confinamento: custo, dieta e resultado', 'Engorda', 'Avançado', '30 min', 150),
  (7, 'Leitura de mercado e timing de compra', 'Mercado', 'Intermediário', '20 min', 110),
  (8, 'Calculando margem e ponto de equilíbrio', 'Finanças', 'Intermediário', '25 min', 130),
  (9, 'Genética Nelore: o que avaliar no lote', 'Genética', 'Avançado', '28 min', 140),
  (10, 'Gestão de rebanho com tecnologia', 'Gestão', 'Intermediário', '20 min', 110)
) as v(id, title, category, level, duration, xp)
join course_category cc on cc.name = v.category;

-- lesson_sections (sections[{heading, body}]), position 0..n por aula.
insert into lesson_sections (lesson_id, position, heading, body) values
  (1, 0, 'O que é a arroba?', 'A arroba (símbolo @) é a principal unidade de peso usada no mercado bovino brasileiro. Cada arroba equivale a 15 quilogramas de peso vivo do animal.'),
  (1, 1, 'Como calcular?', 'Divida o peso do animal por 15. Um boi de 420 kg tem 28 arrobas. Se o preço está a R$ 315/@, o valor do animal é R$ 315 × 28 = R$ 8.820.'),
  (1, 2, 'Exemplo prático', 'Você está analisando um lote de 120 Nelore a R$ 315/@, com peso médio de 380 kg. Cada animal tem 25,3 arrobas. O valor por cabeça é R$ 7.969. O lote completo: R$ 956.280.'),
  (2, 0, 'Uniformidade em primeiro lugar', 'Um bom lote tem peso, idade e acabamento parecidos entre os animais. Lotes desuniformes escondem animais fracos entre os fortes e complicam a revenda ou o abate em conjunto.'),
  (2, 1, 'BTA Score e selo verificado', 'O BTA Score resume sanidade, documentação, histórico do vendedor e qualidade das fotos em uma nota de 0 a 100. Lotes com selo "Verificado" já passaram por checagem de GTA e vacinação — priorize-os ao comparar preços parecidos.'),
  (2, 2, 'Documentação e histórico do vendedor', 'Confira a GTA (Guia de Trânsito Animal), o calendário de vacinação e o histórico de negociações da fazenda no BTA. Um vendedor com alta taxa de conclusão de negócios reduz o risco de a compra não se concretizar como combinado.'),
  (3, 0, 'Como o frete é formado', 'O valor do frete considera a distância entre a fazenda de origem e o destino, o tipo de caminhão (simples ou bitrem, com ou sem segundo piso) e a quantidade de cabeças transportadas. Combustível, pedágio e motorista compõem a maior parte do custo.'),
  (3, 1, 'Frete total x frete por cabeça', 'Um caminhão boiadeiro com dois pisos carrega até 40 cabeças de gado adulto. Para comparar propostas, divida sempre o frete total pelo número de animais: frete por cabeça = frete total ÷ quantidade. Isso evita comparar lotes de tamanhos diferentes de forma injusta.'),
  (3, 2, 'Impacto no preço final da compra', 'O frete deve entrar na sua conta de custo total, junto com o preço do lote. Um lote mais barato, mas muito distante, pode sair mais caro que um lote um pouco mais caro e próximo, depois de somado o frete.'),
  (4, 0, 'Use a referência regional como ponto de partida', 'Acompanhe o preço médio da sua categoria (Boi Gordo, Novilha, Bezerro etc.) na sua região pelo Mercado do BTA antes de anunciar. Vender muito acima da referência afasta compradores; muito abaixo, deixa dinheiro na mesa.'),
  (4, 1, 'Nunca venda abaixo do custo de produção', 'Some o custo de aquisição, alimentação, sanidade e frete até o ponto de venda. Esse número é o seu piso: preços abaixo dele geram prejuízo mesmo que pareçam competitivos no mercado.'),
  (4, 2, 'Ajuste por qualidade e verificação', 'Lotes uniformes, com boa genética, documentação completa e selo BTA Verificado sustentam um preço acima da média regional. Use fotos recentes e um BTA Score alto para justificar o ágio na hora de negociar.'),
  (5, 0, 'O que é a fase de recria', 'A recria é o período entre a desmama do bezerro (por volta de 7-8 meses, ~180 kg) e o momento em que o animal está pronto para a engorda, geralmente como garrote entre 15 e 18 meses. É a fase em que se forma a estrutura óssea e muscular do animal.'),
  (5, 1, 'Ganho de peso esperado', 'Em pastagem de boa qualidade, com suplementação mineral, o ganho médio esperado fica entre 0,5 e 0,7 kg por dia. Em pasto degradado sem suplemento, esse ganho pode cair para menos da metade — o que atrasa a saída do animal e aumenta o custo por arroba produzida.'),
  (5, 2, 'Nutrição: pasto x suplementação', 'A suplementação mineral é praticamente obrigatória em qualquer sistema de recria a pasto no Brasil. Em época seca, vale considerar suplementação proteica para sustentar o ganho de peso quando a pastagem perde qualidade.'),
  (6, 0, 'Estrutura de custos do confinamento', 'O custo diário por cabeça soma alimentação (a maior fatia), manejo, sanidade e depreciação da estrutura. Diferente da engorda a pasto, no confinamento o custo é previsível e recorrente todo dia — por isso o controle financeiro precisa ser rigoroso.'),
  (6, 1, 'Dieta e conversão alimentar', 'A conversão alimentar ideal em confinamento fica entre 6 e 8 kg de ração por kg de peso vivo ganho. Dietas com maior proporção de concentrado energético aceleram o ganho, mas encarecem o custo por arroba — o equilíbrio depende do preço dos insumos no momento.'),
  (6, 2, 'Ponto de saída: peso e acabamento', 'O confinamento reduz o tempo de terminação para cerca de 80 a 100 dias. A saída ideal combina peso de abate alvo (geralmente acima de 500 kg) com acabamento de gordura adequado — carcaça magra demais é desclassificada pelo frigorífico.'),
  (7, 0, 'Sazonalidade do boi gordo', 'O preço da arroba costuma subir na entressafra (abril a setembro), quando a oferta de boi terminado a pasto diminui, e recuar na safra (outubro a março), com a chegada das águas e maior disponibilidade de animais prontos.'),
  (7, 1, 'Leia o histórico antes de decidir', 'Antes de comprar ou vender, compare o preço atual com o histórico de 30 e 90 dias no Mercado do BTA. Uma alta pontual pode ser ruído; uma tendência sustentada ao longo de semanas é um sinal mais confiável.'),
  (7, 2, 'Fatores externos que movem o preço', 'Câmbio e demanda por exportação afetam diretamente o preço do boi gordo no mercado interno — dólar alto tende a puxar o preço para cima. Fique de olho também no clima: secas prolongadas afetam a oferta de forragem e podem antecipar vendas.'),
  (8, 0, 'A fórmula da margem', 'Margem (%) = (Receita − Custo total) ÷ Custo total × 100. O custo total precisa incluir a compra do lote, alimentação, sanidade, frete e qualquer outro gasto até o momento da venda — esquecer um item infla a margem artificialmente.'),
  (8, 1, 'O que é o ponto de equilíbrio', 'É o preço de venda (ou peso final) em que a receita se iguala exatamente ao custo total, ou seja, margem zero. Vender abaixo do ponto de equilíbrio significa operar no prejuízo, mesmo que o negócio "pareça" ter dado lucro em caixa no curto prazo.'),
  (8, 2, 'Use o Simulador antes de fechar negócio', 'O Simulador do BTA projeta cenário base, otimista e pessimista a partir do preço de compra, custo de recria/engorda e preço de venda estimado. Rodar os três cenários evita fechar uma operação que só é lucrativa se tudo correr perfeitamente.'),
  (9, 0, 'PO x PC: entenda a diferença', 'Animais PO (Puro de Origem) têm registro genealógico completo e maior valor genético agregado, indicados para reprodução e melhoramento do rebanho. Animais PC (Puro por Cruza) e comerciais são majoritariamente destinados à produção de carne, com custo de aquisição menor.'),
  (9, 1, 'Características de conformação a avaliar', 'Observe estrutura óssea, profundidade de corpo, aprumos (postura das pernas) e umbigo/prega umbilical dentro do padrão da raça. Em touros, o perímetro escrotal é um indicador direto de fertilidade e precocidade sexual — quanto maior, geralmente melhor.'),
  (9, 2, 'Impacto da genética no resultado final', 'A genética influencia diretamente a velocidade de ganho de peso, a eficiência alimentar e o rendimento de carcaça no frigorífico. Lotes com genética selecionada custam mais na compra, mas costumam pagar essa diferença em menor tempo de terminação.'),
  (10, 0, 'Rastreabilidade digital do rebanho', 'Identificação individual (brincos eletrônicos ou chips) permite rastrear cada animal desde o nascimento até a venda, facilitando a emissão de GTA e dando mais confiança ao comprador — lotes rastreados tendem a ter BTA Score mais alto.'),
  (10, 1, 'Apps e sensores no dia a dia do manejo', 'Balanças eletrônicas conectadas e apps de manejo reduzem o erro na estimativa de peso, hoje comum quando o peso é "no olho". Sensores de cerca elétrica e monitoramento por imagem de satélite ajudam a otimizar o uso das pastagens.'),
  (10, 2, 'Transformando dados em decisão', 'Histórico de peso, sanidade e custo por animal, quando registrado, permite decidir com mais precisão a hora certa de vender cada lote — e não só "no feeling". Integrar esses dados com serviços como o BTA Log conecta a gestão do rebanho direto à logística pós-venda.');

-- lesson_key_concepts (keyConcepts[]), position 0..n.
insert into lesson_key_concepts (lesson_id, position, concept) values
  (1, 0, '1 @ = 15 kg'), (1, 1, 'Arrobas = Peso ÷ 15'), (1, 2, 'Valor = Arrobas × Preço/@'), (1, 3, 'Rendimento de carcaça ≈ 52% do peso vivo'),
  (2, 0, 'Uniformidade do lote reduz risco e facilita revenda'), (2, 1, 'BTA Score acima de 85 indica lote consistente'), (2, 2, 'Sempre confira GTA e vacinação antes de fechar'), (2, 3, 'Histórico de conclusão do vendedor é tão importante quanto o preço'),
  (3, 0, 'Frete cobre combustível, pedágio e motorista'), (3, 1, 'Caminhão boiadeiro com 2 pisos carrega até 40 cabeças'), (3, 2, 'Frete por cabeça = frete total ÷ nº de animais'), (3, 3, 'Sempre some o frete ao preço do lote para comparar propostas'),
  (4, 0, 'Preço de venda = referência regional ± ajuste de qualidade'), (4, 1, 'Nunca venda abaixo do custo total de produção'), (4, 2, 'Documentação completa e selo Verificado sustentam ágio'), (4, 3, 'Acompanhe o Mercado do BTA antes de anunciar'),
  (5, 0, 'Bezerro desmama com cerca de 180 kg, aos 7-8 meses'), (5, 1, 'Meta de ganho na recria: 0,5-0,7 kg/dia a pasto'), (5, 2, 'Garrote fica pronto para engorda entre 15 e 18 meses'), (5, 3, 'Suplementação mineral é essencial; proteica ajuda na seca'),
  (6, 0, 'Custo diário por cabeça = alimentação + manejo + sanidade'), (6, 1, 'Conversão alimentar ideal: 6-8 kg de ração por kg de ganho'), (6, 2, 'Confinamento reduz terminação para 80-100 dias'), (6, 3, 'Acabamento de gordura insuficiente é desclassificado no frigorífico'),
  (7, 0, 'Preço tende a subir na entressafra (abr-set)'), (7, 1, 'Compare sempre o histórico de 30 e 90 dias antes de decidir'), (7, 2, 'Câmbio alto e exportação forte pressionam o preço para cima'), (7, 3, 'O Radar do BTA ajuda a comprar no ponto certo do ciclo'),
  (8, 0, 'Margem = (Receita − Custo total) ÷ Custo total'), (8, 1, 'Ponto de equilíbrio é onde receita = custo total (margem zero)'), (8, 2, 'Sempre inclua frete e sanidade no custo total'), (8, 3, 'Simule cenários otimista e pessimista antes de decidir'),
  (9, 0, 'PO (Puro de Origem) tem maior valor genético e registro completo'), (9, 1, 'Perímetro escrotal é indicador de fertilidade em touros'), (9, 2, 'Uniformidade do lote reflete seleção genética consistente'), (9, 3, 'Genética influencia ganho de peso e rendimento de carcaça'),
  (10, 0, 'Rastreabilidade individual facilita GTA e eleva o BTA Score'), (10, 1, 'Balanças conectadas reduzem erro de estimativa de peso'), (10, 2, 'Dados históricos melhoram o timing de venda'), (10, 3, 'Tecnologia de gestão conecta produção e logística (ex: BTA Log)');

-- lesson_quiz_questions (quiz[].q / quiz[].answer -> answer_index).
insert into lesson_quiz_questions (lesson_id, position, question, answer_index) values
  (1, 0, 'Um boi de 420 kg tem quantas arrobas?', 1),
  (1, 1, 'Se o preço é R$ 315/@ e o boi tem 28@, qual o valor?', 1),
  (2, 0, 'O que indica que um lote é uniforme?', 1),
  (2, 1, 'O que o selo "Verificado" no BTA garante?', 1),
  (3, 0, 'O que mais pesa no custo do frete?', 1),
  (3, 1, 'Por que comparar o frete "por cabeça" e não só o frete total?', 1),
  (4, 0, 'Qual é o "piso" que o preço de venda nunca deveria ficar abaixo?', 1),
  (4, 1, 'O que pode justificar vender acima da média regional?', 0),
  (5, 0, 'O que caracteriza a fase de recria?', 1),
  (5, 1, 'Qual o ganho de peso diário esperado em recria a pasto com suplementação mineral?', 1),
  (6, 0, 'O que é conversão alimentar?', 1),
  (6, 1, 'Por que uma carcaça pode ser desclassificada mesmo com peso adequado?', 0),
  (7, 0, 'Em qual período o preço do boi gordo costuma subir?', 1),
  (7, 1, 'O que um dólar em alta costuma pressionar no preço do boi gordo?', 1),
  (8, 0, 'O que representa o ponto de equilíbrio?', 1),
  (8, 1, 'Por que esquecer o frete no cálculo de custo é perigoso?', 0),
  (9, 0, 'O que significa um animal ser "PO"?', 1),
  (9, 1, 'O perímetro escrotal em touros é um indicador de quê?', 1),
  (10, 0, 'Qual o principal benefício da identificação individual do rebanho?', 1),
  (10, 1, 'O que uma balança eletrônica conectada melhora no manejo?', 0);

-- lesson_quiz_options (quiz[].opts[]). question_id resolvido por (lesson_id, position).
insert into lesson_quiz_options (question_id, position, option_text)
select q.id, v.opt_pos, v.txt
from (values
  (1,0,0,'24 @'), (1,0,1,'28 @'), (1,0,2,'30 @'),
  (1,1,0,'R$ 7.560'), (1,1,1,'R$ 8.820'), (1,1,2,'R$ 9.450'),
  (2,0,0,'Preço baixo por arroba'), (2,0,1,'Peso, idade e acabamento parecidos entre os animais'), (2,0,2,'Ter mais de 100 cabeças'),
  (2,1,0,'Frete grátis'), (2,1,1,'Checagem de GTA e vacinação já realizada'), (2,1,2,'Desconto automático no preço'),
  (3,0,0,'A cor do caminhão'), (3,0,1,'Distância, combustível e pedágio'), (3,0,2,'O horário da viagem'),
  (3,1,0,'Porque é obrigatório por lei'), (3,1,1,'Porque permite comparar lotes de tamanhos diferentes de forma justa'), (3,1,2,'Porque reduz o preço do lote'),
  (4,0,0,'O preço médio nacional'), (4,0,1,'O custo total de produção'), (4,0,2,'O preço do concorrente mais barato'),
  (4,1,0,'Lote uniforme, verificado e com boa genética'), (4,1,1,'Anunciar em horário nobre'), (4,1,2,'Usar mais fotos no anúncio, mesmo de baixa qualidade'),
  (5,0,0,'O período de terminação em confinamento'), (5,0,1,'O período entre a desmama e a fase de engorda'), (5,0,2,'O momento do abate'),
  (5,1,0,'0,1-0,2 kg/dia'), (5,1,1,'0,5-0,7 kg/dia'), (5,1,2,'2-3 kg/dia'),
  (6,0,0,'O preço da ração por saco'), (6,0,1,'A quantidade de ração necessária para ganhar 1 kg de peso vivo'), (6,0,2,'O tempo total de confinamento'),
  (6,1,0,'Por falta de acabamento de gordura'), (6,1,1,'Por ser Nelore'), (6,1,2,'Por ter mais de 24 meses'),
  (7,0,0,'Na safra, de outubro a março'), (7,0,1,'Na entressafra, de abril a setembro'), (7,0,2,'O preço não tem sazonalidade'),
  (7,1,0,'Para baixo, sempre'), (7,1,1,'Para cima, por puxar a demanda de exportação'), (7,1,2,'Não tem relação nenhuma'),
  (8,0,0,'O preço mais alto já pago por uma arroba'), (8,0,1,'O ponto em que receita e custo total se igualam'), (8,0,2,'A margem máxima possível'),
  (8,1,0,'Porque infla artificialmente a margem calculada'), (8,1,1,'Porque o frete nunca varia'), (8,1,2,'Porque não afeta o resultado final'),
  (9,0,0,'Pronto para o abate'), (9,0,1,'Puro de Origem, com registro genealógico completo'), (9,0,2,'Produzido em confinamento'),
  (9,1,0,'Peso final de abate'), (9,1,1,'Fertilidade e precocidade sexual'), (9,1,2,'Cor da pelagem'),
  (10,0,0,'Deixa o gado mais bonito para foto'), (10,0,1,'Rastreabilidade completa, do nascimento à venda'), (10,0,2,'Reduz o peso do animal'),
  (10,1,0,'A precisão da estimativa de peso'), (10,1,1,'A cor da pelagem dos animais'), (10,1,2,'O preço do frete')
) as v(lesson_id, q_pos, opt_pos, txt)
join lesson_quiz_questions q on q.lesson_id = v.lesson_id and q.position = v.q_pos;

-- user_lesson_progress: aula 1 concluída pelo Rafael (+50 XP).
insert into user_lesson_progress (user_id, lesson_id, completed_at, xp_earned) values
  (1, 1, timestamptz '2026-08-15 10:00:00-03', 50);


-- ============================================================================
--  8. SIMULADOR (SavedSimulation do Rafael). scenario 'base'/'pessimista'.
--  created_at mapeia SavedSimulation.date. Só investment/margin do mock; demais NULL.
-- ============================================================================
insert into simulations (id, user_id, lot_id, name, scenario, investment, margin, created_at)
overriding system value
values
  (1, 1, null, 'Recria 50 Nelore — Barretos', 'base', 125000, 18.4, timestamptz '2026-08-20 09:00:00-03'),
  (2, 1, null, 'Engorda 30 Angus — Ribeirão Preto', 'base', 87000, 22.1, timestamptz '2026-08-15 09:00:00-03'),
  (3, 1, null, 'Confinamento 120 Nelore', 'pessimista', 287400, 14.7, timestamptz '2026-08-10 09:00:00-03');


-- ============================================================================
--  9. ENGAJAMENTO
--  notifications (10, do Rafael). created_at aproximado de Notification.time (relativo).
-- ============================================================================
insert into notifications (id, user_id, type, title, body, read, lot_id, proposal_id, created_at)
overriding system value
values
  (1, 1, 'match', 'Novo lote compatível', '120 Nelore em Barretos — 96% de compatibilidade com sua busca.', false, 1, null, now() - interval '2 minutes'),
  (2, 1, 'proposal', 'Proposta recebida', 'Você recebeu uma proposta para seu anúncio de 80 Brangus.', false, null, 2, now() - interval '18 minutes'),
  (3, 1, 'price', 'Alerta de preço', 'Boi Gordo subiu 2,3% hoje. Confira as oportunidades no radar.', false, null, null, now() - interval '1 hour'),
  (4, 1, 'radar', 'Radar encontrou algo', 'Garrotes Nelore em Campo Grande — R$ 2.350/cab. Dentro do seu critério.', true, 11, null, now() - interval '3 hours'),
  (5, 1, 'academy', 'Nova aula disponível', 'Como calcular o custo de arroba na engorda — BTA Academy.', true, null, null, now() - interval '5 hours'),
  (6, 1, 'match', 'Compatibilidade alta', '30 Angus em Ribeirão Preto — Score 96. Oportunidade premium.', true, 15, null, now() - interval '8 hours'),
  (7, 1, 'price', 'Bezerro em alta', 'Bezerro subiu 3,1% na semana. Momento de comprar para recria.', true, null, null, now() - interval '1 day'),
  (8, 1, 'proposal', 'Contraproposta enviada', 'O vendedor da Fazenda Boa Vista respondeu sua proposta.', true, null, 2, now() - interval '1 day'),
  (9, 1, 'radar', 'Alerta ativado', 'Seu radar de Garrotes Nelore até R$ 320/@ encontrou 3 lotes.', true, null, null, now() - interval '2 days'),
  (10, 1, 'academy', 'Parabéns!', 'Você concluiu o módulo "Entendendo a arroba". +50 XP.', true, null, null, now() - interval '3 days');

-- favorites (exclusive arc): 1 alvo de CADA tipo p/ o Rafael (exercita a constraint).
insert into favorites (user_id, lot_id, farm_id, opportunity_id, simulation_id, lesson_id) values
  (1, 1,    null, null, null, null),   -- lote
  (1, null, 4,    null, null, null),   -- fazenda
  (1, null, null, 1,    null, null),   -- oportunidade
  (1, null, null, null, 1,    null),   -- simulação
  (1, null, null, null, null, 1);      -- aula

-- follows: Rafael segue 2 fazendas.
insert into follows (user_id, farm_id) values
  (1, 1), (1, 4);


-- ============================================================================
--  10. MONETIZAÇÃO
-- ============================================================================
insert into subscription_plans (id, code, name, price, description)
overriding system value
values
  (1, 'free', 'Gratuito', 0, 'Plano gratuito: acesso à vitrine, busca e mercado.'),
  (2, 'pro', 'BTA PRO', 79.00, 'Assinatura PRO: radar ilimitado, destaque de anúncios e simulador avançado.'),
  (3, 'enterprise', 'Empresa', 0, 'Plano corporativo sob consulta: volume, API e gestão multiusuário.');

-- Rafael no plano Gratuito, ativo.
insert into subscriptions (user_id, plan_id, status, started_at, renews_at) values
  (1, 1, 'active', now() - interval '30 days', null);

-- lot_boosts: 1 boost ativo no lote 1 (janela coerente: ends > starts).
insert into lot_boosts (lot_id, tier, status, starts_at, ends_at) values
  (1, 'premium', 'active', now() - interval '2 days', now() + interval '5 days');

-- services (Central de Serviços).
insert into services (id, name, icon, description, status)
overriding system value
values
  (1, 'BTA Log', 'truck', 'Logística e transporte após a negociação.', 'available'),
  (2, 'Seguro Rural', 'shield', 'Proteção do rebanho durante o transporte.', 'soon'),
  (3, 'Financiamento', 'credit-card', 'Crédito rural para compra de gado.', 'soon'),
  (4, 'Documentação', 'file-text', 'GTA, laudos e documentação sanitária.', 'soon'),
  (5, 'Avaliação', 'flask', 'Avaliação profissional de lote in loco.', 'soon'),
  (6, 'Veterinário', 'stethoscope', 'Consulta veterinária e laudos.', 'soon');

-- platform_settings: take rate configurável (§32).
insert into platform_settings (key, value, description) values
  ('take_rate_percent', '1.0'::jsonb, 'Comissão padrão da plataforma (%)');


-- ============================================================================
--  11. NOVOS DOMÍNIOS (SEÇÃO 15) — INSUMOS, VET, USADOS, VÍDEOS
-- ----------------------------------------------------------------------------
--  Reproduz o mock das 4 telas novas. TODAS as FKs são resolvidas por CHAVE
--  NATURAL (slug de categoria, name de supplier/vet, title de produto/vídeo/
--  anúncio) — NENHUM id é forçado aqui, então NÃO há setval para estas tabelas
--  (ids auto de identity avançam sozinhos). Classificação:
--    * CATÁLOGO (vai também no seed-platform): insumo_category/product/tag,
--      supplier/offer, group_buy, used_category, video_category, vet_video,
--      vet + filhas de exibição. Vets seedados têm owner_user_id = NULL (admin).
--    * DADO PRIVADO do user 1 (Rafael) — SÓ AQUI: estoque, participação, alertas,
--      compras, agendamento, review, salvos/contato, like/save/follow.
--
--  ⚠️ INTERAÇÃO COM OS TRIGGERS DE CONTADOR (migration 022 / schema 15.i):
--  inserir filhas (group_buy_participation, vet_review, video_like, video_save)
--  dispara triggers SECURITY DEFINER que BUMPAM os contadores de group_buy/vet/
--  vet_video ALÉM do valor do mock (que já representa muitos usuários). Por isso,
--  no FIM desta seção (subseção "contadores autoritativos"), fixamos os contadores
--  nos valores do mock/contagem real com UPDATEs explícitos — tornando o seed
--  AUTORITATIVO e idempotente, independente do efeito dos triggers.
-- ============================================================================

-- ---- 11.1 INSUMOS · catálogo -----------------------------------------------
-- insumo_category (CATEGORIAS). product_count é fixado no fim (11.9) = contagem
-- real de insumo_product por categoria (não o count do mock, que é do catálogo cheio).
insert into insumo_category (slug, label, color, icon) values
  ('vacinas',      'Vacinas',      '#1565C0', 'syringe'),
  ('medicamentos', 'Medicamentos', '#6A1B9A', 'pill'),
  ('racao',        'Ração',        '#795548', 'grain'),
  ('suplementos',  'Suplementos',  '#E65100', 'flask'),
  ('equipamentos', 'Equipamentos', '#123B2A', 'wrench'),
  ('defensivos',   'Defensivos',   '#C94A45', 'shield');

-- insumo_product (PRODUTOS). cold_chain=frio, temp_range=tempRange. cat via slug.
insert into insumo_product (category_id, name, cold_chain, temp_range)
select ic.id, v.name, v.cold_chain, v.temp_range
from (values
  ('vacinas',      'Vacina Febre Aftosa (100 doses)',           true,  '2°C–8°C'),
  ('medicamentos', 'Ivermectina 1% Injetável (500ml)',          false, null),
  ('racao',        'Ração Bovinos Confinamento 23% (sc 40kg)',  false, null),
  ('suplementos',  'Sal Mineral Bovinos Corte (30kg)',          false, null)
) as v(cat_slug, name, cold_chain, temp_range)
join insumo_category ic on ic.slug = v.cat_slug;

-- insumo_product_tag (tags[]). product via name.
insert into insumo_product_tag (product_id, tag)
select p.id, v.tag
from (values
  ('Vacina Febre Aftosa (100 doses)',          'FMD'),
  ('Vacina Febre Aftosa (100 doses)',          'Obrigatória'),
  ('Vacina Febre Aftosa (100 doses)',          'Refrigerado'),
  ('Ivermectina 1% Injetável (500ml)',         'Antiparasitário'),
  ('Ivermectina 1% Injetável (500ml)',         'Endectocida'),
  ('Ração Bovinos Confinamento 23% (sc 40kg)', 'Alto Proteína'),
  ('Ração Bovinos Confinamento 23% (sc 40kg)', 'Confinamento'),
  ('Sal Mineral Bovinos Corte (30kg)',         'Fase Recria'),
  ('Sal Mineral Bovinos Corte (30kg)',         'Suplementação')
) as v(prod_name, tag)
join insumo_product p on p.name = v.prod_name;

-- supplier (fornecedores distintos do mock; dedup por nome — todos únicos).
insert into supplier (name) values
  ('Boehringer BR'), ('Vetcamp Sul'), ('AgroVet SP'),
  ('Zoetis Distribuidora'), ('MSD Animal Health'), ('CentraVet'),
  ('Purina Agroshop'), ('Guabi Distribuidora'), ('Cargill Feed'),
  ('Tortuga Distribuidora'), ('Provimi BR');

-- supplier_offer (oferta por produto×fornecedor). preco/frete/prazo/rating/estoque.
insert into supplier_offer (product_id, supplier_id, preco, frete, prazo_dias, rating, estoque)
select p.id, s.id, v.preco, v.frete, v.prazo, v.rating, v.estoque
from (values
  ('Vacina Febre Aftosa (100 doses)',          'Boehringer BR',        187.50,  0, 3, 4.9,  500),
  ('Vacina Febre Aftosa (100 doses)',          'Vetcamp Sul',          194.00, 15, 5, 4.7,  200),
  ('Vacina Febre Aftosa (100 doses)',          'AgroVet SP',           201.00,  0, 4, 4.6,  350),
  ('Ivermectina 1% Injetável (500ml)',         'Zoetis Distribuidora',  89.90,  0, 3, 5.0, 1200),
  ('Ivermectina 1% Injetável (500ml)',         'MSD Animal Health',     94.50,  0, 4, 4.8,  800),
  ('Ivermectina 1% Injetável (500ml)',         'CentraVet',             98.00, 18, 6, 4.5,  150),
  ('Ração Bovinos Confinamento 23% (sc 40kg)', 'Purina Agroshop',      142.00, 35, 5, 4.8, 5000),
  ('Ração Bovinos Confinamento 23% (sc 40kg)', 'Guabi Distribuidora',  138.50, 40, 7, 4.6, 3000),
  ('Ração Bovinos Confinamento 23% (sc 40kg)', 'Cargill Feed',         135.00, 50, 8, 4.9, 8000),
  ('Sal Mineral Bovinos Corte (30kg)',         'Tortuga Distribuidora', 98.50, 20, 4, 4.9, 2000),
  ('Sal Mineral Bovinos Corte (30kg)',         'Provimi BR',           102.00, 15, 5, 4.7, 1500)
) as v(prod_name, sup_name, preco, frete, prazo, rating, estoque)
join insumo_product p on p.name = v.prod_name
join supplier s on s.name = v.sup_name;

-- group_buy (COLETIVAS — catálogo/plataforma). qty_current/participants_count são
-- os do mock e serão FIXADOS no fim (11.9) após o trigger da adesão do user 1.
insert into group_buy (category_id, title, unit, qty_meta, qty_current, participants_count, deadline, preco_base, preco_grupo, regiao, status)
select ic.id, v.title, v.unit, v.qty_meta, v.qty_current, v.participants, v.deadline::date, v.preco_base, v.preco_grupo, v.regiao, 'open'::group_buy_status
from (values
  ('vacinas',      'Vacina Febre Aftosa 100d', 'doses',   5000, 3800, 28, '2026-09-05',   2.05,   1.62, 'Triângulo Mineiro/MG'),
  ('racao',        'Ração Confinamento 23%',   'sacos',    800,  610, 14, '2026-09-10', 138.50, 112.00, 'São Paulo Noroeste/SP'),
  ('medicamentos', 'Ivermectina 1% 500ml',     'frascos',  300,  218, 19, '2026-09-15',  94.50,  76.80, 'Sul do Mato Grosso/MT')
) as v(cat_slug, title, unit, qty_meta, qty_current, participants, deadline, preco_base, preco_grupo, regiao)
join insumo_category ic on ic.slug = v.cat_slug;

-- ---- 11.2 INSUMOS · dado privado do user 1 (Rafael) ------------------------
-- farm_stock_item (ESTOQUE). farm_id NULL (Rafael é comprador, sem fazenda).
-- category via slug; product_id NULL (o mock guarda só string do produto).
insert into farm_stock_item (user_id, farm_id, product_id, category_id, name, quantity, unit, min_quantity, lote, validade, local, temperatura, unit_price)
select 1, null, null, ic.id, v.name, v.qtd, v.un, v.min_q, v.lote, v.validade::date, v.local, v.temp, v.preco
from (values
  ('vacinas',      'Vacina Febre Aftosa', 180, 'doses',  200, 'FAF-2026-04', '2026-12-15', 'Câmara Fria A',   4.2,   1.88),
  ('medicamentos', 'Ivermectina 1%',       12, 'frascos', 15, 'IVE-2025-11', '2026-09-30', 'Depósito Central', null, 89.90),
  ('racao',        'Ração Confinamento',   85, 'sacos',    50, 'RAC-2026-08', '2027-02-10', 'Armazém 1',       null, 135.00),
  ('suplementos',  'Sal Mineral',          22, 'sacos',    30, 'SAL-2026-07', '2027-06-30', 'Armazém 2',       null,  98.50),
  ('vacinas',      'Vacina Brucelose',     50, 'doses',   100, 'BRU-2026-03', '2026-09-05', 'Câmara Fria B',    3.8,   2.10)
) as v(cat_slug, name, qtd, un, min_q, lote, validade, local, temp, preco)
join insumo_category ic on ic.slug = v.cat_slug;

-- group_buy_participation: 1 adesão do user 1 (na campanha de aftosa). O trigger
-- bumpa group_buy — corrigido no fim (11.9).
insert into group_buy_participation (group_buy_id, user_id, farm_id, quantity)
select g.id, 1, null, 200
from group_buy g where g.title = 'Vacina Febre Aftosa 100d';

-- price_alert (ALERTAS) do user 1. product_id NULL (nome livre, como no mock).
insert into price_alert (user_id, product_name, target_price, current_price, active, reached) values
  (1, 'Ivermectina 1% 500ml',       85.00,  89.90, true, false),
  (1, 'Ração Confinamento sc 40kg', 132.00, 135.00, true, false),
  (1, 'Vacina Febre Aftosa (d)',     1.75,   1.72, true, true);

-- insumo_purchase (base dos GASTOS_MENSAIS): 1 lançamento por (mês, categoria).
-- Relatório é AGREGADO por query (sum por categoria/mês); não guardamos totais
-- prontos. 'outros' não tem categoria no catálogo -> category_id NULL. user 1.
insert into insumo_purchase (user_id, farm_id, category_id, description, total_amount, purchased_at)
select 1, null, ic.id,
       'Compra de insumos — ' || v.cat_label || ' (' || v.mes || '/2026)',
       v.amount, v.dt::date
from (values
  ('Mar','2026-03-15','vacinas','Vacinas',           3200), ('Mar','2026-03-15','medicamentos','Medicamentos', 1800),
  ('Mar','2026-03-15','racao','Ração',                9500), ('Mar','2026-03-15','suplementos','Suplementos',    2200),
  ('Mar','2026-03-15','outros','Outros',               800),
  ('Abr','2026-04-15','vacinas','Vacinas',           1400), ('Abr','2026-04-15','medicamentos','Medicamentos', 2100),
  ('Abr','2026-04-15','racao','Ração',                9800), ('Abr','2026-04-15','suplementos','Suplementos',    2100),
  ('Abr','2026-04-15','outros','Outros',               650),
  ('Mai','2026-05-15','vacinas','Vacinas',           4800), ('Mai','2026-05-15','medicamentos','Medicamentos', 1500),
  ('Mai','2026-05-15','racao','Ração',               10200), ('Mai','2026-05-15','suplementos','Suplementos',    2300),
  ('Mai','2026-05-15','outros','Outros',               700),
  ('Jun','2026-06-15','vacinas','Vacinas',           1200), ('Jun','2026-06-15','medicamentos','Medicamentos', 2400),
  ('Jun','2026-06-15','racao','Ração',                9600), ('Jun','2026-06-15','suplementos','Suplementos',    2000),
  ('Jun','2026-06-15','outros','Outros',               750),
  ('Jul','2026-07-15','vacinas','Vacinas',           1600), ('Jul','2026-07-15','medicamentos','Medicamentos', 1900),
  ('Jul','2026-07-15','racao','Ração',               10500), ('Jul','2026-07-15','suplementos','Suplementos',    2400),
  ('Jul','2026-07-15','outros','Outros',               850),
  ('Ago','2026-08-15','vacinas','Vacinas',           5890), ('Ago','2026-08-15','medicamentos','Medicamentos', 2200),
  ('Ago','2026-08-15','racao','Ração',               11000), ('Ago','2026-08-15','suplementos','Suplementos',    2500),
  ('Ago','2026-08-15','outros','Outros',               900)
) as v(mes, dt, cat_slug, cat_label, amount)
left join insumo_category ic on ic.slug = v.cat_slug;

-- ---- 11.3 VET · catálogo (vet + filhas de exibição) ------------------------
-- vet (VETS — 4). owner_user_id NULL (admin-curados). reviews_count = mock; será
-- FIXADO no fim (11.9) após o trigger das reviews.
insert into vet (owner_user_id, name, kind, kind_label, verified, city, uf, distance, rating, reviews_count, years_experience, formacao, photo_url, cover_url, price_label, availability, response_time, about)
select null::bigint, v.name, v.kind::vet_kind, v.kind_label, v.verified, v.city, v.uf, v.distance, v.rating, v.reviews_count, v.years, v.formacao, v.foto, v.capa, v.price_label, v.availability::vet_availability, v.resposta, v.about
from (values
  ('Dr. Carlos Mendes', 'vet', 'Verificado', true, 'Rondonópolis', 'MT', 12, 4.9, 127, 15,
   'UFMT — Medicina Veterinária (2011)',
   'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format',
   'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&h=300&fit=crop&auto=format',
   'Consulta R$ 250', 'hoje', 'Responde em ~15min',
   'Médico veterinário com 15 anos de experiência em pecuária de corte e leite. Especialista em vacinação em grande escala, cirurgia de rúmen e reprodução animal. Atendo Rondonópolis e região num raio de 100km, com equipamento próprio para manejo no curral do cliente.'),
  ('VetAgro Clínica — Dr. João Silva', 'clinica', 'Clínica Veterinária', true, 'Rondonópolis', 'MT', 8, 4.7, 89, 12,
   'Clínica com estrutura completa de manejo',
   'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=200&h=200&fit=crop&auto=format',
   'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=600&h=300&fit=crop&auto=format',
   'Consulta R$ 180', 'hoje', 'Aberto agora (24h)',
   'Clínica veterinária com curral para manejo, raio-X e laboratório de exames próprio. Atendimento de emergência 24 horas e equipe multidisciplinar para grandes rebanhos.'),
  ('Téc. Maria Souza', 'tecnico', 'Técnica em Pecuária', true, 'Campo Verde', 'MT', 35, 4.6, 54, 8,
   'Senar — Técnico em Pecuária (2018)',
   'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format',
   'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=300&fit=crop&auto=format',
   'Vacinação R$ 8/cab', 'amanha', 'Responde em ~1h',
   'Técnica em pecuária especializada em vacinação, inseminação e manejo de curral. Atendimento ágil e preço acessível para pequenos e médios produtores da região de Campo Verde.'),
  ('Dra. Ana Paula Costa', 'vet', 'Verificada', true, 'Rondonópolis', 'MT', 18, 5.0, 43, 10,
   'USP — Medicina Veterinária (2015)',
   'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format',
   'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=600&h=300&fit=crop&auto=format',
   'Consulta R$ 300', 'lotado', 'Próxima agenda em 5 dias',
   'Especialista em reprodução animal e ultrassonografia bovina. Credenciada pelo MAPA como inseminadora, com foco em protocolos IATF de alta taxa de prenhez.')
) as v(name, kind, kind_label, verified, city, uf, distance, rating, reviews_count, years, formacao, foto, capa, price_label, availability, resposta, about);

-- vet_specialty (especialidades[]). vet via name.
insert into vet_specialty (vet_id, specialty)
select vt.id, v.specialty
from (values
  ('Dr. Carlos Mendes','Vacinação'), ('Dr. Carlos Mendes','Cirurgia'), ('Dr. Carlos Mendes','Medicina Bovina'),
  ('VetAgro Clínica — Dr. João Silva','Vacinação'), ('VetAgro Clínica — Dr. João Silva','Emergência 24h'), ('VetAgro Clínica — Dr. João Silva','Exames'),
  ('Téc. Maria Souza','Vacinação'), ('Téc. Maria Souza','Inseminação'), ('Téc. Maria Souza','Manejo'),
  ('Dra. Ana Paula Costa','Reprodução'), ('Dra. Ana Paula Costa','Ultrassom'), ('Dra. Ana Paula Costa','IATF')
) as v(vet_name, specialty)
join vet vt on vt.name = v.vet_name;

-- vet_certification (certificacoes). title/institution/year_label/icon/position.
insert into vet_certification (vet_id, position, title, institution, year_label, icon)
select vt.id, v.position, v.title, v.institution, v.year_label, v.icon
from (values
  ('Dr. Carlos Mendes', 0, 'Medicina Veterinária', 'UFMT — Univ. Federal de Mato Grosso', '2011', 'grad'),
  ('Dr. Carlos Mendes', 1, 'Especialização em Medicina Bovina', 'USP — Univ. de São Paulo', '2014', 'trophy'),
  ('Dr. Carlos Mendes', 2, 'Cirurgia de Rúmen', 'ABMV', 'válido até 2028', 'cert'),
  ('Dr. Carlos Mendes', 3, 'MAPA — Inseminador Credenciado', 'Reg. 12345/2015', 'ativo', 'check'),
  ('VetAgro Clínica — Dr. João Silva', 0, 'Registro de Clínica Veterinária', 'CRMV-MT', 'ativo', 'hospital'),
  ('VetAgro Clínica — Dr. João Silva', 1, 'Laboratório credenciado', 'MAPA', '2023', 'lab'),
  ('Téc. Maria Souza', 0, 'Técnico em Pecuária', 'Senar', '2018', 'grad'),
  ('Téc. Maria Souza', 1, 'Curso de Inseminação Artificial', 'Embrapa', '2020', 'cert'),
  ('Dra. Ana Paula Costa', 0, 'Medicina Veterinária', 'USP', '2015', 'grad'),
  ('Dra. Ana Paula Costa', 1, 'Especialista em Reprodução Animal', 'Unesp', '2018', 'trophy'),
  ('Dra. Ana Paula Costa', 2, 'Ultrassom Bovino', 'Certificado técnico', '2019', 'chart'),
  ('Dra. Ana Paula Costa', 3, 'MAPA — Inseminadora Credenciada', 'Reg. 55821/2016', 'ativo', 'check')
) as v(vet_name, position, title, institution, year_label, icon)
join vet vt on vt.name = v.vet_name;

-- vet_service (servicos). price_label=preco; per_head = preco contém '/cabeça';
-- price_amount = número parseado do preço (mesma regra do front). duration_label=dur.
insert into vet_service (vet_id, position, name, price_label, price_amount, per_head, duration_label, icon)
select vt.id, v.position, v.name, v.price_label, v.price_amount, v.per_head, v.duration_label, v.icon
from (values
  ('Dr. Carlos Mendes', 0, 'Vacinação em grande escala', 'R$ 8,00/cabeça',            8.00, true,  '4–6h', 'vacina'),
  ('Dr. Carlos Mendes', 1, 'Cirurgia de rúmen',          'R$ 800,00',               800.00, false, '2–3h', 'cirurgia'),
  ('Dr. Carlos Mendes', 2, 'Inseminação Artificial (IATF)', 'R$ 45,00/cabeça',        45.00, true,  '3–4h', 'iatf'),
  ('Dr. Carlos Mendes', 3, 'Ultrassom gestacional',      'R$ 150,00',               150.00, false, '1h',   'ultrassom'),
  ('Dr. Carlos Mendes', 4, 'Emergência 24h',             'R$ 500,00 + deslocamento', 500.00, false, 'imediato', 'emergencia'),
  ('VetAgro Clínica — Dr. João Silva', 0, 'Consulta clínica',      'R$ 180,00',           180.00, false, '1h',       'consulta'),
  ('VetAgro Clínica — Dr. João Silva', 1, 'Emergência 24h',        'R$ 450,00',           450.00, false, 'imediato', 'emergencia'),
  ('VetAgro Clínica — Dr. João Silva', 2, 'Exames laboratoriais',  'a partir de R$ 90,00', 90.00, false, '24–48h',   'exames'),
  ('VetAgro Clínica — Dr. João Silva', 3, 'Raio-X',                'R$ 220,00',           220.00, false, '30min',    'raiox'),
  ('Téc. Maria Souza', 0, 'Vacinação',              'R$ 8,00/cabeça',   8.00, true,  '4h',  'vacina'),
  ('Téc. Maria Souza', 1, 'Inseminação Artificial', 'R$ 40,00/cabeça', 40.00, true,  '3h',  'iatf'),
  ('Téc. Maria Souza', 2, 'Apoio de manejo',        'R$ 200,00/dia',  200.00, false, 'dia', 'manejo'),
  ('Dra. Ana Paula Costa', 0, 'Consulta reprodutiva',  'R$ 300,00',   300.00, false, '1h',   'consulta'),
  ('Dra. Ana Paula Costa', 1, 'IATF',                  'R$ 45,00/cabeça', 45.00, true, '3–4h', 'iatf'),
  ('Dra. Ana Paula Costa', 2, 'Ultrassom gestacional', 'R$ 150,00',   150.00, false, '1h',   'ultrassom')
) as v(vet_name, position, name, price_label, price_amount, per_head, duration_label, icon)
join vet vt on vt.name = v.vet_name;

-- vet_availability_day (agenda). weekday: Seg=1..Sáb=6, Dom=0 (schema 0=domingo..6=sábado).
insert into vet_availability_day (vet_id, weekday, day_label, status, hours_label)
select vt.id, v.weekday, v.day_label, v.status::agenda_status, v.hours_label
from (values
  ('Dr. Carlos Mendes', 1, 'Seg', 'on',      '08–18h'), ('Dr. Carlos Mendes', 2, 'Ter', 'on',      '08–18h'),
  ('Dr. Carlos Mendes', 3, 'Qua', 'partial', '14–18h'), ('Dr. Carlos Mendes', 4, 'Qui', 'on',      '08–18h'),
  ('Dr. Carlos Mendes', 5, 'Sex', 'on',      '08–18h'), ('Dr. Carlos Mendes', 6, 'Sáb', 'off',     '—'),
  ('Dr. Carlos Mendes', 0, 'Dom', 'partial', 'Emerg.'),
  ('VetAgro Clínica — Dr. João Silva', 1, 'Seg', 'on', '24h'), ('VetAgro Clínica — Dr. João Silva', 2, 'Ter', 'on', '24h'),
  ('VetAgro Clínica — Dr. João Silva', 3, 'Qua', 'on', '24h'), ('VetAgro Clínica — Dr. João Silva', 4, 'Qui', 'on', '24h'),
  ('VetAgro Clínica — Dr. João Silva', 5, 'Sex', 'on', '24h'), ('VetAgro Clínica — Dr. João Silva', 6, 'Sáb', 'on', '24h'),
  ('VetAgro Clínica — Dr. João Silva', 0, 'Dom', 'on', '24h'),
  ('Téc. Maria Souza', 1, 'Seg', 'on',      '07–17h'), ('Téc. Maria Souza', 2, 'Ter', 'on',      '07–17h'),
  ('Téc. Maria Souza', 3, 'Qua', 'on',      '07–17h'), ('Téc. Maria Souza', 4, 'Qui', 'partial', '13–17h'),
  ('Téc. Maria Souza', 5, 'Sex', 'on',      '07–17h'), ('Téc. Maria Souza', 6, 'Sáb', 'partial', 'manhã'),
  ('Téc. Maria Souza', 0, 'Dom', 'off',     '—'),
  ('Dra. Ana Paula Costa', 1, 'Seg', 'off',     '—'), ('Dra. Ana Paula Costa', 2, 'Ter', 'off', '—'),
  ('Dra. Ana Paula Costa', 3, 'Qua', 'off',     '—'), ('Dra. Ana Paula Costa', 4, 'Qui', 'off', '—'),
  ('Dra. Ana Paula Costa', 5, 'Sex', 'partial', 'lista de espera'), ('Dra. Ana Paula Costa', 6, 'Sáb', 'off', '—'),
  ('Dra. Ana Paula Costa', 0, 'Dom', 'off',     '—')
) as v(vet_name, weekday, day_label, status, hours_label)
join vet vt on vt.name = v.vet_name;

-- ---- 11.4 VET · dado privado do user 1 -------------------------------------
-- vet_appointment (1 exemplo): Rafael agenda "Vacinação em grande escala" (por
-- cabeça, R$ 8/cab) com o Dr. Carlos, na fazenda, 100 cabeças, pagamento pix.
--   subtotal = 8,00 × 100 = 800,00 ; travel_fee = 100,00 (deslocamento fazenda) ;
--   pix_discount = 5% × (800+100) = 45,00 ; total (GENERATED) = 855,00 (NÃO inserir).
insert into vet_appointment (user_id, vet_id, service_id, scheduled_at, location, animal_count, payment_method, subtotal, travel_fee, pix_discount, status, notes)
select 1, vt.id, vs.id, timestamptz '2026-09-15 09:00:00-03', 'fazenda'::appointment_location, 100, 'pix'::payment_method,
       800.00, 100.00, 45.00, 'confirmado'::appointment_status, 'Vacinação de aftosa no rebanho — curral próprio.'
from vet vt
join vet_service vs on vs.vet_id = vt.id and vs.position = 0
where vt.name = 'Dr. Carlos Mendes';

-- vet_review (reviews[] do mock; +1 review do próprio Rafael ligada ao seu
-- agendamento). author_user_id=1 só na do Rafael; nas demais NULL (seedadas/admin).
-- CADA insert dispara o trigger que bumpa vet.reviews_count -> corrigido em 11.9.
insert into vet_review (vet_id, author_user_id, appointment_id, author_name, review_date, rating, comment, service_label)
select vt.id, null::bigint, null::bigint, v.author_name, v.review_date::date, v.rating, v.comment, v.service_label
from (values
  ('Dr. Carlos Mendes', 'João Silva — Faz. Boa Vista', '2026-08-15', 5, 'Dr. Carlos salvou meu rebanho! Vacinação rápida e profissional, voltou no dia seguinte para verificar os animais. Recomendo!', 'Vacinação de 500 cabeças'),
  ('Dr. Carlos Mendes', 'Maria Souza — Sítio Esperança', '2026-08-10', 5, 'Fez a IATF no meu rebanho com excelente resultado. 85% de prenhez! Vale cada centavo.', 'Inseminação Artificial'),
  ('Dr. Carlos Mendes', 'Carlos R. — Rancho do Gado', '2026-08-05', 4, 'Bom profissional, serviço bem feito, mas chegou 1h atrasado. Pontualidade pode melhorar.', 'Cirurgia de rúmen'),
  ('VetAgro Clínica — Dr. João Silva', 'Pedro L. — Faz. Três Rios', '2026-08-18', 5, 'Atenderam meu boi de madrugada numa emergência. Estrutura excelente, salvaram o animal.', 'Emergência 24h'),
  ('VetAgro Clínica — Dr. João Silva', 'Ana P. — Sítio Bela Vista', '2026-08-12', 4, 'Exames rápidos e precisos. Recomendo para quem precisa de laboratório.', 'Exames laboratoriais'),
  ('Téc. Maria Souza', 'Roberto F. — Faz. Nova Era', '2026-08-14', 5, 'Preço justo e trabalho caprichado. Vacinou 200 cabeças sem estresse pro gado.', 'Vacinação'),
  ('Dra. Ana Paula Costa', 'Lucas M. — Faz. Horizonte', '2026-08-20', 5, 'Taxa de prenhez impressionante. Profissional extremamente competente e organizada.', 'IATF — 300 matrizes')
) as v(vet_name, author_name, review_date, rating, comment, service_label)
join vet vt on vt.name = v.vet_name;

-- review do próprio Rafael (author_user_id=1), ligada ao seu agendamento (exercita
-- a FK appointment_id e o índice único ux_vet_review_appointment).
insert into vet_review (vet_id, author_user_id, appointment_id, author_name, review_date, rating, comment, service_label)
select ap.vet_id, 1, ap.id, 'Rafael Mendonça', date '2026-09-16', 5,
       'Serviço impecável, vacinação rápida e bem organizada. Rebanho tranquilo o tempo todo. Recomendo!', 'Vacinação em grande escala'
from vet_appointment ap
where ap.user_id = 1
  and ap.vet_id = (select id from vet where name = 'Dr. Carlos Mendes');

-- vet_follow: Rafael segue o Dr. Carlos.
insert into vet_follow (user_id, vet_id)
select 1, id from vet where name = 'Dr. Carlos Mendes';

-- ---- 11.5 USADOS · catálogo + conteúdo do dono -----------------------------
-- used_category (USADOS_CAT).
insert into used_category (slug, label, icon) values
  ('manejo',      'Manejo',      'wrench'),
  ('veiculos',    'Veículos',    'tractor'),
  ('ferramentas', 'Ferramentas', 'gear'),
  ('cercas',      'Cercas',      'bolt'),
  ('veterinario', 'Veterinário', 'stethoscope');

-- used_listing (USADOS — 5). Conteúdo do dono -> só no DEMO. Ancorados a sellers
-- existentes (users 2..6) preservando o seller_name do mock. views fixado em 11.9.
insert into used_listing (seller_user_id, category_id, title, price, condition, city, uf, distance, photo_url, description, views, seller_name, seller_rating, featured)
select v.seller_user_id, uc.id, v.title, v.price, v.condition::used_condition, v.city, v.uf, v.distance, v.photo_url, v.description, v.views, v.seller_name, v.seller_rating, v.featured
from (values
  (2, 'manejo',      'Tronco de Contenção Bovino — metálico', 4800, 'bom',   'Barretos',      'SP',  92, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop&auto=format', 'Tronco de contenção metálico galvanizado, suporta até 600kg. Usado por 2 anos, em ótimo estado de conservação. Acompanha gancho e peias.', 148, 'Fazenda Santa Helena', 4.9, true),
  (3, 'ferramentas', 'Pulverizador Costal 20L — Guarany',      320, 'otimo', 'Uberaba',       'MG', 210, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&auto=format', 'Pulverizador costal 20 litros, pouco uso. Acessórios completos, mangueira em perfeito estado.', 63, 'Paulo Saraiva', 4.7, false),
  (4, 'manejo',      'Balança Eletrônica Bovina 2000kg',      9200, 'bom',   'Rondonópolis',  'MT', 890, 'https://images.unsplash.com/photo-1559523161-0fc0d8b814b6?w=400&h=300&fit=crop&auto=format', 'Balança eletrônica com display digital, capacidade 2.000kg. Revisada em 2025. Acompanha brete de contenção.', 201, 'Agrovil Equipamentos', 4.8, true),
  (5, 'cercas',      'Conjunto de Cerca Elétrica — 3km',      1850, 'bom',   'Campo Grande',  'MS', 580, 'https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=300&fit=crop&auto=format', '3km de fio liso + eletrificador rural 3J. Completo e funcional. Retirada local preferida.', 37, 'Marco Antônio F.', 5.0, false),
  (6, 'veterinario','Kit Veterinário Completo — seringa dosadora', 680, 'otimo', 'Ponta Grossa', 'PR', 440, 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=400&h=300&fit=crop&auto=format', 'Kit com seringa dosadora 10ml, aplicador de crotálias, descornador e faca cirúrgica. Tudo esterilizado.', 85, 'Dr. Leandro Vet', 4.9, false)
) as v(seller_user_id, cat_slug, title, price, condition, city, uf, distance, photo_url, description, views, seller_name, seller_rating, featured)
join used_category uc on uc.slug = v.cat_slug;

-- used_saved: Rafael salva 1 anúncio (o tronco). used_contact: registra 1 contato
-- (a balança). Ambos DADO PRIVADO do user 1.
insert into used_saved (user_id, listing_id)
select 1, id from used_listing where title = 'Tronco de Contenção Bovino — metálico';

insert into used_contact (user_id, listing_id, message)
select 1, id, 'Tenho interesse na balança. Ainda disponível? Consigo retirar em Rondonópolis.'
from used_listing where title = 'Balança Eletrônica Bovina 2000kg';

-- ---- 11.6 VÍDEOS · catálogo + engajamento do user 1 ------------------------
-- video_category (VET_CATS menos 'todos').
insert into video_category (slug, label, icon) values
  ('vacinacao',  'Vacinação',  'syringe'),
  ('reproducao', 'Reprodução', 'cow'),
  ('manejo',     'Manejo',     'wrench'),
  ('nutricao',   'Nutrição',   'grain'),
  ('cirurgia',   'Cirurgia',   'scissors');

-- vet_video (VET_VIDEOS — 5). vet_id NULL (autores do mock não estão no catálogo
-- de vets). likes_count/saves_count/views = mock; fixados em 11.9.
insert into vet_video (category_id, vet_id, author_name, author_credential, title, description, thumb_url, duration_label, views, likes_count, saves_count, featured)
select vc.id, null::bigint, v.author_name, v.author_credential, v.title, v.description, v.thumb_url, v.duration_label, v.views, v.likes_count, v.saves_count, v.featured
from (values
  ('vacinacao',  'Dr. Fernando Melo', 'CRMV-SP 12458', 'Vacinação contra Febre Aftosa — passo a passo completo', 'Tutorial completo de como realizar a vacinação corretamente, evitando desperdício e garantindo imunidade.', 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=280&fit=crop&auto=format', '14:32', 48200, 3840, 1200, true),
  ('reproducao', 'Dra. Ana Cristina', 'CRMV-MG 8834', 'Diagnóstico de gestação por ultrassom em bovinos', 'Como identificar fêmeas prenhas com precisão. Técnicas de ultrassonografia para bovinos.', 'https://images.unsplash.com/photo-1559523161-0fc0d8b814b6?w=400&h=280&fit=crop&auto=format', '22:15', 31500, 2100, 890, false),
  ('manejo',     'Dr. Roberto Nunes', 'CRMV-MT 5521', 'Manejo correto no tronco de contenção — sem estresse animal', 'Técnicas de bem-estar animal no manejo. Reduz estresse e aumenta produtividade.', 'https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=280&fit=crop&auto=format', '08:44', 19700, 1580, 620, false),
  ('nutricao',   'Dr. Sandro Lima', 'CRMV-GO 9942', 'Suplementação mineral para bovinos em pasto — quando e como', 'Qual sal mineral escolher, dosagem correta e como monitorar o consumo do rebanho.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=280&fit=crop&auto=format', '18:08', 28900, 2340, 950, true),
  ('vacinacao',  'Dra. Paula Costa', 'CRMV-PR 7710', 'Aplicação de ivermectina — via ideal e dosagem correta', 'Subcutânea ou pour-on? Quando usar cada via e como calcular a dose pelo peso do animal.', 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=400&h=280&fit=crop&auto=format', '11:20', 41300, 3120, 1450, false)
) as v(cat_slug, author_name, author_credential, title, description, thumb_url, duration_label, views, likes_count, saves_count, featured)
join video_category vc on vc.slug = v.cat_slug;

-- video_like / video_save do user 1 (disparam triggers de likes_count/saves_count
-- -> corrigidos em 11.9).
insert into video_like (user_id, video_id)
select 1, id from vet_video where title = 'Vacinação contra Febre Aftosa — passo a passo completo';

insert into video_save (user_id, video_id)
select 1, id from vet_video where title = 'Suplementação mineral para bovinos em pasto — quando e como';

-- ---- 11.9 CONTADORES AUTORITATIVOS (rodar DEPOIS de todas as filhas) --------
--  Os triggers SECURITY DEFINER (022) já bumparam group_buy/vet/vet_video pelas
--  poucas filhas do user 1. Aqui FIXAMOS os contadores nos valores do mock
--  (que representam MUITOS usuários) / na contagem real, tornando o seed a
--  fonte-da-verdade e idempotente independentemente do efeito dos triggers.
update group_buy g set qty_current = v.qc, participants_count = v.pc
from (values
  ('Vacina Febre Aftosa 100d', 3800, 28),
  ('Ração Confinamento 23%',    610, 14),
  ('Ivermectina 1% 500ml',      218, 19)
) as v(title, qc, pc)
where g.title = v.title;

update vet vt set reviews_count = v.rc
from (values
  ('Dr. Carlos Mendes', 127),
  ('VetAgro Clínica — Dr. João Silva', 89),
  ('Téc. Maria Souza', 54),
  ('Dra. Ana Paula Costa', 43)
) as v(name, rc)
where vt.name = v.name;

update vet_video vv set likes_count = v.lk, saves_count = v.sv, views = v.vw
from (values
  ('Vacinação contra Febre Aftosa — passo a passo completo', 3840, 1200, 48200),
  ('Diagnóstico de gestação por ultrassom em bovinos',        2100,  890, 31500),
  ('Manejo correto no tronco de contenção — sem estresse animal', 1580, 620, 19700),
  ('Suplementação mineral para bovinos em pasto — quando e como', 2340, 950, 28900),
  ('Aplicação de ivermectina — via ideal e dosagem correta',  3120, 1450, 41300)
) as v(title, lk, sv, vw)
where vv.title = v.title;

update used_listing u set views = v.vw
from (values
  ('Tronco de Contenção Bovino — metálico', 148),
  ('Pulverizador Costal 20L — Guarany',      63),
  ('Balança Eletrônica Bovina 2000kg',      201),
  ('Conjunto de Cerca Elétrica — 3km',       37),
  ('Kit Veterinário Completo — seringa dosadora', 85)
) as v(title, vw)
where u.title = v.title;

-- insumo_category.product_count = contagem REAL de insumo_product por categoria
-- (não o count do mock, que é do catálogo cheio). Deixa 04_business_invariants
-- (c) verde e é a única fonte-da-verdade do contador.
update insumo_category c
   set product_count = (select count(*) from insumo_product p where p.category_id = c.id);


-- ============================================================================
--  12. RESSINCRONIZAÇÃO DE SEQUENCES
-- ----------------------------------------------------------------------------
--  Inserimos ids explícitos com OVERRIDING SYSTEM VALUE nestas tabelas; isso NÃO
--  avança a sequence de identity. Sem este setval, o próximo INSERT sem id
--  tentaria id=1 e colidiria. As demais tabelas (ids auto) já estão em sincronia.
--  As 26 tabelas da SEÇÃO 15 NÃO forçam id (tudo resolvido por chave natural),
--  então NÃO precisam de setval — suas sequences já avançaram com os inserts.
-- ============================================================================
select setval(pg_get_serial_sequence('users', 'id'),              (select max(id) from users));
select setval(pg_get_serial_sequence('farms', 'id'),              (select max(id) from farms));
select setval(pg_get_serial_sequence('lots', 'id'),               (select max(id) from lots));
select setval(pg_get_serial_sequence('opportunities', 'id'),      (select max(id) from opportunities));
select setval(pg_get_serial_sequence('radars', 'id'),             (select max(id) from radars));
select setval(pg_get_serial_sequence('match_searches', 'id'),     (select max(id) from match_searches));
select setval(pg_get_serial_sequence('proposals', 'id'),          (select max(id) from proposals));
select setval(pg_get_serial_sequence('transactions', 'id'),       (select max(id) from transactions));
select setval(pg_get_serial_sequence('transporters', 'id'),       (select max(id) from transporters));
select setval(pg_get_serial_sequence('courses', 'id'),            (select max(id) from courses));
select setval(pg_get_serial_sequence('lessons', 'id'),            (select max(id) from lessons));
select setval(pg_get_serial_sequence('simulations', 'id'),        (select max(id) from simulations));
select setval(pg_get_serial_sequence('notifications', 'id'),      (select max(id) from notifications));
select setval(pg_get_serial_sequence('subscription_plans', 'id'), (select max(id) from subscription_plans));
select setval(pg_get_serial_sequence('services', 'id'),           (select max(id) from services));

commit;

-- FIM do seed.sql
