# Vitrine de relógios Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/vitrine-relogios/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. The approved design fixes the runner: `unittest` from the Python standard library. No `AGENTS.md`, `CONTRIBUTING.md`, `pyproject.toml`, or CI coverage gate exists.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Modelo | unit | `ORDEM_FICHA` matches the 13 spec labels in order | `tests/test_modelo.py` | `python3 -m unittest discover -s tests -q` |
| Validar | unit | All branches; 1:1 to VITR-03–VITR-13, VITR-17, VITR-18, VITR-23; every listed edge case | `tests/test_validar.py` | `python3 -m unittest discover -s tests -q` |
| Renderizar | unit | All page ACs on a fixture catalog, not the published YAML | `tests/test_renderizar.py` | `python3 -m unittest discover -s tests -q` |
| Estilos | unit | Breakpoints, surfaces, and every hex inside the DESIGN.md palette | `tests/test_estilos.py` | `python3 -m unittest discover -s tests -q` |
| Tema e carrossel | unit | Stored choice, system preference, wrap from the last photo | `tests/test_tema.py`, `tests/test_carrossel.py` | `python3 -m unittest discover -s tests -q` |
| Fonte | unit | The vendored file is a woff2 | `tests/test_fonte.py` | `python3 -m unittest discover -s tests -q` |
| Publicar | integration | Success writes only `site/`; each failure leaves the previous `site/` | `tests/test_publicar.py` | `python3 -m unittest discover -s tests -q` |
| CLI | integration | Non-zero exit and stderr `pasta: regra` | `tests/test_cli.py` | `python3 -m unittest discover -s tests -q` |
| Catálogo publicado | unit | The three watches and the file deletions; this test does not drive the behavioral suite | `tests/test_catalogo_publicado.py` | `python3 -m unittest discover -s tests -q` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. No linter is configured in the repo.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After unit tasks | `python3 -m unittest discover -s tests -q` |
| Full | After publicar and CLI | `python3 -m unittest discover -s tests -q` |
| Build | After the last task of a phase | `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q` |

---

## Execution Plan

Phases are ordered and run sequentially. Tasks inside a phase run in order.

### Phase 1: Modelo e validação

```
T1 → T2 → T3
```

### Phase 2: Páginas

```
T4 → T5 → T6
```

### Phase 3: Visual

```
T7 → T11
T8 → T11
T9 → T11
T10 → T11
```

### Phase 4: Publicação

```
T12 → T13
```

### Phase 5: Catálogo real

```
T14
```

---

## Task Breakdown

### Phase 1: Modelo e validação

### T1: Criar o modelo do catálogo

**Status**: done

**What**: Criar `Vendedor`, `Item`, `FichaLinha` e `ORDEM_FICHA` com os 13 rótulos da spec.
**Where**: `gerador/modelo.py`
**Depends on**: None
**Reuses**: nada
**Requirement**: VITR-39
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ORDEM_FICHA` tem os 13 rótulos, na ordem da spec
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 1 test passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): define the catalog model`

---

### T2: Validar identidade, preço e parcelamento

**Status**: done

**What**: Aceitar ou recusar pasta, `id`, campos obrigatórios, WhatsApp, `valorPix`, `parcelamento` e `observacoes` ausente.
**Where**: `gerador/validar.py`
**Depends on**: T1
**Reuses**: `gerador/modelo.py`
**Requirement**: VITR-03, VITR-04, VITR-05, VITR-06, VITR-07, VITR-08, VITR-18
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A leitura usa o texto do escalar YAML, então `yes` e `12:00` falham
- [x] Cada regra acima deixa o erro com pasta e descrição
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 12 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): validate seller identity and price`

---

### T3: Validar ficha, imagens e ordem

**Status**: done

**What**: Recusar imagem, ficha e chave desconhecida, ordenar vendedores e publicar cópias independentes.
**Where**: `gerador/validar.py`
**Depends on**: T2
**Reuses**: `gerador/validar.py`
**Requirement**: VITR-09, VITR-10, VITR-11, VITR-12, VITR-13, VITR-17, VITR-23
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Extensão em maiúsculas passa. Barra no nome, rótulo fora da lista, rótulo repetido e `id` repetido falham
- [x] `Ana` vem antes de `bruno`. O mesmo `id` em dois vendedores passa
- [x] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [x] Test count: at least 22 tests pass

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): validate photos, specs, and vendor order`

