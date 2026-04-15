//! Database models for persistence
//!
//! These models mirror the Prisma schema for SQLite storage.
//! Used by commands/posting.rs for session and job persistence.

use chrono::Utc;
use serde::{Deserialize, Serialize};

// ============================================
// POST SESSION MODEL
// ============================================

/// Session status matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Pending,
    Running,
    Completed,
    Cancelled,
    Failed,
}

impl SessionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionStatus::Pending => "pending",
            SessionStatus::Running => "running",
            SessionStatus::Completed => "completed",
            SessionStatus::Cancelled => "cancelled",
            SessionStatus::Failed => "failed",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "pending" => Some(SessionStatus::Pending),
            "running" => Some(SessionStatus::Running),
            "completed" => Some(SessionStatus::Completed),
            "cancelled" => Some(SessionStatus::Cancelled),
            "failed" => Some(SessionStatus::Failed),
            _ => None,
        }
    }
}

impl Default for SessionStatus {
    fn default() -> Self {
        SessionStatus::Pending
    }
}

/// PostJob status matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum JobStatus {
    Pending,
    Processing,
    Success,
    Failed,
    Skipped,
}

impl JobStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            JobStatus::Pending => "pending",
            JobStatus::Processing => "processing",
            JobStatus::Success => "success",
            JobStatus::Failed => "failed",
            JobStatus::Skipped => "skipped",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "pending" => Some(JobStatus::Pending),
            "processing" => Some(JobStatus::Processing),
            "success" => Some(JobStatus::Success),
            "failed" => Some(JobStatus::Failed),
            "skipped" => Some(JobStatus::Skipped),
            _ => None,
        }
    }
}

impl Default for JobStatus {
    fn default() -> Self {
        JobStatus::Pending
    }
}

/// Error categories for posting failures
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCategory {
    RateLimited,
    SessionExpired,
    GroupNotFound,
    ContentRejected,
    MediaUploadFailed,
    PermissionDenied,
    NetworkError,
    BrowserError,
    UnknownError,
    Cancelled,
}

impl ErrorCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            ErrorCategory::RateLimited => "RATE_LIMITED",
            ErrorCategory::SessionExpired => "SESSION_EXPIRED",
            ErrorCategory::GroupNotFound => "GROUP_NOT_FOUND",
            ErrorCategory::ContentRejected => "CONTENT_REJECTED",
            ErrorCategory::MediaUploadFailed => "MEDIA_UPLOAD_FAILED",
            ErrorCategory::PermissionDenied => "PERMISSION_DENIED",
            ErrorCategory::NetworkError => "NETWORK_ERROR",
            ErrorCategory::BrowserError => "BROWSER_ERROR",
            ErrorCategory::UnknownError => "UNKNOWN_ERROR",
            ErrorCategory::Cancelled => "CANCELLED",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "RATE_LIMITED" => Some(ErrorCategory::RateLimited),
            "SESSION_EXPIRED" => Some(ErrorCategory::SessionExpired),
            "GROUP_NOT_FOUND" => Some(ErrorCategory::GroupNotFound),
            "CONTENT_REJECTED" => Some(ErrorCategory::ContentRejected),
            "MEDIA_UPLOAD_FAILED" => Some(ErrorCategory::MediaUploadFailed),
            "PERMISSION_DENIED" => Some(ErrorCategory::PermissionDenied),
            "NETWORK_ERROR" => Some(ErrorCategory::NetworkError),
            "BROWSER_ERROR" => Some(ErrorCategory::BrowserError),
            "UNKNOWN_ERROR" => Some(ErrorCategory::UnknownError),
            "CANCELLED" => Some(ErrorCategory::Cancelled),
            _ => None,
        }
    }

    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            ErrorCategory::RateLimited
                | ErrorCategory::SessionExpired
                | ErrorCategory::NetworkError
                | ErrorCategory::BrowserError
        )
    }
}

/// PostSession database model matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostSessionModel {
    pub id: String,
    pub status: String,
    pub template_id: Option<String>,
    pub account_id: String,
    pub total_jobs: i32,
    pub completed_jobs: i32,
    pub successful_jobs: i32,
    pub failed_jobs: i32,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub cancelled_at: Option<String>,
    pub last_error: Option<String>,
    pub error_category: Option<String>,
    pub config_snapshot: String,
    pub created_at: String,
    pub updated_at: String,
}

