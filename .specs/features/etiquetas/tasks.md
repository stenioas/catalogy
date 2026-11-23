# Etiquetas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/etiquetas/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Test style sampled from `shared/src/catalog/listings.test.ts`, `shared/src/schemas/product.test.ts`, `client/scripts/catalog.test.ts`, `client/scripts/prebuild-catalog.test.ts`, `client/src/routes/catalog-page.test.tsx`, `client/src/routes/watch-page.test.tsx`, `client/src/components/catalog/watch-card.test.tsx`. Commands come from the root, `shared` and `client` `package.json` scripts.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Label schema e resolução | unit | Todos os ramos; 1:1 com LBL-02 a LBL-08 (estrutura) e LBL-15 a LBL-24; edge cases da spec | `shared/src/catalog/labels.test.ts` | `pnpm --filter @catalogo/shared test` |
| Schema de produto | unit | `disabledLabels` e ausência de `offers`, incluindo id malformado | `shared/src/schemas/product.test.ts` | `pnpm --filter @catalogo/shared test` |
| Build do catálogo | unit | Carga feliz, ícone inválido, id ausente, ponte `unmissableOffer`, arquivo inicial | `client/scripts/catalog.test.ts` | `pnpm --filter client exec vitest run scripts/catalog.test.ts` |
| Card e vista | unit | Campanha e ofertas resolvidas, filtro por id, sob encomenda vazio, variante mais barata | `shared/src/catalog/listings.test.ts` | `pnpm --filter @catalogo/shared test` |
| Badge e tarja | unit | `shortText` na badge, `text` na tarja, alturas `h-5` e `h-6` | `client/src/components/catalog/product-badges.test.tsx` | `pnpm --filter client exec vitest run src/components/catalog/product-badges.test.tsx` |
| Card da home | unit | Badge no canto da foto, linha acima do preço, sob encomenda sem etiqueta | `client/src/components/catalog/watch-card.test.tsx` | `pnpm --filter client exec vitest run src/components/catalog/watch-card.test.tsx` |
| Página e barra fixa | unit | Tarja, 8px contra 32px, ofertas na página e na barra, sob encomenda sem etiqueta | `client/src/routes/watch-page.test.tsx` | `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx` |
| Filtros da vitrine | unit | Ordem das pílulas, `acima 20%`, queries `black-friday` e `discount-20`, pílula desabilitada, filtro desconhecido | `client/src/routes/catalog-page.test.tsx` | `pnpm --filter client exec vitest run src/routes/catalog-page.test.tsx` |
| README | unit | A frase dos filtros e a ausência de `offers` por variante como origem da badge | `client/scripts/prebuild-catalog.test.ts` | `pnpm --filter client exec vitest run scripts/prebuild-catalog.test.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tarefas cujo teste cabe em um pacote ou um arquivo Vitest | `pnpm --filter @catalogo/shared test` ou `pnpm --filter client exec vitest run <arquivo>` |
| Full | Tarefa que mexe na página, no card ou no build do client | `pnpm --filter client test` |
| Build | Fim de fase ou última tarefa | `pnpm test && pnpm --filter client build` |

---

## Execution Plan

### Phase 1: Cadastro puro

```
T1 → T3
```

### Phase 2: Build e dados

```
T4 → T5 → T6
```

### Phase 3: Vitrine compartilhada

```
T7 → T8
```

### Phase 4: Tela

```
T9 → T10
T9 → T11
```

### Phase 5: Filtros visíveis

```
T12 → T13
```

---

## Task Breakdown

### Phase 1: Cadastro puro

### T1: Validar labels.json

**Status**: done

**What**: Criar o schema que rejeita id repetido, duas campanhas ligadas, prioridade repetida, gatilho desconhecido, percent fora da faixa e texto vazio.
**Where**: `shared/src/catalog/labels.ts`
**Depends on**: None
**Reuses**: `shared/src/schemas/product.ts`
**Requirement**: LBL-02, LBL-03, LBL-04, LBL-05, LBL-06, LBL-07, LBL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `parseLabels` cobre os critérios acima com valores concretos, inclusive percent 0, 100 e 101
- [x] Várias campanhas com `enabled: false` passam
- [x] Gate check passes: `pnpm --filter @catalogo/shared test`
- [x] Test count: a suíte de `labels.test.ts` passa sem teste apagado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): validate the global label catalog`

