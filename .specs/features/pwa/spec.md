# PWA do Achavio

## Problem Statement

No celular, a barra do navegador reduz a altura útil do catálogo. A pessoa precisa instalar o Achavio na tela inicial para o site abrir sem essa barra. O catálogo continua online. O aviso de instalação aparece uma vez. O caminho permanente fica num menu só da vitrine.

## Goals

- [ ] O site publicado atende os critérios de instalação do Chrome com manifest, ícones da logo e um service worker que não guarda o catálogo.
- [ ] Na vitrine, um aviso único abaixo de 768 px e um menu à esquerda levam à instalação. Na ficha, o slot esquerdo continua sendo Voltar.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Catálogo offline ou cache de HTML, JS, CSS e fotos | O preço mora no JavaScript do build. Cache congelaria o catálogo. |
| Notificação push | O pedido é só ganhar altura de tela. |
| Itens extras no menu | O menu nasce com um item. |
| Menu na ficha do produto | O slot esquerdo da ficha é o Voltar. |
| Aviso que volta a cada publicação | A pessoa dispensa uma vez neste navegador. |
| `viewport-fit=cover` | A barra de status do sistema permanece. |
| Apagar `client/public/favicon.svg` | O arquivo deixa de ser referenciado e continua no disco. |
| Redesenhar os PNG já salvos | `icon-192.png`, `icon-512.png` e `apple-touch-icon.png` já estão em `client/public/icons/`. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Texto do aviso | Adicione o Achavio à tela inicial para ver o catálogo sem a barra do navegador. Use o menu. | Frase fechada na revisão do design. | y |
| Texto do iPhone | No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. | O Safari não dispara `beforeinstallprompt`. | y |
| Texto sem suporte | Este navegador não permite criar o atalho. | Vale quando não há evento e o aparelho não é iOS. | y |
| Chave do aviso | `achavio-install-notice-dismissed` = `1` | Não depende de id de build. Publicação nova não religa o aviso. | y |
| iPadOS | `MacIntel` com `maxTouchPoints` maior que 1 conta como iOS | O iPad pode anunciar user agent de Mac. | y |
| Segundo `beforeinstallprompt` | O evento novo substitui o adiado | O Chrome emite um evento por vez. Guardar o último chega. | y |
| `prompt()` que rejeita | O menu mostra o texto sem suporte | A falha não pode derrubar a vitrine. | y |
| Validação de texto livre | N/A: não há campo digitado | O único valor persistido é a string fixa `1`. | y |
| Autenticação e limite de taxa | N/A: site estático público | Não existe sessão nem API própria. | y |
| Observabilidade | N/A: sem log nem métrica nova | Falha de registro é silenciosa de propósito. | y |
| Concorrência além do evento único | N/A: um listener no carregamento do módulo | Não há fila de instalações. | y |
| Expiração da chave | A chave não expira e não é apagada por publicação | A pessoa pediu dispensar uma vez. | y |

**Open questions:** none

---

## User Stories

### P1: Instalar o catálogo sem a barra do navegador ⭐ MVP

**User Story**: Como visitante no celular, quero abrir o Achavio pela tela inicial para ver o catálogo sem a barra do navegador.

**Why P1**: Sem manifest, ícones e service worker o Chrome não oferece a instalação.

**Acceptance Criteria**

