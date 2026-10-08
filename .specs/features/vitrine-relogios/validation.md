# Vitrine de relógios Validation

**Date**: 2026-10-08
**Spec**: `.specs/features/vitrine-relogios/spec.md`
**Diff range**: `8647cdf..578498ae0a88435025ac2d7d152f22a7a89a723e`
**Verifier**: independent sub-agent (author ≠ verifier)

**Result**: PASS

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `ORDEM_FICHA` com os 13 rótulos |
| T2 | ✅ Done | Identidade, WhatsApp, preço e parcelamento |
| T3 | ✅ Done | Imagem, ficha, chave, ordem e cópias |
| T4 | ✅ Done | Preço, parcelamento e WhatsApp |
| T5 | ✅ Done | Raiz e vitrine |
| T6 | ✅ Done | Página do relógio |
| T7 | ✅ Done | Inter em `fontes/InterVariable.woff2` |
| T8 | ✅ Done | CSS da grade e das superfícies |
| T9 | ✅ Done | Tema antes do controle |
| T10 | ✅ Done | Carrossel circular |
| T11 | ✅ Done | CSS, fonte e scripts nas páginas |
| T12 | ✅ Done | `site/` só depois do sucesso |
| T13 | ✅ Done | CLI e guarda do YAML publicado |
| T14 | ✅ Done | YAML do Alexandre e remoção da fonte antiga |
| Fix `578498a` | ✅ Done | Altura da `.barra-negra` e leitura do YAML publicado |

---

## Spec-Anchored Acceptance Criteria

