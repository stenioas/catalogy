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
    if len(dados) >= 12 and dados[0:4] == b"RIFF" and dados[8:12] == b"WEBP":
        return _ler_webp(dados)
    if _marca_avif(dados):
        return _ler_avif(dados)
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


def _ler_webp(dados: bytes) -> tuple[int, int]:
    pos = 12
    largura: int | None = None
    altura: int | None = None
    orientacao: int | None = None
    tem_vp8 = False
    tem_vp8l = False
    tem_vp8x = False
    while pos + 8 <= len(dados):
        fourcc = dados[pos : pos + 4]
        tamanho = struct.unpack("<I", dados[pos + 4 : pos + 8])[0]
        inicio = pos + 8
        fim = inicio + tamanho
        if fim > len(dados):
            raise ImagemIlegivel
        bloco = dados[inicio:fim]
        if fourcc == b"VP8 ":
            tem_vp8 = True
            if len(bloco) < 10 or bloco[3:6] != b"\x9d\x01\x2a":
                raise ImagemIlegivel
            w, h = struct.unpack("<HH", bloco[6:10])
            largura, altura = w & 0x3FFF, h & 0x3FFF
        elif fourcc == b"VP8L":
            tem_vp8l = True
            if len(bloco) < 5 or bloco[0] != 0x2F:
                raise ImagemIlegivel
            bits = struct.unpack("<I", bloco[1:5])[0]
            largura = (bits & 0x3FFF) + 1
            altura = ((bits >> 14) & 0x3FFF) + 1
        elif fourcc == b"VP8X":
            tem_vp8x = True
            if len(bloco) < 10:
                raise ImagemIlegivel
            largura = (
                bloco[4] | (bloco[5] << 8) | (bloco[6] << 16)
            ) + 1
            altura = (
                bloco[7] | (bloco[8] << 8) | (bloco[9] << 16)
            ) + 1
        elif fourcc == b"EXIF":
            tiff = bloco
            if tiff.startswith(b"Exif\x00\x00"):
                tiff = tiff[6:]
            orientacao = _ler_orientacao_exif(tiff)
        pos = fim + (tamanho & 1)
    if tem_vp8x and not (tem_vp8 or tem_vp8l):
        raise ImagemIlegivel
    if not (tem_vp8 or tem_vp8l or tem_vp8x):
        raise ImagemIlegivel
    if largura is None or altura is None:
        raise ImagemIlegivel
    if orientacao in (5, 6, 7, 8):
        largura, altura = altura, largura
    return _validar(largura, altura)


def _marca_avif(dados: bytes) -> bool:
    if len(dados) < 12 or dados[4:8] != b"ftyp":
        return False
    declarado = struct.unpack_from(">I", dados, 0)[0]
    if declarado == 1:
        if len(dados) < 16:
            return False
        tamanho = struct.unpack_from(">Q", dados, 8)[0]
        cabeca = 16
    elif declarado == 0:
        tamanho = len(dados)
        cabeca = 8
    else:
        tamanho = declarado
        cabeca = 8
    if tamanho < cabeca + 8:
        return False
    marcas = dados[cabeca : min(tamanho, len(dados))]
    if len(marcas) < 4:
        return False
    encontradas = [marcas[0:4]]
    pos = 8
    while pos + 4 <= len(marcas):
        encontradas.append(marcas[pos : pos + 4])
        pos += 4
    return any(marca in (b"avif", b"avis") for marca in encontradas)


def _iter_caixas(dados: bytes, inicio: int, fim: int):
    pos = inicio
    while pos + 8 <= fim:
        tipo = dados[pos + 4 : pos + 8]
        declarado = struct.unpack_from(">I", dados, pos)[0]
        if declarado == 1:
            if pos + 16 > fim:
                raise ImagemIlegivel
            tamanho = struct.unpack_from(">Q", dados, pos + 8)[0]
            cabeca = 16
        elif declarado == 0:
            tamanho = fim - pos
            cabeca = 8
        else:
            tamanho = declarado
            cabeca = 8
        if tamanho < cabeca or pos + tamanho > fim:
            raise ImagemIlegivel
        yield tipo, pos + cabeca, pos + tamanho
        pos += tamanho
    if pos < fim:
        raise ImagemIlegivel


def _ler_avif(dados: bytes) -> tuple[int, int]:
    meta = None
    for tipo, inicio, fim in _iter_caixas(dados, 0, len(dados)):
        if tipo == b"meta":
            meta = dados[inicio:fim]
            break
    if meta is None or len(meta) < 4:
        raise ImagemIlegivel
    item_id = None
    iprp = None
    for tipo, inicio, fim in _iter_caixas(meta, 4, len(meta)):
        if tipo == b"pitm":
            item_id = _ler_pitm(meta[inicio:fim])
        elif tipo == b"iprp":
            iprp = meta[inicio:fim]
    if item_id is None or iprp is None:
        raise ImagemIlegivel
    propriedades: list[tuple[bytes, bytes]] = []
    indices: list[int] = []
    for tipo, inicio, fim in _iter_caixas(iprp, 0, len(iprp)):
        if tipo == b"ipco":
            propriedades = [
                (filho, iprp[ini:end])
                for filho, ini, end in _iter_caixas(iprp, inicio, fim)
            ]
        elif tipo == b"ipma":
            indices = _ler_ipma(iprp[inicio:fim]).get(item_id, [])
    largura = None
    altura = None
    angulo = None
    for indice in indices:
        if indice < 1 or indice > len(propriedades):
            raise ImagemIlegivel
        tipo, carga = propriedades[indice - 1]
        if tipo == b"ispe":
            if len(carga) < 12:
                raise ImagemIlegivel
            largura, altura = struct.unpack(">II", carga[4:12])
        elif tipo == b"irot":
            if not carga:
                raise ImagemIlegivel
            angulo = carga[0] & 3
    if largura is None or altura is None:
        raise ImagemIlegivel
    if angulo in (1, 3):
        largura, altura = altura, largura
    return _validar(largura, altura)


def _ler_pitm(carga: bytes) -> int:
    if len(carga) < 6:
        raise ImagemIlegivel
    if carga[0] == 0:
        return struct.unpack(">H", carga[4:6])[0]
    if len(carga) < 8:
        raise ImagemIlegivel
    return struct.unpack(">I", carga[4:8])[0]


def _ler_ipma(carga: bytes) -> dict[int, list[int]]:
    if len(carga) < 8:
        raise ImagemIlegivel
    version = carga[0]
    flags = int.from_bytes(carga[1:4], "big")
    entrada = struct.unpack(">I", carga[4:8])[0]
    largo = bool(flags & 1)
    pos = 8
    associacoes: dict[int, list[int]] = {}
    for _ in range(entrada):
        if version == 0:
            if pos + 3 > len(carga):
                raise ImagemIlegivel
            item_id = struct.unpack(">H", carga[pos : pos + 2])[0]
            pos += 2
        else:
            if pos + 5 > len(carga):
                raise ImagemIlegivel
            item_id = struct.unpack(">I", carga[pos : pos + 4])[0]
            pos += 4
        quantidade = carga[pos]
        pos += 1
        encontrados: list[int] = []
        for _ in range(quantidade):
            if largo:
                if pos + 2 > len(carga):
                    raise ImagemIlegivel
                valor = struct.unpack(">H", carga[pos : pos + 2])[0]
                pos += 2
                encontrados.append(valor & 0x7FFF)
            else:
                if pos >= len(carga):
                    raise ImagemIlegivel
                encontrados.append(carga[pos] & 0x7F)
                pos += 1
        associacoes.setdefault(item_id, []).extend(encontrados)
    return associacoes
