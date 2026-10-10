# Catálogo sem vendedor

## Problem Statement

O site publicado ainda exige `?seller=` e leva o telefone do vendedor no `sellers.json` e no link do WhatsApp. Quem abre o catálogo precisa ver os relógios sem nome e sem telefone de vendedor, e mandar a mensagem escolhendo o contato no próprio WhatsApp.

## Goals

- [ ] `/` e `/relogio/{slug}` abrem sem vendedor, e um `?seller=` antigo não muda a página.
- [ ] O botão **Enviar no WhatsApp** usa `https://wa.me/?text=` sem número, com o título e a URL absoluta do relógio.
- [ ] O `dist` não contém `catalog/sellers.json`.
- [ ] Card, ficha, tema, carrossel e barras seguem o visual combinado em `plano-sem-vendedor.md`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cadastrar relógios de `relogios-alexandre.md` | O plano não cadastra relógio. |
| Apagar `vendedores/` ou `images/` | Ficam no disco e fora do site. |
| Reescrever `.specs/features/catalogo-estatico` | Aquela spec ainda descreve o gate. Este arquivo a substitui nesses pontos. |
| Instalar o registry inteiro do shadcn ou o carrossel com Embla | Entram só `button`, `badge`, `card` e `table`. O gesto do carrossel permanece o atual. |
| Commit, push ou deploy | Quem commita é a pessoa. Este plano não publica. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Tema do shadcn | O init aponta para `client/src/index.css` e as variáveis semânticas apontam para os tokens atuais. Sem preset do site. | O criador de tema do site geraria outra paleta e um único raio. | y |
| Primitivos | Só `button`, `badge`, `card` e `table`. Barra, preço, barra fixa e miolo do carrossel continuam do catálogo. | O registry não tem essas peças. O gesto de 40px já está combinado. | y |
| Pílula azul | Só **Enviar no WhatsApp** é pílula `#0066cc`. Voltar, tema e setas são botões sem fundo, 44×44. | A barra preta e o carrossel não viram uma fileira de pílulas. | y |
| Card no escuro | Fundo `--canvas` no claro e `--surface-tile-2` no escuro. Foto na largura inteira. Título, preço e botão com 24px nas laterais e embaixo. | `--canvas` não muda no escuro e o padding padrão do Card encolheria a foto. | y |
| Preço no card | Foto, título e preço ficam no mesmo link. O WhatsApp fica fora. | Um toque no preço abre o relógio. | y |
| Títulos | Título do card, da página e das seções usam `foreground`. `--ink` não muda. | `text-ink` fica `#1d1d1f` no escuro. | y |
| Link de anúncio | Texto **Ver anúncio similar**. `#0066cc` no claro e `#2997ff` no escuro. | No escuro o azul de ação some na superfície escura. | y |
| Largura | `body` com `width: 100%`. `main` com `max-width: 100%`, `min-width: 0` e `overflow-x: clip`. | `100vw` inclui a barra de rolagem e abre rolagem horizontal. | y |
| Spec anterior | Não editar `.specs/features/catalogo-estatico`. | O plano manda este arquivo substituir aqueles pontos. | y |
| Idempotência | N/A | Páginas estáticas, sem gravação. | y |
| Autenticação e limite de taxa | N/A | O gate sai. Não há login nem API própria. | y |
| Concorrência | N/A | Sem estado compartilhado no servidor. | y |
| Observabilidade | N/A | O plano não pede log nem métrica. | y |
| Falha do WhatsApp | O site só monta a URL `https://wa.me/?text=`. | A disponibilidade do WhatsApp está fora do site. | y |

**Open questions:** none

---

## User Stories

### P1: Vitrine sem vendedor ⭐ MVP

**User Story**: Como visitante, quero abrir o catálogo sem um vendedor na URL para ver os relógios sem nome e sem telefone.

