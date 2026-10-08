# Vitrine de relógios Specification

## Problem Statement

Quem compra no WhatsApp precisa ver os relógios no celular, com foto e preço, e chamar o vendedor certo. Hoje o catálogo está num Markdown e num PDF. Cada vendedor precisa de um link próprio, gerado a partir de um YAML, sem pagamento, conta ou painel.

## Goals

- [ ] A raiz lista os vendedores, a vitrine lista os relógios e o detalhe abre o WhatsApp com o nome do modelo.
- [ ] O mesmo HTML funciona no celular e no computador, no claro e no escuro, na raiz do domínio e num projeto do GitHub Pages.
- [ ] Um YAML inválido não substitui o `site/` já publicado.
- [ ] Os três relógios de `catalogo.md` passam a viver só no YAML do primeiro vendedor.
- [ ] A foto lidera o card e o carrossel, num quadro quadrado estável, e a página funciona inteira pelo teclado, no celular e no escuro.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Pagamento, frete, carrinho, conta e painel | O desenho limita o site a vitrine e WhatsApp. |
| Estado de vendido | O relógio sai quando o bloco é apagado do YAML e o site é gerado de novo. |
| PDF | O PDF atual sai do repositório depois que o YAML existe. |
| Busca e sacola na barra | A barra preta só leva à raiz. |
| Vínculo entre o mesmo relógio em vendedores diferentes | Itens iguais são blocos copiados. |
| Nova paleta, novas fontes, gradiente, GSAP e sombra de card | O sistema visual do `DESIGN.md` já está fixado. |
| Migração para React | O site publicado continua HTML, CSS e JavaScript, gerado em Python. |
| Mudar colunas da grade, textos literais existentes, alvos mínimos de 44px ou links relativos | O plano de interface mantém esses quatro contratos. |
| Reordenar o HTML da página do relógio | A ordem da página do relógio continua a do critério 16 da navegação. |
| Campo novo no YAML, recorte ou regravação do arquivo de imagem, pacote novo para ler a imagem | A largura e a altura saem do cabeçalho, em Python puro. |
| Feature paralela a `vitrine-relogios` | A emenda de interface vive nesta spec. |
| Faixa ao redor da foto, preta ou da cor do fundo | O quadro corta o excesso em vez de preencher com faixa. |

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
| Barra fixa no escuro | Fundo `rgba(39, 39, 41, 0.8)`, texto branco, `backdrop-filter: saturate(180%) blur(20px)`. O `#272729` sólido fica só no rodapé. | O plano de interface tira o sólido da barra fixa e da segunda barra. Atrás de um fundo opaco o vidro não aparece. O dono escolheu a versão translúcida. | y |
| Plano de interface contra a spec | Onde `PLANO-INTERFACE.md` e esta spec discordam, o plano vence e o critério antigo muda. | Decisão do plano. | y |
| Formato da imagem para ler o tamanho | Detectado pela assinatura dos bytes, não pela extensão. Conteúdo fora de PNG, JPEG, WebP e AVIF falha com a regra de tamanho ilegível. | O navegador também decide pelo conteúdo. A extensão já é validada por outra regra. | y |
| Tamanho em JPEG | Largura e altura do primeiro marcador SOF (`C0` a `CF`, exceto `C4`, `C8` e `CC`). Orientação da tag Exif `0x0112` no APP1. | São os marcadores que carregam o tamanho do quadro. | y |
| Tamanho em WebP | `VP8 `: 14 bits de largura e altura do quadro-chave. `VP8L`: 14 bits mais 1. `VP8X`: 24 bits mais 1 da tela. Orientação só do bloco `EXIF` de um `VP8X`. | O formato só admite metadados no `VP8X`. | y |
| Tamanho em AVIF | `ispe` associado ao item primário (`pitm`) pelo `ipma`. Orientação pelo `irot` do mesmo item: ângulo 1 ou 3 troca largura e altura. `imir` sozinho não troca. | AVIF não usa Exif para girar. `imir` espelha sem girar. | y |
| Orientação Exif | Valores 5, 6, 7 e 8 trocam largura e altura. Valores 1 a 4 e a ausência mantêm. | 5 e 7 são as espelhadas que giram. 2, 3 e 4 espelham ou giram 180°. | y |
| Carregar na hora | O primeiro card da vitrine e a primeira foto do carrossel não têm atributo `loading`. | O padrão do navegador é carregar na hora. | y |
| Texto secundário | `.parcelamento` e o `dt` da ficha. São os dois elementos que usavam `#7a7a7a`. | O plano não nomeia os elementos. | y |
| Títulos com `text-wrap: balance` | `h1`, `.nome-vendedor` e o nome no card. | São os títulos que aparecem nas três páginas. | y |
| Nome acessível do controle de tema | `aria-label` no botão. O texto visível continua `Escuro` ou `Claro`. | O nome contém a palavra visível, então o rótulo continua dentro do nome. | y |
| `viewport` | `<meta name="viewport" content="width=device-width, initial-scale=1">`. | É o valor que faz o aparelho usar a largura real. | y |
| Link de pular | Primeiro filho do `body`, `href="#conteudo"`. Fora do foco fica fixo e fora da tela. | Primeiro na ordem de tabulação, sem empurrar o layout. | y |
| Pilha sticky e `scroll-padding` | 44px no topo sem segunda barra, 96px com segunda barra (44 da barra preta e 52 da segunda), 64px embaixo com barra fixa. | São as alturas declaradas no CSS atual. | y |
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
29. The carousel photo SHALL span the content width inside a square frame (`aspect-ratio: 1 / 1`), fill it with `object-fit: cover` and `object-position: center`, and have no rounded corner.
30. The card photo SHALL fill a square frame (`aspect-ratio: 1 / 1`, full card width) with `object-fit: cover` and `object-position: center`, use an 8px corner radius, and sit inside a card that keeps an 18px corner radius.
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
12. WHILE `data-tema` is `escuro` the footer SHALL use a solid `#272729` background with white text.
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

