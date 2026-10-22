# Especificações fechadas

## Problem Statement

Cada relógio grava `specifications` com labels livres. O mesmo fato aparece com nomes diferentes, e a ficha segue a ordem de cada arquivo. O catálogo precisa de uma lista fechada de labels, uma ordem de exibição única e valores de resistência à água no mesmo formato. O contrato vive no `ProductSchema`, que o `pnpm build` já aplica aos `product.json`.

## Goals

- [ ] O `ProductSchema` aceita só as 20 labels canônicas, sem obrigar nenhuma, sem repetir label e sem valor em branco
- [ ] A página do relógio mostra essas labels sempre na mesma ordem
- [ ] Os 11 `product.json` atuais passam pela limpeza combinada e pela resistência à água `30m (3 ATM)`
- [ ] A skill `cadastrar-relogio` e o `README.md` descrevem o mesmo contrato

## Out of Scope

| Feature | Reason |
| --- | --- |
| Reordenar os arrays `specifications` nos `product.json` | A ordem do arquivo pode variar. Quem ordena é a página |
| Repartir `Tamanho da caixa`, diâmetro, espessura ou calibre | A skill pergunta isso numa passada futura, só quando o operador pedir |
| Criar `Coroa` ou `Tampa inferior` a partir da descrição | Label nova só entra quando o operador responder na skill |
| Alterar descrição, garantia, largura, materiais ou `Estado` | Fora da limpeza combinada |
| Sincronizar `Estado` com `state` | O badge do card continua vindo de `state` |
| Enumerar valores de material | Texto livre de propósito |
| Apagar ou ler `specifications-merge.json` | Planilha local. O operador apaga depois |
| Commit, push, deploy | Fora desta especificação |
| Passada da skill nos relógios já cadastrados | Começa só quando o operador pedir |
| Autenticação, expiração, observabilidade, dependência externa | Catálogo estático, sem sessão, TTL, log ou serviço remoto |
| Retomada de `catalog-layout-refactor` | Feature pausada. Este trabalho não mexe nela |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Lista e ordem das labels | Marca, Modelo, Homage de, Estado, Tipo do relógio, Funções, Tipo de movimento, Movimento, Material da caixa, Material da pulseira, Material do vidro, Material do bisel, Resistência à água, Largura da pulseira, Tamanho da caixa, Coroa, Tampa inferior, Diâmetro do mostrador, Espessura da caixa, Garantia | Ordem confirmada pelo operador em 2026-10-22 | y |
| Valores de material, largura e garantia | Permanecem como estão, inclusive `90 dias.` | Só a resistência à água entra na padronização deste passo | y |
| 1 bar na ficha | Conta como 1 ATM e como 10 m | O operador definiu `3 bar` como `30m (3 ATM)`, sem conversão de pressão real | y |
| Label fora da lista na página | A linha fica depois das labels canônicas e preserva a ordem relativa | Os testes de página injetam labels que o catálogo publicado não tem. O build barra essas labels no JSON | y |
| Repetição na página | A tabela mostra as linhas que recebeu, inclusive repetidas | Quem recusa a repetição é o schema, não a tabela | y |
| Fonte da cor | Só o campo `color` | Comportamento já existente. A troca de fixtures da página não pode passar a ler cor de `specifications` | y |
| Falha parcial ao gravar JSON | N/A | A migração edita arquivos estáticos. Não há gravação parcial em runtime | y |
| Idempotência e retentativa | N/A | Não há fila nem reprocessamento. O build valida o arquivo resultante | y |
| Concorrência | N/A | Não há escrita concorrente. A única ordem exigida é a de exibição | y |
| Ciclo de vida do dado | N/A | Specification não expira nem é arquivada | y |

**Open questions:** none

---

## User Stories

### P1: Vocabulário fechado no schema ⭐ MVP

**User Story**: Como operador do catálogo, quero que um `product.json` só carregue labels conhecidas, para que dois relógios não nomeiem o mesmo fato de formas diferentes.

**Why P1**: Sem o schema, o build continua aceitando label livre e a ficha não tem contrato.

**Acceptance Criteria**:

1. The shared package SHALL export the specification labels in this order: Marca, Modelo, Homage de, Estado, Tipo do relógio, Funções, Tipo de movimento, Movimento, Material da caixa, Material da pulseira, Material do vidro, Material do bisel, Resistência à água, Largura da pulseira, Tamanho da caixa, Coroa, Tampa inferior, Diâmetro do mostrador, Espessura da caixa, Garantia.
2. The ProductSchema SHALL accept a product whose specifications field is omitted.
3. The ProductSchema SHALL accept a product whose specifications array is empty.
4. WHEN a product includes any subset of the exported labels, each label at most once, and every value contains a non-space character THEN the ProductSchema SHALL accept that product.
5. WHEN the specifications array is not in the exported order THEN the ProductSchema SHALL accept that product.
6. IF a specification label is absent from the exported list THEN the ProductSchema SHALL reject the product.
7. IF the same specification label appears more than once THEN the ProductSchema SHALL reject the product.
8. IF a specification value is empty or contains only spaces THEN the ProductSchema SHALL reject the product.

**Independent Test**: `pnpm --filter @catalogo/shared test` com um produto sem specifications, um subconjunto válido fora de ordem, e rejeições de label desconhecida, label repetida e valor em branco.

---

### P1: Ordem única na ficha ⭐ MVP

**User Story**: Como visitante, quero ver as características de qualquer relógio na mesma sequência, para comparar um relógio com outro sem procurar o fato no meio da tabela.

**Why P1**: A ordem no arquivo continua livre. A ordem visível é o que o operador exigiu igual para todos.

**Acceptance Criteria**:

1. WHEN the watch page renders two or more canonical specification labels THEN the system SHALL show them in the exported label order, regardless of their order in the product array.
2. WHEN the watch page renders a specification label outside the exported list THEN the system SHALL place that row after every canonical row and SHALL keep the relative order of the outside rows.
3. WHEN a specification value has no non-space character THEN the watch page SHALL omit that row.
4. The watch page SHALL read the displayed product color only from the color field.
5. WHEN a specification value starts with `http://` or `https://` THEN the watch page SHALL show a link named `Ver anúncio similar` and SHALL NOT show the raw URL text.

**Independent Test**: Abrir a página de um produto cuja array traz `Garantia` antes de `Marca` e ver `Marca` acima de `Garantia`. Um valor em branco não gera linha. A cor continua no campo `color`.

---

### P1: Limpeza do catálogo atual ⭐ MVP

**User Story**: Como operador, quero os relógios já publicados dentro do vocabulário e com a resistência à água num formato só, sem perder medida ou calibre que a skill ainda vai perguntar.

**Why P1**: O build passa a recusar label de fora. Os JSON atuais precisam caber no schema sem a passada de perguntas.

**Acceptance Criteria**:

1. The benyar-5229 product SHALL NOT include the specification label `Formato da caixa`.
2. The benyar-5229 product SHALL include `Resistência à água` with value `30m (3 ATM)`.
3. The aimimo-design-air-king-verde product SHALL NOT include the specification labels `Luminosidade` or `Tampa inferior`.
4. The aimimo-design-air-king-verde product SHALL include `Funções` with value `Luminosidade`.
5. The aimimo-design-air-king-verde product SHALL include `Resistência à água` with value `50m (5 ATM)`.
6. The aimimo-design-air-king-verde product SHALL include `Tamanho da caixa` with value `39 mm de diâmetro, sem a coroa; 48 mm lug to lug; 12,5 mm de espessura`.
7. The curren-9096 product SHALL NOT include a specification with label `Homage de` and value `Não se aplica`.
8. The curren-9096 product SHALL include `Resistência à água` with value `30m (3 ATM)`.
9. The keaso-k002 product SHALL NOT include a `Material do bisel` specification whose value is empty.
10. The keaso-k002 product SHALL include `Resistência à água` with value `200m (20 ATM)`.
11. The skmei-2126 product SHALL include `Resistência à água` with value `50m (5 ATM)`.
12. The skmei-2126 description SHALL still contain `natação`.
13. The seculus-kit-cantil product SHALL include `Resistência à água` with value `50m (5 ATM)`.
14. The seculus-kit-cantil product SHALL include `Estado` with value `Embalagem foi aberta`.
15. The addiesdive-ad2554 product SHALL include `Resistência à água` with value `100m (10 ATM)`.
16. The addiesdive-ad2554 product SHALL NOT include the specification labels `Coroa` or `Tampa inferior`.
17. The addiesdive-ad2554 product SHALL include `Tipo de movimento` with value `Quartzo japonês, calibre 2035`.
18. The addiesdive-my-h3-2qz-black product SHALL include `Resistência à água` with value `200m (20 ATM)`.
19. The addiesdive-my-h3-2qz-green-black product SHALL include `Resistência à água` with value `200m (20 ATM)`.
20. The curren-8455 product SHALL include `Resistência à água` with value `30m (3 ATM)`.
21. The curren-8455 product SHALL include `Garantia` with value `90 dias.`.
22. The curren-8498l-black product SHALL include `Resistência à água` with value `30m (3 ATM)`.
23. The benyar-5229 product SHALL include `Movimento` with value `Quartzo`.
24. WHEN `pnpm build` parses every current product.json THEN the ProductSchema SHALL accept each product.

