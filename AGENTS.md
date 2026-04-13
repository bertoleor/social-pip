# AGENTS.md - Social-Pip

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                    # Start all workspaces in dev mode
pnpm dev:desktop           # Start Tauri desktop app only
pnpm dev:extension         # Start Chrome extension only

# Build
pnpm build                 # Build all workspaces
pnpm build:desktop         # Build Tauri app (production)
pnpm build:extension       # Build Chrome extension

# Lint & TypeCheck
pnpm lint                  # Biome check across all workspaces
pnpm typecheck            # TypeScript check across all workspaces

# Testing
pnpm test                  # Run all tests (Vitest)
cd apps/desktop && pnpm vitest run                    # Run all tests in desktop
cd apps/desktop && pnpm vitest run path/to/test.test.ts  # Run single test file
cd apps/desktop && pnpm vitest watch                  # Watch mode

# Database (Prisma)
pnpm db:generate          # Generate Prisma client
pnpm db:migrate           # Run migrations (dev)
pnpm db:studio            # Open Prisma Studio

# Tauri/Rust
cd apps/desktop/src-tauri && cargo check    # Check Rust code
cd apps/desktop/src-tauri && cargo test     # Run Rust tests
cd apps/desktop/src-tauri && cargo clippy   # Rust linter
```

---

## Project Structure

```
social-pip/
├── apps/
│   ├── desktop/          # Tauri 2.0 app (React + Rust)
│   │   ├── src/          # React frontend
│   │   └── src-tauri/    # Rust backend
│   └── extension/        # Chrome Extension MV3
├── packages/
│   ├── database/         # Prisma schema & client
│   └── types/            # Shared TypeScript types
└── skills/               # Agent skills (reference only)
```

---

## Code Style Guidelines

### TypeScript/React

**Imports Order:**
1. External libraries (React, Tauri APIs)
2. Internal packages (`@social-pip/types`, `@social-pip/database`)
3. Local imports (`@/components`, `@/lib`)
4. Types (always last with `type` keyword)

```typescript
// External
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

// Internal packages
import type { Platform, PostStatus } from '@social-pip/types'

// Local
import { Button } from '@/components/ui/Button'
import type { AntiBanStats } from '@/types'
```

**Naming Conventions:**
- **Components:** PascalCase (`Button.tsx`, `PostEditor.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAntiBan.ts`, `useAccounts.ts`)
- **Utils:** camelCase (`formatDate.ts`, `parseHashtags.ts`)
- **Types/Interfaces:** PascalCase (`Account`, `PostContent`)
- **Type unions:** PascalCase (`Platform`, `PostStatus`, `ActionType`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_POSTS_PER_DAY`)
- **Files:** kebab-case for utilities, PascalCase for components

**TypeScript Strict Mode:**
- All tsconfig.json have `strict: true` with full strict family
- `noUncheckedIndexedAccess: true` - always check array access
- `noPropertyAccessFromIndexSignature: true` - use bracket notation for index signatures
- Prefer `interface` for object shapes, `type` for unions/mapped types

```typescript
// Good - explicit type
interface Account {
  id: string
  platform: Platform
  status: AccountStatus
}

// Good - type for union
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

// Bad - any
const data: any = fetchData()  // ❌

// Good - unknown with type guard
const data: unknown = fetchData()
if (typeof data === 'string') { ... }
```

**React Patterns:**
- Prefer function components with explicit return types
- Use `useState<T>()` with generics for complex state
- Destructure props at component definition

```typescript
// Good
function PostEditor({ postId, onSave }: PostEditorProps): JSX.Element {
  const [content, setContent] = useState<string>('')
  // ...
}

// Bad - implicit any
function PostEditor({ postId }) {  // ❌
```

---

### Rust (Tauri Backend)