1. The manifest em `/manifest.webmanifest` SHALL ter `name` Achavio, `short_name` Achavio, `lang` pt-BR, `start_url` `/`, `scope` `/`, `display` `standalone`, `background_color` `#f5f5f7` e `theme_color` `#f5f5f7`.
2. The manifest SHALL listar `/icons/icon-192.png` em 192x192 com `purpose` `any`, `/icons/icon-512.png` em 512x512 com `purpose` `any`, e `/icons/icon-512.png` em 512x512 com `purpose` `maskable`.
3. The arquivo `client/public/icons/icon-192.png` SHALL medir 192 por 192 pixels.
4. The arquivo `client/public/icons/icon-512.png` SHALL medir 512 por 512 pixels.
5. The arquivo `client/public/icons/apple-touch-icon.png` SHALL medir 180 por 180 pixels.
6. The `client/index.html` SHALL incluir `link rel="manifest"` para `/manifest.webmanifest`.
7. The `client/index.html` SHALL incluir `link rel="icon"` para `/icons/icon-192.png` com `type` `image/png`.
8. The `client/index.html` SHALL incluir `link rel="apple-touch-icon"` para `/icons/apple-touch-icon.png`.
9. The `client/index.html` SHALL incluir `meta name="theme-color"` com `content` `#f5f5f7`.
10. The `client/index.html` SHALL incluir `meta name="apple-mobile-web-app-capable"` com `content` `yes`.
11. The `client/index.html` SHALL incluir `meta name="mobile-web-app-capable"` com `content` `yes`.
12. The `client/index.html` SHALL incluir `meta name="apple-mobile-web-app-title"` com `content` `Achavio`.
13. The `client/index.html` SHALL manter o viewport em `width=device-width, initial-scale=1.0`.
14. The `client/index.html` SHALL não conter `viewport-fit=cover`.
15. The `client/index.html` SHALL não referenciar `favicon.svg`.
16. The barra SHALL continuar usando a logo `/achavio_logo.webp` com texto alternativo `Achavio`.
17. The `client/public/sw.js` SHALL registrar `fetch` com `event.respondWith(fetch(event.request))`.
18. The código de `client/public/sw.js` SHALL não conter `caches`.
19. WHEN `client/src/main.tsx` carrega THEN o catálogo SHALL chamar `installInstallPromptListener()` no escopo do módulo, fora de `AppRoot`.
20. WHEN `navigator.serviceWorker` existe THEN o catálogo SHALL chamar `navigator.serviceWorker.register('/sw.js')` com `.catch(() => {})`.
21. IF o registro do service worker rejeita ou lança THEN o catálogo SHALL continuar renderizando a vitrine.
22. WHEN o navegador dispara `beforeinstallprompt` THEN o catálogo SHALL chamar `preventDefault` nesse evento e guardá-lo para um `prompt()` posterior.
23. WHEN `userChoice.outcome` é `accepted` THEN o catálogo SHALL gravar `achavio-install-notice-dismissed` com o valor `1`.
24. WHEN `userChoice.outcome` é `accepted` THEN o catálogo SHALL descartar o evento adiado.
25. WHEN `userChoice.outcome` é `dismissed` THEN o catálogo SHALL deixar `achavio-install-notice-dismissed` ausente.
26. WHEN `userChoice.outcome` é `dismissed` THEN o catálogo SHALL descartar o evento adiado.
27. WHEN o navegador dispara `appinstalled` THEN o catálogo SHALL gravar `achavio-install-notice-dismissed` com o valor `1`.
28. WHEN o navegador dispara `appinstalled` THEN o catálogo SHALL descartar o evento adiado.
29. The catálogo SHALL manter `achavio-install-notice-dismissed` sem amarrar a chave a um identificador de build.

**Independent Test**: Abrir o `manifest`, o `index.html` e o `sw.js` publicados e disparar `beforeinstallprompt` num teste de unidade sem subir o catálogo offline.

---

### P1: Achar a instalação na vitrine ⭐ MVP

**User Story**: Como visitante, quero um aviso uma vez e um item de menu na vitrine para colocar o Achavio na tela inicial.

**Why P1**: O manifest sozinho não explica o caminho no iPhone nem oferece o controle que foi pedido.

**Acceptance Criteria**

1. WHILE a vitrine está abaixo de 768 px, a chave `achavio-install-notice-dismissed` está ausente e a sessão não é standalone, o catálogo SHALL mostrar o texto `Adicione o Achavio à tela inicial para ver o catálogo sem a barra do navegador. Use o menu.`
2. WHILE a vitrine está abaixo de 768 px, a chave está ausente e a sessão não é standalone, o catálogo SHALL mostrar um botão com nome acessível `Dispensar`.
3. WHEN a pessoa aciona `Dispensar` THEN o catálogo SHALL gravar `achavio-install-notice-dismissed` com o valor `1`.
4. WHILE `achavio-install-notice-dismissed` é `1` o catálogo SHALL não renderizar o aviso.
5. WHILE a largura não corresponde a `(max-width: 767px)` o catálogo SHALL não renderizar o aviso.
6. WHILE `display-mode` é `standalone` o catálogo SHALL não renderizar o aviso na vitrine.
7. WHILE `navigator.standalone` é `true` o catálogo SHALL não renderizar o aviso na vitrine.
8. IF `localStorage.getItem` lança THEN o catálogo SHALL tratar o aviso como não dispensado.
9. IF `localStorage.setItem` lança ao dispensar THEN o catálogo SHALL não propagar a exceção.
10. WHILE a vitrine não está em standalone o catálogo SHALL mostrar o botão `Menu` no slot esquerdo da barra.
11. The slot direito da barra SHALL permanecer sem botão.
12. WHEN a pessoa aciona `Menu` THEN o catálogo SHALL abrir um menu com um único item de nome `Adicionar à tela inicial`.
13. WHEN a pessoa aciona `Adicionar à tela inicial` e existe evento adiado THEN o catálogo SHALL chamar `prompt()` nesse evento.
14. WHEN a pessoa aciona `Adicionar à tela inicial` e existe evento adiado THEN o catálogo SHALL fechar o menu.
15. WHEN a pessoa aciona `Adicionar à tela inicial` sem evento adiado e o user agent é iPhone, iPad, iPod ou iPadOS (`MacIntel` com `maxTouchPoints` maior que 1) THEN o catálogo SHALL mostrar `No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.`
16. WHEN a pessoa aciona `Adicionar à tela inicial` sem evento adiado e o user agent não é iOS THEN o catálogo SHALL mostrar `Este navegador não permite criar o atalho.`
17. IF `prompt()` rejeita THEN o catálogo SHALL mostrar `Este navegador não permite criar o atalho.`
18. WHILE a rota é a ficha do produto o catálogo SHALL mostrar o link de nome acessível `Voltar` no slot esquerdo da barra.
19. WHILE a rota é a ficha do produto o catálogo SHALL não renderizar o botão `Menu`.
20. WHILE a rota é a ficha do produto o catálogo SHALL não renderizar o aviso, mesmo abaixo de 768 px.
21. WHILE a vitrine está em `display-mode: standalone` o catálogo SHALL não renderizar o botão `Menu`.

