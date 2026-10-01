# Baseline — social-pip

> Foto medible del proyecto (contrato de fases §8). Generado por `scripts/baseline_update.py` el 2026-10-01 · commit `4d39d44`.
> Actualizado al cierre de cada F2/F3 y slice (contrato §8). F0.a computa delta contra este archivo.

| Métrica | Valor |
|---|---|
| Build / typecheck / tests | typecheck PASS · pytest 95 passed in 14.44s |
| Cobertura | no medida en este repo (coverage artifact desactualizado — ver F0 2026-09-27 §3) |
| CVEs (pnpm audit --prod) | 0 known vulnerabilities |
| SQLite | tables: 2 (ai_evals, sqlite_sequence); ai_evals rows: 0 |
| Deuda aceptada | ver tickets P2/P3 abiertos con label (kanban + Linear SOCIAL-PIP) |
| Fecha y commit | 2026-10-01 · `4d39d44` |

## Cómo regenerar

```bash
python scripts/baseline_update.py --repo-root . --out docs/baseline.md
```
