from urllib.parse import quote


def formatar_preco(valor: float) -> str:
    br = f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {br} no Pix"


def formatar_parcelamento(vezes: int) -> str:
    return f"em até {vezes}x com acréscimo"


def link_whatsapp(digitos: str, nome_modelo: str) -> str:
    texto = f"Olá, tenho interesse no {nome_modelo}"
    return f"https://wa.me/{digitos}?text={quote(texto)}"