### P1: Gerar o site a partir do YAML

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o gerador lê cada `vendedores/<pasta>/vendedor.yaml` THEN grava só dentro de `site/` | As duas pastas viram página e todo arquivo gerado começa com `site/` | `tests/test_publicar.py:106` - `self.assertTrue(vitrine_ana.is_file())`; `tests/test_publicar.py:107` - `self.assertTrue(vitrine_alexandre.is_file())`; `tests/test_publicar.py:128` - `self.assertTrue(caminho.startswith("site/"), caminho)` | ✅ PASS |
| WHEN a pasta é `alexandre` e o id é `addiesdive-my-h3-2qz` THEN grava raiz, vitrine, relógio e a imagem | Existem `site/index.html`, `site/alexandre/index.html`, `site/alexandre/addiesdive-my-h3-2qz/index.html` e `site/alexandre/imagens/addiesdive2.png` com os bytes da foto | `tests/test_publicar.py:105` - `self.assertTrue(raiz_html.is_file())`; `tests/test_publicar.py:108` - `self.assertTrue(relogio.is_file())`; `tests/test_publicar.py:109` - `self.assertEqual(imagem.read_bytes(), BYTES_IMAGEM)` | ✅ PASS |
| WHEN pasta e `id` casam `^[a-z0-9]+(-[a-z0-9]+)*$` THEN o gerador aceita | Pasta `alexandre` e id `addiesdive-my-h3-2qz` carregam | `tests/test_validar.py:70` - `self.assertEqual(vendedor.pasta, "alexandre")`; `tests/test_validar.py:76` - `self.assertEqual(item.id, "addiesdive-my-h3-2qz")` | ✅ PASS |
| IF pasta ou `id` foge do padrão THEN `site/` anterior fica intacto e a saída é não zero | `CatalogoErro` na pasta `Alexandre` e nos ids `relogio-`, `-relogio` e `relogio--azul`. O contrato de `site/` intacto e código 1 está no caminho compartilhado de `CatalogoErro` | `tests/test_validar.py:89` - `self._erro("Alexandre", REGRA_PASTA)`; `tests/test_validar.py:97` - `self._erro("alexandre", REGRA_ID)`; `tests/test_publicar.py:146` - `self.assertEqual(self._bytes_site(), antes)`; `tests/test_cli.py:70` - `self.assertEqual(codigo, 1)` | ✅ PASS |
| WHEN o YAML é válido THEN exige `nome` e `whatsapp` no vendedor e `id`, `nome`, `valorPix`, `parcelamento`, `imagens` e `ficha` no item | A ausência de cada campo levanta a regra correspondente | `tests/test_validar.py:117` - `self._erro("alexandre", REGRA_NOME_VENDEDOR)`; `tests/test_validar.py:121` - `REGRA_WHATSAPP_AUSENTE`; `tests/test_validar.py:125` - `REGRA_ID_AUSENTE`; `tests/test_validar.py:129` - `REGRA_NOME_ITEM`; `tests/test_validar.py:133` - `REGRA_VALOR_AUSENTE`; `tests/test_validar.py:137` - `REGRA_PARCELAMENTO_AUSENTE`; `tests/test_validar.py:141` - `REGRA_IMAGENS_AUSENTES`; `tests/test_validar.py:148` - `REGRA_FICHA_AUSENTE` | ✅ PASS |
| IF falta `nome` ou `whatsapp`, há não dígito, ou a quantidade sai de 12 a 15 THEN `site/` fica intacto e a saída é não zero | `yes`, 11 dígitos e 16 dígitos falham. 12 e 15 passam. Código 1 e `site/` intacto no `CatalogoErro` | `tests/test_validar.py:156` - `self._erro("alexandre", REGRA_WHATSAPP)`; `tests/test_validar.py:164` - 11 dígitos; `tests/test_validar.py:172` - 16 dígitos; `tests/test_validar.py:188` - `self.assertEqual(..., "551199999999")`; `tests/test_cli.py:70` - `self.assertEqual(codigo, 1)`; `tests/test_publicar.py:146` - `self.assertEqual(self._bytes_site(), antes)` | ✅ PASS |
| IF `valorPix` não é número maior que zero THEN `site/` fica intacto e a saída é não zero | `0`, `-1` e `yes` falham com `valorPix não é número maior que zero` | `tests/test_validar.py:200` - `self._erro("alexandre", REGRA_VALOR)`; `tests/test_validar.py:204` - negativo; `tests/test_validar.py:208` - `yes` | ✅ PASS |
| IF `parcelamento` não é inteiro YAML maior ou igual a 1 THEN `site/` fica intacto e a saída é não zero | `12.0`, `12:00` e `0` falham. `1` passa como `int` | `tests/test_validar.py:212` - `self._erro("alexandre", REGRA_PARCELAMENTO)`; `tests/test_validar.py:216` - `12:00`; `tests/test_validar.py:220` - zero; `tests/test_validar.py:224` - `self.assertEqual(..., 1)` | ✅ PASS |
| IF não há imagem, o nome tem barra, o arquivo falta, ou a extensão sai de png, jpg, jpeg, webp e avif THEN `site/` fica intacto e a saída é não zero | Lista vazia, `../outro.png`, arquivo ausente e `.gif` falham. PNG, JPG, JPEG, WEBP e AVIF em maiúsculas passam | `tests/test_validar.py:295` - `self._erro("alexandre", REGRA_IMAGEM_AUSENTE)`; `tests/test_validar.py:300` - `REGRA_IMAGEM_BARRA`; `tests/test_validar.py:304` - `REGRA_ARQUIVO_AUSENTE`; `tests/test_validar.py:309` - `REGRA_EXTENSAO`; `tests/test_validar.py:275` - `self._aceita_imagem("FOTO.PNG")` | ✅ PASS |
| IF a ficha é vazia, falta `detalhe` ou `especificacao`, o valor é branco, ou o rótulo se repete THEN `site/` fica intacto e a saída é não zero | `[]`, linha sem detalhe, linha sem especificação, `""`, só espaços e `Estado` duplicado falham | `tests/test_validar.py:313` - `REGRA_FICHA_VAZIA`; `tests/test_validar.py:321` - `REGRA_FICHA_CAMPOS`; `tests/test_validar.py:329` - sem especificação; `tests/test_validar.py:337` - `REGRA_FICHA_BRANCO`; `tests/test_validar.py:345` - espaços; `tests/test_validar.py:357` - `REGRA_ROTULO_REPETIDO` | ✅ PASS |
| IF o mesmo `id` aparece duas vezes no vendedor THEN `site/` fica intacto e a saída é não zero | O segundo item com o mesmo id levanta `id repetido no vendedor` | `tests/test_validar.py:365` - `self._erro("alexandre", REGRA_ID_REPETIDO)` | ✅ PASS |
| IF aparece chave fora da lista THEN `site/` fica intacto e a saída é não zero | Chave extra no vendedor, no item e na ficha levanta `chave desconhecida` | `tests/test_validar.py:369` - `self._erro("alexandre", REGRA_CHAVE)`; `tests/test_validar.py:377` - item; `tests/test_validar.py:385` - ficha | ✅ PASS |
| IF `detalhe` não é um dos 13 rótulos THEN `site/` fica intacto e a saída é não zero | `Cor` levanta `rótulo de ficha fora da lista` | `tests/test_validar.py:361` - `self._erro("alexandre", REGRA_ROTULO)` | ✅ PASS |
| WHEN todos os vendedores passam THEN `site/` é trocado pela saída temporária | O `index.html` antigo some, `extra.txt` some e o título novo entra | `tests/test_publicar.py:113` - `self.assertFalse((site / "extra.txt").exists())`; `tests/test_publicar.py:114` - `self.assertNotEqual(..., "ANTIGO")`; `tests/test_publicar.py:115` - `self.assertEqual(self._sobras(), [])` | ✅ PASS |
| IF `site/` não existia e a geração falha THEN `site/` continua ausente | Depois do erro, `site/` não existe e não sobra diretório temporário | `tests/test_publicar.py:134` - `self.assertFalse((self.raiz / "site").exists())`; `tests/test_publicar.py:135` - `self.assertEqual(self._sobras(), [])` | ✅ PASS |
| IF a validação falha THEN stderr traz a pasta e a regra | Texto exato `ana: nome do vendedor ausente` | `tests/test_cli.py:78` - `self.assertEqual(buffer.getvalue().strip(), f"{PASTA_ANA}: {REGRA_NOME_VENDEDOR}")` | ✅ PASS |
| WHEN o mesmo bloco está em dois vendedores THEN os dois são publicados sem referência entre si | Os dois itens têm o mesmo id e não compartilham objeto, lista de imagens nem linha de ficha | `tests/test_validar.py:411` - `self.assertEqual(item_ana.id, "addiesdive-my-h3-2qz")`; `tests/test_validar.py:412` - `self.assertEqual(item_bruno.id, "addiesdive-my-h3-2qz")`; `tests/test_validar.py:413` - `self.assertIsNot(item_ana, item_bruno)`; `tests/test_validar.py:414` - `self.assertIsNot(item_ana.imagens, item_bruno.imagens)` | ✅ PASS |
| WHERE `observacoes` está ausente THEN o item é aceito | O item válido sem a chave fica com `observacoes` nulo | `tests/test_validar.py:81` - `self.assertIsNone(item.observacoes)` | ✅ PASS |
| WHEN o gerador roda duas vezes sem mudança THEN o HTML do segundo `site/` é igual ao do primeiro | Os mapas de HTML são iguais e contêm raiz, relógio e vitrine da Ana | `tests/test_publicar.py:154` - `self.assertEqual(segundo, primeiro)` | ✅ PASS |

