# Catálogo estático Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/catalogo-estatico/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `STACK-REFERENCIA.md` (Vitest ao lado do código, piso de cobertura 80%, `pnpm -r test`, `pnpm build`). O repositório hoje roda pytest no gerador Python. Essa suíte sai na T27. Os comandos abaixo são os do workspace novo, não os do pytest.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Dinheiro e ordenação | unit | Todos os ramos; 1:1 com CAT-08, CAT-09, CAT-46, CAT-47, CAT-48, CAT-95, CAT-96, CAT-97, CAT-98 | `shared/src/money.test.ts` | `pnpm test` |
| Schemas Zod | unit | Todos os ramos; 1:1 com CAT-01 a CAT-07, CAT-10 a CAT-15 e CAT-150 | `shared/src/schemas/*.test.ts` | `pnpm test` |
| Build do catálogo | unit | CAT-16 a CAT-27; JSON inválido termina com erro; o módulo não carrega bytes | `client/scripts/catalog.test.ts` | `pnpm test` |
| Dist | unit | CAT-20, CAT-21, CAT-22 | `client/scripts/dist.test.ts` | `pnpm test` |
| Rotas e páginas | unit | Cada rota: caminho feliz, borda e erro. CAT-28 a CAT-45, CAT-49 a CAT-89, CAT-92 a CAT-115, CAT-121, CAT-122, CAT-149, CAT-151 | `client/src/**/*.test.tsx` | `pnpm test` |
| Tema | unit | CAT-116 a CAT-119 | `client/src/components/theme-provider.test.tsx` | `pnpm test` |
| Workspace, CSS, DESIGN.md, skill, remoção | none | Gate de build. A skill não entra na suíte (CAT-148) | - | `pnpm test && pnpm build` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Não há ESLint nem CI neste plano.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Depois de tarefa com teste unitário | `pnpm test` |
| Full | Depois de tarefa que sobe o app montado | `pnpm test` |
| Build | Depois da última tarefa da fase, ou tarefa sem teste | `pnpm test && pnpm build` |

---

## Execution Plan

As fases rodam em ordem. As tarefas dentro da fase também.

### Phase 1: Contratos

```
T1 → T2 → T4 → T5
T1 → T3 → T5
```

### Phase 2: Build estático

```
T6 → T7 → T9 → T10 → T11 → T12
T6 → T8 → T10
```

### Phase 3: Casca do app

```
T13 → T14 → T15 → T16 → T18
T13 → T17 → T18
```

### Phase 4: Grade

```
T19 → T21 → T22
T20 → T21
```

### Phase 5: Página do relógio

```
T23 → T24
T23 → T25
```

### Phase 6: Skill e limpeza

```
T26 → T27
```

---

## Task Breakdown

### Phase 1: Contratos

### T1: Subir o workspace

**What**: Criar a raiz pnpm com `package.json` (`packageManager` pnpm 12.3.4, scripts `test` = `pnpm -r test` e `build` = `pnpm --filter client build`), `pnpm-workspace.yaml` listando `shared`, o pacote `@catalogo/shared` com Vitest e um teste sentinela que passa, e `.gitignore` com `node_modules`, `dist`, `coverage` e `client/src/catalog/products.generated.ts`.
**Where**: `package.json`
**Depends on**: None
**Reuses**: `STACK-REFERENCIA.md` (pnpm, Node 22, Vitest ao lado do código)
**Complexity**: low
**Status**: done
**Requirement**: CAT-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `pnpm test` termina com o sentinela passando
- [x] O `.gitignore` cita o módulo gerado
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 1 teste passa

**Tests**: unit
**Gate**: quick

**Commit**: `build(shared): sobe o workspace pnpm`

---

### T2: Funções de preço e ordem

