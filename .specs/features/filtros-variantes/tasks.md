# Filtros da home e estado na variante — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/filtros-variantes/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Sampled tests: `shared/src/schemas/product.test.ts`, `shared/src/catalog/listings.test.ts`, `client/src/routes/catalog-page.test.tsx`, `client/src/routes/watch-page.test.tsx`, `client/src/components/catalog/axis-selectors.test.tsx`, `client/scripts/catalog.test.ts`, `client/scripts/prebuild-catalog.test.ts`. Commands come from the root, `shared`, and `client` `package.json` scripts. No coverage threshold is configured.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domain (schema, merge, home, ficha) | unit | All branches; 1:1 to the spec ACs of that task; every edge case the task names | `shared/src/**/*.test.ts` | `pnpm --filter @catalogo/shared test` |
| Client script (legacy bridge, merge script) | unit | Key paths plus the failure path that leaves a slug unchanged | `client/scripts/*.test.ts` | `pnpm --filter client exec vitest run scripts/catalog.test.ts` |
| Route UI (home, ficha, selectors) | unit | Happy path, empty filter, invalid query, missing listing | `client/src/**/*.test.tsx` | `pnpm --filter client exec vitest run src/routes/catalog-page.test.tsx src/routes/watch-page.test.tsx src/components/catalog/axis-selectors.test.tsx` |
| Docs and skill text | unit | The asserted phrases in the existing README contract test | `client/scripts/prebuild-catalog.test.ts` | `pnpm --filter client exec vitest run scripts/prebuild-catalog.test.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Shared unit task, or one client test file | `pnpm --filter @catalogo/shared test` or the client `vitest run` path in the task |
| Full | After the catalog JSON changes or a doc assertion changes | `pnpm test` |
| Build | After the last task | `pnpm build` |

---

## Execution Plan

Phases are ordered and run sequentially. Tasks inside a phase run in order.

### Phase 1: Foundation

```
T1 -> T2
```

### Phase 2: Merge function and legacy bridge

```
T3
T4
```

### Phase 3: Read model

```
T5 -> T6
```

### Phase 4: Home and ficha UI

```
T7
T8 -> T9
```

### Phase 5: Publish the catalog and the contract

```
T10
T11 -> T12 -> T13
```

---

## Task Breakdown

### T1: Helper de condição efetiva

**Status**: done

**What**: Criar `effectiveState`, `effectiveAvailability` e `variantKey`.
**Where**: `shared/src/catalog/variant-condition.ts`
**Depends on**: None
**Reuses**: tipos `Product` e `Variant` de `shared/src/schemas/product.ts`
**Requirement**: FILT-01
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Campo `state` ausente devolve `new`
- [ ] Campo `availabilityStatus` ausente devolve `on_order`
- [ ] `variantKey` junta os eixos na ordem do produto, o estado efetivo e a disponibilidade efetiva
- [ ] Gate: `pnpm --filter @catalogo/shared test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): le estado e disponibilidade efetivos da variante`

---

### T2: Schema da variante

**Status**: done

**What**: Mover `state` e `availabilityStatus` para a variante e validar a chave efetiva.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: T1
**Reuses**: `variantKey`, `effectiveState`, `effectiveAvailability`
**Requirement**: FILT-01
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Variante sem os dois campos passa
- [ ] A mesma combinação efetiva no mesmo anúncio falha
- [ ] A mesma combinação de eixos com estado ou disponibilidade diferente passa
- [ ] Preço ausente só passa quando a disponibilidade efetiva é `on_order`
- [ ] `orderable: false` fora de `on_order` falha
- [ ] `on_order` com `state` `used` passa
- [ ] `mainImage` fora de `images` falha
- [ ] O anúncio não declara mais `state` nem `availabilityStatus`
- [ ] Gate: `pnpm --filter @catalogo/shared test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): valida estado e disponibilidade na variante`

---

### T3: Função de fusão

**Status**: done

**What**: Fundir os anúncios de um produto em `main-listing`.
**Where**: `shared/src/catalog/merge-listings.ts`
**Depends on**: T2
**Reuses**: `effectiveState`, `effectiveAvailability`, `ProductSchema`
**Requirement**: FILT-02
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] AD2035: `steel` fica `used` e `available` num único `main-listing`
- [ ] SF741: `sf741-zp` fica `openbox` e `available`; opções que só existiam sob encomenda ficam `new` e `on_order`
- [ ] Air King: `b-no-logo` fica `openbox` e `available`, pela `availabilityStatus` e não pelo id
- [ ] MY-H3-2QZ: `black-steel` fica `used` e `available`
- [ ] A galeria não repete arquivo e segue a ordem `available`, `coming_soon`, `on_order`
- [ ] Anúncio `enabled: false` não contribui quando existe anúncio ligado
- [ ] Todos desligados geram `main-listing` com `enabled: false` e as variantes da prioridade
- [ ] Chave completa repetida fica a primeira do percurso; estados diferentes na mesma disponibilidade ficam os dois
- [ ] A variante vencedora conserva `state`, `price`, `listPrice`, `offers`, `mainImage`, `observations` e `orderable`
- [ ] Especificações de anúncio vêm do primeiro anúncio do percurso que as tiver; as do produto não mudam
- [ ] Gate: `pnpm --filter @catalogo/shared test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): funde anuncios na variante vencedora`

---

### T4: Ponte do JSON legado

**Status**: done

**What**: `normalizeProductJson` emite `main-listing` com a condição na variante.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T2
**Reuses**: `mapLegacyState`
**Requirement**: FILT-01
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Um JSON antigo sem `listings` vira um anúncio `main-listing`
- [ ] `state` e `availabilityStatus` ficam na variante, não no anúncio
- [ ] O resultado passa em `ProductSchema`
- [ ] Gate: `pnpm --filter client exec vitest run scripts/catalog.test.ts` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `fix(catalog): normaliza o JSON legado com condicao na variante`

---

### T5: Filtros do card

**Status**: done

**What**: `homeCards` escolhe anúncios e a variante do card pelo `filter`.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T1
**Reuses**: `canVariantRepresentCard`, `effectiveState`, `effectiveAvailability`
**Requirement**: FILT-03
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `filter` ausente inclui sob encomenda e esconde anúncio `enabled: false`
- [ ] `discount` inclui 80 de 100, exclui 80,1 de 100 e exclui `on_order` mesmo com 80 de 100
- [ ] `female` aceita `female` e `unisex`; `male` aceita `male` e `unisex`
- [ ] `child` e público ausente ficam fora dos dois gêneros
- [ ] `new`, `openbox` e `used` usam o estado efetivo; `defective` fica fora dos três
- [ ] Há no máximo um card por anúncio
- [ ] Todos, Feminino e Masculino usam toda variante representável; os outros filtros usam só as que passam
- [ ] O card mostra o menor preço do conjunto; preços iguais usam `images[0]`
- [ ] Conjunto sem preço usa a capa e omite preço e ofertas
- [ ] O rótulo do card sai da variante escolhida
- [ ] Gate: `pnpm --filter @catalogo/shared test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): filtra a home pela variante`

---

### T6: Resolução da ficha

**Status**: done

**What**: `resolveVariant`, os seletores e `shareMessage` desempatam por `state` e `availability`.
**Where**: `shared/src/catalog/listings.ts`
**Depends on**: T5
**Reuses**: `variantQueue`, `STATE_LABEL`, `AVAILABILITY_LABEL`
**Requirement**: FILT-04
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `v` ausente abre a primeira variante com `orderable` diferente de `false`
- [ ] Se todas têm `orderable: false`, abre a primeira do array
- [ ] `v` com contagem de eixos errada usa o mesmo fallback
- [ ] `state` ou `availability` inválido, ou válido sem casar, é ignorado
- [ ] Entre as que restam, vence `available`, depois `coming_soon`, depois `on_order`
- [ ] Empate nessa disponibilidade abre a primeira do array
- [ ] Seletor Estado ou Disponibilidade só existe quando há mais de um valor efetivo
- [ ] Os ids desses grupos são `variant-state` e `variant-availability`
- [ ] Opção incompatível fica `disabled`
- [ ] `v` continua só com os ids dos eixos
- [ ] A query de link inclui `state` ou `availability` só quando o `v` casa com mais de uma variante
- [ ] `shareMessage` usa os rótulos efetivos e essa query
- [ ] Disponibilidade `on_order` não leva ofertas na view
- [ ] Gate: `pnpm --filter @catalogo/shared test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): resolve a variante por estado e disponibilidade`

---

### T7: Pílulas da home

**What**: Trocar as abas por sete botões em pílula.
**Where**: `client/src/routes/catalog-page.tsx`
**Depends on**: T5
**Reuses**: `Button` de `client/src/components/ui/button.tsx`, `homeCards`
**Requirement**: FILT-03
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A ordem é Todos, 20%+ de desconto, Feminino, Masculino, Novos, Openbox, Usados
- [ ] O grupo tem `aria-label` "Filtros" e um só `aria-pressed`
- [ ] A fileira é `flex-nowrap` com `overflow-x-auto`; o ativo tem fundo primário e `rounded-full`
- [ ] `/` sem `filter` pressiona Todos e não grava `filter`
- [ ] Cada botão grava `discount`, `female`, `male`, `new`, `openbox` ou `used`
- [ ] Pressionar o botão ativo não muda a query
- [ ] `filter` desconhecido, `section` sem `filter`, ou filtro sem card pressiona Todos, mostra os cards de Todos e não reescreve a query
- [ ] Filtro sem card fica `disabled`; Todos continua habilitado enquanto houver card
- [ ] Sem card nenhum, o texto é "Não temos nenhum anúncio ativo."
- [ ] Gate: `pnpm --filter client exec vitest run src/routes/catalog-page.test.tsx` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): troca as abas por filtros em pilula`

