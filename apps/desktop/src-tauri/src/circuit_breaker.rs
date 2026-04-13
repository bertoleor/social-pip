use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};

/// CircuitState - The three states of a circuit breaker.
///
/// Based on the circuit breaker pattern:
/// - CLOSED: Normal operation, requests flow through
/// - OPEN: Failure threshold exceeded, requests blocked
/// - HALF_OPEN: Testing if service recovered, limited requests allowed
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CircuitState {
    /// Normal operation - requests allowed
    Closed,
    /// Failure threshold exceeded - requests blocked
    Open,
    /// Testing recovery - limited requests allowed
    HalfOpen,
}

/// StateTransition - Records a state change with metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateTransition {
    pub from: CircuitState,
    pub to: CircuitState,
    pub at: DateTime<Utc>,
    pub reason: String,
}

impl StateTransition {
    pub fn new(from: CircuitState, to: CircuitState, reason: impl Into<String>) -> Self {
        Self {
            from,
            to,
            at: Utc::now(),
            reason: reason.into(),
        }
    }
}

/// CircuitBreakerMetrics - Metrics exported for monitoring.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreakerMetrics {
    pub state: CircuitState,
    pub failure_rate: f64,
    pub slow_call_rate: f64,
    pub failure_count: u32,
    pub success_count: u32,
    pub slow_call_count: u32,
    pub total_calls: u32,
    pub state_transitions: Vec<StateTransition>,
}

impl Default for CircuitBreakerMetrics {
    fn default() -> Self {
        Self {
            state: CircuitState::Closed,
            failure_rate: 0.0,
            slow_call_rate: 0.0,
            failure_count: 0,
            success_count: 0,
            slow_call_count: 0,
            total_calls: 0,
            state_transitions: Vec::new(),
        }
    }
}

impl CircuitBreakerMetrics {
    pub fn new() -> Self {
        Self::default()
    }
}

/// CircuitBreakerConfig - Configuration for circuit breaker behavior.
///
/// # Platform Defaults
/// | Platform | failure_threshold | slow_call_threshold | slow_call_rate |
/// |----------|-------------------|---------------------|----------------|
/// | Facebook | 5 failures | 3000ms | 80% |
/// | Instagram| 5 failures | 2000ms | 80% |
/// | Twitter | 10 failures | 1000ms | 80% |
/// | LinkedIn | 5 failures | 2000ms | 80% |
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreakerConfig {
    /// Number of consecutive failures to trip the circuit (default: 5)
    pub failure_threshold: u32,
    /// Number of consecutive successes to close the circuit (default: 3)
    pub success_threshold: u32,
    /// Duration to wait before transitioning from OPEN to HALF_OPEN (default: 60s)
    pub wait_duration_ms: u64,
    /// Threshold for considering a call "slow" in milliseconds (default: 2000)
    pub slow_call_threshold_ms: u64,
    /// Percentage of slow calls that triggers circuit open (default: 0.8 = 80%)
    pub slow_call_rate_threshold: f64,
    /// Minimum number of calls before evaluating thresholds (default: 10)
    pub minimum_number_of_calls: u32,
}

impl Default for CircuitBreakerConfig {
    fn default() -> Self {
        Self {
            failure_threshold: 5,
            success_threshold: 3,
            wait_duration_ms: 60_000,
            slow_call_threshold_ms: 2000,
            slow_call_rate_threshold: 0.8,
            minimum_number_of_calls: 10,
        }
    }
}

impl CircuitBreakerConfig {
    /// Create a new config with platform-specific defaults
    pub fn for_platform(platform: &str) -> Self {
        match platform.to_lowercase().as_str() {
            "facebook" => Self {
                failure_threshold: 5,
                slow_call_threshold_ms: 3000,
                slow_call_rate_threshold: 0.8,
                minimum_number_of_calls: 10,
                ..Self::default()
            },
            "instagram" => Self {
                failure_threshold: 5,
                slow_call_threshold_ms: 2000,
                slow_call_rate_threshold: 0.8,
                minimum_number_of_calls: 10,
                ..Self::default()
            },
            "twitter" => Self {
                failure_threshold: 10,
                slow_call_threshold_ms: 1000,
                slow_call_rate_threshold: 0.8,
                minimum_number_of_calls: 10,
                ..Self::default()
            },
            "linkedin" => Self {
                failure_threshold: 5,
                slow_call_threshold_ms: 2000,
                slow_call_rate_threshold: 0.8,
                minimum_number_of_calls: 10,
                ..Self::default()
            },
            _ => Self::default(),
        }
    }
}