**Status**: ✅ All ACs covered

### P1: Navegar da raiz até o WhatsApp

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN há navegação entre raiz, vitrine e relógio THEN as URLs são relativas | Links `ana/` e `bruno/`, `Voltar` em `../`, CSS sem `href="/"` | `tests/test_renderizar.py:142` - `self.assertIn("ana/", hrefs)`; `tests/test_renderizar.py:165` - `self.assertEqual(voltar[0][0], "../")`; `tests/test_renderizar.py:314` - `self.assertEqual(vendedor, ["../"])`; `tests/test_renderizar.py:530` - `self.assertNotIn('href="/', html)` | ✅ PASS |
| WHEN a raiz abre THEN o título é exatamente `Catálogo de relógios` | `title` igual a `Catálogo de relógios` | `tests/test_renderizar.py:122` - `self.assertEqual(_parse_html(html).title, TITULO_RAIZ)` | ✅ PASS |
| WHEN a raiz abre em qualquer largura THEN lista cada `nome` numa coluna | Uma coluna em 320, 640, 641, 834, 835, 1068, 1069, 1440, 1441 e 1920. A página usa `lista-vendedores` | `tests/test_estilos.py:185` - `self.assertEqual(_colunas(valor), 1, f"{largura}px")`; `tests/test_renderizar.py:148` - `self.assertIn('class="lista-vendedores"', html)` | ✅ PASS |
| WHEN os nomes são `Ana` e `bruno` THEN Ana vem antes de bruno | A ordem dos links é `["Ana", "bruno"]` | `tests/test_renderizar.py:132` - `self.assertEqual(nomes, ["Ana", "bruno"])` | ✅ PASS |
| WHEN o vendedor não tem itens THEN o nome continua na raiz | O texto `Ana` está nos links | `tests/test_renderizar.py:137` - `self.assertIn("Ana", ...)` | ✅ PASS |
| WHEN o nome é link THEN o alvo tem pelo menos 44px e a largura do conteúdo | `min-height` ≥ 44 e `width` `100%` em `.lista-vendedores a` | `tests/test_estilos.py:205` - `self.assertGreaterEqual(..., 44)`; `tests/test_estilos.py:206` - `self.assertEqual(..., "100%")` | ✅ PASS |
| WHEN a vitrine abre THEN o título é exatamente o `nome` | Título `bruno` | `tests/test_renderizar.py:155` - `self.assertEqual(_parse_html(html).title, "bruno")` | ✅ PASS |
| WHEN a vitrine abre THEN mostra o nome e `Voltar` para a raiz | Um `Voltar` com href `../` e a segunda barra com `bruno` | `tests/test_renderizar.py:164` - `self.assertEqual(len(voltar), 1)`; `tests/test_renderizar.py:165` - `self.assertEqual(voltar[0][0], "../")`; `tests/test_renderizar.py:216` - `self.assertIn(">bruno<", html.replace(" ", ""))` | ✅ PASS |
| WHEN a vitrine abre THEN os cards seguem a ordem do YAML | `relogio-primeiro/` aparece antes de `relogio-segundo/` | `tests/test_renderizar.py:173` - `self.assertLess(html.index("relogio-primeiro/"), html.index("relogio-segundo/"))` | ✅ PASS |
| WHEN o card aparece THEN é um link com a primeira foto, o nome e o preço Pix | Dois cards, `imagens/primeiro.png`, os dois nomes e as duas frases de preço | `tests/test_renderizar.py:191` - `self.assertEqual(cards, ["relogio-primeiro/", "relogio-segundo/"])`; `tests/test_renderizar.py:178` - `self.assertIn('src="imagens/primeiro.png"', html)`; `tests/test_renderizar.py:180` - `self.assertIn(FRASE_PIX_369_90, html)` | ✅ PASS |
| WHEN a largura muda THEN a grade usa 1, 2, 3, 4 e 5 colunas nos intervalos da spec | 640→1, 641→2, 834→2, 835→3, 1068→3, 1069→4, 1440→4, 1441→5 | `tests/test_estilos.py:177` - `self.assertEqual(_colunas(valor), colunas, f"{largura}px")` | ✅ PASS |
| WHEN a vitrine não tem itens THEN o texto é exatamente `Esta vitrine ainda não tem relógios.` | A frase está no HTML | `tests/test_renderizar.py:169` - `self.assertIn(MENSAGEM_VITRINE_VAZIA, html)` | ✅ PASS |
| WHEN o preço é formatado THEN 369.9 vira `R$ 369,90 no Pix` e 1234.5 vira `R$ 1.234,50 no Pix` | As duas frases, na função e nos cards | `tests/test_renderizar.py:34` - `self.assertEqual(formatar_preco(369.9), FRASE_PIX_369_90)`; `tests/test_renderizar.py:37` - `self.assertEqual(formatar_preco(1234.5), FRASE_PIX_1234_50)` | ✅ PASS |
| WHEN `parcelamento` é 12 THEN a frase é `em até 12x com acréscimo` | Igualdade exata | `tests/test_renderizar.py:42` - `self.assertEqual(formatar_parcelamento(12), FRASE_PARCELAMENTO_12)` | ✅ PASS |
| WHEN a página do relógio abre THEN o título é exatamente o `nome` do item | Título `Relógio Primeiro` | `tests/test_renderizar.py:304` - `self.assertEqual(_parse_html(html).title, "Relógio Primeiro")` | ✅ PASS |
| WHEN a página do relógio abre THEN a ordem é nome do vendedor, Voltar, nome do item, carrossel, preço, parcelamento, observação, ficha e barra fixa | Os marcadores estão em ordem crescente e o preço da barra fica depois da ficha | `tests/test_renderizar.py:331` - `self.assertEqual(posicoes, sorted(posicoes))`; `tests/test_renderizar.py:332` - `self.assertLess(posicoes[-2], html.rindex(FRASE_PIX_369_90))` | ✅ PASS |
| WHEN a barra fixa aparece THEN repete o preço Pix e a pílula `Tenho interesse` | A barra contém a frase e o rótulo, e a frase aparece pelo menos duas vezes | `tests/test_renderizar.py:477` - `self.assertIn(FRASE_PIX_369_90, barra.group(0))`; `tests/test_renderizar.py:478` - `self.assertIn(f">{ROTULO_INTERESSE}</a>", barra.group(0))` | ✅ PASS |
| WHEN `Tenho interesse` é acionado THEN abre `https://wa.me/` mais os dígitos, com `text` igual a `Olá, tenho interesse no ` mais o nome | Esquema, host, path `/5511888888888` e o texto decodificado | `tests/test_renderizar.py:493` - `self.assertEqual(parsed.scheme, "https")`; `tests/test_renderizar.py:494` - `self.assertEqual(parsed.netloc, "wa.me")`; `tests/test_renderizar.py:497` - `self.assertEqual(texto, PREFIXO_MENSAGEM_WHATSAPP + "Relógio Primeiro")` | ✅ PASS |
| WHEN a página do relógio abre THEN `og:title` é o nome e `og:image` resolve a primeira foto | `og:title` `Modelo Ficha` e o caminho relativo normaliza para `bruno/imagens/capa.png` | `tests/test_renderizar.py:457` - `self.assertEqual(titulo.group(1), "Modelo Ficha")`; `tests/test_renderizar.py:464` - `self.assertEqual(resolvido, "bruno/imagens/capa.png")` | ✅ PASS |
| WHEN a ficha é renderizada THEN segue a ordem fixa e omite o rótulo ausente | Homage de, Link de anúncio similar e Garantia nessa ordem. Os outros dez rótulos não aparecem | `tests/test_renderizar.py:338` - `self.assertEqual(posicoes, sorted(posicoes))`; `tests/test_renderizar.py:341` - `self.assertNotIn(rotulo, html)`; `tests/test_modelo.py:26` - `self.assertEqual(tuple(ORDEM_FICHA), ROTULOS_FICHA_SPEC)` | ✅ PASS |
| WHEN a linha da ficha aparece THEN o rótulo fica acima do valor | `<dt>` imediatamente antes de `<dd>` | `tests/test_renderizar.py:345` - `self.assertIn("<dt>Homage de</dt><dd>Rolex Submariner Date</dd>", html)` | ✅ PASS |
| WHERE o valor cortado casa `^https?://\S+$` THEN o texto visível é `Ver anúncio similar` e o href é esse valor | Espaços nas pontas saem. `https` e `http` viram o link | `tests/test_renderizar.py:350` - `self.assertIn("<dt>Link de anúncio similar</dt>"'<dd><a href="https://exemplo.test/anuncio?id=1">...', html)`; `tests/test_renderizar.py:364` - href `http://exemplo.test/outro` | ✅ PASS |
| WHERE o valor não casa a regex THEN fica texto e não vira link | `Não informado` e URL com espaço no meio ficam em `<dd>` sem `<a>` | `tests/test_renderizar.py:378` - `self.assertIn("<dt>Link de anúncio similar</dt><dd>Não informado</dd>", html)`; `tests/test_renderizar.py:382` - `self.assertNotIn(TEXTO_ANUNCIO, html)`; `tests/test_renderizar.py:383` - `self.assertNotIn("<dd><a", html)` | ✅ PASS |
| WHERE `observacoes` está ausente ou em branco THEN a página omite | Sem `class="observacoes"` para ausente, `""` e só espaços | `tests/test_renderizar.py:405` - `self.assertNotIn('class="observacoes"', html)`; `tests/test_renderizar.py:412` - vazio; `tests/test_renderizar.py:418` - espaços | ✅ PASS |
| WHERE `observacoes` tem texto THEN mostra só esse texto, sem título | `<p class="observacoes">nota de exemplo</p>`, sem `Observações`, um único `<h1>` | `tests/test_renderizar.py:425` - `self.assertIn('<p class="observacoes">nota de exemplo</p>', html)`; `tests/test_renderizar.py:426` - `self.assertNotIn("Observações", html)` | ✅ PASS |
| WHEN há uma imagem THEN a página mostra essa imagem e omite bolinhas e setas | A foto entra e `seta` e `bolinha` não entram | `tests/test_renderizar.py:434` - `self.assertIn('src="../imagens/primeiro.png"', html)`; `tests/test_renderizar.py:435` - `self.assertNotIn("seta", html)`; `tests/test_renderizar.py:436` - `self.assertNotIn("bolinha", html)` | ✅ PASS |
| WHEN há duas ou mais imagens THEN mostra uma por vez, uma bolinha por foto com a corrente marcada, e os controles anterior e próximo | Duas imagens, a segunda `hidden`, bolinhas `aria-current` e vazia, uma seta de cada | `tests/test_renderizar.py:440` - `self.assertEqual(html.count('class="seta seta-anterior"'), 1)`; `tests/test_renderizar.py:443` - `self.assertEqual(bolinhas, [' aria-current="true"', ""])`; `tests/test_carrossel.py:147` - `self.assertEqual(saida["bolinhasAtivas"], [False, True, False])` | ✅ PASS |
| WHEN próximo é usado na última imagem THEN a primeira volta | Depois de duas avançadas em duas fotos, a visibilidade é `[True, False]` | `tests/test_carrossel.py:141` - `self.assertEqual(saida["visibilidade"], [True, False])` | ✅ PASS |
| WHEN a foto do carrossel aparece THEN ocupa a largura, mostra a foto inteira e não tem canto arredondado | `width` `100%`, `object-fit` `contain`, `border-radius` `0` | `tests/test_estilos.py:197` - `self.assertEqual(..., "100%")`; `tests/test_estilos.py:199` - `self.assertEqual(..., "contain")`; `tests/test_estilos.py:200` - `self.assertEqual(..., "0")` | ✅ PASS |
| WHEN a foto do card aparece THEN é quadrada, mostra o relógio inteiro e tem raio de 18px | `aspect-ratio` `1/1`, `object-fit` `contain`, `border-radius` `18px` | `tests/test_estilos.py:191` - `self.assertEqual(proporcao.replace(" ", ""), "1/1")`; `tests/test_estilos.py:192` - `contain`; `tests/test_estilos.py:193` - `self.assertEqual(..., "18px")` | ✅ PASS |
| WHEN qualquer página abre THEN a barra preta tem 44px, o texto `Catálogo` aponta para a raiz, e não há busca nem sacola | `height` igual a `44px` no claro e no escuro. Um link `Catálogo` relativo. Sem `busca` e sem `sacola` | `tests/test_estilos.py:219` - `self.assertEqual(claro, "44px")`; `tests/test_estilos.py:221` - `self.assertEqual(claro if escuro is None else escuro, "44px")`; `tests/test_renderizar.py:207` - `self.assertEqual(len(catalogo), 1)`; `tests/test_renderizar.py:211` - `self.assertNotIn("sacola", texto_baixo)` | ✅ PASS |
| WHILE a página é vitrine ou relógio THEN há uma segunda barra com o nome do vendedor | A vitrine tem `barra-vendedor` com `bruno`. O relógio tem o mesmo bloco com link | `tests/test_renderizar.py:215` - `self.assertIn('class="barra-vendedor"', html)`; `tests/test_renderizar.py:320` - marcador `<div class="barra-vendedor"><a href="../">bruno</a></div>` | ✅ PASS |
| WHEN o rodapé aparece THEN contém só a linha `Catálogo de relógios` | `<footer>Catálogo de relógios</footer>` | `tests/test_renderizar.py:220` - `self.assertIn(f"<footer>{RODAPE_UNICO}</footer>", html.replace("\n", ""))` | ✅ PASS |

