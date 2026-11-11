# Ofertas, sob consulta e variantes — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/ofertas-sob-consulta/design.md`
**Status**: Draft

Do T1 a T13, `pnpm test` na raiz pode falhar: o contrato novo e a tela velha não convivem. Cada tarefa fecha só o próprio gate. A T14 é a primeira que exige a suíte inteira e o build verdes.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Commands from the root `package.json`, `shared/package.json`, `client/package.json`, `shared/vitest.config.ts` and `client/vitest.config.ts`. There is no lint or coverage threshold.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Schema | unit | Um teste por OSC-01, OSC-03 a OSC-08 e OSC-10, mais hex inválido, texto vazio e chave `unmissableOffer` | `shared/src/schemas/product.test.ts` | `pnpm --filter @catalogo/shared test` |
| Regras de vitrine e página | unit | Um teste por OSC-02 e OSC-17 a OSC-24, mais borda de empate, `orderable: false` e variante coberta | `shared/src/catalog/listings.test.ts` | `pnpm --filter @catalogo/shared test` |
| Normalizador, migração e ícone | integration | OSC-09 e OSC-11 a OSC-15. JSON inválido ou ícone desconhecido falha. O gerado não contém `unmissableOffer` | `client/scripts/catalog.test.ts`, `client/scripts/prebuild-catalog.test.ts` | `pnpm --filter client exec vitest run scripts/catalog.test.ts scripts/prebuild-catalog.test.ts` |
| Card, preço, ofertas, eixos, página e home | integration | OSC-25 a OSC-46. Caminho feliz, borda e a largura de 919px e 920px. Asserção antiga que o spec troca ganha resultado novo, sem ser apagada | `client/src/**/*.test.tsx` | `pnpm --filter client exec vitest run <arquivo da tarefa>` |
| README | none | O trecho deixa de citar `unmissableOffer` e a badge sobre a foto. Vitest não lê o README | `README.md` | sem Vitest |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Schema, regras puras ou o teste do arquivo do client tocado na tarefa | `pnpm --filter @catalogo/shared test` ou `pnpm --filter client exec vitest run <arquivo>` |
| Full | T14, quando a suíte inteira volta a passar | `pnpm test` |
| Build | Catálogo migrado e prebuild | `pnpm build` |

---

## Execution Plan

Fases em ordem. Dentro da fase, a ordem numérica.

### Phase 1: Contrato e vitrine

```
T1 -> T2 -> T3
```

### Phase 2: Catálogo no disco

```
T4 -> T5 -> T6 -> T7
```

### Phase 3: Tela

```
T8 -> T9 -> T10 -> T11 -> T12 -> T13 -> T14
```

---

## Task Breakdown

### Phase 1: Contrato e vitrine

### T1: Aceitar ofertas e apresentação

**Status**: done

**What**: O schema ganha `presentation` opcional (`image` ou `text`) e `offers` opcional. Hex fora de `#RGB` ou `#RRGGBB`, `text` `""` e `icon` `""` são rejeitados. Lista ausente ou vazia passa. `offers` não altera `price` nem `listPrice`. `shared` não ganha dependência de `lucide-react`. `unmissableOffer` continua aceito até a T3, para `listings.ts` seguir compilando.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: None
**Complexity**: medium
**Reuses**: `VariantSchema` e `AxisSchema`
**Requirement**: OSC-01, OSC-04, OSC-05, OSC-06, OSC-07, OSC-08, OSC-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `presentation` aceita só `image` e `text`
- [x] Oferta sem campo, com texto vazio ou hex inválido é rejeitada
- [x] Oferta ausente ou `[]` passa, e o par de preço permanece
- [x] `shared/package.json` não depende de `lucide-react`
- [x] Gate: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): accept axis presentation and variant offers`

---

### T2: Escolher card e parar de esconder encomenda

**Status**: done

**What**: `listingInSection` em `all` fica só com anúncio que gera card e status `available` ou `coming_soon`. `on-order` mantém todas as variantes. `listingForDisplay` e `coveredVariantKeys` saem, inclusive o export em `shared/src/index.ts`. O card com preço usa o menor `price` entre `orderable !== false`, com empate na ordem de `listing.variants`. O card `on_order` usa `images[0]`, caminho sem `?v=` e `offers` vazio. `CatalogCard` e `OpenListingView` trocam `unmissableOffer` por `offers` e ganham `availabilityStatus`. Eixo ausente vale `text`. O seletor ganha `presentation` e `imageFile` da primeira variante de `variantQueue`.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T1
**Complexity**: high
**Reuses**: `canVariantRepresentCard`, `variantQueue`, `resolveVariant`, `listingPath`
**Requirement**: OSC-02, OSC-17, OSC-18, OSC-19, OSC-20, OSC-21, OSC-22, OSC-23, OSC-24, OSC-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Teste cobre Todos sem `on_order`, Encomendar com a combinação repetida e o link `?v=`
- [x] Teste cobre menor preço, empate pela ordem do arquivo e `orderable: false` fora da escolha
- [x] Card `on_order` não tem `?v=` nem ofertas, e a foto é `images[0]`
- [x] `listingForDisplay` não é exportado
- [x] `availabilityStatus` permanece `on_order` quando o rótulo é Indisponível
- [x] Gate: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): show on-order variants and price the card by the lowest price`

