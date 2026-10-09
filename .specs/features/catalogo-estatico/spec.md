# Catálogo estático Specification

## Problem Statement

O visitante precisa ver o mesmo estoque de relógios e falar com o vendedor do link que recebeu. Hoje o catálogo depende de um gerador Python e de um site gerado. O desenho aprovado em 2026-10-09 troca isso por um site estático, sem servidor, em que `?seller=` escolhe nome e telefone.

## Goals

- [ ] `pnpm build` emite `client/dist` pronto para o Cloudflare Pages, com um HTML só e o catálogo validado.
- [ ] Com `?seller=` válido, a grade e a página do relógio mostram preço, selo e **Eu quero!** para o WhatsApp daquele vendedor.
- [ ] Uma skill local grava `product.json` e as fotos. Quem commita é a pessoa.
- [ ] Depois do aceite desta spec, saem o gerador Python, o `site/` gerado, os testes desse gerador e as specs `vitrine-relogios` e `ajustes-site`. Ficam `DESIGN.md` e `STACK-REFERENCIA.md`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Servidor no ar | O plano não publica API. |
| Página de cadastro | Os relógios entram pela skill local. |
| Carrinho e pagamento | O interesse sai pelo WhatsApp. |
| Painel | Fora deste plano. |
| semantic-release e CI | Ficam para um plano posterior. O `dist` só precisa nascer pronto para o painel do Cloudflare Pages. |
| Pacote `server` | O monorepo tem `shared` e `client`. |
| Migração automática dos relógios antigos | A pessoa recadastra com a skill. |
| Parcelamento e ficha fixa | Não entram no contrato. |
| Suíte automatizada da skill | Quem barra JSON ruim é o build. |
| `whatsapp://` | O link é `https://wa.me/`. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Fonte do comportamento | `plano-novo-catalogo.md`, grilling de 2026-10-09 | O plano diz que o desenho está aprovado e que a implementação espera o aceite. | y |
| Texto da página de erro | `Este link está incompleto ou o vendedor não existe.` | O plano descreve o sentido e não a frase. | y |
| Texto de relógio ausente | `Este relógio não está no catálogo.` | O plano descreve o sentido e não a frase. | y |
| Texto da vitrine vazia | `A vitrine ainda não tem relógios.` | O plano descreve o sentido e não a frase. | y |
| Padrão do slug no contrato | `^[a-z0-9]+(?:-[a-z0-9]+)*$` | O plano exige minúsculas, números e hífen. Hífen na ponta ou hífen dobrado não sai do gerador e quebra o caminho. | y |
| Hífen na ponta, na skill | A skill remove hífens do começo e do fim depois de colapsar os repetidos. | O exemplo `Seculus — kit com cantil` não tem hífen na ponta. Um título que começa com travessão não deve gerar slug vazio ou com hífen inicial. | y |
| Lista vazia de especificações | Lista vazia conta como campo ausente, igual a string vazia. | A seção só aparece se o campo existir. Lista vazia não tem par para a tabela. | y |
| String só com espaço | Não conta como ausente. Só `""` ou campo omitido conta. | O plano cita string vazia, não texto em branco. | y |
| Duração do deslize | 300 ms | O plano diz cerca de 300 ms. O teste precisa de um número. | y |
| Menos movimento | `prefers-reduced-motion: reduce` troca a foto na hora. | É o pedido do sistema que o plano descreve. | y |
| Ordem da grade | `Intl.Collator("pt-BR")`, ordem estável | O plano pede português e estabilidade entre builds. O exemplo é Addiesdive, CURREN, Seculus. | y |
| `seller` | Comparação exata com o `slug`, sensível a maiúsculas | O plano diz que `?seller=` só combina com o slug exato. | y |
| Caminho da skill | `.agents/skills/cadastrar-relogio/SKILL.md` | O plano diz que a skill vive no repositório e não fixa a pasta. | y |
| Token do selo | `{colors.primary-tint}` entra no `DESIGN.md` com as cores do plano | O plano manda acrescentar o token. | y |
| Preço riscado | Usa `{colors.ink-muted-48}` | O plano aponta o texto secundário do `DESIGN.md`. Esse token é o texto secundário já nomeado. | y |
| Barra de baixo | Segue `floating-sticky-bar`: fundo do canvas a 80% com `saturate(180%) blur(20px)` | O plano aponta esse componente. O `DESIGN.md` deixa o blur como baseline, não como token formal. | y |
| Auth, concorrência, ciclo de vida, observabilidade, falha de serviço externo | N/A | Não há login, servidor, TTL, log nem chamada de rede no build. O WhatsApp é um link. A skill grava em disco local e não sobrescreve pasta existente. | y |