**Status**: ✅ All ACs covered

### P1: Tema, tipo e superfícies

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN a página carrega THEN a família é `system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif` e os arquivos Inter estão em `site/` | A pilha do CSS, o `@font-face` e a cópia byte a byte de `fontes/InterVariable.woff2` | `tests/test_estilos.py:319` - `self.assertEqual(familia.replace("'", '"').lower(), PILHA_FONTE...)`; `tests/test_renderizar.py:569` - `self.assertEqual(copiado.read_bytes(), origem.read_bytes())`; `tests/test_fonte.py:19` - `self.assertEqual(cabecalho, ASSINATURA_WOFF2)` | ✅ PASS |
| WHEN não há escolha gravada e o sistema é escuro THEN `<html>` recebe `data-tema="escuro"` antes da primeira pintura | O atributo já é `escuro` antes do controle | `tests/test_tema.py:139` - `self.assertEqual(saida["antesDoControle"]["dataTema"], "escuro")`; `tests/test_renderizar.py:508` - `self.assertRegex(html, r"<head>\s*<script>")` | ✅ PASS |
| WHEN não há escolha gravada e o sistema é claro THEN `<html>` recebe `data-tema="claro"` antes da primeira pintura | O atributo já é `claro` antes do controle | `tests/test_tema.py:144` - `self.assertEqual(saida["antesDoControle"]["dataTema"], "claro")` | ✅ PASS |
| WHILE `data-tema` é `claro` THEN o controle mostra `Escuro` | Rótulo `Escuro` | `tests/test_tema.py:155` - `self.assertEqual(saida["depoisDoControle"]["rotulo"], "Escuro")` | ✅ PASS |
| WHILE `data-tema` é `escuro` THEN o controle mostra `Claro` | Rótulo `Claro` | `tests/test_tema.py:160` - `self.assertEqual(saida["depoisDoControle"]["rotulo"], "Claro")` | ✅ PASS |
| WHEN o visitante aciona o controle THEN o modo passa a ser o do rótulo e `localStorage.tema` guarda o valor | De claro para `escuro`, chave `tema` igual a `escuro`, rótulo seguinte `Claro` | `tests/test_tema.py:165` - `self.assertEqual(saida["dataTema"], "escuro")`; `tests/test_tema.py:166` - `self.assertEqual(saida["storage"]["tema"], "escuro")` | ✅ PASS |
| WHEN a página carrega com `tema` gravado THEN aplica esse valor antes da primeira pintura | Com `tema` `escuro` e aparelho claro, o atributo já é `escuro` | `tests/test_tema.py:149` - `self.assertEqual(saida["antesDoControle"]["dataTema"], "escuro")` | ✅ PASS |
| WHEN a barra preta é pintada THEN usa `#000000` nos dois modos | `background-color` `#000000` na base e em `html[data-tema="escuro"] .barra-negra` | `tests/test_estilos.py:224` - `self.assertEqual(..., PRETO)`; `tests/test_estilos.py:225` - seletor escuro igual a `PRETO` | ✅ PASS |
| WHEN a pílula aparece THEN o fundo é `#0066cc` e o texto é branco | Nos dois modos, fundo `#0066cc` e cor `#ffffff` | `tests/test_estilos.py:232` - `self.assertEqual(..., AZUL_PILULA)`; `tests/test_estilos.py:233` - `self.assertEqual(..., BRANCO)` | ✅ PASS |
| WHILE `data-tema` é `claro` THEN o rodapé usa `#f5f5f7` | `footer` com `background-color` `#f5f5f7` | `tests/test_estilos.py:236` - `self.assertEqual(..., PERGAMINHO)` | ✅ PASS |
| WHILE `data-tema` é `escuro` THEN o fundo é `#272729`, o card `#2a2a2c`, o texto primário `#ffffff`, o secundário `#cccccc` e o link `#2997ff` | Cada seletor escuro com o hex da spec | `tests/test_estilos.py:239` - body `#272729`; `tests/test_estilos.py:244` - texto `#ffffff`; `tests/test_estilos.py:248` - card `#2a2a2c`; `tests/test_estilos.py:256` - `.parcelamento` `#cccccc`; `tests/test_estilos.py:260` - `main a` `#2997ff` | ✅ PASS |
| WHILE `data-tema` é `escuro` THEN rodapé, segunda barra e barra fixa usam `#272729` com texto branco | Os três seletores com fundo `#272729` e cor `#ffffff` | `tests/test_estilos.py:270` - `self.assertEqual(..., FUNDO_ESCURO)`; `tests/test_estilos.py:271` - `self.assertEqual(..., BRANCO)` | ✅ PASS |
| WHILE `data-tema` é `escuro` THEN a barra fixa mantém o filtro fosco | `backdrop-filter` presente, diferente de `none`, com `blur` positivo | `tests/test_estilos.py:279` - `self.assertIsNotNone(valor)`; `tests/test_estilos.py:280` - `self.assertNotEqual(valor, "none")`; `tests/test_estilos.py:281` - `self.assertRegex(valor, _BLUR_POSITIVO)` | ✅ PASS |
| WHEN a foto aparece THEN mantém as cores de origem, sem véu escuro e sem inversão | `filter` `none` no card e no carrossel, nos dois modos, sem `invert` | `tests/test_estilos.py:290` - `self.assertEqual(..., "none", seletor)`; `tests/test_estilos.py:295` - `self.assertNotIn("invert", filtro)` | ✅ PASS |
| WHEN a página declara cor THEN usa só cores de `DESIGN.md` | Todo hex do CSS está na paleta, e os oito hex da spec estão no CSS | `tests/test_estilos.py:303` - `self.assertLessEqual(usados, paleta)`; `tests/test_estilos.py:314` - `self.assertLessEqual(obrigatorios, usados)` | ✅ PASS |