**Why P1**: Sem isso o telefone continua público e a home continua bloqueada.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` THEN o sistema SHALL listar os relógios e a barra preta SHALL mostrar o texto Catálogo.
2. WHEN a URL é `/?seller=alexandre` THEN o sistema SHALL mostrar o mesmo catálogo de `/`.
3. WHEN a URL é `/?seller=ninguem` THEN o sistema SHALL mostrar o mesmo catálogo de `/`.
4. IF a URL contém `seller` THEN o sistema SHALL omitir a frase Este link está incompleto ou o vendedor não existe.
5. WHEN o visitante abre `/` THEN o sistema SHALL não buscar `/catalog/sellers.json`.
6. IF não há produtos THEN o sistema SHALL mostrar a frase A vitrine ainda não tem relógios.
7. The site publicado SHALL omitir nome e telefone de vendedor.
8. The arquivo `client/public/catalog/sellers.json` SHALL deixar de existir.
9. The barril de `shared` SHALL não exportar `SellerSchema`.

**Independent Test**: Abrir `/`, `/?seller=alexandre` e `/?seller=ninguem` e ver a mesma vitrine, com a barra Catálogo e sem a frase de link incompleto.

---

### P1: Página do relógio sem vendedor ⭐ MVP

**User Story**: Como visitante, quero abrir um relógio direto para voltar à vitrine sem carregar um vendedor na URL.

**Why P1**: O link do card e o Voltar ainda hoje preservam `seller`.

**Acceptance Criteria**:

1. WHEN o visitante abre `/relogio/{slug}` de um relógio existente THEN o sistema SHALL mostrar esse relógio.
2. WHEN a URL é `/relogio/{slug}?seller=alexandre` THEN o sistema SHALL mostrar o mesmo relógio.
3. WHEN a página do relógio está visível THEN o Voltar e o texto Catálogo SHALL apontar para `/`.
4. WHEN um card é mostrado THEN o link de foto, título e preço SHALL apontar para `/relogio/{slug}` sem `seller`.
5. The controle Enviar no WhatsApp do card SHALL ficar fora do link que abre o relógio.
6. IF o slug não existe THEN o sistema SHALL mostrar a frase Este relógio não está no catálogo. e SHALL omitir Enviar no WhatsApp.
7. WHILE o Enviar no WhatsApp da página está inteiro na viewport o sistema SHALL omitir a barra fixa.

**Independent Test**: Abrir um relógio com e sem `?seller=`, voltar para `/`, e abrir um slug ausente para ver a frase sem o botão.

---

### P1: WhatsApp sem telefone ⭐ MVP

**User Story**: Como visitante, quero enviar o interesse no WhatsApp escolhendo o contato, com a mensagem já preenchida.

**Why P1**: O link atual chama o telefone do vendedor.

**Acceptance Criteria**:

1. The href de Enviar no WhatsApp SHALL ser `https://wa.me/?text=` mais o texto codificado, sem número de telefone.
2. The texto decodificado SHALL ser `Olá, tenho interesse no {título}. {url}`.
3. The URL do relógio nesse texto SHALL ser a origem atual mais `/relogio/{slug}`, sem query string.
4. WHEN o botão da página e o da barra fixa estão visíveis THEN os dois SHALL ter o mesmo href.
5. The link Enviar no WhatsApp SHALL usar `target="_blank"` e `rel="noopener noreferrer"`.
6. The sistema SHALL não emitir URL com o esquema `whatsapp://`.

**Independent Test**: Ler o href do card, da página e da barra fixa e conferir a frase, a URL absoluta e a ausência de número.

---

### P1: Build sem telefone publicado ⭐ MVP

**User Story**: Como quem publica o site, quero que o build conclua sem `sellers.json` e falhe se um relógio furar o contrato.

**Why P1**: Um arquivo esquecido no `dist` deixa o telefone público.

**Acceptance Criteria**:

1. WHEN `pnpm build` roda sem `sellers.json` THEN o build SHALL concluir.
2. The `dist` SHALL não conter `catalog/sellers.json`.
3. IF um `product.json` fura o contrato THEN `pnpm build` SHALL falhar.
4. The pastas `vendedores/` e o arquivo `relogios-alexandre.md` SHALL permanecer no disco.
5. The skill `cadastrar-relogio` SHALL não instruir a editar `sellers.json`.

**Independent Test**: Rodar `pnpm build` sem o arquivo de vendedores e repetir com um `product.json` inválido.

---

### P1: Visual dos controles ⭐ MVP

**User Story**: Como visitante, quero botões, cards e o tema reconhecíveis para usar o catálogo no claro e no escuro.

**Why P1**: O plano combina o visual junto com a retirada do vendedor.

**Acceptance Criteria**:

1. The Enviar no WhatsApp SHALL ser uma pílula de fundo `#0066cc`, texto branco centralizado, largura cheia e altura mínima de 44px no card, na página e na barra fixa.
2. The Voltar, o controle de tema e as setas do carrossel SHALL ser botões sem fundo, de 44×44px, com o ícone na cor do texto.
3. The controle de tema SHALL não ter texto visível.
4. WHILE o tema é claro o controle de tema SHALL mostrar o ícone Moon e o `aria-label` Usar tema escuro.
5. WHILE o tema é escuro o controle de tema SHALL mostrar o ícone Sun e o `aria-label` Usar tema claro.
6. The Voltar e o Anterior SHALL usar o ícone ChevronLeft.
7. The Seguinte SHALL usar o ícone ChevronRight.
8. The tema SHALL persistir em `localStorage` na chave `theme:v1`.
9. The card do relógio SHALL ter borda de 1px, raio de 18px e nenhuma sombra.
10. WHILE o tema é claro o fundo do card SHALL ser o token canvas.
11. WHILE o tema é escuro o fundo do card SHALL ser o token surface-tile-2.
12. The foto do card SHALL ocupar a largura inteira do card.
13. The região de título, preço e botão do card SHALL ter 24px de padding nas laterais e embaixo.
14. WHERE o relógio mostra desconto o selo SHALL ser o Badge com as cores `primary-tint`.
15. The título do card, o título da página e os títulos Descrição, Especificações e Observações SHALL usar a cor `foreground`.
16. The barra preta da vitrine e a barra preta da página do relógio SHALL ter 44px de altura.

**Independent Test**: Ver a pílula, os ícones de 44px, o card no claro e no escuro, e a altura das duas barras.

---

### P1: Ficha, foto e carrossel ⭐ MVP

**User Story**: Como visitante, quero ler a ficha e passar as fotos sem a página alargar além da tela.

**Why P1**: A URL longa da ficha e a foto larga são o defeito visível que o plano corrige.

**Acceptance Criteria**:

1. The quadro do carrossel na página do relógio SHALL ter largura máxima de 320px, ficar centrado e ser quadrado, com a imagem em `object-contain`.
2. WHEN a ficha tem especificações THEN o sistema SHALL mostrá-las na Table do shadcn, em duas colunas de rótulo e valor, sob o título Especificações.
3. WHEN um valor de especificação começa com `http://` ou `https://` THEN a célula SHALL mostrar o link Ver anúncio similar e SHALL omitir a URL crua no texto visível.
4. WHILE o tema é claro o link Ver anúncio similar SHALL usar a cor `#0066cc`.
5. WHILE o tema é escuro o link Ver anúncio similar SHALL usar a cor `#2997ff`.
6. The link Ver anúncio similar SHALL usar `target="_blank"` e `rel="noopener noreferrer"`.
7. The `body` SHALL ter `width: 100%` e SHALL não declarar `width: 100vw`.
8. The `main` da vitrine e o `main` da página do relógio SHALL ter `max-width: 100%`, `min-width: 0` e `overflow-x: clip`.
9. WHEN a ficha contém uma URL longa THEN o documento SHALL não ganhar rolagem horizontal.
10. The imagens do carrossel SHALL ter `draggable` falso e o quadro SHALL ter `touch-action: pan-y`.
11. WHILE o carrossel tem duas fotos ou mais, WHEN o ponteiro se desloca mais de 40px na horizontal THEN o sistema SHALL trocar a foto.
12. IF o gesto do carrossel é cancelado THEN o sistema SHALL não trocar a foto.
13. WHILE o carrossel tem uma foto só, WHEN o ponteiro se desloca THEN o sistema SHALL manter a mesma foto.
14. WHILE o carrossel tem uma foto só o sistema SHALL omitir setas e bolinhas.
15. WHILE há duas fotos ou mais, WHEN o quadro recebe Seta para a direita ou Seta para a esquerda THEN o sistema SHALL trocar a foto.
16. The bolinha da foto atual SHALL usar `#0066cc` e `aria-current="true"`.
17. The demais bolinhas SHALL usar a cor do texto com opacidade 0.35 e medir 10px.

**Independent Test**: Abrir um relógio com URL na ficha e com mais de uma foto, arrastar mais de 40px, cancelar um gesto e medir a largura do documento.

---

## Edge Cases

