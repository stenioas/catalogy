# Ajustes do site gerado Specification

## Problem Statement

A barra, o tema, as fotos e a lista de vendedores do site gerado ainda não seguem o layout aprovado em `PLANO-AJUSTES-SITE.md`. O visitante vê texto “Claro” ou “Escuro”, o nome do vendedor duas vezes, fotos com sombra forte e, no celular, preço e “Tenho interesse” na mesma linha. O gerador precisa emitir o layout novo sem mudar o YAML, o modelo de dados ou a arquitetura estática.

## Goals

- [ ] A raiz, a vitrine e o produto usam a barra aprovada, com tema só por ícone e sem segunda barra.
- [ ] Fotos de card e carrossel ocupam um quadro 1:1 com corte, sem distorção, e a imagem do card tem sombra mínima.
- [ ] Até 640 px, a barra fixa empilha o preço e depois “Tenho interesse”.
- [ ] Links relativos, alvos de 44 px, foco visível, tema claro/escuro e a grade atual continuam valendo.

## Out of Scope

| Feature | Reason |
| --- | --- |
| YAML, modelo de dados e validação do catálogo | O plano não muda o formato do catálogo. |
| Framework frontend ou dependência nova | O site publicado continua HTML, CSS e JavaScript gerados em Python. |
| Paleta, tipografia e quantidade de colunas da grade | Os breakpoints 640, 834, 1068, 1440 e 1441 px permanecem. |
| Recortar ou regravar arquivos de imagem | O corte é só `object-fit: cover` no quadro. |
| Leitura de largura e altura no cabeçalho da imagem (T15–T28 de `vitrine-relogios`) | Esta emenda não continua aquela fila. |
| Pagamento, conta, busca e painel | Continuam fora do catálogo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Conflito com `vitrine-relogios` | Onde as duas specs discordam na barra, no texto visível do tema, na segunda barra ou na sombra da foto, esta spec vence. | O plano de ajustes é a emenda mais nova e já marca essas decisões como aprovadas. | y |
| Barra da raiz | `header.barra-negra` mantém o link visível “Catálogo” com `href="./"`. Não há link “Voltar”. O tema fica à direita. | O plano manda só trocar o controle de tema na raiz. | y |
| Barra da vitrine | Ordem no header: voltar, “Catálogo”, tema. Os dois links usam `href="../"`. | O plano fixa `[Voltar \| Catálogo \| Tema]` e o destino do catálogo na vitrine. | y |
| Barra do produto | Ordem no header: voltar, nome do vendedor, tema. Os dois links usam `href="../"`. O header não mostra “Catálogo”. | O plano fixa `[Voltar \| Nome do vendedor \| Tema]` e o destino da vitrine. | y |
| Botão voltar | Link com classe `voltar`, `aria-label="Voltar"`, um `svg` com `aria-hidden="true"`, sem o texto visível “Voltar”. A caixa do link é 44 × 44 px. | O plano pede ícone vetorial, nome acessível e alvo mínimo. | y |
| Nome do vendedor na vitrine | Uma vez no `body`, no primeiro filho de `main`, no elemento `p.nome-vendedor`, com `text-align: center`. O `<title>` pode repetir o nome. | O plano pede uma ocorrência visual no início do `main`. | y |
| Página do produto sem nome de vitrine | O `body` do produto não contém `p.nome-vendedor` nem `.barra-vendedor`. | A segunda barra sai e o nome fica só no centro do header. | y |
| Ícones do tema | Com `data-tema="claro"`, o botão `#controle-tema` mostra `svg.icone-lua`. Com `data-tema="escuro"`, mostra `svg.icone-sol`. O `svg` tem `aria-hidden="true"`. | O plano pede lua para ir ao escuro e sol para ir ao claro, sem caractere de fonte. | y |
| Nome acessível do tema | `aria-label` “Modo claro. Mudar para escuro.” no claro e “Modo escuro. Mudar para claro.” no escuro. O botão não tem texto visível “Claro” nem “Escuro”. | O plano preserva esses dois nomes e remove o rótulo visível. | y |
| Próximo tema | O clique lê `data-tema` em `<html>`. `claro` passa a `escuro` e `escuro` passa a `claro`. A chave `localStorage` continua `tema`. | O plano proíbe derivar o próximo tema do texto visível. | y |
| Forma do controle de tema | 44 × 44 px, `border-radius: 50%`, conteúdo centralizado. O foco visível continua `outline: 2px solid #0071e3` com `outline-offset: 2px`. | O plano pede controle circular de 44 px e o foco que já existe. | y |
| Lista da raiz | `.lista-vendedores` usa `width: min(960px, 100%)`, `margin-inline: auto`, uma coluna e `gap: 12px`. | O plano limita a 960 px, centraliza e pede uma coluna com espaço entre itens. O 12 px é o intervalo curto já usado no miolo. | y |
| Card de vendedor | O `a` preenche o `li`, com fundo de superfície, `border: 1px solid`, `border-radius: 18px`, `padding: 16px` e `min-height: 44px`. Claro: fundo `#ffffff` e borda `#e0e0e0`. Escuro: fundo `#2a2a2c` e borda `rgba(255, 255, 255, 0.16)`. | São a superfície, a borda e o raio do `.card` de relógio. | y |
| Sombra da foto do card | `.card img` usa `box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08)`. `.card` não declara `box-shadow`. | É o valor de exemplo do plano. A elevação fica na imagem, não no card. | y |
| Quadro do carrossel | `.carrossel-janela` envolve as `img` e as `.seta`. `.bolinhas` fica irmão seguinte, ainda dentro de `.carrossel`. A janela tem `width: 100%`, `aspect-ratio: 1 / 1`, `position: relative` e `overflow: hidden`. Cada foto tem `width: 100%`, `height: 100%`, `object-fit: cover` e `object-position: center`. | O plano separa o quadro quadrado das bolinhas e mantém as setas dentro dele. | y |
| `carrossel.js` | Os seletores continuam `img`, `.bolinhas`, `.seta-anterior` e `.seta-proxima` a partir de `.carrossel`. O arquivo só muda se um desses seletores deixar de achar o nó. | O plano manda alterar o script só quando a estrutura quebrar a seleção. | y |
| Barra fixa até 640 px | Em `@media (max-width: 640px)`, `.barra-fixa` usa `flex-direction: column`, `align-items: stretch`, `height: auto` e `gap: 8px`. O padding horizontal permanece 32 px. `.pilula` usa `width: 100%`. A ordem no DOM continua `.preco` e depois o link “Tenho interesse”. | O plano empilha preço e botão, preserva o padding lateral e pede um gap pequeno. 8 px é o gap curto. | y |
| Folga da barra empilhada | Nesse mesmo breakpoint, `html:has(.barra-fixa)` usa `scroll-padding-bottom: 128px` e `main:has(.barra-fixa)` usa `padding-bottom: 160px`. | A barra deixa de ter 64 px de altura. 128 px cobre as duas linhas; 160 px mantém a folga de 32 px que o miolo já tinha sobre a barra. | y |
| Barra fixa acima de 640 px | Preço e botão ficam na mesma linha, com `height: 64px`, sem `width: 100%` no botão. | O plano mantém o lado a lado a partir de 641 px. | y |
| Foto única | O carrossel de uma foto tem `.carrossel-janela` e não tem `.seta` nem `.bolinhas`. | O plano pede o quadro também nessa página, e os controles já nascem só com duas fotos ou mais. | y |
| Vitrine vazia | A página sem relógios mantém a barra nova e um único `p.nome-vendedor`, mais a mensagem “Esta vitrine ainda não tem relógios.” | A barra e o nome não dependem de haver cards. | y |
| Contratos que permanecem | Links relativos, alvo mínimo de 44 px, foco visível, `loading="lazy"` fora da primeira foto, teclado do carrossel e os valores `claro` e `escuro` da chave `tema`. | O plano manda manter esses testes. | y |
| Validação de entrada | N/A: esta emenda não cria campo nem rejeita YAML. | O formato do catálogo fica como está. | y |
| Falha parcial, nova tentativa e concorrência | N/A: um processo local regrava `site/` por inteiro, como hoje. | Não há gravação parcial nova. | y |
| Autenticação, taxa, rede e observabilidade | N/A: HTML público, sem chamada externa e sem métrica. | Fora do plano. | y |
| Vida do dado | A preferência de tema continua em `localStorage`, sem prazo. O catálogo muda só quando o YAML muda e o site é gerado de novo. | O plano manda preservar a persistência do tema. | y |

