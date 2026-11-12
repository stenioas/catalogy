# Catálogo de Produtos

Catálogo estático de produtos. A vitrine lista os itens e cada produto abre a própria página, com fotos, preço e um link para o WhatsApp. A mensagem sai sem número: quem envia escolhe o contato no aplicativo.

## Requisitos

- Node.js 20
- pnpm 12

## Comandos

Na raiz do repositório:

```bash
pnpm install
pnpm --filter client dev
pnpm test
pnpm build
```

O desenvolvimento sobe o Vite. O build valida o catálogo e gera o site em `client/dist`. O arquivo `client/public/_redirects` faz qualquer endereço cair no `index.html`, para a navegação do catálogo funcionar no servidor estático.

## Onde ficam os produtos

Cada produto é uma pasta em `client/public/catalog/products/<slug>/`:

```text
client/public/catalog/products/curren-8455/
  product.json
  img/
    curren-8455-1.png
```

O `slug` da pasta e o `slug` do JSON são o mesmo, em minúsculas, com hífens. Os nomes em `images` são só o arquivo, e cada um precisa existir em `img/`. Extensões aceitas: jpg, jpeg, png, webp e avif.

O JSON contém um produto com `axes` e `listings`. Cada anúncio tem `variants`; preço e foto principal pertencem à variante.

| Campo | Obrigatório | Efeito |
| --- | --- | --- |
| `slug`, `title`, `axes`, `listings` (produto) | sim | Identidade, eixos e anúncios; sem seletor, `axes: []` |
| `description`, `audience`, `specifications` (produto) | não | Texto e características compartilhadas |
| `id`, `state`, `availabilityStatus` (anúncio) | sim | Identidade, condição e disponibilidade do anúncio |
| `images`, `variants` (anúncio) | sim | Pelo menos uma foto e uma variante |
| `enabled` (anúncio) | não | `false` esconde o anúncio da vitrine e do link direto |
| `axes`, `mainImage` (variante) | sim | Combinação de valores e basename de uma foto do anúncio |
| `price` (variante) | exceto sob encomenda | Preço positivo em reais, truncado em duas casas |
| `listPrice` (variante) | não | Exige `price` e precisa ser maior após truncamento |
| `observations`, `offers` (variante) | não | Notas e ofertas dessa combinação |

Estados: `new`, `openbox`, `used`, `defective`. Disponibilidades: `available`, `coming_soon`, `on_order`. Sob encomenda exige `state: "new"` e aceita preço presente ou ausente; home, ficha e barra fixa mostram **Sob consulta**. Cada variante seleciona uma vez cada eixo declarado no produto. Cores e outras opções de SKU ficam nos eixos.

Cada `label` em `specifications` tem de ser uma das 19 labels exportadas por `SPECIFICATION_LABELS` em `@catalogo/shared`, nesta ordem:

| # | Label |
| --- | --- |
| 1 | Marca |
| 2 | Modelo |
| 3 | Homage de |
| 4 | Tipo do relógio |
| 5 | Funções |
| 6 | Tipo de movimento |
| 7 | Movimento |
| 8 | Material da caixa |
| 9 | Material da pulseira |
| 10 | Material do vidro |
| 11 | Material do bisel |
| 12 | Resistência à água |
| 13 | Largura da pulseira |
| 14 | Tamanho da caixa |
| 15 | Coroa |
| 16 | Tampa inferior |
| 17 | Diâmetro do mostrador |
| 18 | Espessura da caixa |
| 19 | Garantia |

A ordem no `product.json` pode ser outra; a página do relógio mostra essas labels sempre nesta sequência. O build recusa label fora da lista, label repetida no mesmo produto ou `value` vazio ou só com espaços.

Disponibilidade: `available` mostra **Disponível**; `coming_soon`, **Chega em breve**; `on_order`, **Sob encomenda**. `orderable: false` só é permitido em variantes sob encomenda, que aparecem como **Indisponível** na ficha.

`offers` fica em cada variante de `listings[].variants[]`. Cada oferta exige `text` não vazio, `background` e `color` em hex `#RGB` ou `#RRGGBB`, e `icon` com o nome de um export do Lucide (por exemplo `Gift`); o build recusa ícone desconhecido. O texto, as cores e o ícone saem do JSON; a fileira não altera `price` nem `listPrice`. No card com preço, as badges aparecem em fileira no corpo do card acima do preço, lado a lado com quebra de linha; a foto não recebe badge de oferta. Lista vazia ou campo ausente não desenha fileira.

Ao salvar um `product.json` com o servidor de desenvolvimento aberto, a lista do catálogo é atualizada. O build recusa um JSON que fure esse contrato ou uma foto citada que não esteja em `img/`.

O preço na vitrine, na página do produto e na barra fixa é seguido de “no pix”. Na página do produto e na barra fixa, a badge de desconto fica ao lado do preço anterior, sem inclinação. Na vitrine mobile, o título usa 13px, o preço anterior 12px, o preço atual 16px e a badge de desconto fica pequena, reta, ao lado do preço atual. A partir de 768px o título passa a 16px, o preço anterior a 14px, o preço atual a 20px e a badge de desconto permanece em 11px, reta, ao lado do preço anterior. Cards da mesma linha da grade acompanham a altura do mais alto. O bloco inclui a mensagem padrão “ou em até 12x com juros”, definida no componente compartilhado de preço.

## Cadastro pelo HTML do AliExpress

Use `product-register` com o fragmento `<div id="root">...</div>`. A skill baixa mídias, grava `info.md` e cria um anúncio `sob-encomenda` sem preço, validado por `ProductSchema`. Fotos PNG ficam em `media/` e `img/`; vídeos convertidos para MP4 ficam apenas em `media/`.

Pasta livre é gravada direto. Pasta com `product.json` só é substituída após a resposta exata `substituir`; a substituição recria o produto e suas fotos. As instruções ficam em `.agents/skills/product-register/SKILL.md`. O parser pode ser verificado com `python3 -m pytest -q .agents/skills/product-register/tests`, usando os requisitos Python da pasta da skill e `ffmpeg`/`ffprobe` para vídeos. A suíte Vitest não executa a skill.
