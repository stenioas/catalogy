# Variantes no anúncio — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/variantes-anuncio/design.md`
**Status**: Draft

Do T1 ao fim da T15, `pnpm test` na raiz pode falhar: o JSON novo e a página velha não convivem. Cada tarefa fecha só o próprio gate. A T16 é a primeira que exige a suíte inteira e o build verdes.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Commands from the root `package.json`, `client/package.json`, `shared/package.json` and Vitest.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Schema e regras de anúncio | unit | Todos os ramos. Um teste por AC de contrato, fila, home, filtro, página e borda listada | `shared/src/**/*.test.ts` | `pnpm --filter @catalogo/shared test` |
| Prebuild e dist | integration | JSON inválido falha. Foto citada ausente falha. Foto não citada fica na fonte e sai do dist | `client/scripts/**/*.test.ts` | `pnpm --filter client exec vitest run scripts/catalog.test.ts scripts/prebuild-catalog.test.ts scripts/dist.test.ts` |
| Home, card, página, faixa e seletores | integration | Cada rota e largura do spec: caminho feliz, borda e erro. A suíte existente não perde asserção sem equivalente | `client/src/**/*.test.tsx` | `pnpm --filter client exec vitest run <arquivo da tarefa>` |
| Skill de cadastro | none | O texto da skill cumpre o spec. A suíte Vitest não executa a skill | `.agents/skills/product-register/SKILL.md` e `.agents/skills/product-scrapper/SKILL.md` | gate da tarefa, sem Vitest da skill |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Schema, regras puras ou um arquivo de teste do client | `pnpm --filter @catalogo/shared test` ou `pnpm --filter client exec vitest run <arquivo>` |
| Full | Fase de UI fechada, quando a suíte inteira volta a passar | `pnpm test` |
| Build | Foto publicada e catálogo migrado no prebuild | `pnpm build` |

---

## Execution Plan

Fases em ordem. Dentro da fase, a ordem numérica.

### Phase 1: Contrato e regras

```
T1 -> T2 -> T3
T2 -> T4
T2 -> T5
```

### Phase 2: Catálogo no disco

```
T6 -> T7
```

### Phase 3: Home

```
T9 -> T10 -> T11
```

### Phase 4: Página do anúncio

```
T12 -> T15 -> T16
T13 -> T15
T14 -> T15
```

### Phase 5: Cadastro

```
T17 -> T18
```

---

## Task Breakdown

### Phase 1: Contrato e regras

### T1: Contrato do produto

**What**: O `ProductSchema` passa a aceitar produto, eixos, anúncios e variantes, e a rejeitar o que o spec marca como inválido.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: None
**Reuses**: `truncateReais` e a lista fechada de labels, sem `Estado`
**Requirement**: VAR-01, VAR-02, VAR-03, VAR-04, VAR-05, VAR-06, VAR-07, VAR-08, VAR-09, VAR-10, VAR-11, VAR-12, VAR-13, VAR-14, VAR-15, VAR-16, VAR-17, VAR-18, VAR-19, VAR-20, VAR-21, VAR-22, VAR-23, VAR-26, VAR-102

**Complexity**: high

**Complexity rationale**: O contrato concentra dezenas de regras que se cruzam (defaults, encomenda, combinação repetida, foto e eixos). Um desvio invalida o catálogo inteiro.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Tokens de `audience`, `state` e `availabilityStatus` são os ingleses do spec
- [x] `enabled`, `orderable` e `unmissableOffer` ausentes valem visível, encomendável e sem oferta
- [x] Sob encomenda só com `new`. `orderable: false` só no Sob encomenda. Combinação repetida no anúncio falha. A mesma combinação em outro anúncio passa
- [x] `mainImage` fora de `images`, id desconhecido, eixo sem seleção e label `Estado` ou `Público-alvo` falham
- [x] Gate quick passa: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): accept listings and variants on the product contract`
**Status**: done

### T2: Fila da variante

**What**: A fila joga `orderable: false` para o fim e a abertura sem `v` válido segue o spec.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T1
**Reuses**: o tipo `Listing` do schema
**Requirement**: VAR-40, VAR-69, VAR-70, VAR-71, VAR-72

**Complexity**: medium

**Complexity rationale**: Funções puras de fila e de abertura por `v`, com regras explícitas e sem DOM. O cuidado está nas bordas de indisponibilidade.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `variantQueue` conserva a ordem relativa das variantes indisponíveis no fim
- [x] `resolveVariant` abre a primeira da fila quando `v` falta ou não pertence ao anúncio
- [x] Com todas indisponíveis e `v` inválido, abre a primeira do array original
- [x] `v` válido abre essa variante, inclusive indisponível
- [x] Variante `orderable: false` não representa card
- [x] Gate quick passa: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): resolve the variant queue and the v query`
**Status**: done