### P1: Ler e navegar no celular e pelo teclado

**User Story**: As a buyer on a phone or using a keyboard, I want the page at my real screen width, a way to skip the bars, and visible focus on every control so that I can reach the price and the photos without zooming or getting lost.

**Why P1**: Sem `viewport` o celular não mostra o layout de 320px. Sem foco visível e bolinhas acionáveis, o carrossel não funciona pelo teclado.

**Acceptance Criteria**:

1. Every page SHALL declare `<meta name="viewport" content="width=device-width, initial-scale=1">` inside `<head>`.
2. Every page SHALL have, as the first child of `<body>`, a link with the exact text `Pular para o conteúdo` and `href="#conteudo"`.
3. Every page SHALL give `<main>` the attributes `id="conteudo"` and `tabindex="-1"`.
4. WHILE the skip link does not have focus, the skip link SHALL use `position: fixed` and sit outside the viewport.
5. WHILE the skip link has focus, the skip link SHALL show at the top-left corner with background `#0066cc`, text `#ffffff`, corner radius `9999px`, and a `z-index` above the black bar.
6. WHILE the page has no second bar, `html` SHALL use `scroll-padding-top: 44px`.
7. WHILE the page has a second bar, `html` SHALL use `scroll-padding-top: 96px`.
8. WHILE the page has the fixed bar, `html` SHALL use `scroll-padding-bottom: 64px`.
9. WHEN the skip link, a carousel dot, or a carousel arrow receives `:focus-visible` THEN it SHALL show `outline: 2px solid #0071e3` with `outline-offset: 2px`.
10. WHERE an item has two or more images, each carousel dot SHALL be a `<button type="button">` whose accessible name is `Foto ` plus its 1-based position.
11. Each carousel dot button SHALL be at least 44px wide and 44px tall, draw an 8px circle, and sit 8px from the next dot.
12. WHEN a carousel dot is activated THEN the carousel SHALL show the image at that position and SHALL set `aria-current="true"` on that dot only.
13. WHILE `data-tema` is `claro`, `.parcelamento` and the ficha `dt` SHALL use `#333333`.
14. The stylesheet SHALL NOT use `#7a7a7a`.
15. WHILE `data-tema` is `claro` the theme control SHALL have the accessible name `Modo claro. Mudar para escuro.`
16. WHILE `data-tema` is `escuro` the theme control SHALL have the accessible name `Modo escuro. Mudar para claro.`
17. WHEN the theme control is activated THEN its accessible name SHALL switch to the name of the new mode.

**Independent Test**: Gerar o catálogo de exemplo, ler `viewport`, o link de pular e o `main` no HTML. Acionar a segunda bolinha no harness do carrossel e ler a foto visível e `aria-current`. Alternar o tema no harness e ler o `aria-label`.

---

### P1: Tema escuro completo

**User Story**: As a buyer in dark mode, I want every bar, border, and control to stay visible so that the page does not lose its structure at night.

