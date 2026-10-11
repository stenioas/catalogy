# Galeria da página do produto — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/galeria-produto/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Commands from `package.json` and `client/package.json`. Runner: Vitest em `client/vitest.config.ts` (`jsdom`), sem limiar de cobertura. Não há script de lint.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Gesto puro | unit | Todos os ramos; 1:1 com a fórmula da spec e com as bordas de 1×, 3×, 40px e 300ms | `client/src/components/catalog/motion.test.ts` | `pnpm --filter client test` |
| Carrossel | unit | GAL-09, GAL-49, GAL-50, abertura, inerte e índice; asserções antigas de 300ms passam a 200ms | `client/src/components/catalog/carousel.test.tsx` | `pnpm --filter client test` |
| Galeria | unit | Cada AC de cromo, fechar, teclado, arraste e zoom, mais as bordas listadas na spec | `client/src/components/catalog/gallery.test.tsx` | `pnpm --filter client test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Toda tarefa desta feature | `pnpm --filter client test` |
| Full | Fim da feature, a suíte do workspace | `pnpm test` |
| Build | Fase fechada | `pnpm test && pnpm build` |

---

## Execution Plan

Phases are ordered and run sequentially. Tasks inside a phase run in order.

### Phase 1: Conta

A fórmula sai do carrossel e a duração vai a 200ms.

```
T1 → T2
```

### Phase 2: Modal

A galeria abre, fecha e devolve o foco.

```
T2 → T3 → T4
```

### Phase 3: Troca

Setas, teclado, badge e o índice do carrossel.

```
T4 → T5 → T6
```

### Phase 4: Gesto

Arraste, borracha e zoom.

```
T6 → T7 → T8
```

---

## Task Breakdown

### T1: Extrair a conta do gesto

**What**: Criar `motion.ts` com duração, borracha, pinça, roda, `zoomToward` e `panWithin`, e os testes dessas funções.
**Where**: `client/src/components/catalog/motion.ts`
**Depends on**: None
**Reuses**: `client/src/components/catalog/carousel.tsx`
**Requirement**: GAL-33, GAL-39, GAL-40, GAL-41
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `slideDuration(false)` é `200ms` e `slideDuration(true)` é `0ms`
- [x] A borracha usa 56, teto 280 e a curva `exp` da spec
- [x] `wheelScale` usa `deltaY / 400` e para em 1 e em 3
- [x] `pinchScale` usa a razão das distâncias e para em 1 e em 3
- [x] `zoomToward` mantém o ponto e corta em `frameSize * (scale - 1) / 2`
- [x] Gate check passes: `pnpm --filter client test`
- [x] Os testes novos de `motion.test.ts` passam e nenhum teste antigo é apagado

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): extract gallery motion math`

**Status**: done

---

### T2: Encurtar o carrossel para 200ms

**What**: O carrossel importa `motion.ts`, troca 300ms por 200ms e expõe `tabindex="-1"` quando há uma foto.
**Where**: `client/src/components/catalog/carousel.tsx`
**Depends on**: T1
**Reuses**: `client/src/components/catalog/motion.ts`
**Requirement**: GAL-09, GAL-49, GAL-50
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A trilha usa `200ms` sem movimento reduzido e `0ms` com `prefers-reduced-motion: reduce`
- [x] As asserções de `carousel.test.tsx` que esperavam `300ms` esperam `200ms`
- [x] Uma foto só deixa o quadro com `tabindex="-1"`
- [x] O gesto de 40px e a borracha do carrossel continuam iguais
- [x] Gate check passes: `pnpm --filter client test`
- [x] A suíte do client passa sem apagar teste

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): shorten carousel slide to 200ms`

**Status**: done

---

### T3: Montar o modal da galeria

**What**: Portal com fundo, foto, fechar, foco e rolagem travada. Sem setas e sem zoom ainda.
**Where**: `client/src/components/catalog/gallery.tsx`
**Depends on**: T2
**Reuses**: `client/src/components/ui/button.tsx`
**Requirement**: GAL-03, GAL-04, GAL-05, GAL-06, GAL-07, GAL-10, GAL-12, GAL-13, GAL-15, GAL-16, GAL-17, GAL-18, GAL-23
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O diálogo se chama Galeria de fotos, recebe o foco e cobre a página com o preto a 80% e o desfoque da spec
- [x] Fechar, fundo e Escape chamam `onClose`. Clique na foto não chama
- [x] O X tem 44px, o chip escuro e troca de canto em `md`
- [x] A foto é `object-contain` num quadro quadrado
- [x] `document.body` não rola, o overlay tem duração 0ms e o histórico não muda
- [x] Gate check passes: `pnpm --filter client test`
- [x] `gallery.test.tsx` cobre esses critérios e a suíte do client passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): open the product photo gallery`

**Status**: done

---

### T4: Abrir a galeria a partir do carrossel

