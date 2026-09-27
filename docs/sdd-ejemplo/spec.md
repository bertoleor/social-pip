# Docs Healthcheck — Specification (docs-only)
> Parte de: [[README]] · Relacionados: [[proposal]] · [[tasks]]

## Purpose

Definir que significa "docs baseline frescos" para `docs/00-07`, de modo que
cualquier revisor humano pueda auditarlos sin ejecutar codigo.

## Requirements

### Requirement: Cobertura de chequeo por doc

Cada doc del baseline `00-07` MUST tener una fuente de verdad declarada
contra la cual se audita su frescura.

#### Scenario: Tabla de fuentes completa

- GIVEN la tabla de mas abajo
- WHEN un revisor la recorre
- THEN cada doc `00-07` aparece con su fuente de verdad asociada

| Doc | Fuente de verdad |
|-----|------------------|
| `00-que-es.md` | `README.md`, `package.json` (version), propositos de `apps/*` |
| `01-stack.md` | `package.json`, `apps/*/package.json`, `pyproject.toml`, `requirements.txt` |
| `02-arquitectura.md` | Arbol real de `apps/`, `packages/`, `docs/n8n-workflows/` |
| `03-modulos.md` | `ls` del repo (apps, packages, skills, templates, ui, core) |
| `04-funciones.md` | `docs/manual-operativo.md`, `docs/workflows/` |
| `05-desarrollo.md` | `QUICKSTART.md`, `CONTRIBUTING.md`, scripts de `package.json` |
| `06-mapa-docs.md` | El propio arbol de `docs/` |
| `07-repos-relacionados.md` | Relevamiento web fechado (re-chequeo semestral) |

### Requirement: Veredicto por doc

La auditoria MUST producir un veredicto por doc: `complete`, `partial` o
`missing`, con el porque en una linea.

#### Scenario: Doc desactualizado

- GIVEN `01-stack.md` dice una version vieja de React
- WHEN se audita contra `apps/desktop/package.json`
- THEN el veredicto es `partial` con el porque ("declara React X, repo usa React Y")

#### Scenario: Doc inexistente

- GIVEN falta `docs/04-funciones.md`
- WHEN se audita
- THEN el veredicto es `missing` con el porque ("archivo no existe")

### Requirement: Reporte tabular

El reporte de auditoria MUST ser una tabla con columnas
Doc | Estado | Fuente contrastada | Porque, mas una linea de conclusion global.

#### Scenario: Reporte bien formado

- GIVEN una auditoria terminada
- WHEN se lee el reporte
- THEN tiene una fila por cada doc `00-07` y una conclusion global

### Requirement: Cero codigo

Esta spec MUST NOT exigir implementacion, tests ejecutables, CI ni cambios
en codigo productivo. La verificacion es revision humana.

#### Scenario: Alcance respetado

- GIVEN este change
- WHEN se lista lo entregado
- THEN todo vive bajo `docs/` y no existe codigo nuevo ni modificado
