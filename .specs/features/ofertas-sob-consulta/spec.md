# Ofertas, sob consulta e variantes

## Problem Statement

O anúncio sob encomenda ainda mostra preço, a oferta é um booleano com badge fixa sobre a foto, e a página repete o nome da variante. A aba Todos também esconde a combinação que já existe em estoque ou a caminho. O visitante precisa ver Sob consulta sem preço, as ofertas do JSON lado a lado, e cada eixo como imagem ou texto, sem essa repetição.

## Goals

- [ ] Anúncio `on_order` mostra **Sob consulta** no card, na página e na barra fixa, e o preço permanece só no JSON
- [ ] **Todos** lista só `available` e `coming_soon`; **Encomendar** lista cada variante `on_order`, mesmo quando a combinação já existe em outro anúncio
- [ ] `unmissableOffer` sai; `offers` desenha badges na ordem do array, no corpo do card com preço, na página e na barra fixa
- [ ] Cada eixo é `image` ou `text` depois do preço, sem a faixa de uma foto por variante e sem a linha solta do nome

## Out of Scope

| Feature | Reason |
| --- | --- |
| Conta do preço, do desconto, do pix ou do parcelamento | O plano não mexe nessa conta. No card com preço, De, percentual, pix e parcelamento permanecem |
| Esconder o badge **Sob encomenda** | O plano manda manter o badge |
| Título da página e frase do WhatsApp | Os dois continuam com `alias` quando existir, senão `value` |
| Regras de **Pronta entrega** e **A caminho** | Fora a escolha da variante do card e a troca da badge de oferta |
| Fusão de anúncios, vendedores e suíte fora dos testes desta feature | O plano não pede isso |
| Retomada de `catalog-layout-refactor` | Feature pausada em outro branch. Este trabalho começa em `main` |
| Push, deploy e alteração remota | Aprovar o spec autoriza o artefato local. Execução futura, se aprovada, continua só com commit local |
| Autenticação, limite de taxa, expiração, log e serviço remoto | Catálogo estático |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Fonte do comportamento | O plano `.plans/2026-11-11-ofertas-sob-consulta-design.md` | O operador entregou o desenho fechado. Este spec só o torna testável | y |
| `presentation` ausente | O eixo vale `text` | O plano diz que ausente significa `text` | y |
| `text` vazio | A string `""` é inválida. Espaços não são aparados e aparecem como estão no JSON | O plano rejeita texto vazio e pede o texto exatamente como gravado, sem maiúsculas forçadas | y |
| Hex | `#` mais 3 ou 6 dígitos hexadecimais, maiúsculas ou minúsculas. `#RGBA` e `#RRGGBBAA` são inválidos | O plano limita a `#RGB` ou `#RRGGBB` | y |
| Par de cores no tema escuro | Os mesmos hex do JSON, em estilo inline, no tema claro e no escuro | O plano fixa o par do badge atual e não deixa o tema escuro trocá-lo | y |
| Ícone | O schema de `shared` aceita string não vazia e não depende de `lucide-react`. Nome que não é export do `lucide-react` falha no prebuild do client que valida `public/catalog` e grava `products.generated.ts` | O plano separa schema e prebuild | y |
| Oferta e preço | `offers` não altera `price` nem `listPrice` | O plano afirma isso | y |
| Card que já gera | Continua `enabled` diferente de `false` e ao menos uma variante com `orderable` diferente de `false` | **Todos** filtra anúncio que já gera card. O plano não muda o predicado de `orderable` | y |
| Anúncio `on_order` só com `orderable: false` | Não gera card na home. Na página, a variante selecionada ainda mostra **Indisponível** e **Sob consulta** | O card exige variante que possa representar o anúncio. O rótulo da página é outra regra | y |
| Empate de preço | A variante que aparece primeiro em `listing.variants` | O plano desempata pela ordem do arquivo | y |
| Card `on_order` | Foto `images[0]`, caminho sem `?v=`, sem fileira de ofertas, texto **Sob consulta** | O plano não escolhe variante nesse card | y |
| Link direto | Um `?v=` da variante sob encomenda abre essa variante, mesmo se a combinação já está em estoque ou a caminho | O plano manda a página abrir. O card é que não leva `?v=` | y |
| Página sem query | Resolve a variante padrão como já faz hoje | O plano não troca essa resolução | y |
| Seletor | A linha é `{label}: {value}` do valor selecionado, não o `alias`. `alias` continua só no título e no WhatsApp | O plano escreve `value` no seletor e reserva `alias` para título e frase | y |
| Miniatura | `mainImage` da primeira variante de `variantQueue` que contém o valor, a mesma landing que o seletor já calcula. 64px, rolagem horizontal, a borda e o anel atuais da faixa | O plano copia a faixa atual | y |
| Um único valor | O eixo continua visível | O plano manda mostrar | y |
| Largura | Abaixo de 920px a ordem é identidade, mídia, ofertas, preço ou **Sob consulta**, eixos. De 920px em diante a mídia fica à esquerda e a coluna direita segue identidade, ofertas, preço ou **Sob consulta**, eixos, descrição e compartilhar | O plano fixa as duas ordens | y |
| Home só com sob encomenda | **Todos** fica sem card e desabilitada. A home abre a primeira aba com card na ordem já publicada, que é **Encomendar** | O fallback atual já troca a aba pedida quando ela está vazia | y |
| Migração repetida | A segunda passagem não acha `unmissableOffer` e não acrescenta outra oferta | `false` ou ausente some sem lista. A oferta migrada não volta a ser booleano | y |
| README | O trecho que documenta `unmissableOffer` e a badge sobre a foto passa a documentar `offers` e a fileira no corpo do card | O plano lista esse trecho nos arquivos | y |
| Falha parcial | N/A porque o build rejeita o JSON ou o ícone inteiro. Não há gravação parcial em runtime | Catálogo estático | y |
| Idempotência de runtime | N/A porque não há fila nem retentativa. A única repetição é a migração acima | Sem efeito colateral de clique | y |
| Concorrência | N/A porque não há escrita concorrente. A ordem exigida é a do array `offers` e a de `listing.variants` | Estado de tela | y |
| Ciclo de vida | N/A porque oferta e preço não expiram. O JSON gravado não muda por causa da regra de seção | Sem TTL | y |
| Dependência externa | O único nome externo é o export do `lucide-react`, conferido no prebuild. Não há chamada de rede | O plano recusa a dependência no `shared` | y |

