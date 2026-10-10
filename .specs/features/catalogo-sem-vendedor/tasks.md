# Catálogo sem vendedor — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/catalogo-sem-vendedor/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Commands from `package.json`, `client/package.json`, `shared/package.json`. Runner: Vitest (`client/vitest.config.ts`, `shared/vitest.config.ts`), sem limiar de cobertura. Não há script de lint.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Contrato `shared` | unit | 1:1 com o AC do barril; `SellerSchema` ausente | `shared/src/**/*.test.ts` | `pnpm --filter @catalogo/shared test` |
| Script de catálogo | unit | Produtos válidos passam; `product.json` inválido falha; sem leitura de `sellers.json` | `client/scripts/**/*.test.ts` | `pnpm --filter client test` |
| Componente de UI | unit | Cada AC visual do componente, nos dois temas quando o AC cita claro e escuro | `client/src/**/*.test.tsx` | `pnpm --filter client test` |
| Rota | integration | `/` e `/relogio/:slug`, com e sem `seller`, slug ausente e vitrine vazia | `client/src/app/router.test.tsx`, `client/src/main.test.tsx`, `client/src/routes/*.test.tsx` | `pnpm --filter client test` |
| Skill de cadastro | none | O texto deixa de citar `sellers.json` | `.agents/skills/cadastrar-relogio/SKILL.md` | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tarefa só de `shared`, ou teste de componente já coberto pelo Vitest do client | `pnpm --filter @catalogo/shared test` no `shared`; `pnpm --filter client test` no client |
| Full | Tarefa de rota ou fim de fase que cruza os dois pacotes | `pnpm test` |
| Build | Fase fechada, skill ou arquivo estático | `pnpm test && pnpm build` |

---

## Execution Plan

Phases are ordered and run sequentially. Tasks inside a phase run in order.

### Phase 1: Contrato

O telefone sai do contrato e do build.

```
T1 → T2 → T3 → T4
```

### Phase 2: Link

O WhatsApp deixa de receber número.

```
T5 → T6
```

### Phase 3: Páginas

Card, barra, páginas e rotas abrem sem vendedor.

```
T7 → T8 → T9 → T10 → T11
```

### Phase 4: Primitivos

O shadcn entra sem preset.

```
T12
```

### Phase 5: Controles

Pílula, ícones, card e selo.

```
T13 → T14 → T15 → T16 → T17
```

### Phase 6: Ficha e carrossel

Tabela, largura da página e gesto.

```
T18 → T19 → T20
```

---

## Task Breakdown

### Phase 1: Contrato

### T1: Tirar SellerSchema do shared

**Status**: done

**What**: O barril deixa de exportar `SellerSchema` e `Seller`. O módulo e o teste do schema saem.
**Where**: `shared/src/index.ts`
**Depends on**: None
**Reuses**: `shared/src/schemas/product.ts`
**Requirement**: SV-09
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `shared/src/schemas/seller.ts` e `seller.test.ts` não existem
- [x] `shared/src/index.test.ts` e `client/src/sentinel.test.ts` não esperam `SellerSchema`
- [x] Gate sai 0: `pnpm --filter @catalogo/shared test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(shared): remove o contrato de vendedor`

---

### T2: Validar só os relógios

**Status**: done

