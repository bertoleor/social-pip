# Alert System - Proposal

## Intent

Implement a real-time alert system for Social-Pip that monitors platform health, publishing status, and system events. Alerts should be actionable, filterable, and prevent notification spam through intelligent cooldowns.

## Scope

### IN Scope

- Alert creation with type, severity, platform, and message
- Alert lifecycle: created → acknowledged → resolved
- Alert cooldown to prevent duplicate notifications
- Alert statistics for dashboard display
- In-memory alert storage (no database for v1)
- Frontend components: AlertList, MonitoringDashboard
- Tauri commands for alert operations

### OUT of Scope

- Slack/Telegram/Email notifications (external integrations)
- Database persistence (future: Prisma integration)
- Webhook dispatching
- Alert rules configuration UI
- Multi-user alert permissions

## Approach

### Domain Model (DDD)

```
Aggregate: AlertEngine
  ├── Entity: Alert (root)
  │   ├── id: UUID
  │   ├── alert_type: AlertType (enum)
  │   ├── severity: Severity (enum)
  │   ├── platform: Option<String>
  │   ├── account_id: Option<String>
  │   ├── message: String
  │   ├── timestamp: DateTime
  │   ├── acknowledged: bool
  │   └── resolved: bool
  │
  ├── Value Object: AlertStats
  │   ├── total_alerts: u32
  │   ├── unresolved: u32
  │   ├── critical: u32
  │   ├── warnings: u32
  │   ├── last_24h: u32
  │   └── last_hour: u32
  │
  └── Service: AlertRules (cooldown management)

Domain Service: NotificationService (future)
```

### Alert Types

```rust
enum AlertType {
    RateLimitApproaching,
    RateLimitExceeded,
    AccountBlocked,
    AccountRestricted,
    AccountNeedsReauth,
    PostPublished,
    PostFailed,
    SchedulerStopped,
    ApiError,
    NetworkError,
}
```

### Severity Levels

```rust
enum Severity {
    Info,
    Warning,
    Error,
    Critical,
}
```

### Tauri Commands

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `init_alert_system` | - | `AlertStats` | Initialize engine, return stats |
| `create_alert` | type, severity, message, platform?, account_id? | `Alert` | Create new alert |
| `get_alerts` | limit?, severity_filter? | `Vec<Alert>` | List alerts |
| `get_unresolved_alerts` | - | `Vec<Alert>` | Unresolved only |
| `get_critical_alerts` | - | `Vec<Alert>` | Critical + unresolved |
| `acknowledge_alert` | alert_id | `()` | Mark as acknowledged |
| `resolve_alert` | alert_id | `()` | Mark as resolved |
| `get_alert_stats` | - | `AlertStats` | Statistics |
| `clear_old_alerts` | days | `usize` | Remove old, return count |

### Frontend Components

```
<MonitoringDashboard>
  ├── <AlertStatsCards />      // Summary cards
  ├── <PlatformHealthGrid />   // Platform status
  ├── <QueueStatus />          // Queue metrics
  └── <AlertList />            // Recent alerts

<AlertList>
  └── <AlertItem>[]            // Individual alerts
      ├── <SeverityBadge />
      ├── <PlatformBadge />
      └── <ActionButtons />
```

## Tradeoffs

### Chosen: In-Memory Storage

- **Pros**: Simple, fast, no migration needed, sufficient for v1
- **Cons**: Lost on restart, no history beyond session

### Rejected: Database Persistence

- **Reason**: Overkill for v1, requires schema changes, adds complexity

### Chosen: Hardcoded Alert Rules

- **Pros**: Simple implementation, predictable behavior
- **Cons**: Not configurable by user

### Rejected: Rule Engine Configuration

- **Reason**: Adds UI complexity, most users won't customize

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Memory leak with many alerts | Medium | High | Implement max_alerts limit (1000) |
| Alert spam floods UI | High | Medium | Cooldown per alert type |
| Frontend state out of sync | Medium | Medium | Polling every 30s |
| Missing critical alerts | Low | High | Critical alerts bypass cooldown |

## Success Criteria

- [ ] Can create alerts from any Tauri command
- [ ] Alerts display in UI within 1 second of creation
- [ ] Cooldown prevents duplicate alerts for same type
- [ ] Critical alerts always shown immediately
- [ ] UI shows real-time statistics
- [ ] Can acknowledge and resolve alerts
- [ ] Tests cover all Rust functions
- [ ] Tests cover all React components

## References

- `docs/error-handling.md` - Error codes reference
- `docs/monitoring-alerts.md` - Alert system design
- `docs/anti-ban-patterns.md` - Platform limits

---

*Created: April 2026*
*Status: Proposed*