**Open questions:** none

---

## User Stories

### P1: Contrato de oferta e de eixo ⭐ MVP

**User Story**: Como operador, quero gravar ofertas e a apresentação do eixo no `product.json`, para que a tela leia texto, cor e ícone em vez de um booleano.

**Why P1**: Sem o contrato, a migração e a tela não têm o que validar.

**Acceptance Criteria**:

1. The ProductSchema SHALL accept an optional axis `presentation` only as `image` or `text`.
2. WHEN `presentation` is omitted THEN the catalog SHALL treat that axis as `text`.
3. IF a variant includes `unmissableOffer` THEN the ProductSchema SHALL reject the variant.
4. WHEN `offers` is omitted or an empty array THEN the ProductSchema SHALL accept the variant.
5. IF an offer lacks `text`, `background`, `color`, or `icon`, or `text` is `""`, or `icon` is `""` THEN the ProductSchema SHALL reject the variant.
6. The ProductSchema SHALL accept offer `background` and `color` only when each is `#` plus 3 or 6 hexadecimal digits, in upper or lower case.
7. IF `background` or `color` has any other form THEN the ProductSchema SHALL reject the offer.
8. The shared ProductSchema SHALL accept a non-empty `icon` string and SHALL not depend on `lucide-react`.
9. IF `icon` is not an export of `lucide-react` THEN the client prebuild that validates `public/catalog` and writes `products.generated.ts` SHALL fail.
10. The catalog SHALL leave `price` and `listPrice` unchanged when `offers` is present.

**Independent Test**: O teste do schema aceita lista ausente ou vazia e `presentation` ausente, e rejeita `unmissableOffer`, texto vazio e hex fora do formato. O prebuild falha com ícone que o Lucide não exporta.

