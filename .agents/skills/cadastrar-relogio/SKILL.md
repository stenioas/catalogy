---
name: cadastrar-relogio
description: Não grava mais o catálogo. Para product.json, anúncios e fotos em client/public/catalog/products/, use a skill product-register. Mantida só como referência do nome antigo; não execute o fluxo de gravação deste arquivo.
---

# cadastrar-relogio (descontinuada para gravação)

A gravação do catálogo (`product.json`, `listings`, `variants` e fotos em `img/`) passou para **`product-register`**.

## O que fazer

- Pedidos de cadastrar relógio, gravar `product.json`, registrar anúncio ou incluir produto no catálogo → ative e siga **`product-register`**.
- **Não** crie nem atualize `client/public/catalog/products/**/product.json` seguindo o fluxo legado desta skill.
- **Não** trate o formato antigo com `price` e `state` na raiz do produto.

## O que esta pasta não é mais

| Antes | Agora |
| --- | --- |
| Skill de gravação do catálogo | Apenas redirecionamento para `product-register` |
| Validação e confirmação `sim` para gravar | Fica em `product-register` |

Para detalhes de leitura completa, confirmação `sim`, fotos, `ProductSchema` e proibição de fundir anúncios, leia `.agents/skills/product-register/SKILL.md`.
