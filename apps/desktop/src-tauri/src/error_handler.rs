use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// UnifiedError - Single error taxonomy for all social-pip automation scenarios.
///
/// This enum categorizes ALL error types across the application, providing
/// consistent error handling and recovery strategy mapping.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum UnifiedError {
    /// Platform rate limiting detected (from BanRisk)
    RateLimit { subcategory: String },

    /// Session/login expired
    AuthExpired {
        platform: String,
        account_id: String,
    },

    /// Account flagged or restricted
    AccountRestricted { reason: String },

    /// Network/timeout errors
    NetworkFailure { is_timeout: bool },

    /// Browser/extension errors
    BrowserFailure { browser: String },

    /// Platform-specific failures
    PlatformError {
        code: Option<String>,
        message: String,
    },

    /// Content validation failed
    ValidationFailed { field: String, reason: String },

    /// Circuit breaker triggered
    CircuitOpen {
        account_id: String,
        until: DateTime<Utc>,
    },

    /// Idempotency conflict
    DuplicateTask { existing_task_id: String },

    /// Unclassified errors
    Unknown { message: String },
}

/// RecoveryStrategy - Defines how to handle each error type.
///
/// | Strategy | Behavior | Applicable Errors |
/// |----------|----------|-------------------|
/// | RetryWithBackoff | Exponential backoff retry (max 3) | RateLimit, NetworkFailure |
/// | CircuitBreak | Pause account, increment cooldown | AuthExpired, AccountRestricted |
/// | DeadLetter | Move to DLQ, no auto-retry | ValidationFailed, PlatformError |
/// | Escalate | Immediate alert + DLQ | Critical failures |
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecoveryStrategy {
    /// Exponential backoff retry: 2^attempt * base_delay_ms, max 5 minutes
    RetryWithBackoff {
        max_retries: u32,
        base_delay_ms: u64,
    },

    /// Pause account and increment cooldown level
    CircuitBreak { cooldown_level: u8 },

    /// Move to Dead Letter Queue, no auto-retry
    DeadLetter { reason: String },

    /// Immediate alert + DLQ for critical failures
    Escalate { severity: Severity },
}

/// Severity levels for escalation
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

/// ErrorClassifier - Maps errors to UnifiedError + RecoveryStrategy.
///
/// Uses default strategy mapping based on error type, with optional overrides.
#[allow(dead_code)]
pub struct ErrorClassifier {
    strategy_overrides: HashMap<UnifiedError, RecoveryStrategy>,
}

#[allow(dead_code)]
impl ErrorClassifier {
    /// Create a new classifier with default strategy mapping
    pub fn new() -> Self {
        Self {
            strategy_overrides: HashMap::new(),
        }
    }

    /// Add a strategy override for a specific error type
    pub fn with_override(mut self, error: UnifiedError, strategy: RecoveryStrategy) -> Self {
        self.strategy_overrides.insert(error, strategy);
        self
    }

