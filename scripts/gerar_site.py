#!/usr/bin/env python3
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from gerador.publicar import substituir
from gerador.validar import CatalogoErro


def main(raiz: Path | None = None) -> int:
    base = Path(raiz) if raiz is not None else RAIZ
    try:
        substituir(base)
    except CatalogoErro as erro:
        print(f"{erro.pasta}: {erro.regra}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
