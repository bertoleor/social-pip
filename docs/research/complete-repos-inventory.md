# Social-Pip: Inventario de Repos Existentes y Plan de Implementación

## Resumen Ejecutivo

Este documento cataloga TODOS los repositorios GitHub existentes relacionados con automatización de redes sociales, analiza qué tomar de cada uno, qué resolver con n8n, y qué crear desde cero.

**Fuentes consultadas:**
- 40+ repositorios de GitHub analizados
- Documentación previa de Social-Pip
- Repos de automatización conocidos

---

## 1. INVENTARIO COMPLETO DE REPOS EXISTENTES

### 1.1 FACEBOOK GROUPS - AUTOMATION & POSTING

| # | Repo | URL | Stars | Tech | License | Lo mejor |
|---|------|-----|-------|------|---------|----------|
| 1 | adar2/Facebook-Posts-Automation | github.com/adar2/Facebook-Posts-Automation | 125 | Python+Selenium+PyQt5 | GPL-3.0 | GUI completa, scheduling, multi-cuenta, scraping |
| 2 | darideveloper/facebook-groups-post-bot | github.com/darideveloper/facebook-groups-post-bot | 34 | Python+Selenium | MIT ✅ | Búsqueda por keywords, data.json simple |
| 3 | Tigerzplace/FAP-FacebookAutoPoster | github.com/Tigerzplace/FAP-FacebookAutoPoster | 21 | Chrome Extension | Propietaria | Mejor anti-ban del mercado (estudiar, no copiar) |
| 4 | ariknih/autopost-facebook-group | github.com/ariknih/autopost-facebook-group | 1 | Python+Playwright | MIT ✅ | Multi-cuenta, Twitter incluido, Playwright |
| 5 | ByamB4/fb-group-auto-post | github.com/ByamB4/fb-group-auto-post | 11 | Python+Playwright | - | Simple, Playwright con cookies persistentes |
| 6 | HARON416/Facebook-Marketplace-Auto-Poster | github.com/HARON416/Facebook-Marketplace-Auto-Poster | 14 | Go+Rod | Propietaria | Marketplace only, batch processing |
| 7 | Macoy66/facebook-automation | github.com/Macoy66/facebook-automation | 0 | Python | - | Multi-cuenta, comportamiento humano |
| 8 | FacebookToolkit | github.com/warifp/FacebookToolkit | 1.2k | PHP | - | Graph API tools |

### 1.2 FACEBOOK - GROUP HARVESTING (MMBER-style)

| # | Repo | URL | Stars | Tech | Lo mejor |
|---|------|-----|-------|------|----------|
| 1 | darideveloper/facebook-groups-post-bot | github.com/darideveloper/facebook-groups-post-bot | 34 | Python | save_groups.py - búsqueda por keywords |
| 2 | adar2/Facebook-Posts-Automation | github.com/adar2/Facebook-Posts-Automation | 125 | Python | Scraping de miembros de grupos |
| 3 | fb_friend_list_scraper | github.com/n0kovo/fb_friend_list_scraper | 316 | Python | OSINT friend lists sin rate limits |

### 1.3 INSTAGRAM

| # | Repo | URL | Stars | Tech | Lo mejor |
|---|------|-----|-------|------|----------|
| 1 | divoc/instagrapi | github.com/divoc/instagrapi | Popular | Python | API completa, stories, reels, carousel |
| 2 | cporter202/social-media-scraping-apis | github.com/cporter202/social-media-scraping-apis | 1.1k | JavaScript | APIs multi-platform |
| 3 | somiibo/instagram-bot | github.com/somiibo/instagram-bot | 138 | JavaScript | Auto-follow, like, comment |

### 1.4 TIKTOK (Solo browser, NO hay API pública)

| # | Repo | URL | Stars | Tech | Lo mejor |
|---|------|-----|-------|------|----------|
| 1 | haziq-exe/TikTokAutoUploader | github.com/haziq-exe/TikTokAutoUploader | - | - | Video upload automation |
| 2 | somiibo/tiktok-bot | github.com/somiibo/tiktok-bot | 273 | JavaScript | Auto-follow, like, comment |
| 3 | ghostiam/phantomwright | github.com/ghostiam/phantomwright | - | Rust | Stealth browser automation |

### 1.5 TWITTER/X

