import re
from pathlib import Path

import yaml

from gerador.modelo import ORDEM_FICHA, FichaLinha, Item, Vendedor

_PASTA_ID = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
_WHATSAPP = re.compile(r"^[0-9]{12,15}$")
_PARCELAMENTO = re.compile(r"^[0-9]+$")
_VALOR_PIX = re.compile(r"^[0-9]+(\.[0-9]+)?$")
_TAG_STR = "tag:yaml.org,2002:str"

REGRA_PASTA = "pasta não casa ^[a-z0-9]+(-[a-z0-9]+)*$"
REGRA_ID = "id não casa ^[a-z0-9]+(-[a-z0-9]+)*$"
REGRA_NOME_VENDEDOR = "nome do vendedor ausente"
REGRA_WHATSAPP_AUSENTE = "whatsapp ausente"
REGRA_ID_AUSENTE = "id ausente"
REGRA_NOME_ITEM = "nome do item ausente"
REGRA_VALOR_AUSENTE = "valorPix ausente"
REGRA_PARCELAMENTO_AUSENTE = "parcelamento ausente"
REGRA_IMAGENS_AUSENTES = "imagens ausente"
REGRA_FICHA_AUSENTE = "ficha ausente"
REGRA_WHATSAPP = "whatsapp não é 12 a 15 dígitos"
REGRA_VALOR = "valorPix não é número maior que zero"
REGRA_PARCELAMENTO = "parcelamento não é inteiro YAML maior ou igual a 1"
REGRA_IMAGEM_AUSENTE = "item sem imagem"
REGRA_IMAGEM_BARRA = "imagem com barra"
REGRA_ARQUIVO_AUSENTE = "arquivo de imagem ausente"
REGRA_EXTENSAO = "extensão fora de png, jpg, jpeg, webp e avif"
REGRA_FICHA_VAZIA = "ficha vazia"
REGRA_FICHA_CAMPOS = "ficha sem detalhe ou especificacao"
REGRA_FICHA_BRANCO = "valor de ficha em branco"
REGRA_ROTULO_REPETIDO = "rótulo de ficha repetido"
REGRA_ID_REPETIDO = "id repetido no vendedor"
REGRA_CHAVE = "chave desconhecida"
REGRA_ROTULO = "rótulo de ficha fora da lista"

_EXTENSOES = {".png", ".jpg", ".jpeg", ".webp", ".avif"}
_CHAVES_VENDEDOR = {"nome", "whatsapp", "itens"}
_CHAVES_ITEM = {"id", "nome", "valorPix", "parcelamento", "observacoes", "imagens", "ficha"}
_CHAVES_FICHA = {"detalhe", "especificacao"}
_ROTULOS = set(ORDEM_FICHA)


class CatalogoErro(Exception):
    def __init__(self, pasta: str, regra: str) -> None:
        self.pasta = pasta
        self.regra = regra
        super().__init__(f"{pasta}: {regra}")


def carregar(raiz: Path) -> list[Vendedor]:
    base = Path(raiz) / "vendedores"
    if not base.is_dir():
        return []
    vendedores = [
        _vendedor(pasta)
        for pasta in base.iterdir()
        if pasta.is_dir()
    ]
    vendedores.sort(key=lambda vendedor: (vendedor.nome.casefold(), vendedor.pasta))
    return vendedores


