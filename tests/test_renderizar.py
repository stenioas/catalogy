import re
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from gerador.renderizar import (
    escrever,
    formatar_parcelamento,
    formatar_preco,
    link_whatsapp,
)
from catalogo_exemplo import catalogo_dois_vendedores, vendedor_sem_itens

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
        escrever(vendedores, destino, destino / "fontes")
        return (destino / relativo).read_text(encoding="utf-8")


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
