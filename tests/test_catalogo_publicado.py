import unittest
from pathlib import Path

from gerador.modelo import ORDEM_FICHA
from gerador.validar import carregar

RAIZ = Path(__file__).resolve().parent.parent
YAML_PUBLICADO = RAIZ / "vendedores" / "alexandre" / "vendedor.yaml"
PASTA_VENDEDOR = RAIZ / "vendedores" / "alexandre"

LINK_ADDIESDIVE = (
    "https://www.mercadolivre.com.br/relogio-masculino-addiesdive-divers-200m-de-quartzo-prateado/p/MLB41177166"
    "?pdp_filters=item_id%3AMLB5686666970#polycard_client=search-desktop&float_highlight=last_units"
    "&be_origin=searchv2&overlay_label=not_apply&search_layout=grid&position=4&type=product"
    "&tracking_id=fca32ea7-69b6-4cdf-8831-c1210957c2ef&wid=MLB5686666970&sid=search"
)

LINK_CURREN = (
    "https://www.mercadolivre.com.br/relogio-masculino-de-pulso-analogico-curren-modelo-8455-luxo-prateado/p/MLB74702510"
    "?product_trigger_id=MLB55161518&pdp_filters=item_id%3AMLB7070370018&applied_product_filters=MLB74702510"
    "&picker=true&quantity=1"
)

FICHA_ADDIESDIVE = [
    ("Homage de", "Rolex Submariner Date"),
    ("Estado", "Usado 2x"),
    ("Tipo do relógio", "Diver (mergulho)"),
    ("Tipo de movimento", "Quartzo (Miyota 2115)"),
    ("Material da caixa", "Aço inoxidável 316L"),
    ("Material da pulseira", "Aço inoxidável; tipo de aço não informado"),
    ("Material do vidro", "Vidro mineral convexo; também descrito como Hardlex"),
    ("Resistência à água", "200 m (20 bar)"),
    ("Tamanho da caixa", "41 mm de diâmetro, sem a coroa"),
    ("Largura da pulseira", "20 mm no encaixe da caixa"),
    ("Material do bisel", "Cerâmica"),
    ("Link de anúncio similar", LINK_ADDIESDIVE),
    ("Garantia", "90 dias"),
]

FICHA_CURREN = [
    ("Homage de", "Não informado"),
    ("Estado", "Novo"),
    ("Tipo do relógio", "Esportivo/casual, com tema de bússola"),
    ("Tipo de movimento", "Quartzo"),
    ("Material da caixa", "Liga metálica"),
    ("Material da pulseira", "Aço inoxidável"),
    ("Material do vidro", "Hardlex"),
    ("Resistência à água", "30 m (3 bar)"),
    ("Tamanho da caixa", "Diâmetro informado como faixa de 40 a 44 mm"),
    ("Largura da pulseira", "Faixa informada de 20 a 24 mm"),
    ("Material do bisel", "Não informado"),
    ("Link de anúncio similar", LINK_CURREN),
    ("Garantia", "90 dias"),
]

FICHA_SECULUS = [
    ("Homage de", "Não informado"),
    ("Estado", "Usado 2x"),
    ("Tipo do relógio", "Casual"),
    ("Tipo de movimento", "Não informado"),
    ("Material da caixa", "Aço; tipo não informado"),
    ("Material da pulseira", "Aço; tipo não informado"),
    ("Material do vidro", "Cristal mineral"),
    ("Resistência à água", "50 m (5 ATM)"),
    ("Tamanho da caixa", "45 mm"),
    ("Largura da pulseira", "Não informada"),
    ("Material do bisel", "Não informado"),
    ("Link de anúncio similar", "Não informado"),
    ("Garantia", "1 ano e 10 meses"),
]


def _alexandre(vendedores):
    return next(v for v in vendedores if v.pasta == "alexandre")


def _ficha_tuplas(item):
    return [(linha.detalhe, linha.especificacao) for linha in item.ficha]


