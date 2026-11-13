# Contrato de relógio

Formato de um `product.json`. `ProductSchema`, em `@catalogo/shared`, aplica estas regras quando o objeto é validado, inclusive no cadastro pela skill `product-register`.

O carregador do Vite, no desenvolvimento e no build, não chama o schema. Ele exige que cada arquivo citado em `images` exista em `img/` e que cada `icon` de oferta seja um export do Lucide com import dinâmico. Um produto que fuja do restante da lista ainda pode ser lido por esse carregador.

A página mostra as características na ordem em que estão no `product.json`.

## Produto

| Campo | Quando usar | Efeito |
| --- | --- | --- |
| `slug` | sempre | Minúsculas, hífens, igual ao nome da pasta |
| `title` | sempre | Título do produto. Na ficha, os valores dos eixos são acrescentados depois |
| `axes` | sempre | Sem seletor, `axes: []` |
| `listings` | sempre | Pelo menos um anúncio |
| `description` | opcional | Texto do produto |
| `audience` | opcional | `male`, `female`, `unisex` ou `child`. Não aparece na página |
| `specifications` | opcional | Características compartilhadas |

`slug`, id de anúncio, id de eixo e id de valor usam só letras minúsculas, números e hífens. Não começam nem terminam com hífen.

## Anúncio

| Campo | Quando usar | Efeito |
| --- | --- | --- |
| `id` | sempre | Identidade do anúncio na URL `/product/:slug/:listingId` |
| `state` | sempre | `new`, `openbox`, `used` ou `defective` |
| `availabilityStatus` | sempre | `available`, `coming_soon` ou `on_order` |
| `images` | sempre | Pelo menos um arquivo em `img/` |
| `variants` | sempre | Pelo menos uma variante |
| `enabled` | opcional | `false` esconde o anúncio |
| `specifications` | opcional | Características só desse anúncio |

Sob encomenda usa `state: "new"`. O preço da variante pode existir ou faltar. `orderable: false` só faz sentido em sob encomenda.

Cada nome em `images` é só o arquivo, sem pasta. Extensões: jpg, jpeg, png, webp e avif. A foto precisa existir em `img/`. Essa checagem de arquivo continua ativa na subida.

## Variante

| Campo | Quando usar | Efeito |
| --- | --- | --- |
| `axes` | sempre | Uma escolha para cada eixo declarado no produto |
| `mainImage` | sempre | Um dos arquivos de `images` do mesmo anúncio |
| `price` | exceto sob encomenda | Número positivo em reais, truncado em duas casas |
| `listPrice` | opcional | Exige `price` e precisa ser maior depois do truncamento |
| `observations` | opcional | Nota dessa combinação |
| `offers` | opcional | Ofertas dessa combinação |
| `orderable` | opcional | `false` marca a variante como indisponível |

O anúncio não repete a mesma combinação de eixos. Id e rótulo de eixo são únicos no produto. Id de valor é único dentro do eixo.

## Especificações

Cada item tem `label` e `value`. O valor tem texto além de espaços. O mesmo rótulo não se repete no produto nem entre o produto e o anúncio. O schema só aceita os rótulos abaixo:

1. Marca
2. Modelo
3. Homage de
4. Tipo do relógio
5. Funções
6. Tipo de movimento
7. Movimento
8. Material da caixa
9. Material da pulseira
10. Material do vidro
11. Material do bisel
12. Resistência à água
13. Largura da pulseira
14. Tamanho da caixa
15. Coroa
16. Tampa inferior
17. Diâmetro do mostrador
18. Espessura da caixa
19. Garantia

`Estado` e `Público-alvo` não entram nesta lista.

## Ofertas

Cada oferta tem `text` não vazio, `background` e `color` em `#RGB` ou `#RRGGBB`, e `icon` com o nome de um export do Lucide, por exemplo `Gift`. A oferta não altera `price` nem `listPrice`. Um ícone desconhecido impede a subida.

## Eixos

`presentation` é `image` ou `text`. Sem o campo, o seletor usa texto.

Cada valor tem `id` e `value`. `alias` é opcional. Quando existe, a ficha e a mensagem do WhatsApp usam o alias no lugar de `value`. O seletor continua mostrando `value`.
