-- ============================================================================
--  BTA — Bovinos Trade Agro
--  seed-platform.sql — Seed de PRODUÇÃO (dados da plataforma; banco de USUÁRIO vazio)
-- ----------------------------------------------------------------------------
--  Ordem de aplicação: migrations 001..014  ->  dba_hardening.sql  ->  ESTE arquivo.
--
--  Objetivo: deixar a plataforma pronta para o lançamento com TODAS as tabelas de
--  catálogo/configuração populadas (categorias, raças, finalidades, mercado,
--  academy, planos, serviços, settings), porém SEM nenhum dado fictício de
--  usuário. É o seed que roda por padrão em `npm run db:setup`.
--
--  DIFERENÇA para o seed.sql (demo/cheio):
--    * seed.sql          => PLATAFORMA + dados fictícios de usuário (dev/CI/demonstração).
--    * seed-platform.sql => APENAS PLATAFORMA (produção; usuário nasce vazio).
--  Tabelas de USUÁRIO/DEMO (users, farms, lots, opportunities, radars, proposals,
--  transactions, transporters, simulations, notifications, favorites, follows,
--  subscriptions, lot_boosts, progressos etc.) NÃO recebem nenhuma linha aqui.
--
--  DECISÕES / FATOS RESPEITADOS (iguais ao seed.sql, na parte de plataforma):
--    * PKs são GENERATED ALWAYS AS IDENTITY. Onde o frontend depende do id do
--      mock (courses/lessons 1..10, subscription_plans, services), inserimos com
--      OVERRIDING SYSTEM VALUE e, ao final, RESSINCRONIZAMOS as sequences (setval).
--    * FKs (category/breed/purpose/course_category) são resolvidas por NOME nas
--      seções seguintes — por isso as dimensões de referência vêm primeiro.
--    * RLS: o dba_hardening habilitou RLS SEM force. Este seed roda como OWNER
--      das tabelas (ou bta_admin/superuser) => NÃO é filtrado por RLS. Rode como
--      dono das tabelas; NÃO rode como um login membro de bta_app.
--
--  IDEMPOTÊNCIA: começa com TRUNCATE ... RESTART IDENTITY CASCADE de todas as
--  tabelas populadas (mesma lista do seed.sql) e só reinsere as de PLATAFORMA.
--  Efeito: pode reexecutar à vontade e o resultado é sempre "plataforma cheia,
--  usuário vazio" — inclusive se antes tivesse sido aplicado o seed demo, este
--  seed zera as tabelas de usuário. (TRUNCATE exige ser o dono / ter privilégio
--  de TRUNCATE; é usado para provisionar um banco de produção do zero.)
--
--  SEM SEGREDOS REAIS: nenhum dado pessoal. Apenas catálogo e configuração.
-- ============================================================================

begin;
set local client_min_messages = warning;

-- ---------------------------------------------------------------------------
--  0. LIMPEZA (idempotência). CASCADE cobre quaisquer dependentes.
--     Lista idêntica ao seed.sql: truncamos tudo (plataforma + usuário) para
--     evitar restrição de FK do TRUNCATE e garantir que as tabelas de usuário
--     fiquem VAZIAS. Abaixo só reinserimos as tabelas de PLATAFORMA.
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
  -- SEÇÃO 15 (novos domínios). Truncamos as 26 tabelas novas; abaixo só o
  -- CATÁLOGO é reinserido (as de dado privado/conteúdo do dono nascem VAZIAS).
  insumo_category, insumo_product, insumo_product_tag, supplier, supplier_offer,
  farm_stock_item, group_buy, group_buy_participation, price_alert, insumo_purchase,
  vet, vet_specialty, vet_certification, vet_service, vet_availability_day,
  vet_appointment, vet_review,
  used_category, used_listing, used_saved, used_contact,
  video_category, vet_video, video_like, video_save, vet_follow
restart identity cascade;


