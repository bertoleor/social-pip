# Testing Strategy - Social-Pip

## Resumen

Estrategia de testing para el proyecto Social-Pip, incluyendo unit tests, integration tests, y E2E tests.

---

## 1. Stack de Testing

| Tipo | Herramiencia | Propósito |
|------|--------------|-----------|
| Unit (Frontend) | Vitest | Tests de componentes y funciones React |
| Unit (Backend) | Rust built-in test | Tests de lógica Rust |
| Integration | Vitest + Testing Library | Tests de módulos combinados |
| E2E | Playwright | Tests end-to-end del sistema completo |
| Chrome Extension | Vitest | Tests de content scripts |
| Visual | Storybook (opcional) | Componentes UI |

---

## 2. Estructura de Tests

```
social-pip/
├── apps/
│   ├── desktop/
│   │   ├── src/                          # React frontend
│   │   │   └── __tests__/                # Vitest tests
│   │   └── src-tauri/                    # Rust backend
│   │       └── src/
│   │           ├── anti_ban/
│   │           │   └── tests/            # Rust tests
│   │           ├── scheduler/
│   │           │   └── tests/
│   │           └── commands/
│   │               └── tests/
│   └── extension/                        # Chrome Extension
│       └── src/
│           ├── content/
│           │   └── __tests__/            # Vitest tests
│           └── background/
│               └── __tests__/
└── packages/
    └── types/
        └── __tests__/                    # Type tests
```
apps/
├── desktop/
│   ├── src/
│   │   ├── __tests__/        # Unit tests
│   │   └── components/
│   │       └── __tests__/    # Component tests
│   └── e2e/                  # E2E tests
├── extension/
│   └── src/
│       └── __tests__/        # Unit tests
packages/
├── types/
│   └── __tests__/            # Type tests
└── database/
    └── __tests__/            # Prisma tests
```

---

## 3. Unit Tests (Vitest)

### 3.1 Configuración

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### 3.2 Ejemplo de Test

```typescript
// components/Button/__tests__/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('calls onClick handler', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Click</Button>)
    
    await userEvent.click(screen.getByText('Click'))
    expect(handler).toHaveBeenCalled()
  })
})
```

---

## 4. Integration Tests

### 4.1 Test de Stores (Zustand)

```typescript
// stores/__tests__/useAccountStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAccountStore } from '../useAccountStore'

describe('useAccountStore', () => {
  beforeEach(() => {
    useAccountStore.getState().reset()
  })

  it('adds account', () => {
    const { addAccount } = useAccountStore.getState()
    
    addAccount({
      id: '1',
      platform: 'facebook',
      name: 'Test Account'
    })
    
    const accounts = useAccountStore.getState().accounts
    expect(accounts).toHaveLength(1)
  })
})
```

---

## 5. E2E Tests (Playwright)

### 5.1 Configuración

```typescript
// e2e.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
```

### 5.2 Ejemplo de Test E2E

```typescript
// e2e/posting-flow.test.ts
import { test, expect } from '@playwright/test'

test('create and schedule post', async ({ page }) => {
  // 1. Login
  await page.goto('/login')
  await page.fill('[name=email]', 'test@test.com')
  await page.fill('[name=password]', 'password')
  await page.click('[type=submit]')
  
  // 2. Navigate to posts
  await page.click('text=Posts')
  
  // 3. Create post
  await page.click('text=New Post')
  await page.fill('[name=content]', 'Test post content')
  await page.click('text=Schedule')
  
  // 4. Verify created
  await expect(page.locator('text=Test post content')).toBeVisible()
})
```

---

## 6. Test de Backend (Rust)

### 6.1 Configuración de Tests en Rust

Rust viene con su propio framework de testing integrado. No necesitas dependencias externas.

```rust
// src-tauri/Cargo.toml - Agregar sección de dev-dependencies
[dev-dependencies]
tokio-test = "0.4"
mockall = "0.12"
tempfile = "3"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

