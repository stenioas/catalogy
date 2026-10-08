(function () {
  var CHAVE = "tema";
  var ROTULO_PARA_MODO = { Escuro: "escuro", Claro: "claro" };
  var ROTULO_DO_MODO = { claro: "Escuro", escuro: "Claro" };
  var NOME_DO_MODO = {
    claro: "Modo claro. Mudar para escuro.",
    escuro: "Modo escuro. Mudar para claro.",
  };

  function preferenciaDoAparelho() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "escuro"
      : "claro";
  }

  function temaInicial() {
    var salvo = localStorage.getItem(CHAVE);
    if (salvo === "claro" || salvo === "escuro") {
      return salvo;
    }
    return preferenciaDoAparelho();
  }

  function aplicar(tema) {
    document.documentElement.setAttribute("data-tema", tema);
  }

  function atualizarControle(controle, tema) {
    controle.textContent = ROTULO_DO_MODO[tema];
    controle.setAttribute("aria-label", NOME_DO_MODO[tema]);
  }

  function alternar(controle) {
    var proximo = ROTULO_PARA_MODO[controle.textContent.trim()];
    aplicar(proximo);
    localStorage.setItem(CHAVE, proximo);
    atualizarControle(controle, proximo);
  }

  function prepararControle() {
    var barra = document.querySelector("header.barra-negra");
    if (!barra) {
      return;
    }
    var controle = document.getElementById("controle-tema");
    if (!controle) {
      controle = document.createElement("button");
      controle.type = "button";
      controle.id = "controle-tema";
      barra.appendChild(controle);
    }
    var tema = document.documentElement.getAttribute("data-tema");
    atualizarControle(controle, tema);
    controle.addEventListener("click", function () {
      alternar(controle);
    });
  }

  aplicar(temaInicial());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepararControle);
  } else {
    prepararControle();
  }
})();
