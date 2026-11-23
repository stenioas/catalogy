# Etiquetas Specification

## Problem Statement

Cada variante guarda a própria lista `offers`. A Black Friday está copiada em dezenas de produtos. Trocar ou encerrar a campanha exige editar um JSON por variante. Ofertas com regra, como desconto de 20%, não existem: o filtro de 20% é outra regra, fixa no código.

O dono do catálogo precisa ligar e desligar campanha e ofertas num único cadastro. O visitante vê a campanha e as ofertas no card e na página, e filtra por elas.

## Goals

- [ ] Ligar, desligar ou trocar a campanha altera um arquivo e vale para todo o catálogo
- [ ] Uma oferta de desconto de 20% aparece sozinha na linha de ofertas quando o desconto atinge 20%
- [ ] Anúncio e variante conseguem desligar uma etiqueta sem apagá-la do cadastro
- [ ] Sob encomenda não mostra campanha nem oferta

## Out of Scope

| Feature | Reason |
| --- | --- |
| Gatilho de última peça | O plano deixa o gatilho para outra entrega. O único gatilho desta entrega é `discount-at-least`. |
| Texto longo da tarja diferente de "Black Friday" | O campo `text` existe. O valor inicial repete o `shortText`. |
| Novas categorias além de `discount` | O modelo aceita categoria, mas o cadastro inicial só traz `discount`. |
| Posição fixa da tarja durante o scroll | A tarja fica no fluxo da página, entre a barra do topo e o carrossel. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Arquivo de cadastro | `client/public/catalog/labels.json`, validado e embutido no módulo gerado do catálogo | O build já lê o catálogo. O cliente não busca outro arquivo e não executa função. | y |
| Nome do texto visível da oferta | `text` | Campanha e oferta compartilham o nome do texto da badge. A campanha acrescenta `shortText`. | y |
| Desligamento | `disabledLabels` com lista de ids no anúncio e na variante | Um objeto `{ id, enabled: false }` não acrescenta comportamento. | y |
| Empate de prioridade | A carga falha. Não há desempate em runtime. | Decisão do dono do catálogo. | y |
| Prioridade vencedora | O menor número ganha dentro da categoria | Definido no desenho da oferta. | y |
| Desconto | `(listPrice - price) / listPrice` com preços já truncados. 20% entra. Abaixo de 20% fica de fora. Sem `price` ou sem `listPrice`, o gatilho é falso. | É a mesma conta do filtro atual de 20%. | y |
| `percent` | Número maior que 0 e menor ou igual a 100 | Fora disso o gatilho não é uma porcentagem de desconto. | y |
| Ordem das ofertas no card e na página | A ordem em que as categorias vencedoras aparecem em `labels.json` | O plano não fixou outra ordem. | y |
| Pílula da campanha | Usa `shortText` | A pílula tem o mesmo espaço curto da badge. A tarja usa `text`. | y |
| Abaixo de 768px | A tarja tem a altura e a fonte da badge e cola no carrossel, sem os 8px do desktop | A regra dos 8px existe para ocupar o padding de 32px, que só vale a partir de 768px. | y |
| Tarja no desktop | 24px de altura, fonte `text-sm`, 8px até a foto | 24px mais 8px ocupam os 32px atuais. A foto não desce. | y |
| Cores e ícone iniciais | `Gift`, fundo `#000000`, cor `#FFFFFF` nas duas etiquetas | É o par já usado na badge Black Friday. | y |
| Ids iniciais | Campanha `black-friday`. Oferta `discount-20`. | A query de filtro usa esses ids. | y |
| `unmissableOffer: true` na ponte legada | Não grava mais `offers` | A campanha global cobre a Black Friday. | y |
| Filtro desconhecido na URL | Continua caindo em Todos, sem mudar a query | Comportamento já documentado dos filtros atuais. | y |
| Idempotência, autenticação, concorrência, expiração e telemetria | N/A: o catálogo é estático, a resolução é pura e a falha é a carga interrompida com erro | Não há escrita, sessão, corrida nem prazo. | y |