---

### Phase 2: Páginas

### T4: Formatar preço, parcelamento e WhatsApp

**Status**: done

**What**: Implementar `formatar_preco`, `formatar_parcelamento` e `link_whatsapp`.
**Where**: `gerador/renderizar.py`
**Depends on**: None
**Reuses**: nada
**Requirement**: VITR-32, VITR-33, VITR-37
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `369.9` vira `R$ 369,90 no Pix` e `1234.5` vira `R$ 1.234,50 no Pix`
- [x] `12` vira `em até 12x com acréscimo`
- [x] O link decodifica `Olá, tenho interesse no ` mais o nome do modelo
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 4 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): format price and WhatsApp links`

---

### T5: Gerar a raiz e a vitrine

**Status**: done

**What**: Escrever `index.html` da raiz e de cada vendedor, com links relativos, card e vitrine vazia.
**Where**: `gerador/renderizar.py`
**Depends on**: T3, T4
**Reuses**: `gerador/modelo.py`, `gerador/renderizar.py`
**Requirement**: VITR-20, VITR-21, VITR-22, VITR-24, VITR-25, VITR-26, VITR-27, VITR-28, VITR-29, VITR-31, VITR-50, VITR-51, VITR-52
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O título da raiz é `Catálogo de relógios` e o da vitrine é só o nome do vendedor
- [x] Vendedor sem itens aparece na raiz e a vitrine mostra `Esta vitrine ainda não tem relógios.`
- [x] O card é um link com a primeira foto, o nome e o preço. `Voltar` aponta para a raiz
- [x] A barra tem `Catálogo` e não tem busca nem sacola. O rodapé tem só `Catálogo de relógios`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 14 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): render the vendor index and showcase`

---

### T6: Gerar a página do relógio

**Status**: done

**What**: Escrever a página do item na ordem da spec, com ficha, observações, prévia e marcas do carrossel.
**Where**: `gerador/renderizar.py`
**Depends on**: T5
**Reuses**: `gerador/renderizar.py`
**Requirement**: VITR-34, VITR-35, VITR-36, VITR-38, VITR-39, VITR-40, VITR-41, VITR-42, VITR-43, VITR-44, VITR-45, VITR-46
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Título é só o nome do modelo. `Voltar` e o nome do vendedor apontam para a vitrine
- [x] A ficha segue `ORDEM_FICHA`, omite rótulo ausente e coloca rótulo acima do valor
- [x] URL http(s) vira `Ver anúncio similar`. Outro valor fica texto. Observação em branco some
- [x] Uma foto não tem seta nem bolinha. Duas fotos têm. `og:image` resolve a primeira foto
- [x] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [x] Test count: at least 24 tests pass

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): render the watch page`

---

### Phase 3: Visual

### T7: Versionar a fonte Inter

**What**: Gravar `fontes/InterVariable.woff2` da release oficial, para a geração copiar sem rede.
**Where**: `fontes/InterVariable.woff2`
**Depends on**: None
**Reuses**: nada
**Requirement**: VITR-53
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O arquivo começa com a assinatura woff2 `wOF2`
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 1 test passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): vendor the Inter font`

---

### T8: Escrever o CSS da vitrine

