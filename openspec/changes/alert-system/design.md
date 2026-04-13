# Alert System - Design

## Architecture

### Layer: Domain (Rust)

```
src-tauri/src/alert_system.rs
├── AlertType (enum)
├── Severity (enum)
├── Alert (entity)
│   ├── new()
│   ├── with_platform()
│   ├── with_account()
│   ├── with_details()
│   ├── acknowledge()
│   └── resolve()
├── AlertStats (value object)
├── AlertRule (config)
├── AlertEngine (aggregate root)
│   ├── new()
│   ├── create_alert()
│   ├── get_alerts()
│   ├── get_unresolved_alerts()
│   ├── get_critical_alerts()
│   ├── acknowledge_alert()
│   ├── resolve_alert()
│   ├── get_alert_stats()
│   ├── clear_old_alerts()
│   └── default_rules()
└── NotificationService (domain service, stub)
```

### Layer: Application (Tauri Commands)

```
src-tauri/src/main.rs
├── AppState
│   └── alert_engine: Mutex<Option<AlertEngine>>
└── Commands
    ├── init_alert_system
    ├── create_alert
    ├── get_alerts
    ├── get_unresolved_alerts
    ├── get_critical_alerts
    ├── acknowledge_alert
    ├── resolve_alert
    ├── get_alert_stats
    └── clear_old_alerts
```

### Layer: Presentation (React)

```
src/components/organisms/
├── AlertList.tsx
└── MonitoringDashboard.tsx

src/hooks/
└── useAlerts.ts

src/pages/
└── MonitoringPage.tsx (optional, can be in Dashboard)
```

## Data Flow

### Create Alert Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ React       │     │ Tauri        │     │ AlertEngine   │
│ Component   │     │ Command      │     │ (Domain)      │
└──────┬──────┘     └──────┬───────┘     └───────┬───────┘
       │                    │                     │
       │ invoke('create_    │                     │
       │   alert', {...})   │                     │
       │───────────────────>│                     │
       │                    │                     │
       │                    │ engine.create_      │
       │                    │   alert(...)       │
       │                    │────────────────────>│
       │                    │                     │
       │                    │                     │ Check cooldown
       │                    │                     │ ├── If in cooldown: skip
       │                    │                     │ └── Else: create Alert
       │                    │                     │
       │                    │        Alert        │
       │                    │<────────────────────│
       │                    │                     │
       │       Alert        │                     │
       │<───────────────────│                     │
       │                    │                     │
```

### UI Polling Flow

```
┌─────────────┐     ┌──────────────┐
│ React       │     │ Tauri        │
│ useEffect   │     │ Commands     │
└──────┬──────┘     └──────┬───────┘
       │                    │
       │ Every 30s:         │
       │ invoke('get_alerts')
       │───────────────────>│
       │                    │
       │      Alert[]       │
       │<───────────────────│
       │                    │
       │ invoke('get_alert_stats')
       │───────────────────>│
       │                    │
       │    AlertStats      │
       │<───────────────────│
       │                    │
       │ setState()         │
       │                    │
```

## Testing Strategy

### Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_alert_basic() {
        let mut engine = AlertEngine::new();
        let alert = engine.create_alert(
            AlertType::PostPublished,
            Severity::Info,
            "Post published successfully".to_string(),
        );
        
        assert!(!alert.id.is_empty());
        assert_eq!(alert.severity, Severity::Info);
        assert!(!alert.acknowledged);
        assert!(!alert.resolved);
    }

    #[test]
    fn test_alert_cooldown_prevents_duplicates() {
        let mut engine = AlertEngine::new();
        
        engine.create_alert(
            AlertType::RateLimitApproaching,
            Severity::Warning,
            "Rate limit at 80%".to_string(),
        );
        
        engine.create_alert(
            AlertType::RateLimitApproaching,
            Severity::Warning,
            "Rate limit at 80%".to_string(),
        );
        
        assert_eq!(engine.get_alerts(None).len(), 1);
    }

    #[test]
    fn test_acknowledge_alert() {
        let mut engine = AlertEngine::new();
        let alert = engine.create_alert(
            AlertType::PostFailed,
            Severity::Warning,
            "Post failed".to_string(),
        );
        
        engine.acknowledge_alert(&alert.id).unwrap();
        
        let alerts = engine.get_alerts(None);
        assert!(alerts[0].acknowledged);
    }

    #[test]
    fn test_get_critical_alerts_filters_correctly() {
        let mut engine = AlertEngine::new();
        
        engine.create_alert(AlertType::AccountBlocked, Severity::Critical, "Blocked".to_string());
        engine.create_alert(AlertType::PostFailed, Severity::Warning, "Failed".to_string());
        
        let critical = engine.get_critical_alerts();
        assert_eq!(critical.len(), 1);
    }

    #[test]
    fn test_stats_calculation() {
        let mut engine = AlertEngine::new();
        
        for _ in 0..5 {
            engine.create_alert(AlertType::PostPublished, Severity::Info, "OK".to_string());
        }
        engine.create_alert(AlertType::AccountBlocked, Severity::Critical, "Blocked".to_string());
        
        let stats = engine.get_alert_stats();
        assert_eq!(stats.total_alerts, 6);
        assert_eq!(stats.critical, 1);
    }

    #[test]
    fn test_clear_old_alerts() {
        let mut engine = AlertEngine::new();
        
        engine.create_alert(AlertType::PostPublished, Severity::Info, "New".to_string());
        
        let stats = engine.get_alert_stats();
        assert!(stats.total_alerts >= 1);
    }
}
```

### Component Tests (React)

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { AlertList } from '../AlertList'
import { vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('AlertList', () => {
  it('renders loading state initially', () => {
    render(<AlertList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays alerts after loading', async () => {
    const mockAlerts = [{
      id: '1',
      alert_type: 'PostPublished',
      severity: 'INFO',
      message: 'Post published',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
    }]
    
    vi.mocked(invoke).mockResolvedValueOnce(mockAlerts)
    
    render(<AlertList />)
    
    await waitFor(() => {
      expect(screen.getByText('Post published')).toBeInTheDocument()
    })
  })

  it('shows empty state when no alerts', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    
    render(<AlertList />)
    
    await waitFor(() => {
      expect(screen.getByText(/no alerts/i)).toBeInTheDocument()
    })
  })

  it('calls acknowledge when button clicked', async () => {
    const mockAlerts = [{
      id: 'alert-1',
      alert_type: 'PostFailed',
      severity: 'WARNING',
      message: 'Failed',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
    }]
    
    vi.mocked(invoke)
      .mockResolvedValueOnce(mockAlerts)
      .mockResolvedValueOnce(undefined)
    
    render(<AlertList showAcknowledge={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText(/acknowledge/i))
    
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('acknowledge_alert', { alertId: 'alert-1' })
    })
  })
})
```

## File Structure

```
apps/desktop/
├── src-tauri/
│   └── src/
│       ├── alert_system.rs    (NEW)
│       └── main.rs            (MODIFY: add commands)
│
└── src/
    ├── components/
    │   └── organisms/
    │       ├── AlertList.tsx       (NEW)
    │       └── MonitoringDashboard.tsx  (NEW)
    │
    ├── hooks/
    │   └── useAlerts.ts       (NEW)
    │
    └── pages/
        └── DashboardPage.tsx  (MODIFY: add alerts section)
```

---

*Created: April 2026*
*Status: Design*
