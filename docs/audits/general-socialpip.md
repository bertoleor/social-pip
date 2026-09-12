# Auditoría general — SOCIAL-PIP (python-only, nocturna, sin notificación)

Estado: **UNVERIFIED / DRY-RUN** — nada commiteado, nada notificado, nada borrado.
Commit base: `0926c27` + working tree ya sucio antes de la corrida (73 archivos tocados,
mayoría frontend/Rust; ver `git status`).
Alcance: solo Python — 8 archivos en `skills/*/scripts/*.py`. El repo es TS/Rust
(311 md, 161 ts, 120 tsx, 52 rs, 8 py); no se exigió frontend/mobile en esta pasada.

## 1. Baseline lenta (python only)

| Check | Resultado |
|---|---|
| `ruff check` inicial (8 archivos) | 105 errores (64 autofixables) |
| `ruff check --fix` ×2 pasadas | 74 fijos, **32 restantes** (0 autofixables) |
| `py_compile` 8/8 | OK antes y después |
| `pytest --collect-only` (scoped, `-p no:cacheprovider`) | **0 tests** — no hay suite python |
| Smoke `scan_registry.py --help` | OK (imprime registry JSON) |
| Smoke `seo_optimizer.py` / `brand_voice_analyzer.py --help` | FALLABA (traceback) → fixeado → OK |
| Smoke run real `seo_optimizer.py` sobre txt de prueba | OK (score 22/100) |

Nota: `pytest` a raíz del repo colgaba (>120s, escanea `node_modules`); fallback a
scoped-collect + `py_compile` (auto-recovery, ver §6).

Skills SAFE instaladas: `ruff 0.16.7`, `pytest 9.1.1` (pip).

## 2. Fixes chicos aplicados (no commiteados)

- `ruff --fix`: orden de imports (I001), `typing.List/Dict/Tuple` → `list`/`dict`
  (UP006/UP035), f-strings sin placeholder (F541), `re.I` → `re.IGNORECASE`,
  `return None` redundante (RET501/PLR1711). 7 archivos.
- Guards CLI en `seo_optimizer.py` y `brand_voice_analyzer.py`: `-h/--help` y
  `FileNotFoundError → exit 1` con mensaje (antes: traceback crudo).
- Docs no-técnicas mínimas: `CHANGELOG.md` básico desde `git log` (19-writer).
  `README.md` ya existía; no se tocó contenido custom.

No aplicado a propósito: stack menor node (pnpm-lock ya sucio, riesgo) — solo python
sin `requirements.txt`/`pyproject`, nada que actualizar. Vault (`99-VAULT`) tratado
como NOT source of truth: solo lectura para inventario, sin cambios.

## 3. Gaps — triaje A/B/C (muchos esperados: 0 tests, scripts auxiliares)

### A — arreglar antes de confiar en los scripts
- **A1. `except Exception` ciegos ×9 (BLE001)**: `api_validator.py:89,157`,
  `match_skills.py:149,159`, `orchestrate.py:48`, `scan_registry.py:148,158,297,313`.
  Riesgo: fallos silenciosos en validación/registry. → acotar a
  `(OSError, json.JSONDecodeError, UnicodeDecodeError)` + log.
- **A2. `try-except-pass` silenciosos ×2 (S110)**: `scan_registry.py:297,313`
  (carga de hashes/registry). → loggear warning.
- **A3. `subprocess.run` sin `check` (PLW1510)**: `match_skills.py:135`. → `check=False`
  explícito o manejo de returncode.
- **A4. Sin tests python (0 collected)**. Scripts sin red de seguridad; cualquier refactor
  futuro es a ciegas. → `tests/test_smoke_py_scripts.py` mínimo (compile + `--help` +
  run de `seo_optimizer`/`brand_voice_analyzer` sobre fixture).

### B — deuda real, sin urgencia
- **B1. `datetime.now()` naive ×8 + `fromtimestamp` ×1 (DTZ005/006)**:
  `rest-api-template.py` (template, 7×), `scan_registry.py:321,353`. → `datetime.now(timezone.utc)`.
- **B2. `Optional` implícito ×8 (RUF013)**: defaults `= None` sin `| None` en
  `seo_optimizer.py`, `match_skills.py`, `optimize-prompt.py`. → anotar `T | None`.
- **B3. `Query()` en defaults (B008)**: `rest-api-template.py:102` (solo template, no runtime).
- **B4. Variables sin uso (F841)**: `scan_registry.py:267-268` (`has_scripts`, `has_refs`).
- **B5. Falta `LICENSE` (package.json declara MIT, sin archivo) y `CONTRIBUTING.md`.**
- **B6. Sin `requirements.txt`/`pyproject` para los scripts** (hoy corren con stdlib;
  `rest-api-template.py` y `optimize-prompt.py` importan `fastapi`/`numpy` no declarados).

### C — cosmético / aceptable
- **C1.** `rest-api-template.py`: import `Depends` sin uso residual (F401, verificar a mano:
  es template, puede ser intencional).
- **C2.** Contenido 09-product/21-content mínimo: `docs/plans/master-plan.md` existe;
  faltaría one-pager de producto y guía de contenido mínima — generado solo CHANGELOG
  en esta pasada por alcance nocturno.

## 4. Kanban — DRY-RUN (sin mover nada, sin crear issues)

```
TODO        : A1 A2 A3 A4 B1 B2 B4 B6
DOING       : (vacío — auditoría no toma trabajo)
DONE        : baseline ruff/pytest · ruff --fix ×74 · guards --help ×2 ·
              CHANGELOG.md · smoke verificado
WON'T/ACEPT.: C1 C2 (revisar con owner), B5 (requiere decisión legal/contrib)
```

Regla: A1–A4 entran primero en el próximo ciclo; B en tanda de deuda; nada se borra
sin autorización (archivos legacy/custom intactos).

## 5. Staleness / fidelity (audit-scoring adaptado)

- Cobertura: full sobre python (8/8 archivos). TS/Rust fuera de alcance → marcado
  `stale/no-correspond` para esos roles, no bloquea este reporte.
- Fidelity mecánica: citas `archivo:línea` verificadas por `ruff --statistics` + `grep`
  (32 restantes reproducibles); smoke post-fix OK. `fidelity_baja` NO aplica al subset
  python; global del repo queda UNVERIFIED por alcance parcial.

## 6. Auto-recovery log

| Error | Retry/fallback | Resultado |
|---|---|---|
| `find E:/social-pip -name *.py` timeout 180s (node_modules) | fallback `git ls-files "*.py"` | 8 archivos OK |
| `pytest` raíz timeout 120s | retry scoped ×1 + fallback `py_compile` | 0 tests / COMPILE_OK |
| `ruff` 105 errores | `--fix` ×2 + `py_compile` re-check | 74 fijos, COMPILE_OK |
| CLI `--help` traceback | fix + smoke ×3 (`--help`, missing, run real) | OK |

Nada quedó roto: `py_compile` OK tras cada mutación; custom preservado (solo
adiciones/guards, 0 borrados).
