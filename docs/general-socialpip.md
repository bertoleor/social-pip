# Social-Pip — Documentación técnica general
> Parte de: [[README]] · Relacionados: [[00-que-es]] · [[02-arquitectura]]

> Entrada principal para quien quiera entender, correr o contribuir al proyecto.
> Si venís por primera vez acá, leé este archivo de arriba a abajo y después saltá
> a los documentos enlazados al final.

---

## Qué es Social-Pip

Social-Pip es una automatización de redes sociales **100% gratuita y open source**
pensada para Argentina y LATAM. Corre **localmente en tu propia computadora**, usa
tu navegador y tu IP residencial reales, y te deja programar y publicar en varias
plataformas sin pagar suscripciones en dólares ni entregar tus cuentas a una nube
de terceros.

Principio rector: **cero costos**. Gratis, open source, ejecutable en tu PC.

El ejecutable de producción es **TypeScript + Rust**. Los scripts en `skills/` son
auxiliares (mayormente Python) y **no** forman parte del runtime del producto.

---

## Arquitectura (resumen)

El sistema tiene cuatro capas que se comunican entre sí:

```
┌────────────────────────────────────────────────────────────┐
│  apps/desktop  —  Tauri 2.0 desktop app                    │
│  ┌──────────────────────────────────────────────┐          │
│  │  Frontend  React 19 + TypeScript + Vite 6    │          │
│  │             (Zustand, TanStack Query, Tailwind 4)        │
│  └──────────────┬───────────────────────────────┘          │
│                 │  IPC (Tauri invoke)                       │
│  ┌──────────────▼───────────────────────────────┐          │
│  │  Backend  Rust (rusqlite / SQLite)           │          │
│  │  scheduler · anti_ban · ai_service ·         │          │
│  │  outbox/saga/DLQ · circuit_breaker · mcp     │          │
│  └──────────────┬───────────────────────────────┘          │
└─────────────────┼───────────────────────────────────────────┘
                  │  Native Messaging (JSON)
┌─────────────────▼───────────────────────────────────────────┐
│  apps/extension  —  Chrome Extension MV3                    │
│  ┌──────────────┬───────────────────────────────┐          │
│  │  background  │ service worker (task queue)   │          │
│  │  content     │ per-platform executors/scrapers│          │
│  │  popup       │ UI ligera                     │          │
│  └──────────────┴───────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Por qué esta división:** la app de escritorio (Tauri) concentra toda la lógica
de negocio, el planificador, el motor anti-ban y la persistencia; la extensión de
Chrome es el "brazo" que ejecuta acciones reales sobre las plataformas usando tu
sesión ya autenticada del navegador. Ambas se comunican por *Native Messaging*, lo
que mantiene la automatización del browser aislada del backend.

---

## Desglose de módulos

### `apps/desktop` — App de escritorio

```
apps/desktop/
├── src/                       # Frontend React + TypeScript
│   ├── components/            # atoms / molecules / organisms / templates
│   ├── hooks/                 # hooks de React
│   ├── pages/                 # vistas principales
│   ├── routes/                # routing (react-router)
│   ├── stores/                # estado global (Zustand 5)
│   ├── lib/                   # utilidades + schemas (Zod)
│   ├── types/                 # tipos locales
│   ├── e2e/  e2e-playwright/  # pruebas end-to-end (Playwright)
│   └── test/                  # fixtures, mocks, integración, visual, performance
└── src-tauri/                 # Backend Rust
    ├── src/
    │   ├── lib.rs / main.rs   # entry point y comandos Tauri
    │   ├── commands/          # account, post, posting, scheduler, task,
    │   │                      #   template, media, secure_storage, error
    │   ├── database/          # SQLite (rusqlite) + modelos + recovery
    │   ├── executor/          # ejecución de trabajos
    │   ├── scheduler.rs       # planificador (tokio-cron-scheduler)
    │   ├── anti_ban.rs        # motor anti-ban
    │   ├── ai_service.rs      # integración de IA (NVIDIA NIM / Ollama)
    │   ├── native_messaging.rs# comunicación con la extensión
    │   ├── browser/           # lanzador + handshake del browser
    │   └── ... capa de resiliencia (ver abajo)
    ├── Cargo.toml
    └── tauri.conf.json
