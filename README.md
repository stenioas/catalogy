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
| `specifications` | não | Lista de `{ "label", "value" }` |
| `observations` | não | Nota no fim da página |
| `state` | sim | `"Novo"`, `"Usado"` ou `"Openbox"`; badge sempre visível e alinhada à direita na vitrine |
| `enabled` | não | Ausente ou `true` mostra o produto; `false` esconde da vitrine e do link direto |

**Novo**: produto novo, lacrado e nunca usado. **Openbox**: caixa aberta, sem uso ou com uso muito breve. **Usado**: produto que foi usado. A badge é laranja para Novo e cinza claro para Openbox e Usado.

Ao salvar um `product.json` com o servidor de desenvolvimento aberto, a lista do catálogo é atualizada. O build recusa um JSON que fure esse contrato ou uma foto citada que não esteja em `img/`.

O preço na vitrine, na página do produto e na barra fixa inclui a mensagem padrão “ou em até 12x com juros”, definida no componente compartilhado de preço.
