# Changelog — Social-Pip

Formato básico generado por auditoría (UNVERIFIED). Fuente: `git log`.

## [Unreleased]
- Auditoría python-only: baseline ruff/pytest sobre `skills/*/scripts/*.py` (8 archivos).
- Fixes chicos: `ruff --fix` (imports, `list`/`dict` modernos, f-strings); guards `--help` y
  `FileNotFoundError` en `brand_voice_analyzer.py` y `seo_optimizer.py`.
- Gaps abiertos: ver reporte `docs/audits/general-socialpip.md`.

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
