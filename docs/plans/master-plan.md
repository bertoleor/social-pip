# Plan Maestro — Social-Pip

## Visión

Sistema **100% open source y gratuito** para automatizar publicación en múltiples plataformas de social media (Facebook, Instagram, TikTok, Twitter/X, LinkedIn, Threads, Telegram, WhatsApp), con soporte multi-cuenta, anti-ban avanzado, templates por sector, y arquitectura híbrida Desktop App + Chrome Extension.

**Principio rector**: Cero costos. Todo gratuito, open source, ejecutable en la PC del usuario.

---

## Stack Tecnológico

| Componente | Tecnología | Licencia | Costo |
|-----------|-----------|----------|-------|
| Desktop Framework | Tauri 2.0 | Apache 2.0 | $0 |
| Frontend | React 19 + TypeScript | MIT | $0 |
| Estilos | Tailwind CSS 4 | MIT | $0 |
| Estado | Zustand 5 | MIT | $0 |
| Extension | Chrome MV3 | - | $0 |
| Extension UI | React + Tailwind | MIT | $0 |
| Backend | Rust | Apache 2.0 | $0 |
| Base de datos | SQLite (tauri-plugin-sql) | Public Domain | $0 |
| Scheduler | tokio-cron-scheduler | MIT | $0 |
| Anti-ban | Rust Engine | Custom | $0 |
| Encriptación | tauri-plugin-stronghold | MIT | $0 |

---

## Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAURI 2.0 DESKTOP APP                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           FRONTEND: React + TypeScript + Tailwind       │    │
│  │  • Dashboard principal (métricas, estado)               │    │
│  │  • Gestión multi-cuenta                                 │    │
│  │  • Editor de templates por sector                       │    │
│  │  • Scheduler visual (calendario)                        │    │
│  │  • Configuración anti-ban                               │    │
│  │  • Logs en tiempo real                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ IPC (Tauri invoke)                │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    RUST BACKEND                          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐    │    │
│  │  │   SQLite    │ │  Scheduler  │ │   Anti-Ban      │    │    │
│  │  │  Database   │ │   (tokio)   │ │   Engine        │    │    │
│  │  │             │ │             │ │ • Delays        │    │    │
│  │  │             │ │             │ │ • Rate limit    │    │    │
│  │  │             │ │             │ │ • Jitter        │    │    │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘    │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │         NATIVE MESSAGING HOST SERVER              │   │    │
│  │  │         (comunicación con extensiones)            │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Native Messaging API
                              │ (JSON stdin/stdout)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION (MV3)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   SERVICE WORKER                         │    │
│  │  • Conexión Native Messaging                            │    │
│  │  • Router de mensajes                                   │    │
│  │  • Queue de tareas pendientes                           │    │
│  │  • Detección de perfil activo                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ chrome.tabs.sendMessage           │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              CONTENT SCRIPTS (por plataforma)            │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │ Facebook│ │Instagram│ │ TikTok  │ │ Twitter │        │    │
│  │  │ Executor│ │ Executor│ │ Executor│ │ Executor│        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │LinkedIn │ │ Threads │ │Telegram │ │WhatsApp │        │    │
│  │  │ Executor│ │ Executor│ │ Executor│ │ Executor│        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   POPUP UI (React)                       │    │
│  │  • Status rápido                                        │    │
│  │  • Switch de cuenta                                     │    │
│  │  • Acción manual rápida                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura del Proyecto (Monorepo)

```
social-pip/
├── apps/
│   ├── desktop/                    # Tauri 2.0 Application
│   │   ├── src/                    # React Frontend
│   │   │   ├── components/
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Accounts/
│   │   │   │   ├── Templates/
│   │   │   │   ├── Scheduler/
│   │   │   │   └── AntiBan/
│   │   │   ├── hooks/
│   │   │   ├── stores/             # Zustand
│   │   │   └── App.tsx
│   │   ├── src-tauri/              # Rust Backend
│   │   │   ├── src/
│   │   │   │   ├── main.rs
│   │   │   │   ├── database/
│   │   │   │   ├── scheduler/
│   │   │   │   ├── anti_ban/
│   │   │   │   ├── native_messaging/
│   │   │   │   └── profiles/
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── extension/                  # Chrome Extension MV3
│       ├── src/
│       │   ├── background/         # Service Worker
│       │   │   ├── native-connector.ts
│       │   │   ├── message-router.ts
│       │   │   └── task-queue.ts
│       │   ├── content/            # Platform Executors
│       │   │   ├── facebook/
│       │   │   │   ├── groups.ts
│       │   │   │   ├── marketplace.ts
│       │   │   │   └── feed.ts
│       │   │   ├── instagram/
│       │   │   ├── tiktok/
│       │   │   ├── twitter/
│       │   │   ├── linkedin/
│       │   │   ├── threads/
│       │   │   ├── telegram/
│       │   │   └── whatsapp/
│       │   ├── popup/              # Popup UI
│       │   │   ├── App.tsx
│       │   │   └── components/
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
│   ├── shared-logic/               # Platform-agnostic Logic
│   │   ├── src/
│   │   │   ├── anti-ban/
│   │   │   │   ├── delays.ts
│   │   │   │   └── patterns.ts
│   │   │   ├── templates/
│   │   │   │   ├── parser.ts
│   │   │   │   └── generator.ts
│   │   │   └── validation/
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
├── package.json                    # Workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── .gitignore
```