### 6.2 Estructura de Tests

```
src-tauri/src/
├── lib.rs
├── main.rs
├── scheduler/
│   ├── mod.rs
│   └── tests.rs        # Tests del scheduler
├── anti_ban/
│   ├── mod.rs
│   ├── delays.rs
│   ├── rate_limiter.rs
│   └── tests/
│       ├── mod.rs
│       ├── delays_test.rs
│       └── rate_limiter_test.rs
├── commands/
│   ├── mod.rs
│   └── tests.rs        # Tests de commands
└── ...
```

### 6.3 Tests Unitarios - Anti-Ban Engine

```rust
// src-tauri/src/anti_ban/delays.rs

pub fn calculate_post_delay(min_ms: u64, max_ms: u64) -> u64 {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    rng.gen_range(min_ms..max_ms)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_delay_within_bounds() {
        for _ in 0..100 {
            let delay = calculate_post_delay(60_000, 240_000);
            assert!(delay >= 60_000, "Delay {}ms below minimum", delay);
            assert!(delay <= 240_000, "Delay {}ms above maximum", delay);
        }
    }

    #[test]
    fn test_delay_variance() {
        let delays: Vec<u64> = (0..50)
            .map(|_| calculate_post_delay(60_000, 240_000))
            .collect();
        
        // Verificar que hayVariación (no todos iguales)
        let unique_count = delays.iter().collect::<std::collections::HashSet<_>>().len();
        assert!(unique_count > 1, "No variance in delays");
    }
}
```

### 6.4 Tests de Rate Limiter

```rust
// src-tauri/src/anti_ban/rate_limiter.rs
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone)]
pub struct RateLimitConfig {
    pub max_requests: u32,
    pub window_seconds: u64,
}

pub struct RateLimiter {
    requests: Arc<RwLock<HashMap<String, Vec<DateTime<Utc>>>>>,
    config: RateLimitConfig,
}

impl RateLimiter {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            requests: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    pub async fn check(&self, key: &str) -> Result<bool, String> {
        let mut requests = self.requests.write().await;
        let now = Utc::now();
        let window_start = now - Duration::seconds(self.config.window_seconds as i64);

        let key_requests = requests.entry(key.to_string()).or_insert_with(Vec::new);
        key_requests.retain(|dt| *dt > window_start);

        if key_requests.len() >= self.config.max_requests as usize {
            return Err("Rate limit exceeded".to_string());
        }

        key_requests.push(now);
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limiter_allows_requests() {
        let config = RateLimitConfig {
            max_requests: 5,
            window_seconds: 60,
        };
        let limiter = RateLimiter::new(config);

        for _ in 0..5 {
            let result = limiter.check("test_key").await;
            assert!(result.is_ok());
        }
    }

    #[tokio::test]
    async fn test_rate_limiter_blocks_excess() {
        let config = RateLimitConfig {
            max_requests: 3,
            window_seconds: 60,
        };
        let limiter = RateLimiter::new(config);

        // 3 requests should succeed
        for _ in 0..3 {
            assert!(limiter.check("test_key").await.is_ok());
        }

        // 4th request should fail
        assert!(limiter.check("test_key").await.is_err());
    }

    #[tokio::test]
    async fn test_rate_limiter_per_key() {
        let config = RateLimitConfig {
            max_requests: 2,
            window_seconds: 60,
        };
        let limiter = RateLimiter::new(config);

        // key1 can do 2 requests
        assert!(limiter.check("key1").await.is_ok());
        assert!(limiter.check("key1").await.is_ok());
        assert!(limiter.check("key1").await.is_err());

        // key2 is independent
        assert!(limiter.check("key2").await.is_ok());
        assert!(limiter.check("key2").await.is_ok());
    }
}
```

### 6.5 Tests del Scheduler

