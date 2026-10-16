# Catalog Layout Refactor Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Design**: [design.md](design.md), aprovado em conversa.
**Spec**: [spec.md](spec.md), 73 critérios aprovados.
**Status**: Execução autorizada pelo operador via tlc-task-orchestrator-codex; um worker por tarefa, em sequência.

**Autorização contínua do operador**: corrigir autonomamente erros de expectativa numérica, arredondamento, precisão de ponto flutuante e falhas semelhantes do harness quando o resultado correto for demonstrável pela spec/design. Registrar causa e correção e repetir o gate; não reduzir a exigência dos ACs, apagar/pular testes ou alterar contrato. Consultar o operador em falha crítica, ambiguidade de comportamento ou mudança de escopo. Esta autorização permite retomar o gate após essas correções rotineiras sem nova confirmação.

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
- [ ] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

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

- [x] Entrega verificada: Apresentar lente e frame em portal com geometria correta, pointer-events none e atualização local via um requestAnimationFrame pendente.
- [x] Mouse com hover ativa; toque/caneta/sem hover não ativam; sair, trocar foto, abrir modal e desmontar limpam overlays e RAF. Verificar carregamento, resize/scroll e ausência de medidas da foto anterior; navegador confirma recorte e ausência de clipping.
- [x] Pelo menos 10 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): add pointer hover zoom overlay`


#### T8 execution and post-gate review

- **Assumptions**: T7 concluída em `be86fe6`; geometria e tolerância do design são a fonte dos oráculos. HoverZoom permanece isolado até T9/T11.
- **Files**: `hover-zoom.tsx`, `hover-zoom.test.tsx`, `tasks.md`, `spec.md` e `t8-zoom-review.md`; harness temporário removido.
- **Gate**: `pnpm test`, exit 0: shared 64 + prebuild 1 + client 304 = **369 passed, 0 failed, 0 skipped**. T8 adiciona 14 cenários expandidos aos 355 anteriores. Nenhum cenário removido ou pulado.
- **Correções autorizadas**: literais de transform/top/height passaram a comparação numérica com precisão de 0,001 px; formato/sinais/escala preservados. Scroll esperado corrigido para 186.6667 px pelo clamp do design. Causa e execuções anteriores registradas em `t8-zoom-review.md`; nenhum comportamento de produto mudou para atender ao teste.
- **Browser**: CUA com mouse real, portal fora de pai com clipping, recorte correspondente, bordas, scroll e viewport 920/921/1024/1440. Capturas exibidas na conversa sem PNG local. Medidas e limitações em `t8-zoom-review.md`.

**Check A — coverage mapping** (paths below are under `client/src/components/catalog/`):

| Criterion / AC | `file:line` + assertion expression | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| CATREF-32: lente vertical escura/cursor | `hover-zoom.test.tsx:66` — `expect(lens()?.style.width).toBe('160px')`; `:67` — `expect(parseFloat(lens()!.style.height)).toBeCloseTo(213.3333, 3)`; `:68` — `expect(lens()?.style.background).toBe('var(--surface-black)')`; `:69` — opacity `toBe('0.25')`; `:70` — cursor `toBe('zoom-in')` | Lente 3:4, token escuro, 25%, lupa | Sim |
| CATREF-33/34: centro, clamp e imagem efetiva | `hover-zoom.test.tsx:64` — left `toBe('120px')`; `:65` — top `toBeCloseTo(93.3333,3)`; `:107` — `expect(frame()).toBeNull()` no letterbox; `:109-112` — left250/top100/width150/height200; `:118-119` — left240/top186.6667 | Valores do design e limites da foto efetiva | Sim |
| CATREF-35/41/72: recorte original proporcional | `hover-zoom.test.tsx:75` — frame left `toBe('412px')`; `:78` — src `toBe('photo.webp')`; `:79-80` — dimensões800×800; `:82` — `expect(translation).not.toBeNull()`; `:83-84` — eixos `toBeCloseTo(-240,3)` e `toBeCloseTo(-186.6667,3)`; `:139-141` — próxima foto vertical src/left/width400 | Mesmo arquivo, escala uniforme e recorte da lente | Sim; navegador confirmou recorte quadrado; T7 cobre orientações |
| CATREF-36/39: portal e ausência de captura | `hover-zoom.test.tsx:71` — `expect(container.contains(frame())).toBe(false)`; `:72` — parent `toBe(document.body)`; `:73` — position `toBe('fixed')`; `:74` — pointerEvents `toBe('none')` | Sobreposição fora do fluxo e sem interceptação | Sim; clipping confirmado em navegador |
| CATREF-37: resize/scroll | `hover-zoom.test.tsx:147` — top `toBeCloseTo(186.6667,3)`; `:148` — frame top12; `:151-152` — frame207×276 | Recalcular e conter frame em janela baixa | Sim; medidas reais registradas |
| CATREF-38 e cleanup | `hover-zoom.test.tsx:125` e `:130` — frame/lens null e callbacks0; `:136-137` — troca remove overlays/RAF e aguarda load; `:159` e `:161` — unmount deixa portal null e callbacks0 | Saída/cancelamento/troca/modal/unmount encerram zoom e trabalho pendente | Sim |
| CATREF-40: mouse/hover/largura | `hover-zoom.test.tsx:88` — frame/lens null para touch/pen; `:92` — frame null sem hover; `:96` e `:154` — frame null em920 | Ativação somente mouse com hover desde921 | Sim |
| Load/error sem dimensões anteriores | `hover-zoom.test.tsx:100-103` — frame null antes de load, presente após load e frame/lens null após erro; `:137` — frame null na próxima foto ainda carregando | Não desenhar antes de dimensões válidas | Sim |
| RAF único e atualização local | `hover-zoom.test.tsx:116` — `expect(callbacks.size).toBe(1)`; `:118-120` — geometria do último ponteiro e callbacks0 | Um RAF, último ponto; estado local de HoverZoom (`hover-zoom.tsx:18`) sem notificação ao pai | Sim |
| CATREF-62: tokens | `hover-zoom.test.tsx:68-69` — surface-black/opacidade; `hover-zoom.tsx:103` usa bg-background/ring-border | Tokens existentes e nenhuma nova sombra | Sim; tema light observado, revisão final T16 |

**Check C — reverse mapping**:

| `file:line` + assertion expression | Maps to | Keep? |
| --- | --- | --- |
| `hover-zoom.test.tsx:64-84` — lente/cursor/portal/frame/src/dimensões/translation | CATREF-32/33/35/36/39/41/62/72 | Sim |
| `hover-zoom.test.tsx:88,92,96` — overlays `toBeNull()` | CATREF-40, touch/pen/sem hover/920 | Sim; 4 cenários |
| `hover-zoom.test.tsx:100-103` — overlays ausentes/presentes conforme load/error | Design: dimensões desconhecidas e falha de foto | Sim |
| `hover-zoom.test.tsx:107-112` — letterbox null e lente clamp250/100/150/200 | CATREF-33/34, foto horizontal | Sim |
| `hover-zoom.test.tsx:116-120` — RAF1, última lente240/186.6667 e RAF0 | Done when: um RAF pendente, CATREF-33 | Sim |
| `hover-zoom.test.tsx:125` — overlays null e callbacks0 | CATREF-38, saída e cancelamento | Sim; 2 cenários |
| `hover-zoom.test.tsx:130-131` — overlays null, callbacks0 e disabled impede ativar | CATREF-38: galeria aberta | Sim |
| `hover-zoom.test.tsx:136-141` — limpa foto anterior, aguarda load, próxima src/width400 | CATREF-38/41/72 e design: sem medidas antigas | Sim |
| `hover-zoom.test.tsx:147-154` — lente186.6667, frame12/207/276 e null em920 | CATREF-37/40, scroll/resize | Sim |
| `hover-zoom.test.tsx:159-161` — portal null/callbacks0 após desmontar e eventos | Done when: cleanup de RAF/listeners | Sim |

- **Check B**: resultados geométricos, arquivo e estado dos overlays são assertados; a contagem RAF acompanha o resultado do último ponteiro, sem asserção vazia.
- **Check D**: convenções Vitest/Testing Library existentes e comando Full da matriz; sem threshold adicional. Detector Impeccable retornou `[]`.
- **Adequacy verdict**: 14 cenários necessários e suficientes para T8 isolada; valores derivados do design, zero testes excluídos/pulados. Nenhum SPEC_DEVIATION. A integração com os proprietários de mídia/galeria e a matriz visual completa permanecem nas tarefas aprovadas posteriores.
- **Status**: done

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

- [x] Entrega verificada: Criar apresentação controlada com miniaturas, +N, foto principal acessível e HoverZoom, sem navegação de carrossel desktop.
- [x] Fixtures com 1/7/8/9/12 fotos; sete miniaturas e +2/+5; +N sempre solicita índice 7; clique/teclado seleciona, hover não seleciona; ativa além da sétima; clique principal abre seleção; arraste não muda foto; sem setas/bolinhas/contador.
- [x] Pelo menos 10 cenários novos ou revalidados, além das regressões existentes; contagem real registrada: 16 novos cenários.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): add desktop product thumbnails`

