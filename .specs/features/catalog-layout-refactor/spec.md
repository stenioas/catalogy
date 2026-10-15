# Catalog Layout Refactor Specification

Data: 2026-10-15
Status: execução em andamento; T1–T5 concluídas, T6–T16 pendentes.
Fonte: [desenho aprovado](../../../CATALOG-REFACTORING-DESIGN.md).
Porte: Large, com especificação completa, design técnico e tarefas formais. Todas as histórias abaixo são P1 e pertencem à entrega aprovada.

## Problem Statement

A vitrine mobile atual usa cards verticais, dificultando a consulta compacta das ofertas. A página do produto precisa separar a navegação de mídia desktop do carrossel mobile e reorganizar oferta e conteúdo, mantendo a identidade visual, o compartilhamento e os gestos existentes.

## Goals

- [ ] Apresentar vitrine horizontal abaixo de 768 px com título de até duas linhas e informações comerciais completas.
- [ ] Apresentar produto mobile/tablet abaixo de 921 px e desktop desde 921 px, com seleção de foto consistente.
- [ ] Disponibilizar miniaturas e zoom desktop, color opcional e conteúdo sem blocos vazios.
- [ ] Preservar tokens, regras comerciais, galeria, acessibilidade e barra fixa em todas as larguras.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Redesenho da vitrine desktop ou nova identidade visual | Aprovada somente a reorganização dentro dos tokens atuais. |
| Favoritos, filtros, busca, checkout e seleção de variantes | Não pertencem ao fluxo aprovado. |
| Lista de cores e troca de fotos por cor | color representa somente a unidade ofertada. |
| Alteração dos JSONs de produtos, preços ou estoque | Contrato novo é opcional; não há migração de dados. |
| Novos arquivos de fotos ou imagens geradas | Zoom utiliza as imagens existentes. |
| Backend, autenticação, analytics e publicação | Catálogo estático; nenhuma integração nova foi solicitada. |
| Correções não relacionadas na skill de cadastro | Atualização limitada à integração de color. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Breakpoints diferentes | Vitrine horizontal abaixo de 768 px; produto desktop desde 921 px | Decisão Q9 preserva a vitrine desktop atual. | Sim |
| Densidade da vitrine | Título até duas linhas com reticências; demais informações completas; altura variável | Decisões Q1 e Q2. | Sim |
| Identidade | Tokens atuais, sem reprodução exata do Mercado Livre | Decisão Q3. | Sim |
| Barra fixa | Regra atual em todas as larguras | Decisão Q4. | Sim |
| Conteúdo vazio | Ocultar strings vazias ou só com espaços sem editar JSONs | Decisão Q6. | Sim |
| Fonte da cor | color opcional, string única; specifications permanece independente | Decisões Q7, Q10 e Q11. | Sim |
| Fluxo de cadastro | Documentar color e atualizar skill; não preencher produtos atuais | Decisão Q12. | Sim |
| Ordem desktop | Descrição, observações, características na esquerda sob a mídia | Decisão Q13 substitui a ordem anterior apenas no desktop. | Sim |
| Ordem mobile | Características, descrição, observações antes do WhatsApp | Desenho aprovado, preservado após Q13. | Sim |
| Geometria do zoom | Dimensões adaptáveis; frame dentro da janela; recorte corresponde à lente | Discrição concedida em Q8; medidas concretas pertencem ao design técnico. | Sim |
| Tipos inválidos de color | Rejeitar null, números, arrays e objetos | Campo opcional string segue convenção do schema Zod atual. | Premissa técnica |
| Espaços em color | Usar trim apenas para decidir presença; preservar texto cadastrado no valor exibido | Evita transformação divergente entre dev e build; normalização de dados não foi solicitada. | Premissa técnica |
| Setas de tablet | Visíveis entre 768 e 920 px quando houver várias fotos | Preservação da regra atual de md dentro da composição mobile/tablet. | Premissa explicitada no desenho |
| Falha de carregamento de imagem | Não criar fallback visual nem mecanismo de retry nesta entrega | Desenho não altera esse tratamento; zoom só pode calcular com dimensões disponíveis. | Premissa de escopo |
| Precisão geométrica | Validar recortes em coordenadas da imagem com tolerância de arredondamento de até 1 px CSS | Define oráculo verificável sem impor tamanho fixo à lente. | Premissa técnica |

**Open questions:** none — decisões de produto resolvidas; premissas técnicas identificadas para revisão.

