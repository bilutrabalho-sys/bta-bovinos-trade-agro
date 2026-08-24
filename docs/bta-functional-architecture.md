BTA — ARQUITETURA FUNCIONAL + FLUXOS + ESTRATÉGIA DE PRODUTO

OBJETIVO

Utilizar este documento como uma camada funcional sobre o Design System e o protótipo visual já criado para o BTA.

Não alterar a identidade visual, paleta, tipografia ou Design System definidos anteriormente.

Este documento define:

- quais telas existem;
- por que cada tela existe;
- quais problemas resolve;
- quais informações apresenta;
- quais botões possui;
- para onde cada botão leva;
- como os módulos se conectam;
- como o usuário percorre o aplicativo;
- como o produto gera valor;
- como a arquitetura pode evoluir futuramente.

Nesta etapa, tudo deve continuar funcionando com dados fictícios/mockados.

Não implementar backend real.

---

1. PRINCÍPIO CENTRAL

O BTA não deve funcionar como um simples catálogo de animais.

O produto deve conduzir o usuário pela jornada:

APRENDER → PLANEJAR → ENCONTRAR → ANALISAR → NEGOCIAR → OPERAR → GERENCIAR → VOLTAR

Cada tela deve existir para resolver uma etapa dessa jornada.

---

2. PERFIS

O sistema deve funcionar para quatro perfis:

VISITANTE

Pode:

- explorar;
- consultar mercado;
- visualizar lotes;
- aprender;
- usar algumas ferramentas.

COMPRADOR

Pode:

- criar busca;
- utilizar Match;
- criar Radar;
- salvar lotes;
- fazer propostas;
- acompanhar compras.

VENDEDOR

Pode:

- cadastrar lotes;
- publicar;
- receber propostas;
- negociar;
- acompanhar vendas.

EMPREENDEDOR

Pode:

- simular negócios;
- acompanhar custos;
- acompanhar margem;
- estudar;
- gerenciar operações.

O usuário pode começar como visitante e posteriormente completar seu perfil.

---

3. NAVEGAÇÃO PRINCIPAL

MOBILE

Bottom navigation:

1. Início
2. Mercado
3. Aprender
4. Negócios
5. Perfil

DESKTOP

Sidebar com:

Início

Mercado

Comprar

Vender

BTA Match

BTA Radar

Mercado/Preços

Simulador

Academy

BTA IA

Negócios

Logística

Perfil

---

4. FLUXO PRINCIPAL DO PRODUTO

O fluxo mais importante deve ser:

HOME
 ↓
O QUE VOCÊ PROCURA?
 ↓
COMPRAR
 ↓
FILTROS
 ↓
RESULTADOS
 ↓
DETALHE DO LOTE
 ↓
BTA CHECK
 ↓
SIMULADOR
 ↓
FAZER PROPOSTA
 ↓
NEGOCIAÇÃO
 ↓
NEGÓCIO FECHADO
 ↓
LOGÍSTICA
 ↓
MEUS NEGÓCIOS

Esse fluxo deve ser totalmente navegável no protótipo.

---

5. HOME

Objetivo

Ser o centro de comando do aplicativo.

Elementos

Header:

Bom dia, Rafael

Localização:

São José do Rio Preto, SP

Pergunta:

O que você quer fazer hoje?

Atalhos:

Comprar gado
Vai para Comprar.

Vender gado
Vai para Vender.

Simular negócio
Vai para Simulador.

Aprender
Vai para Academy.

Depois:

Mercado hoje
Mostrar preços.

Depois:

Oportunidades para você
Mostrar lotes.

Depois:

Seu Radar
Mostrar alertas.

Depois:

Continue aprendendo
Mostrar conteúdo.

Botões

Comprar gado
→ Comprar

Vender gado
→ Vender

Ver mercado
→ Mercado

Ver oportunidades
→ Oportunidades

Ver todos
→ lista correspondente.

---

6. MERCADO

Objetivo

Ser o painel de preços e movimentação do mercado.

Mostrar:

- boi;
- vaca;
- novilha;
- bezerro;
- garrote;
- outras categorias futuras.