```rust
// src-tauri/src/scheduler/tests.rs
use tokio_cron_scheduler::{JobScheduler, Job};
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_scheduler_add_job() {
        let scheduler = JobScheduler::new().await;
        
        // Create a simple job that runs once
        let job = Job::new_async("* * * * *", |_uuid, _lock| {
            Box::pin(async move {
                println!("Job executed at {}", Utc::now());
            })
        }).unwrap();

        scheduler.add(job).await.unwrap();
        
        // Give it time to potentially run
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        // The job should have executed (verify via logs or state)
    }

    #[tokio::test]
    async fn test_cron_expression_parsing() {
        // Test various cron expressions
        let test_cases = vec![
            ("0 9 * * *", "Daily at 9am"),
            ("*/15 * * * *", "Every 15 minutes"),
            ("0 0 1 * *", "First day of month"),
        ];

        for (expr, desc) in test_cases {
            let result = Job::new_async(expr, |_, _| {
                Box::pin(async {})
            });
            assert!(result.is_ok(), "Failed to parse: {} ({})", expr, desc);
        }
    }
}
```

### 6.6 Tests de Commands (Tauri)

```rust
// src-tauri/src/commands/tests.rs
use tauri::test::mock_app;
use serde_json::json;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_post_command() {
        let app = mock_app();
        
        // Test the create_post command logic
        let result = create_post(
            app.state(),
            "test content",
            "facebook",
            "group_123"
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_post_content() {
        // Test validation of post content
        let too_long = "x".repeat(63207); // FB limit + 1
        let result = validate_content(&too_long, "facebook");
        assert!(result.is_err());
        
        let valid = "x".repeat(280); // Twitter limit
        let result = validate_content(&valid, "twitter");
        assert!(result.is_ok());
    }
}
```

### 6.7 Tests de Integración - SQLite

```rust
// src-tauri/src/database/tests.rs
use tempfile::TempDir;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    #[tokio::test]
    async fn test_database_connection() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        let db = Database::new(&db_path).await;
        assert!(db.is_ok());
    }

    #[tokio::test]
    async fn test_insert_and_fetch_post() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        let db = Database::new(&db_path).await.unwrap();
        
        let post = Post {
            id: "test_1".to_string(),
            content: "Test post".to_string(),
            platform: "facebook".to_string(),
            status: "pending".to_string(),
            created_at: Utc::now(),
        };
        
        db.insert_post(&post).await.unwrap();
        let fetched = db.get_post("test_1").await.unwrap();
        
        assert_eq!(fetched.content, "Test post");
    }
}
```

### 6.8 Ejecutar Tests de Rust

```bash
# Desde src-tauri/
cd apps/desktop/src-tauri

# Todos los tests
cargo test

# Tests de un módulo específico
cargo test anti_ban

# Tests con output detallado
cargo test -- --nocapture

# Tests con coverage
cargo test --coverage

# Solo tests de integración
cargo test --test integration

# Verificar que build funciona
cargo check
cargo build
```

### 6.9 CI/CD para Rust

```yaml
# .github/workflows/rust-tests.yml
name: Rust Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Cache Rust dependencies
        uses: Swatinem/rust-cache@v2
        
      - name: Check formatting
        run: rustfmt --check src/
        
      - name: Run clippy
        run: cargo clippy -- -D warnings
        
      - name: Build
        run: cargo build --release
        
      - name: Run tests
        run: cargo test --verbose
```

---

## 7. Test de Chrome Extension

### 7.1 Estructura de Tests

```
apps/extension/
├── src/
│   ├── background/
│   │   ├── __tests__/
│   │   │   ├── native-connector.test.ts
│   │   │   └── message-router.test.ts
│   ├── content/
│   │   ├── facebook/
│   │   │   └── __tests__/
│   │   │       ├── groups.test.ts
│   │   │       └── selectors.test.ts
│   └── popup/
│       └── __tests__/
└── vitest.config.ts
```

### 7.2 Tests de Content Scripts

