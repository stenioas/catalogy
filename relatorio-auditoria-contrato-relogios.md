# Relatório de auditoria do contrato de relógio

Data da auditoria inicial: **16/11/2026**. Última varredura completa: **17/11/2026**, após os ajustes do Addiesdive MY-H3-C, Aimimo Design Air King, Aimimo Design Daytona e Cadisen C7068. Base normativa: [docs/contrato-relogio.md](docs/contrato-relogio.md).

Nesta atualização, os 43 cadastros foram revalidados. As contagens e tabelas refletem os arquivos locais atuais, incluindo os quatro relógios alterados.

## Resultado

**1 relógio quebra o contrato:** Pagani Design PD-1701, por uma variante que referencia um valor de eixo inexistente. **Nenhum relógio tem item de especificação inválido.** Há ausências de preenchimento, mas o contrato torna `specifications` opcional e não exige nenhum dos 19 rótulos individualmente.

| Indicador | Resultado |
| --- | ---: |
| Arquivos product.json auditados | 43 |
| Relógios, incluindo kits com relógio | 41 |
| Acessórios sem relógio | 2 |
| Anúncios de todo o catálogo | 64 |
| Variantes de todo o catálogo | 241 |
| Produtos com violação | 1 |
| Relógios sem violação encontrada | 40 |
| Itens de especificação de todo o catálogo | 583 |
| Itens de especificação nos relógios | 580 |
| Itens de especificação inválidos | 0 |
| Referências a imagens conferidas (inclui repetições entre anúncios) | 1289 |
| Ofertas conferidas | 32 |

## Escopo e método

Foram lidos todos os `client/public/catalog/products/*/product.json`, incluindo anúncios ocultos, sob encomenda, disponíveis e em breve. Nenhuma pasta de produto ficou sem `product.json`. Os kits Seculus e Tomi foram incluídos como relógios; a pochete e o porta-cartões foram separados como acessórios.

A auditoria executou o `ProductSchema.safeParse` real de [shared/src/schemas/product.ts](shared/src/schemas/product.ts) sobre o JSON original de cada arquivo, sem normalização legada. Complementou essa validação com comparação entre slug e pasta, existência física das imagens e verificação dos exports e imports dinâmicos dos ícones Lucide instalados, conforme [client/scripts/catalog.ts](client/scripts/catalog.ts). Rótulos, valores vazios e duplicidades de especificação também foram percorridos diretamente, para não depender da execução dos refinamentos do schema em objetos já inválidos.

As ausências consideram a ficha efetiva de cada anúncio: especificações do produto mais as do próprio anúncio. Neste levantamento, nenhum anúncio possui especificações próprias; por isso, a lista de ausências é igual em todos os anúncios de cada produto. Texto em `description` ou em `info.md` não conta como item estruturado de especificação.

A conferência trata da conformidade dos arquivos com o contrato. Não verifica a veracidade das características físicas junto a fabricantes, vendedores ou fontes externas. `info.md`, existência de miniaturas e arquivos de mídia não citados não são exigências desse contrato.

## Violação confirmada

### Pagani Design PD-1701 — Pagani Design Speedmaster Moonwatch

- Arquivo: [product.json](client/public/catalog/products/pagani-design-pd-1701/product.json), linha **198**.
- Anúncio: `listing-varias-cores` (`listings[0]`), primeira variante (`variants[0]`).
- Caminho exato: `listings[0].variants[0].axes[0].valueId`.
- Valor encontrado: `"varias-cores"`, associado ao eixo `color`.
- Problema: `axes[0].values` declara 14 cores, mas nenhuma tem `id: "varias-cores"`.
- Regra: a variante precisa escolher um valor declarado para cada eixo do produto.
- Erro retornado pelo schema: `variant references an axis value the product does not declare`.
- Impacto: o produto é rejeitado pelo `ProductSchema`. O carregador pode deixá-lo passar, pois não aplica o schema; o valor não tem correspondência no seletor de cores.
- Correção sugerida: identificar a cor real dessa variante e usar seu ID declarado, ou remover a variante genérica caso ela não represente uma combinação real. Declarar um valor adicional só é adequado se ele for uma opção de seleção intencional. É necessário decidir com base no cadastro; a auditoria não escolhe uma cor por suposição.

