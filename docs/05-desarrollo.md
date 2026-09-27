# 05 — Desarrollo local
> Parte de: [[README]] · Relacionados: [[01-stack]] · [[QUICKSTART]]

## Prerrequisitos

| Software | Versión | Check |
|---|---|---|
| Node.js | ≥ 20 | `node --version` |
| pnpm | ≥ 9 | `pnpm --version` |
| Rust | ≥ 1.70 | `rustc --version` |
| Python | ≥ 3.11 | solo scripts aux |

Windows: MSVC Build Tools + WebView2. macOS: Xcode CLT. Linux: prereqs Tauri.
Guía completa: `docs/QUICKSTART.md` y `docs/setup/`.

## Setup

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm build:extension   # opcional, para la extensión Chrome
```

O en Windows: `setup-dev.bat`. Arranque: `start.bat` / `start-tauri.bat`.

## Comandos diarios (turbo)

```bash
pnpm dev          # todo en modo dev
pnpm build        # build completo
pnpm test         # tests (turbo)
pnpm test:coverage
pnpm lint         # biome check
pnpm typecheck    # tsc --noEmit
```

DB: `pnpm db:generate | db:migrate | db:studio` (delegan a `packages/database`).

## Python aux

```bash
pip install -r requirements.txt   # numpy, pyyaml
pytest                             # suite raíz (pytest.ini)
```

## Convenciones

- **Scope Rule** + SDD/TDD/GGA: `docs/protocols/gentleman-protocols.md`.
- Estructura de código: `docs/architecture/project-structure.md`.
- Contribuir: `docs/CONTRIBUTING.md`. Changelog: `docs/CHANGELOG.md`.
- Umbrales CI: 80% líneas / 75% ramas / 85% funciones / 80% statements.
