# Tasks: Docs Healthcheck (docs-only)
> Parte de: [[README]] · Relacionados: [[proposal]] · [[spec]]

> Sin RED/GREEN ejecutable: no hay codigo. La "verificacion" es revision
> humana con checklist. Estimacion total: 30-45 min de lectura.

## Phase 1: Redaccion (esta entrega)

- [x] 1.1 `docs/sdd-ejemplo/proposal.md` — intent, scope, capabilities, riesgos
- [x] 1.2 `docs/sdd-ejemplo/spec.md` — 4 requisitos + escenarios verificables
- [x] 1.3 `docs/sdd-ejemplo/tasks.md` — este archivo

## Phase 2: Verificacion manual (revisor humano)

- [ ] 2.1 Leer `proposal.md` y confirmar: alcance docs-only explicito, sin codigo
- [ ] 2.2 Por cada requisito de `spec.md`, confirmar que es auditable a ojo
  (fuente citada existe, escenario GIVEN/WHEN/THEN cerrado)
- [ ] 2.3 Confirmar coherencia cruzada proposal <-> spec <-> tasks
  (capabilities de proposal cubiertas por requisitos de spec)
- [ ] 2.4 Confirmar cero archivos fuera de `docs/`:
  `git status --short` no muestra nada fuera de `docs/sdd-ejemplo/`

## Phase 3: Auditoria piloto (opcional, usa la spec)

- [ ] 3.1 Aplicar la tabla de fuentes a `docs/00-07` y llenar un reporte
  Doc | Estado | Fuente contrastada | Porque
- [ ] 3.2 Si algun doc da `partial`, abrir follow-up (no tocarlo en este change)

## Delivery

- [ ] 4.1 Commit acotado a `docs/sdd-ejemplo/` (nunca fuera de `docs/`)
- [ ] 4.2 No requiere tests, lint ni CI (no hay codigo)
