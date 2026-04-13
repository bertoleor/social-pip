# PROMPT SDD AUTOMÁTICO - SOCIAL-PIP BASE COMPLETA

> Este prompt está diseñado para ejecutarse en MODO AUTOMÁTICO durante toda la noche.
> Contempla: TDD, DDD, Scope controlado, y Auto-compactación.

---

## PROMPT PARA COPIAR Y PEGAR

```
Quiero usar SDD en MODO AUTOMÁTICO para construir la base funcional completa de Social-Pip desde cero.

STACK DETECTADO:
- Frontend: Tauri 2.0 + React 19 + TypeScript + Zustand + Tailwind 4
- Backend: Rust (Anti-Ban Engine, Scheduler, AI Service)
- Database: SQLite via Prisma
- Extension: Chrome Extension MV3
- Existe: schema.prisma completo, tipos en @social-pip/types, App.tsx básico

METODOLOGÍAS A APLICAR:

1. TDD (Test-Driven Development):
   - Escribir test ANTES de implementación (Red)
   - Implementar mínimo para pasar (Green)
   - Refactorizar manteniendo tests verdes (Refactor)
   - Tests como acceptance criteria

2. DDD (Domain-Driven Design):
   - Bounded Contexts: Accounts, Posts, Scheduling, AntiBan, AI
   - Aggregates: Account (root), Post (root), Schedule (root)
   - Value Objects: Platform, PostStatus, AccountStatus, ActionType
   - Domain Events: PostScheduled, PostPublished, PostFailed, AccountAdded
   - Repositories: AccountRepository, PostRepository, ScheduleRepository
   - Application Services: AccountService, PostService, SchedulerService

3. SCOPE CONTROLADO:
   - Cada área tiene Definition of Done explícita
   - MVP funcional vs nice-to-have separado
   - Incrementos entregables independientes
   - No scope creep - lo que está definido se hace, lo demás se documenta para después

4. AUTO-COMPACTACIÓN:
   - Guardar session summary ANTES de cada compactación
   - Usar mem_session_summary al completar cada área
   - Recover desde engram si hay compactación
   - Continuar desde último checkpoint guardado

EJECUTAR EN ORDEN SECUENCIAL:

FASE 0: INICIALIZACIÓN
---
/sdd-init
- Detecta stack completo
- Identifica testing capabilities (cero tests actualmente)
- Carga skills: typescript, react-19, rust-skills, prisma-expert, tdd-workflow, testing-patterns, clean-code, architecture-patterns
- Guarda contexto en memoria: sdd-init/social-pip

FASE 1: CORE DATABASE (Bounded Context: Database)
---
/sdd-explore "database architecture for Tauri + Prisma"
→ Decidir: ¿Prisma client en Rust o TypeScript? ¿Repository pattern?

/sdd-propose
→ Intent: Foundation de persistencia para toda la app
→ Scope IN: Prisma client, CRUD básico, seed data, migrations
→ Scope OUT: Optimizaciones, caching, connection pooling avanzado
→ Approach: Prisma client en Node, expuesto via Tauri commands

/sdd-spec
→ Spec con acceptance criteria:
  - AC-01: Puedo crear una cuenta y recuperarla por ID
  - AC-02: Puedo listar todas las cuentas activas
  - AC-03: Puedo crear un post asociado a una cuenta
  - AC-04: Seed data carga 3 cuentas de ejemplo
  - AC-05: Migrations corren sin error

/sdd-design
→ Architecture:
  - PrismaClient singleton en packages/database
  - Tauri commands: init_database, create_account, get_accounts, get_account, update_account, delete_account, create_post, get_posts
  - Repository trait en Rust para abstracción futura
  - Domain events emitidos en cada operación CRUD

/sdd-tasks (TDD)
→ [ ] TEST: escribir test para create_account (Red)
→ [ ] IMPL: implementar init_database command
→ [ ] TEST: verificar test pasa (Green)
→ [ ] REFACTOR: limpiar código
→ [ ] TEST: escribir test para get_accounts
→ [ ] IMPL: implementar get_accounts
→ [ ] TEST: verificar pasa
→ [ ] (repetir para cada operación)
→ [ ] IMPL: seed script
→ [ ] IMPL: migrations
→ [ ] TEST: integration test end-to-end

/sdd-apply → Implementar siguiendo TDD
/sdd-verify → Validar contra spec y tests
/sdd-archive → Guardar en memoria

→ Checkpoint: mem_session_summary con progreso de FASE 1

FASE 2: FRONTEND BASE (Bounded Context: UI)
---
/sdd-explore "frontend architecture con DDD"
→ Decidir: ¿Atomic design? ¿Feature-based? ¿Co-locate con domain?

/sdd-propose
→ Intent: Estructura base de UI con componentes reutilizables
→ Scope IN: Estructura carpetas, atoms, molecules, layout, routing, stores base
→ Scope OUT: Features completas, pages funcionales (van en fases siguientes)
→ Approach: Atomic design + co-location por bounded context

/sdd-spec
→ Spec:
  - AC-01: Estructura carpetas sigue convenciones AGENTS.md
  - AC-02: Button, Input, Card renders sin error
  - AC-03: MainLayout muestra sidebar + content
  - AC-04: Router navega entre tabs
  - AC-05: Zustand stores typed correctamente

/sdd-design
→ Architecture:
  - src/components/atoms/ (Button, Input, Card, Badge, Spinner)
  - src/components/molecules/ (AccountCard, PostCard, StatCard)
  - src/components/organisms/ (Header, Sidebar, Dashboard)
  - src/features/accounts/ (co-located)
  - src/features/posts/ (co-located)
  - src/features/schedule/ (co-located)
  - src/stores/ (useAccountsStore, usePostsStore, useUIStore)
  - Value Objects como tipos TypeScript

/sdd-tasks (TDD)
→ [ ] TEST: Button renders and handles click
→ [ ] IMPL: Button component
→ [ ] TEST: Input handles change events
→ [ ] IMPL: Input component
→ [ ] TEST: Card renders children
→ [ ] IMPL: Card component
→ [ ] TEST: MainLayout renders sidebar
→ [ ] IMPL: MainLayout
→ [ ] TEST: Router switches between tabs
→ [ ] IMPL: Router setup
→ [ ] TEST: useAccountsStore typed correctly
→ [ ] IMPL: useAccountsStore
→ [ ] IMPL: usePostsStore
→ [ ] IMPL: useUIStore

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 2

FASE 3: ANTI-BAN INTEGRATION (Bounded Context: AntiBan)
---
/sdd-explore "anti-ban integration con domain events"
→ Decidir: ¿Hook directamente o service layer?

/sdd-propose
→ Intent: Sistema anti-ban visible en UI con tiempo real
→ Scope IN: Hook, Dashboard, Store, tiempo real updates
→ Scope OUT: Configuración avanzada, customización de limits
→ Approach: Hook como Application Service, emitiendo eventos

/sdd-spec
→ Spec con domain events:
  - AC-01: useAntiBan hook retorna stats de plataforma
  - AC-02: AntiBanDashboard muestra stats en cards
  - AC-03: Stats se actualizan en tiempo real (polling o events)
  - AC-04: Estado persiste entre sesiones
  - Event: AntiBanWarning emitido cuando límite cerca
  - Event: AntiBanBlock emitido cuando límite alcanzado

/sdd-design
→ Architecture:
  - Domain: AntiBanProfile (value object), AntiBanStats (entity)
  - Application Service: AntiBanService (hook)
  - Repository: AntiBanRepository (Rust commands)
  - Events: AntiBanWarning, AntiBanBlock
  - UI: AntiBanDashboard (organism)

/sdd-tasks (TDD)
→ [ ] TEST: useAntiBan returns initial stats
→ [ ] IMPL: useAntiBan hook básico
→ [ ] TEST: Dashboard renders stats cards
→ [ ] IMPL: AntiBanDashboard component
→ [ ] TEST: Stats update on interval
→ [ ] IMPL: Polling mechanism
→ [ ] TEST: Events emit on warning
→ [ ] IMPL: Event emission en Rust
→ [ ] IMPL: PlatformConfig integration
→ [ ] TEST: Integration test hook ↔ Rust

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 3

FASE 4: SCHEDULER SERVICE (Bounded Context: Scheduling)
---
/sdd-explore "scheduler con domain events y persistence"
→ Decidir: ¿tokio-cron-scheduler? ¿Qué pasa si app cierra?

/sdd-propose
→ Intent: Sistema de scheduling que ejecuta posts en horario
→ Scope IN: Scheduler Rust, commands, hook, calendar UI básico
→ Scope OUT: Recurring schedules, timezone handling avanzado
→ Approach: tokio-cron-scheduler con persistence en DB

/sdd-spec
→ Spec con domain events:
  - AC-01: Puedo programar un post para fecha/hora
  - AC-02: Post se ejecuta dentro de ±15min del horario
  - AC-03: Puedo ver posts pendientes
  - AC-04: Puedo cancelar un schedule
  - AC-05: Estado visible en UI
  - Event: PostScheduled emitido al crear
  - Event: PostExecuting emitido al iniciar ejecución
  - Event: PostPublished emitido al éxito
  - Event: PostFailed emitido al error

/sdd-design
→ Architecture:
  - Domain: Schedule (aggregate), ScheduledPost (entity), ScheduleStatus (VO)
  - Application Service: SchedulerService
  - Repository: ScheduleRepository
  - Events: PostScheduled, PostExecuting, PostPublished, PostFailed
  - Infrastructure: tokio-cron-scheduler

/sdd-tasks (TDD)
→ [ ] TEST: schedule_post creates schedule
→ [ ] IMPL: schedule_post command
→ [ ] TEST: get_pending_schedules returns list
→ [ ] IMPL: get_pending_schedules command
→ [ ] TEST: cancel_schedule removes from queue
→ [ ] IMPL: cancel_schedule command
→ [ ] TEST: Scheduler executes at scheduled time
→ [ ] IMPL: tokio-cron-scheduler integration
→ [ ] TEST: useSchedules hook works
→ [ ] IMPL: useSchedules hook
→ [ ] IMPL: ScheduleCalendar component básico
→ [ ] TEST: Events emit correctly
→ [ ] IMPL: Event system
→ [ ] TEST: Integration test end-to-end

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 4

FASE 5: ACCOUNT MANAGEMENT (Bounded Context: Accounts)
---
/sdd-explore "account CRUD con domain model"
→ Decidir: ¿Cómo manejar accounts de diferentes plataformas?

/sdd-propose
→ Intent: CRUD completo de cuentas con UI funcional
→ Scope IN: Lista, Form, Card, CRUD completo, importación básica
→ Scope OUT: Importación desde Chrome profiles, validación avanzada
→ Approach: Account como aggregate root con value objects

/sdd-spec
→ Spec:
  - AC-01: Puedo crear cuenta con plataforma, nombre, cookies
  - AC-02: Lista muestra todas las cuentas con estado
  - AC-03: Puedo editar nombre y configuración
  - AC-04: Puedo eliminar cuenta (soft delete)
  - AC-05: AccountCard muestra info relevante
  - Event: AccountAdded emitido al crear
  - Event: AccountUpdated emitido al modificar
  - Event: AccountRemoved emitido al eliminar

/sdd-design
→ Architecture:
  - Domain: Account (aggregate), Platform (VO), AccountStatus (VO)
  - Application Service: AccountService
  - Repository: AccountRepository
  - Events: AccountAdded, AccountUpdated, AccountRemoved
  - UI: AccountsPage, AccountList, AccountForm, AccountCard

/sdd-tasks (TDD)
→ [ ] TEST: AccountList renders accounts
→ [ ] IMPL: AccountList component
→ [ ] TEST: AccountForm creates account
→ [ ] IMPL: AccountForm component
→ [ ] TEST: AccountCard shows platform badge
→ [ ] IMPL: AccountCard improved
→ [ ] TEST: CRUD operations work end-to-end
→ [ ] IMPL: Integration con Rust commands
→ [ ] TEST: Events emit on operations
→ [ ] IMPL: Event emission
→ [ ] IMPL: AccountsPage routing

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 5

FASE 6: POST MANAGEMENT (Bounded Context: Posts)
---
/sdd-explore "post editor con templates"
→ Decidir: ¿Rich text editor o textarea simple? ¿Templates cómo?

/sdd-propose
→ Intent: Editor de posts con templates y cola
→ Scope IN: Editor básico, templates, cola, multi-plataforma
→ Scope OUT: Rich text, imágenes, scheduling (ya está en FASE 4)
→ Approach: Post como aggregate con templates como value objects

/sdd-spec
→ Spec:
  - AC-01: Puedo escribir contenido de post
  - AC-02: Puedo seleccionar plantilla
  - AC-03: Puedo seleccionar plataformas destino
  - AC-04: Cola muestra posts pendientes
  - AC-05: Preview muestra cómo se verá
  - Event: PostCreated emitido al guardar
  - Event: PostQueued emitido al agregar a cola

/sdd-design
→ Architecture:
  - Domain: Post (aggregate), PostContent (VO), PostStatus (VO), Template (entity)
  - Application Service: PostService
  - Repository: PostRepository
  - Events: PostCreated, PostQueued
  - UI: PostsPage, PostEditor, TemplateSelector, PostQueue, PostPreview

/sdd-tasks (TDD)
→ [ ] TEST: PostEditor handles content input
→ [ ] IMPL: PostEditor component
→ [ ] TEST: TemplateSelector loads templates
→ [ ] IMPL: TemplateSelector component
→ [ ] TEST: PostQueue shows pending posts
→ [ ] IMPL: PostQueue component
→ [ ] TEST: PostPreview renders correctly
→ [ ] IMPL: PostPreview component
→ [ ] TEST: usePostsStore manages state
→ [ ] IMPL: usePostsStore
→ [ ] TEST: Events emit on operations
→ [ ] IMPL: Event emission
→ [ ] IMPL: PostsPage routing

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 6

FASE 7: EXTENSION BRIDGE (Bounded Context: BrowserAutomation)
---
/sdd-explore "extension communication protocol"
→ Decidir: ¿Native messaging o HTTP? ¿Protocolo de mensajes?

/sdd-propose
→ Intent: Bridge entre extension y desktop para automatización
→ Scope IN: Protocolo de mensajes, task queue, content scripts básicos
→ Scope OUT: Anti-ban en extension (ya está en Rust), UI de extension
→ Approach: Native messaging con cola de tareas

/sdd-spec
→ Spec:
  - AC-01: Extension puede recibir tareas de desktop
  - AC-02: Content script puede ejecutar acciones en plataforma
  - AC-03: Estado de tarea se reporta de vuelta
  - AC-04: Protocolo documentado en types
  - Event: TaskQueued emitido al agregar tarea
  - Event: TaskExecuting emitido al iniciar
  - Event: TaskCompleted emitido al éxito
  - Event: TaskFailed emitido al error

/sdd-design
→ Architecture:
  - Domain: Task (aggregate), TaskType (VO), TaskStatus (VO)
  - Application Service: TaskQueueService
  - Protocol: TaskMessage, TaskResult
  - Events: TaskQueued, TaskExecuting, TaskCompleted, TaskFailed
  - Extension: background (task queue), content scripts por plataforma

/sdd-tasks (TDD)
→ [ ] TEST: TaskMessage type is valid
→ [ ] IMPL: Protocol types
→ [ ] TEST: Task queue accepts tasks
→ [ ] IMPL: Task queue en background
→ [ ] TEST: Content script executes action
→ [ ] IMPL: facebook.ts content script
→ [ ] IMPL: instagram.ts content script
→ [ ] IMPL: twitter.ts content script
→ [ ] TEST: Result reports back
→ [ ] IMPL: Result messaging
→ [ ] TEST: Events emit on lifecycle
→ [ ] IMPL: Event emission

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 7

FASE 8: AI CAPTIONS (Bounded Context: AI)
---
/sdd-explore "AI integration con NIM"
→ Decidir: ¿Cómo manejar API keys? ¿Rate limiting?

/sdd-propose
→ Intent: Generación de captions con IA
→ Scope IN: Integration NIM, hook, UI básico, historial
→ Scope OUT: Múltiples providers, caching avanzado
→ Approach: Application Service con historial en DB

/sdd-spec
→ Spec:
  - AC-01: Puedo generar caption con prompt
  - AC-02: Caption generado se guarda en historial
  - AC-03: Puedo ver historial de generaciones
  - AC-04: API key configurable en settings
  - Event: CaptionGenerated emitido al generar

/sdd-design
→ Architecture:
  - Domain: AIGenerationLog (entity), CaptionRequest (VO), CaptionResponse (VO)
  - Application Service: AICaptionService
  - Repository: AIGenerationLogRepository
  - Events: CaptionGenerated
  - UI: CaptionGenerator component

/sdd-tasks (TDD)
→ [ ] TEST: generate_caption command works
→ [ ] IMPL: Complete ai_service.rs
→ [ ] TEST: useAICaptions hook returns result
→ [ ] IMPL: useAICaptions hook
→ [ ] TEST: CaptionGenerator renders and generates
→ [ ] IMPL: CaptionGenerator component
→ [ ] TEST: History shows past generations
→ [ ] IMPL: History integration
→ [ ] TEST: Events emit on generation
→ [ ] IMPL: Event emission

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 8

FASE 9: SETTINGS (Bounded Context: Configuration)
---
/sdd-explore "settings architecture"
→ Decidir: ¿Un modelo Settings o múltiples configs?

/sdd-propose
→ Intent: Configuración centralizada de la app
→ Scope IN: AI config, Anti-ban config, User preferences
→ Scope OUT: Platform-specific advanced settings
→ Approach: Settings model con typed sections

/sdd-spec
→ Spec:
  - AC-01: Puedo configurar AI provider
  - AC-02: Puedo ajustar anti-ban limits por plataforma
  - AC-03: Preferencias se guardan y cargan
  - AC-04: UI muestra current values

/sdd-design
→ Architecture:
  - Domain: Settings (aggregate root), AIConfig (VO), AntiBanConfig (VO), UserPreferences (VO)
  - Application Service: SettingsService
  - Repository: SettingsRepository
  - UI: SettingsPage, AIProviderConfig, AntiBanConfig, UserPreferences

/sdd-tasks (TDD)
→ [ ] TEST: SettingsPage renders sections
→ [ ] IMPL: SettingsPage
→ [ ] TEST: AIProviderConfig saves to DB
→ [ ] IMPL: AIProviderConfig component
→ [ ] TEST: AntiBanConfig updates limits
→ [ ] IMPL: AntiBanConfig component
→ [ ] TEST: UserPreferences persists
→ [ ] IMPL: UserPreferences component
→ [ ] TEST: Settings load on app start
→ [ ] IMPL: Settings initialization

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso de FASE 9

FASE 10: TESTING INFRASTRUCTURE (Cross-cutting)
---
/sdd-explore "testing setup para Tauri app"
→ Decidir: ¿Cómo testear Tauri commands? ¿E2E strategy?

/sdd-propose
→ Intent: Infraestructura de tests completa
→ Scope IN: Vitest config, testing-library, cargo tests, Playwright setup
→ Scope OUT: Full E2E suite (se hace incrementalmente)
→ Approach: Unit tests por bounded context, integration tests por feature

/sdd-spec
→ Spec:
  - AC-01: Vitest corre tests de React
  - AC-02: Cargo test corre tests de Rust
  - AC-03: Playwright configurado para E2E
  - AC-04: CI puede correr todos los tests

/sdd-design
→ Architecture:
  - Frontend: Vitest + testing-library + msw para mocking Tauri
  - Backend: Cargo test + mocks para Prisma
  - E2E: Playwright con fixtures

/sdd-tasks (TDD)
→ [ ] IMPL: Vitest config
→ [ ] TEST: Example React test passes
→ [ ] IMPL: testing-library setup
→ [ ] TEST: Store tests pass
→ [ ] TEST: Hook tests pass
→ [ ] IMPL: Cargo test structure
→ [ ] TEST: anti_ban tests pass
→ [ ] TEST: scheduler tests pass
→ [ ] IMPL: Playwright config
→ [ ] TEST: Basic E2E test passes

/sdd-apply
/sdd-verify
/sdd-archive

→ Checkpoint: mem_session_summary con progreso FINAL

REGLAS DE EJECUCIÓN:
───────────────────────────────────────────────────────────────────────────────

1. TDD OBLIGATORIO:
   - NUNCA escribir implementación sin test primero
   - Red → Green → Refactor para cada feature
   - Tests son acceptance criteria

2. DDD OBLIGATORIO:
   - Cada bounded context tiene su carpeta
   - Aggregates son units de consistencia
   - Value Objects son inmutables
   - Domain Events para comunicación entre contexts

3. SCOPE ESTRICTO:
   - Lo que está en Scope IN se hace
   - Lo que está en Scope OUT se documenta para después
   - No scope creep - respetar boundaries
   - Definition of Done: tests pass, docs updated, events emit

4. AUTO-COMPACTACIÓN:
   - DESPUÉS de cada fase completada: mem_session_summary
   - ANTES de seguir: verificar que summary guardó
   - SI hay compactación: recover desde engram y continuar
   - ÚLTIMO checkpoint guardado determina dónde continuar

5. MODO AUTOMÁTICO:
   - NO detenerse por preguntas
   - NO esperar confirmación
   - Continuar de FASE 0 a FASE 10 secuencialmente
   - Solo detener si CRITICAL error bloquea TODO
   - Reportar progreso al completar cada fase

CHECKPOINTS DE MEMORIA:
───────────────────────────────────────────────────────────────────────────────

Después de cada FASE:
  mem_session_summary({
    project: "social-pip",
    content: `
      ## Goal
      Construir base funcional de Social-Pip con TDD + DDD
      
      ## Accomplished
      ✅ FASE X: [nombre] - [qué se construyó]
      ✅ Tests: [cuántos tests escritos]
      ✅ Domain: [aggregates, VOs, events creados]
      ✅ Scope: [qué se completó del scope]
      
      ## Discoveries
      - [gotcha o learning]
      
      ## Next Steps
      - Continuar con FASE Y
      
      ## Relevant Files
      - [archivos creados/modificados]
    `
  })

RESULTADO FINAL ESPERADO:
───────────────────────────────────────────────────────────────────────────────

Al terminar FASE 10:

✅ Database funcional con Prisma + Tauri + Repository pattern
✅ Frontend estructurado con Atomic design + co-location
✅ Anti-ban integrado con domain events
✅ Scheduler funcionando con persistence
✅ Account CRUD completo
✅ Post editor con templates
✅ Extension bridge con protocol
✅ AI integration funcional
✅ Settings page
✅ Testing infrastructure completa
✅ TODOS los bounded contexts definidos
✅ TODOS los aggregates implementados
✅ TODOS los value objects tipados
✅ TODOS los domain events emitidos
✅ Tests unitarios para cada componente
✅ Tests de integración para cada feature
✅ Documentación de arquitectura

INICIAR AHORA EN MODO AUTOMÁTICO.
```

---

## NOTAS PARA EL USUARIO

### ¿Qué hace este prompt?

1. **TDD**: Cada tarea empieza con TEST antes de IMPL
2. **DDD**: Define bounded contexts, aggregates, value objects, events
3. **Scope**: Cada fase tiene scope explícito IN/OUT
4. **Auto-compactación**: Guarda en memoria después de cada fase

### ¿Cómo ejecutarlo?

1. Abre una NUEVA sesión con el agente
2. Copia todo el contenido entre las comillas triples invertidas
3. Pégalo tal cual
4. El agente ejecutará automáticamente

### ¿Qué pasa si se compacta?

El agente recuperará desde el último `mem_session_summary` y continuará.

### ¿Cuánto tiempo tarda?

Depende del modelo, pero está diseñado para toda la noche (8-12 horas de trabajo autónomo).

---

*Prompt generado: Abril 2026*
*Contempla: TDD + DDD + Scope Control + Auto-compactación*
