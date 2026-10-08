from dataclasses import dataclass

ORDEM_FICHA: tuple[str, ...] = (
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


@dataclass
class FichaLinha:
    detalhe: str
    especificacao: str


@dataclass
class Imagem:
    arquivo: str
    largura: int
    altura: int


@dataclass
class Item:
    id: str
    nome: str
    valor_pix: float
    parcelamento: int
    observacoes: str | None
    imagens: list[Imagem]
    ficha: list[FichaLinha]


@dataclass
class Vendedor:
    pasta: str
    nome: str
    whatsapp: str
    itens: list[Item]
