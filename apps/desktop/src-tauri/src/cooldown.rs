use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};

/// CooldownLevel - Escalation levels for account cooldown.
///
/// Each level represents an increasing severity of cooldown period.
/// The system escalates through levels when consecutive failures occur,
/// and resets after a successful operation within the reset window.
///
/// | Level | Cooldown | Reset Window | Trigger |
/// |-------|-----------|--------------|---------|
/// | 1 | 1 hour | 7 days | First auth failure |
/// | 2 | 6 hours | 7 days | Second auth failure |
/// | 3 | 24 hours | 14 days | Third auth failure |
/// | 4 | 7 days | 14 days | Fourth auth failure |
/// | 5 | Permanent | Manual | Account banned/restricted |
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CooldownLevel {
    /// No cooldown - normal operation
    None = 0,
    /// 1 hour cooldown
    Level1 = 1,
    /// 6 hours cooldown
    Level2 = 2,
    /// 24 hours cooldown
    Level3 = 3,
    /// 7 days cooldown
    Level4 = 4,
    /// Permanent cooldown (requires manual reset)
    Level5 = 5,
}

impl Default for CooldownLevel {
    fn default() -> Self {
        Self::None
    }
}

impl CooldownLevel {
    /// Get the cooldown duration for this level.
    pub fn duration(&self) -> Duration {
        match self {
            CooldownLevel::None => Duration::zero(),
            CooldownLevel::Level1 => Duration::hours(1),
            CooldownLevel::Level2 => Duration::hours(6),
            CooldownLevel::Level3 => Duration::hours(24),
            CooldownLevel::Level4 => Duration::days(7),
            CooldownLevel::Level5 => Duration::days(365), // Effectively permanent
        }
    }

    /// Get the reset window for this level.
    ///
    /// If no failures occur within the reset window, the level decrements.
    pub fn reset_window(&self) -> Duration {
        match self {
            CooldownLevel::None => Duration::zero(),
            CooldownLevel::Level1 => Duration::days(7),
            CooldownLevel::Level2 => Duration::days(7),
            CooldownLevel::Level3 => Duration::days(14),
            CooldownLevel::Level4 => Duration::days(14),
            CooldownLevel::Level5 => Duration::days(365), // Never resets automatically
        }
    }

    /// Get the level as a numeric value.
    pub fn as_u8(&self) -> u8 {
        *self as u8
    }

    /// Create from a numeric level.
    pub fn from_u8(level: u8) -> Self {
        match level {
            0 => CooldownLevel::None,
            1 => CooldownLevel::Level1,
            2 => CooldownLevel::Level2,
            3 => CooldownLevel::Level3,
            4 => CooldownLevel::Level4,
            5 => CooldownLevel::Level5,
            _ => CooldownLevel::Level5, // Cap at max
        }
    }

    /// Escalate to the next level.
    pub fn escalate(&self) -> Self {
        match self {
            CooldownLevel::None => CooldownLevel::Level1,
            CooldownLevel::Level1 => CooldownLevel::Level2,
            CooldownLevel::Level2 => CooldownLevel::Level3,
            CooldownLevel::Level3 => CooldownLevel::Level4,
            CooldownLevel::Level4 => CooldownLevel::Level5,
            CooldownLevel::Level5 => CooldownLevel::Level5, // Already at max
        }
    }

    /// Decrement to the previous level.
    pub fn decrement(&self) -> Self {
        match self {
            CooldownLevel::None => CooldownLevel::None,
            CooldownLevel::Level1 => CooldownLevel::None,
            CooldownLevel::Level2 => CooldownLevel::Level1,
            CooldownLevel::Level3 => CooldownLevel::Level2,
            CooldownLevel::Level4 => CooldownLevel::Level3,
            CooldownLevel::Level5 => CooldownLevel::Level4,
        }
    }

    /// Check if cooldown is permanent.
    pub fn is_permanent(&self) -> bool {
        matches!(self, CooldownLevel::Level5)
    }

    /// Check if account is in cooldown.
    pub fn is_active(&self) -> bool {
        !matches!(self, CooldownLevel::None)
    }
}

/// CooldownState - Tracks the current cooldown state for an account.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CooldownState {
    /// Current cooldown level
    pub level: CooldownLevel,
    /// When the current cooldown started
    pub started_at: Option<DateTime<Utc>>,
    /// When the cooldown expires
    pub expires_at: Option<DateTime<Utc>>,
    /// When the level was last escalated
    pub last_escalation: Option<DateTime<Utc>>,
    /// Number of consecutive failures at this level
    pub failure_count: u32,
}

