use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Severity {
    Info,
    Warning,
    Error,
    Critical,
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Severity::Info => write!(f, "INFO"),
            Severity::Warning => write!(f, "WARNING"),
            Severity::Error => write!(f, "ERROR"),
            Severity::Critical => write!(f, "CRITICAL"),
        }
    }
}

impl Default for Severity {
    fn default() -> Self {
        Severity::Info
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AlertType {
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

impl std::fmt::Display for AlertType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AlertType::RateLimitApproaching => write!(f, "rate_limit_approaching"),
            AlertType::RateLimitExceeded => write!(f, "rate_limit_exceeded"),
            AlertType::AccountBlocked => write!(f, "account_blocked"),
            AlertType::AccountRestricted => write!(f, "account_restricted"),
            AlertType::AccountNeedsReauth => write!(f, "account_needs_reauth"),
            AlertType::PostPublished => write!(f, "post_published"),
            AlertType::PostFailed => write!(f, "post_failed"),
            AlertType::PostRetryExhausted => write!(f, "post_retry_exhausted"),
            AlertType::SchedulerStopped => write!(f, "scheduler_stopped"),
            AlertType::SchedulerStarted => write!(f, "scheduler_started"),
            AlertType::ApiError => write!(f, "api_error"),
            AlertType::NetworkError => write!(f, "network_error"),
            AlertType::SuspiciousActivity => write!(f, "suspicious_activity"),
            AlertType::SessionExpired => write!(f, "session_expired"),
            AlertType::CredentialInvalid => write!(f, "credential_invalid"),
        }
    }
}

impl AlertType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "rate_limit_approaching" => Some(AlertType::RateLimitApproaching),
            "rate_limit_exceeded" => Some(AlertType::RateLimitExceeded),
            "account_blocked" => Some(AlertType::AccountBlocked),
            "account_restricted" => Some(AlertType::AccountRestricted),
            "account_needs_reauth" => Some(AlertType::AccountNeedsReauth),
            "post_published" => Some(AlertType::PostPublished),
            "post_failed" => Some(AlertType::PostFailed),
            "post_retry_exhausted" => Some(AlertType::PostRetryExhausted),
            "scheduler_stopped" => Some(AlertType::SchedulerStopped),
            "scheduler_started" => Some(AlertType::SchedulerStarted),
            "api_error" => Some(AlertType::ApiError),
            "network_error" => Some(AlertType::NetworkError),
            "suspicious_activity" => Some(AlertType::SuspiciousActivity),
            "session_expired" => Some(AlertType::SessionExpired),
            "credential_invalid" => Some(AlertType::CredentialInvalid),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: String,
    pub alert_type: AlertType,
    pub severity: Severity,
    pub platform: Option<String>,
    pub account_id: Option<String>,
    pub message: String,
    pub details: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
    pub acknowledged: bool,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub resolved: bool,
    pub resolved_at: Option<DateTime<Utc>>,
}

