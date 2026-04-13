//! Feature flags module - Toggle functionality for error handling system
//!
//! This module provides feature flags to enable/disable error handling components
//! at runtime, allowing for gradual rollout and safe operation.

use serde::{Deserialize, Serialize};

/// FeatureFlags - Toggle switches for error handling components.
///
/// All flags default to `true` for production safety. Disabled features
/// bypass their respective checks in the execution path.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlags {
    /// Enable circuit breaker checks (default: true)
    /// When disabled, all accounts are always allowed to execute
    pub circuit_breaker_enabled: bool,

    /// Enable dead letter queue operations (default: true)
    /// When disabled, failed tasks are not stored for retry
    pub dlq_enabled: bool,

    /// Enable idempotency checks (default: true)
    /// When disabled, duplicate tasks are allowed through
    pub idempotency_enabled: bool,

    /// Enable health checks (default: true)
    /// When disabled, health status is not tracked
    pub health_check_enabled: bool,

    /// Enable cooldown escalation (default: true)
    /// When disabled, cooldown levels are not applied
    pub cooldown_enabled: bool,
}

impl Default for FeatureFlags {
    fn default() -> Self {
        Self {
            circuit_breaker_enabled: true,
            dlq_enabled: true,
            idempotency_enabled: true,
            health_check_enabled: true,
            cooldown_enabled: true,
        }
    }
}

impl FeatureFlags {
    /// Create new feature flags with all features enabled
    pub fn new() -> Self {
        Self::default()
    }

    /// Create feature flags with all features disabled
    /// Useful for testing or emergency shutdown
    pub fn all_disabled() -> Self {
        Self {
            circuit_breaker_enabled: false,
            dlq_enabled: false,
            idempotency_enabled: false,
            health_check_enabled: false,
            cooldown_enabled: false,
        }
    }

    /// Check if circuit breaker is enabled and should be applied
    pub fn is_circuit_breaker_active(&self) -> bool {
        self.circuit_breaker_enabled
    }

    /// Check if DLQ is enabled and should be used
    pub fn is_dlq_active(&self) -> bool {
        self.dlq_enabled
    }

    /// Check if idempotency checks are enabled
    pub fn is_idempotency_active(&self) -> bool {
        self.idempotency_enabled
    }

    /// Check if health checks are enabled
    pub fn is_health_check_active(&self) -> bool {
        self.health_check_enabled
    }

    /// Check if cooldown escalation is enabled
    pub fn is_cooldown_active(&self) -> bool {
        self.cooldown_enabled
    }

    /// Create a builder for custom configuration
    pub fn builder() -> FeatureFlagsBuilder {
        FeatureFlagsBuilder::default()
    }
}

/// Builder for FeatureFlags with fluent API
#[derive(Default)]
pub struct FeatureFlagsBuilder {
    circuit_breaker_enabled: Option<bool>,
    dlq_enabled: Option<bool>,
    idempotency_enabled: Option<bool>,
    health_check_enabled: Option<bool>,
    cooldown_enabled: Option<bool>,
}

impl FeatureFlagsBuilder {
    /// Set circuit breaker enabled status
    pub fn circuit_breaker(mut self, enabled: bool) -> Self {
        self.circuit_breaker_enabled = Some(enabled);
        self
    }

    /// Set DLQ enabled status
    pub fn dlq(mut self, enabled: bool) -> Self {
        self.dlq_enabled = Some(enabled);
        self
    }

    /// Set idempotency enabled status
    pub fn idempotency(mut self, enabled: bool) -> Self {
        self.idempotency_enabled = Some(enabled);
        self
    }

    /// Set health check enabled status
    pub fn health_check(mut self, enabled: bool) -> Self {
        self.health_check_enabled = Some(enabled);
        self
    }

    /// Set cooldown enabled status
    pub fn cooldown(mut self, enabled: bool) -> Self {
        self.cooldown_enabled = Some(enabled);
        self
    }