---

### T8: Seletores de condição

**What**: Estado e Disponibilidade usam o seletor de texto sem entrar no `v`.
**Where**: `client/src/components/catalog/axis-selectors.tsx`
**Depends on**: T6
**Reuses**: `ListingSelector` e o botão de texto já existente
**Requirement**: FILT-04
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Grupos `variant-state` e `variant-availability` não consomem pedaços de `v`
- [ ] Escolher um deles chama o callback com `state` ou `availability`, sem reescrever os ids dos eixos
- [ ] Opção `disabled` não dispara o callback
- [ ] Gate: `pnpm --filter client exec vitest run src/components/catalog/axis-selectors.test.tsx` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): seleciona estado e disponibilidade fora do v`

---

### T9: Query da ficha

**What**: A ficha lê `state` e `availability` e monta o link que reabre a mesma variante.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T6, T8
**Reuses**: `resolveVariant`, `shareMessage`, `AxisSelectors`
**Requirement**: FILT-04
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os rótulos efetivos aparecem na mesma linha: Novo, Openbox, Usado, Com defeito, Disponível, Chega em breve, Sob encomenda
- [ ] `on_order` esconde o preço, mostra "Preço sob consulta" e esconde as ofertas
- [ ] `orderable: false` mostra "Indisponível"
- [ ] Id de anúncio ausente mostra "Este relógio não está no catálogo."
- [ ] O link de compartilhar reabre a mesma variante
- [ ] Gate: `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): abre a ficha com state e availability na query`

---

### T10: Gravar o catálogo fundido

**What**: Script que funde cada `product.json` e regenera o catálogo compilado.
**Where**: `client/scripts/merge-variant-listings.ts`
**Depends on**: T3, T4
**Reuses**: `mergeListings`, `ProductSchema`, o prebuild de `client/scripts/catalog.ts`
**Requirement**: FILT-02
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Produto que falha no schema não tem o arquivo substituído; o script segue e registra o slug
- [ ] Os quatro produtos nomeados no disco ficam com um `main-listing` e a variante vencedora do spec
- [ ] `client/src/catalog/products.generated.ts` é regenerado a partir desses arquivos
- [ ] Gate: `pnpm test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: full