    /// Classify an error and return the appropriate recovery strategy
    ///
    /// # Default Strategy Mapping
    /// - RateLimit → RetryWithBackoff (max 3, base 60s)
    /// - AuthExpired → CircuitBreak (level 1)
    /// - AccountRestricted → CircuitBreak (level 1)
    /// - NetworkFailure → RetryWithBackoff (max 3, base 30s)
    /// - BrowserFailure → DeadLetter
    /// - PlatformError → DeadLetter
    /// - ValidationFailed → DeadLetter
    /// - CircuitOpen → Escalate (Error)
    /// - DuplicateTask → DeadLetter
    /// - Unknown → DeadLetter
    pub fn classify(&self, error: &UnifiedError) -> RecoveryStrategy {
        // Check for overrides first
        if let Some(strategy) = self.strategy_overrides.get(error) {
            return strategy.clone();
        }

        // Default strategy mapping
        match error {
            UnifiedError::RateLimit { .. } => RecoveryStrategy::RetryWithBackoff {
                max_retries: 3,
                base_delay_ms: 60_000,
            },
            UnifiedError::AuthExpired { .. } => {
                RecoveryStrategy::CircuitBreak { cooldown_level: 1 }
            }
            UnifiedError::AccountRestricted { .. } => {
                RecoveryStrategy::CircuitBreak { cooldown_level: 1 }
            }
            UnifiedError::NetworkFailure { .. } => RecoveryStrategy::RetryWithBackoff {
                max_retries: 3,
                base_delay_ms: 30_000,
            },
            UnifiedError::BrowserFailure { .. } => RecoveryStrategy::DeadLetter {
                reason: "browser_failure".to_string(),
            },
            UnifiedError::PlatformError { .. } => RecoveryStrategy::DeadLetter {
                reason: "platform_error".to_string(),
            },
            UnifiedError::ValidationFailed { .. } => RecoveryStrategy::DeadLetter {
                reason: "validation_failed".to_string(),
            },
            UnifiedError::CircuitOpen { .. } => RecoveryStrategy::Escalate {
                severity: Severity::Error,
            },
            UnifiedError::DuplicateTask { .. } => RecoveryStrategy::DeadLetter {
                reason: "duplicate_task".to_string(),
            },
            UnifiedError::Unknown { .. } => RecoveryStrategy::DeadLetter {
                reason: "unknown_error".to_string(),
            },
        }
    }
}

impl Default for ErrorClassifier {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_unified_error_rate_limit_serialization() {
        let error = UnifiedError::RateLimit {
            subcategory: "hourly_limit".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("RateLimit"));
        assert!(json.contains("hourly_limit"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::RateLimit { .. }));
    }

    #[test]
    fn test_unified_error_auth_expired_serialization() {
        let error = UnifiedError::AuthExpired {
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("AuthExpired"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::AuthExpired { .. }));
    }

    #[test]
    fn test_unified_error_account_restricted_serialization() {
        let error = UnifiedError::AccountRestricted {
            reason: "suspicious_activity".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("AccountRestricted"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(
            deserialized,
            UnifiedError::AccountRestricted { .. }
        ));
    }

    #[test]
    fn test_unified_error_network_failure_serialization() {
        let error = UnifiedError::NetworkFailure { is_timeout: true };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("NetworkFailure"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::NetworkFailure { .. }));
    }

    #[test]
    fn test_unified_error_browser_failure_serialization() {
        let error = UnifiedError::BrowserFailure {
            browser: "chrome".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("BrowserFailure"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::BrowserFailure { .. }));
    }

    #[test]
    fn test_unified_error_platform_error_serialization() {
        let error = UnifiedError::PlatformError {
            code: Some("E001".to_string()),
            message: "Rate limited".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("PlatformError"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::PlatformError { .. }));
    }

    #[test]
    fn test_unified_error_validation_failed_serialization() {
        let error = UnifiedError::ValidationFailed {
            field: "content".to_string(),
            reason: "too_long".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("ValidationFailed"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(
            deserialized,
            UnifiedError::ValidationFailed { .. }
        ));
    }

    #[test]
    fn test_unified_error_circuit_open_serialization() {
        let error = UnifiedError::CircuitOpen {
            account_id: "acc_456".to_string(),
            until: chrono::Utc::now(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("CircuitOpen"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::CircuitOpen { .. }));
    }

    #[test]
    fn test_unified_error_duplicate_task_serialization() {
        let error = UnifiedError::DuplicateTask {
            existing_task_id: "task_789".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("DuplicateTask"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::DuplicateTask { .. }));
    }

    #[test]
    fn test_unified_error_unknown_serialization() {
        let error = UnifiedError::Unknown {
            message: "Unexpected error".to_string(),
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("Unknown"));

        let deserialized: UnifiedError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, UnifiedError::Unknown { .. }));
    }

