# Stack Tecnológico — Social-Pip

## Principio: 100% Gratis y Open Source

Todas las herramientas elegidas son gratuitas, open source, y no requieren suscripciones ni APIs de pago.

---

## Arquitectura Híbrida: Desktop App + Chrome Extension

### ¿Por qué esta arquitectura?

| Componente | Ventaja |
|------------|---------|
| **Desktop App (Tauri)** | UI rica y completa, gestión de perfiles, scheduler avanzado, base de datos local, multi-cuenta, anti-ban engine en Rust |
| **Chrome Extension** | Acceso a DOM de plataformas, usa sesión ya autenticada, sin APIs oficiales, anti-ban más fácil |

### Comunicación: Native Messaging API

```
Extension (Service Worker)
    │
    │ runtime.connectNative('com.socialpip.host')
    ▼
Native Messaging Host (stdin/stdout JSON)
    │
    ▼
Desktop Application (Tauri/Rust)
```

**Ventajas:**
- Seguro: Chrome valida extensión, sin exposición de red
- Confiable: Comunicación directa de procesos
- No requiere puertos ni firewall

---

## Decisiones Tomadas

### 1. Tauri 2.0 sobre Electron

**Por qué Tauri:**
- **RAM**: 50-150MB vs 800MB+ de Electron
- **Binary**: 600KB-3MB vs 150MB+ de Electron
- **Seguridad**: Usa WebView del OS (patches más rápidos)
- **Backend**: Rust (memory-safe, alta performance)
- **Anti-detección**: Proceso ligero es más difícil de detectar

**Por qué NO Electron:**
- Las plataformas YA detectan Electron apps
- Instagram, Twitter/X, LinkedIn tienen heurísticas para automation
- Chromium embebido = red flag para anti-bot systems

**Comparación:**

| Métrica | Tauri 2.0 | Electron 33+ |
|---------|-----------|--------------|
| Binary Size | 600KB - 3MB | 150MB - 200MB+ |
| RAM Idle | 50-150MB | 300-600MB |
| RAM Under Load | 200-400MB | 800MB - 1.5GB+ |
| CPU Overhead | Mínimo (Rust) | Alto (V8 + Node) |
| Startup Time | Instant | 2-5 segundos |
| WebView | OS-native | Bundled Chromium |

### 2. React 19 + TypeScript para Frontend

**Por qué:**
- React 19 con Compiler (no useMemo/useCallback needed)
- TypeScript para type safety en IPC messages
- Tailwind CSS 4 para estilos modernos
- Zustand 5 para estado (simple, sin boilerplate)

### 3. Rust para Backend

**Por qué:**
- Memory-safe por diseño
- Motor anti-ban eficiente (CPU fingerprint mínimo)
- tokio runtime para async/scheduler
- SQLite directo sin ORM overhead

### 4. Chrome Extension MV3

**Por qué:**
- Requerido por Chrome (MV2 deprecado)
- Service Worker (ephemeral, event-driven)
- Content Scripts para DOM manipulation
- Native Messaging para comunicación con Desktop

### 5. SQLite como Base de Datos

**Por qué:**
- Sin servidor de base de datos
- Single file, fácil backup
- Suficiente para uso local
- Tauri plugin oficial

### 6. Monorepo con pnpm + Turborepo

**Por qué:**
- Código compartido entre app y extension
- Type safety end-to-end
- Build paralelo rápido
- Dependencias compartidas

---

## Dependencias Principales

### Desktop App (Tauri)

```toml
# Cargo.toml (Rust)
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
```

```json
// package.json (Frontend)
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@types/react": "^19.0.0"
  }
}
```

### Chrome Extension

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

### Shared Packages

```json
// packages/shared-types
{
  "dependencies": {
    "zod": "^4.0.0"
  }
}
```

---

## Estructura de Base de Datos (SQLite)

### Tabla: accounts

```sql
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    chrome_profile_path TEXT NOT NULL,
    status TEXT DEFAULT 'inactive', -- active, inactive, restricted, warming_up
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    warmup_progress INTEGER DEFAULT 0, -- 0-100
    restrictions_count INTEGER DEFAULT 0,
    daily_posts_count INTEGER DEFAULT 0,
    last_reset_date DATE
);
```

### Tabla: platforms_config

