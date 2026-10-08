# Ajustes do site gerado Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: skipped. The generator stays Python, the site stays static HTML/CSS/JS, and no new module is introduced.
**Spec**: `.specs/features/ajustes-site/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. The existing suite uses `unittest` from the Python standard library. No `AGENTS.md`, `CONTRIBUTING.md`, `pyproject.toml`, or CI coverage gate exists.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Renderizar | unit | All page ACs AJST-01–AJST-15, AJST-34–AJST-36, AJST-39, AJST-40; empty vitrine, one photo, escaped seller name, relative links, lazy loading | `tests/test_renderizar.py` | `python3 -m unittest discover -s tests -q` |
| Tema | unit | AJST-16–AJST-20; stored `claro`/`escuro` still wins over the system preference | `tests/test_tema.py` | `python3 -m unittest discover -s tests -q` |
| Estilos | unit | AJST-21–AJST-33, AJST-37, AJST-38, AJST-41–AJST-45; 44 px targets and visible focus stay | `tests/test_estilos.py` | `python3 -m unittest discover -s tests -q` |
| Carrossel | unit | Existing keyboard and wrap behavior; selectors `img`, `.bolinhas`, `.seta-anterior`, `.seta-proxima` under `.carrossel` | `tests/test_carrossel.py` | `python3 -m unittest discover -s tests -q` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. No linter is configured in the repo.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After each task | `python3 -m unittest discover -s tests -q` |
| Full | Not used; this feature has no route or publish-flow change | `python3 -m unittest discover -s tests -q` |
| Build | After the last task of each phase | `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q` |

---

## Execution Plan

Phases run in order. Tasks inside a phase run in order. Eight tasks fit one batch, so Execute stays in this conversation.

### Phase 1: Barra

```
T1
```

### Phase 2: Tema

```
T2
T3
```

### Phase 3: Raiz e vitrine

```
T4 → T5
```

### Phase 4: Carrossel

```
T6 → T7
```

### Phase 5: Barra fixa

```
T8
```

---

## Task Breakdown

### Phase 1: Barra

### T1: Mover a navegação para o header

**Status**: done

**What**: A raiz mantém “Catálogo”; a vitrine e o produto passam a ter voltar com ícone, o miolo da barra e nenhum `.barra-vendedor`.
**Where**: `gerador/renderizar.py`
**Depends on**: None
**Reuses**: `_pagina` e os links relativos já gerados
**Requirement**: AJST-01–AJST-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Raiz: link visível `Catálogo` com `href="./"`, sem `.voltar` e sem `.barra-vendedor`
- [x] Vitrine: header na ordem voltar, `Catálogo`, ambos com `href="../"`; voltar tem `aria-label="Voltar"`, um `svg` com `aria-hidden="true"` e nenhum texto visível `Voltar`
- [x] Vitrine: o nome do vendedor aparece uma vez no `body`, em `p.nome-vendedor`, primeiro filho de `main`; vitrine vazia mantém esse nome e o texto `Esta vitrine ainda não tem relógios.`
- [x] Produto: header na ordem voltar e nome do vendedor, ambos com `href="../"`; sem `Catálogo`, sem `.barra-vendedor` e sem `.nome-vendedor`
- [x] `<` e `&` no nome do vendedor saem escapados
- [x] Links relativos, `loading="lazy"` fora da primeira foto e a caixa de 44 px do voltar continuam cobertos
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count does not drop

**Tests**: unit
**Gate**: build

**Commit**: `feat(site): move navigation into the header bar`

---

### Phase 2: Tema

### T2: Trocar o tema pelo estado, com sol e lua

**Status**: done

**What**: O botão deixa de ler o texto visível e passa a desenhar lua no claro e sol no escuro.
**Where**: `gerador/tema.js`
**Depends on**: None
**Reuses**: a chave `tema`, `data-tema` e os dois `aria-label` atuais
**Requirement**: AJST-16–AJST-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Com `data-tema="claro"`, `#controle-tema` contém `svg.icone-lua` com `aria-hidden="true"` e o nome `Modo claro. Mudar para escuro.`
- [x] Com `data-tema="escuro"`, o botão contém `svg.icone-sol` com `aria-hidden="true"` e o nome `Modo escuro. Mudar para claro.`
- [x] O botão não tem texto visível `Claro` nem `Escuro`
- [x] Um clique no claro grava `escuro`; um clique no escuro grava `claro`; um valor já salvo ainda vence a preferência do aparelho
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count does not drop