## Implicit-Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | color aceita string opcional; fotos e preços mantêm validação atual; seleção limitada às fotos existentes; lente limitada à imagem. |
| Failure / partial-failure states | Produto ausente/desabilitado mantém mensagem; sem migração ou escrita parcial; falha de imagem permanece no comportamento atual. |
| Idempotency / retry / duplicate handling | N/A porque não há operação de escrita ou retry novo; repetição de Cor em specifications é preservada como dado independente. |
| Auth boundaries & rate limits | N/A porque catálogo é público e estático, sem endpoint novo. |
| Concurrency / ordering | Estado de seleção e abertura preservado ao redimensionar; ordens de seções distintas e explícitas por composição. |
| Data lifecycle / expiry | N/A porque nenhum dado ganha persistência, expiração ou exclusão; JSONs atuais permanecem intactos. |
| Observability | N/A porque não há serviço ou telemetria nova; evidência fica nos testes e na validação da feature. |
| External-dependency failure | WhatsApp continua somente como link externo; N/A para integração e retry porque o site não chama API do WhatsApp. |
| State-transition integrity | Miniatura, +N, galeria e breakpoint preservam seleção; fechar modal restaura foco; sair/trocar/abrir modal encerra zoom. |

## User Stories

### P1 / US1: Vitrine compacta

**User Story**: Como visitante no celular, quero comparar as informações principais de vários produtos sem abrir cada página.

**Why P1**: Vitrine é a entrada do catálogo e deve preservar as informações comerciais.

**Acceptance Criteria**:

1. WHILE a largura da janela for menor que 768 px, o catálogo SHALL apresentar cada produto em linha horizontal, com foto à esquerda e informações à direita. <!-- CATREF-01 -->
2. WHILE a vitrine estiver horizontal, o catálogo SHALL apresentar itens sem contorno, sombra ou elevação de card. <!-- CATREF-02 -->
3. WHILE a vitrine estiver horizontal, o catálogo SHALL limitar o título visualmente a duas linhas com reticências no excedente. <!-- CATREF-03 -->
4. WHILE a vitrine estiver horizontal, o catálogo SHALL exibir integralmente as informações comerciais atuais: precificação, parcelamento, condição e disponibilidade. <!-- CATREF-04 -->
5. The catalog SHALL omitir descrição e características dos itens da vitrine. <!-- CATREF-05 -->
6. WHILE a vitrine estiver horizontal, o catálogo SHALL permitir alturas variáveis com foto de tamanho consistente entre itens, sem exigir alinhamento dos preços entre linhas. <!-- CATREF-06 -->
7. WHILE a vitrine estiver horizontal, o catálogo SHALL posicionar a condição na coluna de informações. <!-- CATREF-07 -->
8. WHILE a vitrine estiver horizontal, o catálogo SHALL posicionar a ação de WhatsApp apenas com ícone no canto superior direito sobre a foto. <!-- CATREF-08 -->
9. The catalog SHALL oferecer à ação de WhatsApp da vitrine nome acessível “Enviar no WhatsApp” e área de toque mínima de 44 × 44 px. <!-- CATREF-09 -->
10. WHEN o visitante acionar a foto ou o conteúdo do item THEN o catálogo SHALL abrir a página desse produto. <!-- CATREF-10 -->
11. WHEN o visitante acionar o WhatsApp do item THEN o catálogo SHALL abrir exclusivamente o compartilhamento, sem navegar à página do produto e sem links aninhados. <!-- CATREF-11 -->
12. WHILE a largura for maior ou igual a 768 px, o catálogo SHALL preservar a apresentação atual da vitrine desktop, incluindo grade, cards, condição e botão de WhatsApp. <!-- CATREF-12 -->

**Independent Test**: Renderizar produtos com títulos curtos e longos, todos os estados e preços com e sem desconto em 320, 390, 767 e 768 px.

### P1 / US2: Composição responsiva do produto

**User Story**: Como visitante, quero encontrar fotos, oferta e conteúdo do produto em uma ordem adequada à minha tela.

**Why P1**: A reorganização da página é parte central da entrega.

**Acceptance Criteria**:

1. WHILE a largura for menor que 921 px, o catálogo SHALL ordenar a página como título → carrossel → precificação e parcelamento → condição, disponibilidade e cor → características → descrição → observações → WhatsApp principal, omitindo blocos sem conteúdo. <!-- CATREF-13 -->
2. The catalog SHALL apresentar o título do produto uma única vez na composição visível, sem truncar o título da página por causa da regra de duas linhas da vitrine. <!-- CATREF-14 -->
3. WHILE a largura for maior ou igual a 921 px, o catálogo SHALL apresentar mídia à esquerda em área mais larga que a coluna de informações à direita. <!-- CATREF-15 -->
4. WHILE a composição desktop estiver ativa, o catálogo SHALL apresentar miniaturas verticais ao lado da foto principal na área de mídia. <!-- CATREF-16 -->
5. WHILE a composição desktop estiver ativa, o catálogo SHALL apresentar título, precificação, parcelamento, condição, disponibilidade, cor cadastrada e WhatsApp principal na coluna direita. <!-- CATREF-17 -->
6. WHILE a composição desktop estiver ativa, o catálogo SHALL ordenar descrição → observações → características na coluna esquerda abaixo da mídia, abrangendo a largura das miniaturas e da foto. <!-- CATREF-18 -->
7. WHILE a coluna comercial for mais alta que a mídia no desktop, o catálogo SHALL iniciar as seções esquerdas abaixo da mídia sem aguardar o final da coluna comercial. <!-- CATREF-19 -->
8. The catalog SHALL identificar a tabela de especificações na página como “Características do produto”. <!-- CATREF-20 -->

