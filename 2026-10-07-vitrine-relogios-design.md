# Vitrine de relógios

Site estático para o celular. Cada vendedor tem o próprio catálogo. Quem abre o link vê os modelos, entra no relógio e chama o WhatsApp daquele vendedor.

## Resultado

A pessoa abre o endereço no telefone e percorre a lista sem ampliar a tela. O preço aparece junto da foto. O botão de interesse abre a conversa já com o nome do modelo.

Sucesso, no celular e no computador, nos modos claro e escuro: a raiz lista os vendedores, a vitrine lista todos os relógios daquele vendedor, e o detalhe mostra o vendedor, o modelo, as fotos, o preço, o parcelamento, as observações e a ficha. Dá para voltar pelo nome do vendedor e por um botão Voltar. O controle de tema troca o modo e a escolha continua depois de recarregar.

## Fora deste desenho

Pagamento, frete, carrinho, conta e painel. Estado de vendido. PDF. Busca e sacola na barra. O relógio vendido sai quando alguém apaga o bloco dele no YAML e gera o site de novo.

## Fonte

Um vendedor é uma pasta. O nome da pasta é o endereço: `vendedores/alexandre/` publica em `/alexandre`. O arquivo é `vendedor.yaml`. As fotos ficam na mesma pasta, com o nome citado na lista `imagens`.

```yaml
nome: Alexandre
whatsapp: "5511999999999"
itens:
  - id: addiesdive-my-h3-2qz
    nome: Addiesdive MY-H3-2QZ
    valorPix: 369.9
    parcelamento: 12
    observacoes: "acompanha caixa de metal e cantil"
    imagens:
      - addiesdive-frente.png
      - addiesdive-detalhe.png
    ficha:
      - detalhe: Estado
        especificacao: Usado 2x
```

O bloco `nome: Alexandre` e os nomes de arquivo desse exemplo mostram o formato. As fotos reais dos três relógios estão na seção Catálogo atual. O nome da pasta, o nome exibido e o WhatsApp do primeiro vendedor são os seus. A publicação espera esses três dados.

A pasta do vendedor e o `id` do relógio só usam letras minúsculas, números e hífen. `whatsapp` guarda só dígitos, com DDI e DDD, entre 12 e 15 caracteres. `valorPix` é um número maior que zero. `parcelamento` é um inteiro de 1 para cima. O `id` é único dentro do vendedor e não muda quando o título é corrigido. `observacoes` é opcional. Os outros campos do exemplo são obrigatórios, com pelo menos uma imagem e uma linha na ficha. Um campo que não faz parte do formato faz a geração falhar. Itens iguais em vendedores diferentes são blocos copiados, sem vínculo entre si.

Fotos aceitas: png, jpg, jpeg, webp e avif. A extensão vale em maiúsculas ou minúsculas.

O HTML monta as frases. `369.9` aparece como **R$ 369,90 no Pix**, com duas casas, vírgula decimal e ponto de milhar. `12` aparece como **em até 12x com acréscimo**. A barra fixa repete essa mesma frase de preço.

## Ficha

Os relógios aparecem na ordem do YAML. A ficha, em toda página, sai nesta ordem. Uma linha que faltar fica de fora. Uma linha com outro rótulo faz a geração falhar.

1. Homage de
2. Estado
3. Tipo do relógio
4. Tipo de movimento
5. Material da caixa
6. Material da pulseira
7. Material do vidro
8. Resistência à água
9. Tamanho da caixa
10. Largura da pulseira
11. Material do bisel
12. Link de anúncio similar
13. Garantia

Quando o valor de "Link de anúncio similar" é só um endereço `http` ou `https`, o texto visível é **Ver anúncio similar**. Qualquer outro valor dessa linha aparece como texto. `observacoes` ausente ou em branco não aparece. Quando há texto, ele entra sozinho, sem título.

## Páginas

Os links são relativos, para o mesmo HTML valer na raiz do domínio e num projeto do GitHub Pages. A raiz ordena os vendedores pelo nome, de A a Z, ignorando maiúsculas.

`/` lista os vendedores pelo `nome`, numa coluna só, no celular e no computador. Cada nome ocupa a largura da tela, com área de toque alta, e leva à pasta daquele vendedor. Um vendedor sem itens continua na lista. A aba do navegador mostra **Catálogo de relógios**.

`/alexandre/` mostra o nome do vendedor no topo e um botão Voltar para a raiz. Abaixo, todos os itens em cards brancos de loja. Uma coluna no celular e mais colunas conforme a tela cresce, nos intervalos do `DESIGN.md`. O card inteiro abre o relógio: a primeira foto, o nome do modelo e o preço. Sem itens, a página abre e mostra **Esta vitrine ainda não tem relógios.** A aba mostra só o nome do vendedor.

`/alexandre/addiesdive-my-h3-2qz/` mostra, nesta ordem:

1. O nome do vendedor, que leva de volta à vitrine dele, e um botão Voltar para o mesmo endereço.
2. O nome do modelo.
3. O carrossel, uma foto por vez, na largura da tela, sem corte e sem canto arredondado. Setas e deslize. Depois da última foto, a próxima volta para a primeira. Com duas ou mais fotos, bolinhas indicam a posição. Com uma foto, não há bolinha nem seta.
4. O preço e o parcelamento.
5. As observações, quando existem.
6. A ficha, rótulo em cima e valor embaixo.
7. A barra fixa, com o preço e a pílula **Tenho interesse**.

