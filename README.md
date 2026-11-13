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

O desenvolvimento sobe o Vite. O build gera o site em `client/dist`. O arquivo `client/public/_redirects` faz qualquer endereço cair no `index.html`, para a navegação do catálogo funcionar no servidor estático.

## Onde ficam os produtos

Cada produto é uma pasta em `client/public/catalog/products/<slug>/`:

```text
client/public/catalog/products/curren-8455/
  product.json
  img/
    curren-8455-1.png
```

O `slug` da pasta e o `slug` do JSON são o mesmo, em minúsculas, com hífens. Os nomes em `images` são só o arquivo, e cada um precisa existir em `img/`. Extensões aceitas: jpg, jpeg, png, webp e avif.

O JSON descreve um produto com anúncios em `listings`. O catálogo aceita relógios e outros produtos. A lista de campos que valia só para relógio está em [docs/contrato-relogio.md](docs/contrato-relogio.md). Esse arquivo é uma referência para consultar quando o produto for um relógio. Ele não é aplicado na subida do servidor nem no build.

Disponibilidade: `available` mostra **Disponível**; `coming_soon`, **Chega em breve**; `on_order`, **Sob encomenda**. Na home, na ficha e na barra fixa, sob encomenda mostra **Preço sob consulta**. `orderable: false` aparece como **Indisponível** na ficha.

`offers` fica em cada variante de `listings[].variants[]`. O texto, as cores e o ícone saem do JSON; a fileira não altera `price` nem `listPrice`. No card com preço, as badges aparecem em fileira no corpo do card acima do preço, lado a lado com quebra de linha; a foto não recebe badge de oferta. Lista vazia ou campo ausente não desenha fileira. Um ícone que não existe no Lucide ainda impede a subida.

Ao salvar um `product.json` com o servidor de desenvolvimento aberto, a lista do catálogo é atualizada. Uma foto citada que não esteja em `img/` ainda impede a subida.

O preço na vitrine, na página do produto e na barra fixa é seguido de “no pix”. Na página do produto e na barra fixa, a badge de desconto fica ao lado do preço anterior, sem inclinação. Na vitrine mobile, o título usa 13px, o preço anterior 12px, o preço atual 16px e a badge de desconto fica pequena, reta, ao lado do preço atual. A partir de 768px o título passa a 16px, o preço anterior a 14px, o preço atual a 20px e a badge de desconto permanece em 11px, reta, ao lado do preço anterior. Cards da mesma linha da grade acompanham a altura do mais alto. O bloco inclui a mensagem padrão “ou em até 12x com juros”, definida no componente compartilhado de preço.

## Cadastro pelo HTML do AliExpress

Use `product-register` com o fragmento `<div id="root">...</div>`. A skill baixa mídias, grava `info.md` e cria um anúncio `sob-encomenda` sem preço. Fotos PNG ficam em `media/` e `img/`; vídeos convertidos para MP4 ficam apenas em `media/`.

Pasta livre é gravada direto. Pasta com `product.json` só é substituída após a resposta exata `substituir`; a substituição recria o produto e suas fotos. As instruções ficam em `.agents/skills/product-register/SKILL.md`. O parser pode ser verificado com `python3 -m pytest -q .agents/skills/product-register/tests`, usando os requisitos Python da pasta da skill e `ffmpeg`/`ffprobe` para vídeos. A suíte Vitest não executa a skill.
