# PWA do Achavio Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/pwa/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. O runner está em `client/package.json` (`vitest run`) e o teste de documento já existe em `client/src/main.test.tsx`. Não há script de lint nem limite de cobertura.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Shell estático (manifest, HTML, service worker, ícones) | unit | Cada AC de arquivo do spec, incluindo borda de tamanho dos PNG | `client/src/pwa/web-app-manifest.test.ts` e o teste de ícone em `client/src/main.test.tsx` | `pnpm --filter client exec vitest run src/pwa/web-app-manifest.test.ts src/main.test.tsx` |
| Domínio do convite | unit | Todos os ramos. 1:1 com os ACs do módulo. Cada borda da spec tem teste | `client/src/pwa/install-prompt.test.ts` | `pnpm --filter client exec vitest run src/pwa/install-prompt.test.ts` |
| UI da vitrine e da barra | unit | Caminho feliz, largura, standalone, ficha e falha de `prompt()` | `client/src/components/catalog/*.test.tsx` | `pnpm --filter client exec vitest run src/components/catalog/install-notice.test.tsx src/components/catalog/install-menu.test.tsx src/components/catalog/top-bar.test.tsx` |
| Entrada da aplicação | unit | Contrato do módulo e vitrine ainda renderiza se o registro falha | `client/src/main.test.tsx` | `pnpm --filter client exec vitest run src/main.test.tsx` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Depois de cada tarefa com teste de unidade | `pnpm --filter client exec vitest run` seguido dos arquivos da tarefa |
| Full | Não há suíte e2e neste repositório | O mesmo comando Quick da camada tocada |
| Build | Ao fechar a última tarefa | `pnpm --filter client test` |

---

## Execution Plan

### Phase 1: Shell

```
T1 → T2 → T3
```

### Phase 2: Convite

```
T4
```

### Phase 3: Vitrine

```
T5 → T6 → T7
```

### Phase 4: Arranque

```
T8
```

---

## Task Breakdown

### Phase 1: Shell

### T1: Publicar o manifest

**What**: Gravar `client/public/manifest.webmanifest` com os campos de PWA-01 e PWA-02 e um teste que também confere o tamanho dos três PNG.
**Complexity**: low
**Where**: `client/public/manifest.webmanifest`
**Depends on**: None
**Reuses**: `client/public/icons/icon-192.png`, `client/public/icons/icon-512.png`, `client/public/icons/apple-touch-icon.png`
**Requirement**: PWA-01, PWA-02, PWA-03, PWA-04, PWA-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O JSON tem nome Achavio, `start_url` `/`, `display` `standalone`, cores `#f5f5f7` e os três itens de ícone
- [x] O teste lê 192, 512 e 180 nos PNG já salvos
- [x] Gate check passes: `pnpm --filter client exec vitest run src/pwa/web-app-manifest.test.ts`
- [x] Test count: 1 teste passa

**Status**: Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): publica o manifest do Achavio`

---

### T2: Apontar o HTML para o manifest e para a logo

**What**: Trocar o cabeçalho de `client/index.html` pelos links e metas de PWA-06 a PWA-15 e atualizar a asserção de favicon em `main.test.tsx`.
**Complexity**: low
**Where**: `client/index.html`
**Depends on**: T1
**Reuses**: O teste de leitura de HTML em `client/src/main.test.tsx`
**Requirement**: PWA-06, PWA-07, PWA-08, PWA-09, PWA-10, PWA-11, PWA-12, PWA-13, PWA-14, PWA-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O HTML liga manifest, ícone 192, apple touch icon e as quatro metas
- [x] O viewport segue `width=device-width, initial-scale=1.0` e não contém `viewport-fit=cover` nem `favicon.svg`
- [x] Gate check passes: `pnpm --filter client exec vitest run src/pwa/web-app-manifest.test.ts src/main.test.tsx`
- [x] Test count: 2 testes no arquivo do manifest e a suíte de `main.test.tsx` passa

**Status**: Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): aponta o documento para o manifest`

