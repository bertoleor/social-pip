use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// PlatformHealthStatus - Current health state of a platform account.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PlatformHealthStatus {
    /// Account is healthy and can perform operations
    Healthy,
    /// Account has warnings but can still operate (reduced limits)
    Degraded,
    /// Account is temporarily restricted (circuit breaker open)
    Unhealthy,
    /// Account is permanently banned or requires manual intervention
    Critical,
}

impl std::fmt::Display for PlatformHealthStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PlatformHealthStatus::Healthy => write!(f, "healthy"),
            PlatformHealthStatus::Degraded => write!(f, "degraded"),
            PlatformHealthStatus::Unhealthy => write!(f, "unhealthy"),
            PlatformHealthStatus::Critical => write!(f, "critical"),
        }
    }
}

/// PlatformHealthConfig - Health thresholds for a specific platform.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformHealthConfig {
    /// Platform name (facebook, instagram, twitter, linkedin)
    pub platform: String,
    /// Failure count threshold for degraded status (default: 3)
    pub degraded_threshold: u32,
    /// Failure count threshold for unhealthy status (default: 5)
    pub unhealthy_threshold: u32,
    /// Failure count threshold for critical status (default: 10)
    pub critical_threshold: u32,
    /// Time window for counting failures (minutes, default: 60)
    pub window_minutes: u64,
}

impl Default for PlatformHealthConfig {
    fn default() -> Self {
        Self {
            platform: "facebook".to_string(),
            degraded_threshold: 3,
            unhealthy_threshold: 5,
            critical_threshold: 10,
            window_minutes: 60,
        }
    }
}

impl PlatformHealthConfig {
    pub fn for_platform(platform: &str) -> Self {
        match platform.to_lowercase().as_str() {
            "facebook" => Self {
                platform: "facebook".to_string(),
                degraded_threshold: 3,
                unhealthy_threshold: 5,
                critical_threshold: 10,
                window_minutes: 60,
            },
            "instagram" => Self {
                platform: "instagram".to_string(),
                degraded_threshold: 2,
                unhealthy_threshold: 4,
                critical_threshold: 8,
                window_minutes: 60,
            },
            "twitter" => Self {
                platform: "twitter".to_string(),
                degraded_threshold: 5,
                unhealthy_threshold: 10,
                critical_threshold: 20,
                window_minutes: 60,
            },
            "linkedin" => Self {
                platform: "linkedin".to_string(),
                degraded_threshold: 3,
                unhealthy_threshold: 5,
                critical_threshold: 8,
                window_minutes: 60,
            },
            _ => Self::default(),
        }
    }
}

/// HealthCheckResult - Result of a platform health check.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    /// Account ID that was checked
    pub account_id: String,
    /// Platform name
    pub platform: String,
    /// Current health status
    pub status: PlatformHealthStatus,
    /// Number of failures in the current window
    pub recent_failures: u32,
    /// When the account was last active
    pub last_activity: Option<DateTime<Utc>>,
    /// Human-readable message describing the status
    pub message: String,
    /// Timestamp of this check
    pub checked_at: DateTime<Utc>,
}

/// HealthChecker - Monitors account health across platforms.
///
/// Tracks failure counts and determines health status based on platform-specific
/// thresholds. Integrates with circuit breaker for account isolation.
pub struct HealthChecker {
    /// Platform-specific health configurations
    configs: HashMap<String, PlatformHealthConfig>,
}

impl HealthChecker {
    /// Create a new health checker with default platform configs.
    pub fn new() -> Self {
        let mut configs = HashMap::new();

        // Load configs for all supported platforms
        for platform in &["facebook", "instagram", "twitter", "linkedin"] {
            configs.insert(
                platform.to_string(),
                PlatformHealthConfig::for_platform(platform),
            );
        }

        Self { configs }
    }

    /// Create a new health checker with custom configs.
    pub fn with_configs(configs: HashMap<String, PlatformHealthConfig>) -> Self {
        Self { configs }
    }

    /// Get the health configuration for a platform.
    pub fn get_config(&self, platform: &str) -> Option<&PlatformHealthConfig> {
        self.configs.get(&platform.to_lowercase())
    }