Não foram encontradas outras violações nos 43 produtos. Os arquivos de cadastro não foram alterados.

## Itens de especificação que quebram o contrato

| Verificação | Ocorrências |
| --- | ---: |
| Rótulo fora dos 19 permitidos | 0 |
| Uso de Estado ou Público-alvo como especificação | 0 |
| Valor vazio ou composto só de espaços | 0 |
| Rótulo repetido na mesma ficha | 0 |
| Rótulo repetido entre produto e anúncio | 0 |
| Item sem label/value válido | 0 |

Todos os 583 itens cadastrados usam rótulos aceitos e valores textuais com conteúdo. Destes, 580 pertencem aos relógios e 3 aos acessórios. Não há item inválido de especificação para listar por relógio.

## Atualização de 16/11/2026 — Addiesdive AD2035 e Steelflier SF741

Os dois cadastros passaram novamente pelo `ProductSchema`. As imagens citadas e os exports e imports dinâmicos dos ícones das ofertas foram conferidos. Nenhuma violação foi encontrada nesses relógios; ambos possuem os 19 rótulos de especificação preenchidos.

### Addiesdive AD2035

- Foram acrescentados `Material do bisel` (aço inoxidável 316L), `Coroa` (rosqueada), `Tampa inferior` (rosqueada), `Tamanho da caixa` (48,5 mm) e `Diâmetro do mostrador` (39 mm). A ficha passou de 14 para 19 especificações.
- O eixo de cor passou de `cor` para `color`, com as referências das variantes atualizadas. O anúncio sob encomenda passou a se chamar `listing-on-order`.
- Foi acrescentado o anúncio `listing-available`, com `state: "used"`, `availabilityStatus: "available"`, preço de R$ 499,90, `listPrice` de R$ 689,90 e oferta Black Friday. O anúncio cita 23 imagens existentes e possui uma variante válida.

### Steelflier SF741

- Em relação à auditoria inicial, foram acrescentados `Material do bisel` (aço inoxidável 316L), `Coroa` (rosqueada), `Tampa inferior` (rosqueada), `Diâmetro do mostrador` (39 mm) e, neste último ajuste, `Tamanho da caixa` (48 mm). A ficha passou de 14 para 19 especificações.
- O material da pulseira especifica aço inoxidável 316L nas variantes correspondentes.
- O anúncio disponível permanece como `listing-available`, com `state: "openbox"`, `availabilityStatus: "available"`, preço de R$ 499,90, `listPrice` de R$ 629,90 e observação de abertura para inspeção e teste, sem uso.

Em relação à versão anterior do relatório, as ausências consolidadas caíram de 228 para 222, e as especificações cadastradas passaram de 554 para 560. O novo anúncio do Addiesdive acrescentou um anúncio, uma variante, 23 referências a imagens e uma oferta.

## Atualização de 17/11/2026 — Addiesdive AD2554 e MY-H3-2QZ

Os dois cadastros passaram pelo `ProductSchema`. As imagens citadas e os exports e imports dinâmicos dos ícones das ofertas foram conferidos. Nenhuma violação foi encontrada nesses relógios.

- **Addiesdive AD2554 (Ranger):** foram acrescentados `Material do bisel` (aço inoxidável 316L), `Coroa` (rosqueada), `Tampa inferior` (rosqueada) e `Tamanho da caixa` (46 mm). A ficha passou de 15 para 19 especificações, sem rótulos ausentes.
- **Addiesdive MY-H3-2QZ (Submariner Date):** foram acrescentados `Coroa` (rosqueada), `Tampa inferior` (rosqueada) e `Tamanho da caixa` (48 mm). A ficha passou de 16 para 19 especificações, sem rótulos ausentes.
- As ausências consolidadas caíram de 222 para 215. As especificações cadastradas passaram de 560 para 567. As quantidades de anúncios, variantes, referências a imagens e ofertas permaneceram iguais.