impl Alert {
    pub fn new(alert_type: AlertType, severity: Severity, message: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            alert_type,
            severity,
            platform: None,
            account_id: None,
            message,
            details: None,
            timestamp: Utc::now(),
            acknowledged: false,
            acknowledged_at: None,
            resolved: false,
            resolved_at: None,
        }
    }

    pub fn with_platform(mut self, platform: String) -> Self {
        self.platform = Some(platform);
        self
    }

    pub fn with_account(mut self, account_id: String) -> Self {
        self.account_id = Some(account_id);
        self
    }

    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }

    pub fn acknowledge(&mut self) {
        if !self.acknowledged {
            self.acknowledged = true;
            self.acknowledged_at = Some(Utc::now());
        }
    }

    pub fn resolve(&mut self) {
        if !self.resolved {
            self.resolved = true;
            self.resolved_at = Some(Utc::now());
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AlertStats {
    pub total_alerts: u32,
    pub unresolved: u32,
    pub critical: u32,
    pub warnings: u32,
    pub last_24h: u32,
    pub last_hour: u32,
}

#[derive(Debug, Clone)]
pub struct AlertRule {
    pub alert_type: AlertType,
    pub cooldown_minutes: u32,
}

impl AlertRule {
    pub fn new(alert_type: AlertType, cooldown_minutes: u32) -> Self {
        Self {
            alert_type,
            cooldown_minutes,
        }
    }
}

pub struct AlertEngine {
    alerts: VecDeque<Alert>,
    cooldowns: HashMap<AlertType, DateTime<Utc>>,
    rules: HashMap<AlertType, AlertRule>,
    max_alerts: usize,
}

impl AlertEngine {
    pub fn new() -> Self {
        let rules = Self::default_rules();
        let rules_map: HashMap<AlertType, AlertRule> = rules
            .into_iter()
            .map(|r| (r.alert_type, r))
            .collect();

        Self {
            alerts: VecDeque::with_capacity(1000),
            cooldowns: HashMap::new(),
            rules: rules_map,
            max_alerts: 1000,
        }
    }

    fn default_rules() -> Vec<AlertRule> {
        vec![
            AlertRule::new(AlertType::RateLimitApproaching, 30),
            AlertRule::new(AlertType::RateLimitExceeded, 60),
            AlertRule::new(AlertType::AccountBlocked, 0),
            AlertRule::new(AlertType::AccountRestricted, 0),
            AlertRule::new(AlertType::AccountNeedsReauth, 15),
            AlertRule::new(AlertType::PostPublished, 0),
            AlertRule::new(AlertType::PostFailed, 5),
            AlertRule::new(AlertType::PostRetryExhausted, 10),
            AlertRule::new(AlertType::SchedulerStopped, 0),
            AlertRule::new(AlertType::SchedulerStarted, 0),
            AlertRule::new(AlertType::ApiError, 5),
            AlertRule::new(AlertType::NetworkError, 5),
            AlertRule::new(AlertType::SuspiciousActivity, 0),
            AlertRule::new(AlertType::SessionExpired, 30),
            AlertRule::new(AlertType::CredentialInvalid, 0),
        ]
    }

    pub fn create_alert(
        &mut self,
        alert_type: AlertType,
        severity: Severity,
        message: String,
    ) -> Alert {
        let now = Utc::now();

        let cooldown_minutes = self.rules
            .get(&alert_type)
            .map(|r| r.cooldown_minutes)
            .unwrap_or(0);

        let should_create = if cooldown_minutes == 0 {
            true
        } else if let Some(&last_time) = self.cooldowns.get(&alert_type) {
            let cooldown_duration = Duration::minutes(cooldown_minutes as i64);
            now >= last_time + cooldown_duration
        } else {
            true
        };

        if should_create {
            let alert = Alert::new(alert_type, severity, message);
            self.cooldowns.insert(alert_type, now);

            if self.alerts.len() >= self.max_alerts {
                self.alerts.pop_front();
            }
            self.alerts.push_back(alert.clone());
            alert
        } else {
            self.alerts
                .iter()
                .rev()
                .find(|a| a.alert_type == alert_type)
                .cloned()
                .unwrap()
        }
    }

    pub fn get_alerts(&self, limit: Option<usize>) -> Vec<Alert> {
        match limit {
            Some(l) => self.alerts.iter().rev().take(l).cloned().collect(),
            None => self.alerts.iter().rev().cloned().collect(),
        }
    }

    pub fn get_unresolved_alerts(&self) -> Vec<Alert> {
        self.alerts
            .iter()
            .rev()
            .filter(|a| !a.resolved)
            .cloned()
            .collect()
    }

    pub fn get_critical_alerts(&self) -> Vec<Alert> {
        self.alerts
            .iter()
            .rev()
            .filter(|a| a.severity == Severity::Critical)
            .cloned()
            .collect()
    }

    pub fn acknowledge_alert(&mut self, id: &str) -> Result<(), String> {
        if let Some(alert) = self.alerts.iter_mut().find(|a| a.id == id) {
            alert.acknowledge();
            Ok(())
        } else {
            Err(format!("Alert with id {} not found", id))
        }
    }

    pub fn resolve_alert(&mut self, id: &str) -> Result<(), String> {
        if let Some(alert) = self.alerts.iter_mut().find(|a| a.id == id) {
            alert.resolve();
            Ok(())
        } else {
            Err(format!("Alert with id {} not found", id))
        }
    }

    pub fn get_alert_stats(&self) -> AlertStats {
        let now = Utc::now();
        let hour_ago = now - Duration::hours(1);
        let day_ago = now - Duration::hours(24);

        let last_hour = self.alerts
            .iter()
            .filter(|a| a.timestamp > hour_ago)
            .count() as u32;

        let last_24h = self.alerts
            .iter()
            .filter(|a| a.timestamp > day_ago)
            .count() as u32;

        let critical = self.alerts
            .iter()
            .filter(|a| a.severity == Severity::Critical)
            .count() as u32;

        let warnings = self.alerts
            .iter()
            .filter(|a| a.severity == Severity::Warning)
            .count() as u32;

        let unresolved = self.alerts
            .iter()
            .filter(|a| !a.resolved)
            .count() as u32;

        AlertStats {
            total_alerts: self.alerts.len() as u32,
            unresolved,
            critical,
            warnings,
            last_24h,
            last_hour,
        }
    }

    pub fn clear_old_alerts(&mut self, days: u32) -> u32 {
        let cutoff = Utc::now() - Duration::days(days as i64);
        let initial_len = self.alerts.len();

        self.alerts.retain(|a| {
            a.timestamp > cutoff || !a.resolved
        });

        (initial_len - self.alerts.len()) as u32
    }
}

impl Default for AlertEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn severity_display_works() {
        assert_eq!(format!("{}", Severity::Critical), "CRITICAL");
        assert_eq!(format!("{}", Severity::Info), "INFO");
        assert_eq!(format!("{}", Severity::Warning), "WARNING");
        assert_eq!(format!("{}", Severity::Error), "ERROR");
    }

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
        assert!(!alert.resolved);
        assert!(alert.platform.is_none());
        assert!(alert.account_id.is_none());
    }

    #[test]
    fn alert_with_platform_adds_platform() {
        let alert = Alert::new(AlertType::PostPublished, Severity::Info, "Test".to_string())
            .with_platform("facebook".to_string());

        assert_eq!(alert.platform, Some("facebook".to_string()));
    }

    #[test]
    fn alert_with_account_adds_account() {
        let alert = Alert::new(AlertType::PostPublished, Severity::Info, "Test".to_string())
            .with_account("acc_123".to_string());

        assert_eq!(alert.account_id, Some("acc_123".to_string()));
    }

    #[test]
    fn alert_acknowledge_sets_flag() {
        let mut alert = Alert::new(AlertType::PostFailed, Severity::Warning, "Test".to_string());

        alert.acknowledge();

        assert!(alert.acknowledged);
        assert!(alert.acknowledged_at.is_some());
    }

    #[test]
    fn alert_resolve_sets_flag() {
        let mut alert = Alert::new(AlertType::PostFailed, Severity::Warning, "Test".to_string());

        alert.resolve();

        assert!(alert.resolved);
        assert!(alert.resolved_at.is_some());
    }

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
        assert_eq!(stats.unresolved, 0);
        assert_eq!(stats.critical, 0);
        assert_eq!(stats.warnings, 0);
        assert_eq!(stats.last_24h, 0);
        assert_eq!(stats.last_hour, 0);
    }

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
    fn get_unresolved_filters_correctly() {
        let mut engine = AlertEngine::new();

        engine.create_alert(AlertType::PostPublished, Severity::Info, "1".to_string());
        let alert = engine.create_alert(AlertType::PostFailed, Severity::Warning, "2".to_string());
        engine.resolve_alert(&alert.id).unwrap();

        let unresolved = engine.get_unresolved_alerts();

        assert_eq!(unresolved.len(), 1);
    }

    #[test]
    fn get_critical_filters_correctly() {
        let mut engine = AlertEngine::new();

        engine.create_alert(AlertType::PostPublished, Severity::Info, "1".to_string());
        engine.create_alert(AlertType::AccountBlocked, Severity::Critical, "2".to_string());

        let critical = engine.get_critical_alerts();

        assert_eq!(critical.len(), 1);
        assert_eq!(critical[0].severity, Severity::Critical);
    }

    #[test]
    fn acknowledge_alert_works() {
        let mut engine = AlertEngine::new();
        let alert = engine.create_alert(AlertType::PostFailed, Severity::Warning, "Test".to_string());

        engine.acknowledge_alert(&alert.id).unwrap();

        let alerts = engine.get_alerts(None);
        assert!(alerts[0].acknowledged);
    }

    #[test]
    fn resolve_alert_works() {
        let mut engine = AlertEngine::new();
        let alert = engine.create_alert(AlertType::PostFailed, Severity::Warning, "Test".to_string());

        engine.resolve_alert(&alert.id).unwrap();

        let alerts = engine.get_alerts(None);
        assert!(alerts[0].resolved);
    }

    #[test]
    fn acknowledge_nonexistent_returns_error() {
        let mut engine = AlertEngine::new();

        let result = engine.acknowledge_alert("nonexistent-id");

        assert!(result.is_err());
    }

    #[test]
    fn resolve_nonexistent_returns_error() {
        let mut engine = AlertEngine::new();

        let result = engine.resolve_alert("nonexistent-id");

        assert!(result.is_err());
    }

    #[test]
    fn clear_old_alerts_removes_resolved() {
        let mut engine = AlertEngine::new();

        let alert = engine.create_alert(AlertType::PostPublished, Severity::Info, "Old".to_string());
        engine.resolve_alert(&alert.id).unwrap();

        let removed = engine.clear_old_alerts(0);

        assert!(removed >= 1);
    }

    #[test]
    fn clear_old_alerts_keeps_unresolved() {
        let mut engine = AlertEngine::new();

        engine.create_alert(AlertType::PostPublished, Severity::Info, "New".to_string());

        let removed = engine.clear_old_alerts(0);

        assert_eq!(removed, 0);
        assert_eq!(engine.get_alerts(None).len(), 1);
    }

    #[test]
    fn get_alerts_with_limit() {
        let mut engine = AlertEngine::new();

        for i in 0..10 {
            engine.create_alert(AlertType::PostPublished, Severity::Info, format!("Alert {}", i));
        }

        let limited = engine.get_alerts(Some(5));

        assert_eq!(limited.len(), 5);
    }

    #[test]
    fn alert_type_from_str_works() {
        assert_eq!(AlertType::from_str("post_published"), Some(AlertType::PostPublished));
        assert_eq!(AlertType::from_str("account_blocked"), Some(AlertType::AccountBlocked));
        assert_eq!(AlertType::from_str("invalid"), None);
    }

    #[test]
    fn alert_type_display_works() {
        assert_eq!(format!("{}", AlertType::PostPublished), "post_published");
        assert_eq!(format!("{}", AlertType::AccountBlocked), "account_blocked");
    }
}
