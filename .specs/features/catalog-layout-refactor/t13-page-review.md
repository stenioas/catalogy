# T13 — composição integrada da página

PASS no escopo T13. Gate `pnpm test`: 449 passed, 0 failed, 0 skipped (64 shared, 1 prebuild, 384 client). São +15 sobre T12 (434) e +150 sobre a baseline inicial (299). WatchPage executou 46 cenários: 31 existentes preservados/migrados e 15 novos. A suíte client em diagnóstico verbose confirmou os mesmos 384 testes, sem falhas.

## Navegador

Chrome via CUA, servidor existente `http://localhost:5173`. Capturas exibidas na conversa; nenhum PNG local salvo. Tema efetivo claro (`document.documentElement.className === ''`), conforme limitação preexistente registrada em baseline.md. Não foi corrigido nem alegado tema escuro real nesta tarefa. Rodada agrupada e confirmação, sem ajustes cosméticos posteriores. Viewport temporário restaurado.

A fixture temporária `/t13-visual.html` importou a WatchPage real e substituiu somente o array em memória do módulo gerado, preservando slug/fotos existentes. Título longo fez a oferta comercial ficar mais alta que a mídia; color Azul, especificação Cor Prata, descrição, observações e uma linha vazia permitiram conferir os critérios. CSS temporário importou index.css com @source explícito para o servidor já ativo. Os três arquivos temporários foram removidos antes do commit; nenhum JSON de produto ou configuração foi alterado.

### Oferta alta em 921 × 1000

- Esquerda: x=24, y=96, width=500.390625, bottom=890.96875.
- Direita: x=548.390625, y=96, width=333.609375, bottom=2064.984375.
- Mídia: y=96, height=476, bottom=572. Miniaturas verticais ao lado da foto.
- Descrição: y=604, width=500.390625. Observações y=696.984375; Características y=789.96875.
- Assim, a descrição começa 32 px após a mídia, muito antes do final da oferta direita. As seções abrangem toda a largura esquerda, incluindo a faixa de miniaturas.
- Um h1 completo; scrollWidth=clientWidth=906 (janela innerWidth=921, scrollbar de 15 px). Nenhuma rolagem horizontal.

Em 920 × 1000, a mesma fixture mostrou exatamente título → watch-carousel → watch-offer (preço, condição, disponibilidade, color) → Características do produto → Descrição → Observações → WhatsApp. Coluna esquerda desktop ausente; setas de tablet presentes; um h1; scrollWidth=clientWidth=905.

### Produto real

Rota `/product/addiesdive-ad2554`, foto carregada com object-fit contain, cor do resumo ausente como no cadastro. Inspecionadas larguras 320/390/767/768/920/921/1024/1440, altura 1000. Valores de scrollWidth/clientWidth sem overflow: 305/305, 375/375, 752/752, 753/753, 905/905, 906/906, 1009/1009, 1425/1425. A composição é mobile até 920 e desktop desde 921; medidas de colunas desktop: 500.39/333.61 em 921, 562.19/374.80 em 1024 e 628.80/419.20 em 1440. Título único; descrição e características preenchidas, observações ausentes omitidas.

Na confirmação de 921, a direita possui um único link principal, y=96..380; esquerda x=24..524.39, direita x=548.39..882. A consulta matchMedia de 921 retorna true. Tokens e componentes mantidos, sem contorno ou decoração nova.

O harness de viewport/captura pode devolver imagens da apresentação anterior ao commit responsivo. Leituras transitórias durante HMR/loading e antes do commit foram descartadas; a confirmação usa espera pelo testid da composição e por route-loading hidden. As medidas DOM são o oráculo geométrico, as capturas exibidas permitem revisão visual. Não foram testados aparelhos físicos ou gestos adicionais; regressões de mídia, modal, teclado e barra rodaram no Full.

## Ajustes rotineiros autorizados

- Testes escritos antes do código: 21 falhas esperadas no focused inicial; depois 45 passed e, com cenário integrado de galeria, 46 passed.
- Expectativas antigas da ordem, posição das badges, nome da tabela e descrição só espaços migradas para CATREF-13/17/20/59. Nenhum cenário excluído ou pulado.
- O oráculo do preço anterior foi corrigido de `R$ 449,90` para `De R$ 449,90`, preservando o texto comercial real e aprovado.
- Full inicial revelou `window.matchMedia is not a function` nos harnesses router/main. Stubs locais adicionados para a nova dependência de ProductMedia; nenhuma asserção foi enfraquecida.
- A asserção estática de consumidores de Carousel passou a exigir o caminho por ProductMedia, removendo apenas WatchPage da lista esperada de importadores diretos. Os 36 testes do arquivo e o adaptador Carousel permanecem.
- Gates que já haviam reportado essas falhas ficaram em execução na verificação binária de cópia do catálogo; os processos desses gates foram encerrados antes das repetições. O gate final concluiu normalmente em 81.90 s (client).
- `impeccable detect --json client/src/routes/watch-page.tsx` retornou `[]`. `git diff --check` passou. `git diff --name-only -- client/public/catalog client/src/catalog/products.generated.ts` vazio.

A revisão final de toda a feature permanece T16. Adaptadores permanecem para T14/T15.