## Última atualização de 17/11/2026 — quatro relógios

Os quatro cadastros passaram pelo `ProductSchema`, com imagens e ícones das ofertas válidos. A varredura completa confirmou que não foram introduzidas novas violações no catálogo.

| Relógio | Ajuste | Especificações preenchidas | Ausentes |
| --- | --- | ---: | --- |
| Addiesdive MY-H3-C | Acrescentados Funções, Movimento (Miyota 2115), Coroa, Tampa inferior e Tamanho da caixa (48 mm) | 18 | Diâmetro do mostrador |
| Aimimo Design Air King | Acrescentados Material do bisel e Tampa inferior; Coroa alterada para Rosqueada, sem duplicação do rótulo | 19 | Nenhuma |
| Aimimo Design Daytona | Acrescentados Material do bisel, Coroa, Tampa inferior e Tamanho da caixa (48 mm); Homage de reposicionado | 19 | Nenhuma |
| Cadisen C7068 | Título alterado para Cadisen Cronógrafo Titânio; acrescentados Homage de (Formex), Material do bisel (titânio), Coroa, Tampa inferior e Tamanho da caixa (49 mm) | 19 | Nenhuma |

As ausências caíram de 215 para 199 e as especificações cadastradas passaram de 567 para 583. Permaneceram 64 anúncios, 241 variantes, 1.289 referências a imagens e 32 ofertas. Sete relógios possuem os 19 rótulos preenchidos. A única violação contratual continua sendo a referência `varias-cores` do Pagani Design PD-1701.

## Especificações ausentes por relógio

**Estas são lacunas de preenchimento, não violações contratuais.** O contrato permite omitir especificações. Campos como `Homage de`, `Movimento`, `Material do bisel`, `Coroa` e `Tampa inferior` podem não se aplicar ou não ter informação disponível. Ausência não significa que a característica física não existe.

São **199 ausências de rótulos** distribuídas por 34 dos 41 relógios; sete possuem os 19 rótulos preenchidos.

