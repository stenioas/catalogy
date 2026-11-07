# Variantes no anúncio

## Problem Statement

O catálogo trata cada `product.json` como um relógio único: um estado, um preço, uma fila de fotos e um link `/product/<slug>`. O operador precisa anunciar o mesmo produto em mais de uma condição e com eixos de modelo, cada um com preço, foto principal e oferta, sem misturar esses anúncios na página e sem fundir os arquivos atuais.

## Goals

- [ ] Um produto guarda vários anúncios, e cada anúncio guarda variantes com eixos, preço e foto principal
- [ ] A home escolhe uma seção, filtra por estado, público-alvo e eixos, e gera um card por anúncio capaz de aparecer
- [ ] A página abre um anúncio só, na variante da URL, com seletores e faixa conforme a largura
- [ ] Os `product.json` atuais migram para um anúncio e uma variante, no mesmo slug, sem fusão
- [ ] `product-register` grava esse formato e `product-scrapper` só prepara insumos nele

## Out of Scope

| Feature | Reason |
| --- | --- |
| Filtros montados a partir da ficha | O plano deixa isso para outra leva |
| Categorias da loja, catálogo por categoria e filtro próprio de cada categoria | Fora desta implementação |
| Busca global | Fora desta implementação |
| Coleta de variantes no AliExpress | Fica para depois; o scrapper não publica anúncio |
| Fundir anúncios de produtos diferentes ou do mesmo produto | Cada arquivo atual vira um anúncio; as skills também não fundem |
| Retomada de `catalog-layout-refactor` | Feature pausada. Este trabalho não mexe nela |
| Commit remoto, push, deploy | Aprovar o spec autoriza só artefato local de especificação |
| Autenticação, limite de taxa, expiração e observabilidade | Catálogo estático, sem sessão, TTL, log ou serviço remoto |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Chave da seção | `section=available`, `coming-soon` ou `on-order` | O plano exige seção na URL. O valor interno fica em inglês; a tela mostra Disponível, Chega em breve e Sob encomenda | y |
| JSON de disponibilidade | `available`, `coming_soon`, `on_order` | O plano já nomeia esses três. A query usa hífen: `coming-soon` e `on-order` | y |
| `section` ausente ou fora desses três valores | A home recalcula a cascata e não grava `section` | "Sem seção na URL" abre a primeira seção com card | y |
| Estado interno | `new`, `openbox`, `used`, `defective` | A tela mostra Novo, Openbox, Usado e Com defeito, nessa ordem | y |
| Público interno | `male`, `female`, `unisex`, `child` | A tela mostra Masculino, Feminino, Unissex e Infantil, nessa ordem | y |
| Marcas do filtro | `state` e `audience` com esses tokens. Cada grupo de eixo usa o `id` do eixo e os `id` dos valores, separados por vírgula | Identificador interno em inglês. O texto da opção continua o `value` ou o rótulo de exibição | y |
| Marca desconhecida | É ignorada e não restringe | Não é opção do catálogo. Marca de opção ausente na seção continua na query e restringe | y |
| Id do anúncio migrado | `listing` | O plano não nomeia o id. O token interno fica em inglês | y |
| Eixo de cor migrado | `id` `color`, rótulo de exibição `Cor`, sem alias | O visitante lê Cor. A query e o schema usam `color` | y |
| Id de valor de eixo | Slug do `value`, sem traduzir a palavra | Vocabulário fechado vai para o inglês. Cor e demais valores continuam o texto cadastrado; o `id` só normaliza esse texto | y |
| Produto sem eixo | A URL do card e do compartilhar omite `v` | Não há ids para colocar em `v` | y |
| `v` com eixos | Ids dos valores na ordem dos eixos, separados por vírgula | O plano pede esses ids nessa ordem | y |
| Rótulo de eixo repetido no mesmo produto | O schema rejeita | O grupo único do filtro é entre produtos. No mesmo produto o rótulo identificaria dois eixos | y |
| Comparação alfabética | `Intl.Collator('pt-BR')`, a mesma base já usada para título | O plano pede ordem alfabética de título, rótulo e valor | y |
| Labels de ficha que continuam fechadas | A lista atual sem `Estado`. `Público-alvo` também é rejeitado | O plano tira `Estado` e proíbe `Público-alvo`. Não reabre label livre. Essas labels são texto de exibição | y |
| Extensão de foto | jpg, jpeg, png, webp ou avif, sem separador de caminho | Contrato atual de arquivo. O plano não troca isso | y |
| Preço | Continua positivo depois de `truncateReais`. `listPrice`, quando existe, é maior que `price` depois desse corte | Regra já vigente. O plano só move o par para a variante | y |
| Mensagem do card | O link `Enviar no WhatsApp` do card usa a mesma frase do anúncio, com o título e a URL da variante em evidência | O plano fixa a frase na página. O card já compartilha o relógio em evidência | y |
| `seller` na query | Continua sem efeito na vitrine e na página | Comportamento já publicado. Não faz parte do filtro | y |
| Página ausente | O texto permanece `Este relógio não está no catálogo.` e o WhatsApp some | É a página de produto ausente que o plano cita | y |
| URL absoluta do WhatsApp | Origem da página mais `/product/<slug>/<id>`, com `?v=` só quando há eixo | O plano escreve o caminho. O `wa.me` precisa da URL absoluta, como hoje | y |
| Arquivo citado | Entra no build publicado mesmo se o anúncio estiver com `enabled: false` | "Nenhum anúncio cita" é a condição de ficar de fora. Anúncio oculto ainda cita | y |
| Falha parcial e retentativa | N/A porque o build valida JSON estático e não há gravação parcial em runtime | Catálogo sem transação | y |
| Idempotência | N/A porque não há fila. Migrar de novo um arquivo já no formato novo não é este contrato | A migração descreve a passagem dos arquivos atuais | y |
| Concorrência | N/A porque não há escrita concorrente. A ordem exigida é a de `listings`, `variants` e a fila | Estado de tela, não corrida | y |
| Ciclo de vida | A foto não citada permanece na pasta fonte e fica fora do build. Nada expira | Única regra de retenção do plano | y |
| Dependência externa | N/A porque AliExpress e WhatsApp remoto ficam fora. O cliente só monta `wa.me` | Sem fallback de rede neste escopo | y |

