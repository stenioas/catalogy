from __future__ import annotations

import html
from pathlib import Path
from urllib.parse import quote

from gerador.modelo import Item, Vendedor


def formatar_preco(valor: float) -> str:
    br = f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {br} no Pix"


def formatar_parcelamento(vezes: int) -> str:
    return f"em até {vezes}x com acréscimo"


def link_whatsapp(digitos: str, nome_modelo: str) -> str:
    texto = f"Olá, tenho interesse no {nome_modelo}"
    return f"https://wa.me/{digitos}?text={quote(texto)}"


def escrever(vendedores: list[Vendedor], destino: Path, fontes: Path) -> None:
    destino.mkdir(parents=True, exist_ok=True)
    (destino / "index.html").write_text(
        _html_raiz(vendedores),
        encoding="utf-8",
    )
    for vendedor in vendedores:
        pasta_vendedor = destino / vendedor.pasta
        pasta_vendedor.mkdir(parents=True, exist_ok=True)
        (pasta_vendedor / "index.html").write_text(
            _html_vitrine(vendedor),
            encoding="utf-8",
        )


def _html_raiz(vendedores: list[Vendedor]) -> str:
    itens_lista = "".join(
        f'<li><a href="{html.escape(vendedor.pasta)}/">'
        f"{html.escape(vendedor.nome)}</a></li>"
        for vendedor in vendedores
    )
    corpo = f'<ul class="lista-vendedores">{itens_lista}</ul>'
    return _pagina(TITULO_RAIZ, corpo, link_catalogo="./", segunda_barra=None)


def _html_vitrine(vendedor: Vendedor) -> str:
    if vendedor.itens:
        cards = "".join(_card(item) for item in vendedor.itens)
        corpo = (
            f'<p class="nome-vendedor">{html.escape(vendedor.nome)}</p>'
            f'<a class="voltar" href="../">{_ROTULO_VOLTAR}</a>'
            f'<div class="grade-vitrine">{cards}</div>'
        )
    else:
        corpo = (
            f'<p class="nome-vendedor">{html.escape(vendedor.nome)}</p>'
            f'<a class="voltar" href="../">{_ROTULO_VOLTAR}</a>'
            f'<p class="vitrine-vazia">{_MENSAGEM_VITRINE_VAZIA}</p>'
        )
    return _pagina(
        vendedor.nome,
        corpo,
        link_catalogo="../",
        segunda_barra=vendedor.nome,
    )


def _card(item: Item) -> str:
    imagem = html.escape(item.imagens[0])
    preco = html.escape(formatar_preco(item.valor_pix))
    nome = html.escape(item.nome)
    href = html.escape(item.id) + "/"
    return (
        f'<a class="card" href="{href}">'
        f'<img src="imagens/{imagem}" alt="{nome}">'
        f"<span class=\"nome\">{nome}</span>"
        f'<span class="preco">{preco}</span>'
        f"</a>"
    )


def _pagina(
    titulo: str,
    corpo: str,
    link_catalogo: str,
    segunda_barra: str | None,
) -> str:
    barra_vendedor = ""
    if segunda_barra is not None:
        barra_vendedor = (
            f'<div class="barra-vendedor">{html.escape(segunda_barra)}</div>'
        )
    return (
        "<!DOCTYPE html>\n"
        '<html lang="pt-BR">\n'
        "<head>\n"
        f"<meta charset=\"utf-8\">\n"
        f"<title>{html.escape(titulo)}</title>\n"
        "</head>\n"
        "<body>\n"
        f'<header class="barra-negra">'
        f'<a href="{html.escape(link_catalogo)}">{_ROTULO_CATALOGO}</a>'
        f"</header>\n"
        f"{barra_vendedor}\n"
        f"<main>{corpo}</main>\n"
        f"<footer>{html.escape(_RODAPE)}</footer>\n"
        "</body>\n"
        "</html>\n"
    )


TITULO_RAIZ = "Catálogo de relógios"
_MENSAGEM_VITRINE_VAZIA = "Esta vitrine ainda não tem relógios."
_RODAPE = "Catálogo de relógios"
_ROTULO_CATALOGO = "Catálogo"
_ROTULO_VOLTAR = "Voltar"