/// CircuitBreaker - Implements the circuit breaker pattern for account isolation.
///
/// When an account experiences repeated failures, the circuit breaker "trips"
/// and blocks further requests for a cooldown period. After the wait duration,
/// it enters HALF_OPEN state to test if the service has recovered.
///
/// # State Transitions
/// - CLOSED + failure_threshold failures → OPEN
/// - CLOSED + slow_call_rate > threshold → OPEN (NEW in v2.0)
/// - OPEN + wait_duration elapsed → HALF_OPEN
/// - HALF_OPEN + success_threshold successes → CLOSED
/// - HALF_OPEN + 1 failure → OPEN (escalate cooldown)
pub struct CircuitBreaker {
    /// Current state of the circuit
    state: CircuitState,
    /// Configuration for this circuit breaker
    config: CircuitBreakerConfig,
    /// Number of consecutive failures (resets on success)
    failure_count: u32,
    /// Number of consecutive successes in HALF_OPEN state
    success_count: u32,
    /// Number of slow calls (exceeding slow_call_threshold_ms)
    slow_call_count: u32,
    /// Total number of calls (for rate calculations)
    total_calls: u32,
    /// When the circuit opened (for wait_duration calculation)
    opened_at: Option<DateTime<Utc>>,
    /// History of state transitions
    state_transitions: Vec<StateTransition>,
}

impl CircuitBreaker {
    /// Create a new circuit breaker with the given configuration
    pub fn new(config: CircuitBreakerConfig) -> Self {
        Self {
            state: CircuitState::Closed,
            config,
            failure_count: 0,
            success_count: 0,
            slow_call_count: 0,
            total_calls: 0,
            opened_at: None,
            state_transitions: Vec::new(),
        }
    }

    /// Create a new circuit breaker with default configuration
    pub fn with_defaults() -> Self {
        Self::new(CircuitBreakerConfig::default())
    }

    /// Get the current state of the circuit
    pub fn state(&self) -> CircuitState {
        self.state
    }

    /// Get current metrics
    pub fn metrics(&self) -> CircuitBreakerMetrics {
        let failure_rate = if self.total_calls >= self.config.minimum_number_of_calls {
            self.failure_count as f64 / self.total_calls as f64
        } else {
            0.0
        };

        let slow_call_rate = if self.total_calls >= self.config.minimum_number_of_calls {
            self.slow_call_count as f64 / self.total_calls as f64
        } else {
            0.0
        };

        CircuitBreakerMetrics {
            state: self.state,
            failure_rate,
            slow_call_rate,
            failure_count: self.failure_count,
            success_count: self.success_count,
            slow_call_count: self.slow_call_count,
            total_calls: self.total_calls,
            state_transitions: self.state_transitions.clone(),
        }
    }

    /// Record a state transition
    fn record_transition(&mut self, from: CircuitState, to: CircuitState, reason: &str) {
        let transition = StateTransition::new(from, to, reason);
        self.state_transitions.push(transition);
        // Keep only last 100 transitions to prevent memory growth
        if self.state_transitions.len() > 100 {
            self.state_transitions.remove(0);
        }
    }

    /// Check if a request can be executed
    ///
    /// - CLOSED: Always returns true
    /// - OPEN: Returns false (unless wait_duration elapsed → HALF_OPEN)
    /// - HALF_OPEN: Returns true (for test requests)
    pub fn can_execute(&mut self) -> bool {
        match self.state {
            CircuitState::Closed => true,
            CircuitState::Open => {
                if let Some(opened_at) = self.opened_at {
                    let elapsed = Utc::now().signed_duration_since(opened_at);
                    let wait_duration = Duration::milliseconds(self.config.wait_duration_ms as i64);

                    if elapsed >= wait_duration {
                        let from = self.state;
                        self.state = CircuitState::HalfOpen;
                        self.success_count = 0;
                        self.record_transition(from, self.state, "wait_duration_elapsed");
                        true
                    } else {
                        false
                    }
                } else {
                    false
                }
            }
            CircuitState::HalfOpen => true,
        }
    }

