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
- 2026-10-06: DP-03 cerrado (MED, dependencies) — Prisma ^5.22 → ^6.19.3 en
  packages/database (commit 4f803d5, branch feat/socialpip-prisma-upgrade).
  Auditoría: OSV/npm-audit sin advisories para prisma@5.22.0 ni 6.19.3; obsolescencia
  generacional, no CVEs. Migración testeada: 52/52 tests vitest 4, `prisma validate` +
  `generate` 6.19.3 OK, smoke db push + query runtime (21 tablas SQLite) OK.
  Pendiente follow-up: advisory HIGH source-map-js@1.2.1 (dev, vía vite/postcss,
  CVE-2026-93749) detectado en audit — derivado a 17-ts-zod.
- 2026-10-06: DP-04 cerrado (LOW, dependencies) — Biome ^1.9.4 → ^2.5.15 en
  apps/desktop + apps/extension (commit 9ec9b13, branch feat/socialpip-prisma-upgrade).
  Migración de configs a formato Biome 2 (preset/assist/files.includes) +
  css.parser.tailwindDirectives (Tailwind 4), 5 reglas a11y nuevas pineadas a
  warn, 4 biome-ignore obsoletos removidos, imports reordenados por el
  organizer de Biome 2 (~99 archivos, churn mecánico). Verificado: biome check
  exit 0 ambos apps en ambiente LF canónico, tsc exit 0, 86/86 tests vitest.
  Incluye fix derivado de DP-03: override source-map-js@<1.2.2 → >=1.2.2
  (CVE-2026-93749, dev-only vía vite/postcss) horneado en pnpm-lock.yaml.
