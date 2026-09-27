# Base vs Visión — división de repos (ORN-188)
> Parte de: [[../README]] · Relacionados: [[../00-que-es]] · [[../STATUS]] · [[../plans/master-plan]]
> **Búsqueda:** keywords: `orn-188, base, vision, repos, auto-poster-stealth` · clasificación: `decision` · estado: `canónico`
> Linear: [ORN-188](https://linear.app/bertoleor/issue/ORN-188/confirmar-base-auto-poster-stealth-espezar-social-pip-como-fuente) (Urgente) · Kanban: t_bfbaa6b8

## Decisión

**auto-poster-stealth** es el **código base** (producción real).
**social-pip** es la **visión / docs** (roadmap, specs, arquitectura objetivo).

El código que corre hoy vive en la base; este repo describe hacia dónde
evoluciona y por qué. No duplicar implementación: cada pieza nueva de
social-pip que ya exista en la base se documenta y se referencia, no se
reescribe.

## Repo base — código (auto-poster-stealth)

- **Path:** `E:/sitios web E/auto-poster-stealth`
- **Qué es:** sistema de publicación automatizada en Facebook Marketplace y
  Grupos con anti-ban avanzado. Monorepo stealth-ops:
  - `web/` — Next.js 16.1.1 + React 19 + Prisma 7 + better-sqlite3,
    dashboard, API, analytics, WebSocket, Swagger.
  - `worker/` — Python: Playwright + nodriver, `anti_ban.py`,
    `anti_ban_nodriver.py`, `harvest_groups*.py`, `marketplace.py`,
    `login_tool.py`, notificaciones SMTP, heartbeat.
- **Stack verificado en disco (2026-09-27):** ver `web/package.json`
  (next 16.1.1, @prisma/client 7.2.0, better-sqlite3 12.5.0) y `worker/`
  (requirements.txt, tests propios).
- **Estado:** production-ready (badge V4.0). Sin git repo propio: es la
  carpeta de trabajo de deploy.

## Repo visión — docs (social-pip)

- **Path:** `E:/Hermes/projects/social-pip` (este repo, remoto
  `github.com/bertoleor/social-pip`).
- **Qué es:** especificación del producto objetivo: Tauri 2 + React 19 +
  SQLite local, extensión Chrome MV3, orquestación n8n + OpenCode,
  multi-plataforma (no solo Facebook). Ver [[../plans/master-plan]] y
  [[../00-que-es]].
- **Qué aporta a la base:** dirección de arquitectura (Rust anti-ban,
  adapters multi-red, extension como puente), docs operativas, research de
  comparables ([[../07-repos-relacionados]]), y el baseline 00–07.
- **Qué NO es:** código ejecutable del producto. No reemplaza a la base.

## Mapa de migración base → visión

| Capa | Base (auto-poster-stealth) | Visión (social-pip) |
|---|---|---|
| UI | Next.js 16 web dashboard | Tauri 2 desktop + Chrome MV3 |
| Posting | Python Playwright/nodriver worker | Rust executor + extension bridge |
| Anti-ban | `anti_ban.py` (heurísticas humanas) | `anti_ban.rs` engine (rate, delays, warmup) |
| DB | Prisma 7 + better-sqlite3 | Prisma + SQLite (tauri-plugin-sql) |
| Alcance | Facebook (Marketplace + Grupos) | Multi-plataforma LATAM |

## Mantenimiento

1. Cambios de arquitectura se deciden aquí (docs) y se implementan en la base.
2. La base se referencia SIEMPRE por path absoluto (arriba) — no por links
   relativos, no está en el mismo árbol.
3. `docs/plans/project-map.md` (workspace Hermes) ya refleja esta división.
