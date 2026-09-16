# 06 — Mapa de docs (índice)

Baseline numerado (este set) + docs temáticos existentes. Índice canónico
completo: `docs/README.md`.

## Baseline (leer en orden)

| # | Archivo | Contenido |
|---|---|---|
| 00 | `00-que-es.md` | Qué es, propuesta de valor, componentes, estado |
| 01 | `01-stack.md` | Stack runtime + tooling + Python aux |
| 02 | `02-arquitectura.md` | Topología, decisiones, flujo schedule→post |
| 03 | `03-modulos.md` | Inventario de carpetas del repo |
| 04 | `04-funciones.md` | Funciones producto + no-funciones |
| 05 | `05-desarrollo.md` | Setup, comandos, convenciones |
| 06 | este archivo | Mapa e índice |
| 07 | `07-repos-relacionados.md` | Repos similares (social auto-poster, stealth) |

## Docs temáticos (existentes)

- Producto: `product-one-pager.md`, `general-socialpip.md`, `manual-operativo.md`.
- Contenido IA: `ai-content-style-guide.md`, `prompts-structure.md`.
- Calidad: `DOCUMENTATION-IMPROVEMENTS.md`, `error-handling.md`,
  `monitoring-alerts.md`, `security.md`.
- Subcarpetas: `architecture/`, `platforms/`, `tools/`, `workflows/`,
  `n8n-workflows/`, `configs/`, `protocols/`, `mcp/`, `setup/`, `anti-ban/`,
  `research/`, `plans/`, `audits/`, `automation/`, `data-management/`,
  `sectors/`, `templates/`, `testing/`.

## Sectores (Fase 2 — plan-accion-2026-09-12)

Templates JSON por sector en `docs/sectors/<sector>/templates.json`. Gate
`6/6 JSONs` se verifica con `pytest tests/test_sector_templates.py`.

- `inmobiliario/` — propiedades, inversión
- `esoterismo/` — tarot, rituales
- `digital/` — cursos, productos digitales
- `gastronomia/` — platos signature, delivery/picadas
- `estetica/` — tratamientos, productos
- `productos/` — e-commerce genérico, regalos

Fuente: `docs/templates/sector-templates.md` (narrativa) + JSON (forma
máquina-amigable consumida por scripts/generadores).