**Open questions:** none. O aceite de 2026-10-09 confirmou as premissas.

---

## User Stories

### P1: Contratos do relógio e do vendedor ⭐ MVP

**User Story**: As a person who publishes the catalog, I want invalid watches and sellers rejected by a shared contract so that a bad file cannot pass as data.

**Why P1**: O build e a vitrine dependem desses contratos.

**Acceptance Criteria**:

1. The shared contract SHALL reject a seller phone that contains any character other than a digit.
2. The shared contract SHALL reject a seller phone with fewer than 10 digits or more than 15 digits.
3. WHEN the seller phone is `5511999999999` THEN the shared contract SHALL accept it.
4. The shared contract SHALL reject a slug that does not match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
5. The shared contract SHALL reject a price of zero.
6. The shared contract SHALL reject a negative price.
7. WHEN the price is `369.9` THEN the shared contract SHALL accept it.
8. WHEN a price has digits past the second decimal place THEN the shared contract SHALL discard those digits without rounding before any later check.
9. WHEN the supplied price is `369.999` THEN the shared contract SHALL keep `369.99`.
10. IF `listPrice` is present and, after that truncation, is less than or equal to `price` THEN the shared contract SHALL reject the product.
11. The shared contract SHALL reject a product whose `images` list is empty.
12. The shared contract SHALL reject an image file name that contains `/` or `\`.
13. WHERE `listPrice`, `details`, `specifications`, or `observations` is omitted THEN the shared contract SHALL accept the product.
14. The shared contract SHALL accept an image file name whose extension is `jpg`, `jpeg`, `png`, `webp`, or `avif`, in any letter case.
15. The shared contract SHALL keep the image file name as written in `images`.

**Independent Test**: Validar um objeto de relógio e um de vendedor no pacote `shared`, sem subir o client.

---

### P1: Build do site estático ⭐ MVP

**User Story**: As a person who publishes the catalog, I want `pnpm build` to check every catalog file and emit one static app so that Cloudflare Pages can host it.

**Why P1**: Sem o `dist`, não há vitrine.

**Acceptance Criteria**:

1. WHEN `pnpm build` runs THEN the build SHALL validate every `client/public/catalog/products/*/product.json` and `client/public/catalog/sellers.json` with the shared contract.
2. WHEN the build validates a product THEN the build SHALL require the names in `images` to be the same set as the image files in that product's `img/` directory.
3. IF a catalog file fails the contract THEN the build SHALL exit with an error.
4. IF an `images` name is missing from `img/`, or an image file in `img/` is missing from `images` THEN the build SHALL exit with an error.
5. WHEN `pnpm build` succeeds THEN `client/dist` SHALL contain one `index.html`, the CSS, the JS, and a copy of `client/public/catalog/**`.
6. WHEN `pnpm build` succeeds THEN the build SHALL NOT emit an HTML file per `/relogio/<slug>`.
7. WHEN `pnpm build` succeeds THEN `client/dist` SHALL contain `_redirects` with the line `/* /index.html 200`.
8. The product list SHALL come from a module generated at build time.
9. The generated product-list module SHALL NOT be a committed file.
10. The build SHALL NOT emit `index.json`.
11. The generated product-list module SHALL include image file names.
12. The generated product-list module SHALL NOT embed photo bytes.
13. The client SHALL request each photo at `/catalog/products/<slug>/img/<arquivo>`.
14. The client SHALL request sellers at `/catalog/sellers.json`.

**Independent Test**: Build com catálogo válido gera `client/dist`. Um `product.json` inválido faz a verificação terminar com erro.

---

### P1: Grade do vendedor ⭐ MVP

**User Story**: As a visitor with a seller link, I want a grid of the shared stock under that seller's name so that I can open a watch and keep the same seller.

**Why P1**: É a primeira página do link.

**Acceptance Criteria**:

1. IF the URL has no `seller` query THEN the app SHALL show `Este link está incompleto ou o vendedor não existe.`
2. IF the URL has no `seller` query THEN the app SHALL NOT list watches.
3. IF the URL has no `seller` query THEN the app SHALL NOT show **Eu quero!**.
4. IF `seller` is not an exact slug from `sellers.json` THEN the app SHALL show `Este link está incompleto ou o vendedor não existe.`
5. IF `seller` is not an exact slug from `sellers.json` THEN the app SHALL NOT list watches.
6. IF `seller` is not an exact slug from `sellers.json` THEN the app SHALL NOT show **Eu quero!**.
7. WHEN `seller` matches a slug THEN the top bar SHALL show the text `Catálogo {name}` with that seller's `name`.
8. WHILE the route is `/` the top bar SHALL NOT show a back icon.
9. The top bar SHALL place the theme control on the right.
10. The page background SHALL span the full viewport width.
11. The main column SHALL be centered.
12. The main column SHALL be at most 1120 px wide.
13. WHEN the viewport is narrower than 1120 px THEN the main column SHALL keep 24 px of horizontal padding.
14. The grade, the watch page, the error, and the empty state SHALL sit in that column.
15. The top bar and the bottom bar SHALL paint the full viewport width.
16. The content inside the top bar and the bottom bar SHALL use the same 1120 px column.
17. WHEN the catalog lists watches THEN the app SHALL order them by title with Portuguese collation.
18. The catalog title order SHALL be stable across builds.
19. WHEN the titles are `Addiesdive`, `CURREN`, and `Seculus` THEN the catalog SHALL show `Addiesdive`, then `CURREN`, then `Seculus`.
20. WHILE the viewport width is below 768 px the catalog grid SHALL use one column.
21. WHILE the viewport width is from 768 px to 1023 px inclusive the catalog grid SHALL use two columns.
22. WHILE the viewport width is 1024 px or wider the catalog grid SHALL use three columns.
23. The watch card SHALL show the first image in a 1:1 frame, the title, the price, and **Eu quero!**.
24. The card image SHALL fit entirely inside the frame, without crop and without distortion, on the page background.
25. The card text SHALL be left-aligned.
26. WHEN the visitor activates the card outside **Eu quero!** THEN the app SHALL open `/relogio/<slug>`.
27. WHEN the visitor activates the card outside **Eu quero!** THEN the app SHALL keep the current `seller` query.

**Independent Test**: Abrir `/?seller=alexandre` e ver a grade, o nome Alexandre e o link do card com `seller=alexandre`.

---

### P1: Página do relógio ⭐ MVP

**User Story**: As a visitor, I want one watch page with photos, details, and a way back to that seller's catalog so that I can decide before calling.

**Why P1**: O card leva para esta página.

**Acceptance Criteria**:

1. WHEN the route is `/relogio/<slug>` and `seller` is valid THEN the top bar SHALL show a back icon to the left of `Catálogo {name}`.
2. The back icon SHALL have the accessible name `Voltar`.
3. WHEN the visitor activates the back icon THEN the app SHALL go to `/?seller=` of the current seller.
4. WHEN the visitor activates `Catálogo {name}` THEN the app SHALL go to `/?seller=` of the current seller.
5. The back icon SHALL NOT call the browser history API.
6. The watch column SHALL show the carousel, then the title, then the price block, then **Eu quero!**, then the optional sections that apply.
7. WHERE `details` is a non-empty string the page SHALL show the heading `Detalhes`.
8. IF `details` is missing or `""` THEN the page SHALL NOT show `Detalhes`.
9. WHERE `observations` is a non-empty string the page SHALL show the heading `Observações`.
10. IF `observations` is missing or `""` THEN the page SHALL NOT show `Observações`.
11. WHERE `specifications` is a non-empty list the page SHALL show the heading `Especificações` and a two-column table of label and value, with no header row.
12. IF `specifications` is missing or an empty list THEN the page SHALL NOT show `Especificações`.
13. The specification table text SHALL be left-aligned.
14. The carousel SHALL exist only on the watch page.
15. The carousel SHALL follow the order of `images`.
16. The carousel frame SHALL be 1:1.
17. The carousel frame height SHALL stay the same when the photo changes.
18. The carousel photo SHALL fit entirely inside the frame, without distortion.
19. WHEN the watch has two or more photos THEN the page SHALL show a row under the image with the previous arrow, dots in the center, and the next arrow.
20. The previous arrow and the next arrow SHALL stay visible on the first photo and on the last photo.
21. WHEN the visitor activates next on the last photo THEN the carousel SHALL show the first photo.
22. WHEN the visitor activates previous on the first photo THEN the carousel SHALL show the last photo.
23. WHEN the visitor activates a dot THEN the carousel SHALL show that photo.
24. WHEN the visitor drags horizontally on the carousel THEN the carousel SHALL change photo.
25. WHEN a horizontal drag passes the first photo or the last photo THEN the carousel SHALL wrap.
26. The carousel photo change SHALL take 300 ms.
27. The carousel SHALL NOT autoplay.
28. WHEN the watch has one photo THEN the page SHALL NOT show the arrow row, the dots, or a drag gesture.
29. WHEN the visitor prefers reduced motion THEN the carousel SHALL change photos with no duration.
30. WHEN the carousel is focused and the visitor presses ArrowRight or ArrowLeft THEN the carousel SHALL move with the same wrap.
31. IF `seller` is valid and the watch slug is not in the catalog THEN the page SHALL show `Este relógio não está no catálogo.`
32. IF `seller` is valid and the watch slug is not in the catalog THEN the page SHALL NOT show **Eu quero!**.
33. WHEN the in-page **Eu quero!** is not fully inside the viewport, including the first paint, THEN the app SHALL show the bottom bar with the price block and the same **Eu quero!** button.
34. WHEN the in-page **Eu quero!** is fully inside the viewport THEN the app SHALL hide the bottom bar.
35. WHILE the viewport width is 768 px or wider the bottom bar SHALL place the price on the left and the button on the right.
36. WHILE the viewport width is below 768 px the bottom bar SHALL place the price above the button.
37. WHILE the viewport width is below 768 px the bottom-bar button SHALL span the bar content width.
38. The bottom bar SHALL respect the device safe area.

**Independent Test**: Abrir `/relogio/<slug>?seller=alexandre`, voltar para `/?seller=alexandre` sem usar o histórico, e ver a barra de baixo quando o botão do meio sai da tela.

---

### P1: Preço e selo ⭐ MVP

**User Story**: As a visitor, I want the price in Brazilian reais, with the reference price and the discount only when they exist, so that I can compare without a stored percentage.

**Why P1**: O card e a página mostram o preço.

**Acceptance Criteria**:

1. WHEN the stored price is `369.9` THEN the UI SHALL show `R$ 369,90`.
2. WHEN the stored price is `1234.5` THEN the UI SHALL show `R$ 1.234,50`.
3. The discount percent SHALL be the integer, rounded down, of `(listPrice - price) / listPrice`.
4. WHEN `price` is `369.90` and `listPrice` is `450` THEN the badge SHALL show `−17%`.
5. WHERE `listPrice` is absent the card and the watch page SHALL show only the current price.
6. WHEN `listPrice` is `450` and it is valid THEN the card and the watch page SHALL show the struck text `De R$ 450,00`.
7. WHERE `listPrice` is valid the card and the watch page SHALL show the current price and the discount badge beside the struck reference.
8. WHEN the computed discount is below 1% THEN the UI SHALL keep the struck reference price.
9. WHEN the computed discount is below 1% THEN the UI SHALL NOT show the discount badge.
10. The struck reference price SHALL use `{colors.ink-muted-48}`.
11. The discount badge SHALL be a pill using `{colors.primary-tint}`.
12. WHILE the light theme is active the badge SHALL use text `#0066cc` and background `rgba(0, 102, 204, 0.12)`.
13. WHILE the dark theme is active the badge SHALL use text `#2997ff` and background `rgba(41, 151, 255, 0.16)`.
14. The discount badge SHALL NOT use green.
15. The discount badge SHALL NOT use red.

**Independent Test**: Um relógio sem `listPrice` mostra só `R$ 369,90`. Um com `450` e `369.90` mostra `De R$ 450,00` e `−17%`.

---

### P1: Eu quero! ⭐ MVP

**User Story**: As a visitor, I want **Eu quero!** to open WhatsApp for that seller and that watch so that the catalog tab stays where it is.

**Why P1**: É o único caminho de interesse.

**Acceptance Criteria**:

1. **Eu quero!** SHALL be a link to `https://wa.me/<phone>?text=` using that seller's digit phone.
2. The `text` parameter SHALL be the URL-encoded message `Olá, tenho interesse no {título}.` with that watch title.
3. The link SHALL use `target="_blank"`.
4. The link SHALL use `rel="noopener noreferrer"`.
5. WHEN the visitor activates **Eu quero!** THEN the catalog document SHALL remain the current document.
6. The interest link SHALL NOT use the `whatsapp://` scheme.

**Independent Test**: No card e na página, o `href` de **Eu quero!** é `wa.me` com o telefone do vendedor e a mensagem codificada.

---

### P1: Tema, vazio e dados iniciais ⭐ MVP

**User Story**: As a visitor, I want the theme to follow my system until I choose, and a named empty catalog when the seller has no watches.

**Why P1**: O plano exige os dois temas, a vitrine vazia e os três vendedores iniciais.

**Acceptance Criteria**:

1. The app SHALL offer the light theme and the dark theme with the colors in `DESIGN.md`.
2. WHEN `localStorage` has no theme choice THEN the theme SHALL follow the visitor's system preference.
3. WHEN the visitor uses the theme control THEN the app SHALL save the choice in `localStorage`.
4. The watch photo SHALL stay in the foreground in the light theme and in the dark theme.
5. `DESIGN.md` SHALL define `{colors.primary-tint}` with the light and dark badge colors from this spec.
6. WHEN `seller` is valid and the catalog has no products THEN the top bar SHALL show `Catálogo {name}`.
7. WHEN `seller` is valid and the catalog has no products THEN the grid SHALL show `A vitrine ainda não tem relógios.`
8. `client/public/catalog/sellers.json` SHALL contain `alexandre` / `Alexandre` / `5585997689165`, `manuela` / `Manuela` / `5585996043447`, and `ana-claudia` / `Ana Claudia` / `5585992387201`.
9. `client/public/catalog/products/` SHALL start with no product folders.

**Independent Test**: Sem produtos, `/?seller=manuela` mostra `Catálogo Manuela` e o texto de vitrine vazia. O controle de tema grava a escolha.

---

### P1: Skill de cadastro ⭐ MVP

**User Story**: As a person adding a watch, I want the skill to read my photos and fields, show the full reading, and write only after I answer `sim` so that nothing is overwritten by mistake.

**Why P1**: Sem a skill não há como entrar relógio. Ela não altera vendedores.

**Acceptance Criteria**:

1. The registration skill SHALL live at `.agents/skills/cadastrar-relogio/SKILL.md`.
2. The registration skill SHALL register watches only.
3. The registration skill SHALL NOT modify `client/public/catalog/sellers.json`.
4. WHEN the operator gives photo paths, or one directory, plus separate fields THEN the skill SHALL accept that input.
5. WHEN the operator gives one text plus photos THEN the skill SHALL accept that input.
6. WHEN the operator gives photo paths THEN the skill SHALL use that path order.
7. WHEN the operator gives a directory and every file name ends with a number THEN the skill SHALL order the files numerically, with `foto2` before `foto10`.
8. WHEN the operator gives a directory and any file name does not end with a number THEN the skill SHALL ask for the order before the confirmation.
9. The skill SHALL show the full reading, including the slug, before it writes.
10. WHEN the reply is `sim` alone THEN the skill SHALL write the watch.
11. IF the reply is not `sim` alone THEN the skill SHALL NOT write.
12. The skill SHALL build the slug from the title by stripping accents, lowercasing, replacing each run of non-letters and non-digits with one hyphen, and removing a leading or trailing hyphen.
13. WHEN the title is `Seculus — kit com cantil` THEN the skill SHALL use the slug `seculus-kit-com-cantil`.
14. IF the reading has no title, no price, or no photo THEN the skill SHALL NOT write.
15. WHERE `details`, `specifications`, `observations`, or `listPrice` is empty THEN the skill SHALL omit that field from `product.json`.
16. WHEN a field is uncertain in the single-text input THEN the skill SHALL show that field empty in the reading.
17. IF that slug's product folder already exists THEN the skill SHALL ask for another slug.
18. IF that slug's product folder already exists THEN the skill SHALL NOT overwrite it.
19. IF the operator does not provide another slug THEN the skill SHALL cancel without writing.
20. WHEN the operator answers `sim` THEN the skill SHALL write `product.json` under `client/public/catalog/products/<slug>/`.
21. WHEN the operator answers `sim` THEN the skill SHALL copy the photos into that product's `img/` directory.
22. The skill SHALL NOT commit the written files.
23. The skill SHALL NOT migrate watches from the old catalog.
24. The registration skill SHALL NOT be part of the automated test suite.

**Independent Test**: A skill, lida como instrução, exige a leitura completa e a resposta `sim` sozinha. O build, não a suíte, recusa o JSON ruim.

---

## Edge Cases

**Acceptance Criteria**:

1. IF `seller` is `Alexandre` THEN the app SHALL show `Este link está incompleto ou o vendedor não existe.`
2. IF `listPrice` truncates to a value equal to `price` THEN the shared contract SHALL reject the product.
3. WHEN the first paint already leaves the in-page **Eu quero!** fully inside the viewport THEN the app SHALL NOT show the bottom bar.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CAT-01 | P1: Contratos | Execute (T3, T5) | Done |
| CAT-02 | P1: Contratos | Execute (T3) | Done |
| CAT-03 | P1: Contratos | Execute (T3) | Done |
| CAT-04 | P1: Contratos | Execute (T3) | Done |
| CAT-05 | P1: Contratos | Execute (T4) | Done |
| CAT-06 | P1: Contratos | Execute (T4) | Done |
| CAT-07 | P1: Contratos | Execute (T4) | Done |
| CAT-08 | P1: Contratos | Execute (T2) | Done |
| CAT-09 | P1: Contratos | Execute (T2) | Done |
| CAT-10 | P1: Contratos | Execute (T4) | Done |
| CAT-11 | P1: Contratos | Execute (T4) | Done |
| CAT-12 | P1: Contratos | Execute (T4) | Done |
| CAT-13 | P1: Contratos | Execute (T4) | Done |
| CAT-14 | P1: Contratos | Execute (T4) | Done |
| CAT-15 | P1: Contratos | Execute (T4) | Done |
| CAT-16 | P1: Build | Execute (T7) | Done |
| CAT-17 | P1: Build | Execute (T7) | Done |
| CAT-18 | P1: Build | Execute (T7) | Done |
| CAT-19 | P1: Build | Execute (T7) | Done |
| CAT-20 | P1: Build | Execute (T6, T10, T14, T27) | In progress (T14: entrada montada) |
| CAT-21 | P1: Build | Execute (T10) | Done |
| CAT-22 | P1: Build | Execute (T8) | Done |
| CAT-23 | P1: Build | Execute (T7) | Done |
| CAT-24 | P1: Build | Execute (T1, T7) | Done |
| CAT-25 | P1: Build | Execute (T7) | Done |
| CAT-26 | P1: Build | Execute (T7) | Done |
| CAT-27 | P1: Build | Execute (T7) | Done |
| CAT-28 | P1: Build | Execute (T21) | Done |
| CAT-29 | P1: Build | Execute (T17) | Done |
| CAT-30 | P1: Grade | Execute (T18) | Done |
| CAT-31 | P1: Grade | Execute (T18) | Done |
| CAT-32 | P1: Grade | Execute (T18) | Done |
| CAT-33 | P1: Grade | Execute (T18) | Done |
| CAT-34 | P1: Grade | Execute (T18) | Done |
| CAT-35 | P1: Grade | Execute (T18) | Done |
| CAT-36 | P1: Grade | Execute (T16) | Done |
| CAT-37 | P1: Grade | Execute (T16) | Done |
| CAT-38 | P1: Grade | Execute (T16) | Done |
| CAT-39 | P1: Grade | Execute (T12) | Done |
| CAT-40 | P1: Grade | Execute (T12) | Done |
| CAT-41 | P1: Grade | Execute (T12) | Done |
| CAT-42 | P1: Grade | Execute (T12) | Done |
| CAT-43 | P1: Grade | Execute (T22) | Done |
| CAT-44 | P1: Grade | Execute (T16) | Done |
| CAT-45 | P1: Grade | Execute (T16) | Done |
| CAT-46 | P1: Grade | Execute (T2) | Done |
| CAT-47 | P1: Grade | Execute (T2) | Done |
| CAT-48 | P1: Grade | Execute (T2) | Done |
| CAT-49 | P1: Grade | Execute (T22) | Done |
| CAT-50 | P1: Grade | Execute (T22) | Done |
| CAT-51 | P1: Grade | Execute (T22) | Done |
| CAT-52 | P1: Grade | Execute (T21) | Done |
| CAT-53 | P1: Grade | Execute (T21) | Done |
| CAT-54 | P1: Grade | Execute (T21) | Done |
| CAT-55 | P1: Grade | Execute (T21) | Done |
| CAT-56 | P1: Grade | Execute (T21) | Done |
| CAT-57 | P1: Página do relógio | Execute (T13, T23) | Done |
| CAT-58 | P1: Página do relógio | Execute (T23) | Done |
| CAT-59 | P1: Página do relógio | Execute (T23) | Done |
| CAT-60 | P1: Página do relógio | Execute (T23) | Done |
| CAT-61 | P1: Página do relógio | Execute (T23) | Done |
| CAT-62 | P1: Página do relógio | Execute (T23) | Done |
| CAT-63 | P1: Página do relógio | Execute (T23) | Done |
| CAT-64 | P1: Página do relógio | Execute (T23) | Done |
| CAT-65 | P1: Página do relógio | Execute (T23) | Done |
| CAT-66 | P1: Página do relógio | Execute (T23) | Done |
| CAT-67 | P1: Página do relógio | Execute (T23) | Done |
| CAT-68 | P1: Página do relógio | Execute (T23) | Done |
| CAT-69 | P1: Página do relógio | Execute (T23) | Done |
| CAT-70 | P1: Página do relógio | Execute (T24) | Done |
| CAT-71 | P1: Página do relógio | Execute (T24) | Done |
| CAT-72 | P1: Página do relógio | Execute (T24) | Done |
| CAT-73 | P1: Página do relógio | Execute (T24) | Done |
| CAT-74 | P1: Página do relógio | Execute (T24) | Done |
| CAT-75 | P1: Página do relógio | Execute (T24) | Done |
| CAT-76 | P1: Página do relógio | Execute (T24) | Done |
| CAT-77 | P1: Página do relógio | Execute (T24) | Done |
| CAT-78 | P1: Página do relógio | Execute (T24) | Done |
| CAT-79 | P1: Página do relógio | Execute (T24) | Done |
| CAT-80 | P1: Página do relógio | Execute (T24) | Done |
| CAT-81 | P1: Página do relógio | Execute (T24) | Done |
| CAT-82 | P1: Página do relógio | Execute (T24) | Done |
| CAT-83 | P1: Página do relógio | Execute (T24) | Done |
| CAT-84 | P1: Página do relógio | Execute (T24) | Done |
| CAT-85 | P1: Página do relógio | Execute (T24) | Done |
| CAT-86 | P1: Página do relógio | Execute (T24) | Done |
| CAT-87 | P1: Página do relógio | Execute (T23) | Done |
| CAT-88 | P1: Página do relógio | Execute (T23) | Done |
| CAT-89 | P1: Página do relógio | Specify | Pending |
| CAT-90 | P1: Página do relógio | Specify | Pending |
| CAT-91 | P1: Página do relógio | Specify | Pending |
| CAT-92 | P1: Página do relógio | Specify | Pending |
| CAT-93 | P1: Página do relógio | Specify | Pending |
| CAT-94 | P1: Página do relógio | Specify | Pending |
| CAT-95 | P1: Preço | Execute (T2) | Done |
| CAT-96 | P1: Preço | Execute (T2) | Done |
| CAT-97 | P1: Preço | Execute (T2) | Done |
| CAT-98 | P1: Preço | Execute (T2) | Done |
| CAT-99 | P1: Preço | Execute (T19) | Done |
| CAT-100 | P1: Preço | Execute (T19) | Done |
| CAT-101 | P1: Preço | Execute (T19) | Done |
| CAT-102 | P1: Preço | Execute (T19) | Done |
| CAT-103 | P1: Preço | Execute (T19) | Done |
| CAT-104 | P1: Preço | Execute (T19) | Done |
| CAT-105 | P1: Preço | Execute (T19) | Done |
| CAT-106 | P1: Preço | Execute (T19) | Done |
| CAT-107 | P1: Preço | Execute (T19) | Done |
| CAT-108 | P1: Preço | Execute (T19) | Done |
| CAT-109 | P1: Preço | Execute (T19) | Done |
| CAT-110 | P1: Eu quero! | Execute (T20) | Done |
| CAT-111 | P1: Eu quero! | Execute (T20) | Done |
| CAT-112 | P1: Eu quero! | Execute (T20) | Done |
| CAT-113 | P1: Eu quero! | Execute (T20) | Done |
| CAT-114 | P1: Eu quero! | Execute (T20) | Done |
| CAT-115 | P1: Eu quero! | Execute (T20) | Done |
| CAT-116 | P1: Tema | Execute (T15) | Done |
| CAT-117 | P1: Tema | Execute (T15) | Done |
| CAT-118 | P1: Tema | Execute (T15) | Done |
| CAT-119 | P1: Tema | Execute (T15) | Done |
| CAT-120 | P1: Tema | Execute (T11) | Done |
| CAT-121 | P1: Tema | Execute (T22) | Done |
| CAT-122 | P1: Tema | Execute (T22) | Done |
| CAT-123 | P1: Tema | Execute (T9) | Done |
| CAT-124 | P1: Tema | Execute (T9) | Done |
| CAT-125 | P1: Skill | Specify | Pending |
| CAT-126 | P1: Skill | Specify | Pending |
| CAT-127 | P1: Skill | Specify | Pending |
| CAT-128 | P1: Skill | Specify | Pending |
| CAT-129 | P1: Skill | Specify | Pending |
| CAT-130 | P1: Skill | Specify | Pending |
| CAT-131 | P1: Skill | Specify | Pending |
| CAT-132 | P1: Skill | Specify | Pending |
| CAT-133 | P1: Skill | Specify | Pending |
| CAT-134 | P1: Skill | Specify | Pending |
| CAT-135 | P1: Skill | Specify | Pending |
| CAT-136 | P1: Skill | Specify | Pending |
| CAT-137 | P1: Skill | Specify | Pending |
| CAT-138 | P1: Skill | Specify | Pending |
| CAT-139 | P1: Skill | Specify | Pending |
| CAT-140 | P1: Skill | Specify | Pending |
| CAT-141 | P1: Skill | Specify | Pending |
| CAT-142 | P1: Skill | Specify | Pending |
| CAT-143 | P1: Skill | Specify | Pending |
| CAT-144 | P1: Skill | Specify | Pending |
| CAT-145 | P1: Skill | Specify | Pending |
| CAT-146 | P1: Skill | Specify | Pending |
| CAT-147 | P1: Skill | Specify | Pending |
| CAT-148 | P1: Skill | Specify | Pending |
| CAT-149 | Edge | Execute (T18) | Done |
| CAT-150 | Edge | Execute (T4) | Done |
| CAT-151 | Edge | Specify | Pending |

**Coverage:** 151 total, 71 mapped to tasks (CAT-01 → T3, T5; CAT-02–04 → T3; CAT-05–07, CAT-10–15, CAT-150 → T4; CAT-08, CAT-09, CAT-46–48, CAT-95–98 → T2; CAT-16–19, CAT-23, CAT-25–27 → T7; CAT-20 → T6, T10, T14, T27; CAT-22 → T8; CAT-24 → T1, T7; CAT-36–38, CAT-44–45 → T16; CAT-57 → T13, T23; CAT-58–69, CAT-87, CAT-88 → T23; CAT-99–109 → T19; CAT-116–119 → T15; CAT-123, CAT-124 → T9), 80 unmapped.

---

## Success Criteria

- [ ] `/?seller=alexandre` mostra `Catálogo Alexandre` e a grade ordenada por título.
- [ ] `/relogio/<slug>?seller=alexandre` conserva o vendedor, volta para `/?seller=alexandre` e abre `https://wa.me/5585997689165`.
- [ ] Sem `seller`, ou com slug desconhecido, não há grade nem **Eu quero!**.
- [ ] Um JSON inválido faz o build terminar com erro.
- [ ] A skill só grava depois de `sim` sozinho e não mexe em `sellers.json`.