#### T9 execution and post-gate review

- **Files**: `client/src/components/catalog/desktop-product-media.tsx`, `desktop-product-media.test.tsx`, `tasks.md`, `spec.md` e `t9-desktop-media-review.md`; harness temporário removido antes do commit.
- **Gate**: `pnpm test`, exit 0: shared 64 + prebuild 1 + client 320 = **385 passed, 0 failed, 0 skipped**. T9 adiciona 16 cenários sobre o baseline 369; nenhum cenário removido ou pulado.
- **Browser**: CUA no harness local `http://localhost:5173/t9-desktop-product-media.html`, viewport 2560×1236, tema light. Captura exibida na conversa, sem PNG local. Medidas conferidas no DOM: grupo de miniaturas 56×56 px com gap vertical 4 px, gap horizontal 12 px, foto principal 588×588 px com `object-contain`, sem overflow horizontal. Enter em Foto 3 atualizou a seleção e o foco permaneceu visível; Space na principal solicitou a foto selecionada; Enter no +5 solicitou índice 7 e ativou +5; arraste de 100 px na foto principal não selecionou/navegou.
- **Harness**: o Vite já ativo não aplicou utilities Tailwind dos novos arquivos de prévia automaticamente; CSS temporário importou `index.css` e adicionou `@source` explícito. Arquivos de harness removidos; nenhum token, CSS ou configuração do produto foi alterado.

**Check A — coverage mapping** (paths below are under `client/src/components/catalog/`):

| Criterion / AC | `file:line` + assertion expression | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| CATREF-21/22: contagem e limite de miniaturas | `desktop-product-media.test.tsx:81-100` — fixtures 1/7/8/9/12; `toHaveLength(thumbs)`, +N equals `count - 7` | Todas até oito; sete e +N após oito, +2/+5 | Sim |
| CATREF-30: seleção >= foto 8 | `desktop-product-media.test.tsx:103-107` — `aria-pressed` true nos índices 7/8/11 | +N representa a seleção posterior à sétima | Sim |
| CATREF-23/24: clique e hover | `desktop-product-media.test.tsx:109-138` — índice selecionado 2 após click; `aria-pressed` ativo; mouseEnter/Over preserva índice 0 | Click muda foto ativa; hover não muda | Sim |
| CATREF-25: +N abre na oitava foto | `desktop-product-media.test.tsx:140-148` — seleção e índice solicitado tornam-se 7 a partir dos índices 0 e 11 | Sempre solicitar o índice 7 e marcar +N ativo | Sim; ciclo de modal continua em T11 |
| CATREF-26/71: principal acessível e abre seleção | `desktop-product-media.test.tsx:150-160` — nome foto 4, `aria-haspopup`, ref, `src`, saída índice3; `:118-126` — seleção e foco após teclado | Ação acessível aponta para a foto atual, teclado seleciona | Sim; modal continua em T11 |
| CATREF-28: arraste não navega | `desktop-product-media.test.tsx:162-174` — seleção 0 e gallery `closed` após gesto | Manter seleção sem abrir/navegar carrossel | Sim; também arraste real CUA |
| CATREF-27: sem affordances de carrossel | `desktop-product-media.test.tsx:176-182` — anterior, próxima, contador e lista de páginas ausentes | Não exibir setas, bolinhas ou contador | Sim |
| CATREF-16/51/72: apresentação e geometria | `desktop-product-media.tsx:64-110` — grupo vertical, `gap-3`, stage `aspect-square`, `HoverZoom`; medidas no review T9 | Miniaturas ao lado da foto, proporção sem distorção; integração do produto permanece posterior | Parcial para composição integrada em T13 |

**Check C — reverse mapping**:

| `file:line` + assertion expression | Maps to | Keep? |
| --- | --- | --- |
| `desktop-product-media.test.tsx:81-107` — thumbs/+N para cinco contagens e seleção ativa | CATREF-21/22/30 | Sim; cinco contagens e três índices |
| `desktop-product-media.test.tsx:109-138` — saída selecionada e ativa após clique/teclado; hover mantém índice | CATREF-23/24/71 | Sim |
| `desktop-product-media.test.tsx:140-148` — índice solicitado/selecionado 7, +N ativo | CATREF-25/30 | Sim; dois estados anteriores |
| `desktop-product-media.test.tsx:150-160` — principal selecionada, acessibilidade, imagem, ref e pedido | CATREF-26/51/71 | Sim |
| `desktop-product-media.test.tsx:162-182` — arraste deixa saída fechada; controles inexistentes | CATREF-27/28/51 | Sim |

- **Check B**: estado do harness controlado é assertado após seleção e solicitação da galeria, além dos atributos ativos; a verificação não depende apenas de spy-count.
- **Check D**: testes seguem Vitest/Testing Library e o comando Full da matriz (`pnpm test`). Detector Impeccable retornou `[]`. Evidência visual e foco ficam em `t9-desktop-media-review.md`.
- **Adequacy verdict**: 16 cenários necessários e suficientes para o componente isolado; sem teste excluído ou pulado. CATREF-29 (retorno da galeria), abertura/fechamento do modal e integração no produto permanecem em T11/T13/T16.
- **Status**: done

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

- [x] Entrega verificada: Extrair CarouselView com índice e eventos controlados, mantendo temporariamente o export Carousel atual como adaptador para WatchPage até T13.
- [x] Testar apresentação controlada com um harness; manter todos os cenários existentes de gestos, animação e integração do adaptador. Adicionar Enter/Espaço com uma foto e confirmar limites, setas tablet e movimento reduzido.
- [x] Pelo menos 6 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `refactor(catalog): extract controlled mobile carousel view`