---

### T3: Atender fetch pela rede

**What**: Criar `client/public/sw.js` com um único listener `fetch` que chama `event.respondWith(fetch(event.request))` e não menciona `caches`.
**Complexity**: low
**Where**: `client/public/sw.js`
**Depends on**: T2
**Reuses**: O teste de leitura de arquivo de T1
**Requirement**: PWA-17, PWA-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo tem o listener e a chamada `fetch(event.request)`
- [x] O teste falha se o fonte contiver `caches`
- [x] Gate check passes: `pnpm --filter client exec vitest run src/pwa/web-app-manifest.test.ts`
- [x] Test count: 3 testes passam

**Status**: Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): atende o fetch do service worker na rede`

---

### Phase 2: Convite

### T4: Guardar o evento de instalação

**What**: Implementar `client/src/pwa/install-prompt.ts` com adiamento do evento, iOS, standalone, chave do aviso e falha de `localStorage`.
**Complexity**: high
**Where**: `client/src/pwa/install-prompt.ts`
**Depends on**: T3
**Reuses**: Nenhum módulo de catálogo
**Requirement**: PWA-22, PWA-23, PWA-24, PWA-25, PWA-26, PWA-27, PWA-28, PWA-29, PWA-37, PWA-38

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `beforeinstallprompt` chama `preventDefault` e fica guardado
- [x] `accepted` e `appinstalled` gravam `achavio-install-notice-dismissed` = `1`
- [x] `dismissed` não grava a chave e descarta o evento
- [x] iPhone e iPadOS (`MacIntel` com `maxTouchPoints` > 1) devolvem `ios`
- [x] Fora do iOS e sem evento, o resultado é `unavailable`
- [x] Leitura e escrita que lançam não estouram a chamada
- [x] A chave não é ligada a um id de build
- [x] Gate check passes: `pnpm --filter client exec vitest run src/pwa/install-prompt.test.ts`
- [x] Test count: 10 testes passam

**Status**: Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): guarda o convite de instalação`

---

### Phase 3: Vitrine

### T5: Mostrar o aviso único

**What**: Criar o aviso e o hook `useInstallChrome` em `client/src/components/catalog/install-notice.tsx`.
**Complexity**: medium
**Where**: `client/src/components/catalog/install-notice.tsx`
**Depends on**: T4
**Reuses**: `install-prompt.ts` e a classe `catalog-column`
**Requirement**: PWA-30, PWA-31, PWA-32, PWA-33, PWA-34, PWA-35, PWA-36

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Abaixo de 768 px, sem chave e fora de standalone, o texto exato e o botão `Dispensar` aparecem
- [x] Dispensar grava a chave e o aviso some
- [x] Largura fora de `(max-width: 767px)`, `display-mode: standalone` e `navigator.standalone` ocultam o aviso
- [x] Gate check passes: `pnpm --filter client exec vitest run src/components/catalog/install-notice.test.tsx`
- [x] Test count: 5 testes passam

**Status**: Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): mostra o aviso único no celular`

---

### T6: Abrir o menu de instalação

**What**: Criar `client/src/components/catalog/install-menu.tsx` com um item e os três desfechos do `prompt`.
**Complexity**: medium
**Where**: `client/src/components/catalog/install-menu.tsx`
**Depends on**: T5
**Reuses**: `Button` ghost e `useInstallChrome` exportado pelo aviso
**Requirement**: PWA-41, PWA-42, PWA-43, PWA-44, PWA-45, PWA-46

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O botão `Menu` abre um único item `Adicionar à tela inicial`
- [x] Com evento adiado, o item chama `prompt()` e fecha o menu
- [x] No iPhone, o painel mostra a frase do Safari
- [x] Sem evento e fora do iOS, ou se `prompt()` rejeita, o painel mostra `Este navegador não permite criar o atalho.`
- [x] Em standalone o botão não renderiza
- [x] Gate check passes: `pnpm --filter client exec vitest run src/components/catalog/install-menu.test.tsx`
- [x] Test count: 5 testes passam

**Status**: Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): adiciona o menu de instalar na vitrine`