**Independent Test**: Usar produto com todas as seções e resumo comercial alto em 920 e 921 px; verificar ordem e posição sem depender da altura da coluna direita.

### P1 / US3: Seleção desktop e galeria compartilhada

**User Story**: Como visitante no desktop, quero selecionar fotos pelas miniaturas e continuar na mesma foto após usar a galeria.

**Why P1**: Seleção consistente é necessária para substituir o carrossel desktop.

**Acceptance Criteria**:

1. WHILE o produto tiver até oito fotos e a composição desktop estiver ativa, o catálogo SHALL apresentar todas as miniaturas. <!-- CATREF-21 -->
2. WHILE o produto tiver mais de oito fotos e a composição desktop estiver ativa, o catálogo SHALL apresentar as primeiras sete miniaturas e um oitavo botão +N, com N igual ao total de fotos menos sete. <!-- CATREF-22 -->
3. WHEN uma miniatura for acionada THEN o catálogo SHALL selecionar sua foto como principal e indicar essa miniatura como ativa. <!-- CATREF-23 -->
4. WHEN o ponteiro apenas passar sobre uma miniatura THEN o catálogo SHALL manter a seleção atual. <!-- CATREF-24 -->
5. WHEN o botão +N for acionado THEN o catálogo SHALL abrir a galeria na oitava foto, independentemente da seleção anterior. <!-- CATREF-25 -->
6. WHEN a foto principal for acionada THEN o catálogo SHALL abrir a galeria na foto atualmente selecionada. <!-- CATREF-26 -->
7. WHILE a composição desktop estiver ativa, o catálogo SHALL omitir setas, bolinhas e contador sobre a apresentação principal de fotos. <!-- CATREF-27 -->
8. WHEN houver arraste na foto principal desktop THEN o catálogo SHALL manter a seleção, sem navegar como carrossel. <!-- CATREF-28 -->
9. WHEN a galeria for fechada THEN o catálogo SHALL manter selecionada na página a última foto escolhida nela. <!-- CATREF-29 -->
10. WHILE houver mais de oito fotos e a seleção estiver na oitava ou posterior, o catálogo SHALL indicar o botão +N como representante da seleção ativa. <!-- CATREF-30 -->
11. WHEN a janela cruzar o breakpoint de 921 px THEN o catálogo SHALL preservar a foto selecionada e o estado aberto ou fechado da galeria. <!-- CATREF-31 -->

**Independent Test**: Usar fixtures de 1, 7, 8, 9 e 12 fotos; navegar por miniaturas, abrir e fechar a galeria e cruzar 920/921 px com ela aberta e fechada.

### P1 / US4: Zoom desktop

**User Story**: Como visitante com mouse, quero inspecionar detalhes da foto sem abrir a galeria.

**Why P1**: Zoom flutuante faz parte do comportamento aprovado para a nova mídia desktop.

**Acceptance Criteria**:

1. WHILE houver mouse com hover sobre a área efetivamente ocupada pela foto principal desktop, o catálogo SHALL exibir lente retangular vertical escura com opacidade de aproximadamente 25% e cursor de lupa. <!-- CATREF-32 -->
2. WHEN o ponteiro se mover sobre a foto THEN o catálogo SHALL centralizar a lente no ponteiro, limitando sua posição às bordas efetivas da imagem. <!-- CATREF-33 -->
3. The catalog SHALL calcular o recorte sobre a área da imagem após object-contain, excluindo espaços vazios do contêiner. <!-- CATREF-34 -->
4. WHILE a lente estiver visível, o catálogo SHALL mostrar imediatamente à direita da foto um frame flutuante com exatamente a região delimitada pela lente, sem distorção de proporção. <!-- CATREF-35 -->
5. WHILE o zoom estiver ativo, o catálogo SHALL sobrepor o frame à coluna de informações sem deslocar o layout. <!-- CATREF-36 -->
6. The catalog SHALL adaptar lente, frame e escala ao espaço disponível para manter o frame dentro da janela com ampliação maior que 1×. <!-- CATREF-37 -->
7. WHEN o ponteiro sair da foto, a foto for trocada ou a galeria for aberta THEN o catálogo SHALL remover lente e frame. <!-- CATREF-38 -->
8. The catalog SHALL impedir que o frame capture eventos de ponteiro ou mantenha o zoom aberto. <!-- CATREF-39 -->
9. WHILE a interação for por toque, não houver hover ou a largura for menor que 921 px, o catálogo SHALL manter o zoom flutuante inativo. <!-- CATREF-40 -->
10. The catalog SHALL usar somente as fotos existentes para o zoom, sem gerar novos arquivos de imagem. <!-- CATREF-41 -->