### T3: Seção, filtro e cards

**What**: A home calcula a seção, as opções do filtro e um card por anúncio.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T2
**Reuses**: `compareTitles`
**Requirement**: VAR-34, VAR-35, VAR-36, VAR-37, VAR-38, VAR-39, VAR-41, VAR-42, VAR-43, VAR-44, VAR-45, VAR-46, VAR-47, VAR-48, VAR-49, VAR-51, VAR-52, VAR-53, VAR-54, VAR-55, VAR-56, VAR-57, VAR-58, VAR-59, VAR-60, VAR-61, VAR-62, VAR-63, VAR-64

**Complexity**: high

**Complexity rationale**: Seção, filtro por grupos e escolha do card compartilham o mesmo módulo e muitos critérios. A combinação entre grupos é fácil de inverter.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Sem `section` válida, abre a primeira seção com card. Sem card algum, fica em Disponível
- [x] Marcas dentro do grupo se somam. Entre grupos, todas precisam bater. Grupo sem marca não restringe
- [x] Grupo com uma opção no catálogo da seção fica oculto. Opção ausente não aparece. Marca desconhecida é ignorada
- [x] O card usa a primeira oferta imperdível que passa no filtro, senão a primeira da fila que passa
- [x] Ordem: título pt-BR, slug, ordem de `listings`. O caminho omite `v` sem eixo
- [x] Gate quick passa: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): build home sections, filters, and cards`
**Status**: done

### T4: Vista de um anúncio

**What**: `/product/<slug>` e `/product/<slug>/<id>` resolvem um anúncio, a variante ativa e os seletores.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T2
**Reuses**: `variantQueue` e `resolveVariant`
**Requirement**: VAR-65, VAR-66, VAR-67, VAR-68, VAR-73, VAR-75, VAR-76, VAR-77, VAR-78, VAR-79, VAR-82, VAR-83, VAR-84, VAR-85

**Complexity**: high

**Complexity rationale**: A vista de um anúncio junta rota, anúncio oculto, troca de eixo e o que muda ou não com a variante. Várias bordas de ausência convivem no mesmo resultado.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `/product/<slug>` escolhe o primeiro anúncio que entraria na home e pula o Sob encomenda todo indisponível
- [x] Id direto abre o anúncio mesmo fora da home. Oculto, id inexistente ou produto todo oculto devolve ausente
- [x] Título usa alias ou valor. Seletor mostra `value`. Opção impossível fica desabilitada
- [x] Trocar um eixo cai na primeira da fila que contém o valor novo. A foto inicial é a `mainImage`
- [x] Descrição e fichas não dependem da variante. Preço, observação e oferta dependem
- [x] Gate quick passa: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): resolve one listing page from the product path`
**Status**: done

### T5: Frase do WhatsApp e caminho

**What**: A frase e o caminho da variante ficam numa função só, para o card e a página.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T2
**Reuses**: os rótulos em português do spec
**Requirement**: VAR-50, VAR-74, VAR-80, VAR-81

**Complexity**: low