**Status**: done

#### T10 execution record

- **Entrega**: `CarouselView` recebe index, onIndexChange, onOpenGallery e primaryRef conforme o design; somente gesto/resistência permanecem locais. `Carousel` mantém temporariamente seleção, Gallery, inert e restauração de foco, sem mudar WatchPage. `animate?: boolean` é um detalhe visual opcional de compatibilidade: o adaptador passa `!galleryOpen` para preservar GAL-38 (track sem animação enquanto o modal está aberto); a apresentação não possui estado modal. T11 usa o contrato funcional aprovado e T14 remove o adaptador.
- **Ciclo**: testes escritos antes da implementação resultaram em 11 falhas esperadas (View inexistente e tabindex antigo da foto única); após implementação, 36 passed no arquivo. São 27 regressões existentes preservadas e 9 cenários novos expandidos (mínimo 6). Nenhum teste excluído/ignorado. Os dois testes antigos de foto única agora exigem tabindex 0 e reconhecem o controle principal acessível, conforme design/CATREF-71; o teste de inert acompanha seu proprietário, o wrapper do adaptador.
- **Gates separados**: `pnpm test` exit 0: **394 passed, 0 failed, 0 skipped** (64 shared + 1 prebuild + 329 client), +9 desde T9 (385), +95 desde baseline (299). `pnpm build` exit 0: 1 teste prebuild passed e Vite com 2.126 módulos transformados; não representa typecheck completo. `git diff --check` exit 0. Phase 2 encerrada com Build aprovado.
- **Limitação**: testes jsdom comprovam contrato responsivo `hidden md:inline-flex`, não pixels renderizados. A revisão visual transversal permanece em T16; não há requisito de navegador em T10.

**Adequação A/B — critério → evidência** (caminhos relativos a `client/src/components/catalog/`):

| Critério | file:line e expressão | Resultado da spec/design | Coberto |
| --- | --- | --- | --- |
| Estado controlado e adaptador preservado | `carousel.test.tsx:542` `expect(shownSrc()).toBe(photos[1])`; `:545` `expect(shownSrc()).toBe(photos[2])`; `:123` `expect(importers.toSorted()).toEqual([...])` | Seleção muda somente com props; WatchPage mantém adaptador | Sim |
| CATREF-42/43 setas tablet/mobile | `carousel.test.tsx:612` `expect(classes).toContain('hidden')`; `:613` `expect(classes).toContain('md:inline-flex')` | Ocultas abaixo de 768 px; preservadas desde md, incluindo 768–920 | Sim, contrato responsivo |
| CATREF-44 limites, bolinhas e teclado | `carousel.test.tsx:553` `expect(shownSrc()).toBe(photos[0])`; `:558` `expect(shownSrc()).toBe(photos[2])`; `:562` `expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', true)` | Sem ciclo, primeira/última foto limitadas | Sim |
| CATREF-44 gesto, limiar e cancelamento | `carousel.test.tsx:568` `expect(shownSrc()).toBe(photos[0])`; `:571` `expect(shownSrc()).toBe(photos[1])`; `:579` `expect(screen.getByRole('img', { name: 'Seculus' }).style.transform).toBe('translateX(0px) scaleX(1)')` | 40 px não navega; 41 px navega; cancelar limpa resistência | Sim |
| CATREF-45 contador e indicação atual | `carousel.test.tsx:537` `expect(screen.getByTestId('carousel-count').textContent).toBe('2/3')`; `:538` `expect(screen.getByRole('button', { name: 'Foto 2' }).getAttribute('aria-current')).toBe('true')` | Contador e bolinha correspondem à seleção recebida | Sim |
| CATREF-46 payload e ausência de proprietário modal na View | `carousel.test.tsx:587` `expect(screen.getByLabelText('Gallery request').textContent).toBe('1:true')`; `:589` `expect(screen.queryByRole('dialog')).toBeNull()` | Tap de 39 px solicita índice 1 e o elemento principal registrado em primaryRef | Sim, ambos os campos verificados no harness |
| CATREF-51/71 foto única, Enter/Espaço e foco | `carousel.test.tsx:595` `expect(frame().getAttribute('tabindex')).toBe('0')`; `:596` `expect(frame().getAttribute('aria-label')).toBe('Abrir galeria na foto 1')`; `:599` `expect(document.activeElement).toBe(frame())`; `:601` `expect(screen.getByLabelText('Gallery request').textContent).toBe('0:true')`; `:602` `expect(screen.queryByTestId('carousel-count')).toBeNull()` | Foco sequencial, nome, abertura em ambas teclas sem navegação inútil | Sim, 2 cenários |
| CATREF-73 animação | `carousel.test.tsx:622` `expect(screen.getByTestId('carousel-track').style.transitionDuration).toBe(reduce ? '0ms' : '200ms')` | 0 ms reduzido; 200 ms padrão | Sim, 2 cenários |
| Regressões do adaptador, Gallery/foco/gestos/animação | `carousel.test.tsx:249` `expect(first.style.transform).toBe('translateX(0px) scaleX(1)')`; `:250` `expect(first.style.transitionDuration).toBe('200ms')`; `:270` `expect(track.style.transitionDuration).toBe('200ms')`; `:280` `expect(shownSrc()).toBe(photos[0])`; `:402` `expect(document.activeElement).toBe(frame())`; `:442` `expect(track.style.transitionDuration).toBe('0ms')`; `:467` `expect(document.activeElement).toBe(frame())` | Resistência, animação, sem autoplay, sincronização modal e foco existentes preservados | Sim, 27 testes existentes reexecutados |

**Adequação C — evidência → necessidade**:

| file:line e expressão | Mapeamento | Manter |
| --- | --- | --- |
| `carousel.test.tsx:536` `expect(shownSrc()).toBe(photos[1])` e `:545` `expect(shownSrc()).toBe(photos[2])` | Done when: apresentação controlada; CATREF-44/45 | Sim |
| `carousel.test.tsx:558` `expect(shownSrc()).toBe(photos[2])` e `:562` `expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', true)` | CATREF-44, limites | Sim |
| `carousel.test.tsx:571` `expect(shownSrc()).toBe(photos[1])` e `:580` `expect(screen.getByLabelText('Gallery request').textContent).toBe('closed')` | CATREF-44/46, gestos/limiar/cancelamento | Sim |
| `carousel.test.tsx:587` `expect(screen.getByLabelText('Gallery request').textContent).toBe('1:true')` | CATREF-46, seleção e acionador corretos | Sim |
| `carousel.test.tsx:601` `expect(screen.getByLabelText('Gallery request').textContent).toBe('0:true')` (Enter/Espaço) | CATREF-51/71, foto única | Sim |
| `carousel.test.tsx:613` `expect(classes).toContain('md:inline-flex')` | CATREF-42/43, setas tablet | Sim |
| `carousel.test.tsx:622` `expect(screen.getByTestId('carousel-track').style.transitionDuration).toBe(reduce ? '0ms' : '200ms')` (2 valores) | CATREF-73, movimento reduzido | Sim |
| Asserções existentes acima e cenários CAT/SV/GAL em `carousel.test.tsx:114-530` | Done when: preservar todos os 27 cenários do adaptador, inclusive limites, proporção, gestos, foco, sincronização e animação | Sim |