**Tests**: unit
**Gate**: quick

**Commit**: `feat(site): switch theme from an icon button`

---

### T3: Deixar o controle de tema circular

**Status**: done

**What**: O botão de tema fica com 44 px, círculo e o foco que já existe.
**Where**: `gerador/estilos.css`
**Depends on**: None
**Reuses**: `#controle-tema:focus-visible`
**Requirement**: AJST-21, AJST-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `#controle-tema` tem `width: 44px`, `height: 44px` e `border-radius: 50%`
- [x] `#controle-tema:focus-visible` mantém `outline: 2px solid #0071e3` e `outline-offset: 2px`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count does not drop

**Tests**: unit
**Gate**: build

**Commit**: `feat(site): make the theme control a 44px circle`

---

### Phase 3: Raiz e vitrine

### T4: Transformar a lista de vendedores em cards

**What**: A lista da raiz fica centralizada, com no máximo 960 px, e cada vendedor vira um card clicável.
**Where**: `gerador/estilos.css`
**Depends on**: None
**Reuses**: superfície, borda e raio de `.card`
**Requirement**: AJST-23–AJST-28

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.lista-vendedores` tem `width: min(960px, 100%)`, `margin-inline: auto`, uma coluna e `gap: 12px`
- [ ] O link do vendedor tem `border-radius: 18px`, `padding: 16px`, `min-height: 44px`, fundo `#ffffff` e borda `#e0e0e0`
- [ ] No escuro o link usa fundo `#2a2a2c` e borda `rgba(255, 255, 255, 0.16)`
- [ ] `.lista-vendedores a:focus-visible` mantém `outline: 2px solid #0071e3`
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count does not drop

**Tests**: unit
**Gate**: quick

**Commit**: `feat(site): lay out sellers as centered cards`

---

### T5: Centralizar o nome e suavizar a sombra da foto