```

**Capa de resiliencia del backend** (una de las señas del proyecto): además del
CRUD y el planificador, el backend Rust implementa patrones de sistemas
distribuidos para que una automatización de larga duración no pierda trabajo ni
corrompa estado:

- **Outbox + Saga + Dead Letter Queue** — entrega confiable de tareas y operaciones
  multi-paso con compensación en caso de fallo.
- **Idempotency** — evita ejecución duplicada de tareas ante reintentos o crashes.
- **Circuit breaker / bulkhead / cooldown** — aísla fallos de plataforma y de cuenta.
- **Observabilidad / health_check / alert_system / error_aggregation** — trazas,
  alarmas y deduplicación de errores.
- **secure_storage / keyring** — credenciales y tokens cifrados localmente.

### `apps/extension` — Extensión Chrome (MV3)

```
apps/extension/src/
├── background/index.ts          # service worker
├── content/facebook/            # ejecución y scraping en Facebook
│   ├── scraper/                 # group-scraper, selectors, rate-limit, cache
│   └── index.ts
└── popup/                       # UI de la extensión
```

Hoy la automatización por plataforma está más desarrollada en **Facebook** (grupos,
con scraping y selectores). El resto de las plataformas listadas en la hoja de ruta
van llegando por fases; no asumas que cada uno de los ocho canales tiene ya un
executor completo.

### `packages/` — Código compartido

| Paquete | Qué contiene |
|---------|--------------|
| `@social-pip/types`   | Tipos compartidos: platform, posting, task, media, settings, error (+ módulo **spintax** con parser/validator/rng). |
| `@social-pip/database`| Esquema y cliente **Prisma** (SQLite). |

Lint/typecheck del frontend usa **Biome** (`@biomejs/biome`); el backend usa
`cargo clippy`; los scripts Python usan **ruff**.

---

## Modelo de datos

El esquema Prisma (`packages/database/prisma/schema.prisma`) está pensado para
SQLite (local, Tauri) y describe el dominio completo. Modelos principales:

- **Account** — una cuenta en una plataforma, con estado, fields anti-ban
  (warmup, cooldown, risk), daily/hourly post counts y flags de sesión.
- **Post** — el contenido a publicar, con caption, hashtags, media, retries
  (`retryCount`, `maxRetries`) y metadata de IA.
- **Schedule** — una publicación programada (con `variance` en minutos para no
  publicar siempre a la misma hora exacta).
- **Group / Template** — grupos destino y plantillas por sector (con spintax).
- **PlatformConfig** — límites anti-ban por plataforma (posts/día, delays,
  cooldown, warmup, ventanas horarias, umbrales de riesgo).
- **Outbox / SagaExecution / SagaStep / DeadLetterQueue / ErrorGroup** — la capa
  de resiliencia (ver arriba).
- **AIConfig / AIGenerationLog / EmailConfig / WebhookConfig / Settings** —
  integraciones auxiliares.

> Los enums se modelan como `String` para compatibilidad con SQLite; las listas
> simples (hashtags, mediaUrls, variantes) se guardan como JSON en `String`.

---

## Flujo de datos (end-to-end)

1. **Frontend** (React) invoca un comando Tauri vía `invoke(...)`.
2. **Backend** (Rust) recibe el comando, valida, escribe en SQLite y —si
   corresponde— encola el trabajo en el **outbox** (con su clave de idempotencia).
3. El **scheduler** dispara el trabajo a la hora programada (con `variance`).
4. El backend envía la tarea a la **extensión** por *Native Messaging* (JSON).
5. La extensión ejecuta sobre el navegador usando la sesión real del usuario
   (content scripts / scrapers), respetando los delays y límites del **anti-ban**.
6. El resultado vuelve al backend, que registra el estado, reintenta si hay fallo
   (`retryCount`/`maxRetries`) y —si agota reintentos— lo manda a la **DLQ**.

---

## Setup e instalación

Requisitos: **Node >= 20**, **pnpm >= 9** (fijado `pnpm@9.15.0`), **Python 3.11**
(solo para `skills/`), y **Rust** (para Tauri) si vas a compilar la app de escritorio.

```bash
# 1. Dependencias de todos los workspaces y base de datos
pnpm setup            # = pnpm install && pnpm db:generate && pnpm db:migrate