Cada card:

Preço/@

Variação

Região

Período

Botões

Ver detalhes
→ Mercado detalhado.

Comparar regiões
→ Comparador.

Criar alerta
→ Radar.

---

7. MERCADO DETALHADO

Mostrar gráfico.

Filtros:

Hoje

7 dias

30 dias

90 dias

Região.

Categoria.

Mostrar:

Preço médio.

Maior preço.

Menor preço.

Variação.

Botões

Criar alerta de preço
→ Radar.

Ver lotes
→ Comprar.

Aprender sobre esse indicador
→ Academy.

---

8. COMPRAR

Objetivo

Transformar uma necessidade em uma busca estruturada.

Título:

O que você procura?

Campos:

Categoria.

Raça.

Quantidade.

Peso.

Idade.

Preço máximo.

Localização.

Distância.

Finalidade.

Botão principal

Encontrar oportunidades

→ Resultados.

Botão secundário

Não sei o que comprar

→ BTA Caminho.

---

9. RESULTADOS

Mostrar:

Lista de lotes.

Cada lote apresenta:

Foto.

Quantidade.

Raça.

Peso.

Preço.

Distância.

Frete estimado.

Custo efetivo.

BTA Score.

BTA Verified.

Ações

Ver lote
→ Detalhes.

Salvar
→ Favoritos.

Comparar
→ Comparador.

Compartilhar
→ Compartilhamento.

---

10. COMPARADOR DE LOTES

CRIAR ESTA TELA.

Ela é recomendada porque resolve uma dor real:

"Qual desses negócios é melhor?"

Permitir selecionar até 3 lotes.

Comparar:

Preço/@

Peso.

Quantidade.

Distância.

Frete.

Custo total.

Custo/@.

BTA Score.

Vendedor.

Botão

Analisar com BTA IA

→ IA explica as diferenças.

---

11. DETALHES DO LOTE

Mostrar:

Galeria.

Vídeo.

Informações.

Preço.

Peso.

Quantidade.

Localização.

Vendedor.

Frete.

Custo efetivo.

BTA Score.

Botões principais

Fazer proposta
→ Negociação.

Simular compra
→ Simulador pré-preenchido.

Verificar lote
→ BTA Check.

Salvar
→ Favoritos.

Compartilhar
→ Compartilhamento.

---

12. BTA CHECK

Objetivo

Reduzir risco antes da negociação.

Mostrar checklist:

Vendedor.

Documentação.

Origem.

Características do lote.

Informações fornecidas.

Transporte.

Condições comerciais.

Estados

OK.

VERIFICAR.

ATENÇÃO.

Botão

Continuar negociação
→ Proposta.

Botão

Voltar ao lote
→ Detalhes.

---

13. SIMULADOR

O simulador pode receber dados automaticamente do lote selecionado.

Exemplo:

Preço de compra:

preenchido automaticamente.

Quantidade:

preenchida.

Peso:

preenchido.

Frete:

estimado.

Usuário informa:

Alimentação.

Custos adicionais.

Tempo.

Preço de venda esperado.

Resultado

Investimento.

Custo total.

Receita.

Margem.

Custo/@.

Ponto de equilíbrio.

Cenários

Pessimista.

Base.

Otimista.

Botões

Salvar simulação
→ Negócios.

Comparar cenário
→ Comparador.

Fazer proposta
→ Negociação.

Aprender como funciona
→ Academy.

---

14. BTA IA

A IA deve funcionar como camada transversal do produto.

Não deve existir apenas como uma tela isolada.

Ela deve aparecer em:

Lote.

Simulador.

Mercado.

Academy.

Negócios.

Exemplos:

"Explique este preço."

"Esse custo está alto?"

"Compare estes lotes."

"O que devo analisar antes de comprar?"

"Explique este indicador."

Tela principal

Pergunta:

Como posso ajudar no seu negócio?

Sugestões:

Tenho R$ 100 mil. Como começo?

Quero comprar 100 bezerros.

Como calculo minha margem?

O que é arroba?

Como analisar esse lote?

---

15. BTA MATCH

Objetivo

Conectar oferta e demanda.

