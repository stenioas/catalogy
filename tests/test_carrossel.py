import json
import subprocess
import unittest
from pathlib import Path

CAMINHO_CARROSSEL = (
    Path(__file__).resolve().parent.parent / "gerador" / "carrossel.js"
)

_HARNESS = r"""
const fs = require("fs");
const carrosselSource = fs.readFileSync(process.argv[1], "utf8");
const config = JSON.parse(process.argv[2]);

function criarBolinha(ativa) {
  const attrs = {};
  const bolinha = {
    className: "bolinha",
    type: "button",
    _click: null,
    setAttribute(chave, valor) {
      attrs[chave] = valor;
    },
    removeAttribute(chave) {
      delete attrs[chave];
    },
    getAttribute(chave) {
      return Object.prototype.hasOwnProperty.call(attrs, chave)
        ? attrs[chave]
        : null;
    },
    addEventListener(evento, fn) {
      if (evento === "click") this._click = fn;
    },
    click() {
      if (this._click) this._click();
    },
    _inicial: ativa,
  };
  return bolinha;
}

function criarFoto(oculta) {
  return { hidden: oculta, alt: "modelo" };
}

function criarBotao(classe) {
  const botao = {
    className: classe,
    type: "button",
    _click: null,
    addEventListener(evento, fn) {
      if (evento === "click") this._click = fn;
    },
    click() {
      if (this._click) this._click();
    },
  };
  return botao;
}

function montarCarrossel(quantidadeFotos) {
  const fotos = [];
  for (let i = 0; i < quantidadeFotos; i += 1) {
    fotos.push(criarFoto(i !== 0));
  }
  const bolinhas = fotos.map((_, i) => criarBolinha(i === 0));
  for (let i = 0; i < bolinhas.length; i += 1) {
    if (bolinhas[i]._inicial) {
      bolinhas[i].setAttribute("aria-current", "true");
    }
  }
  const anterior = criarBotao("seta seta-anterior");
  const proxima = criarBotao("seta seta-proxima");
  const bolinhasDiv = {
    className: "bolinhas",
    querySelectorAll(seletor) {
      if (seletor === ".bolinha") return bolinhas;
      return [];
    },
  };
  const janela = {
    className: "carrossel-janela",
    querySelectorAll(seletor) {
      if (seletor === "img") return fotos;
      return [];
    },
    querySelector(seletor) {
      if (seletor === ".seta-anterior") return anterior;
      if (seletor === ".seta-proxima") return proxima;
      return null;
    },
  };
  const carrossel = {
    className: "carrossel",
    querySelectorAll(seletor) {
      if (seletor === "img") return janela.querySelectorAll(seletor);
      return [];
    },
    querySelector(seletor) {
      if (seletor === ".seta-anterior") return janela.querySelector(seletor);
      if (seletor === ".seta-proxima") return janela.querySelector(seletor);
      if (seletor === ".bolinhas") return bolinhasDiv;
      return null;
    },
  };
  return { carrossel, fotos, bolinhas, anterior, proxima };
}

function executar() {
  const montagem = montarCarrossel(config.quantidadeFotos || 2);
  const ouvintes = { DOMContentLoaded: [] };
  const document = {
    readyState: config.readyState || "loading",
    addEventListener(evento, fn) {
      if (ouvintes[evento]) ouvintes[evento].push(fn);
    },
    querySelectorAll(seletor) {
      if (seletor === ".carrossel") return [montagem.carrossel];
      return [];
    },
  };

  global.document = document;
  eval(carrosselSource);

  for (const fn of ouvintes.DOMContentLoaded) fn();

  for (const acao of config.acoes || []) {
    if (acao === "proxima") montagem.proxima.click();
    if (acao === "anterior") montagem.anterior.click();
    if (typeof acao === "object" && acao.bolinha != null) {
      montagem.bolinhas[acao.bolinha].click();
    }
  }

  const visibilidade = montagem.fotos.map((foto) => !foto.hidden);
  const bolinhasAtivas = montagem.bolinhas.map(
    (bolinha) => bolinha.getAttribute("aria-current") === "true"
  );

  process.stdout.write(
    JSON.stringify({ visibilidade, bolinhasAtivas })
  );
}

executar();
"""


def _rodar_carrossel(**config):
    resultado = subprocess.run(
        ["node", "-e", _HARNESS, str(CAMINHO_CARROSSEL), json.dumps(config)],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(resultado.stdout)


class TestCarrosselFotos(unittest.TestCase):
    def test_proxima_depois_da_ultima_mostra_a_primeira_foto(self):
        # VITR-47 / spec P1 Navegar AC 28
        saida = _rodar_carrossel(quantidadeFotos=2, acoes=["proxima", "proxima"])
        self.assertEqual(saida["visibilidade"], [True, False])

    def test_bolinha_corrente_acompanha_o_indice_apos_proxima(self):
        # VITR-46 / spec P1 Navegar AC 27
        saida = _rodar_carrossel(quantidadeFotos=3, acoes=["proxima"])
        self.assertEqual(saida["visibilidade"], [False, True, False])
        self.assertEqual(saida["bolinhasAtivas"], [False, True, False])

    def test_apenas_uma_foto_visivel_por_vez(self):
        # VITR-46 / spec P1 Navegar AC 27
        saida = _rodar_carrossel(quantidadeFotos=3, acoes=["proxima", "proxima"])
        self.assertEqual(saida["visibilidade"].count(True), 1)
        self.assertEqual(saida["bolinhasAtivas"].count(True), 1)

    def test_clicar_terceira_bolinha_mostra_só_a_terceira_foto(self):
        # VITR-85 / spec P1 Ler e navegar AC 12
        saida = _rodar_carrossel(
            quantidadeFotos=3, acoes=[{"bolinha": 2}]
        )
        self.assertEqual(saida["visibilidade"], [False, False, True])
        self.assertEqual(saida["bolinhasAtivas"], [False, False, True])

    def test_depois_da_terceira_bolinha_proxima_volta_para_primeira(self):
        # VITR-85 / spec P1 Ler e navegar AC 12 + VITR-47 AC 28
        saida = _rodar_carrossel(
            quantidadeFotos=3, acoes=[{"bolinha": 2}, "proxima"]
        )
        self.assertEqual(saida["visibilidade"], [True, False, False])
        self.assertEqual(saida["bolinhasAtivas"], [True, False, False])

    def test_script_acha_controles_com_janela_aninhada(self):
        # AJST-39 / spec P1 Quadro do carrossel AC 6
        saida = _rodar_carrossel(quantidadeFotos=2, acoes=["proxima"])
        self.assertEqual(saida["visibilidade"], [False, True])
        self.assertEqual(saida["bolinhasAtivas"], [False, True])


if __name__ == "__main__":
    unittest.main()
