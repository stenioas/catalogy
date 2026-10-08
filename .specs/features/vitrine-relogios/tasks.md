# Vitrine de relógios Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/vitrine-relogios/design.md`
**Status**: Draft (emenda de interface, T15 a T28)

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
| Imagem | unit | All branches; 1:1 to VITR-98–VITR-101; every orientation value 1–8, AVIF `irot` 0–3, truncation and unknown signature | `tests/test_imagem.py` | `python3 -m unittest discover -s tests -q` |

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

### Phase 6: Tamanho das fotos

```
T15 → T16 → T17 → T18
```

### Phase 7: HTML e scripts

```
T19
T20
T21 → T22
T23
```

### Phase 8: Visual da emenda

```
T24
T25
T26
T27
T28
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

**Status**: done

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

- [x] O arquivo começa com a assinatura woff2 `wOF2`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 1 test passes

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): vendor the Inter font`

---

### T8: Escrever o CSS da vitrine

**Status**: done

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

- [x] A grade muda em 640px, 834px, 1068px e 1440px
- [x] Card quadrado com raio 18px. Carrossel sem raio e sem corte. Alvos de toque com pelo menos 44px
- [x] Claro e escuro usam os hex da spec. A foto não tem filtro. A barra fixa no escuro continua fosca
- [x] Nenhum hex do arquivo está fora da paleta do `DESIGN.md`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 8 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): add the catalog stylesheet`

---

### T9: Aplicar o tema antes da pintura

**Status**: done

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

- [x] Sem chave salva, escuro do aparelho vira `data-tema="escuro"` e claro vira `claro`
- [x] No claro o controle mostra `Escuro`. No escuro mostra `Claro`. O clique grava a chave `tema`
- [x] Com chave salva, o script aplica esse valor
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 5 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): apply the theme before paint`

---

### T10: Controlar o carrossel

**Status**: done

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

- [x] A próxima depois da última foto é a primeira
- [x] A bolinha corrente acompanha o índice
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 3 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): wrap the photo carousel`

---

### T11: Embutir CSS, fonte e scripts nas páginas

**Status**: done

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

- [x] O primeiro nó do `<head>` é o script do tema, antes do CSS
- [x] Página com uma foto não inclui o script do carrossel. Página com duas inclui
- [x] O destino recebe `estilos.css` e `fontes/InterVariable.woff2`
- [x] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [x] Test count: at least 28 tests pass

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): inline theme, carousel, and assets`

---

### Phase 4: Publicação

### T12: Substituir site só depois do sucesso

**Status**: done

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

- [x] Sucesso grava raiz, vitrine, relógio e `imagens/` só debaixo de `site/`
- [x] Falha com `site/` ausente não cria `site/`. Falha com `site/` presente não muda o conteúdo anterior
- [x] Duas execuções iguais produzem o mesmo HTML
- [x] O teste usa dois vendedores de exemplo, um sem itens
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 32 tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(vitrine): publish the site only after validation`

---

### T13: Expor o comando de geração

**Status**: done

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

- [x] A falha de um vendedor de exemplo cita a pasta e a regra no stderr
- [x] A suíte de comportamento não lê `vendedores/alexandre/vendedor.yaml`
- [x] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [x] Test count: at least 34 tests pass

**Tests**: integration
**Gate**: build
**Commit**: `feat(vitrine): add the site generator command`

---

### Phase 5: Catálogo real

### T14: Publicar o YAML do Alexandre e apagar a fonte antiga

**Status**: done

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

- [x] O YAML tem `Alexandre`, `5511999999999` e os três itens na ordem e com a ficha da spec
- [x] As fotos citadas estão na pasta do vendedor. `images/catalogo/` permanece
- [x] `catalogo.md`, `catalogo.pdf`, `template-produto.md`, `detalhes-do-item.md`, `PLANO.md` e `tmp/` não existem
- [x] `DESIGN.md`, `2026-10-07-vitrine-relogios-design.md` e as skills permanecem
- [x] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [x] Test count: at least 36 tests pass

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): publish Alexandre's catalog and drop the old source`

---

### Phase 6: Tamanho das fotos

### T15: Ler o tamanho de PNG e JPEG

**Status**: done

