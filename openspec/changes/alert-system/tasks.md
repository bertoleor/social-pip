# Alert System - Implementation Tasks

## Task Breakdown

### Phase 1: Domain Layer (Rust)

#### Task 1.1: Create Alert Types and Enums
- [x] Create `apps/desktop/src-tauri/src/alert_system.rs`
- [x] Define `Severity` enum with variants: Info, Warning, Error, Critical
- [x] Implement `Display` trait for both enums
- [x] Add `Default` for `Severity`

**Test First:**
```rust
#[test]
fn severity_display_works() {
    assert_eq!(format!("{}", Severity::Critical), "CRITICAL");
    assert_eq!(format!("{}", Severity::Info), "INFO");
}
```

#### Task 1.2: Create Alert Entity
- [x] Define `Alert` struct with all fields from spec
- [x] Implement `Alert::new()` constructor
- [x] Implement builder methods: `with_platform()`, `with_account()`, `with_details()`
- [x] Implement `acknowledge()` and `resolve()` methods
- [x] Add `Serialize, Deserialize` derives

**Test First:**
```rust
#[test]
fn alert_new_creates_valid_alert() {
    let alert = Alert::new(
        AlertType::PostPublished,
        Severity::Info,
        "Test message".to_string(),
    );
    
    assert!(!alert.id.is_empty());
    assert_eq!(alert.severity, Severity::Info);
    assert!(!alert.acknowledged);
}

#[test]
fn alert_with_platform_adds_platform() {
    let alert = Alert::new(AlertType::PostPublished, Severity::Info, "Test".to_string())
        .with_platform("facebook".to_string());
    
    assert_eq!(alert.platform, Some("facebook".to_string()));
}
```

#### Task 1.3: Create AlertStats Value Object
- [x] Define `AlertStats` struct
- [x] Add `Serialize, Deserialize, Debug, Clone` derives

**Test First:**
```rust
#[test]
fn alert_stats_defaults_to_zero() {
    let stats = AlertStats {
        total_alerts: 0,
        unresolved: 0,
        critical: 0,
        warnings: 0,
        last_24h: 0,
        last_hour: 0,
    };
    
    assert_eq!(stats.total_alerts, 0);
}
```

#### Task 1.4: Create AlertEngine Aggregate
- [x] Define `AlertRule` struct with cooldown configuration
- [x] Define `AlertEngine` struct with alerts VecDeque and cooldowns HashMap
- [x] Implement `AlertEngine::new()` with default rules
- [x] Implement `create_alert()` with cooldown check
- [x] Implement `get_alerts()` with optional limit and filter
- [x] Implement `get_unresolved_alerts()`
- [x] Implement `get_critical_alerts()`
- [x] Implement `acknowledge_alert()`
- [x] Implement `resolve_alert()`
- [x] Implement `get_alert_stats()`
- [x] Implement `clear_old_alerts()`

**Test First:**
```rust
#[test]
fn engine_new_creates_empty_engine() {
    let engine = AlertEngine::new();
    assert_eq!(engine.get_alerts(None).len(), 0);
}

#[test]
fn create_alert_adds_to_collection() {
    let mut engine = AlertEngine::new();
    engine.create_alert(AlertType::PostPublished, Severity::Info, "Test".to_string());
    
    assert_eq!(engine.get_alerts(None).len(), 1);
}

#[test]
fn cooldown_prevents_duplicate_alerts() {
    let mut engine = AlertEngine::new();
    
    engine.create_alert(AlertType::RateLimitApproaching, Severity::Warning, "A".to_string());
    engine.create_alert(AlertType::RateLimitApproaching, Severity::Warning, "B".to_string());
    
    assert_eq!(engine.get_alerts(None).len(), 1);
}

#[test]
fn critical_alerts_bypass_cooldown() {
    let mut engine = AlertEngine::new();
    
    engine.create_alert(AlertType::AccountBlocked, Severity::Critical, "A".to_string());
    engine.create_alert(AlertType::AccountBlocked, Severity::Critical, "B".to_string());
    
    assert_eq!(engine.get_alerts(None).len(), 2);
}

#[test]
fn get_stats_calculates_correctly() {
    let mut engine = AlertEngine::new();
    
    engine.create_alert(AlertType::PostPublished, Severity::Info, "1".to_string());
    engine.create_alert(AlertType::PostFailed, Severity::Warning, "2".to_string());
    engine.create_alert(AlertType::AccountBlocked, Severity::Critical, "3".to_string());
    
    let stats = engine.get_alert_stats();
    
    assert_eq!(stats.total_alerts, 3);
    assert_eq!(stats.critical, 1);
    assert_eq!(stats.warnings, 1);
}

#[test]
fn clear_old_alerts_removes_resolved() {
    let mut engine = AlertEngine::new();
    
    let alert = engine.create_alert(AlertType::PostPublished, Severity::Info, "Old".to_string());
    engine.resolve_alert(&alert.id).unwrap();
    
    let removed = engine.clear_old_alerts(0);
    
    assert!(removed >= 1);
}
```

---

### Phase 2: Application Layer (Tauri Commands)

