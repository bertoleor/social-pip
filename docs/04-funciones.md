# 04 — Funciones (qué hace el producto)

Funcionalidad a nivel producto. El detalle operativo vive en
`docs/manual-operativo.md` y `docs/workflows/`.

## 1. Composer + calendario

- Crear/editar posts multiformato (texto, imagen, video) con guía de estilo
  (`docs/ai-content-style-guide.md`, `docs/prompts-structure.md`).
- Calendario de programación (`react-big-calendar`): arrastrar, reprogramar,
  vista multi-cuenta.
- Validación con Zod antes de persistir.

## 2. Scheduling y publicación

- Programación por fecha/hora + timezone (date-fns).
- Publicación vía adapter API o vía extensión browser.
- Reintentos y manejo de errores (`docs/error-handling.md`).
- Batch posting para colas de contenido.

## 3. Warmup y anti-ban

- Calentamiento progresivo de cuentas nuevas (workflows n8n).
- Patrones de comportamiento humano: delays, jitter, rotación
  (`docs/anti-ban-patterns.md`, `docs/anti-ban/`).
- Estrategia específica Facebook (`docs/anti-ban/facebook-anti-ban-strategy.md`).

## 4. Analytics y monitoreo

- Dashboards con recharts: alcance, engagement, performance por plataforma.
- Alertas y monitoreo (`docs/monitoring-alerts.md`).

## 5. Marketing / leads

- Workflows de outreach y captación (`docs/workflows/` → marketing).
- Integración con marketplace AR (`docs/research/marketplace-argentina.md`).

## 6. Contenido con IA

- Generación asistida por agentes OpenCode + skills (`docs/mcp/skills.md`).
- Templates + Manual de Marca (`docs/workflows/templates-workflows.md`).
- Specs de medios 2026 (`docs/research/media-specifications-2026.md`).

## No-funciones (fuera de alcance actual)

- No es SaaS multi-tenant; es single-user local.
- Sin app mobile (solo desktop + extensión Chrome).
- `core/`, `ui/`, `templates/` reservados, sin implementación.