---

### T2: Tirar offers da variante

**Status**: done

**What**: Remover `offers` do schema da variante e aceitar `disabledLabels` como lista de ids.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: None
**Reuses**: `OfferSchema` só deixa de ser campo da variante
**Requirement**: LBL-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Variante sem `offers` valida
- [x] `disabledLabels` com id fora do padrão `idPattern` falha
- [x] `disabledLabels` omitido valida
- [x] Gate check passes: `pnpm --filter @catalogo/shared test`
- [x] Test count: os testes de offers OSC que deixam de existir são substituídos por asserções da spec, não apagados para a suíte ficar verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): replace variant offers with disabled label ids`

---

### T3: Resolver campanha e ofertas

**Status**: done

**What**: Implementar `resolveLabels` com sob encomenda vazio, opt-out, uma campanha e uma oferta por categoria.
**Where**: `shared/src/catalog/labels.ts`
**Depends on**: T1
**Reuses**: `truncateReais` e `effectiveAvailability`
**Requirement**: LBL-15, LBL-16, LBL-17, LBL-18, LBL-19, LBL-20, LBL-21, LBL-22, LBL-23, LBL-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Preço 80 em 100 entra no gatilho de 20. Preço 80.1 em 100 fica de fora
- [x] Três ofertas de desconto elegíveis devolvem só a de menor prioridade
- [x] Opt-out do anúncio vale para toda variante. Opt-out da variante vale só para ela
- [x] `on_order` devolve campanha e ofertas vazias
- [x] Exportado em `shared/src/index.ts`
- [x] Gate check passes: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): resolve one campaign and one offer per category`

---

### Phase 2: Build e dados

### T4: Embutir etiquetas no build

**Status**: done

**What**: Ler `labels.json` na carga, validar ícone Lucide e `disabledLabels`, gravar `labels` no módulo gerado e parar de emitir `offers` na ponte `unmissableOffer`.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T1, T2
**Reuses**: `assertOfferIconIsValid` e `writeProductsModule`
**Requirement**: LBL-01, LBL-08, LBL-09, LBL-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Módulo gerado exporta `products` e `labels`
- [x] Ícone inexistente e id de `disabledLabels` ausente falham a carga
- [x] `unmissableOffer: true` não grava `offers`
- [x] Gate check passes: `pnpm --filter client exec vitest run scripts/catalog.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): embed validated labels in the generated catalog`

---

### T5: Publicar o cadastro inicial

**Status**: done

**What**: Gravar `black-friday` e `discount-20` em `labels.json` com os textos, cores e gatilho da spec.
**Where**: `client/public/catalog/labels.json`
**Depends on**: T4
**Reuses**: o schema de T1
**Requirement**: LBL-10, LBL-11, LBL-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo tem as duas etiquetas habilitadas e filtráveis
- [x] `text` e `shortText` de `black-friday` são `Black Friday`
- [x] `discount-20` tem texto `acima 20%`, prioridade 1 e percent 20
- [x] Gate check passes: `pnpm --filter client exec vitest run scripts/catalog.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): add the Black Friday and discount label catalog`

---

### T6: Apagar offers dos produtos

**What**: Remover a chave `offers` de todas as variantes publicadas.
**Where**: `client/public/catalog/products`
**Depends on**: T5
**Reuses**: a carga de T4
**Requirement**: LBL-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Nenhum `product.json` publicado contém `offers`
- [ ] A carga do catálogo real passa
- [ ] Gate check passes: `pnpm --filter client exec vitest run scripts/catalog.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(labels): drop copied offers from published products`