**Status**: ✅ All ACs covered

### P1: Publicar o catálogo atual

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o repositório publica o primeiro vendedor THEN o YAML tem `Alexandre`, `5511999999999` e os três itens na ordem, preços, fotos e observação da spec | Nome, WhatsApp, ids `addiesdive-my-h3-2qz`, `curren-8455`, `seculus-kit-com-cantil`, preços 369.9, 119.9 e 299.9, fotos na ordem e a observação do Seculus | `tests/test_catalogo_publicado.py:91` - `self.assertEqual(self.alexandre.nome, "Alexandre")`; `tests/test_catalogo_publicado.py:92` - `self.assertEqual(self.alexandre.whatsapp, "5511999999999")`; `tests/test_catalogo_publicado.py:96` - `self.assertEqual(ids, ["addiesdive-my-h3-2qz", "curren-8455", "seculus-kit-com-cantil"])`; `tests/test_catalogo_publicado.py:103` - `self.assertEqual(item.valor_pix, 369.9)`; `tests/test_catalogo_publicado.py:117` - `self.assertEqual(item.observacoes, "acompanha caixa de metal e cantil")` | ✅ PASS |
| WHEN os três itens existem THEN cada um tem `parcelamento` 12 e a ficha da spec na ordem fixa | Parcelamento 12 e as tuplas completas de Addiesdive, CURREN e Seculus | `tests/test_catalogo_publicado.py:121` - `self.assertEqual(item.parcelamento, 12)`; `tests/test_catalogo_publicado.py:126` - `self.assertEqual(_ficha_tuplas(item), FICHA_ADDIESDIVE)`; `tests/test_catalogo_publicado.py:131` - `FICHA_CURREN`; `tests/test_catalogo_publicado.py:136` - `FICHA_SECULUS` | ✅ PASS |
| WHEN o YAML existe THEN não há `catalogo.md`, `catalogo.pdf`, `template-produto.md`, `detalhes-do-item.md`, `PLANO.md` nem `tmp/` | Cada caminho `exists()` é falso | `tests/test_catalogo_publicado.py:161` - `catalogo.md`; `tests/test_catalogo_publicado.py:164` - `catalogo.pdf`; `tests/test_catalogo_publicado.py:167` - `template-produto.md`; `tests/test_catalogo_publicado.py:170` - `detalhes-do-item.md`; `tests/test_catalogo_publicado.py:173` - `PLANO.md`; `tests/test_catalogo_publicado.py:176` - `tmp` | ✅ PASS |
| WHEN o YAML existe THEN permanecem `DESIGN.md`, `2026-10-07-vitrine-relogios-design.md`, as fotos citadas e os diretórios de skills | Os dois Markdown existem, cada foto citada é arquivo e `.agents/skills` é diretório | `tests/test_catalogo_publicado.py:181` - `DESIGN.md`; `tests/test_catalogo_publicado.py:184` - `2026-10-07-vitrine-relogios-design.md`; `tests/test_catalogo_publicado.py:141` - `self.assertTrue((PASTA_VENDEDOR / nome).is_file(), ...)`; `tests/test_catalogo_publicado.py:189` - `.agents/skills` | ✅ PASS |
| WHEN a suíte de comportamento roda THEN parte de um fixture com dois vendedores, um sem itens e um com dois relógios dos quais exatamente um tem `observacoes`, e não lê o YAML publicado | O fixture tem Ana sem itens e bruno com dois relógios e uma observação. Nenhum teste de comportamento cita nem abre `vendedores/alexandre/vendedor.yaml` | `tests/catalogo_exemplo.py:49` - `return [vendedor_sem_itens(), vendedor_com_dois_relogios()]`; `tests/test_cli.py:230` - `self.assertIsNone(citacao, ...)`; `tests/test_cli.py:241` - `self.assertFalse(leu, "a suíte de comportamento leu vendedores/alexandre/vendedor.yaml")` | ✅ PASS |
| WHEN a suíte roda THEN cobre caminhos publicados, ordem alfabética, as duas frases de preço e parcelamento, a ordem da ficha, `Ver anúncio similar`, o WhatsApp, a prévia da primeira foto, o carrossel só com várias fotos, `Voltar`, o tema e cada falha de geração | Cada item desta lista tem asserção nas linhas já citadas nas histórias anteriores | `tests/test_publicar.py:108` - caminho do relógio; `tests/test_renderizar.py:132` - Ana antes de bruno; `tests/test_renderizar.py:34` - preço; `tests/test_renderizar.py:42` - parcelamento; `tests/test_renderizar.py:338` - ficha; `tests/test_renderizar.py:350` - anúncio; `tests/test_renderizar.py:497` - WhatsApp; `tests/test_renderizar.py:464` - prévia; `tests/test_renderizar.py:435` - uma foto sem seta; `tests/test_renderizar.py:165` - Voltar da vitrine; `tests/test_renderizar.py:315` - Voltar do relógio; `tests/test_tema.py:166` - chave `tema`; `tests/test_validar.py:89` - falha de padrão, e as demais regras em `tests/test_validar.py` | ✅ PASS |