**What**: Implementar `truncateReais`, `formatBrl`, `discountPercent` e `compareTitles` em um módulo, com testes.
**Where**: `shared/src/money.ts`
**Depends on**: T1
**Reuses**: `shared/src/sentinel.test.ts`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-08, CAT-09, CAT-46, CAT-47, CAT-48, CAT-95, CAT-96, CAT-97, CAT-98

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `369.999` vira `369.99` sem arredondar, e `369.9` continua aceitável para quem formatar
- [x] `formatBrl(369.9)` é `R$ 369,90` e `formatBrl(1234.5)` é `R$ 1.234,50`
- [x] `discountPercent(369.9, 450)` é `17`
- [x] `compareTitles` ordena Addiesdive, CURREN, Seculus e é estável
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 8 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): formata preço e ordena título`

---

### T3: Contrato do vendedor

**What**: Criar `SellerSchema` com slug, nome e telefone só de dígitos, entre 10 e 15.
**Where**: `shared/src/schemas/seller.ts`
**Depends on**: T1
**Reuses**: `shared/src/money.ts` não entra aqui
**Complexity**: low
**Status**: done
**Requirement**: CAT-01, CAT-02, CAT-03, CAT-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `5511999999999` passa
- [x] `+55`, espaço, parêntese, letra, 9 dígitos e 16 dígitos falham
- [x] Slug fora de `^[a-z0-9]+(?:-[a-z0-9]+)*$` falha
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 6 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): valida o vendedor`

---

### T4: Contrato do relógio

**What**: Criar `ProductSchema` com preço cortado antes da comparação, fotos e campos opcionais.
**Where**: `shared/src/schemas/product.ts`
**Depends on**: T2
**Reuses**: `shared/src/money.ts`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-04, CAT-05, CAT-06, CAT-07, CAT-10, CAT-11, CAT-12, CAT-13, CAT-14, CAT-15, CAT-150

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Zero, negativo e `listPrice` menor ou igual ao `price` depois do corte falham
- [x] `369.9` passa e `369.999` fica `369.99` antes da comparação
- [x] Lista de fotos vazia falha; nome com `/` ou `\` falha
- [x] Extensão `jpg`, `jpeg`, `png`, `webp` ou `avif` em qualquer caixa passa, e o nome guardado é o do JSON
- [x] `listPrice`, `details`, `specifications` e `observations` podem faltar
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 10 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): valida o relógio`

---

### T5: Barril do shared

**What**: Exportar schemas e funções de dinheiro por `shared/src/index.ts`.
**Where**: `shared/src/index.ts`
**Depends on**: T3, T4
**Reuses**: `shared/src/schemas/seller.ts`, `shared/src/schemas/product.ts`
**Complexity**: low
**Status**: done
**Requirement**: CAT-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Um teste importa `SellerSchema`, `ProductSchema`, `formatBrl` e `truncateReais` do barril
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 1 teste novo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): exporta os contratos`

---

### Phase 2: Build estático

### T6: Pacote client

**What**: Criar `client/package.json` com Vite, React 19, React Router v7, Tailwind v4, shadcn e Vitest, e incluir `client` no workspace.
**Where**: `client/package.json`
**Depends on**: T1
**Reuses**: `STACK-REFERENCIA.md` seção do client, sem o pacote `server`
**Complexity**: low
**Status**: done
**Requirement**: CAT-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `pnpm install` resolve o workspace
- [x] O client tem um teste sentinela verde
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 1 teste no client, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `build(client): cria o pacote vite`

---

### T7: Validar catálogo e gerar módulo

**What**: Implementar `validateCatalog` e `writeProductsModule`. O módulo traz nomes de arquivo e não traz bytes. Não existe `index.json`.
**Where**: `client/scripts/catalog.ts`
**Depends on**: T4, T6
**Reuses**: `@catalogo/shared`
**Complexity**: high
**Status**: done
**Requirement**: CAT-16, CAT-17, CAT-18, CAT-19, CAT-23, CAT-24, CAT-25, CAT-26, CAT-27

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Diretório temporário válido devolve a lista de produtos
- [x] JSON inválido e conjunto de fotos diferente lançam erro
- [x] O arquivo gerado contém o nome da foto e não contém base64 nem o byte da imagem
- [x] O caminho do módulo está no `.gitignore`
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 6 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): valida o catálogo no build`

