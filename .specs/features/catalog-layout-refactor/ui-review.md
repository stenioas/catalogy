# T16 — revisão visual e regressão

PASS no escopo visual medido. O tema efetivo permaneceu claro. O catálogo publicado não contém produtos de 1, 7 ou 12 fotos. Capturas foram exibidas na conversa. Nenhum PNG foi gravado no repositório.

Servidor existente `http://localhost:5173`. Chrome via cursor-ide-browser. Altura de viewport 1000 px, exceto a vitrine em 1024 × 900. Oráculo geométrico: `scrollWidth`, `clientWidth`, `getBoundingClientRect` e estilos computados. jsdom não foi usado como prova visual.

## Gate

| Comando | Resultado |
| --- | --- |
| `pnpm test` | PASS: 450 passed, 0 failed, 0 skipped (64 shared, 1 prebuild, 385 client). Igual à contagem de T15. Nenhum teste novo, excluído ou pulado. |
| `pnpm build` | PASS: prebuild 1/1 e Vite transformou 2130 módulos. `dist/assets/index-C9c_--yW.css` 48.23 kB, `dist/assets/index-C4xUau6f.js` 478.05 kB. |

`git status` e `git diff` em `client/public/catalog` e `client/src/catalog/products.generated.ts` ficaram vazios. Nenhum JSON ou foto foi alterado.

## Tema

Pedido claro: `color-scheme: light`, `documentElement.className` vazio, fundo `rgb(245, 245, 247)`. Não há controle com rótulo de tema.

Pedido escuro: `prefers-color-scheme: dark` antes do reload em `/` e em `/product/addiesdive-ad2554` a 390 px. `matchMedia` retornou true. Classe, `color-scheme` e fundo continuaram os do tema claro. `resolveTheme()` devolve `light` e o efeito do provider reaplica essa classe. As 16 células escuras (2 rotas × 8 larguras) observam esse mesmo tema. O layout medido no claro vale para elas, porque os tokens efetivos não mudam. Não houve captura de um tema escuro real.

## 32 combinações

Rota `/`, tema observado claro. Seis produtos listados, sem o Skmei desabilitado. Ordem: Addiesdive AD2554, Addiesdive MY-H3-2QZ, Curren 8455, Curren 9096, KEASO K002, Kit Seculus Cantil. Foto 96 × 96 abaixo de 768 px. Sombra computada sem elevação. Ação de WhatsApp fora do link do card, nome “Enviar no WhatsApp”, 44 × 44 px no mobile. Preço, “no pix”, “ou em até 12x com juros”, condição e disponibilidade presentes. Sem descrição nem tabela no card.

| Viewport | scroll / client | Resultado |
| --- | --- | --- |
| 320 × 1000 | 320 / 320 | Linha horizontal. Grade `272px`. Alturas 204, 204, 176, 176, 176, 176. Títulos Addiesdive em 2 linhas, `line-clamp: 2`. Borda 0. Sem overflow. |
| 390 × 1000 | 390 / 390 | Horizontal. Grade `342px`. Seis alturas 176. Títulos em 1 linha. Borda 0. |
| 767 × 1000 | 767 / 767 | Horizontal. Grade `719px`. `min-width: 768px` false. Alturas 176. Borda 0. |
| 768 × 1000 | 753 / 753 | Grade de cards `340.5px 340.5px`. Foto 339 × 339. Borda 1 px. Botão “Enviar no WhatsApp” 291 × 44. Condição visível sobre a foto. `line-clamp: none`. |
| 920 × 1000 | 905 / 905 | Grade desktop `416.5px 416.5px`. Foto 415 × 415. `min-width: 921px` false. |
| 921 × 1000 | 906 / 906 | Grade desktop `417px 417px`. Mesma apresentação de card da faixa ≥ 768. |
| 1024 × 900 | 1009 / 1009 | Três colunas ~304 px. Foto 302 × 302. Alturas 456. |
| 1440 × 1000 | 1425 / 1425 | Três colunas ~341 px. Foto 339 × 339. Alturas 493. |

Rota `/product/addiesdive-ad2554`, tema observado claro. Um `h1`, sem overflow do título. `object-fit: contain`. Cor do resumo ausente. Observações ausentes. Preço `R$ 449,90`, “no pix”, “ou em até 12x com juros”.