**Status**: ✅ All ACs covered

---

## Discrimination Sensor

Scratch: worktree descartável em `/tmp/vitrine-sensor-verify`, detached em `578498ae0a88435025ac2d7d152f22a7a89a723e`. `DESIGN.md`, `images/` e `.agents/skills` foram copiados para o scratch porque não estão no commit e a suíte do catálogo publicado os exige. Nenhuma mutação foi feita na árvore real. Sem `git stash`.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `gerador/estilos.css:22` | `.barra-negra` `height: 44px` → `height: 20px` | ✅ Killed. `tests/test_estilos.py:219` recebeu `'20px' != '44px'` |
| 2 | `tests/test_modelo.py` | A suíte de comportamento abre `vendedores/alexandre/vendedor.yaml` com `os.path.join` e `open`, sem caminho estático de três partes | ✅ Killed. `tests/test_cli.py:241` - `assertFalse(leu)`: a suíte leu o YAML publicado |
| 3 | `gerador/renderizar.py:18` | `formatar_preco` devolve `R$ {br}` sem o sufixo ` no Pix` | ✅ Killed. `tests/test_renderizar.py:34` recebeu `'R$ 369,90' != 'R$ 369,90 no Pix'` |

**Sensor depth**: lightweight
**Result**: 3/3 killed. PASS