**What**: Criar `ler_dimensoes` e `ImagemIlegivel`, com PNG pelo `IHDR` e JPEG pelo primeiro SOF e pela orientação Exif do APP1.
**Where**: `gerador/imagem.py`
**Depends on**: None
**Reuses**: nada. Ajudante de teste novo em `tests/imagens_exemplo.py`
**Requirement**: VITR-98, VITR-99, VITR-100
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] PNG 400×300 devolve `(400, 300)`
- [x] JPEG 400×300 sem Exif e com orientação 1, 2, 3 e 4 devolve `(400, 300)`. Com 5, 6, 7 e 8 devolve `(300, 400)`
- [x] Exif malformado com SOF válido devolve o tamanho do SOF
- [x] Um `.png` com bytes de JPEG devolve o tamanho do JPEG
- [x] PNG truncado antes do `IHDR`, JPEG sem SOF, assinatura desconhecida e largura ou altura zero levantam `ImagemIlegivel`
- [x] O módulo só importa a biblioteca padrão
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 162 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): read PNG and JPEG sizes from the header`

---
### T16: Ler o tamanho de WebP

**Status**: done

**What**: Acrescentar WebP `VP8 `, `VP8L` e `VP8X` a `ler_dimensoes`, com a orientação do bloco `EXIF` do `VP8X`.
**Where**: `gerador/imagem.py`
**Depends on**: T15
**Reuses**: a leitura de Exif de T15
**Requirement**: VITR-98, VITR-99, VITR-100
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `VP8 `, `VP8L` e `VP8X` de 400×300 devolvem `(400, 300)`
- [x] `VP8X` com `EXIF` de orientação 6 devolve `(300, 400)`. Com orientação 3 devolve `(400, 300)`
- [x] O bloco `EXIF` vale com e sem o prefixo `Exif\0\0`
- [x] WebP truncado ou sem bloco de imagem levanta `ImagemIlegivel`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 169 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): read WebP sizes from the header`

---
### T17: Ler o tamanho de AVIF

**Status**: done

**What**: Acrescentar AVIF a `ler_dimensoes`, seguindo `pitm`, `ipma` e `ipco` até o `ispe` e o `irot` do item primário.
**Where**: `gerador/imagem.py`
**Depends on**: T16
**Reuses**: o percurso de caixas escrito nesta tarefa
**Requirement**: VITR-98, VITR-99, VITR-100
**Complexity**: high

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] AVIF 400×300 sem `irot` e com ângulo 0 ou 2 devolve `(400, 300)`. Com ângulo 1 ou 3 devolve `(300, 400)`
- [x] Com uma miniatura de 64×48 antes do item primário em `ipco`, devolve o `ispe` do item primário
- [x] `imir` sem `irot` mantém `(400, 300)`
- [x] Caixa com tamanho de 64 bits é percorrida
- [x] AVIF sem `ispe` no item primário ou truncado levanta `ImagemIlegivel`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 175 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): read AVIF sizes from the header`

---
### T18: Guardar o tamanho no modelo e recusar imagem ilegível

**Status**: done

**What**: Criar `Imagem(arquivo, largura, altura)`, trocar `Item.imagens` para `list[Imagem]` e preencher pela validação, com a regra `não foi possível ler a largura e a altura da imagem`. Adaptar `renderizar.py`, `publicar.py`, a fixture e os testes que usavam `list[str]` ou bytes falsos.
**Where**: `gerador/validar.py`
**Depends on**: T17
**Reuses**: `CatalogoErro`, `publicar.substituir`, `scripts/gerar_site.py`
**Requirement**: VITR-101
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O item válido carrega `Imagem("foto.png", L, A)` com o tamanho do PNG mínimo gravado pelo teste
- [x] Imagem ilegível levanta `CatalogoErro` com a regra exata e sem o nome do arquivo
- [x] A CLI escreve `alexandre: não foi possível ler a largura e a altura da imagem` e sai com 1
- [x] O `site/` anterior fica byte a byte igual depois dessa falha
- [x] As regras antigas de imagem continuam passando na mesma ordem
- [x] O HTML gerado continua idêntico ao de antes desta tarefa
- [x] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [x] Test count: at least 179 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: integration
**Gate**: build
**Commit**: `feat(vitrine): carry image sizes in the model`

---
### Phase 7: HTML e scripts

### T19: Declarar viewport, link de pular e alvo do conteúdo

**Status**: done

**What**: Em `_pagina`, emitir o `viewport`, o link `Pular para o conteúdo` como primeiro filho do `body` e `main` com `id="conteudo"` e `tabindex="-1"`.
**Where**: `gerador/renderizar.py`
**Depends on**: None
**Reuses**: `_pagina`
**Requirement**: VITR-74, VITR-75, VITR-76
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Raiz, vitrine e relógio têm `<meta name="viewport" content="width=device-width, initial-scale=1">` dentro do `head`
- [x] O primeiro filho do `body` nas três páginas é `<a class="pular" href="#conteudo">Pular para o conteúdo</a>`
- [x] O `main` das três páginas tem `id="conteudo"` e `tabindex="-1"`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 182 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): add viewport and skip link`