impl Default for CooldownState {
    fn default() -> Self {
        Self {
            level: CooldownLevel::None,
            started_at: None,
            expires_at: None,
            last_escalation: None,
            failure_count: 0,
        }
    }
}

impl CooldownState {
    /// Create a new cooldown state with no cooldown.
    pub fn new() -> Self {
        Self::default()
    }

    /// Check if the account is currently in cooldown.
    pub fn is_in_cooldown(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Utc::now() < expires_at
        } else {
            false
        }
    }

    /// Get remaining cooldown time.
    pub fn remaining(&self) -> Duration {
        if let Some(expires_at) = self.expires_at {
            let remaining = expires_at - Utc::now();
            if remaining > Duration::zero() {
                remaining
            } else {
                Duration::zero()
            }
        } else {
            Duration::zero()
        }
    }
}

/// CooldownEscalator - Manages cooldown escalation logic for accounts.
///
/// Escalation Rules:
/// 1. Auth failures escalate the cooldown level
/// 2. Level 1-2 reset after 7 days of no failures
/// 3. Level 3-4 reset after 14 days of no failures
/// 4. Level 5 is permanent (requires manual reset)
pub struct CooldownEscalator {
    /// Default reset window for levels 1-2
    short_reset_days: i64,
    /// Extended reset window for levels 3-4
    long_reset_days: i64,
}

impl CooldownEscalator {
    /// Create a new escalator with default settings.
    ///
    /// Default settings:
    /// - Short reset: 7 days (levels 1-2)
    /// - Long reset: 14 days (levels 3-4)
    pub fn new() -> Self {
        Self {
            short_reset_days: 7,
            long_reset_days: 14,
        }
    }

    /// Escalate the cooldown level for an account.
    ///
    /// Called when an auth failure or account restriction is detected.
    ///
    /// # Arguments
    /// - `state`: Current cooldown state
    ///
    /// # Returns
    /// Updated cooldown state with escalated level
    pub fn escalate(&self, mut state: CooldownState) -> CooldownState {
        let now = Utc::now();

        // Check if we should reset before escalating (reset window passed)
        state = self.check_reset(state, now);

        // Escalate the level
        state.level = state.level.escalate();
        state.failure_count += 1;
        state.last_escalation = Some(now);

        // Set cooldown duration
        if state.level.is_active() {
            state.started_at = Some(now);
            state.expires_at = Some(now + state.level.duration());
        }

        state
    }

    /// Check if the cooldown should be reset or decremented.
    ///
    /// Called after a successful operation or on periodic checks.
    ///
    /// # Arguments
    /// - `state`: Current cooldown state
    /// - `now`: Current timestamp
    ///
    /// # Returns
    /// Updated cooldown state
    pub fn check_reset(&self, mut state: CooldownState, now: DateTime<Utc>) -> CooldownState {
        // Level 5 is permanent, never auto-resets
        if state.level == CooldownLevel::Level5 {
            return state;
        }

        // Check if reset window has passed since last escalation
        if let Some(last_escalation) = state.last_escalation {
            let reset_window = if state.level.as_u8() <= 2 {
                Duration::days(self.short_reset_days)
            } else {
                Duration::days(self.long_reset_days)
            };

            if now >= last_escalation + reset_window {
                // Reset window passed - decrement level
                state.level = state.level.decrement();
                state.failure_count = 0;

                if state.level == CooldownLevel::None {
                    state.started_at = None;
                    state.expires_at = None;
                    state.last_escalation = None;
                }
            }
        }

        state
    }

    /// Record a successful operation, potentially resetting cooldown.
    ///
    /// # Arguments
    /// - `state`: Current cooldown state
    ///
    /// # Returns
    /// Updated cooldown state
    pub fn record_success(&self, mut state: CooldownState) -> CooldownState {
        state.failure_count = 0;

        // Check if we should decrement based on reset window
        let now = Utc::now();
        state = self.check_reset(state, now);

        // If cooldown has expired, clear it
        if !state.is_in_cooldown() && state.level != CooldownLevel::Level5 {
            state.level = state.level.decrement();
            if state.level == CooldownLevel::None {
                state.started_at = None;
                state.expires_at = None;
            }
        }

        state
    }

    /// Manually reset a cooldown (for Level 5 or admin intervention).
    pub fn manual_reset(&self, mut state: CooldownState) -> CooldownState {
        state.level = CooldownLevel::None;
        state.started_at = None;
        state.expires_at = None;
        state.last_escalation = None;
        state.failure_count = 0;
        state
    }