#### Task 2.1: Add AlertEngine to AppState
- [x] Add `alert_engine: Mutex<Option<AlertEngine>>` to `AppState`
- [x] Update `AppState::default()` implementation

**Test First:** (compile-time check)
```rust
#[test]
fn app_state_has_alert_engine() {
    let state = AppState::default();
    assert!(state.alert_engine.lock().is_ok());
}
```

#### Task 2.2: Implement Tauri Commands
- [x] `init_alert_system` command
- [x] `create_alert` command with type parsing
- [x] `get_alerts` command
- [x] `get_unresolved_alerts` command
- [x] `get_critical_alerts` command
- [x] `acknowledge_alert` command
- [x] `resolve_alert` command
- [x] `get_alert_stats` command
- [x] `clear_old_alerts` command
- [x] Register all commands in `invoke_handler`

**Test First:**
```rust
#[test]
fn init_alert_system_returns_stats() {
    let state = AppState::default();
    let result = init_alert_system(State::from(&state));
    assert!(result.is_ok());
}

#[test]
fn create_alert_returns_valid_alert() {
    let state = AppState::default();
    init_alert_system(State::from(&state)).unwrap();
    
    let result = create_alert(
        "post_published".to_string(),
        "INFO".to_string(),
        "Test".to_string(),
        None,
        None,
        State::from(&state),
    );
    
    assert!(result.is_ok());
    let alert = result.unwrap();
    assert!(!alert.id.is_empty());
}
```

---

### Phase 3: Presentation Layer (React)

#### Task 3.1: Create useAlerts Hook
- [x] Define `Alert` interface in TypeScript
- [x] Define `AlertStats` interface
- [x] Implement `useAlerts()` hook with:
- [x] `alerts: Alert[]`
- [x] `stats: AlertStats | null`
- [x] `loading: boolean`
- [x] `error: string | null`
- [x] `createAlert()`
- [x] `acknowledgeAlert()`
- [x] `resolveAlert()`
- [x] `refresh()`

**Test First:**
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAlerts } from '../useAlerts'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}))

describe('useAlerts', () => {
  it('initializes with empty alerts', async () => {
    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.alerts).toEqual([])
    })
  })

  it('loads stats on mount', async () => {
    const mockStats = { total_alerts: 5 }
    vi.mocked(invoke).mockResolvedValueOnce(mockStats)

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
    })
  })
})
```

#### Task 3.2: Create AlertList Component
- [x] Create `AlertList.tsx` component
- [x] Display loading state
- [x] Display empty state
- [x] Render alert items with:
- [x] Severity badge with color
- [x] Platform badge
- [x] Message text
- [x] Timestamp (relative)
- [x] Acknowledge/Resolve buttons
- [x] Handle acknowledge click
- [x] Handle resolve click
- [x] Support `limit` prop
- [x] Support `severityFilter` prop

**Test First:**
```typescript
describe('AlertList', () => {
  it('shows loading spinner initially', () => {
    render(<AlertList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows empty state when no alerts', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    render(<AlertList />)

    await waitFor(() => {
      expect(screen.getByText(/no alerts/i)).toBeInTheDocument()
    })
  })

  it('renders alerts after loading', async () => {
    const alerts = [{
      id: '1',
      severity: 'WARNING',
      message: 'Test alert',
      timestamp: new Date().toISOString(),
    }]
    vi.mocked(invoke).mockResolvedValueOnce(alerts)

    render(<AlertList />)

    await waitFor(() => {
      expect(screen.getByText('Test alert')).toBeInTheDocument()
    })
  })
})
```

#### Task 3.3: Create MonitoringDashboard Component
- [x] Create `MonitoringDashboard.tsx` component
- [x] Display alert stats cards
- [x] Display platform health grid
- [x] Display queue status
- [x] Include AlertList for recent alerts
- [x] Add refresh button
- [x] Add polling interval (30s default)

**Test First:**
```typescript
describe('MonitoringDashboard', () => {
  it('renders header', async () => {
    render(<MonitoringDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/system monitoring/i)).toBeInTheDocument()
    })
  })

  it('displays stats cards', async () => {
    vi.mocked(invoke).mockResolvedValue({
      total_alerts: 10,
      critical: 2,
    })

    render(<MonitoringDashboard />)

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})
```

#### Task 3.4: Update DashboardPage
- [x] Import and use MonitoringDashboard
- [x] Add alert summary cards
- [x] Add link to monitoring page (optional)

---

### Phase 4: Integration

#### Task 4.1: Update Routes
- [x] Add `/monitoring` route (optional)
- [x] Or integrate into existing dashboard

#### Task 4.2: End-to-End Testing
- [ ] Test alert creation from Rust
- [ ] Test UI updates after alert created
- [ ] Test acknowledge flow
- [ ] Test resolve flow
- [ ] Test polling updates

---

## Execution Order

1. **Phase 1.1** → 1.2 → 1.3 → 1.4 (Rust domain layer)
2. **Phase 2.1** → 2.2 (Tauri commands)
3. **Phase 3.1** → 3.2 → 3.3 → 3.4 (React components)
4. **Phase 4.1** → 4.2 (Integration)

Each task MUST have a failing test BEFORE implementation.

---

*Created: April 2026*
*Status: Tasks*
