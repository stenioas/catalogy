import posixpath
import re
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from gerador.modelo import FichaLinha, Imagem, Item, Vendedor
from gerador.renderizar import (
    escrever,
    formatar_parcelamento,
    formatar_preco,
    link_whatsapp,
)
from catalogo_exemplo import catalogo_dois_vendedores, vendedor_sem_itens

RAIZ_PROJETO = Path(__file__).resolve().parent.parent
FONTE_ORIGEM = RAIZ_PROJETO / "fontes"
CAMINHO_ESTILOS_ORIGEM = RAIZ_PROJETO / "gerador" / "estilos.css"
CHAVE_TEMA_LOCAL_STORAGE = "tema"

# VITR-32 / spec P1 Navegar AC 13
FRASE_PIX_369_90 = "R$ 369,90 no Pix"
FRASE_PIX_1234_50 = "R$ 1.234,50 no Pix"
# VITR-33 / spec P1 Navegar AC 14
FRASE_PARCELAMENTO_12 = "em até 12x com acréscimo"
# VITR-37 / spec P1 Navegar AC 18
PREFIXO_MENSAGEM_WHATSAPP = "Olá, tenho interesse no "


class TestFormatarPreco(unittest.TestCase):
    def test_valor_pix_369_9_vira_frase_com_duas_casas_e_virgula(self):
        self.assertEqual(formatar_preco(369.9), FRASE_PIX_369_90)

    def test_valor_pix_1234_5_usa_ponto_de_milhar(self):
        self.assertEqual(formatar_preco(1234.5), FRASE_PIX_1234_50)


class TestFormatarParcelamento(unittest.TestCase):
    def test_parcelamento_12_vira_frase_da_spec(self):
        self.assertEqual(formatar_parcelamento(12), FRASE_PARCELAMENTO_12)


class TestLinkWhatsapp(unittest.TestCase):
    def test_text_decodifica_ola_mais_nome_do_modelo(self):
        digitos = "5511999999999"
        nome = "Addiesdive MY-H3-2QZ"
        url = link_whatsapp(digitos, nome)
        parsed = urlparse(url)
        self.assertEqual(parsed.scheme, "https")
        self.assertEqual(parsed.netloc, "wa.me")
        self.assertEqual(parsed.path, f"/{digitos}")
        texto = unquote(parse_qs(parsed.query)["text"][0])
        self.assertEqual(texto, PREFIXO_MENSAGEM_WHATSAPP + nome)


TITULO_RAIZ = "Catálogo de relógios"
MENSAGEM_VITRINE_VAZIA = "Esta vitrine ainda não tem relógios."
RODAPE_UNICO = "Catálogo de relógios"
ROTULO_BARRA_CATALOGO = "Catálogo"
ROTULO_VOLTAR = "Voltar"