---

### T8: Arquivo _redirects

**What**: Gravar `client/public/_redirects` com a linha `/* /index.html 200`.
**Where**: `client/public/_redirects`
**Depends on**: T6
**Reuses**: nada
**Complexity**: low
**Status**: done
**Requirement**: CAT-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo tem essa linha
- [x] Um teste lê o arquivo e exige a linha
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 1 teste novo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): adiciona o fallback spa`

---

### T9: Vendedores iniciais

**What**: Gravar os três vendedores e deixar `products/` sem pasta de relógio.
**Where**: `client/public/catalog/sellers.json`
**Depends on**: T7
**Reuses**: `SellerSchema`
**Complexity**: low
**Status**: done
**Requirement**: CAT-123, CAT-124

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O JSON tem alexandre `5585997689165`, manuela `5585996043447` e ana-claudia `5585992387201`
- [x] `validateCatalog` aceita esse diretório
- [x] Não há `products/*/product.json`
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 2 testes novos, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): grava os três vendedores`

---

### T10: Emitir o dist

**What**: O script `build` do client roda a validação, escreve o módulo e chama o Vite. O `dist` tem um `index.html`, CSS, JS, a cópia de `catalog/**` e o `_redirects`. Não há HTML por relógio.
**Where**: `client/vite.config.ts`
**Depends on**: T8, T9
**Reuses**: `client/scripts/catalog.ts`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-20, CAT-21, CAT-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `pnpm build` sai com código zero no catálogo vazio de produtos
- [x] `client/dist` tem um só `index.html`, o `_redirects` e `catalog/sellers.json`
- [x] Não existe `client/dist/relogio/**/index.html`
- [x] Gate: `pnpm test && pnpm build`
- [x] Test count: pelo menos 3 testes em `client/scripts/dist.test.ts`, suíte inteira verde

**Tests**: unit
**Gate**: build

**Commit**: `feat(client): emite o dist estático`

---

### T11: Token primary-tint

**What**: Acrescentar `{colors.primary-tint}` ao `DESIGN.md` com as cores do selo no tema claro e no escuro.
**Where**: `DESIGN.md`
**Depends on**: T10
**Reuses**: as cores já descritas na spec
**Complexity**: low
**Status**: done
**Requirement**: CAT-120

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O `DESIGN.md` nomeia o token e os quatro valores (texto e fundo, claro e escuro)
- [x] Gate: `pnpm test && pnpm build`
- [x] Test count: a suíte não perde testes

**Tests**: none
**Gate**: build

**Commit**: `docs(design): registra primary-tint`

---

### T12: CSS do tema

**What**: Criar `client/src/index.css` com os tokens do `DESIGN.md`, os dois temas e a coluna de no máximo 1120 px com 24 px de respiro.
**Where**: `client/src/index.css`
**Depends on**: T11
**Reuses**: `DESIGN.md`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-39, CAT-40, CAT-41, CAT-42

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Existem variáveis do tema claro e do escuro, inclusive `primary-tint` e `ink-muted-48`
- [x] A classe da coluna limita a 1120 px e aplica 24 px nas laterais
- [x] Gate: `pnpm test && pnpm build`
- [x] Test count: a suíte não perde testes

**Tests**: none
**Gate**: build

**Commit**: `feat(client): define os tokens do tema`

---

### Phase 3: Casca do app

### T13: Rotas

**What**: Declarar `/` e `/relogio/:slug` com `createBrowserRouter`, lendo `seller` da query.
**Where**: `client/src/app/router.tsx`
**Depends on**: T10
**Reuses**: o router do `STACK-REFERENCIA.md`
**Complexity**: low
**Status**: done
**Requirement**: CAT-57

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] As duas rotas resolvem
- [x] A search string `seller` chega ao loader
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 2 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): declara as duas rotas`