**Open questions:** none.

---

## User Stories

### P1: Cadastro global ⭐ MVP

**User Story**: Como dono do catálogo, quero cadastrar campanhas e ofertas num arquivo só, para ligar e desligar uma promoção sem editar cada variante.

**Why P1**: Sem o cadastro, o restante da entrega não tem o que resolver.

**Acceptance Criteria**:

1. The catálogo SHALL ler as etiquetas de `client/public/catalog/labels.json` durante o build e embuti-las no módulo gerado.
2. The catálogo SHALL rejeitar a carga quando dois ids de etiqueta são iguais.
3. The catálogo SHALL rejeitar a carga quando mais de uma campanha está com `enabled: true`.
4. The catálogo SHALL aceitar várias campanhas desligadas no mesmo arquivo.
5. The catálogo SHALL rejeitar a carga quando duas ofertas da mesma `category` têm a mesma `priority`, estejam ligadas ou desligadas.
6. IF o `trigger.kind` não é `discount-at-least` THEN the catálogo SHALL rejeitar a carga.
7. IF `trigger.percent` não é um número maior que 0 e menor ou igual a 100 THEN the catálogo SHALL rejeitar a carga.
8. IF `text`, `shortText` ou `icon` está vazio, ou o ícone não tem import dinâmico no Lucide, THEN the catálogo SHALL rejeitar a carga.
9. IF `disabledLabels` de um anúncio ou de uma variante cita um id ausente de `labels.json` THEN the catálogo SHALL rejeitar a carga.
10. The cadastro inicial SHALL conter a campanha `black-friday` e a oferta `discount-20`, ambas com `enabled: true` e `filterable: true`, ícone `Gift`, fundo `#000000` e cor `#FFFFFF`.
11. The campanha `black-friday` SHALL ter `text` e `shortText` iguais a `Black Friday`.
12. The oferta `discount-20` SHALL ter categoria `discount`, prioridade `1`, texto `acima 20%` e gatilho `discount-at-least` com `percent` 20.
13. The produtos publicados SHALL omitir `offers` em toda variante.
14. WHEN a ponte legada recebe `unmissableOffer: true` THEN the catálogo SHALL omitir `offers` na variante migrada.

**Independent Test**: Subir um `labels.json` inválido falha o build. O arquivo inicial válido gera as duas etiquetas, e nenhum `product.json` publicado contém `offers`.

---

### P1: Resolução por variante ⭐ MVP

**User Story**: Como dono do catálogo, quero que cada variante receba só a campanha vigente e uma oferta por categoria, para a badge refletir a regra e não uma lista copiada.

**Why P1**: Card, página e filtro leem o resultado desta resolução.

**Acceptance Criteria**:

1. WHILE a disponibilidade efetiva da variante é `on_order`, the resolução SHALL devolver campanha vazia e ofertas vazias.
2. The resolução SHALL partir só das etiquetas com `enabled: true`.
3. WHEN o anúncio lista um id em `disabledLabels` THEN the resolução SHALL omitir essa etiqueta em todas as variantes daquele anúncio.
4. WHEN a variante lista um id em `disabledLabels` THEN the resolução SHALL omitir essa etiqueta só nessa variante.
5. The resolução SHALL devolver no máximo uma campanha.
6. WHEN várias ofertas da mesma categoria têm gatilho verdadeiro THEN the resolução SHALL devolver só a de menor `priority`.
7. WHEN `price` é 80 e `listPrice` é 100 THEN the gatilho `discount-at-least` com `percent` 20 SHALL ser verdadeiro.
8. WHEN `price` é 80.1 e `listPrice` é 100 THEN the gatilho `discount-at-least` com `percent` 20 SHALL ser falso.
9. IF a variante não tem `price` ou não tem `listPrice` THEN the gatilho `discount-at-least` SHALL ser falso.
10. The ofertas devolvidas SHALL seguir a ordem em que suas categorias aparecem em `labels.json`.

**Independent Test**: Uma variante com 35% de desconto, três ofertas de desconto elegíveis e um opt-out no anúncio devolve uma campanha e uma oferta. A mesma variante `on_order` devolve as duas vazias.

