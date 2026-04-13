# Alert System - Specification

## Requirements

### Functional Requirements

**FR1: Alert Creation**
- Given: System event occurs (rate limit, error, success)
- When: Alert is created via `create_alert` command
- Then: Alert is stored with unique ID, timestamp, and metadata

**FR2: Alert Lifecycle**
- Given: An unacknowledged alert exists
- When: User acknowledges the alert
- Then: Alert marked as `acknowledged=true` with timestamp

- Given: An acknowledged alert exists
- When: User resolves the alert
- Then: Alert marked as `resolved=true` with timestamp

**FR3: Alert Cooldown**
- Given: Alert of type X created at time T
- When: Another alert of type X created at time T + cooldown/2
- Then: Second alert is NOT created (suppressed)

- Given: Alert of type X created at time T
- When: Another alert of type X created at time T + cooldown + 1
- Then: Second alert IS created

**FR4: Alert Filtering**
- Given: 100 alerts exist
- When: `get_alerts(limit=10)` called
- Then: 10 most recent alerts returned

- Given: 50 alerts exist (10 WARNING, 40 INFO)
- When: `get_alerts(severity_filter="WARNING")` called
- Then: 10 WARNING alerts returned

**FR5: Statistics Calculation**
- Given: 5 alerts in last hour, 20 in last 24h, 3 critical
- When: `get_alert_stats` called
- Then: Returns `{last_hour: 5, last_24h: 20, critical: 3, ...}`

**FR6: Alert Cleanup**
- Given: 100 alerts, 20 older than 7 days and resolved
- When: `clear_old_alerts(7)` called
- Then: Returns 20, only 80 alerts remain

### Non-Functional Requirements

**NFR1: Performance**
- Alert creation: < 1ms
- Alert list retrieval: < 10ms for 1000 alerts
- Statistics calculation: < 5ms

**NFR2: Memory**
- Max alerts in memory: 1000
- Auto-cleanup when limit reached (FIFO)

**NFR3: Concurrency**
- Thread-safe access via Mutex
- No blocking on read operations

## Domain Model

### Alert Entity

```rust
struct Alert {
    id: String,              // UUID v4
    alert_type: AlertType,   // Enum
    severity: Severity,      // Enum
    platform: Option<String>,
    account_id: Option<String>,
    message: String,
    details: Option<JsonValue>,
    timestamp: DateTime<Utc>,
    acknowledged: bool,
    acknowledged_at: Option<DateTime<Utc>>,
    resolved: bool,
    resolved_at: Option<DateTime<Utc>>,
}
```

### AlertType Enum

```rust
enum AlertType {
    RateLimitApproaching,
    RateLimitExceeded,
    AccountBlocked,
    AccountRestricted,
    AccountNeedsReauth,
    PostPublished,
    PostFailed,
    PostRetryExhausted,
    SchedulerStopped,
    SchedulerStarted,
    ApiError,
    NetworkError,
    SuspiciousActivity,
    SessionExpired,
    CredentialInvalid,
}
```

### Severity Enum

```rust
enum Severity {
    Info,      // Normal events (post published)
    Warning,   // Attention needed (rate limit approaching)
    Error,     // Operation failed (post failed)
    Critical,  // Immediate action required (account blocked)
}
```

### AlertStats Value Object

```rust
struct AlertStats {
    total_alerts: u32,
    unresolved: u32,
    critical: u32,
    warnings: u32,
    last_24h: u32,
    last_hour: u32,
}
```

## API Contracts

### Tauri Commands

#### init_alert_system

```typescript
// Frontend call
await invoke('init_alert_system')

// Returns
{
  total_alerts: 0,
  unresolved: 0,
  critical: 0,
  warnings: 0,
  last_24h: 0,
  last_hour: 0
}
```

#### create_alert

```typescript
// Frontend call
await invoke('create_alert', {
  alertType: 'rate_limit_approaching',
  severity: 'WARNING',
  message: 'Rate limit at 80% for Facebook',
  platform: 'facebook',
  accountId: 'acc_123'
})

// Returns
{
  id: '550e8400-e29b-41d4-a716-446655440000',
  alert_type: 'RateLimitApproaching',
  severity: 'WARNING',
  platform: 'facebook',
  account_id: 'acc_123',
  message: 'Rate limit at 80% for Facebook',
  details: null,
  timestamp: '2026-04-10T12:00:00Z',
  acknowledged: false,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null
}
```

#### get_alerts

```typescript
// Frontend call
await invoke('get_alerts', { limit: 50, severityFilter: null })

// Returns
[
  { id: '...', alert_type: '...', ... },
  { id: '...', alert_type: '...', ... },
]
```

#### acknowledge_alert

```typescript
// Frontend call
await invoke('acknowledge_alert', { alertId: '550e8400-...' })

// Returns (void)
// Throws if alert not found
```

#### resolve_alert

```typescript
// Frontend call
await invoke('resolve_alert', { alertId: '550e8400-...' })

// Returns (void)
// Throws if alert not found
```

#### get_alert_stats

```typescript
// Frontend call
await invoke('get_alert_stats')

// Returns
{
  total_alerts: 15,
  unresolved: 3,
  critical: 1,
  warnings: 5,
  last_24h: 12,
  last_hour: 2
}
```

## Cooldown Rules

| Alert Type | Cooldown | Reason |
|------------|----------|--------|
| RateLimitApproaching | 30 min | Don't spam for same limit |
| RateLimitExceeded | 60 min | Extended warning |
| AccountBlocked | 0 (immediate) | Critical, always show |
| AccountRestricted | 0 (immediate) | Critical, always show |
| PostFailed | 5 min | Group similar failures |
| PostPublished | 0 | Each success is relevant |
| SchedulerStopped | 0 (immediate) | Critical, always show |
| ApiError | 5 min | Network issues cluster |
| NetworkError | 5 min | Transient failures |

## Frontend Component Props

### AlertList

```typescript
interface AlertListProps {
  limit?: number              // Default: 50
  severityFilter?: string     // 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  showAcknowledge?: boolean   // Default: true
  onAlertAcknowledge?: (alertId: string) => void
}
```

### MonitoringDashboard

```typescript
interface MonitoringDashboardProps {
  refreshInterval?: number    // Default: 30000 (30 seconds)
}
```

---

*Created: April 2026*
*Status: Spec*
