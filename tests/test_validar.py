import tempfile
import unittest
from pathlib import Path

from gerador.validar import CatalogoErro, carregar

# VITR-03: pasta e id só passam em ^[a-z0-9]+(-[a-z0-9]+)*$
REGRA_PASTA = "pasta não casa ^[a-z0-9]+(-[a-z0-9]+)*$"
REGRA_ID = "id não casa ^[a-z0-9]+(-[a-z0-9]+)*$"
# VITR-05: campos obrigatórios
REGRA_NOME_VENDEDOR = "nome do vendedor ausente"
REGRA_WHATSAPP_AUSENTE = "whatsapp ausente"
REGRA_ID_AUSENTE = "id ausente"
REGRA_NOME_ITEM = "nome do item ausente"
REGRA_VALOR_AUSENTE = "valorPix ausente"
REGRA_PARCELAMENTO_AUSENTE = "parcelamento ausente"
REGRA_IMAGENS_AUSENTES = "imagens ausente"
REGRA_FICHA_AUSENTE = "ficha ausente"
# VITR-06: dígitos, 12 a 15; o texto do escalar recusa yes
REGRA_WHATSAPP = "whatsapp não é 12 a 15 dígitos"
# VITR-07: número maior que zero; o texto do escalar recusa yes
REGRA_VALOR = "valorPix não é número maior que zero"
# VITR-08: inteiro YAML >= 1; 12.0 e 12:00 falham pelo texto do escalar
REGRA_PARCELAMENTO = "parcelamento não é inteiro YAML maior ou igual a 1"