class _ExtratorHtml(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self._in_title = False
        self.links: list[tuple[str, str]] = []
        self.textos: list[str] = []
        self._texto_parcial = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "a" and "href" in attrs_dict:
            self.links.append((attrs_dict["href"], ""))
        if tag == "img" and "src" in attrs_dict:
            self.links.append((attrs_dict["src"], "img"))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "a" and self.links and self.links[-1][1] == "":
            href, _ = self.links[-1]
            self.links[-1] = (href, self._texto_parcial.strip())
            self._texto_parcial = ""

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        else:
            limpo = data.strip()
            if limpo:
                self.textos.append(limpo)
            if self.links and self.links[-1][1] == "":
                self._texto_parcial += data


def _parse_html(html: str) -> _ExtratorHtml:
    parser = _ExtratorHtml()
    parser.feed(html)
    return parser


def _escrever_catalogo(vendedores, relativo: str) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        destino = Path(tmp)
        escrever(vendedores, destino, FONTE_ORIGEM)
        return (destino / relativo).read_text(encoding="utf-8")


def _quantidade_scripts(html: str) -> int:
    return len(re.findall(r"<script\b", html))


class TestPaginaRaiz(unittest.TestCase):
    def test_titulo_do_documento_e_catalogo_de_relogios(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        self.assertEqual(_parse_html(html).title, TITULO_RAIZ)

    def test_lista_ana_antes_de_bruno(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        parser = _parse_html(html)
        nomes = [
            texto
            for href, texto in parser.links
            if href in ("ana/", "bruno/") and texto
        ]
        self.assertEqual(nomes, ["Ana", "bruno"])

    def test_vendedor_sem_itens_aparece_na_raiz(self):
        html = _escrever_catalogo([vendedor_sem_itens()], "index.html")
        parser = _parse_html(html)
        self.assertIn("Ana", [texto for _, texto in parser.links if texto])

    def test_nome_do_vendedor_e_link_relativo_para_a_pasta(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        hrefs = {href for href, _ in _parse_html(html).links}
        self.assertIn("ana/", hrefs)
        self.assertIn("bruno/", hrefs)
        self.assertTrue(all(not href.startswith("/") for href in hrefs if href.endswith("/")))

    def test_lista_de_vendedores_em_uma_coluna_sem_grade_de_cards(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        self.assertIn('class="lista-vendedores"', html)
        self.assertNotIn('class="grade-vitrine"', html)


class TestPaginaVitrine(unittest.TestCase):
    def test_titulo_e_somente_o_nome_do_vendedor(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        self.assertEqual(_parse_html(html).title, "bruno")

    def test_voltar_aponta_para_a_raiz_com_url_relativa(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        voltar = [
            (href, texto)
            for href, texto in _parse_html(html).links
            if texto == ROTULO_VOLTAR
        ]
        self.assertEqual(len(voltar), 1)
        self.assertEqual(voltar[0][0], "../")

    def test_vitrine_sem_itens_mostra_mensagem_exata(self):
        html = _escrever_catalogo([vendedor_sem_itens()], "ana/index.html")
        self.assertIn(MENSAGEM_VITRINE_VAZIA, html)

    def test_cards_na_ordem_do_yaml_com_foto_nome_e_preco(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        self.assertLess(
            html.index("relogio-primeiro/"),
            html.index("relogio-segundo/"),
        )
        self.assertIn('href="relogio-primeiro/"', html)
        self.assertIn('src="imagens/primeiro.png"', html)
        self.assertIn("Relógio Primeiro", html)
        self.assertIn(FRASE_PIX_369_90, html)
        self.assertIn("Relógio Segundo", html)
        self.assertIn(FRASE_PIX_1234_50, html)

    def test_cada_card_e_um_unico_link(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        cards = re.findall(
            r'<a class="card" href="([^"]+)">.*?</a>',
            html,
            flags=re.DOTALL,
        )
        self.assertEqual(cards, ["relogio-primeiro/", "relogio-segundo/"])


class TestBarrasERodape(unittest.TestCase):
    def _html_vitrine(self):
        return _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")

    def test_barra_preta_tem_catalogo_sem_busca_nem_sacola(self):
        for rel in ("index.html", "bruno/index.html", "ana/index.html"):
            html = _escrever_catalogo(catalogo_dois_vendedores(), rel)
            parser = _parse_html(html)
            catalogo = [
                (href, texto)
                for href, texto in parser.links
                if texto == ROTULO_BARRA_CATALOGO
            ]
            self.assertEqual(len(catalogo), 1)
            self.assertIn(catalogo[0][0], ("./", "../", "../../"))
            texto_baixo = html.lower()
            self.assertNotIn("busca", texto_baixo)
            self.assertNotIn("sacola", texto_baixo)

    def test_vitrine_tem_segunda_barra_com_nome_do_vendedor(self):
        html = self._html_vitrine()
        self.assertIn('class="barra-vendedor"', html)
        self.assertIn(">bruno<", html.replace(" ", ""))

    def test_rodape_contem_somente_catalogo_de_relogios(self):
        html = self._html_vitrine()
        self.assertIn(f"<footer>{RODAPE_UNICO}</footer>", html.replace("\n", ""))


# VITR-34 / spec P1 Navegar AC 15
# VITR-35 / spec P1 Navegar AC 16
# VITR-36 / spec P1 Navegar AC 17
# VITR-38 / spec P1 Navegar AC 19
# VITR-39 / spec P1 Navegar AC 20
# VITR-40 / spec P1 Navegar AC 21
# VITR-41 / spec P1 Navegar AC 22
# VITR-42 / spec P1 Navegar AC 23
# VITR-43 / spec P1 Navegar AC 24
# VITR-44 / spec P1 Navegar AC 25
# VITR-45 / spec P1 Navegar AC 26
# VITR-46 / spec P1 Navegar AC 27
ROTULOS_FICHA_AUSENTES = (
    "Estado",
    "Tipo do relógio",
    "Tipo de movimento",
    "Material da caixa",
    "Material da pulseira",
    "Material do vidro",
    "Resistência à água",
    "Tamanho da caixa",
    "Largura da pulseira",
    "Material do bisel",
)
TEXTO_ANUNCIO = "Ver anúncio similar"
ROTULO_INTERESSE = "Tenho interesse"


def _foto(arquivo: str, largura: int = 400, altura: int = 300) -> Imagem:
    return Imagem(arquivo, largura, altura)


def _item_pagina(
    id_: str,
    nome: str,
    *,
    valor_pix: float = 369.9,
    observacoes: str | None = None,
    imagens: list[Imagem] | None = None,
    ficha: list[FichaLinha] | None = None,
) -> Item:
    return Item(
        id=id_,
        nome=nome,
        valor_pix=valor_pix,
        parcelamento=12,
        observacoes=observacoes,
        imagens=imagens or [_foto("capa.png")],
        ficha=ficha or [FichaLinha("Estado", "Novo")],
    )


def _pagina_relogio(item: Item, whatsapp: str = "5511888888888") -> str:
    vendedor = Vendedor(
        pasta="bruno",
        nome="bruno",
        whatsapp=whatsapp,
        itens=[item],
    )
    return _escrever_catalogo([vendedor], f"bruno/{item.id}/index.html")


def _item_ficha_fora_de_ordem() -> Item:
    return _item_pagina(
        "relogio-ficha",
        "Modelo Ficha",
        observacoes="caixa original",
        imagens=[_foto("capa.png"), _foto("verso.png")],
        ficha=[
            FichaLinha("Garantia", "90 dias"),
            FichaLinha("Homage de", "Rolex Submariner Date"),
            FichaLinha(
                "Link de anúncio similar",
                "  https://exemplo.test/anuncio?id=1  ",
            ),
        ],
    )


class TestPaginaRelogio(unittest.TestCase):
    def test_titulo_e_somente_o_nome_do_modelo(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        self.assertEqual(_parse_html(html).title, "Relógio Primeiro")

    def test_voltar_e_nome_do_vendedor_apontam_para_a_vitrine(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        links = _parse_html(html).links
        vendedor = [href for href, texto in links if texto == "bruno"]
        voltar = [href for href, texto in links if texto == ROTULO_VOLTAR]
        self.assertEqual(vendedor, ["../"])
        self.assertEqual(voltar, ["../"])

    def test_ordem_nome_carrossel_preco_observacao_ficha_e_barra(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        marcadores = [
            '<div class="barra-vendedor"><a href="../">bruno</a></div>',
            '<a class="voltar" href="../">Voltar</a>',
            "<h1>Modelo Ficha</h1>",
            '<div class="carrossel">',
            FRASE_PIX_369_90,
            FRASE_PARCELAMENTO_12,
            '<p class="observacoes">caixa original</p>',
            '<dl class="ficha">',
            '<div class="barra-fixa">',
        ]
        posicoes = [html.index(marcador) for marcador in marcadores]
        self.assertEqual(posicoes, sorted(posicoes))
        self.assertLess(posicoes[-2], html.rindex(FRASE_PIX_369_90))

    def test_ficha_segue_ordem_fixa_e_omite_rotulo_ausente(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        presentes = ("Homage de", "Link de anúncio similar", "Garantia")
        posicoes = [html.index(rotulo) for rotulo in presentes]
        self.assertEqual(posicoes, sorted(posicoes))
        self.assertLess(html.index("Homage de"), html.index("Garantia"))
        for rotulo in ROTULOS_FICHA_AUSENTES:
            self.assertNotIn(rotulo, html)

    def test_rotulo_da_ficha_fica_acima_do_valor(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        self.assertIn("<dt>Homage de</dt><dd>Rolex Submariner Date</dd>", html)
        self.assertIn("<dt>Garantia</dt><dd>90 dias</dd>", html)

    def test_url_https_com_espacos_nas_pontas_vira_ver_anuncio_similar(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        self.assertIn(
            "<dt>Link de anúncio similar</dt>"
            '<dd><a href="https://exemplo.test/anuncio?id=1">'
            f"{TEXTO_ANUNCIO}</a></dd>",
            html,
        )

    def test_url_http_vira_ver_anuncio_similar(self):
        item = _item_pagina(
            "relogio-http",
            "Modelo Http",
            ficha=[FichaLinha("Link de anúncio similar", "http://exemplo.test/outro")],
        )
        html = _pagina_relogio(item)
        self.assertIn(
            "<dt>Link de anúncio similar</dt>"
            '<dd><a href="http://exemplo.test/outro">'
            f"{TEXTO_ANUNCIO}</a></dd>",
            html,
        )

    def test_valor_que_nao_casa_url_fica_texto_sem_link(self):
        item = _item_pagina(
            "relogio-texto",
            "Modelo Texto",
            ficha=[FichaLinha("Link de anúncio similar", "Não informado")],
        )
        html = _pagina_relogio(item)
        self.assertIn(
            "<dt>Link de anúncio similar</dt><dd>Não informado</dd>",
            html,
        )
        self.assertNotIn(TEXTO_ANUNCIO, html)
        self.assertNotIn("<dd><a", html)

    def test_url_com_espaco_no_meio_fica_texto(self):
        item = _item_pagina(
            "relogio-espaco",
            "Modelo Espaco",
            ficha=[
                FichaLinha("Link de anúncio similar", "https://exemplo.test/a b"),
            ],
        )
        html = _pagina_relogio(item)
        self.assertIn(
            "<dt>Link de anúncio similar</dt><dd>https://exemplo.test/a b</dd>",
            html,
        )
        self.assertNotIn(TEXTO_ANUNCIO, html)

    def test_observacao_ausente_nao_aparece(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        self.assertNotIn('class="observacoes"', html)
        self.assertNotIn("nota de exemplo", html)

    def test_observacao_vazia_some(self):
        html = _pagina_relogio(
            _item_pagina("relogio-vazio", "Modelo Vazio", observacoes=""),
        )
        self.assertNotIn('class="observacoes"', html)

    def test_observacao_so_com_espacos_some(self):
        html = _pagina_relogio(
            _item_pagina("relogio-espacos", "Modelo Espacos", observacoes="   "),
        )
        self.assertNotIn('class="observacoes"', html)

    def test_observacao_com_texto_aparece_sem_titulo(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-segundo/index.html",
        )
        self.assertIn('<p class="observacoes">nota de exemplo</p>', html)
        self.assertNotIn("Observações", html)
        self.assertEqual(re.findall(r"<h[1-6]\b", html), ["<h1"])

    def test_uma_foto_nao_tem_seta_nem_bolinha(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        self.assertIn('src="../imagens/primeiro.png"', html)
        self.assertNotIn("seta", html)
        self.assertNotIn("bolinha", html)

    def test_duas_fotos_tem_setas_bolinhas_e_uma_imagem_visivel(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        self.assertEqual(html.count('class="seta seta-anterior"'), 1)
        self.assertEqual(html.count('class="seta seta-proxima"'), 1)
        bolinhas = re.findall(r'<span class="bolinha"([^>]*)>', html)
        self.assertEqual(bolinhas, [' aria-current="true"', ""])
        imagens = re.findall(r"<img\b[^>]*>", html)
        self.assertEqual(len(imagens), 2)
        self.assertIn('src="../imagens/capa.png"', imagens[0])
        self.assertNotIn("hidden", imagens[0])
        self.assertIn('src="../imagens/verso.png"', imagens[1])
        self.assertIn("hidden", imagens[1])

    def test_og_title_e_og_image_da_primeira_foto(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        titulo = re.search(r'<meta property="og:title" content="([^"]*)">', html)
        imagem = re.search(r'<meta property="og:image" content="([^"]*)">', html)
        self.assertIsNotNone(titulo)
        self.assertIsNotNone(imagem)
        self.assertEqual(titulo.group(1), "Modelo Ficha")
        conteudo = imagem.group(1)
        self.assertFalse(conteudo.startswith("/"))
        self.assertFalse(conteudo.startswith("http"))
        resolvido = posixpath.normpath(
            posixpath.join("bruno/relogio-ficha", conteudo),
        )
        self.assertEqual(resolvido, "bruno/imagens/capa.png")

    def test_barra_fixa_repete_o_preco_e_a_pilula(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        barra = re.search(
            r'<div class="barra-fixa">.*?</div>',
            html,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(barra)
        self.assertIn(FRASE_PIX_369_90, barra.group(0))
        self.assertIn(f">{ROTULO_INTERESSE}</a>", barra.group(0))
        self.assertGreaterEqual(html.count(FRASE_PIX_369_90), 2)

    def test_tenho_interesse_abre_whatsapp_com_o_nome_do_modelo(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        hrefs = [
            href
            for href, texto in _parse_html(html).links
            if texto == ROTULO_INTERESSE
        ]
        self.assertEqual(len(hrefs), 1)
        parsed = urlparse(hrefs[0])
        self.assertEqual(parsed.scheme, "https")
        self.assertEqual(parsed.netloc, "wa.me")
        self.assertEqual(parsed.path, "/5511888888888")
        texto = unquote(parse_qs(parsed.query)["text"][0])
        self.assertEqual(texto, PREFIXO_MENSAGEM_WHATSAPP + "Relógio Primeiro")


# VITR-02 / spec P1 Gerar AC 1–2 (ativos estáticos em site/)
# VITR-53 / spec P1 Tema AC 1
# VITR-54 / spec P1 Tema AC 2–7 (script no início do head, antes da pintura)


class TestEmbutirAssetsNasPaginas(unittest.TestCase):
    def test_primeiro_no_do_head_e_script_do_tema_antes_do_css(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        self.assertRegex(html, r"<head>\s*<script>")
        pos_script = html.index("<script>")
        pos_css = html.index('rel="stylesheet"')
        self.assertLess(pos_script, pos_css)

    def test_script_do_tema_usa_local_storage_com_chave_tema(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        bloco = re.search(r"<script>(.*?)</script>", html, flags=re.DOTALL)
        self.assertIsNotNone(bloco)
        self.assertIn("localStorage", bloco.group(1))
        self.assertIn(f'"{CHAVE_TEMA_LOCAL_STORAGE}"', bloco.group(1))
        self.assertIn("data-tema", bloco.group(1))

    def test_raiz_vitrine_e_relogio_incluem_folha_de_estilos_relativa(self):
        casos = (
            ("index.html", "estilos.css"),
            ("bruno/index.html", "../estilos.css"),
            ("bruno/relogio-primeiro/index.html", "../../estilos.css"),
        )
        for relativo, href_css in casos:
            html = _escrever_catalogo(catalogo_dois_vendedores(), relativo)
            self.assertIn(f'href="{href_css}"', html)
            self.assertNotIn('href="/', html)

    def test_relogio_com_uma_foto_nao_inclui_script_do_carrossel(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        self.assertEqual(_quantidade_scripts(html), 1)

    def test_relogio_com_duas_fotos_inclui_script_do_carrossel(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        self.assertEqual(_quantidade_scripts(html), 2)
        scripts = re.findall(r"<script>(.*?)</script>", html, flags=re.DOTALL)
        self.assertEqual(len(scripts), 2)
        self.assertIn(".carrossel", scripts[1])

    def test_vitrine_e_raiz_tem_apenas_script_do_tema(self):
        for rel in ("index.html", "bruno/index.html", "ana/index.html"):
            html = _escrever_catalogo(catalogo_dois_vendedores(), rel)
            self.assertEqual(_quantidade_scripts(html), 1)

    def test_escrever_grava_estilos_css_no_destino(self):
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            escrever(catalogo_dois_vendedores(), destino, FONTE_ORIGEM)
            copiado = destino / "estilos.css"
            self.assertTrue(copiado.is_file())
            self.assertEqual(
                copiado.read_text(encoding="utf-8"),
                CAMINHO_ESTILOS_ORIGEM.read_text(encoding="utf-8"),
            )

    def test_escrever_grava_inter_variable_woff2_em_fontes(self):
        with tempfile.TemporaryDirectory() as tmp:
            destino = Path(tmp)
            escrever(catalogo_dois_vendedores(), destino, FONTE_ORIGEM)
            copiado = destino / "fontes" / "InterVariable.woff2"
            origem = FONTE_ORIGEM / "InterVariable.woff2"
            self.assertTrue(copiado.is_file())
            self.assertEqual(copiado.read_bytes(), origem.read_bytes())
