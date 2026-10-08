import unittest

from gerador.modelo import ORDEM_FICHA

# VITR-39 / spec P1 Navegar AC 20: ordem fixa da ficha na página
ROTULOS_FICHA_SPEC = (
    "Homage de",
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
    "Link de anúncio similar",
    "Garantia",
)


class TestOrdemFicha(unittest.TestCase):
    def test_ordem_ficha_coincide_com_os_13_rotulos_da_spec(self):
        self.assertEqual(len(ORDEM_FICHA), 13)
        self.assertEqual(tuple(ORDEM_FICHA), ROTULOS_FICHA_SPEC)
