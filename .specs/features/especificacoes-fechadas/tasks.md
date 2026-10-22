# Especificações fechadas — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/especificacoes-fechadas/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. No `AGENTS.md`, `CONTRIBUTING.md`, or lint script. Commands come from the root `package.json`, `shared/package.json`, and `client/package.json`. Samples: `shared/src/schemas/product.test.ts`, `shared/src/money.test.ts`, `client/src/routes/watch-page.test.tsx`, `client/scripts/catalog.test.ts`, `client/scripts/prebuild-catalog.test.ts`, `client/src/sentinel.test.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Schema | unit | All branches; 1:1 to SPEC-01–SPEC-08; empty, whitespace, duplicate, and unknown label covered | `shared/src/schemas/product.test.ts` | `pnpm --filter @catalogo/shared test` |
| Watch page | unit | SPEC-09–SPEC-13; order, outside labels, blank value, color field, http(s) link | `client/src/routes/watch-page.test.tsx` | `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx` |
| Catalog JSON | integration | SPEC-14–SPEC-37; each migrated value and each removed label; prebuild accepts the real catalog | `client/scripts/specification-migration.test.ts` and `client/scripts/prebuild-catalog.test.ts` | `pnpm --filter client test` |
| Skill and README | none | Read the files against SPEC-38–SPEC-43. The spec keeps the skill out of Vitest | `.agents/skills/cadastrar-relogio/SKILL.md`, `README.md` | none |

## Gate Check Commands

> Generated from codebase - confirm before Execute. This repo has no lint script.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After the schema task | `pnpm --filter @catalogo/shared test` |
| Page | After the watch-page task | `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx` |
| Full | After the catalog migration, and again after the page task once the catalog is valid | `pnpm --filter client test` |
| Build | After the last code task | `pnpm build` |

---

## Execution Plan

Phases are ordered and run sequentially. Tasks inside a phase run in order.

### Phase 1: Schema

```
T1
```

### Phase 2: Catalog

```
T2
```

### Phase 3: Page

```
T3
```

### Phase 4: Docs

```
T4 → T5
```

---

## Task Breakdown

### Phase 1: Schema

### T1: Close the specification label list

**What**: Exportar `SPECIFICATION_LABELS` e fazer o `ProductSchema` aceitar só essa lista, sem repetição e sem valor em branco.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: None
**Complexity**: low
**Reuses**: `ProductSchema.superRefine` e `z.enum` já usados para `state`
**Requirement**: SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, SPEC-07, SPEC-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A lista exportada tem as 20 labels na ordem da spec
- [x] `shared/src/index.ts` reexporta a lista
- [x] Produto sem `specifications`, com lista vazia e com subconjunto fora de ordem passa
- [x] Label desconhecida, label repetida e valor `""` ou `"   "` falham
- [x] Gate check passes: `pnpm --filter @catalogo/shared test`
- [x] Nenhum teste existente de `shared` é apagado ou enfraquecido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): close the specification label list`

**Status**: done

---

### Phase 2: Catalog

### T2: Migrate the current catalog specifications

**What**: Aplicar a limpeza combinada e o formato `30m (3 ATM)` nos 11 `product.json`, com teste que confere cada valor da spec.
**Where**: `client/public/catalog/products/`
**Depends on**: T1
**Complexity**: high
**Reuses**: `validateCatalog` em `client/scripts/catalog.ts`
**Requirement**: SPEC-14, SPEC-15, SPEC-16, SPEC-17, SPEC-18, SPEC-19, SPEC-20, SPEC-21, SPEC-22, SPEC-23, SPEC-24, SPEC-25, SPEC-26, SPEC-27, SPEC-28, SPEC-29, SPEC-30, SPEC-31, SPEC-32, SPEC-33, SPEC-34, SPEC-35, SPEC-36, SPEC-37

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cada critério SPEC-14 a SPEC-36 está coberto por `client/scripts/specification-migration.test.ts`
- [x] Descrição, garantia `90 dias.`, `Estado` "Embalagem foi aberta", `Tamanho da caixa` e calibres citados na spec permanecem
- [x] Gate check passes: `pnpm --filter client test`
- [x] Nenhum teste existente do client é apagado ou enfraquecido

**Tests**: integration
**Gate**: full

**Commit**: `fix(catalog): normalize specification labels and water resistance`

**Status**: done

---

### Phase 3: Page

### T3: Show specifications in canonical order

**What**: A ficha ordena as labels canônicas pela lista exportada e mantém label de fora depois delas.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T2
**Complexity**: medium
**Reuses**: `hasText` e `SPECIFICATION_LABELS`
**Requirement**: SPEC-09, SPEC-10, SPEC-11, SPEC-12, SPEC-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `Garantia` antes de `Marca` no array aparece como `Marca` e depois `Garantia`
- [ ] Label fora da lista fica depois das canônicas, na ordem relativa original
- [ ] Valor sem texto não gera linha
- [ ] Cor continua vindo de `color`
- [ ] URL `http://` e `https://` continuam virando o link `Ver anúncio similar` sem mostrar a URL crua
- [ ] Fixtures usam labels canônicas onde o tipo passou a exigi-las
- [ ] Gate check passes: `pnpm --filter client exec vitest run src/routes/watch-page.test.tsx`
- [ ] Gate check passes: `pnpm build`
- [ ] Nenhum teste existente é apagado ou enfraquecido

