import json
import subprocess
import unittest
from pathlib import Path

CAMINHO_TEMA = Path(__file__).resolve().parent.parent / "gerador" / "tema.js"

_HARNESS = r"""
const fs = require("fs");
const temaSource = fs.readFileSync(process.argv[1], "utf8");
const config = JSON.parse(process.argv[2]);

function executar() {
  const storage = { ...(config.storage || {}) };
  const localStorage = {
    getItem(chave) {
      return Object.prototype.hasOwnProperty.call(storage, chave)
        ? storage[chave]
        : null;
    },
    setItem(chave, valor) {
      storage[chave] = String(valor);
    },
    dump() {
      return { ...storage };
    },
  };

  const atributos = {};
  const documentElement = {
    setAttribute(chave, valor) {
      atributos[chave] = valor;
    },
    getAttribute(chave) {
      return Object.prototype.hasOwnProperty.call(atributos, chave)
        ? atributos[chave]
        : null;
    },
  };

  const ouvintes = { DOMContentLoaded: [] };
  let controle = null;

  const barra = {
    appendChild(no) {
      controle = no;
    },
  };

  const document = {
    documentElement,
    readyState: config.readyState || "loading",
    addEventListener(evento, fn) {
      if (ouvintes[evento]) ouvintes[evento].push(fn);
    },
    querySelector(seletor) {
      if (seletor === "header.barra-negra") return barra;
      return null;
    },
    getElementById() {
      return null;
    },
    createElement(tag) {
      if (tag !== "button") throw new Error("tag inesperada: " + tag);
      const atributos = {};
      const botao = {
        type: "button",
        id: "",
        textContent: "",
        setAttribute(chave, valor) {
          atributos[chave] = String(valor);
        },
        getAttribute(chave) {
          return Object.prototype.hasOwnProperty.call(atributos, chave)
            ? atributos[chave]
            : null;
        },
        addEventListener(evento, fn) {
          if (evento === "click") this._click = fn;
        },
        click() {
          if (this._click) this._click();
        },
      };
      return botao;
    },
  };

  global.localStorage = localStorage;
  global.window = {
    matchMedia(consulta) {
      if (consulta !== "(prefers-color-scheme: dark)") {
        throw new Error("consulta inesperada: " + consulta);
      }
      return { matches: !!config.prefersDark };
    },
  };
  global.document = document;

  eval(temaSource);

  const antesDoControle = {
    dataTema: documentElement.getAttribute("data-tema"),
    storage: localStorage.dump(),
  };

  for (const fn of ouvintes.DOMContentLoaded) fn();

  const depoisDoControle = {
    dataTema: documentElement.getAttribute("data-tema"),
    rotulo: controle ? controle.textContent : null,
    nomeAcessivel: controle ? controle.getAttribute("aria-label") : null,
    storage: localStorage.dump(),
  };

  if (config.clicar) {
    controle.click();
  }

  const resultado = {
    antesDoControle,
    depoisDoControle,
    dataTema: documentElement.getAttribute("data-tema"),
    rotulo: controle ? controle.textContent : null,
    nomeAcessivel: controle ? controle.getAttribute("aria-label") : null,
    storage: localStorage.dump(),
  };

  process.stdout.write(JSON.stringify(resultado));
}

executar();
"""


def _rodar_tema(**config):
    resultado = subprocess.run(
        ["node", "-e", _HARNESS, str(CAMINHO_TEMA), json.dumps(config)],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(resultado.stdout)


class TestTemaAntesDaPintura(unittest.TestCase):
    def test_sem_preferencia_salva_e_aparelho_escuro_aplica_escuro(self):
        # VITR-54 / spec P1 Tema AC 2
        saida = _rodar_tema(prefersDark=True)
        self.assertEqual(saida["antesDoControle"]["dataTema"], "escuro")

    def test_sem_preferencia_salva_e_aparelho_claro_aplica_claro(self):
        # VITR-55 / spec P1 Tema AC 3
        saida = _rodar_tema(prefersDark=False)
        self.assertEqual(saida["antesDoControle"]["dataTema"], "claro")

    def test_com_tema_salvo_aplica_antes_do_controle(self):
        # VITR-59 / spec P1 Tema AC 7
        saida = _rodar_tema(storage={"tema": "escuro"}, prefersDark=False)
        self.assertEqual(saida["antesDoControle"]["dataTema"], "escuro")
        self.assertEqual(saida["antesDoControle"]["storage"], {"tema": "escuro"})

    def test_no_modo_claro_o_controle_mostra_escuro(self):
        # VITR-56 / spec P1 Tema AC 4
        saida = _rodar_tema(storage={"tema": "claro"})
        self.assertEqual(saida["depoisDoControle"]["rotulo"], "Escuro")

    def test_no_modo_escuro_o_controle_mostra_claro(self):
        # VITR-57 / spec P1 Tema AC 5
        saida = _rodar_tema(storage={"tema": "escuro"})
        self.assertEqual(saida["depoisDoControle"]["rotulo"], "Claro")

    def test_clique_grava_tema_e_alterna_o_modo(self):
        # VITR-58 / spec P1 Tema AC 6
        saida = _rodar_tema(storage={"tema": "claro"}, clicar=True)
        self.assertEqual(saida["dataTema"], "escuro")
        self.assertEqual(saida["storage"]["tema"], "escuro")
        self.assertEqual(saida["rotulo"], "Claro")

    def test_no_modo_claro_o_nome_acessivel_descreve_o_modo_atual(self):
        # VITR-88 / spec P1 Ler e navegar AC 15
        saida = _rodar_tema(storage={"tema": "claro"})
        self.assertEqual(
            saida["depoisDoControle"]["nomeAcessivel"],
            "Modo claro. Mudar para escuro.",
        )
        self.assertEqual(saida["depoisDoControle"]["rotulo"], "Escuro")

    def test_no_modo_escuro_o_nome_acessivel_descreve_o_modo_atual(self):
        # VITR-89 / spec P1 Ler e navegar AC 16
        saida = _rodar_tema(storage={"tema": "escuro"})
        self.assertEqual(
            saida["depoisDoControle"]["nomeAcessivel"],
            "Modo escuro. Mudar para claro.",
        )
        self.assertEqual(saida["depoisDoControle"]["rotulo"], "Claro")

    def test_apos_clique_a_partir_do_claro_o_nome_acessivel_muda(self):
        # VITR-90 / spec P1 Ler e navegar AC 17
        saida = _rodar_tema(storage={"tema": "claro"}, clicar=True)
        self.assertEqual(
            saida["nomeAcessivel"],
            "Modo escuro. Mudar para claro.",
        )


if __name__ == "__main__":
    unittest.main()
