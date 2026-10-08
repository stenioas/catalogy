import re
from pathlib import Path

import yaml

from gerador.modelo import FichaLinha, Item, Vendedor

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


class CatalogoErro(Exception):
    def __init__(self, pasta: str, regra: str) -> None:
        self.pasta = pasta
        self.regra = regra
        super().__init__(f"{pasta}: {regra}")


def carregar(raiz: Path) -> list[Vendedor]:
    base = Path(raiz) / "vendedores"
    if not base.is_dir():
        return []
    return [
        _vendedor(pasta)
        for pasta in base.iterdir()
        if pasta.is_dir()
    ]


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
    nome = _nome(mapa, "nome", pasta, REGRA_NOME_VENDEDOR)
    if "whatsapp" not in mapa:
        raise CatalogoErro(pasta, REGRA_WHATSAPP_AUSENTE)
    whatsapp = _whatsapp(mapa["whatsapp"], pasta)
    itens = _itens(mapa["itens"], pasta) if "itens" in mapa else []
    return Vendedor(pasta=pasta, nome=nome, whatsapp=whatsapp, itens=itens)


def _item(mapa: dict, pasta: str) -> Item:
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
        imagens=_imagens(mapa["imagens"], pasta),
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


def _imagens(nodo: yaml.Node, pasta: str) -> list[str]:
    if not isinstance(nodo, yaml.SequenceNode):
        raise CatalogoErro(pasta, REGRA_IMAGENS_AUSENTES)
    nomes = []
    for item in nodo.value:
        if not isinstance(item, yaml.ScalarNode):
            raise CatalogoErro(pasta, REGRA_IMAGENS_AUSENTES)
        nomes.append(item.value)
    return nomes


def _ficha(nodo: yaml.Node, pasta: str) -> list[FichaLinha]:
    if not isinstance(nodo, yaml.SequenceNode):
        raise CatalogoErro(pasta, REGRA_FICHA_AUSENTE)
    linhas = []
    for item in nodo.value:
        mapa = _mapa(item, pasta)
        detalhe = mapa.get("detalhe")
        especificacao = mapa.get("especificacao")
        if not isinstance(detalhe, yaml.ScalarNode) or not isinstance(especificacao, yaml.ScalarNode):
            raise CatalogoErro(pasta, REGRA_FICHA_AUSENTE)
        linhas.append(FichaLinha(detalhe=detalhe.value, especificacao=especificacao.value))
    return linhas


def _itens(nodo: yaml.Node, pasta: str) -> list[Item]:
    if not isinstance(nodo, yaml.SequenceNode):
        raise CatalogoErro(pasta, "itens inválidos")
    return [_item(_mapa(item, pasta), pasta) for item in nodo.value]


def _mapa(nodo: yaml.Node, pasta: str) -> dict:
    if not isinstance(nodo, yaml.MappingNode):
        raise CatalogoErro(pasta, "YAML inválido")
    mapa = {}
    for chave, valor in nodo.value:
        if not isinstance(chave, yaml.ScalarNode):
            raise CatalogoErro(pasta, "YAML inválido")
        mapa[chave.value] = valor
    return mapa