**Open questions:** none

---

## User Stories

### P1: Contrato do produto e do anúncio ⭐ MVP

**User Story**: Como operador, quero um `product.json` com anúncios e variantes válidos, para que preço, estado e modelo não se misturem num único objeto.

**Why P1**: Sem o contrato, home e página não têm o que ler.

**Acceptance Criteria**:

1. The ProductSchema SHALL read `product.json` as one product with `slug`, `title`, optional `description`, optional `audience`, `axes`, optional `specifications`, and `listings`.
2. WHERE `audience` is present, the ProductSchema SHALL accept only `male`, `female`, `unisex`, or `child`.
3. IF `listings` is omitted or empty THEN the ProductSchema SHALL reject the product.
4. IF a listing has `variants` omitted or empty THEN the ProductSchema SHALL reject the product.
5. The ProductSchema SHALL accept a listing `id` only when it matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` and is unique among that product's listings.
6. WHEN `enabled` is omitted THEN the catalog SHALL treat the listing as visible.
7. The ProductSchema SHALL accept listing `availabilityStatus` only as `available`, `coming_soon`, or `on_order`.
8. The ProductSchema SHALL accept listing `state` only as `new`, `openbox`, `used`, or `defective`.
9. IF `availabilityStatus` is `on_order` and `state` is not `new` THEN the ProductSchema SHALL reject the listing.
10. IF a variant has `orderable: false` and the listing `availabilityStatus` is not `on_order` THEN the ProductSchema SHALL reject the variant.
11. WHEN `orderable` is omitted THEN the catalog SHALL treat the variant as orderable.
12. WHEN `unmissableOffer` is omitted THEN the catalog SHALL treat the variant as not an unmissable offer.
13. IF `price` is not positive after `truncateReais` THEN the ProductSchema SHALL reject the variant.
14. IF `listPrice` is present and is not greater than `price` after `truncateReais` THEN the ProductSchema SHALL reject the variant.
15. The ProductSchema SHALL reject a listing that repeats one axis-value combination.
16. The ProductSchema SHALL accept the same axis-value combination on two listings of the same product.
17. IF a variant references a value `id` that the product axes do not declare THEN the ProductSchema SHALL reject the product.
18. The ProductSchema SHALL reject a variant that does not select each declared axis exactly once.
19. IF `mainImage` is not one of that listing's `images` THEN the ProductSchema SHALL reject the variant.
20. IF a specification label is `Estado` or `Público-alvo` THEN the ProductSchema SHALL reject the product.
21. IF the same specification label appears twice in the product sheet, twice in one listing sheet, or once in the product sheet and once in a listing sheet THEN the ProductSchema SHALL reject the product.
22. The ProductSchema SHALL reject a product that repeats an axis label.
23. The ProductSchema SHALL accept an axis `id` and an axis value `id` only when each matches the listing `id` pattern, the axis `id` is unique in the product, and the value `id` is unique within that axis.
24. WHEN a file named by any listing `images` is absent from that product's `img/` directory THEN `pnpm build` SHALL fail.
25. WHEN a file in `img/` is named by no listing THEN the published build SHALL omit that file and the source file SHALL remain.
26. IF `product.json` fails the ProductSchema THEN `pnpm build` SHALL fail.
27. The catalog SHALL store `section`, `state`, `audience`, and axis `id` as English tokens, and SHALL show Portuguese only in visitor-facing copy.

**Independent Test**: Testes do `ProductSchema` cobrem omissão, rejeição e o caso de dois anúncios com a mesma combinação. O build falha com JSON inválido ou foto citada ausente, e o dist não leva foto não citada.

---

### P1: Migração dos arquivos atuais ⭐ MVP

**User Story**: Como operador, quero cada relógio já publicado convertido no formato novo, no mesmo slug, para que o catálogo atual continue no ar com um anúncio e uma variante.

**Why P1**: O plano exige essa passagem antes da home nova ler os arquivos.

**Acceptance Criteria**:

1. WHEN the current catalog is migrated THEN each existing `product.json` SHALL become one product with the same `slug`, exactly one listing whose `id` is `listing`, and exactly one variant, and no two source files SHALL be merged.
2. WHEN the source product has `color` THEN the migrated product SHALL have one axis whose `id` is `color` and whose display label is `Cor`, with no `alias`, whose `value` is that color, and the variant SHALL select the value `id`.
3. WHEN the source product has no `color` THEN the migrated product SHALL declare no axes.
4. The migrated listing SHALL map `Novo` to `new`, `Openbox` to `openbox`, and `Usado` to `used`, SHALL keep `availabilityStatus` and `images` in the source order, and SHALL keep `enabled` only when the source file had that field.
5. The migrated variant SHALL keep `price`, `listPrice` when present, `unmissableOffer` when present, and `observations` when present, and its `mainImage` SHALL be the first image.
6. The migrated product SHALL keep `title`, `description`, and every specification except rows labeled `Estado`, which SHALL be removed.
7. The ProductSchema SHALL accept every migrated `product.json`.

**Independent Test**: Depois da migração, cada slug antigo existe uma vez, com um anúncio `listing`, a cor virou o eixo `color` com rótulo Cor só quando existia, e `Estado` saiu da ficha.

---

### P1: Home, seções e cards ⭐ MVP

**User Story**: Como visitante, quero ver uma seção por vez e um card por anúncio, para achar o relógio na condição em que ele está à venda.

**Why P1**: A home é a entrada do catálogo.

**Acceptance Criteria**:

1. WHEN the home URL has no valid `section` THEN the catalog SHALL open the first section, in the order Disponível, Chega em breve, Sob encomenda, that contains an enabled listing able to generate a card.
2. WHEN no section contains such a listing THEN the catalog SHALL stay on Disponível and show the exact text `Não temos nenhum anúncio ativo.`
3. WHEN the URL `section` names a section with no card THEN the catalog SHALL stay on that section.
4. WHEN the active section has a card-capable listing and the filter hides every card THEN the catalog SHALL show the exact text `Nenhum anúncio corresponde aos filtros.`
5. The catalog SHALL show `Disponível` for `available`, `Chega em breve` for `coming_soon`, and `Sob encomenda` for `on_order`, and the `section` query SHALL use `available`, `coming-soon`, and `on-order` for those same sections.
6. The catalog SHALL count a listing in a section only when `enabled` is not `false` and at least one variant can represent a card.
7. The catalog SHALL NOT let a variant with `orderable: false` represent a card.
8. WHEN every variant of an `on_order` listing has `orderable: false` THEN that listing SHALL NOT appear on the home and SHALL NOT add to the section count.
9. WHEN a listing can generate a card and at least one variant passes the filter and can represent the card THEN the home SHALL render one card for that listing.
10. The card title SHALL be the product title and SHALL contain no axis alias.
11. The card photo, price, struck price, and unmissable-offer mark SHALL come from the first unmissable variant in the queue among variants that pass the filter and can represent the card.
12. WHEN that set contains no unmissable variant THEN the card photo, price, struck price, and unmissable-offer mark SHALL come from the first variant of that set in queue order.
13. WHEN no variant of a listing both passes the filter and can represent the card THEN the home SHALL omit that card.
14. The card status text SHALL be `Disponível`, `Chega em breve`, or `Sob encomenda` according to the listing.
15. The home SHALL order cards by product title with `Intl.Collator('pt-BR')`, then by `slug`, then by the listing order inside `listings`.
16. WHEN the visitor activates a card THEN the catalog SHALL open `/product/<slug>/<listing id>?v=<value ids in axis order>`, and SHALL omit `v` when the product has no axes.
17. The card WhatsApp link SHALL use the same sentence as the listing page for the variant shown on that card.

**Independent Test**: Com três seções, a home sem `section` cai na primeira que tem card; um anúncio só de variantes `orderable: false` não entra; o card usa a primeira oferta imperdível que passa no filtro.

---

### P1: Filtro global da home ⭐ MVP

**User Story**: Como visitante, quero marcar estado, público-alvo e eixos, para reduzir os cards sem perder as marcas ao mudar de seção ou abrir um anúncio.

**Why P1**: O plano define o filtro como parte da home, não como etapa posterior.

**Acceptance Criteria**:

1. The home SHALL keep the filter query when the visitor opens a listing and then returns to the home.
2. WHEN the visitor changes section THEN the catalog SHALL keep the filter marks.
3. The catalog SHALL render filter groups in this order: Estado, Público-alvo, then axis groups sorted by label with `Intl.Collator('pt-BR')`.
4. The catalog SHALL offer Estado values only in the order Novo, Openbox, Usado, Com defeito, stored and queried as `new`, `openbox`, `used`, `defective`, and SHALL omit a value that the section catalog does not contain.
5. The catalog SHALL offer Público-alvo values only in the order Masculino, Feminino, Unissex, Infantil, stored and queried as `male`, `female`, `unisex`, `child`, and only from a product that has a card-capable listing in the active section.
6. The catalog SHALL sort values inside an axis group by `value` with `Intl.Collator('pt-BR')`.
7. The catalog SHALL hide a group that has exactly one option in the active section catalog before marks are applied.
8. WHILE a group has no marks, that group SHALL NOT restrict the cards.
9. WHILE one group has marks, a variant SHALL pass that group when any mark matches its `state` token, its `audience` token, or an axis value `id`.
10. The catalog SHALL pass a variant through the filter only when it passes every group that has marks.
11. WHILE the section is Disponível or Chega em breve, every variant of a card-capable listing SHALL contribute filter options.
12. WHILE the section is Sob encomenda, the catalog SHALL take filter options only from variants that are not `orderable: false`.
13. The catalog SHALL take no filter option from a listing whose every variant is `orderable: false`.
14. WHEN a mark names an option absent from the active section THEN the catalog SHALL keep that mark in the query and SHALL NOT show that option.

**Independent Test**: Dois grupos marcados exigem os dois. Trocar `section` conserva a query. Um eixo com um único valor no catálogo da seção não aparece.

---

### P1: Página de um anúncio ⭐ MVP

**User Story**: Como visitante, quero abrir um anúncio e uma variante, para ver o preço, a foto e o estado daquela condição sem os outros anúncios do produto.

**Why P1**: O link do card e o compartilhar dependem dessa página.

**Acceptance Criteria**:

1. The listing page SHALL show the product specification sheet and then that listing's specification sheet.
2. The listing page SHALL show the Portuguese state label for the listing `state` and SHALL NOT show another listing of the same product.
3. The page title SHALL be the product title plus, in axis order and separated by single spaces, each active value's `alias` or, when `alias` is absent, its `value`.
4. The axis selector SHALL show each option's `value`.
5. The variant queue SHALL list `variants` in array order after moving every `orderable: false` variant to the end without changing their relative order.
6. WHEN `v` is absent or does not name a combination of that listing THEN the page SHALL open the first variant of the queue.
7. WHEN every variant is `orderable: false` and `v` is absent or does not name a combination of that listing THEN the page SHALL open the first variant of the original `variants` array and SHALL show `Indisponível`.
8. WHEN `v` names a combination of that listing THEN the page SHALL open that variant, including when `orderable` is `false`.
9. WHILE the active variant is `orderable: false`, the availability line SHALL read `Indisponível`, the state line SHALL keep the Portuguese label of the listing state, and the price SHALL stay visible.
10. The share control SHALL remain available on every variant, including `orderable: false`.
11. WHEN the visitor chooses an axis value that removes the current combination THEN the active variant SHALL become the first queue variant that contains the newly chosen value.
12. The selector SHALL keep a combination that is impossible under the other selected axes visible and disabled.
13. WHEN the active variant changes THEN the current carousel image SHALL become that variant's `mainImage`, and the next images SHALL follow that listing's `images` order from it.
14. Price, struck price, observations, and the unmissable-offer mark SHALL follow the active variant.
15. Description and both specification sheets SHALL stay unchanged when the active variant changes.
16. The share message SHALL be `Olá, tenho interesse no {page title}. {Portuguese state label}, {shown availability}. {absolute URL}`.
17. The share URL path SHALL be `/product/<slug>/<listing id>` and SHALL include `?v=<value ids in axis order>` only when the product has axes.
18. WHEN the URL is `/product/<slug>` THEN the catalog SHALL open the first listing that would enter the home, using the section order Disponível, Chega em breve, Sob encomenda, and within one section the `listings` order.
19. WHEN the URL is `/product/<slug>` THEN the catalog SHALL skip an `on_order` listing whose every variant is `orderable: false`.
20. WHEN the URL is `/product/<slug>/<listing id>` THEN the catalog SHALL open that listing even when it would not enter the home.
21. IF the slug does not exist, the listing `id` does not exist, the listing has `enabled: false`, or every listing of the product has `enabled: false` THEN the page SHALL show `Este relógio não está no catálogo.` and SHALL omit the WhatsApp link.

**Independent Test**: `/product/<slug>` escolhe o primeiro anúncio da cascata; `/product/<slug>/<id>?v=` abre a variante pedida; anúncio `enabled: false` cai na frase de ausente.

---

### P1: Seletores conforme a largura ⭐ MVP

**User Story**: Como visitante, quero escolher a variante pela faixa de fotos no celular e pelos grupos de eixos no desktop, para ver a foto principal da escolha.

**Why P1**: O plano fixa dois layouts e a linha de eixo acima do preço.

**Acceptance Criteria**:

1. WHILE the viewport is below 920px and the listing has more than one variant, the page SHALL show a horizontal strip of each variant's `mainImage`, in queue order, immediately below the media and before the price.
2. WHILE the viewport is below 920px and the listing has one variant, the page SHALL omit that strip.
3. WHEN the visitor activates a strip image THEN the page SHALL select that variant and SHALL move the carousel to its `mainImage`.
4. The page SHALL NOT render carousel dots at any width. WHILE the viewport is below 768px and the listing has more than one variant, the strip SHALL occupy the place those dots had.
5. WHILE the viewport is from 768px through 919px, the page SHALL keep the listing thumbnail column and SHALL place the strip below that media block.
6. The carousel photo counter SHALL remain while the viewport is below 920px.
7. WHILE the viewport is at least 920px, the right column SHALL show state, title, variant name, price, one selector group per axis, description, and share, in that order.
8. WHILE the viewport is at least 920px and the product has more than one axis, the page SHALL keep one strip image per variant below 920px and SHALL separate those axes into groups in the right column.
9. The page SHALL show, above the price at every width, one line per axis with that axis label and the active `value`, in axis declaration order.
10. WHEN the product has no axes THEN the page SHALL omit the per-axis lines and the variant-name line.
11. WHILE a variant is `orderable: false`, its selector item and its strip image SHALL stay present, dimmed, and with a dashed border.

**Independent Test**: Em 390px, 800px e 920px não há bolinhas. Em 390px a faixa ocupa o lugar delas quando há mais de uma variante. Em 800px ficam as miniaturas e a faixa. Uma variante só não mostra faixa. Setas e contador do carrossel permanecem.

---

### P1: Cadastro e insumos ⭐ MVP

**User Story**: Como operador, quero gravar o formato novo por uma skill só, para que a extração continue preparando insumos e não publique anúncio.

**Why P1**: O plano troca `cadastrar-relogio` por `product-register` e muda a saída do `product-scrapper`.

**Acceptance Criteria**:

1. The repository SHALL provide `product-register` as the skill that writes a listing in this product shape.
2. The repository SHALL NOT keep `cadastrar-relogio` as a catalog-writing skill.
3. The `product-register` skill SHALL refuse to merge listings.
4. The `product-scrapper` skill SHALL prepare inputs in this product shape and SHALL NOT write `product.json`.
5. The `product-scrapper` skill SHALL NOT merge listings.

**Independent Test**: As skills no disco batem com essas cinco frases. Nenhuma suíte Vitest executa as skills.

---

## Edge Cases

- IF `section` não é `available`, `coming-soon` nem `on-order` THEN a home SHALL recalcular a cascata.
- IF a marca cita um valor que não existe na seção THEN a query SHALL conservar a marca e o grupo SHALL continuar restringindo.
- WHEN todas as variantes do anúncio aberto são `orderable: false` e `v` é válido THEN a página SHALL abrir essa variante e SHALL mostrar `Indisponível`.
- WHEN o produto não tem eixo THEN o card e o compartilhar SHALL omitir `v`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| VAR-01 | P1: Contrato | Tasks | Done |
| VAR-02 | P1: Contrato | Tasks | Done |
| VAR-03 | P1: Contrato | Tasks | Done |
| VAR-04 | P1: Contrato | Tasks | Done |
| VAR-05 | P1: Contrato | Tasks | Done |
| VAR-06 | P1: Contrato | Tasks | Done |
| VAR-07 | P1: Contrato | Tasks | Done |
| VAR-08 | P1: Contrato | Tasks | Done |
| VAR-09 | P1: Contrato | Tasks | Done |
| VAR-10 | P1: Contrato | Tasks | Done |
| VAR-11 | P1: Contrato | Tasks | Done |
| VAR-12 | P1: Contrato | Tasks | Done |
| VAR-13 | P1: Contrato | Tasks | Done |
| VAR-14 | P1: Contrato | Tasks | Done |
| VAR-15 | P1: Contrato | Tasks | Done |
| VAR-16 | P1: Contrato | Tasks | Done |
| VAR-17 | P1: Contrato | Tasks | Done |
| VAR-18 | P1: Contrato | Tasks | Done |
| VAR-19 | P1: Contrato | Tasks | Done |
| VAR-20 | P1: Contrato | Tasks | Done |
| VAR-21 | P1: Contrato | Tasks | Done |
| VAR-22 | P1: Contrato | Tasks | Done |
| VAR-23 | P1: Contrato | Tasks | Done |
| VAR-24 | P1: Contrato | Tasks | Done |
| VAR-25 | P1: Contrato | Tasks | Done |
| VAR-26 | P1: Contrato | Tasks | Done |
| VAR-27 | P1: Migração | Tasks | Done |
| VAR-28 | P1: Migração | Tasks | Done |
| VAR-29 | P1: Migração | Tasks | Done |
| VAR-30 | P1: Migração | Tasks | Done |
| VAR-31 | P1: Migração | Tasks | Done |
| VAR-32 | P1: Migração | Tasks | Done |
| VAR-33 | P1: Migração | Tasks | Done |
| VAR-34 | P1: Home | Tasks | Done · T11 |
| VAR-35 | P1: Home | Tasks | Done · T11 |
| VAR-36 | P1: Home | Tasks | Done · T11 |
| VAR-37 | P1: Home | Tasks | Done · T11 |
| VAR-38 | P1: Home | Tasks | Done · T3, T9 |
| VAR-39 | P1: Home | Tasks | Done |
| VAR-40 | P1: Home | Tasks | Done |
| VAR-41 | P1: Home | Tasks | Done |
| VAR-42 | P1: Home | Tasks | Done · T10 |
| VAR-43 | P1: Home | Tasks | Done · T10 |
| VAR-44 | P1: Home | Tasks | Done · T10 |
| VAR-45 | P1: Home | Tasks | Done · T10 |
| VAR-46 | P1: Home | Tasks | Done · T10 |
| VAR-47 | P1: Home | Tasks | Done · T11 |
| VAR-48 | P1: Home | Tasks | Done · T10 |
| VAR-49 | P1: Home | Tasks | Done · T10 |
| VAR-50 | P1: Home | Tasks | Done · T5, T10 |
| VAR-51 | P1: Filtro | Tasks | Done · T11 |
| VAR-52 | P1: Filtro | Tasks | Done · T11 |
| VAR-53 | P1: Filtro | Tasks | Done · T11 |
| VAR-54 | P1: Filtro | Tasks | Done · T11 |
| VAR-55 | P1: Filtro | Tasks | Done · T11 |
| VAR-56 | P1: Filtro | Tasks | Done · T11 |
| VAR-57 | P1: Filtro | Tasks | Done · T11 |
| VAR-58 | P1: Filtro | Tasks | Done · T11 |
| VAR-59 | P1: Filtro | Tasks | Done · T11 |
| VAR-60 | P1: Filtro | Tasks | Done · T11 |
| VAR-61 | P1: Filtro | Tasks | Done · T11 |
| VAR-62 | P1: Filtro | Tasks | Done · T11 |
| VAR-63 | P1: Filtro | Tasks | Done · T11 |
| VAR-64 | P1: Filtro | Tasks | Done · T11 |
| VAR-65 | P1: Página | Tasks | Done · T15 |
| VAR-66 | P1: Página | Tasks | Done · T15 |
| VAR-67 | P1: Página | Tasks | Done · T15 |
| VAR-68 | P1: Página | Tasks | Done · T14 |
| VAR-69 | P1: Página | Tasks | Done |
| VAR-70 | P1: Página | Tasks | Done |
| VAR-71 | P1: Página | Tasks | Done |
| VAR-72 | P1: Página | Tasks | Done |
| VAR-73 | P1: Página | Tasks | Done · T15 |
| VAR-74 | P1: Página | Tasks | Done · T15 |
| VAR-75 | P1: Página | Tasks | Done · T14 |
| VAR-76 | P1: Página | Tasks | Done · T14 |
| VAR-77 | P1: Página | Tasks | Done |
| VAR-78 | P1: Página | Tasks | Done · T15 |
| VAR-79 | P1: Página | Tasks | Done · T15 |
| VAR-80 | P1: Página | Tasks | Done · T15 |
| VAR-81 | P1: Página | Tasks | Done · T15 |
| VAR-82 | P1: Página | Tasks | Done · T16 |
| VAR-83 | P1: Página | Tasks | Done · T16 |
| VAR-84 | P1: Página | Tasks | Done · T15 |
| VAR-85 | P1: Página | Tasks | Done · T16 |
| VAR-86 | P1: Largura | Tasks | Done · T13 |
| VAR-87 | P1: Largura | Tasks | Done · T13 |
| VAR-88 | P1: Largura | Tasks | Done · T13 |
| VAR-89 | P1: Largura | Tasks | Done · T12 |
| VAR-90 | P1: Largura | Tasks | Done · T12 |
| VAR-91 | P1: Largura | Tasks | Done · T12 |
| VAR-92 | P1: Largura | Tasks | Done · T15 |
| VAR-93 | P1: Largura | Tasks | Done · T15 |
| VAR-94 | P1: Largura | Tasks | Done · T15 |
| VAR-95 | P1: Largura | Tasks | Done · T15 |
| VAR-96 | P1: Largura | Tasks | Done · T13 |
| VAR-97 | P1: Cadastro | Tasks | In Tasks |
| VAR-98 | P1: Cadastro | Tasks | In Tasks |
| VAR-99 | P1: Cadastro | Tasks | In Tasks |
| VAR-100 | P1: Cadastro | Tasks | In Tasks |
| VAR-101 | P1: Cadastro | Tasks | In Tasks |
| VAR-102 | P1: Contrato | Tasks | Done · T1, T9 |

**Coverage:** 102 total, 102 mapped to tasks, 0 unmapped. O mapa está em `tasks.md`.

---

## Success Criteria

- [ ] Todo `product.json` migrado passa no schema e gera um card na seção da sua disponibilidade, salvo anúncio oculto ou só com variantes `orderable: false`
- [ ] A home sem `section` abre a primeira seção com card, e o filtro volta igual depois do anúncio
- [ ] `/product/<slug>/<id>?v=` mostra só aquele anúncio, na variante pedida
- [ ] Abaixo de 920px a faixa troca a variante; de 920px em diante os grupos de eixo fazem isso
- [ ] `product-register` é a única skill que grava o anúncio