---

## Capacidades por Plataforma (2026)

| Plataforma | Imágenes | Video Máx | Texto Máx | Carousel | Stories |
|------------|----------|-----------|-----------|----------|---------|
| **Facebook** | 10 máx | 240 min | 63,206 chars | ✅ | ✅ 24h |
| **Instagram** | 20 máx | 60 min feed, 90s Reels | 2,200 chars | ✅ | ✅ 24h |
| **TikTok** | 35 máx (Photo Mode) | 60 min | 2,200 chars | ✅ Photo Mode | ✅ 24h |
| **Twitter/X** | 4 máx | 4h (Premium) | 280 / 25k chars | ✅ | ❌ |
| **LinkedIn** | 9 máx | 30 min | 3,000 chars | ✅ PDF | ❌ |
| **Threads** | 20 máx | 5 min | 500 chars | ✅ | ❌ |
| **Telegram** | 10 máx | Ilimitado | 4,096 chars | ✅ | ✅ 24h (Premium) |
| **WhatsApp** | 30 máx | Ilimitado | 65,536 chars | ✅ | ✅ Status 24h |

### Notas por Plataforma

- **TikTok**: Photo Mode soporta hasta 35 imágenes en carousel con música
- **Instagram**: Carousel hasta 20 fotos/videos, Reels hasta 90 segundos
- **Twitter/X**: Premium+ permite 25,000 caracteres y videos de 4 horas
- **LinkedIn**: Document carousels via PDF upload
- **Threads**: NO soporta hashtags
- **WhatsApp**: Status tiene límite de 30 slides

---

## Fases de Implementación

### **FASE 0: Setup del Proyecto** (Día 1)
- [ ] Crear monorepo con pnpm + Turborepo
- [ ] Bootstrap Tauri 2.0 app
- [ ] Bootstrap Chrome Extension MV3
- [ ] Configurar shared packages
- [ ] Setup Native Messaging Host template

### **FASE 1: Core Facebook** (Días 2-7)
**POC: Facebook Groups con 1 cuenta**

- [ ] 1.1 Native Messaging bidireccional funcionando
- [ ] 1.2 Extension: Service Worker conecta con Desktop
- [ ] 1.3 Extension: Content Script Facebook básico
- [ ] 1.4 Desktop: UI mínima (status de conexión)
- [ ] 1.5 Posting en 1 grupo de Facebook
- [ ] 1.6 Logs básicos en Desktop

**Entregable**: POC funcional que postea en 1 grupo

### **FASE 2: Anti-Ban Engine** (Días 8-12)
- [ ] 2.1 Rust: Motor de delays con jitter
- [ ] 2.2 Rust: Rate limiting por hora/día
- [ ] 2.3 Rust: Detección de burst patterns
- [ ] 2.4 Extension: Human-like typing delays
- [ ] 2.5 Extension: Scroll aleatorio antes de actions
- [ ] 2.6 Testing: Patrones de timing verificados

**Entregable**: Posts seguros con delays anti-ban

### **FASE 3: Multi-Grupo + Templates** (Días 13-18)
- [ ] 3.1 Desktop: UI lista de grupos (importar URLs)
- [ ] 3.2 Desktop: Editor de templates básico
- [ ] 3.3 Desktop: Caption rotation (3-5 variantes)
- [ ] 3.4 Extension: Posteo secuencial con delays
- [ ] 3.5 Batch breaks cada 5-10 posts
- [ ] 3.6 Logs detallados por grupo

**Entregable**: Posteo automático en múltiples grupos

### **FASE 4: Scheduler** (Días 19-24)
- [ ] 4.1 Rust: tokio-cron-scheduler setup
- [ ] 4.2 Desktop: Calendario visual
- [ ] 4.3 Desktop: Crear tareas programadas
- [ ] 4.4 Desktop: Pause/Resume campaigns
- [ ] 4.5 Persistencia de scheduler en SQLite
- [ ] 4.6 Recovery tras reinicio de app

**Entregable**: Posts programados a hora exacta

### **FASE 5: Multi-Cuenta** (Días 25-32)
- [ ] 5.1 Desktop: Gestión de perfiles Chrome
- [ ] 5.2 Extension: Detección de perfil activo
- [ ] 5.3 Desktop: Switch entre cuentas
- [ ] 5.4 Desktop: Estado por cuenta (activo/inactivo)
- [ ] 5.5 Warm-up tracker para cuentas nuevas
- [ ] 5.6 Rotación de cuentas en scheduler