**Adequação D e veredito**: README/manifests e `client/vitest.config.ts` seguidos; testes co-localizados com Testing Library/Vitest. A/B/C/D aprovados no escopo de T10, payload de abertura verificado por valor e identidade do acionador, sem teste removido, sem SPEC_DEVIATION. Sem cosmética após os gates.

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

- [x] Entrega verificada: Possuir seleção, galeria única, consulta min-width 921px e foco; fornecer media/isDesktop via children e conectar CarouselView e DesktopProductMedia.
- [x] Testar seleção inicial, miniaturas, +N, sincronização ao fechar, galeria única, inert anterior, rolagem e retorno de foco. Cruzar 920/921 com modal aberto e fechado, preservar zoom interno aberto e usar fallback de foco quando acionador desmonta. Alterar slug reinicia seleção.
- [x] Pelo menos 12 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `feat(catalog): share product media selection and gallery state`

**Status**: done

#### T11 execution record

- **Assumptions**: the approved children callback exposes media/isDesktop; the consumer keys ProductMedia by slug as designed. ProductMedia and Gallery remain above the responsive branches. WatchPage integration remains T13, and the legacy Carousel adapter remains T14.
- **Files**: product-media.tsx and product-media.test.tsx; desktop-product-media.tsx forwards disabled to the existing HoverZoom prop so opening Gallery removes overlays; carousel.test.tsx adds the approved ProductMedia importer to its exact CAT-70 list. No product data, dependencies or unrelated files changed.
- **Skills applied**: tlc-spec-driven Execute; vercel-react-best-practices `rerender-derived-state` (subscribe to the breakpoint boolean); vercel-composition-patterns `state-lift-state` and `state-decouple-implementation` (one state owner above both controlled presentations). The approved local children callback supplies composition without a global store or context.
- **Tests before implementation**: 20 expanded AC-derived scenarios written first; the initial run failed because ProductMedia did not exist. The implementation then passed these 20; two targeted cleanup/hidden-trigger scenarios complete the 22 new cases. No existing test was deleted, skipped or weakened.
- **Harness correction**: CAT-70's former exact importer list omitted ProductMedia because it predated the approved architecture. Added only `components/catalog/product-media.tsx`; the exact list still excludes catalog-page and unrelated consumers. Authorized correction of a demonstrably obsolete structural oracle, with unchanged product behavior.
- **Gate Full**: `pnpm test` exit 0: **416 passed, 0 failed, 0 skipped** (64 shared + 1 prebuild + 351 client), 22 above T10's 394 and 117 above the original 299 baseline. Focused ProductMedia verification: 22 passed. Full client execution: 22 files passed, duration 68.60 s. An additional focused run during the long full gate confirmed the new scenarios were not hanging; it emitted React act-environment warnings but all 22 passed. No assertion failure or behavior ambiguity occurred.
- **Scope**: MCP NONE; no browser was opened. These integration tests prove state/events, while visual validation remains T13/T16.

**Check A — sufficient coverage**. Paths abbreviated below are under `client/src/components/catalog/`; PM = `product-media.test.tsx`.

| Done-when / AC / edge case | Exact evidence and assertion expression | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| Initial selection; 1/7/8/9/12 photos; CATREF-21/22 | PM:82 `expect(selected()).toBe(photos[0])`; :83 `expect(screen.queryByRole('dialog')).toBeNull()`; :85 `expect(within(thumbnails).getAllByRole('button').length).toBe(count > 8 ? 8 : count)`; :87 ``expect(within(thumbnails).getByRole('button', { name: `Abrir galeria na foto 8, mais ${count - 7} fotos` }).textContent).toBe(`+${count - 7}`)`` | Index zero, closed modal; all thumbnails up to eight, otherwise seven plus total-minus-seven | Yes |
| CATREF-23/24/26, thumbnail selection and main activation | PM:96 `expect(selected()).toBe(photos[0])`; :98 `expect(selected()).toBe(photos[2])`; :99 `expect(third.getAttribute('aria-pressed')).toBe('true')`; :102 `expect(galleryPhoto()).toBe(photos[2])` | Hover unchanged; activated thumbnail becomes selected; main opens that selection | Yes |
| CATREF-25/29/30, +N and synchronization | PM:109/:118 `expect(galleryPhoto()).toBe(photos[7])`; :111 `expect(galleryPhoto()).toBe(photos[8])`; :113 `expect(selected()).toBe(photos[8])`; :115 `expect(more.getAttribute('aria-pressed')).toBe('true')` | +N always opens eighth; last gallery photo remains selected, with +N active for index >=7 | Yes |
| CATREF-27/28, desktop controls and drag | PM:88 `expect(screen.queryByTestId('watch-carousel')).toBeNull()`; :89 `expect(screen.queryByTestId('carousel-count')).toBeNull()`; :269 `expect(selected()).toBe(photos[0])`; :270 `expect(screen.queryByRole('dialog')).toBeNull()`; desktop-product-media.test.tsx:178 `expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()`; :180 `expect(screen.queryByText(/^\d+\s*\/\s*\d+$/)).toBeNull()` | No desktop carousel navigation; drag neither changes selection nor accidentally opens Gallery | Yes |
| Unique gallery and CATREF-48 closure modes | PM:125 `expect(screen.getAllByRole('dialog').length).toBe(1)`; :132 `expect(screen.queryByRole('dialog')).toBeNull()` after button, Escape or backdrop | One modal; all three approved close paths work | Yes |
| CATREF-49, background isolation/scroll and previous state | PM:127 `expect(root.hasAttribute('inert')).toBe(true)`; :128 `expect(document.body.style.overflow).toBe('hidden')`; :133 `expect(root.hasAttribute('inert')).toBe(false)`; :134 `expect(document.body.style.overflow).toBe('scroll')`; :143/:146 `expect(root.getAttribute('inert')).toBe('previous')` | Background inerte while open; exact prior inert/overflow state restored after close/unmount | Yes |
| CATREF-50/71, focus and hidden/disconnected trigger | PM:126 `expect(document.activeElement).toBe(dialog())`; :135 `expect(document.activeElement).toBe(trigger)`; :116 `expect(document.activeElement).toBe(more)`; :180 `expect(trigger.isConnected).toBe(false)`; :184/:229 `expect(document.activeElement).toBe(main())` | Focus enters modal, returns to visible trigger or current principal control | Yes |
| CATREF-31, closed modal through both directions 920/921 | PM:157 `expect(selected()).toBe(photos[2])`; :158 `expect(screen.queryByRole('dialog')).toBeNull()`; :159 `expect(screen.getByRole(next >= 921 ? 'region' : 'article', { name: next >= 921 ? 'Desktop' : 'Mobile' })).toBeTruthy()` | Selection and closed state preserved while the actual composition changes | Yes |
| CATREF-31/47, open modal/zoom through 920/921 | PM:176 `expect(dialog()).toBe(modal)`; :177 `expect(screen.getAllByRole('dialog').length).toBe(1)`; :178 `expect(viewport.style.transform).toBe(zoom)`; :179 `expect(galleryPhoto()).toBe(photos[2])`; :183 `expect(selected()).toBe(photos[3])` | Same Gallery instance retains zoom; navigating and closing updates shared selection | Yes |
| CATREF-47, existing gesture regressions revalidated | gallery.test.tsx:313 `expect(screen.getByTestId('watch-gallery-viewport').style.transform).toBe(`translate(${limit}px, ${limit}px) scale(2) scaleX(1)`)`; :380 `expect(screen.getByTestId('watch-gallery-viewport').style.transform).toBe('translate(-12.5px, -6.25px) scale(1.25) scaleX(1)')`; :405 `expect(screen.getByTestId('watch-gallery-viewport').style.transform).toBe('translate(-15.625px, 0px) scale(2.5) scaleX(1)')`; :437 `expect(screen.getByTestId('watch-gallery-viewport').style.transform).toBe('translate(-100px, -50px) scale(3) scaleX(1)')`; :442 `expect(screen.getByTestId('watch-gallery-viewport').style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')` | Bounded pan, Ctrl-wheel, pinch and double-tap retain exact existing outcomes | Yes |
| New slug resets owner; listener cleanup | PM:192 `expect(selected()).toBe(photos[0])`; :193 `expect(screen.queryByRole('dialog')).toBeNull()`; :195 `expect(document.getElementById('root')?.hasAttribute('inert')).toBe(false)`; :148 `expect(listeners.size).toBe(0)` | Keyed new product starts at index zero, closed; modal side effects/listener cleaned up | Yes |
| CATREF-51/71, single photo at 920 and 921 | PM:202 `expect(galleryPhoto()).toBe(photos[0])`; :203 `expect(within(dialog()).queryByRole('button', { name: 'Seguinte' })).toBeNull()`; :204 `expect(within(dialog()).queryByRole('button', { name: 'Anterior' })).toBeNull()`; :206 `expect(document.activeElement).toBe(trigger)`; desktop-product-media.test.tsx:124 `expect(screen.getByTestId('selected-index').textContent).toBe('3')` | Single photo still opens, omits useless navigation and returns focus; keyboard activation retained | Yes |
| CATREF-73, reduced motion | PM:215 `expect(screen.getByTestId('carousel-track').style.transitionDuration).toBe('0ms')`; :218 `expect(screen.getByTestId('watch-gallery-track').style.transitionDuration).toBe('0ms')` | Both transitions have exactly zero duration | Yes |
| CATREF-40 and approved opening cleanup | PM:249 `expect(screen.queryByTestId('hover-zoom-lens')).not.toBeNull()`; :250 `expect(screen.queryByTestId('hover-zoom-frame')).not.toBeNull()` before opening; :254 `expect(screen.queryByTestId('hover-zoom-lens')).toBeNull()`; :255/:260 `expect(screen.queryByTestId('hover-zoom-frame')).toBeNull()`; :256 `expect(callbacks.size).toBe(0)`; :259 `expect(screen.queryByTestId('hover-zoom-stage')).toBeNull()` | Opening Gallery removes lens/frame/RAF; mobile composition cannot mount hover zoom | Yes |

