# Vitrine de relógios Specification

## Problem Statement

Quem compra no WhatsApp precisa ver os relógios no celular, com foto e preço, e chamar o vendedor certo. Hoje o catálogo está num Markdown e num PDF. Cada vendedor precisa de um link próprio, gerado a partir de um YAML, sem pagamento, conta ou painel.

## Goals

- [ ] A raiz lista os vendedores, a vitrine lista os relógios e o detalhe abre o WhatsApp com o nome do modelo.
- [ ] O mesmo HTML funciona no celular e no computador, no claro e no escuro, na raiz do domínio e num projeto do GitHub Pages.
- [ ] Um YAML inválido não substitui o `site/` já publicado.
- [ ] Os três relógios de `catalogo.md` passam a viver só no YAML do primeiro vendedor.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Pagamento, frete, carrinho, conta e painel | O desenho limita o site a vitrine e WhatsApp. |
| Estado de vendido | O relógio sai quando o bloco é apagado do YAML e o site é gerado de novo. |
| PDF | O PDF atual sai do repositório depois que o YAML existe. |
| Busca e sacola na barra | A barra preta só leva à raiz. |
| Vínculo entre o mesmo relógio em vendedores diferentes | Itens iguais são blocos copiados. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Identidade do primeiro vendedor (pasta, nome exibido, WhatsApp) | Pasta `alexandre`, nome `Alexandre`, WhatsApp `5511999999999`. Dados fictícios até o dono trocar. | O dono pediu para seguir com dados fictícios e ajustar depois. Os três valores são os do exemplo no desenho. | y |
| Ordem alfabética | Ordenar por `nome.casefold()` do Unicode. Empate desempata pelo nome da pasta. Acentos não são removidos. | O desenho pede A a Z ignorando maiúsculas e não fala em desempate nem em acento. | y |
| Endereço da pasta e do `id` | Casar `^[a-z0-9]+(-[a-z0-9]+)*$`. | O desenho permite só minúsculas, números e hífen. A regex evita hífen nas pontas e hífen duplo. | y |
| Nome de arquivo de imagem | Um único segmento, sem barra. Extensão png, jpg, jpeg, webp ou avif, em qualquer caixa. | Impede caminho fora da pasta do vendedor. | y |
| `parcelamento` | Só o tipo inteiro do YAML, maior ou igual a 1. `12.0` falha. | O desenho pede um inteiro. | y |
| `observacoes` em branco | Ausente, vazio ou só espaços não aparece e não quebra a geração. | O desenho trata ausente e em branco como a mesma omissão. | y |
| Rótulo de ficha repetido ou valor vazio | A geração falha. | Uma linha válida tem `detalhe` e `especificacao` preenchidos, e o rótulo aparece uma vez. | y |
| Ordem da ficha na página | A ordem fixa dos 13 rótulos, não a ordem do YAML. Rótulo ausente some. | O desenho fixa a ordem de exibição e manda omitir a linha que faltar. | y |
| Link de anúncio similar | O valor, depois de cortar espaços, é link só se casar `^https?://\S+$`. | Os anúncios reais usam `https` com query. Qualquer outro texto permanece texto. | y |
| Preço | Sempre duas casas, vírgula decimal, ponto de milhar, prefixo `R$ ` e sufixo ` no Pix`. | `369.9` vira `R$ 369,90 no Pix`. O desenho também pede o ponto de milhar. | y |
| Prévia do WhatsApp | `og:title` é o nome do modelo. `og:image` é uma URL relativa que resolve para a primeira foto. | O desenho exige links relativos, sem um domínio canônico. | y |
| Tema gravado | `localStorage` com a chave `tema` e os valores `claro` ou `escuro`. Um script no início do `<head>` aplica `data-tema` em `<html>` antes da pintura. | O desenho pede memória da escolha e aplicação antes de desenhar, sem nomear a chave. | y |
| Grade da vitrine | ≤640px: 1 coluna. 641–834px: 2. 835–1068px: 3. 1069–1440px: 4. ≥1441px: 5. | É a cascata de utility grid do `DESIGN.md`: 1 coluna em 640px, 2 em 834px, 3 em 1068px, 4 em 1440px e 5 acima. | y |
| Barra fixa no escuro | Fundo `#272729`, texto branco, e o vidro fosco continua. | O desenho pede as duas coisas na mesma faixa. | y |
| Inter | Arquivos de fonte dentro de `site/`, sem CDN. | A página é estática e o desenho pede Inter fora da Apple. | y |
| Mensagem de falha | Saída não zero. O stderr cita a pasta do vendedor e a regra violada. | Sem isso a falha não é diagnosticável. Não há métrica nem rastreio. | y |
| Concorrência | N/A: um processo local por vez. Sem trava. | Não há gerador paralelo neste escopo. | y |
| Autenticação e limite de taxa | N/A: HTML público, sem conta. | Fora do desenho. | y |
| Rede na geração | N/A: o script não chama serviço externo. | A fonte é o YAML local. | y |
| Vida do dado | N/A além de apagar o bloco e gerar de novo. Sem expiração. | O desenho recusou estado de vendido. | y |

