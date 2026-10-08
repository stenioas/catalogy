# Plano de melhoria da interface

O catálogo já está dentro do sistema visual do `DESIGN.md`. O ganho das skills de frontend é fechar buracos de uso e de acabamento, sem trocar a identidade nem reescrever o site em React.

## Decisões

- Onde o plano e a spec `vitrine-relogios` discordam, o plano vence e o requisito antigo muda.
- A emenda fica na spec que já existe. Não abre feature paralela.
- A ordem da página do relógio permanece: nome do vendedor, Voltar, nome do item, carrossel, preço, parcelamento, observações, ficha e barra fixa. A foto ocupa a primeira dobra pelo tamanho, logo abaixo do nome.
- O YAML não ganha campo novo. O arquivo de imagem não é recortado nem regravado. O site publicado continua HTML, CSS e JavaScript, gerado em Python.
- As cinco fotos atuais do Alexandre já são 400×400. O corte do quadro só aparece quando um arquivo vier fora de 1:1.

## O que cada skill muda de verdade

| Skill | Vale aqui? | O que ela acrescenta |
|---|---|---|
| **impeccable** | Sim | Modo da vitrine: a foto manda e a interface recua. Fluxo útil: `audit` (acessibilidade, foco, responsivo) e depois `polish` / `layout` / `typeset`. Não há `PRODUCT.md`; um `init` deixaria o contexto do produto registrado para as próximas passadas. |
| **ui-ux-pro-max** | Em parte | A prioridade 1–3 (contraste, teclado, toque, imagem) cabe. A busca de “design system” devolveu outra marca: fundo preto, Archivo e Space Grotesk, storytelling com scroll. Isso conflita com o `DESIGN.md` já fixado (azul `#0066cc`, Inter, tiles claros). Essa saída fica de fora. |
| **frontend-design** | Como freio | O visual já está decidido. A skill só impede enfeite genérico: sobrancelha em caixa alta, gradiente, sombra em card, uma palavra colorida no título. |
| **web-design-guidelines** | Sim | Checklist concreto de HTML/CSS. É a fonte dos defeitos abaixo. |
| **vercel-react-best-practices** e **vercel-composition-patterns** | Não | O site publicado é HTML, CSS e JavaScript, gerado em Python. Essas duas skills só valem se o front virar React. |

Colunas da grade, textos literais, alvos de 44 px e links relativos continuam. Melhoria visual entra no CSS e, onde o HTML precisar, no gerador, com os testes de novo.

## O que a interface perde hoje

A página do relógio já tem carrossel, ficha e a barra “Tenho interesse”. A raiz continua uma coluna de nomes.

1. **A foto não lidera no card.** A imagem usa o mesmo raio de 18 px do cartão. O quadro ainda não corta o que passa de 1:1, e a altura do carrossel acompanha cada arquivo.
2. **Tema escuro incompleto.** O miolo escurece, mas a sub-barra perde o vidro fosco, a ficha, a borda do card e a lista de vendedores continuam com `#e0e0e0`, e o botão de tema (`#1d1d1f` sobre preto) some na barra.
3. **Teclado e leitura.** As setas do carrossel não entram na regra de `:focus-visible`. As bolinhas têm 8 px, são `span` e não são botões. Não há link de pular para o conteúdo, nem `scroll-padding` para as barras não cobrirem o foco. O texto secundário `#7a7a7a` em fundo branco fica no limite do texto de 14 px.
4. **Página no celular.** O HTML gerado não declara `viewport`. Sem isso, o layout de 320 px não é o que o aparelho mostra.
5. **Imagem e tema nativo.** Fotos sem `width`/`height`, sem `loading="lazy"` abaixo da primeira, sem `color-scheme` no escuro. O botão de tema não expõe o modo atual para leitor de tela.

## Requisitos

Três requisitos atuais mudam.

- A foto do card e a do carrossel entram num quadro quadrado estável, do mesmo tamanho naquela superfície. A imagem ocupa a largura e a altura inteiras, centrada, sem esticar. O que passa do quadro é cortado por igual. Não há faixa. O teste que hoje exige a foto inteira sem corte passa a exigir esse quadro cheio.
- A foto do card fica com raio de 8 px. O card em volta continua com 18 px. A foto do carrossel continua sem canto arredondado. Trocar de foto não muda a altura da página. O teste que hoje exige `border-radius: 18px` na foto do card passa a exigir 8 px.
- No escuro, o rodapé continua `#272729` com texto branco. A segunda barra passa a `rgba(39, 39, 41, 0.8)` com `saturate(180%) blur(20px)`. A barra fixa mantém o vidro que a spec já pede. O teste que exige `#272729` nas três superfícies passa a exigir o sólido só no rodapé.

