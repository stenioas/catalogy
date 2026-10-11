# Galeria da página do produto

## Problem Statement

A foto do carrossel cabe num quadrado pequeno. Quem quer ver o relógio de perto não tem uma vista grande, nem zoom, nem um gesto que separe o toque de abrir do arraste de trocar a foto.

## Goals

- [ ] Um toque na foto abre a galeria nessa foto. Um arraste de 40px ou mais não abre.
- [ ] A galeria cobre a página, troca a foto, aproxima de 1× a 3× e fecha devolvendo o foco ao carrossel.
- [ ] A troca de foto do carrossel passa de 300ms para 200ms. A galeria usa 200ms na troca e no zoom.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Botões de +/− | O plano exclui. O zoom é pinça, roda com Ctrl e duplo toque. |
| Biblioteca de lightbox, gesto ou carrossel | O plano exclui dependência nova. |
| Zoom pela roda sem Ctrl | A roda sozinha não muda foto nem zoom. |
| Fechar arrastando na vertical | O plano exclui. |
| Entrada no histórico ou mudança de URL | Abrir e fechar não chama `pushState` nem `replaceState`. |
| Pontos do carrossel dentro da galeria | O badge e o texto ao vivo já indicam a foto. |
| Arquivo de imagem separado para o zoom | A galeria usa a mesma URL do carrossel. |
| Animação de abrir ou fechar | O modal aparece e some na hora. |
| Mudar o limiar de 40px ou a borracha do carrossel | Só a duração do carrossel muda, de 300ms para 200ms. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Passo da roda com Ctrl | `scale = clamp(scale - deltaY / 400, 1, 3)` | Um `deltaY` de −100, um notch comum, soma 0,25. O teste tem um número fechado. | y |
| Ponto do zoom | O elemento quadrado inteiro escala e translada. O ponto do ponteiro fica parado, limitado por `±L × (scale − 1) / 2`. | `object-contain` fica dentro desse quadrado. O teste não precisa medir o bitmap. | y |
| Chip | `color-mix(in srgb, var(--surface-black) 64%, transparent)` e texto `var(--body-on-dark)` | O botão circular do `DESIGN.md` usa cerca de 64% de alpha. O X, as setas e o badge usam o mesmo chip. | y |
| Borracha | A mesma fórmula do carrossel: `pull = sign(delta) × 56 × (1 − exp(−min(\|delta\|, 280) / 160))`, com `scaleX = 1 + \|pull\| / 56 × 0,08` | O plano manda copiar a borracha. Os números já estão em `carousel.tsx`. | y |
| Validação de entrada | Limites de zoom, toque e duplo toque estão nos critérios. | Não há formulário nem payload. | y |
| Falha ao carregar a foto | N/A | A URL é a mesma que o carrossel já mostra. O navegador trata a imagem quebrada. | y |
| Idempotência | N/A | Não há gravação. Um segundo toque com a galeria aberta cai na foto, que não fecha. | y |
| Autenticação e limite de taxa | N/A | Não há login nem API. | y |
| Concorrência | Dois ponteiros fazem pinça e não trocam a foto. | É o único ordenamento que muda o gesto. | y |
| Ciclo de dados | N/A | Nada é gravado nem expira. | y |
| Observabilidade | N/A | O plano não pede log nem métrica. | y |
| Dependência externa | N/A | Não entra biblioteca nova. A imagem é estática. | y |
| Lista vazia | N/A | A página só monta o carrossel com as fotos do produto. | y |

**Open questions:** none

---

## User Stories

### P1: Abrir e fechar ⭐ MVP

**User Story**: Como visitante, quero abrir a foto grande com um toque e fechar sem perder o lugar no carrossel.

**Why P1**: Sem abrir e fechar, o resto da galeria não existe.

**Acceptance Criteria**:

1. WHEN o visitante solta o ponteiro sobre a foto do carrossel com deslocamento menor que 40px THEN o sistema SHALL abrir a galeria nessa foto.
2. WHEN o visitante solta o ponteiro sobre a foto do carrossel com deslocamento de 40px ou mais THEN o sistema SHALL não abrir a galeria.
3. WHEN a galeria abre THEN o sistema SHALL mover o foco para o diálogo com nome acessível Galeria de fotos.
4. WHEN o visitante ativa o botão Fechar THEN o sistema SHALL fechar a galeria.
5. WHEN o visitante ativa o fundo preto THEN o sistema SHALL fechar a galeria.
6. WHEN o visitante pressiona Escape THEN o sistema SHALL fechar a galeria.
7. WHEN o visitante ativa a foto da galeria THEN o sistema SHALL manter a galeria aberta.
8. WHEN a galeria fecha THEN o sistema SHALL devolver o foco ao quadro do carrossel.
9. WHEN o carrossel tem uma foto THEN o quadro do carrossel SHALL expor `tabindex="-1"`.
10. WHILE a galeria está aberta o sistema SHALL impedir a rolagem da página.
11. WHILE a galeria está aberta o sistema SHALL deixar o carrossel atrás inerte a clique e a foco.
12. WHEN a galeria abre THEN o sistema SHALL manter a URL e `history.length`.
13. WHEN a galeria abre ou fecha THEN o sistema SHALL usar duração de transição 0ms no overlay.
14. WHEN o carrossel tem uma foto e a galeria fecha THEN o sistema SHALL devolver o foco ao quadro com `tabindex="-1"`.

**Independent Test**: Abrir com um toque curto, recusar um arraste de 40px, fechar por Fechar, pelo fundo e por Escape, e ver o foco de volta no quadro.

---

### P1: Cromo, badge e anúncio ⭐ MVP

**User Story**: Como visitante, quero saber qual foto estou vendo e achar o fechar e as setas no lugar certo da largura.

**Why P1**: O plano fecha o cromo junto com a abertura. Sozinho, o modal não se navega.

**Acceptance Criteria**:

1. The overlay da galeria SHALL usar fundo `rgb(0 0 0 / 80%)` e `backdrop-filter: saturate(180%) blur(20px)`.
2. The botão Fechar SHALL medir 44px, ser circular e usar o chip escuro translúcido com ícone branco.
3. WHEN a largura está abaixo de 768px THEN o botão Fechar SHALL ficar no canto superior esquerdo.
4. WHEN a largura é de 768px para cima THEN o botão Fechar SHALL ficar no canto superior direito.
5. The botões Anterior e Seguinte SHALL medir 44px, ser circulares, usar o mesmo chip e levar as classes `hidden` e `md:inline-flex`.
6. WHEN há uma foto THEN o sistema SHALL não renderizar Anterior nem Seguinte.
7. WHEN a foto atual é a primeira THEN o botão Anterior SHALL estar desabilitado.
8. WHEN a foto atual é a última THEN o botão Seguinte SHALL estar desabilitado.
9. The foto da galeria SHALL usar `object-contain` num quadro quadrado.
10. The badge SHALL mostrar `atual/total`, inclusive `1/1`, com `aria-hidden="true"`, no canto inferior direito da foto, em texto branco sobre o chip escuro.
11. WHEN a foto da galeria muda THEN o sistema SHALL escrever `Foto {n} de {total}` numa região `aria-live`.
12. The imagem atual da galeria SHALL usar o alt do produto.

**Independent Test**: Ver o fundo, o badge `1/1` e `3/13`, o texto ao vivo, e as classes que escondem as setas abaixo de 768px.

---

### P1: Trocar a foto ⭐ MVP

**User Story**: Como visitante, quero passar as fotos pelo teclado, pelas setas e pelo arraste, e ver a mesma foto no carrossel ao fechar.

**Why P1**: A galeria sem troca deixa o visitante numa foto só.

**Acceptance Criteria**:

1. WHEN o visitante pressiona ArrowRight e existe uma foto seguinte THEN o sistema SHALL mostrar a foto seguinte.
2. WHEN o visitante pressiona ArrowRight na última foto THEN o sistema SHALL manter a última foto.
3. WHEN o visitante pressiona ArrowLeft na primeira foto THEN o sistema SHALL manter a primeira foto.
4. WHEN há uma foto THEN ArrowLeft e ArrowRight SHALL manter essa foto.
5. The troca por teclado SHALL funcionar abaixo e acima de 768px.
6. WHEN a escala é 1× e o arraste horizontal passa de 40px THEN o sistema SHALL trocar a foto nessa direção.
7. WHEN a escala é 1× e o arraste está numa ponta THEN o sistema SHALL aplicar a borracha do carrossel e SHALL não trocar a foto.
8. WHEN a escala é 1× e o deslocamento horizontal fica abaixo de 40px THEN o sistema SHALL manter a foto e a galeria aberta.
9. WHILE a escala está acima de 1×, WHEN o visitante arrasta THEN o sistema SHALL deslocar a foto sem passar da borda do quadro.
10. WHILE a escala está acima de 1×, WHEN o visitante arrasta THEN o sistema SHALL manter o índice da foto.
11. WHEN a foto da galeria muda THEN o sistema SHALL zerar o zoom para escala 1 e translação 0.
12. WHEN a galeria muda a foto THEN o carrossel SHALL mostrar essa foto no mesmo turno, com `transition-duration` 0ms.

**Independent Test**: Trocar pela seta, pelo teclado e pelo arraste, ver a borracha na ponta, aproximar e confirmar que o arraste não troca a foto, e ver o carrossel já na foto nova.

---

### P1: Zoom ⭐ MVP

**User Story**: Como visitante, quero aproximar a foto com pinça, trackpad ou duplo toque, sem passar de 3×.

**Why P1**: A vista grande sem zoom não cumpre o plano.

**Acceptance Criteria**:

1. The escala da galeria SHALL permanecer no intervalo fechado de 1 a 3.
2. WHEN dois ponteiros fazem pinça THEN o sistema SHALL definir a escala como `clamp(escalaInicial × distância / distânciaInicial, 1, 3)` em direção ao ponto médio dos ponteiros.
3. WHEN a roda traz `ctrlKey` THEN o sistema SHALL definir a escala como `clamp(escala − deltaY / 400, 1, 3)` em direção ao ponteiro.
4. WHEN a roda não traz `ctrlKey` THEN o sistema SHALL manter a escala e o índice da foto.
5. WHEN um segundo toque ou clique chega em até 300ms e a menos de 40px do primeiro, com escala 1 THEN o sistema SHALL ir à escala 3 centrado nesse segundo ponto, sem passar da borda.
6. WHEN um segundo toque ou clique chega em até 300ms e a menos de 40px do primeiro, com escala acima de 1 THEN o sistema SHALL voltar à escala 1 e à translação 0.
7. IF o segundo toque passa de 300ms ou de 40px THEN o sistema SHALL manter a escala.
8. The soltura de ponteiro que abre a galeria SHALL não armar o cronômetro do duplo toque.
9. WHEN a pinça está ativa THEN o sistema SHALL não trocar a foto.
10. The galeria SHALL não renderizar botão de aumentar ou diminuir zoom.

**Independent Test**: Pinça e roda com Ctrl param em 1× e 3×, a roda sozinha não muda nada, e o duplo clique alterna 1× e 3×.

---

### P1: Duração de 200ms ⭐ MVP

**User Story**: Como visitante, quero a troca de foto e o zoom curtos, e imediatos quando peço menos movimento.

**Why P1**: O plano altera o carrossel que já existe, não só a galeria.

**Acceptance Criteria**:

1. WHEN `prefers-reduced-motion` não está ativo THEN a trilha do carrossel SHALL usar `transition-duration` 200ms.
2. WHEN `prefers-reduced-motion: reduce` está ativo THEN a trilha do carrossel SHALL usar `transition-duration` 0ms.
3. WHEN `prefers-reduced-motion` não está ativo THEN a troca de foto e o zoom da galeria SHALL usar `transition-duration` 200ms.
4. WHEN `prefers-reduced-motion: reduce` está ativo THEN a troca de foto e o zoom da galeria SHALL usar `transition-duration` 0ms.

**Independent Test**: Ler `transition-duration` da trilha do carrossel e da galeria com e sem `prefers-reduced-motion`.

---

## Edge Cases