    /// Check the health of a platform account.
    ///
    /// # Arguments
    /// - `platform`: Platform name (facebook, instagram, twitter, linkedin)
    /// - `account_id`: Account identifier
    /// - `recent_failures`: Number of failures in the configured window
    /// - `last_activity`: When the account was last active
    ///
    /// # Returns
    /// A HealthCheckResult with the current status and recommendations
    pub fn check_platform_health(
        &self,
        platform: &str,
        account_id: &str,
        recent_failures: u32,
        last_activity: Option<DateTime<Utc>>,
    ) -> HealthCheckResult {
        let config = self
            .get_config(platform)
            .cloned()
            .unwrap_or_else(|| PlatformHealthConfig::for_platform(platform));

        let status = self.determine_status(recent_failures, &config);

        let message = self.generate_message(&status, recent_failures, &config);

        HealthCheckResult {
            account_id: account_id.to_string(),
            platform: platform.to_string(),
            status,
            recent_failures,
            last_activity,
            message,
            checked_at: Utc::now(),
        }
    }

    /// Determine health status based on failure count and config.
    fn determine_status(
        &self,
        failures: u32,
        config: &PlatformHealthConfig,
    ) -> PlatformHealthStatus {
        if failures >= config.critical_threshold {
            PlatformHealthStatus::Critical
        } else if failures >= config.unhealthy_threshold {
            PlatformHealthStatus::Unhealthy
        } else if failures >= config.degraded_threshold {
            PlatformHealthStatus::Degraded
        } else {
            PlatformHealthStatus::Healthy
        }
    }

    /// Generate a human-readable message for the status.
    fn generate_message(
        &self,
        status: &PlatformHealthStatus,
        failures: u32,
        config: &PlatformHealthConfig,
    ) -> String {
        match status {
            PlatformHealthStatus::Healthy => "Account is operating normally".to_string(),
            PlatformHealthStatus::Degraded => {
                format!(
                    "Account showing warning signs: {} recent failures (threshold: {})",
                    failures, config.degraded_threshold
                )
            }
            PlatformHealthStatus::Unhealthy => {
                format!(
                    "Account temporarily restricted: {} recent failures (threshold: {}). Circuit breaker activated.",
                    failures, config.unhealthy_threshold
                )
            }
            PlatformHealthStatus::Critical => {
                format!(
                    "Account requires attention: {} recent failures (threshold: {}). Manual intervention recommended.",
                    failures, config.critical_threshold
                )
            }
        }
    }

    /// Add or update a platform config.
    pub fn set_config(&mut self, config: PlatformHealthConfig) {
        self.configs.insert(config.platform.to_lowercase(), config);
    }
}

impl Default for HealthChecker {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================
    // T4.5: HealthChecker::new() with platform configs
    // ============================================

    #[test]
    fn test_health_checker_new_loads_all_platforms() {
        let checker = HealthChecker::new();

        assert!(checker.get_config("facebook").is_some());
        assert!(checker.get_config("instagram").is_some());
        assert!(checker.get_config("twitter").is_some());
        assert!(checker.get_config("linkedin").is_some());
    }

    #[test]
    fn test_health_checker_new_has_correct_defaults() {
        let checker = HealthChecker::new();

        let fb_config = checker.get_config("facebook").unwrap();
        assert_eq!(fb_config.degraded_threshold, 3);
        assert_eq!(fb_config.unhealthy_threshold, 5);
        assert_eq!(fb_config.critical_threshold, 10);
        assert_eq!(fb_config.window_minutes, 60);
    }

    #[test]
    fn test_platform_health_config_defaults() {
        let config = PlatformHealthConfig::default();

        assert_eq!(config.platform, "facebook");
        assert_eq!(config.degraded_threshold, 3);
        assert_eq!(config.unhealthy_threshold, 5);
        assert_eq!(config.critical_threshold, 10);
        assert_eq!(config.window_minutes, 60);
    }

    #[test]
    fn test_platform_health_config_for_instagram() {
        let config = PlatformHealthConfig::for_platform("instagram");

        assert_eq!(config.platform, "instagram");
        assert_eq!(config.degraded_threshold, 2);
        assert_eq!(config.unhealthy_threshold, 4);
        assert_eq!(config.critical_threshold, 8);
    }

    #[test]
    fn test_platform_health_config_for_twitter() {
        let config = PlatformHealthConfig::for_platform("twitter");

        assert_eq!(config.platform, "twitter");
        assert_eq!(config.degraded_threshold, 5);
        assert_eq!(config.unhealthy_threshold, 10);
        assert_eq!(config.critical_threshold, 20);
    }

    #[test]
    fn test_platform_health_config_for_linkedin() {
        let config = PlatformHealthConfig::for_platform("linkedin");

        assert_eq!(config.platform, "linkedin");
        assert_eq!(config.degraded_threshold, 3);
        assert_eq!(config.unhealthy_threshold, 5);
        assert_eq!(config.critical_threshold, 8);
    }