---

### P1: Campanha e ofertas na tela ⭐ MVP

**User Story**: Como visitante, quero ver a campanha na foto e a oferta acima do preço, para reconhecer a promoção sem abrir outro lugar.

**Why P1**: É a parte visível do cadastro.

**Acceptance Criteria**:

1. WHEN a variante do card tem campanha resolvida THEN the card SHALL mostrar uma badge no canto inferior esquerdo da foto com o `shortText`, altura `h-5` e fonte `text-xs`.
2. WHEN a variante do card tem ofertas resolvidas e não está sob encomenda THEN the card SHALL mostrar a linha de ofertas acima do preço, cada uma com o seu `text`.
3. WHILE a variante do card está sob encomenda, the card SHALL omitir a badge da campanha e a linha de ofertas.
4. WHEN a página do relógio tem campanha resolvida THEN the página SHALL mostrar uma tarja entre a barra do topo e o carrossel, na largura da janela, com o `text` da campanha.
5. WHILE a largura da janela é menor que 768px e a tarja está visível, the tarja SHALL usar a altura e a fonte da badge.
6. WHILE a largura da janela é de pelo menos 768px e a tarja está visível, the tarja SHALL ter 24px de altura, fonte `text-sm`, e 8px entre a tarja e a foto.
7. WHILE a largura da janela é de pelo menos 768px e não há campanha, the coluna da página SHALL manter 32px de padding acima da foto.
8. WHEN a página tem ofertas resolvidas THEN the página SHALL mostrar a linha de ofertas acima do preço e a mesma linha na barra fixa.
9. The barra fixa SHALL omitir a campanha.
10. WHILE a página está sob encomenda, the página SHALL omitir a tarja, a linha de ofertas e as ofertas da barra fixa.

**Independent Test**: Um relógio em estoque com as duas etiquetas mostra `Black Friday` na foto e na tarja, e `acima 20%` acima do preço e na barra fixa. O mesmo relógio sob encomenda não mostra nenhum dos dois.

---

### P1: Filtro pelas etiquetas ⭐ MVP

**User Story**: Como visitante, quero filtrar pela campanha e pela oferta, para ver só o que está na promoção.

**Why P1**: O cadastro já tem `filterable` e o filtro de 20% deixa de ser fixo.

**Acceptance Criteria**:

1. The fileira de filtros SHALL mostrar, nesta ordem, Todos, cada etiqueta com `enabled: true` e `filterable: true` na ordem de `labels.json`, Feminino, Masculino, Novos, Openbox e Usados.
2. The pílula da campanha SHALL usar o `shortText`.
3. The pílula da oferta SHALL usar o `text`.
4. The fileira SHALL omitir a pílula fixa `20%+ de desconto`.
5. WHEN a query é `filter=black-friday` THEN the vitrine SHALL listar só cards cuja campanha resolvida é `black-friday`.
6. WHEN a query é `filter=discount-20` THEN the vitrine SHALL listar só cards em que `discount-20` é a oferta vencedora.
7. The card do filtro SHALL ser a variante mais barata entre as que passam naquele filtro.
8. WHEN uma pílula de etiqueta não tem card THEN the pílula SHALL ficar desabilitada.
9. IF a query traz um filtro desconhecido THEN the vitrine SHALL mostrar Todos pressionado, listar os cards de Todos e manter a query.
10. The README do catálogo SHALL descrever essa fileira e SHALL deixar de documentar `offers` por variante como origem da badge.

**Independent Test**: Com o cadastro inicial, a fileira começa com Todos, Black Friday e acima 20%. `?filter=discount-20` mostra só variantes com desconto de pelo menos 20% que não estão sob encomenda.

---

## Edge Cases