Isolamento: depois de `git worktree remove --force`, `git status --porcelain` da árvore real repetiu as mesmas 13 entradas do baseline anterior ao sensor. O branch continuou `master` em `578498a`.

---

## Interactive UAT Results (if performed)

Não realizado. Este passe cobre o gate, o critério ancorado na spec e o sensor.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns | ✅ |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ |
| Every test maps to a spec requirement - no unclaimed tests | ✅ |
| Documented guidelines followed: none - strong defaults applied | ✅ |

---

## Edge Cases

- [x] `../outro.png` é recusado como nome com barra: `tests/test_validar.py:300`
- [x] `observacoes` só com espaços some da página: `tests/test_renderizar.py:418`
- [x] O mesmo `id` em dois vendedores publica as duas cópias: `tests/test_validar.py:411`

---

## Gate Check

- **Gate command**: `python3 -m compileall -q gerador scripts && python3 -m unittest discover -s tests -q`
- **Result**: 149 passed, 0 failed, 0 skipped
- **Test count before feature**: 0 (`8647cdf` não tem `tests/`)
- **Test count after feature**: 149
- **Delta**: +149 new tests
- **Skipped tests**: nenhum
- **Failures**: nenhum

---

## Fix Plans (if issues found)

Nenhum. Os três mutantes morreram e os 73 critérios têm asserção do valor da spec.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| VITR-01 a VITR-49 | ✅ Verified | ✅ Verified |
| VITR-50 | ❌ Needs Fix | ✅ Verified |
| VITR-51 a VITR-71 | ✅ Verified | ✅ Verified |
| VITR-72 | ❌ Needs Fix | ✅ Verified |
| VITR-73 | ✅ Verified | ✅ Verified |

---

## Summary

**Overall**: PASS

**Spec-anchored check**: 73/73 ACs matched spec outcome. 0 spec-precision gaps
**Sensor**: 3/3 mutations killed
**Gate**: 149 passed

**What works**: A geração recusa o YAML inválido e só então troca `site/`. A navegação, o preço, o WhatsApp, a ficha, o carrossel e o tema batem com o valor da spec. A barra preta mede 44px. A suíte de comportamento não abre o YAML do Alexandre.

**Issues found**: nenhum

**Next steps**: nenhum