class TestCatalogoPublicadoAlexandre(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vendedores = carregar(RAIZ)
        cls.alexandre = _alexandre(cls.vendedores)

    def test_yaml_publicado_existe(self):
        self.assertTrue(YAML_PUBLICADO.is_file())

    def test_nome_e_whatsapp_do_vendedor(self):
        self.assertEqual(self.alexandre.nome, "Alexandre")
        self.assertEqual(self.alexandre.whatsapp, "5511999999999")

    def test_tres_itens_na_ordem_da_spec(self):
        ids = [item.id for item in self.alexandre.itens]
        self.assertEqual(
            ids,
            ["addiesdive-my-h3-2qz", "curren-8455", "seculus-kit-com-cantil"],
        )

    def test_addiesdive_preco_imagens_e_sem_observacoes(self):
        item = self.alexandre.itens[0]
        self.assertEqual(item.valor_pix, 369.9)
        self.assertEqual(item.imagens, ["addiesdive2.png", "addiesdive1.png"])
        self.assertIsNone(item.observacoes)

    def test_curren_preco_imagens_e_sem_observacoes(self):
        item = self.alexandre.itens[1]
        self.assertEqual(item.valor_pix, 119.9)
        self.assertEqual(item.imagens, ["curren2.png", "curren1.png"])
        self.assertIsNone(item.observacoes)

    def test_seculus_preco_imagem_e_observacoes(self):
        item = self.alexandre.itens[2]
        self.assertEqual(item.valor_pix, 299.9)
        self.assertEqual(item.imagens, ["seculus1.png"])
        self.assertEqual(item.observacoes, "acompanha caixa de metal e cantil")

    def test_parcelamento_doze_em_todos_os_itens(self):
        for item in self.alexandre.itens:
            self.assertEqual(item.parcelamento, 12)

    def test_ficha_addiesdive_na_ordem_fixa(self):
        item = self.alexandre.itens[0]
        self.assertEqual([linha.detalhe for linha in item.ficha], list(ORDEM_FICHA))
        self.assertEqual(_ficha_tuplas(item), FICHA_ADDIESDIVE)

    def test_ficha_curren_na_ordem_fixa(self):
        item = self.alexandre.itens[1]
        self.assertEqual([linha.detalhe for linha in item.ficha], list(ORDEM_FICHA))
        self.assertEqual(_ficha_tuplas(item), FICHA_CURREN)

    def test_ficha_seculus_na_ordem_fixa(self):
        item = self.alexandre.itens[2]
        self.assertEqual([linha.detalhe for linha in item.ficha], list(ORDEM_FICHA))
        self.assertEqual(_ficha_tuplas(item), FICHA_SECULUS)

    def test_fotos_citadas_estao_na_pasta_do_vendedor(self):
        for item in self.alexandre.itens:
            for nome in item.imagens:
                self.assertTrue(
                    (PASTA_VENDEDOR / nome).is_file(),
                    f"{nome} ausente em vendedores/alexandre/",
                )

    def test_pasta_images_catalogo_permanece(self):
        catalogo = RAIZ / "images" / "catalogo"
        self.assertTrue(catalogo.is_dir())
        for nome in (
            "addiesdive1.png",
            "addiesdive2.png",
            "curren1.png",
            "curren2.png",
            "seculus1.png",
        ):
            self.assertTrue((catalogo / nome).is_file(), nome)


class TestFontesAntigasRemovidas(unittest.TestCase):
    def test_catalogo_md_removido(self):
        self.assertFalse((RAIZ / "catalogo.md").exists())

    def test_catalogo_pdf_removido(self):
        self.assertFalse((RAIZ / "catalogo.pdf").exists())

    def test_template_produto_removido(self):
        self.assertFalse((RAIZ / "template-produto.md").exists())

    def test_detalhes_do_item_removido(self):
        self.assertFalse((RAIZ / "detalhes-do-item.md").exists())

    def test_plano_removido(self):
        self.assertFalse((RAIZ / "PLANO.md").exists())

    def test_tmp_removido(self):
        self.assertFalse((RAIZ / "tmp").exists())


class TestArtefatosPreservados(unittest.TestCase):
    def test_design_md_permanece(self):
        self.assertTrue((RAIZ / "DESIGN.md").is_file())

    def test_especificacao_vitrine_permanece(self):
        self.assertTrue(
            (RAIZ / "2026-10-07-vitrine-relogios-design.md").is_file()
        )

    def test_diretorio_agents_skills_permanece(self):
        self.assertTrue((RAIZ / ".agents" / "skills").is_dir())