---
### T20: Declarar tamanho e carga das fotos

**Status**: done

**What**: Emitir `width` e `height` de cada `Imagem` no card e no carrossel, e `loading="lazy"` em todo card e foto depois do primeiro.
**Where**: `gerador/renderizar.py`
**Depends on**: T18
**Reuses**: `_card`, `_carrossel`
**Requirement**: VITR-97, VITR-102, VITR-103
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Com `Imagem("capa.png", 400, 300)`, o card e a foto do carrossel têm `width="400"` e `height="300"`
- [x] O primeiro card e a primeira foto do carrossel não têm `loading`
- [x] O segundo card e a segunda foto do carrossel têm `loading="lazy"`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 185 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): declare photo size and lazy loading`

---
### T21: Trocar as bolinhas por botões

**Status**: done

**What**: Emitir cada bolinha como `<button type="button" class="bolinha" aria-label="Foto N">`, a primeira com `aria-current="true"`.
**Where**: `gerador/renderizar.py`
**Depends on**: None
**Reuses**: `_carrossel`
**Requirement**: VITR-83
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Com três fotos, há três `button type="button"` com `aria-label` `Foto 1`, `Foto 2` e `Foto 3`
- [x] Só a primeira tem `aria-current="true"`
- [x] Com uma foto, não há bolinha nem seta
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 187 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): render carousel dots as buttons`

---
### T22: Ir para a foto da bolinha

**Status**: done

**What**: Em `carrossel.js`, o clique numa bolinha mostra a foto daquela posição e move `aria-current` para ela.
**Where**: `gerador/carrossel.js`
**Depends on**: T21
**Reuses**: `irPara`, `atualizarBolinhas`
**Requirement**: VITR-85
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] No harness com três fotos, clicar a terceira bolinha mostra só a terceira foto e deixa `aria-current` só na terceira
- [x] Depois, a próxima volta para a primeira
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 189 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): jump to a photo from its dot`

---
### T23: Expor o modo atual no botão de tema

**Status**: done

**What**: Em `tema.js`, gravar o `aria-label` do modo atual junto com o rótulo e atualizar no clique.
**Where**: `gerador/tema.js`
**Depends on**: None
**Reuses**: `atualizarControle`
**Requirement**: VITR-88, VITR-89, VITR-90
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] No claro, o nome é `Modo claro. Mudar para escuro.` e o texto é `Escuro`
- [x] No escuro, o nome é `Modo escuro. Mudar para claro.` e o texto é `Claro`
- [x] Depois do clique a partir do claro, o nome é `Modo escuro. Mudar para claro.`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 192 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): name the current theme for screen readers`

---
### Phase 8: Visual da emenda

### T24: Encaixar as fotos no quadro quadrado

**Status**: done

