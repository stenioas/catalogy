# Catalog Layout Refactor Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Design**: [design.md](design.md), aprovado em conversa.
**Spec**: [spec.md](spec.md), 73 critérios aprovados.
**Status**: Execução autorizada pelo operador via tlc-task-orchestrator-codex; um worker por tarefa, em sequência.

Uma tarefa entrega um componente, uma função ou um arquivo de documentação. Testes e migrações dos harnesses acompanham a entrega; não são adiados para outra tarefa. As fases e as tarefas executam sequencialmente. Adaptadores temporários de T10 e T12 mantêm cada commit verificável e são removidos por T14 e T15.

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: README.md, package.json, client/package.json, shared/package.json, client/vitest.config.ts e shared/vitest.config.ts. Não há AGENTS.md aplicável, CONTRIBUTING ou regra de percentual mínimo localizada. Aplicar cobertura forte por AC e casos de borda. Amostras: product.test.ts, catalog.test.ts, carousel.test.tsx, gallery.test.tsx, sticky-bar.test.tsx, watch-card.test.tsx, watch-page.test.tsx, catalog-page.test.tsx e motion.test.ts. Contagens textuais de it/it.each não representam o total expandido de testes.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Contrato ProductSchema | unit + integration | ACs de color e entradas inválidas; loader preserva campo e produtos antigos continuam válidos | shared/src/schemas/product.test.ts; client/scripts/catalog.test.ts | pnpm --filter @catalogo/shared test; pnpm --filter client test |
| Geometria pura | unit | Cada ramo e borda; resultados numéricos do design; precisão de 1 px CSS | client/src/components/catalog/zoom-geometry.test.ts | pnpm --filter client exec vitest run src/components/catalog/zoom-geometry.test.ts |
| Componentes de mídia/modal/barra | integration | Happy path, limites, foto única, estado/foco, ponteiros e troca de breakpoint; preservar regressões existentes | client/src/components/catalog/*.test.tsx | pnpm --filter client test |
| Vitrine e página | integration + browser | Conteúdo e navegação por AC; renderização/overflow/ordem real nas larguras e temas aprovados | client/src/routes/*.test.tsx; client/src/components/catalog/watch-card.test.tsx | pnpm --filter client test; revisão em navegador |
| Identidade e geometria visual | browser | 32 combinações de rota/largura/tema, recorte correspondente, frame contido, desktop da vitrine preservado | evidências em .specs/features/catalog-layout-refactor/ | pnpm --filter client dev e navegador disponível |
| Documentação e skill de cadastro | none | Conferência de contrato e instruções; nenhum teste automatizado novo | README.md; .agents/skills/cadastrar-relogio/SKILL.md | Documentation gate |
| Relatório de revisão | browser + regression | Evidência visual, saída real de testes/build e nenhum produto alterado | ui-review.md | Build gate e navegador |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Função pura de geometria | pnpm --filter client exec vitest run src/components/catalog/zoom-geometry.test.ts |
| Full | Contrato, componente ou integração | pnpm test |
| Build | Fechamento de cada fase e revisão final | pnpm test; pnpm build |
| Documentation | Documentação ou skill sem código de produto | git diff --check e revisão manual do texto contra spec/contrato |

Executar os comandos separados e exigir exit 0 em cada um. Não há script lint/format/typecheck publicado nos manifests consultados; não inventar um gate inexistente. Build é o Vite configurado no projeto e não deve ser descrito como prova de typecheck completo.

Antes da primeira mudança de código, capturar baseline real de pnpm test e pnpm build e capturas da vitrine desktop nos temas e larguras de referência. Se a baseline falhar, diagnosticar e separar falha preexistente de regressão; não desabilitar testes.

**Ajuste autorizado pelo operador em 2026-10-15**: capturas visuais podem ser exibidas na conversa, sem gravação de PNGs locais. Registrar em `.specs/features/catalog-layout-refactor/` as evidências textuais com rota, viewport, tema observado e resultado. A autorização dispensa somente a persistência dos PNGs; manter as verificações visuais e registrar limitações reais. Não repetir a gravação rejeitada por navegação data: nem contornar a restrição por outra superfície.

Contagens mínimas abaixo são cenários novos ou explicitamente revalidados por tarefa. Registrar também testes expandidos efetivamente executados (passed/failed/skipped) e a diferença para a baseline. Não reduzir contagem silenciosamente: cenários migrados precisam de origem→destino identificada. Zero cenários novos em tarefas de remoção significa preservação de cobertura existente, não dispensa de testes.

## Execution Plan

Cada fase termina com Build aprovado. Dependências indicam pré-requisitos de código; a ordem numérica também é a ordem de execução, mesmo entre tarefas independentes.

### Phase 1: Contrato e vitrine

Ordem: T1, T2, T3, T4, T5, T6.

### Phase 2: Geometria e apresentações de mídia

Ordem: T7, T8, T9, T10.

### Phase 3: Estado compartilhado e integração

Ordem: T11, T12, T13, T14, T15.

### Phase 4: Revisão visual e regressão

Ordem: T16.

### Lotes propostos

| Batch | Whole phases | Tasks | Worker policy |
| --- | --- | --- | --- |
| 1 | Phase 1 | T1–T6, 6 tarefas | Um executor, em sequência. |
| 2 | Phase 2 | T7–T10, 4 tarefas | Inicia após o lote 1 e seu Build passarem. |
| 3 | Phase 3 e Phase 4 | T11–T16, 6 tarefas | Inicia após o lote 2; Phase 3 termina antes da revisão visual. |

São 16 tarefas em três lotes com fases inteiras. Oferecer execução com subagentes antes de Execute; só despachar executores após aceite. Também é possível executar os mesmos lotes no agente principal. Não há execução paralela de tarefas nem permissão de push/deploy.

Após o último commit, um Verifier novo executa automaticamente a checagem por AC e o sensor de discriminação em cópia isolada. Ele escreve validation.md com evidências file:line, veredito e diff range; defeitos viram tarefas de correção e nova verificação, até três iterações. O gate validate_state.py deve passar antes de declarar conclusão. Verifier não é um executor de lote e sua revisão não é opcional.

## Task Breakdown

### Phase 1: Contrato e vitrine

### T1: Adicionar color ao contrato de produto

**What**: Adicionar color opcional como string sem transformação e manter os produtos atuais válidos.

**Where**: `shared/src/schemas/product.ts`

**Depends on**: None

**Reuses**: ProductSchema, Product inferido e testes do loader existentes.

**Requirement**: CATREF-52, CATREF-53, CATREF-61

**Complexity**: low

**Complexity rationale**: Extensão aditiva do schema com regra explícita e reaproveitamento dos testes de contrato e loader; sem migração dos produtos.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven.

**Done when**:

- [x] Entrega verificada: Adicionar color opcional como string sem transformação e manter os produtos atuais válidos.
- [x] No schema, verificar ausência, texto, vazio, espaços, null, número, booleano, array e objeto. No loader, verificar preservação de color em fixture e manutenção do JSON real; sem editar produtos.
- [x] Pelo menos 9 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: unit + integration

**Gate**: Full

**Commit**: `feat(catalog): add optional product color contract`

**Status**: done

#### T1 execution record

- **Baseline**: see [baseline.md](baseline.md). `pnpm test` passed 299/299, and `pnpm build` passed before code changes.
- **Implementation**: added `color: z.string().optional()` without normalization. Product JSON files were not edited.
- **Gate**: `pnpm test` passed 309 tests, 0 failed, 0 skipped (64 shared + 1 client prebuild + 244 client), 10 more than baseline.
- **Check A — coverage**:

| Done-when criterion / requirement | Evidence and assertion | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| CATREF-52: color is optional, string-valued, and unchanged | `shared/src/schemas/product.test.ts:172` — `expect(result.data).not.toHaveProperty('color')`; `:188` — `expect(result.data.color).toBe(color)` for text, empty, and spaces | Omitted stays omitted; each accepted string is preserved exactly | Yes |
| CATREF-53: present non-string values are rejected | `shared/src/schemas/product.test.ts:200` — `expect(ProductSchema.safeParse({ ...baseProduct, color }).success).toBe(false)` for null, number, boolean, array, and object | Every listed non-string value fails parsing | Yes |
| Loader preserves color and existing public products remain valid | `client/scripts/catalog.test.ts:134` — `expect(products[0].color).toBe(color)`; `:142` — `expect(emittedProducts[0].color).toBe(color)`; `:281` — `expect(() => validateCatalog(catalogDir)).not.toThrow()`; `:282` — `expect(Array.isArray(validateCatalog(catalogDir))).toBe(true)`; final diff lists no changed product JSON | The fixture value survives parse and serialization; current product JSON remains valid and unmodified | Yes |
| Nine requested schema inputs plus loader preservation are covered | The nine parameterized/omission scenarios above plus the fixture scenario at `client/scripts/catalog.test.ts:115` | At least nine scenarios beyond regressions; 10 added and revalidated scenarios | Yes |

- **Check B — non-shallow**: success assertions verify exact accepted string values; invalid assertions check parse rejection; loader assertions inspect both parsed and emitted field values. No call-count-only checks.
- **Check C — reverse mapping**:

| Evidence and assertion | Maps to | Keep? |
| --- | --- | --- |
| `shared/src/schemas/product.test.ts:177` — `expect(result.data).not.toHaveProperty('color')` | CATREF-52, absent optional field | Yes |
| `shared/src/schemas/product.test.ts:188` — `expect(result.data.color).toBe(color)` | CATREF-52, exact preservation for text, empty, and spaces | Yes |
| `shared/src/schemas/product.test.ts:200` — parse success is false | CATREF-53, rejection for all specified invalid types | Yes |
| `client/scripts/catalog.test.ts:134` and `:142` — parsed and emitted color equal the fixture value | CATREF-52 and loader preservation in T1 Done when | Yes |
| `client/scripts/catalog.test.ts:281` — `expect(() => validateCatalog(catalogDir)).not.toThrow()`; `:282` — `expect(Array.isArray(validateCatalog(catalogDir))).toBe(true)` | CATREF-61, existing products remain valid | Yes |

- **Check D — guidelines**: followed the existing Vitest file locations and package commands from the Test Coverage Matrix; no additional test guideline or coverage threshold was found.
- **Adequacy verdict**: all T1 criteria have direct assertion evidence, each assertion maps to CATREF-52, CATREF-53, CATREF-61, or a T1 Done-when criterion, and no spec deviation was needed.

### T2: Documentar color no README

**What**: Incluir color na tabela de campos como texto livre opcional, origem exclusiva do resumo e orientação para evitar repetição em specifications.

**Where**: `README.md`

**Depends on**: T1

**Reuses**: Tabela atual de campos e explicação de cadastro.

**Requirement**: CATREF-60, CATREF-61

**Complexity**: low

**Complexity rationale**: Alteração textual localizada, com contrato e orientação de preenchimento já definidos.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven.

**Done when**:

- [x] Entrega verificada: Incluir color na tabela de campos como texto livre opcional, origem exclusiva do resumo e orientação para evitar repetição em specifications.
- [x] Revisão do texto contra CATREF-60 e contrato; nenhum teste automatizado novo para documentação.
- [x] Pelo menos 0 cenários novos; cobertura atual preservada ou, para documentação, revisão manual registrada.
- [x] Gate Documentation aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Revisão manual**: README.md:44,51 — `color` é opcional e livre, alimenta somente a cor do resumo e não deve ser repetido em `specifications`; nenhum JSON de produto foi alterado. `git diff --check` aprovado; 0 testes automatizados novos.

**Tests**: none

**Gate**: Documentation

**Commit**: `docs(catalog): document optional product color`

**Status**: done

### T3: Atualizar a skill de cadastro para color

**What**: Incluir color opcional na leitura completa e no cadastro, omitindo ausente/vazio e evitando repetição em specifications; preservar a confirmação de cadastro existente.

**Where**: `.agents/skills/cadastrar-relogio/SKILL.md`

**Depends on**: T1

**Reuses**: Fluxo atual de leitura e confirmação do cadastrar-relogio.

**Requirement**: CATREF-60, CATREF-61

**Complexity**: low

**Complexity rationale**: Atualização localizada das instruções de cadastro; preserva o fluxo e a confirmação existentes.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, skill-creator.

**Done when**:

- [x] Entrega verificada: Incluir color opcional na leitura completa e no cadastro, omitindo ausente/vazio e evitando repetição em specifications; preservar a confirmação de cadastro existente.
- [x] Revisar tabela e instruções contra o contrato; não cadastrar produto nem alterar outros campos da skill nesta tarefa.
- [x] Pelo menos 0 cenários novos; cobertura atual preservada ou, para documentação, revisão manual registrada.
- [x] Gate Documentation aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Revisão manual**: `.agents/skills/cadastrar-relogio/SKILL.md:76-80,110-118` — `color` é opcional, texto livre com uma única cor; ausente e `""` são omitidos, a regra existente preserva strings só com espaços, a leitura completa inclui `color` se houver, e a cor não é inferida nem repetida em `specifications`. A confirmação exata `sim` e os demais campos da skill permanecem intactos. Nenhum produto foi cadastrado ou editado. `git diff --check` e revisão manual passaram; 0 testes automatizados novos.

**Validação auxiliar**: `quick_validate.py` apontou `<`/`>` na descrição preexistente do frontmatter (`client/public/catalog/products/<slug>/`). O campo ficou inalterado por estar fora do escopo T3.

**Tests**: none

**Gate**: Documentation

**Commit**: `docs(skills): support optional product color in registration`

**Status**: done

### T4: Criar WantIconLink

**What**: Exportar ação compacta com SVG reconhecível de WhatsApp, 44 × 44 px e nome acessível Enviar no WhatsApp, compartilhando waUrl com WantLink.

**Where**: `client/src/components/catalog/want-link.tsx`

**Depends on**: None

**Reuses**: waUrl, Button asChild e WantLink.

**Requirement**: CATREF-08, CATREF-09, CATREF-11, CATREF-67, CATREF-71

**Complexity**: low

**Complexity rationale**: Componente pequeno, sem estado, que reutiliza waUrl e Button; requisitos de acessibilidade e dimensões explícitos.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices, impeccable.

**Done when**:

- [x] Entrega verificada: Exportar ação compacta com SVG reconhecível de WhatsApp, 44 × 44 px e nome acessível Enviar no WhatsApp, compartilhando waUrl com WantLink.
- [x] Verificar nome acessível, ícone decorativo, href idêntico ao textual, ausência de telefone e target/rel existentes; manter os cenários do WantLink textual.
- [x] Pelo menos 5 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `feat(catalog): add accessible whatsapp icon link`

**Status**: done

#### T4 execution record

- **Implementation review**: `client/src/components/catalog/want-link.tsx:29` exports `WantIconLink` with the same `slug`/`title` inputs as `WantLink`; `:31` uses `size-11` (44 × 44 px); `:33` reuses `waUrl`, `:34` opens a new tab, `:35` sets `noopener noreferrer`, and `:36` names the link “Enviar no WhatsApp”; `:38-40` contain the decorative WhatsApp SVG. The SVG paths were reviewed as the recognizable WhatsApp mark. Existing `WantLink` behavior and its tests remain intact.
- **Gate**: `pnpm test` passed 314 tests, 0 failed, 0 skipped (64 shared + 1 client prebuild + 249 client), +5 versus T1's 309-test gate. The worker reported this successful run before restart; the code diff has not changed since.
- **Check A — coverage**:

| Done-when criterion / requirement | Evidence and assertion | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| CATREF-09: accessible name, decorative icon and minimum 44 × 44 px target | `client/src/components/catalog/want-link.test.tsx:95` — `screen.getByRole('link', { name: LINK_NAME })`; `:99` — `expect(icon?.getAttribute('aria-hidden')).toBe('true')`; `:100` — `expect(link.textContent).toBe('')`; `:107` — `expect(link.className).toMatch(/\bsize-11\b/)` | The link is named “Enviar no WhatsApp”, its SVG is decorative with no visible text, and `size-11` supplies the square 44 px target | Yes |
| CATREF-67: compact and textual actions share the same wa.me URL and message | `client/src/components/catalog/want-link.test.tsx:123` — `expect(href).toBe(textLink.getAttribute('href'))`; `:124` — `expect(href).toBe(waUrl(slug, title))`; `:125` — `expect(decodeWaText(href!)).toBe(...)` | Both actions use the exact WhatsApp message and product URL required by the spec | Yes |
| CATREF-11: action opens only WhatsApp sharing, without a phone number or nested product link | `client/src/components/catalog/want-link.test.tsx:135` — hostname is `wa.me`; `:136` — pathname is `/`; `:137` — `text` is present; `:138` — `screen.getAllByRole('link')` has length 1 | The destination has no phone number in its path and the compact action contains no nested product link | Yes |
| T4 Done when: preserve new-tab protections | `client/src/components/catalog/want-link.test.tsx:145` — `target` is `_blank`; `:146` — `rel` is `noopener noreferrer`; existing textual-link assertions remain at `:53` and `:54` | Both WhatsApp actions retain the existing safe new-tab attributes | Yes |
| T4 Done when: add at least five scenarios and retain WantLink regressions | Five new cases start at `client/src/components/catalog/want-link.test.tsx:93`, `:103`, `:111`, `:130`, and `:141`; existing textual-link tests start at `:26`, `:31`, `:41`, `:50`, `:57`, and `:70` | Five new cases run alongside the preexisting WantLink cases; the full gate reports 314 passing tests | Yes |

- **Check B — non-shallow**: assertions query the link by accessible name and inspect its attributes, destination, sibling-link count and exact message. The target-size assertion checks the fixed Tailwind `size-11` utility. No call-count-only or tautological assertion was added.
- **Check C — reverse mapping**:

| Evidence and assertion | Maps to | Keep? |
| --- | --- | --- |
| `client/src/components/catalog/want-link.test.tsx:95`, `:99`, `:100` — accessible role/name, decorative SVG, empty visible text | CATREF-09 and T4 icon/accessibility criterion | Yes |
| `client/src/components/catalog/want-link.test.tsx:107` — `size-11` square target | CATREF-09 and T4 44 × 44 px criterion | Yes |
| `client/src/components/catalog/want-link.test.tsx:123`, `:124`, `:125` — URL equality and decoded message | CATREF-67 | Yes |
| `client/src/components/catalog/want-link.test.tsx:135`, `:136`, `:137`, `:138` — host, path, text query and one link | CATREF-11 and CATREF-67 | Yes |
| `client/src/components/catalog/want-link.test.tsx:145`, `:146` — target and rel | T4 Done when: preserve target/rel | Yes |

- **Check D — guidelines**: followed the integration test location and `pnpm test` command from the Test Coverage Matrix and Gate Check Commands; existing Vitest conventions remain unchanged.
- **Adequacy verdict**: T4's five new cases cover the component's accessible action, shared WhatsApp destination/message, standalone link structure and new-tab attributes; all are requirement- or Done-when-backed. CATREF-08's responsive placement over the photo remains assigned to T6.
- **No SPEC_DEVIATION**; no code or adjacent tests were changed during closure.

### T5: Permitir quebra do preço na apresentação compacta

**What**: Oferecer quebra da linha de preço anterior/desconto somente onde a vitrine mobile precisa, mantendo todos os valores e a apresentação desktop.

**Where**: `client/src/components/catalog/price-block.tsx`

**Depends on**: None

**Reuses**: PriceBlock e regras monetárias existentes.

**Requirement**: CATREF-04, CATREF-63, CATREF-72

**Complexity**: low

**Complexity rationale**: Ajuste localizado de apresentação, sem mudar cálculos monetários; preservação do desktop delimitada.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices.

**Done when**:

- [x] Entrega verificada: Oferecer quebra da linha de preço anterior/desconto somente onde a vitrine mobile precisa, mantendo todos os valores e a apresentação desktop.
- [x] Preservar os testes de preço/pix/parcelamento/desconto; incluir preço anterior longo e desconto presente/ausente. A quebra real no navegador fica para T6; classes não foram tratadas como prova visual.
- [x] Pelo menos 4 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `fix(catalog): allow compact price wrapping without truncation`

**Status**: done

**Execution evidence**: `wrapListPriceOnMobile` is opt-in and defaults to false. In compact mode, the previous-price row can wrap below `md` and returns to nowrap at `md`; BRL formatting, discount calculation, Pix and installment copy are unchanged. `PriceBlock` callers outside the compact card keep the default presentation. T6 must enable the prop in `WatchCard` and inspect the actual wrap in a browser.

- New scenarios: 4 in `price-block.test.tsx` (20 tests in that file after the change).
- Full gate: `pnpm test` passed, 318 total (64 shared + 1 prebuild + 253 client), 0 failed, 0 skipped. Baseline was 314, so the suite gained 4 cases.
- Browser layout verification: assigned to T6 as specified; T5 makes no visual-layout claim from jsdom classes.

**Test Adequacy Review**

*Check A — Sufficient coverage:*

| Done-when criterion / spec AC | `file:line` + assertion expression | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| Allow compact wrapping and restore nowrap at desktop width | `client/src/components/catalog/price-block.test.tsx:139` — `expect(row?.className).toMatch(/\bflex-wrap\b/)`; `:141` — `expect(row?.className).toMatch(/\bmd:flex-nowrap\b/)` | Compact price may wrap; desktop row stays on one line | Yes; T6 verifies rendered layout in browser |
| Keep default PriceBlock presentation unchanged outside the compact card | `client/src/components/catalog/price-block.test.tsx:149` — `expect(row?.className).toMatch(/\bflex-nowrap\b/)`; `:151` — `expect(row?.className).not.toMatch(/\bflex-wrap\b/)` | Callers that do not opt in remain nowrap | Yes |
| Preserve complete long previous price with a discount | `client/src/components/catalog/price-block.test.tsx:161` — `expect(screen.getByTestId('price-list').textContent).toBe('De R$ 123.456.789,99')`; `:162` — `expect(screen.getByTestId('price-badge').textContent).toBe('−99%')` | Full previous amount and integer discount remain visible | Yes |
| Preserve complete long previous price without a discount seal | `client/src/components/catalog/price-block.test.tsx:172` — `expect(screen.getByTestId('price-list').textContent).toBe('De R$ 123.456.789,99')`; `:173` — `expect(screen.queryByTestId('price-badge')).toBeNull()` | Previous price remains intact and a sub-1% discount has no seal | Yes |
| Preserve BRL, Pix, installments and discount behavior | `client/src/components/catalog/price-block.test.tsx:61` — `expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')`; `:70` — `expect(installments.textContent).toBe('ou em até 12x com juros')`; `:79` — `expect(pix.textContent).toBe('no pix')`; `:99` — `expect(screen.getByTestId('price-badge').textContent).toBe('−17%')`; `:110` — `expect(screen.queryByTestId('price-badge')).toBeNull()` | Existing monetary values, copy, and discount threshold remain unchanged | Yes; all existing tests preserved and passed |

*Check C — Necessary coverage:*

| `file:line` + assertion expression | Maps to | Keep? |
| --- | --- | --- |
| `client/src/components/catalog/price-block.test.tsx:139` — compact `flex-wrap` assertion | T5 compact-only wrapping | Yes |
| `client/src/components/catalog/price-block.test.tsx:149` — default `flex-nowrap` assertion | T5 desktop and non-card preservation | Yes |
| `client/src/components/catalog/price-block.test.tsx:161` — exact long reference amount | CATREF-04 / CATREF-63, no truncation | Yes |
| `client/src/components/catalog/price-block.test.tsx:172` — exact long reference amount with no seal | T5 discount absent edge case | Yes |
| `client/src/components/catalog/price-block.test.tsx:61` — exact BRL value; `:70` installment text; `:79` Pix text; `:99` discount value; `:110` absent badge | CATREF-63 | Yes; preserved regression assertions |

- Check A: all T5 criteria have assertion or gate evidence; browser rendering is explicitly assigned to T6.
- Check B: assertions check responsive classes and exact rendered values; no tautologies or assertion-free tests.
- Check C: all four new tests and referenced preserved tests map to T5 or CATREF-04/CATREF-63.
- Check D: followed Vitest locations and `pnpm test` from the Test Coverage Matrix; no coverage threshold is configured.

**Verdict**: Adequate for T5; all four new scenarios and existing price regressions pass. Actual visual wrapping remains a T6 browser check.

### T6: Reorganizar WatchCard no mobile

**What**: Implementar foto de 96 px à esquerda, informações à direita, título de duas linhas, condição fora da foto e WhatsApp compacto sobre a foto abaixo de 768 px; preservar desktop.

**Where**: `client/src/components/catalog/watch-card.tsx`

**Depends on**: T4, T5

**Reuses**: WatchCard, WantIconLink, PriceBlock, badges, Card e CatalogPage.

**Requirement**: CATREF-01, CATREF-02, CATREF-03, CATREF-04, CATREF-05, CATREF-06, CATREF-07, CATREF-08, CATREF-09, CATREF-10, CATREF-11, CATREF-12, CATREF-62, CATREF-64, CATREF-67, CATREF-71, CATREF-72

**Complexity**: medium

**Complexity rationale**: Reorganização responsiva de um componente com links independentes, visibilidade acessível e preservação visual do desktop; exige conferência em navegador.

**Tools**:

- MCP: mcp__cua_repl para navegador; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices, impeccable.

**Done when**:

- [x] Entrega verificada: Implementar foto de 96 px à esquerda, informações à direita, título de duas linhas, condição fora da foto e WhatsApp compacto sobre a foto abaixo de 768 px; preservar desktop.
- [x] Testar navegação independente, dados comerciais completos, ausência de descrição/características, condições e disponibilidade; navegador em 320/390/767/768 px verifica reticências, altura variável, foco e vitrine desktop. CatalogPage mantém filtro e ordenação; rodar suas regressões.
- [x] Pelo menos 10 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): show compact horizontal mobile product rows`

**Status**: done

#### T6 execution record

- **Implementation**: `client/src/components/catalog/watch-card.tsx:23-73` renders the compact horizontal card below `md`, with a fixed 96 × 96 px photo, two-line title, state and commercial details in the information column, and an independent 44 × 44 px WhatsApp icon over the photo. At `md` the existing stacked desktop card, photo state badge, and textual WhatsApp action return.
- **Scenario count**: 8 new WatchCard scenarios in `client/src/components/catalog/watch-card.test.tsx:251-362`, plus 5 revalidated CatalogPage filtering and Portuguese-order scenarios in `client/src/routes/catalog-page.test.tsx:102-142,227-265`; 13 new or revalidated scenarios total. The full suite grew by 8 tests from T5's 318 to 326.
- **Visual evidence**: screenshots shown in the conversation at 320, 390, 767, and 768 px, with desktop comparison at 1024 and 1440 px against [baseline.md](baseline.md). At 320 px, the photo measured 96 × 96 px, the text column began 12 px later, the first title measured 56 px/two lines, and the WhatsApp target measured 44 × 44 px entirely over the photo. At 390 px, card heights varied from 176 to 204 px while photos remained 96 × 96 px. At 767 px the compact row remained; at 768 px the 2-column desktop card and textual action returned. At 1024 and 1440 px, the baseline's 3-column desktop presentation remained. Page `scrollWidth` equaled `clientWidth` at all six widths. Tab focus reached the mobile WhatsApp link with `:focus-visible`, measuring 44 × 44 px. The effective theme was light, matching the pre-existing limitation recorded in `baseline.md`; screenshots were not saved locally.
- **Browser-data limitation**: current catalog titles reached two lines at narrow widths but none overflowed the two-line clamp, so visible ellipsis glyphs could not be demonstrated with live catalog data. The long-title test fixture asserts the two-line clamp contract and retains full text; no product data or DOM was mutated.
- **Gate**: `pnpm test` passed 326 tests, 0 failed, 0 skipped (64 shared + 1 prebuild + 261 client); `pnpm build` passed (1 prebuild test and Vite transformed 2,126 modules). Impeccable detector returned `[]` for the changed UI component.

**Test Adequacy Review**

| Requirement / criterion | Evidence (`file:line` + assertion expression) | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| CATREF-01/02/12: horizontal mobile row, no mobile card border, desktop presentation | `watch-card.test.tsx:251-264` — `toMatch(/\bflex\b/)`, `toMatch(/\bmd:block\b/)`; `:169-180` — `border-0`, `md:border-[1px]`, `shadow-none`; browser measurements at all six widths | Horizontal below 768 px; desktop layout resumes at 768 px; observed desktop matches baseline | Yes |
| CATREF-03/06: two-line title and variable card heights with a consistent image | `watch-card.test.tsx:266-274` — full title remains and `line-clamp-2`; `:348-362` — both short/long-title frames contain `size-24`; browser reports 96 × 96 px photos and 176–204 px card heights at 390 px | Title contract is two lines; photo size is consistent while cards may vary in height | Yes; visible ellipsis glyph is limited by current live data as recorded above |
| CATREF-04/05/62: commercial content and project tokens retained; no description/specifications | `watch-card.test.tsx:276-285` — description/specification text absent; `:334-345` — exact old/current prices, discount, Pix, installments, availability, and wrapping classes; existing palette assertions at `:183-195` | Existing commercial values remain in the information column, omitted prose stays absent, project tokens remain applied | Yes |
| CATREF-07: state displayed in information column | `watch-card.test.tsx:78-101` — all three states are inside `watch-card-body` and outside the image; browser confirmed state location in the row | Novo, Usado, and Openbox are shown with state palette in the information column | Yes |
| CATREF-08/09/11/67: independent accessible WhatsApp action over photo | `watch-card.test.tsx:287-302` — absolute top/right-of-photo wrapper, `size-11`, icon-only link and accessible name; `:124-136` — mobile and desktop `href` equality and action outside product link; `:316-331` — product link changes route and WhatsApp click leaves it unchanged; browser confirms target size/focus | Icon is in the photo's top-right, is 44 × 44 px with accessible name, and does not activate product navigation | Yes for WatchCard; CATREF-67 remains partial for other product-page actions |
| CATREF-10: product content navigates to its product page | `watch-card.test.tsx:316-331` — after `fireEvent.click(watch-card-link)`, current path is `/product/seculus-kit-com-cantil` | Photo/content open the selected product independently of WhatsApp | Yes |
| CATREF-64: filtering and Portuguese title ordering are preserved | `client/src/routes/catalog-page.test.tsx:102-142` — exact expected heading sequences and disabled product exclusion; `:227-278` — stable order across repeated/source permutations | Disabled products remain hidden; enabled products retain the established Portuguese ordering | Yes |
| CATREF-71/72: focus and no horizontal overflow | Browser read-only evidence at 320/390/767/768/1024/1440 px: `:focus-visible` on WhatsApp, 44 × 44 px target, and `scrollWidth === clientWidth` at each viewport | Mobile WatchCard action is keyboard reachable and the catalog row creates no horizontal scroll | Yes for the T6 WatchCard; overall requirements remain partial for other surfaces |

- Check A: every T6 criterion has an assertion, relevant route regression, browser measurement, or an explicitly recorded live-data limitation.
- Check B: assertions verify rendered product text, independent navigation, accessible target, responsive placement, and CatalogPage ordering/filtering; no assertion merely mirrors a class name without a corresponding outcome.
- Check C: each new and revalidated scenario maps to CATREF-01–12 or the named preservation requirements; unrelated tests and product data were untouched.
- Check D: used `pnpm test`, `pnpm build`, and the required browser viewports from the Test Coverage Matrix; no extra test gate was introduced.

**Verdict**: Adequate for T6. All gates passed. The current product set cannot visibly produce an ellipsis beyond two title lines, and that visual-data limitation is explicitly documented.

### Phase 2: Geometria e apresentações de mídia

### T7: Implementar calculateZoomGeometry

**What**: Criar cálculo puro do retângulo efetivo, lente, frame e recorte natural conforme o design, retornando null para entradas sem dimensões válidas.

**Where**: `client/src/components/catalog/zoom-geometry.ts`

**Depends on**: None

**Reuses**: Padrão de funções puras e testes de motion.ts.

**Requirement**: CATREF-33, CATREF-34, CATREF-35, CATREF-37, CATREF-41

**Complexity**: medium

**Complexity rationale**: Cálculo puro com fórmulas, limites e oráculos numéricos já definidos no design; exige cuidado com coordenadas e entradas inválidas, sem estado ou integração DOM.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven.

**Done when**:

- [x] Entrega verificada: Criar cálculo puro do retângulo efetivo, lente, frame e recorte natural conforme o design, retornando null para entradas sem dimensões válidas.
- [x] Oráculos numéricos do design para foto quadrada, horizontal e vertical; centro e quatro bordas, fora de object-contain, janela baixa/estreita, dimensões nulas e tolerância de 1 px CSS. Esperados são valores da spec/design, não cópias da função.
- [x] Pelo menos 12 cenários novos ou revalidados, além das regressões existentes; 29 cenários executados.
- [x] Gate Quick aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: unit

**Gate**: Quick

**Commit**: `feat(catalog): calculate bounded hover zoom geometry`

**Status**: done

#### T7 execution record

- **Implementação revisada**: `client/src/components/catalog/zoom-geometry.ts:13-137` mantém o cálculo puro de imagem efetiva, frame, escala, lente e fonte natural; não foi alterada nesta retomada.
- **Correção autorizada pelo operador em 2026-10-15**: somente as duas expectativas `source` em `zoom-geometry.test.ts` foram corrigidas de coordenadas CSS para naturais, conforme `source = lente / k` e `k = 0,5`: janela baixa `(289, 252, 222, 296)` e janela estreita `(362, 349.3333, 76, 101.3333)`. Os demais valores esperados, implementação e tolerância ficaram intactos.
- **Contagem**: 29 cenários (15 orientações/bordas, 2 espaços de object-contain, 1 janela baixa, 1 estreita, 1 viewport de 921 px, 1 sem largura positiva de frame e 8 entradas inválidas). Nenhum teste foi removido ou ignorado.
- **Gate Quick**: `pnpm --filter client exec vitest run src/components/catalog/zoom-geometry.test.ts` — 29 passed, 0 failed, 0 skipped.

**Test Adequacy Review**

| Critério / requisito | Evidência `file:line` e expressão | Resultado definido pela spec/design | Coberto? |
| --- | --- | --- | --- |
| T7: foto quadrada, horizontal e vertical no centro e nas quatro bordas; lente limitada à imagem e recorte natural | `client/src/components/catalog/zoom-geometry.test.ts:42-223,226-230` — `expectGeometryWithinOnePixel(calculateZoomGeometry({ stage, natural, viewport, pointer }), expected)`; helper em `:17-29` compara imagem, lente, frame e `source` | Geometria do design com erro máximo de 1 px CSS; escala maior que 1× | Sim; 15 cenários |
| CATREF-34: espaço de object-contain não pertence à imagem efetiva | `client/src/components/catalog/zoom-geometry.test.ts:233-245` — `expect(calculateZoomGeometry(...)).toBeNull()` para ponteiro acima e abaixo da foto horizontal | Ponteiro no letterbox retorna `null` | Sim; 2 cenários |
| CATREF-35/37: frame se adapta à janela baixa/estreita e a viewport desktop, mantendo recorte correspondente e frame contido | `client/src/components/catalog/zoom-geometry.test.ts:247-281` e `:283-302` — oráculos de frame/source; `expect(geometry.frame.x + geometry.frame.width).toBeLessThanOrEqual(921 - 12)` e equivalente vertical | Frame positivo dentro da margem de 12 px; source em coordenadas naturais; ampliação maior que 1× | Sim; 3 cenários |
| T7: sem espaço positivo para o frame ou com dimensões inválidas, retornar `null` | `client/src/components/catalog/zoom-geometry.test.ts:304-313` e `:315-352` — `expect(calculateZoomGeometry(input)).toBeNull()` para largura indisponível e 8 dimensões zero, negativas ou não finitas | Não calcular overlay sem dimensões/área válidas | Sim; 9 cenários |
| CATREF-41: geometria recebe dimensões naturais e não gera imagens | `client/src/components/catalog/zoom-geometry.ts:13-137` aceita `natural: Size` e retorna apenas retângulos numéricos; diff T7 não contém assets | Zoom reutiliza a imagem existente; nenhuma imagem nova é criada | Parcial nesta função pura; integração da foto existente permanece em T8/T16 |

| Evidência de teste `file:line` e expressão | Mapeia para | Manter? |
| --- | --- | --- |
| `zoom-geometry.test.ts:226-230` — `expectGeometryWithinOnePixel(calculateZoomGeometry(...), expected)` nos 15 casos de `:42-223` | CATREF-33/35/37; T7 centro, quatro bordas e três orientações | Sim |
| `zoom-geometry.test.ts:237-245` — resultado `.toBeNull()` para letterbox acima/abaixo | CATREF-34 | Sim |
| `zoom-geometry.test.ts:247-263` e `:265-281` — fonte natural e geometrias de janela baixa/estreita | CATREF-35/37; oráculos independentes da função | Sim |
| `zoom-geometry.test.ts:291-300` — geometria esperada e limites `<= 921 - 12` / `<= 600 - 12` | CATREF-35/37 | Sim |
| `zoom-geometry.test.ts:304-313` e `:350-352` — `expect(calculateZoomGeometry(input)).toBeNull()` para frame sem largura e entradas inválidas | T7 dimensões inválidas e ausência de espaço positivo | Sim |

- **Check B — não superficial**: cada caso compara valores geométricos definidos pelo design ou confirma o `null` requerido; nenhuma asserção tautológica ou baseada apenas em chamadas.
- **Check D — convenções**: seguiu o local unitário e o comando Quick da Test Coverage Matrix, usando Vitest existente; não há regra adicional de cobertura.
- **Veredito de adequação**: os 29 cenários cobrem os Done when de T7 com oráculos do design. CATREF-33/34/35/37 foram implementados no cálculo; exibição, interação e confirmação visual permanecem em T8/T16. CATREF-41 permanece parcial até a integração de T8/T16; a função pura não cria arquivos de imagem.
- **SPEC_DEVIATION**: nenhuma.

### T8: Criar HoverZoom

**What**: Apresentar lente e frame em portal com geometria correta, pointer-events none e atualização local via um requestAnimationFrame pendente.

**Where**: `client/src/components/catalog/hover-zoom.tsx`

**Depends on**: T7

**Reuses**: calculateZoomGeometry, portal React e tokens locais.

**Requirement**: CATREF-32, CATREF-33, CATREF-34, CATREF-35, CATREF-36, CATREF-37, CATREF-38, CATREF-39, CATREF-40, CATREF-41, CATREF-62, CATREF-72

**Complexity**: high

**Complexity rationale**: Integra ponteiros, medidas DOM, portal e RAF, com invalidação por carregamento, scroll, resize e troca de foto; risco de geometria obsoleta e cleanup incompleto.

**Tools**:

- MCP: mcp__cua_repl para navegador; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices, impeccable.

**Done when**:

- [ ] Entrega verificada: Apresentar lente e frame em portal com geometria correta, pointer-events none e atualização local via um requestAnimationFrame pendente.
- [ ] Mouse com hover ativa; toque/caneta/sem hover não ativam; sair, trocar foto, abrir modal e desmontar limpam overlays e RAF. Verificar carregamento, resize/scroll e ausência de medidas da foto anterior; navegador confirma recorte e ausência de clipping.
- [ ] Pelo menos 10 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): add pointer hover zoom overlay`

### T9: Criar DesktopProductMedia

**What**: Criar apresentação controlada com miniaturas, +N, foto principal acessível e HoverZoom, sem navegação de carrossel desktop.

**Where**: `client/src/components/catalog/desktop-product-media.tsx`

**Depends on**: T8

**Reuses**: Button, HoverZoom e fontes de imagem existentes.

**Requirement**: CATREF-16, CATREF-21, CATREF-22, CATREF-23, CATREF-24, CATREF-25, CATREF-26, CATREF-27, CATREF-28, CATREF-29, CATREF-30, CATREF-51, CATREF-71, CATREF-72

**Complexity**: medium

**Complexity rationale**: Apresentação controlada com seleção e regras explícitas de miniaturas/+N; reutiliza HoverZoom sem possuir o estado do modal.

**Tools**:

- MCP: mcp__cua_repl para navegador; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices, impeccable.

**Done when**:

- [ ] Entrega verificada: Criar apresentação controlada com miniaturas, +N, foto principal acessível e HoverZoom, sem navegação de carrossel desktop.
- [ ] Fixtures com 1/7/8/9/12 fotos; sete miniaturas e +2/+5; +N sempre solicita índice 7; clique/teclado seleciona, hover não seleciona; ativa além da sétima; clique principal abre seleção; arraste não muda foto; sem setas/bolinhas/contador.
- [ ] Pelo menos 10 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): add desktop product thumbnails`

### T10: Extrair apresentação controlada do Carousel

**What**: Extrair CarouselView com índice e eventos controlados, mantendo temporariamente o export Carousel atual como adaptador para WatchPage até T13.

**Where**: `client/src/components/catalog/carousel.tsx`

**Depends on**: None

**Reuses**: Carousel atual, motion.ts e suíte de gestos.

**Requirement**: CATREF-42, CATREF-43, CATREF-44, CATREF-45, CATREF-46, CATREF-51, CATREF-71, CATREF-73

**Complexity**: high

**Complexity rationale**: Separa seleção e efeitos do modal dos estados locais de gesto/animação em componente existente, mantendo adaptador compatível e regressões de teclado, foco e movimento reduzido.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices.

**Done when**:

- [ ] Entrega verificada: Extrair CarouselView com índice e eventos controlados, mantendo temporariamente o export Carousel atual como adaptador para WatchPage até T13.
- [ ] Testar apresentação controlada com um harness; manter todos os cenários existentes de gestos, animação e integração do adaptador. Adicionar Enter/Espaço com uma foto e confirmar limites, setas tablet e movimento reduzido.
- [ ] Pelo menos 6 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `refactor(catalog): extract controlled mobile carousel view`

### Phase 3: Estado compartilhado e integração

### T11: Criar ProductMedia como proprietário estável

**What**: Possuir seleção, galeria única, consulta min-width 921px e foco; fornecer media/isDesktop via children e conectar CarouselView e DesktopProductMedia.

**Where**: `client/src/components/catalog/product-media.tsx`

**Depends on**: T9, T10

**Reuses**: CarouselView, DesktopProductMedia, Gallery e integração modal do Carousel.

**Requirement**: CATREF-21, CATREF-22, CATREF-23, CATREF-24, CATREF-25, CATREF-26, CATREF-27, CATREF-28, CATREF-29, CATREF-30, CATREF-31, CATREF-40, CATREF-47, CATREF-48, CATREF-49, CATREF-50, CATREF-51, CATREF-71, CATREF-73

**Complexity**: high

**Complexity rationale**: Centraliza seleção, modal e foco entre composições que desmontam ao cruzar o breakpoint; deve preservar galeria, zoom interno, inert e restauração de foco.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices, vercel-composition-patterns.

**Done when**:

- [ ] Entrega verificada: Possuir seleção, galeria única, consulta min-width 921px e foco; fornecer media/isDesktop via children e conectar CarouselView e DesktopProductMedia.
- [ ] Testar seleção inicial, miniaturas, +N, sincronização ao fechar, galeria única, inert anterior, rolagem e retorno de foco. Cruzar 920/921 com modal aberto e fechado, preservar zoom interno aberto e usar fallback de foco quando acionador desmonta. Alterar slug reinicia seleção.
- [ ] Pelo menos 12 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `feat(catalog): share product media selection and gallery state`

### T12: Observar o elemento atual do botão na StickyBar

**What**: Adicionar target por elemento e reobservar quando mudar; manter targetRef como adaptador temporário para o consumidor atual até T13.

**Where**: `client/src/components/catalog/sticky-bar.tsx`

**Depends on**: None

**Reuses**: IntersectionObserver, ResizeObserver e espaçador existentes.

**Requirement**: CATREF-68, CATREF-69, CATREF-70

**Complexity**: medium

**Complexity rationale**: Altera o ciclo do IntersectionObserver para acompanhar substituição do alvo, mantendo compatibilidade temporária e os estados de visibilidade e espaçamento.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices.

**Done when**:

- [ ] Entrega verificada: Adicionar target por elemento e reobservar quando mudar; manter targetRef como adaptador temporário para o consumidor atual até T13.
- [ ] Verificar razão menor que 1 mostra, razão 1 oculta, troca A→B desconecta A e observa B, qualquer largura preserva comportamento, espaçador e safe-area; manter os cenários atuais do caminho targetRef.
- [ ] Pelo menos 5 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `fix(catalog): observe replaced primary whatsapp target`

### T13: Integrar a nova composição na WatchPage

**What**: Usar ProductMedia acima dos ramos de layout; desktop com colunas independentes e descrição→observações→características; mobile com ordem aprovada; cor opcional e seções filtradas; StickyBar recebe target atual.

**Where**: `client/src/routes/watch-page.tsx`

**Depends on**: T1, T11, T12

**Reuses**: ProductMedia, Table, PriceBlock, badges, WantLink, StickyBar e função de link similar.

**Requirement**: CATREF-13, CATREF-14, CATREF-15, CATREF-16, CATREF-17, CATREF-18, CATREF-19, CATREF-20, CATREF-54, CATREF-55, CATREF-56, CATREF-57, CATREF-58, CATREF-59, CATREF-61, CATREF-62, CATREF-63, CATREF-65, CATREF-66, CATREF-67, CATREF-68, CATREF-69, CATREF-70, CATREF-71, CATREF-72

**Complexity**: high

**Complexity rationale**: Integra controlador estável, duas ordens reais de DOM, referência do botão e filtragem de conteúdo, preservando regras comerciais e independência geométrica das colunas.

**Tools**:

- MCP: mcp__cua_repl para navegador; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices, impeccable.

**Done when**:

- [ ] Entrega verificada: Usar ProductMedia acima dos ramos de layout; desktop com colunas independentes e descrição→observações→características; mobile com ordem aprovada; cor opcional e seções filtradas; StickyBar recebe target atual.
- [ ] Testar DOM por faixa, um título, metadados, color ausente/vazio/espaços/presente, Cor independente, linhas vazias, seções sem conteúdo, produto ausente/desabilitado, links similares e WhatsApp. Atualizar explicitamente cenário antigo de descrição com espaços para exigir ausência, conforme CATREF-59. Navegador verifica conteúdo esquerdo independente da oferta alta.
- [ ] Pelo menos 14 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): compose responsive product page layout`

### T14: Remover adaptador legado do Carousel

**What**: Remover o export adaptador não controlado, seu index/galleryOpen e seus efeitos de modal; manter somente CarouselView controlado na apresentação mobile.

**Where**: `client/src/components/catalog/carousel.tsx`

**Depends on**: T10, T13

**Reuses**: CarouselView e suíte ProductMedia introduzidos.

**Requirement**: CATREF-31, CATREF-44, CATREF-46, CATREF-47, CATREF-48, CATREF-49, CATREF-50, CATREF-51, CATREF-71, CATREF-73

**Complexity**: medium

**Complexity rationale**: Remove a propriedade legada do modal e migra harnesses com equivalência explícita de asserções; exige rastrear cobertura e consumidores, além de excluir o adaptador.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices.

**Done when**:

- [ ] Entrega verificada: Remover o export adaptador não controlado, seu index/galleryOpen e seus efeitos de modal; manter somente CarouselView controlado na apresentação mobile.
- [ ] Migrar os cenários do adaptador para harness controlado ou ProductMedia na mesma tarefa, preservando asserções de resultado, gestos, foco e foto única. Nenhum teste é eliminado sem equivalente identificado. Confirmar ausência de importadores legados.
- [ ] Pelo menos 0 cenários novos; cobertura atual preservada ou, para documentação, revisão manual registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `refactor(catalog): remove legacy carousel modal ownership`

### T15: Remover compatibilidade targetRef da StickyBar

**What**: Concluir a API aprovada de StickyBar com target: Element ou null, removendo o caminho targetRef após a migração de WatchPage.

**Where**: `client/src/components/catalog/sticky-bar.tsx`

**Depends on**: T12, T13

**Reuses**: API por elemento e testes existentes da barra.

**Requirement**: CATREF-68, CATREF-69, CATREF-70

**Complexity**: low

**Complexity rationale**: Remove compatibilidade temporária após migração dos consumidores; API final e comportamento já estarão implementados e testados em T12/T13.

**Tools**:

- MCP: NONE; terminal e Git locais.
- Skill: tlc-spec-driven, vercel-react-best-practices.

**Done when**:

- [ ] Entrega verificada: Concluir a API aprovada de StickyBar com target: Element ou null, removendo o caminho targetRef após a migração de WatchPage.
- [ ] Migrar harnesses existentes para target na mesma tarefa e preservar contagem/cobertura de visibilidade, substituição do botão, preço, href, espaçador e safe-area. Confirmar ausência de consumidores de targetRef.
- [ ] Pelo menos 0 cenários novos; cobertura atual preservada ou, para documentação, revisão manual registrada.
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `refactor(catalog): finish sticky bar element target API`

### Phase 4: Revisão visual e regressão

### T16: Registrar revisão visual e regressões finais

**What**: Produzir relatório com evidência da vitrine e produto nas oito larguras e dois temas, verificações de teclado, zoom, galeria e barra fixa; registrar resultados de testes/build e integridade dos produtos.

**Where**: `.specs/features/catalog-layout-refactor/ui-review.md`

**Depends on**: T6, T13, T14, T15

**Reuses**: Plano visual da spec, evidências das tarefas e comandos reais do monorepo.

**Requirement**: CATREF-01, CATREF-02, CATREF-03, CATREF-04, CATREF-05, CATREF-06, CATREF-07, CATREF-08, CATREF-09, CATREF-10, CATREF-11, CATREF-12, CATREF-13, CATREF-14, CATREF-15, CATREF-16, CATREF-17, CATREF-18, CATREF-19, CATREF-20, CATREF-21, CATREF-22, CATREF-23, CATREF-24, CATREF-25, CATREF-26, CATREF-27, CATREF-28, CATREF-29, CATREF-30, CATREF-31, CATREF-32, CATREF-33, CATREF-34, CATREF-35, CATREF-36, CATREF-37, CATREF-38, CATREF-39, CATREF-40, CATREF-41, CATREF-42, CATREF-43, CATREF-44, CATREF-45, CATREF-46, CATREF-47, CATREF-48, CATREF-49, CATREF-50, CATREF-51, CATREF-52, CATREF-53, CATREF-54, CATREF-55, CATREF-56, CATREF-57, CATREF-58, CATREF-59, CATREF-60, CATREF-61, CATREF-62, CATREF-63, CATREF-64, CATREF-65, CATREF-66, CATREF-67, CATREF-68, CATREF-69, CATREF-70, CATREF-71, CATREF-72, CATREF-73

**Complexity**: high

**Complexity rationale**: Revisão em navegador de 32 combinações e casos adicionais, com medidas, comparação à baseline e julgamento de recorte, foco e estado; testes/build isolados não comprovam esses resultados.

**Tools**:

- MCP: mcp__cua_repl para navegador; terminal e Git locais.
- Skill: tlc-spec-driven, impeccable.

**Done when**:

- [ ] Entrega verificada: Produzir relatório com evidência da vitrine e produto nas oito larguras e dois temas, verificações de teclado, zoom, galeria e barra fixa; registrar resultados de testes/build e integridade dos produtos.
- [ ] 32 combinações básicas (2 rotas × 8 larguras × 2 temas), mais casos de 1/7/8/9/12 fotos, oferta alta, título longo e conteúdo opcional. Evidência com capturas e medidas; não chamar jsdom de prova visual. Corrigir defeitos em tarefas atômicas vinculadas, com testes, antes de concluir o relatório.
- [ ] Pelo menos 32 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [ ] Gate Build aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: browser + regression

**Gate**: Build

**Commit**: `docs(catalog): record responsive layout verification`

## Phase Execution Map

As setas abaixo representam dependências, incluindo as entre fases. Tarefas sem arestas de entrada não têm pré-requisito de código. A execução continua estritamente sequencial, seguindo a ordem numérica.

```text
T1 -> T2
T1 -> T3
T4 -> T6
T5 -> T6
T7 -> T8
T8 -> T9
T9 -> T11
T10 -> T11
T1 -> T13
T11 -> T13
T12 -> T13
T10 -> T14
T13 -> T14
T12 -> T15
T13 -> T15
T6 -> T16
T13 -> T16
T14 -> T16
T15 -> T16
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T2 | 1 arquivo de documentação; testes associados na mesma entrega | ✅ Granular |
| T3 | 1 arquivo de documentação; testes associados na mesma entrega | ✅ Granular |
| T4 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T5 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T6 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T7 | 1 função; testes associados na mesma entrega | ✅ Granular |
| T8 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T9 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T10 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T11 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T12 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T13 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T14 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T15 | 1 componente/módulo; testes associados na mesma entrega | ✅ Granular |
| T16 | 1 arquivo de documentação; testes associados na mesma entrega | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1 | T1 | ✅ Match |
| T4 | None | None | ✅ Match |
| T5 | None | None | ✅ Match |
| T6 | T4, T5 | T4, T5 | ✅ Match |
| T7 | None | None | ✅ Match |
| T8 | T7 | T7 | ✅ Match |
| T9 | T8 | T8 | ✅ Match |
| T10 | None | None | ✅ Match |
| T11 | T9, T10 | T9, T10 | ✅ Match |
| T12 | None | None | ✅ Match |
| T13 | T1, T11, T12 | T1, T11, T12 | ✅ Match |
| T14 | T10, T13 | T10, T13 | ✅ Match |
| T15 | T12, T13 | T12, T13 | ✅ Match |
| T16 | T6, T13, T14, T15 | T6, T13, T14, T15 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Contrato | unit + integration | unit + integration | ✅ OK |
| T2 | Documentação | none | none | ✅ OK |
| T3 | Documentação | none | none | ✅ OK |
| T4 | UI e integração | integration | integration | ✅ OK |
| T5 | UI e integração | integration | integration | ✅ OK |
| T6 | UI e integração | integration + browser | integration + browser | ✅ OK |
| T7 | Geometria | unit | unit | ✅ OK |
| T8 | UI e integração | integration + browser | integration + browser | ✅ OK |
| T9 | UI e integração | integration + browser | integration + browser | ✅ OK |
| T10 | UI e integração | integration | integration | ✅ OK |
| T11 | UI e integração | integration | integration | ✅ OK |
| T12 | UI e integração | integration | integration | ✅ OK |
| T13 | UI e integração | integration + browser | integration + browser | ✅ OK |
| T14 | UI e integração | integration | integration | ✅ OK |
| T15 | UI e integração | integration | integration | ✅ OK |
| T16 | Relatório visual | browser + regression | browser + regression | ✅ OK |

## Requirement Task Mapping

| Requirement ID | Tasks | Evidence expected |
| --- | --- | --- |
| CATREF-01 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-02 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-03 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-04 | T5, T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-05 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-06 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-07 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-08 | T4, T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-09 | T4, T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-10 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-11 | T4, T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-12 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-13 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-14 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-15 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-16 | T9, T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-17 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-18 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-19 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-20 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-21 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-22 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-23 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-24 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-25 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-26 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-27 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-28 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-29 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-30 | T9, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-31 | T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-32 | T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-33 | T7, T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-34 | T7, T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-35 | T7, T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-36 | T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-37 | T7, T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-38 | T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-39 | T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-40 | T8, T11, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-41 | T7, T8, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-42 | T10, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-43 | T10, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-44 | T10, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-45 | T10, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-46 | T10, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-47 | T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-48 | T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-49 | T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-50 | T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-51 | T9, T10, T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-52 | T1, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-53 | T1, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-54 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-55 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-56 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-57 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-58 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-59 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-60 | T2, T3, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-61 | T1, T2, T3, T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-62 | T6, T8, T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-63 | T5, T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-64 | T6, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-65 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-66 | T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-67 | T4, T6, T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-68 | T12, T13, T15, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-69 | T12, T13, T15, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-70 | T12, T13, T15, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-71 | T4, T6, T9, T10, T11, T13, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-72 | T5, T6, T8, T9, T13, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |
| CATREF-73 | T10, T11, T14, T16 | Testes e/ou evidência de navegador conforme matriz; revisão independente final. |

**Coverage:** 73 requisitos, 73 mapeados, 0 sem tarefa. T16 é a revisão transversal e não substitui testes ou evidência de cada tarefa de implementação.

## Commit and Evidence Policy

- Um commit local por tarefa; atualizar checks e rastreabilidade no mesmo commit. Validar mensagem com check_commit.py da skill.
- .specs/ e .agents/ estão ignorados pelo Git. Para cumprir o contrato da skill, incluir com git add -f somente os caminhos exatos necessários à tarefa (tasks.md, spec.md e evidência; T1 inclui os documentos aprovados da feature; T3 inclui a skill alterada). Não alterar .gitignore nem adicionar árvores inteiras à força.
- Não incluir renomeação do desenho da raiz nem referências Mercado Livre já pendentes em commits de implementação por conveniência. Preservar as mudanças preexistentes.
- Não editar produtos ou products.generated.ts manualmente. Registrar checagem de integridade dos JSONs e fotos em T16.
- Tests: none aplica-se apenas a T2 e T3, conforme matriz. Os dois avisos do validador para essas tarefas são esperados e revisados.
- Não declarar Verified com base apenas em leitura ou classe CSS. Registrar saída de gate e evidência de resultado por requisito; o Verifier decide PASS/FAIL.
- Nenhum teste de produto foi executado para produzir este plano. Baseline e gates serão executados em Execute.

## Tools and Execution Approval

Ferramentas propostas por tarefa estão em Tools. Terminal e Git cobrem arquivos, testes e commits locais. mcp__cua_repl cobre inspeção de navegador onde indicada; não há necessidade de conector de conta externa. Skills adicionais ficam restritas às tarefas listadas.

Antes de executar, confirmar com o operador quais ferramentas/skills usar nas tarefas (pode aceitar esta distribuição) e se autoriza três lotes sequenciais com subagentes ou prefere agente principal. A aprovação das tarefas cobre implementação e commits locais; não cobre operações remotas.