**Why P1**: Hoje a segunda barra perde o vidro, as linhas somem e o botão de tema desaparece na barra preta.

**Acceptance Criteria**:

1. WHILE `data-tema` is `escuro`, `html` SHALL set `color-scheme: dark`.
2. WHILE `data-tema` is `escuro` the second bar SHALL use background `rgba(39, 39, 41, 0.8)` and `backdrop-filter: saturate(180%) blur(20px)`.
3. WHILE `data-tema` is `escuro` the fixed bar SHALL use background `rgba(39, 39, 41, 0.8)` and `backdrop-filter: saturate(180%) blur(20px)`.
4. WHILE `data-tema` is `escuro` the card border, the ficha row lines, and the vendor list separator SHALL use `rgba(255, 255, 255, 0.16)`.
5. The theme control SHALL keep background `#1d1d1f` and SHALL have a border `1px solid rgba(255, 255, 255, 0.16)`.

**Independent Test**: Ler os seletores `html[data-tema="escuro"]` do CSS e o bloco de `#controle-tema`.

---

### P1: Foto no quadro e com tamanho declarado

**User Story**: As a buyer, I want every photo in a stable square frame that loads in the right order so that the page does not jump when photos load or change.

**Why P1**: A altura do carrossel acompanha cada arquivo e as fotos não reservam espaço antes de carregar.

**Acceptance Criteria**:

1. WHEN the visitor moves to another carousel image THEN the carousel height SHALL stay the same, because every carousel image uses the same square frame.
2. Each published `<img>` SHALL carry `width` and `height` attributes equal to the pixel width and height read from that file's header.
3. The generator SHALL read width and height from PNG, JPEG, WebP, and AVIF headers using only the Python standard library.
4. WHEN a JPEG or WebP has Exif orientation 5, 6, 7, or 8, or an AVIF primary item has `irot` angle 1 or 3, THEN the generator SHALL swap the header width and height.
5. WHEN a JPEG or WebP has Exif orientation 1, 2, 3, or 4 or none, or an AVIF primary item has `irot` angle 0 or 2 or none, THEN the generator SHALL keep the header width and height.
6. IF an image's width or height is missing, unreadable, zero, or negative THEN the generator SHALL leave any previous `site/` unchanged, exit non-zero, and write exactly `<pasta>: não foi possível ler a largura e a altura da imagem` to stderr, with no file name.
7. The first card of a vitrine and the first carousel image SHALL have no `loading` attribute.
8. Every card image after the first and every carousel image after the first SHALL have `loading="lazy"`.

**Independent Test**: Gerar um catálogo com um PNG 400×300, um JPEG com orientação 6, um WebP e um AVIF mínimos, e ler `width`, `height` e `loading` no HTML. Trocar um arquivo por bytes ilegíveis e ver a mensagem e o `site/` anterior intacto.

---

### P2: Movimento e tipografia

**User Story**: As a buyer, I want prices that line up, titles that wrap evenly, and no zoom animation when I asked for reduced motion so that the page reads calmly.

**Why P2**: Acabamento. O fluxo de compra funciona sem ele.

**Acceptance Criteria**:

1. WHILE `prefers-reduced-motion: reduce` matches, the `:active` state of the theme control, the interest pill, and the carousel arrows SHALL use `transform: none`.
2. Every price element (`.preco`) SHALL use `font-variant-numeric: tabular-nums`.
3. `h1`, `.nome-vendedor`, and the card name SHALL use `text-wrap: balance`.
4. The card name SHALL use `overflow-wrap: anywhere`.
5. The vitrine grid SHALL define every column as `minmax(0, 1fr)` at every breakpoint, including the single column.

**Independent Test**: Ler os blocos do CSS. Um nome de uma palavra só com 80 letras quebra dentro do card.

---

## Edge Cases

As falhas de geração estão nos critérios 4 a 16 da primeira história. Cada uma deixa o `site/` anterior como estava.