| Relógio / arquivo | Título | Especificações ausentes |
| --- | --- | --- |
| [addiesdive-ad2035](client/public/catalog/products/addiesdive-ad2035/product.json) | Addiesdive Black Bay Pro GMT | Nenhuma |
| [addiesdive-ad2554](client/public/catalog/products/addiesdive-ad2554/product.json) | Addiesdive Ranger | Nenhuma |
| [addiesdive-my-h3-2qz](client/public/catalog/products/addiesdive-my-h3-2qz/product.json) | Addiesdive Submariner Date | Nenhuma |
| [addiesdive-my-h3-c](client/public/catalog/products/addiesdive-my-h3-c/product.json) | Addiesdive Yacht Master | Diâmetro do mostrador |
| [aimimo-design-air-king](client/public/catalog/products/aimimo-design-air-king/product.json) | Aimimo Design Air King | Nenhuma |
| [aimimo-design-daytona](client/public/catalog/products/aimimo-design-daytona/product.json) | Aimimo Design Daytona | Nenhuma |
| [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json) | Aimimo Design Pilot Vintage | Modelo; Homage de; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [aimimo-design-tsuyosa](client/public/catalog/products/aimimo-design-tsuyosa/product.json) | Relógio Aimimo Design Tsuyosa | Material do bisel |
| [benyar-5229](client/public/catalog/products/benyar-5229/product.json) | Benyar Cronógrafo | Homage de; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [cadisen-c7068](client/public/catalog/products/cadisen-c7068/product.json) | Cadisen Cronógrafo Titânio | Nenhuma |
| [curren-8106](client/public/catalog/products/curren-8106/product.json) | Curren Casual com Calendário | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-8361](client/public/catalog/products/curren-8361/product.json) | Curren Cronógrafo Esportivo | Homage de; Tipo do relógio; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-8455](client/public/catalog/products/curren-8455/product.json) | Curren Casual | Homage de; Funções; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-8498l](client/public/catalog/products/curren-8498l/product.json) | Curren com Calendário | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-8499](client/public/catalog/products/curren-8499/product.json) | Curren OAK Cronógrafo Esportivo | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-9007](client/public/catalog/products/curren-9007/product.json) | Curren Casual Feminino | Homage de; Tipo do relógio; Funções; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-9093](client/public/catalog/products/curren-9093/product.json) | Relógio Curren Feminino Casual | Homage de; Funções; Movimento; Material do bisel; Largura da pulseira; Tamanho da caixa; Coroa; Tampa inferior |
| [curren-9096](client/public/catalog/products/curren-9096/product.json) | Curren Blanche com Strass | Homage de; Funções; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [keaso-k002](client/public/catalog/products/keaso-k002/product.json) | Keaso SKX 5 Sports | Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json) | Relógio Naviforce Richard Mille | Homage de; Movimento; Material do bisel; Largura da pulseira; Tamanho da caixa; Coroa; Tampa inferior; Diâmetro do mostrador |
| [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json) | North Edge Abyss Solar | Homage de; Movimento; Tamanho da caixa; Coroa; Tampa inferior |
| [opk-6003](client/public/catalog/products/opk-6003/product.json) | OPK Social Clássico | Homage de; Movimento; Material da pulseira; Material do vidro; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json) | Pagani Design Speedmaster Moonwatch | Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-682](client/public/catalog/products/poedagar-682/product.json) | Poedagar Capitão Willard | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-786](client/public/catalog/products/poedagar-786/product.json) | Poedagar PRX Feminino | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-834](client/public/catalog/products/poedagar-834/product.json) | Poedagar Nautilus Cronógrafo | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-910](client/public/catalog/products/poedagar-910/product.json) | Poedagar Datejust | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json) | Poedagar PRX Cronógrafo | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json) | Relógio Qingxiya Speedmaster Moonwatch | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json) | Rollstimi Datejust Automático | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json) | Relógio SAPPHERO Clássico | Homage de; Material do vidro; Resistência à água; Tamanho da caixa; Coroa; Tampa inferior |
| [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json) | Relógio Sapphero Social | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json) | Kit Relógio + Cantil Seculus Navy Azul | Homage de; Funções; Movimento; Largura da pulseira; Tamanho da caixa; Coroa; Tampa inferior; Espessura da caixa |
| [skmei-1628](client/public/catalog/products/skmei-1628/product.json) | Relógio Skmei DW-5600 | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [skmei-1988](client/public/catalog/products/skmei-1988/product.json) | Relógio SKMEI Digital Esportivo | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [skmei-2126](client/public/catalog/products/skmei-2126/product.json) | Skmei Digital | Homage de; Funções; Movimento; Coroa; Tampa inferior |
| [steelflier-sf741](client/public/catalog/products/steelflier-sf741/product.json) | Steelflier Khaki Field Pioneer | Nenhuma |
| [tomi-t301](client/public/catalog/products/tomi-t301/product.json) | Kit Presente Tomi | Homage de; Tipo do relógio; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) | Relógio TPW Piloto Vintage | Homage de; Movimento; Material da pulseira; Material do bisel; Resistência à água; Tamanho da caixa; Coroa; Tampa inferior; Diâmetro do mostrador |
| [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json) | Relógio TPW de Campo | Homage de; Movimento; Material do bisel; Largura da pulseira; Tamanho da caixa; Coroa; Tampa inferior; Espessura da caixa |
| [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) | X-GEAR Sport Royal Oak | Movimento; Material do bisel; Largura da pulseira; Tamanho da caixa; Coroa; Tampa inferior |

## Especificações ausentes: índice por item

Este índice apresenta as mesmas ausências da tabela anterior, agrupadas por rótulo. As contagens excluem os dois acessórios.