---

### T14: Entrada do app

**What**: Montar o React em `main.tsx` com o router e o CSS.
**Where**: `client/src/main.tsx`
**Depends on**: T12, T13
**Reuses**: `client/src/app/router.tsx`
**Complexity**: low
**Status**: done
**Requirement**: CAT-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `client/index.html` aponta para `main.tsx`
- [x] `pnpm build` continua verde
- [x] Gate: `pnpm test && pnpm build`
- [x] Test count: a suíte não perde testes

**Tests**: unit
**Gate**: build

**Commit**: `feat(client): monta a entrada do app`

---

### T15: Tema persistido

**What**: Tema claro e escuro. Sem chave, segue o sistema. O controle grava `theme:v1` no `localStorage`. Um script em `index.html` aplica a classe antes do React.
**Where**: `client/src/components/theme-provider.tsx`
**Depends on**: T14
**Reuses**: `client/src/index.css`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-116, CAT-117, CAT-118, CAT-119

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem chave, a classe segue `prefers-color-scheme`
- [x] O controle grava `light` ou `dark` em `theme:v1` e troca a classe
- [x] A foto não recebe filtro de tema
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 4 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): guarda a escolha de tema`

---

### T16: Barra de cima

**What**: Barra na largura toda, miolo de 1120 px, `Catálogo {name}` e o tema à direita. Na rota `/` não há ícone de voltar.
**Where**: `client/src/components/catalog/top-bar.tsx`
**Depends on**: T15
**Reuses**: `client/src/components/theme-provider.tsx`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-36, CAT-37, CAT-38, CAT-44, CAT-45

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Com seller Alexandre o texto é `Catálogo Alexandre`
- [x] Na grade não existe botão com nome acessível `Voltar`
- [x] O controle de tema fica à direita
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 3 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): mostra a barra do catálogo`

---

### T17: Leitura dos vendedores

**What**: `loadSellers` busca `/catalog/sellers.json` e valida com `SellerSchema`.
**Where**: `client/src/catalog/sellers.ts`
**Depends on**: T13
**Reuses**: `SellerSchema`
**Complexity**: low
**Status**: done
**Requirement**: CAT-29

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A função pede exatamente `/catalog/sellers.json`
- [x] Resposta inválida rejeita
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 2 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): carrega sellers.json`

---

### T18: Seller ausente

**What**: Sem `seller`, com slug desconhecido ou com falha ao ler o arquivo, mostrar o erro e esconder a grade e o botão.
**Where**: `client/src/routes/seller-gate.tsx`
**Depends on**: T16, T17
**Reuses**: `client/src/catalog/sellers.ts`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-30, CAT-31, CAT-32, CAT-33, CAT-34, CAT-35, CAT-149

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem query o texto é `Este link está incompleto ou o vendedor não existe.`
- [x] `seller=Alexandre` cai no mesmo erro
- [x] Não há lista de relógios nem **Eu quero!**
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 3 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): recusa seller desconhecido`

---

### Phase 4: Grade

### T19: Bloco de preço