**What**: Foto do card e do carrossel em quadro `1 / 1` com `cover` centrado. Raio de 8px no card e zero no carrossel. O card continua com 18px.
**Where**: `gerador/estilos.css`
**Depends on**: None
**Reuses**: `.card img`, `.carrossel img`
**Requirement**: VITR-48, VITR-49, VITR-96
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `.card img` e `.carrossel img` têm `aspect-ratio: 1 / 1`, `width: 100%`, `object-fit: cover` e `object-position: center`
- [x] `.card img` tem `border-radius: 8px`, `.carrossel img` tem `0` e `.card` tem `18px`
- [x] O teste antigo de foto inteira e de raio 18px na foto passa a afirmar o quadro cheio e os 8px
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 193 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): fill photos into a square frame`

---
### T25: Completar o tema escuro

**Status**: done

**What**: `color-scheme: dark`, vidro na segunda barra e na barra fixa, sólido só no rodapé, linhas escuras e fio no botão de tema.
**Where**: `gerador/estilos.css`
**Depends on**: None
**Reuses**: seletores `html[data-tema="escuro"]`
**Requirement**: VITR-64, VITR-91, VITR-92, VITR-93, VITR-94, VITR-95
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `html[data-tema="escuro"]` declara `color-scheme: dark`
- [x] No escuro, `.barra-vendedor` e `.barra-fixa` têm `rgba(39, 39, 41, 0.8)` e `saturate(180%) blur(20px)`. `footer` tem `#272729`
- [x] No escuro, a borda do card, `.ficha-linha` e o separador de `.lista-vendedores a` usam `rgba(255, 255, 255, 0.16)`
- [x] `#controle-tema` tem fundo `#1d1d1f` e `border: 1px solid rgba(255, 255, 255, 0.16)`
- [x] O teste antigo das três superfícies `#272729` passa a afirmar o sólido só no rodapé
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 198 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): complete the dark theme surfaces`

---
### T26: Estilizar link de pular, respiro e foco

**Status**: done

**What**: Link de pular escondido fora do foco e pílula azul com foco, `scroll-padding` da pilha sticky e anel de foco em link de pular, bolinha e seta.
**Where**: `gerador/estilos.css`
**Depends on**: T19
**Reuses**: a regra `:focus-visible` existente
**Requirement**: VITR-77, VITR-78, VITR-79, VITR-80, VITR-81, VITR-82
**Complexity**: medium

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `.pular` fora do foco tem `position: fixed` e `transform: translateY(-200%)`
- [x] `.pular:focus` tem `transform: none`, fundo `#0066cc`, texto `#ffffff`, raio `9999px` e `z-index` maior que o da `.barra-negra`
- [x] `html` tem `scroll-padding-top: 44px`. `html:has(.barra-vendedor)` tem `96px`. `html:has(.barra-fixa)` tem `scroll-padding-bottom: 64px`
- [x] `.pular`, `.bolinha` e `.seta` em `:focus-visible` têm `outline: 2px solid #0071e3` e `outline-offset: 2px`
- [x] O leitor de CSS dos testes lê seletores com `:has()`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 204 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): style skip link, scroll padding, and focus`

---
### T27: Dimensionar as bolinhas e subir o contraste

**Status**: done

**What**: Bolinha-botão de 44px com ponto de 8px e 8px entre botões. Texto secundário do claro em `#333333`, sem `#7a7a7a`.
**Where**: `gerador/estilos.css`
**Depends on**: T21
**Reuses**: `.bolinhas`, `.bolinha`, `.parcelamento`, `dt`
**Requirement**: VITR-84, VITR-86, VITR-87
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `.bolinha` tem `width` e `height` de pelo menos 44px. `.bolinha::before` tem 8px. `.bolinhas` tem `gap: 8px`
- [x] `[aria-current="true"]` pinta o ponto de `#0066cc` no claro e `#2997ff` no escuro
- [x] `.parcelamento` e `dt` usam `#333333` no claro
- [x] `#7a7a7a` não aparece em `gerador/estilos.css`
- [x] Gate check passes: `python3 -m unittest discover -s tests -q`
- [x] Test count: at least 208 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: quick
**Commit**: `feat(vitrine): size the carousel dots and raise contrast`

---
### T28: Respeitar movimento reduzido e acertar a tipografia

**Status**: pending

**What**: `prefers-reduced-motion` desliga o `scale(0.95)`. Preço com números tabulares, títulos com `balance`, nome do card quebrando e grade de coluna única em `minmax(0, 1fr)`.
**Where**: `gerador/estilos.css`
**Depends on**: None
**Reuses**: `:active` existente, `.preco`, `.grade-vitrine`
**Requirement**: VITR-104, VITR-105, VITR-106, VITR-107, VITR-108
**Complexity**: low

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Dentro de `@media (prefers-reduced-motion: reduce)`, `#controle-tema:active`, `.pilula:active` e `.seta:active` têm `transform: none`
- [ ] `.preco` tem `font-variant-numeric: tabular-nums`
- [ ] `h1`, `.nome-vendedor` e `.card .nome` têm `text-wrap: balance`. `.card .nome` tem `overflow-wrap: anywhere`
- [ ] Toda coluna da grade, em todo intervalo, é `minmax(0, 1fr)`, e a contagem de colunas não muda
- [ ] O leitor de CSS dos testes lê o bloco `@media (prefers-reduced-motion: reduce)`
- [ ] Gate check passes: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- [ ] Test count: at least 213 tests pass. Nenhum teste some sem um substituto que afirme o resultado novo da spec

