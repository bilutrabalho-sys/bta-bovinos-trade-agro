# Data Safety (Segurança dos Dados) — Google Play Console — App BTA

Guia **item a item** para preencher a seção **Data safety / Segurança dos dados** do Google Play Console.
Baseado no que o app **realmente coleta** (verificado no código: `server/src/auth.ts`, `server/src/routes/auth.ts`, migrations `004`, `005`, `008`, `011`, `016`).

> **Como o Google define "coletado" e "compartilhado":**
> - **Coletado (Collected):** o app envia dados do dispositivo para o seu servidor. (Tudo aqui é coletado, pois vai para o backend/PostgreSQL.)
> - **Compartilhado (Shared):** os dados são transferidos para **terceiros** (outra empresa/organização). **Provedor de hospedagem que só processa em seu nome (operador) NÃO conta como "compartilhamento"** para o Data Safety. Por isso, na prática, **quase tudo é "Coletado = Sim / Compartilhado = Não"**.
> - **Processados de forma efêmera:** se o dado só passa pela memória e não é armazenado, marca-se diferente. **Não é o nosso caso** — nós armazenamos.

---

## 1. Perguntas gerais (topo do formulário)

| Pergunta do console | Resposta a marcar | Justificativa |
|---|---|---|
| O app coleta ou compartilha algum dos tipos de dado exigidos? | **Sim (Yes)** | Coletamos nome, e-mail, atividade, etc. |
| Todos os dados coletados são **criptografados em trânsito**? | **Sim (Yes)** | Tráfego app↔servidor por HTTPS/TLS. *(Garanta que a API só aceita HTTPS em produção.)* |
| Você fornece um meio de o usuário **solicitar a exclusão** dos dados? | **Sim (Yes)** | Exclusão de conta no app (`DELETE /api/auth/account`) + e-mail de privacidade. Ver seção 4 abaixo. |
| Você tem uma **Política de Privacidade**? | **Sim (Yes)** — informe a **URL pública** | Use o `politica-de-privacidade.html` hospedado. **[PREENCHER: URL]** |

---

## 2. Tipos de dado — o que declarar (marque cada um assim)

Para **cada** tipo abaixo, o console pergunta: (a) é **coletado**? (b) é **compartilhado**? (c) é **obrigatório** ou **opcional**? (d) **finalidade** (pode marcar mais de uma) — e, no nível da seção, se é **criptografado em trânsito** (Sim para todos) e se é **processado de forma efêmera** (Não para todos, pois armazenamos).

### Categoria: **Informações pessoais (Personal info)**

| Tipo de dado (Google) | Coletado? | Compartilhado? | Obrigatório? | Finalidades a marcar |
|---|---|---|---|---|
| **Nome (Name)** | **Sim** | **Não** | **Obrigatório** | *Account management* (gerenciamento de conta), *App functionality* |
| **Endereço de e-mail (Email address)** | **Sim** | **Não** | **Obrigatório** | *Account management*, *App functionality* |
| **Número de telefone (Phone number)** | **Não** *(por ora)* | — | — | **NÃO marque.** O campo existe no schema, mas o app **não pede telefone** no fluxo atual. Só declare se passar a coletar. |
| **Outras informações (Other info — cidade/UF do perfil)** | **Sim** | **Não** | **Opcional** | *App functionality* | 

> **Cidade/UF (localização digitada) — decisão de enquadramento:** é **texto que o usuário digita**, não localização de dispositivo. **Não** marque a categoria **"Location / Approximate location"** (essa se refere a localização derivada do dispositivo/permissão), porque o app **não pede permissão de localização**. Declare a cidade/UF como parte do perfil em **Personal info → Other info (opcional)**. *(Se o revisor da Play questionar, a resposta é: dado auto-declarado, sem sensor de localização.)*

### Categoria: **Mensagens (Messages)**

| Tipo de dado (Google) | Coletado? | Compartilhado? | Obrigatório? | Finalidades |
|---|---|---|---|---|
| **Outras mensagens no app (Other in-app messages)** | **Sim** | **Não** | **Opcional** | *App functionality* |

> Refere-se às **mensagens do chat de negociação** entre comprador e vendedor (`negotiation_messages`). São visíveis para a outra parte da negociação — isso é **funcionalidade do app**, não "compartilhamento com terceiros".

### Categoria: **Fotos e vídeos (Photos and videos)**

| Tipo de dado (Google) | Coletado? | Compartilhado? | Obrigatório? | Finalidades |
|---|---|---|---|---|
| **Fotos (Photos)** | **Sim** | **Não** | **Opcional** | *App functionality* |

> Refere-se às **fotos dos lotes de gado** que o **vendedor** envia para ilustrar o anúncio (`lot_images`). São fotos de animais/produto, enviadas voluntariamente por quem anuncia. Só se aplica a quem cadastra lote.