**Open questions:** none

---

## User Stories

### P1: Gerar o site a partir do YAML ⭐ MVP

**User Story**: As a seller, I want a folder of YAML and photos to become a static site so that I can publish a catalog by regenerating files.

**Why P1**: Sem a geração não há link para enviar.

**Acceptance Criteria**:

1. The generator SHALL read every `vendedores/<pasta>/vendedor.yaml` and write only inside `site/`.
2. WHEN the vendor folder is `alexandre` and an item id is `addiesdive-my-h3-2qz` THEN the generator SHALL write `site/index.html`, `site/alexandre/index.html`, `site/alexandre/addiesdive-my-h3-2qz/index.html`, and `site/alexandre/imagens/<arquivo>` for each listed image.
3. The generator SHALL accept a vendor folder name and an item `id` only when each matches `^[a-z0-9]+(-[a-z0-9]+)*$`.
4. IF a vendor folder name or an item `id` fails that pattern THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
5. The generator SHALL require `nome` and `whatsapp` on the vendor, and `id`, `nome`, `valorPix`, `parcelamento`, `imagens`, and `ficha` on each item.
6. IF `nome` or `whatsapp` is missing, `whatsapp` has a non-digit, or `whatsapp` has fewer than 12 or more than 15 digits THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
7. IF `valorPix` is not a number greater than zero THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
8. IF `parcelamento` is not a YAML integer greater than or equal to 1 THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
9. IF an item has no image, an image name with a slash, a missing file in that vendor folder, or an extension other than png, jpg, jpeg, webp, or avif in any letter case THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
10. IF `ficha` is empty, a row lacks `detalhe` or `especificacao`, a value is blank, or the same `detalhe` repeats THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
11. IF the same item `id` appears twice under one vendor THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
12. IF a vendor, item, or ficha object contains a key outside `nome`, `whatsapp`, `itens`, `id`, `valorPix`, `parcelamento`, `observacoes`, `imagens`, `ficha`, `detalhe`, and `especificacao` THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
13. IF a ficha `detalhe` is not one of Homage de, Estado, Tipo do relógio, Tipo de movimento, Material da caixa, Material da pulseira, Material do vidro, Resistência à água, Tamanho da caixa, Largura da pulseira, Material do bisel, Link de anúncio similar, or Garantia THEN the generator SHALL leave any previous `site/` unchanged and exit non-zero.
14. WHEN every vendor passes THEN the generator SHALL replace `site/` with the temporary output.
15. IF `site/` did not exist and generation fails THEN the generator SHALL still not create `site/`.
16. IF validation fails THEN the generator SHALL write the vendor folder name and the violated rule to stderr.
17. WHEN the same item block is copied under two vendors THEN the generator SHALL publish both copies with no reference linking them.
18. WHERE `observacoes` is absent THEN the generator SHALL accept the item.
19. WHEN the generator runs twice on unchanged input THEN the second `site/` HTML SHALL match the first.

**Independent Test**: Gerar um catálogo de exemplo válido e ver `site/` completo. Repetir cada falha acima e ver o `site/` anterior intacto.

---

### P1: Navegar da raiz até o WhatsApp ⭐ MVP

**User Story**: As a buyer, I want to open a seller link, see each watch with its price, and start WhatsApp so that I can say which model I want.

**Why P1**: É o percurso que define sucesso no desenho.

**Acceptance Criteria**:

1. The generated HTML SHALL use relative URLs for navigation between the root, a vitrine, and a watch.
2. WHEN the root page is opened THEN the document title SHALL be exactly `Catálogo de relógios`.
3. The root page SHALL list every vendor `nome` in one column at every viewport width.
4. WHEN vendors are named `Ana` and `bruno` THEN the root SHALL list Ana before bruno.
5. WHEN a vendor has no items THEN the root SHALL still show that vendor name.
6. Each vendor name SHALL be a relative link to that vendor folder and SHALL have a touch target at least 44px tall and the full content width.
7. WHEN a vitrine is opened THEN the document title SHALL be exactly the vendor `nome`.
8. The vitrine SHALL show the vendor name and a control labeled `Voltar` that links to the site root.
9. The vitrine SHALL show items in YAML order as cards.
10. Each card SHALL be one link to that watch and SHALL show the first image, the item `nome`, and the Pix price phrase.
11. The vitrine card grid SHALL use 1 column at 640px and below, 2 columns from 641px through 834px, 3 columns from 835px through 1068px, 4 columns from 1069px through 1440px, and 5 columns at 1441px and above.
12. WHEN a vendor has no items THEN the vitrine SHALL show exactly `Esta vitrine ainda não tem relógios.`
13. The page SHALL format `valorPix` 369.9 as `R$ 369,90 no Pix` and `valorPix` 1234.5 as `R$ 1.234,50 no Pix`.
14. The page SHALL format `parcelamento` 12 as `em até 12x com acréscimo`.
15. WHEN a watch page is opened THEN the document title SHALL be exactly the item `nome`.
16. The watch page SHALL show, in this order: the vendor name linking to that vitrine, a `Voltar` control to that same vitrine, the item name, the carousel, the Pix price phrase, the installment phrase, observations when present, the ficha, and the fixed bar.
17. The fixed bar SHALL repeat the Pix price phrase and SHALL include a pill labeled `Tenho interesse`.
18. WHEN `Tenho interesse` is activated THEN the page SHALL open `https://wa.me/` plus the vendor digits, with a `text` query that decodes to `Olá, tenho interesse no ` plus the item `nome`.
19. The watch page SHALL set `og:title` to the item `nome` and `og:image` to a relative URL that resolves to the first image.
20. The ficha SHALL render in this label order, omitting any missing label: Homage de, Estado, Tipo do relógio, Tipo de movimento, Material da caixa, Material da pulseira, Material do vidro, Resistência à água, Tamanho da caixa, Largura da pulseira, Material do bisel, Link de anúncio similar, Garantia.
21. Each ficha row SHALL show the label above the value.
22. WHERE the trimmed value of Link de anúncio similar matches `^https?://\S+$` THEN the visible text SHALL be `Ver anúncio similar` and the href SHALL be that value.
23. WHERE the trimmed value of Link de anúncio similar does not match `^https?://\S+$` THEN the page SHALL show that value as text and SHALL NOT make it a link.
24. WHERE `observacoes` is absent or blank THEN the watch page SHALL omit it.
25. WHERE `observacoes` has non-blank text THEN the watch page SHALL show that text alone, with no heading.
26. WHEN an item has one image THEN the watch page SHALL show that image and SHALL omit carousel dots and arrows.
27. WHEN an item has two or more images THEN the watch page SHALL show one image at a time, a dot per image marking the current index, and previous and next controls.
28. WHEN next is used on the last image THEN the carousel SHALL show the first image.
29. The carousel photo SHALL span the content width, show the whole photo without cropping, and have no rounded corner.
30. The card photo SHALL be square, show the whole watch without cropping, and use an 18px corner radius.
31. Every page SHALL show a black bar, 44px tall, with the text `Catálogo` linking to the root, and SHALL omit search and a bag.
32. WHILE the page is the vitrine or a watch THEN the page SHALL show a second bar with the vendor name.
33. The footer SHALL contain only the line `Catálogo de relógios`.

**Independent Test**: Abrir a raiz, entrar num vendedor sem itens e noutro com dois relógios, abrir o de duas fotos e o de uma, voltar pelo nome e pelo botão, e ler o href do WhatsApp.

---

### P1: Tema, tipo e superfícies ⭐ MVP

**User Story**: As a buyer, I want the page to follow my phone's light or dark mode and remember my choice so that I can read prices without zooming.

**Why P1**: O desenho exige os dois modos e a escolha persistida.

**Acceptance Criteria**:

1. The page SHALL set font-family to `system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif` and SHALL ship the Inter files under `site/`.
2. WHEN the page loads with no stored choice and the system preference is dark THEN the page SHALL set `data-tema="escuro"` on `<html>` before first paint.
3. WHEN the page loads with no stored choice and the system preference is light THEN the page SHALL set `data-tema="claro"` on `<html>` before first paint.
4. WHILE `data-tema` is `claro` the theme control SHALL show `Escuro`.
5. WHILE `data-tema` is `escuro` the theme control SHALL show `Claro`.
6. WHEN the visitor activates the theme control THEN the page SHALL switch to the mode named by that label and store it in `localStorage` under the key `tema`.
7. WHEN the page loads with a stored `tema` THEN the page SHALL apply that value before first paint.
8. The black bar SHALL use `#000000` in both modes.
9. The interest pill SHALL use background `#0066cc` and white text.
10. WHILE `data-tema` is `claro` the footer SHALL use `#f5f5f7`.
11. WHILE `data-tema` is `escuro` the page background SHALL be `#272729`, the card `#2a2a2c`, primary text `#ffffff`, secondary text `#cccccc`, and links `#2997ff`.
12. WHILE `data-tema` is `escuro` the footer, the second bar, and the fixed bar SHALL use `#272729` with white text.
13. WHILE `data-tema` is `escuro` the fixed bar SHALL keep a frosted backdrop filter.
14. The watch photo SHALL keep its authored colors in both modes, with no dark overlay and no color inversion.
15. The page SHALL use only colors defined in `DESIGN.md`.

**Independent Test**: Carregar sem preferência salva, alternar o controle, recarregar e ler `data-tema` e a chave `tema`.

---

### P1: Publicar o catálogo atual ⭐ MVP

**User Story**: As the catalog owner, I want the three current watches in my YAML so that the link I send replaces the Markdown and the PDF.

**Why P1**: O desenho manda o YAML virar o único lugar do preço e da ficha.

**Acceptance Criteria**:

1. The repository SHALL contain `vendedores/alexandre/vendedor.yaml` with `nome` `Alexandre`, `whatsapp` `5511999999999`, and exactly these items, in this order: `addiesdive-my-h3-2qz` at `valorPix` 369.9 with images `addiesdive2.png` then `addiesdive1.png`; `curren-8455` at `valorPix` 119.9 with images `curren2.png` then `curren1.png`; `seculus-kit-com-cantil` at `valorPix` 299.9 with image `seculus1.png` and `observacoes` `acompanha caixa de metal e cantil`.
2. Each of those three items SHALL use `parcelamento` 12 and the ficha rows below, in the fixed label order.
3. WHEN that YAML exists THEN the repository SHALL NOT contain `catalogo.md`, `catalogo.pdf`, `template-produto.md`, `detalhes-do-item.md`, `PLANO.md`, or `tmp/`.
4. WHEN that YAML exists THEN the repository SHALL keep `DESIGN.md`, `2026-10-07-vitrine-relogios-design.md`, the photos named by the YAML, and the skills directories.
5. The automated tests SHALL build from a fixture with two vendors, one with zero items and one with two watches of which exactly one has `observacoes`, and SHALL NOT use the published vendor YAML as input.
6. The automated tests SHALL cover published paths, alphabetic vendor order, `R$ 369,90 no Pix`, `em até 12x com acréscimo`, fixed ficha order, `Ver anúncio similar`, the WhatsApp message, the first-image preview, carousel controls only for multiple photos, `Voltar` on the vitrine and the watch, the theme control, and each generation failure in the first story.

**Independent Test**: Ler o YAML publicado e a árvore do repositório. A suíte usa só o catálogo de exemplo.

Ficha do Addiesdive MY-H3-2QZ:

| detalhe | especificacao |
| --- | --- |
| Homage de | Rolex Submariner Date |
| Estado | Usado 2x |
| Tipo do relógio | Diver (mergulho) |
| Tipo de movimento | Quartzo (Miyota 2115) |
| Material da caixa | Aço inoxidável 316L |
| Material da pulseira | Aço inoxidável; tipo de aço não informado |
| Material do vidro | Vidro mineral convexo; também descrito como Hardlex |
| Resistência à água | 200 m (20 bar) |
| Tamanho da caixa | 41 mm de diâmetro, sem a coroa |
| Largura da pulseira | 20 mm no encaixe da caixa |
| Material do bisel | Cerâmica |
| Link de anúncio similar | https://www.mercadolivre.com.br/relogio-masculino-addiesdive-divers-200m-de-quartzo-prateado/p/MLB41177166?pdp_filters=item_id%3AMLB5686666970#polycard_client=search-desktop&float_highlight=last_units&be_origin=searchv2&overlay_label=not_apply&search_layout=grid&position=4&type=product&tracking_id=fca32ea7-69b6-4cdf-8831-c1210957c2ef&wid=MLB5686666970&sid=search |
| Garantia | 90 dias |

Ficha do CURREN 8455:

| detalhe | especificacao |
| --- | --- |
| Homage de | Não informado |
| Estado | Novo |
| Tipo do relógio | Esportivo/casual, com tema de bússola |
| Tipo de movimento | Quartzo |
| Material da caixa | Liga metálica |
| Material da pulseira | Aço inoxidável |
| Material do vidro | Hardlex |
| Resistência à água | 30 m (3 bar) |
| Tamanho da caixa | Diâmetro informado como faixa de 40 a 44 mm |
| Largura da pulseira | Faixa informada de 20 a 24 mm |
| Material do bisel | Não informado |
| Link de anúncio similar | https://www.mercadolivre.com.br/relogio-masculino-de-pulso-analogico-curren-modelo-8455-luxo-prateado/p/MLB74702510?product_trigger_id=MLB55161518&pdp_filters=item_id%3AMLB7070370018&applied_product_filters=MLB74702510&picker=true&quantity=1 |
| Garantia | 90 dias |

Ficha do Seculus — kit com cantil:

| detalhe | especificacao |
| --- | --- |
| Homage de | Não informado |
| Estado | Usado 2x |
| Tipo do relógio | Casual |
| Tipo de movimento | Não informado |
| Material da caixa | Aço; tipo não informado |
| Material da pulseira | Aço; tipo não informado |
| Material do vidro | Cristal mineral |
| Resistência à água | 50 m (5 ATM) |
| Tamanho da caixa | 45 mm |
| Largura da pulseira | Não informada |
| Material do bisel | Não informado |
| Link de anúncio similar | Não informado |
| Garantia | 1 ano e 10 meses |

---

## Edge Cases

As falhas de geração estão nos critérios 4 a 16 da primeira história. Cada uma deixa o `site/` anterior como estava.