    /// Record a successful operation
    ///
    /// - CLOSED: Reset failure count (stay CLOSED)
    /// - HALF_OPEN: Increment success_count, close if threshold reached
    pub fn record_success(&mut self) {
        self.total_calls += 1;
        self.record_success_internal();
    }

    /// Record a successful operation with duration (for slow call detection)
    pub fn record_success_with_duration(&mut self, duration_ms: u64) {
        self.total_calls += 1;

        if duration_ms > self.config.slow_call_threshold_ms {
            self.slow_call_count += 1;
        }

        self.record_success_internal();

        // Check slow call rate in CLOSED state
        if self.state == CircuitState::Closed
            && self.total_calls >= self.config.minimum_number_of_calls
        {
            let slow_call_rate = self.slow_call_count as f64 / self.total_calls as f64;
            if slow_call_rate >= self.config.slow_call_rate_threshold {
                let from = self.state;
                self.state = CircuitState::Open;
                self.opened_at = Some(Utc::now());
                self.record_transition(from, self.state, "slow_call_rate_exceeded");
            }
        }
    }

    fn record_success_internal(&mut self) {
        match self.state {
            CircuitState::Closed => {
                self.failure_count = 0;
            }
            CircuitState::HalfOpen => {
                self.success_count += 1;

                if self.success_count >= self.config.success_threshold {
                    let from = self.state;
                    self.state = CircuitState::Closed;
                    self.failure_count = 0;
                    self.success_count = 0;
                    self.slow_call_count = 0;
                    self.total_calls = 0;
                    self.opened_at = None;
                    self.record_transition(from, self.state, "success_threshold_reached");
                }
            }
            CircuitState::Open => {
                self.state = CircuitState::HalfOpen;
                self.success_count = 1;
            }
        }
    }

    /// Record a failed operation
    ///
    /// - CLOSED: Increment failure_count, open if threshold reached
    /// - HALF_OPEN: Immediately transition back to OPEN
    /// - OPEN: No-op (already open)
    pub fn record_failure(&mut self) {
        self.total_calls += 1;

        match self.state {
            CircuitState::Closed => {
                self.failure_count += 1;

                if self.failure_count >= self.config.failure_threshold {
                    let from = self.state;
                    self.state = CircuitState::Open;
                    self.opened_at = Some(Utc::now());
                    self.record_transition(from, self.state, "failure_threshold_reached");
                }
            }
            CircuitState::HalfOpen => {
                let from = self.state;
                self.state = CircuitState::Open;
                self.opened_at = Some(Utc::now());
                self.success_count = 0;
                self.record_transition(from, self.state, "half_open_failure");
            }
            CircuitState::Open => {
                // Already open, no-op
            }
        }
    }

    /// Get the current failure count (for monitoring)
    pub fn failure_count(&self) -> u32 {
        self.failure_count
    }

    /// Get the current success count (for monitoring)
    pub fn success_count(&self) -> u32 {
        self.success_count
    }

    /// Get the slow call count (for monitoring)
    pub fn slow_call_count(&self) -> u32 {
        self.slow_call_count
    }

    /// Get the total calls (for monitoring)
    pub fn total_calls(&self) -> u32 {
        self.total_calls
    }

    /// Get when the circuit opened (None if not open)
    pub fn opened_at(&self) -> Option<DateTime<Utc>> {
        self.opened_at
    }

    /// Get state transitions history
    pub fn state_transitions(&self) -> &[StateTransition] {
        &self.state_transitions
    }

    /// Reset the circuit breaker to CLOSED state
    pub fn reset(&mut self) {
        let from = self.state;
        self.state = CircuitState::Closed;
        self.failure_count = 0;
        self.success_count = 0;
        self.slow_call_count = 0;
        self.total_calls = 0;
        self.opened_at = None;
        self.record_transition(from, self.state, "manual_reset");
    }
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================
    // T2.1: CircuitState enum tests
    // ============================================