**Independent Test**: Inspecionar centro e quatro bordas com fotos verticais e horizontais em 921, 1024 e 1440 px; comparar os limites da lente com o recorte ampliado.

### P1 / US5: Preservação do carrossel e da galeria

**User Story**: Como visitante no celular ou tablet, quero continuar usando os gestos e a galeria já conhecidos.

**Why P1**: A nova organização não pode regredir a navegação de fotos.

**Acceptance Criteria**:

1. WHILE a largura estiver entre 768 e 920 px e houver mais de uma foto, o catálogo SHALL preservar as setas atuais do carrossel. <!-- CATREF-42 -->
2. WHILE a largura for menor que 768 px, o catálogo SHALL manter ocultas as setas da apresentação do carrossel. <!-- CATREF-43 -->
3. WHEN o visitante usar arraste, bolinhas ou teclado no carrossel THEN o catálogo SHALL preservar a navegação atual limitada à primeira e à última foto, sem ciclo. <!-- CATREF-44 -->
4. WHILE houver mais de uma foto no carrossel mobile/tablet, o catálogo SHALL preservar contador, bolinhas e indicação da foto atual. <!-- CATREF-45 -->
5. WHEN o visitante tocar a foto sem arraste suficiente para navegar THEN o catálogo SHALL abrir a galeria na seleção atual. <!-- CATREF-46 -->
6. The catalog SHALL preservar na galeria pinch, duplo toque entre 1× e 3×, Ctrl+wheel e deslocamento da imagem ampliada com os limites atuais. <!-- CATREF-47 -->
7. The catalog SHALL preservar o fechamento da galeria pelo botão, Escape e clique no fundo. <!-- CATREF-48 -->
8. WHILE a galeria estiver aberta, o catálogo SHALL manter o conteúdo externo inerte e bloquear a rolagem do fundo. <!-- CATREF-49 -->
9. WHEN a galeria for fechada THEN o catálogo SHALL devolver o foco ao acionador se ainda estiver visível, ou à foto principal visível na composição atual. <!-- CATREF-50 -->
10. WHILE houver uma única foto, o catálogo SHALL omitir navegação desnecessária sem impedir a abertura da galeria nem o zoom desktop. <!-- CATREF-51 -->

**Independent Test**: Executar a suíte de gestos existente e verificar carrossel em 390, 768 e 920 px; testar galeria e foco com uma e várias fotos.

### P1 / US6: Cor opcional e conteúdo preenchido

**User Story**: Como operador, quero cadastrar uma única cor opcional e apresentar apenas conteúdo preenchido ao visitante.

**Why P1**: O novo resumo precisa de contrato explícito e compatibilidade com o catálogo atual.

**Acceptance Criteria**:

1. The product contract SHALL aceitar color como propriedade opcional do tipo string com um único valor livre. <!-- CATREF-52 -->
2. IF color tiver tipo diferente de string e não estiver ausente THEN o contrato SHALL rejeitar esse valor. <!-- CATREF-53 -->
3. WHILE color contiver texto não vazio após desconsiderar espaços externos, o catálogo SHALL exibir seu valor textual no resumo do produto. <!-- CATREF-54 -->
4. WHILE color estiver ausente, vazio ou somente com espaços, o catálogo SHALL omitir a linha de cor. <!-- CATREF-55 -->
5. The catalog SHALL obter a cor do resumo exclusivamente de color, sem inferência de fotos, descrição ou specifications. <!-- CATREF-56 -->
6. The catalog SHALL preservar na tabela todas as especificações com valor preenchido e seus rótulos, inclusive Cor, Cor do mostrador e Cor da pulseira. <!-- CATREF-57 -->
7. WHILE uma especificação tiver valor vazio ou somente com espaços, o catálogo SHALL omitir essa linha. <!-- CATREF-58 -->
8. WHILE uma seção opcional não tiver conteúdo após desconsiderar espaços externos, o catálogo SHALL omitir a seção inteira sem reservar bloco vazio. <!-- CATREF-59 -->
9. The delivery SHALL atualizar a documentação e a skill cadastrar-relogio com color opcional e orientação para evitar duplicá-lo nas especificações. <!-- CATREF-60 -->
10. The delivery SHALL preservar os arquivos dos produtos atuais sem preenchimento ou migração de cor. <!-- CATREF-61 -->

