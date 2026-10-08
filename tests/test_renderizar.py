import unittest
from urllib.parse import parse_qs, unquote, urlparse

from gerador.renderizar import formatar_parcelamento, formatar_preco, link_whatsapp

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