- IF o slug não existe THEN o sistema SHALL mostrar a frase de relógio ausente e omitir o botão. Ver P1 da página do relógio.
- IF não há produtos THEN o sistema SHALL mostrar a frase de vitrine vazia. Ver P1 da vitrine.
- WHEN `seller` aponta para um slug desconhecido THEN o sistema SHALL tratar a URL como a vitrine normal.
- IF um `product.json` é inválido THEN o build SHALL falhar.
- IF o gesto do carrossel é cancelado THEN a foto SHALL permanecer.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SV-01 | P1: Vitrine sem vendedor | Phase 3 | Done |
| SV-02 | P1: Vitrine sem vendedor | Phase 3 | Done |
| SV-03 | P1: Vitrine sem vendedor | Phase 3 | Done |
| SV-04 | P1: Vitrine sem vendedor | Phase 3 | Done |
| SV-05 | P1: Vitrine sem vendedor | Phase 3 | Done |
| SV-06 | P1: Vitrine sem vendedor | Tasks | Done |
| SV-07 | P1: Vitrine sem vendedor | Phase 1 | Done |
| SV-08 | P1: Vitrine sem vendedor | Phase 1 | Done |
| SV-09 | P1: Vitrine sem vendedor | Phase 1 | Done |
| SV-10 | P1: Página do relógio sem vendedor | Tasks | Done |
| SV-11 | P1: Página do relógio sem vendedor | Phase 3 | Done |
| SV-12 | P1: Página do relógio sem vendedor | Phase 3 | Done |
| SV-13 | P1: Página do relógio sem vendedor | Phase 3 | Done |
| SV-14 | P1: Página do relógio sem vendedor | Phase 3 | Done |
| SV-15 | P1: Página do relógio sem vendedor | Tasks | Done |
| SV-16 | P1: Página do relógio sem vendedor | Phase 2 | Done |
| SV-17 | P1: WhatsApp sem telefone | Phase 2 | Done |
| SV-18 | P1: WhatsApp sem telefone | Phase 2 | Done |
| SV-19 | P1: WhatsApp sem telefone | Phase 2 | Done |
| SV-20 | P1: WhatsApp sem telefone | Phase 2 | Done |
| SV-21 | P1: WhatsApp sem telefone | Phase 2 | Done |
| SV-22 | P1: WhatsApp sem telefone | Phase 2 | Done |
| SV-23 | P1: Build sem telefone publicado | Phase 1 | Done |
| SV-24 | P1: Build sem telefone publicado | Phase 1 | Done |
| SV-25 | P1: Build sem telefone publicado | Phase 1 | Done |
| SV-26 | P1: Build sem telefone publicado | Phase 1 | Done |
| SV-27 | P1: Build sem telefone publicado | Phase 1 | Done |
| SV-28 | P1: Visual dos controles | Tasks | Done |
| SV-29 | P1: Visual dos controles | Tasks | Done |
| SV-30 | P1: Visual dos controles | Tasks | Done |
| SV-31 | P1: Visual dos controles | Tasks | Done |
| SV-32 | P1: Visual dos controles | Tasks | Done |
| SV-33 | P1: Visual dos controles | Tasks | Done |
| SV-34 | P1: Visual dos controles | Tasks | Done |
| SV-35 | P1: Visual dos controles | Tasks | Done |
| SV-36 | P1: Visual dos controles | Tasks | Done |
| SV-37 | P1: Visual dos controles | Tasks | Done |
| SV-38 | P1: Visual dos controles | Tasks | Done |
| SV-39 | P1: Visual dos controles | Tasks | Done |
| SV-40 | P1: Visual dos controles | Tasks | Done |
| SV-41 | P1: Visual dos controles | Tasks | Done |
| SV-42 | P1: Visual dos controles | Tasks | Done |
| SV-43 | P1: Visual dos controles | Tasks | Done |
| SV-44 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-45 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-46 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-47 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-48 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-49 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-50 | P1: Ficha, foto e carrossel | Phase 4 | Done |
| SV-51 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-52 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-53 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-54 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-55 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-56 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-57 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-58 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-59 | P1: Ficha, foto e carrossel | Tasks | Done |
| SV-60 | P1: Ficha, foto e carrossel | Tasks | Done |

**Coverage:** 60 total, 60 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `/` e `/relogio/{slug}` funcionam com e sem `?seller=`, sem nome e sem telefone.
- [ ] **Enviar no WhatsApp** abre `https://wa.me/?text=` com a frase e a URL do relógio.
- [ ] `pnpm build` conclui sem `sellers.json` e o `dist` não leva esse arquivo.
- [ ] `pnpm test` cobre os critérios desta spec.
