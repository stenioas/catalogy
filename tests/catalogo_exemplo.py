from gerador.modelo import FichaLinha, Item, Vendedor


def _item(
    id_: str,
    nome: str,
    valor_pix: float,
    imagem: str,
    observacoes: str | None = None,
) -> Item:
    return Item(
        id=id_,
        nome=nome,
        valor_pix=valor_pix,
        parcelamento=12,
        observacoes=observacoes,
        imagens=[imagem],
        ficha=[FichaLinha("Estado", "Novo")],
    )


def vendedor_sem_itens(pasta: str = "ana", nome: str = "Ana") -> Vendedor:
    return Vendedor(
        pasta=pasta,
        nome=nome,
        whatsapp="5511999999999",
        itens=[],
    )


def vendedor_com_dois_relogios() -> Vendedor:
    return Vendedor(
        pasta="bruno",
        nome="bruno",
        whatsapp="5511888888888",
        itens=[
            _item("relogio-primeiro", "Relógio Primeiro", 369.9, "primeiro.png"),
            _item(
                "relogio-segundo",
                "Relógio Segundo",
                1234.5,
                "segundo.png",
                observacoes="nota de exemplo",
            ),
        ],
    )


def catalogo_dois_vendedores() -> list[Vendedor]:
    return [vendedor_sem_itens(), vendedor_com_dois_relogios()]
