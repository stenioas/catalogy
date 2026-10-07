# Vitrine de relógios

Site estático para o celular. Cada vendedor tem o próprio catálogo. Quem abre o link vê os modelos, entra no relógio e chama o WhatsApp daquele vendedor.

## Resultado

A pessoa recebe um endereço, abre no telefone e percorre a lista sem ampliar a tela. O preço aparece junto da foto. O botão de interesse abre a conversa já com o nome do modelo.

Sucesso é este roteiro no celular e no computador: a raiz lista os vendedores, a vitrine lista todos os relógios daquele vendedor, o detalhe mostra fotos, preço, parcelamento, observações, ficha e o botão do WhatsApp. Dá para voltar pelo nome do vendedor e por um botão Voltar.

## Fora deste desenho

Pagamento, frete, carrinho, conta e painel. Estado de vendido. PDF. O relógio vendido sai quando alguém apaga o bloco dele no YAML e gera o site de novo.

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

`observacoes` é opcional. Os outros campos do exemplo são obrigatórios, com pelo menos uma imagem e uma linha na ficha. `whatsapp` guarda só dígitos, com DDI e DDD. `valorPix` é número. `parcelamento` é inteiro. O `id` é único dentro do vendedor e não muda quando o título é corrigido.

Itens iguais em vendedores diferentes são blocos copiados. Não há vínculo entre eles.

O HTML monta as frases. `369.9` aparece como **R$ 369,90 no Pix**, com duas casas, vírgula decimal e ponto de milhar. `12` aparece como **em até 12x com acréscimo**.

## Páginas

Os links são relativos, para o mesmo HTML valer na raiz do domínio e num projeto do GitHub Pages.

`/` lista os vendedores pelo `nome`. Cada nome ocupa a largura da tela, com área de toque alta, e leva à pasta daquele vendedor. Um vendedor sem itens continua na lista.

`/alexandre/` mostra o nome do vendedor no topo e um botão Voltar para a raiz. Abaixo, todos os itens: a primeira foto na largura da tela, o nome do modelo e o preço. No computador, os cards ficam lado a lado. Sem itens, a página abre e informa que não há relógios.

`/alexandre/addiesdive-my-h3-2qz/` mostra, nesta ordem:

1. O nome do vendedor, que leva de volta à vitrine dele, e um botão Voltar para o mesmo endereço.
2. O carrossel, uma foto por vez, na largura da tela, com setas e deslize. Com uma foto, as setas não aparecem.
3. O nome do modelo, o preço e o parcelamento.
4. As observações, só quando o campo existe, com o texto como foi escrito.
5. A ficha, rótulo em cima e valor embaixo.
6. O botão do WhatsApp, na largura da tela, alto o bastante para o polegar.

O botão abre `https://wa.me/<dígitos>?text=` com a mensagem `Olá, tenho interesse no <nome do modelo>`.

A página nasce na largura do celular e só alarga a lista quando a tela sobra. A fonte é a do aparelho. Foto e preço são o que se lê primeiro.

## Geração

Um script lê cada `vendedores/<pasta>/vendedor.yaml` e grava só a pasta `site/`:

```
site/index.html
site/alexandre/index.html
site/alexandre/addiesdive-my-h3-2qz/index.html
site/alexandre/imagens/addiesdive-frente.png
```

O script grava a saída num diretório temporário e só substitui `site/` quando todos os vendedores passam. Se algum falha, o `site/` anterior permanece como estava. A geração falha quando:

- falta `nome` ou `whatsapp`, ou o telefone tem algo além de dígitos
- um item não tem `id`, `nome`, `valorPix`, `parcelamento`, pelo menos uma imagem ou uma linha na ficha
- o `id` se repete dentro do mesmo vendedor
- o arquivo de imagem não está na pasta desse vendedor
- `valorPix` não é um número ou `parcelamento` não é um inteiro

## Catálogo atual

Os três relógios de `catalogo.md` entram no YAML do primeiro vendedor, com a foto frontal primeiro na lista:

- Addiesdive MY-H3-2QZ, `id` `addiesdive-my-h3-2qz`, fotos `addiesdive2.png` e `addiesdive1.png`, `valorPix` `369.9`
- CURREN 8455, `id` `curren-8455`, fotos `curren2.png` e `curren1.png`, `valorPix` `119.9`
- Seculus — kit com cantil, `id` `seculus-kit-com-cantil`, foto `seculus1.png`, `valorPix` `299.9`, `observacoes: "acompanha caixa de metal e cantil"`

Os três usam `parcelamento: 12` e a ficha já descrita em `catalogo.md`. O bloco `nome: Alexandre` do exemplo acima mostra o formato; o nome da pasta, o nome exibido e o WhatsApp do primeiro vendedor são os seus. A publicação espera esses três dados.

O gerador de PDF e o `catalogo.md` deixam de ser a fonte. O YAML passa a ser o único lugar do preço e da ficha.

## Verificação

Os testes automáticos usam um catálogo de exemplo, não o YAML real: dois vendedores, um sem itens, e no outro dois relógios, só um com `observacoes`. Eles conferem os arquivos em `site/`, o preço **R$ 369,90 no Pix**, o texto **em até 12x com acréscimo**, o link do WhatsApp com a mensagem do modelo, o carrossel só quando há mais de uma foto, o botão Voltar no detalhe e na vitrine, e a recusa do catálogo em cada falha listada acima.

No navegador: abrir a raiz, entrar na vitrine, abrir o relógio, voltar pelo nome do vendedor, voltar de novo pelo botão Voltar, passar o carrossel e conferir o botão do WhatsApp. Repetir na largura de celular e na de computador.