    /// Build the FeatureFlags instance
    pub fn build(self) -> FeatureFlags {
        FeatureFlags {
            circuit_breaker_enabled: self.circuit_breaker_enabled.unwrap_or(true),
            dlq_enabled: self.dlq_enabled.unwrap_or(true),
            idempotency_enabled: self.idempotency_enabled.unwrap_or(true),
            health_check_enabled: self.health_check_enabled.unwrap_or(true),
            cooldown_enabled: self.cooldown_enabled.unwrap_or(true),
        }
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================
    // T8.1: Test FeatureFlags struct with all toggles
    // ============================================

    #[test]
    fn test_feature_flags_default_all_enabled() {
        let flags = FeatureFlags::default();

        assert!(flags.circuit_breaker_enabled);
        assert!(flags.dlq_enabled);
        assert!(flags.idempotency_enabled);
        assert!(flags.health_check_enabled);
        assert!(flags.cooldown_enabled);
    }

    #[test]
    fn test_feature_flags_all_disabled() {
        let flags = FeatureFlags::all_disabled();

        assert!(!flags.circuit_breaker_enabled);
        assert!(!flags.dlq_enabled);
        assert!(!flags.idempotency_enabled);
        assert!(!flags.health_check_enabled);
        assert!(!flags.cooldown_enabled);
    }

    #[test]
    fn test_feature_flags_serialization() {
        let flags = FeatureFlags::default();
        let json = serde_json::to_string(&flags).unwrap();

        assert!(json.contains("circuit_breaker_enabled"));
        assert!(json.contains("dlq_enabled"));
        assert!(json.contains("idempotency_enabled"));
        assert!(json.contains("health_check_enabled"));
        assert!(json.contains("cooldown_enabled"));

        let deserialized: FeatureFlags = serde_json::from_str(&json).unwrap();
        assert_eq!(
            flags.circuit_breaker_enabled,
            deserialized.circuit_breaker_enabled
        );
        assert_eq!(flags.dlq_enabled, deserialized.dlq_enabled);
    }

    #[test]
    fn test_feature_flags_custom_configuration() {
        let flags = FeatureFlags {
            circuit_breaker_enabled: true,
            dlq_enabled: false,
            idempotency_enabled: true,
            health_check_enabled: false,
            cooldown_enabled: true,
        };

        assert!(flags.circuit_breaker_enabled);
        assert!(!flags.dlq_enabled);
        assert!(flags.idempotency_enabled);
        assert!(!flags.health_check_enabled);
        assert!(flags.cooldown_enabled);
    }

    // ============================================
    // T8.2: Test activation methods
    // ============================================

    #[test]
    fn test_is_circuit_breaker_active() {
        let enabled = FeatureFlags::default();
        assert!(enabled.is_circuit_breaker_active());

        let disabled = FeatureFlags::all_disabled();
        assert!(!disabled.is_circuit_breaker_active());
    }

    #[test]
    fn test_is_dlq_active() {
        let enabled = FeatureFlags::default();
        assert!(enabled.is_dlq_active());

        let disabled = FeatureFlags::all_disabled();
        assert!(!disabled.is_dlq_active());
    }

    #[test]
    fn test_is_idempotency_active() {
        let enabled = FeatureFlags::default();
        assert!(enabled.is_idempotency_active());

        let disabled = FeatureFlags::all_disabled();
        assert!(!disabled.is_idempotency_active());
    }

    #[test]
    fn test_is_health_check_active() {
        let enabled = FeatureFlags::default();
        assert!(enabled.is_health_check_active());

        let disabled = FeatureFlags::all_disabled();
        assert!(!disabled.is_health_check_active());
    }

    #[test]
    fn test_is_cooldown_active() {
        let enabled = FeatureFlags::default();
        assert!(enabled.is_cooldown_active());

        let disabled = FeatureFlags::all_disabled();
        assert!(!disabled.is_cooldown_active());
    }

    // ============================================
    // T8.3: Test flag checking in execution path
    // ============================================

    #[test]
    fn test_builder_pattern() {
        let flags = FeatureFlags::builder()
            .circuit_breaker(false)
            .dlq(true)
            .idempotency(false)
            .health_check(true)
            .cooldown(false)
            .build();

        assert!(!flags.circuit_breaker_enabled);
        assert!(flags.dlq_enabled);
        assert!(!flags.idempotency_enabled);
        assert!(flags.health_check_enabled);
        assert!(!flags.cooldown_enabled);
    }

    #[test]
    fn test_builder_uses_defaults_for_unset() {
        let flags = FeatureFlags::builder().circuit_breaker(false).build();

        assert!(!flags.circuit_breaker_enabled);
        // Others should default to true
        assert!(flags.dlq_enabled);
        assert!(flags.idempotency_enabled);
        assert!(flags.health_check_enabled);
        assert!(flags.cooldown_enabled);
    }

    #[test]
    fn test_feature_flags_new_equals_default() {
        let new_flags = FeatureFlags::new();
        let default_flags = FeatureFlags::default();

        assert_eq!(
            new_flags.circuit_breaker_enabled,
            default_flags.circuit_breaker_enabled
        );
        assert_eq!(new_flags.dlq_enabled, default_flags.dlq_enabled);
        assert_eq!(
            new_flags.idempotency_enabled,
            default_flags.idempotency_enabled
        );
        assert_eq!(
            new_flags.health_check_enabled,
            default_flags.health_check_enabled
        );
        assert_eq!(new_flags.cooldown_enabled, default_flags.cooldown_enabled);
    }

    // ============================================
    // T8.4: Test feature flag checks in operations
    // ============================================

    #[test]
    fn test_circuit_breaker_operation_respects_flag() {
        // When flag is enabled, operation should be blocked when circuit is open
        let flags_enabled = FeatureFlags::default();
        assert!(flags_enabled.is_circuit_breaker_active());

        // Simulate: if flag enabled, check circuit breaker state
        let should_check = flags_enabled.is_circuit_breaker_active();
        assert!(should_check);

        // When flag is disabled, operation should bypass circuit breaker
        let flags_disabled = FeatureFlags {
            circuit_breaker_enabled: false,
            ..Default::default()
        };

        let should_check = flags_disabled.is_circuit_breaker_active();
        assert!(!should_check);
        // Operation would bypass circuit breaker check
    }

    #[test]
    fn test_dlq_operation_respects_flag() {
        // When flag is enabled, failed tasks go to DLQ
        let flags_enabled = FeatureFlags::default();
        assert!(flags_enabled.is_dlq_active());

        // When flag is disabled, failed tasks are not stored
        let flags_disabled = FeatureFlags {
            dlq_enabled: false,
            ..Default::default()
        };

        assert!(!flags_disabled.is_dlq_active());
        // Operation would skip DLQ storage
    }

    #[test]
    fn test_idempotency_operation_respects_flag() {
        // When flag is enabled, duplicate tasks are rejected
        let flags_enabled = FeatureFlags::default();
        assert!(flags_enabled.is_idempotency_active());

        // When flag is disabled, duplicates are allowed
        let flags_disabled = FeatureFlags {
            idempotency_enabled: false,
            ..Default::default()
        };

        assert!(!flags_disabled.is_idempotency_active());
        // Operation would skip idempotency check
    }

    #[test]
    fn test_multiple_flags_combination() {
        // Test a realistic scenario: disable DLQ but keep other checks
        let flags = FeatureFlags {
            circuit_breaker_enabled: true,
            dlq_enabled: false, // DLQ disabled
            idempotency_enabled: true,
            health_check_enabled: true,
            cooldown_enabled: false, // Cooldown disabled
        };

        assert!(flags.is_circuit_breaker_active());
        assert!(!flags.is_dlq_active());
        assert!(flags.is_idempotency_active());
        assert!(flags.is_health_check_active());
        assert!(!flags.is_cooldown_active());
    }

    #[test]
    fn test_emergency_shutdown_scenario() {
        // In emergency, disable all safety features
        let emergency_flags = FeatureFlags::all_disabled();

        // All operations would bypass safety checks
        assert!(!emergency_flags.is_circuit_breaker_active());
        assert!(!emergency_flags.is_dlq_active());
        assert!(!emergency_flags.is_idempotency_active());
        assert!(!emergency_flags.is_health_check_active());
        assert!(!emergency_flags.is_cooldown_active());
    }

    #[test]
    fn test_graceful_rollout_scenario() {
        // Gradually enable features one by one
        let stage1 = FeatureFlags::builder()
            .circuit_breaker(true)
            .dlq(false)
            .idempotency(false)
            .health_check(false)
            .cooldown(false)
            .build();

        assert!(stage1.is_circuit_breaker_active());

        let stage2 = FeatureFlags::builder()
            .circuit_breaker(true)
            .dlq(true)
            .idempotency(false)
            .health_check(false)
            .cooldown(false)
            .build();

        assert!(stage2.is_circuit_breaker_active());
        assert!(stage2.is_dlq_active());

        let full_rollout = FeatureFlags::builder()
            .circuit_breaker(true)
            .dlq(true)
            .idempotency(true)
            .health_check(true)
            .cooldown(true)
            .build();

        assert!(full_rollout.is_circuit_breaker_active());
        assert!(full_rollout.is_dlq_active());
        assert!(full_rollout.is_idempotency_active());
        assert!(full_rollout.is_health_check_active());
        assert!(full_rollout.is_cooldown_active());
    }
}