| Especificação | Relógios sem o item | Em quais relógios falta |
| --- | ---: | --- |
| Marca | 0 | Nenhuma |
| Modelo | 1 | [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json) |
| Homage de | 23 | [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json); [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json) |
| Tipo do relógio | 3 | [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json) |
| Funções | 6 | [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json) |
| Tipo de movimento | 0 | Nenhuma |
| Movimento | 27 | [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Material da caixa | 0 | Nenhuma |
| Material da pulseira | 2 | [opk-6003](client/public/catalog/products/opk-6003/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) |
| Material do vidro | 2 | [opk-6003](client/public/catalog/products/opk-6003/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json) |
| Material do bisel | 28 | [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json); [aimimo-design-tsuyosa](client/public/catalog/products/aimimo-design-tsuyosa/product.json); [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Resistência à água | 2 | [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) |
| Largura da pulseira | 5 | [curren-9093](client/public/catalog/products/curren-9093/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Tamanho da caixa | 31 | [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json); [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Coroa | 32 | [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json); [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Tampa inferior | 32 | [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json); [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Diâmetro do mostrador | 3 | [addiesdive-my-h3-c](client/public/catalog/products/addiesdive-my-h3-c/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) |
| Espessura da caixa | 2 | [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json) |
| Garantia | 0 | Nenhuma |

## Outras regras conferidas

| Grupo | Resultado |
| --- | --- |
| Campos obrigatórios e tipos de produto/anúncio/variante | Sem ocorrência de ausência ou tipo inválido. |
| Slug e identificadores | Slugs válidos e iguais às pastas; nenhum ID inválido ou repetido nos escopos exigidos. |
| Estados e disponibilidade | Valores aceitos; anúncios sob encomenda usam state new. |
| Eixos e apresentações | IDs, rótulos, IDs de valores e presentation válidos. A única referência de variante inválida é a descrita no Pagani. |
| Combinações de variantes | Nenhuma combinação válida duplicada no mesmo anúncio. A combinação inválida do Pagani foi reportada separadamente. |
| Imagens | Todas as 1.289 referências usam nomes/extensões permitidos e apontam para arquivos existentes em img/; todas as mainImage pertencem às images do anúncio. |
| Preços | Nenhum preço obrigatório ausente, valor não positivo ou listPrice incompatível após truncamento. Preço omitido sob encomenda é permitido. |
| orderable | Nenhum orderable false fora de anúncios sob encomenda. |
| Ofertas | 32 ofertas com texto preenchido, cores hexadecimais aceitas e ícone Gift com export e import dinâmico válidos. |
| Ordem das especificações | Não tratada como violação: o contrato informa que a página respeita a ordem do JSON, sem exigir a ordem da lista de rótulos. |
| Campos opcionais | Ausência de description, audience, specifications, offers ou alias não configura violação. |

## Acessórios encontrados

Foram incluídos nas verificações estruturais, de imagens, ofertas e especificações, mas excluídos das tabelas de completude dos relógios.

| Produto | Especificações cadastradas | Conformidade estrutural |
| --- | --- | --- |
| [pochete-nylon-ajustavel](client/public/catalog/products/pochete-nylon-ajustavel/product.json) | Garantia | Sem violação encontrada |
| [trisjem-porta-cartoes-ultrafino](client/public/catalog/products/trisjem-porta-cartoes-ultrafino/product.json) | Marca; Garantia | Sem violação encontrada |

## Encaminhamento

1. Corrigir a referência de cor inexistente no Pagani Design PD-1701.
2. Revisar as lacunas de preenchimento usando as duas tabelas de ausências, priorizando dados úteis à comparação, como modelo, materiais, resistência à água e dimensões, quando confirmados.
3. Se algum rótulo precisar ser obrigatório, registrar essa exigência no contrato e no schema. O contrato atual não permite reprovar um relógio apenas pela ausência de uma especificação.

## Identificação do levantamento

Resultado da varredura completa dos 43 arquivos locais em 17/11/2026. As seções anteriores de atualização documentam os ajustes históricos; os indicadores e tabelas de ausências refletem esta última varredura.

- SHA-256 de docs/contrato-relogio.md: `b2574755cb80f56d47a5fd8b44f9841a7fe8a82a766f4b6161531150cbbe2cad`.
- SHA-256 agregado dos 43 product.json (caminho relativo, byte nulo, conteúdo, byte nulo; caminhos ordenados): `84c9d64c745e3aaf347d6468f558db893273e2d50a30676ad99da4aa6705c098`.
