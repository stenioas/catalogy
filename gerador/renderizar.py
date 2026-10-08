from __future__ import annotations

import html
import re
import shutil
from pathlib import Path
from urllib.parse import quote

from gerador.modelo import ORDEM_FICHA, Item, Vendedor

_DIRETORIO_GERADOR = Path(__file__).resolve().parent
_TEXTO_TEMA = (_DIRETORIO_GERADOR / "tema.js").read_text(encoding="utf-8")
_TEXTO_CARROSSEL = (_DIRETORIO_GERADOR / "carrossel.js").read_text(encoding="utf-8")


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
    shutil.copy2(_DIRETORIO_GERADOR / "estilos.css", destino / "estilos.css")
    pasta_fontes = destino / "fontes"
    pasta_fontes.mkdir(parents=True, exist_ok=True)
    shutil.copy2(fontes / "InterVariable.woff2", pasta_fontes / "InterVariable.woff2")
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
        for item in vendedor.itens:
            pasta_item = pasta_vendedor / item.id
            pasta_item.mkdir(parents=True, exist_ok=True)
            (pasta_item / "index.html").write_text(
                _html_relogio(vendedor, item),
                encoding="utf-8",
            )


def _html_raiz(vendedores: list[Vendedor]) -> str:
    itens_lista = "".join(
        f'<li><a href="{html.escape(vendedor.pasta)}/">'
        f"{html.escape(vendedor.nome)}</a></li>"
        for vendedor in vendedores
    )
    corpo = f'<ul class="lista-vendedores">{itens_lista}</ul>'
    return _pagina(
        TITULO_RAIZ,
        corpo,
        link_catalogo="./",
        segunda_barra=None,
        css_href="estilos.css",
    )


def _html_vitrine(vendedor: Vendedor) -> str:
    if vendedor.itens:
        cards = "".join(
            _card(item, primeiro=indice == 0)
            for indice, item in enumerate(vendedor.itens)
        )
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
        css_href="../estilos.css",
    )


def _card(item: Item, *, primeiro: bool) -> str:
    foto = item.imagens[0]
    imagem = html.escape(foto.arquivo)
    preco = html.escape(formatar_preco(item.valor_pix))
    nome = html.escape(item.nome)
    href = html.escape(item.id) + "/"
    carga = '' if primeiro else ' loading="lazy"'
    return (
        f'<a class="card" href="{href}">'
        f'<img src="imagens/{imagem}" alt="{nome}" '
        f'width="{foto.largura}" height="{foto.altura}"{carga}>'
        f"<span class=\"nome\">{nome}</span>"
        f'<span class="preco">{preco}</span>'
        f"</a>"
    )


def _html_relogio(vendedor: Vendedor, item: Item) -> str:
    nome = html.escape(item.nome)
    preco = html.escape(formatar_preco(item.valor_pix))
    parcelas = html.escape(formatar_parcelamento(item.parcelamento))
    observacao = _observacao(item)
    corpo = (
        f'<a class="voltar" href="../">{_ROTULO_VOLTAR}</a>'
        f"<h1>{nome}</h1>"
        f"{_carrossel(item)}"
        f'<p class="preco">{preco}</p>'
        f'<p class="parcelamento">{parcelas}</p>'
        f"{observacao}"
        f"{_ficha(item)}"
        f"{_barra_fixa(vendedor, item, preco)}"
    )
    return _pagina(
        item.nome,
        corpo,
        link_catalogo="../../",
        segunda_barra=vendedor.nome,
        link_segunda_barra="../",
        og_title=item.nome,
        og_image=f"../imagens/{item.imagens[0].arquivo}",
        css_href="../../estilos.css",
        incluir_carrossel=len(item.imagens) >= 2,
    )


def _observacao(item: Item) -> str:
    if item.observacoes is None:
        return ""
    texto = item.observacoes.strip()
    if not texto:
        return ""
    return f'<p class="observacoes">{html.escape(texto)}</p>'


def _carrossel(item: Item) -> str:
    fotos = []
    for indice, foto in enumerate(item.imagens):
        oculto = " hidden" if indice else ""
        carga = '' if indice == 0 else ' loading="lazy"'
        fotos.append(
            f'<img src="../imagens/{html.escape(foto.arquivo)}" '
            f'alt="{html.escape(item.nome)}" '
            f'width="{foto.largura}" height="{foto.altura}"{carga}{oculto}>'
        )
    controles = ""
    if len(item.imagens) >= 2:
        bolinhas = "".join(
            '<span class="bolinha" aria-current="true"></span>'
            if indice == 0
            else '<span class="bolinha"></span>'
            for indice in range(len(item.imagens))
        )
        controles = (
            '<button type="button" class="seta seta-anterior" '
            'aria-label="Anterior"></button>'
            '<button type="button" class="seta seta-proxima" '
            'aria-label="Próximo"></button>'
            f'<div class="bolinhas">{bolinhas}</div>'
        )
    return f'<div class="carrossel">{"".join(fotos)}{controles}</div>'


