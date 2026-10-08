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

    def test_cada_vendedor_na_raiz_e_um_link_unico_dentro_do_li(self):
        # AJST-25 / spec P1 Lista de vendedores em cards AC 3
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        itens = re.findall(
            r'<li><a href="[^"]+/">[^<]+</a></li>',
            html,
        )
        self.assertEqual(len(itens), 2)


class TestPaginaVitrine(unittest.TestCase):
    def test_titulo_e_somente_o_nome_do_vendedor(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        self.assertEqual(_parse_html(html).title, "bruno")

    def test_voltar_no_header_aponta_para_a_raiz_sem_texto_visivel(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        header = _trecho_header(html)
        self.assertIsNotNone(
            re.search(
                r'<a class="voltar" href="\.\./" aria-label="Voltar">'
                r'.*?<svg[^>]*aria-hidden="true"',
                header,
                flags=re.DOTALL,
            ),
        )
        self.assertNotIn(f">{ROTULO_VOLTAR}<", header)

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
        for rel, href_esperado in (
            ("index.html", "./"),
            ("bruno/index.html", "../"),
            ("ana/index.html", "../"),
        ):
            html = _escrever_catalogo(catalogo_dois_vendedores(), rel)
            header = _trecho_header(html)
            self.assertIn(
                f'<a href="{href_esperado}">{ROTULO_BARRA_CATALOGO}</a>',
                header,
            )
            texto_baixo = html.lower()
            self.assertNotIn("busca", texto_baixo)
            self.assertNotIn("sacola", texto_baixo)

        html_produto = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        self.assertNotIn(
            ROTULO_BARRA_CATALOGO,
            _trecho_header(html_produto),
        )

    def test_vitrine_nao_tem_segunda_barra_e_nome_fica_no_main(self):
        html = self._html_vitrine()
        self.assertNotIn('class="barra-vendedor"', html)
        main = _trecho_main(html)
        self.assertRegex(
            main,
            r'^<p class="nome-vendedor">bruno</p>',
        )

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


def _atributos_bolinhas_carrossel(html: str) -> list[dict[str, str | None]]:
    padrao = re.compile(
        r'<button\s+type="button"\s+class="bolinha"([^>]*)>',
        flags=re.IGNORECASE,
    )
    bolinhas: list[dict[str, str | None]] = []
    for trecho in padrao.findall(html):
        rotulo = re.search(r'aria-label="([^"]*)"', trecho)
        corrente = re.search(r'aria-current="([^"]*)"', trecho)
        bolinhas.append(
            {
                "aria-label": rotulo.group(1) if rotulo else None,
                "aria-current": corrente.group(1) if corrente else None,
            },
        )
    return bolinhas


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

    def test_voltar_e_nome_do_vendedor_no_header_apontam_para_a_vitrine(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        header = _trecho_header(html)
        self.assertRegex(
            header,
            r'<a class="voltar" href="\.\./" aria-label="Voltar">',
        )
        self.assertIn('<a href="../">bruno</a>', header.replace("\n", ""))
        self.assertNotIn(f">{ROTULO_VOLTAR}<", header)
        self.assertNotIn(ROTULO_BARRA_CATALOGO, header)

    def test_ordem_nome_carrossel_preco_observacao_ficha_e_barra(self):
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        marcadores = [
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
        bolinhas = _atributos_bolinhas_carrossel(html)
        self.assertEqual(
            bolinhas,
            [
                {"aria-label": "Foto 1", "aria-current": "true"},
                {"aria-label": "Foto 2", "aria-current": None},
            ],
        )
        self.assertNotIn('<span class="bolinha"', html)
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


# VITR-74 / spec P1 Ler e navegar AC 1
# VITR-75 / spec P1 Ler e navegar AC 2
# VITR-76 / spec P1 Ler e navegar AC 3
META_VIEWPORT = (
    '<meta name="viewport" content="width=device-width, initial-scale=1">'
)
LINK_PULAR_CONTEUDO = (
    '<a class="pular" href="#conteudo">Pular para o conteúdo</a>'
)
MAIN_CONTEUDO_ABERTURA = '<main id="conteudo" tabindex="-1">'
PAGINAS_RAIZ_VITRINE_RELOGIO = (
    "index.html",
    "bruno/index.html",
    "bruno/relogio-primeiro/index.html",
)


def _primeiro_filho_do_body(html: str) -> str:
    corpo = html.split("<body>", 1)[1].split("</body>", 1)[0]
    inicio = corpo.lstrip()
    match = re.match(
        r'(<a class="pular" href="#conteudo">Pular para o conteúdo</a>)',
        inicio,
    )
    if match is None:
        raise AssertionError("primeiro filho do body não é o link de pular")
    return match.group(1)


def _trecho_head(html: str) -> str:
    match = re.search(r"<head>(.*?)</head>", html, flags=re.DOTALL)
    if match is None:
        raise AssertionError("head ausente")
    return match.group(1)


def _trecho_header(html: str) -> str:
    match = re.search(
        r'<header class="barra-negra">(.*?)</header>',
        html,
        flags=re.DOTALL,
    )
    if match is None:
        raise AssertionError("header.barra-negra ausente")
    return match.group(0)


def _trecho_main(html: str) -> str:
    match = re.search(
        r'<main id="conteudo"[^>]*>(.*?)</main>',
        html,
        flags=re.DOTALL,
    )
    if match is None:
        raise AssertionError("main#conteudo ausente")
    return match.group(1).lstrip()


def _links_navegacao_no_header(html: str) -> list[tuple[str, str]]:
    header = _trecho_header(html)
    return [
        (href, texto)
        for href, texto in _parse_html(header).links
        if texto != "img"
    ]


class TestBarraNoHeader(unittest.TestCase):
    """AJST-01–AJST-15 / spec P1 Barra das três páginas."""

    def test_raiz_tem_catalogo_com_href_ponto_barra(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "index.html")
        header = _trecho_header(html)
        self.assertIn(f'<a href="./">{ROTULO_BARRA_CATALOGO}</a>', header)
        self.assertNotIn('class="voltar"', html)
        self.assertNotIn('class="barra-vendedor"', html)

    def test_vitrine_header_tem_voltar_e_catalogo_ambos_pai(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        links = _links_navegacao_no_header(html)
        self.assertEqual(
            links,
            [("../", ""), ("../", ROTULO_BARRA_CATALOGO)],
        )
        voltar = re.search(
            r'<a class="voltar" href="\.\./" aria-label="Voltar">'
            r'(.*?)</a>',
            _trecho_header(html),
            flags=re.DOTALL,
        )
        self.assertIsNotNone(voltar)
        self.assertIn('aria-hidden="true"', voltar.group(1))
        self.assertNotIn(ROTULO_VOLTAR, voltar.group(1))

    def test_vitrine_sem_itens_mantem_nome_vendedor_e_mensagem_vazia(self):
        html = _escrever_catalogo([vendedor_sem_itens()], "ana/index.html")
        main = _trecho_main(html)
        self.assertRegex(main, r'^<p class="nome-vendedor">Ana</p>')
        self.assertIn(MENSAGEM_VITRINE_VAZIA, main)
        self.assertNotIn('class="barra-vendedor"', html)

    def test_vitrine_nome_aparece_somente_uma_vez_no_body(self):
        html = _escrever_catalogo(catalogo_dois_vendedores(), "bruno/index.html")
        main = _trecho_main(html)
        self.assertEqual(main.count('class="nome-vendedor"'), 1)
        self.assertEqual(main.count("bruno"), 1)

    def test_produto_header_tem_voltar_e_nome_sem_catalogo(self):
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        links = _links_navegacao_no_header(html)
        self.assertEqual(links, [("../", ""), ("../", "bruno")])
        self.assertNotIn('class="nome-vendedor"', html)
        self.assertNotIn('class="barra-vendedor"', html)

    def test_nome_com_menor_e_e_comercial_sai_escapado_no_header_e_no_main(self):
        vendedor = Vendedor(
            pasta="especial",
            nome="A & B <tag>",
            whatsapp="5511999999999",
            itens=[
                _item_pagina("relogio-1", "Modelo"),
            ],
        )
        html_vitrine = _escrever_catalogo([vendedor], "especial/index.html")
        self.assertIn(
            '<p class="nome-vendedor">A &amp; B &lt;tag&gt;</p>',
            html_vitrine,
        )

        html_produto = _escrever_catalogo([vendedor], "especial/relogio-1/index.html")
        self.assertIn(
            '<a href="../">A &amp; B &lt;tag&gt;</a>',
            _trecho_header(html_produto),
        )
        self.assertNotIn('class="nome-vendedor"', html_produto)


class TestViewportLinkPularEConteudo(unittest.TestCase):
    def test_toda_pagina_declara_viewport_dentro_do_head(self):
        for rel in PAGINAS_RAIZ_VITRINE_RELOGIO:
            html = _escrever_catalogo(catalogo_dois_vendedores(), rel)
            self.assertIn(META_VIEWPORT, _trecho_head(html))

    def test_primeiro_filho_do_body_e_link_pular_para_conteudo(self):
        for rel in PAGINAS_RAIZ_VITRINE_RELOGIO:
            html = _escrever_catalogo(catalogo_dois_vendedores(), rel)
            self.assertEqual(_primeiro_filho_do_body(html), LINK_PULAR_CONTEUDO)

    def test_main_tem_id_conteudo_e_tabindex_menos_um(self):
        for rel in PAGINAS_RAIZ_VITRINE_RELOGIO:
            html = _escrever_catalogo(catalogo_dois_vendedores(), rel)
            self.assertIn(MAIN_CONTEUDO_ABERTURA, html)


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


# VITR-83 / spec P1 Ler e navegar AC 10


class TestBolinhasCarrosselComoBotoes(unittest.TestCase):
    def test_tres_fotos_geram_tres_botoes_com_nome_foto_1_2_e_3(self):
        item = _item_pagina(
            "relogio-tres",
            "Modelo Tres Fotos",
            imagens=[
                _foto("a.png"),
                _foto("b.png"),
                _foto("c.png"),
            ],
        )
        html = _pagina_relogio(item)
        bolinhas = _atributos_bolinhas_carrossel(html)
        self.assertEqual(len(bolinhas), 3)
        self.assertEqual(
            [b["aria-label"] for b in bolinhas],
            ["Foto 1", "Foto 2", "Foto 3"],
        )

    def test_so_a_primeira_bolinha_marca_aria_current_com_tres_fotos(self):
        item = _item_pagina(
            "relogio-tres-corrente",
            "Modelo Tres Corrente",
            imagens=[_foto("a.png"), _foto("b.png"), _foto("c.png")],
        )
        html = _pagina_relogio(item)
        correntes = [
            b["aria-current"] == "true"
            for b in _atributos_bolinhas_carrossel(html)
        ]
        self.assertEqual(correntes, [True, False, False])


# VITR-97 / spec P1 Foto no quadro AC 2
# VITR-102 / spec P1 Foto no quadro AC 7
# VITR-103 / spec P1 Foto no quadro AC 8


def _extrair_div_fechado(html: str, class_name: str) -> str:
    marcador = f'<div class="{class_name}">'
    inicio = html.find(marcador)
    if inicio == -1:
        raise AssertionError(f"{class_name} ausente")
    pos = inicio + len(marcador)
    profundidade = 1
    i = pos
    fim_fecha = -1
    while profundidade > 0:
        prox_abre = html.find("<div", i)
        prox_fecha = html.find("</div>", i)
        if prox_fecha == -1:
            raise AssertionError(f"{class_name} malformado")
        if prox_abre != -1 and prox_abre < prox_fecha:
            profundidade += 1
            i = prox_abre + 4
        else:
            profundidade -= 1
            fim_fecha = prox_fecha
            i = prox_fecha + len("</div>")
    return html[inicio : fim_fecha + len("</div>")]


def _bloco_carrossel(html: str) -> str:
    outer = _extrair_div_fechado(html, "carrossel")
    prefix = '<div class="carrossel">'
    return outer[len(prefix) : -len("</div>")]


class TestQuadroDoCarrossel(unittest.TestCase):
    """AJST-34–AJST-36, AJST-39 / spec P1 Quadro do carrossel."""

    def test_uma_foto_fica_na_janela_sem_seta_nem_bolinha(self):
        # AJST-34 / spec P1 Quadro do carrossel AC 1
        # AJST-36 / spec P1 Quadro do carrossel AC 3
        html = _escrever_catalogo(
            catalogo_dois_vendedores(),
            "bruno/relogio-primeiro/index.html",
        )
        carrossel = _bloco_carrossel(html)
        janela = _extrair_div_fechado(carrossel, "carrossel-janela")
        self.assertIn('src="../imagens/primeiro.png"', janela)
        self.assertNotIn("seta", janela)
        self.assertNotIn("bolinha", janela)
        self.assertNotIn("bolinhas", carrossel.replace(janela, ""))

    def test_duas_fotos_tem_setas_na_janela_e_bolinhas_irmao(self):
        # AJST-34 / spec P1 Quadro do carrossel AC 1
        # AJST-35 / spec P1 Quadro do carrossel AC 2
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        carrossel = _bloco_carrossel(html)
        janela = _extrair_div_fechado(carrossel, "carrossel-janela")
        self.assertIn('class="seta seta-anterior"', janela)
        self.assertIn('class="seta seta-proxima"', janela)
        self.assertNotIn("bolinha", janela)
        resto = carrossel[len(janela) :]
        self.assertRegex(resto.strip(), r'^<div class="bolinhas">')

    def test_controles_continuam_descendentes_de_carrossel(self):
        # AJST-39 / spec P1 Quadro do carrossel AC 6
        html = _pagina_relogio(_item_ficha_fora_de_ordem())
        bloco = _extrair_div_fechado(html, "carrossel")
        self.assertIn("<img", bloco)
        self.assertIn('class="bolinhas"', bloco)
        self.assertIn('class="seta seta-anterior"', bloco)
        self.assertIn('class="seta seta-proxima"', bloco)


def _imagens_no_bloco(bloco: str) -> list[dict[str, str | None]]:
    imagens: list[dict[str, str | None]] = []
    for tag in re.findall(r"<img\b[^>]*>", bloco):
        attrs: dict[str, str | None] = {}
        for nome, valor in re.findall(r'([\w-]+)(?:="([^"]*)")?', tag):
            attrs[nome] = valor
        imagens.append(attrs)
    return imagens


def _imagens_dos_cards(html: str) -> list[dict[str, str | None]]:
    grade = re.search(
        r'<div class="grade-vitrine">(.*?)</div>',
        html,
        flags=re.DOTALL,
    )
    if grade is None:
        raise AssertionError("grade da vitrine ausente")
    return _imagens_no_bloco(grade.group(1))


def _vendedor_dois_itens_capa_400_por_300() -> Vendedor:
    return Vendedor(
        pasta="bruno",
        nome="bruno",
        whatsapp="5511888888888",
        itens=[
            _item_pagina(
                "relogio-primeiro",
                "Relógio Primeiro",
                imagens=[_foto("capa.png", 400, 300)],
            ),
            _item_pagina(
                "relogio-segundo",
                "Relógio Segundo",
                imagens=[_foto("capa.png", 400, 300)],
            ),
        ],
    )


class TestTamanhoECargaDasFotos(unittest.TestCase):
    def test_card_e_foto_do_carrossel_declaram_largura_e_altura(self):
        vendedor = _vendedor_dois_itens_capa_400_por_300()
        html_vitrine = _escrever_catalogo([vendedor], "bruno/index.html")
        for attrs in _imagens_dos_cards(html_vitrine):
            self.assertEqual(attrs.get("width"), "400")
            self.assertEqual(attrs.get("height"), "300")

        item = _item_pagina(
            "relogio-dois-fotos",
            "Modelo Dois Fotos",
            imagens=[_foto("capa.png", 400, 300), _foto("verso.png", 400, 300)],
        )
        html_relogio = _pagina_relogio(item)
        for attrs in _imagens_no_bloco(_bloco_carrossel(html_relogio)):
            self.assertEqual(attrs.get("width"), "400")
            self.assertEqual(attrs.get("height"), "300")

    def test_primeiro_card_e_primeira_foto_do_carrossel_sem_loading(self):
        vendedor = _vendedor_dois_itens_capa_400_por_300()
        html_vitrine = _escrever_catalogo([vendedor], "bruno/index.html")
        cards = _imagens_dos_cards(html_vitrine)
        self.assertNotIn("loading", cards[0])

        item = _item_pagina(
            "relogio-dois-fotos",
            "Modelo Dois Fotos",
            imagens=[_foto("capa.png", 400, 300), _foto("verso.png", 400, 300)],
        )
        html_relogio = _pagina_relogio(item)
        fotos = _imagens_no_bloco(_bloco_carrossel(html_relogio))
        self.assertNotIn("loading", fotos[0])

    def test_segundo_card_e_segunda_foto_do_carrossel_com_lazy(self):
        vendedor = _vendedor_dois_itens_capa_400_por_300()
        html_vitrine = _escrever_catalogo([vendedor], "bruno/index.html")
        cards = _imagens_dos_cards(html_vitrine)
        self.assertEqual(cards[1].get("loading"), "lazy")

        item = _item_pagina(
            "relogio-dois-fotos",
            "Modelo Dois Fotos",
            imagens=[_foto("capa.png", 400, 300), _foto("verso.png", 400, 300)],
        )
        html_relogio = _pagina_relogio(item)
        fotos = _imagens_no_bloco(_bloco_carrossel(html_relogio))
        self.assertEqual(fotos[1].get("loading"), "lazy")
