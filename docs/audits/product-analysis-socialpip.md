# Análisis de producto — SOCIAL-PIP (adaptado)

Estado: **UNVERIFIED / DRY-RUN** — lectura de docs + baseline python, nada commiteado, nada borrado.
Fecha: sep 2026. Fuente: `docs/` + `docs/audits/general-socialpip.md` + `docs/plans/master-plan.md` + `docs/plans/tech-stack.md`.

## 1. Qué es

Social-Pip es un sistema **100% open source y gratuito** de automatización de publicación en social media para Argentina/LATAM. Multi-plataforma (Facebook, Instagram, TikTok, Twitter/X, LinkedIn, Threads, Telegram, WhatsApp), multi-cuenta, anti-ban avanzado, templates por sector. Arquitectura híbrida **Desktop App (Tauri 2.0) + Chrome Extension (MV3)**.

> Principio rector (del master-plan): **cero costos** — todo gratis, open source, ejecutable en la PC del usuario.

## 2. Stack (frente a la propuesta de valor "cero costo")

| Capa | Tecnología | Licencia | Costo |
|---|---|---|---|
| Desktop | Tauri 2.0 | Apache-2.0 | $0 |
| Frontend | React 19 + TS | MIT | $0 |
| Estilos | Tailwind 4 | MIT | $0 |
| Estado | Zustand 5 | MIT | $0 |
| Backend | Rust | Apache-2.0 | $0 |
| DB | SQLite (tauri-plugin-sql) | Public Domain | $0 |
| Scheduler | tokio-cron-scheduler | MIT | $0 |
| Anti-ban | Rust engine (custom) | Custom | $0 |
| Encriptación | tauri-plugin-stronghold | MIT | $0 |
| Extension | Chrome MV3 | — | $0 |

Coherente con la visión: todas las piezas son libres y sin costo. El anti-ban engine es la única pieza "custom" (propio, no dependencia paga).

## 3. Diferenciador técnico: Tauri sobre Electron

Decisión ya justificada en `tech-stack.md`, y es el núcleo de la apuesta anti-ban:
- RAM 50–150MB vs 800MB+ de Electron; binary 600KB–3MB vs 150MB+.
- WebView del OS (no Chromium embebido) → **menos firma detectable** por heurísticas anti-bot de Instagram/X/LinkedIn.
- Rust backend memory-safe + anti-ban engine eficiente (mínimo CPU fingerprint).

## 4. Modelo de ejecución híbrido

```
Chrome Extension (Service Worker)
   └─ runtime.connectNative('com.socialpip.host')
        └─ Native Messaging Host (stdin/stdout JSON)
             └─ Desktop App (Tauri/Rust)
```

Ventaja: usa la **sesión ya autenticada** del navegador, sin APIs oficiales de pago ni cuentas bot; sin puertos ni firewall; comunicación local cifrada por Chrome.

## 5. Estado del repo (reality-check)

| Dimensión | Datos |
|---|---|
| Lenguajes | 311 md, 161 ts, 120 tsx, 52 rs, **8 py** (los py son scripts auxiliares de skills) |
| Manager | pnpm 9.15 (workspace monorepo), turbo 2.3 |
| Node | >=20 |
| Rust | apps/desktop/src-tauri |
| Python | **no** es parte del producto runtime; scripts auxiliares en `skills/*/scripts/*.py` |

> Implicancia de producto: Python NO es el stack de shipping del producto (el producto es TS/Rust). Los scripts python son herramientas de soporte (SEO optimizer, brand voice analyzer, orchestrator, prompt optimizer). La baseline python cubre *estos* auxiliares, no el core.

## 6. Fase de madurez por área

| Área | Estado (de docs) |
|---|---|
| Producto/visión | Documentado (master-plan, tech-stack) |
| Arquitectura | Documentada (architecture/, platforms/) |
| Workflows/n8n | Documentado (workflows/, n8n-workflows/) |
| Testing | Estrategia documentada, suite TS (Vitest/Rust/E2E) — **suite python inexistente (0 tests)** |
| Auxiliares python | Rotos en `--help`, sin red de seguridad, `except Exception` ciegos ×9 |

## 7. Gaps de producto (no solo de código)

- **One-pager de producto** ausente: no hay un único doc "qué es/para quién/cómo arranca" de cara a usuario final; la info está dispersa en master-plan + README + QUICKSTART.
- **Guía de contenido por sector** mínima: `docs/sectors/` y `docs/automation/` **vacías**; los templates por sector prometidos en la visión no están documentados.
- **Python sin requirements/pyproject**: `rest-api-template.py` y `optimize-prompt.py` importan `fastapi`/`numpy` no declarados (solo `agent-orchestrator/scripts/requirements.txt` con `pyyaml`).
- **LICENSE ausente** pese a que package.json declara MIT; **CONTRIBUTING.md** ausente (importante en un proyecto "open source").
- **Docs sueltas en raíz**: `PROMPT-SDD-AUTOMATICO.md`, `PROMPT-SDD-COMPLETE.md`, `QUICKSTART.md` fuera de `docs/` (ver AGENTS.md sección Docs).

## 8. Normalización de carpetas docs

- `docs/` ya está en minúsculas (estándar OK). No hay variante `Docs/`/`DOCS/`.
- Subcarpetas de `docs/` todas estándar: `architecture/`, `platforms/`, `tools/`, `workflows/`, `configs/`, `protocols/`, `mcp/`, `setup/`, `anti-ban/`, `research/`, `plans/`, `audits/`, `templates/`, `testing/`, `data-management/`, `automation/`, `sectors/`, `n8n-workflows/`.
- **Sin cambios requeridos** en nombres de carpetas de docs.

## 9. Baseline python — resultado de la corrida

| Check | Resultado |
|---|---|
| `ruff check` (7 scripts activos) | **22 errores restantes**: BLE001 ×7, RUF013 ×8, S110 ×2, F841 ×2, DTZ005 ×1, DTZ006 ×1, PLW1510 ×1 |
| `ruff --fix` | 0 autofixables nuevos (autofixables ya agotados en pasada previa) |
| `py_compile` 6/6 | OK |
| `pytest --collect-only` | **0 tests** (sin suite) |
| Smoke `scan_registry.py` | OK (ime registry JSON) |
| Smoke `seo_optimizer.py --help` | OK (guard ya fixeado) |
| Smoke `brand_voice_analyzer.py --help` | OK |
| Smoke `orchestrate.py` | OK (error JSON controlado sin skills) |
| Smoke `match_skills.py --help` | OK (JSON 0 matched) |
| Smoke `optimize-prompt.py --help` | OK (corre cleanup de ejemplo) |

Skills SAFE: `ruff 0.16.7`, `pytest 9.1.1`.

## 10. Kanban

```
TODO        : A1 except Exception ciegos ×7 · A2 try-except-pass ×2 ·
              A3 subprocess sin check ×1 · A4 tests python 0 ·
              B1 datetime naive ×2 · B2 RUF013 Optional ×8 · B4 F841 ×2
DOING       : (vacío)
DONE        : análisis producto · baseline ruff/pytest · py_compile OK ·
              smoke 6/6 · ruff.toml + pytest.ini + pre-commit + gga py
WON'T       : docs raíz (requiere decisión de mover PROMPT-SDD/QUICKSTART)
```

Nada borrado. Nada commiteado.