**What**: Mostrar só o preço atual, ou o riscado `De R$ …`, o preço e o selo. Abaixo de 1% o riscado fica e o selo some.
**Where**: `client/src/components/catalog/price-block.tsx`
**Depends on**: T2
**Reuses**: `formatBrl`, `discountPercent`
**Complexity**: medium
**Status**: done
**Requirement**: CAT-95, CAT-96, CAT-97, CAT-98, CAT-99, CAT-100, CAT-101, CAT-102, CAT-103, CAT-104, CAT-105, CAT-106, CAT-107, CAT-108, CAT-109

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem `listPrice`, só `R$ 369,90` para `369.9`
- [x] Com `450` e `369.90`, o texto riscado é `De R$ 450,00` e o selo é `−17%`
- [x] Desconto abaixo de 1% não renderiza o selo
- [x] O selo usa as cores do tema claro e do escuro, sem verde e sem vermelho
- [x] O riscado usa `ink-muted-48`
- [x] Gate: `pnpm test`
- [x] Test count: pelo menos 6 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): mostra preço e selo`

---

### T20: Link Eu quero!

**What**: Link `https://wa.me/<phone>?text=` com a mensagem codificada, `target="_blank"` e `rel="noopener noreferrer"`.
**Where**: `client/src/components/catalog/want-link.tsx`
**Depends on**: T3
**Reuses**: o telefone do `SellerSchema`
**Complexity**: low
**Requirement**: CAT-110, CAT-111, CAT-112, CAT-113, CAT-114, CAT-115

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O href é `https://wa.me/5585997689165?text=` mais `Olá, tenho interesse no Seculus.` codificado
- [ ] Não usa `whatsapp://`
- [ ] O clique não tira a aba do catálogo (`target="_blank"`)
- [ ] Gate: `pnpm test`
- [ ] Test count: pelo menos 3 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): abre o whatsapp do vendedor`

---

### T21: Card do relógio

**What**: Card com a primeira foto em moldura 1:1, título, preço e **Eu quero!**. O resto do card abre `/relogio/<slug>` e conserva `seller`. A foto aponta para `/catalog/products/<slug>/img/<arquivo>`.
**Where**: `client/src/components/catalog/watch-card.tsx`
**Depends on**: T19, T20
**Reuses**: `PriceBlock`, `WantLink`
**Complexity**: medium
**Requirement**: CAT-28, CAT-52, CAT-53, CAT-54, CAT-55, CAT-56

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A imagem usa `object-contain` e a primeira entrada de `images`
- [ ] O texto do card alinha à esquerda
- [ ] O link do card é `/relogio/<slug>?seller=alexandre` quando a query é essa
- [ ] O href da foto é `/catalog/products/<slug>/img/<arquivo>`
- [ ] Gate: `pnpm test`
- [ ] Test count: pelo menos 4 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): mostra o card do relógio`

---

### T22: Página da grade

**What**: Grade ordenada por título em português, estável, com uma, duas ou três colunas conforme a largura. Vazia, mostra o texto da vitrine e mantém `Catálogo {name}`.
**Where**: `client/src/routes/catalog-page.tsx`
**Depends on**: T18, T21
**Reuses**: `compareTitles`, `WatchCard`, `TopBar`
**Complexity**: medium
**Requirement**: CAT-43, CAT-46, CAT-47, CAT-48, CAT-49, CAT-50, CAT-51, CAT-121, CAT-122

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Addiesdive, CURREN e Seculus aparecem nessa ordem
- [ ] Abaixo de 768 px uma coluna; de 768 a 1023 duas; de 1024 em diante três
- [ ] Sem produtos, o texto é `A vitrine ainda não tem relógios.` e a barra segue `Catálogo {name}`
- [ ] Grade, erro e vazio ficam na coluna
- [ ] Gate: `pnpm test`
- [ ] Test count: pelo menos 5 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): lista a grade do vendedor`

---

### Phase 5: Página do relógio

### T23: Página do relógio

**What**: Coluna com carrossel, título, preço, **Eu quero!** e as seções que existem. Voltar e o nome vão para `/?seller=` sem usar o histórico. Slug ausente mostra o erro e esconde o botão.
**Where**: `client/src/routes/watch-page.tsx`
**Depends on**: T20, T21, T22
**Reuses**: `TopBar`, `PriceBlock`, `WantLink`
**Complexity**: high
**Requirement**: CAT-57, CAT-58, CAT-59, CAT-60, CAT-61, CAT-62, CAT-63, CAT-64, CAT-65, CAT-66, CAT-67, CAT-68, CAT-69, CAT-87, CAT-88

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O ícone tem nome acessível `Voltar` e o href é `/?seller=alexandre`
- [ ] `Catálogo {name}` aponta para o mesmo href
- [ ] O teste não encontra chamada a `history.back`
- [ ] `Detalhes`, `Especificações` e `Observações` somem quando o campo falta, é `""` ou a lista é vazia
- [ ] A tabela não tem cabeçalho e o texto alinha à esquerda
- [ ] Slug ausente mostra `Este relógio não está no catálogo.` e não mostra **Eu quero!**
- [ ] Gate: `pnpm test`
- [ ] Test count: pelo menos 8 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): abre a página do relógio`

