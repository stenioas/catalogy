"""VITR-98, VITR-99, VITR-100: ler largura e altura de PNG, JPEG, WebP e AVIF."""

from __future__ import annotations

import ast
import importlib
import tempfile
import unittest
from pathlib import Path

from gerador.imagem import ImagemIlegivel, ler_dimensoes
from tests import imagens_exemplo


class TestPngDimensoes(unittest.TestCase):
    # VITR-98 / spec P1 Foto no quadro AC 3
    def test_png_400_por_300_devolve_tamanho_do_ihdr(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(imagens_exemplo.png(400, 300))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), (400, 300))


class TestJpegDimensoes(unittest.TestCase):
    # VITR-98 / spec P1 Foto no quadro AC 3
    def test_jpeg_400_por_300_sem_exif_devolve_tamanho_do_sof(self):
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(imagens_exemplo.jpeg_sof(400, 300))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), (400, 300))

    # VITR-100 / spec P1 Foto no quadro AC 5 e assumptions orientação Exif
    def test_jpeg_orientacao_1_mantem_largura_e_altura(self):
        self._assert_jpeg_orientacao(1, (400, 300))

    def test_jpeg_orientacao_2_mantem_largura_e_altura(self):
        self._assert_jpeg_orientacao(2, (400, 300))

    def test_jpeg_orientacao_3_mantem_largura_e_altura(self):
        self._assert_jpeg_orientacao(3, (400, 300))

    def test_jpeg_orientacao_4_mantem_largura_e_altura(self):
        self._assert_jpeg_orientacao(4, (400, 300))

    # VITR-99 / spec P1 Foto no quadro AC 4
    def test_jpeg_orientacao_5_troca_largura_e_altura(self):
        self._assert_jpeg_orientacao(5, (300, 400))

    def test_jpeg_orientacao_6_troca_largura_e_altura(self):
        self._assert_jpeg_orientacao(6, (300, 400))

    def test_jpeg_orientacao_7_troca_largura_e_altura(self):
        self._assert_jpeg_orientacao(7, (300, 400))

    def test_jpeg_orientacao_8_troca_largura_e_altura(self):
        self._assert_jpeg_orientacao(8, (300, 400))

    def _assert_jpeg_orientacao(self, orientacao: int, esperado: tuple[int, int]) -> None:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(imagens_exemplo.jpeg_sof(400, 300, orientacao=orientacao))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), esperado)

    # design.md Error Handling: Exif malformado com SOF válido
    def test_jpeg_exif_malformado_usa_tamanho_do_sof(self):
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(
                imagens_exemplo.jpeg_sof(
                    400, 300, orientacao=6, exif_malformado=True
                )
            )
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), (400, 300))


class TestWebpDimensoes(unittest.TestCase):
    # VITR-98 / spec assumptions tamanho em WebP
    def test_webp_vp8_400_por_300_devolve_tamanho_do_quadro_chave(self):
        self._assert_webp(imagens_exemplo.webp_vp8(400, 300), (400, 300))

    def test_webp_vp8l_400_por_300_devolve_tamanho_do_bitstream(self):
        self._assert_webp(imagens_exemplo.webp_vp8l(400, 300), (400, 300))

    def test_webp_vp8x_400_por_300_devolve_tamanho_da_tela(self):
        self._assert_webp(imagens_exemplo.webp_vp8x(400, 300), (400, 300))

    # VITR-99 / spec P1 Foto no quadro AC 4 (WebP Exif no VP8X)
    def test_webp_vp8x_exif_orientacao_5_troca_largura_e_altura(self):
        self._assert_webp(
            imagens_exemplo.webp_vp8x(400, 300, orientacao=5), (300, 400)
        )

    def test_webp_vp8x_exif_orientacao_6_troca_largura_e_altura(self):
        self._assert_webp(
            imagens_exemplo.webp_vp8x(400, 300, orientacao=6), (300, 400)
        )

    def test_webp_vp8x_exif_orientacao_7_troca_largura_e_altura(self):
        self._assert_webp(
            imagens_exemplo.webp_vp8x(400, 300, orientacao=7), (300, 400)
        )

    def test_webp_vp8x_exif_orientacao_8_troca_largura_e_altura(self):
        self._assert_webp(
            imagens_exemplo.webp_vp8x(400, 300, orientacao=8), (300, 400)
        )

    # VITR-100 / spec P1 Foto no quadro AC 5
    def test_webp_vp8x_exif_orientacao_3_mantem_largura_e_altura(self):
        self._assert_webp(
            imagens_exemplo.webp_vp8x(400, 300, orientacao=3), (400, 300)
        )

    # design.md WebP: bloco EXIF com ou sem prefixo Exif\0\0
    def test_webp_vp8x_exif_sem_prefixo_exif_troca_com_orientacao_6(self):
        self._assert_webp(
            imagens_exemplo.webp_vp8x(
                400, 300, orientacao=6, exif_sem_prefixo=True
            ),
            (300, 400),
        )

    def _assert_webp(self, conteudo: bytes, esperado: tuple[int, int]) -> None:
        with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
            tmp.write(conteudo)
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), esperado)