Entram requisitos novos.

- Toda página declara `viewport` e, no escuro, `color-scheme: dark`.
- Há um link com o texto exato `Pular para o conteúdo`. Ele fica escondido até o foco do teclado. Com foco, aparece como a pílula `#0066cc` de texto branco, fixa no canto superior esquerdo, por cima da barra preta, sem empurrar o conteúdo. O `main` tem `id="conteudo"` e `tabindex="-1"`. Ativar o link leva o foco para esse `main`.
- `scroll-padding` impede que a barra preta, a segunda barra e a barra fixa cubram o foco. O respiro de cima acompanha a pilha sticky (44 px na raiz, 96 px onde há segunda barra). O de baixo é 64 px onde há barra fixa.
- O link de pular, as bolinhas e as setas usam o anel que já existe: `2px solid #0071e3`, `outline-offset: 2px`, só em `:focus-visible`.
- Com duas ou mais fotos, cada bolinha é um `button type="button"` com nome `Foto 1`, `Foto 2`, e assim por diante. O alvo tem 44 px, o ponto desenhado continua com 8 px, e há 8 px entre os botões. O clique leva àquela foto e mantém `aria-current` na bolinha ativa. Com uma foto, setas e bolinhas somem, como hoje. A última foto seguida de próxima volta para a primeira.
- O texto secundário no claro é `#333333`. `#7a7a7a` sai desse papel.
- No escuro, a borda do card, as linhas da ficha e o separador da lista de vendedores usam `rgba(255, 255, 255, 0.16)`. Os links continuam `#2997ff`.
- O botão de tema continua com preenchimento `#1d1d1f` e ganha um fio de 1 px em `rgba(255, 255, 255, 0.16)`. O rótulo visível continua `Escuro` ou `Claro`. O nome acessível é `Modo claro. Mudar para escuro.` ou `Modo escuro. Mudar para claro.`, e acompanha o clique.
- Cada foto publicada traz `width` e `height` lidos do cabeçalho do arquivo, em Python puro, para png, jpg, jpeg, webp e avif. Não entra pacote novo. Em JPEG, WebP e AVIF, orientação de 90°, 270° e as espelhadas que também giram invertem largura e altura. Orientação de 180° e espelhamento sem giro mantêm os números do cabeçalho.
- Largura ou altura ausente, zero ou negativa faz a publicação falhar. A mensagem é `não foi possível ler a largura e a altura da imagem`, no formato `pasta: regra`, sem nome de arquivo. O `site/` anterior permanece.
- O primeiro card da vitrine e a primeira foto do carrossel carregam na hora. Os outros cards e as fotos seguintes do carrossel usam `loading="lazy"`.
- `prefers-reduced-motion: reduce` desliga o `scale(0.95)`.
- Preços usam números tabulares. Títulos usam `text-wrap: balance`. Um nome longo quebra dentro do card sem alargar a grade.

## Onde entra

`gerador/estilos.css` é a fonte do visual. A publicação copia esse arquivo para `site/estilos.css`. Quadro quadrado cheio, raio de 8 px, vidro da segunda barra, hairline escura, foco, contraste, `scroll-padding`, números tabulares e `prefers-reduced-motion` mudam só aí.

`gerador/renderizar.py` emite o HTML. `_pagina` ganha `viewport`, o link de pular e o `id` no `main`. O card e cada foto do carrossel ganham `width` e `height`. A leitura do cabeçalho mora no gerador, ao lado da validação da imagem. O primeiro card e a primeira foto seguem sem `loading="lazy"`. A bolinha vira `button`. O script do tema grava o nome acessível no botão.

`gerador/carrossel.js` trata o clique na bolinha como ir para aquele índice e mantém `aria-current` na bolinha ativa.

Os testes de estilo, de HTML, de validação e do carrossel passam a afirmar o resultado novo. A suíte continua usando o catálogo de exemplo, não o YAML publicado.

## Fora de escopo

- Nova paleta, novas fontes, gradiente, GSAP, sombra de card.
- Migração para React.
- Mudança de colunas da grade, textos literais já existentes, alvos mínimos de 44 px ou links relativos.
- Reordenar o HTML da página do relógio.
- Campo novo no YAML, recorte do arquivo ou pacote novo para ler a imagem.
- Feature nova ao lado de `vitrine-relogios`.
- Faixa ao redor da foto, preta ou da cor do fundo.