- IF a imagem cita `../outro.png` THEN the generator SHALL reject it as a name with a slash.
- IF `observacoes` é só espaços THEN the watch page SHALL omit it.
- IF dois vendedores repetem o mesmo `id` THEN the generator SHALL publish both.
- IF um PNG termina antes do `IHDR` THEN the generator SHALL fail with `não foi possível ler a largura e a altura da imagem`.
- IF um arquivo `.png` contém bytes de JPEG THEN the generator SHALL read the JPEG size.
- IF o arquivo tem extensão aceita mas o conteúdo não é PNG, JPEG, WebP nem AVIF THEN the generator SHALL fail with `não foi possível ler a largura e a altura da imagem`.
- WHEN a foto já é 1:1 THEN the frame SHALL show it whole, because `cover` has nothing to cut.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| VITR-01 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-02 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-03 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-04 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-05 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-06 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-07 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-08 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-09 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-10 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-11 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-12 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-13 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-14 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-15 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-16 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-17 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-18 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-19 | P1: Gerar o site | Tasks | ✅ Verified |
| VITR-20 | P1: Navegar | Tasks | ✅ Verified |
| VITR-21 | P1: Navegar | Tasks | ✅ Verified |
| VITR-22 | P1: Navegar | Tasks | ✅ Verified |
| VITR-23 | P1: Navegar | Tasks | ✅ Verified |
| VITR-24 | P1: Navegar | Tasks | ✅ Verified |
| VITR-25 | P1: Navegar | Tasks | ✅ Verified |
| VITR-26 | P1: Navegar | Tasks | ✅ Verified |
| VITR-27 | P1: Navegar | Tasks | ✅ Verified |
| VITR-28 | P1: Navegar | Tasks | ✅ Verified |
| VITR-29 | P1: Navegar | Tasks | ✅ Verified |
| VITR-30 | P1: Navegar | Tasks | ✅ Verified |
| VITR-31 | P1: Navegar | Tasks | ✅ Verified |
| VITR-32 | P1: Navegar | Tasks | ✅ Verified |
| VITR-33 | P1: Navegar | Tasks | ✅ Verified |
| VITR-34 | P1: Navegar | Tasks | ✅ Verified |
| VITR-35 | P1: Navegar | Tasks | ✅ Verified |
| VITR-36 | P1: Navegar | Tasks | ✅ Verified |
| VITR-37 | P1: Navegar | Tasks | ✅ Verified |
| VITR-38 | P1: Navegar | Tasks | ✅ Verified |
| VITR-39 | P1: Navegar | Tasks | ✅ Verified |
| VITR-40 | P1: Navegar | Tasks | ✅ Verified |
| VITR-41 | P1: Navegar | Tasks | ✅ Verified |
| VITR-42 | P1: Navegar | Tasks | ✅ Verified |
| VITR-43 | P1: Navegar | Tasks | ✅ Verified |
| VITR-44 | P1: Navegar | Tasks | ✅ Verified |
| VITR-45 | P1: Navegar | Tasks | ✅ Verified |
| VITR-46 | P1: Navegar | Tasks | ✅ Verified |
| VITR-47 | P1: Navegar | Tasks | ✅ Verified |
| VITR-48 | P1: Navegar | Tasks | Pending |
| VITR-49 | P1: Navegar | Tasks | Pending |
| VITR-50 | P1: Navegar | Tasks | ✅ Verified |
| VITR-51 | P1: Navegar | Tasks | ✅ Verified |
| VITR-52 | P1: Navegar | Tasks | ✅ Verified |
| VITR-53 | P1: Tema | Tasks | ✅ Verified |
| VITR-54 | P1: Tema | Tasks | ✅ Verified |
| VITR-55 | P1: Tema | Tasks | ✅ Verified |
| VITR-56 | P1: Tema | Tasks | ✅ Verified |
| VITR-57 | P1: Tema | Tasks | ✅ Verified |
| VITR-58 | P1: Tema | Tasks | ✅ Verified |
| VITR-59 | P1: Tema | Tasks | ✅ Verified |
| VITR-60 | P1: Tema | Tasks | ✅ Verified |
| VITR-61 | P1: Tema | Tasks | ✅ Verified |
| VITR-62 | P1: Tema | Tasks | ✅ Verified |
| VITR-63 | P1: Tema | Tasks | ✅ Verified |
| VITR-64 | P1: Tema | Tasks | Pending |
| VITR-65 | P1: Tema | Tasks | ✅ Verified |
| VITR-66 | P1: Tema | Tasks | ✅ Verified |
| VITR-67 | P1: Tema | Tasks | ✅ Verified |
| VITR-68 | P1: Publicar o catálogo atual | Tasks | ✅ Verified |
| VITR-69 | P1: Publicar o catálogo atual | Tasks | ✅ Verified |
| VITR-70 | P1: Publicar o catálogo atual | Tasks | ✅ Verified |
| VITR-71 | P1: Publicar o catálogo atual | Tasks | ✅ Verified |
| VITR-72 | P1: Publicar o catálogo atual | Tasks | ✅ Verified |
| VITR-73 | P1: Publicar o catálogo atual | Tasks | ✅ Verified |
| VITR-74 | P1: Ler e navegar | Tasks | Pending |
| VITR-75 | P1: Ler e navegar | Tasks | Pending |
| VITR-76 | P1: Ler e navegar | Tasks | Pending |
| VITR-77 | P1: Ler e navegar | Tasks | Pending |
| VITR-78 | P1: Ler e navegar | Tasks | Pending |
| VITR-79 | P1: Ler e navegar | Tasks | Pending |
| VITR-80 | P1: Ler e navegar | Tasks | Pending |
| VITR-81 | P1: Ler e navegar | Tasks | Pending |
| VITR-82 | P1: Ler e navegar | Tasks | Pending |
| VITR-83 | P1: Ler e navegar | Tasks | Pending |
| VITR-84 | P1: Ler e navegar | Tasks | Pending |
| VITR-85 | P1: Ler e navegar | Tasks | Pending |
| VITR-86 | P1: Ler e navegar | Tasks | Pending |
| VITR-87 | P1: Ler e navegar | Tasks | Pending |
| VITR-88 | P1: Ler e navegar | Tasks | Pending |
| VITR-89 | P1: Ler e navegar | Tasks | Pending |
| VITR-90 | P1: Ler e navegar | Tasks | Pending |
| VITR-91 | P1: Tema escuro completo | Tasks | Pending |
| VITR-92 | P1: Tema escuro completo | Tasks | Pending |
| VITR-93 | P1: Tema escuro completo | Tasks | Pending |
| VITR-94 | P1: Tema escuro completo | Tasks | Pending |
| VITR-95 | P1: Tema escuro completo | Tasks | Pending |
| VITR-96 | P1: Foto no quadro | Tasks | Pending |
| VITR-97 | P1: Foto no quadro | Tasks | Pending |
| VITR-98 | P1: Foto no quadro | T15–T17 | Pending |
| VITR-99 | P1: Foto no quadro | T15–T17 | Pending |
| VITR-100 | P1: Foto no quadro | T15–T17 | Pending |
| VITR-101 | P1: Foto no quadro | Tasks | Pending |
| VITR-102 | P1: Foto no quadro | Tasks | Pending |
| VITR-103 | P1: Foto no quadro | Tasks | Pending |
| VITR-104 | P2: Movimento e tipografia | Tasks | Pending |
| VITR-105 | P2: Movimento e tipografia | Tasks | Pending |
| VITR-106 | P2: Movimento e tipografia | Tasks | Pending |
| VITR-107 | P2: Movimento e tipografia | Tasks | Pending |
| VITR-108 | P2: Movimento e tipografia | Tasks | Pending |

