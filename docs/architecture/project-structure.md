# Estructura del Proyecto - Social-Pip
> Parte de: [[README]] · Relacionados: [[ai-integration]] · [[database-schema]] · [[main-architecture]]

## Scope Rule

Social-Pip implementa el **Scope Rule** de Gentleman Programming:

> **"Scope determina estructura"**
> - Código usado por **1 feature** → LOCAL dentro de esa feature
> - Código usado por **2+ features** → SHARED/global

---

## Estructura General

```
social-pip/
├── apps/
│   ├── desktop/                    # Tauri 2.0 Desktop App
│   │   ├── src/                    # Frontend: React 19 + TypeScript
│   │   │   ├── components/
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Accounts/
│   │   │   │   ├── Templates/
│   │   │   │   ├── Scheduler/
│   │   │   │   └── AntiBan/
│   │   │   ├── hooks/
│   │   │   ├── stores/             # Zustand
│   │   │   ├── lib/
│   │   │   └── App.tsx
│   │   ├── src-tauri/              # Backend: Rust
│   │   │   ├── src/
│   │   │   │   ├── main.rs         # Entry point
│   │   │   │   ├── lib.rs          # Tauri commands
│   │   │   │   ├── database/      # SQLite + Prisma
│   │   │   │   ├── scheduler/      # tokio-cron-scheduler
│   │   │   │   ├── anti_ban/       # Anti-Ban Engine
│   │   │   │   ├── ai_service/     # NVIDIA NIM + Ollama
│   │   │   │   └── native_messaging/ # Chrome Extension comm
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── extension/                  # Chrome Extension MV3
│       ├── src/
│       │   ├── background/         # Service Worker
│       │   │   ├── index.ts
│       │   │   ├── native-connector.ts
│       │   │   ├── message-router.ts
│       │   │   └── task-queue.ts
│       │   ├── content/            # Platform Executors
│       │   │   ├── facebook/
│       │   │   ├── instagram/
│       │   │   ├── tiktok/
│       │   │   ├── twitter/
│       │   │   └── ...
│       │   ├── popup/              # Popup UI
│       │   │   └── App.tsx
│       │   └── shared/
│       ├── public/
│       │   └── manifest.json
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/               # TypeScript Types
│   │   ├── src/
│   │   │   ├── messages.ts         # IPC Message Types
│   │   │   ├── tasks.ts            # Task Interfaces
│   │   │   ├── accounts.ts         # Account Schemas
│   │   │   └── platforms.ts        # Platform Configs
│   │   └── package.json
│   │
│   ├── database/                   # Prisma Schema
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   └── ui-components/              # Shared UI Components
│       ├── src/
│       │   ├── Button/
│       │   ├── Input/
│       │   ├── Modal/
│       │   └── Toast/
│       └── package.json
│
├── native-host/                    # Native Messaging Host
│   ├── src/
│   │   └── main.rs                 # Minimal host forwarder
│   └── Cargo.toml
│
├── docker-compose.yml              # n8n + servicios
├── .env.example                     # Template de variables
├── biome.json                       # Linting + Formatting
├── tsconfig.json                    # Config base
├── package.json                     # Workspace config
└── turbo.json                       # Turborepo config
```

---

## Estructura Frontend (React + Tauri WebView)

