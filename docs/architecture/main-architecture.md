# Social-Pip: Arquitectura Principal
> Parte de: [[README]] · Relacionados: [[ai-integration]] · [[database-schema]] · [[n8n-rest-api]]

## Visión General del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TAURI 2.0 DESKTOP APP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              FRONTEND (React 19 + Next.js 16.2 WebView)        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐      │   │
│  │  │ Calendar UI │ │ Dashboard   │ │ Account Manager     │      │   │
│  │  │ react-big-  │ │ (Recharts)  │ │ (Multi-account)     │      │   │
│  │  │ calendar    │ │             │ │                     │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │ IPC (Tauri invoke)                   │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RUST BACKEND (Tauri 2.0)                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐      │   │
│  │  │ Scheduler  │ │ Anti-Ban    │ │ SQLite DB           │      │   │
│  │  │ (tokio-    │ │ Engine      │ │ (tauri-plugin-sql)   │      │   │
│  │  │ cron)      │ │             │ │                     │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐      │   │
│  │  │ AI Service  │ │ Native     │ │ Crypto/Stronghold   │      │   │
│  │  │ (NVIDIA NIM│ │ Messaging  │ │                     │      │   │
│  │  │ Ollama)     │ │ Host       │ │                     │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ Native Messaging
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION MV3                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   SERVICE WORKER                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐      │   │
│  │  │ Task Queue  │ │ Message    │ │ Profile Manager     │      │   │
│  │  │             │ │ Router     │ │                     │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │ chrome.tabs.sendMessage            │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              CONTENT SCRIPTS (por plataforma)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │   │
│  │  │Facebook │ │Instagram│ │ TikTok  │ │Twitter  │              │   │
│  │  │Groups   │ │Feed/Stories│ │Video   │ │         │              │   │
│  │  │Marketplace│ │Reels    │ │         │ │         │              │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Capas del Sistema

### 1. Frontend (React 19 + Next.js WebView)

**Tecnologías:**
- React 19.0.0 (ejecutado en WebView de Tauri)
- Next.js 16.2 (opcional, para desarrollo web)
- TypeScript 5.7+
- Tailwind CSS 4
- Zustand 5 (state management)
- TanStack React Query
- react-big-calendar

**Propósito:** Interfaz de usuario rica para gestión de cuentas, calendario de publicaciones, dashboard de analytics, editor de templates.

**Componentes principales:**
```typescript
// UI Components disponibles
- Dashboard (métricas en tiempo real)
- Account Manager (gestión multi-cuenta)
- Calendar Scheduler (calendario visual)
- Template Editor (editor de templates por sector)
- AntiBan Config (configuración anti-ban)
- Logs Viewer (logs de ejecución)
```

### 2. Backend (Rust + Tauri 2.0)

**Tecnologías:**
- Rust 1.70+
- Tauri 2.0
- tokio (async runtime)
- tokio-cron-scheduler (scheduling)
- tauri-plugin-sql (SQLite)
- tauri-plugin-stronghold (encriptación)

**Propósito:** Lógica de negocio, scheduling, anti-ban engine, gestión de base de datos, comunicación con Chrome Extension.

**Módulos del Backend:**
```rust
// src-tauri/src/
├── main.rs                 // Entry point
├── lib.rs                  // Tauri commands
├── database/              // Prisma + SQLite
│   ├── mod.rs
│   └── queries.rs
├── scheduler/             // Scheduling de posts
│   ├── mod.rs
│   └── cron.rs
├── anti_ban/              // Motor anti-ban
│   ├── mod.rs
│   ├── delays.rs
│   └── rate_limiter.rs
├── ai_service/            // AI integration
│   ├── mod.rs
│   ├── nvidia_nim.rs
│   └── ollama.rs
└── native_messaging/       // Comunicación con extension
    ├── mod.rs
    └── host.rs
```

### 3. Browser Layer (Chrome Extension MV3)

**Tecnologías:**
- Chrome Extension Manifest V3
- Service Worker (background)
- Content Scripts (por plataforma)
- Native Messaging (comunicación con Tauri)

**Propósito:** Automatización real del browser para posting, scraping, interacción con plataformas.