**Check B — non-shallow**: assertions inspect selected image src, active controls, exact DOM identity, zoom transform, overlays, focus and inert/overflow state. No call-count-only or assertion-free scenarios. Props carry images/alt/index/actions; integration asserts image and selection outputs, while existing T9/T10 controlled-contract tests remain intact.

**Check C — necessary reverse mapping**:

| Exact assertion evidence (PM = product-media.test.tsx) | Maps to | Keep? |
| --- | --- | --- |
| PM:82 `expect(selected()).toBe(photos[0])`; :85 `expect(within(thumbnails).getAllByRole('button').length).toBe(count > 8 ? 8 : count)` (five fixtures) | CATREF-21/22; initial-state Done when | Yes |
| PM:96 `expect(selected()).toBe(photos[0])`; :98 `expect(selected()).toBe(photos[2])`; :102 `expect(galleryPhoto()).toBe(photos[2])` | CATREF-23/24/26 | Yes |
| PM:109 `expect(galleryPhoto()).toBe(photos[7])`; :113 `expect(selected()).toBe(photos[8])`; :115 `expect(more.getAttribute('aria-pressed')).toBe('true')` | CATREF-25/29/30/50 | Yes |
| PM:125 `expect(screen.getAllByRole('dialog').length).toBe(1)`; :127 `expect(root.hasAttribute('inert')).toBe(true)`; :134 `expect(document.body.style.overflow).toBe('scroll')`; :135 `expect(document.activeElement).toBe(trigger)` (three closure paths) | CATREF-48/49/50 | Yes |
| PM:143 `expect(root.getAttribute('inert')).toBe('previous')`; :148 `expect(listeners.size).toBe(0)` | Previous-inert, scroll and lifecycle Done when | Yes |
| PM:157 `expect(selected()).toBe(photos[2])`; :158 `expect(screen.queryByRole('dialog')).toBeNull()` (both initial widths) | CATREF-31 closed | Yes |
| PM:176 `expect(dialog()).toBe(modal)`; :178 `expect(viewport.style.transform).toBe(zoom)`; :183 `expect(selected()).toBe(photos[3])`; :184 `expect(document.activeElement).toBe(main())` (both initial widths) | CATREF-31/47/50 open | Yes |
| PM:192 `expect(selected()).toBe(photos[0])`; :193 `expect(screen.queryByRole('dialog')).toBeNull()` | Slug-reset Done when | Yes |
| PM:202 `expect(galleryPhoto()).toBe(photos[0])`; :203 `expect(within(dialog()).queryByRole('button', { name: 'Seguinte' })).toBeNull()`; :206 `expect(document.activeElement).toBe(trigger)` (both widths) | CATREF-51/71 | Yes |
| PM:215 `expect(screen.getByTestId('carousel-track').style.transitionDuration).toBe('0ms')`; :218 `expect(screen.getByTestId('watch-gallery-track').style.transitionDuration).toBe('0ms')` | CATREF-73 | Yes |
| PM:228 `expect(trigger.isConnected).toBe(true)`; :229 `expect(document.activeElement).toBe(main())` | CATREF-50 hidden-trigger fallback | Yes |
| PM:249 `expect(screen.queryByTestId('hover-zoom-lens')).not.toBeNull()`; :254 `expect(screen.queryByTestId('hover-zoom-lens')).toBeNull()`; :255 `expect(screen.queryByTestId('hover-zoom-frame')).toBeNull()`; :256 `expect(callbacks.size).toBe(0)`; :259 `expect(screen.queryByTestId('hover-zoom-stage')).toBeNull()` | CATREF-40 and approved zoom cleanup | Yes |
| PM:269 `expect(selected()).toBe(photos[0])`; :270 `expect(screen.queryByRole('dialog')).toBeNull()` | CATREF-28 | Yes |
| carousel.test.tsx:123 `expect(importers.toSorted()).toEqual(['components/catalog/carousel.test.tsx', 'components/catalog/product-media.tsx', 'routes/watch-page.tsx'])` | Approved T11 reuse and temporary T10/T14 migration boundary | Yes |

- **Check D**: existing catalog colocated Vitest integration conventions and the Matrix commands followed; no threshold or extra test guideline applies. All 22 added scenarios map to the approved requirements/edges; minimum 12 satisfied. No tests removed or skipped.
- **Adequacy verdict**: Checks A/B/C/D pass. All applicable T11 criteria have exact outcome evidence. No spec deviation. Browser evidence and real WatchPage composition remain the approved later tasks.

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

