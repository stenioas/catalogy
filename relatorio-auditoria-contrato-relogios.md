# Relatório de auditoria do contrato de relógio

Data da auditoria inicial: **16/11/2026**. Última varredura completa: **17/11/2026**. Base normativa: [docs/contrato-relogio.md](docs/contrato-relogio.md).

## Resultado

**Nenhum dos 43 produtos apresenta violação do contrato nesta varredura.** A pendência do Pagani Design PD-1701 foi corrigida. Não há especificações com rótulos proibidos, repetições ou valores vazios.

Permanecem **191 ausências de especificações**, distribuídas por 31 dos 41 relógios. São lacunas de preenchimento: `specifications` é opcional, e nenhum dos 19 rótulos é obrigatório individualmente. **10 relógios possuem os 19 rótulos preenchidos.**

| Indicador | Resultado |
| --- | ---: |
| Arquivos product.json auditados | 43 |
| Relógios, incluindo kits com relógio | 41 |
| Acessórios sem relógio | 2 |
| Anúncios de todo o catálogo | 65 |
| Variantes de todo o catálogo | 257 |
| Produtos com violação | 0 |
| Relógios sem violação encontrada | 41 |
| Itens de especificação de todo o catálogo | 591 |
| Itens de especificação nos relógios | 588 |
| Itens de especificação inválidos | 0 |
| Referências a imagens conferidas (inclui repetições entre anúncios) | 1293 |
| Ofertas conferidas | 31 |

## Alterações verificadas nesta atualização

| Produto | Alteração | Resultado |
| --- | --- | --- |
| [curren-9007](client/public/catalog/products/curren-9007/product.json) | Variante Rose Gold disponível: preço de R$ 119,90; imagem principal alterada para `curren-9007-4.webp`; foto 9 removida da galeria desse anúncio. | Schema, imagens e ofertas válidos |
| [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json) | Título Pagani Design Moonwatch; público masculino; movimento Seiko TMI VK63; 17 cores declaradas e 17 variantes em `listing-on-order`, com imagens correspondentes nas primeiras posições da galeria. Anúncio `listing-coming-soon` preservado. | Schema, imagens e ofertas válidos |
| [poedagar-682](client/public/catalog/products/poedagar-682/product.json) | Variante 682 Silver Blue: preço atualizado para R$ 129,90. | Schema, imagens e ofertas válidos |
| [poedagar-786](client/public/catalog/products/poedagar-786/product.json) | Variante 786 Rose Gold Green: preço atualizado para R$ 119,90. | Schema, imagens e ofertas válidos |
| [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json) | Título Qingxiya Moonwatch; descrição informa homenagem ao Omega Speedmaster Moonwatch; variante Silver White com preço de R$ 149,90. | Schema, imagens e ofertas válidos |

O novo catálogo mantém 65 anúncios e passa de 242 para 257 variantes. As referências a imagens passam de 1.294 para 1.293 pela retirada de uma foto da galeria do Curren 9007. As ofertas passam de 33 para 31: as variantes sob encomenda do Pagani deixaram de ter as duas ofertas antigas. A contagem de especificações e suas ausências não mudou.

## Pendência do Pagani Design PD-1701 resolvida

A variante genérica que referenciava `valueId: "varias-cores"`, inexistente no eixo `color`, foi substituída por variantes com IDs declarados. O anúncio sob encomenda tem 17 variantes, uma para cada valor do eixo, sem combinações repetidas. As imagens principais pertencem à galeria do anúncio e existem no disco. As duas opções originalmente chamadas `White` têm IDs distintos: `white` e `white-200000080`.

A ordem das variantes e das primeiras 17 imagens da galeria corresponde à ordem dos valores do eixo. O anúncio em breve seleciona `gold-green`, valor válido. O produto passa integralmente pelo `ProductSchema`.

## Escopo e método

Foram lidos todos os `client/public/catalog/products/*/product.json`, incluindo todos os anúncios e variantes. Nenhuma pasta de produto ficou sem `product.json`. Os kits Seculus e Tomi foram incluídos como relógios; a pochete e o porta-cartões foram separados como acessórios.

A auditoria executou o `ProductSchema.safeParse` real de [shared/src/schemas/product.ts](shared/src/schemas/product.ts) sobre o JSON original de cada arquivo, sem normalização legada. Conferiu também slug igual à pasta, existência física de todas as imagens citadas e exports e imports dinâmicos dos ícones Lucide instalados, conforme [client/scripts/catalog.ts](client/scripts/catalog.ts). Rótulos, valores vazios e duplicidades de especificação foram percorridos diretamente, além da validação do schema.

