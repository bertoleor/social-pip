# Changelog — Social-Pip
> Parte de: [[README]] · Relacionados: [[STATUS]]

Formato básico generado por auditoría (UNVERIFIED). Fuente: `git log`.

## [Unreleased]

### Open source
- Agregada `LICENSE` (MIT) y `CONTRIBUTING.md` con el flujo de contribución y requisitos de entorno.
- Agregado `.pre-commit-config.yaml` con hooks de ruff, ruff-format, bandit y sanity genéricos.

### Calidad de código (auxiliares Python en `skills/*/scripts/`)
- Lint: `ruff --fix` (144 autofixes) y resolución manual de 63 incumplimientos en 8 archivos —
  datetimes tz-aware, `Optional` explícitos, `except` ciegos acotados, `check=False` en `subprocess`,
  `raise ... from`, y wrapping de líneas. `ruff check` queda en cero errores.
- Guards: manejo de `--help` y `FileNotFoundError` en `brand_voice_analyzer.py` y `seo_optimizer.py`.
- Config: agregados `ruff.toml` (reglas seleccionadas para baseline accionable) y `pytest.ini`
  (scope de tests acotado, sin escaneo de `node_modules`).
- Dependencias: agregados `requirements.txt` y `pyproject.toml` para los auxiliares Python —
  declaran numpy/pyyaml (runtime) y los extras opcionales `api` (fastapi/uvicorn/pydantic[email]),
  `optimize` (numpy) y `orchestrator` (pyyaml), cerrando el gap B6 del audit.
- Tests: nueva suite de smoke tests en `tests/test_smoke_py_scripts.py` — compilación, `--help`,
  runs reales de `seo_optimizer` y retornos JSON controlados de `orchestrate`/`match_skills`.

### Documentación
- `docs/general-socialpip.md`: entrada técnica principal (arquitectura, capas, flujo de datos).
- `docs/product-one-pager.md`: propuesta de valor, audiencia y hoja de ruta de producto.
- `docs/audits/`: análisis de producto y reporte de estilo/marketing.
- `docs/plans/plan-accion-2026-09-12.md`: plan de acción por fases (open source, producto, conversión).

### 2026-09-28 — 677c545
- docs: ORN-190 one-pagers alineados con ORN-188 (base-vs-vision): stack Prisma 6,
  react-big-calendar fuera (DP-05, sin uso), secciones base-vs-vision en
  `docs/ONE-PAGER.md` y `docs/product-one-pager.md`. Gates nuevos en
  `tests/test_one_pager_orn190.py` (3 tests, TDD RED→GREEN, suite 80/80).
- fix(docs): `docs/F0-2026-09-27.md` ref a `CHANGELOG.md` con prefijo `docs/` —
  docs-hygiene rojo en HEAD (regresión del commit F0 83cbf81) → 80/80 verde (t_4705ebd5).

## 2026-04-18 — 0926c27
- fix: resolve extended scope lint warnings.

## 2026-04-17 — e803040
- fix: resolve lint warnings — semantic elements and accessibility.

## 2026-04-17 — 42c7fab
- chore: add biome config and apply consistent formatting.

## 2026-04-15 — d3e51dc
- feat: desktop optimization and e2e testing complete.

## 2026-04-13 — cc7471a
- feat: complete SDD implementation — facebook-publishing-ecosystem,
  image-upload-media, tauri-setup-config.

## 2026-04-11 — f5fa993
- feat: initial commit — Social-Pip desktop application.