### Categoria: **Atividade no app (App activity)**

| Tipo de dado (Google) | Coletado? | Compartilhado? | Obrigatório? | Finalidades |
|---|---|---|---|---|
| **Interações no app (App interactions)** | **Sim** | **Não** | **Opcional** | *App functionality* |
| **Conteúdo gerado pelo usuário / outras ações** | **Sim** | **Não** | **Opcional** | *App functionality* |

> Cobre: anúncios/lotes, propostas, favoritos, fazendas seguidas, radares e buscas, simulações financeiras, progresso em cursos/aulas, notificações e assinaturas. Tudo é funcionalidade do app.

### Categoria: **App info and performance** (opcional — só se aplicável)

| Tipo de dado (Google) | Coletado? | Observação |
|---|---|---|
| **Crash logs / Diagnostics** | **[DECIDIR]** | Marque **Sim** apenas se você usar alguma ferramenta de crash/diagnóstico (ex.: Crashlytics). **Se não usa, marque Não.** **[PREENCHER: confirmar se há SDK de crash/analytics.]** |

### Categoria: **Identificadores do dispositivo / IDs**

| Tipo de dado (Google) | Coletado? | Observação |
|---|---|---|
| **User IDs** | **Sim** | Usamos um **ID interno de usuário** e um token de sessão (JWT). Declare **User IDs = Coletado / Não compartilhado**, finalidade *Account management*, *App functionality*. |
| **Device or other IDs** | **Não** *(por ora)* | Só marque se você adotar analytics/publicidade que usem ID de dispositivo. **[PREENCHER: confirmar.]** |

---

## 3. Finalidades (Purposes) — referência rápida

Para este app, use **somente** estas finalidades (evite marcar as demais, que não se aplicam):

- ✅ **App functionality** (funcionalidade do app) — praticamente tudo.
- ✅ **Account management** (gerenciamento de conta) — nome, e-mail, User ID.
- ❌ **NÃO** marque: *Analytics* (a menos que adote), *Advertising or marketing*, *Personalization* para publicidade, *Fraud prevention* (só marque se quiser declarar o uso de logs para antifraude — opcional), *Developer communications* (só se enviar comunicações).

> Se você declarar uso de **logs para segurança/antifraude**, pode marcar **Fraud prevention, security, and compliance** para os dados técnicos. É opcional e honesto marcá-la, dado que os logs existem para segurança.

---

## 4. Exclusão de dados (Data deletion) — o que responder

O Google exige clareza sobre exclusão. Responda assim:

| Pergunta | Resposta |
|---|---|
| O usuário pode **solicitar a exclusão** dos dados? | **Sim** |
| O app oferece uma forma de **excluir a conta dentro do app**? | **Sim** — em Perfil/Configurações → "Excluir minha conta". |
| **URL para solicitar exclusão de dados** (opcional, mas recomendado) | **[PREENCHER: URL de instruções de exclusão]** — pode ser uma página simples explicando o passo a passo no app + o e-mail **[PREENCHER/CONFIRMAR: privacidade@bta.agr.br]**. |

**Texto sugerido para a página/URL de exclusão** (a Play valoriza ter isso público):

> *"Para excluir sua conta e seus dados no BTA: abra o app → Perfil/Configurações → Excluir minha conta → confirmar. A exclusão é imediata: apagamos os dados que são exclusivamente seus e anonimizamos sua ficha (nome, e-mail, telefone, cidade e senha são removidos). Registros de negociações com outra parte são mantidos sem identificar você, por obrigação legal. Você também pode pedir a exclusão pelo e-mail privacidade@bta.agr.br."*

---

## 5. Resumo do que marcar (checklist de 1 minuto)

- ✅ Coleta dados: **Sim**
- ✅ Criptografado em trânsito: **Sim** (garanta HTTPS em produção)
- ✅ Usuário pode pedir exclusão: **Sim** (conta excluível no app)
- ✅ Tem Política de Privacidade: **Sim** + URL pública
- **Coletado = Sim / Compartilhado = Não** para: **Nome, E-mail, User ID** (obrigatórios); **Cidade/UF (Other info), Mensagens do chat, Fotos de lote, Interações/atividade** (opcionais).
- **NÃO declarar** (não coletado hoje): **Telefone, Localização precisa/aproximada de dispositivo, Dados financeiros/pagamento, Biometria, Saúde, Contatos, Device ID.**
- **Decidir/confirmar:** Crash logs & Analytics (só se houver SDK), Device ID (só se houver).

> **Regra de ouro:** o Data Safety deve **bater exatamente** com o que o app faz e com a Política de Privacidade. Se um dia adicionar analytics, pagamento, telefone ou push com ID de dispositivo, **atualize este formulário e a Política** antes de publicar a nova versão.
