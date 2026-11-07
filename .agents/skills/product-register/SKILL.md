---
name: product-register
description: Grava produto, anúncio e variantes em client/public/catalog/products/<slug>/ com product.json e fotos em img/, após leitura completa e confirmação sim sozinha. Valida com ProductSchema antes de gravar. Use quando o operador pedir cadastrar relógio, registrar anúncio, incluir no catálogo ou gravar product.json. Não funde anúncios, não altera vendedores, não commita e não entra na suíte Vitest.
---

# product-register

Esta skill é a **única** que grava o catálogo estático (`product.json` e fotos em `img/`). Ela **não** cadastra vendedores, **não** faz `git commit`, **não** migra o catálogo legado e **não** faz parte da suíte automatizada (`pnpm test`). Quem barra JSON inválido é `ProductSchema` em `@catalogo/shared` **antes** de gravar e, depois, `pnpm build`.

## Escopo

| Faz | Não faz |
| --- | --- |
| Cria ou atualiza `client/public/catalog/products/<slug>/product.json` no formato com `listings` e `variants` | Funde dois anúncios num só ou junta variantes de fontes diferentes num único anúncio |
| Anexa **um anúncio novo** ao produto existente sem alterar os anúncios já gravados | Sobrescreve `product.json` para “mesclar” condições no mesmo `listing.id` |
| Copia fotos para `.../img/` | Cadastra ou edita vendedores |
| Valida o objeto inteiro com `ProductSchema` antes de gravar | Commita no git |
| Pede confirmação com leitura completa | Roda testes Vitest desta skill |

Se o operador pedir fundir anúncios, juntar dois `product.json` ou combinar listagens, **recuse** e explique que cada anúncio fica em um item de `listings` distinto.

## Formato do product.json

O arquivo é um **produto** com um ou mais **anúncios** (`listings`). Cada anúncio tem uma ou mais **variantes** (`variants`). Preço, `mainImage`, oferta e observações ficam na variante. Estado e disponibilidade do anúncio ficam no listing.

Tokens internos em inglês (a ficha e a home mostram português):

| Campo | Valores |
| --- | --- |
| `listing.state` | `new`, `openbox`, `used`, `defective` |
| `listing.availabilityStatus` | `available`, `coming_soon`, `on_order` |
| `audience` (produto, opcional) | `male`, `female`, `unisex`, `child` |

`Sob encomenda` no texto do operador → `availabilityStatus: "on_order"` e `state` **obrigatoriamente** `"new"`. `orderable: false` só é válido com `on_order`.

Na leitura, mostre estado e disponibilidade em português e grave os tokens acima.

### Eixos e variantes

- Produto sem cor/modelo distinto: `axes: []` e cada variante com `axes: []`.
- Com cor (ou outro eixo), declare em `product.axes` com `id` em minúsculas e hífens (`color`, etc.), `label` de exibição (ex.: `Cor`) e `values` com `id` slug do `value` e o texto em `value`.
- Cada variante seleciona **exatamente uma vez** cada eixo do produto.
- No **mesmo anúncio**, duas variantes com a mesma combinação de eixos é **inválido**. A **mesma** combinação em **outro** `listing.id` é válida.

`mainImage` da variante deve ser um nome presente em `listing.images`. A primeira foto da ordem escolhida costuma ser a `mainImage` da variante principal.

### specifications

Use só labels de `SPECIFICATION_LABELS` em `@catalogo/shared` (sem `Estado` nem `Público-alvo`). Podem existir fichas no produto e no anúncio; não repita label entre ficha do produto e ficha do mesmo anúncio.

Reaproveite as regras de inferência, resistência à água, medidas e ordem canônica da leitura que a skill antiga já documentava, **adaptadas** a este formato (preço e observações na **variante**, não na raiz do produto).

## Dois modos de entrada

### Modo A — campos separados

Fotos como lista de caminhos ou um diretório; demais campos em mensagens separadas.

### Modo B — texto único

Texto livre com título, preços e campos; fotos como no modo A. Campo incerto → vazio na leitura até o operador completar.

