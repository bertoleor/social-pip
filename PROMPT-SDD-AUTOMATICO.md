# PROMPT PARA SDD AUTOMÁTICO - SOCIAL-PIP BASE

## Copia y pega esto en una nueva sesión:

---

Quiero usar SDD en **MODO AUTOMÁTICO** para construir la base funcional completa de Social-Pip desde cero.

## CONTEXTO DEL PROYECTO

**Social-Pip** es una app de automatización de redes sociales 100% gratuita para Argentina/LATAM.

### Stack Detectado:
- **Frontend:** Tauri 2.0 + React 19 + TypeScript + Zustand + Tailwind 4
- **Backend:** Rust (Anti-Ban Engine, Scheduler, AI Service)
- **Database:** SQLite via Prisma (desktop), PostgreSQL (cloud futuro)
- **Extension:** Chrome Extension MV3 (bridge para automatización)

### Archivos Existentes:
```
social-pip/
├── apps/
│   ├── desktop/
│   │   ├── src/App.tsx          # UI básica sin funcionalidad
│   │   ├── src/main.tsx         # Entry point
│   │   └── src-tauri/
│   │       ├── src/main.rs      # Commands básicos anti-ban
│   │       ├── src/anti_ban.rs  # Engine de rate limiting
│   │       └── src/ai_service.rs # AI integration placeholder
│   └── extension/
│       └── src/background/index.ts  # Service worker placeholder
├── packages/
│   ├── database/
│   │   └── prisma/schema.prisma # Schema completo definido
│   └── types/
│       └── src/index.ts         # Types compartidos
└── AGENTS.md                    # Este archivo
```

### Documentación de Referencia:
- `packages/database/prisma/schema.prisma` - Modelos: Account, Post, Schedule, Group, Template, PostLog, AntiBanEvent, PlatformConfig, AIConfig
- `packages/types/src/index.ts` - Types: Platform, PostStatus, AccountStatus, ActionType, AntiBanProfile, etc.

## INSTRUCCIONES PARA SDD AUTOMÁTICO

### Fase 1: Inicialización
```
Ejecuta /sdd-init para:
1. Detectar el stack completo
2. Identificar que NO hay tests configurados
3. Identificar que NO hay estructura de componentes
4. Guardar contexto en memoria
```

### Fase 2: Exploración
```
Ejecuta /sdd-explore para cada área:

1. "frontend architecture"
   - Explora cómo estructurar componentes React
   - Decide: ¿Atomic design? ¿Feature-based? ¿Routes?
   
2. "state management"
   - Explora Zustand stores necesarios
   - Decide: ¿Un store global o múltiples?
   
3. "backend architecture"
   - Explora módulos Rust necesarios
   - Decide: ¿Scheduler? ¿AI integration? ¿Browser control?

4. "database integration"
   - Explora cómo conectar Prisma con Tauri
   - Decide: ¿Commands directos? ¿Repository pattern?

5. "extension architecture"
   - Explora comunicación extension ↔ desktop
   - Decide: ¿Native messaging? ¿HTTP?
```

### Fase 3: Propuestas
```
Para CADA área explorada, crea propuestas con:
- Intent claro
- Scope definido (qué SÍ y qué NO)
- Approach técnico
- Tradeoffs documentados
```

### Fase 4: Fast-Forward por Área

Ejecuta en orden SECUENCIAL:

```
ÁREA 1: CORE DATABASE
---
/sdd-ff core-database

Spec:
- Prisma client inicializado en Tauri
- Comandos básicos: create_account, get_accounts, create_post
- Seed data para testing

Design:
- Módulo Rust: database.rs con Prisma client
- Commands Tauri para CRUD básico
- Types compartidos en @social-pip/types

Tasks:
- [ ] Configurar Prisma para SQLite en Tauri
- [ ] Crear comando: init_database
- [ ] Crear comando: create_account
- [ ] Crear comando: get_accounts
- [ ] Crear comando: create_post
- [ ] Crear seed script
- [ ] Tests básicos

---

ÁREA 2: FRONTEND BASE
---
/sdd-ff frontend-base

Spec:
- Estructura de carpetas: components/, hooks/, stores/, lib/
- Layout principal con sidebar (ya existe en App.tsx)
- Router básico (tabs)
- Zustand store principal

Design:
- Atomic design: atoms/, molecules/, organisms/
- Feature folders: features/accounts/, features/posts/, features/schedule/
- Stores: useAccountsStore, usePostsStore, useUIStore

Tasks:
- [ ] Crear estructura de carpetas
- [ ] Mover App.tsx a layout/MainLayout.tsx
- [ ] Crear atoms: Button, Input, Card, Badge
- [ ] Crear molecules: AccountCard, PostCard, StatCard
- [ ] Crear useAccountsStore
- [ ] Crear usePostsStore
- [ ] Integrar stores con Tauri commands

---

ÁREA 3: ANTI-BAN INTEGRATION
---
/sdd-ff anti-ban-integration

Spec:
- Hook useAntiBan(platform) que consume Tauri commands
- Dashboard muestra stats en tiempo real
- Configuración por plataforma guardada en DB

Design:
- Hook useAntiBan conecta con: init_anti_ban, get_anti_ban_stats, check_can_post
- Componente AntiBanDashboard con cards de stats
- Store useAntiBanStore con estado por plataforma

Tasks:
- [ ] Crear useAntiBan hook
- [ ] Crear AntiBanDashboard component
- [ ] Crear useAntiBanStore
- [ ] Integrar con PlatformConfig de DB
- [ ] Tests del hook

---

ÁREA 4: SCHEDULER SERVICE
---
/sdd-ff scheduler-service

Spec:
- Sistema de scheduling en Rust con tokio-cron-scheduler
- Posts se ejecutan en horario programado
- Estado visible en UI en tiempo real

Design:
- Módulo Rust: scheduler.rs con tokio-cron-scheduler
- Tauri commands: schedule_post, get_pending_schedules, cancel_schedule
- Hook React: useSchedules
- Componente: ScheduleCalendar

Tasks:
- [ ] Implementar scheduler.rs
- [ ] Crear comando: schedule_post
- [ ] Crear comando: get_pending_schedules
- [ ] Crear comando: cancel_schedule
- [ ] Crear useSchedules hook
- [ ] Crear ScheduleCalendar component
- [ ] Tests del scheduler

---

ÁREA 5: ACCOUNT MANAGEMENT
---
/sdd-ff account-management

Spec:
- CRUD completo de cuentas
- Lista de cuentas con estado
- Formulario de creación/edición
- Importación desde Chrome profiles

Design:
- Página: AccountsPage
- Componentes: AccountList, AccountForm, AccountCard
- Store: useAccountsStore (ya creado en ÁREA 2)

Tasks:
- [ ] Crear AccountsPage
- [ ] Crear AccountList
- [ ] Crear AccountForm
- [ ] Crear AccountCard mejorado
- [ ] Implementar CRUD con Tauri commands
- [ ] Tests de integración

---

ÁREA 6: POST MANAGEMENT
---
/sdd-ff post-management

Spec:
- Editor de posts con preview
- Templates reutilizables
- Soporte multi-plataforma
- Cola de posts

Design:
- Página: PostsPage
- Componentes: PostEditor, PostPreview, TemplateSelector, PostQueue
- Store: usePostsStore

Tasks:
- [ ] Crear PostsPage
- [ ] Crear PostEditor (textarea + preview)
- [ ] Crear TemplateSelector
- [ ] Crear PostQueue
- [ ] Integrar con scheduler
- [ ] Tests del editor

---

ÁREA 7: CHROME EXTENSION BRIDGE
---
/sdd-ff extension-bridge

Spec:
- Extension recibe tareas del desktop
- Content scripts ejecutan acciones en platforms
- Anti-ban respeta limits

Design:
- Background: task queue + native messaging
- Content scripts por plataforma: facebook.ts, instagram.ts, twitter.ts
- Protocolo de mensajes definido

Tasks:
- [ ] Definir protocolo de mensajes
- [ ] Implementar task queue en background
- [ ] Crear facebook.ts content script
- [ ] Crear instagram.ts content script
- [ ] Crear twitter.ts content script
- [ ] Tests de comunicación

---

ÁREA 8: AI CAPTION GENERATION
---
/sdd-ff ai-captions

Spec:
- Integración con NVIDIA NIM API
- Generación de captions por sector
- Historial de generaciones

Design:
- Tauri command: generate_caption (ya existe placeholder)
- Hook: useAICaptions
- Componente: CaptionGenerator

Tasks:
- [ ] Completar ai_service.rs con llamada real a NIM
- [ ] Crear useAICaptions hook
- [ ] Crear CaptionGenerator component
- [ ] Guardar historial en AIGenerationLog
- [ ] Tests de integración

---

ÁREA 9: SETTINGS & CONFIG
---
/sdd-ff settings-config

Spec:
- Configuración de AI providers
- Configuración de anti-ban por plataforma
- Preferencias de usuario

Design:
- Página: SettingsPage
- Componentes: AIProviderConfig, AntiBanConfig, UserPreferences
- Persistencia en Settings model

Tasks:
- [ ] Crear SettingsPage
- [ ] Crear AIProviderConfig
- [ ] Crear AntiBanConfig
- [ ] Crear UserPreferences
- [ ] Integrar con Settings model
- [ ] Tests

---

ÁREA 10: TESTING INFRASTRUCTURE
---
/sdd-ff testing-infra

Spec:
- Vitest configurado para frontend
- Cargo tests para backend
- E2E tests con Playwright

Design:
- Vitest config + testing-library
- Cargo test structure
- Playwright config

Tasks:
- [ ] Configurar Vitest
- [ ] Crear tests para stores
- [ ] Crear tests para hooks
- [ ] Configurar cargo tests
- [ ] Crear tests para anti_ban
- [ ] Crear tests para scheduler
- [ ] Configurar Playwright
- [ ] E2E test básico

```