O comprador cria:

Necessidade.

Quantidade.

Categoria.

Raça.

Peso.

Região.

Preço.

Finalidade.

O sistema gera:

96% compatível.

94% compatível.

91% compatível.

Botões

Ver lote
→ Detalhes.

Salvar
→ Favoritos.

Criar Radar
→ Radar.

---

16. BTA RADAR

Objetivo

Fazer o aplicativo trabalhar mesmo quando o usuário não está procurando.

Exemplo:

"Quero ser avisado quando aparecer Nelore até R$ 320/@ em até 200 km."

Botões

Criar radar

Editar radar

Pausar radar

Excluir radar

Ao encontrar oportunidade:

Ver oportunidade
→ Detalhes.

---

17. OPORTUNIDADES

Feed inteligente.

Cada oportunidade deve explicar:

Por que estou vendo isso?

Exemplo:

Preço abaixo da média regional.

Distância pequena.

Compatibilidade alta.

Vendedor verificado.

Botões

Ver oportunidade
→ Lote.

Comparar
→ Comparador.

Ignorar
→ remove da recomendação.

---

18. VENDER

Título:

Venda seu gado

Mostrar:

Anúncios ativos.

Propostas.

Visualizações.

Favoritos.

Interesses.

Vendas.

Botões

Cadastrar lote
→ Criar anúncio.

Ver propostas
→ Negociação.

Ver desempenho
→ Analytics do vendedor.

---

19. CRIAR LOTE

Fluxo:

01 Fotos

02 Vídeo

03 Características

04 Peso

05 Quantidade

06 Localização

07 Preço

08 Condições

09 Revisão

10 Publicação

Botões

Continuar

Voltar

Salvar rascunho

Publicar

---

20. PREVIEW DO ANÚNCIO

Mostrar exatamente como o comprador verá o lote.

Botões

Editar

Publicar

Voltar

---

21. NEGOCIAÇÃO

Criar chat comercial.

Mostrar:

Lote.

Preço.

Quantidade.

Proposta.

Contraproposta.

Histórico.

Botões

Fazer proposta

Aceitar

Contraproposta

Recusar

Encerrar negociação

---

22. NEGÓCIO FECHADO

Criar uma tela de confirmação.

Mostrar:

Lote.

Comprador.

Vendedor.

Quantidade.

Valor.

Data.

Status.

Próximas etapas

1. Negócio confirmado.
2. Documentação.
3. Transporte.
4. Entrega.
5. Conclusão.

Botão

Organizar transporte
→ BTA Log.

---

23. BTA LOG

Objetivo

Resolver a logística depois da negociação.

Mostrar:

Origem.

Destino.

Distância.

Frete estimado.

Transportadores.

Capacidade.

Avaliação.

Status.

Botão

Solicitar transporte

→ contratação simulada.

---

24. BTA NEGÓCIOS

Dashboard.

Mostrar:

Negociações.

Compras.

Vendas.

Investimentos.

Custos.

Receita.

Margem.

Resultado.

Filtros

Mês.

Trimestre.

Ano.

Botões

Ver compra

Ver venda

Nova simulação

---

25. BTA ACADEMY

Objetivo

Permitir que qualquer pessoa aprenda sobre pecuária.

Categorias:

Fundamentos.

Compra.

Venda.

Recria.

Engorda.

Confinamento.

Mercado.

Gestão.

Finanças.

Genética.

Cada conteúdo

Título.

Nível.

Duração.

Progresso.

Botão

Começar aula

→ Aula.

---

26. AULA

Mostrar:

Vídeo placeholder.

Texto.

Exemplos.

Glossário.

Quiz simples.

Botões

Próxima aula

Salvar

Perguntar à BTA IA

---

27. BTA CAMINHO

Objetivo

Criar uma jornada para quem está começando.

Perguntas:

Quanto possui para investir?

Possui terra?

Qual objetivo?

Quanto conhece de pecuária?

Quanto tempo possui?

Resultado

Perfil:

Iniciante — Recria

Criar uma sequência:

1. Aprender.
2. Simular.
3. Comparar.
4. Analisar.
5. Encontrar.
6. Negociar.