**What**: O nome do vendedor fica no centro e a foto do card ganha a sombra mínima, sem elevar o card.
**Where**: `gerador/estilos.css`
**Depends on**: T4
**Reuses**: `object-fit: cover` e os breakpoints da `.grade-vitrine`
**Requirement**: AJST-29–AJST-33

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.nome-vendedor` tem `text-align: center`
- [ ] `.card img` tem `width: 100%`, `aspect-ratio: 1 / 1`, `object-fit: cover`, `object-position: center` e `box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08)`
- [ ] `.card` não declara `box-shadow`
- [ ] A grade continua 1, 2, 3, 4 e 5 colunas nos cortes 640, 834, 1068, 1440 e 1441 px
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count does not drop

**Tests**: unit
**Gate**: build

**Commit**: `feat(site): soften the square watch-photo shadow`

---

### Phase 4: Carrossel

### T6: Envolver as fotos do carrossel num quadro

**What**: Fotos e setas entram em `.carrossel-janela`; as bolinhas ficam logo abaixo, ainda dentro de `.carrossel`.
**Where**: `gerador/renderizar.py`
**Depends on**: T1
**Reuses**: `_carrossel` e os seletores de `gerador/carrossel.js`
**Requirement**: AJST-34–AJST-36, AJST-39

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Uma ou mais fotos ficam dentro de `.carrossel-janela`
- [ ] Com duas ou mais fotos, as duas `.seta` ficam dentro da janela e `.bolinhas` é o irmão seguinte
- [ ] Com uma foto, não há `.seta` nem `.bolinhas`
- [ ] `img`, `.bolinhas`, `.seta-anterior` e `.seta-proxima` continuam descendentes de `.carrossel`
- [ ] `gerador/carrossel.js` permanece intocado
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count does not drop

**Tests**: unit
**Gate**: quick

**Commit**: `feat(site): wrap carousel photos in a square window`

---

### T7: Fixar a altura do quadro do carrossel

**What**: A janela ocupa um quadrado e cada foto preenche esse quadrado sem distorcer.
**Where**: `gerador/estilos.css`
**Depends on**: T6
**Reuses**: `object-fit: cover` já usado nas fotos
**Requirement**: AJST-37, AJST-38

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `.carrossel-janela` tem `width: 100%`, `aspect-ratio: 1 / 1`, `position: relative` e `overflow: hidden`
- [ ] `.carrossel-janela img` tem `width: 100%`, `height: 100%`, `object-fit: cover` e `object-position: center`
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count does not drop

**Tests**: unit
**Gate**: build

**Commit**: `feat(site): keep the carousel frame square`

---

### Phase 5: Barra fixa

### T8: Empilhar preço e interesse no celular

**What**: Até 640 px a barra fixa coloca o preço acima de “Tenho interesse”; acima disso os dois continuam lado a lado.
**Where**: `gerador/estilos.css`
**Depends on**: T5
**Reuses**: a ordem `.preco` e depois `.pilula` já emitida por `_barra_fixa`
**Requirement**: AJST-40–AJST-45

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O HTML do produto mantém `.preco` antes do link `Tenho interesse`
- [ ] Até 640 px, `.barra-fixa` tem `flex-direction: column`, `align-items: stretch`, `height: auto` e `gap: 8px`
- [ ] Até 640 px o padding horizontal continua 32 px, `.pilula` tem `width: 100%`, `scroll-padding-bottom` é 128 px e o padding inferior de `main:has(.barra-fixa)` é 160 px
- [ ] A partir de 641 px, preço e botão ficam na mesma linha com `height: 64px`
- [ ] `.pilula` mantém `min-height: 44px`
- [ ] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [ ] Test count does not drop
- [ ] `python3 scripts/gerar_site.py` regrava `site/` depois da suíte passar

**Tests**: unit
**Gate**: build

**Commit**: `feat(site): stack the mobile interest bar`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1
Phase 2:  T2
          T3
Phase 3:  T4 → T5
Phase 4:  T6 → T7
Phase 5:  T8
```

Execution is sequential. T2 and T3 share a phase and do not depend on each other. T6 depends on T1 across phases, and T8 depends on T5 across phases; those arrows stay in the task body only.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Mover a navegação para o header | 1 function family in `gerador/renderizar.py` | ✅ Granular |
| T2: Trocar o tema pelo estado, com sol e lua | 1 script | ✅ Granular |
| T3: Deixar o controle de tema circular | 1 rule group | ✅ Granular |
| T4: Transformar a lista de vendedores em cards | 1 rule group | ✅ Granular |
| T5: Centralizar o nome e suavizar a sombra da foto | 1 rule group | ✅ Granular |
| T6: Envolver as fotos do carrossel num quadro | 1 function | ✅ Granular |
| T7: Fixar a altura do quadro do carrossel | 1 rule group | ✅ Granular |
| T8: Empilhar preço e interesse no celular | 1 media-query group | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | no incoming arrow | ✅ Match |
| T2 | None | no incoming arrow | ✅ Match |
| T3 | None | no incoming arrow | ✅ Match |
| T4 | None | no incoming arrow | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T1 | no intra-phase arrow; T1 is Phase 1 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T5 | no intra-phase arrow; T5 is Phase 3 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Mover a navegação para o header | Renderizar | unit | unit | ✅ OK |
| T2: Trocar o tema pelo estado, com sol e lua | Tema | unit | unit | ✅ OK |
| T3: Deixar o controle de tema circular | Estilos | unit | unit | ✅ OK |
| T4: Transformar a lista de vendedores em cards | Estilos | unit | unit | ✅ OK |
| T5: Centralizar o nome e suavizar a sombra da foto | Estilos | unit | unit | ✅ OK |
| T6: Envolver as fotos do carrossel num quadro | Renderizar, Carrossel | unit | unit | ✅ OK |
| T7: Fixar a altura do quadro do carrossel | Estilos | unit | unit | ✅ OK |
| T8: Empilhar preço e interesse no celular | Estilos, Renderizar | unit | unit | ✅ OK |