**Open questions:** none

---

## User Stories

### P1: Barra das três páginas ⭐ MVP

**User Story**: As a visitor, I want back, the current place, and theme in one bar so that I can move and change theme without a second bar.

**Why P1**: O plano trata o layout da barra como decisão aprovada da raiz, da vitrine e do produto.

**Acceptance Criteria**:

1. The root page SHALL render `header.barra-negra` with a link whose visible text is `Catálogo` and whose `href` is `./`.
2. The root page SHALL NOT render an element with class `voltar` or class `barra-vendedor`.
3. WHEN the generator renders a seller page THEN the header SHALL contain, in this order, a link with class `voltar`, a link with visible text `Catálogo`, and no other navigation link.
4. The seller-page back link SHALL have `href="../"`, `aria-label="Voltar"`, and an `svg` with `aria-hidden="true"`.
5. The seller-page back link SHALL NOT contain the visible text `Voltar`.
6. The seller-page catalog link SHALL have `href="../"`.
7. The seller page SHALL render the seller name exactly once in the `body`, as the text of the first `main` child `p.nome-vendedor`.
8. The seller page SHALL NOT render an element with class `barra-vendedor`.
9. WHEN the generator renders a product page THEN the header SHALL contain, in this order, a link with class `voltar` and a link whose visible text is the seller name.
10. The product-page back link SHALL have `href="../"`, `aria-label="Voltar"`, an `svg` with `aria-hidden="true"`, and no visible text `Voltar`.
11. The product-page seller link SHALL have `href="../"`.
12. The product page SHALL NOT render the visible text `Catálogo` in the header.
13. The product page SHALL NOT render an element with class `barra-vendedor` or class `nome-vendedor`.
14. The back link SHALL have a used box of at least 44 px by 44 px.
15. IF the seller name contains `<` or `&` THEN the generator SHALL escape those characters in the header link and in `p.nome-vendedor`.