    #[test]
    fn test_all_unified_error_variants_serializable() {
        // Test that all 10 variants can be serialized and deserialized
        let variants: Vec<UnifiedError> = vec![
            UnifiedError::RateLimit {
                subcategory: "test".to_string(),
            },
            UnifiedError::AuthExpired {
                platform: "test".to_string(),
                account_id: "test".to_string(),
            },
            UnifiedError::AccountRestricted {
                reason: "test".to_string(),
            },
            UnifiedError::NetworkFailure { is_timeout: false },
            UnifiedError::BrowserFailure {
                browser: "test".to_string(),
            },
            UnifiedError::PlatformError {
                code: None,
                message: "test".to_string(),
            },
            UnifiedError::ValidationFailed {
                field: "test".to_string(),
                reason: "test".to_string(),
            },
            UnifiedError::CircuitOpen {
                account_id: "test".to_string(),
                until: chrono::Utc::now(),
            },
            UnifiedError::DuplicateTask {
                existing_task_id: "test".to_string(),
            },
            UnifiedError::Unknown {
                message: "test".to_string(),
            },
        ];

        for error in variants {
            let json = serde_json::to_string(&error).unwrap();
            let _: UnifiedError = serde_json::from_str(&json).unwrap();
        }
    }

    // ============================================
    // RecoveryStrategy Tests
    // ============================================

    #[test]
    fn test_recovery_strategy_retry_with_backoff_serialization() {
        let strategy = RecoveryStrategy::RetryWithBackoff {
            max_retries: 3,
            base_delay_ms: 60_000,
        };
        let json = serde_json::to_string(&strategy).unwrap();
        assert!(json.contains("RetryWithBackoff"));
        assert!(json.contains("max_retries"));

        let deserialized: RecoveryStrategy = serde_json::from_str(&json).unwrap();
        assert!(matches!(
            deserialized,
            RecoveryStrategy::RetryWithBackoff { .. }
        ));
    }

    #[test]
    fn test_recovery_strategy_circuit_break_serialization() {
        let strategy = RecoveryStrategy::CircuitBreak { cooldown_level: 2 };
        let json = serde_json::to_string(&strategy).unwrap();
        assert!(json.contains("CircuitBreak"));
        assert!(json.contains("cooldown_level"));

        let deserialized: RecoveryStrategy = serde_json::from_str(&json).unwrap();
        assert!(matches!(
            deserialized,
            RecoveryStrategy::CircuitBreak { .. }
        ));
    }

