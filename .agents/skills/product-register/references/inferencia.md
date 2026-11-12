# Inferência dos campos do catálogo

Use somente o texto fornecido no HTML e as informações explícitas do operador. Fotos não fundamentam características técnicas. Não invente homage, calibre, público ou medida ausentes. Informação incerta fica omitida; o operador pode revisar depois.

## Título do produto

Todo novo cadastro deve ter `title` descritivo em português, sem referência ou código do modelo, mesmo quando o título de origem os contiver. Informe o que o produto é, a marca quando identificada e um estilo ou função sustentado pelo texto fornecido. Prefira nomes curtos e naturais, como `Relógio OPK Casual`, `Relógio SKMEI Digital Esportivo` ou `Relógio STEELFLIER Clássico`.

Não use títulos como `OPK 6003`, `Relógio OPK 6003 Casual` ou `STEELFLIER SF741`. Não substitua a referência por nomes de coleção ou características inventadas. Se o estilo não estiver claro, use apenas o tipo de produto e a marca, como `Relógio OPK`.

A regra vale para `product.json.title`. Preserve o modelo na especificação Modelo e use marca e modelo para o slug conforme `SKILL.md`. O título original extraído em `info.md` permanece como registro da fonte. Esta mudança orienta os próximos cadastros; não altera produtos existentes automaticamente.

## Descrição e público

Preencha `description` com texto pertinente ao relógio que exista na descrição ou resumo, sem CSS, scripts ou instruções da página. Omita texto vazio. `audience` é opcional: `male`, `female`, `unisex`, `child`, somente quando o texto permitir inferir o público; não deduza por aparência.

## Especificações

Use somente labels de `SPECIFICATION_LABELS` exportadas por `@catalogo/shared`, na ordem canônica. `Estado` e `Público-alvo` não são labels válidas. Não repita label na ficha do produto nem entre produto e anúncio. Para este anúncio novo, ponha características do relógio no produto. Omita labels sem valor seguro ou com valor vazio/só espaços.

- Marca e Modelo: conforme texto; divergências de identificação também geram candidatos de slug no topo do `info.md`.
- Homage de: somente se explicitamente informado.
- Movimento: calibre nomeado (por exemplo `2035`, `NH35`). Tipo de movimento: classe explícita (quartzo, automático, mecânico, meca-quartz etc.). Nome genérico sem calibre não preenche Movimento.
- Tamanho da caixa: medida explicitamente identificada como **lug to lug**. Diâmetro do mostrador: texto que menciona diâmetro. Espessura da caixa: texto que menciona espessura. Comprimento, largura ou medida nominal sem identificação suficiente não preenchem essas labels por adivinhação.
- Coroa e Tampa inferior: somente se o operador as informar explicitamente em sua mensagem; não deduza de foto ou descrição.
- Cor fica nos valores de eixo SKU quando houver; não crie uma label extra de especificação.

## Resistência à água

Formato canônico: `{metros}m ({n} ATM)`. Convenção da ficha: 1 bar = 1 ATM = 10 m. Exemplos: `3 bar` ou `30 m (3 bar)` → `30m (3 ATM)`; `5 ATM` → `50m (5 ATM)`. Converta outros pares somente se mantiverem 10 m por ATM. Se houver números conflitantes, omita o campo e informe a divergência. Não invente resistência a partir de “à prova d'água”. Notas de uso não entram nesse valor.
