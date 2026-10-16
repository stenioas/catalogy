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

| Campo | Obrigatório | Efeito |
| --- | --- | --- |
| `slug` | sim | Endereço `/product/<slug>` |
| `title` | sim | Nome na vitrine e na página |
| `price` | sim | Preço atual, em reais |
| `images` | sim | Pelo menos uma foto; a primeira é a da vitrine |
| `listPrice` | não | Preço riscado, maior que `price` |
| `description` | não | Texto da página |
| `color` | não | Texto livre opcional; fonte exclusiva da cor no resumo |
| `specifications` | não | Lista de `{ "label", "value" }` |
| `observations` | não | Nota no fim da página |
| `state` | sim | `"Novo"`, `"Usado"` ou `"Openbox"`; a badge aparece só para Usado e Openbox |
| `availabilityStatus` | sim | `"available"`, `"on_order"`, `"unavailable"` ou `"sold_out"`; define o texto e a cor da disponibilidade |
| `enabled` | não | Ausente ou `true` mostra o produto; `false` esconde da vitrine e do link direto |
| `unmissableOffer` | não | `true` mostra a badge **OFERTA IMPERDÍVEL** no card da vitrine; ausente ou `false` não mostra |

**Novo**: produto novo, lacrado e nunca usado. **Openbox**: caixa aberta, sem uso ou com uso muito breve. **Usado**: produto que foi usado. No card, o estado aparece em texto, acima do título, separado da disponibilidade por um espaço: `Novo` e depois **Em estoque**.

`color` informa a cor da unidade ofertada e alimenta exclusivamente a cor no resumo do produto. O catálogo não infere esse valor das fotos, da descrição ou de `specifications`; para evitar repetição, não cadastre o mesmo valor de cor também em `specifications`.

Disponibilidade: `available` mostra **Em estoque** em verde claro; `on_order`, **Sob encomenda** em laranja claro; `unavailable`, **Indisponível** em cinza; `sold_out`, **Esgotado** em vermelho. As badges usam cantos menores que uma pílula, fundos suaves e nenhuma borda, com cores ajustadas para os temas claro e escuro. No card, a disponibilidade fica na mesma linha do estado, acima do título. O campo `availability` foi substituído por `availabilityStatus`; o texto é gerado pela interface.

`unmissableOffer` liga a badge **OFERTA IMPERDÍVEL** acima do título no card mobile e no canto inferior esquerdo da foto a partir de 768px. O texto da badge é fixo; o JSON só decide se ela aparece. Nenhum produto precisa receber a prop para continuar válido.

Ao salvar um `product.json` com o servidor de desenvolvimento aberto, a lista do catálogo é atualizada. O build recusa um JSON que fure esse contrato ou uma foto citada que não esteja em `img/`.

O preço na vitrine, na página do produto e na barra fixa é seguido de “no pix”. Na página do produto e na barra fixa, a badge de desconto fica ao lado do preço anterior, sem inclinação. Na vitrine mobile, o título usa 13px, o preço anterior 12px, o preço atual 16px e a badge de desconto fica pequena, reta, ao lado do preço atual. A partir de 768px o título passa a 16px, o preço anterior a 14px, o preço atual a 20px e a badge de desconto permanece em 11px, reta, ao lado do preço anterior. Cards da mesma linha da grade acompanham a altura do mais alto. O bloco inclui a mensagem padrão “ou em até 12x com juros”, definida no componente compartilhado de preço.