- [x] Entrega verificada: Adicionar target por elemento e reobservar quando mudar; manter targetRef como adaptador temporário para o consumidor atual até T13.
- [x] Verificar razão menor que 1 mostra, razão 1 oculta, troca A→B desconecta A e observa B, qualquer largura preserva comportamento, espaçador e safe-area; manter os cenários atuais do caminho targetRef.
- [x] Pelo menos 5 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `fix(catalog): observe replaced primary whatsapp target`

**Status**: done

### T12 execution evidence

**Result**: PASS. `pnpm test` exit 0: **434 passed, 0 failed, 0 skipped** (64 shared + 1 prebuild + 369 client), 18 above T11. The 18 new expanded scenarios are 16 combinations of 8 viewport widths (320, 390, 767, 768, 920, 921, 1024, 1440 px) and ratios 0.4/1, one A→B observer replacement, and one measured spacer/safe-area case. The four existing `targetRef` tests remain unchanged. No test was removed or skipped.

The first Full run exposed a wiring issue: the temporary `targetRef.current` is null during render and receives its button after commit. The adapter now resolves it after commit, compares element identity, and reconnects only when that identity changes. No expectation or contract changed. The repeated Full gate passed.

**Test Adequacy Review**

*Check A — Sufficient coverage:*

| Done-when criterion / spec AC / listed edge case | `file:line` + assertion expression | Spec-defined outcome | Covered? |
| --- | --- | --- | --- |
| CATREF-68/69; ratio below 1 shows and ratio 1 hides at every tested width | `client/src/components/catalog/sticky-bar.test.tsx:268-272` — `expect(observations[0]?.targets).toEqual([target])`; `expect(screen.queryByTestId('sticky-bar')).toBeNull()` / `expect(screen.getByTestId('sticky-bar')).toBeTruthy()` | Observe the supplied element; show unless `intersectionRatio >= 1`; hide at 1. 16 expanded width/ratio cases. | ✅ |
| CATREF-68/69; replacing target A with B disconnects A and observes B | `client/src/components/catalog/sticky-bar.test.tsx:294-297` — `expect(observations).toHaveLength(2)`; `expect(observations[0]?.disconnected).toBe(true)`; `expect(observations[1]?.targets).toEqual([secondTarget])`; `expect(screen.getByTestId('sticky-bar')).toBeTruthy()` | Stop observing the replaced node, observe the current node, and show for its partial ratio. | ✅ |
| CATREF-70; reserve measured bar height and safe-area space | `client/src/components/catalog/sticky-bar.test.tsx:310-314` — `expect(resize.observers[0]?.targets).toEqual([bar])`; `expect(getByTestId('sticky-bar-spacer').style.height).toBe('92px')`; `expect(bar.getAttribute('style')).toContain('padding-bottom: env(safe-area-inset-bottom)')` | Spacer tracks the measured 92 px bar; bar keeps bottom safe-area padding. | ✅ |
| Keep the current `targetRef` consumer working during migration | `client/src/components/catalog/sticky-bar.test.tsx:185-200,211-214` — `expect(observer.threshold()).toBe(1)`; `expect(bar).toBeTruthy()`; `expect(screen.queryByTestId('sticky-bar')).toBeNull()` | Legacy ref observes the committed target and retains partial/full visibility behavior. | ✅ |

*Check C — Necessary tests:*

| `file:line` + assertion expression | Maps to | Keep? |
| --- | --- | --- |
| `client/src/components/catalog/sticky-bar.test.tsx:268-272` — observed target equals `target`; bar visibility follows ratio 0.4/1 | CATREF-68/69; 16 width/ratio cases | ✅ |
| `client/src/components/catalog/sticky-bar.test.tsx:294-297` — old observer disconnected; new observer receives B; partial target shows bar | CATREF-68/69; target replacement | ✅ |
| `client/src/components/catalog/sticky-bar.test.tsx:310-314` — resize observer tracks bar; spacer equals measured height; safe-area padding remains | CATREF-70 | ✅ |
| Existing assertions at `client/src/components/catalog/sticky-bar.test.tsx:181-253` | Preserve the targetRef adapter and existing price, responsive layout, spacer and safe-area regressions | ✅ Keep unchanged |

**Check B**: Assertions inspect the rendered bar, observer target/cleanup, spacer height and inline safe-area padding; none is assertion-free or based on a spy count alone. **Check D**: Co-located React Testing Library/Vitest integration style follows `client/vitest.config.ts` and the catalog component test pattern; the matrix has no percentage threshold. **Verdict**: all T12 criteria are covered by 18 new scenarios, existing targetRef regressions pass, and all tests map to the approved criteria or preserved component contracts.

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

- [x] Entrega verificada: Usar ProductMedia acima dos ramos de layout; desktop com colunas independentes e descrição→observações→características; mobile com ordem aprovada; cor opcional e seções filtradas; StickyBar recebe target atual.
- [x] Testar DOM por faixa, um título, metadados, color ausente/vazio/espaços/presente, Cor independente, linhas vazias, seções sem conteúdo, produto ausente/desabilitado, links similares e WhatsApp. Atualizar explicitamente cenário antigo de descrição com espaços para exigir ausência, conforme CATREF-59. Navegador verifica conteúdo esquerdo independente da oferta alta.
- [x] Pelo menos 14 cenários novos ou revalidados, além das regressões existentes; contagem real registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration + browser

**Gate**: Full

**Commit**: `feat(catalog): compose responsive product page layout`

### T13 execution record

- **Assumptions**: APIs aprovadas de T11/T12; ProductMedia acima dos ramos, identidade por slug, filtragem por trim sem transformar dados.
- **Files touched**: WatchPage e seu teste; router.test.tsx/main.test.tsx (matchMedia do consumidor integrado); carousel.test.tsx (asserção de importador direto); tasks.md/spec.md e t13-page-review.md. Nenhum adaptador ou produto alterado.
- **Tests first**: focused inicial 24 passed/21 failed antes do código. Novo contrato e migrações preservam 31 cenários anteriores. Quinze cenários novos: 4 larguras/título/colunas; 3 cores vazias; 2 cores independentes/linhas; 2 seções vazias; 2 conteúdo literal/WhatsApp; 1 alvo substituído; 1 galeria estável. Focused final 46 passed.
- **Gate Full**: `pnpm test`, exit 0, **449 passed, 0 failed, 0 skipped** (64 shared + 1 prebuild + 384 client), +15 T12/+150 baseline. Diagnóstico client verbose também 384 passed. Sem exclusão/skip. As causas rotineiras e correções de harness estão no [review T13](t13-page-review.md).
- **Browser**: oferta alta 921: mídia bottom572, descrição y604, direita bottom2064.98; colunas 500.39/333.61; mobile920 na ordem aprovada. Página real nas oito larguras, sem overflow; tema efetivo claro preexistente; capturas na conversa e medidas no review. Harness temporário removido.

**Test Adequacy Review — Check A**

Caminhos abreviados: WP=`client/src/routes/watch-page.test.tsx`; SB=`client/src/components/catalog/sticky-bar.test.tsx`; PB=`client/src/components/catalog/price-block.test.tsx`; PM=`client/src/components/catalog/product-media.test.tsx`; WL=`client/src/components/catalog/want-link.test.tsx`.

