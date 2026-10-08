import re
import unittest
from pathlib import Path

# VITR-53 / spec P1 Tema AC 1
PILHA_FONTE = 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif'

# VITR-30 / spec P1 Navegar AC 11
LARGURAS_GRADE = (
    (640, 1),
    (641, 2),
    (834, 2),
    (835, 3),
    (1068, 3),
    (1069, 4),
    (1440, 4),
    (1441, 5),
)

# VITR-22 / spec P1 Navegar AC 3
LARGURAS_LISTA = (320, 640, 641, 834, 835, 1068, 1069, 1440, 1441, 1920)

# VITR-60 a VITR-64 / spec P1 Tema AC 8 a AC 12
PRETO = "#000000"
AZUL_PILULA = "#0066cc"
AZUL_FOCO = "#0071e3"
TEXTO_SECUNDARIO_CLARO = "#333333"
BRANCO = "#ffffff"
PERGAMINHO = "#f5f5f7"
FUNDO_ESCURO = "#272729"
CARD_ESCURO = "#2a2a2c"
TEXTO_SECUNDARIO = "#cccccc"
LINK_ESCURO = "#2997ff"
FUNDO_VIDRO_ESCURO = "rgba(39, 39, 41, 0.8)"
LINHA_ESCURO = "rgba(255, 255, 255, 0.16)"
FUNDO_CONTROLE_TEMA = "#1d1d1f"

RAIZ = Path(__file__).resolve().parent.parent
CAMINHO_CSS = RAIZ / "gerador" / "estilos.css"
CAMINHO_DESIGN = RAIZ / "DESIGN.md"