- IF duas campanhas estão ligadas THEN the carga SHALL falhar antes de publicar o catálogo.
- IF a prioridade 1 aparece duas vezes na categoria `discount` THEN the carga SHALL falhar mesmo com uma das ofertas desligada.
- WHEN o desconto é exatamente 20% THEN the oferta `discount-20` SHALL entrar.
- WHEN o desconto é 19,99% após o truncamento THEN the oferta `discount-20` SHALL ficar de fora.
- WHEN a variante está sob encomenda e teria campanha e desconto THEN the card, a página e a barra fixa SHALL omitir as duas.
- WHEN o anúncio desliga `black-friday` e a variante não desliga nada THEN the variante SHALL ficar sem campanha e ainda pode receber `discount-20`.
- WHERE `filterable` é `false` the etiqueta SHALL continuar apta a aparecer na tela e SHALL não ganhar pílula.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| LBL-01 | P1: Cadastro global | Phase 2 | Done |
| LBL-02 | P1: Cadastro global | Phase 1 | Done |
| LBL-03 | P1: Cadastro global | Phase 1 | Done |
| LBL-04 | P1: Cadastro global | Phase 1 | Done |
| LBL-05 | P1: Cadastro global | Phase 1 | Done |
| LBL-06 | P1: Cadastro global | Phase 1 | Done |
| LBL-07 | P1: Cadastro global | Phase 1 | Done |
| LBL-08 | P1: Cadastro global | Phase 1 | Done |
| LBL-09 | P1: Cadastro global | Phase 2 | Done |
| LBL-10 | P1: Cadastro global | Phase 2 | Done |
| LBL-11 | P1: Cadastro global | Phase 2 | Done |
| LBL-12 | P1: Cadastro global | Phase 2 | Done |
| LBL-13 | P1: Cadastro global | Phase 2 | Done |
| LBL-14 | P1: Cadastro global | Phase 2 | Done |
| LBL-15 | P1: Resolução por variante | Phase 1 | Done |
| LBL-16 | P1: Resolução por variante | Phase 1 | Done |
| LBL-17 | P1: Resolução por variante | Phase 1 | Done |
| LBL-18 | P1: Resolução por variante | Phase 1 | Done |
| LBL-19 | P1: Resolução por variante | Phase 1 | Done |
| LBL-20 | P1: Resolução por variante | Phase 1 | Done |
| LBL-21 | P1: Resolução por variante | Phase 1 | Done |
| LBL-22 | P1: Resolução por variante | Phase 1 | Done |
| LBL-23 | P1: Resolução por variante | Phase 1 | Done |
| LBL-24 | P1: Resolução por variante | Phase 1 | Done |
| LBL-25 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-26 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-27 | P1: Campanha e ofertas na tela | Phase 3 | In Tasks |
| LBL-28 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-29 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-30 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-31 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-32 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-33 | P1: Campanha e ofertas na tela | Tasks | In Tasks |
| LBL-34 | P1: Campanha e ofertas na tela | Phase 3 | In Tasks |
| LBL-35 | P1: Filtro pelas etiquetas | Tasks | In Tasks |
| LBL-36 | P1: Filtro pelas etiquetas | Tasks | In Tasks |
| LBL-37 | P1: Filtro pelas etiquetas | Tasks | In Tasks |
| LBL-38 | P1: Filtro pelas etiquetas | Tasks | In Tasks |
| LBL-39 | P1: Filtro pelas etiquetas | Phase 3 | Done |
| LBL-40 | P1: Filtro pelas etiquetas | Phase 3 | Done |
| LBL-41 | P1: Filtro pelas etiquetas | Phase 3 | Done |
| LBL-42 | P1: Filtro pelas etiquetas | Tasks | In Tasks |
| LBL-43 | P1: Filtro pelas etiquetas | Phase 3 | Done |
| LBL-44 | P1: Filtro pelas etiquetas | Tasks | In Tasks |

**Coverage:** 44 total, 44 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Editar `labels.json` muda a campanha e a oferta de 20% em todo o catálogo, sem `offers` nas variantes
- [ ] Card, página e barra fixa mostram `shortText` na badge, `text` na tarja e `acima 20%` na linha de ofertas
- [ ] Sob encomenda não mostra etiqueta
- [ ] A fileira de filtros começa com Todos, Black Friday e acima 20%