**What**: `validateCatalog` deixa de ler `sellers.json` e continua falhando quando um `product.json` fura o contrato.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T1
**Reuses**: `ProductSchema`
**Requirement**: SV-25
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `client/scripts/catalog.test.ts` cobre produtos válidos e um `product.json` inválido
- [x] O teste não exige `sellers.json`
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(client): valida o catálogo sem sellers.json`

---

### T3: Apagar o telefone publicado

**Status**: done

**What**: `client/public/catalog/sellers.json` sai. O teste de `dist` exige a ausência de `catalog/sellers.json`. `vendedores/` e `relogios-alexandre.md` ficam no disco.
**Where**: `client/scripts/dist.test.ts`
**Depends on**: T2
**Reuses**: o teste de `dist` que hoje procura `sellers.json`
**Requirement**: SV-07, SV-08, SV-23, SV-24, SV-26
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `client/public/catalog/sellers.json` não existe
- [x] O teste de `dist` falha se `catalog/sellers.json` aparecer
- [x] `vendedores/` e `relogios-alexandre.md` continuam no disco
- [x] Gate sai 0: `pnpm test && pnpm build`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: build

**Commit**: `fix(client): tira sellers.json do site publicado`

---

### T4: Ajustar a skill de cadastro

**Status**: done

**What**: A skill deixa de mencionar editar `sellers.json`.
**Where**: `.agents/skills/cadastrar-relogio/SKILL.md`
**Depends on**: T3
**Reuses**: o restante da skill, que continua só cadastrando relógio
**Requirement**: SV-27
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo não cita `sellers.json`
- [x] A skill continua sem commit e sem Vitest próprio
- [x] Gate sai 0: `pnpm test && pnpm build`

**Tests**: none
**Gate**: build

**Commit**: `docs(skill): tira sellers.json do cadastro de relógio`

---

### Phase 2: Link

### T5: Montar o WhatsApp sem número

**Status**: done

**What**: `waUrl(slug, title)` monta `https://wa.me/?text=` com a frase e a URL absoluta do relógio, sem query e sem telefone.
**Where**: `client/src/components/catalog/want-link.tsx`
**Depends on**: T4
**Reuses**: `target="_blank"` e `rel="noopener noreferrer"`
**Requirement**: SV-17, SV-18, SV-19, SV-21, SV-22
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O rótulo visível e o nome acessível são Enviar no WhatsApp
- [x] O href não tem número e não usa `whatsapp://`
- [x] `want-link.test.tsx` cobre a frase, a URL e os atributos do link
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): monta o WhatsApp sem telefone`

---

### T6: Repassar slug e título à barra fixa

**Status**: done

**What**: A barra fixa deixa de receber telefone e usa o mesmo href da página. Ela continua ausente quando o botão da página está inteiro na viewport.
**Where**: `client/src/components/catalog/sticky-bar.tsx`
**Depends on**: T5
**Reuses**: o `IntersectionObserver` com limiar 1
**Requirement**: SV-16, SV-20
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] As props são `slug` e `title`, sem `phone`
- [x] `sticky-bar.test.tsx` confere o href igual e a barra escondida com ratio 1
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(client): tira o telefone da barra fixa`

---

### Phase 3: Páginas

### T7: Card sem vendedor

**Status**: done

**What**: O card recebe só o produto. Foto, título e preço apontam para `/relogio/{slug}`. O WhatsApp fica fora do link.
**Where**: `client/src/components/catalog/watch-card.tsx`
**Depends on**: T5
**Reuses**: `productImageSrc`
**Requirement**: SV-13, SV-14
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Não há props `phone` nem `sellerSlug`
- [x] `watch-card.test.tsx` cobre o href sem `seller` e o botão fora do link
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(client): tira o vendedor do card`

---

### T8: Barra com o título Catálogo

**Status**: done

**What**: A barra deixa de receber `sellerName`. O texto é a constante Catálogo.
**Where**: `client/src/components/catalog/top-bar.tsx`
**Depends on**: T7
**Reuses**: o link Voltar quando há `catalogHref`
**Requirement**: SV-01, SV-12
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A prop `sellerName` não existe
- [x] `top-bar.test.tsx` espera o texto Catálogo
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(client): fixa o título da barra em Catálogo`

---

### T9: Vitrine sem prop de vendedor

**Status**: done

**What**: `CatalogPage` não recebe `seller`. A grade lista os relógios. A vitrine vazia mostra a frase combinada.
**Where**: `client/src/routes/catalog-page.tsx`
**Depends on**: T8
**Reuses**: `compareTitles` e `EMPTY_VITRINE_MESSAGE`
**Requirement**: SV-01, SV-06
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A página não importa `Seller`
- [x] `catalog-page.test.tsx` cobre a grade e a frase de vitrine vazia
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: integration
**Gate**: full