- IF a imagem cita `../outro.png` THEN the generator SHALL reject it as a name with a slash.
- IF `observacoes` é só espaços THEN the watch page SHALL omit it.
- IF dois vendedores repetem o mesmo `id` THEN the generator SHALL publish both.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| VITR-01 | P1: Gerar o site | Tasks | done |
| VITR-02 | P1: Gerar o site | Tasks | done |
| VITR-03 | P1: Gerar o site | Tasks | Implementing |
| VITR-04 | P1: Gerar o site | Tasks | Implementing |
| VITR-05 | P1: Gerar o site | Tasks | Implementing |
| VITR-06 | P1: Gerar o site | Tasks | Implementing |
| VITR-07 | P1: Gerar o site | Tasks | Implementing |
| VITR-08 | P1: Gerar o site | Tasks | Implementing |
| VITR-09 | P1: Gerar o site | Tasks | Implementing |
| VITR-10 | P1: Gerar o site | Tasks | Implementing |
| VITR-11 | P1: Gerar o site | Tasks | Implementing |
| VITR-12 | P1: Gerar o site | Tasks | Implementing |
| VITR-13 | P1: Gerar o site | Tasks | Implementing |
| VITR-14 | P1: Gerar o site | Tasks | done |
| VITR-15 | P1: Gerar o site | Tasks | done |
| VITR-16 | P1: Gerar o site | Tasks | done |
| VITR-17 | P1: Gerar o site | Tasks | Implementing |
| VITR-18 | P1: Gerar o site | Tasks | Implementing |
| VITR-19 | P1: Gerar o site | Tasks | done |
| VITR-20 | P1: Navegar | Tasks | Implementing |
| VITR-21 | P1: Navegar | Tasks | Implementing |
| VITR-22 | P1: Navegar | Tasks | Implementing |
| VITR-23 | P1: Navegar | Tasks | Implementing |
| VITR-24 | P1: Navegar | Tasks | Implementing |
| VITR-25 | P1: Navegar | Tasks | Implementing |
| VITR-26 | P1: Navegar | Tasks | Implementing |
| VITR-27 | P1: Navegar | Tasks | Implementing |
| VITR-28 | P1: Navegar | Tasks | Implementing |
| VITR-29 | P1: Navegar | Tasks | Implementing |
| VITR-30 | P1: Navegar | Tasks | Implementing |
| VITR-31 | P1: Navegar | Tasks | Implementing |
| VITR-32 | P1: Navegar | Tasks | Implementing |
| VITR-33 | P1: Navegar | Tasks | Implementing |
| VITR-34 | P1: Navegar | Tasks | Implementing |
| VITR-35 | P1: Navegar | Tasks | Implementing |
| VITR-36 | P1: Navegar | Tasks | Implementing |
| VITR-37 | P1: Navegar | Tasks | Implementing |
| VITR-38 | P1: Navegar | Tasks | Implementing |
| VITR-39 | P1: Navegar | Tasks | Implementing |
| VITR-40 | P1: Navegar | Tasks | Implementing |
| VITR-41 | P1: Navegar | Tasks | Implementing |
| VITR-42 | P1: Navegar | Tasks | Implementing |
| VITR-43 | P1: Navegar | Tasks | Implementing |
| VITR-44 | P1: Navegar | Tasks | Implementing |
| VITR-45 | P1: Navegar | Tasks | Implementing |
| VITR-46 | P1: Navegar | Tasks | done |
| VITR-47 | P1: Navegar | Tasks | done |
| VITR-48 | P1: Navegar | Tasks | Implementing |
| VITR-49 | P1: Navegar | Tasks | Implementing |
| VITR-50 | P1: Navegar | Tasks | Implementing |
| VITR-51 | P1: Navegar | Tasks | Implementing |
| VITR-52 | P1: Navegar | Tasks | Implementing |
| VITR-53 | P1: Tema | Tasks | done |
| VITR-54 | P1: Tema | Tasks | done |
| VITR-55 | P1: Tema | Tasks | Implementing |
| VITR-56 | P1: Tema | Tasks | Implementing |
| VITR-57 | P1: Tema | Tasks | Implementing |
| VITR-58 | P1: Tema | Tasks | Implementing |
| VITR-59 | P1: Tema | Tasks | Implementing |
| VITR-60 | P1: Tema | Tasks | Implementing |
| VITR-61 | P1: Tema | Tasks | Implementing |
| VITR-62 | P1: Tema | Tasks | Implementing |
| VITR-63 | P1: Tema | Tasks | Implementing |
| VITR-64 | P1: Tema | Tasks | Implementing |
| VITR-65 | P1: Tema | Tasks | Implementing |
| VITR-66 | P1: Tema | Tasks | Implementing |
| VITR-67 | P1: Tema | Tasks | Implementing |
| VITR-68 | P1: Publicar o catálogo atual | Tasks | done |
| VITR-69 | P1: Publicar o catálogo atual | Tasks | done |
| VITR-70 | P1: Publicar o catálogo atual | Tasks | done |
| VITR-71 | P1: Publicar o catálogo atual | Tasks | done |
| VITR-72 | P1: Publicar o catálogo atual | Tasks | Implementing |
| VITR-73 | P1: Publicar o catálogo atual | Tasks | Implementing |

**Coverage:** 73 total, 73 mapped to tasks in `.specs/features/vitrine-relogios/tasks.md`, 0 unmapped.

VITR-01 a VITR-19 seguem a ordem dos critérios da geração. VITR-20 a VITR-52 seguem a ordem dos critérios da navegação. VITR-53 a VITR-67 seguem a ordem dos critérios do tema. VITR-68 a VITR-73 seguem a ordem dos critérios do catálogo atual.

---

## Success Criteria

- [ ] No celular e no computador, no claro e no escuro, a pessoa abre a raiz, entra na vitrine, abre o relógio, volta pelo nome do vendedor, volta de novo por Voltar, passa o carrossel e vê o WhatsApp com o nome do modelo.
- [ ] Trocar o tema, recarregar e encontrar a mesma escolha.
- [ ] Cada falha de YAML listada na primeira história recusa a geração e preserva o `site/` anterior.
- [ ] Os testes automáticos usam o catálogo de exemplo, não o YAML real.