**Commit**: `feat(catalog): grava um main-listing por produto`

---

### T11: Contrato do relógio

**What**: O contrato descreve a condição na variante e o que o cadastro grava.
**Where**: `docs/contrato-relogio.md`
**Depends on**: T2
**Reuses**: o texto atual do contrato
**Requirement**: FILT-05
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O documento diz que `state` e `availabilityStatus` ficam na variante, são opcionais e na leitura valem `new` e `on_order`
- [ ] O documento diz que `on_order` pode usar estado diferente de `new`
- [ ] O documento diz que product-register grava `main-listing`, `availabilityStatus` `on_order` em cada variante e omite `price`
- [ ] Gate: `pnpm --filter client exec vitest run scripts/prebuild-catalog.test.ts` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `docs(catalog): move estado e disponibilidade para a variante`

---

### T12: README dos filtros

**What**: A seção da home descreve os sete botões e a query `filter`.
**Where**: `README.md`
**Depends on**: T7, T11
**Reuses**: `client/scripts/prebuild-catalog.test.ts`, que já prende frases do README
**Requirement**: FILT-05
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O README descreve Todos, 20%+ de desconto, Feminino, Masculino, Novos, Openbox e Usados
- [ ] O README descreve a query `filter` com `discount`, `female`, `male`, `new`, `openbox` e `used`
- [ ] As asserções de `client/scripts/prebuild-catalog.test.ts` acompanham as frases novas
- [ ] Gate: `pnpm --filter client exec vitest run scripts/prebuild-catalog.test.ts` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: quick