Aceite caminhos absolutos ou relativos ao workspace. Ignore arquivos que não sejam imagem (`jpg`, `jpeg`, `png`, `webp`, `avif`).

## Ordem das fotos

1. **Lista de caminhos:** ordem informada.
2. **Diretório:** só imagens na pasta (não recursivo). Stems terminando em dígitos → ordene pelo sufixo numérico; se algum arquivo não seguir o padrão, **pergunte a ordem** antes da leitura final.

Em `listing.images`, use só o **basename**, na ordem escolhida.

## Slug e ids

**Slug do produto** (pasta): derive do título como antes (NFD sem acentos, minúsculas, não alfanumérico vira `-`, trim de hífens). Padrão `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

**`listing.id`:** peça ao operador ou gere um id único entre os `listings` do produto (ex.: `new`, `openbox-used`, `listing-2`). Nunca reutilize id de anúncio existente para um conteúdo diferente.

## Campos mínimos na leitura

Antes da confirmação, obrigatório:

- título do produto
- `listing.state` (via português do operador)
- `listing.availabilityStatus`
- `listing.id` único no produto
- preço na variante (com corte `truncateReais`)
- ao menos uma foto resolvida
- variantes: ao menos uma, com combinação de eixos válida

## Produto novo vs anúncio em produto existente

1. **Pasta `.../products/<slug>/` não existe:** crie produto completo (`slug`, `title`, `axes`, `specifications` opcional, `listings` com o anúncio novo).
2. **Pasta já existe:** leia `product.json` atual. **Anexe** o novo objeto em `listings`. Não remova nem reescreva anúncios existentes. Não altere variantes de outros anúncios. Atualize `product.axes` só se o novo anúncio exigir valores de eixo ainda não declarados (adicione valores, não funde anúncios).
3. **Conflito de slug com intenção errada:** se o operador quer outro produto, use outro título/slug; **não** grave por cima do `product.json` inteiro.

Novas fotos vão para a mesma pasta `img/`; nomes de arquivo novos não precisam coincidir com anúncios antigos.

## Fluxo obrigatório

```
Entrada (modo A ou B)
  → resolver fotos e ordem
  → montar produto + anúncio + variante(s) + ids
  → se slug existente: carregar JSON e planejar só append de listing
  → validar com ProductSchema (falhou → corrigir, não gravar)
  → LEITURA COMPLETA (produto, cada listing, variantes, fotos, destinos)
  → confirmação
  → só se a resposta for exatamente sim → gravar
  → caso contrário → disco inalterado
```

### Leitura completa

Inclua: `slug`, `title`, fichas do produto, eixos, cada `listing` (id, state, availabilityStatus, images, fichas do anúncio) e cada variante (eixos, preços, `mainImage`, oferta, observações). Liste destinos de `product.json` e de cada foto em `img/`.

### Confirmação

Grava **somente** quando a resposta for **`sim` sozinha** (trim, minúsculas, sem pontuação extra). Qualquer outra resposta → não grava.

### Gravação (após `sim`)

1. Crie diretórios se necessário.
2. Escreva `product.json` com indentação de 2 espaços; omita opcionais vazios.
3. Copie fotos novas para `img/` com os basenames usados em `listing.images`.
4. Informe que `pnpm build` valida de novo e que **quem commita é o operador**.

## Validação antes de gravar

Use `ProductSchema.safeParse` (import de `@catalogo/shared`). Se falhar, mostre os erros, não grave, peça correção.

## Exemplos

**Produto novo, uma variante, sem eixo**

Um listing `id: "new"`, `state: "new"`, `availabilityStatus: "available"`, uma variante com `axes: []`, `mainImage` = primeira imagem.

**Segundo anúncio no mesmo slug**

Arquivo já tem `listing` com estado `new`. Operador cadastra openbox: novo `listing.id` (ex. `openbox`), novo array de `variants`, **sem** copiar variantes do listing antigo.

**Recusa de fusão**

Operador pede “juntar os dois anúncios num só” → recusar; sugerir dois `listings` ou um único anúncio com várias variantes **só** se todas forem variantes do **mesmo** cadastro, nunca fundindo arquivos ou listings existentes.