### Fase 5: Aplicación
```
Para CADA área en orden:
1. Implementar tareas en batches de 3-4
2. Marcar completadas
3. Continuar con siguiente batch
4. NO detenerse por warnings menores
5. CRITICAL errors → fix inmediato y continuar
```

### Fase 6: Verificación
```
Al final de CADA área:
- Comparar código vs spec
- Identificar CRITICAL issues
- Fix inmediato si hay CRITICAL
- Continuar con WARNING/SUGGESTION para después
```

### Fase 7: Archivo
```
Al completar CADA área:
- Guardar en memoria qué se construyó
- Guardar decisiones técnicas tomadas
- Guardar gotchas encontrados
- Continuar con siguiente área
```

## REGLAS DE EJECUCIÓN

1. **NO detenerse** por preguntas del usuario
2. **NO esperar confirmación** entre fases
3. **Continuar automáticamente** de área 1 a 10
4. **Solo detenerse** si:
   - Hay error CRITICAL que bloquea todo
   - Se completa todo el scope
5. **Reportar progreso** cada área completada
6. **Guardar en memoria** después de cada área

## MODO NOCHE AUTOMÁTICO

```
Inicio: /sdd-init
Luego: Ejecutar todas las fases en orden
Reportar: Solo al completar cada área
Final: Reporte completo de todo lo construido
Guardar: Todo en memoria para próxima sesión
```

---

## RESULTADO ESPERADO

Al finalizar, Social-Pip debe tener:

✅ Database funcional con Prisma + Tauri
✅ Frontend estructurado con componentes base
✅ Anti-ban integrado con UI
✅ Scheduler funcionando
✅ CRUD de cuentas
✅ Editor de posts básico
✅ Extension bridge protocol
✅ AI integration placeholder funcional
✅ Settings page
✅ Tests infrastructure

---

**INICIAR AHORA EN MODO AUTOMÁTICO**