**Tests**: unit
**Gate**: page

**Commit**: `feat(client): show specifications in canonical order`

---

### Phase 4: Docs

### T4: Teach the registration skill the closed labels

**What**: A skill `cadastrar-relogio` passa a usar as 20 labels, a ordem do schema e as regras de inferência e de água.
**Where**: `.agents/skills/cadastrar-relogio/SKILL.md`
**Depends on**: T1
**Complexity**: medium
**Reuses**: a lista da spec
**Requirement**: SPEC-38, SPEC-39, SPEC-40, SPEC-41, SPEC-42

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] As 20 labels aparecem na ordem exportada
- [ ] `3 bar`, `30 m (3 bar)` e `5 ATM` são gravados como `30m (3 ATM)` ou `50m (5 ATM)` sem pergunta
- [ ] Lug to lug, diâmetro, espessura e calibre nomeado são preenchidos. Comprimento, medida nominal e largura da caixa ficam em branco e geram pergunta
- [ ] A fonte é o texto do operador, não foto nem anúncio novo
- [ ] Água com metros e ATM que não fecham 10 m por 1 ATM gera pergunta
- [ ] Nenhum teste Vitest novo cobre esta skill

**Tests**: none
**Gate**: build

**Commit**: `docs(skill): teach cadastrar-relogio the closed specification labels`

---

### T5: Document the closed labels in the README

**What**: O README diz que a label tem de ser uma das 20 e que a ficha mostra essa ordem.
**Where**: `README.md`
**Depends on**: T4
**Complexity**: low
**Reuses**: o trecho atual de `specifications`
**Requirement**: SPEC-43

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O README nomeia as 20 labels na ordem exportada
- [ ] O README diz que a página mostra essa ordem
- [ ] O README continua dizendo que `color` não é lido de `specifications`

**Tests**: none
**Gate**: build

**Commit**: `docs(readme): document the closed specification labels`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1: T1
Phase 2: T2
Phase 3: T3
Phase 4: T4 → T5
```

Execution is strictly sequential. Five tasks fit one batch, so Execute runs inline. No batch sub-agent.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Close the specification label list | 1 schema file, teste no mesmo arquivo de teste já existente | ✅ Granular |
| T2: Migrate the current catalog specifications | 1 diretório de dados, um teste novo | ✅ Granular |
| T3: Show specifications in canonical order | 1 componente, teste co-localizado | ✅ Granular |
| T4: Teach the registration skill the closed labels | 1 arquivo de skill | ✅ Granular |
| T5: Document the closed labels in the README | 1 arquivo | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | T1 sem seta de entrada | ✅ Match |
| T2 | T1 | Seta entre fases, fora do pareamento intrafase | ✅ Match |
| T3 | T2 | Seta entre fases, fora do pareamento intrafase | ✅ Match |
| T4 | T1 | Seta entre fases, fora do pareamento intrafase | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Close the specification label list | Schema | unit | unit | ✅ OK |
| T2: Migrate the current catalog specifications | Catalog JSON | integration | integration | ✅ OK |
| T3: Show specifications in canonical order | Watch page | unit | unit | ✅ OK |
| T4: Teach the registration skill the closed labels | Skill and README | none | none | ✅ OK |
| T5: Document the closed labels in the README | Skill and README | none | none | ✅ OK |