**Complexity rationale**: Uma função com frase e caminho já escritos no spec. O formato não depende de estado de tela.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `shareMessage` devolve `Olá, tenho interesse no {título}. {estado em português}, {disponibilidade mostrada}. {URL absoluta}`
- [x] O caminho é `/product/<slug>/<id>` e leva `?v=` só quando há eixo
- [x] Variante indisponível continua com a frase, usando Indisponível
- [x] Gate quick passa: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): build the listing share message and path`
**Status**: done

### Phase 2: Catálogo no disco

### T6: Foto citada existe

**What**: O prebuild exige a foto citada e aceita foto extra na pasta fonte.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T1
**Reuses**: `validateCatalog`
**Requirement**: VAR-24

**Complexity**: low

**Complexity rationale**: Uma checagem localizada em `validateCatalog`: foto citada ausente falha e foto extra na fonte passa.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Foto nomeada em `images` e ausente em `img/` faz `validateCatalog` lançar
- [x] Foto em `img/` que nenhum anúncio cita não lança
- [x] Gate quick passa: `pnpm --filter client exec vitest run scripts/catalog.test.ts`

**Tests**: integration
**Gate**: quick

**Commit**: `fix(catalog): require cited images and allow extra source files`
**Status**: done

### T7: Foto não citada fora do dist

**What**: O build publicado apaga do `dist` a foto que nenhum anúncio cita.
**Where**: `client/vite.config.ts`
**Depends on**: T6
**Reuses**: a lista de nomes citados
**Requirement**: VAR-25

**Complexity**: medium

**Complexity rationale**: O build precisa apagar do `dist` a foto não citada e conservar a pasta fonte. O gate é o build, não um teste isolado de função.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] A pasta fonte conserva a foto não citada
- [x] O `dist` não a contém
- [x] Gate build passa: `pnpm build`

**Tests**: integration
**Gate**: build

**Commit**: `fix(client): omit uncited catalog images from the published build`
**Status**: done

### T8: Migrar os product.json atuais

**What**: Cada arquivo atual vira um produto com o anúncio `listing` e uma variante.
**Where**: `client/scripts/migrate-listings.ts` (removido depois que o catálogo ficou no formato novo)
**Depends on**: T1
**Reuses**: o teste por fixture de `client/scripts/specification-migration.test.ts`
**Requirement**: VAR-27, VAR-28, VAR-29, VAR-30, VAR-31, VAR-32, VAR-33

**Complexity**: high

**Complexity rationale**: A migração reescreve cada `product.json` real. Um mapeamento errado de estado, cor ou foto invalida o catálogo publicado.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] A fixture velha sai com id `listing`, eixo `color` só quando havia cor, rótulo Cor, sem alias, e sem linha `Estado`
- [x] `Novo`, `Openbox` e `Usado` viram `new`, `openbox` e `used`. A primeira foto é `mainImage`
- [x] Os `product.json` do catálogo ficam no formato novo e o schema aceita todos
- [x] Gate build passa: `pnpm build`

**Tests**: integration
**Gate**: build

**Commit**: `feat(catalog): migrate each product to one listing and one variant`
**Status**: done

### Phase 3: Home

### T9: Rótulos de estado e disponibilidade

**What**: O badge mostra o português do spec a partir do token inglês.
**Where**: `client/src/components/catalog/product-badges.tsx`
**Depends on**: T5
**Reuses**: os mapas de rótulo de `shared`
**Requirement**: VAR-38, VAR-102

**Complexity**: low

**Complexity rationale**: O badge só traduz tokens ingleses para os rótulos já definidos. Não calcula seção nem fila.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `available`, `coming_soon` e `on_order` aparecem como Disponível, Chega em breve e Sob encomenda
- [x] `new`, `openbox`, `used` e `defective` aparecem como Novo, Openbox, Usado e Com defeito
- [x] Em estoque, Esgotado e o status de produto Indisponível saem deste badge
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/components/catalog/product-badges.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): show portuguese labels for listing state and availability`
**Status**: done

### T10: Card da variante em evidência

**What**: O card renderiza um `CatalogCard` e o WhatsApp usa a frase da variante.
**Where**: `client/src/components/catalog/watch-card.tsx`
**Depends on**: T9
**Reuses**: `PriceBlock`, `UnmissableOfferBadge`, `shareMessage`
**Requirement**: VAR-42, VAR-43, VAR-44, VAR-45, VAR-46, VAR-48, VAR-49, VAR-50

**Complexity**: medium

