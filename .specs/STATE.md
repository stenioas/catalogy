# STATE

## Decisions

### AD-001
- **Decision**: O gerador do site é Python 3 com PyYAML. O site publicado é HTML, CSS e JavaScript sem framework.
- **Reason**: PyYAML 5.4.1 já está na máquina, o script de PDF antigo é Python, e um leitor YAML próprio acrescenta risco sem ganho.
- **Trade-off**: O gerador depende do pacote PyYAML. Node não entra na geração.
- **Scope**: Geração do catálogo estático e os testes desse gerador.
- **Date**: 2026-10-07
- **Status**: active

## Handoff

- **Feature**: `.specs/features/vitrine-relogios` (emenda de interface vinda de `PLANO-INTERFACE.md`)
- **Phase / Task**: Phase 6 / T15 - ler o tamanho de PNG e JPEG em `gerador/imagem.py`
- **Completed**: T1–T14. Spec, design e tasks da emenda escritos e validados (`validate_spec` e `validate_tasks` sem erro)
- **In-progress** (file:line): none
- **Next step**: O dono vai executar T15 a T28 depois. Antes, aprovar o modo de execução (subagentes por fase, `tlc-task-orchestrator` ou na própria conversa).
- **Blockers**: none
- **Uncommitted files**: `site/` (saída gerada, fora do git), `Untitled`, `__pycache__/`
- **Branch**: master. Acabamento do CSS commitado em `bf37bf2`. Base: 149 testes passando
