# Refatoração da estrutura do catálogo

Data: 2026-10-15

Status: desenho consolidado após aprovação em conversa; documento disponível para revisão. A implementação não faz parte desta etapa.

## Objetivo

Facilitar a consulta e a comparação de produtos com uma vitrine mobile compacta e uma página de produto organizada como as referências do Mercado Livre. Preservar a identidade visual do catálogo, os dados comerciais, o compartilhamento pelo WhatsApp e os comportamentos existentes da galeria e do carrossel mobile.

## Referências e decisões confirmadas

- `mercadolivre-mobile-vitrine.html`: organização horizontal da vitrine mobile.
- `mercadolivre-desktop.html` e `mercadolivre-desktop.png`: organização da página de produto no desktop.
- `mercadolivre-mobile.html` e `mercadolivre-mobile.png`: organização da página de produto no mobile.
- Os HTMLs e as imagens orientam a estrutura. Cores, tipografia e temas claro/escuro continuam usando o sistema visual atual.
- A vitrine desktop mantém a apresentação atual.
- O WhatsApp da vitrine mobile passa a ser um botão apenas com ícone sobre a foto. A condição do produto passa para a área de informações.
- Exibir somente a cor do produto ofertado quando cadastrada. Não haverá lista de cores disponíveis, seleção de variantes ou troca de fotos por cor.
- Reaproveitar os componentes e comportamentos existentes, separando a apresentação de fotos desktop do carrossel mobile e compartilhando a galeria e a seleção de foto.

## Vitrine mobile

Cada produto ocupa uma linha horizontal: foto principal à esquerda e conjunto de informações à direita. A lista não deve apresentar contornos de cards, elevação ou sombras. Espaçamento e separadores discretos podem delimitar os itens.

A coluna direita contém título, grupo de precificação completo, parcelamento, condição e disponibilidade. Preservar valores, textos e regras comerciais atuais, incluindo preço anterior, desconto e indicação de pagamento no pix quando aplicáveis.

O botão de WhatsApp fica no canto superior direito, sobre a foto, com apenas o ícone de WhatsApp. A referência ao botão de favoritos descreve sua posição e formato; a ação continua sendo compartilhar pelo WhatsApp. O botão tem nome acessível “Enviar no WhatsApp” e área de toque de pelo menos 44 × 44 px.

A condição (`Novo`, `Usado` ou `Openbox`) deixa de sobrepor a foto no mobile e aparece com as informações à direita. A imagem e o conteúdo continuam levando à página do produto; o botão de WhatsApp permanece uma ação independente, sem links aninhados ou abertura acidental do produto.

Na vitrine desktop, preservar grade, cards, posição da condição e botão de WhatsApp atuais. A listagem continua respeitando produtos habilitados e ordenação existentes.

## Página do produto no desktop

Organizar a área principal em duas colunas: uma área de mídia mais larga à esquerda e uma coluna de informações à direita. A mídia contém a faixa vertical de miniaturas e a foto selecionada em tamanho maior, lado a lado.

A coluna de informações contém título, precificação completa, parcelamento, condição, disponibilidade, cor do produto quando cadastrada e informações complementares pertinentes. O botão “Enviar no WhatsApp” fica nessa coluna.

A seção “Características do produto” começa abaixo da área de mídia, abrangendo a largura das miniaturas e da foto. A coluna de informações deve poder continuar à direita dessa seção se seu conteúdo for mais alto que a área de mídia. Sua altura não deve empurrar as características para baixo desnecessariamente. Descrição e observações existentes continuam disponíveis como seções identificáveis, sem duplicação de conteúdo.

### Miniaturas e seleção

- Até oito fotos: apresentar todas as miniaturas.
- Mais de oito fotos: apresentar as primeiras sete miniaturas e um oitavo botão com `+N`, onde `N = total de fotos − 7`.
- Exemplos: oito fotos produzem oito miniaturas; nove fotos produzem sete miniaturas e `+2`; doze fotos produzem sete miniaturas e `+5`.
- Selecionar uma miniatura por clique atualiza a foto principal e destaca a miniatura ativa. Passar o mouse na miniatura não troca a foto.
- O botão `+N` abre a galeria existente na primeira foto não representada pelas sete miniaturas, isto é, a oitava foto.
- Clicar na foto principal continua abrindo a galeria na foto selecionada.
- Remover setas, bolinhas e contador sobre a foto da apresentação desktop. A navegação e os controles internos da galeria permanecem existentes.
- A troca direta de foto fora da galeria usa as miniaturas; não haverá arraste do carrossel no desktop. As miniaturas devem continuar operáveis por teclado.
- Ao fechar a galeria, a foto escolhida nela permanece selecionada. Se estiver além da sétima foto em um produto com mais de oito imagens, o botão `+N` indica que a seleção está nesse conjunto.

### Zoom ao passar o mouse

Enquanto o mouse estiver sobre a foto principal, mostrar uma lente retangular vertical escura com opacidade aproximada de 25%, acompanhando o movimento, e manter o cursor de lupa.

A lente fica centralizada no ponteiro enquanto houver espaço e é limitada às bordas da imagem nas extremidades. O recorte considera a área efetivamente ocupada pela foto, respeitando sua proporção e eventuais espaços de `object-contain`.

Um frame flutuante imediatamente à direita da foto mostra a região delimitada pela lente ampliada. Ele se sobrepõe à coluna de informações sem deslocar o layout. As proporções do frame, da lente e a escala de ampliação devem corresponder para o recorte mostrado representar a região indicada.