```sql
CREATE TABLE platforms_config (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    max_posts_per_day INTEGER,
    min_delay_seconds INTEGER,
    max_delay_seconds INTEGER,
    batch_size INTEGER,
    batch_break_minutes INTEGER,
    max_images INTEGER,
    max_video_minutes INTEGER,
    max_text_length INTEGER,
    supports_stories BOOLEAN,
    supports_carousel BOOLEAN,
    max_hashtags INTEGER,
    supports_links BOOLEAN
);
```

### Tabla: groups

```sql
CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    platform TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    sector TEXT, -- inmobiliario, esoterismo, etc.
    status TEXT DEFAULT 'active', -- active, pending, restricted
    last_posted_at TIMESTAMP,
    posts_count INTEGER DEFAULT 0,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: templates

```sql
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    platforms TEXT NOT NULL, -- JSON array
    content TEXT, -- Template con placeholders
    variants TEXT, -- JSON array de variantes
    image_paths TEXT, -- JSON array
    include_link BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Tabla: scheduled_tasks

```sql
CREATE TABLE scheduled_tasks (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    template_id TEXT REFERENCES templates(id),
    platform TEXT NOT NULL,
    target_type TEXT NOT NULL, -- group, feed, story, marketplace
    target_id TEXT, -- group URL, etc.
    scheduled_for TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    content TEXT,
    media_paths TEXT, -- JSON array
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    result_url TEXT
);
```

### Tabla: posts_log