**Independent Test**: Generate a root, a seller page, and a product page and assert the header links, the single seller name, and the absence of `.barra-vendedor`.

---

### P1: Tema por ícone

**User Story**: As a visitor, I want a sun or moon button so that I can switch theme without reading the words Claro or Escuro.

**Why P1**: O controle atual ainda depende do texto visível para escolher o próximo tema.

**Acceptance Criteria**:

1. WHILE `html` has `data-tema="claro"` the theme button `#controle-tema` SHALL contain `svg.icone-lua` with `aria-hidden="true"` and SHALL have `aria-label` `Modo claro. Mudar para escuro.`
2. WHILE `html` has `data-tema="escuro"` the theme button SHALL contain `svg.icone-sol` with `aria-hidden="true"` and SHALL have `aria-label` `Modo escuro. Mudar para claro.`
3. The theme button SHALL NOT contain the visible text `Claro` or `Escuro`.
4. WHEN the visitor activates the theme button WHILE `data-tema` is `claro` THEN the system SHALL set `data-tema` to `escuro` and store `escuro` in `localStorage` under the key `tema`.
5. WHEN the visitor activates the theme button WHILE `data-tema` is `escuro` THEN the system SHALL set `data-tema` to `claro` and store `claro` in `localStorage` under the key `tema`.
6. The `#controle-tema` rule SHALL set `width` and `height` to `44px` and `border-radius` to `50%`.
7. The `#controle-tema:focus-visible` rule SHALL keep `outline: 2px solid #0071e3` and `outline-offset: 2px`.

**Independent Test**: Load the theme script in claro and escuro, click once each way, and assert the icon class, the accessible name, and the stored value.

---

### P1: Lista de vendedores em cards

**User Story**: As a visitor, I want seller names as a centered card list so that the root page stays within a 960 px column.

**Why P1**: A raiz hoje é uma lista larga, sem o limite nem a superfície de card.

**Acceptance Criteria**:

1. The `.lista-vendedores` rule SHALL set `width: min(960px, 100%)`, `margin-inline: auto`, and a single grid column.
2. The `.lista-vendedores` rule SHALL set `gap: 12px`.
3. Each seller link SHALL be the only content of its `li` and SHALL be the clickable card.
4. The seller-link rule SHALL set `border-radius: 18px`, `padding: 16px`, `min-height: 44px`, background `#ffffff`, and border `#e0e0e0`.
5. WHILE `html` has `data-tema="escuro"` the seller link SHALL use background `#2a2a2c` and border `rgba(255, 255, 255, 0.16)`.
6. The `.lista-vendedores a:focus-visible` rule SHALL keep `outline: 2px solid #0071e3`.