**Commit**: `refactor(client): abre a vitrine sem vendedor`

---

### T10: Página do relógio sem vendedor

**Status**: done

**What**: `WatchPage` recebe só `slug`. Voltar e Catálogo apontam para `/`. Slug ausente mostra a frase e esconde o botão.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T6, T9
**Reuses**: `MISSING_WATCH_MESSAGE` e a barra fixa
**Requirement**: SV-10, SV-12, SV-15
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Não há prop `seller`
- [x] `watch-page.test.tsx` cobre o relógio, os links para `/` e o slug ausente
- [x] Gate sai 0: `pnpm --filter client test`
- [x] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: integration
**Gate**: full

**Commit**: `refactor(client): abre o relógio sem vendedor`

---

### T11: Rotas sem gate

**What**: `/` renderiza `CatalogPage` sem loader. `/relogio/:slug` lê o slug com `useParams`. `SellerGate` sai. `?seller=` não muda a página e não busca `sellers.json`.
**Where**: `client/src/app/router.tsx`
**Depends on**: T10
**Reuses**: os paths `/` e `/relogio/:slug`
**Requirement**: SV-02, SV-03, SV-04, SV-05, SV-07, SV-11
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `seller-gate.tsx`, `seller-gate.test.tsx`, `sellers.ts` e `sellers.test.ts` não existem
- [ ] `router.test.tsx` e `main.test.tsx` cobrem `/`, `/?seller=alexandre`, `/?seller=ninguem` e `/relogio/{slug}?seller=alexandre`
- [ ] Gate sai 0: `pnpm test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: integration
**Gate**: full

**Commit**: `feat(client): abre o catálogo sem gate de vendedor`

---

### Phase 4: Primitivos

### T12: Instalar button, badge, card e table

**What**: O init do shadcn no `client` usa Vite e base Radix, sem `-d` e sem preset. Entram `button`, `badge`, `card` e `table`. As variáveis semânticas apontam para os tokens atuais. O `body` fica com `width: 100%`.
**Where**: `client/src/index.css`
**Depends on**: T11
**Reuses**: o alias `@` e os tokens de `DESIGN.md`
**Requirement**: SV-50
**Complexity**: critical

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Existem `button`, `badge`, `card` e `table` em `client/src/components/ui/`
- [ ] `--primary` continua `#0066cc`. `--card` é `--canvas` no claro e `--surface-tile-2` no escuro
- [ ] O `body` não declara `width: 100vw`
- [ ] Um teste de componente lê essas variáveis no CSS
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): adiciona os primitivos shadcn nos tokens atuais`

---

### Phase 5: Controles

### T13: Pílula do WhatsApp

**What**: Enviar no WhatsApp usa `Button` como `asChild`: pílula `#0066cc`, texto branco centralizado, largura cheia, altura mínima de 44px.
**Where**: `client/src/components/catalog/want-link.tsx`
**Depends on**: T5, T12
**Reuses**: `waUrl`
**Requirement**: SV-28
**Complexity**: medium

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] O teste mede altura mínima de 44px, texto centralizado e fundo `#0066cc`
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): faz o WhatsApp uma pílula azul`

---

### T14: Ícone de tema

**What**: O controle de tema é um `Button` 44×44, sem fundo e sem texto visível. No claro mostra `Moon`. No escuro mostra `Sun`. O `aria-label` e a chave `theme:v1` permanecem.
**Where**: `client/src/components/theme-provider.tsx`
**Depends on**: T13
**Reuses**: `ThemeProvider` e `theme:v1`
**Requirement**: SV-29, SV-30, SV-31, SV-32, SV-35
**Complexity**: medium

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `theme-provider.test.tsx` cobre ícone, rótulo acessível e a chave `theme:v1`
- [ ] O botão não tem fundo `#0066cc`
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): troca o tema por ícone`

---

### T15: Barra de 44px

**What**: As duas barras pretas medem 44px. O `py-2.5` sai. Voltar é `Button` com `ChevronLeft`, sem fundo, 44×44.
**Where**: `client/src/components/catalog/top-bar.tsx`
**Depends on**: T8, T14
**Reuses**: `catalogHref`
**Requirement**: SV-29, SV-33, SV-43
**Complexity**: medium

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `top-bar.test.tsx` mede 44px na barra com e sem Voltar
- [ ] Voltar usa `ChevronLeft` e não tem fundo azul
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): iguala a altura da barra preta`

