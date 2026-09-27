# Social-Pip — Estado
> Parte de: [[README]] · Relacionados: [[CHANGELOG]] · [[00-que-es]]

> Fecha de cierre del reporte: sep-2026. Fuente: repo `E:/social-pip`.
> Resumen de una página: `docs/ONE-PAGER.md`. Índice: `docs/README.md`.

## Estado del proyecto
MVP en desarrollo. **v1.0.0** (licencia MIT). Stage: Backlog / iteración en curso.

- Propósito: automatización de redes sociales gratuita, self-hosted, para Argentina/LATAM.
- Stack: Tauri 2 + React 19 + Prisma/SQLite, extensión Chrome MV3, orquestación n8n + OpenCode.
- Single-user local; fuera de alcance: multi-tenant SaaS y app mobile.

## Umbrales CI (acuerdo)
| Métrica | Umbral |
|---|---|
| Lines | 80% |
| Branches | 75% |
| Functions | 85% |
| Statements | 80% |

CI los aplica en cada push y PR.

## Documentación
La carpeta `docs/` está consolidada en un baseline numerado (00–07) que se lee en
orden, más subcarpetas temáticas (`architecture/`, `setup/`, `workflows/`,
`n8n-workflows/`, `mcp/`, `anti-ban/`, `research/`, `plans/`, `audits/`, etc.).
Índice canónico: `docs/README.md`. Mapa: `docs/06-mapa-docs.md`.

## Hechos verificados en este turno (ORN-89)
- Baseline `docs/00-*.md` … `docs/07-*.md` presente en working tree (stats de stack
  y módulos contrastados con `package.json` / `pyproject.toml` según lo declarado
  en `01-stack.md` y `03-modulos.md`).
- `docs/sectors/` referenciado en `06-mapa-docs.md` no contiene archivos al 2026-09.
- Se agregó `docs/ONE-PAGER.md` (resumen) y `docs/STATUS.md` (este archivo).

## Notas
- Repos comparables y tooling stealth documentados en `07-repos-relacionados.md`
  (links verificados por web al redactar; re-validar antes de citar externamente).
- No se tocó lógica, schema, migraciones ni deploys en este turno.