-- ============================================================================
--  1. DIMENSÕES DE REFERÊNCIA (populadas primeiro; market/courses referenciam
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
--  2. MERCADO
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
--  3. APRENDIZADO (BTA Academy)
--  courses (10) e lessons (10, 1:1 com o curso no mock => lesson.id = course.id).
--  IMPORTANTE: sem user_course_progress / user_lesson_progress (são de usuário).
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


-- ============================================================================
--  4. MONETIZAÇÃO, SERVIÇOS E CONFIGURAÇÃO (catálogo de plataforma)
--  Sem subscriptions / lot_boosts (são de usuário).
-- ============================================================================
insert into subscription_plans (id, code, name, price, description)
overriding system value
values
  (1, 'free', 'Gratuito', 0, 'Plano gratuito: acesso à vitrine, busca e mercado.'),
  (2, 'pro', 'BTA PRO', 79.00, 'Assinatura PRO: radar ilimitado, destaque de anúncios e simulador avançado.'),
  (3, 'enterprise', 'Empresa', 0, 'Plano corporativo sob consulta: volume, API e gestão multiusuário.');

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
--  5. NOVOS DOMÍNIOS (SEÇÃO 15) — SÓ CATÁLOGO
-- ----------------------------------------------------------------------------
--  PRODUÇÃO: só o CATÁLOGO PÚBLICO das 4 áreas novas (categorias, produtos/
--  ofertas de insumo, campanhas de compra coletiva, categorias de usados/vídeos,
--  vídeos e o diretório de vets + filhas de exibição). As tabelas de DADO PRIVADO
--  do usuário e de CONTEÚDO DO DONO (estoque, participação, alertas, compras,
--  agendamentos, reviews, ANÚNCIOS DE USADOS, salvos/contato, likes/saves/follows)
--  nascem VAZIAS — igual ao feed de lots. Vets seedados têm owner_user_id = NULL
--  (admin-curados). FKs resolvidas por chave natural; nenhum id forçado.
--
--  Contadores: como NÃO há filhas (participação/review/like/save), os triggers
--  não disparam e os contadores ficam nos valores inseridos (mock). Só o
--  product_count é fixado explicitamente pela contagem real de insumo_product.
-- ============================================================================

-- insumo_category (product_count fixado no fim desta seção).
insert into insumo_category (slug, label, color, icon) values
  ('vacinas',      'Vacinas',      '#1565C0', 'syringe'),
  ('medicamentos', 'Medicamentos', '#6A1B9A', 'pill'),
  ('racao',        'Ração',        '#795548', 'grain'),
  ('suplementos',  'Suplementos',  '#E65100', 'flask'),
  ('equipamentos', 'Equipamentos', '#123B2A', 'wrench'),
  ('defensivos',   'Defensivos',   '#C94A45', 'shield');

insert into insumo_product (category_id, name, cold_chain, temp_range)
select ic.id, v.name, v.cold_chain, v.temp_range
from (values
  ('vacinas',      'Vacina Febre Aftosa (100 doses)',           true,  '2°C–8°C'),
  ('medicamentos', 'Ivermectina 1% Injetável (500ml)',          false, null),
  ('racao',        'Ração Bovinos Confinamento 23% (sc 40kg)',  false, null),
  ('suplementos',  'Sal Mineral Bovinos Corte (30kg)',          false, null)
) as v(cat_slug, name, cold_chain, temp_range)
join insumo_category ic on ic.slug = v.cat_slug;

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

insert into supplier (name) values
  ('Boehringer BR'), ('Vetcamp Sul'), ('AgroVet SP'),
  ('Zoetis Distribuidora'), ('MSD Animal Health'), ('CentraVet'),
  ('Purina Agroshop'), ('Guabi Distribuidora'), ('Cargill Feed'),
  ('Tortuga Distribuidora'), ('Provimi BR');

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

insert into group_buy (category_id, title, unit, qty_meta, qty_current, participants_count, deadline, preco_base, preco_grupo, regiao, status)
select ic.id, v.title, v.unit, v.qty_meta, v.qty_current, v.participants, v.deadline::date, v.preco_base, v.preco_grupo, v.regiao, 'open'::group_buy_status
from (values
  ('vacinas',      'Vacina Febre Aftosa 100d', 'doses',   5000, 3800, 28, '2026-09-05',   2.05,   1.62, 'Triângulo Mineiro/MG'),
  ('racao',        'Ração Confinamento 23%',   'sacos',    800,  610, 14, '2026-09-10', 138.50, 112.00, 'São Paulo Noroeste/SP'),
  ('medicamentos', 'Ivermectina 1% 500ml',     'frascos',  300,  218, 19, '2026-09-15',  94.50,  76.80, 'Sul do Mato Grosso/MT')
) as v(cat_slug, title, unit, qty_meta, qty_current, participants, deadline, preco_base, preco_grupo, regiao)
join insumo_category ic on ic.slug = v.cat_slug;

-- used_category / video_category (categorias de exibição). used_listing NÃO é
-- semeado (conteúdo do dono -> feed nasce vazio, correto p/ produção).
insert into used_category (slug, label, icon) values
  ('manejo',      'Manejo',      'wrench'),
  ('veiculos',    'Veículos',    'tractor'),
  ('ferramentas', 'Ferramentas', 'gear'),
  ('cercas',      'Cercas',      'bolt'),
  ('veterinario', 'Veterinário', 'stethoscope');

insert into video_category (slug, label, icon) values
  ('vacinacao',  'Vacinação',  'syringe'),
  ('reproducao', 'Reprodução', 'cow'),
  ('manejo',     'Manejo',     'wrench'),
  ('nutricao',   'Nutrição',   'grain'),
  ('cirurgia',   'Cirurgia',   'scissors');

-- vet_video (catálogo). vet_id NULL. Sem likes/saves de usuário (nascem no mock).
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

-- vet (diretório) + filhas de exibição. owner_user_id NULL (admin-curados).
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

insert into vet_specialty (vet_id, specialty)
select vt.id, v.specialty
from (values
  ('Dr. Carlos Mendes','Vacinação'), ('Dr. Carlos Mendes','Cirurgia'), ('Dr. Carlos Mendes','Medicina Bovina'),
  ('VetAgro Clínica — Dr. João Silva','Vacinação'), ('VetAgro Clínica — Dr. João Silva','Emergência 24h'), ('VetAgro Clínica — Dr. João Silva','Exames'),
  ('Téc. Maria Souza','Vacinação'), ('Téc. Maria Souza','Inseminação'), ('Téc. Maria Souza','Manejo'),
  ('Dra. Ana Paula Costa','Reprodução'), ('Dra. Ana Paula Costa','Ultrassom'), ('Dra. Ana Paula Costa','IATF')
) as v(vet_name, specialty)
join vet vt on vt.name = v.vet_name;

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

-- product_count = contagem real de insumo_product por categoria (autoritativo).
update insumo_category c
   set product_count = (select count(*) from insumo_product p where p.category_id = c.id);


-- ============================================================================
--  6. RESSINCRONIZAÇÃO DE SEQUENCES
-- ----------------------------------------------------------------------------
--  Inserimos ids explícitos com OVERRIDING SYSTEM VALUE nestas tabelas de
--  plataforma; isso NÃO avança a sequence de identity. Sem este setval, o
--  próximo INSERT sem id tentaria id=1 e colidiria. As demais tabelas de
--  plataforma (ids auto: cattle_category, breed, purpose, course_category,
--  market_prices, market_price_points, lesson_sections, lesson_key_concepts,
--  lesson_quiz_questions, lesson_quiz_options) já ficam em sincronia. As tabelas
--  da SEÇÃO 15 (catálogo acima) também usam id auto -> já em sincronia.
-- ============================================================================
select setval(pg_get_serial_sequence('courses', 'id'),            (select max(id) from courses));
select setval(pg_get_serial_sequence('lessons', 'id'),            (select max(id) from lessons));
select setval(pg_get_serial_sequence('subscription_plans', 'id'), (select max(id) from subscription_plans));
select setval(pg_get_serial_sequence('services', 'id'),           (select max(id) from services));

commit;

-- FIM do seed-platform.sql