| # | Repo | URL | Stars | Tech | License | Lo mejor |
|---|------|-----|-------|------|---------|----------|
| 1 | d60/twikit | github.com/d60/twikit | 4.3k | Python | - | API sin API key (usa cookies) |
| 2 | vladkens/twscrape | github.com/vladkens/twscrape | 2.3k | Python | MIT ✅ | Scraper completo, search/profile/tweets |
| 3 | Kr1s77/awesome-python-login-model | github.com/Kr1s77/awesome-python-login-model | 16.2k | Python | - | Login simulation, anti-ban, fingerprint spoofing |
| 4 | trevorhobenshield/twitter-api-client | github.com/trevorhobenshield/twitter-api-client | 1.9k | Python | - | Twitter v1, v2, GraphQL APIs |
| 5 | mahrtayyab/tweety | github.com/mahrtayyab/tweety | 651 | Python | - | Twitter scraper simple |

### 1.6 LINKEDIN

| # | Repo | URL | Stars | Tech | Lo mejor |
|---|------|-----|-------|------|----------|
| 1 | eracle/OpenOutreach | github.com/eracle/OpenOutreach | 1.4k | Python | Playwright-stealth, AI-powered, lead finding |
| 2 | josephlimtech/linkedin-profile-scraper-api | github.com/josephlimtech/linkedin-profile-scraper-api | 751 | TypeScript | Profile scraper JSON |
| 3 | CRAKZOR/linkedin-post-automator | github.com/CRAKZOR/linkedin-post-automator | 97 | Python | Auto-post + ChatGPT |
| 4 | cullenwatson/StaffSpy | github.com/cullenwatson/StaffSpy | 241 | Python | Staff data, experiences, skills |

### 1.7 MULTI-PLATFORM SCHEDULERS

| # | Repo | URL | Stars | Tech | Lo mejor |
|---|------|-----|-------|------|----------|
| 1 | gitroomhq/postiz-app | github.com/gitroomhq/postiz-app | 27.9k | Next.js+NestJS+Prisma | **REFERENCIA PRINCIPAL** - Stack completo |
| 2 | shad712/Social-Media-Mass-Automation-Suite | github.com/shad712/Social-Media-Mass-Automation-Suite | 34 | - | Stealth, proxy rotation, mother-child |
| 3 | Agentfy-io/Agentfy | github.com/Agentfy-io/Agentfy | 391 | Python | Modular microservices multi-platform |

### 1.8 TOOLS & UTILITIES (del nuevo notebook)

| # | Repo | URL | Stars | Tech | License | Lo mejor |
|---|------|-----|-------|------|---------|----------|
| 1 | meitarbe/cognetivy | github.com/meitarbe/cognetivy | - | - | - | Workflow building tool |
| 2 | go-rod/rod | github.com/go-rod/rod | 8.7k | Go | MIT ✅ | Browser automation, alternativa a Puppeteer |
| 3 | passivebot/facebook-marketplace-scraper | github.com/passivebot/facebook-marketplace-scraper | - | Python+Playwright | - | Marketplace scraping con Streamlit |
| 4 | LinkStackOrg/LinkStack | github.com/LinkStackOrg/LinkStack | 5.2k | PHP/Vue | AGPL-3.0 | Self-hosted Linktree alternative |

---

## 2. QUÉ TOMAR DE CADA REPO

### 2.1 FACEBOOK GROUPS - TABLA DE DECISIONES

| Feature | Repo Origen | Acción |URL参考 |
|---------|------------|--------|----------|
| **Posting básico** | darideveloper | TOMAR | github.com/darideveloper/facebook-groups-post-bot |
| **GUI (PyQt5 → React)** | adar2 | ADAPTAR | github.com/adar2/Facebook-Posts-Automation |
| **Anti-ban logic** | Tigerzplace | ESTUDIAR | github.com/Tigerzplace/FAP-FacebookAutoPoster |
| **Group harvesting** | darideveloper | TOMAR | github.com/darideveloper/facebook-groups-post-bot |
| **Multi-cuenta sessions** | ariknih | TOMAR | github.com/ariknih/autopost-facebook-group |
| **Playwright** | ariknih | TOMAR | github.com/ariknih/autopost-facebook-group |
| **Marketplace** | HARON416 | ESTUDIAR | github.com/HARON416/Facebook-Marketplace-Auto-Poster |