_HEX = re.compile(r"#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
_REPEAT = re.compile(r"repeat\(\s*(\d+)\s*,", re.IGNORECASE)
_MIN_WIDTH = re.compile(r"min-width\s*:\s*(\d+)\s*px", re.IGNORECASE)
_MAX_WIDTH = re.compile(r"max-width\s*:\s*(\d+)\s*px", re.IGNORECASE)
_BLUR_POSITIVO = re.compile(r"blur\(\s*(?!0+(?:\.0+)?(?:px)?\b)(\d*\.?\d+)px\s*\)", re.IGNORECASE)


def _sem_comentarios(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def _extrair_bloco(texto: str, abre: int) -> tuple[str, int]:
    profundidade = 0
    indice = abre
    while indice < len(texto):
        if texto[indice] == "{":
            profundidade += 1
        elif texto[indice] == "}":
            profundidade -= 1
            if profundidade == 0:
                return texto[abre + 1 : indice], indice + 1
        indice += 1
    raise ValueError("bloco CSS sem fechamento")


def _declaracoes(corpo: str) -> dict[str, str]:
    saida: dict[str, str] = {}
    for parte in corpo.split(";"):
        if ":" not in parte:
            continue
        propriedade, valor = parte.split(":", 1)
        saida[propriedade.strip().lower()] = " ".join(valor.split())
    return saida


def _regras(css: str, media: str | None = None):
    texto = css
    indice = 0
    while indice < len(texto):
        while indice < len(texto) and texto[indice].isspace():
            indice += 1
        if indice >= len(texto):
            break
        if texto.startswith("@media", indice):
            abre = texto.find("{", indice)
            condicao = texto[indice + len("@media") : abre].strip()
            interno, indice = _extrair_bloco(texto, abre)
            yield from _regras(interno, condicao)
            continue
        if texto.startswith("@", indice):
            abre = texto.find("{", indice)
            _, indice = _extrair_bloco(texto, abre)
            continue
        abre = texto.find("{", indice)
        if abre < 0:
            break
        seletor = " ".join(texto[indice:abre].split())
        corpo, indice = _extrair_bloco(texto, abre)
        yield media, seletor, _declaracoes(corpo)


def _media_aplica(
    condicao: str | None,
    largura: int,
    *,
    movimento_reduzido: bool = False,
) -> bool:
    if condicao is None:
        return True
    condicao_lower = condicao.lower()
    if "prefers-reduced-motion" in condicao_lower:
        quer_reduzido = "reduce" in condicao_lower
        if quer_reduzido != movimento_reduzido:
            return False
    minimos = [int(valor) for valor in _MIN_WIDTH.findall(condicao)]
    maximos = [int(valor) for valor in _MAX_WIDTH.findall(condicao)]
    if not minimos and not maximos:
        return "prefers-reduced-motion" in condicao_lower
    return all(largura >= minimo for minimo in minimos) and all(
        largura <= maximo for maximo in maximos
    )


def _valor(
    regras,
    seletor: str,
    propriedade: str,
    largura: int = 800,
    *,
    movimento_reduzido: bool = False,
) -> str | None:
    achado = None
    for media, bloco, declaracoes in regras:
        alvos = [parte.strip() for parte in bloco.split(",")]
        if seletor not in alvos:
            continue
        if not _media_aplica(media, largura, movimento_reduzido=movimento_reduzido):
            continue
        if propriedade in declaracoes:
            achado = declaracoes[propriedade]
    return achado


def _colunas_sao_minmax_zero_um_fr(valor: str) -> bool:
    valor = " ".join(valor.split())
    if _REPEAT.match(valor):
        return (
            re.fullmatch(
                r"repeat\(\s*\d+\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)",
                valor,
                re.IGNORECASE,
            )
            is not None
        )
    return valor.replace(" ", "") == "minmax(0,1fr)"


def _colunas(valor: str) -> int:
    repeticao = _REPEAT.match(valor.strip())
    if repeticao:
        return int(repeticao.group(1))
    partes: list[str] = []
    atual = ""
    profundidade = 0
    for caractere in valor.strip():
        if caractere == "(":
            profundidade += 1
            atual += caractere
        elif caractere == ")":
            profundidade -= 1
            atual += caractere
        elif caractere.isspace() and profundidade == 0:
            if atual:
                partes.append(atual)
                atual = ""
        else:
            atual += caractere
    if atual:
        partes.append(atual)
    return len(partes)


def _hex_normalizado(texto: str) -> set[str]:
    cores: set[str] = set()
    for bruto in _HEX.findall(texto):
        cor = bruto.lower()
        if len(cor) == 3:
            cor = "".join(canal * 2 for canal in cor)
        elif len(cor) == 8:
            cor = cor[:6]
        cores.add(cor)
    return cores


def _px(valor: str) -> float:
    casado = re.fullmatch(r"(\d+(?:\.\d+)?)px", valor.strip())
    if casado is None:
        raise AssertionError(f"esperado comprimento em px, veio {valor!r}")
    return float(casado.group(1))


def _z(valor: str) -> float:
    valor = valor.strip()
    if valor.endswith("px"):
        return _px(valor)
    casado = re.fullmatch(r"(\d+(?:\.\d+)?)", valor)
    if casado is None:
        raise AssertionError(f"esperado z-index numérico, veio {valor!r}")
    return float(casado.group(1))


class TestEstilos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.css = _sem_comentarios(CAMINHO_CSS.read_text(encoding="utf-8"))
        cls.regras = list(_regras(cls.css))

    def test_grade_muda_em_640_834_1068_e_1440(self):
        for largura, colunas in LARGURAS_GRADE:
            valor = _valor(self.regras, ".grade-vitrine", "grid-template-columns", largura)
            self.assertIsNotNone(valor, f"grade sem colunas em {largura}px")
            self.assertEqual(_colunas(valor), colunas, f"{largura}px")

    def test_raiz_lista_vendedores_em_uma_coluna_em_toda_largura(self):
        for largura in LARGURAS_LISTA:
            valor = _valor(
                self.regras, ".lista-vendedores", "grid-template-columns", largura
            )
            self.assertIsNotNone(valor, f"lista sem colunas em {largura}px")
            self.assertEqual(_colunas(valor), 1, f"{largura}px")

    def test_foto_do_card_preenche_quadro_quadrado_com_raio_8(self):
        # VITR-49 / spec P1 Navegar AC 30: quadro quadrado com cover e 8px na foto
        foto = ".card img"
        proporcao = _valor(self.regras, foto, "aspect-ratio")
        self.assertIsNotNone(proporcao)
        self.assertEqual(proporcao.replace(" ", ""), "1/1")
        self.assertEqual(_valor(self.regras, foto, "width"), "100%")
        self.assertEqual(_valor(self.regras, foto, "object-fit"), "cover")
        self.assertEqual(_valor(self.regras, foto, "object-position"), "center")
        self.assertEqual(_valor(self.regras, foto, "border-radius"), "8px")
        self.assertEqual(_valor(self.regras, ".card", "border-radius"), "18px")

    def test_foto_do_carrossel_preenche_quadro_quadrado_sem_raio(self):
        # VITR-48 / spec P1 Navegar AC 29: quadro quadrado com cover e sem canto arredondado
        foto = ".carrossel img"
        proporcao = _valor(self.regras, foto, "aspect-ratio")
        self.assertIsNotNone(proporcao)
        self.assertEqual(proporcao.replace(" ", ""), "1/1")
        self.assertEqual(_valor(self.regras, foto, "width"), "100%")
        self.assertEqual(_valor(self.regras, foto, "object-fit"), "cover")
        self.assertEqual(_valor(self.regras, foto, "object-position"), "center")
        self.assertEqual(_valor(self.regras, foto, "border-radius"), "0")
        self.assertIn(_valor(self.regras, ".carrossel", "overflow"), (None, "visible"))

    def test_alvos_de_toque_tem_pelo_menos_44px(self):
        link_vendedor = ".lista-vendedores a"
        self.assertGreaterEqual(_px(_valor(self.regras, link_vendedor, "min-height")), 44)
        self.assertEqual(_valor(self.regras, link_vendedor, "width"), "100%")
        for seletor in (".voltar", ".pilula", ".barra-negra a"):
            self.assertGreaterEqual(
                _px(_valor(self.regras, seletor, "min-height")),
                44,
                seletor,
            )
        self.assertGreaterEqual(_px(_valor(self.regras, ".seta", "width")), 44)
        self.assertGreaterEqual(_px(_valor(self.regras, ".seta", "height")), 44)

    def test_barra_negra_mede_44px_no_claro_e_no_escuro(self):
        # VITR-50 / spec P1 Navegar AC 31: a barra preta tem 44px
        claro = _valor(self.regras, ".barra-negra", "height")
        self.assertEqual(claro, "44px")
        escuro = _valor(self.regras, 'html[data-tema="escuro"] .barra-negra', "height")
        self.assertEqual(claro if escuro is None else escuro, "44px")

    def test_barra_negra_e_000000_no_claro_e_no_escuro(self):
        self.assertEqual(_valor(self.regras, ".barra-negra", "background-color"), PRETO)
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] .barra-negra', "background-color"),
            PRETO,
        )

    def test_pilula_de_interesse_e_0066cc_com_texto_branco(self):
        for seletor in (".pilula", 'html[data-tema="escuro"] .pilula'):
            self.assertEqual(_valor(self.regras, seletor, "background-color"), AZUL_PILULA)
            self.assertEqual(_valor(self.regras, seletor, "color"), BRANCO)

    def test_rodape_claro_usa_f5f5f7(self):
        self.assertEqual(_valor(self.regras, "footer", "background-color"), PERGAMINHO)

    def test_escuro_define_fundo_card_texto_secundario_e_link(self):
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] body', "background-color"),
            FUNDO_ESCURO,
        )
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] body', "color"),
            BRANCO,
        )
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] .card', "background-color"),
            CARD_ESCURO,
        )
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] .card', "color"),
            BRANCO,
        )
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] .parcelamento', "color"),
            TEXTO_SECUNDARIO,
        )
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] main a', "color"),
            LINK_ESCURO,
        )

    def test_escuro_declara_color_scheme_dark(self):
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"]', "color-scheme"),
            "dark",
        )

    def test_escuro_rodape_solido_272729_e_barras_de_vidro(self):
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] footer', "background-color"),
            FUNDO_ESCURO,
        )
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] footer', "color"),
            BRANCO,
        )
        for seletor in (
            'html[data-tema="escuro"] .barra-vendedor',
            'html[data-tema="escuro"] .barra-fixa',
        ):
            self.assertEqual(
                _valor(self.regras, seletor, "background-color"),
                FUNDO_VIDRO_ESCURO,
                seletor,
            )
            self.assertEqual(_valor(self.regras, seletor, "color"), BRANCO, seletor)
            filtro = _valor(self.regras, seletor, "backdrop-filter")
            self.assertIsNotNone(filtro, seletor)
            self.assertIn("saturate(180%)", filtro, seletor)
            self.assertRegex(filtro, _BLUR_POSITIVO, seletor)

    def test_escuro_linhas_de_borda_usam_branco_translucido(self):
        self.assertEqual(
            _valor(self.regras, 'html[data-tema="escuro"] .card', "border-color"),
            LINHA_ESCURO,
        )
        self.assertEqual(
            _valor(
                self.regras,
                'html[data-tema="escuro"] .ficha-linha',
                "border-top-color",
            ),
            LINHA_ESCURO,
        )
        self.assertEqual(
            _valor(
                self.regras,
                'html[data-tema="escuro"] .ficha-linha:last-child',
                "border-bottom-color",
            ),
            LINHA_ESCURO,
        )
        self.assertEqual(
            _valor(
                self.regras,
                'html[data-tema="escuro"] .lista-vendedores a',
                "border-bottom-color",
            ),
            LINHA_ESCURO,
        )

    def test_controle_tema_tem_fundo_e_borda_visiveis(self):
        self.assertEqual(
            _valor(self.regras, "#controle-tema", "background-color"),
            FUNDO_CONTROLE_TEMA,
        )
        self.assertEqual(
            _valor(self.regras, "#controle-tema", "border"),
            f"1px solid {LINHA_ESCURO}",
        )

    def test_barra_fixa_escura_mantem_filtro_fosco(self):
        valor = _valor(
            self.regras,
            'html[data-tema="escuro"] .barra-fixa',
            "backdrop-filter",
        )
        self.assertIsNotNone(valor)
        self.assertNotEqual(valor, "none")
        self.assertRegex(valor, _BLUR_POSITIVO)

    def test_foto_nao_ganha_filtro_nem_inversao(self):
        for seletor in (
            ".card img",
            ".carrossel img",
            'html[data-tema="escuro"] .card img',
            'html[data-tema="escuro"] .carrossel img',
        ):
            self.assertEqual(_valor(self.regras, seletor, "filter"), "none", seletor)
        for _media, seletor, declaracoes in self.regras:
            if "img" not in seletor:
                continue
            filtro = declaracoes.get("filter", "none")
            self.assertNotIn("invert", filtro)
            self.assertNotIn("brightness", filtro)
            self.assertEqual(filtro, "none", seletor)

    def test_nenhum_hex_fica_fora_da_paleta_do_design(self):
        paleta = _hex_normalizado(CAMINHO_DESIGN.read_text(encoding="utf-8"))
        usados = _hex_normalizado(self.css)
        self.assertTrue(usados, "o CSS não declara cor")
        self.assertLessEqual(usados, paleta)
        obrigatorios = {
            PRETO.lstrip("#"),
            AZUL_PILULA.lstrip("#"),
            BRANCO.lstrip("#"),
            PERGAMINHO.lstrip("#"),
            FUNDO_ESCURO.lstrip("#"),
            CARD_ESCURO.lstrip("#"),
            TEXTO_SECUNDARIO.lstrip("#"),
            LINK_ESCURO.lstrip("#"),
        }
        self.assertLessEqual(obrigatorios, usados)

    def test_pagina_usa_a_pilha_de_fonte_da_spec_e_aponta_a_inter(self):
        familia = _valor(self.regras, "html", "font-family")
        self.assertIsNotNone(familia)
        self.assertEqual(
            familia.replace("'", '"').lower(),
            PILHA_FONTE.replace("'", '"').lower(),
        )
        self.assertRegex(
            self.css,
            r'@font-face\s*\{[^}]*font-family:\s*"Inter"',
        )
        self.assertRegex(
            self.css,
            r'url\(\s*["\']?fontes/InterVariable\.woff2["\']?\s*\)',
        )

    def test_pular_fora_do_foco_fica_fixo_fora_da_tela(self):
        # VITR-77 / spec P1 Ler e navegar AC 4
        self.assertEqual(_valor(self.regras, ".pular", "position"), "fixed")
        self.assertEqual(
            _valor(self.regras, ".pular", "transform"),
            "translateY(-200%)",
        )

    def test_pular_com_foco_mostra_pilula_azul_acima_da_barra_negra(self):
        # VITR-78 / spec P1 Ler e navegar AC 5
        self.assertEqual(_valor(self.regras, ".pular:focus", "transform"), "none")
        self.assertEqual(
            _valor(self.regras, ".pular:focus", "background-color"),
            AZUL_PILULA,
        )
        self.assertEqual(_valor(self.regras, ".pular:focus", "color"), BRANCO)
        self.assertEqual(_valor(self.regras, ".pular:focus", "border-radius"), "9999px")
        z_pular = _valor(self.regras, ".pular:focus", "z-index")
        z_barra = _valor(self.regras, ".barra-negra", "z-index")
        self.assertIsNotNone(z_pular)
        self.assertIsNotNone(z_barra)
        self.assertGreater(_z(z_pular), _z(z_barra))

    def test_html_tem_scroll_padding_top_44px(self):
        # VITR-79 / spec P1 Ler e navegar AC 6
        self.assertEqual(_valor(self.regras, "html", "scroll-padding-top"), "44px")

    def test_html_com_barra_vendedor_tem_scroll_padding_top_96px(self):
        # VITR-80 / spec P1 Ler e navegar AC 7
        self.assertEqual(
            _valor(self.regras, "html:has(.barra-vendedor)", "scroll-padding-top"),
            "96px",
        )

    def test_html_com_barra_fixa_tem_scroll_padding_bottom_64px(self):
        # VITR-81 / spec P1 Ler e navegar AC 8
        self.assertEqual(
            _valor(self.regras, "html:has(.barra-fixa)", "scroll-padding-bottom"),
            "64px",
        )

    def test_bolinha_tem_alvo_44px_ponto_8px_e_gap_8px(self):
        # VITR-84 / spec P1 Ler e navegar AC 11
        self.assertGreaterEqual(_px(_valor(self.regras, ".bolinha", "width")), 44)
        self.assertGreaterEqual(_px(_valor(self.regras, ".bolinha", "height")), 44)
        self.assertEqual(_valor(self.regras, ".bolinhas", "gap"), "8px")
        self.assertEqual(_px(_valor(self.regras, ".bolinha::before", "width")), 8)
        self.assertEqual(_px(_valor(self.regras, ".bolinha::before", "height")), 8)

    def test_bolinha_ativa_pinta_o_ponto_no_claro_e_no_escuro(self):
        # VITR-84 / spec P1 Ler e navegar AC 11 (cor ativa no ponto)
        self.assertEqual(
            _valor(self.regras, '.bolinha[aria-current="true"]::before', "background-color"),
            AZUL_PILULA,
        )
        self.assertEqual(
            _valor(
                self.regras,
                'html[data-tema="escuro"] .bolinha[aria-current="true"]::before',
                "background-color",
            ),
            LINK_ESCURO,
        )

    def test_parcelamento_e_dt_usam_333333_no_claro(self):
        # VITR-86 / spec P1 Ler e navegar AC 13
        self.assertEqual(
            _valor(self.regras, ".parcelamento", "color"),
            TEXTO_SECUNDARIO_CLARO,
        )
        self.assertEqual(_valor(self.regras, "dt", "color"), TEXTO_SECUNDARIO_CLARO)

    def test_folha_de_estilo_nao_usa_7a7a7a(self):
        # VITR-87 / spec P1 Ler e navegar AC 14
        self.assertNotIn("7a7a7a", self.css.lower())

    def test_pular_bolinha_e_seta_tem_anel_focus_visible(self):
        # VITR-82 / spec P1 Ler e navegar AC 9
        for seletor in (".pular:focus-visible", ".bolinha:focus-visible", ".seta:focus-visible"):
            self.assertEqual(
                _valor(self.regras, seletor, "outline"),
                f"2px solid {AZUL_FOCO}",
                seletor,
            )
            self.assertEqual(
                _valor(self.regras, seletor, "outline-offset"),
                "2px",
                seletor,
            )

    def test_leitor_css_aplica_bloco_prefers_reduced_motion(self):
        css = _sem_comentarios(
            '@media (prefers-reduced-motion: reduce) { .x:active { color: red; } }'
        )
        regras = list(_regras(css))
        self.assertIsNone(_valor(regras, ".x:active", "color"))
        self.assertEqual(
            _valor(regras, ".x:active", "color", movimento_reduzido=True),
            "red",
        )

    def test_movimento_reduzido_desliga_scale_no_active(self):
        # VITR-104 / spec P2 Movimento e tipografia AC 1
        for seletor in ("#controle-tema:active", ".pilula:active", ".seta:active"):
            self.assertEqual(
                _valor(self.regras, seletor, "transform", movimento_reduzido=True),
                "none",
                seletor,
            )

    def test_preco_usa_numeros_tabulares(self):
        # VITR-105 / spec P2 Movimento e tipografia AC 2
        self.assertEqual(
            _valor(self.regras, ".preco", "font-variant-numeric"),
            "tabular-nums",
        )

    def test_titulos_usam_text_wrap_balance(self):
        # VITR-106 / spec P2 Movimento e tipografia AC 3
        for seletor in ("h1", ".nome-vendedor", ".card .nome"):
            self.assertEqual(
                _valor(self.regras, seletor, "text-wrap"),
                "balance",
                seletor,
            )

    def test_nome_no_card_quebra_com_overflow_wrap_anywhere(self):
        # VITR-107 / spec P2 Movimento e tipografia AC 4
        self.assertEqual(
            _valor(self.regras, ".card .nome", "overflow-wrap"),
            "anywhere",
        )

    def test_grade_vitrine_colunas_sao_minmax_zero_um_fr(self):
        # VITR-108 / spec P2 Movimento e tipografia AC 5
        larguras = [320] + [largura for largura, _colunas in LARGURAS_GRADE]
        for largura in larguras:
            valor = _valor(
                self.regras, ".grade-vitrine", "grid-template-columns", largura
            )
            self.assertIsNotNone(valor, f"grade sem colunas em {largura}px")
            self.assertTrue(
                _colunas_sao_minmax_zero_um_fr(valor),
                f"{largura}px: {valor!r}",
            )