---

### P1: Migração da oferta imperdível ⭐ MVP

**User Story**: Como operador, quero cada oferta imperdível já gravada virar uma oferta com texto, ícone e cores, para que o catálogo gerado não dependa mais do booleano.

**Why P1**: Os `product.json` publicados ainda usam `unmissableOffer`.

**Acceptance Criteria**:

1. WHEN a variant has `unmissableOffer: true` THEN the migrated `product.json` SHALL replace it with one offer whose `text` is `OFERTA IMPERDÍVEL`, whose `icon` is `Gift`, whose `background` is `#0066cc`, and whose `color` is `#ffffff`, and SHALL omit `unmissableOffer`.
2. WHEN `unmissableOffer` is `false` or absent THEN the migrated variant SHALL omit `unmissableOffer` and SHALL omit `offers`.
3. WHEN `client/scripts/catalog.ts` normalizes a legacy source with `unmissableOffer: true` THEN the result SHALL contain that same offer and SHALL omit `unmissableOffer`.
4. WHEN that normalizer reads `unmissableOffer` false or absent THEN the result SHALL omit `offers` and SHALL omit `unmissableOffer`.
5. WHEN the catalog prebuild runs after migration THEN `products.generated.ts` SHALL be rebuilt from those JSON files and SHALL NOT contain `unmissableOffer`.
6. The project README SHALL document `offers` and the offer row in the card body, and SHALL NOT document `unmissableOffer` or a badge drawn over the photo.

**Independent Test**: Um JSON com `true` ganha a oferta `Gift`. Um JSON com `false` ou sem o campo fica sem lista. O normalizador legado e o arquivo gerado seguem a mesma regra.

---

### P1: Abas e card ⭐ MVP

**User Story**: Como visitante, quero achar a encomenda na aba Encomendar e, no card com preço, a variante mais barata que pode ser pedida, para que estoque e encomenda não se escondam.

**Why P1**: A home é onde a badge e o Sob consulta aparecem primeiro.

**Acceptance Criteria**:

1. WHEN the section is `all` THEN the catalog SHALL include only a listing that already generates a card and whose `availabilityStatus` is `available` or `coming_soon`.
2. WHEN the section is `on-order` THEN the catalog SHALL include each `on_order` listing that already generates a card, with every variant, including a variant whose axis combination already exists on an `available` or `coming_soon` listing.
3. The catalog SHALL NOT remove an on-order variant, and SHALL NOT change the stored JSON, because that combination already exists in stock or on the way.
4. WHEN a direct link carries `?v=` for that on-order variant THEN the product page SHALL open that variant.
5. The published catalog module SHALL NOT export `listingForDisplay` or `coveredVariantKeys`.
6. WHEN the card listing is `available` or `coming_soon` THEN the catalog SHALL choose the lowest `price` among variants whose `orderable` is not `false`.
7. WHEN two of those variants share that lowest `price` THEN the catalog SHALL choose the one that appears first in `listing.variants`.
8. The priced card SHALL use that variant's photo, that variant's `offers`, and a path that includes `?v=`.
9. WHEN the card listing is `on_order` THEN the card SHALL use `images[0]`, SHALL omit `?v=` from the path, SHALL omit the offer row, and SHALL show `Sob consulta`.
10. WHEN every listing that generates a card is `on_order` THEN the **Todos** tab SHALL show no card and SHALL be disabled, and the home SHALL open **Encomendar**.

**Independent Test**: A combinação repetida aparece em Encomendar e abre pelo link direto. O card com preço empata pela ordem do arquivo e ignora `orderable: false`. O card de encomenda não leva oferta nem query.

---

### P1: Sob consulta e fileira de ofertas ⭐ MVP

**User Story**: Como visitante, quero ler Sob consulta sem preço e ver as ofertas do JSON lado a lado, para que o anúncio sob encomenda não pareça ter valor à vista.

**Why P1**: É o texto que substitui o bloco de preço e a badge antiga.

**Acceptance Criteria**:

1. WHILE the listing `availabilityStatus` is `on_order`, the card, the product page, and the sticky bar SHALL show the text `Sob consulta` and SHALL NOT show the price block, pix, or installments.
2. WHILE that selected variant has `orderable: false`, the product page and the sticky bar SHALL keep the label `Indisponível` and SHALL keep the price hidden.
3. WHERE the selected variant has a non-empty `offers` list, the product page and the sticky bar SHALL show that variant's offer row above `Sob consulta`.
4. WHEN a priced card, the product page, or the sticky bar renders offers THEN it SHALL show one badge per offer, in array order, side by side, wrapping to the next line.
5. The offer badge SHALL use `background` and `color` as inline style in both themes, the Lucide icon named by `icon`, and `text` exactly as stored, without forcing uppercase.
6. WHEN `offers` is omitted or empty THEN that surface SHALL render no offer row.
7. The priced card SHALL place the offer row in the card body above the price at every width and SHALL NOT draw that row over the photo.
8. The priced card SHALL show the price in the normal price color and SHALL keep the existing `De`, discount percent, pix, and installment lines.

**Independent Test**: A página e a barra de um `on_order` não mostram preço, inclusive com **Indisponível**. A fileira quebra linha, conserva o texto do JSON e, no card com preço, fica acima do preço.

---

### P1: Eixos da página ⭐ MVP

**User Story**: Como visitante, quero escolher o eixo por miniatura ou por texto depois do preço, para que o nome da variante não se repita na página.

**Why P1**: O plano troca a faixa e a ordem da página junto com a oferta.

**Acceptance Criteria**:

1. The product page SHALL place the price or `Sob consulta` before the axes at every width.
2. The product page SHALL NOT render the loose line that repeats the variant name.
3. The product page SHALL NOT repeat an axis above the price.
4. The product page SHALL NOT render the one-photo-per-variant strip.
5. WHEN the viewport is below 920px THEN the page order SHALL be identity, media, offers, price or `Sob consulta`, then axes.
6. WHEN the viewport is 920px or wider THEN media SHALL stay in the left column, and the right column order SHALL be identity, offers, price or `Sob consulta`, axes, description, then share.
7. The axis selector, at every width, SHALL show `{label}: {selected value}` and SHALL show the control below that line.
8. WHEN an axis has a single value THEN the selector SHALL remain visible.
9. WHERE `presentation` is `image`, the selector SHALL show one 64px thumbnail per value, with horizontal scroll, the current strip border, and the current selection ring, using the `mainImage` of the first `variantQueue` variant that contains that value.
10. WHERE an image option is impossible or unavailable THEN the selector SHALL keep that option visible and disabled.
11. WHERE `presentation` is `text` THEN the selector SHALL show wrapping badges of each `value` and SHALL NOT scroll that axis horizontally.
12. WHEN the visitor chooses another enabled option THEN the page SHALL select that variant, and the selected, unavailable, and disabled states SHALL keep their current behavior.

**Independent Test**: Abaixo de 920px e a partir de 920px o preço vem antes dos eixos. O eixo `image` rola a 64px. O eixo `text` quebra linha. A faixa antiga e a linha solta do nome não aparecem.

---

## Edge Cases