    #[test]
    fn test_platform_health_config_unknown_platform() {
        let config = PlatformHealthConfig::for_platform("unknown");

        // Should use defaults
        assert_eq!(config.platform, "facebook");
    }

    // ============================================
    // T4.7: check_platform_health() returning status
    // ============================================

    #[test]
    fn test_check_platform_health_returns_healthy_for_zero_failures() {
        let checker = HealthChecker::new();

        let result = checker.check_platform_health("facebook", "acc_123", 0, None);

        assert_eq!(result.status, PlatformHealthStatus::Healthy);
        assert_eq!(result.account_id, "acc_123");
        assert_eq!(result.platform, "facebook");
        assert_eq!(result.recent_failures, 0);
    }

    #[test]
    fn test_check_platform_health_returns_degraded_at_threshold() {
        let checker = HealthChecker::new();

        // Facebook degraded threshold is 3
        let result = checker.check_platform_health("facebook", "acc_123", 3, None);

        assert_eq!(result.status, PlatformHealthStatus::Degraded);
        assert!(result.message.contains("warning signs"));
    }

    #[test]
    fn test_check_platform_health_returns_unhealthy_at_threshold() {
        let checker = HealthChecker::new();

        // Facebook unhealthy threshold is 5
        let result = checker.check_platform_health("facebook", "acc_123", 5, None);

        assert_eq!(result.status, PlatformHealthStatus::Unhealthy);
        assert!(result.message.contains("temporarily restricted"));
    }

    #[test]
    fn test_check_platform_health_returns_critical_at_threshold() {
        let checker = HealthChecker::new();

        // Facebook critical threshold is 10
        let result = checker.check_platform_health("facebook", "acc_123", 10, None);

        assert_eq!(result.status, PlatformHealthStatus::Critical);
        assert!(result.message.contains("requires attention"));
    }

    #[test]
    fn test_check_platform_health_includes_last_activity() {
        let checker = HealthChecker::new();
        let last_activity = Utc::now() - chrono::Duration::minutes(30);

        let result = checker.check_platform_health("facebook", "acc_123", 0, Some(last_activity));

        assert_eq!(result.last_activity, Some(last_activity));
    }

    #[test]
    fn test_check_platform_health_sets_checked_at() {
        let checker = HealthChecker::new();
        let before = Utc::now();

        let result = checker.check_platform_health("facebook", "acc_123", 0, None);

        let after = Utc::now();
        assert!(result.checked_at >= before);
        assert!(result.checked_at <= after);
    }

    #[test]
    fn test_platform_health_status_display() {
        assert_eq!(format!("{}", PlatformHealthStatus::Healthy), "healthy");
        assert_eq!(format!("{}", PlatformHealthStatus::Degraded), "degraded");
        assert_eq!(format!("{}", PlatformHealthStatus::Unhealthy), "unhealthy");
        assert_eq!(format!("{}", PlatformHealthStatus::Critical), "critical");
    }

    #[test]
    fn test_platform_health_status_equality() {
        assert_eq!(PlatformHealthStatus::Healthy, PlatformHealthStatus::Healthy);
        assert_ne!(
            PlatformHealthStatus::Healthy,
            PlatformHealthStatus::Degraded
        );
    }

    #[test]
    fn test_set_config_updates_existing() {
        let mut checker = HealthChecker::new();

        let new_config = PlatformHealthConfig {
            platform: "facebook".to_string(),
            degraded_threshold: 10,
            unhealthy_threshold: 20,
            critical_threshold: 30,
            window_minutes: 120,
        };

        checker.set_config(new_config);

        let config = checker.get_config("facebook").unwrap();
        assert_eq!(config.degraded_threshold, 10);
        assert_eq!(config.unhealthy_threshold, 20);
        assert_eq!(config.critical_threshold, 30);
    }

    #[test]
    fn test_with_configs_creates_custom_checker() {
        let mut configs = HashMap::new();
        configs.insert(
            "custom".to_string(),
            PlatformHealthConfig {
                platform: "custom".to_string(),
                degraded_threshold: 1,
                unhealthy_threshold: 2,
                critical_threshold: 3,
                window_minutes: 30,
            },
        );

        let checker = HealthChecker::with_configs(configs);

        let config = checker.get_config("custom").unwrap();
        assert_eq!(config.degraded_threshold, 1);
    }
}