| Viewport | scroll / client | Resultado |
| --- | --- | --- |
| 320 × 1000 | 320 / 320 | Ordem: título, carrossel, oferta, Características do produto, Descrição, WhatsApp. Setas `display: none`. Contador `1/8`. Bolinhas presentes. Barra fixa visível, espaçador 156 px. |
| 390 × 1000 | 390 / 390 | Mesma ordem mobile. Setas ocultas. Zoom ausente após `pointermove`. |
| 767 × 1000 | 767 / 767 | Carrossel. Setas ocultas. `min-width: 768px` ainda false para o produto. |
| 768 × 1000 | 753 / 753 | Carrossel. Setas Anterior/Seguinte `display: flex`. Espaçador 100 px. |
| 920 × 1000 | 905 / 905 | Carrossel com setas. Desktop ausente. |
| 921 × 1000 | 906 / 906 | Desktop. Esquerda 500.4 px, direita 333.6 px. Mídia inferior em 572. Descrição y=604, antes do fim que a coluna direita teria se fosse mais alta. Direita termina em 380. Oito miniaturas e “Abrir galeria na foto 1”. Sem setas, bolinhas ou contador. Barra oculta. |
| 1024 × 1000 | 1009 / 1009 | Esquerda 562.2 px, direita 374.8 px. Oito miniaturas. Descrição y=622.2, mídia até 590.2. |
| 1440 × 1000 | 1425 / 1425 | Esquerda 628.8 px em x=176.5, direita 419.2 px. Oito miniaturas. Descrição y=688.8, mídia até 656.8. |

As 16 linhas escuras repetem a rota e a largura acima, com tema pedido escuro e tema observado claro.

## Casos adicionais

- Oito fotos: Addiesdive AD2554. Todas as miniaturas. Clique em Foto 2 deixa `aria-pressed` nela e muda o acionador para “Abrir galeria na foto 2”.
- Nove fotos: Curren 8455. Sete miniaturas e “Abrir galeria na foto 8, mais 2 fotos”. O clique abre a galeria em `8/9`. Escape devolve o foco a esse botão e ele permanece pressionado.
- Onze fotos: KEASO K002. “mais 4 fotos”. Preço `R$ 719,90`, “De R$ 799,90”, selo `−10%`. A linha vazia “Material do bisel” não aparece. “Seiko SKX” permanece na tabela. Sem cor e sem observações.
- Cinco fotos: Kit Seculus Cantil. Cinco miniaturas, sem +N. Desktop ordena Descrição, Observações (“Acompanha caixa de metal e cantil”), Características do produto.
- Uma, sete e doze fotos: não existem no catálogo publicado. Não foram renderizadas. Os JSONs não foram editados para criá-las.
- Título longo: em 320 px, “Addiesdive AD2554” e “Addiesdive MY-H3-2QZ” ocupam duas linhas e os cards ficam mais altos (204 contra 176) com a mesma foto 96 × 96. Na página, o título fica inteiro e sem overflow horizontal.
- Oferta alta: KEASO K002, maior preço do catálogo.
- Produto ausente: `/product/skmei-2126` mostra “Este relógio não está no catálogo.” e não entra na vitrine.
- Links de anúncio similar: nenhum valor `http` nos JSONs atuais. Nada a conferir na página.
- WhatsApp: os doze links da vitrine e os da página usam `wa.me` sem telefone e o texto “Olá, tenho interesse no {title}. {origin}/product/{slug}”. Pares do mesmo produto são iguais.

## Zoom, galeria, teclado e barra

Em 1440 × 1000, ponteiro no centro e nas bordas da foto principal do AD2554:

- Lente 160 × 213.3 px, fundo `rgb(0, 0, 0)`, opacidade 0.25, cursor `zoom-in`.
- No canto superior esquerdo a lente encosta em x=245.5, y=97, origem do stage. No canto inferior direito a borda da lente coincide com a borda do stage (right 804.3, bottom 655.8).
- Frame 320 × 426.7 px, escala 2×, `pointer-events: none`, x=816.3, dentro da janela (right 1136.3, bottom 523.7). A posição do frame não muda com o ponteiro.
- `pointerleave` remove lente e frame.
- Em 390 px o mesmo `pointermove` não cria lente nem frame.
- Foto natural 768 × 768. Nenhuma imagem nova foi gerada.

Galeria do AD2554 aberta na foto 2: diálogo `aria-modal`, contador `2/8`, `body` com `overflow: hidden`, ancestrais com `inert`, lente ausente. Escape fecha, o foco volta a “Abrir galeria na foto 2” e Foto 2 continua selecionada.

Teclado: a miniatura recebe foco no clique e tem nome acessível. Enter e Space emitidos pela ferramenta não trocaram a seleção. O evento não é confiável o bastante para concluir falha do botão nativo. O retorno de foco pelo Escape foi observado.

Barra no AD2554 a 1440 px: com o WhatsApp em y=336..380 e `intersectionRatio` 1, a barra some. Com scroll 346 e o alvo em y=-10..34, a barra aparece, o espaçador mede 100 px e o estilo inclui `padding-bottom: env(safe-area-inset-bottom)`. Voltar a scroll 0 oculta a barra.

Movimento reduzido em 390 px: `prefers-reduced-motion: reduce` e `carousel-track` com `transitionDuration` `0ms`.

## Limitações

- Tema escuro não é selecionável. A revisão pedida foi feita. O tema pintado foi o claro.
- Contagens 1, 7 e 12 fotos não existem no catálogo real.
- Enter/Space da automação não comprovam o acionamento por teclado. Nomes, foco e Escape foram observados.
- Não houve aparelho físico, pinch nem duplo toque. Essas regressões permanecem na suíte de 450 testes.