**Coverage:** 108 total, 108 mapped to tasks in `.specs/features/vitrine-relogios/tasks.md`, 0 unmapped. VITR-48, VITR-49, VITR-64 e VITR-74 a VITR-108 estão em T15 a T28.

VITR-01 a VITR-19 seguem a ordem dos critérios da geração. VITR-20 a VITR-52 seguem a ordem dos critérios da navegação. VITR-53 a VITR-67 seguem a ordem dos critérios do tema. VITR-68 a VITR-73 seguem a ordem dos critérios do catálogo atual. VITR-74 a VITR-90 seguem a ordem dos critérios de leitura e teclado. VITR-91 a VITR-95 seguem a ordem dos critérios do tema escuro completo. VITR-96 a VITR-103 seguem a ordem dos critérios da foto no quadro. VITR-104 a VITR-108 seguem a ordem dos critérios de movimento e tipografia.

---

## Success Criteria

- [ ] No celular e no computador, no claro e no escuro, a pessoa abre a raiz, entra na vitrine, abre o relógio, volta pelo nome do vendedor, volta de novo por Voltar, passa o carrossel e vê o WhatsApp com o nome do modelo.
- [ ] Trocar o tema, recarregar e encontrar a mesma escolha.
- [ ] Cada falha de YAML listada na primeira história recusa a geração e preserva o `site/` anterior.
- [ ] Os testes automáticos usam o catálogo de exemplo, não o YAML real.
- [ ] Só pelo teclado, a pessoa pula as barras, passa as fotos pelas setas e pelas bolinhas e vê o foco em cada controle.
- [ ] Trocar de foto no carrossel não move o preço nem a ficha.
- [ ] Uma imagem com cabeçalho ilegível recusa a geração e preserva o `site/` anterior.
