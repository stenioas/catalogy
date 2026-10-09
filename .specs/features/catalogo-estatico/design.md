# Catálogo estático

Desenho aprovado em 2026-10-09. Substitui os planos `vitrine-relogios` e `ajustes-site` quando este documento for aceito. A implementação espera esse aceite.

## Resultado

Uma vitrine única de relógios, publicada como site estático. O visitante chega com `?seller=<slug>`. Esse parâmetro escolhe o nome e o telefone de quem recebe o interesse. O estoque é o mesmo para todos os vendedores.

Não há servidor no ar, página de cadastro, carrinho, pagamento nem painel. Os relógios entram por uma skill local. Os vendedores entram num arquivo editado à mão.

## Pacotes

Monorepo pnpm com dois pacotes, no espírito de `STACK-REFERENCIA.md`:

- `shared`: contratos Zod do relógio e do vendedor.
- `client`: Vite, React 19, React Router, Tailwind e shadcn. A vitrine estática.

Não existe pacote `server`. A esteira de versão da stack de referência (semantic-release e CI) fica para um plano posterior, quando a vitrine for publicada.

O visual segue `DESIGN.md`: tema claro e escuro, fotografia na frente, interface quieta.

## Páginas

Duas rotas. As duas exigem um `seller` que exista em `sellers.json`.

### Catálogo

`/?seller=alexandre`

A barra mostra `Catálogo {nome}`, com o `name` daquele vendedor. A grade lista os relógios: a primeira foto, o título, o preço em reais e o botão **Eu quero!** O card abre `/relogio/<slug>` e conserva `seller` na URL.

**Eu quero!** abre `https://wa.me/<phone>?text=` com a mensagem `Olá, tenho interesse no {título}.`, já codificada. O telefone no arquivo é só dígitos, com DDI.

### Relógio

`/relogio/<slug>?seller=alexandre`

Fotos na ordem de `images`, título, preço, detalhes, especificações e observações. Campo ausente não aparece. O botão **Eu quero!** repete o mesmo WhatsApp e a mesma mensagem.

Seller válido e slug de relógio inexistente: a página diz que aquele relógio não está no catálogo e não mostra o botão.

### Erro

Sem `seller`, ou com um slug que não está em `sellers.json`: a página não lista relógios e não mostra o botão. O texto diz que o link está incompleto ou que o vendedor não existe.

### Vazio

Seller válido e nenhum produto: a barra continua `Catálogo {nome}` e a grade diz que a vitrine ainda não tem relógios.

### Preço

O JSON guarda um decimal em reais. `369.9` aparece como `R$ 369,90`.

## Arquivos

```
client/public/catalog/sellers.json
client/public/catalog/products/<slug>/product.json
client/public/catalog/products/<slug>/img/<arquivo>
```

`sellers.json` é uma lista. Cada item tem `slug`, `name` e `phone`. A skill não altera esse arquivo.

`product.json` tem `slug`, `title`, `price`, `images` e, quando existirem, `details`, `specifications` e `observations`. `images` é a lista ordenada dos nomes dos arquivos em `img/`. A primeira entrada é a foto do card. `specifications` é uma lista de pares rótulo e valor. `details`, `specifications` e `observations` podem faltar. O `slug` só aceita minúsculas, números e hífen.

A grade não tem índice à parte. No build, o Vite descobre cada `client/public/catalog/products/*/product.json`. A barra lê `sellers.json` e escolhe o item pelo `?seller=`.

## Skill de cadastro

A skill vive no repositório e cadastra só relógios. Ela recebe os caminhos das fotos, ou um diretório, mais os campos separados. Também aceita um texto único mais as fotos.

A ordem das fotos é a ordem dos caminhos informados. Se vier um diretório, a skill ordena por nome: `foto1`, `foto2`, `foto3`. Se os nomes não permitirem essa leitura, ela pergunta a ordem antes de mostrar a confirmação.

Nos dois modos ela mostra a leitura completa, inclusive o slug gerado a partir do título, e só grava depois de um sim. Campo incerto no texto único aparece vazio nessa leitura, para ser completado antes da confirmação. Se a pasta daquele slug já existir, ela pergunta e não grava por cima: o cadastro segue só com outro slug; sem outro slug, ela cancela.

Com o sim, grava `product.json` e copia as fotos para `img/`. Quem commita é a pessoa. Os relógios do catálogo antigo não são migrados sozinhos.

## Testes e build

Os contratos do `shared` recusam slug fora do padrão, preço que não seja decimal, lista de fotos vazia e nome de foto com pasta no caminho. O vendedor recusa telefone com letra, espaço ou símbolo. Um arquivo válido aceita `369.9`.

O build percorre `client/public/catalog/products/*/product.json` e `client/public/catalog/sellers.json` e valida cada um. Qualquer falha interrompe o build. Um teste com JSON inválido exige que essa verificação termine com erro.

No client, os testes cobrem o preço formatado, a barra `Catálogo {nome}`, o botão **Eu quero!**, o link `wa.me` com a mensagem codificada, a query `seller` conservada, a omissão de campo vazio, a página de erro e a vitrine vazia.

A skill não entra nessa suíte. Quem impede um JSON ruim de ir para o ar é o build.

## Fora deste plano

Servidor no ar, página de cadastro, carrinho, pagamento, painel, semantic-release e CI.

## O que sai depois do aceite

Quando este desenho for aceito, saem o gerador Python, o `site/` gerado, os testes desse gerador e as specs `vitrine-relogios` e `ajustes-site`. Permanecem `DESIGN.md` e `STACK-REFERENCIA.md`. Nada disso é apagado antes do aceite.
