---
name: cadastrar-relogio
description: Cadastra um relógio em client/public/catalog/products/<slug>/ com product.json e fotos em img/, após leitura completa e confirmação sim sozinha. Use quando o operador pedir cadastrar relógio, incluir produto no catálogo, gravar product.json ou registrar fotos de relógio. Não altera vendedores, não commita e não entra na suíte Vitest.
---

# Cadastrar relógio

Esta skill grava **somente relógios** no catálogo estático. Ela **não** cadastra vendedores, **não** faz `git commit` dos arquivos gravados, **não** migra relógios do catálogo antigo (gerador Python / `site/`) e **não** faz parte da suíte automatizada (`pnpm test`). Quem barra JSON inválido é `pnpm build`, via `ProductSchema` em `@catalogo/shared`.

## Escopo

| Faz | Não faz |
| --- | --- |
| Cria `client/public/catalog/products/<slug>/product.json` | Cadastra ou edita vendedores |
| Copia fotos para `.../img/` | Sobrescreve pasta de slug existente |
| Valida o objeto com `ProductSchema` antes de gravar | Commita no git |
| Pede confirmação com leitura completa | Roda testes Vitest desta skill |

## Dois modos de entrada

### Modo A — campos separados

O operador informa:

1. Fotos como **lista de caminhos** **ou** um **único diretório** com as imagens.
2. Campos do relógio em mensagens separadas (título, preço, e opcionais).

Aceite caminhos absolutos ou relativos ao workspace. Ignore arquivos que não sejam imagem (`jpg`, `jpeg`, `png`, `webp`, `avif`, qualquer caixa).

### Modo B — texto único

O operador informa:

1. Um **texto** com título, preços e demais campos (formato livre; extraia o que for claro).
2. Fotos como no modo A.

Se um campo no texto for **incerto**, deixe-o **vazio** na leitura para o operador completar antes de confirmar.

## Ordem das fotos

1. **Lista de caminhos:** use exatamente a ordem informada.
2. **Diretório:** considere só arquivos de imagem na pasta (não recursivo).
   - Se **todo** nome de arquivo (stem, sem extensão) **termina com um ou mais dígitos** (`foto2.jpg`, `foto10.webp`), ordene pelo valor **numérico** desse sufixo. Exemplo: `foto2` antes de `foto10`.
   - Se **qualquer** arquivo de imagem **não** terminar o stem em dígitos, **pergunte a ordem** ao operador **antes** de mostrar a leitura de confirmação. Não avance para a leitura final sem ordem definida.

Na lista `images` do JSON, use **só o nome do arquivo** (basename), na ordem escolhida. A primeira entrada é a foto do card.

## Slug a partir do título

Gere o slug **a partir do título** (não peça slug manual salvo conflito de pasta):

1. Remova acentos (normalize NFD e elimine marcas combinantes).
2. Converta para minúsculas.
3. Substitua cada sequência contínua de caracteres que **não** sejam letras (`a`–`z`) nem dígitos (`0`–`9`) por **um** hífen `-`.
4. Remova hífens no início e no fim.

Exemplo obrigatório: título `Seculus — kit com cantil` → slug `seculus-kit-com-cantil`.

O slug deve obedecer `^[a-z0-9]+(?:-[a-z0-9]+)*$` (mesmo contrato do `ProductSchema`).

## Campos do product.json

Monte um objeto compatível com `ProductSchema` (`@catalogo/shared`):

| Campo | Obrigatório na leitura | No JSON |
| --- | --- | --- |
| `title` | Sim | Sempre |
| `price` | Sim | Sempre; aplique o mesmo corte de centavos que `truncateReais` (descarte dígitos após a segunda casa, sem arredondar) |
| `images` | Ao menos uma foto | Array com ≥1 basename |
| `slug` | Sim (derivado do título, salvo conflito) | Sempre |
| `listPrice` | Opcional | **Omita** se vazio |
| `description` | Opcional | **Omita** se `""` ou ausente |
| `specifications` | Opcional | **Omita** se ausente ou lista vazia |
| `observations` | Opcional | **Omita** se `""` ou ausente |
| `state` | Obrigatório | `"Novo"` (lacrado, nunca usado), `"Openbox"` (caixa aberta, sem uso ou uso muito breve) ou `"Usado"` (produto usado). Sempre mostra a badge no card |
| `color` | Opcional | Texto livre com uma única cor; **omita** se `""` ou ausente |