---

28. PERFIL DA FAZENDA

Mostrar:

Nome.

Localização.

BTA Verified.

Histórico.

Avaliações.

Lotes.

Quantidade de negócios.

Taxa de conclusão.

Tempo médio de resposta.

Botões

Ver lotes

Seguir

Entrar em contato

---

29. FAVORITOS

Separar:

Lotes.

Fazendas.

Oportunidades.

Simulações.

Conteúdos.

---

30. NOTIFICAÇÕES

Categorias:

Mercado.

Radar.

Negociação.

Negócios.

Aprendizado.

Sistema.

Exemplos:

Novo lote compatível.

Nova proposta.

Preço alterado.

Radar encontrou oportunidade.

Nova aula.

---

31. ESTRATÉGIA DE MONETIZAÇÃO

A monetização não deve prejudicar a liquidez inicial.

CAMADA GRATUITA

Comprador:

gratuito para:

- pesquisar;
- comparar;
- salvar;
- aprender;
- usar recursos básicos;
- criar buscas.

Vendedor:

gratuito para:

- criar perfil;
- publicar quantidade limitada de lotes;
- receber propostas.

---

32. MONETIZAÇÃO POR TRANSAÇÃO

Quando ocorrer uma venda dentro da plataforma:

Criar estrutura visual para uma taxa de intermediação.

Modelo inicial a testar:

1% sobre a venda para o vendedor.

Não assumir que esse percentual é definitivo.

O valor deve ser configurável futuramente.

---

33. BTA PRO

Criar estrutura de assinatura.

Exemplo visual:

BTA PRO

R$ 79/mês

Recursos:

Anúncios ampliados.

Radar avançado.

Analytics.

Prioridade no Match.

Histórico.

Relatórios.

Destaque.

Ferramentas comerciais.

---

34. BTA EMPRESA

Plano para:

- grandes pecuaristas;
- confinamentos;
- frigoríficos;
- compradores profissionais;
- empresas de genética.

Recursos:

Multiusuário.

Analytics avançado.

Volume maior.

Dashboard.

Gestão.

Relatórios.

Prioridade.

O preço deve ser configurável.

---

35. DESTAQUE DE LOTE

Criar ação:

Impulsionar lote

Opções fictícias:

Básico.

Premium.

Destaque regional.

Não transformar publicidade em elemento invasivo.

---

36. SERVIÇOS

Criar arquitetura visual preparada para:

BTA Log.

Seguro.

Financiamento.

Documentação.

Avaliação.

Serviços veterinários.

Não implementar integrações reais agora.

Mostrar como módulos futuros.

---

37. ESTRATÉGIA DE RETENÇÃO

O usuário deve ter motivos para voltar mesmo sem estar comprando.

Motivo 1

Mercado.

Motivo 2

Radar.

Motivo 3

Aprendizado.

Motivo 4

Simulador.

Motivo 5

Gestão.

Motivo 6

Oportunidades.

Isso cria recorrência.

---

38. ESTRATÉGIA DE CONVERSÃO

Não pedir cadastro imediatamente.

Permitir exploração inicial.

Depois de uma ação de alto valor:

Salvar lote.

Criar radar.

Salvar simulação.

Fazer proposta.

Criar anúncio.

Solicitar Match.

→ solicitar cadastro.

A lógica deve ser:

ENTREGAR VALOR → PEDIR CADASTRO

e não:

PEDIR CADASTRO → ENTREGAR VALOR

---

39. ESTRATÉGIA DE ARQUITETURA DE FRONT-END

Organizar a aplicação em módulos independentes:

/core
  design-system
  mock-data
  navigation
  utilities

/features
  home
  market
  buying
  selling
  match
  radar
  opportunities
  simulator
  check
  negotiation
  logistics
  academy
  ai
  business
  profile

/components
  cards
  buttons
  inputs
  charts
  maps
  navigation
  modals

Mesmo sem backend, manter separação clara entre:

UI

estado

dados mockados

regras de negócio simuladas

Isso permitirá substituir os mocks por APIs futuramente sem reconstruir toda a interface.

