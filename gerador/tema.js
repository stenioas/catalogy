(function () {
  var CHAVE = "tema";
  var NOME_DO_MODO = {
    claro: "Modo claro. Mudar para escuro.",
    escuro: "Modo escuro. Mudar para claro.",
  };
  var SVG_NS = "http://www.w3.org/2000/svg";

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

  function iconeLua() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icone-lua");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
    );
    svg.appendChild(path);
    return svg;
  }

  function iconeSol() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icone-sol");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    var circulo = document.createElementNS(SVG_NS, "circle");
    circulo.setAttribute("cx", "12");
    circulo.setAttribute("cy", "12");
    circulo.setAttribute("r", "4");
    svg.appendChild(circulo);
    var raios = document.createElementNS(SVG_NS, "path");
    raios.setAttribute(
      "d",
      "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
    );
    svg.appendChild(raios);
    return svg;
  }

  function limparControle(controle) {
    while (controle.firstChild) {
      controle.removeChild(controle.firstChild);
    }
  }

  function atualizarControle(controle, tema) {
    limparControle(controle);
    controle.appendChild(tema === "claro" ? iconeLua() : iconeSol());
    controle.setAttribute("aria-label", NOME_DO_MODO[tema]);
  }

  function alternar(controle) {
    var atual = document.documentElement.getAttribute("data-tema");
    var proximo = atual === "claro" ? "escuro" : "claro";
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
