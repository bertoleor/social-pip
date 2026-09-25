# Proposal: Docs Healthcheck (micro-feature docs-only de ejemplo)

> Change de ejemplo para ejercitar la cadena SDD sin tocar codigo
> productivo. Alcance 100% docs.

## Intent

Los docs baseline `docs/00-07` se desactualizan en silencio cuando cambia el
repo (stack, modulos, comandos). Esta micro-feature define —solo a nivel
especificacion— un chequeo de frescura que cruza cada doc baseline contra su
fuente de verdad y reporta desvios. Sin implementar nada: deja la
cadena SDD (proposal → spec → tasks) completa y lista como plantilla.

## Scope

### In Scope

- Especificar que verifica cada doc `00-07` y contra que fuente.
- Especificar formato del reporte de desvios (tabla por doc + veredicto).
- Plantilla reutilizable para futuros changes docs-only.

### Out of Scope

- Implementar script/herramienta alguna (cero codigo productivo).
- Modificar el contenido de `docs/00-07` (solo se los referencia).
- CI, hooks, automatizacion del chequeo (trabajo futuro).

## Capabilities

### New Capabilities

- `docs-healthcheck-spec`: definicion verificable de frescura docs-only para
  el baseline `docs/00-07`, sin codigo asociado.

### Modified Capabilities

- Ninguna.

## Approach

Tres artefactos bajo `docs/sdd-ejemplo/`: `proposal.md` (este archivo),
`spec.md` (requisitos + escenarios), `tasks.md` (pasos de redaccion y
verificacion manual). Verificacion = revision humana contra checklist, no
tests ejecutables (no hay codigo que testear).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `docs/sdd-ejemplo/proposal.md` | New | este archivo |
| `docs/sdd-ejemplo/spec.md` | New | requisitos + escenarios |
| `docs/sdd-ejemplo/tasks.md` | New | pasos + verificacion manual |
| `docs/00-07` | Read-only | fuentes referenciadas, no modificadas |
| Codigo productivo | Ninguno | prohibido por alcance docs-only |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| La spec se desincroniza del repo real | Media | cada requisito cita su fuente de verdad |
| Se usa como excusa para saltear TDD en codigo | Baja | alcance declara explicito "docs-only, sin codigo" |

## Rollback Plan

Borrar `docs/sdd-ejemplo/`. Sin codigo ni config tocados, rollback trivial.

## Dependencies

- Ninguna. Solo lectura de `docs/00-07` y de `openspec.config.yaml`.

## Success Criteria

- [ ] `docs/sdd-ejemplo/` contiene proposal + spec + tasks coherentes
- [ ] Cada requisito de spec es verificable por revision humana
- [ ] Cero archivos fuera de `docs/` creados o modificados
