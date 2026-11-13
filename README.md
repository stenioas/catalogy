# Catálogo de Produtos

Catálogo estático de produtos. A vitrine lista os anúncios e cada um abre a própria página, com fotos, preço e um link para o WhatsApp. A mensagem sai sem número: quem envia escolhe o contato no aplicativo.

O monorepo tem dois pacotes. `client` é o site em React, Vite e React Router. `shared` (`@catalogo/shared`) concentra o schema do produto, o preço e a montagem da vitrine e da ficha.

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

O desenvolvimento sobe o Vite. Ao abrir o servidor, e de novo a cada `product.json` salvo, alterado ou removido, o catálogo é lido e gravado em `client/src/catalog/products.generated.ts`.

`pnpm test` e `pnpm build` rodam antes o teste de pré-build do client, que valida `client/public/catalog` e regrava o mesmo módulo. O build do Vite publica o site em `client/dist`. Fotos em `img/` que nenhum anúncio cita saem do `dist`; a pasta `public` não é alterada. `client/public/_redirects` (`/* /index.html 200`) faz qualquer endereço cair no `index.html`, para a navegação funcionar no servidor estático.

A skill de cadastro não entra nessa suíte. O parser dela se verifica com `python3 -m pytest -q .agents/skills/product-register/tests`.

## Rotas

| Endereço | Conteúdo |
| --- | --- |
| `/` | Vitrine. `?section=` escolhe a aba |
| `/product/:slug` | Primeiro anúncio visível do produto, na ordem pronta entrega, a caminho, encomenda |
| `/product/:slug/:listingId` | Anúncio indicado. `?v=` escolhe a variante |

`section` aceita `all`, `available`, `coming-soon` e `on-order`. Um valor fora dessa lista abre Todos. O card guarda a aba no estado da navegação; a volta da ficha restaura `/?section=...`.

`v` é a lista de ids de valor, na ordem dos eixos do produto, separados por vírgula. Valor ausente ou inválido abre a primeira variante encomendável. Se todas estiverem com `orderable: false`, abre a primeira do array.

## Vitrine

A barra do topo mostra **Catálogo de Produtos**, some ao rolar para baixo e volta ao rolar para cima. A interface permanece no tema claro.

As abas são **Todos**, **Pronta entrega**, **A caminho** e **Encomendar**. Aba sem card fica desabilitada. Todos reúne disponível e chega em breve. Encomendar fica só na própria aba. Anúncio com `enabled: false`, ou sem variante encomendável, não gera card.

Os cards saem em ordem de título (`pt-BR`), depois slug, depois a posição do anúncio no produto. No card com preço, o valor é o menor `price` entre as variantes encomendáveis. Se esses preços forem iguais, a foto é a capa (`images[0]`) e o link não leva `v`. Se diferirem, a foto é a `mainImage` da variante mais barata e o link leva `v`. Sob encomenda usa a capa, sem preço e sem ofertas.

No celular a lista é uma coluna, com foto à esquerda e uma linha entre os cards. A partir de 768px a grade passa a duas colunas; a partir de 1024px, a três. Cards da mesma linha acompanham a altura do mais alto. Usado e Openbox ganham um selo laranja sobre a foto. A oferta, quando existe, fica no corpo do card, acima da disponibilidade. O ícone de compartilhar monta a mesma frase da ficha.

Com o catálogo vazio de cards, a vitrine mostra **Não temos nenhum anúncio ativo.**

## Página do produto

Abaixo de 920px a ordem é foto, título, estado e disponibilidade, preço, seletores, compartilhar, descrição, observações e características. A partir de 920px a foto fica à esquerda, com observações e características embaixo; título, preço, seletores, descrição e compartilhar ficam à direita.

Abaixo de 768px as fotos são um carrossel de borda a borda. A partir de 768px a foto principal fica com miniaturas. O clique abre a galeria. Sem `v` na URL, a foto inicial é a capa. Com `v`, é a `mainImage` da variante.

O título da ficha junta o título do produto e, para cada eixo, o `alias` do valor escolhido ou, sem alias, o texto do valor. Estado e disponibilidade aparecem na mesma linha. `orderable: false` troca a disponibilidade por **Indisponível**.

Os seletores seguem os eixos do produto. `presentation: "image"` mostra a miniatura; sem o campo, o seletor é texto. Combinação inexistente fica desabilitada. Combinação existente e não encomendável aparece como indisponível.