def _vendedor(pasta_dir: Path) -> Vendedor:
    pasta = pasta_dir.name
    if _PASTA_ID.fullmatch(pasta) is None:
        raise CatalogoErro(pasta, REGRA_PASTA)
    caminho = pasta_dir / "vendedor.yaml"
    if not caminho.is_file():
        raise CatalogoErro(pasta, "vendedor.yaml ausente")
    try:
        nodo = yaml.compose(caminho.read_text(encoding="utf-8"))
    except yaml.YAMLError as erro:
        raise CatalogoErro(pasta, "YAML inválido") from erro
    mapa = _mapa(nodo, pasta)
    _chaves(mapa, _CHAVES_VENDEDOR, pasta)
    nome = _nome(mapa, "nome", pasta, REGRA_NOME_VENDEDOR)
    if "whatsapp" not in mapa:
        raise CatalogoErro(pasta, REGRA_WHATSAPP_AUSENTE)
    whatsapp = _whatsapp(mapa["whatsapp"], pasta)
    itens = _itens(mapa["itens"], pasta, pasta_dir) if "itens" in mapa else []
    return Vendedor(pasta=pasta, nome=nome, whatsapp=whatsapp, itens=itens)


def _item(mapa: dict, pasta: str, pasta_dir: Path) -> Item:
    _chaves(mapa, _CHAVES_ITEM, pasta)
    if "id" not in mapa:
        raise CatalogoErro(pasta, REGRA_ID_AUSENTE)
    id_nodo = mapa["id"]
    if not isinstance(id_nodo, yaml.ScalarNode) or _PASTA_ID.fullmatch(id_nodo.value) is None:
        raise CatalogoErro(pasta, REGRA_ID)
    if "valorPix" not in mapa:
        raise CatalogoErro(pasta, REGRA_VALOR_AUSENTE)
    if "parcelamento" not in mapa:
        raise CatalogoErro(pasta, REGRA_PARCELAMENTO_AUSENTE)
    if "imagens" not in mapa:
        raise CatalogoErro(pasta, REGRA_IMAGENS_AUSENTES)
    if "ficha" not in mapa:
        raise CatalogoErro(pasta, REGRA_FICHA_AUSENTE)
    return Item(
        id=id_nodo.value,
        nome=_nome(mapa, "nome", pasta, REGRA_NOME_ITEM),
        valor_pix=_valor_pix(mapa["valorPix"], pasta),
        parcelamento=_parcelamento(mapa["parcelamento"], pasta),
        observacoes=_observacoes(mapa),
        imagens=_imagens(mapa["imagens"], pasta, pasta_dir),
        ficha=_ficha(mapa["ficha"], pasta),
    )


def _nome(mapa: dict, chave: str, pasta: str, regra: str) -> str:
    if chave not in mapa:
        raise CatalogoErro(pasta, regra)
    nodo = mapa[chave]
    if not isinstance(nodo, yaml.ScalarNode) or nodo.tag != _TAG_STR or nodo.value.strip() == "":
        raise CatalogoErro(pasta, regra)
    return nodo.value


def _whatsapp(nodo: yaml.Node, pasta: str) -> str:
    if not isinstance(nodo, yaml.ScalarNode) or _WHATSAPP.fullmatch(nodo.value) is None:
        raise CatalogoErro(pasta, REGRA_WHATSAPP)
    return nodo.value


def _valor_pix(nodo: yaml.Node, pasta: str) -> float:
    if not isinstance(nodo, yaml.ScalarNode) or _VALOR_PIX.fullmatch(nodo.value) is None:
        raise CatalogoErro(pasta, REGRA_VALOR)
    numero = float(nodo.value)
    if numero <= 0:
        raise CatalogoErro(pasta, REGRA_VALOR)
    return numero


def _parcelamento(nodo: yaml.Node, pasta: str) -> int:
    if not isinstance(nodo, yaml.ScalarNode) or _PARCELAMENTO.fullmatch(nodo.value) is None:
        raise CatalogoErro(pasta, REGRA_PARCELAMENTO)
    vezes = int(nodo.value)
    if vezes < 1:
        raise CatalogoErro(pasta, REGRA_PARCELAMENTO)
    return vezes


def _observacoes(mapa: dict) -> str | None:
    if "observacoes" not in mapa:
        return None
    nodo = mapa["observacoes"]
    if not isinstance(nodo, yaml.ScalarNode) or nodo.tag != _TAG_STR or nodo.value.strip() == "":
        return None
    return nodo.value


