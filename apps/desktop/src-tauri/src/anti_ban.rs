use chrono::{DateTime, Duration, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

use crate::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig, CircuitState};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiBanConfig {
    pub platform: String,
    pub min_action_delay_ms: u64,
    pub max_action_delay_ms: u64,
    pub hourly_action_limit: u32,
    pub daily_action_limit: u32,
    pub session_gap_min_minutes: u64,
    pub human_like_typing: bool,
    pub jitter_percentage: f32,
    pub batch_size: u32,
    pub batch_break_minutes: u32,
}

impl Default for AntiBanConfig {
    fn default() -> Self {
        Self {
            platform: "facebook".to_string(),
            min_action_delay_ms: 60_000,
            max_action_delay_ms: 240_000,
            hourly_action_limit: 20,
            daily_action_limit: 60,
            session_gap_min_minutes: 120,
            human_like_typing: true,
            jitter_percentage: 0.15,
            batch_size: 5,
            batch_break_minutes: 20,
        }
    }
}

impl AntiBanConfig {
    pub fn platform_name(&self) -> &str {
        &self.platform
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionRecord {
    pub action_type: String,
    pub timestamp: DateTime<Utc>,
    pub success: bool,
    pub delay_used_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BanRisk {
    HourlyLimitExceeded,
    DailyLimitExceeded,
    BurstPattern,
    RateLimitDetected,
    AccountRestricted,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum RiskLevel {
    None,
    Medium,
    High,
    Critical,
}

pub struct AntiBanEngine {
    config: AntiBanConfig,
    history: VecDeque<ActionRecord>,
    current_batch_count: u32,
    batch_start_time: Option<DateTime<Utc>>,
    circuit_breaker: CircuitBreaker,
    medium_threshold_emitted: bool,
    high_threshold_emitted: bool,
    critical_threshold_emitted: bool,
}

impl AntiBanEngine {
    pub fn new(config: AntiBanConfig) -> Self {
        let circuit_config = CircuitBreakerConfig::for_platform(&config.platform);
        Self {
            config,
            history: VecDeque::with_capacity(1000),
            current_batch_count: 0,
            batch_start_time: None,
            circuit_breaker: CircuitBreaker::new(circuit_config),
            medium_threshold_emitted: false,
            high_threshold_emitted: false,
            critical_threshold_emitted: false,
        }
    }

    pub fn with_circuit_breaker(
        config: AntiBanConfig,
        circuit_config: CircuitBreakerConfig,
    ) -> Self {
        Self {
            config,
            history: VecDeque::with_capacity(1000),
            current_batch_count: 0,
            batch_start_time: None,
            circuit_breaker: CircuitBreaker::new(circuit_config),
            medium_threshold_emitted: false,
            high_threshold_emitted: false,
            critical_threshold_emitted: false,
        }
    }

    pub fn next_action_delay_ms(&self) -> u64 {
        let base_delay = rand::thread_rng()
            .gen_range(self.config.min_action_delay_ms..=self.config.max_action_delay_ms);
        let jitter = (base_delay as f32 * self.config.jitter_percentage) as u64;
        let actual_jitter = rand::thread_rng().gen_range(0..=jitter);
        base_delay + actual_jitter
    }

    /// Check if execution is allowed.
    ///
    /// This method now checks:
    /// 1. Circuit breaker state (if open, blocks execution)
    /// 2. Hourly action limits
    /// 3. Daily action limits
    /// 4. Burst pattern detection
    ///
    /// # Returns
    /// - `Ok(())`: Execution is allowed
    /// - `Err(BanRisk)`: Execution is blocked with reason
    ///
    /// # T5.6: Wire can_execute() to check circuit breaker state
    pub fn can_execute(&mut self, action_type: &str) -> Result<(), BanRisk> {
        // T5.6: First check circuit breaker state
        if !self.circuit_breaker.can_execute() {
            return Err(BanRisk::AccountRestricted);
        }

        let now = Utc::now();

        let recent_count = self
            .history
            .iter()
            .filter(|r| r.action_type == action_type && r.timestamp > now - Duration::hours(1))
            .count() as u32;

        if recent_count >= self.config.hourly_action_limit {
            return Err(BanRisk::HourlyLimitExceeded);
        }

        let today_count = self
            .history
            .iter()
            .filter(|r| r.timestamp > now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc())
            .count() as u32;

        if today_count >= self.config.daily_action_limit {
            return Err(BanRisk::DailyLimitExceeded);
        }

        if self.detect_burst_pattern() {
            return Err(BanRisk::BurstPattern);
        }

        Ok(())
    }

    /// Get the current circuit breaker state
    pub fn circuit_state(&self) -> CircuitState {
        self.circuit_breaker.state()
    }

    /// Record a successful operation (for circuit breaker)
    pub fn record_success(&mut self) {
        self.circuit_breaker.record_success();
    }

    /// Record a failed operation (for circuit breaker)
    pub fn record_failure(&mut self) {
        self.circuit_breaker.record_failure();
    }

    /// Reset the circuit breaker
    pub fn reset_circuit(&mut self) {
        self.circuit_breaker.reset();
    }

    fn detect_burst_pattern(&self) -> bool {
        let last_5 = self.history.iter().rev().take(5).collect::<Vec<_>>();

        if last_5.len() < 5 {
            return false;
        }

        let total_delay: i64 = last_5
            .windows(2)
            .map(|w| (w[1].timestamp - w[0].timestamp).num_seconds() as i64)
            .sum();

        let avg_delay = total_delay / 4;

        avg_delay < 30
    }

    pub fn record_action(&mut self, action_type: String, success: bool, delay_used_ms: u64) {
        let record = ActionRecord {
            action_type,
            timestamp: Utc::now(),
            success,
            delay_used_ms,
        };

        if self.history.len() >= 1000 {
            self.history.pop_front();
        }
        self.history.push_back(record);

        if success {
            self.current_batch_count += 1;

            if self.batch_start_time.is_none() {
                self.batch_start_time = Some(Utc::now());
            }
        }
    }

    pub fn should_take_batch_break(&self) -> bool {
        if self.current_batch_count >= self.config.batch_size {
            if let Some(start) = self.batch_start_time {
                let elapsed = Utc::now() - start;
                return elapsed.num_minutes() >= self.config.batch_break_minutes as i64;
            }
        }
        false
    }

    pub fn reset_batch(&mut self) {
        self.current_batch_count = 0;
        self.batch_start_time = None;
    }

    pub fn calculate_risk_level(&self) -> RiskLevel {
        let daily_count = self.get_daily_count();
        let daily_limit = self.config.daily_action_limit;

        if daily_limit == 0 {
            return RiskLevel::None;
        }

        let percentage = (daily_count as f32 / daily_limit as f32) * 100.0;

        if percentage >= 90.0 {
            RiskLevel::Critical
        } else if percentage >= 75.0 {
            RiskLevel::High
        } else if percentage >= 50.0 {
            RiskLevel::Medium
        } else {
            RiskLevel::None
        }
    }

    fn get_daily_count(&self) -> u32 {
        let now = Utc::now();
        let today_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
        self.history
            .iter()
            .filter(|r| r.timestamp > today_start)
            .count() as u32
    }

    pub fn check_and_emit_risk_event(&mut self) -> Option<RiskLevel> {
        let current_level = self.calculate_risk_level();

        match current_level {
            RiskLevel::Critical if !self.critical_threshold_emitted => {
                self.critical_threshold_emitted = true;
                Some(RiskLevel::Critical)
            }
            RiskLevel::High if !self.high_threshold_emitted => {
                self.high_threshold_emitted = true;
                Some(RiskLevel::High)
            }
            RiskLevel::Medium if !self.medium_threshold_emitted => {
                self.medium_threshold_emitted = true;
                Some(RiskLevel::Medium)
            }
            _ => None,
        }
    }

    pub fn get_batch_break_duration_ms(&self) -> u64 {
        self.config.batch_break_minutes as u64 * 60_000
    }

    pub fn should_insert_batch_break(&self) -> bool {
        self.current_batch_count >= self.config.batch_size
    }

    pub fn typing_delay_ms(&self, text: &str) -> Vec<u64> {
        if !self.config.human_like_typing {
            return vec![];
        }

        let base_delay = self.config.min_action_delay_ms / 20;

        text.chars()
            .map(|c| {
                let mut delay = rand::thread_rng().gen_range(base_delay..=base_delay * 2);

                if c == '.' || c == ',' || c == '!' || c == '?' {
                    delay += rand::thread_rng().gen_range(200..=400);
                }

                if c == ' ' {
                    delay += rand::thread_rng().gen_range(50..=150);
                }

                delay
            })
            .collect()
    }

    pub fn get_stats(&self) -> AntiBanStats {
        let now = Utc::now();
        let hour_ago = now - Duration::hours(1);
        let today_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();

        let hourly_count = self
            .history
            .iter()
            .filter(|r| r.timestamp > hour_ago)
            .count() as u32;

        let daily_count = self
            .history
            .iter()
            .filter(|r| r.timestamp > today_start)
            .count() as u32;

        let success_rate = if !self.history.is_empty() {
            let success = self.history.iter().filter(|r| r.success).count();
            (success as f32 / self.history.len() as f32) * 100.0
        } else {
            100.0
        };

        AntiBanStats {
            hourly_count,
            daily_count,
            success_rate,
            batch_count: self.current_batch_count,
            config: self.config.clone(),
            risk_level: self.calculate_risk_level(),
            daily_limit: self.config.daily_action_limit,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiBanStats {
    pub hourly_count: u32,
    pub daily_count: u32,
    pub success_rate: f32,
    pub batch_count: u32,
    pub config: AntiBanConfig,
    pub risk_level: RiskLevel,
    pub daily_limit: u32,
}

pub fn get_platform_config(platform: &str) -> AntiBanConfig {
    match platform {
        "facebook_groups" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 60_000,
            max_action_delay_ms: 240_000,
            hourly_action_limit: 20,
            daily_action_limit: 60,
            session_gap_min_minutes: 120,
            human_like_typing: true,
            jitter_percentage: 0.15,
            batch_size: 5,
            batch_break_minutes: 20,
        },
        "facebook_marketplace" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 30_000,
            max_action_delay_ms: 60_000,
            hourly_action_limit: 10,
            daily_action_limit: 30,
            session_gap_min_minutes: 180,
            human_like_typing: true,
            jitter_percentage: 0.10,
            batch_size: 5,
            batch_break_minutes: 15,
        },
        "instagram" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 90_000,
            max_action_delay_ms: 300_000,
            hourly_action_limit: 15,
            daily_action_limit: 45,
            session_gap_min_minutes: 90,
            human_like_typing: true,
            jitter_percentage: 0.20,
            batch_size: 5,
            batch_break_minutes: 30,
        },
        "twitter" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 30_000,
            max_action_delay_ms: 120_000,
            hourly_action_limit: 50,
            daily_action_limit: 150,
            session_gap_min_minutes: 60,
            human_like_typing: true,
            jitter_percentage: 0.10,
            batch_size: 10,
            batch_break_minutes: 20,
        },
        "tiktok" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 120_000,
            max_action_delay_ms: 300_000,
            hourly_action_limit: 10,
            daily_action_limit: 25,
            session_gap_min_minutes: 180,
            human_like_typing: true,
            jitter_percentage: 0.25,
            batch_size: 5,
            batch_break_minutes: 30,
        },
        "linkedin" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 60_000,
            max_action_delay_ms: 180_000,
            hourly_action_limit: 25,
            daily_action_limit: 75,
            session_gap_min_minutes: 90,
            human_like_typing: true,
            jitter_percentage: 0.15,
            batch_size: 10,
            batch_break_minutes: 25,
        },
        _ => AntiBanConfig::default(),
    }
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_anti_ban_config_default() {
        let config = AntiBanConfig::default();
        assert_eq!(config.platform, "facebook");
        assert_eq!(config.min_action_delay_ms, 60_000);
        assert_eq!(config.max_action_delay_ms, 240_000);
    }

    #[test]
    fn test_next_action_delay_in_range() {
        let config = AntiBanConfig::default();
        let engine = AntiBanEngine::new(config);

        for _ in 0..100 {
            let delay = engine.next_action_delay_ms();
            assert!(delay >= 60_000);
            assert!(delay <= 240_000 + 36_000); // max + jitter
        }
    }

    #[test]
    fn test_can_execute_when_healthy() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        let result = engine.can_execute("post");
        assert!(result.is_ok());
    }

