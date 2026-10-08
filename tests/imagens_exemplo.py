"""Cabeçalhos mínimos de imagem para testes (VITR-98–VITR-100)."""

from __future__ import annotations

import struct


def png(largura: int, altura: int) -> bytes:
    assinatura = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", largura, altura, 8, 2, 0, 0, 0)
    bloco = struct.pack(">I", len(ihdr)) + b"IHDR" + ihdr + struct.pack(">I", 0)
    return assinatura + bloco


def _segmento_jpeg(marcador: int, carga: bytes) -> bytes:
    return bytes([0xFF, marcador]) + struct.pack(">H", len(carga) + 2) + carga


def _tif_orientacao(endian: str, orientacao: int) -> bytes:
    if endian == "II":
        pack16 = lambda v: struct.pack("<H", v)
        pack32 = lambda v: struct.pack("<I", v)
        assinatura = b"II"
    else:
        pack16 = lambda v: struct.pack(">H", v)
        pack32 = lambda v: struct.pack(">I", v)
        assinatura = b"MM"
    corpo = assinatura + pack16(42) + pack32(8)
    ifd = pack16(1)
    entrada = pack16(0x0112) + pack16(3) + pack32(1) + pack16(orientacao) + pack16(0)
    ifd += entrada + pack32(0)
    return corpo + ifd


def _app1_exif(tiff: bytes) -> bytes:
    prefixo = b"Exif\x00\x00"
    return _segmento_jpeg(0xE1, prefixo + tiff)


def jpeg_sof(
    largura: int,
    altura: int,
    *,
    orientacao: int | None = None,
    exif_malformado: bool = False,
) -> bytes:
    sof = struct.pack(">BHHB", 8, altura, largura, 1) + bytes([0x11, 0x00])
    partes = [b"\xFF\xD8", _segmento_jpeg(0xE0, b"\x00" * 4)]
    if orientacao is not None:
        tiff = _tif_orientacao("II", orientacao)
        if exif_malformado:
            tiff = tiff[:10]
        partes.append(_app1_exif(tiff))
    partes.append(_segmento_jpeg(0xC0, sof))
    partes.append(b"\xFF\xD9")
    return b"".join(partes)


def jpeg_sem_sof() -> bytes:
    return b"\xFF\xD8" + _segmento_jpeg(0xE0, b"\x00" * 4) + b"\xFF\xD9"