**What**: Criar `estilos.css` com a grade, as superfícies, a barra preta e as cores do `DESIGN.md`.
**Where**: `gerador/estilos.css`
**Depends on**: T6
**Reuses**: `DESIGN.md`
**Requirement**: VITR-22, VITR-25, VITR-30, VITR-48, VITR-49, VITR-53, VITR-60, VITR-61, VITR-62, VITR-63, VITR-64, VITR-65, VITR-66, VITR-67
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A grade muda em 640px, 834px, 1068px e 1440px
- [ ] Card quadrado com raio 18px. Carrossel sem raio e sem corte. Alvos de toque com pelo menos 44px
- [ ] Claro e escuro usam os hex da spec. A foto não tem filtro. A barra fixa no escuro continua fosca
- [ ] Nenhum hex do arquivo está fora da paleta do `DESIGN.md`
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 8 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): add the catalog stylesheet`

---

### T9: Aplicar o tema antes da pintura

**What**: Criar o script que lê `localStorage.tema`, cai no esquema do aparelho e troca o rótulo do controle.
**Where**: `gerador/tema.js`
**Depends on**: T6
**Reuses**: nada
**Requirement**: VITR-54, VITR-55, VITR-56, VITR-57, VITR-58, VITR-59
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Sem chave salva, escuro do aparelho vira `data-tema="escuro"` e claro vira `claro`
- [ ] No claro o controle mostra `Escuro`. No escuro mostra `Claro`. O clique grava a chave `tema`
- [ ] Com chave salva, o script aplica esse valor
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 5 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): apply the theme before paint`

---

### T10: Controlar o carrossel

**What**: Criar o script que mostra uma foto, marca a bolinha e volta da última para a primeira.
**Where**: `gerador/carrossel.js`
**Depends on**: T6
**Reuses**: nada
**Requirement**: VITR-46, VITR-47
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A próxima depois da última foto é a primeira
- [ ] A bolinha corrente acompanha o índice
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 3 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): wrap the photo carousel`

---

### T11: Embutir CSS, fonte e scripts nas páginas

**What**: Copiar o CSS e a fonte para o destino e embutir `tema.js` no início do `<head>` e `carrossel.js` na página do relógio.
**Where**: `gerador/renderizar.py`
**Depends on**: T7, T8, T9, T10
**Reuses**: `gerador/estilos.css`, `gerador/tema.js`, `gerador/carrossel.js`, `fontes/InterVariable.woff2`
**Requirement**: VITR-02, VITR-53, VITR-54
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O primeiro nó do `<head>` é o script do tema, antes do CSS
- [ ] Página com uma foto não inclui o script do carrossel. Página com duas inclui
- [ ] O destino recebe `estilos.css` e `fontes/InterVariable.woff2`
- [ ] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 28 tests pass

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): inline theme, carousel, and assets`

---

### Phase 4: Publicação

### T12: Substituir site só depois do sucesso

**What**: Validar, renderizar num diretório temporário e trocar `site/` só quando todos passam.
**Where**: `gerador/publicar.py`
**Depends on**: T11
**Reuses**: `gerador/validar.py`, `gerador/renderizar.py`
**Requirement**: VITR-01, VITR-02, VITR-14, VITR-15, VITR-19
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Sucesso grava raiz, vitrine, relógio e `imagens/` só debaixo de `site/`
- [ ] Falha com `site/` ausente não cria `site/`. Falha com `site/` presente não muda o conteúdo anterior
- [ ] Duas execuções iguais produzem o mesmo HTML
- [ ] O teste usa dois vendedores de exemplo, um sem itens
- [ ] Gate check passes: `python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 32 tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(vitrine): publish the site only after validation`

---

### T13: Expor o comando de geração

**What**: Criar `scripts/gerar_site.py`, que sai com código 1 e escreve `pasta: regra` no stderr.
**Where**: `scripts/gerar_site.py`
**Depends on**: T12
**Reuses**: `gerador/publicar.py`
**Requirement**: VITR-16, VITR-72, VITR-73
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A falha de um vendedor de exemplo cita a pasta e a regra no stderr
- [ ] A suíte de comportamento não lê `vendedores/alexandre/vendedor.yaml`
- [ ] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 34 tests pass

**Tests**: integration
**Gate**: build
**Commit**: `feat(vitrine): add the site generator command`

---

### Phase 5: Catálogo real

### T14: Publicar o YAML do Alexandre e apagar a fonte antiga

