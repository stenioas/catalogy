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


class _CatalogoTemporario(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def _gravar(self, pasta, texto):
        diretorio = self.raiz / "vendedores" / pasta
        diretorio.mkdir(parents=True)
        (diretorio / "vendedor.yaml").write_text(texto, encoding="utf-8")
        (diretorio / "foto.png").write_bytes(b"img")

    def _erro(self, pasta_esperada, regra):
        with self.assertRaises(CatalogoErro) as ctx:
            carregar(self.raiz)
        self.assertEqual(ctx.exception.pasta, pasta_esperada)
        self.assertEqual(ctx.exception.regra, regra)
        self.assertEqual(str(ctx.exception), f"{pasta_esperada}: {regra}")


class TestValidarIdentidadePreco(_CatalogoTemporario):
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


# VITR-09: sem imagem, barra, arquivo ausente ou extensão fora da lista falha.
# Extensão png, jpg, jpeg, webp ou avif passa em qualquer caixa.
REGRA_IMAGEM_AUSENTE = "item sem imagem"
REGRA_IMAGEM_BARRA = "imagem com barra"
REGRA_ARQUIVO_AUSENTE = "arquivo de imagem ausente"
REGRA_EXTENSAO = "extensão fora de png, jpg, jpeg, webp e avif"
# VITR-10: ficha vazia, campo ausente, valor em branco ou rótulo repetido falha.
REGRA_FICHA_VAZIA = "ficha vazia"
REGRA_FICHA_CAMPOS = "ficha sem detalhe ou especificacao"
REGRA_FICHA_BRANCO = "valor de ficha em branco"
REGRA_ROTULO_REPETIDO = "rótulo de ficha repetido"
# VITR-11: o mesmo id duas vezes no vendedor falha.
REGRA_ID_REPETIDO = "id repetido no vendedor"
# VITR-12: chave fora do formato falha.
REGRA_CHAVE = "chave desconhecida"
# VITR-13: rótulo fora dos 13 da spec falha.
REGRA_ROTULO = "rótulo de ficha fora da lista"

_FICHA = "    ficha:\n      - detalhe: Estado\n        especificacao: Novo\n"
_SEGUNDO_ITEM = """\
  - id: addiesdive-my-h3-2qz
    nome: Outro
    valorPix: 10
    parcelamento: 1
    imagens:
      - foto.png
    ficha:
      - detalhe: Garantia
        especificacao: 90 dias
"""


class TestValidarFichaImagensOrdem(_CatalogoTemporario):
    def _aceita_imagem(self, nome):
        self._gravar("alexandre", VALIDO.replace("foto.png", nome, 1))
        (self.raiz / "vendedores" / "alexandre" / nome).write_bytes(b"img")
        self.assertEqual(carregar(self.raiz)[0].itens[0].imagens, [nome])

    def test_aceita_extensao_png_em_maiusculas(self):
        self._aceita_imagem("FOTO.PNG")

    def test_aceita_extensao_jpg_em_maiusculas(self):
        self._aceita_imagem("FOTO.JPG")

    def test_aceita_extensao_jpeg_em_maiusculas(self):
        self._aceita_imagem("FOTO.JPEG")

    def test_aceita_extensao_webp_em_maiusculas(self):
        self._aceita_imagem("FOTO.WEBP")

    def test_aceita_extensao_avif_em_maiusculas(self):
        self._aceita_imagem("FOTO.AVIF")

    def test_recusa_item_sem_imagem(self):
        self._gravar("alexandre", VALIDO.replace(
            "    imagens:\n      - foto.png\n",
            "    imagens: []\n",
            1,
        ))
        self._erro("alexandre", REGRA_IMAGEM_AUSENTE)

    def test_recusa_imagem_com_barra(self):
        self._gravar("alexandre", VALIDO.replace("foto.png", "../outro.png", 1))
        (self.raiz / "vendedores" / "outro.png").write_bytes(b"img")
        self._erro("alexandre", REGRA_IMAGEM_BARRA)

    def test_recusa_arquivo_de_imagem_ausente(self):
        self._gravar("alexandre", VALIDO.replace("foto.png", "ausente.png", 1))
        self._erro("alexandre", REGRA_ARQUIVO_AUSENTE)

    def test_recusa_extensao_fora_da_lista(self):
        self._gravar("alexandre", VALIDO.replace("foto.png", "foto.gif", 1))
        (self.raiz / "vendedores" / "alexandre" / "foto.gif").write_bytes(b"img")
        self._erro("alexandre", REGRA_EXTENSAO)

    def test_recusa_ficha_vazia(self):
        self._gravar("alexandre", VALIDO.replace(_FICHA, "    ficha: []\n", 1))
        self._erro("alexandre", REGRA_FICHA_VAZIA)

    def test_recusa_ficha_sem_detalhe(self):
        self._gravar("alexandre", VALIDO.replace(
            _FICHA,
            "    ficha:\n      - especificacao: Novo\n",
            1,
        ))
        self._erro("alexandre", REGRA_FICHA_CAMPOS)

    def test_recusa_ficha_sem_especificacao(self):
        self._gravar("alexandre", VALIDO.replace(
            _FICHA,
            "    ficha:\n      - detalhe: Estado\n",
            1,
        ))
        self._erro("alexandre", REGRA_FICHA_CAMPOS)

    def test_recusa_detalhe_em_branco(self):
        self._gravar("alexandre", VALIDO.replace(
            _FICHA,
            "    ficha:\n      - detalhe: \"\"\n        especificacao: Novo\n",
            1,
        ))
        self._erro("alexandre", REGRA_FICHA_BRANCO)

    def test_recusa_especificacao_so_com_espacos(self):
        self._gravar("alexandre", VALIDO.replace(
            "especificacao: Novo",
            "especificacao: \"   \"",
            1,
        ))
        self._erro("alexandre", REGRA_FICHA_BRANCO)

    def test_recusa_rotulo_repetido(self):
        self._gravar("alexandre", VALIDO.replace(
            _FICHA,
            "    ficha:\n"
            "      - detalhe: Estado\n"
            "        especificacao: Novo\n"
            "      - detalhe: Estado\n"
            "        especificacao: Usado\n",
            1,
        ))
        self._erro("alexandre", REGRA_ROTULO_REPETIDO)

    def test_recusa_rotulo_fora_da_lista(self):
        self._gravar("alexandre", VALIDO.replace("detalhe: Estado", "detalhe: Cor", 1))
        self._erro("alexandre", REGRA_ROTULO)

    def test_recusa_id_repetido_no_vendedor(self):
        self._gravar("alexandre", VALIDO + _SEGUNDO_ITEM)
        self._erro("alexandre", REGRA_ID_REPETIDO)

    def test_recusa_chave_desconhecida_no_vendedor(self):
        self._gravar("alexandre", "selo: ouro\n" + VALIDO)
        self._erro("alexandre", REGRA_CHAVE)

    def test_recusa_chave_desconhecida_no_item(self):
        self._gravar("alexandre", VALIDO.replace(
            "    nome: Addiesdive\n",
            "    nome: Addiesdive\n    cor: azul\n",
            1,
        ))
        self._erro("alexandre", REGRA_CHAVE)

    def test_recusa_chave_desconhecida_na_ficha(self):
        self._gravar("alexandre", VALIDO.replace(
            "      - detalhe: Estado\n",
            "      - detalhe: Estado\n        extra: 1\n",
            1,
        ))
        self._erro("alexandre", REGRA_CHAVE)

    def test_ana_vem_antes_de_bruno(self):
        self._gravar("z-ana", VALIDO.replace("nome: Alexandre", "nome: Ana", 1))
        self._gravar("a-bruno", VALIDO.replace("nome: Alexandre", "nome: bruno", 1))
        self.assertEqual(
            [vendedor.nome for vendedor in carregar(self.raiz)],
            ["Ana", "bruno"],
        )

    def test_empate_de_nome_desempata_pela_pasta(self):
        self._gravar("beta", VALIDO.replace("nome: Alexandre", "nome: Ana", 1))
        self._gravar("alfa", VALIDO.replace("nome: Alexandre", "nome: Ana", 1))
        self.assertEqual(
            [vendedor.pasta for vendedor in carregar(self.raiz)],
            ["alfa", "beta"],
        )

    def test_mesmo_id_em_dois_vendedores_sao_copias_independentes(self):
        self._gravar("ana", VALIDO.replace("nome: Alexandre", "nome: Ana", 1))
        self._gravar("bruno", VALIDO.replace("nome: Alexandre", "nome: bruno", 1))
        vendedores = carregar(self.raiz)
        ana = next(vendedor for vendedor in vendedores if vendedor.nome == "Ana")
        bruno = next(vendedor for vendedor in vendedores if vendedor.nome == "bruno")
        item_ana = ana.itens[0]
        item_bruno = bruno.itens[0]
        self.assertEqual(item_ana.id, "addiesdive-my-h3-2qz")
        self.assertEqual(item_bruno.id, "addiesdive-my-h3-2qz")
        self.assertIsNot(item_ana, item_bruno)
        self.assertIsNot(item_ana.imagens, item_bruno.imagens)
        self.assertIsNot(item_ana.ficha, item_bruno.ficha)
        self.assertIsNot(item_ana.ficha[0], item_bruno.ficha[0])
        self.assertEqual(item_ana.ficha[0].detalhe, "Estado")
        self.assertEqual(item_bruno.ficha[0].especificacao, "Novo")
