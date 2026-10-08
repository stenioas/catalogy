import json
import subprocess
import unittest
from pathlib import Path

CAMINHO_TEMA = Path(__file__).resolve().parent.parent / "gerador" / "tema.js"

_HARNESS = r"""
const fs = require("fs");
const temaSource = fs.readFileSync(process.argv[1], "utf8");
const config = JSON.parse(process.argv[2]);

function criarNoSvg(tag) {
  const atributos = {};
  const filhos = [];
  return {
    tagName: tag,
    namespaceURI: "http://www.w3.org/2000/svg",
    setAttribute(chave, valor) {
      atributos[chave] = String(valor);
    },
    getAttribute(chave) {
      return Object.prototype.hasOwnProperty.call(atributos, chave)
        ? atributos[chave]
        : null;
    },
    appendChild(no) {
      filhos.push(no);
      return no;
    },
    querySelector(seletor) {
      if (seletor === "svg.icone-lua" && atributos.class === "icone-lua") {
        return this;
      }
      if (seletor === "svg.icone-sol" && atributos.class === "icone-sol") {
        return this;
      }
      for (const filho of filhos) {
        const achado = filho.querySelector ? filho.querySelector(seletor) : null;
        if (achado) return achado;
      }
      return null;
    },
  };
}

function criarBotao() {
  const atributos = {};
  const filhos = [];
  const botao = {
    type: "button",
    id: "",
    textContent: "",
    get firstChild() {
      return filhos.length ? filhos[0] : null;
    },
    setAttribute(chave, valor) {
      atributos[chave] = String(valor);
    },
    getAttribute(chave) {
      return Object.prototype.hasOwnProperty.call(atributos, chave)
        ? atributos[chave]
        : null;
    },
    appendChild(no) {
      filhos.push(no);
      return no;
    },
    removeChild(no) {
      const indice = filhos.indexOf(no);
      if (indice === -1) throw new Error("filho ausente");
      filhos.splice(indice, 1);
      return no;
    },
    querySelector(seletor) {
      for (const filho of filhos) {
        const achado = filho.querySelector ? filho.querySelector(seletor) : null;
        if (achado) return achado;
      }
      return null;
    },
    addEventListener(evento, fn) {
      if (evento === "click") this._click = fn;
    },
    click() {
      if (this._click) this._click();
    },
  };
  return botao;
}

function resumoControle(controle) {
  if (!controle) return null;
  const lua = controle.querySelector("svg.icone-lua");
  const sol = controle.querySelector("svg.icone-sol");
  return {
    nomeAcessivel: controle.getAttribute("aria-label"),
    textoVisivel: controle.textContent.trim(),
    temLua: !!lua,
    temSol: !!sol,
    ariaHiddenLua: lua ? lua.getAttribute("aria-hidden") : null,
    ariaHiddenSol: sol ? sol.getAttribute("aria-hidden") : null,
  };
}

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
      return criarBotao();
    },
    createElementNS(ns, tag) {
      if (ns !== "http://www.w3.org/2000/svg") {
        throw new Error("namespace inesperado: " + ns);
      }
      return criarNoSvg(tag);
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

  const depoisDoControle = resumoControle(controle);
  depoisDoControle.dataTema = documentElement.getAttribute("data-tema");
  depoisDoControle.storage = localStorage.dump();

  if (config.clicar) {
    controle.click();
  }

  const resultado = {
    antesDoControle,
    depoisDoControle,
    controle: resumoControle(controle),
    dataTema: documentElement.getAttribute("data-tema"),
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
        # AJST-20 / edge: valor salvo vence a preferência do aparelho
        saida = _rodar_tema(storage={"tema": "escuro"}, prefersDark=False)
        self.assertEqual(saida["antesDoControle"]["dataTema"], "escuro")
        self.assertEqual(saida["antesDoControle"]["storage"], {"tema": "escuro"})

    def test_tema_salvo_claro_vence_aparelho_escuro(self):
        # AJST-20
        saida = _rodar_tema(storage={"tema": "claro"}, prefersDark=True)
        self.assertEqual(saida["antesDoControle"]["dataTema"], "claro")


class TestTemaIcone(unittest.TestCase):
    def test_aparelho_claro_sem_storage_mostra_lua_no_controle(self):
        # AJST-16 / preferência do aparelho sem valor salvo
        controle = _rodar_tema(prefersDark=False)["depoisDoControle"]
        self.assertEqual(controle["dataTema"], "claro")
        self.assertTrue(controle["temLua"])

    def test_modo_claro_mostra_lua_com_nome_acessivel(self):
        # AJST-16
        controle = _rodar_tema(storage={"tema": "claro"})["depoisDoControle"]
        self.assertTrue(controle["temLua"])
        self.assertFalse(controle["temSol"])
        self.assertEqual(controle["ariaHiddenLua"], "true")
        self.assertEqual(
            controle["nomeAcessivel"],
            "Modo claro. Mudar para escuro.",
        )

    def test_modo_escuro_mostra_sol_com_nome_acessivel(self):
        # AJST-17
        controle = _rodar_tema(storage={"tema": "escuro"})["depoisDoControle"]
        self.assertTrue(controle["temSol"])
        self.assertFalse(controle["temLua"])
        self.assertEqual(controle["ariaHiddenSol"], "true")
        self.assertEqual(
            controle["nomeAcessivel"],
            "Modo escuro. Mudar para claro.",
        )

    def test_botao_nao_mostra_texto_claro_nem_escuro(self):
        # AJST-18
        for tema in ("claro", "escuro"):
            with self.subTest(tema=tema):
                controle = _rodar_tema(storage={"tema": tema})["depoisDoControle"]
                self.assertNotIn("Claro", controle["textoVisivel"])
                self.assertNotIn("Escuro", controle["textoVisivel"])

    def test_clique_no_claro_grava_escuro_e_mostra_sol(self):
        # AJST-19
        saida = _rodar_tema(storage={"tema": "claro"}, clicar=True)
        self.assertEqual(saida["dataTema"], "escuro")
        self.assertEqual(saida["storage"]["tema"], "escuro")
        self.assertTrue(saida["controle"]["temSol"])
        self.assertFalse(saida["controle"]["temLua"])
        self.assertEqual(
            saida["controle"]["nomeAcessivel"],
            "Modo escuro. Mudar para claro.",
        )

    def test_clique_no_escuro_grava_claro_e_mostra_lua(self):
        # AJST-19
        saida = _rodar_tema(storage={"tema": "escuro"}, clicar=True)
        self.assertEqual(saida["dataTema"], "claro")
        self.assertEqual(saida["storage"]["tema"], "claro")
        self.assertTrue(saida["controle"]["temLua"])
        self.assertFalse(saida["controle"]["temSol"])
        self.assertEqual(
            saida["controle"]["nomeAcessivel"],
            "Modo claro. Mudar para escuro.",
        )


if __name__ == "__main__":
    unittest.main()