---

### T16: Card do relógio

**What**: O item da grade é um `Card` com borda de 1px, raio de 18px e sem sombra. Fundo `--canvas` no claro e `--surface-tile-2` no escuro. A foto ocupa a largura. Título, preço e botão têm 24px nas laterais e embaixo. O título usa `foreground`.
**Where**: `client/src/components/catalog/watch-card.tsx`
**Depends on**: T7, T15
**Reuses**: o link de foto, título e preço
**Requirement**: SV-36, SV-37, SV-38, SV-39, SV-40, SV-42
**Complexity**: high

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `watch-card.test.tsx` cobre raio, borda, fundos dos dois temas, largura da foto e os 24px
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): coloca o relógio num card`

---

### T17: Selo de desconto

**What**: O selo passa a ser `Badge` com as cores `primary-tint`.
**Where**: `client/src/components/catalog/price-block.tsx`
**Depends on**: T16
**Reuses**: `discountPercent`
**Requirement**: SV-41
**Complexity**: low

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `price-block.test.tsx` espera `Badge` e as classes `primary-tint` quando há desconto
- [ ] Sem desconto, o selo não aparece
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): usa Badge no desconto`

---

### Phase 6: Ficha e carrossel

### T18: Ficha e miolo da página

**What**: A ficha usa `Table`. URL http(s) vira **Ver anúncio similar**, `#0066cc` no claro e `#2997ff` no escuro, sem a URL crua no texto. Os títulos usam `foreground`. O miolo fica num `main` com `max-width: 100%`, `min-width: 0` e `overflow-x: clip`. Uma URL longa não cria rolagem horizontal.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T10, T12
**Reuses**: as seções Detalhes, Especificações e Observações
**Requirement**: SV-42, SV-45, SV-46, SV-47, SV-48, SV-49, SV-51, SV-52
**Complexity**: high

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `watch-page.test.tsx` cobre a tabela, o link, as duas cores e a ausência de rolagem horizontal
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: integration
**Gate**: full

**Commit**: `feat(client): encurta o link da ficha`

---

### T19: Carrossel de 320px

