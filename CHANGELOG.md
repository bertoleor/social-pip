# Changelog — social-pip

> **Busqueda:** keywords: `changelog, releases, social-pip` · clasificacion: `changelog` · estado: canonico · actualizado: 2026-09-25

## [Unreleased]
- 2026-09-25: changelog iniciado (P17 doctrina — flota Hermes). Historia previa: ver git log.
- 2026-09-27: DP-01 cerrado (HIGH, toolchain) — scripts 100% pnpm (`--filter`), .gitignore
  bloquea npm lockfiles, job CI `lockfile-hygiene` en pr-checks.yml, gate pytest
  `tests/test_pnpm_only_scripts.py` (c034e8e).
- 2026-09-27: GATE-SEC-SEMANAL — gitleaks full-history: 1 hallazgo real (SERPER_API_KEY
  formato real en history cc7471a9, HEAD ya placeholder; tarjeta `t_sec_serper_hist`
  blocked needs_input), 3 falsos positivos (placeholders docs).