---

### T3: Rejeitar unmissableOffer

**Status**: done

**What**: `VariantSchema` passa a `.strict()` e o campo `unmissableOffer` sai do shape. A chave passa a ser erro do schema.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: T2
**Complexity**: low
**Reuses**: o shape de oferta da T1
**Requirement**: OSC-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Variante com `unmissableOffer` é rejeitada
- [x] Nenhum teste de `shared` ainda grava ou lê esse campo
- [x] Gate: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): reject the unmissableOffer flag`

---

### Phase 2: Catálogo no disco

### T4: Normalizar a oferta legada

**Status**: done

**What**: `normalizeProductJson`, no produto antigo sem `listings`, transforma `unmissableOffer: true` na oferta `OFERTA IMPERDÍVEL` / `Gift` / `#0066cc` / `#ffffff` e não emite a chave. `false` ou ausente não emite `offers`.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T3
**Complexity**: low
**Reuses**: `normalizeProductJson`
**Requirement**: OSC-13, OSC-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste do normalizador cobre `true`, `false` e ausente
- [x] Gate: `pnpm --filter client exec vitest run scripts/catalog.test.ts`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): map the legacy unmissable offer to offers`

---

### T5: Migrar os product.json

**Status**: done

**What**: Cada variante com `unmissableOffer: true` ganha a oferta `Gift` e perde a chave. `false` ou ausente perde a chave e não ganha lista. O prebuild regrava `products.generated.ts` sem `unmissableOffer`.
**Where**: `client/public/catalog/products/`
**Depends on**: T4
**Complexity**: medium
**Reuses**: `validateCatalog` e `writeProductsModule`
**Requirement**: OSC-11, OSC-12, OSC-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Nenhum `product.json` publicado contém `unmissableOffer`
- [x] Variante que era `true` tem exatamente a oferta `OFERTA IMPERDÍVEL`
- [x] `products.generated.ts` não contém `unmissableOffer`
- [x] Gate: `pnpm --filter client exec vitest run scripts/prebuild-catalog.test.ts`

**Tests**: integration
**Gate**: build

**Commit**: `feat(catalog): replace unmissableOffer with the offer row`

---

### T6: Falhar o prebuild com ícone desconhecido

**Status**: done

**What**: `validateCatalog` rejeita `icon` que não é função exportada de `lucide-react` ou cuja forma kebab não existe em `dynamicIconImports`. `Gift` continua válido. `shared` segue sem a dependência.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T5
**Complexity**: medium
**Reuses**: `validateCatalog`
**Requirement**: OSC-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Um catálogo temporário com ícone desconhecido faz `validateCatalog` lançar
- [x] O catálogo publicado continua passando no prebuild
- [x] Gate: `pnpm --filter client exec vitest run scripts/catalog.test.ts scripts/prebuild-catalog.test.ts`

**Tests**: integration
**Gate**: build

**Commit**: `feat(client): reject unknown Lucide icon names during catalog prebuild`

---

### T7: Documentar offers no README

**Status**: done

**What**: O trecho que descreve `unmissableOffer` e a badge sobre a foto passa a descrever `offers` e a fileira no corpo do card.
**Where**: `README.md`
**Depends on**: T6
**Complexity**: low
**Reuses**: a tabela de campos do README
**Requirement**: OSC-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `README.md` não contém `unmissableOffer`
- [x] O README descreve a fileira no corpo do card, não sobre a foto

**Tests**: none
**Gate**: quick

**Commit**: `docs(catalog): document offers instead of the unmissable offer badge`

---

### Phase 3: Tela

### T8: Desenhar a fileira de ofertas

**Status**: done

**What**: `OfferRow` mostra uma badge por oferta, na ordem do array, lado a lado, com quebra de linha. O hex vai em estilo inline, o texto sai como está no JSON e o ícone vem de `dynamicIconImports`. Lista vazia não desenha a fileira. `UnmissableOfferBadge` sai.
**Where**: `client/src/components/catalog/product-badges.tsx`
**Depends on**: T2
**Complexity**: medium
**Reuses**: `Badge` e o raio de 4px
**Requirement**: OSC-30, OSC-31, OSC-32

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste cobre ordem, quebra de linha, texto cru, hex inline e lista vazia
- [x] Gate: `pnpm --filter client exec vitest run src/components/catalog/product-badges.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): render the offer row from variant offers`

---

### T9: Devolver a cor normal ao preço

**Status**: done

**What**: `PriceBlock` perde `unmissableOffer` e a classe `text-destructive`. De, percentual, pix e parcelamento ficam.
**Where**: `client/src/components/catalog/price-block.tsx`
**Depends on**: T8
**Complexity**: low
**Reuses**: o grid `showcase`
**Requirement**: OSC-34

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O preço não muda de cor por causa de oferta
- [x] De, percentual, pix e parcelamento continuam no teste
- [x] Gate: `pnpm --filter client exec vitest run src/components/catalog/price-block.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `fix(client): keep the price color independent from offers`