**Independent Test**: Ler os 11 `product.json` e conferir a tabela de migração. `pnpm build` termina sem erro de schema.

---

### P1: Contrato escrito para o próximo cadastro ⭐ MVP

**User Story**: Como operador, quero a skill de cadastro e o README no mesmo vocabulário do schema, para o próximo relógio já nascer na lista fechada.

**Why P1**: Sem a skill, o próximo cadastro volta a gravar label livre e `3 bar`.

**Acceptance Criteria**:

1. The cadastrar-relogio skill SHALL name the 20 exported labels in the exported order.
2. WHEN the operator text states `3 bar`, `30 m (3 bar)`, or `5 ATM` THEN the skill instructions SHALL tell the agent to record `30m (3 ATM)` or `50m (5 ATM)` without asking.
3. The skill instructions SHALL tell the agent to fill `Tamanho da caixa` only when the operator text says lug to lug, `Diâmetro do mostrador` only when it says diâmetro, `Espessura da caixa` only when it says espessura, and `Movimento` only when it names a caliber.
4. The skill instructions SHALL tell the agent to leave `Tamanho da caixa` blank and ask before `sim` when the operator text says comprimento, medida nominal, or largura da caixa instead of lug to lug.
5. The skill instructions SHALL tell the agent to infer specifications only from the operator text, not from photos and not from a newly fetched listing.
6. The README SHALL state that a specification label must be one of the 20 exported labels and that the watch page shows those labels in the exported order.

**Independent Test**: Ler `.agents/skills/cadastrar-relogio/SKILL.md` e o trecho de `specifications` no `README.md`. A skill não entra no Vitest.

---

## Edge Cases

- IF the specifications array is omitted or empty THEN the ProductSchema SHALL accept the product and the watch page SHALL omit the characteristics table.
- IF the same label is repeated THEN the ProductSchema SHALL reject the product.
- IF a value is `""` or `"   "` THEN the ProductSchema SHALL reject the product and the watch page SHALL omit that row when a test injects it.
- WHEN meters and bar/ATM in one operator sentence do not match 10 m per 1 ATM THEN the skill instructions SHALL tell the agent to ask instead of converting.
- The current catalog has no contradictory water value, so this implementation SHALL NOT ask the operator during the mechanical migration.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SPEC-01 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-02 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-03 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-04 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-05 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-06 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-07 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-08 | P1: Vocabulário fechado no schema | T1 | Done |
| SPEC-09 | P1: Ordem única na ficha | Specify | Pending |
| SPEC-10 | P1: Ordem única na ficha | Specify | Pending |
| SPEC-11 | P1: Ordem única na ficha | Specify | Pending |
| SPEC-12 | P1: Ordem única na ficha | Specify | Pending |
| SPEC-13 | P1: Ordem única na ficha | Specify | Pending |
| SPEC-14 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-15 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-16 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-17 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-18 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-19 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-20 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-21 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-22 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-23 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-24 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-25 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-26 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-27 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-28 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-29 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-30 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-31 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-32 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-33 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-34 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-35 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-36 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-37 | P1: Limpeza do catálogo atual | Specify | Pending |
| SPEC-38 | P1: Contrato escrito para o próximo cadastro | Specify | Pending |
| SPEC-39 | P1: Contrato escrito para o próximo cadastro | Specify | Pending |
| SPEC-40 | P1: Contrato escrito para o próximo cadastro | Specify | Pending |
| SPEC-41 | P1: Contrato escrito para o próximo cadastro | Specify | Pending |
| SPEC-42 | P1: Contrato escrito para o próximo cadastro | Specify | Pending |
| SPEC-43 | P1: Contrato escrito para o próximo cadastro | Specify | Pending |

Mapeamento: SPEC-01 a SPEC-08 são os critérios da história do schema, na ordem em que aparecem. SPEC-09 a SPEC-13 são os da ficha. SPEC-14 a SPEC-37 são os da limpeza, na ordem em que aparecem. SPEC-38 a SPEC-43 são os do contrato escrito.

**Coverage:** 43 total, 8 mapped to tasks (T1), 35 unmapped.

---

## Success Criteria

- [ ] `pnpm --filter @catalogo/shared test` passa
- [ ] `pnpm --filter client test` passa
- [ ] `pnpm build` aceita os 11 `product.json`
- [ ] A skill e o README citam as mesmas 20 labels, na mesma ordem do schema