class TestWebpIlegivel(unittest.TestCase):
    def test_webp_truncado_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
            tmp.write(imagens_exemplo.webp_truncado())
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)

    def test_webp_vp8x_sem_bloco_de_imagem_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
            tmp.write(imagens_exemplo.webp_vp8x_sem_imagem(400, 300))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)


class TestAvifDimensoes(unittest.TestCase):
    # VITR-98 / spec P1 Foto no quadro AC 3
    # VITR-100: irot ausente, 0 ou 2 mantém
    def test_avif_400_por_300_sem_irot_mantem_largura_e_altura(self):
        self._assert_avif(imagens_exemplo.avif(400, 300), (400, 300))

    def test_avif_irot_0_mantem_largura_e_altura(self):
        self._assert_avif(imagens_exemplo.avif(400, 300, angulo=0), (400, 300))

    def test_avif_irot_2_mantem_largura_e_altura(self):
        self._assert_avif(imagens_exemplo.avif(400, 300, angulo=2), (400, 300))

    # VITR-99: irot 1 ou 3 troca
    def test_avif_irot_1_troca_largura_e_altura(self):
        self._assert_avif(imagens_exemplo.avif(400, 300, angulo=1), (300, 400))

    def test_avif_irot_3_troca_largura_e_altura(self):
        self._assert_avif(imagens_exemplo.avif(400, 300, angulo=3), (300, 400))

    def test_avif_miniatura_antes_do_item_primario_devolve_ispe_primario(self):
        self._assert_avif(imagens_exemplo.avif_com_miniatura(400, 300), (400, 300))

    # spec: imir sozinho não troca
    def test_avif_imir_sem_irot_mantem_largura_e_altura(self):
        self._assert_avif(imagens_exemplo.avif_imir(400, 300), (400, 300))

    def test_avif_caixa_de_64_bits_devolve_tamanho(self):
        self._assert_avif(imagens_exemplo.avif_caixa_64bits(400, 300), (400, 300))

    def _assert_avif(self, conteudo: bytes, esperado: tuple[int, int]) -> None:
        with tempfile.NamedTemporaryFile(suffix=".avif", delete=False) as tmp:
            tmp.write(conteudo)
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), esperado)


class TestAvifIlegivel(unittest.TestCase):
    def test_avif_sem_ispe_no_item_primario_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".avif", delete=False) as tmp:
            tmp.write(imagens_exemplo.avif_sem_ispe_primario())
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)

    def test_avif_truncado_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".avif", delete=False) as tmp:
            tmp.write(imagens_exemplo.avif_truncado())
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)


class TestDeteccaoPorAssinatura(unittest.TestCase):
    # spec Edge Cases: .png com bytes de JPEG
    def test_arquivo_png_com_conteudo_jpeg_le_jpeg(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(imagens_exemplo.jpeg_sof(400, 300))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        self.assertEqual(ler_dimensoes(caminho), (400, 300))


class TestImagemIlegivel(unittest.TestCase):
    # spec Edge Cases / VITR-98 AC 3 (formato ilegível)
    def test_png_truncado_antes_do_ihdr_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(b"\x89PNG\r\n\x1a\n")
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)

    def test_jpeg_sem_sof_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(imagens_exemplo.jpeg_sem_sof())
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)

    def test_assinatura_desconhecida_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".bin", delete=False) as tmp:
            tmp.write(b"nao-e-imagem")
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)

    def test_largura_zero_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(imagens_exemplo.png(0, 300))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)

    def test_altura_zero_levanta_imagem_ilegivel(self):
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(imagens_exemplo.png(400, 0))
            caminho = Path(tmp.name)
        self.addCleanup(caminho.unlink, missing_ok=True)
        with self.assertRaises(ImagemIlegivel):
            ler_dimensoes(caminho)


class TestModuloImagem(unittest.TestCase):
    # design.md Imagem: só biblioteca padrão
    def test_modulo_imagem_so_importa_biblioteca_padrao(self):
        caminho = Path(importlib.import_module("gerador.imagem").__file__)
        arvore = ast.parse(caminho.read_text(encoding="utf-8"))
        modulos: set[str] = set()
        for node in ast.walk(arvore):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    modulos.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom) and node.module:
                modulos.add(node.module.split(".")[0])
        self.assertTrue(modulos <= {"struct", "pathlib", "__future__"})