---

### T24: Carrossel

**What**: Carrossel só na página do relógio. Moldura 1:1 de altura estável. Com duas fotos ou mais, setas sempre visíveis, bolinhas e volta nos dois sentidos. Deslize de 300 ms. Sem autoplay. Uma foto não tem gesto. Menos movimento troca na hora. Setas do teclado com foco.
**Where**: `client/src/components/catalog/carousel.tsx`
**Depends on**: T23
**Reuses**: nada de biblioteca de carrossel
**Complexity**: high
**Requirement**: CAT-70, CAT-71, CAT-72, CAT-73, CAT-74, CAT-75, CAT-76, CAT-77, CAT-78, CAT-79, CAT-80, CAT-81, CAT-82, CAT-83, CAT-84, CAT-85, CAT-86

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A ordem é a de `images` e a caixa tem `aspect-square`
- [ ] Próxima na última volta para a primeira; anterior na primeira volta para a última
- [ ] Cada bolinha escolhe a foto
- [ ] Arraste horizontal dá a volta nos dois sentidos
- [ ] A transição é 300 ms e 0 ms com `prefers-reduced-motion: reduce`
- [ ] Com uma foto não há seta, bolinha nem gesto
- [ ] ArrowRight e ArrowLeft com foco seguem a mesma volta
- [ ] Gate: `pnpm test`
- [ ] Test count: pelo menos 8 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): adiciona o carrossel`

---

### T25: Barra de baixo

**What**: Quando **Eu quero!** do meio não está inteiro na tela, inclusive na primeira pintura, a barra mostra o preço e o mesmo botão. Quando está inteiro, a barra some. De 768 px em diante, preço à esquerda e botão à direita. Abaixo, preço em cima e botão na largura do miolo. Respeita a área segura.
**Where**: `client/src/components/catalog/sticky-bar.tsx`
**Depends on**: T19, T23
**Reuses**: `floating-sticky-bar` do `DESIGN.md`, `PriceBlock`, `WantLink`
**Complexity**: high
**Requirement**: CAT-89, CAT-90, CAT-91, CAT-92, CAT-93, CAT-94, CAT-151

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Um `IntersectionObserver` falso sem interseção total mostra a barra já na primeira pintura
- [ ] Interseção total esconde a barra
- [ ] O teste de largura cobre as duas disposições
- [ ] O estilo usa `env(safe-area-inset-bottom)` e o blur `saturate(180%) blur(20px)`
- [ ] Gate: `pnpm test`
- [ ] Test count: pelo menos 4 testes neste arquivo, suíte inteira verde

**Tests**: unit
**Gate**: quick

**Commit**: `feat(client): fixa a barra de baixo`

---

### Phase 6: Skill e limpeza

### T26: Skill de cadastro

**What**: Escrever a skill que cadastra só relógio, nos dois modos de entrada, com a ordem das fotos, o slug, a leitura completa e a gravação só depois de `sim` sozinho.
**Where**: `.agents/skills/cadastrar-relogio/SKILL.md`
**Depends on**: T4
**Reuses**: o contrato de `ProductSchema`
**Complexity**: medium
**Requirement**: CAT-125, CAT-126, CAT-127, CAT-128, CAT-129, CAT-130, CAT-131, CAT-132, CAT-133, CAT-134, CAT-135, CAT-136, CAT-137, CAT-138, CAT-139, CAT-140, CAT-141, CAT-142, CAT-143, CAT-144, CAT-145, CAT-146, CAT-147, CAT-148

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A skill exige título, preço e ao menos uma foto, mostra o slug e só grava com `sim` sozinho
- [ ] `Seculus — kit com cantil` vira `seculus-kit-com-cantil`
- [ ] Diretório numerado ordena `foto2` antes de `foto10`; nome sem número pede a ordem
- [ ] Pasta existente pede outro slug e não sobrescreve
- [ ] A skill não altera `sellers.json`, não commita e não migra o catálogo antigo
- [ ] A skill declara que não entra na suíte
- [ ] Gate: `pnpm test && pnpm build`
- [ ] Test count: a suíte não ganha teste da skill e não perde os que já passam

**Tests**: none
**Gate**: build

**Commit**: `feat(skill): cadastra relógio com confirmação`

---

### T27: Remover o gerador Python

**What**: Apagar `gerador/`, `tests/`, `site/`, `.specs/features/vitrine-relogios/` e `.specs/features/ajustes-site/`. Manter `DESIGN.md` e `STACK-REFERENCIA.md`.
**Where**: `gerador/validar.py`
**Depends on**: T25, T26
**Reuses**: nada do gerador
**Complexity**: low
**Requirement**: CAT-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Essas cinco pastas não existem
- [ ] `DESIGN.md` e `STACK-REFERENCIA.md` continuam
- [ ] `pnpm test` e `pnpm build` passam
- [ ] Gate: `pnpm test && pnpm build`
- [ ] Test count: só a suíte Vitest, verde

**Tests**: none
**Gate**: build

**Commit**: `chore(catalogo): remove o gerador python`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 → T2 → T4 → T5
          T1 → T3 → T5
Phase 2:  T6 → T7 → T9 → T10 → T11 → T12
          T6 → T8 → T10
Phase 3:  T13 → T14 → T15 → T16 → T18
          T13 → T17 → T18
Phase 4:  T19 → T21 → T22
          T20 → T21
Phase 5:  T23 → T24
          T23 → T25
Phase 6:  T26 → T27
```