**Complexity rationale**: O card reúne foto, preço, oferta, caminho e frase do WhatsApp a partir de um `CatalogCard` já resolvido. A regra de escolha fica na tarefa anterior.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Título é o do produto, sem alias. Foto, preços e oferta vêm do card
- [x] O link abre o caminho da variante. O WhatsApp envia a frase do spec
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/components/catalog/watch-card.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): render one card for the highlighted variant`
**Status**: done

### T11: Home com seção e filtro

**What**: A home lê a query, mostra uma seção, o filtro e a grade de cards.
**Where**: `client/src/routes/catalog-page.tsx`
**Depends on**: T3, T10
**Reuses**: `TopBar` e a grade atual
**Requirement**: VAR-34, VAR-35, VAR-36, VAR-37, VAR-47, VAR-51, VAR-52, VAR-53, VAR-54, VAR-55, VAR-56, VAR-57, VAR-58, VAR-59, VAR-60, VAR-61, VAR-62, VAR-63, VAR-64

**Complexity**: high

**Complexity rationale**: A home liga query, seção, filtro e grade, inclusive textos de vazio e a volta do anúncio. A conferência é de comportamento de rota, não só de apresentação.

**Tools**:

- MCP: cursor-ide-browser
- Skill: tlc-spec-driven

**Done when**:

- [x] Sem `section`, abre a primeira seção com card e não grava a chave. Seção vazia na URL permanece
- [x] Textos exatos: `Não temos nenhum anúncio ativo.` e `Nenhum anúncio corresponde aos filtros.`
- [x] Trocar de seção conserva as marcas. Voltar do anúncio devolve a mesma query
- [x] Grupos na ordem Estado, Público-alvo e eixos. Uma opção só oculta o grupo
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/routes/catalog-page.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): filter the home by section, state, audience, and axes`
**Status**: done

### Phase 4: Página do anúncio

### T12: Mídia sem bolinhas

**What**: O carrossel abre na `mainImage`, perde as bolinhas e mostra o contador de 768px a 919px.
**Where**: `client/src/components/catalog/product-media.tsx`
**Depends on**: T4
**Reuses**: `CarouselView` e `DesktopProductMedia`
**Requirement**: VAR-77, VAR-89, VAR-90, VAR-91

**Complexity**: medium

**Complexity rationale**: O carrossel muda a foto inicial e o que aparece em três faixas de largura. As regras visuais já estão fechadas; o risco é a faixa de 768px a 919px.

**Tools**:

- MCP: cursor-ide-browser
- Skill: tlc-spec-driven

**Done when**:

- [x] `startIndex` muda a foto atual para a `mainImage`
- [x] Nenhuma largura renderiza `carousel-dots`. Setas e contador abaixo de 768px permanecem
- [x] De 768px a 919px a coluna de miniaturas permanece e o contador aparece. De 920px em diante o desktop segue sem contador
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/components/catalog/product-media.test.tsx src/components/catalog/carousel.test.tsx src/components/catalog/desktop-product-media.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): open the carousel on the variant photo and remove the dots`
**Status**: done

### T13: Faixa de variantes

**What**: Abaixo de 920px, uma foto por variante escolhe a variante e some quando há uma só.
**Where**: `client/src/components/catalog/variant-strip.tsx`
**Depends on**: T4
**Reuses**: `productImageSrc`
**Requirement**: VAR-86, VAR-87, VAR-88, VAR-96

**Complexity**: medium

**Complexity rationale**: A faixa segue a fila, marca a ativa e trata indisponível e variante única. O componente é novo, com interação, e as regras cabem num arquivo.

**Tools**:

- MCP: cursor-ide-browser
- Skill: tlc-spec-driven

**Done when**:

- [x] A faixa segue a fila, marca a ativa e mantém a indisponível apagada com borda tracejada
- [x] Tocar na foto seleciona a variante
- [x] Uma variante só não renderiza a faixa
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/components/catalog/variant-strip.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): select a variant from the photo strip below 920px`
**Status**: done

### T14: Seletores de eixo

**What**: Cada eixo é um grupo. A opção impossível fica visível e desabilitada.
**Where**: `client/src/components/catalog/axis-selectors.tsx`
**Depends on**: T4
**Reuses**: o `Button` do shadcn
**Requirement**: VAR-68, VAR-75, VAR-76

**Complexity**: medium