impl PostSessionModel {
    /// Create a new PostSession for insertion
    pub fn new(
        id: String,
        account_id: String,
        template_id: Option<String>,
        total_jobs: u32,
        config_snapshot: String,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id,
            status: SessionStatus::Pending.as_str().to_string(),
            template_id,
            account_id,
            total_jobs: total_jobs as i32,
            completed_jobs: 0,
            successful_jobs: 0,
            failed_jobs: 0,
            started_at: None,
            completed_at: None,
            cancelled_at: None,
            last_error: None,
            error_category: None,
            config_snapshot,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Mark session as running
    pub fn start(&mut self) {
        self.status = SessionStatus::Running.as_str().to_string();
        self.started_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Mark session as completed
    pub fn complete(&mut self) {
        self.status = SessionStatus::Completed.as_str().to_string();
        self.completed_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Mark session as cancelled
    pub fn cancel(&mut self) {
        self.status = SessionStatus::Cancelled.as_str().to_string();
        self.cancelled_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Mark session as failed
    pub fn fail(&mut self, error: String, category: Option<String>) {
        self.status = SessionStatus::Failed.as_str().to_string();
        self.last_error = Some(error);
        self.error_category = category;
        self.completed_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Increment successful jobs counter
    pub fn increment_success(&mut self) {
        self.successful_jobs += 1;
        self.completed_jobs += 1;
        self.updated_at = Utc::now().to_rfc3339();

        // Auto-complete if all jobs done
        if self.completed_jobs >= self.total_jobs {
            self.complete();
        }
    }

    /// Increment failed jobs counter
    pub fn increment_failed(&mut self) {
        self.failed_jobs += 1;
        self.completed_jobs += 1;
        self.updated_at = Utc::now().to_rfc3339();

        // Auto-complete if all jobs done
        if self.completed_jobs >= self.total_jobs {
            self.complete();
        }
    }

    /// Increment skipped jobs counter
    pub fn increment_skipped(&mut self) {
        self.completed_jobs += 1;
        self.updated_at = Utc::now().to_rfc3339();

        // Auto-complete if all jobs done
        if self.completed_jobs >= self.total_jobs {
            self.complete();
        }
    }
}

/// PostJob database model matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostJobModel {
    pub id: String,
    pub session_id: String,
    pub group_id: String,
    pub platform: String,
    pub priority: i32,
    pub content: String,
    pub post_url: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
    pub error_category: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub duration_ms: Option<i32>,
    pub retry_count: i32,
    pub max_retries: i32,
    pub next_retry_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl PostJobModel {
    /// Create a new PostJob for insertion
    pub fn new(
        id: String,
        session_id: String,
        group_id: String,
        platform: String,
        priority: i32,
        content: String,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id,
            session_id,
            group_id,
            platform,
            priority,
            content,
            post_url: None,
            status: JobStatus::Pending.as_str().to_string(),
            error_message: None,
            error_category: None,
            started_at: None,
            completed_at: None,
            duration_ms: None,
            retry_count: 0,
            max_retries: 3,
            next_retry_at: None,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Mark job as processing
    pub fn start(&mut self) {
        self.status = JobStatus::Processing.as_str().to_string();
        self.started_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Mark job as successful
    pub fn succeed(&mut self, post_url: Option<String>, duration_ms: Option<i32>) {
        self.status = JobStatus::Success.as_str().to_string();
        self.post_url = post_url;
        self.duration_ms = duration_ms;
        self.completed_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Mark job as failed
    pub fn fail(&mut self, error: String, category: Option<String>) {
        self.status = JobStatus::Failed.as_str().to_string();
        self.error_message = Some(error);
        self.error_category = category;
        self.completed_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Mark job as skipped
    pub fn skip(&mut self, reason: String) {
        self.status = JobStatus::Skipped.as_str().to_string();
        self.error_message = Some(reason);
        self.error_category = Some(ErrorCategory::Cancelled.as_str().to_string());
        self.completed_at = Some(Utc::now().to_rfc3339());
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// Reset job for retry
    pub fn retry(&mut self) -> Result<(), String> {
        if self.retry_count >= self.max_retries {
            return Err(format!(
                "Job has reached max retries ({}/{})",
                self.retry_count, self.max_retries
            ));
        }

        self.status = JobStatus::Pending.as_str().to_string();
        self.retry_count += 1;
        self.error_message = None;
        self.error_category = None;
        self.post_url = None;
        self.started_at = None;
        self.completed_at = None;
        self.duration_ms = None;
        self.updated_at = Utc::now().to_rfc3339();

        Ok(())
    }

    /// Check if job can be retried
    pub fn can_retry(&self) -> bool {
        self.retry_count < self.max_retries
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_status_conversion() {
        assert_eq!(
            SessionStatus::from_str("pending"),
            Some(SessionStatus::Pending)
        );
        assert_eq!(
            SessionStatus::from_str("RUNNING"),
            Some(SessionStatus::Running)
        );
        assert_eq!(SessionStatus::from_str("invalid"), None);
    }

    #[test]
    fn test_job_status_conversion() {
        assert_eq!(JobStatus::from_str("pending"), Some(JobStatus::Pending));
        assert_eq!(JobStatus::from_str("SUCCESS"), Some(JobStatus::Success));
        assert_eq!(JobStatus::from_str("invalid"), None);
    }

    #[test]
    fn test_error_category_retryable() {
        assert!(ErrorCategory::RateLimited.is_retryable());
        assert!(ErrorCategory::NetworkError.is_retryable());
        assert!(!ErrorCategory::ContentRejected.is_retryable());
    }

    #[test]
    fn test_post_session_new() {
        let session = PostSessionModel::new(
            "sess_123".to_string(),
            "acct_456".to_string(),
            Some("tmpl_789".to_string()),
            5,
            "{}".to_string(),
        );

        assert_eq!(session.id, "sess_123");
        assert_eq!(session.status, "pending");
        assert_eq!(session.total_jobs, 5);
        assert_eq!(session.completed_jobs, 0);
    }

    #[test]
    fn test_post_session_start() {
        let mut session = PostSessionModel::new(
            "sess_123".to_string(),
            "acct_456".to_string(),
            None,
            3,
            "{}".to_string(),
        );

        session.start();

        assert_eq!(session.status, "running");
        assert!(session.started_at.is_some());
    }

    #[test]
    fn test_post_session_increment_success() {
        let mut session = PostSessionModel::new(
            "sess_123".to_string(),
            "acct_456".to_string(),
            None,
            2,
            "{}".to_string(),
        );

        session.increment_success();

        assert_eq!(session.successful_jobs, 1);
        assert_eq!(session.completed_jobs, 1);
        assert_eq!(session.status, "pending"); // Not completed yet

        session.increment_success();

        assert_eq!(session.successful_jobs, 2);
        assert_eq!(session.completed_jobs, 2);
        assert_eq!(session.status, "completed"); // Auto-completed
    }

    #[test]
    fn test_post_job_new() {
        let job = PostJobModel::new(
            "job_123".to_string(),
            "sess_456".to_string(),
            "group_789".to_string(),
            "facebook_groups".to_string(),
            99,
            "Test content".to_string(),
        );

        assert_eq!(job.id, "job_123");
        assert_eq!(job.session_id, "sess_456");
        assert_eq!(job.status, "pending");
        assert_eq!(job.priority, 99);
    }

    #[test]
    fn test_post_job_succeed() {
        let mut job = PostJobModel::new(
            "job_123".to_string(),
            "sess_456".to_string(),
            "group_789".to_string(),
            "facebook_groups".to_string(),
            99,
            "Test".to_string(),
        );

        job.succeed(Some("https://fb.com/post/123".to_string()), Some(5000));

        assert_eq!(job.status, "success");
        assert!(job.post_url.is_some());
        assert_eq!(job.duration_ms, Some(5000));
    }

    #[test]
    fn test_post_job_retry() {
        let mut job = PostJobModel::new(
            "job_123".to_string(),
            "sess_456".to_string(),
            "group_789".to_string(),
            "facebook_groups".to_string(),
            99,
            "Test".to_string(),
        );

        // First retry
        job.fail(
            "Network error".to_string(),
            Some("NETWORK_ERROR".to_string()),
        );
        let result = job.retry();
        assert!(result.is_ok());
        assert_eq!(job.retry_count, 1);
        assert_eq!(job.status, "pending");

        // Second retry
        job.fail(
            "Network error".to_string(),
            Some("NETWORK_ERROR".to_string()),
        );
        let result = job.retry();
        assert!(result.is_ok());
        assert_eq!(job.retry_count, 2);

        // Third retry
        job.fail(
            "Network error".to_string(),
            Some("NETWORK_ERROR".to_string()),
        );
        let result = job.retry();
        assert!(result.is_ok());
        assert_eq!(job.retry_count, 3);

        // Fourth retry should fail
        job.fail(
            "Network error".to_string(),
            Some("NETWORK_ERROR".to_string()),
        );
        let result = job.retry();
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("max retries"));
    }
}