---

### T7: Encaixar aviso e menu na barra

**What**: Na vitrine, colocar o menu no slot esquerdo e o aviso abaixo do spacer. Na ficha, manter o Voltar e não montar os dois.
**Complexity**: medium
**Where**: `client/src/components/catalog/top-bar.tsx`
**Depends on**: T6
**Reuses**: A grade e o Voltar já existentes
**Requirement**: PWA-16, PWA-39, PWA-40, PWA-47, PWA-48, PWA-49, PWA-50

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Na vitrine o primeiro slot é `Menu`, o direito segue sem botão e a logo continua `/achavio_logo.webp`
- [ ] Abaixo de 768 px a vitrine mostra o aviso
- [ ] Na ficha, mesmo abaixo de 768 px, só existe `Voltar`
- [ ] Em standalone a vitrine não mostra menu nem aviso
- [ ] Gate check passes: `pnpm --filter client exec vitest run src/components/catalog/top-bar.test.tsx`
- [ ] Test count: a suíte da barra passa, com 3 testes novos

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pwa): coloca o menu à esquerda da vitrine`

---

### Phase 4: Arranque

### T8: Registrar o worker no carregamento

**What**: Em `client/src/main.tsx`, chamar `installInstallPromptListener()` fora de `AppRoot` e registrar `/sw.js` sem derrubar a vitrine se o registro falhar.
**Complexity**: medium
**Where**: `client/src/main.tsx`
**Depends on**: T4
**Reuses**: O guard de `#root` e os testes de `main.test.tsx`
**Requirement**: PWA-19, PWA-20, PWA-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O fonte chama `installInstallPromptListener()` no escopo do módulo
- [ ] O fonte chama `navigator.serviceWorker.register('/sw.js')` com `.catch(() => {})`
- [ ] Um `register` que rejeita ainda deixa a vitrine no ar
- [ ] Gate check passes: `pnpm --filter client test`
- [ ] Test count: a suíte do client passa, sem teste apagado

**Tests**: unit
**Gate**: build

**Commit**: `feat(pwa): registra o service worker no arranque`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 → T2 → T3
Phase 2:  T4
Phase 3:  T5 → T6 → T7
Phase 4:  T8
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Publicar o manifest | 1 arquivo | ✅ Granular |
| T2: Apontar o HTML | 1 arquivo | ✅ Granular |
| T3: Atender fetch | 1 arquivo | ✅ Granular |
| T4: Guardar o evento | 1 módulo | ✅ Granular |
| T5: Mostrar o aviso | 1 componente | ✅ Granular |
| T6: Abrir o menu | 1 componente | ✅ Granular |
| T7: Encaixar na barra | 1 componente | ✅ Granular |
| T8: Registrar o worker | 1 arquivo | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | início da Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | Phase 2, dependência entre fases | ✅ Match |
| T5 | T4 | Phase 3, dependência entre fases | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T4 | Phase 4, dependência entre fases | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Publicar o manifest | Shell estático | unit | unit | ✅ OK |
| T2: Apontar o HTML | Shell estático | unit | unit | ✅ OK |
| T3: Atender fetch | Shell estático | unit | unit | ✅ OK |
| T4: Guardar o evento | Domínio do convite | unit | unit | ✅ OK |
| T5: Mostrar o aviso | UI da vitrine | unit | unit | ✅ OK |
| T6: Abrir o menu | UI da vitrine | unit | unit | ✅ OK |
| T7: Encaixar na barra | UI da vitrine | unit | unit | ✅ OK |
| T8: Registrar o worker | Entrada da aplicação | unit | unit | ✅ OK |