    /// Get the reset window in days for a level.
    pub fn get_reset_days(&self, level: CooldownLevel) -> i64 {
        if level.as_u8() <= 2 {
            self.short_reset_days
        } else {
            self.long_reset_days
        }
    }
}

impl Default for CooldownEscalator {
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
    // T5.1: CooldownLevel enum tests
    // ============================================

    #[test]
    fn test_cooldown_level_has_5_levels() {
        // Verify all 5 escalation levels exist
        let levels = vec![
            CooldownLevel::None,
            CooldownLevel::Level1,
            CooldownLevel::Level2,
            CooldownLevel::Level3,
            CooldownLevel::Level4,
            CooldownLevel::Level5,
        ];

        assert_eq!(levels.len(), 6); // Including None
    }

    #[test]
    fn test_cooldown_level_durations() {
        assert_eq!(CooldownLevel::None.duration(), Duration::zero());
        assert_eq!(CooldownLevel::Level1.duration(), Duration::hours(1));
        assert_eq!(CooldownLevel::Level2.duration(), Duration::hours(6));
        assert_eq!(CooldownLevel::Level3.duration(), Duration::hours(24));
        assert_eq!(CooldownLevel::Level4.duration(), Duration::days(7));
        assert!(CooldownLevel::Level5.duration() >= Duration::days(365));
    }

    #[test]
    fn test_cooldown_level_reset_windows() {
        assert_eq!(CooldownLevel::Level1.reset_window(), Duration::days(7));
        assert_eq!(CooldownLevel::Level2.reset_window(), Duration::days(7));
        assert_eq!(CooldownLevel::Level3.reset_window(), Duration::days(14));
        assert_eq!(CooldownLevel::Level4.reset_window(), Duration::days(14));
    }

    #[test]
    fn test_cooldown_level_escalation_logic() {
        let mut level = CooldownLevel::None;

        level = level.escalate();
        assert_eq!(level, CooldownLevel::Level1);

        level = level.escalate();
        assert_eq!(level, CooldownLevel::Level2);

        level = level.escalate();
        assert_eq!(level, CooldownLevel::Level3);

        level = level.escalate();
        assert_eq!(level, CooldownLevel::Level4);

        level = level.escalate();
        assert_eq!(level, CooldownLevel::Level5);

        // Level 5 stays at Level 5
        level = level.escalate();
        assert_eq!(level, CooldownLevel::Level5);
    }

    #[test]
    fn test_cooldown_level_decrement() {
        let level = CooldownLevel::Level3;
        let decremented = level.decrement();

        assert_eq!(decremented, CooldownLevel::Level2);
    }

    #[test]
    fn test_cooldown_level_none_decrement_stays_none() {
        let level = CooldownLevel::None;
        let decremented = level.decrement();

        assert_eq!(decremented, CooldownLevel::None);
    }

    #[test]
    fn test_cooldown_level_serialization() {
        let level = CooldownLevel::Level3;
        let json = serde_json::to_string(&level).unwrap();

        let deserialized: CooldownLevel = serde_json::from_str(&json).unwrap();
        assert_eq!(level, deserialized);
    }

    #[test]
    fn test_cooldown_level_from_u8() {
        assert_eq!(CooldownLevel::from_u8(0), CooldownLevel::None);
        assert_eq!(CooldownLevel::from_u8(1), CooldownLevel::Level1);
        assert_eq!(CooldownLevel::from_u8(5), CooldownLevel::Level5);
        assert_eq!(CooldownLevel::from_u8(10), CooldownLevel::Level5); // Capped
    }

    #[test]
    fn test_cooldown_level_as_u8() {
        assert_eq!(CooldownLevel::None.as_u8(), 0);
        assert_eq!(CooldownLevel::Level1.as_u8(), 1);
        assert_eq!(CooldownLevel::Level5.as_u8(), 5);
    }

    #[test]
    fn test_cooldown_level_is_permanent() {
        assert!(!CooldownLevel::None.is_permanent());
        assert!(!CooldownLevel::Level1.is_permanent());
        assert!(CooldownLevel::Level5.is_permanent());
    }

    #[test]
    fn test_cooldown_level_is_active() {
        assert!(!CooldownLevel::None.is_active());
        assert!(CooldownLevel::Level1.is_active());
    }

    // ============================================
    // T5.3: CooldownEscalator::escalate() tests
    // ============================================

    #[test]
    fn test_escalate_from_none_to_level1() {
        let escalator = CooldownEscalator::new();
        let state = CooldownState::new();

        let escalated = escalator.escalate(state);

        assert_eq!(escalated.level, CooldownLevel::Level1);
        assert!(escalated.started_at.is_some());
        assert!(escalated.expires_at.is_some());
        assert_eq!(escalated.failure_count, 1);
    }