A barra fixa entra quando o bloco de preço sai da tela. Ela repete preço ou **Preço sob consulta**, as ofertas e o mesmo link de compartilhar. **Indisponível** também aparece nela.

Descrição, observações e características só aparecem quando há texto. Características do produto e do anúncio saem na ordem do JSON. Um valor que começa com `http://` ou `https://` vira o link **Ver anúncio similar**.

Produto ou anúncio ausente, ou anúncio desligado, mostra **Este relógio não está no catálogo.**

O compartilhar abre `https://wa.me/?text=...` com a frase `Olá, tenho interesse no {título}. {estado}, {disponibilidade}. {origem}{caminho}`. O caminho inclui o anúncio e, quando há eixos, `?v=`.

## Preço

O preço na vitrine, na ficha e na barra fixa é seguido de **no pix**. A parcela é `10x R$ … no cartão`: o total é `price / (1 - 0,1208)`, dividido em 10 e arredondado ao centavo. Sob encomenda mostra **Preço sob consulta**, em vermelho, sem parcela.

`listPrice` aparece riscado como **De R$ …**. A badge `−N%` só entra quando o desconto inteiro é de pelo menos 1%. Na vitrine ela fica ao lado do preço anterior, com 11px e cantos retos. Na ficha e na barra fixa também fica ao lado do preço anterior, sem inclinação.

Na vitrine, o título usa 13px e, a partir de 768px, 15px. O preço anterior usa 12px e depois 14px. O preço atual usa 16px e depois 20px. Na ficha o preço atual é maior e a linha **no pix** fica ao lado dele.

`offers` fica em cada variante. O texto, as cores e o ícone saem do JSON. A fileira não altera `price` nem `listPrice`. Lista vazia ou campo ausente não desenha fileira. Na vitrine, sob encomenda não mostra ofertas. Um ícone que não existe no Lucide, ou que não tem import dinâmico, impede a subida.

## Onde ficam os produtos

Cada produto é uma pasta em `client/public/catalog/products/<slug>/`:

```text
client/public/catalog/products/curren-8455/
  product.json
  info.md
  img/
    curren-8455-1.webp
    thumbs/
      curren-8455-1.webp
  media/
```

O `slug` da pasta e o `slug` do JSON são o mesmo, em minúsculas, com hífens. Os nomes em `images` são só o arquivo, e cada um precisa existir em `img/`. Extensões aceitas: jpg, jpeg, png, webp e avif. A foto de `img/` tem lado maior de até 768 px e serve a galeria e o zoom. `img/thumbs/` repete o mesmo nome com lado maior de até 400 px, para o card e as miniaturas. `info.md` e `media/` registram a fonte do cadastro; `media/` não entra no site publicado. O site lê `product.json`, `img/` e `img/thumbs/`.

O JSON descreve um produto com anúncios em `listings`. O catálogo aceita relógios e outros produtos. O formato e a lista fechada de características estão em [docs/contrato-relogio.md](docs/contrato-relogio.md). `ProductSchema`, em `shared`, aplica esse formato. O carregador do Vite não chama o schema: confere as fotos citadas e os ícones das ofertas. Um JSON antigo, ainda sem `listings`, é convertido na leitura quando tem `images` e `price`.

Disponibilidade: `available` mostra **Disponível**; `coming_soon`, **Chega em breve**; `on_order`, **Sob encomenda**. Estado: `new` é **Novo**, `openbox` é **Openbox**, `used` é **Usado**, `defective` é **Com defeito**.

## Cadastro pelo HTML do AliExpress

Use `product-register` com o fragmento `<div id="root">...</div>`. A skill baixa mídias, grava `info.md` e cria um anúncio `sob-encomenda` sem preço. Fotos WebP ficam em `media/` e `img/`, com a miniatura de 400 px em `img/thumbs/`; vídeos convertidos para MP4 ficam apenas em `media/`. O objeto gravado passa por `ProductSchema` antes de ir para o disco.

Pasta livre é gravada direto. Pasta com `product.json` só é substituída após a resposta exata `substituir`; a substituição recria o produto e suas fotos. As instruções ficam em `.agents/skills/product-register/SKILL.md`. O parser pode ser verificado com `python3 -m pytest -q .agents/skills/product-register/tests`, usando os requisitos Python da pasta da skill e `ffmpeg`/`ffprobe` para vídeos.
