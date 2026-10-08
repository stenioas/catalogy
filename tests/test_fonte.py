import unittest
from pathlib import Path

# VITR-53 / spec P1 Tema AC 1: Inter versionada para cópia offline na geração
CAMINHO_FONTE_INTER = Path(__file__).resolve().parent.parent / "fontes" / "InterVariable.woff2"
ASSINATURA_WOFF2 = b"wOF2"


class TestFonteInterVersionada(unittest.TestCase):
    def test_inter_variable_existe_no_repositorio(self):
        self.assertTrue(
            CAMINHO_FONTE_INTER.is_file(),
            "fontes/InterVariable.woff2 deve existir para a geração copiar sem rede",
        )

    def test_inter_variable_e_arquivo_woff2_valido(self):
        with CAMINHO_FONTE_INTER.open("rb") as arquivo:
            cabecalho = arquivo.read(4)
        self.assertEqual(
            cabecalho,
            ASSINATURA_WOFF2,
            "InterVariable.woff2 deve começar com a assinatura wOFF2",
        )
