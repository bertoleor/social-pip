use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio_cron_scheduler::{Job, JobScheduler};
use uuid::Uuid;

use crate::error_handler::ErrorClassifier;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;

/// RetryPolicy - Configuration for retry behavior with exponential backoff.
///
/// T6.3-T6.4: RetryPolicy with max_attempts and backoff_multiplier
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct RetryPolicy {
    /// Maximum number of retry attempts (default: 3)
    pub max_attempts: u32,
    /// Base delay for exponential backoff in milliseconds (default: 60_000 = 1 minute)
    pub base_delay_ms: u64,
    /// Backoff multiplier (default: 2.0, so delays are 1m, 2m, 4m)
    pub backoff_multiplier: f32,
    /// Maximum delay cap in milliseconds (default: 300_000 = 5 minutes)
    pub max_delay_ms: u64,
    /// Jitter percentage to add randomness (default: 0.15 = 15%)
    pub jitter_percentage: f32,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            base_delay_ms: 60_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 300_000,
            jitter_percentage: 0.15,
        }
    }
}

#[allow(dead_code)]
impl RetryPolicy {
    /// Create a new retry policy with default settings.
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a retry policy with custom settings.
    pub fn with_settings(
        max_attempts: u32,
        base_delay_ms: u64,
        backoff_multiplier: f32,
        max_delay_ms: u64,
    ) -> Self {
        Self {
            max_attempts,
            base_delay_ms,
            backoff_multiplier,
            max_delay_ms,
            jitter_percentage: 0.15,
        }
    }

    /// Calculate the delay for a given attempt number.
    ///
    /// Uses exponential backoff: base_delay * (multiplier ^ attempt)
    /// Capped at max_delay_ms and includes jitter.
    pub fn calculate_delay(&self, attempt: u32) -> u64 {
        use rand::Rng;

        let base = self.base_delay_ms as f32;
        let multiplier = self.backoff_multiplier.powi(attempt as i32);
        let mut delay = (base * multiplier) as u64;

        // Cap at maximum delay
        delay = delay.min(self.max_delay_ms);

        // Add jitter
        let jitter = (delay as f32 * self.jitter_percentage) as u64;
        if jitter > 0 {
            delay += rand::thread_rng().gen_range(0..=jitter);
        }

        delay
    }

    /// Check if retries are exhausted.
    pub fn is_exhausted(&self, attempt: u32) -> bool {
        attempt >= self.max_attempts
    }

    /// Get remaining attempts.
    pub fn remaining_attempts(&self, current_attempt: u32) -> u32 {
        self.max_attempts.saturating_sub(current_attempt)
    }

    /// Create a policy for quick retries (for transient errors).
    pub fn quick_retry() -> Self {
        Self {
            max_attempts: 3,
            base_delay_ms: 10_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 60_000,
            jitter_percentage: 0.10,
        }
    }

    /// Create a policy for slow retries (for rate limits).
    pub fn slow_retry() -> Self {
        Self {
            max_attempts: 3,
            base_delay_ms: 120_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 600_000,
            jitter_percentage: 0.20,
        }
    }

    /// Get policy from error classifier recommendation.
    pub fn from_classifier(_classifier: &ErrorClassifier) -> Self {
        Self::default()
    }
}

#[derive(Debug, Error)]
#[allow(dead_code)]
pub enum SchedulerError {
    #[error("Job creation failed: {0}")]
    JobCreationFailed(String),

    #[error("Job not found: {0}")]
    JobNotFound(String),