### 2.2 INSTAGRAM - TABLA DE DECISIONES

| Feature | Repo Origen | Acción |URL参考 |
|---------|------------|--------|----------|
| **API posting** | instagrapi | TOMAR | github.com/divoc/instagrapi |
| **Stories/Reels** | instagrapi | TOMAR | github.com/divoc/instagrapi |
| **Fallback browser** | ariknih | TOMAR | github.com/ariknih/autopost-facebook-group |
| **Multi-cuenta** | instagrapi | TOMAR | github.com/divoc/instagrapi |

### 2.3 TIKTOK - TABLA DE DECISIONES

| Feature | Repo Origen | Acción |URL参考 |
|---------|------------|--------|----------|
| **Video upload** | haziq-exe | TOMAR | github.com/haziq-exe/TikTokAutoUploader |
| **Stealth browser** | awesome-python-login-model | TOMAR | github.com/Kr1s77/awesome-python-login-model |
| **Anti-ban** | Tigerzplace | ESTUDIAR | github.com/Tigerzplace/FAP-FacebookAutoPoster |

### 2.4 TWITTER - TABLA DE DECISIONES

| Feature | Repo Origen | Acción |URL参考 |
|---------|------------|--------|----------|
| **API sin API key** | twikit | TOMAR | github.com/d60/twikit |
| **Scraping** | twscrape | TOMAR | github.com/vladkens/twscrape |
| **Login/cookies** | awesome-python-login-model | TOMAR | github.com/Kr1s77/awesome-python-login-model |
| **Anti-ban** | awesome-python-login-model | TOMAR | github.com/Kr1s77/awesome-python-login-model |

### 2.5 LINKEDIN - TABLA DE DECISIONES

| Feature | Repo Origen | Acción |URL参考 |
|---------|------------|--------|----------|
| **Browser automation** | OpenOutreach | TOMAR | github.com/eracle/OpenOutreach |
| **Stealth** | OpenOutreach | TOMAR | github.com/eracle/OpenOutreach |
| **AI integration** | linkedin-post-automator | TOMAR | github.com/CRAKZOR/linkedin-post-automator |

### 2.6 BACKEND/SCHEDULER - ADAPTAR POSTIZ A NUESTRO STACK

> ⚠️ **NOTA**: El stack original de Postiz (NestJS + Temporal + PostgreSQL) fue reemplazado por **Tauri 2.0 + Rust + SQLite**. Esta sección documenta cómo adaptar las features de Postiz a nuestro stack.

#### Stack Original → Stack Social-Pip

| Componente Postiz | Tecnología Original | Tecnología Social-Pip | Adaptación |
|-------------------|---------------------|----------------------|------------|
| Backend API | NestJS REST API | Tauri Commands (IPC) | ✅ Equivalente funcional |
| Orchestrator | Temporal workers | Rust async + tokio-cron | ✅ Equivalente |
| Scheduling | Temporal workflows | tokio-cron-scheduler | ✅ Equivalente |
| Database | PostgreSQL | SQLite (Prisma) | ✅ Adaptado |
| Media Storage | CloudFlare R2 | Archivos locales (Tauri fs) | ✅ Equivalente |
| Auth/JWT | JWT + DB | No requerido (app local) | ❌ No necesario |
| Frontend | Next.js + React | React + Tauri WebView | ✅ Equivalente |
| Providers | API integrations | Chrome Extension | ✅ Diferente implementación |

#### Features de Postiz → Implementación en Social-Pip

| Feature Postiz | Implementación Social-Pip | Archivo/ubicación |
|----------------|---------------------------|-------------------|
| **Post Scheduling** | tokio-cron-scheduler jobs | `src-tauri/src/scheduler.rs` |
| **Media Upload** | Tauri fs commands | `src-tauri/src/commands/media.rs` |
| **Multi-platform posting** | Chrome Extension content scripts | `apps/extension/src/content/[platform]/` |
| **Calendar View** | React component | `apps/desktop/src/features/schedule/` |
| **Analytics** | SQLite queries + charts | `apps/desktop/src/features/analytics/` |
| **AI Caption Generation** | NVIDIA NIM / Ollama | `src-tauri/src/ai_service.rs` |
| **User Management** | No requerido (app local) | - |
| **Brand Voice / Manual de Marca** | JSON config + AI prompts | `src-tauri/src/brand_voice.rs` |