    #[test]
    fn test_circuit_state_closed_serialization() {
        let state = CircuitState::Closed;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, r#""Closed""#);

        let deserialized: CircuitState = serde_json::from_str(&json).unwrap();
        assert_eq!(state, deserialized);
    }

    #[test]
    fn test_circuit_state_open_serialization() {
        let state = CircuitState::Open;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, r#""Open""#);

        let deserialized: CircuitState = serde_json::from_str(&json).unwrap();
        assert_eq!(state, deserialized);
    }

    #[test]
    fn test_circuit_state_half_open_serialization() {
        let state = CircuitState::HalfOpen;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, r#""HalfOpen""#);

        let deserialized: CircuitState = serde_json::from_str(&json).unwrap();
        assert_eq!(state, deserialized);
    }

    #[test]
    fn test_circuit_state_equality() {
        assert_eq!(CircuitState::Closed, CircuitState::Closed);
        assert_eq!(CircuitState::Open, CircuitState::Open);
        assert_eq!(CircuitState::HalfOpen, CircuitState::HalfOpen);

        assert_ne!(CircuitState::Closed, CircuitState::Open);
        assert_ne!(CircuitState::Closed, CircuitState::HalfOpen);
        assert_ne!(CircuitState::Open, CircuitState::HalfOpen);
    }

    #[test]
    fn test_circuit_state_all_variants_serializable() {
        let states = vec![
            CircuitState::Closed,
            CircuitState::Open,
            CircuitState::HalfOpen,
        ];

        for state in states {
            let json = serde_json::to_string(&state).unwrap();
            let _: CircuitState = serde_json::from_str(&json).unwrap();
        }
    }

    // ============================================
    // T2.3: CircuitBreaker::new() with default config
    // ============================================

    #[test]
    fn test_circuit_breaker_new_with_default_config() {
        let config = CircuitBreakerConfig::default();
        let cb = CircuitBreaker::new(config.clone());

        assert_eq!(cb.state(), CircuitState::Closed);
        assert_eq!(cb.failure_count(), 0);
        assert_eq!(cb.success_count(), 0);
        assert!(cb.opened_at().is_none());
    }

    #[test]
    fn test_circuit_breaker_config_default_values() {
        let config = CircuitBreakerConfig::default();

        assert_eq!(config.failure_threshold, 5);
        assert_eq!(config.success_threshold, 3);
        assert_eq!(config.wait_duration_ms, 60_000);
    }

    #[test]
    fn test_circuit_breaker_with_defaults() {
        let cb = CircuitBreaker::with_defaults();

        assert_eq!(cb.state(), CircuitState::Closed);
        assert_eq!(cb.failure_count(), 0);
    }

    #[test]
    fn test_circuit_breaker_config_for_platform() {
        let fb_config = CircuitBreakerConfig::for_platform("facebook");
        assert_eq!(fb_config.failure_threshold, 5);

        let ig_config = CircuitBreakerConfig::for_platform("instagram");
        assert_eq!(ig_config.failure_threshold, 5);

        let unknown_config = CircuitBreakerConfig::for_platform("unknown");
        assert_eq!(unknown_config.failure_threshold, 5);
    }

    // ============================================
    // T2.5: record_success() transition CLOSED → CLOSED
    // ============================================

    #[test]
    fn test_record_success_closed_stays_closed() {
        let mut cb = CircuitBreaker::with_defaults();

        // Record success in CLOSED state
        cb.record_success();

        // Should remain CLOSED
        assert_eq!(cb.state(), CircuitState::Closed);
        assert_eq!(cb.failure_count(), 0);
    }

    #[test]
    fn test_record_success_resets_failure_count() {
        let mut cb = CircuitBreaker::with_defaults();

        // Add some failures (but not enough to trip)
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.failure_count(), 2);

