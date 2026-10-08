(function () {
  function atualizarBolinhas(bolinhas, indice) {
    bolinhas.forEach(function (bolinha, i) {
      if (i === indice) {
        bolinha.setAttribute("aria-current", "true");
      } else {
        bolinha.removeAttribute("aria-current");
      }
    });
  }

  function mostrarFoto(fotos, indice) {
    fotos.forEach(function (foto, i) {
      foto.hidden = i !== indice;
    });
  }

  function indiceVisivel(fotos) {
    for (var i = 0; i < fotos.length; i += 1) {
      if (!fotos[i].hidden) {
        return i;
      }
    }
    return 0;
  }

  function prepararCarrossel(carrossel) {
    var fotos = carrossel.querySelectorAll("img");
    if (fotos.length < 2) {
      return;
    }

    var bolinhasContainer = carrossel.querySelector(".bolinhas");
    if (!bolinhasContainer) {
      return;
    }
    var bolinhas = bolinhasContainer.querySelectorAll(".bolinha");
    var anterior = carrossel.querySelector(".seta-anterior");
    var proxima = carrossel.querySelector(".seta-proxima");
    if (!anterior || !proxima) {
      return;
    }

    var indice = indiceVisivel(fotos);

    function irPara(novoIndice) {
      var total = fotos.length;
      indice = ((novoIndice % total) + total) % total;
      mostrarFoto(fotos, indice);
      atualizarBolinhas(bolinhas, indice);
    }

    proxima.addEventListener("click", function () {
      irPara(indice + 1);
    });
    anterior.addEventListener("click", function () {
      irPara(indice - 1);
    });
    bolinhas.forEach(function (bolinha, i) {
      bolinha.addEventListener("click", function () {
        irPara(i);
      });
    });
  }

  function preparar() {
    document.querySelectorAll(".carrossel").forEach(prepararCarrossel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preparar);
  } else {
    preparar();
  }
})();