**Independent Test**: Validar fixtures com color ausente, texto, string vazia, espaços, null e número; conferir especificações Cor independentes e seções vazias.

### P1 / US7: Identidade, acessibilidade e regras comerciais

**User Story**: Como visitante, quero manter a identidade do catálogo e compartilhar a mesma oferta em qualquer apresentação.

**Why P1**: Compatibilidade visual, acessibilidade e dados comerciais são restrições obrigatórias.

**Acceptance Criteria**:

1. The catalog SHALL preservar integralmente a identidade visual atual usando os tokens do projeto, tendo Mercado Livre somente como referência de organização. <!-- CATREF-62 -->
2. The catalog SHALL preservar a precificação atual: formatação BRL, preço anterior opcional, desconto inteiro arredondado para baixo exibido desde 1%, texto “no pix” e “ou em até 12x com juros”. <!-- CATREF-63 -->
3. The catalog SHALL preservar a listagem de produtos com enabled diferente de false e sua ordenação atual por título com Intl.Collator de pt-BR, sem excluir produtos por disponibilidade. <!-- CATREF-64 -->
4. IF o produto não existir ou estiver desabilitado THEN o catálogo SHALL manter a mensagem “Este relógio não está no catálogo.”. <!-- CATREF-65 -->
5. The catalog SHALL preservar os links de anúncio similar das especificações preenchidas. <!-- CATREF-66 -->
6. The catalog SHALL produzir em todas as ações de WhatsApp do mesmo produto o mesmo link wa.me sem telefone, com a mensagem “Olá, tenho interesse no {title}. {origin}/product/{slug}”. <!-- CATREF-67 -->
7. WHILE o WhatsApp principal não estiver totalmente visível, o catálogo SHALL exibir a barra fixa em qualquer largura. <!-- CATREF-68 -->
8. WHILE o WhatsApp principal estiver totalmente visível, o catálogo SHALL ocultar a barra fixa em qualquer largura. <!-- CATREF-69 -->
9. WHILE a barra fixa estiver visível, o catálogo SHALL reservar espaço correspondente à sua altura e à área segura para não cobrir o conteúdo final. <!-- CATREF-70 -->
10. The catalog SHALL oferecer nomes acessíveis, foco visível e acionamento por teclado para miniaturas, +N, foto principal e WhatsApp. <!-- CATREF-71 -->
11. The catalog SHALL preservar proporções das fotos sem distorção e impedir rolagem horizontal da página causada por títulos ou tabelas. <!-- CATREF-72 -->
12. WHILE a preferência de movimento reduzido estiver ativa, o catálogo SHALL manter as transições de navegação de fotos com duração de 0 ms. <!-- CATREF-73 -->

**Independent Test**: Comparar temas claro/escuro e links de todas as ações; navegar por teclado e executar testes de regressão e build.

## Edge Cases

- Uma foto: abrir galeria e usar zoom desktop sem controles de navegação desnecessários.
- Sete e oito fotos: todas as miniaturas; nove: sete miniaturas e +2; doze: sete miniaturas e +5.
- Foto selecionada além da sétima: +N representa seleção após fechar galeria.
- Redimensionamento com modal aberto: continuar aberto na mesma foto; retorno de foco visível ao fechar.
- Foto vertical, horizontal e espaços de object-contain: lente e recorte usam apenas a imagem efetiva.
- Título longo na vitrine: duas linhas; título na página: completo e sem overflow horizontal.
- Características somente vazias: omitir seção inteira; rótulos repetidos com valores preenchidos continuam presentes.
- color junto de uma especificação Cor: apresentar ambos em seus lugares, sem extração automática.

## Requirement Traceability

Cada ID identifica exatamente um critério de aceite. As tarefas vinculam as entregas aos requisitos; as evidências atuais registram somente o escopo concluído.