---

### T10: Trocar o preço do card sob consulta

**Status**: done

**What**: O card deixa de usar `listingForDisplay` e a badge sobre a foto. No card com preço, `OfferRow` fica no corpo, acima do preço, em qualquer largura. No card `on_order`, o bloco de preço sai, entra **Sob consulta** e a fileira não aparece.
**Where**: `client/src/components/catalog/watch-card.tsx`
**Depends on**: T9
**Complexity**: medium
**Reuses**: `OfferRow`, `PriceBlock`, `ProductConditionLine`
**Requirement**: OSC-25, OSC-27, OSC-33

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste do card cobre ofertas acima do preço e **Sob consulta** sem preço, pix ou parcelamento
- [x] A foto não contém a badge
- [x] O teste da home que quebrar com o card novo é atualizado para o resultado do spec
- [x] Gate: `pnpm --filter client exec vitest run src/components/catalog/watch-card.test.tsx src/routes/catalog-page.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): show consult label and move offers into the card body`

---

### T11: Levar ofertas e Sob consulta à barra fixa

**Status**: done

**What**: A barra mostra a fileira da variante acima de **Sob consulta** quando o anúncio é `on_order`. O preço, o pix e o parcelamento ficam ocultos. `orderable: false` mantém **Indisponível**.
**Where**: `client/src/components/catalog/sticky-bar.tsx`
**Depends on**: T10
**Complexity**: medium
**Reuses**: `OfferRow` e `PriceBlock`
**Requirement**: OSC-27, OSC-28, OSC-29

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste cobre **Sob consulta** sem preço e a fileira acima desse texto
- [x] O teste cobre **Indisponível** com o preço oculto
- [x] Gate: `pnpm --filter client exec vitest run src/components/catalog/sticky-bar.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): show consult price and offers in the sticky bar`

---

### T12: Separar eixo de imagem e eixo de texto

**Status**: done

**What**: O seletor mostra `{label}: {value}` e o controle abaixo. `text` quebra linha e não rola. `image` usa miniatura de 64px, rolagem horizontal, a borda e o anel da faixa atual, visível com um único valor. Opção impossível ou indisponível continua visível e desabilitada. Trocar a opção habilitada continua trocando a variante.
**Where**: `client/src/components/catalog/axis-selectors.tsx`
**Depends on**: T11
**Complexity**: high
**Reuses**: `Button` e o estado `disabled` / `unavailable`
**Requirement**: OSC-41, OSC-42, OSC-43, OSC-44, OSC-45

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste cobre miniatura de 64px, um único valor, badges que quebram linha e opção desabilitada
- [x] O rótulo usa o `value`, não o `alias`
- [x] Gate: `pnpm --filter client exec vitest run src/components/catalog/axis-selectors.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): present each axis as image or text`

---

### T13: Reordenar a página e remover a faixa

**Status**: done

**What**: Abaixo de 920px a ordem é identidade, mídia, ofertas, preço ou **Sob consulta**, eixos. De 920px em diante a mídia fica à esquerda e a direita segue identidade, ofertas, preço ou **Sob consulta**, eixos, descrição e compartilhar. Saem a linha do nome da variante, a repetição do eixo acima do preço e `variant-strip.tsx`. Anúncio `on_order` mostra **Sob consulta** sem preço, com a fileira acima quando houver ofertas.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T12
**Complexity**: high
**Reuses**: `ProductMedia`, `OfferRow`, `PriceBlock`, `AxisSelectors`
**Requirement**: OSC-27, OSC-28, OSC-29, OSC-35, OSC-36, OSC-37, OSC-38, OSC-39, OSC-40, OSC-46

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste da página cobre 919px e 920px, **Sob consulta**, **Indisponível** e a ausência da faixa
- [x] `variant-strip.tsx` e o teste dele não existem
- [x] Gate: `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(client): place price before the axes and drop the variant strip`