**Independent Test**: Render the root CSS and HTML for two sellers and assert the 960 px list and the card surface in both themes.

---

### P1: Fotos quadradas da vitrine

**User Story**: As a visitor, I want every watch photo in a stable square so that a wide or tall photo does not stretch or change the card.

**Why P1**: O plano troca a sombra forte por corte 1:1 com sombra mínima.

**Acceptance Criteria**:

1. The `.nome-vendedor` rule SHALL set `text-align: center`.
2. The `.card img` rule SHALL set `width: 100%`, `aspect-ratio: 1 / 1`, `object-fit: cover`, and `object-position: center`.
3. The `.card img` rule SHALL set `box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08)`.
4. The `.card` rule SHALL NOT set `box-shadow`.
5. The grade breakpoints SHALL stay 1 column through 640 px, 2 from 641 px to 834 px, 3 from 835 px to 1068 px, 4 from 1069 px to 1440 px, and 5 from 1441 px.

**Independent Test**: Assert the image and name rules, and assert the five grid breakpoints are unchanged.

---

### P1: Quadro do carrossel

**User Story**: As a visitor, I want the product photo in a square frame so that changing photos does not change the page height.

**Why P1**: Sem o quadro, a troca de proporção ainda pode mover as setas e as bolinhas.

**Acceptance Criteria**:

1. WHEN the product has one or more photos THEN the generator SHALL wrap those photos in an element with class `carrossel-janela` inside `.carrossel`.
2. WHERE the product has two or more photos the generator SHALL place both `.seta` elements inside `.carrossel-janela` and SHALL place `.bolinhas` as the next sibling of `.carrossel-janela`.
3. WHERE the product has one photo the generator SHALL NOT render `.seta` or `.bolinhas`.
4. The `.carrossel-janela` rule SHALL set `width: 100%`, `aspect-ratio: 1 / 1`, `position: relative`, and `overflow: hidden`.
5. The `.carrossel-janela img` rule SHALL set `width: 100%`, `height: 100%`, `object-fit: cover`, and `object-position: center`.
6. The carousel script SHALL keep finding `img`, `.bolinhas`, `.seta-anterior`, and `.seta-proxima` as descendants of `.carrossel`.

**Independent Test**: Render one-photo and multi-photo products and assert the window, the sibling dots, and the existing carousel selectors.

---

### P1: Barra fixa no celular

**User Story**: As a visitor on a phone, I want the price above the WhatsApp button so that each one uses the full width.

**Why P1**: Até 640 px os dois ainda dividem a mesma linha.

**Acceptance Criteria**:

1. The product page SHALL render `.barra-fixa` with `.preco` before the link whose visible text is `Tenho interesse`.
2. WHILE the viewport is at most 640 px the `.barra-fixa` rule SHALL set `flex-direction: column`, `align-items: stretch`, `height: auto`, and `gap: 8px`.
3. WHILE the viewport is at most 640 px the fixed bar SHALL keep horizontal padding of 32 px and the interest link SHALL use `width: 100%`.
4. WHILE the viewport is at most 640 px `html:has(.barra-fixa)` SHALL set `scroll-padding-bottom: 128px` and `main:has(.barra-fixa)` SHALL set `padding-bottom: 160px`.
5. WHILE the viewport is at least 641 px the fixed bar SHALL lay out the price and the interest link in one row with `height: 64px`.
6. The interest link SHALL keep `min-height: 44px`.

**Independent Test**: Assert DOM order and the two media-query rule sets for the fixed bar.

---

## Edge Cases