```
apps/desktop/src/
├── app/                            # Páginas principales
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/                 # Layout con sidebar
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Dashboard overview
│   │   ├── accounts/
│   │   │   ├── page.tsx            # Lista de cuentas
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Editar cuenta
│   │   │   └── add/
│   │   │       └── page.tsx        # Agregar cuenta
│   │   ├── posts/
│   │   │   ├── page.tsx            # Lista de posts
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Crear post
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Editar post
│   │   ├── schedule/
│   │   │   └── page.tsx            # Calendario visual
│   │   ├── groups/
│   │   │   └── page.tsx            # Gestión de grupos
│   │   ├── templates/
│   │   │   └── page.tsx            # Editor de templates
│   │   ├── analytics/
│   │   │   └── page.tsx            # Métricas
│   │   └── settings/
│   │       └── page.tsx            # Configuración
│   │
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Landing / Redirect
│
├── features/                       # FEATURES (1 feature = local)
│   ├── accounts/                   # Feature: Accounts
│   │   ├── components/
│   │   │   ├── account-card.tsx
│   │   │   ├── account-form.tsx
│   │   │   └── account-list.tsx
│   │   ├── hooks/
│   │   │   └── use-accounts.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── posts/                      # Feature: Posts
│   │   ├── components/
│   │   │   ├── post-editor.tsx
│   │   │   ├── post-preview.tsx
│   │   │   └── media-upload.tsx
│   │   ├── hooks/
│   │   │   └── use-posts.ts
│   │   └── types/
│   │
│   ├── schedule/                   # Feature: Schedule
│   │   ├── components/
│   │   │   ├── calendar-view.tsx
│   │   │   ├── schedule-form.tsx
│   │   │   └── time-picker.tsx
│   │   └── hooks/
│   │
│   ├── groups/                     # Feature: Groups
│   │   ├── components/
│   │   │   ├── group-list.tsx
│   │   │   ├── group-card.tsx
│   │   │   └── import-groups.tsx
│   │   └── hooks/
│   │
│   └── analytics/                  # Feature: Analytics
│       ├── components/
│       │   ├── charts.tsx
│       │   └── metrics-cards.tsx
│       └── hooks/
│
├── shared/                         # SHARED (2+ features)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   └── calendar/
│   │       └── index.tsx
│   │
│   ├── hooks/                      # Hooks globales
│   │   ├── use-tauri.ts            # IPC wrapper
│   │   └── use-toast.ts
│   │
│   ├── lib/                        # Utilidades globales
│   │   ├── tauri.ts               # Tauri invoke wrapper
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── types/                      # Tipos globales
│       ├── api.ts
│       └── platform.ts
│
└── styles/
    └── globals.css                 # Tailwind CSS 4
```

---

## Estructura Backend (Rust + Tauri)

```
apps/desktop/src-tauri/src/
├── main.rs                         # Entry point
├── lib.rs                          # Tauri commands exports
│
├── database/                       # SQLite + Prisma
│   ├── mod.rs
│   ├── queries.rs                  # Queries específicas
│   └── models.rs                   # Modelos de dominio
│
├── scheduler/                      # tokio-cron-scheduler
│   ├── mod.rs
│   ├── cron.rs                     # Expresiones cron
│   └── tasks.rs                    # Definición de tareas
│
├── anti_ban/                       # Anti-Ban Engine
│   ├── mod.rs
│   ├── delays.rs                   # Delays con jitter
│   ├── rate_limiter.rs             # Rate limiting
│   ├── patterns.rs                 # Patrones humanos
│   └── warmup.rs                   # Warm-up de cuentas
│
├── ai_service/                     # AI Integration
│   ├── mod.rs
│   ├── nvidia_nim.rs               # NVIDIA NIM API
│   └── ollama.rs                   # Ollama local
│
├── native_messaging/               # Chrome Extension comm
│   ├── mod.rs
│   ├── host.rs                     # Native messaging host
│   └── protocol.rs                 # Protocolo de mensajes
│
└── commands/                       # Tauri commands (IPC)
    ├── mod.rs
    ├── accounts.rs
    ├── posts.rs
    ├── schedule.rs
    └── groups.rs
```

### Cargo.toml (dependencias principales)

```toml
[dependencies]
tauri = "2.0"
tauri-plugin-sql = "2.0"
tauri-plugin-stronghold = "2.0"
tokio = { version = "1", features = ["full"] }
tokio-cron-scheduler = "0.13"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = "0.4"
rand = "0.8"
reqwest = "0.12"
```

---

## Estructura Chrome Extension

