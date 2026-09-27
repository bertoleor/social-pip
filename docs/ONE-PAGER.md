# Social-Pip — One-pager
> Parte de: [[README]] · Relacionados: [[product-one-pager]] · [[00-que-es]]

> Documento único que resume qué es, stack, arquitectura y dónde seguir leyendo.
> Índice completo: `docs/README.md`. Estado: `docs/STATUS.md`.

## Qué es
**Social-Pip** es una herramienta de automatización de redes sociales **100% gratuita**,
self-hosted, orientada a Argentina/LATAM. Permite programar y publicar contenido en
múltiples plataformas desde un solo lugar, sin depender de SaaS de pago (Buffer, Hootsuite).

Ver más: `00-que-es.md`.

## Stack (alto nivel)
| Capa | Tecnología |
|---|---|
| Desktop | Tauri 2 (Rust) + React 19 + TypeScript |
| Estado/Build | Zustand 5 · Vite 6 · pnpm 9 · turbo |
| Datos | Prisma + SQLite (local-first, sin backend SaaS) |
| Extensión | Chrome MV3 (CRXJS), posting vía browser |
| Formularios | Zod 3 · react-big-calendar · recharts |
| Orquestación | n8n workflows + agentes OpenCode/MCP |

Ver detalle verificado: `01-stack.md`.

## Arquitectura (1 minuto)
- **Local-first**: los datos quedan en la máquina (SQLite).
- **Monorepo pnpm + turbo**: `apps/*` (desktop, extension) + `packages/*` (database, types).
- **Dos vías de publicación**: adapter API oficial donde existe; extensión browser
  (content script + native messaging) donde no hay API o conviene stealth.
- **El runtime no es el cron**: n8n maneja scheduling/warmup/reintentos; el desktop es UI + estado.
- **Agentes OpenCode** operan n8n y contenido vía custom tools y MCP.

Ver: `02-arquitectura.md`, `docs/architecture/`.

## Capacidades clave
1. Composer + calendario multi-cuenta (drag & drop, timezone AR).
2. Scheduling y publicación multi-plataforma, con reintentos y batch.
3. Warmup de cuentas y patrones anti-ban (comportamiento humano).
4. Analytics y monitoreo (recharts, alertas).
5. Marketing / leads (outreach) e integración con marketplace AR.
6. Contenido asistido por IA (OpenCode + skills, Manual de Marca).

Ver: `04-funciones.md`, `docs/manual-operativo.md`.

## Estado
MVP en desarrollo (v1.0.0, licencia MIT). Umbrales CI: 80% líneas / 75% ramas /
85% funciones / 80% statements. Ver `docs/STATUS.md`.

## Empezar a leer (orden recomendado)
1. `00-que-es.md` — qué es
2. `01-stack.md` — stack
3. `02-arquitectura.md` — arquitectura
4. `03-modulos.md` — módulos del repo
5. `04-funciones.md` — funciones
6. `05-desarrollo.md` — desarrollo local
7. `06-mapa-docs.md` — mapa de docs (índice canónico: `docs/README.md`)
8. `07-repos-relacionados.md` — repos comparables / stealth