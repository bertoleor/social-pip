# 00 — Qué es Social-Pip
> Parte de: [[README]] · Relacionados: [[04-funciones]] · [[product-one-pager]]

**Social-Pip** es una herramienta de automatización de redes sociales 100% gratuita,
orientada a Argentina/LATAM. Permite programar y publicar contenido en múltiples
plataformas desde un solo lugar, sin depender de SaaS pagos (Buffer, Hootsuite, etc.).

## Propuesta de valor

- **Costo cero**: self-hosted, sin suscripciones. Stack open source.
- **Multi-plataforma**: adapters por red social (ver `04-funciones.md`).
- **Automatización real**: scheduling, warmup de cuentas, batch posting, analytics,
  orquestados con workflows de n8n + agentes OpenCode.
- **Anti-ban**: estrategias de comportamiento humano, rate limits y rotación
  (ver `docs/anti-ban-patterns.md`).

## Componentes (alto nivel)

| Componente | Qué es | Dónde vive |
|---|---|---|
| Desktop app | UI principal: calendario, composer, analytics | `apps/desktop` (Tauri 2 + React 19) |
| Browser extension | Content scripts para postear vía web | `apps/extension` (Chrome, CRXJS) |
| Database | Persistencia local (cuentas, posts, schedules) | `packages/database` (Prisma + SQLite) |
| Shared types | Contratos TS compartidos | `packages/types` |
| Workflows n8n | Orquestación: posting, warmup, leads, métricas | `docs/n8n-workflows/`, `docs/workflows/` |
| Python aux | Scripts auxiliares (SEO, registry scan, API template) | `skills/*/scripts/` |

## Estado actual

MVP en desarrollo (v1.0.0, licencia MIT). Cobertura CI exigida:
80% líneas / 75% ramas / 85% funciones. Detalle de setup en `QUICKSTART.md`.