**Complexity rationale**: Cada eixo é um grupo e a opção impossível fica visível e desabilitada, distinta da indisponível. O erro típico é inverter esses dois estados.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] A opção mostra `value`
- [x] A opção impossível permanece visível e desabilitada
- [x] A opção indisponível permanece acionável, apagada e com borda tracejada
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/components/catalog/axis-selectors.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): add axis selectors with impossible options disabled`
**Status**: done

### T15: Página de um anúncio

**What**: A página mostra só o anúncio resolvido, a variante ativa e o compartilhar.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T12, T13, T14
**Reuses**: `PriceBlock`, `StickyBar`, a tabela de ficha e `shareMessage`
**Requirement**: VAR-65, VAR-66, VAR-67, VAR-73, VAR-74, VAR-78, VAR-79, VAR-80, VAR-81, VAR-84, VAR-92, VAR-93, VAR-94, VAR-95

**Complexity**: high

**Complexity rationale**: A página compõe mídia, faixa, seletores, fichas e compartilhar, com ordem diferente abaixo e acima de 920px. Um bloco fora do lugar quebra o anúncio inteiro.

**Tools**:

- MCP: cursor-ide-browser
- Skill: tlc-spec-driven

**Done when**:

- [x] A ficha do produto vem antes da ficha do anúncio. Outro anúncio do produto não aparece
- [x] Preço, observação e oferta trocam com a variante. Descrição e fichas não trocam
- [x] Acima do preço, uma linha por eixo com rótulo e `value`. Sem eixo, a linha e o nome da variante somem
- [x] De 920px em diante a coluna direita segue estado, título, nome da variante, preço, seletores, descrição e compartilhar
- [x] Abaixo de 768px a faixa ocupa o lugar das bolinhas. De 768px a 919px a faixa fica abaixo do bloco de miniaturas
- [x] Ausente mostra `Este relógio não está no catálogo.` e omite o WhatsApp
- [x] Gate quick passa: `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): show one listing and its active variant`
**Status**: done

### T16: Rotas do anúncio

**What**: `/product/:slug/:listingId` abre o anúncio. `/product/:slug` deixa a regra escolher.
**Where**: `client/src/app/router.tsx`
**Depends on**: T15
**Reuses**: `AppShell`
**Requirement**: VAR-82, VAR-83, VAR-85

**Complexity**: medium

**Complexity rationale**: As duas rotas reutilizam a página pronta. O peso está no gate completo (`pnpm test` e `pnpm build`), a primeira vez em que a suíte inteira volta a passar.

**Tools**:

- MCP: cursor-ide-browser
- Skill: tlc-spec-driven

**Done when**:

- [x] As duas rotas renderizam `WatchPage`
- [x] Slug ausente, id ausente e anúncio oculto mostram a frase de ausente
- [x] Gate full passa: `pnpm test`
- [x] Gate build passa: `pnpm build`

**Tests**: integration
**Gate**: full

**Commit**: `feat(client): route the product path to one listing`
**Status**: done

### Phase 5: Cadastro

### T17: Skill product-register

**What**: `product-register` grava o formato novo e `cadastrar-relogio` deixa de ser a skill que grava.
**Where**: `.agents/skills/product-register/SKILL.md`
**Depends on**: T1
**Reuses**: a confirmação por `sim` sozinho
**Requirement**: VAR-97, VAR-98, VAR-99

**Complexity**: medium

**Complexity rationale**: A skill nova grava anúncio no formato do schema e a skill antiga deixa de ser o caminho de gravação. Não há suíte Vitest; a checagem é o texto contra o spec.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] A skill valida com `ProductSchema`, grava anúncio e não funde anúncios
- [x] `cadastrar-relogio` não permanece como skill de gravação do catálogo
- [x] Nenhuma suíte Vitest executa a skill

**Tests**: none
**Gate**: quick

**Commit**: `feat(skill): register listings with product-register`
**Status**: done

### T18: Insumos do product-scrapper

**What**: O scrapper prepara insumos no formato novo e não grava `product.json`.
**Where**: `.agents/skills/product-scrapper/SKILL.md`
**Depends on**: T17
**Reuses**: o fluxo atual de `info.md` e `media/`
**Requirement**: VAR-100, VAR-101

**Complexity**: low

**Complexity rationale**: O scrapper só descreve insumos no formato novo e continua sem gravar `product.json`. É ajuste de instrução, sem código de produto.

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] A skill descreve insumos no formato de produto, anúncio e variante
- [x] A skill não escreve `product.json` e não funde anúncios
- [x] Nenhuma suíte Vitest executa a skill

**Tests**: none
**Gate**: quick

**Commit**: `docs(skill): prepare listing inputs without writing product.json`

**Status**: done

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 -> T2 -> T3
          T2 -> T4
          T2 -> T5
Phase 2:  T6 -> T7
Phase 3:  T9 -> T10 -> T11
Phase 4:  T12 -> T15 -> T16
          T13 -> T15
          T14 -> T15
Phase 5:  T17 -> T18
```