```sql
CREATE TABLE posts_log (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES scheduled_tasks(id),
    account_id TEXT REFERENCES accounts(id),
    platform TEXT NOT NULL,
    action TEXT NOT NULL, -- post, story, marketplace, comment
    target TEXT,
    status TEXT NOT NULL, -- success, failed, skipped
    content_preview TEXT,
    post_url TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: anti_ban_events

```sql
CREATE TABLE anti_ban_events (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    event_type TEXT NOT NULL, -- delay_applied, rate_limit, batch_break, warning_detected
    details TEXT, -- JSON
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: settings

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## IPC Messages (TypeScript)

### packages/shared-types/src/messages.ts

```typescript
export interface ExecuteTaskMessage {
  type: 'EXECUTE_TASK';
  payload: {
    taskId: string;
    platform: Platform;
    action: PlatformAction;
    target: string;
    content?: PostContent;
    mediaPaths?: string[];
    accountId: string;
    antiBanProfile: AntiBanProfile;
  };
}

export interface TaskResultMessage {
  type: 'TASK_RESULT';
  payload: {
    taskId: string;
    success: boolean;
    error?: string;
    screenshot?: string;
    postUrl?: string;
    timestamp: number;
  };
}

export interface PlatformStatusMessage {
  type: 'PLATFORM_STATUS';
  payload: {
    platform: Platform;
    accountId: string;
    status: 'connected' | 'disconnected' | 'error';
    lastActivity?: number;
  };
}

export type Platform = 
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'threads'
  | 'telegram'
  | 'whatsapp';

export type PlatformAction =
  | 'post_feed'
  | 'post_story'
  | 'post_reel'
  | 'post_marketplace'
  | 'post_group';

export interface PostContent {
  text: string;
  hashtags?: string[];
  link?: string;
  location?: string;
}

export interface AntiBanProfile {
  minDelayMs: number;
  maxDelayMs: number;
  humanLikeTyping: boolean;
  scrollBeforeAction: boolean;
  jitterPercentage: number;
}
```

---

## Configuración de Perfiles Chrome

### Gestión de Multi-Cuenta

Cada cuenta usa un perfil de Chrome separado:

```
Desktop App mantiene registro de perfiles:
┌─────────────────────────────────────────────┐
│ Perfil 1: "Personal"                        │
│ ├── Instagram: @user1 (sessionid: abc123)   │
│ └── Twitter: @user1                         │
│                                             │
│ Perfil 2: "Business"                        │
│ ├── Instagram: @brand1 (sessionid: def456)  │
│ └── LinkedIn: company/brand1                │
└─────────────────────────────────────────────┘

Cada Chrome profile corre la extensión:
Profile 1 extension → envía "abc123" → mapeado a Perfil 1
Profile 2 extension → envía "def456" → mapeado a Perfil 2
```

### Detección de Perfil Activo

```typescript
// Extension: detectar perfil actual
async function detectCurrentProfile(): Promise<string> {
  const cookies = await chrome.cookies.getAll({ 
    url: 'https://instagram.com' 
  });
  const sessionId = cookies.find(c => c.name === 'sessionid')?.value;
  return sessionId;
}
```

---

## Native Messaging Setup

### Manifest del Host (Windows)

Ubicación: `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.socialpip.host.json`

```json
{
  "name": "com.socialpip.host",
  "description": "Social-Pip Native Messaging Host",
  "path": "C:\\Program Files\\Social-Pip\\native-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://EXTENSION_ID_HERE/"
  ]
}
```

### Protocolo

- Mensajes: JSON objects
- Formato: 4-byte length prefix + JSON payload
- Max mensaje FROM host: 1 MB
- Max mensaje TO host: 64 MB

---

## Anti-Ban Engine (Rust)

### src-tauri/src/anti_ban.rs

```rust
use rand::Rng;
use chrono::{DateTime, Duration, Utc};

pub struct AntiBanEngine {
    config: AntiBanConfig,
    history: Vec<ActionRecord>,
}

#[derive(Debug, Clone)]
pub struct AntiBanConfig {
    pub min_action_delay_ms: u64,
    pub max_action_delay_ms: u64,
    pub hourly_action_limit: u32,
    pub daily_action_limit: u32,
    pub session_gap_min_minutes: u64,
    pub human_like_typing: bool,
    pub jitter_percentage: f32,
}

impl AntiBanEngine {
    pub fn next_action_time(&self) -> DateTime<Utc> {
        let base_delay = self.random_delay();
        let jitter = self.calculate_jitter(base_delay);
        Utc::now() + Duration::milliseconds((base_delay + jitter) as i64)
    }

    pub fn can_execute(&self, action_type: ActionType) -> Result<(), BanRisk> {
        // Check hourly limit
        let recent = self.count_actions_last_hour();
        if recent >= self.config.hourly_action_limit {
            return Err(BanRisk::HourlyLimitExceeded);
        }

        // Check daily limit
        let today = self.count_actions_today();
        if today >= self.config.daily_action_limit {
            return Err(BanRisk::DailyLimitExceeded);
        }

        // Check burst pattern
        if self.detect_burst_pattern() {
            return Err(BanRisk::BurstPattern);
        }

        Ok(())
    }

    pub fn typing_delay(&self, text: &str) -> Vec<u64> {
        text.chars().map(|c| {
            let base = self.config.min_action_delay_ms / 10;
            let variance = self.rng.gen_range(0..base);
            
            // Longer delays for punctuation
            if c == '.' || c == ',' || c == '!' {
                base * 3 + variance
            } else {
                base + variance
            }
        }).collect()
    }
}
```

---

## Scheduler (Rust)

### src-tauri/src/scheduler.rs

```rust
use tokio_cron_scheduler::{Job, JobScheduler};
use chrono::DateTime;

pub struct TaskScheduler {
    scheduler: JobScheduler,
    db: Database,
}

impl TaskScheduler {
    pub async fn schedule_task(&self, task: ScheduledTask) -> Result<(), Error> {
        let job = Job::new_async(task.cron_expression(), |uuid, mut l| {
            let task_id = task.id.clone();
            async move {
                // Execute task
                let result = execute_scheduled_task(&task_id).await;
                
                // Log result
                log_task_result(&task_id, result).await;
            }
        })?;
        
        self.scheduler.add(job).await?;
        Ok(())
    }
}
```

---

## Hosting — 100% Local y Gratuito

**Opción recomendada**: Ejecutar en la PC del usuario.

- **IP residencial** por defecto
- **Device fingerprint genuino**
- **Costo**: $0
- **Riesgo de ban**: MÍNIMO

**NO USAR**: VPS sin proxy residencial, PaaS, servicios de pago.

---

## Próximos Pasos

1. ✅ Investigación completada
2. ✅ Arquitectura definida
3. ⏳ Crear estructura de monorepo
4. ⏳ Bootstrap Tauri 2.0 app
5. ⏳ Bootstrap Chrome Extension MV3
6. ⏳ Implementar Native Messaging
7. ⏳ POC Facebook Groups
