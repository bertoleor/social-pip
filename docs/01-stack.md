# 01 — Stack técnico
> Parte de: [[README]] · Relacionados: [[02-arquitectura]] · [[05-desarrollo]]

Verificado contra `package.json`, `apps/*/package.json`, `pyproject.toml`.

## Runtime del producto (TS + Rust)

| Capa | Tecnología | Versión |
|---|---|---|
| Desktop shell | Tauri 2.0 (Rust) | `^2.0.0` CLI |
| Frontend | React 19 + TypeScript 5.7 | `^19.0.0` / `^5.7.0` |
| Build | Vite 6 + turbo 2.3 (monorepo pnpm 9) | `^6.0.0` / `^2.3.0` |
| Estado cliente | Zustand 5 | `^5.0.0` |
| Server state | TanStack React Query 5 | `^5.60.0` |
| Routing | react-router-dom 7 | `^7.14.0` |
| Estilos | Tailwind CSS 4 + tailwind-merge + clsx | `^4.0.0` |
| Forms/validación | Zod 3 | `^3.24.0` |
| Calendario | react-big-calendar | `^1.15.0` |
| Charts | recharts | `^2.15.0` |
| Fechas | date-fns 4 | `^4.1.0` |
| Iconos | lucide-react | `^0.468.0` |
| DB | Prisma + SQLite | ver `packages/database/prisma/schema.prisma` |
| Extensión | CRXJS Vite plugin, `@types/chrome` | `^2.0.0` |

## Tooling

| Uso | Herramienta |
|---|---|
| Lint/format | Biome 1.9 (`biome check`) |
| Unit tests | Vitest 2 + Testing Library + jsdom |
| E2E | Playwright 1.49 (`apps/desktop`) |
| A11y tests | jest-axe |
| Typecheck | `tsc --noEmit` (turbo `typecheck`) |
| Python aux lint/test | ruff + pytest 8 (solo `skills/*/scripts/`) |

## Orquestación / automatización (docs)

- **n8n** (Docker compose): workflows de posting, warmup, batch, marketing, analytics.
- **OpenCode + MCP**: agentes con custom tools y skills (`docs/mcp/`, `skills/`).
- **Node ≥ 20**, pnpm ≥ 9, Rust ≥ 1.70 para desktop.

## Python (solo auxiliares, no runtime)

`requirements.txt`: `numpy`, `pyyaml`. Extras opcionales: `fastapi`,
`uvicorn[standard]`, `pydantic[email]` (template REST), ruff/pytest (dev).
Fuente de verdad de lint/test Python: `ruff.toml` / `pytest.ini`.
