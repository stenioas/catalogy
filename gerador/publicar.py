import os
import shutil
from pathlib import Path

from gerador.modelo import Vendedor
from gerador.renderizar import escrever
from gerador.validar import carregar


def substituir(raiz: Path) -> None:
    raiz = Path(raiz)
    vendedores = carregar(raiz)
    novo = raiz / f"site.novo.{os.getpid()}"
    anterior = raiz / f"site.anterior.{os.getpid()}"
    site = raiz / "site"
    _renderizar(raiz, vendedores, novo)
    tinha = site.exists()
    if tinha:
        if anterior.exists():
            shutil.rmtree(anterior)
        site.rename(anterior)
    try:
        novo.rename(site)
    except Exception:
        if novo.exists():
            shutil.rmtree(novo)
        if tinha and anterior.exists() and not site.exists():
            anterior.rename(site)
        raise
    if tinha and anterior.exists():
        shutil.rmtree(anterior)


def _renderizar(raiz: Path, vendedores: list[Vendedor], destino: Path) -> None:
    if destino.exists():
        shutil.rmtree(destino)
    try:
        escrever(vendedores, destino, raiz / "fontes")
        _copiar_imagens(raiz, vendedores, destino)
    except Exception:
        if destino.exists():
            shutil.rmtree(destino)
        raise


def _copiar_imagens(raiz: Path, vendedores: list[Vendedor], destino: Path) -> None:
    for vendedor in vendedores:
        origem = raiz / "vendedores" / vendedor.pasta
        pasta_imagens = destino / vendedor.pasta / "imagens"
        copiados: set[str] = set()
        for item in vendedor.itens:
            for arquivo in item.imagens:
                if arquivo in copiados:
                    continue
                copiados.add(arquivo)
                pasta_imagens.mkdir(parents=True, exist_ok=True)
                shutil.copy2(origem / arquivo, pasta_imagens / arquivo)