    #[test]
    fn test_escalate_increments_level() {
        let escalator = CooldownEscalator::new();
        let mut state = CooldownState::new();
        state.level = CooldownLevel::Level2;

        let escalated = escalator.escalate(state);

        assert_eq!(escalated.level, CooldownLevel::Level3);
    }

    #[test]
    fn test_escalate_sets_cooldown_expiry() {
        let escalator = CooldownEscalator::new();
        let state = CooldownState::new();

        let escalated = escalator.escalate(state);

        let expected_expiry = Utc::now() + CooldownLevel::Level1.duration();
        // Allow 1 second tolerance
        let diff = (escalated.expires_at.unwrap() - expected_expiry)
            .num_seconds()
            .abs();
        assert!(diff < 2, "Expiry should be approximately 1 hour from now");
    }

    #[test]
    fn test_escalate_level5_stays_at_level5() {
        let escalator = CooldownEscalator::new();
        let mut state = CooldownState::new();
        state.level = CooldownLevel::Level5;

        let escalated = escalator.escalate(state);

        assert_eq!(escalated.level, CooldownLevel::Level5);
    }

    #[test]
    fn test_check_reset_after_7_days_level1() {
        let escalator = CooldownEscalator::new();
        let mut state = CooldownState::new();
        state.level = CooldownLevel::Level1;
        state.last_escalation = Some(Utc::now() - Duration::days(8));

        let checked = escalator.check_reset(state, Utc::now());

        // Should decrement to None after reset window
        assert_eq!(checked.level, CooldownLevel::None);
    }

    #[test]
    fn test_check_reset_after_14_days_level3() {
        let escalator = CooldownEscalator::new();
        let mut state = CooldownState::new();
        state.level = CooldownLevel::Level3;
        state.last_escalation = Some(Utc::now() - Duration::days(15));

        let checked = escalator.check_reset(state, Utc::now());

        // Should decrement to Level2 after reset window
        assert_eq!(checked.level, CooldownLevel::Level2);
    }

    #[test]
    fn test_record_success_resets_failure_count() {
        let escalator = CooldownEscalator::new();
        let mut state = CooldownState::new();
        state.failure_count = 5;

        let updated = escalator.record_success(state);

        assert_eq!(updated.failure_count, 0);
    }

    #[test]
    fn test_manual_reset_clears_all() {
        let escalator = CooldownEscalator::new();
        let mut state = CooldownState::new();
        state.level = CooldownLevel::Level5;
        state.failure_count = 10;
        state.started_at = Some(Utc::now());

        let reset = escalator.manual_reset(state);

        assert_eq!(reset.level, CooldownLevel::None);
        assert_eq!(reset.failure_count, 0);
        assert!(reset.started_at.is_none());
    }

    #[test]
    fn test_cooldown_state_is_in_cooldown() {
        let mut state = CooldownState::new();
        assert!(!state.is_in_cooldown());

        state.level = CooldownLevel::Level1;
        state.expires_at = Some(Utc::now() + Duration::hours(1));
        assert!(state.is_in_cooldown());

        state.expires_at = Some(Utc::now() - Duration::hours(1));
        assert!(!state.is_in_cooldown());
    }

    #[test]
    fn test_cooldown_state_remaining() {
        let mut state = CooldownState::new();

        // No cooldown
        assert_eq!(state.remaining(), Duration::zero());

        // Active cooldown
        state.expires_at = Some(Utc::now() + Duration::minutes(30));
        let remaining = state.remaining();
        assert!(remaining > Duration::zero() && remaining <= Duration::minutes(30));

        // Expired cooldown
        state.expires_at = Some(Utc::now() - Duration::minutes(5));
        assert_eq!(state.remaining(), Duration::zero());
    }

    #[test]
    fn test_escalator_default_settings() {
        let escalator = CooldownEscalator::new();

        assert_eq!(escalator.short_reset_days, 7);
        assert_eq!(escalator.long_reset_days, 14);
    }

    #[test]
    fn test_get_reset_days() {
        let escalator = CooldownEscalator::new();

        assert_eq!(escalator.get_reset_days(CooldownLevel::Level1), 7);
        assert_eq!(escalator.get_reset_days(CooldownLevel::Level2), 7);
        assert_eq!(escalator.get_reset_days(CooldownLevel::Level3), 14);
        assert_eq!(escalator.get_reset_days(CooldownLevel::Level4), 14);
    }
}