A aba mostra só o nome do modelo. O botão abre `https://wa.me/<dígitos>?text=` com a mensagem `Olá, tenho interesse no <nome do modelo>`. O link do relógio, quando colado no WhatsApp, usa a primeira foto e o nome do modelo como prévia.

## Visual

O `DESIGN.md` é o padrão obrigatório. A página nasce na largura do celular. A fonte segue a pilha de lá: a fonte do aparelho e, fora da Apple, Inter. Foto e preço são o que se lê primeiro.

Toda página tem a barra preta fina, com o texto **Catálogo** levando à raiz. Não há busca nem sacola. Essa barra permanece preta nos dois modos. Na vitrine e no relógio, uma segunda barra mostra o nome do vendedor.

No card, a foto é quadrada, com o relógio inteiro visível e canto de 18px. No detalhe, o carrossel ocupa a largura da tela. As setas são os controles circulares de 44px sobre a foto. **Tenho interesse** é a pílula azul `#0066cc`, com texto branco. A barra fixa fica embaixo, com vidro fosco.

O rodapé é uma faixa curta, só com a linha **Catálogo de relógios**, sem colunas de links. No claro, a faixa é pergaminho. No escuro, o rodapé, a segunda barra e a barra fixa usam o preto de bloco `#272729`, e o texto dessas faixas fica branco. Onde já havia vidro fosco, ele continua fosco.

No escuro, o fundo da página é `#272729` e o card é `#2a2a2c`, com texto branco e texto secundário `#cccccc`. Links no escuro usam `#2997ff`. A foto do relógio não escurece nem inverte. Nenhuma cor nova entra fora do `DESIGN.md`.

Na primeira visita, a página segue o claro ou o escuro do celular. O controle na barra preta mostra **Escuro** quando a página está clara e **Claro** quando está escura. O toque leva ao modo que o texto diz, e o navegador lembra a escolha. Um script no início da página aplica o modo antes de desenhar.

## Geração

Um script lê cada `vendedores/<pasta>/vendedor.yaml` e grava só a pasta `site/`:

```
site/index.html
site/alexandre/index.html
site/alexandre/addiesdive-my-h3-2qz/index.html
site/alexandre/imagens/addiesdive-frente.png
```

O script grava a saída num diretório temporário e só substitui `site/` quando todos os vendedores passam. Se algum falha, o `site/` anterior permanece como estava. A geração falha quando:

- falta `nome` ou `whatsapp`, o telefone tem algo além de dígitos, ou o tamanho está fora de 12 a 15
- a pasta ou o `id` foge do formato de endereço
- um item não tem `id`, `nome`, `valorPix`, `parcelamento`, pelo menos uma imagem ou uma linha na ficha
- o `id` se repete dentro do mesmo vendedor
- o arquivo de imagem não está na pasta desse vendedor, ou a extensão não é aceita
- `valorPix` não é um número maior que zero, ou `parcelamento` não é um inteiro de 1 para cima
- aparece um campo desconhecido, ou um rótulo de ficha fora da lista

## Catálogo atual

Os três relógios de `catalogo.md` entram no YAML do primeiro vendedor, com a foto frontal primeiro na lista. Os três usam `parcelamento: 12` e a ficha já descrita nesse arquivo, na ordem fixa acima.

- Addiesdive MY-H3-2QZ, `id` `addiesdive-my-h3-2qz`, fotos `addiesdive2.png` e `addiesdive1.png`, `valorPix` `369.9`
- CURREN 8455, `id` `curren-8455`, fotos `curren2.png` e `curren1.png`, `valorPix` `119.9`
- Seculus — kit com cantil, `id` `seculus-kit-com-cantil`, foto `seculus1.png`, `valorPix` `299.9`, `observacoes: "acompanha caixa de metal e cantil"`

Depois que esse YAML existir, saem `catalogo.md`, `catalogo.pdf`, `template-produto.md`, `detalhes-do-item.md`, `PLANO.md` e a pasta `tmp/`. Ficam o `DESIGN.md`, esta especificação, as fotos e as skills. O YAML passa a ser o único lugar do preço e da ficha.

## Verificação

Os testes automáticos usam um catálogo de exemplo, não o YAML real: dois vendedores, um sem itens, e no outro dois relógios, só um com `observacoes`. Eles conferem os arquivos em `site/`, a ordem alfabética dos vendedores, o preço **R$ 369,90 no Pix**, o texto **em até 12x com acréscimo**, a ficha na ordem fixa, o link **Ver anúncio similar**, o link do WhatsApp com a mensagem do modelo, a prévia com a primeira foto, o carrossel só quando há mais de uma foto, o botão Voltar no detalhe e na vitrine, o controle de tema e a recusa do catálogo em cada falha listada acima.

No navegador: abrir a raiz, entrar na vitrine, abrir o relógio, voltar pelo nome do vendedor, voltar de novo pelo botão Voltar, passar o carrossel e conferir o botão do WhatsApp. Trocar o tema, recarregar e ver a escolha mantida. Repetir na largura de celular e na de computador, no claro e no escuro.