**Independent Test**: Renderizar a barra na vitrine e na ficha, em 767 px, em 768 px e em `standalone`, e acionar o item do menu com evento adiado, com iPhone e sem os dois.

---

## Edge Cases

- IF o registro de `/sw.js` falha THEN o catálogo SHALL continuar na vitrine (PWA-21).
- IF `localStorage` bloqueia leitura ou escrita THEN o catálogo SHALL não quebrar: o aviso pode reaparecer e o menu segue (PWA-37, PWA-38).
- IF `prompt()` rejeita THEN o catálogo SHALL mostrar o texto de navegador sem atalho (PWA-46).
- WHEN a pessoa recusa o diálogo nativo THEN o catálogo SHALL não gravar a chave do aviso (PWA-25).
- WHEN uma publicação nova chega e a chave já é `1` THEN o catálogo SHALL continuar sem o aviso (PWA-29).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PWA-01 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-02 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-03 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-04 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-05 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-06 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-07 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-08 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-09 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-10 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-11 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-12 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-13 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-14 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-15 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-16 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-17 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-18 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-19 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-20 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-21 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-22 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-23 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-24 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-25 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-26 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-27 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-28 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-29 | P1: Instalar sem a barra | Tasks | Verified |
| PWA-30 | P1: Achar a instalação | Tasks | Verified |
| PWA-31 | P1: Achar a instalação | Tasks | Verified |
| PWA-32 | P1: Achar a instalação | Tasks | Verified |
| PWA-33 | P1: Achar a instalação | Tasks | Verified |
| PWA-34 | P1: Achar a instalação | Tasks | Verified |
| PWA-35 | P1: Achar a instalação | Tasks | Verified |
| PWA-36 | P1: Achar a instalação | Tasks | Verified |
| PWA-37 | P1: Achar a instalação | Tasks | Verified |
| PWA-38 | P1: Achar a instalação | Tasks | Verified |
| PWA-39 | P1: Achar a instalação | Tasks | Verified |
| PWA-40 | P1: Achar a instalação | Tasks | Verified |
| PWA-41 | P1: Achar a instalação | Tasks | Verified |
| PWA-42 | P1: Achar a instalação | Tasks | Verified |
| PWA-43 | P1: Achar a instalação | Tasks | Verified |
| PWA-44 | P1: Achar a instalação | Tasks | Verified |
| PWA-45 | P1: Achar a instalação | Tasks | Verified |
| PWA-46 | P1: Achar a instalação | Tasks | Verified |
| PWA-47 | P1: Achar a instalação | Tasks | Verified |
| PWA-48 | P1: Achar a instalação | Tasks | Verified |
| PWA-49 | P1: Achar a instalação | Tasks | Verified |
| PWA-50 | P1: Achar a instalação | Tasks | Verified |

**Coverage:** 50 total, 50 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] No Chrome, o manifest, os dois PNG e o `fetch` do service worker permitem a instalação, e o worker não escreve em Cache Storage.
- [ ] Na vitrine estreita o aviso aparece uma vez. Dispensar grava a chave e o aviso some. O menu à esquerda instala ou explica o caminho. Na ficha só existe Voltar.
- [ ] Com o atalho aberto em standalone, aviso e menu não aparecem. A logo horizontal da barra permanece `/achavio_logo.webp`.