    #[test]
    fn test_record_action_adds_to_history() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        engine.record_action("post".to_string(), true, 60_000);

        assert_eq!(engine.history.len(), 1);
    }

    #[test]
    fn test_get_stats() {
        let config = AntiBanConfig::default();
        let engine = AntiBanEngine::new(config);

        let stats = engine.get_stats();
        assert_eq!(stats.hourly_count, 0);
        assert_eq!(stats.daily_count, 0);
    }

    // ============================================
    // T5.5: AntiBanEngine integration with circuit breaker
    // ============================================

    #[test]
    fn test_can_execute_blocked_by_circuit_breaker() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        // Circuit breaker starts closed
        assert_eq!(engine.circuit_state(), CircuitState::Closed);

        // Record enough failures to trip the circuit
        for _ in 0..5 {
            engine.record_failure();
        }

        // Circuit should be open now
        assert_eq!(engine.circuit_state(), CircuitState::Open);

        // can_execute should return AccountRestricted
        let result = engine.can_execute("post");
        assert!(matches!(result, Err(BanRisk::AccountRestricted)));
    }

    #[test]
    fn test_circuit_breaker_integration_allows_when_closed() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        // Initially circuit is closed
        assert_eq!(engine.circuit_state(), CircuitState::Closed);

        // Should allow execution
        let result = engine.can_execute("post");
        assert!(result.is_ok());
    }

    #[test]
    fn test_record_success_keeps_circuit_closed() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        // Record successes
        for _ in 0..3 {
            engine.record_success();
        }

        // Circuit should remain closed
        assert_eq!(engine.circuit_state(), CircuitState::Closed);
    }

    #[test]
    fn test_circuit_reset_clears_block() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        // Trip the circuit
        for _ in 0..5 {
            engine.record_failure();
        }
        assert_eq!(engine.circuit_state(), CircuitState::Open);

        // Reset circuit
        engine.reset_circuit();

        // Should be closed again
        assert_eq!(engine.circuit_state(), CircuitState::Closed);

        // Execution should be allowed
        let result = engine.can_execute("post");
        assert!(result.is_ok());
    }

    #[test]
    fn test_circuit_state_exposed() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        // Initially closed
        assert_eq!(engine.circuit_state(), CircuitState::Closed);

        // After failures
        for _ in 0..5 {
            engine.record_failure();
        }
        assert_eq!(engine.circuit_state(), CircuitState::Open);

        // After reset
        engine.reset_circuit();
        assert_eq!(engine.circuit_state(), CircuitState::Closed);
    }

    #[test]
    fn test_can_execute_checks_circuit_first() {
        let config = AntiBanConfig::default();
        let mut engine = AntiBanEngine::new(config);

        // Add some history to allow under normal limits
        for i in 0..3 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        // Should still allow (under hourly limit)
        let result = engine.can_execute("post");
        assert!(result.is_ok());

        // Trip the circuit
        for _ in 0..5 {
            engine.record_failure();
        }

        // Now should be blocked by circuit even though under limits
        let result = engine.can_execute("post");
        assert!(matches!(result, Err(BanRisk::AccountRestricted)));
    }

    #[test]
    fn test_get_platform_config_facebook_groups() {
        let config = get_platform_config("facebook_groups");
        assert_eq!(config.platform, "facebook_groups");
        assert_eq!(config.min_action_delay_ms, 60_000);
        assert_eq!(config.max_action_delay_ms, 240_000);
        assert_eq!(config.hourly_action_limit, 20);
        assert_eq!(config.daily_action_limit, 60);
    }

    #[test]
    fn test_get_platform_config_instagram() {
        let config = get_platform_config("instagram");
        assert_eq!(config.platform, "instagram");
        assert_eq!(config.min_action_delay_ms, 90_000);
        assert_eq!(config.max_action_delay_ms, 300_000);
        assert_eq!(config.hourly_action_limit, 15);
        assert_eq!(config.daily_action_limit, 45);
    }

    #[test]
    fn test_get_platform_config_unknown_returns_default() {
        let config = get_platform_config("unknown_platform");
        assert_eq!(config.platform, "facebook");
    }

    #[test]
    fn test_get_platform_config_by_target() {
        let target = crate::commands::posting::PlatformTarget {
            platform: "facebook_groups".to_string(),
            account_id: "acc_123".to_string(),
            targets: vec!["group_1".to_string()],
            priority: Some(0),
        };

        let config = get_platform_config_by_target(&target);
        assert_eq!(config.platform, "facebook_groups");
        assert_eq!(config.min_action_delay_ms, 60_000);
    }

    // ============================================
    // Batch Break Tests
    // ============================================

    #[test]
    fn test_should_insert_batch_break_after_batch_size() {
        let config = AntiBanConfig {
            batch_size: 5,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // Before batch_size posts
        for _ in 0..4 {
            engine.record_action("post".to_string(), true, 60_000);
        }
        assert!(!engine.should_insert_batch_break());

        // After batch_size posts
        engine.record_action("post".to_string(), true, 60_000);
        assert!(engine.should_insert_batch_break());
    }

    #[test]
    fn test_should_insert_batch_break_resets_after_batch_break() {
        let config = AntiBanConfig {
            batch_size: 5,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // Reach batch_size
        for _ in 0..5 {
            engine.record_action("post".to_string(), true, 60_000);
        }
        assert!(engine.should_insert_batch_break());

        // Reset batch
        engine.reset_batch();

        // Should not need break anymore
        assert!(!engine.should_insert_batch_break());
    }

    #[test]
    fn test_get_batch_break_duration_ms() {
        let config = AntiBanConfig {
            batch_break_minutes: 20,
            ..Default::default()
        };
        let engine = AntiBanEngine::new(config);

        let duration = engine.get_batch_break_duration_ms();
        assert_eq!(duration, 20 * 60_000);
    }

    #[test]
    fn test_batch_break_duration_different_per_platform() {
        let fb_config = get_platform_config("facebook_groups");
        let ig_config = get_platform_config("instagram");

        assert_eq!(fb_config.batch_break_minutes, 20);
        assert_eq!(ig_config.batch_break_minutes, 30);
    }

    // ============================================
    // Risk Level Tests
    // ============================================

    #[test]
    fn test_calculate_risk_level_none_below_50_percent() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 40 posts = 40%
        for _ in 0..40 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        assert_eq!(engine.calculate_risk_level(), RiskLevel::None);
    }

    #[test]
    fn test_calculate_risk_level_medium_at_50_percent() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 50 posts = 50%
        for _ in 0..50 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        assert_eq!(engine.calculate_risk_level(), RiskLevel::Medium);
    }

    #[test]
    fn test_calculate_risk_level_high_at_75_percent() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 75 posts = 75%
        for _ in 0..75 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        assert_eq!(engine.calculate_risk_level(), RiskLevel::High);
    }

    #[test]
    fn test_calculate_risk_level_critical_at_90_percent() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 90 posts = 90%
        for _ in 0..90 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        assert_eq!(engine.calculate_risk_level(), RiskLevel::Critical);
    }

    #[test]
    fn test_check_and_emit_risk_event_medium() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 50 posts = 50%
        for _ in 0..50 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        let event = engine.check_and_emit_risk_event();
        assert_eq!(event, Some(RiskLevel::Medium));

        // Subsequent call should not emit again
        let event2 = engine.check_and_emit_risk_event();
        assert_eq!(event2, None);
    }

    #[test]
    fn test_check_and_emit_risk_event_high() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 75 posts = 75%
        for _ in 0..75 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        let event = engine.check_and_emit_risk_event();
        assert_eq!(event, Some(RiskLevel::High));
    }

    #[test]
    fn test_check_and_emit_risk_event_critical() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 90 posts = 90%
        for _ in 0..90 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        let event = engine.check_and_emit_risk_event();
        assert_eq!(event, Some(RiskLevel::Critical));
    }

    #[test]
    fn test_check_and_emit_risk_event_no_duplicate() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 60 posts = 60%
        for _ in 0..60 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        // First call emits Medium
        let event1 = engine.check_and_emit_risk_event();
        assert_eq!(event1, Some(RiskLevel::Medium));

        // Second call should not emit (already emitted)
        let event2 = engine.check_and_emit_risk_event();
        assert_eq!(event2, None);

        // More posts to 80%
        for _ in 0..20 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        // Now should emit High
        let event3 = engine.check_and_emit_risk_event();
        assert_eq!(event3, Some(RiskLevel::High));
    }

    #[test]
    fn test_risk_level_in_stats() {
        let config = AntiBanConfig {
            daily_action_limit: 100,
            ..Default::default()
        };
        let mut engine = AntiBanEngine::new(config);

        // 50 posts = 50%
        for _ in 0..50 {
            engine.record_action("post".to_string(), true, 60_000);
        }

        let stats = engine.get_stats();
        assert_eq!(stats.risk_level, RiskLevel::Medium);
        assert_eq!(stats.daily_limit, 100);
    }
}

#[allow(dead_code)]
pub fn get_platform_config_by_target(
    target: &crate::commands::posting::PlatformTarget,
) -> AntiBanConfig {
    get_platform_config(&target.platform)
}
