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
  subscription_plans, subscriptions, lot_boosts, services, platform_settings
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
--  5. RESSINCRONIZAÇÃO DE SEQUENCES
-- ----------------------------------------------------------------------------
--  Inserimos ids explícitos com OVERRIDING SYSTEM VALUE nestas tabelas de
--  plataforma; isso NÃO avança a sequence de identity. Sem este setval, o
--  próximo INSERT sem id tentaria id=1 e colidiria. As demais tabelas de
--  plataforma (ids auto: cattle_category, breed, purpose, course_category,
--  market_prices, market_price_points, lesson_sections, lesson_key_concepts,
--  lesson_quiz_questions, lesson_quiz_options) já ficam em sincronia.
-- ============================================================================
select setval(pg_get_serial_sequence('courses', 'id'),            (select max(id) from courses));
select setval(pg_get_serial_sequence('lessons', 'id'),            (select max(id) from lessons));
select setval(pg_get_serial_sequence('subscription_plans', 'id'), (select max(id) from subscription_plans));
select setval(pg_get_serial_sequence('services', 'id'),           (select max(id) from services));

commit;

-- FIM do seed-platform.sql