Lente e frame desaparecem ao sair da área da foto, trocar de foto ou abrir a galeria. O frame não captura o ponteiro nem mantém o zoom aberto. Não ativar esse comportamento para toque ou dispositivos sem hover. A resolução original limita o detalhe disponível; não gerar imagens novas.

## Página do produto no mobile

Apresentar nesta ordem:

1. Título do produto, uma única vez, antes do carrossel.
2. Carrossel de fotos e bolinhas.
3. Grupo de precificação completo e parcelamento.
4. Condição, disponibilidade, cor do produto quando cadastrada e demais informações pertinentes.
5. Características do produto, descrição e observações quando presentes.
6. Botão “Enviar no WhatsApp”.

Preservar os gestos, animações, limites de navegação, contador, bolinhas e abertura da galeria do carrossel mobile. Preservar a navegação, o zoom e o fechamento da galeria. Não adicionar miniaturas verticais nem zoom flutuante nessa apresentação.

O botão fixo do rodapé continua usando a regra atual: aparece quando o botão principal de WhatsApp não está totalmente visível e desaparece quando ele está totalmente visível. Preservar preço, mensagem, destino do link e espaço necessário para que a barra não cubra conteúdo.

## Dados e conteúdo

O contrato atual possui `specifications` com pares `label`/`value` e não possui campo dedicado à cor. Reaproveitar a informação de cor nas especificações quando ela estiver explicitamente cadastrada. Não deduzir cor a partir da foto ou da descrição e não introduzir um campo obrigatório.

Quando houver uma especificação identificada como “Cor” (ignorando diferenças de caixa e espaços externos), apresentá-la no resumo do produto; preservar seu valor textual e evitar repeti-la na tabela de características. Outras especificações de cores específicas, como cor do mostrador ou da pulseira, continuam na tabela com seus rótulos originais.

Produtos sem cor cadastrada não mostram uma linha vazia. Esta entrega não inclui preencher ou alterar os arquivos de produtos para acrescentar cor. Nenhum seletor de variantes será criado.

Preservar a ausência de seções opcionais sem conteúdo, os links de anúncio similar, o tratamento de produto inexistente/desabilitado e a formatação de preços atual.

## Organização da implementação

- `WatchCard` e `CatalogPage`: apresentação horizontal no mobile, ação com ícone e preservação da vitrine desktop.
- `WatchPage`: composição responsiva de título, mídia, oferta, características e ação principal, com ordem de leitura coerente.
- Apresentação de mídia: separar a navegação desktop com miniaturas e zoom do carrossel mobile. Manter um estado compartilhado de foto selecionada e abertura da galeria, evitando divergências ao mudar o tamanho da janela.
- `Gallery`: reaproveitar a experiência atual; alterar somente a integração necessária para os novos pontos de abertura e restauração de foco.
- `PriceBlock`, badges, `WantLink` e `StickyBar`: reutilizar regras existentes, adaptando apenas a apresentação necessária.
- Isolar cálculo do recorte do zoom e limite da lente para que a geometria possa ser verificada independentemente do layout.

Como definição responsiva para execução, usar a vitrine compacta abaixo do breakpoint `md` atual (768 px), preservando a grade acima dele. A página de produto usa a composição desktop a partir de 1024 px; abaixo disso, usa a sequência mobile. O zoom exige também mouse com hover. Essa separação permite espaço suficiente para foto, miniaturas e coluna de informações.

## Acessibilidade e casos de borda

- Miniaturas, botão `+N`, foto principal e ação de WhatsApp têm nome acessível, foco visível e acionamento por teclado.
- Preservar o isolamento modal, o fechamento por teclado e o retorno do foco para um controle visível ao fechar a galeria.
- Uma única foto não gera navegação desnecessária; continua permitindo abrir a galeria e usar o zoom desktop.
- Imagens de proporções distintas não são distorcidas; títulos longos e tabelas não provocam rolagem horizontal da página.
- Não reservar blocos vazios para informações opcionais ausentes.
- Respeitar preferências de movimento reduzido, temas e áreas seguras do dispositivo.

## Verificação e critérios de aceite

- Conferir visualmente vitrine e produto em larguras de 320, 390, 768, 1024 e 1440 px, incluindo temas claro e escuro.
- Confirmar que a vitrine desktop mantém sua apresentação e a mobile fica horizontal, sem cards aparentes, com condição à direita e WhatsApp sobre a foto.
- Verificar miniaturas com uma, sete, oito, nove e doze fotos, cálculo de `+N`, abertura na oitava foto e sincronização após fechar a galeria.
- Verificar zoom no centro e nas bordas, recorte proporcional, fotos verticais e horizontais, encerramento ao sair e ausência de deslocamento do conteúdo.
- Confirmar a ordem mobile, ausência de título duplicado e preservação de gestos, bolinhas, contador e galeria.
- Confirmar regra de visibilidade da barra fixa e igualdade dos links de WhatsApp entre os pontos de acionamento.
- Verificar cor presente/ausente, dados opcionais, títulos longos e produtos inexistentes/desabilitados.
- Atualizar testes de comportamento afetados, preservando a cobertura de gestos, galeria e barra fixa; executar testes pertinentes e o build do projeto na implementação.

## Limites desta entrega e próxima etapa

Não inclui mudança visual da vitrine desktop, funcionalidades de favoritos, seleção de cores, variantes, filtros, busca, checkout ou alteração de preços e dados comerciais.

Este documento registra o desenho solicitado na raiz do workspace. Após revisão do documento, a próxima etapa do fluxo de brainstorming é o plano de implementação, antes de alterar o código do produto.