---

### Phase 3: Vitrine compartilhada

### T7: Levar a resolução ao card e à página

**What**: Fazer `homeCards` e `listingByPath` gravarem campanha e ofertas resolvidas, com sob encomenda vazio inclusive no legado.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T3
**Reuses**: `resolveLabels`
**Requirement**: LBL-15, LBL-19, LBL-20, LBL-27, LBL-34

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Card e vista trazem `campaign` e `offers` resolvidos
- [ ] Variante `on_order` chega com os dois vazios
- [ ] Assinaturas recebem `labels`
- [ ] Gate check passes: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): attach resolved labels to cards and listing views`

---

### T8: Filtrar por id de etiqueta

**What**: Trocar o filtro fixo `discount` por ids de etiquetas habilitadas e filtráveis, mantendo a variante mais barata.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T7
**Reuses**: `activeFilter` e `filterHasCards`
**Requirement**: LBL-39, LBL-40, LBL-41, LBL-43

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `filter=discount-20` lista só quem tem essa oferta vencedora
- [ ] `filter=black-friday` lista só quem tem essa campanha
- [ ] Filtro desconhecido devolve `all` sem outra regra
- [ ] O card do filtro é a variante mais barata entre as que passam
- [ ] Gate check passes: `pnpm --filter @catalogo/shared test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): filter the catalog by resolved label id`

---

### Phase 4: Tela

### T9: Desenhar badge e tarja

**What**: Criar a badge da campanha e a tarja com as medidas da spec.
**Where**: `client/src/components/catalog/product-badges.tsx`
**Depends on**: T7
**Reuses**: `OfferIcon` e `OfferRow`
**Requirement**: LBL-25, LBL-28, LBL-29, LBL-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `campaign-badge` mostra `shortText` com `h-5` e `text-xs`
- [ ] `campaign-stripe` mostra `text`, `h-5` abaixo de 768px e `h-6` com `text-sm` a partir de 768px
- [ ] Gate check passes: `pnpm --filter client exec vitest run src/components/catalog/product-badges.test.tsx`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): draw the campaign badge and page stripe`

---

### T10: Mostrar etiquetas no card

**What**: Colocar a badge no canto inferior esquerdo da foto e a linha de ofertas acima do preço.
**Where**: `client/src/components/catalog/watch-card.tsx`
**Depends on**: T9
**Reuses**: `CampaignBadge` e `OfferRow`
**Requirement**: LBL-25, LBL-26, LBL-27

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A badge fica dentro de `watch-card-image`, no canto inferior esquerdo
- [ ] A linha fica acima do preço
- [ ] Card sob encomenda não mostra badge nem linha
- [ ] Gate check passes: `pnpm --filter client exec vitest run src/components/catalog/watch-card.test.tsx`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): show campaign and offers on the home card`

---

### T11: Mostrar tarja e ofertas na página

**What**: Renderizar a tarja entre a barra e o carrossel, ajustar o padding e manter as ofertas na página e na barra fixa.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T9
**Reuses**: `CampaignStripe`, `OfferRow`, `StickyBar`
**Requirement**: LBL-28, LBL-29, LBL-30, LBL-31, LBL-32, LBL-33, LBL-34

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com campanha e largura de pelo menos 768px, a coluna usa 8px acima da foto
- [ ] Sem campanha, a coluna mantém 32px acima da foto
- [ ] A barra fixa mostra as ofertas e não mostra a campanha
- [ ] Sob encomenda não mostra tarja, linha nem oferta na barra
- [ ] Os testes OSC-27 e OSC-28 passam a exigir ausência de etiqueta, sem apagar o caso
- [ ] Gate check passes: `pnpm --filter client test`

**Tests**: unit
**Gate**: full

**Commit**: `feat(labels): show the campaign stripe and offers on the watch page`

---

### Phase 5: Filtros visíveis

### T12: Montar as pílulas pela etiqueta

**What**: Trocar a pílula fixa de 20% pela ordem Todos, etiquetas filtráveis, Feminino, Masculino, Novos, Openbox e Usados.
**Where**: `client/src/routes/catalog-page.tsx`
**Depends on**: T8
**Reuses**: `filterHasCards` e o grupo `Filtros`
**Requirement**: LBL-35, LBL-36, LBL-37, LBL-38, LBL-42

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A fileira mostra Todos, Black Friday, acima 20% e os filtros fixos restantes
- [ ] Pílula sem card fica desabilitada
- [ ] `?filter=discount-20` e `?filter=black-friday` filtram
- [ ] Filtro desconhecido deixa Todos pressionado e não muda a query
- [ ] Gate check passes: `pnpm --filter client exec vitest run src/routes/catalog-page.test.tsx`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(labels): build filter pills from enabled labels`

