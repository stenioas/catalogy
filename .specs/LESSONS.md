# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Assert the exact length the spec names on that element, not only a child min-height.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `css` · harmful: 0
- features: vitrine-relogios
- evidence: gerador/estilos.css:22 (css)
- last seen: 2026-10-08T02:44:53Z

### L-002 - Assert behavior tests do not open the published catalog file, not that an absolute path string is absent from source.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: vitrine-relogios
- evidence: tests/test_cli.py:89 (tests)
- last seen: 2026-10-08T02:44:53Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
