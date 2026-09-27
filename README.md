> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[INDICE-DOCS]], [[ADR-TEMPLATE]]

# SOCIAL-PIP — Automatización de redes sociales self-hosted para Argentina/LATAM

> Path: `E:/Hermes/projects/social-pip` · Stack: Tauri 2 (Rust) + React 19 + TypeScript + Tailwind 4 + Prisma/SQLite + pnpm 9 monorepo (turbo) · Estado: ACTIVO
> Registry: `E:/Hermes/docs/plans/project-map.md` · Mapa: `E:/Hermes/docs/proyectos/social-pip.md`
> Última verificación: 2026-09-27 (F0 — ver `docs/F0-2026-09-27.md`)

## 1. Qué es
- Automatización de redes sociales 100% gratuita y local (single-user), pensada para Argentina/LATAM.
- Desktop app (Tauri 2 + React 19) + extensión Chrome MV3; orquestación de flujos vía n8n.
- Per ORN-188 (2026-09-27): **social-pip es la visión/docs** — el código base de producción es `auto-poster-stealth` (`E:/sitios web E/auto-poster-stealth`); lo de este repo que ya exista en la base se documenta y referencia.

## 2. Cómo correr
- Requisitos: Node ≥20, pnpm ≥9 (`packageManager: pnpm@9.15.0`), Rust toolchain (para Tauri), Python 3.11 (solo scripts auxiliares/tests).
- `pnpm install` — instala workspaces (monorepo pnpm-only: `package-lock.json` está bloqueado por gitignore y CI gate, DP-01).
- `pnpm dev` — dev de todos los workspaces vía turbo.
- `pnpm start:tauri` — desktop app con Tauri.
- `pnpm setup` — install + `prisma generate` + `prisma migrate`.
- `pnpm test` — tests JS vía turbo (vitest por app; runner instalado en workspaces).
- `python -m pytest tests/ -q` — suite de tests de higiene/docs del repo (python auxiliar).
- `pnpm typecheck` — typecheck de todos los workspaces (o `tsc --noEmit` directo por app).
- `pnpm build` — build vía turbo (incluye compilar Rust/Tauri; lento).
- Tests de coverage local: ver advertencia en §5 — la corrida completa de vitest puede crashear el worker en Windows; el badge viejo de 80% NO es confiable.

## 3. Estructura de carpetas (solo primer nivel)
- `apps/desktop` — la app Tauri 2 (React 19, `src/` frontend, `src-tauri/` Rust con 55 archivos .rs).
- `apps/extension` — extensión Chrome MV3 (React + `@crxjs/vite-plugin`).
- `packages/` — `types` (TS compartido) y `database` (Prisma + SQLite).
- `tests/` — suite de tests python de higiene del repo (10 archivos, e.g. `test_pnpm_only_scripts.py`, `test_docs_hygiene.py`).
- `scripts/` — auxiliares python (ai_evals).
- `skills/` — librería de skills Hermes (243 md) — material operativo, no runtime.
- `docs/` — baseline documental numerado (00-07) + vision/audits/reports/plans/sectors.
- `core/`, `ui/`, `templates/`, `references/`, `openspec/`, `odd/` — vacíos o material heredado.

## 4. Documentación canónica
- Producto (PRD): `docs/product-one-pager.md` / `docs/ONE-PAGER.md` (sin PRD formal).
- Plan activo: `docs/F0-2026-09-27.md` (este inventario F0) · `docs/STATUS.md` · `docs/vision/base-vs-vision.md` (ORN-188).
- ADRs: `docs/audits/` (auditorías de producto/IA; sin ADRs técnicos formales aún).
- Espejo en Hermes: `E:/Hermes/docs/proyectos/social-pip.md`.
- Índice de docs del project: `docs/README.md` + `docs/06-mapa-docs.md`.

## 5. Estado actual (verificado 2026-09-27, F0)
- Rama: `feat/socialpip-prisma-upgrade` (remoto default: `master` en `github.com/bertoleor/social-pip`).
- CI: 3 workflows en `.github/workflows/` (`pr-checks.yml` con coverage gates, `test.yml`, `e2e.yml`) sobre `main`/`develop` — **ojo: la rama default es `master`, las CI corren sobre `main`/`develop`** (verificar qué rama vive realmente). Pre-commit: ruff + bandit + gitleaks (python/sanity; sin hooks biome/node por alcance documentado).
- Typecheck: PASS (desktop y extension, `tsc --noEmit` exit 0).
- Tests python: PASS (suite completa verde).
- Tests JS: **INCONCLUSO local** — corrida completa de vitest crashea el worker en Windows; smoke `App.test.tsx` da 2/5 fallidos (rutas del router). Coverage artifact commiteado: 1.33% lines (el badge de 80% del README viejo no es confiable).
- Seguridad: ORN-201 abierto — 51+ deps HIGH (JS) + 23 crates Rust con findings OSV (6 HIGH); tarea SEC en curso sobre este repo (NO tocar `Cargo.toml`/`Cargo.lock` mientras corre). `pnpm audit` local contra el lockfile de hoy: 0 findings (discrepancia a reconciliar en ORN-201).
- Próximo hito: cierre de ORN-201 (supply chain) + reconciliar coverage real.
- Tickets abiertos: ORN-201 (seguridad deps, en curso por worker SEC), ORN-188 (split base/visión — decidido), ORN-89 (cerrado en review).