# 2. App de escritorio (frontend + backend Rust)
pnpm dev:desktop
# o, el frontend solo en http://localhost:1420
pnpm dev

# 3. Extensión de Chrome
pnpm dev:extension
# después: chrome://extensions -> "Developer mode" -> "Load unpacked"
# -> seleccioná apps/extension/dist
```

En Windows podés usar `setup-dev.bat` para un montaje guiado. Guía rápida completa
en `docs/QUICKSTART.md` (incluye troubleshooting de puerto, Rust y DB).

---

## Calidad y testing

```bash
pnpm test            # todos los tests (Vitest) vía turbo
pnpm test:coverage   # cobertura local
pnpm test:e2e        # e2e de la app (Playwright)
pnpm lint            # Biome (frontend) vía turbo
pnpm typecheck       # TypeScript en todos los workspaces

# Rust
cd apps/desktop/src-tauri && cargo check && cargo test && cargo clippy

# Python auxiliar (skills/)
ruff check . && ruff format .
pytest               # scope limitado por pytest.ini a tests/ y skills/*/scripts/
```

**Umbrales de cobertura** (forzados por CI en cada push y PR):

| Métrica   | Umbral |
|-----------|--------|
| Lines     | 80%    |
| Branches  | 75%    |
| Functions | 85%    |
| Statements| 80%    |

---

## Documentación relacionada

| Documento | Para qué sirve |
|-----------|----------------|
| [product-one-pager.md](product-one-pager.md) | Visión de producto para stakeholders (no técnico). |
| [plans/master-plan.md](plans/master-plan.md) | Plan maestro y hoja de ruta detallada. |
| [plans/tech-stack.md](plans/tech-stack.md) | Decisiones de stack. |
| [architecture/main-architecture.md](architecture/main-architecture.md) | Arquitectura en profundidad (diagramas por capa). |
| [architecture/project-structure.md](architecture/project-structure.md) | Estructura de directorios y convenciones (Scope Rule). |
| [architecture/database-schema.md](architecture/database-schema.md) | Esquema de base de datos. |
| [architecture/security-system.md](architecture/security-system.md) | Modelo de seguridad. |
| [anti-ban-patterns.md](anti-ban-patterns.md) | Estrategias anti-ban. |
| [setup/setup-guide.md](setup/setup-guide.md) · [setup/installation.md](setup/installation.md) | Instalación detallada. |
| [platforms/platforms-automation.md](platforms/platforms-automation.md) | Automatización por plataforma. |
| [audits/general-socialpip.md](audits/general-socialpip.md) | Log de auditoría interna (no es doc de producto). |
| `../README.md` | Resumen de alto nivel y badges. |
| `docs/CONTRIBUTING.md` | Cómo contribuir (requisitos, flujo de PR, reporte de issues). |
| `../LICENSE` | Licencia MIT. |
| `../AGENTS.md` | Convenciones para agentes de desarrollo. |
| `docs/QUICKSTART.md` | Arranque rápido en minutos. |

---

*Última actualización: septiembre 2026. Stack verificado contra el código actual:
React 19 + Vite 6 + TypeScript, Tauri 2 + Rust (rusqlite), extensión MV3, Biome,
Prisma/SQLite.*