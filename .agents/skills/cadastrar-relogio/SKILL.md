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
| `details` | Opcional | **Omita** se `""` ou ausente |
| `specifications` | Opcional | **Omita** se ausente ou lista vazia |
| `observations` | Opcional | **Omita** se `""` ou ausente |

String só com espaços **não** conta como vazio para omitir; só `""` ou campo omitido.

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

- `slug`, `title`, `price`, `listPrice` (se houver), `details`, `specifications`, `observations`
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
