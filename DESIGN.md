# Design do catálogo

A interface é uma vitrine clara, com a foto do produto à frente e pouco chrome. O fundo da página é o pergaminho `#f5f5f7`. Cartões e a ficha usam branco. O acento é o azul `#0066cc`. O texto principal é `#1d1d1f`.

A fonte é SF Pro quando o sistema a oferece. Nos outros, Inter, carregada de `/fonts/InterVariable.woff2`, com o recurso OpenType `ss03`. O corpo da página usa 17px, peso 400, entrelinha 1,47 e tracking de −0,374px.

O tema publicado é o claro. Os tokens escuros existem no CSS, e o `ThemeProvider` força a classe clara.

## Cores em uso

| Token | Valor | Uso |
| --- | --- | --- |
| `--primary` | `#0066cc` | Aba ativa, links de anúncio similar no tema claro, foco de ação |
| `--primary-on-dark` | `#2997ff` | Link de anúncio similar quando o tema escuro está ativo no CSS |
| `--primary-tint` | `#0066cc` / `#2997ff` | Texto da badge de desconto |
| `--canvas-parchment` | `#f5f5f7` | Fundo da página e das barras foscas |
| `--canvas` | `#ffffff` | Cartão a partir de 768px |
| `--ink` | `#1d1d1f` | Títulos e texto |
| `--ink-muted-48` | `#7a7a7a` | Preço anterior |
| `--hairline` | `#e0e0e0` | Borda dos cartões no desktop |

Disponibilidade usa fundos suaves: verde para disponível, azul para chega em breve, laranja para sob encomenda. Usado e Openbox usam um selo laranja `#ea580c` sobre a foto. **Preço sob consulta** usa a cor destrutiva.

## Barra do topo

Faixa fixa de 64px, com fundo de pergaminho a 80% e `backdrop-filter: saturate(180%) blur(20px)`. O título é **Catálogo de Produtos**, centralizado, 16px, tracking −0,12px. Na ficha, a esquerda tem o botão circular de voltar. A barra sobe para fora da tela depois de rolar mais de 8px para baixo, a partir de 64px, e volta ao rolar para cima.

A coluna do conteúdo tem no máximo 1120px. Na vitrine o respiro lateral some no celular e volta a 24px a partir de 768px. Na ficha o respiro lateral é 16px abaixo de 768px e 24px acima disso.

## Vitrine

As abas são texto, 14px no celular e 15px a partir de 768px. A ativa fica em negrito, na cor primária, com um traço embaixo.

No celular cada card é uma faixa sem borda: foto quadrada de 128px à esquerda, texto à direita e o ícone de compartilhar no canto inferior. Uma linha de 8% de preto separa os cards. A partir de 768px o card vira bloco branco de cantos de 12px e borda de 1px, com a foto quadrada em cima e 24px de padding no texto.

O título do card trunca em uma linha: 13px no celular, 15px a partir de 768px. A badge de disponibilidade é compacta, 12px, cantos de 4px.

## Preço

Na vitrine o bloco é uma grade. O preço anterior, 12px e depois 14px, fica riscado com **De**. A badge `−N%` fica na mesma linha, 11px, cantos de 4px, fundo `rgba(0, 102, 204, 0.12)`. O preço atual, 16px e depois 20px, ocupa a linha de baixo, com **no pix** ao lado. A parcela `10x … no cartão` ocupa a largura toda.

Na ficha e na barra fixa o preço atual é 24px. **no pix** e a parcela usam 14px. A badge de desconto continua reta, ao lado do preço anterior.

## Ficha

Abaixo de 768px o carrossel ocupa a largura da tela, saindo do padding da coluna. A foto fica quadrada, no máximo 476px, com cantos retos; a partir de 768px os cantos passam a 12px. Entre 768px e 919px a mídia usa a foto principal e miniaturas, ainda na coluna única. A partir de 920px a página divide: a mídia à esquerda, com o quadro de 476px mais as miniaturas, e o texto à direita, com mínimo de 220px. Nessa largura, com mouse, passar o ponteiro na foto abre uma lupa ao lado. O clique abre a galeria em tela cheia, com fechar e setas em botões circulares de 44px.

O título da ficha usa 16px no celular e 17px no desktop, peso 600. As seções Descrição, Observações e Características usam um título de 18px. A tabela de características quebra o texto nas duas colunas.

O botão **Compartilhar** é uma cápsula azul clara, altura 44px, com o ícone e o rótulo. No card o mesmo destino aparece só como ícone circular.

A barra fixa repete o fundo fosco da barra do topo e respeita a área segura inferior. No celular o preço fica acima do botão. A partir de 768px os dois ficam lado a lado.

## Movimento

A troca de rota e a troca de aba entram com fade e um deslocamento curto de 200ms, só quando o sistema permite animação. A barra do topo anima a translação em 300ms na mesma condição.