**What**: O quadro tem no máximo 320px, centrado e quadrado. Setas são `Button` 44×44 sem fundo, com `ChevronLeft` e `ChevronRight`. Bolinhas são `Button` de 10px. A atual é `#0066cc` com `aria-current="true"`. As outras usam a cor do texto com opacidade 0.35. O gesto de mais de 40px só troca foto com duas ou mais. Gesto cancelado não troca. Uma foto esconde setas e bolinhas. Teclado, `draggable={false}` e `touch-action: pan-y` permanecem.
**Where**: `client/src/components/catalog/carousel.tsx`
**Depends on**: T18
**Reuses**: o limiar de 40px e o teclado
**Requirement**: SV-29, SV-33, SV-34, SV-44, SV-53, SV-54, SV-55, SV-56, SV-57, SV-58, SV-59, SV-60
**Complexity**: high

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `carousel.test.tsx` cobre gesto, cancelamento, uma foto, teclado, bolinhas e os 320px
- [ ] Gate sai 0: `pnpm --filter client test`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): limita a foto e o gesto do carrossel`

---

### T20: Miolo da vitrine

**What**: A vitrine usa o mesmo `main` com `max-width: 100%`, `min-width: 0` e `overflow-x: clip`.
**Where**: `client/src/routes/catalog-page.tsx`
**Depends on**: T9, T19
**Reuses**: a grade de T9
**Requirement**: SV-51
**Complexity**: low

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [ ] `catalog-page.test.tsx` espera esse `main`
- [ ] Gate sai 0: `pnpm test && pnpm build`
- [ ] Nenhum teste é apagado ou marcado com skip para a suíte passar

**Tests**: integration
**Gate**: build

**Commit**: `feat(client): impede a rolagem horizontal da vitrine`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 → T2 → T3 → T4
Phase 2:  T5 → T6
Phase 3:  T7 → T8 → T9 → T10 → T11
Phase 4:  T12
Phase 5:  T13 → T14 → T15 → T16 → T17
Phase 6:  T18 → T19 → T20
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: barril `shared` | 1 módulo | ✅ Granular |
| T2: `validateCatalog` | 1 função | ✅ Granular |
| T3: teste de `dist` e arquivo público | 1 comportamento de build | ✅ Granular |
| T4: skill | 1 arquivo | ✅ Granular |
| T5: `waUrl` | 1 função | ✅ Granular |
| T6: barra fixa | 1 componente | ✅ Granular |
| T7: card | 1 componente | ✅ Granular |
| T8: barra | 1 componente | ✅ Granular |
| T9: vitrine | 1 página | ✅ Granular |
| T10: página do relógio | 1 página | ✅ Granular |
| T11: rotas | 1 módulo de rota | ✅ Granular |
| T12: tokens e primitivos | 1 folha de CSS mais os quatro primitivos que ela pinta | ✅ Granular |
| T13: pílula | 1 componente | ✅ Granular |
| T14: tema | 1 controle | ✅ Granular |
| T15: altura da barra | 1 componente | ✅ Granular |
| T16: card visual | 1 componente | ✅ Granular |
| T17: selo | 1 componente | ✅ Granular |
| T18: ficha | 1 página | ✅ Granular |
| T19: carrossel | 1 componente | ✅ Granular |
| T20: `main` da vitrine | 1 página | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | sem seta de entrada | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 é outra fase; T5 abre a fase 2 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T5 | T5 é outra fase; T7 abre a fase 3 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T6, T9 | T9 → T10; T6 é outra fase | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 é outra fase; T12 sozinho na fase 4 | ✅ Match |
| T13 | T5, T12 | T5 e T12 são outras fases; T13 abre a fase 5 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T8, T14 | T14 → T15; T8 é outra fase | ✅ Match |
| T16 | T7, T15 | T15 → T16; T7 é outra fase | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T10, T12 | T10 e T12 são outras fases; T18 abre a fase 6 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T9, T19 | T19 → T20; T9 é outra fase | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Contrato `shared` | unit | unit | ✅ OK |
| T2 | Script de catálogo | unit | unit | ✅ OK |
| T3 | Script de catálogo | unit | unit | ✅ OK |
| T4 | Skill de cadastro | none | none | ✅ OK |
| T5 | Componente de UI | unit | unit | ✅ OK |
| T6 | Componente de UI | unit | unit | ✅ OK |
| T7 | Componente de UI | unit | unit | ✅ OK |
| T8 | Componente de UI | unit | unit | ✅ OK |
| T9 | Rota | integration | integration | ✅ OK |
| T10 | Rota | integration | integration | ✅ OK |
| T11 | Rota | integration | integration | ✅ OK |
| T12 | Componente de UI | unit | unit | ✅ OK |
| T13 | Componente de UI | unit | unit | ✅ OK |
| T14 | Componente de UI | unit | unit | ✅ OK |
| T15 | Componente de UI | unit | unit | ✅ OK |
| T16 | Componente de UI | unit | unit | ✅ OK |
| T17 | Componente de UI | unit | unit | ✅ OK |
| T18 | Rota | integration | integration | ✅ OK |
| T19 | Componente de UI | unit | unit | ✅ OK |
| T20 | Rota | integration | integration | ✅ OK |