As ausências consideram especificações do produto e do anúncio. Nenhum anúncio tem especificações próprias nesta varredura; portanto, as ausências são iguais em todos os anúncios de cada produto. Texto em `description` ou `info.md` não conta como item estruturado. Por exemplo, a homenagem descrita no Qingxiya ainda não preenche o rótulo `Homage de` na ficha.

Esta auditoria verifica a conformidade dos arquivos com o contrato. Não verifica características físicas junto a fabricantes ou vendedores, nem certifica a correspondência visual de todas as fotos do catálogo. `info.md`, miniaturas e mídias não citadas não são exigências desse contrato.

## Especificações que quebram o contrato

| Verificação | Ocorrências |
| --- | ---: |
| Rótulo fora dos 19 permitidos | 0 |
| Uso de Estado ou Público-alvo como especificação | 0 |
| Valor vazio ou composto só de espaços | 0 |
| Rótulo repetido na mesma ficha | 0 |
| Rótulo repetido entre produto e anúncio | 0 |
| Item sem label/value válido | 0 |

Todos os 591 itens cadastrados têm rótulos aceitos e valores textuais com conteúdo. Destes, 588 pertencem aos relógios e 3 aos acessórios.

## Especificações ausentes por relógio

**Estas são lacunas de preenchimento, não violações contratuais.** O contrato permite omitir especificações. Alguns campos podem não se aplicar ou não ter informação disponível. Ausência não significa que a característica física não existe. Valores não devem ser inventados para completar a ficha.

São **191 ausências de rótulos** em 31 dos 41 relógios; 10 possuem os 19 rótulos preenchidos.

| Relógio / arquivo | Título | Especificações ausentes |
| --- | --- | --- |
| [addiesdive-ad2035](client/public/catalog/products/addiesdive-ad2035/product.json) | Addiesdive Black Bay Pro GMT | Nenhuma |
| [addiesdive-ad2554](client/public/catalog/products/addiesdive-ad2554/product.json) | Addiesdive Ranger | Nenhuma |
| [addiesdive-my-h3-2qz](client/public/catalog/products/addiesdive-my-h3-2qz/product.json) | Addiesdive Submariner Date | Nenhuma |
| [addiesdive-my-h3-c](client/public/catalog/products/addiesdive-my-h3-c/product.json) | Addiesdive Yacht Master | Nenhuma |
| [aimimo-design-explorer](client/public/catalog/products/aimimo-design-explorer/product.json) | Aimimo Design Explorer | Nenhuma |
| [aimimo-design-daytona](client/public/catalog/products/aimimo-design-daytona/product.json) | Aimimo Design Daytona | Nenhuma |
| [aimimo-design-field](client/public/catalog/products/aimimo-design-field/product.json) | Aimimo Design Pilot Vintage | Nenhuma |
| [aimimo-design-tsuyosa](client/public/catalog/products/aimimo-design-tsuyosa/product.json) | Aimimo Design Tsuyosa | Nenhuma |
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
| [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json) | Pagani Design Moonwatch | Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-682](client/public/catalog/products/poedagar-682/product.json) | Poedagar Capitão Willard | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-786](client/public/catalog/products/poedagar-786/product.json) | Poedagar PRX Feminino | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-834](client/public/catalog/products/poedagar-834/product.json) | Poedagar Nautilus Cronógrafo | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-910](client/public/catalog/products/poedagar-910/product.json) | Poedagar Datejust | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json) | Poedagar PRX Cronógrafo | Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
| [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json) | Qingxiya Moonwatch | Homage de; Movimento; Material do bisel; Tamanho da caixa; Coroa; Tampa inferior |
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

Este índice agrupa as mesmas ausências da tabela anterior por rótulo, excluindo os acessórios.