| Critério / AC / borda | file:line + expressão | Resultado definido / cobertura |
| --- | --- | --- |
| CATREF-13 ordem mobile e metadados | WP:195 `expect(follows(ordered[index - 1], ordered[index])).toBe(true)`; WP:122 `expect(badge.textContent).toBe(state)`; WP:138 `expect(badge.textContent).toBe(label)` | Título, mídia, oferta/metadados, características, descrição, notas, WhatsApp; 3 condições/4 disponibilidades. Sim |
| CATREF-14 título único completo | WP:440 `expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)`; WP:441 `expect(heading.textContent).toBe('Título completo '.repeat(20))`; WP:442 `expect(heading.className).not.toMatch(/line-clamp|truncate/)` | Um título inteiro nas quatro larguras. Sim |
| CATREF-15/16 colunas e miniaturas | WP:450 `expect(left.parentElement?.className).toContain('grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')`; WP:451 `expect(within(left).getByRole('group', { name: 'Miniaturas do produto' })).toBeDefined()` | Duas colunas independentes, esquerda mais larga; miniaturas lado a lado com mídia, medidas reais no review. Sim |
| CATREF-17 oferta direita e um botão | WP:452 `expect(within(right).getByRole('heading', { level: 1 })).toBe(heading)`; WP:453 `expect(within(right).getByTestId('watch-offer')).toBeDefined()`; WP:454 `expect(within(right).getByRole('link', { name: 'Enviar no WhatsApp' })).toBeDefined()`; WP:443 `expect(screen.getAllByRole('link', { name: 'Enviar no WhatsApp' })).toHaveLength(1)` | Título/oferta (PriceBlock/metadados/cor) e ação na direita; um principal. Sim |
| CATREF-18/19 conteúdo esquerdo independente | WP:456 `expect(sections).toEqual(['Descrição', 'Observações', 'Características do produto'])`; WP:457 `expect(follows(within(left).getByTestId('desktop-product-media'), within(left).getByRole('heading', { name: 'Descrição' }))).toBe(true)` | Ordem e colunas reais; navegador prova descrição y604 antes de direita bottom2064.98. Sim |
| CATREF-20 tabela renomeada | WP:236 `expect(screen.getByRole('heading', { name: 'Características do produto' })).toBeDefined()` | Nome exato; tabela existente mantida. Sim |
| CATREF-54/55/56 cor | WP:473 `expect(screen.getByTestId('watch-color').textContent).toBe('Cor:   Azul  ')`; WP:465 `expect(screen.queryByTestId('watch-color')).toBeNull()` | Texto original preservado; undefined/vazio/espaços omitidos; sem inferência de descrição/Cor. Sim |
| CATREF-57/58 especificações independentes e repetidas | WP:474 `expect(within(screen.getByRole('table')).getAllByRole('row').map((row) => row.textContent)).toEqual(['CorPrata', 'Cor do mostradorPreto', 'Cor da pulseiraAço', 'CorPrata'])` | Só linhas com valor; rótulos/duplicatas preservados. Sim |
| CATREF-59 seções vazias/literais | WP:204 `expect(screen.queryByRole('heading', { name: 'Descrição' })).toBeNull()`; WP:481 `expect(screen.queryByRole('heading', { level: 2 })).toBeNull()`; WP:483 `expect(screen.getByRole('main').querySelectorAll('section')).toHaveLength(0)`; WP:491 `expect(screen.getByRole('heading', { name: 'Descrição' }).parentElement?.querySelector('p')?.textContent).toBe('  Caixa de aço.  ')`; WP:492 equivalente observações literal | Caso antigo espaços agora exige ausência; seções inteiras omitidas; textos preenchidos sem transformação. Sim |
| CATREF-61 dados intactos | review: comando `git diff --name-only -- client/public/catalog client/src/catalog/products.generated.ts` vazio | Nenhum arquivo de produto alterado. Sim |
| CATREF-62 identidade | WP:403 `expect(heading.className.split(/\s+/)).toContain('text-foreground')`; WL:84 `expect(css).toMatch(/--primary:\s*#0066cc/)` | Tokens existentes, Table/PriceBlock/badges/WantLink reutilizados; revisão visual clara. Tema escuro real permanece limitação baseline/T16 |
| CATREF-63 preço | WP:197 `expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')`; WP:149 `expect(within(offer).getByTestId('price-installments').textContent).toBe('ou em até 12x com juros')`; WP:150 pix; WP:445 preço anterior; PB:99 `expect(screen.getByTestId('price-badge').textContent).toBe('−17%')`; PB:110 `expect(screen.queryByTestId('price-badge')).toBeNull()` | BRL, anterior opcional, piso desconto >=1%, pix/parcelas preservados. Sim |
| CATREF-65 ausente/desabilitado | WP:277 `expect(screen.getByText('Este relógio não está no catálogo.')).toBeDefined()`; WP:285 mesma mensagem; WP:286 `expect(screen.queryByRole('link', { name: 'Enviar no WhatsApp' })).toBeNull()` | Mensagem exata, sem oferta para slug ausente. Sim |
| CATREF-66 similar | WP:356 `expect(links[0].getAttribute('href')).toBe(httpsUrl)`; WP:360 `expect(links[1].getAttribute('href')).toBe(httpUrl)`; WP:357/358 target/rel exatos | http/https preservados. Sim |
| CATREF-67 WhatsApp | WP:493 `expect(link.getAttribute('href')).toBe(\`https://wa.me/?text=${encodeURIComponent(\`Olá, tenho interesse no Seculus. ${window.location.origin}/product/seculus-kit\`)}\`)` | Mesmo destino/mensagem exatos em principal e barra nas duas composições. Sim |
| CATREF-68/69 target e visibilidade | WP:296 `expect(links).toHaveLength(2)`; WP:307 `expect(screen.queryByTestId('sticky-bar')).toBeNull()`; WP:510 `expect(targets).toEqual([mobile, desktop])`; WP:508 `expect(mobile.isConnected).toBe(false)`; SB:270/272 regra por 8 larguras | Callback estável substitui alvo; barra só oculta com ratio1. Sim |
| CATREF-70 espaço/safe area | SB:311 `expect(getByTestId('sticky-bar-spacer').style.height).toBe('92px')`; SB:312 `expect(bar.getAttribute('style')).toContain('padding-bottom: env(safe-area-inset-bottom)')` | Componente reutilizado, altura real + área segura. Sim |
| Proprietário estável / CATREF-31/71 | WP:523 `expect(screen.getByRole('dialog', { name: 'Galeria de fotos' })).toBe(gallery)`; WP:524/526 src igual `two.webp`; WP:527 `expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir galeria na foto 2' }))`; PM:135 `expect(document.activeElement).toBe(trigger)`; WL:76 `expect(link.className).toMatch(/\bmin-h-11\b/)` | Uma Gallery sobrevive a desktop→mobile, foto/foco preservados; controles acessíveis e botão existente reutilizados. Sim |
| CATREF-72 proporção/overflow | WP:426 `expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)`; WP:335/336 células whitespace-normal/break-words; review medidas reais + object-fit contain | jsdom cobre contrato; navegador comprova overflow/proporção. Sim |

**Check C — reverse mapping**