| Requirement ID | Story | Phase | Status | Tasks |
| --- | --- | --- | --- | --- |
| CATREF-01 | US1: Vitrine compacta / AC1 | Execute | Implemented — T6 | T6, T16 |
| CATREF-02 | US1: Vitrine compacta / AC2 | Execute | Implemented — T6 | T6, T16 |
| CATREF-03 | US1: Vitrine compacta / AC3 | Execute | Implemented — T6; live title set does not visibly exceed two lines | T6, T16 |
| CATREF-04 | US1: Vitrine compacta / AC4 | Execute | Implemented — T5 PriceBlock + T6 WatchCard | T5, T6, T16 |
| CATREF-05 | US1: Vitrine compacta / AC5 | Execute | Implemented — T6 | T6, T16 |
| CATREF-06 | US1: Vitrine compacta / AC6 | Execute | Implemented — T6 | T6, T16 |
| CATREF-07 | US1: Vitrine compacta / AC7 | Execute | Implemented — T6 | T6, T16 |
| CATREF-08 | US1: Vitrine compacta / AC8 | Execute | Implemented — T4 action integrated by T6 | T4, T6, T16 |
| CATREF-09 | US1: Vitrine compacta / AC9 | Execute | Implemented — T4 accessible action integrated by T6 | T4, T6, T16 |
| CATREF-10 | US1: Vitrine compacta / AC10 | Execute | Implemented — T6 | T6, T16 |
| CATREF-11 | US1: Vitrine compacta / AC11 | Execute | Implemented — T4 action integrated by T6 | T4, T6, T16 |
| CATREF-12 | US1: Vitrine compacta / AC12 | Execute | Implemented — T6; desktop compared at 768/1024/1440 px | T6, T16 |
| CATREF-13 | US2: Composição responsiva do produto / AC1 | Tasks | In Tasks | T13, T16 |
| CATREF-14 | US2: Composição responsiva do produto / AC2 | Tasks | In Tasks | T13, T16 |
| CATREF-15 | US2: Composição responsiva do produto / AC3 | Tasks | In Tasks | T13, T16 |
| CATREF-16 | US2: Composição responsiva do produto / AC4 | Tasks | In Tasks | T9, T13, T16 |
| CATREF-17 | US2: Composição responsiva do produto / AC5 | Tasks | In Tasks | T13, T16 |
| CATREF-18 | US2: Composição responsiva do produto / AC6 | Tasks | In Tasks | T13, T16 |
| CATREF-19 | US2: Composição responsiva do produto / AC7 | Tasks | In Tasks | T13, T16 |
| CATREF-20 | US2: Composição responsiva do produto / AC8 | Tasks | In Tasks | T13, T16 |
| CATREF-21 | US3: Seleção desktop e galeria compartilhada / AC1 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-22 | US3: Seleção desktop e galeria compartilhada / AC2 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-23 | US3: Seleção desktop e galeria compartilhada / AC3 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-24 | US3: Seleção desktop e galeria compartilhada / AC4 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-25 | US3: Seleção desktop e galeria compartilhada / AC5 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-26 | US3: Seleção desktop e galeria compartilhada / AC6 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-27 | US3: Seleção desktop e galeria compartilhada / AC7 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-28 | US3: Seleção desktop e galeria compartilhada / AC8 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-29 | US3: Seleção desktop e galeria compartilhada / AC9 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-30 | US3: Seleção desktop e galeria compartilhada / AC10 | Tasks | In Tasks | T9, T11, T16 |
| CATREF-31 | US3: Seleção desktop e galeria compartilhada / AC11 | Tasks | In Tasks | T11, T14, T16 |
| CATREF-32 | US4: Zoom desktop / AC1 | Tasks | In Tasks | T8, T16 |
| CATREF-33 | US4: Zoom desktop / AC2 | Execute | Partial: cálculo e limites de lente verificados em T7; exibição e cursor em T8/T16 | T7, T8, T16 |
| CATREF-34 | US4: Zoom desktop / AC3 | Execute | Partial: imagem efetiva e descarte de letterbox verificados em T7; integração em T8/T16 | T7, T8, T16 |
| CATREF-35 | US4: Zoom desktop / AC4 | Execute | Partial: geometria do frame/source e escala verificada em T7; renderização do recorte em T8/T16 | T7, T8, T16 |
| CATREF-36 | US4: Zoom desktop / AC5 | Tasks | In Tasks | T8, T16 |
| CATREF-37 | US4: Zoom desktop / AC6 | Execute | Partial: limites de viewport e ampliação verificados em T7; comportamento visual em T8/T16 | T7, T8, T16 |
| CATREF-38 | US4: Zoom desktop / AC7 | Tasks | In Tasks | T8, T16 |
| CATREF-39 | US4: Zoom desktop / AC8 | Tasks | In Tasks | T8, T16 |
| CATREF-40 | US4: Zoom desktop / AC9 | Tasks | In Tasks | T8, T11, T16 |
| CATREF-41 | US4: Zoom desktop / AC10 | Execute | Partial: função geométrica não gera imagens e usa dimensões naturais em T7; integração com imagem existente em T8/T16 | T7, T8, T16 |
| CATREF-42 | US5: Preservação do carrossel e da galeria / AC1 | Tasks | In Tasks | T10, T16 |
| CATREF-43 | US5: Preservação do carrossel e da galeria / AC2 | Tasks | In Tasks | T10, T16 |
| CATREF-44 | US5: Preservação do carrossel e da galeria / AC3 | Tasks | In Tasks | T10, T14, T16 |
| CATREF-45 | US5: Preservação do carrossel e da galeria / AC4 | Tasks | In Tasks | T10, T16 |
| CATREF-46 | US5: Preservação do carrossel e da galeria / AC5 | Tasks | In Tasks | T10, T14, T16 |
| CATREF-47 | US5: Preservação do carrossel e da galeria / AC6 | Tasks | In Tasks | T11, T14, T16 |
| CATREF-48 | US5: Preservação do carrossel e da galeria / AC7 | Tasks | In Tasks | T11, T14, T16 |
| CATREF-49 | US5: Preservação do carrossel e da galeria / AC8 | Tasks | In Tasks | T11, T14, T16 |
| CATREF-50 | US5: Preservação do carrossel e da galeria / AC9 | Tasks | In Tasks | T11, T14, T16 |
| CATREF-51 | US5: Preservação do carrossel e da galeria / AC10 | Tasks | In Tasks | T9, T10, T11, T14, T16 |
| CATREF-52 | US6: Cor opcional e conteúdo preenchido / AC1 | Execute | Implemented | T1, T16 |
| CATREF-53 | US6: Cor opcional e conteúdo preenchido / AC2 | Execute | Implemented | T1, T16 |
| CATREF-54 | US6: Cor opcional e conteúdo preenchido / AC3 | Tasks | In Tasks | T13, T16 |
| CATREF-55 | US6: Cor opcional e conteúdo preenchido / AC4 | Tasks | In Tasks | T13, T16 |
| CATREF-56 | US6: Cor opcional e conteúdo preenchido / AC5 | Tasks | In Tasks | T13, T16 |
| CATREF-57 | US6: Cor opcional e conteúdo preenchido / AC6 | Tasks | In Tasks | T13, T16 |
| CATREF-58 | US6: Cor opcional e conteúdo preenchido / AC7 | Tasks | In Tasks | T13, T16 |
| CATREF-59 | US6: Cor opcional e conteúdo preenchido / AC8 | Tasks | In Tasks | T13, T16 |
| CATREF-60 | US6: Cor opcional e conteúdo preenchido / AC9 | Execute | Implemented — T2 README e T3 skill concluídos | T2, T3, T16 |
| CATREF-61 | US6: Cor opcional e conteúdo preenchido / AC10 | Execute | Implemented | T1, T2, T3, T13, T16 |
| CATREF-62 | US7: Identidade, acessibilidade e regras comerciais / AC1 | Execute | Partial: WatchCard uses project tokens and matches T6 desktop baseline; other surfaces in T8/T13/T16 | T6, T8, T13, T16 |
| CATREF-63 | US7: Identidade, acessibilidade e regras comerciais / AC2 | Execute | Partial: T5 preserva regras e conteúdo do PriceBlock; integrações restantes em T13/T16 | T5, T13, T16 |
| CATREF-64 | US7: Identidade, acessibilidade e regras comerciais / AC3 | Execute | Implemented — CatalogPage filter and Portuguese ordering regressions revalidated in T6 | T6, T16 |
| CATREF-65 | US7: Identidade, acessibilidade e regras comerciais / AC4 | Tasks | In Tasks | T13, T16 |
| CATREF-66 | US7: Identidade, acessibilidade e regras comerciais / AC5 | Tasks | In Tasks | T13, T16 |
| CATREF-67 | US7: Identidade, acessibilidade e regras comerciais / AC6 | Execute | Partial: WatchCard actions share URL in T4/T6; Product page integration in T13 | T4, T6, T13, T16 |
| CATREF-68 | US7: Identidade, acessibilidade e regras comerciais / AC7 | Tasks | In Tasks | T12, T13, T15, T16 |
| CATREF-69 | US7: Identidade, acessibilidade e regras comerciais / AC8 | Tasks | In Tasks | T12, T13, T15, T16 |
| CATREF-70 | US7: Identidade, acessibilidade e regras comerciais / AC9 | Tasks | In Tasks | T12, T13, T15, T16 |
| CATREF-71 | US7: Identidade, acessibilidade e regras comerciais / AC10 | Execute | Partial: T4/T6 WhatsApp has accessible name and visible keyboard focus; remaining controls in T9/T10/T11/T13/T14 | T4, T6, T9, T10, T11, T13, T14, T16 |
| CATREF-72 | US7: Identidade, acessibilidade e regras comerciais / AC11 | Execute | Partial: T6 verifies no overflow in CatalogPage; other media/product surfaces in T8/T9/T13 | T5, T6, T8, T9, T13, T16 |
| CATREF-73 | US7: Identidade, acessibilidade e regras comerciais / AC12 | Tasks | In Tasks | T10, T11, T14, T16 |