def _imagens(nodo: yaml.Node, pasta: str, pasta_dir: Path) -> list[str]:
    if not isinstance(nodo, yaml.SequenceNode):
        raise CatalogoErro(pasta, REGRA_IMAGENS_AUSENTES)
    nomes = []
    for item in nodo.value:
        if not isinstance(item, yaml.ScalarNode):
            raise CatalogoErro(pasta, REGRA_IMAGENS_AUSENTES)
        nomes.append(item.value)
    if not nomes:
        raise CatalogoErro(pasta, REGRA_IMAGEM_AUSENTE)
    for nome in nomes:
        if "/" in nome:
            raise CatalogoErro(pasta, REGRA_IMAGEM_BARRA)
        if Path(nome).suffix.casefold() not in _EXTENSOES:
            raise CatalogoErro(pasta, REGRA_EXTENSAO)
        if not (pasta_dir / nome).is_file():
            raise CatalogoErro(pasta, REGRA_ARQUIVO_AUSENTE)
    return nomes


def _ficha(nodo: yaml.Node, pasta: str) -> list[FichaLinha]:
    if not isinstance(nodo, yaml.SequenceNode):
        raise CatalogoErro(pasta, REGRA_FICHA_AUSENTE)
    if not nodo.value:
        raise CatalogoErro(pasta, REGRA_FICHA_VAZIA)
    linhas = []
    vistos = set()
    for item in nodo.value:
        if not isinstance(item, yaml.MappingNode):
            raise CatalogoErro(pasta, REGRA_FICHA_CAMPOS)
        mapa = _mapa(item, pasta)
        _chaves(mapa, _CHAVES_FICHA, pasta)
        if "detalhe" not in mapa or "especificacao" not in mapa:
            raise CatalogoErro(pasta, REGRA_FICHA_CAMPOS)
        detalhe = _texto_ficha(mapa["detalhe"], pasta)
        especificacao = _texto_ficha(mapa["especificacao"], pasta)
        if detalhe not in _ROTULOS:
            raise CatalogoErro(pasta, REGRA_ROTULO)
        if detalhe in vistos:
            raise CatalogoErro(pasta, REGRA_ROTULO_REPETIDO)
        vistos.add(detalhe)
        linhas.append(FichaLinha(detalhe=detalhe, especificacao=especificacao))
    return linhas


def _texto_ficha(nodo: yaml.Node, pasta: str) -> str:
    if not isinstance(nodo, yaml.ScalarNode):
        raise CatalogoErro(pasta, REGRA_FICHA_CAMPOS)
    if nodo.value.strip() == "":
        raise CatalogoErro(pasta, REGRA_FICHA_BRANCO)
    return nodo.value


def _itens(nodo: yaml.Node, pasta: str, pasta_dir: Path) -> list[Item]:
    if not isinstance(nodo, yaml.SequenceNode):
        raise CatalogoErro(pasta, "itens inválidos")
    itens = []
    vistos = set()
    for item in nodo.value:
        montado = _item(_mapa(item, pasta), pasta, pasta_dir)
        if montado.id in vistos:
            raise CatalogoErro(pasta, REGRA_ID_REPETIDO)
        vistos.add(montado.id)
        itens.append(montado)
    return itens


def _chaves(mapa: dict, permitidas: set[str], pasta: str) -> None:
    for chave in mapa:
        if chave not in permitidas:
            raise CatalogoErro(pasta, REGRA_CHAVE)


def _mapa(nodo: yaml.Node, pasta: str) -> dict:
    if not isinstance(nodo, yaml.MappingNode):
        raise CatalogoErro(pasta, "YAML inválido")
    mapa = {}
    for chave, valor in nodo.value:
        if not isinstance(chave, yaml.ScalarNode):
            raise CatalogoErro(pasta, "YAML inválido")
        mapa[chave.value] = valor
    return mapa
