# Estado do Projeto — BTA (ponto de recuperação)

> Este documento é o **checkpoint** para retomar o projeto de onde paramos.
> Quando pedir "recupera o projeto BTA" ou "continua de onde estávamos", comece por aqui.

**Última atualização:** 2026-08-24

---

## 1. O que é o projeto

App **BTA — Bovinos Trade Agro** (agritech de pecuária). Protótipo funcional
navegável com 31 telas, dados fictícios/mockados, sem backend.
Stack: React 19 + Vite 8 + TypeScript + Tailwind 4.

Origem: portado de um projeto Figma Make e reorganizado numa arquitetura modular
própria (`core` / `data` / `utils` / `components` / `features`).

A especificação completa do produto está em `docs/`:
- `bta-design-system.md` — identidade visual, tokens, componentes.
- `bta-functional-architecture.md` — cada tela, seus botões e fluxos.

---

## 2. Como rodar (retomada rápida)

```bash
npm install
npm run dev            # http://localhost:5173
npx tsc --noEmit       # deve passar limpo
npm run build          # deve passar limpo
```

Testar no celular: túnel Cloudflare —
`cloudflared tunnel --url http://localhost:5173` (hosts já liberados em `vite.config.ts`).

---

## 3. O que já foi feito ✅

1. **Porte + modularização** do código do Figma Make para React/Vite/TS/Tailwind,
   dividido em `core` / `data` / `utils` / `components` / `features` (uma pasta por área).
2. **Componentes** reorganizados em subpastas temáticas (`foundation`, `brand`,
   `cards`, `navigation`, `controls`), com import único via `@/components`.
3. **Revisão em 3 dimensões (Gauntlet Loop)** contra os docs de design/arquitetura:
   - **Fidelidade ao design system:** cores/spacing/radius/sombra ajustados para os tokens exatos.
   - **Anti-AI-look:** emoji usado como ícone → substituído pelo set SVG `Ic` em toda a UI; botões sem destino corrigidos.
   - **Hierarquia & fluxo:** navegação e destaque de informação corrigidos; botões levando ao lugar certo.
4. **Gaps funcionais implementados:**
   - Filtro da tela **Comprar** agora realmente filtra os **Resultados** (categoria, raça, preço, distância, peso, busca textual) + estado vazio decente.
   - **Academy:** cada um dos 10 cursos abre sua **própria aula** (antes todos abriam a mesma).
   - Bug de correspondência de raça corrigido (Angus não casa mais com Brangus por substring).

Build e type-check passam limpos.

---

## 4. O que está pendente / próximos passos 📋

Ordem sugerida (nada disso está feito ainda):

- [ ] **Validação no celular real** — testar toque, espaçamento e legibilidade na tela do dispositivo.
- [ ] **Versões Tablet e Desktop** — o design system prevê breakpoints 768×1024 e 1440×1024 com sidebar; hoje só existe o layout mobile (390×844).
- [ ] **Revisão fina das telas menos usadas no fluxo principal** (ex.: SellerAnalytics, BTAPath, Services) — passaram pela revisão, mas merecem um olhar dedicado de conteúdo.
- [ ] **Estados de loading/erro/empty** consistentes em todos os módulos (o de Resultados já existe; replicar padrão).
- [ ] **Code splitting** — o bundle passa de 500 kB; considerar `import()` dinâmico por rota/tela.
- [ ] Eventual **backend real** substituindo `src/data/mock.ts` (a arquitetura já isola isso).

---

## 5. Como o código está organizado

Ver o mapa completo no `README.md` (raiz). Resumo do que editar para cada coisa:

| Quero mexer em...            | Vá direto em...                          |
|------------------------------|------------------------------------------|
| uma tela específica          | `src/features/<área>/<Tela>.tsx`         |
| cores / tokens / animações   | `src/index.css`                          |
| um card / botão / ícone      | `src/components/<subpasta>/`             |
| dados fictícios              | `src/data/mock.ts`                       |
| tipos de navegação / filtros | `src/core/navigation.ts`                 |
| o roteamento entre telas     | `src/App.tsx`                            |

---

## 6. Convenções (não quebrar)

- Navegação por `useState` em `App.tsx` (ids/filtros passados entre telas) — **não** react-router.
- Telas importam UI de `@/components` (barrel), nunca da subpasta direta.
- Cores/spacing sempre via tokens de `index.css`; ícones sempre do set `Ic`.
- Todo ajuste deve manter `npx tsc --noEmit` e `npm run build` limpos.

---

## 7. Git

Cada etapa relevante é um commit. Para ver onde paramos: `git log --oneline`.
Este documento reflete o estado do commit em que foi atualizado pela última vez.
