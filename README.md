# BTA — Bovinos Trade Agro

> **Inteligência que movimenta o gado.**

Plataforma digital de pecuária (agritech) que centraliza marketplace de bovinos,
inteligência de mercado, simuladores, educação, IA de apoio à decisão, radar de
oportunidades, logística e gestão de negócios — tudo num só produto.

**Estado atual:** protótipo funcional navegável (31 telas) com dados 100%
fictícios/mockados. Sem backend real, banco ou integrações — a arquitetura já é
organizada para que os mocks sejam trocados por APIs no futuro sem reescrever a
interface.

Stack: **React 19 + Vite 8 + TypeScript + Tailwind CSS 4**.

---

## Como rodar

```bash
npm install
npm run dev      # sobe em http://localhost:5173
```

Outros comandos:

```bash
npm run build    # build de produção em dist/
npm run preview  # serve o build de produção
npx tsc --noEmit # checagem de tipos (deve passar limpo)
```

### Testar em outro dispositivo (celular)

- **Mesma rede Wi-Fi:** acesse `http://<IP-DO-PC>:5173` (o dev server já escuta em `0.0.0.0`).
- **De qualquer lugar (link público):** use um túnel Cloudflare —
  `cloudflared tunnel --url http://localhost:5173` gera uma URL `*.trycloudflare.com`.
  Os hosts de túnel já estão liberados em `vite.config.ts` (`server.allowedHosts`).

---

## Organização do projeto

A regra é: **quando você quiser mexer numa coisa específica, vai direto na pasta dela.**

```
APP BTA/
├── docs/                        📚 Especificação do produto
│   ├── bta-design-system.md         → cores, tipografia, spacing, componentes
│   ├── bta-functional-architecture.md → cada tela: propósito, botões, fluxos
│   └── ESTADO-DO-PROJETO.md          → onde paramos + como retomar (LEIA para recuperar)
│
├── src/
│   ├── main.tsx                 Ponto de entrada React
│   ├── App.tsx                  Composição + roteamento entre telas (useState, não react-router)
│   ├── index.css                Tokens do design system (Tailwind v4 @theme) + animações
│   │
│   ├── core/                    🧭 Fundação
│   │   └── navigation.ts             Tipos Screen/Tab e BuyFilters (payload entre telas)
│   │
│   ├── data/                    🗃️ Dados
│   │   └── mock.ts                   Lotes, fazendas, mercado, cursos, aulas, notificações...
│   │
│   ├── utils/                   🔧 Utilitários
│   │   └── sound.ts                  Efeitos sonoros (Web Audio)
│   │
│   ├── components/              🧩 UI compartilhada (import único via @/components)
│   │   ├── foundation/               icons (Ic) + Button (Btn)
│   │   ├── brand/                    BTALogo, BTAScore, VerifiedBadge
│   │   ├── cards/                    LotCard, PriceCard
│   │   ├── navigation/               Header, BottomNav
│   │   ├── controls/                 SectionTitle, Chip
│   │   └── index.ts                  barrel — a porta de import de tudo acima
│   │
│   └── features/               🖥️ As telas, uma pasta por área do produto
│       ├── onboarding/              Splash, Onboarding, Termos
│       ├── home/                    Home
│       ├── market/                  Mercado / preços
│       ├── buying/                  Comprar, Resultados, Detalhe do lote, Comparador, Perfil da fazenda
│       ├── selling/                 Vender, Criar anúncio, Analytics do vendedor
│       ├── match/                   BTA Match
│       ├── radar/                   BTA Radar
│       ├── opportunities/           Oportunidades
│       ├── simulator/               Simulador
│       ├── check/                   BTA Check
│       ├── negotiation/             Negociação, Negócio fechado
│       ├── logistics/               BTA Log, Serviços
│       ├── academy/                 Academy, Aula, BTA Caminho
│       ├── ai/                      BTA IA
│       ├── business/                BTA Negócios
│       └── profile/                 Perfil, BTA PRO, Favoritos, Notificações
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Regras de arquitetura

- **Uma tela = um arquivo** dentro da sua pasta em `features/`.
- Telas importam UI compartilhada **sempre** de `@/components` (barrel), nunca de subpasta direta.
- `@/` é alias para `src/` (configurado em `tsconfig.json` e `vite.config.ts`).
- Cores/spacing/radius **sempre via tokens** de `index.css` (`bta-primary`, `bta-amber`, etc.) — nada de hex cru.
- Ícones **sempre** do set SVG `Ic` (`components/foundation/icons`) — nada de emoji como ícone de UI.
- Navegação é por estado (`useState` em `App.tsx`), passando ids/filtros entre telas — **não** usar react-router.

---

## Recuperar / retomar o projeto

Todo o histórico está no Git. Para retomar exatamente de onde paramos, leia
**`docs/ESTADO-DO-PROJETO.md`** — ele descreve o que já foi feito, o que está
pendente e os próximos passos.

```bash
git clone <URL-DO-REPO>
cd <pasta>
npm install
npm run dev
```