**What**: Toque curto abre na foto atual. Arraste de 40px ou mais não abre. Fechar devolve o foco e deixa o carrossel inerte enquanto a galeria está aberta.
**Where**: `client/src/components/catalog/carousel.tsx`
**Depends on**: T3
**Reuses**: `client/src/components/catalog/gallery.tsx`
**Requirement**: GAL-01, GAL-02, GAL-08, GAL-11, GAL-14
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Deslocamento menor que 40px abre a galeria nessa foto
- [x] Deslocamento de 40px não abre
- [x] Com a galeria aberta, `watch-carousel` está `inert` e `#root` também, se existir
- [x] Fechar devolve o foco ao quadro, com uma ou com várias fotos
- [x] Gate check passes: `pnpm --filter client test`
- [x] A suíte do client passa sem apagar teste

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): open the gallery from the carousel`

**Status**: done

---

### T5: Trocar a foto por seta e teclado

**What**: Setas a partir de 768px, fim de curso, badge, alt e texto ao vivo.
**Where**: `client/src/components/catalog/gallery.tsx`
**Depends on**: T4
**Reuses**: `client/src/components/catalog/carousel.tsx`
**Requirement**: GAL-19, GAL-20, GAL-21, GAL-22, GAL-24, GAL-25, GAL-26, GAL-27, GAL-28, GAL-29, GAL-30, GAL-31
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Anterior e Seguinte têm `hidden` e `md:inline-flex`, somem com uma foto e desabilitam nas pontas
- [ ] ArrowLeft e ArrowRight trocam a foto em qualquer largura, sem volta e sem efeito numa foto só
- [ ] O badge mostra `atual/total`, inclusive `1/1`, só visual
- [ ] A região ao vivo escreve `Foto {n} de {total}` e a imagem atual usa o alt do produto
- [ ] Gate check passes: `pnpm --filter client test`
- [ ] A suíte do client passa sem apagar teste

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): step through gallery photos`

---

### T6: Sincronizar o índice do carrossel

**What**: Cada troca na galeria atualiza o carrossel no mesmo turno, com duração 0ms por baixo.
**Where**: `client/src/components/catalog/carousel.tsx`
**Depends on**: T5
**Reuses**: `client/src/components/catalog/gallery.tsx`
**Requirement**: GAL-38
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Depois da troca, a foto visível do carrossel é a mesma da galeria
- [ ] A trilha do carrossel está em `transition-duration: 0ms` enquanto a galeria está aberta
- [ ] Gate check passes: `pnpm --filter client test`
- [ ] A suíte do client passa sem apagar teste

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): keep the carousel on the gallery photo`

---

### T7: Arrastar a foto dentro da galeria

**What**: Em 1× o arraste troca a foto com a borracha. Acima de 1× só desloca. Trocar a foto zera o zoom. A troca dura 200ms.
**Where**: `client/src/components/catalog/gallery.tsx`
**Depends on**: T6
**Reuses**: `client/src/components/catalog/motion.ts`
**Requirement**: GAL-32, GAL-33, GAL-34, GAL-35, GAL-36, GAL-37, GAL-51
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Arraste horizontal além de 40px troca a foto. Abaixo disso não troca e não fecha
- [ ] Na ponta, a borracha aparece e a foto não muda
- [ ] Com zoom, o arraste desloca dentro do quadro e o índice fica
- [ ] Trocar a foto volta a escala 1 e translação 0
- [ ] A troca usa 200ms, e 0ms com movimento reduzido
- [ ] Gate check passes: `pnpm --filter client test`
- [ ] A suíte do client passa sem apagar teste

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): drag photos inside the gallery`

---

### T8: Aproximar por pinça, roda e duplo toque

**What**: Zoom de 1× a 3×, sem botão de +/−. O toque que abriu a galeria não conta como metade do duplo toque.
**Where**: `client/src/components/catalog/gallery.tsx`
**Depends on**: T7
**Reuses**: `client/src/components/catalog/motion.ts`
**Requirement**: GAL-39, GAL-40, GAL-41, GAL-42, GAL-43, GAL-44, GAL-45, GAL-46, GAL-47, GAL-48, GAL-52
**Complexity**: critical

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Pinça e roda com Ctrl ficam entre 1 e 3 e miram o ponteiro
- [ ] Roda sem Ctrl não muda escala nem foto
- [ ] Duplo toque em até 300ms e a menos de 40px alterna 1× e 3×. Fora da janela, a escala fica
- [ ] 300ms exatos conta. 40px exatos entre os toques não conta
- [ ] O toque de abertura não arma o cronômetro. A pinça não troca a foto
- [ ] Não há botão de aumentar ou diminuir zoom
- [ ] O zoom usa 200ms, e 0ms com movimento reduzido
- [ ] Gate check passes: `pnpm --filter client test`
- [ ] A suíte do client passa sem apagar teste

**Tests**: unit
**Gate**: quick

**Commit**: `feat(catalog): zoom gallery photos`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 → T2
Phase 2:  T2 → T3 → T4
Phase 3:  T4 → T5 → T6
Phase 4:  T6 → T7 → T8
```

Execution is strictly sequential. Eight tasks fit one batch, so Execute runs inline.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Extrair a conta do gesto | 1 módulo | ✅ Granular |
| T2: Encurtar o carrossel para 200ms | 1 arquivo | ✅ Granular |
| T3: Montar o modal da galeria | 1 componente | ✅ Granular |
| T4: Abrir a galeria a partir do carrossel | 1 arquivo | ✅ Granular |
| T5: Trocar a foto por seta e teclado | 1 componente | ✅ Granular |
| T6: Sincronizar o índice do carrossel | 1 arquivo | ✅ Granular |
| T7: Arrastar a foto dentro da galeria | 1 componente | ✅ Granular |
| T8: Aproximar por pinça, roda e duplo toque | 1 componente | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | sem seta de entrada | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Extrair a conta do gesto | Gesto puro | unit | unit | ✅ OK |
| T2: Encurtar o carrossel para 200ms | Carrossel | unit | unit | ✅ OK |
| T3: Montar o modal da galeria | Galeria | unit | unit | ✅ OK |
| T4: Abrir a galeria a partir do carrossel | Carrossel | unit | unit | ✅ OK |
| T5: Trocar a foto por seta e teclado | Galeria | unit | unit | ✅ OK |
| T6: Sincronizar o índice do carrossel | Carrossel | unit | unit | ✅ OK |
| T7: Arrastar a foto dentro da galeria | Galeria | unit | unit | ✅ OK |
| T8: Aproximar por pinça, roda e duplo toque | Galeria | unit | unit | ✅ OK |