    #[test]
    fn test_recovery_strategy_dead_letter_serialization() {
        let strategy = RecoveryStrategy::DeadLetter {
            reason: "non_retryable_error".to_string(),
        };
        let json = serde_json::to_string(&strategy).unwrap();
        assert!(json.contains("DeadLetter"));
        assert!(json.contains("reason"));

        let deserialized: RecoveryStrategy = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, RecoveryStrategy::DeadLetter { .. }));
    }

    #[test]
    fn test_recovery_strategy_escalate_serialization() {
        let strategy = RecoveryStrategy::Escalate {
            severity: Severity::Critical,
        };
        let json = serde_json::to_string(&strategy).unwrap();
        assert!(json.contains("Escalate"));
        assert!(json.contains("Critical"));

        let deserialized: RecoveryStrategy = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, RecoveryStrategy::Escalate { .. }));
    }

    #[test]
    fn test_severity_serialization() {
        let severities = vec![
            Severity::Info,
            Severity::Warning,
            Severity::Error,
            Severity::Critical,
        ];

        for severity in severities {
            let json = serde_json::to_string(&severity).unwrap();
            let deserialized: Severity = serde_json::from_str(&json).unwrap();
            assert_eq!(severity, deserialized);
        }
    }

    #[test]
    fn test_all_recovery_strategy_variants_serializable() {
        let strategies: Vec<RecoveryStrategy> = vec![
            RecoveryStrategy::RetryWithBackoff {
                max_retries: 3,
                base_delay_ms: 60_000,
            },
            RecoveryStrategy::CircuitBreak { cooldown_level: 1 },
            RecoveryStrategy::DeadLetter {
                reason: "test".to_string(),
            },
            RecoveryStrategy::Escalate {
                severity: Severity::Error,
            },
        ];

        for strategy in strategies {
            let json = serde_json::to_string(&strategy).unwrap();
            let _: RecoveryStrategy = serde_json::from_str(&json).unwrap();
        }
    }

    // ============================================
    // ErrorClassifier Tests
    // ============================================

    #[test]
    fn test_classifier_maps_rate_limit_to_retry_with_backoff() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::RateLimit {
            subcategory: "hourly_limit".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::RetryWithBackoff {
                max_retries,
                base_delay_ms,
            } => {
                assert_eq!(max_retries, 3);
                assert_eq!(base_delay_ms, 60_000);
            }
            _ => panic!("Expected RetryWithBackoff strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_auth_expired_to_circuit_break() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::AuthExpired {
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::CircuitBreak { cooldown_level } => {
                assert_eq!(cooldown_level, 1);
            }
            _ => panic!("Expected CircuitBreak strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_account_restricted_to_circuit_break() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::AccountRestricted {
            reason: "suspicious_activity".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::CircuitBreak { cooldown_level } => {
                assert_eq!(cooldown_level, 1);
            }
            _ => panic!("Expected CircuitBreak strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_network_failure_to_retry_with_backoff() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::NetworkFailure { is_timeout: true };

        match classifier.classify(&error) {
            RecoveryStrategy::RetryWithBackoff {
                max_retries,
                base_delay_ms,
            } => {
                assert_eq!(max_retries, 3);
                assert_eq!(base_delay_ms, 30_000);
            }
            _ => panic!("Expected RetryWithBackoff strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_browser_failure_to_dead_letter() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::BrowserFailure {
            browser: "chrome".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::DeadLetter { reason } => {
                assert_eq!(reason, "browser_failure");
            }
            _ => panic!("Expected DeadLetter strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_platform_error_to_dead_letter() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::PlatformError {
            code: Some("E001".to_string()),
            message: "Rate limited".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::DeadLetter { reason } => {
                assert_eq!(reason, "platform_error");
            }
            _ => panic!("Expected DeadLetter strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_validation_failed_to_dead_letter() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::ValidationFailed {
            field: "content".to_string(),
            reason: "too_long".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::DeadLetter { reason } => {
                assert_eq!(reason, "validation_failed");
            }
            _ => panic!("Expected DeadLetter strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_circuit_open_to_escalate() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::CircuitOpen {
            account_id: "acc_456".to_string(),
            until: chrono::Utc::now(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::Escalate { severity } => {
                assert_eq!(severity, Severity::Error);
            }
            _ => panic!("Expected Escalate strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_duplicate_task_to_dead_letter() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::DuplicateTask {
            existing_task_id: "task_789".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::DeadLetter { reason } => {
                assert_eq!(reason, "duplicate_task");
            }
            _ => panic!("Expected DeadLetter strategy"),
        }
    }

    #[test]
    fn test_classifier_maps_unknown_to_dead_letter() {
        let classifier = ErrorClassifier::new();
        let error = UnifiedError::Unknown {
            message: "Unexpected error".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::DeadLetter { reason } => {
                assert_eq!(reason, "unknown_error");
            }
            _ => panic!("Expected DeadLetter strategy"),
        }
    }

    #[test]
    fn test_classifier_supports_strategy_overrides() {
        // Override RateLimit to use DeadLetter instead of RetryWithBackoff
        let classifier = ErrorClassifier::new().with_override(
            UnifiedError::RateLimit {
                subcategory: "hourly_limit".to_string(),
            },
            RecoveryStrategy::DeadLetter {
                reason: "custom_override".to_string(),
            },
        );

        let error = UnifiedError::RateLimit {
            subcategory: "hourly_limit".to_string(),
        };

        match classifier.classify(&error) {
            RecoveryStrategy::DeadLetter { reason } => {
                assert_eq!(reason, "custom_override");
            }
            _ => panic!("Expected DeadLetter strategy from override"),
        }
    }

    #[test]
    fn test_classifier_default_trait() {
        let classifier = ErrorClassifier::default();
        let error = UnifiedError::RateLimit {
            subcategory: "test".to_string(),
        };

        // Should work the same as ErrorClassifier::new()
        match classifier.classify(&error) {
            RecoveryStrategy::RetryWithBackoff { .. } => {}
            _ => panic!("Expected RetryWithBackoff strategy"),
        }
    }
}
