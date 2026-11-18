# Filtros da home e estado na variante

## Problem Statement

O anúncio inteiro carrega um único estado e uma única disponibilidade. O mesmo relógio fica partido em vários anúncios, e a home separa esses anúncios em abas. O visitante precisa ver um anúncio só, com estado e disponibilidade em cada variante, e filtrar a vitrine por desconto, público e estado.

## Goals

- [ ] Cada variante tem estado e disponibilidade próprios, com padrão `new` e `on_order` quando o campo falta.
- [ ] Cada produto do catálogo atual fica com um anúncio `main-listing`, na regra de prioridade combinada.
- [ ] A home troca as abas por sete filtros em pílula, com Todos abrindo o catálogo inteiro.
- [ ] A ficha resolve a variante por eixos, estado e disponibilidade, e esconde o preço sob encomenda.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Desempate novo do card (menor preço, depois estado, depois disponibilidade) | Item seguinte do backlog. Este spec mantém o menor preço. |
| Grade da home e largura dos cards | Item seguinte do backlog. |
| Ofertas globais e o flag por variante | Item seguinte do backlog. |
| Redirecionar um id de anúncio antigo para `main-listing` | O desenho recusou o redirecionamento. |
| Rodar a fusão de novo sobre um produto já migrado | A fusão lê `availabilityStatus` no anúncio. Esse campo deixa de existir depois da gravação. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Estado e disponibilidade são campos da variante, não eixos em `axes` | Campos opcionais `state` e `availabilityStatus` | O usuário escolheu campos, com identidade de eixo | y |
| Campo ausente na leitura | Estado `new`, disponibilidade `on_order` | Padrão pedido para o JSON enxuto | y |
| Id do anúncio unificado | `main-listing` | Pedido explícito no lugar de `listing` | y |
| Id antigo | Não abre o anúncio. Texto "Este relógio não está no catálogo." | Pedido explícito, sem redirect | y |
| Empate de eixos na fusão | Disponibilidade mais forte vence mesmo com estado diferente. Mesma disponibilidade e estados diferentes ficam os dois | Colisão confirmada com o AD2035, o SF741, o Air King e o MY-H3-2QZ | y |
| Ordem da fusão | `availabilityStatus` do anúncio de origem: `available`, `coming_soon`, `on_order`. O id não entra na ordem | O Air King tem id `listing-coming-soon` com status `available` | y |
| Filtro inicial | Todos, catálogo inteiro, inclusive sob encomenda. Apertar o botão ativo não solta | Pedido depois dos seis filtros | y |
| Nome da query | `filter` com `discount`, `female`, `male`, `new`, `openbox`, `used`. Todos omite a query | Separa do `section` antigo | y |
| Desconto | `(listPrice - price) / listPrice >= 0.20` nos valores truncados. Sob encomenda fica de fora | 20% entra. 19,9% fica de fora | y |
| Card dentro do filtro | Menor preço no conjunto elegível. Preços iguais usam a capa. Sem preço, capa sem ofertas | A regra nova de desempate ficou fora | y |
| Público infantil e ausente | Fora de Feminino e de Masculino | Só `female`, `male` e `unisex` foram pedidos | y |
| Produto que falha no schema depois da fusão | O arquivo desse slug não é gravado. Os outros slugs seguem | A frase aprovada é por produto | y |
| Autenticação e limite de uso | N/A | Catálogo estático, sem conta | y |
| Concorrência | N/A | A fusão roda uma vez, fora do browser. A página só lê | y |
| Expiração de dado | N/A | Anúncio não expira | y |
| Observabilidade | N/A | Não há serviço nem job contínuo | y |
| Dependência externa | N/A | A mudança não chama rede | y |

**Open questions:** none

---

## User Stories

### P1: Variante com estado e disponibilidade ⭐ MVP

**User Story**: As a catalog editor, I want each variant to carry its own state and availability so that one listing can mix conditions.

**Why P1**: Sem esse contrato, a fusão e a ficha não têm onde gravar a condição.

**Acceptance Criteria**:

1. The ProductSchema SHALL accept a variant that omits `state` and `availabilityStatus`.
2. The ProductSchema SHALL reject a second variant in the same listing when the axes, the effective state, and the effective availability are equal.
3. The ProductSchema SHALL accept two variants with the same axes when the effective state or the effective availability differs.
4. WHEN the effective availability is not `on_order` and `price` is absent THEN the ProductSchema SHALL reject the variant.
5. WHEN the effective availability is `on_order` THEN the ProductSchema SHALL accept the variant without `price`.
6. WHEN `orderable` is `false` and the effective availability is not `on_order` THEN the ProductSchema SHALL reject the variant.
7. The ProductSchema SHALL accept an `on_order` variant whose `state` is `used`.
8. The ProductSchema SHALL reject a variant whose `mainImage` is absent from that listing's `images`.
9. WHEN a reader resolves a variant that omits `state` THEN the catalog SHALL use `new`.
10. WHEN a reader resolves a variant that omits `availabilityStatus` THEN the catalog SHALL use `on_order`.

