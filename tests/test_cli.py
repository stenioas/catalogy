import io
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path

RAIZ_PROJETO = Path(__file__).resolve().parent.parent
FONTE_ORIGEM = RAIZ_PROJETO / "fontes" / "InterVariable.woff2"
SCRIPT_GERAR = RAIZ_PROJETO / "scripts" / "gerar_site.py"

# VITR-16 / spec P1 Gerar AC 16
REGRA_NOME_VENDEDOR = "nome do vendedor ausente"
PASTA_ANA = "ana"

YAML_ANA_VALIDO = """\
nome: Ana
whatsapp: 5511999999999
"""

YAML_ANA_SEM_NOME = """\
whatsapp: 5511999999999
"""


class TestGerarSite(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self._tmp.name)
        fontes = self.raiz / "fontes"
        fontes.mkdir()
        shutil.copy2(FONTE_ORIGEM, fontes / "InterVariable.woff2")
        self._gravar(PASTA_ANA, YAML_ANA_VALIDO)

    def tearDown(self):
        self._tmp.cleanup()

    def _gravar(self, pasta, texto):
        diretorio = self.raiz / "vendedores" / pasta
        diretorio.mkdir(parents=True, exist_ok=True)
        (diretorio / "vendedor.yaml").write_text(texto, encoding="utf-8")

    def _importar_main(self):
        import importlib.util

        spec = importlib.util.spec_from_file_location("gerar_site", SCRIPT_GERAR)
        modulo = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(modulo)
        return modulo.main

    def _reescrever_yaml(self, pasta, texto):
        (self.raiz / "vendedores" / pasta / "vendedor.yaml").write_text(
            texto, encoding="utf-8"
        )

    def test_falha_de_validacao_sai_com_codigo_1(self):
        self._reescrever_yaml(PASTA_ANA, YAML_ANA_SEM_NOME)
        main = self._importar_main()
        codigo = main(self.raiz)
        self.assertEqual(codigo, 1)

    def test_falha_de_validacao_escreve_pasta_e_regra_no_stderr(self):
        self._reescrever_yaml(PASTA_ANA, YAML_ANA_SEM_NOME)
        main = self._importar_main()
        buffer = io.StringIO()
        with redirect_stderr(buffer):
            main(self.raiz)
        self.assertEqual(buffer.getvalue().strip(), f"{PASTA_ANA}: {REGRA_NOME_VENDEDOR}")

    def test_sucesso_sai_com_codigo_zero(self):
        main = self._importar_main()
        codigo = main(self.raiz)
        self.assertEqual(codigo, 0)
        self.assertTrue((self.raiz / "site" / "index.html").is_file())


class TestSuiteComportamento(unittest.TestCase):
    def test_nenhum_teste_de_comportamento_le_yaml_publicado_alexandre(self):
        # VITR-72 / spec P1 Publicar AC 5
        raiz = RAIZ_PROJETO
        proibido_absoluto = str(raiz / "vendedores" / "alexandre" / "vendedor.yaml")
        tests_dir = Path(__file__).resolve().parent
        for caminho in sorted(tests_dir.glob("test_*.py")):
            if caminho.name == "test_catalogo_publicado.py":
                continue
            texto = caminho.read_text(encoding="utf-8")
            self.assertNotIn(
                proibido_absoluto,
                texto,
                f"{caminho.name} referencia o YAML publicado do repositório",
            )