Use `color` para a cor do exemplar ofertado quando o operador a informar. Não a deduza de fotos, descrição ou `specifications`, nem repita o mesmo valor em `specifications`; esse campo continua independente para características distintas.

String só com espaços **não** conta como vazio para omitir; só `""` ou campo omitido.

## specifications (lista fechada)

Cada linha de `specifications` usa **somente** uma das 20 labels abaixo, **na ordem canônica do schema** (`SPECIFICATION_LABELS` em `@catalogo/shared`). A ordem no `product.json` pode ser outra; a ficha do site reordena na exibição.

| # | Label |
| --- | --- |
| 1 | Marca |
| 2 | Modelo |
| 3 | Homage de |
| 4 | Estado |
| 5 | Tipo do relógio |
| 6 | Funções |
| 7 | Tipo de movimento |
| 8 | Movimento |
| 9 | Material da caixa |
| 10 | Material da pulseira |
| 11 | Material do vidro |
| 12 | Material do bisel |
| 13 | Resistência à água |
| 14 | Largura da pulseira |
| 15 | Tamanho da caixa |
| 16 | Coroa |
| 17 | Tampa inferior |
| 18 | Diâmetro do mostrador |
| 19 | Espessura da caixa |
| 20 | Garantia |

Regras do `ProductSchema` (o build recusa o contrário):

- Label fora da lista, label repetida no mesmo produto ou `value` vazio / só espaços → **não grave**; corrija com o operador.
- Nenhuma label é obrigatória; `specifications` ausente ou `[]` é válido.
- Não crie `Coroa` nem `Tampa inferior` a partir de foto ou descrição; só grave se o operador disser na mensagem.

### Fonte dos valores

Inferir **apenas** do texto que o operador enviou (modo A ou B). **Não** use fotos, **não** busque anúncio na web e **não** invente homage, calibre ou medida que não estejam no texto.

Se um campo não der para inferir com segurança, deixe a label **fora** do JSON na leitura (ou o par label/value vazio na leitura) e **pergunte ao operador antes** de pedir o `sim`. Não preencha por adivinhação.

Na **leitura completa**, liste as specifications **na ordem da tabela acima**, omitindo linhas que ficaram vazias.

### Medidas de caixa e movimento

| Label | Quando preencher sem perguntar |
| --- | --- |
| `Tamanho da caixa` | O texto menciona **lug to lug** (inclua o valor que o operador passou). |
| `Diâmetro do mostrador` | O texto menciona **diâmetro** (em geral sem a coroa). |
| `Espessura da caixa` | O texto menciona **espessura**. |
| `Movimento` | O texto nomeia um **calibre** (ex.: `2035`, `NH35`). |
| `Tipo de movimento` | Classe do movimento quando o texto for claro (quartzo, automático, mecânico, meca-quartz, etc.), inclusive com calibre na mesma frase se for o caso. |

Deixe **em branco** e **pergunte** antes do `sim` quando o texto trouxer **comprimento**, **medida nominal** ou **largura da caixa** em vez de lug to lug, ou quando houver linha de movimento **sem calibre nomeado** e você não souber o que gravar em `Movimento` vs `Tipo de movimento`.

`state` do produto (`Novo` / `Openbox` / `Usado`) continua obrigatório e independente. `Estado` em `specifications` é opcional e pode ter outro texto (ex.: condição da embalagem).

### Resistência à água

Grave sempre no formato **`{metros}m ({n} ATM)`**: sem espaço antes de `m`, espaço antes do parêntese, unidade `ATM` no parêntese. Na ficha, **1 bar = 1 ATM = 10 m**; não converta pressão real.

**Sem perguntar**, quando o texto do operador disser exatamente o padrão abaixo, grave o valor canônico:

| Texto do operador (exemplos) | Valor em `Resistência à água` |
| --- | --- |
| `3 bar` | `30m (3 ATM)` |
| `30 m (3 bar)` | `30m (3 ATM)` |
| `5 ATM` | `50m (5 ATM)` |

Para outros pares de metros e bar/ATM no **mesmo** texto, só converta se fecharem **10 m por 1 ATM** (ex.: `50 m (5 bar)` → `50m (5 ATM)`). Se metros e bar/ATM **não** fecharem essa conta, deixe `Resistência à água` em branco e **pergunte**; não invente conversão.

Notas de uso (natação, mergulho, etc.) **não** entram no `value` de `Resistência à água`; podem ir em `description` ou `observations` se o operador pedir.

Se `listPrice` existir, após truncar deve ser **maior** que `price`; caso contrário, corrija com o operador antes de gravar.

## Conflito de pasta

Antes de gravar, verifique se `client/public/catalog/products/<slug>/` **já existe**.

- Peça **outro slug** (o operador pode ajustar o título ou informar slug manual válido).
- **Nunca** sobrescreva `product.json` nem `img/` existentes.
- Se o operador não fornecer outro slug, **cancele sem gravar**.

## Fluxo obrigatório

```
Entrada (modo A ou B)
  → resolver fotos e ordem
  → montar campos + slug
  → checar pasta do slug (conflito → outro slug ou cancelar)
  → validar com ProductSchema (falhou → corrigir com operador, não gravar)
  → mostrar LEITURA COMPLETA (todos os campos que irão ao JSON, slug, ordem das fotos, caminhos de destino)
  → perguntar confirmação
  → só se a resposta for exatamente sim (minúsculas, sozinha, sem pontuação extra) → gravar
  → caso contrário → não gravar; disco inalterado
```

### Leitura completa

Inclua sempre, em texto claro para o operador:

- `slug`, `title`, `price`, `listPrice` (se houver), `description`, `specifications`, `observations`, `state` (obrigatório)
- `color` (se houver)
- Lista ordenada de nomes de arquivo em `images`
- Destino: `client/public/catalog/products/<slug>/product.json` e `.../img/`

### Confirmação

- **Grava** somente quando a resposta for **`sim` sozinha** (sem aspas, sem “sim, pode”, sem maiúsculas obrigatórias além do que o operador digitou — exija correspondência exata ao token `sim` após trim).
- Qualquer outra resposta (**não**, vazio, pergunta, `sim.` etc.) → **não grava**.

### Gravação (após `sim`)

1. Crie `client/public/catalog/products/<slug>/` e `.../img/` se necessário.
2. Escreva `product.json` com JSON indentado (2 espaços), campos opcionais vazios omitidos.
3. Copie cada foto para `img/` preservando o basename usado em `images`.
4. Informe que o operador pode rodar `pnpm build` para validar e que **quem commita é a pessoa** (não execute commit).

## Validação antes de gravar

Use `ProductSchema.safeParse` (import de `@catalogo/shared`). Se falhar, mostre os erros, não grave, e peça correção.

## Pré-requisitos mínimos para chegar à confirmação

Na leitura, **obrigatório** estar preenchido:

- título
- preço
- estado (`Novo`, `Usado` ou `Openbox`), informado pelo operador; não deduza pelo modelo
- ao menos uma foto resolvida

Se faltar qualquer um, **não** mostre confirmação final nem grave.

## Exemplos

**Modo A — caminhos**

Operador: fotos `/tmp/a.jpg`, `/tmp/b.jpg`; título `CURREN 8220`; preço `450`.

Ordem das imagens: `a.jpg`, `b.jpg`. Slug derivado: `curren-8220`. Mostrar leitura → operador responde `sim` → gravar.

**Modo A — diretório numerado**

Diretório com `foto10.jpg` e `foto2.jpg` → ordem `foto2.jpg`, `foto10.jpg`.

**Modo B — campo incerto**

Texto ambíguo sobre `listPrice` → leitura mostra `listPrice` vazio; operador completa antes do `sim`.

**Recusa**

Operador responde `ok` → não gravar.

**Conflito**

Pasta `seculus-kit-com-cantil` existe → pedir outro slug; sem resposta → cancelar.