---

### T13: Atualizar o README

**What**: Documentar a fileira nova e deixar de tratar `offers` por variante como origem da badge.
**Where**: `README.md`
**Depends on**: T12
**Reuses**: `client/scripts/prebuild-catalog.test.ts`
**Requirement**: LBL-44

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O README descreve Todos, Black Friday, acima 20% e os filtros fixos
- [ ] O README não documenta `offers` por variante como origem da badge
- [ ] O teste que trava o texto do README acompanha a frase nova
- [ ] Gate check passes: `pnpm test && pnpm --filter client build`

**Tests**: unit
**Gate**: build

**Commit**: `docs(labels): describe global labels in the catalog readme`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 → T3
Phase 2:  T4 → T5 → T6
Phase 3:  T7 → T8
Phase 4:  T9 → T10
          T9 → T11
Phase 5:  T12 → T13
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Validar labels.json | 1 módulo | ✅ Granular |
| T2: Tirar offers da variante | 1 schema | ✅ Granular |
| T3: Resolver campanha e ofertas | 1 função | ✅ Granular |
| T4: Embutir etiquetas no build | 1 script | ✅ Granular |
| T5: Publicar o cadastro inicial | 1 arquivo | ✅ Granular |
| T6: Apagar offers dos produtos | 1 diretório de dados | ✅ Granular |
| T7: Levar a resolução ao card e à página | 1 módulo | ✅ Granular |
| T8: Filtrar por id de etiqueta | 1 módulo | ✅ Granular |
| T9: Desenhar badge e tarja | 1 componente | ✅ Granular |
| T10: Mostrar etiquetas no card | 1 componente | ✅ Granular |
| T11: Mostrar tarja e ofertas na página | 1 rota | ✅ Granular |
| T12: Montar as pílulas pela etiqueta | 1 rota | ✅ Granular |
| T13: Atualizar o README | 1 documento | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | sem seta de entrada | ✅ Match |
| T2 | None | sem seta de entrada | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T1, T2 | setas só de fase anterior | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T3 | seta de fase anterior | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T7 | seta de fase anterior | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T9 | T9 → T11 | ✅ Match |
| T12 | T8 | seta de fase anterior | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Label schema e resolução | unit | unit | ✅ OK |
| T2 | Schema de produto | unit | unit | ✅ OK |
| T3 | Label schema e resolução | unit | unit | ✅ OK |
| T4 | Build do catálogo | unit | unit | ✅ OK |
| T5 | Build do catálogo | unit | unit | ✅ OK |
| T6 | Build do catálogo | unit | unit | ✅ OK |
| T7 | Card e vista | unit | unit | ✅ OK |
| T8 | Card e vista | unit | unit | ✅ OK |
| T9 | Badge e tarja | unit | unit | ✅ OK |
| T10 | Card da home | unit | unit | ✅ OK |
| T11 | Página e barra fixa | unit | unit | ✅ OK |
| T12 | Filtros da vitrine | unit | unit | ✅ OK |
| T13 | README | unit | unit | ✅ OK |