**Entregable**: Múltiples cuentas gestionadas

### **FASE 6: Facebook Marketplace** (Días 33-40)
- [ ] 6.1 Extension: Content Script Marketplace
- [ ] 6.2 Desktop: Formulario de listing
- [ ] 6.3 Upload múltiple de imágenes
- [ ] 6.4 Categorías Argentina (layout local)
- [ ] 6.5 Delays específicos para Marketplace
- [ ] 6.6 Templates por sector (inmobiliario, etc.)

**Entregable**: Auto-listing en Marketplace Argentina

### **FASE 7: Instagram** (Días 41-50)
- [ ] 7.1 Extension: Content Script Instagram
- [ ] 7.2 Feed posts (imagen + caption)
- [ ] 7.3 Stories (imagen/video)
- [ ] 7.4 Reels upload
- [ ] 7.5 Carousel (hasta 20 imágenes)
- [ ] 7.6 Hashtag limits (30 máx)

**Entregable**: Posting completo en Instagram

### **FASE 8: Resto de Plataformas** (Días 51-70)

| Plataforma | Días | Features |
|------------|------|----------|
| TikTok | 4 | Photo Mode, Video, Stories |
| Twitter/X | 3 | Tweets, Threads, Media |
| LinkedIn | 3 | Posts, Articles, Documents |
| Threads | 2 | Posts, Carousel |
| Telegram | 3 | Channels, Groups, Stories |
| WhatsApp | 4 | Status, Groups, Broadcast |

### **FASE 9: Polish & Testing** (Días 71-80)
- [ ] UI/UX refinements
- [ ] Error handling robusto
- [ ] Testing exhaustivo anti-ban
- [ ] Documentación de usuario
- [ ] Installer Windows/macOS/Linux

---

## Templates por Sector (Argentina/LATAM)

| Sector | Campos | Plataformas Prioritarias |
|--------|--------|-------------------------|
| **Inmobiliario** | título, precio, ubicación, m², habitaciones | FB Groups, MP, Instagram |
| **Esoterismo** | servicio, disponibilidad, contacto | FB Groups, Instagram Stories |
| **Digital** | producto, precio, link, features | FB Groups, Instagram Feed |
| **Comida** | menú, precio, delivery, zona | FB Groups, Instagram Stories, WhatsApp Status |
| **Estética** | servicio, precio, turno, zona | Instagram Feed/Stories, FB Groups |
| **Artículos** | producto, estado, precio, zona | FB MP, FB Groups, Instagram |

---

## Anti-Ban Strategy (Rust Engine)

### Reglas por Plataforma

| Plataforma | Posts/día | Delay Range | Batch Break |
|------------|-----------|-------------|-------------|
| Facebook Groups | 15-20 | 60-240s | Cada 5-10 posts, 15-30min |
| Facebook MP | 5-10 | 30-60s | Cada 5 listings, 15min |
| Instagram Feed | 10-15 | 90-300s | Cada 5 posts, 30min |
| Instagram Stories | 10 | 30-90s | Cada 5 stories, 15min |
| TikTok | 5-10 | 120-300s | Cada 5 posts, 30min |
| Twitter/X | 20-50 | 30-120s | Cada 10 tweets, 20min |

### Human Simulation

- **Typing delays**: 50-150ms por caracter
- **Pausas en puntuación**: 300-500ms extra
- **Scroll antes de action**: 2-5 scrolls aleatorios
- **Mouse movement**: Curvas naturales (Bézier)

---

## Límites de Seguridad por Cuenta

| Acción | Límite | Delay |
|--------|--------|-------|
| Posts en grupos FB | 15-20/día | 60-240s (range) |
| Listings Marketplace | 5-10/día | 30-60s (range) |
| Instagram Feed | 10-15/día | 90-300s (range) |
| Instagram Stories | 10/día | 30-90s (range) |
| TikTok posts | 5-10/día | 120-300s (range) |
| Batch break | Cada 5-10 posts | 15-30 min |

### Cuentas Nuevas (Warm-up)

- **Período**: 2-4 semanas antes de automatizar
- **Semana 1**: 5 posts máximo
- **Semana 2**: 10 posts
- **Semana 3**: 15 posts
- **Semana 4**: Escalar gradualmente a 20

---

## Hosting — 100% Local y Gratuito

**Opción recomendada**: Ejecutar en la PC del usuario.

- **IP residencial** por defecto → plataformas la ven como tráfico normal
- **Device fingerprint genuino** → GPU, resolución, fonts reales
- **Costo**: $0
- **Riesgo de ban**: MÍNIMO

**NO USAR**: VPS sin proxy residencial, PaaS (Railway, Render), servicios de pago.

---

## Próximos Pasos

1. ⏳ Crear estructura de monorepo
2. ⏳ Bootstrap Tauri 2.0 app
3. ⏳ Bootstrap Chrome Extension
4. ⏳ Implementar Native Messaging
5. ⏳ POC Facebook Groups
