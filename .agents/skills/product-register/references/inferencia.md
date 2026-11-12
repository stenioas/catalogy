# Inferência dos campos do catálogo

Use somente o texto fornecido no HTML e as informações explícitas do operador. Fotos não fundamentam características técnicas. Não invente homage, calibre, público ou medida ausentes. Informação incerta fica omitida; o operador pode revisar depois.

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