---

### T14: Abrir Encomendar quando só há sob consulta

**Status**: done

**What**: Com o catálogo só de anúncios `on_order`, a aba **Todos** não mostra card e fica desabilitada. A home abre **Encomendar**.
**Where**: `client/src/routes/catalog-page.test.tsx`
**Depends on**: T13
**Complexity**: medium
**Reuses**: o fallback já existente em `catalog-page.tsx`
**Requirement**: OSC-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste abre a home só com `on_order` e encontra **Encomendar** selecionada e **Todos** desabilitada
- [x] Gate: `pnpm test`
- [x] Gate: `pnpm build`

**Tests**: integration
**Gate**: full

**Commit**: `test(client): open Encomendar when every listing is on order`

---

## Phase Execution Map

```
Phase 1 -> Phase 2 -> Phase 3

Phase 1:  T1 -> T2 -> T3
Phase 2:  T4 -> T5 -> T6 -> T7
Phase 3:  T8 -> T9 -> T10 -> T11 -> T12 -> T13 -> T14
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Aceitar ofertas e apresentação | 1 schema | ✅ Granular |
| T2: Escolher card e parar de esconder encomenda | 1 módulo | ✅ Granular |
| T3: Rejeitar unmissableOffer | 1 schema | ✅ Granular |
| T4: Normalizar a oferta legada | 1 função | ✅ Granular |
| T5: Migrar os product.json | os JSON do catálogo | ✅ Granular |
| T6: Falhar o prebuild com ícone desconhecido | 1 função | ✅ Granular |
| T7: Documentar offers no README | 1 documento | ✅ Granular |
| T8: Desenhar a fileira de ofertas | 1 componente | ✅ Granular |
| T9: Devolver a cor normal ao preço | 1 componente | ✅ Granular |
| T10: Trocar o preço do card sob consulta | 1 componente | ✅ Granular |
| T11: Levar ofertas e Sob consulta à barra fixa | 1 componente | ✅ Granular |
| T12: Separar eixo de imagem e eixo de texto | 1 componente | ✅ Granular |
| T13: Reordenar a página e remover a faixa | 1 página | ✅ Granular |
| T14: Abrir Encomendar quando só há sob consulta | 1 teste de rota | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | sem seta de entrada | ✅ Match |
| T2 | T1 | T1 -> T2 | ✅ Match |
| T3 | T2 | T2 -> T3 | ✅ Match |
| T4 | T3 | T3 fica na fase anterior | ✅ Match |
| T5 | T4 | T4 -> T5 | ✅ Match |
| T6 | T5 | T5 -> T6 | ✅ Match |
| T7 | T6 | T6 -> T7 | ✅ Match |
| T8 | T2 | T2 fica na fase anterior | ✅ Match |
| T9 | T8 | T8 -> T9 | ✅ Match |
| T10 | T9 | T9 -> T10 | ✅ Match |
| T11 | T10 | T10 -> T11 | ✅ Match |
| T12 | T11 | T11 -> T12 | ✅ Match |
| T13 | T12 | T12 -> T13 | ✅ Match |
| T14 | T13 | T13 -> T14 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Aceitar ofertas e apresentação | Schema | unit | unit | ✅ OK |
| T2: Escolher card e parar de esconder encomenda | Regras de vitrine e página | unit | unit | ✅ OK |
| T3: Rejeitar unmissableOffer | Schema | unit | unit | ✅ OK |
| T4: Normalizar a oferta legada | Normalizador, migração e ícone | integration | integration | ✅ OK |
| T5: Migrar os product.json | Normalizador, migração e ícone | integration | integration | ✅ OK |
| T6: Falhar o prebuild com ícone desconhecido | Normalizador, migração e ícone | integration | integration | ✅ OK |
| T7: Documentar offers no README | README | none | none | ✅ OK |
| T8: Desenhar a fileira de ofertas | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
| T9: Devolver a cor normal ao preço | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
| T10: Trocar o preço do card sob consulta | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
| T11: Levar ofertas e Sob consulta à barra fixa | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
| T12: Separar eixo de imagem e eixo de texto | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
| T13: Reordenar a página e remover a faixa | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
| T14: Abrir Encomendar quando só há sob consulta | Card, preço, ofertas, eixos, página e home | integration | integration | ✅ OK |