#### Código de Referencia para Adaptación

**1. Scheduler (Temporal → tokio-cron-scheduler):**

```rust
// src-tauri/src/scheduler.rs
use tokio_cron_scheduler::{Job, JobScheduler};
use chrono::{DateTime, Utc};

pub struct PostScheduler {
    scheduler: JobScheduler,
    db: Database,
}

impl PostScheduler {
    pub async fn schedule_post(&self, post: &Post) -> Result<JobId, Error> {
        // Postiz: Temporal workflow con cron expression
        // Social-Pip: tokio-cron-scheduler job
        let cron = format!("{} {} * * *", 
            post.scheduled_minute, 
            post.scheduled_hour
        );
        
        let job = Job::new_async(cron, move |uuid, _lock| {
            let post_id = post.id.clone();
            async move {
                // 1. Get post from DB
                // 2. Apply anti-ban delays (nuestro engine)
                // 3. Send to Chrome Extension via Native Messaging
                // 4. Update status in DB
            }
        });
        
        self.scheduler.add(job).await
    }
}
```

**2. Media Storage (R2 → Local):**

```rust
// src-tauri/src/commands/media.rs
use tauri::AppHandle;

#[tauri::command]
pub async fn save_media(app: AppHandle, filename: String, data: Vec<u8>) -> Result<String, String> {
    let media_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("media");
    
    std::fs::create_dir_all(&media_dir).map_err(|e| e.to_string())?;
    let file_path = media_dir.join(&filename);
    std::fs::write(&file_path, data).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().to_string())
}
```

**3. Prisma Schema (PostgreSQL → SQLite):**

