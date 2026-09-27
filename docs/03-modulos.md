# 03 — Módulos del repo
> Parte de: [[README]] · Relacionados: [[02-arquitectura]] · [[04-funciones]]

Inventario verificado del árbol (raíz `E:/social-pip`).

## Apps

- **`apps/desktop`** — App principal Tauri 2 + React 19.
  `src/`: `components/`, `pages/`, `routes/`, `stores/` (Zustand), `hooks/`,
  `lib/`, `types/`, `e2e/` + `e2e-playwright/`, `native-messaging/`,
  `src-tauri/` (shell Rust). Tests: Vitest + Playwright + jest-axe.
- **`apps/extension`** — Extensión Chrome (CRXJS).
  `src/`: `background/`, `content/`, `popup/`, `test/`, `public/`, `manifest.config.ts`.

## Packages

- **`packages/database`** — Prisma + SQLite: `prisma/schema.prisma`, `seed.ts`,
  `dev.db`, `src/`, `test/`. Scripts `prisma:generate|migrate|studio|push`.
- **`packages/types`** — Contratos TS compartidos (`src/`), consumidos como
  `@social-pip/types` (workspace).

## Carpetas raíz (soporte)

| Carpeta | Contenido |
|---|---|
| `core/`, `ui/`, `templates/` | Vacías / reservadas (sin código actual) |
| `skills/` | Skills OpenCode + scripts Python aux (`*/scripts/`) |
| `openspec/` | Specs OpenSpec (`openspec.config.yaml`) |
| `references/` | Material de referencia |
| `scripts/` | Scripts de repo |
| `tests/` | Suite raíz (pytest, `pytest.ini`) |
| `data/` | Datos locales |
| `docs/` | Esta documentación (ver `docs/README.md`, índice canónico) |

## Docs por tema (existen, no duplicar aquí)

- `platforms/` — adapters por red; `workflows/`, `n8n-workflows/` — n8n;
  `mcp/` — MCP/OpenCode; `setup/` — instalación; `configs/` — tsconfig/biome/vitest/CI;
  ` anti-ban/` + `anti-ban-patterns.md` — anti-ban; `research/` — inventario de repos,
  specs de medios, marketplace AR; `plans/` — tech-stack, master-plan;
  `audits/` — auditorías; `automation/`, `data-management/`, `sectors/`,
  `templates/`, `testing/`, `tools/` — guías temáticas.