São 27 tarefas. Na execução isso vira cinco lotes, em ordem: fase 1; fase 2; fase 3; fases 4 e 5; fase 6. Cada lote espera o anterior terminar.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Subir o workspace | Raiz, workspace e pacote shared no mesmo entregável, para `pnpm test` passar | ⚠️ Coeso |
| T2: Funções de preço e ordem | 1 módulo | ✅ Granular |
| T3: Contrato do vendedor | 1 schema | ✅ Granular |
| T4: Contrato do relógio | 1 schema | ✅ Granular |
| T5: Barril do shared | 1 arquivo | ✅ Granular |
| T6: Pacote client | 1 pacote | ✅ Granular |
| T7: Validar catálogo e gerar módulo | 1 módulo | ✅ Granular |
| T8: Arquivo _redirects | 1 arquivo | ✅ Granular |
| T9: Vendedores iniciais | 1 JSON | ✅ Granular |
| T10: Emitir o dist | Vite mais o teste do dist | ⚠️ Coeso |
| T11: Token primary-tint | 1 documento | ✅ Granular |
| T12: CSS do tema | 1 folha | ✅ Granular |
| T13: Rotas | 1 módulo | ✅ Granular |
| T14: Entrada do app | 1 entrada | ✅ Granular |
| T15: Tema persistido | 1 componente | ✅ Granular |
| T16: Barra de cima | 1 componente | ✅ Granular |
| T17: Leitura dos vendedores | 1 módulo | ✅ Granular |
| T18: Seller ausente | 1 componente | ✅ Granular |
| T19: Bloco de preço | 1 componente | ✅ Granular |
| T20: Link Eu quero! | 1 componente | ✅ Granular |
| T21: Card do relógio | 1 componente | ✅ Granular |
| T22: Página da grade | 1 página | ✅ Granular |
| T23: Página do relógio | 1 página | ✅ Granular |
| T24: Carrossel | 1 componente | ✅ Granular |
| T25: Barra de baixo | 1 componente | ✅ Granular |
| T26: Skill de cadastro | 1 skill | ✅ Granular |
| T27: Remover o gerador Python | Apaga as pastas do gerador | ⚠️ Coeso |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | sem seta de entrada | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T2 | T2 → T4 | ✅ Match |
| T5 | T3, T4 | T3 → T5 e T4 → T5 | ✅ Match |
| T6 | T1 | T1 é outra fase | ✅ Match |
| T7 | T4, T6 | T6 → T7; T4 é outra fase | ✅ Match |
| T8 | T6 | T6 → T8 | ✅ Match |
| T9 | T7 | T7 → T9 | ✅ Match |
| T10 | T8, T9 | T8 → T10 e T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T10 | T10 é outra fase | ✅ Match |
| T14 | T12, T13 | T13 → T14; T12 é outra fase | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T13 | T13 → T17 | ✅ Match |
| T18 | T16, T17 | T16 → T18 e T17 → T18 | ✅ Match |
| T19 | T2 | T2 é outra fase | ✅ Match |
| T20 | T3 | T3 é outra fase | ✅ Match |
| T21 | T19, T20 | T19 → T21 e T20 → T21 | ✅ Match |
| T22 | T18, T21 | T21 → T22; T18 é outra fase | ✅ Match |
| T23 | T20, T21, T22 | T20, T21 e T22 são outra fase | ✅ Match |
| T24 | T23 | T23 → T24 | ✅ Match |
| T25 | T19, T23 | T23 → T25; T19 é outra fase | ✅ Match |
| T26 | T4 | T4 é outra fase | ✅ Match |
| T27 | T25, T26 | T26 → T27; T25 é outra fase | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Subir o workspace | Workspace | none para config; o sentinela é unit | unit | ✅ OK |
| T2: Funções de preço e ordem | Dinheiro e ordenação | unit | unit | ✅ OK |
| T3: Contrato do vendedor | Schemas Zod | unit | unit | ✅ OK |
| T4: Contrato do relógio | Schemas Zod | unit | unit | ✅ OK |
| T5: Barril do shared | Schemas Zod | unit | unit | ✅ OK |
| T6: Pacote client | Workspace | unit no sentinela | unit | ✅ OK |
| T7: Validar catálogo e gerar módulo | Build do catálogo | unit | unit | ✅ OK |
| T8: Arquivo _redirects | Build do catálogo | unit | unit | ✅ OK |
| T9: Vendedores iniciais | Build do catálogo | unit | unit | ✅ OK |
| T10: Emitir o dist | Dist | unit | unit | ✅ OK |
| T11: Token primary-tint | DESIGN.md | none | none | ✅ OK |
| T12: CSS do tema | CSS | none | none | ✅ OK |
| T13: Rotas | Rotas e páginas | unit | unit | ✅ OK |
| T14: Entrada do app | Rotas e páginas | unit | unit | ✅ OK |
| T15: Tema persistido | Tema | unit | unit | ✅ OK |
| T16: Barra de cima | Rotas e páginas | unit | unit | ✅ OK |
| T17: Leitura dos vendedores | Rotas e páginas | unit | unit | ✅ OK |
| T18: Seller ausente | Rotas e páginas | unit | unit | ✅ OK |
| T19: Bloco de preço | Rotas e páginas | unit | unit | ✅ OK |
| T20: Link Eu quero! | Rotas e páginas | unit | unit | ✅ OK |
| T21: Card do relógio | Rotas e páginas | unit | unit | ✅ OK |
| T22: Página da grade | Rotas e páginas | unit | unit | ✅ OK |
| T23: Página do relógio | Rotas e páginas | unit | unit | ✅ OK |
| T24: Carrossel | Rotas e páginas | unit | unit | ✅ OK |
| T25: Barra de baixo | Rotas e páginas | unit | unit | ✅ OK |
| T26: Skill de cadastro | skill | none | none | ✅ OK |
| T27: Remover o gerador Python | remoção | none | none | ✅ OK |