**Estructura:**
```
apps/extension/
├── manifest.json          # Manifest V3
├── src/
│   ├── background/
│   │   ├── index.ts      # Service Worker
│   │   ├── native-connector.ts
│   │   ├── message-router.ts
│   │   └── task-queue.ts
│   ├── content/
│   │   ├── facebook/
│   │   │   ├── groups.ts
│   │   │   ├── marketplace.ts
│   │   │   └── feed.ts
│   │   ├── instagram/
│   │   ├── tiktok/
│   │   ├── twitter/
│   │   └── ...
│   ├── popup/
│   │   ├── App.tsx
│   │   └── components/
│   └── shared/
└── public/
```

### 4. AI Layer

**Proveedores soportados:**
- **NVIDIA NIM** (API gratuita) - modelos como llama-3.1, mixtral, nemotron
- **Ollama** (local, 100% gratis) - modelos locales como llama3.2, qwen2.5

**Propósito:** Generación de captions, análisis de contenido, aplicación de Manual de Marca.

### 5. Data Layer

**Base de datos:**
- SQLite (local, vía tauri-plugin-sql)
- Prisma como ORM

**Modelos principales:**
```prisma
model Account {
  id        String   @id @default(uuid())
  platform  Platform
  name      String
  cookies   String?  // encrypted
  status    AccountStatus
  createdAt DateTime @default(now())
}

model Post {
  id          String     @id @default(uuid())
  accountId   String
  content    String
  media      String?
  status     PostStatus
  scheduledAt DateTime?
  publishedAt DateTime?
}

model Schedule {
  id        String        @id @default(uuid())
  name      String
  posts    Post[]
  cron     String
  enabled  Boolean
}
```

---

## Flujo de Comunicación

### 1. Frontend → Backend (Tauri IPC)

```typescript
// Desde React
import { invoke } from '@tauri-apps/api/core'

// Crear post
await invoke('create_post', {
  accountId: 'uuid',
  content: 'Mi caption',
  scheduledAt: '2026-04-10T09:00:00Z'
})

// Obtener cuentas
const accounts = await invoke('get_accounts')
```

### 2. Backend → Chrome Extension (Native Messaging)

```rust
// En Rust (Tauri)
use tauri::Emitter;

app.emit("to-extension", payload).unwrap();

// En Extension (background)
chrome.runtime.onMessage.addListener((message) => {
  if (message.target === "background") {
    handleTask(message.data);
  }
});
```

### 3. Chrome Extension → Plataformas (Content Scripts)

```typescript
// Content script para Facebook
document.querySelector('[data-pagelet="FeedUnit"]')?.click();
```

---

## Integración con OpenCode + n8n

### Flujo completo:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   OpenCode  │───▶│     n8n     │───▶│   Tauri     │
│   (AI +     │    │ (Workflow  │    │  (Backend)  │
│   Strategy) │    │   Engine)  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  Chrome    │
                                       │  Extension │
                                       │  (Posting) │
                                       └─────────────┘
```

### APIs de comunicación:

**OpenCode → n8n:**
- REST API: `POST /rest/workflows`
- Webhooks: `POST /webhook/:path`

**n8n → OpenCode:**
- HTTP Request: `POST http://localhost:4096/session/:id/message`

**Tauri → Chrome Extension:**
- Native Messaging (JSON via stdin/stdout)

---

## Seguridad

### 1. Encriptación
- Cookies y tokens encriptados con **tauri-plugin-stronghold**
- SQLite con encryption opcional

### 2. Rate Limiting
- Implementado en Rust anti-ban engine
- Límites por plataforma configurable

### 3. Anti-Ban
- Delays con jitter
- Human-like typing
- Rotación de patrones de comportamiento

---

## Deployment

### Desarrollo:
```bash
# Desktop App
cd apps/desktop
pnpm tauri dev

# Extension (cargar en chrome://extensions)
cd apps/extension
pnpm build
```

### Producción:
```bash
# Build desktop
cd apps/desktop
pnpm tauri build
```

---

*Última actualización: Abril 2026*
*Stack: Tauri 2.0 + React 19 + Rust + SQLite + Chrome Extension MV3*