**What**: Gravar os três relógios em `vendedores/alexandre/vendedor.yaml` e remover Markdown, PDF, plano e `tmp/`.
**Where**: `vendedores/alexandre/vendedor.yaml`
**Depends on**: T13
**Reuses**: `images/catalogo/`, `gerador/validar.py`
**Requirement**: VITR-68, VITR-69, VITR-70, VITR-71
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O YAML tem `Alexandre`, `5511999999999` e os três itens na ordem e com a ficha da spec
- [ ] As fotos citadas estão na pasta do vendedor. `images/catalogo/` permanece
- [ ] `catalogo.md`, `catalogo.pdf`, `template-produto.md`, `detalhes-do-item.md`, `PLANO.md` e `tmp/` não existem
- [ ] `DESIGN.md`, `2026-10-07-vitrine-relogios-design.md` e as skills permanecem
- [ ] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 36 tests pass

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): publish Alexandre's catalog and drop the old source`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1: T1 → T2 → T3
Phase 2: T4 → T5 → T6
Phase 3: T7 → T11
Phase 3: T8 → T11
Phase 3: T9 → T11
Phase 3: T10 → T11
Phase 4: T12 → T13
Phase 5: T14
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Criar o modelo do catálogo | 1 módulo | ✅ Granular |
| T2: Validar identidade, preço e parcelamento | 1 módulo | ✅ Granular |
| T3: Validar ficha, imagens e ordem | 1 módulo | ✅ Granular |
| T4: Formatar preço, parcelamento e WhatsApp | 1 módulo | ✅ Granular |
| T5: Gerar a raiz e a vitrine | 1 módulo | ✅ Granular |
| T6: Gerar a página do relógio | 1 módulo | ✅ Granular |
| T7: Versionar a fonte Inter | 1 arquivo | ✅ Granular |
| T8: Escrever o CSS da vitrine | 1 arquivo | ✅ Granular |
| T9: Aplicar o tema antes da pintura | 1 arquivo | ✅ Granular |
| T10: Controlar o carrossel | 1 arquivo | ✅ Granular |
| T11: Embutir CSS, fonte e scripts nas páginas | 1 módulo | ✅ Granular |
| T12: Substituir site só depois do sucesso | 1 módulo | ✅ Granular |
| T13: Expor o comando de geração | 1 comando | ✅ Granular |
| T14: Publicar o YAML do Alexandre | 1 YAML | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | início da fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None | início da fase 2 | ✅ Match |
| T5 | T3, T4 | T4 → T5. T3 é da fase 1 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | None | T7 → T11 | ✅ Match |
| T8 | T6 | T8 → T11. T6 é da fase 2 | ✅ Match |
| T9 | T6 | T9 → T11. T6 é da fase 2 | ✅ Match |
| T10 | T6 | T10 → T11. T6 é da fase 2 | ✅ Match |
| T11 | T7, T8, T9, T10 | as quatro setas para T11 | ✅ Match |
| T12 | T11 | início da fase 4. T11 é da fase 3 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | fase 5, sem seta interna. T13 é da fase 4 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Criar o modelo do catálogo | Modelo | unit | unit | ✅ OK |
| T2: Validar identidade, preço e parcelamento | Validar | unit | unit | ✅ OK |
| T3: Validar ficha, imagens e ordem | Validar | unit | unit | ✅ OK |
| T4: Formatar preço, parcelamento e WhatsApp | Renderizar | unit | unit | ✅ OK |
| T5: Gerar a raiz e a vitrine | Renderizar | unit | unit | ✅ OK |
| T6: Gerar a página do relógio | Renderizar | unit | unit | ✅ OK |
| T7: Versionar a fonte Inter | Fonte | unit | unit | ✅ OK |
| T8: Escrever o CSS da vitrine | Estilos | unit | unit | ✅ OK |
| T9: Aplicar o tema antes da pintura | Tema e carrossel | unit | unit | ✅ OK |
| T10: Controlar o carrossel | Tema e carrossel | unit | unit | ✅ OK |
| T11: Embutir CSS, fonte e scripts nas páginas | Renderizar | unit | unit | ✅ OK |
| T12: Substituir site só depois do sucesso | Publicar | integration | integration | ✅ OK |
| T13: Expor o comando de geração | CLI | integration | integration | ✅ OK |
| T14: Publicar o YAML do Alexandre | Catálogo publicado | unit | unit | ✅ OK |