        // Record success - should reset failure count
        cb.record_success();
        assert_eq!(cb.state(), CircuitState::Closed);
        assert_eq!(cb.failure_count(), 0);
    }

    // ============================================
    // T2.7: record_failure() and state transitions
    // ============================================

    #[test]
    fn test_record_failure_increments_count() {
        let mut cb = CircuitBreaker::with_defaults();

        cb.record_failure();
        assert_eq!(cb.failure_count(), 1);
        assert_eq!(cb.state(), CircuitState::Closed);

        cb.record_failure();
        assert_eq!(cb.failure_count(), 2);
        assert_eq!(cb.state(), CircuitState::Closed);
    }

    #[test]
    fn test_record_failure_threshold_opens_circuit() {
        let config = CircuitBreakerConfig {
            failure_threshold: 3,
            ..Default::default()
        };
        let mut cb = CircuitBreaker::new(config);

        // Record failures up to threshold
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Closed);

        // Third failure should trip the circuit
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Open);
        assert!(cb.opened_at().is_some());
        assert_eq!(cb.failure_count(), 0); // Reset after opening
    }

    #[test]
    fn test_record_failure_half_open_to_open() {
        let config = CircuitBreakerConfig {
            failure_threshold: 2,
            wait_duration_ms: 100, // 100ms for testing
            ..Default::default()
        };
        let mut cb = CircuitBreaker::new(config);

        // Trip the circuit
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Open);

        // Wait for transition to HALF_OPEN
        std::thread::sleep(std::time::Duration::from_millis(150));
        assert!(cb.can_execute());
        assert_eq!(cb.state(), CircuitState::HalfOpen);

        // Failure in HALF_OPEN should go back to OPEN
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Open);
        assert!(cb.opened_at().is_some());
    }

    // ============================================
    // T2.9: can_execute() in each state
    // ============================================

    #[test]
    fn test_can_execute_closed_returns_true() {
        let mut cb = CircuitBreaker::with_defaults();

        assert!(cb.can_execute());
        assert_eq!(cb.state(), CircuitState::Closed);
    }

    #[test]
    fn test_can_execute_open_returns_false() {
        let config = CircuitBreakerConfig {
            failure_threshold: 2,
            wait_duration_ms: 60_000, // 60 seconds - won't elapse in test
            ..Default::default()
        };
        let mut cb = CircuitBreaker::new(config);

        // Trip the circuit
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Open);

        // Should not allow execution
        assert!(!cb.can_execute());
        assert_eq!(cb.state(), CircuitState::Open);
    }

    #[test]
    fn test_can_execute_open_transitions_to_half_open_after_wait() {
        let config = CircuitBreakerConfig {
            failure_threshold: 2,
            wait_duration_ms: 50, // 50ms for testing
            ..Default::default()
        };
        let mut cb = CircuitBreaker::new(config);

        // Trip the circuit
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Open);

        // Should not allow execution immediately
        assert!(!cb.can_execute());

        // Wait for duration to elapse
        std::thread::sleep(std::time::Duration::from_millis(100));

        // Should transition to HALF_OPEN and allow execution
        assert!(cb.can_execute());
        assert_eq!(cb.state(), CircuitState::HalfOpen);
    }

    #[test]
    fn test_can_execute_half_open_returns_true() {
        let mut cb = CircuitBreaker::with_defaults();

        // Manually set to HALF_OPEN for testing
        cb.state = CircuitState::HalfOpen;

        assert!(cb.can_execute());
        assert_eq!(cb.state(), CircuitState::HalfOpen);
    }

    #[test]
    fn test_half_open_success_transitions_to_closed() {
        let config = CircuitBreakerConfig {
            success_threshold: 2,
            ..Default::default()
        };
        let mut cb = CircuitBreaker::new(config);
        cb.state = CircuitState::HalfOpen;

        // Record successes up to threshold
        cb.record_success();
        assert_eq!(cb.state(), CircuitState::HalfOpen);

        cb.record_success();
        assert_eq!(cb.state(), CircuitState::Closed);
        assert_eq!(cb.failure_count(), 0);
        assert_eq!(cb.success_count(), 0);
        assert!(cb.opened_at().is_none());
    }

    #[test]
    fn test_reset_returns_to_closed() {
        let config = CircuitBreakerConfig {
            failure_threshold: 2,
            ..Default::default()
        };
        let mut cb = CircuitBreaker::new(config);

        // Trip the circuit
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.state(), CircuitState::Open);

        // Reset
        cb.reset();
        assert_eq!(cb.state(), CircuitState::Closed);
        assert_eq!(cb.failure_count(), 0);
        assert_eq!(cb.success_count(), 0);
        assert!(cb.opened_at().is_none());
    }
}
