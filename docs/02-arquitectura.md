# 02 — Arquitectura
> Parte de: [[README]] · Relacionados: [[01-stack]] · [[03-modulos]]

## Topología

```
┌─────────────────────┐     ┌──────────────────────┐
│  apps/desktop       │     │  apps/extension      │
│  Tauri 2 + React 19 │◄───►│  Chrome (CRXJS)      │
│  calendario/composer│     │  content scripts     │
│  analytics          │     │  posting vía web     │
└────────┬────────────┘     └──────────┬───────────┘
         │ Prisma (SQLite)             │ native-messaging
         ▼                             ▼
┌─────────────────────┐     ┌──────────────────────┐
│ packages/database   │     │  n8n workflows       │
│ schema + seed +     │◄───►│  posting / warmup /  │
│ migraciones         │     │  batch / analytics   │
└─────────────────────┘     └──────────────────────┘
         ▲
         │ tipos compartidos
┌─────────────────────┐
│ packages/types      │
└─────────────────────┘
```

## Decisiones clave

- **Local-first**: SQLite + Prisma. Sin backend SaaS; los datos quedan en la máquina.
- **Monorepo pnpm + turbo**: `apps/*`, `packages/*`; `@social-pip/types` como contrato.
- **Dos vías de publicación**: API oficial donde existe, extensión browser (content
  scripts + native messaging) donde no hay API o conviene stealth.
- **Orquestación fuera del runtime**: n8n maneja scheduling/warmup/reintentos;
  el desktop es UI + estado, no cron.
- **Agentes OpenCode**: operan n8n y contenido vía custom tools y MCP
  (`docs/architecture/opencode-n8n-architecture.md`, `docs/tools/`).

## Documentación de arquitectura existente

- `docs/architecture/main-architecture.md` — visión general del sistema.
- `docs/architecture/database-schema.md` — schema Prisma + SQLite.
- `docs/architecture/project-structure.md` — estructura + Scope Rule.
- `docs/architecture/security-system.md` — seguridad.
- `docs/architecture/opencode-server.md`, `n8n-rest-api.md` — APIs.
- `docs/protocols/gentleman-protocols.md` — Scope Rule, SDD, TDD, GGA.

## Flujo de datos típico (schedule → post)

1. Usuario crea/edita post en el composer (desktop, Zustand + React Query).
2. Se persiste en SQLite vía Prisma (`packages/database`).
3. Un workflow n8n (scheduler) levanta el post vencido.
4. Publica por adapter API o delega a la extensión (content script).
5. Resultado + métricas vuelven a SQLite; analytics los visualiza (recharts).