**Independent Test**: Parse fixtures through ProductSchema and through the reader that applies the defaults. No home page required.

---

### P1: Um anúncio por produto ⭐ MVP

**User Story**: As a catalog editor, I want today's split listings merged into `main-listing` so that the published JSON matches the new contract.

**Why P1**: O catálogo publicado ainda parte o mesmo relógio por disponibilidade.

**Acceptance Criteria**:

1. WHEN the merge runs on `addiesdive-ad2035` THEN the product SHALL contain one listing `main-listing` whose `steel` variant has `state` `used` and `availabilityStatus` `available`.
2. WHEN the merge runs on `steelflier-sf741` THEN the `sf741-zp` variant SHALL have `state` `openbox` and `availabilityStatus` `available`.
3. WHEN the merge runs on `steelflier-sf741` THEN each axis value that existed only on the `on_order` listing SHALL remain `state` `new` and `availabilityStatus` `on_order`.
4. WHEN the merge runs on `aimimo-design-air-king` THEN the `b-no-logo` variant SHALL have `state` `openbox` and `availabilityStatus` `available`.
5. WHEN the merge runs on `addiesdive-my-h3-2qz` THEN the `black-steel` variant SHALL have `state` `used` and `availabilityStatus` `available`.
6. The merge SHALL order source listings by `availabilityStatus` as `available`, then `coming_soon`, then `on_order`, keeping source order inside one status.
7. The merged `images` array SHALL list each source file name once, in first-seen order of that walk.
8. IF at least one source listing has `enabled` other than `false` THEN the merge SHALL drop variants from every source listing with `enabled` `false`.
9. IF every source listing has `enabled` `false` THEN the merge SHALL write `main-listing` with `enabled` `false` and the variants chosen by the same priority.
10. WHEN two source variants share axes, effective state, and effective availability THEN the merge SHALL keep the first in the walk.
11. WHEN two source variants share axes and effective availability and differ in effective state THEN the merge SHALL keep both.
12. The winning variant SHALL keep its source `state`, `price`, `listPrice`, `offers`, `mainImage`, `observations`, and `orderable`.
13. WHEN a source listing has `specifications` THEN the merged listing SHALL copy the specifications of the first listing in the walk that has them.
14. The merge SHALL leave the product `specifications` unchanged.
15. IF the merged product fails ProductSchema THEN the migration SHALL leave that slug's file unchanged.

**Independent Test**: Run the merge on the four named products and on two synthetic products, one partly disabled and one fully disabled.

---

### P1: Filtros da home ⭐ MVP

**User Story**: As a visitor, I want one pressed pill filter so that I can browse the whole catalog or one cut of it.

**Why P1**: As abas atuais mostram a disponibilidade do anúncio, que deixa de existir.

**Acceptance Criteria**:

1. The home SHALL render the buttons in this order: Todos, 20%+ de desconto, Feminino, Masculino, Novos, Openbox, Usados.
2. The filter group SHALL expose `aria-label` "Filtros".
3. The filter group SHALL keep `aria-pressed` true on exactly one button.
4. The filter group SHALL lay the buttons out on one line without wrapping.
5. WHEN the buttons overflow the row width THEN the filter group SHALL scroll horizontally.
6. The pressed button SHALL use the theme primary color as its background and a fully rounded pill shape.
7. WHEN the visitor opens `/` with no `filter` THEN the home SHALL press Todos, write no `filter`, and show every enabled listing that has a variant with `orderable` other than `false`, including a listing whose only such variants are `on_order`.
8. WHEN the visitor presses "20%+ de desconto" THEN the home SHALL set `filter` to `discount`.
9. WHEN `filter` is `discount` THEN the home SHALL include a listing only when a variant with `orderable` other than `false` has `price` and `listPrice`, `(listPrice - price) / listPrice` is at least `0.20` on the truncated values, and the effective availability is not `on_order`.
10. WHEN `listPrice` is `100` and `price` is `80` THEN that variant SHALL pass the discount rule.
11. WHEN `listPrice` is `100` and `price` is `80.1` THEN that variant SHALL fail the discount rule.
12. WHEN the effective availability is `on_order` and `listPrice` is `100` and `price` is `80` THEN that variant SHALL fail the discount rule.
13. WHEN the visitor presses Feminino THEN the home SHALL set `filter` to `female`.
14. WHEN `filter` is `female` THEN the home SHALL include a product only when `audience` is `female` or `unisex` and the listing has a representable variant.
15. WHEN the visitor presses Masculino THEN the home SHALL set `filter` to `male`.
16. WHEN `filter` is `male` THEN the home SHALL include a product only when `audience` is `male` or `unisex` and the listing has a representable variant.
17. The home SHALL exclude `audience` `child` from Feminino and from Masculino.
18. The home SHALL exclude a product with no `audience` from Feminino and from Masculino.
19. WHEN the visitor presses Novos THEN the home SHALL set `filter` to `new`.
20. WHEN `filter` is `new` THEN the home SHALL include a listing only when a representable variant has effective state `new`.
21. WHEN the visitor presses Openbox THEN the home SHALL set `filter` to `openbox`.
22. WHEN `filter` is `openbox` THEN the home SHALL include a listing only when a representable variant has effective state `openbox`.
23. WHEN the visitor presses Usados THEN the home SHALL set `filter` to `used`.
24. WHEN `filter` is `used` THEN the home SHALL include a listing only when a representable variant has effective state `used`.
25. The home SHALL omit a `defective` variant from Novos, Openbox, and Usados.
26. The home SHALL show at most one card per listing in the active filter.
27. WHEN the active filter is Todos, Feminino, or Masculino THEN the card pool SHALL be every variant of that listing with `orderable` other than `false`.
28. WHEN the active filter is discount, Novos, Openbox, or Usados THEN the card pool SHALL be the representable variants that themselves match that filter.
29. WHEN the card pool has at least one `price` THEN the card SHALL show the lowest `price` in that pool.
30. WHEN every priced variant in the card pool has the same `price` THEN the card image SHALL be the listing cover `images[0]`.
31. WHEN the card pool has no `price` THEN the card SHALL use the listing cover.
32. WHEN the card pool has no `price` THEN the card SHALL omit price and offers.
33. The home SHALL hide a listing with `enabled` `false`.
34. WHEN the visitor presses the button that is already pressed THEN the home SHALL leave the query and the pressed button unchanged.
35. IF `filter` is not `discount`, `female`, `male`, `new`, `openbox`, or `used` THEN the home SHALL press Todos and show the Todos cards.
36. IF `filter` is not `discount`, `female`, `male`, `new`, `openbox`, or `used` THEN the home SHALL leave the query unchanged.
37. IF `section` is present and `filter` is absent THEN the home SHALL press Todos and show the Todos cards.
38. IF `section` is present and `filter` is absent THEN the home SHALL leave the query unchanged.
39. IF a known `filter` matches no card THEN the home SHALL disable that button.
40. IF a known `filter` matches no card THEN the home SHALL press Todos, show the Todos cards, and leave the query unchanged.
41. WHILE the catalog has at least one card the home SHALL keep Todos enabled.
42. IF the catalog has no representable card THEN the home SHALL show "Não temos nenhum anúncio ativo."

**Independent Test**: Render the home with a fixture catalog and assert the query, the pressed button, and which slugs appear.

---

### P1: Ficha da variante ⭐ MVP

**User Story**: As a visitor, I want the product page to open the variant I selected so that state and availability match the link I shared.

**Why P1**: Com eixos repetidos, `v` sozinho não identifica a variante.

**Acceptance Criteria**:

1. WHEN a variant is resolved THEN the page SHALL show its effective state label and its effective availability label on the same line.
2. The state labels SHALL be Novo, Openbox, Usado, and Com defeito for `new`, `openbox`, `used`, and `defective`.
3. The availability labels SHALL be Disponível, Chega em breve, and Sob encomenda for `available`, `coming_soon`, and `on_order`.
4. WHEN the resolved effective availability is `on_order` THEN the page SHALL hide the price and show "Preço sob consulta".
5. WHEN the resolved effective availability is `on_order` THEN the page SHALL hide that variant's offers.
6. WHEN the resolved variant has `orderable` `false` THEN the page SHALL show "Indisponível".
7. WHEN the current axis selection leaves more than one effective state THEN the page SHALL show a text selector labeled Estado after the product axes.
8. WHEN the current axis selection leaves one effective state THEN the page SHALL omit the Estado selector.
9. WHEN the current axis selection leaves more than one effective availability THEN the page SHALL show a text selector labeled Disponibilidade after Estado or, when Estado is absent, after the product axes.
10. WHEN the current axis selection leaves one effective availability THEN the page SHALL omit the Disponibilidade selector.
11. WHEN a selector option does not combine with the current selection THEN the page SHALL disable that option.
12. The page SHALL keep `v` as the axis value ids in product axis order, joined by commas.
13. WHEN more than one variant shares the same `v` and their effective states differ THEN the link SHALL include `state` with the model token.
14. WHEN more than one variant shares the same `v` and their effective availabilities differ THEN the link SHALL include `availability` with the model token.
15. WHEN `v` is absent THEN the page SHALL open the first variant with `orderable` other than `false`, in array order.
16. WHEN every variant has `orderable` `false` and `v` is absent THEN the page SHALL open the first variant in the array.
17. WHEN `v` does not match the axis count THEN the page SHALL use the same fallback as an absent `v`.
18. IF `state` is a valid token and matches none of the `v` variants THEN the page SHALL ignore `state`.
19. IF `availability` is a valid token and matches none of the `v` variants THEN the page SHALL ignore `availability`.
20. IF `state` or `availability` is not a model token THEN the page SHALL ignore that parameter.
21. WHEN more than one variant still matches THEN the page SHALL keep the strongest effective availability, in the order `available`, `coming_soon`, `on_order`.
22. WHEN more than one variant remains at that availability THEN the page SHALL open the first of them in the `variants` array.
23. IF the listing id is not on the product THEN the page SHALL show "Este relógio não está no catálogo."
24. The share link SHALL use `/product/{slug}/{listingId}` plus the `v`, `state`, and `availability` query that resolves to the same variant.

**Independent Test**: Open a fixture listing with two variants on the same axes and assert the resolved labels, the query, and the missing-listing text.

---

### P1: Contrato e cadastro ⭐ MVP

**User Story**: As a catalog editor, I want the written contract and the register skill to emit the new shape so that the next watch validates.

**Why P1**: O schema novo rejeita o anúncio que a skill grava hoje.

**Acceptance Criteria**:

1. The document `docs/contrato-relogio.md` SHALL state that `state` and `availabilityStatus` live on the variant, are optional, and read as `new` and `on_order` when omitted.
2. The document `docs/contrato-relogio.md` SHALL state that an `on_order` variant may use a state other than `new`.
3. The document `docs/contrato-relogio.md` SHALL state that product-register writes listing id `main-listing`, sets each variant `availabilityStatus` to `on_order`, and omits variant `price`.
4. The README home section SHALL describe the seven filter buttons and the `filter` query.
5. WHEN product-register creates an on-order product THEN the written listing id SHALL be `main-listing`.
6. WHEN product-register creates an on-order product THEN each variant SHALL omit `price`.
7. WHEN product-register creates an on-order product THEN each variant SHALL set `availabilityStatus` to `on_order`.

**Independent Test**: Read `docs/contrato-relogio.md`, the README home section, and `.agents/skills/product-register/SKILL.md`. Assert `main-listing`, variant `availabilityStatus` `on_order`, and no variant price.

---

## Edge Cases

- IF `filter=used` matches nothing THEN the home SHALL disable Usados, press Todos, and keep `filter=used` in the query.
- IF a merged gallery would repeat `poedagar-682-8.webp` THEN the merged `images` array SHALL contain that name once.
- WHEN the Air King source id is `listing-coming-soon` and its `availabilityStatus` is `available` THEN the merge SHALL treat that listing as `available`.
- IF an old URL uses a pre-merge listing id THEN the page SHALL show "Este relógio não está no catálogo."

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| FILT-01 | P1: Variante com estado e disponibilidade | Tasks | Done in T1, T2, T4 |
| FILT-02 | P1: Um anúncio por produto | Tasks | T3 done; T10 pending |
| FILT-03 | P1: Filtros da home | Tasks | T5, T7 done |
| FILT-04 | P1: Ficha da variante | Tasks | T6, T8 done; T9 pending |
| FILT-05 | P1: Contrato e cadastro | Tasks | In Tasks |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Os quatro produtos nomeados ficam com um `main-listing` e a variante vencedora descrita acima.
- [ ] A home abre em Todos, com sob encomenda visível, e cada filtro grava o token certo.
- [ ] 80 de 100 entra em 20%+. 80,1 de 100 fica de fora. Sob encomenda fica de fora.
- [ ] Um id de anúncio antigo mostra "Este relógio não está no catálogo."
- [ ] Variante sob encomenda mostra "Preço sob consulta" e não mostra preço nem ofertas.