**Coverage:** 73 total, 73 mapped to tasks, 0 unmapped; T1–T6 concluídas e T7–T16 pendentes.

### T5 execution evidence

| Requirement | Evidence and status |
| --- | --- |
| CATREF-04 | Partial. `client/src/components/catalog/price-block.test.tsx:139` — `expect(row?.className).toMatch(/\bflex-wrap\b/)`; `:161` — `expect(screen.getByTestId('price-list').textContent).toBe('De R$ 123.456.789,99')`. WatchCard integration and actual compact layout are verified in T6. |
| CATREF-63 | Partial. Existing assertions preserve BRL (`price-block.test.tsx:61` — current price equals `R$ 369,90`), installments (`:70` — text equals `ou em até 12x com juros`), Pix (`:79` — text equals `no pix`), and discount behavior (`:99` — `−17%`; `:110` — no badge below 1%). New cases preserve long-price values with and without the seal (`:161`, `:162`, `:172`, `:173`). |
| CATREF-72 | Partial. Default callers retain nowrap (`price-block.test.tsx:149` — `expect(row?.className).toMatch(/\bflex-nowrap\b/)`; `:151` — `expect(row?.className).not.toMatch(/\bflex-wrap\b/)`). Browser verification of overflow is assigned to T6. |

Full gate `pnpm test`: **318 passed, 0 failed, 0 skipped** (64 shared, 1 prebuild, 253 client), four above the 314-test baseline. T5 adds four explicit scenarios in `client/src/components/catalog/price-block.test.tsx`; the focused PriceBlock run passed 20 tests.