- IF `offers` is empty THEN the catalog SHALL draw no offer row.
- IF the on-order variant is `orderable: false` THEN the page and the sticky bar SHALL show `Indisponível` and `Sob consulta` and SHALL hide the price.
- WHEN the same axis combination exists in stock THEN the on-order variant SHALL remain on **Encomendar** and SHALL open from its direct link.
- WHEN the lowest priced orderable variants tie THEN the card SHALL use the earlier variant in `listing.variants`.
- IF the Lucide export name is unknown THEN the client prebuild SHALL fail and the shared schema SHALL still accept the non-empty string.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| OSC-01 | P1: Contrato | Tasks | Done · T1 |
| OSC-02 | P1: Contrato | Tasks | Done · T2 |
| OSC-03 | P1: Contrato | Tasks | Done · T3 |
| OSC-04 | P1: Contrato | Tasks | Done · T1 |
| OSC-05 | P1: Contrato | Tasks | Done · T1 |
| OSC-06 | P1: Contrato | Tasks | Done · T1 |
| OSC-07 | P1: Contrato | Tasks | Done · T1 |
| OSC-08 | P1: Contrato | Tasks | Done · T1 |
| OSC-09 | P1: Contrato | Tasks | Done · T6 |
| OSC-10 | P1: Contrato | Tasks | Done · T1 |
| OSC-11 | P1: Migração | Tasks | Done · T5 |
| OSC-12 | P1: Migração | Tasks | Done · T5 |
| OSC-13 | P1: Migração | Tasks | Done · T4 |
| OSC-14 | P1: Migração | Tasks | Done · T4 |
| OSC-15 | P1: Migração | Tasks | Done · T5 |
| OSC-16 | P1: Migração | Tasks | Done · T7 |
| OSC-17 | P1: Abas e card | Tasks | Done · T2 |
| OSC-18 | P1: Abas e card | Tasks | Done · T2 |
| OSC-19 | P1: Abas e card | Tasks | Done · T2 |
| OSC-20 | P1: Abas e card | Tasks | Done · T2 |
| OSC-21 | P1: Abas e card | Tasks | Done · T2 |
| OSC-22 | P1: Abas e card | Tasks | Done · T2 |
| OSC-23 | P1: Abas e card | Tasks | Done · T2 |
| OSC-24 | P1: Abas e card | Tasks | Done · T2 |
| OSC-25 | P1: Abas e card | Tasks | Done · T10 |
| OSC-26 | P1: Abas e card | Tasks | Pending · T14 |
| OSC-27 | P1: Sob consulta e fileira | Tasks | Pending · T11 · T13 |
| OSC-28 | P1: Sob consulta e fileira | Tasks | Pending · T11 · T13 |
| OSC-29 | P1: Sob consulta e fileira | Tasks | Pending · T11 · T13 |
| OSC-30 | P1: Sob consulta e fileira | Tasks | Done · T8 |
| OSC-31 | P1: Sob consulta e fileira | Tasks | Done · T8 |
| OSC-32 | P1: Sob consulta e fileira | Tasks | Done · T8 |
| OSC-33 | P1: Sob consulta e fileira | Tasks | Done · T10 |
| OSC-34 | P1: Sob consulta e fileira | Tasks | Done · T9 |
| OSC-35 | P1: Eixos da página | Tasks | Pending · T13 |
| OSC-36 | P1: Eixos da página | Tasks | Pending · T13 |
| OSC-37 | P1: Eixos da página | Tasks | Pending · T13 |
| OSC-38 | P1: Eixos da página | Tasks | Pending · T13 |
| OSC-39 | P1: Eixos da página | Tasks | Pending · T13 |
| OSC-40 | P1: Eixos da página | Tasks | Pending · T13 |
| OSC-41 | P1: Eixos da página | Tasks | Pending · T12 |
| OSC-42 | P1: Eixos da página | Tasks | Pending · T12 |
| OSC-43 | P1: Eixos da página | Tasks | Pending · T12 |
| OSC-44 | P1: Eixos da página | Tasks | Pending · T12 |
| OSC-45 | P1: Eixos da página | Tasks | Pending · T12 |
| OSC-46 | P1: Eixos da página | Tasks | Pending · T13 |

**Coverage:** 46 total, 46 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Anúncio `on_order` mostra **Sob consulta** no card, na página e na barra fixa, com `price` e `listPrice` só no JSON
- [ ] **Todos** não lista `on_order`; **Encomendar** lista a variante mesmo quando a combinação já está em estoque ou a caminho
- [ ] Nenhum `product.json` publicado nem o catálogo gerado contém `unmissableOffer`
- [ ] A fileira de ofertas quebra linha, usa o texto do JSON e não cobre a foto
- [ ] O preço ou **Sob consulta** vem antes dos eixos abaixo de 920px e a partir de 920px
- [ ] O schema rejeita hex inválido, texto vazio, `presentation` fora de `image` e `text`, e `unmissableOffer`; o prebuild falha com ícone Lucide desconhecido