VALIDO = """\
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


class TestValidarIdentidadePreco(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def _gravar(self, pasta, texto):
        diretorio = self.raiz / "vendedores" / pasta
        diretorio.mkdir(parents=True)
        (diretorio / "vendedor.yaml").write_text(texto, encoding="utf-8")

    def _erro(self, pasta_esperada, regra):
        with self.assertRaises(CatalogoErro) as ctx:
            carregar(self.raiz)
        self.assertEqual(ctx.exception.pasta, pasta_esperada)
        self.assertEqual(ctx.exception.regra, regra)
        self.assertEqual(str(ctx.exception), f"{pasta_esperada}: {regra}")

    def test_aceita_pasta_e_id_no_padrao_sem_observacoes(self):
        self._gravar("alexandre", VALIDO)
        vendedores = carregar(self.raiz)
        self.assertEqual(len(vendedores), 1)
        vendedor = vendedores[0]
        self.assertEqual(vendedor.pasta, "alexandre")
        self.assertEqual(vendedor.nome, "Alexandre")
        self.assertEqual(vendedor.whatsapp, "5511999999999")
        self.assertIsInstance(vendedor.whatsapp, str)
        self.assertEqual(len(vendedor.itens), 1)
        item = vendedor.itens[0]
        self.assertEqual(item.id, "addiesdive-my-h3-2qz")
        self.assertEqual(item.nome, "Addiesdive")
        self.assertEqual(item.valor_pix, 369.9)
        self.assertEqual(item.parcelamento, 12)
        self.assertIsInstance(item.parcelamento, int)
        self.assertIsNone(item.observacoes)
        self.assertEqual(item.imagens, ["foto.png"])
        self.assertEqual(len(item.ficha), 1)
        self.assertEqual(item.ficha[0].detalhe, "Estado")
        self.assertEqual(item.ficha[0].especificacao, "Novo")

    def test_recusa_pasta_fora_do_padrao(self):
        self._gravar("Alexandre", VALIDO)
        self._erro("Alexandre", REGRA_PASTA)

    def test_recusa_id_com_hifen_no_fim(self):
        self._gravar("alexandre", VALIDO.replace(
            "id: addiesdive-my-h3-2qz",
            "id: relogio-",
            1,
        ))
        self._erro("alexandre", REGRA_ID)

    def test_recusa_id_com_hifen_no_inicio(self):
        self._gravar("alexandre", VALIDO.replace(
            "id: addiesdive-my-h3-2qz",
            "id: -relogio",
            1,
        ))
        self._erro("alexandre", REGRA_ID)

    def test_recusa_id_com_hifen_duplo(self):
        self._gravar("alexandre", VALIDO.replace(
            "id: addiesdive-my-h3-2qz",
            "id: relogio--azul",
            1,
        ))
        self._erro("alexandre", REGRA_ID)

    def test_recusa_nome_do_vendedor_ausente(self):
        self._gravar("alexandre", VALIDO.replace("nome: Alexandre\n", "", 1))
        self._erro("alexandre", REGRA_NOME_VENDEDOR)

    def test_recusa_whatsapp_ausente(self):
        self._gravar("alexandre", VALIDO.replace("whatsapp: 5511999999999\n", "", 1))
        self._erro("alexandre", REGRA_WHATSAPP_AUSENTE)

    def test_recusa_id_ausente(self):
        self._gravar("alexandre", VALIDO.replace("  - id: addiesdive-my-h3-2qz\n", "  -\n", 1))
        self._erro("alexandre", REGRA_ID_AUSENTE)

    def test_recusa_nome_do_item_ausente(self):
        self._gravar("alexandre", VALIDO.replace("    nome: Addiesdive\n", "", 1))
        self._erro("alexandre", REGRA_NOME_ITEM)

    def test_recusa_valor_pix_ausente(self):
        self._gravar("alexandre", VALIDO.replace("    valorPix: 369.9\n", "", 1))
        self._erro("alexandre", REGRA_VALOR_AUSENTE)

    def test_recusa_parcelamento_ausente(self):
        self._gravar("alexandre", VALIDO.replace("    parcelamento: 12\n", "", 1))
        self._erro("alexandre", REGRA_PARCELAMENTO_AUSENTE)

    def test_recusa_imagens_ausentes(self):
        self._gravar("alexandre", VALIDO.replace("    imagens:\n      - foto.png\n", "", 1))
        self._erro("alexandre", REGRA_IMAGENS_AUSENTES)

    def test_recusa_ficha_ausente(self):
        self._gravar(
            "alexandre",
            VALIDO.replace("    ficha:\n      - detalhe: Estado\n        especificacao: Novo\n", "", 1),
        )
        self._erro("alexandre", REGRA_FICHA_AUSENTE)

    def test_recusa_whatsapp_com_nao_digito(self):
        self._gravar("alexandre", VALIDO.replace(
            "whatsapp: 5511999999999",
            "whatsapp: 551199999999a",
            1,
        ))
        self._erro("alexandre", REGRA_WHATSAPP)

    def test_recusa_whatsapp_com_11_digitos(self):
        self._gravar("alexandre", VALIDO.replace(
            "whatsapp: 5511999999999",
            "whatsapp: 55119999999",
            1,
        ))
        self._erro("alexandre", REGRA_WHATSAPP)

    def test_recusa_whatsapp_com_16_digitos(self):
        self._gravar("alexandre", VALIDO.replace(
            "whatsapp: 5511999999999",
            "whatsapp: 5511999999999999",
            1,
        ))
        self._erro("alexandre", REGRA_WHATSAPP)

    def test_recusa_whatsapp_yes_pelo_texto_do_escalar(self):
        self._gravar("alexandre", VALIDO.replace(
            "whatsapp: 5511999999999",
            "whatsapp: yes",
            1,
        ))
        self._erro("alexandre", REGRA_WHATSAPP)

    def test_aceita_whatsapp_com_12_digitos(self):
        self._gravar("alexandre", VALIDO.replace(
            "whatsapp: 5511999999999",
            "whatsapp: 551199999999",
            1,
        ))
        self.assertEqual(carregar(self.raiz)[0].whatsapp, "551199999999")

    def test_aceita_whatsapp_com_15_digitos(self):
        self._gravar("alexandre", VALIDO.replace(
            "whatsapp: 5511999999999",
            "whatsapp: 551199999999999",
            1,
        ))
        self.assertEqual(carregar(self.raiz)[0].whatsapp, "551199999999999")

    def test_recusa_valor_pix_zero(self):
        self._gravar("alexandre", VALIDO.replace("valorPix: 369.9", "valorPix: 0", 1))
        self._erro("alexandre", REGRA_VALOR)

    def test_recusa_valor_pix_negativo(self):
        self._gravar("alexandre", VALIDO.replace("valorPix: 369.9", "valorPix: -1", 1))
        self._erro("alexandre", REGRA_VALOR)

    def test_recusa_valor_pix_yes_pelo_texto_do_escalar(self):
        self._gravar("alexandre", VALIDO.replace("valorPix: 369.9", "valorPix: yes", 1))
        self._erro("alexandre", REGRA_VALOR)

    def test_recusa_parcelamento_12_ponto_0(self):
        self._gravar("alexandre", VALIDO.replace("parcelamento: 12", "parcelamento: 12.0", 1))
        self._erro("alexandre", REGRA_PARCELAMENTO)

    def test_recusa_parcelamento_12_00_pelo_texto_do_escalar(self):
        self._gravar("alexandre", VALIDO.replace("parcelamento: 12", "parcelamento: 12:00", 1))
        self._erro("alexandre", REGRA_PARCELAMENTO)

    def test_recusa_parcelamento_zero(self):
        self._gravar("alexandre", VALIDO.replace("parcelamento: 12", "parcelamento: 0", 1))
        self._erro("alexandre", REGRA_PARCELAMENTO)

    def test_aceita_parcelamento_1(self):
        self._gravar("alexandre", VALIDO.replace("parcelamento: 12", "parcelamento: 1", 1))
        self.assertEqual(carregar(self.raiz)[0].itens[0].parcelamento, 1)

    def test_aceita_observacoes_so_com_espacos(self):
        texto = VALIDO.replace(
            "    parcelamento: 12\n",
            "    parcelamento: 12\n    observacoes: \"   \"\n",
            1,
        )
        self._gravar("alexandre", texto)
        self.assertIsNone(carregar(self.raiz)[0].itens[0].observacoes)
