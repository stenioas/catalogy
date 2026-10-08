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


def _chunk_webp(fourcc: str, dados: bytes) -> bytes:
    pad = b"\x00" if len(dados) % 2 else b""
    return fourcc.encode("ascii") + struct.pack("<I", len(dados)) + dados + pad


def _riff_webp(conteudo: bytes) -> bytes:
    corpo = b"WEBP" + conteudo
    return b"RIFF" + struct.pack("<I", len(corpo)) + corpo


def _vp8_payload(largura: int, altura: int) -> bytes:
    return (
        b"\x00\x00\x00"
        + b"\x9d\x01\x2a"
        + struct.pack("<HH", largura & 0x3FFF, altura & 0x3FFF)
        + b"\x00"
    )


def _vp8l_payload(largura: int, altura: int) -> bytes:
    bits = ((altura - 1) << 14) | (largura - 1)
    return bytes([0x2F]) + struct.pack("<I", bits)


def _vp8x_cabecalho(largura: int, altura: int, *, flags: int = 0) -> bytes:
    return (
        bytes([flags, 0, 0, 0])
        + struct.pack("<I", largura - 1)[:3]
        + struct.pack("<I", altura - 1)[:3]
    )


def _exif_orientacao(orientacao: int, *, com_prefixo: bool = True) -> bytes:
    tiff = _tif_orientacao("II", orientacao)
    if com_prefixo:
        return b"Exif\x00\x00" + tiff
    return tiff


def webp_vp8(largura: int, altura: int) -> bytes:
    return _riff_webp(_chunk_webp("VP8 ", _vp8_payload(largura, altura)))


def webp_vp8l(largura: int, altura: int) -> bytes:
    return _riff_webp(_chunk_webp("VP8L", _vp8l_payload(largura, altura)))


def webp_vp8x(
    largura: int,
    altura: int,
    *,
    orientacao: int | None = None,
    exif_sem_prefixo: bool = False,
    com_imagem: bool = True,
) -> bytes:
    flags = 0x08 if orientacao is not None else 0
    partes = [_chunk_webp("VP8X", _vp8x_cabecalho(largura, altura, flags=flags))]
    if orientacao is not None:
        partes.append(
            _chunk_webp(
                "EXIF",
                _exif_orientacao(
                    orientacao, com_prefixo=not exif_sem_prefixo
                ),
            )
        )
    if com_imagem:
        partes.append(_chunk_webp("VP8L", _vp8l_payload(largura, altura)))
    return _riff_webp(b"".join(partes))


def webp_truncado() -> bytes:
    return webp_vp8(400, 300)[:20]


def webp_vp8x_sem_imagem(largura: int, altura: int) -> bytes:
    return webp_vp8x(largura, altura, com_imagem=False)