T8 não tem seta dentro da fase 2. Depende só de T1. T11 também depende de T3, fora desta fase.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 módulo de schema e o teste colado | ✅ Granular |
| T2 | 1 função de fila no módulo de regras | ✅ Granular |
| T3 | 1 conjunto coeso de seção, filtro e card no mesmo módulo | ✅ Granular |
| T4 | 1 função de vista da página no mesmo módulo | ✅ Granular |
| T5 | 1 função de frase e caminho no mesmo módulo | ✅ Granular |
| T6 | 1 função de validação de foto | ✅ Granular |
| T7 | 1 hook de build | ✅ Granular |
| T8 | 1 script de migração | ✅ Granular |
| T9 | 1 componente de rótulo | ✅ Granular |
| T10 | 1 componente de card | ✅ Granular |
| T11 | 1 página | ✅ Granular |
| T12 | 1 componente de mídia | ✅ Granular |
| T13 | 1 componente de faixa | ✅ Granular |
| T14 | 1 componente de seletor | ✅ Granular |
| T15 | 1 página | ✅ Granular |
| T16 | 1 módulo de rota | ✅ Granular |
| T17 | 1 skill | ✅ Granular |
| T18 | 1 skill | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T2 | T2 | ✅ Match |
| T5 | T2 | T2 | ✅ Match |
| T6 | T1 | None dentro da fase | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T1 | None dentro da fase | ✅ Match |
| T9 | T5 | None dentro da fase | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T3, T10 | T10 dentro da fase | ✅ Match |
| T12 | T4 | None dentro da fase | ✅ Match |
| T13 | T4 | None dentro da fase | ✅ Match |
| T14 | T4 | None dentro da fase | ✅ Match |
| T15 | T12, T13, T14 | T12, T13, T14 | ✅ Match |
| T16 | T15 | T15 | ✅ Match |
| T17 | T1 | None dentro da fase | ✅ Match |
| T18 | T17 | T17 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Schema | unit | unit | ✅ OK |
| T2 | Regras | unit | unit | ✅ OK |
| T3 | Regras | unit | unit | ✅ OK |
| T4 | Regras | unit | unit | ✅ OK |
| T5 | Regras | unit | unit | ✅ OK |
| T6 | Prebuild | integration | integration | ✅ OK |
| T7 | Dist | integration | integration | ✅ OK |
| T8 | Migração | integration | integration | ✅ OK |
| T9 | UI | integration | integration | ✅ OK |
| T10 | UI | integration | integration | ✅ OK |
| T11 | UI | integration | integration | ✅ OK |
| T12 | UI | integration | integration | ✅ OK |
| T13 | UI | integration | integration | ✅ OK |
| T14 | UI | integration | integration | ✅ OK |
| T15 | UI | integration | integration | ✅ OK |
| T16 | Rota | integration | integration | ✅ OK |
| T17 | Skill | none | none | ✅ OK |
| T18 | Skill | none | none | ✅ OK |

## Requirement Task Mapping

| Requirement ID | Tasks |
| --- | --- |
| VAR-01 a VAR-23, VAR-26, VAR-102 | T1 |
| VAR-24 | T6 |
| VAR-25 | T7 |
| VAR-27 a VAR-33 | T8 |
| VAR-34 a VAR-37, VAR-39, VAR-41 a VAR-49, VAR-51 a VAR-64 | T3. A home renderiza em T11. O card renderiza em T10 |
| VAR-38 | T3 e T9 |
| VAR-40, VAR-69 a VAR-72 | T2 |
| VAR-50, VAR-74, VAR-80, VAR-81 | T5 e T10 ou T15 |
| VAR-65 a VAR-68, VAR-73, VAR-75 a VAR-79, VAR-82 a VAR-85 | T4. A página renderiza em T15 e T16 |
| VAR-86 a VAR-88, VAR-96 | T13 e T15 |
| VAR-89 a VAR-91 | T12 |
| VAR-92 a VAR-95 | T15 |
| VAR-97 a VAR-99 | T17 |
| VAR-100, VAR-101 | T18 |
