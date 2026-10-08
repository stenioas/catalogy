from __future__ import annotations

import struct
from pathlib import Path


class ImagemIlegivel(Exception):
    pass


def ler_dimensoes(caminho: Path) -> tuple[int, int]:
    dados = caminho.read_bytes()
    if dados.startswith(b"\x89PNG\r\n\x1a\n"):
        return _ler_png(dados)
    if dados.startswith(b"\xff\xd8"):
        return _ler_jpeg(dados)
    raise ImagemIlegivel


def _validar(largura: int, altura: int) -> tuple[int, int]:
    if largura <= 0 or altura <= 0:
        raise ImagemIlegivel
    return largura, altura


def _ler_png(dados: bytes) -> tuple[int, int]:
    if len(dados) < 24:
        raise ImagemIlegivel
    if dados[12:16] != b"IHDR":
        raise ImagemIlegivel
    largura, altura = struct.unpack(">II", dados[16:24])
    return _validar(largura, altura)


def _ler_jpeg(dados: bytes) -> tuple[int, int]:
    orientacao: int | None = None
    largura: int | None = None
    altura: int | None = None
    i = 2
    while i + 1 < len(dados):
        if dados[i] != 0xFF:
            raise ImagemIlegivel
        marcador = dados[i + 1]
        i += 2
        if marcador in (0xD8, 0xD9) or marcador == 0x01 or 0xD0 <= marcador <= 0xD7:
            continue
        if i + 2 > len(dados):
            raise ImagemIlegivel
        tamanho = struct.unpack(">H", dados[i : i + 2])[0]
        if tamanho < 2:
            raise ImagemIlegivel
        inicio = i + 2
        fim = inicio + tamanho - 2
        if fim > len(dados):
            raise ImagemIlegivel
        segmento = dados[inicio:fim]
        if marcador == 0xE1 and segmento.startswith(b"Exif\x00\x00"):
            orientacao = _ler_orientacao_exif(segmento[6:])
        elif marcador in _SOF_MARCADORES and largura is None:
            if len(segmento) < 5:
                raise ImagemIlegivel
            altura, largura = struct.unpack(">HH", segmento[1:5])
        i = fim
    if largura is None or altura is None:
        raise ImagemIlegivel
    if orientacao in (5, 6, 7, 8):
        largura, altura = altura, largura
    return _validar(largura, altura)


_SOF_MARCADORES = frozenset(
    {
        0xC0,
        0xC1,
        0xC2,
        0xC3,
        0xC5,
        0xC6,
        0xC7,
        0xC9,
        0xCA,
        0xCB,
        0xCD,
        0xCE,
        0xCF,
    }
)


def _ler_orientacao_exif(tiff: bytes) -> int | None:
    try:
        if len(tiff) < 8:
            return None
        if tiff[:2] == b"II":
            pack16 = lambda o: struct.unpack_from("<H", tiff, o)[0]
            pack32 = lambda o: struct.unpack_from("<I", tiff, o)[0]
        elif tiff[:2] == b"MM":
            pack16 = lambda o: struct.unpack_from(">H", tiff, o)[0]
            pack32 = lambda o: struct.unpack_from(">I", tiff, o)[0]
        else:
            return None
        if pack16(2) != 42:
            return None
        ifd = pack32(4)
        if ifd + 2 > len(tiff):
            return None
        entradas = pack16(ifd)
        pos = ifd + 2
        for _ in range(entradas):
            if pos + 12 > len(tiff):
                return None
            tag = pack16(pos)
            tipo = pack16(pos + 2)
            count = pack32(pos + 4)
            if tag == 0x0112 and tipo == 3 and count >= 1:
                if count == 1:
                    return pack16(pos + 8)
                offset = pack32(pos + 8)
                if offset + 2 > len(tiff):
                    return None
                return pack16(offset)
            pos += 12
    except struct.error:
        return None
    return None