- IF o arraste no carrossel tem 40px exatos THEN o sistema SHALL não abrir a galeria e SHALL não trocar a foto.
- IF o duplo toque mede 40px entre os pontos THEN o sistema SHALL manter a escala.
- IF o duplo toque mede 300ms exatos THEN o sistema SHALL aceitar o gesto.
- WHEN a galeria está na primeira ou na última foto e o arraste empurra para fora THEN o sistema SHALL mostrar a borracha e voltar à foto, com zoom inalterado se o índice não mudou.
- WHEN o zoom já está em 3 e a pinça ou a roda com Ctrl pede mais THEN o sistema SHALL permanecer em 3.
- WHEN o zoom já está em 1 e a pinça ou a roda com Ctrl pede menos THEN o sistema SHALL permanecer em 1.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| GAL-01 | P1: Abrir e fechar | Tasks (T4) | Done |
| GAL-02 | P1: Abrir e fechar | Tasks (T4) | Done |
| GAL-03 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-04 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-05 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-06 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-07 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-08 | P1: Abrir e fechar | Tasks (T4) | Done |
| GAL-09 | P1: Abrir e fechar | Tasks (T2) | Done |
| GAL-10 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-11 | P1: Abrir e fechar | Tasks (T4) | Done |
| GAL-12 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-13 | P1: Abrir e fechar | Tasks (T3) | Done |
| GAL-14 | P1: Abrir e fechar | Tasks (T4) | Done |
| GAL-15 | P1: Cromo, badge e anúncio | Tasks (T3) | Done |
| GAL-16 | P1: Cromo, badge e anúncio | Tasks (T3) | Done |
| GAL-17 | P1: Cromo, badge e anúncio | Tasks (T3) | Done |
| GAL-18 | P1: Cromo, badge e anúncio | Tasks (T3) | Done |
| GAL-19 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-20 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-21 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-22 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-23 | P1: Cromo, badge e anúncio | Tasks (T3) | Done |
| GAL-24 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-25 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-26 | P1: Cromo, badge e anúncio | Tasks (T5) | Done |
| GAL-27 | P1: Trocar a foto | Tasks (T5) | Done |
| GAL-28 | P1: Trocar a foto | Tasks (T5) | Done |
| GAL-29 | P1: Trocar a foto | Tasks (T5) | Done |
| GAL-30 | P1: Trocar a foto | Tasks (T5) | Done |
| GAL-31 | P1: Trocar a foto | Tasks (T5) | Done |
| GAL-32 | P1: Trocar a foto | Tasks (T7) | In Tasks |
| GAL-33 | P1: Trocar a foto | Tasks (T1, T7) | T1 done; T7 pending |
| GAL-34 | P1: Trocar a foto | Tasks (T7) | In Tasks |
| GAL-35 | P1: Trocar a foto | Tasks (T7) | In Tasks |
| GAL-36 | P1: Trocar a foto | Tasks (T7) | In Tasks |
| GAL-37 | P1: Trocar a foto | Tasks (T7) | In Tasks |
| GAL-38 | P1: Trocar a foto | Tasks (T6) | Done |
| GAL-39 | P1: Zoom | Tasks (T1, T8) | T1 done; T8 pending |
| GAL-40 | P1: Zoom | Tasks (T1, T8) | T1 done; T8 pending |
| GAL-41 | P1: Zoom | Tasks (T1, T8) | T1 done; T8 pending |
| GAL-42 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-43 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-44 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-45 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-46 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-47 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-48 | P1: Zoom | Tasks (T8) | In Tasks |
| GAL-49 | P1: Duração de 200ms | Tasks (T2) | Done |
| GAL-50 | P1: Duração de 200ms | Tasks (T2) | Done |
| GAL-51 | P1: Duração de 200ms | Tasks (T7) | In Tasks |
| GAL-52 | P1: Duração de 200ms | Tasks (T8) | In Tasks |

**Coverage:** 52 total, 52 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Um toque curto abre a galeria na foto atual. Um arraste de 40px não abre.
- [ ] Fechar, foco, badge, setas a partir de 768px, teclado, pinça, roda com Ctrl e duplo toque seguem os critérios GAL-01 a GAL-52.
- [ ] `pnpm test` cobre esses critérios no estilo do carrossel, e as asserções de 300ms passam a esperar 200ms.