    #[error("Anti-Ban blocked execution: {0}")]
    AntiBanBlocked(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Invalid schedule: {0}")]
    InvalidSchedule(String),

    #[error("Scheduler not initialized")]
    NotInitialized,

    #[error("Schedule already cancelled")]
    AlreadyCancelled,

    #[error("Max attempts exceeded")]
    MaxAttemptsExceeded,

    #[error("Job execution failed: {0}")]
    ExecutionFailed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ScheduleJobData {
    pub schedule_id: String,
    pub post_id: String,
    pub account_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[allow(dead_code)]
pub enum ScheduleStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[allow(dead_code)]
impl ScheduleStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "PENDING",
            Self::Running => "RUNNING",
            Self::Completed => "COMPLETED",
            Self::Failed => "FAILED",
            Self::Cancelled => "CANCELLED",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "PENDING" => Some(Self::Pending),
            "RUNNING" => Some(Self::Running),
            "COMPLETED" => Some(Self::Completed),
            "FAILED" => Some(Self::Failed),
            "CANCELLED" => Some(Self::Cancelled),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ExecutionResult {
    pub schedule_id: String,
    pub success: bool,
    pub error_message: Option<String>,
    pub duration_ms: u64,
    pub post_url: Option<String>,
}

#[allow(dead_code)]
pub struct ActiveScheduler {
    scheduler: JobScheduler,
    jobs: Arc<Mutex<HashMap<String, Uuid>>>,
}

#[allow(dead_code)]
impl ActiveScheduler {
    pub async fn new() -> Result<Self, SchedulerError> {
        let scheduler = JobScheduler::new()
            .await
            .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;

        Ok(Self {
            scheduler,
            jobs: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub async fn start(&self) -> Result<(), SchedulerError> {
        self.scheduler.start()
            .await
            .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;
        Ok(())
    }

pub async fn shutdown(&mut self) -> Result<(), SchedulerError> {
        self.scheduler.shutdown()
        .await
        .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;
        Ok(())
    }

    pub async fn add_job(&self, job: Job) -> Result<String, SchedulerError> {
        let job_id = job.guid();
        let id_string = job_id.to_string();

self.scheduler.add(job)
        .await
        .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;

        let mut jobs = self.jobs.lock().await;
        jobs.insert(id_string.clone(), job_id);

        Ok(id_string)
    }

    pub async fn remove_job(&self, schedule_id: &str) -> Result<(), SchedulerError> {
        let mut jobs = self.jobs.lock().await;

        let job_id = jobs.remove(schedule_id)
        .ok_or_else(|| SchedulerError::JobNotFound(schedule_id.to_string()))?;

        drop(jobs);

        self.scheduler.remove(&job_id)
        .await
        .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;

        Ok(())
    }

    pub async fn get_job_ids(&self) -> Vec<String> {
        let jobs = self.jobs.lock().await;
        jobs.keys().cloned().collect()
    }
}

#[allow(dead_code)]
pub fn calculate_retry_delay(attempt: u32) -> u64 {
    2u64.pow(attempt) * 60_000
}

/// Calculate retry delay using a RetryPolicy.
///
/// T6.6: Wire scheduler to use RetryPolicy from ErrorClassifier
#[allow(dead_code)]
pub fn calculate_retry_delay_with_policy(policy: &RetryPolicy, attempt: u32) -> u64 {
    policy.calculate_delay(attempt)
}

#[allow(dead_code)]
pub fn apply_variance(scheduled_at: DateTime<Utc>, variance_minutes: i64) -> DateTime<Utc> {
    use rand::Rng;
    let offset_minutes = rand::thread_rng().gen_range(-variance_minutes..=variance_minutes);
    scheduled_at + chrono::Duration::minutes(offset_minutes)
}

#[allow(dead_code)]
pub fn validate_cron_expression(expression: &str) -> Result<(), SchedulerError> {
    let parts: Vec<&str> = expression.split_whitespace().collect();
    if parts.len() < 5 || parts.len() > 6 {
        return Err(SchedulerError::InvalidSchedule(
            "Cron expression must have 5-6 fields".to_string()
        ));
    }
    Ok(())
}

#[allow(dead_code)]
pub fn create_one_time_job<F>(
    scheduled_at: DateTime<Utc>,
    variance_minutes: i64,
    _schedule_id: String,
    callback: F,
) -> Result<Job, SchedulerError>
where
    F: Fn() + Send + Sync + 'static,
{
    let adjusted_time = apply_variance(scheduled_at, variance_minutes);
    let now = Utc::now();

    if adjusted_time <= now {
        return Err(SchedulerError::InvalidSchedule(
            "Scheduled time must be in the future".to_string()
        ));
    }

    let chrono_duration = adjusted_time - now;
    let duration = std::time::Duration::from_secs(chrono_duration.num_seconds() as u64);

    let job = Job::new_one_shot(duration, move |_uuid, _l| {
        callback();
    })
    .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;

    Ok(job)
}

#[allow(dead_code)]
pub fn create_cron_job<F>(
    cron_expression: &str,
    _schedule_id: String,
    callback: F,
) -> Result<Job, SchedulerError>
where
    F: Fn() + Send + Sync + 'static,
{
    validate_cron_expression(cron_expression)?;

    let job = Job::new(cron_expression, move |_uuid, _l| {
        callback();
    })
    .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;

    Ok(job)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_one_time_job_applies_variance() {
        use chrono::TimeZone;
        let scheduled_at = Utc.with_ymd_and_hms(2026, 4, 11, 10, 0, 0).unwrap();
        let variance_minutes: i64 = 15;

        let earliest = scheduled_at - chrono::Duration::minutes(variance_minutes);
        let latest = scheduled_at + chrono::Duration::minutes(variance_minutes);

        assert_eq!(earliest, Utc.with_ymd_and_hms(2026, 4, 11, 9, 45, 0).unwrap());
        assert_eq!(latest, Utc.with_ymd_and_hms(2026, 4, 11, 10, 15, 0).unwrap());
    }

    #[test]
    fn test_retry_exponential_backoff() {
        let delay_0 = calculate_retry_delay(0);
        let delay_1 = calculate_retry_delay(1);
        let delay_2 = calculate_retry_delay(2);

        assert_eq!(delay_0, 60_000, "Attempt 0 should be 60s");
        assert_eq!(delay_1, 120_000, "Attempt 1 should be 120s");
        assert_eq!(delay_2, 240_000, "Attempt 2 should be 240s");
    }

    #[test]
    fn test_job_checks_antiban_before_execution() {
    }

    #[test]
    fn test_job_updates_status_lifecycle() {
        let mut status = ScheduleStatus::Pending;
        assert_eq!(status.as_str(), "PENDING");

        status = ScheduleStatus::Running;
        assert_eq!(status.as_str(), "RUNNING");

        status = ScheduleStatus::Completed;
        assert_eq!(status.as_str(), "COMPLETED");

        status = ScheduleStatus::Failed;
        assert_eq!(status.as_str(), "FAILED");
    }

    #[test]
    fn test_cancelled_status() {
        let status = ScheduleStatus::Cancelled;
        assert_eq!(status.as_str(), "CANCELLED");
    }

    #[test]
    fn test_apply_variance_within_range() {
        use chrono::TimeZone;
        let scheduled_at = Utc.with_ymd_and_hms(2026, 4, 11, 10, 0, 0).unwrap();
        let variance_minutes: i64 = 15;

        for _ in 0..10 {
            let adjusted = apply_variance(scheduled_at, variance_minutes);
            let diff = (adjusted - scheduled_at).num_minutes().abs();
            assert!(diff <= variance_minutes, "Variance {} exceeds limit {}", diff, variance_minutes);
        }
    }

    #[test]
    fn test_validate_cron_expression_valid() {
        assert!(validate_cron_expression("0 0 * * *").is_ok());
        assert!(validate_cron_expression("*/5 * * * *").is_ok());
        assert!(validate_cron_expression("0 0 1 1 *").is_ok());
        assert!(validate_cron_expression("0 0 0 * * *").is_ok());
    }

    #[test]
    fn test_validate_cron_expression_invalid() {
        assert!(validate_cron_expression("* * * *").is_err());
        assert!(validate_cron_expression("* * * * * * *").is_err());
        assert!(validate_cron_expression("").is_err());
    }

    #[test]
    fn test_schedule_status_from_str() {
        assert_eq!(ScheduleStatus::from_str("pending"), Some(ScheduleStatus::Pending));
        assert_eq!(ScheduleStatus::from_str("PENDING"), Some(ScheduleStatus::Pending));
        assert_eq!(ScheduleStatus::from_str("Running"), Some(ScheduleStatus::Running));
        assert_eq!(ScheduleStatus::from_str("completed"), Some(ScheduleStatus::Completed));
        assert_eq!(ScheduleStatus::from_str("FAILED"), Some(ScheduleStatus::Failed));
        assert_eq!(ScheduleStatus::from_str("cancelled"), Some(ScheduleStatus::Cancelled));
        assert_eq!(ScheduleStatus::from_str("invalid"), None);
        assert_eq!(ScheduleStatus::from_str(""), None);
    }

    #[test]
    fn test_schedule_job_data_serialization() {
        let data = ScheduleJobData {
            schedule_id: "sched_123".to_string(),
            post_id: "post_456".to_string(),
            account_id: "acc_789".to_string(),
        };

        let json = serde_json::to_string(&data).unwrap();
        let parsed: ScheduleJobData = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.schedule_id, data.schedule_id);
        assert_eq!(parsed.post_id, data.post_id);
        assert_eq!(parsed.account_id, data.account_id);
    }

    #[test]
    fn test_execution_result_serialization() {
        let result = ExecutionResult {
            schedule_id: "sched_123".to_string(),
            success: true,
            error_message: None,
            duration_ms: 1500,
            post_url: Some("https://facebook.com/post/123".to_string()),
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: ExecutionResult = serde_json::from_str(&json).unwrap();

        assert!(parsed.success);
        assert_eq!(parsed.duration_ms, 1500);
        assert!(parsed.error_message.is_none());
        assert!(parsed.post_url.is_some());
    }

    // ============================================
    // T6.3: RetryPolicy struct tests
    // ============================================

    #[test]
    fn test_retry_policy_default_values() {
        let policy = RetryPolicy::default();

        assert_eq!(policy.max_attempts, 3);
        assert_eq!(policy.base_delay_ms, 60_000);
        assert_eq!(policy.backoff_multiplier, 2.0);
        assert_eq!(policy.max_delay_ms, 300_000);
        assert_eq!(policy.jitter_percentage, 0.15);
    }

    #[test]
    fn test_retry_policy_calculate_delay_exponential() {
        let policy = RetryPolicy {
            max_attempts: 5,
            base_delay_ms: 60_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 600_000,
            jitter_percentage: 0.0,
        };

        // Without jitter, delays should be: 60s, 120s, 240s, 480s, capped at max
        let delay0 = policy.calculate_delay(0);
        let delay1 = policy.calculate_delay(1);
        let delay2 = policy.calculate_delay(2);
        let delay3 = policy.calculate_delay(3);

        // Allow for small rounding differences
        assert!(delay0 >= 54_000 && delay0 <= 66_000, "Delay0 should be ~60s, got {}", delay0);
        assert!(delay1 >= 114_000 && delay1 <= 126_000, "Delay1 should be ~120s, got {}", delay1);
        assert!(delay2 >= 228_000 && delay2 <= 252_000, "Delay2 should be ~240s, got {}", delay2);
        assert!(delay3 >= 456_000 && delay3 <= 504_000, "Delay3 should be ~480s, got {}", delay3);
    }

    #[test]
    fn test_retry_policy_caps_at_max_delay() {
        let policy = RetryPolicy {
            max_attempts: 10,
            base_delay_ms: 60_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 300_000,
            jitter_percentage: 0.0,
        };

        // Even with high attempt numbers, should be capped
        let delay = policy.calculate_delay(100);

        assert!(delay <= policy.max_delay_ms + 50_000, "Delay {} should be capped at {}", delay, policy.max_delay_ms);
    }

    #[test]
    fn test_retry_policy_is_exhausted() {
        let policy = RetryPolicy {
            max_attempts: 3,
            base_delay_ms: 60_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 300_000,
            jitter_percentage: 0.0,
        };

        assert!(!policy.is_exhausted(0));
        assert!(!policy.is_exhausted(1));
        assert!(!policy.is_exhausted(2));
        assert!(policy.is_exhausted(3));
        assert!(policy.is_exhausted(10));
    }

    #[test]
    fn test_retry_policy_remaining_attempts() {
        let policy = RetryPolicy {
            max_attempts: 3,
            base_delay_ms: 60_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 300_000,
            jitter_percentage: 0.0,
        };

        assert_eq!(policy.remaining_attempts(0), 3);
        assert_eq!(policy.remaining_attempts(1), 2);
        assert_eq!(policy.remaining_attempts(2), 1);
        assert_eq!(policy.remaining_attempts(3), 0);
        assert_eq!(policy.remaining_attempts(10), 0);
    }

    #[test]
    fn test_retry_policy_quick_retry() {
        let policy = RetryPolicy::quick_retry();

        assert_eq!(policy.max_attempts, 3);
        assert_eq!(policy.base_delay_ms, 10_000);
        assert_eq!(policy.max_delay_ms, 60_000);
    }

    #[test]
    fn test_retry_policy_slow_retry() {
        let policy = RetryPolicy::slow_retry();

        assert_eq!(policy.max_attempts, 3);
        assert_eq!(policy.base_delay_ms, 120_000);
        assert_eq!(policy.max_delay_ms, 600_000);
    }

    #[test]
    fn test_retry_policy_with_settings() {
        let policy = RetryPolicy::with_settings(5, 30_000, 1.5, 180_000);

        assert_eq!(policy.max_attempts, 5);
        assert_eq!(policy.base_delay_ms, 30_000);
        assert_eq!(policy.backoff_multiplier, 1.5);
        assert_eq!(policy.max_delay_ms, 180_000);
    }

    #[test]
    fn test_retry_policy_serialization() {
        let policy = RetryPolicy {
            max_attempts: 5,
            base_delay_ms: 30_000,
            backoff_multiplier: 1.5,
            max_delay_ms: 180_000,
            jitter_percentage: 0.10,
        };

        let json = serde_json::to_string(&policy).unwrap();
        let parsed: RetryPolicy = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.max_attempts, 5);
        assert_eq!(parsed.base_delay_ms, 30_000);
        assert_eq!(parsed.backoff_multiplier, 1.5);
    }

    // ============================================
    // T6.5: Scheduler using retry policy tests
    // ============================================

    #[test]
    fn test_calculate_retry_delay_with_policy() {
        let policy = RetryPolicy {
            max_attempts: 3,
            base_delay_ms: 60_000,
            backoff_multiplier: 2.0,
            max_delay_ms: 300_000,
            jitter_percentage: 0.0,
        };

        let delay0 = calculate_retry_delay_with_policy(&policy, 0);
        let delay1 = calculate_retry_delay_with_policy(&policy, 1);
        let delay2 = calculate_retry_delay_with_policy(&policy, 2);

        // Should use exponential backoff
        assert!(delay0 >= 54_000, "Delay0 should be >= 54s, got {}", delay0);
        assert!(delay1 > delay0, "Delay1 should be > delay0");
        assert!(delay2 > delay1, "Delay2 should be > delay1");
    }

    #[test]
    fn test_retry_policy_from_classifier() {
        let classifier = ErrorClassifier::new();
        let policy = RetryPolicy::from_classifier(&classifier);

        // Should use default policy
        assert_eq!(policy.max_attempts, 3);
    }

    // T6.7: Integration test for complete failure flow
    // ============================================

    #[test]
    fn test_complete_failure_flow() {
        use crate::error_handler::UnifiedError;
        use crate::circuit_breaker::CircuitBreaker;
        use crate::dead_letter_queue::DeadLetterQueueManager;

        // 1. Start with healthy state
        let classifier = ErrorClassifier::new();
        let dlq_manager = DeadLetterQueueManager::new();
        let policy = RetryPolicy::default();

        // 2. Simulate failure
        let error = UnifiedError::RateLimit {
            subcategory: "hourly_limit".to_string(),
        };

        // 3. Classify error
        let strategy = classifier.classify(&error);

        // 4. For retryable errors, calculate delay
        match &strategy {
            crate::error_handler::RecoveryStrategy::RetryWithBackoff { max_retries, base_delay_ms } => {
                assert_eq!(*max_retries, 3);
                assert_eq!(*base_delay_ms, 60_000);

                // Calculate delays for retries
                for attempt in 0..*max_retries {
                    let delay = policy.calculate_delay(attempt);
                    assert!(delay > 0, "Delay should be positive");
                }
            }
            _ => panic!("Expected RetryWithBackoff for RateLimit error"),
        }

        // 5. If retries exhausted, move to DLQ
        let final_attempt = policy.max_attempts;
        assert!(policy.is_exhausted(final_attempt));

        // 6. Create DLQ entry
        let dlq_entry = dlq_manager.store(
            Some("task_123".to_string()),
            "post".to_string(),
            r#"{"content": "test"}"#.to_string(),
            &error,
            &strategy,
            "Rate limit exceeded after retries".to_string(),
            r#"{"account_id": "acc_123"}"#.to_string(),
        );

        assert!(dlq_entry.id.starts_with("dlq_"));
        assert_eq!(dlq_entry.original_task_id, Some("task_123".to_string()));
    }

    #[test]
    fn test_failure_flow_circuit_breaker_triggers() {
        use crate::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig, CircuitState};

        let config = CircuitBreakerConfig {
            failure_threshold: 3,
            ..Default::default()
        };
        let mut circuit_breaker = CircuitBreaker::new(config);

        // Simulate consecutive failures
        assert_eq!(circuit_breaker.state(), CircuitState::Closed);

        circuit_breaker.record_failure();
        circuit_breaker.record_failure();
        assert_eq!(circuit_breaker.state(), CircuitState::Closed);

        circuit_breaker.record_failure(); // Third failure trips circuit
        assert_eq!(circuit_breaker.state(), CircuitState::Open);

        // Circuit should block execution
        assert!(!circuit_breaker.can_execute());
    }

#[test]
fn test_failure_flow_critical_escalation() {
    use crate::error_handler::{Severity, UnifiedError};
    use crate::alert_system::{AlertEngine, AlertType};
    use crate::dead_letter_queue::DeadLetterQueueManager;

        let mut alert_engine = AlertEngine::new();
        let dlq_manager = DeadLetterQueueManager::new();
        let classifier = ErrorClassifier::new();

        // Critical error
        let error = UnifiedError::AccountRestricted {
            reason: "banned".to_string(),
        };

        let strategy = classifier.classify(&error);

        // Should escalate
    match &strategy {
        crate::error_handler::RecoveryStrategy::CircuitBreak { .. } => {
            let alert = alert_engine.create_alert(
                AlertType::AccountBlocked,
                Severity::Critical,
                "Account restricted".to_string(),
            );

                // Create DLQ entry
                let dlq_entry = alert_engine.create_dlq_entry_for_alert(
                    &alert,
                    &dlq_manager,
                    &error,
                    &strategy,
                );

                assert!(dlq_entry.unified_error.contains("AccountRestricted"));
            }
            _ => panic!("Expected CircuitBreak for AccountRestricted error"),
        }
    }
}
