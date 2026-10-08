import ast
import builtins
import importlib.util
import io
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path

from gerador.validar import REGRA_TAMANHO_IMAGEM
from tests import imagens_exemplo

# VITR-72 / spec P1 Publicar AC 5: a suíte de comportamento não lê o YAML publicado
_PARTES_YAML_PUBLICADO = ("vendedores", "alexandre", "vendedor.yaml")
_TESTE_GUARDA = "test_nenhum_teste_de_comportamento_le_yaml_publicado_alexandre"
_TESTE_CATALOGO = "test_catalogo_publicado.py"

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

PASTA_ALEXANDRE = "alexandre"
YAML_ALEXANDRE_IMAGEM = """\
nome: Alexandre
whatsapp: 5511999999999
itens:
  - id: addiesdive-my-h3-2qz
    nome: Addiesdive
    valorPix: 369.9
    parcelamento: 12
    imagens:
      - foto.png
    ficha:
      - detalhe: Estado
        especificacao: Novo
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

    def _gravar_alexandre(self, bytes_imagem: bytes) -> None:
        diretorio = self.raiz / "vendedores" / PASTA_ALEXANDRE
        diretorio.mkdir(parents=True, exist_ok=True)
        (diretorio / "vendedor.yaml").write_text(
            YAML_ALEXANDRE_IMAGEM, encoding="utf-8"
        )
        (diretorio / "foto.png").write_bytes(bytes_imagem)

    def test_imagem_ilegivel_escreve_pasta_e_regra_no_stderr(self):
        self._gravar_alexandre(b"\x00\x01")
        main = self._importar_main()
        buffer = io.StringIO()
        with redirect_stderr(buffer):
            codigo = main(self.raiz)
        self.assertEqual(codigo, 1)
        self.assertEqual(
            buffer.getvalue().strip(),
            f"{PASTA_ALEXANDRE}: {REGRA_TAMANHO_IMAGEM}",
        )
        self.assertNotIn("foto.png", buffer.getvalue())


def _partes_de_caminho(no: ast.AST) -> tuple[str, ...] | None:
    if isinstance(no, ast.Constant) and isinstance(no.value, str):
        texto = no.value.replace("\\", "/").strip()
        if not texto:
            return ()
        return tuple(
            parte
            for parte in Path(texto).parts
            if parte not in {"/", ".", ""}
        )
    if isinstance(no, ast.BinOp) and isinstance(no.op, ast.Div):
        direita = _partes_de_caminho(no.right)
        if direita is None:
            return None
        esquerda = _partes_de_caminho(no.left)
        return (esquerda or ()) + direita
    if isinstance(no, ast.JoinedStr):
        pedacos: list[str] = []
        for valor in no.values:
            if not isinstance(valor, ast.Constant) or not isinstance(valor.value, str):
                return None
            pedacos.append(valor.value)
        return _partes_de_caminho(ast.Constant(value="".join(pedacos)))
    if isinstance(no, ast.Call):
        return _partes_de_chamada(no)
    return None


def _partes_de_chamada(no: ast.Call) -> tuple[str, ...] | None:
    func = no.func
    if isinstance(func, ast.Attribute):
        nome = func.attr
        base = _partes_de_caminho(func.value)
    elif isinstance(func, ast.Name):
        nome = func.id
        base = ()
    else:
        return None
    if nome in {"read_text", "read_bytes"} and isinstance(func, ast.Attribute):
        return base
    if nome not in {"joinpath", "join", "Path", "open"}:
        return None
    partes = () if base is None else base
    for arg in no.args:
        extra = _partes_de_caminho(arg)
        if extra is None:
            return None
        partes += extra
    return partes


def _cita_yaml_publicado(caminho: Path) -> str | None:
    arvore = ast.parse(caminho.read_text(encoding="utf-8"))

    def visitar(no: ast.AST) -> str | None:
        if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)) and no.name == _TESTE_GUARDA:
            return None
        partes = _partes_de_caminho(no)
        if partes is not None and partes[-3:] == _PARTES_YAML_PUBLICADO:
            return f"{caminho.name}:{no.lineno}"
        for filho in ast.iter_child_nodes(no):
            achado = visitar(filho)
            if achado:
                return achado
        return None

    return visitar(arvore)


def _casos(suite: unittest.TestSuite):
    for item in suite:
        if isinstance(item, unittest.TestSuite):
            yield from _casos(item)
        else:
            yield item


def _suite_de_comportamento() -> unittest.TestSuite:
    loader = unittest.defaultTestLoader
    suite = unittest.TestSuite()
    pasta = Path(__file__).resolve().parent
    for caminho in sorted(pasta.glob("test_*.py")):
        if caminho.name == _TESTE_CATALOGO:
            continue
        spec = importlib.util.spec_from_file_location(caminho.stem, caminho)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"não foi possível carregar {caminho.name}")
        modulo = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(modulo)
        for caso in _casos(loader.loadTestsFromModule(modulo)):
            if caso.id().rsplit(".", 1)[-1] == _TESTE_GUARDA:
                continue
            suite.addTest(caso)
    return suite


def _marcar_leitura(publicado: Path, caminho, abriu: list[bool]) -> None:
    if isinstance(caminho, int):
        return
    try:
        if Path(caminho).resolve() == publicado:
            abriu[0] = True
    except (OSError, ValueError, TypeError):
        pass


def _leu_yaml_publicado(publicado: Path) -> tuple[bool, unittest.TestResult]:
    abriu = [False]
    original_io = io.open
    original_builtin = builtins.open
    original_path = Path.open

    def vigia_io(caminho, *args, **kwargs):
        _marcar_leitura(publicado, caminho, abriu)
        return original_io(caminho, *args, **kwargs)

    def vigia_path(self_path, *args, **kwargs):
        _marcar_leitura(publicado, self_path, abriu)
        return original_path(self_path, *args, **kwargs)

    io.open = vigia_io
    builtins.open = vigia_io
    Path.open = vigia_path
    try:
        with redirect_stderr(io.StringIO()):
            resultado = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(
                _suite_de_comportamento()
            )
    finally:
        io.open = original_io
        builtins.open = original_builtin
        Path.open = original_path
    return abriu[0], resultado


class TestSuiteComportamento(unittest.TestCase):
    def test_nenhum_teste_de_comportamento_le_yaml_publicado_alexandre(self):
        # VITR-72 / spec P1 Publicar AC 5
        pasta = Path(__file__).resolve().parent
        for caminho in sorted(pasta.glob("test_*.py")):
            if caminho.name == _TESTE_CATALOGO:
                continue
            citacao = _cita_yaml_publicado(caminho)
            self.assertIsNone(
                citacao,
                f"{citacao} cita vendedores/alexandre/vendedor.yaml",
            )
        publicado = (RAIZ_PROJETO.joinpath(*_PARTES_YAML_PUBLICADO)).resolve()
        leu, resultado = _leu_yaml_publicado(publicado)
        self.assertEqual(
            resultado.errors,
            [],
            "a suíte vigiada não terminou; a guarda não pôde medir a leitura",
        )
        self.assertFalse(
            leu,
            "a suíte de comportamento leu vendedores/alexandre/vendedor.yaml",
        )