```prisma
// packages/database/prisma/schema.prisma
// Postiz usa: PostgreSQL con tablas complejas
// Social-Pip usa: SQLite - schema adaptado

model Post {
  id            String   @id @default(cuid())
  content       String
  platform      Platform
  scheduledAt   DateTime
  variance      Int      @default(15)  // ±15 min variance (Postiz no tiene esto)
  status        PostStatus @default(PENDING)
  
  // Equivalente a Temporal workflow state
  attempts      Int      @default(0)
  maxAttempts   Int      @default(3)
  errorMessage  String?
  
  accountId     String
  account        Account  @relation(fields: [accountId], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// Postiz tiene: users, teams, workspaces, integrations, etc.
// Social-Pip: Solo accounts (perfiles de redes sociales)
model Account {
  id              String   @id @default(cuid())
  name            String
  platform        Platform
  chromeProfilePath String  // Chrome profile para la extensión
  
  posts           Post[]
  groups          Group[]
  
  status          AccountStatus @default(ACTIVE)
  warmupProgress  Int          @default(0)  // Warmup de cuentas nuevas
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Diferencias Clave con Postiz

| Aspecto | Postiz | Social-Pip | Por qué |
|---------|--------|------------|---------|
| **Hosting** | Docker (servidor) | Local (PC usuario) | Costo $0, anti-ban mejor |
| **Auth** | JWT con equipos | No requerido | App local, no multi-user |
| **Scheduling** | Temporal (externo) | tokio-cron (interno) | Más simple, menos recursos |
| **Posting** | API calls | Chrome Extension | Anti-ban más efectivo |
| **Multi-cuenta** | Por usuario | Por Chrome profile | Mayor control anti-ban |
| **Database** | PostgreSQL | SQLite | Suficiente para local |

#### Recursos de Postiz a Estudiar

| Recurso | URL | Qué usar |
|---------|-----|----------|
| CLAUDE.md | github.com/gitroomhq/postiz-app/blob/main/CLAUDE.md | Estructura de archivos, patrones |
| howitworks.mdx | github.com/gitroomhq/postiz-docs/blob/main/howitworks.mdx | Arquitectura general |
| Backend modules | apps/backend/src/ | Lógica de negocio (adaptar a Rust) |
| Frontend components | apps/frontend/src/ | UI patterns (adaptar a React) |
| Providers | libraries/postiz/src/providers/ | Lógica de posting por plataforma |

#### Tareas de Implementación

```markdown
- [ ] 2.6.1 Crear scheduler en Rust con tokio-cron-scheduler
- [ ] 2.6.2 Adaptar Prisma schema de Postiz a SQLite
- [ ] 2.6.3 Implementar commands Tauri para CRUD posts
- [ ] 2.6.4 Crear UI de Calendar (参考 Postiz)
- [ ] 2.6.5 Implementar media upload (Tauri fs)
- [ ] 2.6.6 Crear sistema de Analytics con SQLite
- [ ] 2.6.7 Integrar AI caption generation
```

### 2.7 TOOLS & UTILITIES - NUEVOS REPOS (Abril 2026)

| Feature | Repo Origen | Acción | URL |
|---------|------------|--------|-----|
| **Workflow building** | meitarbe/cognetivy | ESTUDIAR | github.com/meitarbe/cognetivy |
| **Browser automation (Go)** | go-rod/rod | ESTUDIAR | github.com/go-rod/rod |
| **Marketplace scraping** | passivebot | ESTUDIAR | github.com/passivebot/facebook-marketplace-scraper |
| **Linktree alternative** | LinkStackOrg | ESTUDIAR | github.com/LinkStackOrg/LinkStack |

> ⚠️ **Nota**: Estos repos fueron agregados desde el nuevo notebook de repositorios de Abril 2026. Son herramientas de referencia, no implementación directa.

---

> **Nota**: Este documento es investigación de cómo adaptar Postiz al stack de Social-Pip. El stack final implementado es Tauri 2.0 + Rust + SQLite, NO NestJS + Temporal + PostgreSQL.

---

## 3. QUÉ RESOLVER CON N8N

n8n puede resolver ciertas funcionalidades que no existen en los repos o son difíciles de implementar. Aquí está lo que n8n puede ofrecer:

### 3.1 NODES DE N8N PARA SOCIAL MEDIA

| Nodo | Función | Acción |
|------|---------|--------|
| **HTTP Request** | Generic API calls | Para APIs que no tienen wrapper |
| **Slack** | Notificaciones | Alertas de posts publicados |
| **Telegram** | Notificaciones | Bot de alertas |
| **Webhook** | Triggers externos | Integración con otros sistemas |
| **Code** | Custom logic | Scripts adicionales |
| **Google Sheets** | Data export | Reports y analytics |
| **Discord** | Notificaciones | Alertas a equipo |

### 3.2 WORKFLOWS N8N REUTILIZABLES

| Workflow | Función | Fuente |
|----------|---------|--------|
| **Post to multiple platforms** | Cross-posting | n8n community templates |
| **Content moderation** | AI-based content check | n8n community templates |
| **Analytics aggregation** | Recolectar métricas | n8n community templates |
| **Scheduling backup** | Backup de schedules | Custom |
| **Notification dispatcher** | Multi-channel alerts | Custom |

### 3.3 N8N COMO COMPLEMENTO

**Para qué SÍ usar n8n:**
- Notificaciones (Slack, Telegram, Discord)
- Integración con external tools (Google Sheets, etc.)
- Backup de datos
- workflows simples de procesamiento

**Para qué NO usar n8n (usar nuestro código):**
- Posting principal (necesitamos control anti-ban)
- Scheduling complejo (tokio-cron-scheduler en Rust)
- Multi-cuenta management
- AI caption generation

### 3.4 INSTALACIÓN N8N (LOCAL)

```bash
# Docker-compose para n8n local
# docker-compose.yaml
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_HOST=0.0.0.0
```

---

## 4. QUÉ CREAR DESDE CERO

某些功能在现有仓库中不存在，需要从头创建：

### 4.1 CORE - SIN REPO EXISTENTE

| Componente | Descripción | Prioridad |
|------------|-------------|----------|
| **Anti-Ban Engine unificado** | Sistema centralizado que maneja delays, rate limits, batch breaks para TODAS las plataformas (estudiar de Tigerzplace, crear arquitectura propia) | ALTA |
| **Group Classifier AI** | Clasificar grupos por sector (inmobiliario, digital, etc.) usando NVIDIA NIM/Ollama | MEDIA |
| **Template System con Spintax** | Sistema de templates con `{variante1|variante2|variante3}` para variety | ALTA |
| **Variance Scheduler** | Scheduling con ±15min variance (no existe en ningún repo) | ALTA |
| **Multi-Platform Queue** | Cola unificada para posting cross-platform | ALTA |

### 4.2 UI/UX - SIN REPO EXISTENTE

| Componente | Descripción | Prioridad |
|------------|-------------|----------|
| **Dashboard React** | Similar a Postiz pero mejorado para nuestro caso de uso | ALTA |
| **Calendar Scheduler** | Calendar view para scheduling visual | ALTA |
| **Group Manager UI** | Interfaz para gestionar grupos (MMBER-style) | ALTA |
| **AI Caption Panel** | Panel para configurar AI generation | MEDIA |
| **Analytics Dashboard** | Métricas de posts publicados | MEDIA |

### 4.3 INTEGRATIONS - SIN REPO EXISTENTE

| Componente | Descripción | Prioridad |
|------------|-------------|----------|
| **NVIDIA NIM Connector** | Integración con API gratuita de NVIDIA | ALTA |
| **Ollama Local Connector** | LLMs locales para captions | ALTA |
| **PostgreSQL to SQLite Adapter** | Adaptar schema de Postiz para SQLite | ALTA |
| **Chrome Extension ↔ Tauri Bridge** | Comunicación entre extension y desktop app | ALTA |

### 4.4 CÓDIGO NUEVO A CREAR

```typescript
// src/anti-ban/engine.ts - Anti-Ban unificado
// src/scheduler/variance-scheduler.ts - Scheduler con variance
// src/classifier/ai-classifier.ts - Group classifier
// src/template/spintax-engine.ts - Template system
// src/bridge/tauri-extension-bridge.ts - Tauri ↔ Extension
// src/connectors/nvidia-nim.ts - NVIDIA NIM
// src/connectors/ollama-local.ts - Ollama
```

---

## 5. MAPA DE IMPLEMENTACIÓN

> ⚠️ **NOTA IMPORTANTE**: El stack de implementación es **Tauri 2.0 + Rust + SQLite**, NO NestJS + Temporal + PostgreSQL.
> Los repositorios listados se usan como **referencia/inspiración** para study how to implement features.
> Ver `docs/architecture/main-architecture.md` para la arquitectura actual.

### 5.1 FASE 1: FUNDAMENTO (Semanas 1-2)

**De Postiz (ESTUDIAR como referencia):**
- [ ] Estudiar estructura de módulos (apps/backend/src/)
- [ ] Estudiar Prisma schema para adaptar a SQLite
- [ ] Estudiar UI patterns (apps/frontend/src/)

**De otros repos (ESTUDIAR):**
- [ ] Playwright setup (de ariknih) para testing E2E

**Crear desde cero (Tauri + Rust):**
- [ ] Inicializar proyecto Tauri 2.0 con React
- [ ] Configurar SQLite + Prisma
- [ ] Setup estructura Rust (commands/, scheduler/, anti_ban/)
- [ ] Bridge Tauri ↔ Chrome Extension (Native Messaging)
- [ ] Anti-Ban Engine base en Rust

### 5.2 FASE 2: FACEBOOK GROUPS (Semanas 3-4)

**De darideveloper (ESTUDIAR para inspiration):**
- [ ] Group harvesting logic (keywords)
- [ ] Config structure (data.json)

**De adar2 (ESTUDIAR para inspiration):**
- [ ] Multi-cuenta system patterns

**De Tigerzplace (ESTUDIAR para inspiration):**
- [ ] Anti-ban delays logic

**Crear desde cero:**
- [ ] Chrome Extension: content/facebook/groups.ts
- [ ] Variance scheduler en Rust
- [ ] Account warmup system

### 5.3 FASE 3: INSTAGRAM (Semanas 5-6)

**De instagrapi (ESTUDIAR para inspiration):**
- [ ] API posting patterns
- [ ] Stories/Reels upload logic

**Crear desde cero:**
- [ ] Chrome Extension: content/instagram/feed.ts
- [ ] Stories/Reels support en content script
- [ ] Media handling (images, videos)

### 5.4 FASE 4: TIKTOK (Semanas 7-8)

**De haziq-exe (ESTUDIAR para inspiration):**
- [ ] Video upload patterns
- [ ] Photo mode logic

**Crear desde cero:**
- [ ] Chrome Extension: content/tiktok/upload.ts
- [ ] Video compression/preprocessing

### 5.5 FASE 5: TWITTER + LINKEDIN (Semanas 9-10)

**De twikit (ESTUDIAR para inspiration):**
- [ ] Twitter API patterns (cookies-based, no API key)
- [ ] Tweet/Thread posting

**De OpenOutreach (ESTUDIAR para inspiration):**
- [ ] LinkedIn browser automation patterns

**Crear desde cero:**
- [ ] Chrome Extension: content/twitter/tweets.ts
- [ ] Chrome Extension: content/linkedin/post.ts

### 5.6 FASE 6: AI + POLISH (Semanas 11-12)

**Crear desde cero:**
- [ ] NVIDIA NIM connector en Rust
- [ ] Ollama connector en Rust
- [ ] Caption generation service
- [ ] Group classifier AI
- [ ] Manual de Marca system (brand voice prompts)
- [ ] Template system con Spintax

---

## 6. TABLA RESUMEN: ORIGEN DE CADA COMPONENTE

> ⚠️ **NOTA**: La columna "Tipo" ahora indica cómo obtenemos cada componente:
> - **CREAR**: Implementar desde cero con nuestro stack (Tauri/Rust)
> - **ESTUDIAR**: Usar como referencia/inspiración (no copiar código)
> - **N8N**: Implementar con n8n (para workflows complementarios)

| Componente | Tipo | Referencia | Equivalencia en Stack Actual |
|------------|------|------------|------------------------------|
| **Frontend (React)** | CREAR | - | `apps/desktop/src/` (React 19 + Tauri WebView) |
| **Backend (Rust)** | CREAR | - | `src-tauri/src/` (Tauri commands) |
| **Scheduler** | CREAR | tokio-cron-scheduler | `src-tauri/src/scheduler.rs` |
| **Database (SQLite)** | CREAR | Prisma + SQLite | `packages/database/prisma/schema.prisma` |
| **Facebook Posting** | CREAR | darideveloper, adar2 | `apps/extension/src/content/facebook/` |
| **Anti-Ban Engine** | CREAR | Tigerzplace | `src-tauri/src/anti_ban/` |
| **Group Harvesting** | CREAR | darideveloper | `apps/extension/src/content/facebook/harvest.ts` |
| **Multi-Account System** | CREAR | ariknih, adar2 | Chrome profiles + Rust state |
| **Instagram Posting** | CREAR | instagrapi | `apps/extension/src/content/instagram/` |
| **TikTok Upload** | CREAR | haziq-exe | `apps/extension/src/content/tiktok/` |
| **Twitter API** | CREAR | twikit | `apps/extension/src/content/twitter/` |
| **LinkedIn Automation** | CREAR | OpenOutreach | `apps/extension/src/content/linkedin/` |
| **AI Captions** | CREAR | NVIDIA NIM/Ollama | `src-tauri/src/ai_service.rs` |
| **Template System** | CREAR | Spintax patterns | `src-tauri/src/templates/` |
| **Group Classifier** | CREAR | NVIDIA NIM | `src-tauri/src/ai_service/` |
| **Tauri ↔ Extension** | CREAR | Native Messaging | `src-tauri/src/native_messaging/` |
| **Analytics** | CREAR | Postiz (referencia) | SQLite queries + React charts |
| **Calendar UI** | CREAR | Postiz (referencia) | `apps/desktop/src/features/schedule/` |
| **Notificaciones** | N8N | n8n nodes | Workflows en n8n |

---

## 9. RECURSOS ADICIONALES DE REFERENCIA

### Documentación Técnica

- https://v2.tauri.app/ (Tauri 2.0 documentación oficial)
- https://doc.rust-lang.org/ (Rust documentación oficial)
- https://developer.chrome.com/docs/extensions/mv3 (Chrome Extension MV3)
- https://www.prisma.io/docs (Prisma ORM)
- https://tokio.rs/ (Tokio async runtime)

### Repositorios de Código Abierto Relacionados

- https://github.com/n8n-io/n8n (Workflow automation)
- https://github.com/tervahagn/social-scheduler (Social scheduler con AI)
- https://github.com/nicokempe/automator (Automation framework reference)

### Recursos de Aprendizaje

- https://www.postiz.com/docs (Postiz docs - referencia de arquitectura)
- https://docs.n8n.io/ (n8n documentación)

---

*Documento creado: Abril 2026*
*Última actualización: Abril 2026 - Stack: Tauri 2.0 + Rust + SQLite + Chrome Extension MV3*