### T6 execution evidence

| Requirement | Evidence and status |
| --- | --- |
| CATREF-01–12 | Implemented and verified in WatchCard. Detailed AC-to-assertion mapping, browser measurements, screenshot viewports, and the live-title limitation are in [tasks.md — T6 execution record](tasks.md). |
| CATREF-62 | Partial. WatchCard preserves project tokens and desktop appearance against baseline; remaining product/media surfaces belong to T8/T13/T16. |
| CATREF-64 | Implemented. Five existing CatalogPage scenarios revalidated Portuguese ordering, disabled-product filtering, stable order, and generated-source order in `client/src/routes/catalog-page.test.tsx:102-142,227-278`. |
| CATREF-67 | Partial. T4/T6 WatchCard actions use an identical WhatsApp destination and remain independent of product navigation; the product page integration is assigned to T13. |
| CATREF-71 | Partial. T6 mobile WhatsApp action has an accessible name and visible keyboard focus; remaining gallery/product controls are assigned to later tasks. |
| CATREF-72 | Partial. T6 measured no horizontal overflow at 320/390/767/768/1024/1440 px; other media/product surfaces are assigned to T8/T9/T13. |

`pnpm test`: **326 passed, 0 failed, 0 skipped** (64 shared, 1 prebuild, 261 client), 8 above T5. `pnpm build` passed; Vite transformed 2,126 modules. Effective browser theme was light, as noted in [baseline.md](baseline.md); no product data changed and screenshots were shown in the conversation without local PNG files.

## Success Criteria

- [ ] Todos os critérios CATREF possuem evidência de verificação antes do encerramento da implementação.
- [ ] Revisão visual em 320, 390, 767, 768, 920, 921, 1024 e 1440 px nos temas claro e escuro, com tokens e identidade preservados.
- [ ] Vitrine desktop mantém a apresentação anterior nas mesmas larguras.
- [ ] Zoom representa o recorte da lente no centro e nas bordas, com tolerância máxima de 1 px CSS nos cálculos e frame contido na janela.
- [ ] Testes afetados derivam destes critérios e preservam cobertura de gestos, galeria e barra fixa; pnpm test e pnpm build passam.
- [ ] Verificador independente registra evidência por critério e executa sensor de discriminação em cópia isolada, sem alterar a árvore real.

## Verification Plan

| Area | Planned evidence |
| --- | --- |
| Vitrine e composição | Testes de conteúdo/ações e navegador para layout, truncamento, ordem, cores e breakpoints. |
| Seleção e modal | Testes de miniaturas, +N, galeria, teclado, foco e mudança de breakpoint. |
| Zoom | Testes de geometria com coordenadas conhecidas e navegador para correspondência visual, hover, toque e sobreposição. |
| Dados | Schema, carregamento e renderização de fixtures de color e conteúdo vazio; documentação e skill revisadas. |
| Regressões | Suítes atuais de gestos, preço, links e barra fixa; build; catálogo real sem alterações. |

## Next Step

Especificação, contexto e design técnico aprovados. Aprovar tasks.md e a distribuição de ferramentas antes de executar. O desenho da raiz continua sendo a fonte das decisões de produto; design.md tratará apenas da arquitetura de implementação.
