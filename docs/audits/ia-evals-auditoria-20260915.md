# Auditoría — Evals y datasets mínimos IA (Propuesta 3)
> Parte de: [[README]] · Relacionados: [[general-socialpip]] · [[ia-propuesta-2026-09-14]] · [[product-analysis-socialpip]]

Estado: **VERIFIED (implementación base) / UNVERIFIED (adopción del flujo — espera LGTM humano)**
Fecha: 15 de septiembre de 2026
Ticket: `t_4f143f7b` [SOCIAL-PIP][AUDITORÍA-P1] IA: evals y datasets mínimos
Fuentes: `docs/audits/ia-propuesta-2026-09-14.md` (Propuesta 3), `data/social-pip.db`, `pytest` verde.

## Hallazgo original

Sin evals ni datasets propios, cada mejora de IA (caption generator, hashtag strategist, prompt tuning) es opinión: no se puede saber si un cambio mejora o regresa. Testing con estrategia documentada pero suite inexistente sobre outputs de IA.

## Qué se implementó (slice MVP de la propuesta)

1. **Tabla `ai_evals` en SQLite local** — `scripts/ai_evals_schema.sql` (idempotente, `CREATE TABLE IF NOT EXISTS` + índice `(sector, fecha)`; down documentado en comentario). Campos: `fecha, sector, plataforma, prompt_id, output, brand_check (0/1), like_humano (0/1/NULL)`. Aplicada a `data/social-pip.db` (2026-09-15).
2. **Job/reporte semanal** — `scripts/ai_evals_report.py --db <path> [--week YYYY-Www]` (default: última semana ISO completa). Reporta por sector: n, tasa de pasa-validador de marca y like-rate humano (los `NULL` = pendientes de revisión no cuentan en denominador). Solo lee; nunca escribe. Exit 2 con mensaje claro si la tabla no existe.
3. **Tests TDD estricto** — `tests/test_ai_evals.py`: rojo ejecutado primero (4 fallos: script y SQL inexistentes), verde mínimo (4/4), triangulación incluida (filtro de semana ISO lunes-domingo; semana anterior no contamina; pendiente-revisión excluido del like-rate). Suite completa: **10/10 verde**.

## Verificación (evidencia)

```
python -m pytest -q                → 10 passed (incluye 4 nuevos ai_evals)
sqlite3 data/social-pip.db → tabla ai_evals creada con CHECK constraints
python scripts/ai_evals_report.py --db data/social-pip.db
→ "2026-W37: sin datos de ai_evals para la semana (2026-09-07..2026-09-13)" (exit 0)
python scripts/ai_evals_report.py --db <db sin tabla> → exit 2 + mensaje instructivo
```

## Datasets mínimos pendientes (decisión humana, no automatizable)

Alcance (a) del ticket cubierto parcialmente: la infraestructura existe; **los datos los tiene que aportar el flujo real + revisión humana**, no se fabrican:

- 50 captions aprobadas/sector — crecen cuando los generators escriban filas en `ai_evals` y un humano marque `like_humano`.
- 200 leads etiquetados y pares outreach A/B — **no implementado**: no hay tabla/señal de outreach en el repo todavía. Queda como follow-up.

## Riesgo

Bajo. Cambios acotados a `scripts/` + `tests/` + `data/social-pip.db` (tabla nueva aditiva, nada modificado). Cero costo, sin dependencias nuevas, sin tocar TS/Rust/UI. El riesgo real es el del naysayer de la propuesta: si nadie etiqueta, el dataset se pudre — el gate humano es revisar que el flujo cueste <5 min/semana antes de adoptarlo.

## Qué sigue (propuesto, no ejecutado)

1. **LGTM humano** sobre el envelope del ciclo → tarjeta a done.
2. Ticket build: conectar `Brand Rules Validator` a un hook que inserte filas en `ai_evals` por cada caption generado (TS/Rust side, escribe vía tauri-plugin-sql).
3. Ticket follow-up: datasets de leads etiquetados y outreach A/B (fuera de scope hoy, sin tabla origen).
4. Cron semanal opcional que invoque `ai_evals_report.py` y suba output al digest.