```
apps/extension/src/
├── background/                      # Service Worker (MV3)
│   ├── index.ts                    # Entry point
│   ├── native-connector.ts         # Native Messaging client
│   ├── message-router.ts           # Routing de mensajes
│   ├── task-queue.ts               # Cola de tareas
│   └── profile-detector.ts         # Detección de perfil activo
│
├── content/                        # Content Scripts por plataforma
│   ├── facebook/
│   │   ├── groups.ts               # Posting en grupos
│   │   ├── marketplace.ts          # Listings
│   │   ├── feed.ts                 # Feed posting
│   │   └── selectors.ts            # CSS selectors
│   │
│   ├── instagram/
│   │   ├── feed.ts                 # Feed posts
│   │   ├── stories.ts              # Stories
│   │   ├── reels.ts                # Reels
│   │   └── carousel.ts             # Carousel
│   │
│   ├── tiktok/
│   │   ├── upload.ts               # Video upload
│   │   └── photo-mode.ts           # Photo mode
│   │
│   ├── twitter/
│   │   ├── tweets.ts               # Tweets
│   │   └── threads.ts              # Threads
│   │
│   └── shared/
│       ├── anti-ban.ts             # Delays humanos
│       ├── selectors.ts            # Selectores comunes
│       └── utils.ts                # Helpers
│
├── popup/                          # Popup UI
│   ├── App.tsx
│   ├── components/
│   │   ├── Status.tsx
│   │   ├── AccountSwitch.tsx
│   │   └── QuickAction.tsx
│   └── hooks/
│       └── use-extension.ts
│
└── shared/                         # Código compartido
    ├── types/
    │   ├── messages.ts
    │   └── tasks.ts
    └── constants.ts
```

### manifest.json (MV3)

```json
{
  "manifest_version": 3,
  "name": "Social-Pip",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "storage",
    "nativeMessaging"
  ],
  "host_permissions": [
    "*://*.facebook.com/*",
    "*://*.instagram.com/*",
    "*://*.tiktok.com/*",
    "*://*.twitter.com/*"
  ],
  "background": {
    "service_worker": "background/index.js"
  },
  "content_scripts": [{
    "matches": ["*://*.facebook.com/*"],
    "js": ["content/facebook/index.js"]
  }]
}
```

---

## Aplicación del Scope Rule

### Ejemplo 1: Componente de Calendar

```typescript
// ❌ INCORRECTO - "porque podría reutilizarse"
// apps/desktop/src/components/calendar/calendar.tsx

// ✅ CORRECTO - según Scope Rule
apps/desktop/src/features/schedule/components/calendar-view.tsx
// ^ Solo usado por schedule feature → LOCAL

apps/desktop/src/shared/components/calendar/index.tsx
// ^ Usado por schedule Y analytics → SHARED
```

### Ejemplo 2: Hook de Tauri

```typescript
// ❌ INCORRECTO
apps/desktop/src/hooks/use-api.ts  // Too generic

// ✅ CORRECTO
apps/desktop/src/features/accounts/hooks/use-accounts.ts
// ^ Solo para accounts

apps/desktop/src/shared/hooks/use-tauri.ts
// ^ Usado por accounts, posts, schedule, groups → SHARED
```

### Ejemplo 3: Módulo de Rust

```rust
// ❌ INCORRECTO
src/commands/general_commands.rs  // Too generic

// ✅ CORRECTO
src/commands/accounts.rs           // Solo para accounts

src/database/mod.rs               // Usado por todos → SHARED
```

---

## Convenciones de Naming

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Archivos | **kebab-case** | `user-service.ts`, `auth.helper.ts` |
| Componentes React | **PascalCase** | `UserProfile.tsx` |
| Funciones | **camelCase** | `get_user_by_id()` |
| Constantes | **UPPER_SNAKE_CASE** | `MAX_RETRIES` |
| Clases Rust | **PascalCase** | `UserService` |
| Traits Rust | **PascalCase** | `AntiBanEngine` |
| Módulos Rust | **snake_case** | `anti_ban.rs` |
| Enums | **PascalCase** | `PostStatus.DRAFT` |
| Rutas Next.js | **kebab-case** | `account-settings.tsx` |

---

## Archivo por Archivo

### Frontend (TypeScript/React)
- Componentes: `.tsx`
- Lógica: `.ts`
- Estilos: `.module.css` o Tailwind classes
- Tests: `.test.tsx` o `.spec.tsx`

### Backend (Rust)
- Módulos: `mod.rs` + `.rs` files
- Comandos: `commands/*.rs`
- Tests: `mod.rs` con `#[cfg(test)]`
- Cargo: `Cargo.toml`

### Chrome Extension
- Content Scripts: `.ts` → compilado a `.js`
- Service Worker: `.ts` → `.js`
- Popup: `.tsx` → `.js`

---

## Referencias

- Tauri 2.0: https://v2.tauri.app/
- React 19: https://react.dev/
- Rust: https://doc.rust-lang.org/
- Chrome Extension MV3: https://developer.chrome.com/docs/extensions/mv3
- Scope Rule: https://mintlify.com/Gentleman-Programming/gentleman-architecture-agents/concepts/scope-rule