---

40. MOCK DATA

Criar estruturas simuladas para:

User

Farm

AnimalLot

MarketPrice

Opportunity

Radar

Simulation

Proposal

Transaction

Transport

Course

Lesson

Notification

Subscription

Favorite.

Os dados devem ser fictícios e independentes da interface.

---

41. ESTADOS IMPORTANTES

Cada módulo deve possuir:

Loading.

Success.

Empty.

Error.

Disabled.

Completed.

Exemplo:

Radar sem resultados:

Ainda não encontramos oportunidades.

CTA:

Ajustar critérios

---

42. MÉTRICAS FUTURAS

A arquitetura deve permitir acompanhar:

Usuários ativos.

Lotes publicados.

Lotes visualizados.

Propostas.

Negociações.

Negócios concluídos.

GMV.

Take rate.

Conversão.

Usuários PRO.

Retenção.

Uso do Radar.

Uso do Simulador.

Uso da Academy.

Uso da IA.

Essas métricas não precisam ser conectadas agora.

Criar apenas a estrutura visual necessária.

---

43. FLUXO DE PRIMEIRA COMPRA

Criar um fluxo completo:

Home

→ Comprar

→ Definir necessidade

→ Resultados

→ Comparar

→ Detalhes

→ BTA Check

→ Simulador

→ Proposta

→ Negociação

→ Negócio fechado

→ Logística

→ Negócio concluído.

Esse é o principal fluxo demonstrável do MVP.

---

44. FLUXO DE PRIMEIRA VENDA

Home

→ Vender

→ Criar lote

→ Preview

→ Publicar

→ Interessados

→ Proposta

→ Negociação

→ Venda concluída

→ Logística.

---

45. FLUXO DO INICIANTE

Home

→ Aprender

→ BTA Caminho

→ Definir perfil

→ Academy

→ Simulador

→ Oportunidades

→ BTA IA

→ Primeiro negócio.

---

46. FLUXO DO USUÁRIO PROFISSIONAL

Home

→ Mercado

→ Radar

→ Oportunidade

→ Match

→ Comparador

→ Simulador

→ Negociação

→ Negócios.

O profissional deve conseguir chegar ao negócio rapidamente, sem ser obrigado a passar pelo conteúdo educacional.

---

47. REGRA DE EXPERIÊNCIA

Sempre que o usuário estiver tomando uma decisão financeira ou comercial, oferecer contexto.

Exemplo:

Usuário vê preço.

→ "Comparar com média."

Usuário vê lote.

→ "Simular."

Usuário vai negociar.

→ "Verificar."

Usuário não entende.

→ "Perguntar à BTA IA."

Isso cria uma experiência inteligente.

---

48. TELAS ADICIONAIS RECOMENDADAS

Adicionar ao projeto atual:

1. COMPARADOR

Para comparar até três lotes.

2. OPORTUNIDADE EXPLICADA

Explica por que o algoritmo identificou determinada oportunidade.

3. NEGÓCIO FECHADO

Confirmação e próximos passos.

4. ANALYTICS DO VENDEDOR

Visualizações, interesses e conversão.

5. CENTRAL DE SERVIÇOS

Futuro hub de logística, seguro, financiamento e serviços.

Essas telas devem ser criadas separadamente das telas originais e integradas à arquitetura.

---

49. REGRA DE OURO DO PRODUTO

O BTA nunca deve responder somente:

"Aqui está um anúncio."

Deve responder:

"Aqui está a oportunidade, aqui está o contexto, aqui está o custo, aqui estão os riscos, aqui estão as alternativas e aqui está o próximo passo."

---

50. RESULTADO ESPERADO

O projeto final deve funcionar como uma simulação completa do BTA.

O usuário precisa conseguir:

descobrir → aprender → procurar → comparar → analisar → simular → verificar → negociar → fechar → transportar → acompanhar.

Sem backend.

Sem banco real.

Com dados fictícios.

Mas com arquitetura suficientemente organizada para que, no futuro, o backend real possa substituir os mocks sem reconstruir o produto.

BTA

Inteligência que movimenta o gado.