- WHEN a seller page has no watches THEN the page SHALL still render the approved header, one centered `p.nome-vendedor`, and the text `Esta vitrine ainda não tem relógios.`
- WHEN a product has one photo THEN the square `.carrossel-janela` SHALL render without arrow buttons or dot buttons.
- IF `localStorage` already holds `tema` equal to `claro` or `escuro` THEN the theme script SHALL apply that value before painting, as it does today.
- The first vitrine image and the first carousel image SHALL omit `loading`, and every later image SHALL set `loading="lazy"`.
- Internal links SHALL stay relative: `./` at the root catalog, `../` from the seller page, and `../` from the product back link and seller link.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AJST-01 | P1: Barra das três páginas | Tasks | Done |
| AJST-02 | P1: Barra das três páginas | Tasks | Done |
| AJST-03 | P1: Barra das três páginas | Tasks | Done |
| AJST-04 | P1: Barra das três páginas | Tasks | Done |
| AJST-05 | P1: Barra das três páginas | Tasks | Done |
| AJST-06 | P1: Barra das três páginas | Tasks | Done |
| AJST-07 | P1: Barra das três páginas | Tasks | Done |
| AJST-08 | P1: Barra das três páginas | Tasks | Done |
| AJST-09 | P1: Barra das três páginas | Tasks | Done |
| AJST-10 | P1: Barra das três páginas | Tasks | Done |
| AJST-11 | P1: Barra das três páginas | Tasks | Done |
| AJST-12 | P1: Barra das três páginas | Tasks | Done |
| AJST-13 | P1: Barra das três páginas | Tasks | Done |
| AJST-14 | P1: Barra das três páginas | Tasks | Done |
| AJST-15 | P1: Barra das três páginas | Tasks | Done |
| AJST-16 | P1: Tema por ícone | Tasks | Done |
| AJST-17 | P1: Tema por ícone | Tasks | Done |
| AJST-18 | P1: Tema por ícone | Tasks | Done |
| AJST-19 | P1: Tema por ícone | Tasks | Done |
| AJST-20 | P1: Tema por ícone | Tasks | Done |
| AJST-21 | P1: Tema por ícone | Tasks | Done |
| AJST-22 | P1: Tema por ícone | Tasks | Done |
| AJST-23 | P1: Lista de vendedores em cards | Tasks | Done |
| AJST-24 | P1: Lista de vendedores em cards | Tasks | Done |
| AJST-25 | P1: Lista de vendedores em cards | Tasks | Done |
| AJST-26 | P1: Lista de vendedores em cards | Tasks | Done |
| AJST-27 | P1: Lista de vendedores em cards | Tasks | Done |
| AJST-28 | P1: Lista de vendedores em cards | Tasks | Done |
| AJST-29 | P1: Fotos quadradas da vitrine | Tasks | Done |
| AJST-30 | P1: Fotos quadradas da vitrine | Tasks | Done |
| AJST-31 | P1: Fotos quadradas da vitrine | Tasks | Done |
| AJST-32 | P1: Fotos quadradas da vitrine | Tasks | Done |
| AJST-33 | P1: Fotos quadradas da vitrine | Tasks | Done |
| AJST-34 | P1: Quadro do carrossel | Tasks | Done |
| AJST-35 | P1: Quadro do carrossel | Tasks | Done |
| AJST-36 | P1: Quadro do carrossel | Tasks | Done |
| AJST-37 | P1: Quadro do carrossel | Tasks | Done |
| AJST-38 | P1: Quadro do carrossel | Tasks | Done |
| AJST-39 | P1: Quadro do carrossel | Tasks | Done |
| AJST-40 | P1: Barra fixa no celular | Tasks | Done |
| AJST-41 | P1: Barra fixa no celular | Tasks | Done |
| AJST-42 | P1: Barra fixa no celular | Tasks | Done |
| AJST-43 | P1: Barra fixa no celular | Tasks | Done |
| AJST-44 | P1: Barra fixa no celular | Tasks | Done |
| AJST-45 | P1: Barra fixa no celular | Tasks | Done |

**Coverage:** 45 total, 45 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Nenhuma página gerada mostra “Claro” ou “Escuro” no botão de tema.
- [ ] A vitrine mostra o vendedor uma vez, centralizado, e não tem `.barra-vendedor`.
- [ ] A raiz não passa de 960 px na lista, e cards e carrossel usam quadro 1:1 com `object-fit: cover`.
- [ ] Até 640 px, o preço fica na linha de cima e “Tenho interesse” na de baixo, em largura total.
- [ ] `python3 -m unittest discover -s tests -q` passa, e `python3 scripts/gerar_site.py` regrava `site/`.
