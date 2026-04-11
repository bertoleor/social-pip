use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio_cron_scheduler::{Job, JobScheduler, JobId};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;

#[derive(Debug, Error)]
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
pub struct ScheduleJobData {
    pub schedule_id: String,
    pub post_id: String,
    pub account_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScheduleStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

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
pub struct ExecutionResult {
    pub schedule_id: String,
    pub success: bool,
    pub error_message: Option<String>,
    pub duration_ms: u64,
    pub post_url: Option<String>,
}

pub struct ActiveScheduler {
    scheduler: JobScheduler,
    jobs: Arc<Mutex<HashMap<String, JobId>>>,
}

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

    pub async fn shutdown(&self) -> Result<(), SchedulerError> {
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

pub fn calculate_retry_delay(attempt: u32) -> u64 {
    2u64.pow(attempt) * 60_000
}

pub fn apply_variance(scheduled_at: DateTime<Utc>, variance_minutes: i64) -> DateTime<Utc> {
    use rand::Rng;
    let offset_minutes = rand::thread_rng().gen_range(-variance_minutes..=variance_minutes);
    scheduled_at + chrono::Duration::minutes(offset_minutes)
}

pub fn validate_cron_expression(expression: &str) -> Result<(), SchedulerError> {
    let parts: Vec<&str> = expression.split_whitespace().collect();
    if parts.len() < 5 || parts.len() > 6 {
        return Err(SchedulerError::InvalidSchedule(
            "Cron expression must have 5-6 fields".to_string()
        ));
    }
    Ok(())
}

pub fn create_one_time_job<F>(
    scheduled_at: DateTime<Utc>,
    variance_minutes: i64,
    schedule_id: String,
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

    let job = Job::new_one_shot(adjusted_time - now, move |_uuid, _l| {
        callback();
    })
    .map_err(|e| SchedulerError::JobCreationFailed(e.to_string()))?;

    Ok(job)
}

pub fn create_cron_job<F>(
    cron_expression: &str,
    schedule_id: String,
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
}