**Naming:**
- **Functions:** snake_case (`get_platform_config`, `can_execute`)
- **Structs/Enums:** PascalCase (`AntiBanEngine`, `BanRisk`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_HISTORY_SIZE`)
- **Modules:** snake_case (`anti_ban.rs`, `ai_service.rs`)

**Error Handling:**
- Use `thiserror` for custom errors
- Return `Result<T, String>` for Tauri commands
- Use `?` operator for error propagation

```rust
// Good - explicit error
#[tauri::command]
fn get_next_delay(platform: String, state: State<AppState>) -> Result<u64, String> {
    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;
    // ...
}

// Error enum with thiserror
#[derive(Debug, thiserror::Error)]
pub enum AntiBanError {
    #[error("Hourly limit exceeded")]
    HourlyLimitExceeded,
    #[error("Daily limit exceeded")]
    DailyLimitExceeded,
}
```

**Structs:**
- Use `#[derive(Debug, Clone, Serialize, Deserialize)]` for API types
- Implement `Default` trait when appropriate

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiBanConfig {
    pub platform: String,
    pub min_action_delay_ms: u64,
    pub max_action_delay_ms: u64,
    // ...
}

impl Default for AntiBanConfig {
    fn default() -> Self {
        Self {
            platform: "facebook".to_string(),
            min_action_delay_ms: 60_000,
            // ...
        }
    }
}
```

---

### Error Handling (TypeScript)

```typescript
// Good - typed error with message
try {
  const stats = await invoke<AntiBanStats>('init_anti_ban', { platform })
  setAntiBanStats(stats)
} catch (error) {
  console.error('Failed to load anti-ban stats:', error)
  // Handle gracefully - show user feedback
}

// Good - Result pattern for operations
interface Result<T> {
  success: boolean
  data?: T
  error?: string
}

async function executeTask(task: TaskMessage): Promise<TaskResult> {
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { ... })
    return { taskId: task.id, success: result.success, postUrl: result.postUrl }
  } catch (error) {
    return {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

---

## Platform-Specific Notes

### Tauri Commands

- All commands return `Result<T, String>`
- Use `State<T>` for shared state
- Async commands use `.await` in handler

```rust
#[tauri::command]
async fn generate_caption(
    content: String,
    platform: String,
    state: State<AppState>,
) -> Result<CaptionResponse, String> {
    let guard = state.ai_service.lock().map_err(|e| e.to_string())?;
    // ...
}
```

### Chrome Extension (MV3)

- Use `chrome.storage.local` for persistence
- Use `chrome.runtime.connectNative` for desktop communication
- Content scripts receive messages from background service worker

```typescript
// Background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'add_task') {
    addTaskToQueue(message.task).then(() => {
      sendResponse({ success: true })
    })
    return true  // Keep channel open for async response
  }
  return false
})
```

---

## Database (Prisma)

**Schema Location:** `packages/database/prisma/schema.prisma`

- SQLite for desktop (Tauri), PostgreSQL for future cloud
- Always use `@default(cuid())` for IDs
- Use enums for status fields (`PostStatus`, `AccountStatus`, `Platform`)
- Index frequently queried fields

```prisma
model Post {
  id        String     @id @default(cuid())
  platform  Platform
  status    PostStatus @default(DRAFT)
  accountId String
  account   Account    @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([platform, status])
  @@index([accountId, status])
}
```

---

## Key Architecture Decisions

1. **Anti-Ban Engine in Rust:** All rate limiting, delays, and safety checks run in Rust for performance and reliability

2. **Chrome Extension as Bridge:** Extension communicates with desktop app via Native Messaging, keeping browser automation isolated

3. **Shared Types Package:** All TypeScript types shared between apps via `@social-pip/types`

4. **State Management:** Zustand for React state, Tauri State for Rust state

---

## Skills Organization (JARVIS System)

### Directory Structure

```
skills/
├── 00-CORE/        # Sistema (SIEMPRE cargadas)
├── 10-STACK/       # Tech stack por contexto
├── 20-PLATFORM/    # Plataformas específicas
├── 30-WORKFLOW/    # Procesos de desarrollo
├── 40-AUTOMATION/  # Automatizaciones
├── 50-AI/          # IA y agentes
├── 60-SECURITY/    # Seguridad y calidad
├── 70-DATABASE/    # Base de datos
└── 99-VAULT/       # Skills sin curar (NO cargadas)
```

### Skills Activas por Categoría

| Categoría | Skills | Carga |
|-----------|--------|-------|
| **00-CORE** | sdd-*, skill-registry, skill-creator, specweave | Siempre |
| **10-STACK** | typescript, react-19, react-best-practices, zustand-5, zod-4, tailwind-4, playwright, go-testing | Por contexto de archivo |
| **20-PLATFORM** | microck-tauri, rust-skills, n8n-skills, dev-browser | Por tecnología |
| **30-WORKFLOW** | branch-pr, issue-creation, judgment-day, github-pr | Por comando |
| **60-SECURITY** | paulrberg (code-review) | En reviews |

### Carga Automática por Contexto

| Detectar | Cargar |
|----------|--------|
| `.tsx`, `.jsx` | react-19, react-best-practices |
| `.ts` | typescript |
| `*.test.*`, `*.spec.*` | playwright, go-testing |
| `src-tauri/**/*.rs` | rust-skills |
| `zustand`, `create(` | zustand-5 |
| `z.object`, `z.string` | zod-4 |
| `className=`, tailwind | tailwind-4 |

### Comandos SDD (Spec-Driven Development)

```bash
/sdd-init      # Inicializa contexto (detecta stack)
/sdd-explore   # Investiga antes de implementar
/sdd-propose   # Crea propuesta con tradeoffs
/sdd-spec      # Escribe especificaciones
/sdd-design    # Crea diseño técnico
/sdd-tasks     # Desglosa en checklist
/sdd-apply     # Implementa tareas
/sdd-verify    # Valida vs specs
/sdd-archive   # Archiva cambio completado
```

### Vault (Skills Sin Curar)

`skills/99-VAULT/` contiene ~1,400 skills de antigravity, affaan-m, davila7.

Para usar una skill del vault:
```
Consulta skills/99-VAULT/antigravity/skills/{skill-name}/SKILL.md
```

---

## Ecosistema JARVIS: Cómo Ser Tony Stark

### 1. Engram (Memoria Persistente)

El sistema recuerda entre sesiones:
- Decisiones arquitectónicas
- Bugs resueltos y cómo
- Patrones descubiertos
- Configuraciones importantes

**Uso:** El agente guarda automáticamente después de cada fix/decisión.

### 2. SDD (Planificación Estructurada)

Flujo: `explore → propose → spec → design → tasks → apply → verify`

**Beneficio:** No más "alucinar código". Primero planifica, luego ejecuta.

### 3. Skills (Conocimiento Especializado)

Cada skill inyecta reglas específicas:
- `typescript` → strict mode, no any
- `react-19` → compiler patterns, no premature optimization
- `rust-skills` → error handling con thiserror

**Beneficio:** El agente sigue mejores prácticas sin que se lo digas.

### Workflow Tony Stark

```
1. /sdd-init                          → Detecta Tauri + React + Rust
2. /sdd-explore "anti-ban Facebook"   → Investiga 3 approaches
3. /sdd-propose                       → Propone mejor opción con tradeoffs
4. /sdd-ff anti-ban-fb                → Fast-forward: spec → design → tasks
5. /sdd-apply anti-ban-fb             → Implementa siguiendo specs
6. /sdd-verify anti-ban-fb            → Valida implementación
7. mem_save                           → Guarda para próxima vez
```

---

## Testing Conventions

### Test File Organization

- **Unit tests**: Co-located with source (`*.test.ts`)
- **Component tests**: Co-located with component (`*.test.tsx`)
- **Integration tests**: `src/test/integration/`
- **E2E tests**: `src/e2e-playwright/`
- **Visual tests**: `src/test/visual/`
- **Performance tests**: `src/test/performance/`

### Naming Conventions

- **Test files**: `*.test.ts` or `*.test.tsx`
- **Test suites**: `describe('ComponentName', () => {})`
- **Test cases**: `it('does something when condition', () => {})`
- **Hooks**: `beforeEach`, `afterEach`, `beforeAll`, `afterAll`

### Mock Patterns

- **Tauri APIs**: Use `vi.mock('@tauri-apps/api/core')`
- **Zustand stores**: Use `vi.spyOn(store, 'useStoreName')`
- **Fixtures**: Import from `@/test/fixtures`
- **Custom mocks**: Place in `src/test/mocks/`

### Best Practices

- Use `userEvent.setup()` for interactions
- Use `screen.findBy*` for async elements
- Use `within()` for scoped queries
- Test accessibility with `jest-axe`
- Run `vitest --coverage` before PRs
- Use inline snapshots for visual regression tests

### Coverage Thresholds

| Category | Functions | Lines |
|----------|-----------|-------|
| Stores | 100% | 85% |
| Hooks | 100% | 85% |
| Components | - | 90% |
| **Global** | 85% | 80% |

Branch coverage: 75% minimum globally.

---

*Last updated: April 2026*