| file:line + expressão / grupo | AC ou regressão preservada | Keep? |
| --- | --- | --- |
| WP:122 `expect(badge.textContent).toBe(state)`; WP:138 `expect(badge.textContent).toBe(label)`; WP:149/150 parcelas/pix exatos | CATREF-13/17/63, metadados anteriores | Sim |
| WP:158/166/179 href `/`; WP:186/187 histórico não chamado; WP:270 título com seller | Navegação atual preservada pela integração | Sim |
| WP:195 `expect(follows(...)).toBe(true)`; WP:204/211/215 ausência Descrição; WP:220/221 observações; WP:227/231 ausência notas | CATREF-13/59 | Sim |
| WP:241 `expect(rows).toHaveLength(2)`; WP:244/247 células exatas; WP:253/258 tabela ausente; WP:265 text-left; WP:315 data-slot; WP:335/336 quebra | CATREF-20/57/58/59/62/72 e tabela incumbente | Sim |
| WP:277/285 mensagem exata; WP:286 ação ausente | CATREF-65 | Sim |
| WP:296 dois links; WP:299 destinos iguais; WP:307 barra ausente | CATREF-67/68/69 | Sim |
| WP:356/360 href http/https; WP:381/396 classes de link; WP:403 foreground; WP:411–414 limites main; WP:426–432 overflow/texto similar | CATREF-62/66/72 | Sim |
| WP:440/441 título; WP:443 ação única; WP:444 cor literal; WP:445 anterior; WP:450/451 colunas/mídia; WP:456 ordem | CATREF-14–20/54/63 | Sim, 4 cenários novos |
| WP:465 `expect(screen.queryByTestId('watch-color')).toBeNull()`; WP:466 Cor preenchida na tabela | CATREF-55/56 | Sim, 3 novos |
| WP:473 cor literal; WP:474 array de linhas exato | CATREF-54/57/58 | Sim, 2 novos |
| WP:481–483 ausência de headings/tabela/seções | CATREF-59 | Sim, 2 novos |
| WP:491/492 textos literais; WP:493 destino exato | CATREF-59/67 | Sim, 2 novos |
| WP:508/510 alvo desligado/novo alvo; WP:512 barra ausente | CATREF-68/69 | Sim, 1 novo |
| WP:523 mesma Gallery; WP:524/526 mesma foto; WP:527 foco | ProductMedia estável requerido T13; CATREF-31/71 | Sim, 1 novo |
| carousel.test.tsx:123 `expect(importers.toSorted()).toEqual([...])` | Migração de consumidor para ProductMedia, preservando teste de wiring | Sim, existente |
| router/main: matchMedia local, asserções anteriores intactas | Harness necessário para consumidor WatchPage integrado | Sim, sem teste novo |

- **Check A**: requisitos e done-when cobertos por expressões/medidas; sem precisão indefinida no comportamento implementado.
- **Check B**: resultados de texto, ordem, presença, href, identidade do modal, foto e foco são verificados; não há substituição por contagem de mocks.
- **Check C**: 15 novos cenários ancorados; 31 regressões de página preservadas/migradas; sem cenário especulativo.
- **Check D**: matriz e comandos Vitest existentes seguidos; nenhum threshold adicional inventado.
- **Verdict**: adequado no escopo T13. Sem SPEC_DEVIATION. Limitação de tema efetivo claro declarada; revisão final T16 permanece.

**Status**: done

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

- [x] Entrega verificada: Remover o export adaptador não controlado, seu index/galleryOpen e seus efeitos de modal; manter somente CarouselView controlado na apresentação mobile.
- [x] Migrar os cenários do adaptador para harness controlado ou ProductMedia na mesma tarefa, preservando asserções de resultado, gestos, foco e foto única. Nenhum teste é eliminado sem equivalente identificado. Confirmar ausência de importadores legados.
- [x] Pelo menos 0 cenários novos; cobertura atual preservada ou, para documentação, revisão manual registrada.
- [x] Gate Full aprovado; tarefas e rastreabilidade atualizadas antes do commit.

**Tests**: integration

**Gate**: Full

**Commit**: `refactor(catalog): remove legacy carousel modal ownership`

#### T14 execution record

- **Assumptions**: ProductMedia (T11) e WatchPage (T13) já são os únicos proprietários de seleção/modal; T14 remove só o adaptador `Carousel` e migra o harness de integração para ProductMedia sem alterar asserções de comportamento.
- **Files touched**: `carousel.tsx` (removidos export `Carousel`, Gallery/inert/foco locais); `carousel.test.tsx` (`renderCarousel` via ProductMedia; oracle de importadores legados; `ControlledCarousel` preservado para View). Nenhum outro consumidor alterado.
- **Tests**: 0 cenários novos; 36 cenários do arquivo reexecutados via ProductMedia ou harness controlado existente. Nenhum teste excluído, enfraquecido ou ignorado.
- **Gate Full**: `pnpm test`, exit 0, **449 passed, 0 failed, 0 skipped** (64 shared + 1 prebuild + 384 client), mesma contagem de T13.

**Test Adequacy Review — Check A**

Caminhos abreviados: CT=`client/src/components/catalog/carousel.test.tsx`.

| Critério / AC / borda | file:line + expressão | Resultado definido | Coberto? |
| --- | --- | --- | --- |
| Done when: adaptador removido; só CarouselView na apresentação | CT:133 `expect(carouselSource).not.toMatch(/export function Carousel\s*\(/`); CT:132 `expect(legacyImporters).toEqual([])` | Nenhum export/import legado de `Carousel` em produção | Sim |
| Done when: consumo via ProductMedia | CT:134 `expect(viewImporters.toSorted()).toEqual(['components/catalog/product-media.tsx'])`; CT:29-31 harness `ProductMedia` + children | CarouselView importado só por ProductMedia; integração mobile usa proprietário estável | Sim |
| CATREF-44/45/46 gestos, limites, abertura | CT:541-589 harness `ControlledCarousel`; CT:380-465 gestos/Gallery via `renderCarousel` | Mesmas asserções de seleção, limiar 40px, payload e modal preservadas via ProductMedia | Sim |
| CATREF-47-50 modal, inert, foco, sincronização | CT:392-417 inert root + foco ao fechar; CT:434-453 track 0ms e foto sincronizada | Comportamento modal permanece no ProductMedia; regressões do adaptador revalidadas | Sim |
| CATREF-51/71 foto única e teclado | CT:293-305 foto única; CT:467-478 foco sequencial; CT:595-602 Enter/Espaço no harness controlado | Foto única acessível; abertura sem navegação inútil | Sim |
| CATREF-73 movimento reduzido | CT:327-334 `expect(track.style.transitionDuration).toBe('0ms')` com reduce true | 0 ms quando reduzido | Sim |

**Check C — reverse mapping**

| file:line + expressão | AC ou done-when | Keep? |
| --- | --- | --- |
| CT:132-136 oracles de import/export legado | Done when: confirmar ausência de importadores legados | Sim |
| CT:29-31, CT:139-540 cenários via `renderCarousel`/`ControlledCarousel` | Migração do adaptador para ProductMedia/harness; CATREF-42–51, CAT-70–86, GAL/SV | Sim, 36 regressões preservadas |

- **Check B/D**: asserções sobre src, foco, inert, transform e disabled; matriz Vitest existente seguida.
- **Verdict**: adequado no escopo T14. Sem SPEC_DEVIATION.

**Status**: done

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
