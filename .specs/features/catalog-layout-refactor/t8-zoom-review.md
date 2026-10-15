# T8 HoverZoom verification

PASS para o componente isolado. A integração de DesktopProductMedia/ProductMedia permanece em T9/T11; a revisão transversal permanece em T16.

## Browser evidence

Rota temporária legítima `http://localhost:5173/t8-harness.html`, servida pelo Vite. O harness importou o HoverZoom real, o CSS do projeto e a foto existente `/catalog/products/addiesdive-ad2554/img/addiesdive-1.png`. Palco de 400 × 400 px dentro de pai com `overflow: hidden`, oferta de referência irmã à direita e altura de página suficiente para scroll. Nenhum produto ou arquivo de foto foi alterado. HTML/TSX temporários foram removidos antes do commit.

Tema observado: light, conforme baseline do projeto. Capturas foram exibidas na conversa pelo CUA, sem PNG local, conforme autorização do operador. As primeiras tentativas de entrada na aba original retornaram timeout; uma aba temporária do mesmo navegador permitiu mouse e scroll. A aba foi fechada e o viewport restaurado; a aba original voltou à vitrine.

| Viewport/interação | Medidas observadas em CSS px | Resultado |
| --- | --- | --- |
| 921 × 600, centro | Palco `(24,113.96875,400,400)`; lente `(144,207.328125,160,213.328125)`; frame `(436,113.96875,320,426.65625)` | Captura mostra mesma região do mostrador, ampliada uniformemente, fora do pai com clipping e sobre a oferta; frame inteiramente na janela. |
| 1024 × 800, canto superior esquerdo | Lente `(24,113.96875,160,213.328125)`; frame começa em x436, 12 px à direita do palco | Lente limitada ao início da imagem; nenhum deslocamento da oferta. |
| 1024 × 800, canto inferior direito | Lente `(264,300.625,160,213.328125)`; direita424 e base513.953125, base da foto513.96875 | Clamp correto dentro da foto, diferença de rasterização abaixo de 1 px. |
| 1440 × 800, centro | Frame `(436,113.96875,320,426.65625)`; scrollWidth 1425 | Frame contido; sem rolagem horizontal. |
| 1440 × 800, scrollY 160 | Palco y=-46.03125; lente y 140.625, base 353.953125; frame y12, base 438.65625 | Captura mostra recorte inferior correspondente à lente; frame acompanha scroll sem clipping e respeita margem 12. |
| 920 × 800 após resize | 0 elementos de lente/frame | Zoom desativado abaixo do breakpoint. |

A translação central observada foi `translate(-240px, -186.729px)` com foto ampliada 800 × 800; o segundo eixo corresponde ao ponteiro y 314 e topo fracionário 113.96875. O palco/offer permaneceram nas mesmas coordenadas com zoom ativo. Todas as fotos existentes são quadradas; horizontais/verticais são verificadas com dimensões naturais controladas na integração e pelos 29 casos geométricos de T7. A revisão final permanece responsável pelas combinações completas de rota/tema/fotos.

## Runtime review

`hover-zoom.tsx:15-17` mantém dimensões, ponteiro e RAF em refs; `:45-46` admite somente um RAF pendente. `:37-43` calcula geometria a partir do retângulo atual no RAF. O estado pertence exclusivamente a HoverZoom, sem callback de movimento ao pai nem estado de oferta/página. `:64-87` invalida dimensões na troca e limpa listeners/RAF; eventos load/error impedem recorte com medidas antigas. As duas leituras adicionais do palco na renderização da lente ocorrem apenas no componente local após o RAF; não exigiram alteração para cumprir T8. Não houve refatoração especulativa.

O portal em document.body com position fixed e pointer-events none usa superfície/borda existentes e z-40, abaixo da Gallery. Lente usa surface-black/0.25. Detector Impeccable: `[]`.

## Authorized numeric oracle corrections

O gate anterior tinha 3 falhas: serialização de 186.66666666666669 em vez de 186.66666666666666; top 100.00000000000003 em vez de100; e expectativa de scroll 193.3333 em vez de186.6667. A primeira repetição expôs também height 199.99999999999997 em vez de200. As comparações fracionárias usam `toBeCloseTo(...,3)` (precisão 0,001 px, mais rigorosa que 1 px do design), preservando formato `translate`, sinais, escala e valores derivados do design. Para scroll, lente clamped global y 86.6667 menos palco y -100 resulta em local 186.6667. Nenhum AC, cenário ou contrato foi reduzido; 14 cenários permanecem ativos.