**Tests**: unit
**Gate**: build
**Commit**: `feat(vitrine): honor reduced motion and tune type`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8

Phase 1: T1 → T2 → T3
Phase 2: T4 → T5 → T6
Phase 3: T7 → T11
Phase 3: T8 → T11
Phase 3: T9 → T11
Phase 3: T10 → T11
Phase 4: T12 → T13
Phase 5: T14
Phase 6: T15 → T16 → T17 → T18
Phase 7: T19
Phase 7: T20
Phase 7: T21 → T22
Phase 7: T23
Phase 8: T24
Phase 8: T25
Phase 8: T26
Phase 8: T27
Phase 8: T28
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
| T15: Ler o tamanho de PNG e JPEG | 1 função, 2 formatos | ✅ Granular |
| T16: Ler o tamanho de WebP | 1 formato | ✅ Granular |
| T17: Ler o tamanho de AVIF | 1 formato | ✅ Granular |
| T18: Guardar o tamanho no modelo | 1 regra + troca de tipo propagada | ⚠️ Coeso: a troca de `list[str]` por `list[Imagem]` precisa dos consumidores no mesmo commit para o gate ficar verde |
| T19: Viewport e link de pular | 1 função (`_pagina`) | ✅ Granular |
| T20: Tamanho e carga das fotos | 2 funções no mesmo módulo | ✅ Granular |
| T21: Bolinhas como botões | 1 função | ✅ Granular |
| T22: Ir para a foto da bolinha | 1 função | ✅ Granular |
| T23: Nome do modo atual | 1 função | ✅ Granular |
| T24: Quadro quadrado | 2 regras CSS | ✅ Granular |
| T25: Tema escuro completo | seletores escuros | ✅ Granular |
| T26: Link de pular, respiro e foco | 1 preocupação: teclado | ✅ Granular |
| T27: Bolinhas e contraste | 2 regras CSS | ✅ Granular |
| T28: Movimento e tipografia | acabamento CSS | ✅ Granular |

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
| T15 | None | início da fase 6 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | None | fase 7, sem seta | ✅ Match |
| T20 | T18 | fase 7, sem seta interna. T18 é da fase 6 | ✅ Match |
| T21 | None | início de T21 → T22 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | None | fase 7, sem seta | ✅ Match |
| T24 | None | fase 8, sem seta | ✅ Match |
| T25 | None | fase 8, sem seta | ✅ Match |
| T26 | T19 | fase 8, sem seta interna. T19 é da fase 7 | ✅ Match |
| T27 | T21 | fase 8, sem seta interna. T21 é da fase 7 | ✅ Match |
| T28 | None | fase 8, sem seta | ✅ Match |

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
| T15: Ler o tamanho de PNG e JPEG | Imagem | unit | unit | ✅ OK |
| T16: Ler o tamanho de WebP | Imagem | unit | unit | ✅ OK |
| T17: Ler o tamanho de AVIF | Imagem | unit | unit | ✅ OK |
| T18: Guardar o tamanho no modelo | Validar, Modelo, Publicar, CLI | integration (maior entre unit e integration) | integration | ✅ OK |
| T19: Viewport e link de pular | Renderizar | unit | unit | ✅ OK |
| T20: Tamanho e carga das fotos | Renderizar | unit | unit | ✅ OK |
| T21: Bolinhas como botões | Renderizar | unit | unit | ✅ OK |
| T22: Ir para a foto da bolinha | Tema e carrossel | unit | unit | ✅ OK |
| T23: Nome do modo atual | Tema e carrossel | unit | unit | ✅ OK |
| T24: Quadro quadrado | Estilos | unit | unit | ✅ OK |
| T25: Tema escuro completo | Estilos | unit | unit | ✅ OK |
| T26: Link de pular, respiro e foco | Estilos | unit | unit | ✅ OK |
| T27: Bolinhas e contraste | Estilos | unit | unit | ✅ OK |
| T28: Movimento e tipografia | Estilos | unit | unit | ✅ OK |
