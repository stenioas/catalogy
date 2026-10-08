import shutil
import tempfile
import unittest
from pathlib import Path

from gerador.publicar import substituir
from gerador.validar import CatalogoErro

RAIZ_PROJETO = Path(__file__).resolve().parent.parent
FONTE_ORIGEM = RAIZ_PROJETO / "fontes" / "InterVariable.woff2"

# VITR-02: pasta alexandre e id addiesdive-my-h3-2qz
PASTA_ALEXANDRE = "alexandre"
ID_ADDIE = "addiesdive-my-h3-2qz"
ARQUIVO_IMAGEM = "addiesdive2.png"
BYTES_IMAGEM = b"foto-addiesdive"

# VITR-21: título da raiz. Prova que o HTML gerado chegou em site/.
TITULO_RAIZ = "Catálogo de relógios"
# P1 Navegar AC 12: vitrine sem itens
TEXTO_SEM_ITENS = "Esta vitrine ainda não tem relógios."
NOME_MODELO = "Addiesdive MY-H3-2QZ"

YAML_ANA = """\
nome: Ana
whatsapp: 5511999999999
"""

YAML_ALEXANDRE = f"""\
nome: Alexandre
whatsapp: 5511999999999
itens:
  - id: {ID_ADDIE}
    nome: {NOME_MODELO}
    valorPix: 369.9
    parcelamento: 12
    imagens:
      - {ARQUIVO_IMAGEM}
    ficha:
      - detalhe: Estado
        especificacao: Novo
"""

YAML_ANA_SEM_NOME = """\
whatsapp: 5511999999999
"""


class TestPublicar(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self._tmp.name)
        fontes = self.raiz / "fontes"
        fontes.mkdir()
        shutil.copy2(FONTE_ORIGEM, fontes / "InterVariable.woff2")
        self._gravar("ana", YAML_ANA, None)
        self._gravar(PASTA_ALEXANDRE, YAML_ALEXANDRE, BYTES_IMAGEM)

    def tearDown(self):
        self._tmp.cleanup()

    def _gravar(self, pasta, texto, imagem):
        diretorio = self.raiz / "vendedores" / pasta
        diretorio.mkdir(parents=True)
        (diretorio / "vendedor.yaml").write_text(texto, encoding="utf-8")
        if imagem is not None:
            (diretorio / ARQUIVO_IMAGEM).write_bytes(imagem)

    def _quebrar_ana(self):
        caminho = self.raiz / "vendedores" / "ana" / "vendedor.yaml"
        caminho.write_text(YAML_ANA_SEM_NOME, encoding="utf-8")

    def _bytes_site(self):
        site = self.raiz / "site"
        return {
            caminho.relative_to(site).as_posix(): caminho.read_bytes()
            for caminho in site.rglob("*")
            if caminho.is_file()
        }

    def _html_site(self):
        site = self.raiz / "site"
        return {
            caminho.relative_to(site).as_posix(): caminho.read_text(encoding="utf-8")
            for caminho in site.rglob("*.html")
        }

    def _sobras(self):
        return list(self.raiz.glob("site.novo.*")) + list(self.raiz.glob("site.anterior.*"))

    def test_sucesso_grava_raiz_vitrine_relogio_e_imagens_somente_em_site(self):
        site = self.raiz / "site"
        site.mkdir()
        (site / "index.html").write_text("ANTIGO", encoding="utf-8")
        (site / "extra.txt").write_text("nao deve permanecer", encoding="utf-8")

        substituir(self.raiz)

        raiz_html = site / "index.html"
        vitrine_ana = site / "ana" / "index.html"
        vitrine_alexandre = site / PASTA_ALEXANDRE / "index.html"
        relogio = site / PASTA_ALEXANDRE / ID_ADDIE / "index.html"
        imagem = site / PASTA_ALEXANDRE / "imagens" / ARQUIVO_IMAGEM

        self.assertTrue(raiz_html.is_file())
        self.assertTrue(vitrine_ana.is_file())
        self.assertTrue(vitrine_alexandre.is_file())
        self.assertTrue(relogio.is_file())
        self.assertEqual(imagem.read_bytes(), BYTES_IMAGEM)
        self.assertIn(TITULO_RAIZ, raiz_html.read_text(encoding="utf-8"))
        self.assertIn(TEXTO_SEM_ITENS, vitrine_ana.read_text(encoding="utf-8"))
        self.assertIn(NOME_MODELO, relogio.read_text(encoding="utf-8"))
        self.assertFalse((site / "extra.txt").exists())
        self.assertNotEqual(raiz_html.read_text(encoding="utf-8"), "ANTIGO")
        self.assertEqual(self._sobras(), [])
        self.assertFalse((self.raiz / "index.html").exists())

        gerados = [
            caminho.relative_to(self.raiz).as_posix()
            for caminho in self.raiz.rglob("*")
            if caminho.is_file()
            and not caminho.relative_to(self.raiz).as_posix().startswith(
                ("vendedores/", "fontes/")
            )
        ]
        self.assertTrue(gerados)
        for caminho in gerados:
            self.assertTrue(caminho.startswith("site/"), caminho)

    def test_falha_sem_site_nao_cria_site(self):
        self._quebrar_ana()
        with self.assertRaises(CatalogoErro):
            substituir(self.raiz)
        self.assertFalse((self.raiz / "site").exists())
        self.assertEqual(self._sobras(), [])

    def test_falha_com_site_presente_nao_altera_o_conteudo(self):
        site = self.raiz / "site"
        (site / PASTA_ALEXANDRE).mkdir(parents=True)
        (site / "index.html").write_bytes(b"antigo-raiz")
        (site / PASTA_ALEXANDRE / "index.html").write_bytes(b"antigo-vitrine")
        antes = self._bytes_site()
        self._quebrar_ana()
        with self.assertRaises(CatalogoErro):
            substituir(self.raiz)
        self.assertEqual(self._bytes_site(), antes)
        self.assertEqual(self._sobras(), [])

    def test_duas_execucoes_iguais_produzem_o_mesmo_html(self):
        substituir(self.raiz)
        primeiro = self._html_site()
        substituir(self.raiz)
        segundo = self._html_site()
        self.assertEqual(segundo, primeiro)
        self.assertIn("index.html", primeiro)
        self.assertIn(f"{PASTA_ALEXANDRE}/{ID_ADDIE}/index.html", primeiro)
        self.assertIn("ana/index.html", primeiro)