def _ficha(item: Item) -> str:
    por_rotulo = {linha.detalhe: linha.especificacao for linha in item.ficha}
    linhas = [
        _linha_ficha(rotulo, por_rotulo[rotulo])
        for rotulo in ORDEM_FICHA
        if rotulo in por_rotulo
    ]
    return f'<dl class="ficha">{"".join(linhas)}</dl>'


def _linha_ficha(rotulo: str, valor: str) -> str:
    if rotulo == "Link de anúncio similar":
        texto = valor.strip()
        if _RE_ANUNCIO.fullmatch(texto):
            valor_html = (
                f'<a href="{html.escape(texto)}">{_TEXTO_ANUNCIO}</a>'
            )
        else:
            valor_html = html.escape(texto)
    else:
        valor_html = html.escape(valor)
    return (
        '<div class="ficha-linha">'
        f"<dt>{html.escape(rotulo)}</dt>"
        f"<dd>{valor_html}</dd>"
        "</div>"
    )


def _barra_fixa(vendedor: Vendedor, item: Item, preco: str) -> str:
    href = html.escape(link_whatsapp(vendedor.whatsapp, item.nome))
    return (
        '<div class="barra-fixa">'
        f'<span class="preco">{preco}</span>'
        f'<a class="pilula" href="{href}">{_ROTULO_INTERESSE}</a>'
        "</div>"
    )


def _pagina(
    titulo: str,
    corpo: str,
    link_catalogo: str,
    segunda_barra: str | None,
    link_segunda_barra: str | None = None,
    og_title: str | None = None,
    og_image: str | None = None,
    css_href: str = "estilos.css",
    incluir_carrossel: bool = False,
) -> str:
    barra_vendedor = ""
    if segunda_barra is not None:
        nome = html.escape(segunda_barra)
        if link_segunda_barra is not None:
            nome = f'<a href="{html.escape(link_segunda_barra)}">{nome}</a>'
        barra_vendedor = f'<div class="barra-vendedor">{nome}</div>'
    og = ""
    if og_title is not None and og_image is not None:
        og = (
            f'<meta property="og:title" content="{html.escape(og_title)}">\n'
            f'<meta property="og:image" content="{html.escape(og_image)}">\n'
        )
    script_tema = f"<script>\n{_TEXTO_TEMA}\n</script>\n"
    link_css = (
        f'<link rel="stylesheet" href="{html.escape(css_href)}">\n'
    )
    script_carrossel = ""
    if incluir_carrossel:
        script_carrossel = f"<script>\n{_TEXTO_CARROSSEL}\n</script>\n"
    return (
        "<!DOCTYPE html>\n"
        '<html lang="pt-BR">\n'
        "<head>\n"
        f"{script_tema}"
        f"<meta charset=\"utf-8\">\n"
        f'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{html.escape(titulo)}</title>\n"
        f"{og}"
        f"{link_css}"
        "</head>\n"
        "<body>\n"
        f'<a class="pular" href="#conteudo">Pular para o conteúdo</a>\n'
        f'<header class="barra-negra">'
        f'<a href="{html.escape(link_catalogo)}">{_ROTULO_CATALOGO}</a>'
        f"</header>\n"
        f"{barra_vendedor}\n"
        f'<main id="conteudo" tabindex="-1">{corpo}</main>\n'
        f"<footer>{html.escape(_RODAPE)}</footer>\n"
        f"{script_carrossel}"
        "</body>\n"
        "</html>\n"
    )


TITULO_RAIZ = "Catálogo de relógios"
_MENSAGEM_VITRINE_VAZIA = "Esta vitrine ainda não tem relógios."
_RODAPE = "Catálogo de relógios"
_ROTULO_CATALOGO = "Catálogo"
_ROTULO_VOLTAR = "Voltar"
_ROTULO_INTERESSE = "Tenho interesse"
_TEXTO_ANUNCIO = "Ver anúncio similar"
_RE_ANUNCIO = re.compile(r"https?://\S+")