```typescript
// apps/extension/src/content/facebook/__tests__/groups.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    lastError: null
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};

global.chrome = mockChrome as any;

describe('Facebook Groups posting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find post button via selector', () => {
    // Simular DOM
    document.body.innerHTML = `
      <div role="dialog">
        <div role="presentation">
          <div role="button" aria-label="Publicar"></div>
        </div>
      </div>
    `;
    
    const button = findPostButton();
    expect(button).toBeDefined();
  });

  it('should apply anti-ban delay before posting', async () => {
    const startTime = Date.now();
    await applyDelay(60); // 60 segundos
    const elapsed = Date.now() - startTime;
    
    // Allow 1 second tolerance
    expect(elapsed).toBeGreaterThan(59000);
  });

  it('should detect rate limit warning', () => {
    const pageText = 'We limit how often you can post';
    const hasWarning = detectRateLimitWarning(pageText);
    expect(hasWarning).toBe(true);
  });
});
```

### 7.3 Tests de Native Messaging

```typescript
// apps/extension/src/background/__tests__/native-connector.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('Native Messaging Connector', () => {
  it('should connect to native host', async () => {
    const port = chrome.runtime.connectNative('com.socialpip.host');
    expect(port).toBeDefined();
  });

  it('should send message to Tauri', async () => {
    const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage');
    
    await sendToTauri({
      type: 'EXECUTE_TASK',
      payload: { taskId: '123', platform: 'facebook' }
    });
    
    expect(sendMessageSpy).toHaveBeenCalled();
  });

  it('should handle response', async () => {
    const mockResponse = { success: true, postUrl: 'https://...' };
    
    // Simulate message response
    chrome.runtime.sendMessage = vi.fn((msg, callback) => {
      callback(mockResponse);
    });
    
    const result = await sendToTauri({ type: 'PING' });
    expect(result.success).toBe(true);
  });
});
```

### 7.4 Tests de Selectors (Actualizados 2026)

```typescript
// apps/extension/src/content/__tests__/selectors.test.ts
import { describe, it, expect } from 'vitest';
import { getFacebookSelectors } from '../facebook/selectors';

describe('Facebook Selectors (2026)', () => {
  it('should have post button selector', () => {
    const selectors = getFacebookSelectors();
    
    expect(selectors.postButton).toBeDefined();
    expect(selectors.postButton.length).toBeGreaterThan(0);
  });

  it('should have textarea selector', () => {
    const selectors = getFacebookSelectors();
    
    expect(selectors.textarea).toBeDefined();
  });

  it('should have group selector fallback chain', () => {
    const selectors = getFacebookSelectors();
    
    // Should have multiple fallback selectors
    expect(selectors.postButton.length).toBeGreaterThanOrEqual(3);
  });
});
```

### 7.5 Ejecutar Tests de Extension

```bash
cd apps/extension

# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

---

## 8. Coverage Targets

| Componente | Target | Mínimo |
|------------|--------|--------|
| Frontend (React) | 80% | 60% |
| Backend (Rust) | 70% | 50% |
| Chrome Extension | 60% | 40% |
| Anti-Ban Engine | 90% | 80% |

---

## 9. Comandos de Testing

### 9.1 Scripts Disponibles

```bash
# Unit tests (frontend)
pnpm test

# Unit tests con coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch

# Rust tests
cd apps/desktop/src-tauri
cargo test

# Lint
pnpm lint
```

### 9.2 CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
      - name: Rust tests
        run: |
          cd apps/desktop/src-tauri
          cargo test
```

| Tipo | Target |
|------|--------|
| Unit Tests | 80% |
| Integration | 60% |
| E2E | Core flows |

---

## 9. Best Practices

1. **Naming**: `*.test.ts` o `*.spec.ts`
2. **Aislamiento**: Cada test independiente
3. **Assertions**: Usar expect con mensajes claros
4. **Mocking**: Mockear APIs externas
5. **Fixtures**: Crear datos de prueba reusable

---

*Última actualización: Abril 2026*