**Commit**: `docs(catalog): descreve os filtros da home`

---

### T13: Skill de cadastro

**What**: product-register grava `main-listing` e `on_order` na variante, sem preço.
**Where**: `.agents/skills/product-register/SKILL.md`
**Depends on**: T12
**Reuses**: o fluxo atual da skill
**Requirement**: FILT-05
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: `product-register`

**Done when**:

- [ ] A skill manda gravar o anúncio `main-listing`
- [ ] Cada variante do cadastro sob encomenda tem `availabilityStatus` `on_order` e não tem `price`
- [ ] Uma asserção em `client/scripts/prebuild-catalog.test.ts` lê essas frases na skill
- [ ] Gate: `pnpm test` sai 0
- [ ] Nenhum teste existente foi apagado ou afrouxado

**Tests**: unit
**Gate**: full

**Commit**: `docs(catalog): cadastra sob encomenda em main-listing`

---

## Phase Execution Map

```
T1 -> T2
T2 -> T3
T2 -> T4
T1 -> T5
T5 -> T6
T5 -> T7
T6 -> T8
T6 -> T9
T8 -> T9
T3 -> T10
T4 -> T10
T2 -> T11
T7 -> T12
T11 -> T12
T12 -> T13
```

Execution is strictly sequential. One task at a time, in phase order: T1, T2, then T3, T4, then T5, T6, then T7, T8, T9, then T10, T11, T12, T13.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Helper de condição efetiva | 1 função no arquivo novo | ✅ Granular |
| T2: Schema da variante | 1 schema | ✅ Granular |
| T3: Função de fusão | 1 função | ✅ Granular |
| T4: Ponte do JSON legado | 1 função | ✅ Granular |
| T5: Filtros do card | 1 função | ✅ Granular |
| T6: Resolução da ficha | 1 arquivo, funções da mesma leitura | ✅ Granular |
| T7: Pílulas da home | 1 página | ✅ Granular |
| T8: Seletores de condição | 1 componente | ✅ Granular |
| T9: Query da ficha | 1 página | ✅ Granular |
| T10: Gravar o catálogo fundido | 1 script | ✅ Granular |
| T11: Contrato do relógio | 1 documento | ✅ Granular |
| T12: README dos filtros | 1 documento | ✅ Granular |
| T13: Skill de cadastro | 1 skill | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | nenhuma seta de entrada | ✅ Match |
| T2 | T1 | T1 -> T2 | ✅ Match |
| T3 | T2 | T2 -> T3 | ✅ Match |
| T4 | T2 | T2 -> T4 | ✅ Match |
| T5 | T1 | T1 -> T5 | ✅ Match |
| T6 | T5 | T5 -> T6 | ✅ Match |
| T7 | T5 | T5 -> T7 | ✅ Match |
| T8 | T6 | T6 -> T8 | ✅ Match |
| T9 | T6, T8 | T6 -> T9 e T8 -> T9 | ✅ Match |
| T10 | T3, T4 | T3 -> T10 e T4 -> T10 | ✅ Match |
| T11 | T2 | T2 -> T11 | ✅ Match |
| T12 | T7, T11 | T7 -> T12 e T11 -> T12 | ✅ Match |
| T13 | T12 | T12 -> T13 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Helper de condição efetiva | Domain | unit | unit | ✅ OK |
| T2: Schema da variante | Domain | unit | unit | ✅ OK |
| T3: Função de fusão | Domain | unit | unit | ✅ OK |
| T4: Ponte do JSON legado | Client script | unit | unit | ✅ OK |
| T5: Filtros do card | Domain | unit | unit | ✅ OK |
| T6: Resolução da ficha | Domain | unit | unit | ✅ OK |
| T7: Pílulas da home | Route UI | unit | unit | ✅ OK |
| T8: Seletores de condição | Route UI | unit | unit | ✅ OK |
| T9: Query da ficha | Route UI | unit | unit | ✅ OK |
| T10: Gravar o catálogo fundido | Client script | unit | unit | ✅ OK |
| T11: Contrato do relógio | Docs and skill text | unit | unit | ✅ OK |
| T12: README dos filtros | Docs and skill text | unit | unit | ✅ OK |
| T13: Skill de cadastro | Docs and skill text | unit | unit | ✅ OK |