| Especificação | Relógios sem o item | Em quais relógios falta |
| --- | ---: | --- |
| Marca | 0 | Nenhuma |
| Modelo | 0 | Nenhuma |
| Homage de | 22 | [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json) |
| Tipo do relógio | 3 | [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json) |
| Funções | 6 | [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json) |
| Tipo de movimento | 0 | Nenhuma |
| Movimento | 27 | [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Material da caixa | 0 | Nenhuma |
| Material da pulseira | 2 | [opk-6003](client/public/catalog/products/opk-6003/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) |
| Material do vidro | 2 | [opk-6003](client/public/catalog/products/opk-6003/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json) |
| Material do bisel | 26 | [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Resistência à água | 2 | [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) |
| Largura da pulseira | 5 | [curren-9093](client/public/catalog/products/curren-9093/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Tamanho da caixa | 30 | [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Coroa | 31 | [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Tampa inferior | 31 | [benyar-5229](client/public/catalog/products/benyar-5229/product.json); [curren-8106](client/public/catalog/products/curren-8106/product.json); [curren-8361](client/public/catalog/products/curren-8361/product.json); [curren-8455](client/public/catalog/products/curren-8455/product.json); [curren-8498l](client/public/catalog/products/curren-8498l/product.json); [curren-8499](client/public/catalog/products/curren-8499/product.json); [curren-9007](client/public/catalog/products/curren-9007/product.json); [curren-9093](client/public/catalog/products/curren-9093/product.json); [curren-9096](client/public/catalog/products/curren-9096/product.json); [keaso-k002](client/public/catalog/products/keaso-k002/product.json); [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [north-edge-abyss](client/public/catalog/products/north-edge-abyss/product.json); [opk-6003](client/public/catalog/products/opk-6003/product.json); [pagani-design-pd-1701](client/public/catalog/products/pagani-design-pd-1701/product.json); [poedagar-682](client/public/catalog/products/poedagar-682/product.json); [poedagar-786](client/public/catalog/products/poedagar-786/product.json); [poedagar-834](client/public/catalog/products/poedagar-834/product.json); [poedagar-910](client/public/catalog/products/poedagar-910/product.json); [poedagar-970s-wh](client/public/catalog/products/poedagar-970s-wh/product.json); [qingxiya-7706](client/public/catalog/products/qingxiya-7706/product.json); [rollstimi-rt-128](client/public/catalog/products/rollstimi-rt-128/product.json); [sapphero-so2110p](client/public/catalog/products/sapphero-so2110p/product.json); [sapphero-so2205](client/public/catalog/products/sapphero-so2205/product.json); [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [skmei-1628](client/public/catalog/products/skmei-1628/product.json); [skmei-1988](client/public/catalog/products/skmei-1988/product.json); [skmei-2126](client/public/catalog/products/skmei-2126/product.json); [tomi-t301](client/public/catalog/products/tomi-t301/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json); [x-gear-2232g](client/public/catalog/products/x-gear-2232g/product.json) |
| Diâmetro do mostrador | 2 | [naviforce-nf8052](client/public/catalog/products/naviforce-nf8052/product.json); [tpw-k3048](client/public/catalog/products/tpw-k3048/product.json) |
| Espessura da caixa | 2 | [seculus-kit-cantil](client/public/catalog/products/seculus-kit-cantil/product.json); [tpw-k7101](client/public/catalog/products/tpw-k7101/product.json) |
| Garantia | 0 | Nenhuma |

## Outras regras conferidas

| Grupo | Resultado |
| --- | --- |
| Campos obrigatórios e tipos | Sem campos obrigatórios ausentes ou tipos inválidos. |
| Slug e identificadores | Slugs válidos e iguais às pastas; IDs únicos nos escopos exigidos. |
| Estados e disponibilidade | Valores aceitos; anúncios sob encomenda usam state new. |
| Eixos e variantes | Referências declaradas, seleção exata dos eixos e nenhuma combinação duplicada no mesmo anúncio. |
| Imagens | Todas as 1293 referências usam nomes e extensões permitidos e apontam para arquivos existentes; mainImage pertence às images do anúncio. |
| Preços | Nenhum preço obrigatório ausente, valor não positivo ou listPrice incompatível após truncamento. Preço omitido sob encomenda é permitido. |
| orderable | Nenhum orderable false fora de anúncios sob encomenda. |
| Ofertas | 31 ofertas com texto preenchido, cores hexadecimais válidas e ícone Gift com export e import dinâmico válidos. |
| Ordem das especificações | A página respeita a ordem do JSON; o contrato não exige a ordem da lista de rótulos. |
| Campos opcionais | Ausência de description, audience, specifications, offers ou alias não configura violação. |

## Acessórios encontrados

| Produto | Especificações cadastradas | Conformidade estrutural |
| --- | --- | --- |
| [pochete-nylon-ajustavel](client/public/catalog/products/pochete-nylon-ajustavel/product.json) | Garantia | Sem violação encontrada |
| [trisjem-porta-cartoes-ultrafino](client/public/catalog/products/trisjem-porta-cartoes-ultrafino/product.json) | Marca; Garantia | Sem violação encontrada |

## Encaminhamento

Não há correção contratual pendente. As tabelas de ausências podem orientar o preenchimento de informações confirmadas. Se um rótulo precisar ser obrigatório, essa exigência deve ser registrada no contrato e no schema.

## Identificação do levantamento

Resultado da varredura completa dos 43 arquivos locais em 17/11/2026. Alterações posteriores nos cadastros podem mudar as contagens.

- SHA-256 de docs/contrato-relogio.md: `b2574755cb80f56d47a5fd8b44f9841a7fe8a82a766f4b6161531150cbbe2cad`.
- SHA-256 agregado dos 43 product.json (caminho relativo, byte nulo, conteúdo, byte nulo; caminhos ordenados): `ba5c0fdee1a91586d259010d8ec828933d5fa7083eea2755c0f9952937a213b4`.
