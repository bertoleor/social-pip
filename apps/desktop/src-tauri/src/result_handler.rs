//! Result Handler Module - Process job results from Native Messaging
//!
//! This module handles the result of posting jobs received from the Chrome extension
//! via Native Messaging. It processes job results, updates job/session status, and
//! integrates with the error aggregation system.
//!
//! ## Flow
//! 1. Extension sends TaskResult via Native Messaging
//! 2. handle_job_result() processes the result
//! 3. Job status is updated (success/failed)
//! 4. Session counters are updated
//! 5. Errors are aggregated via error_aggregation module

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::database::{
    InMemoryStore, JobPersistence, PostJobModel, PostSessionModel, SessionPersistence,
};
use crate::error_aggregation::{ErrorAggregator, ErrorGroup};
use crate::native_messaging::{NativeMessage, NativeResponse, TaskResultPayload};

// ============================================
// JOB RESULT TYPES (T-5.1, T-5.2)
// ============================================

/// Result of a single post operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostResult {
    /// Job ID that was processed
    pub job_id: String,
    /// Session ID the job belongs to
    pub session_id: String,
    /// Whether the post was successful
    pub success: bool,
    /// URL of the published post (if successful)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_url: Option<String>,
    /// Platform-specific post ID (if successful)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform_post_id: Option<String>,
    /// Error message (if failed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// Error category (if failed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    /// Time taken to complete the post (ms)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<i32>,
}

impl PostResult {
    /// Create a successful post result
    pub fn success(
        job_id: String,
        session_id: String,
        post_url: Option<String>,
        platform_post_id: Option<String>,
        duration_ms: Option<i32>,
    ) -> Self {
        Self {
            job_id,
            session_id,
            success: true,
            post_url,
            platform_post_id,
            error: None,
            error_category: None,
            duration_ms,
        }
    }

    /// Create a failed post result
    pub fn failure(
        job_id: String,
        session_id: String,
        error: String,
        error_category: Option<String>,
        duration_ms: Option<i32>,
    ) -> Self {
        Self {
            job_id,
            session_id,
            success: false,
            post_url: None,
            platform_post_id: None,
            error: Some(error),
            error_category,
            duration_ms,
        }
    }

    /// Convert from TaskResultPayload
    pub fn from_task_result(task_result: &TaskResultPayload, session_id: String) -> Self {
        if task_result.success {
            Self::success(
                task_result.task_id.clone(),
                session_id,
                task_result.post_url.clone(),
                task_result.platform_post_id.clone(),
                None,
            )
        } else {
            Self::failure(
                task_result.task_id.clone(),
                session_id,
                task_result
                    .error
                    .clone()
                    .unwrap_or_else(|| "Unknown error".to_string()),
                None, // Will be classified later
                None,
            )
        }
    }
}

/// Aggregated result of a job batch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobResult {
    /// Session ID for the batch
    pub session_id: String,
    /// Total jobs in the batch
    pub total_jobs: u32,
    /// Successfully completed jobs
    pub successful_jobs: u32,
    /// Failed jobs
    pub failed_jobs: u32,
    /// Individual post results
    pub results: Vec<PostResult>,
    /// Session-level error (if session failed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_error: Option<String>,
    /// Timestamp when result was generated
    pub timestamp: String,
}

impl JobResult {
    /// Create a new job result
    pub fn new(session_id: String, total_jobs: u32) -> Self {
        Self {
            session_id,
            total_jobs,
            successful_jobs: 0,
            failed_jobs: 0,
            results: Vec::new(),
            session_error: None,
            timestamp: Utc::now().to_rfc3339(),
        }
    }

    /// Add a post result to the batch
    pub fn add_result(&mut self, result: PostResult) {
        if result.success {
            self.successful_jobs += 1;
        } else {
            self.failed_jobs += 1;
        }
        self.results.push(result);
    }

    /// Calculate success rate
    pub fn success_rate(&self) -> f64 {
        if self.total_jobs == 0 {
            return 0.0;
        }
        (self.successful_jobs as f64 / self.total_jobs as f64) * 100.0
    }

    /// Check if all jobs are complete
    pub fn is_complete(&self) -> bool {
        (self.successful_jobs + self.failed_jobs) >= self.total_jobs
    }

    /// Get failed results
    pub fn failed_results(&self) -> Vec<&PostResult> {
        self.results.iter().filter(|r| !r.success).collect()
    }
}

// ============================================
// RESULT HANDLER (T-5.3, T-5.4)
// ============================================

/// Handler for processing job results
pub struct ResultHandler {
    /// Reference to the persistence store
    store: Arc<InMemoryStore>,
}

impl ResultHandler {
    /// Create a new result handler
    pub fn new(store: Arc<InMemoryStore>) -> Self {
        Self { store }
    }

    /// Handle a job result from Native Messaging
    ///
    /// This function:
    /// 1. Looks up the job by ID
    /// 2. Updates the job status
    /// 3. Updates the session counters
    /// 4. Processes errors through aggregation
    pub fn handle_job_result(&self, result: PostResult) -> Result<JobProcessingOutcome, String> {
        // 1. Look up the job
        let job = self
            .store
            .jobs
            .get_job(&result.job_id)?
            .ok_or_else(|| format!("Job not found: {}", result.job_id))?;

        // 2. Update job status
        let mut updated_job = job.clone();
        if result.success {
            updated_job.succeed(result.post_url.clone(), result.duration_ms);
        } else {
            let category = result
                .error_category
                .clone()
                .or_else(|| Some("UNKNOWN_ERROR".to_string()));
            updated_job.fail(
                result
                    .error
                    .clone()
                    .unwrap_or_else(|| "Unknown error".to_string()),
                category,
            );
        }
        self.store.jobs.update_job(updated_job.clone())?;

        // 3. Update session counters
        let session = self
            .store
            .sessions
            .get_session(&result.session_id)?
            .ok_or_else(|| format!("Session not found: {}", result.session_id))?;

        let mut updated_session = session.clone();
        if result.success {
            updated_session.increment_success();
        } else {
            updated_session.increment_failed();
        }
        let session_complete = updated_session.status == "completed";
        self.store.sessions.update_session(updated_session)?;

        // 4. Process error through aggregation (if failed)
        let error_group = if !result.success {
            let error_msg = result.error.unwrap_or_else(|| "Unknown error".to_string());
            let platform = Some(job.platform.as_str());
            let account_id = Some(session.account_id.as_str());

            // Use the error category if provided, otherwise classify it
            let error_type = result
                .error_category
                .clone()
                .unwrap_or_else(|| classify_error(&error_msg));

            let (group, _is_new) =
                ErrorAggregator::process_error(&error_type, platform, account_id, &error_msg);
            Some(group)
        } else {
            None
        };

        Ok(JobProcessingOutcome {
            job_id: result.job_id,
            success: result.success,
            session_complete,
            error_group,
        })
    }

    /// Handle a Native Message and return response
    pub fn handle_native_message(
        &self,
        message: NativeMessage,
        session_id: &str,
    ) -> NativeResponse {
        match message {
            NativeMessage::TaskResult { result } => {
                let post_result = PostResult::from_task_result(&result, session_id.to_string());

                match self.handle_job_result(post_result) {
                    Ok(outcome) => NativeResponse::Ack {
                        success: outcome.success,
                    },
                    Err(e) => NativeResponse::Error { error: e },
                }
            }
            _ => NativeResponse::Error {
                error: "Unexpected message type".to_string(),
            },
        }
    }
}

/// Outcome of processing a job result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobProcessingOutcome {
    /// Job ID that was processed
    pub job_id: String,
    /// Whether the job succeeded
    pub success: bool,
    /// Whether the session is now complete
    pub session_complete: bool,
    /// Error group (if error was aggregated)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_group: Option<ErrorGroup>,
}

// ============================================
// NATIVE MESSAGING CALLBACK WIRING (T-5.5, T-5.6)
// ============================================

/// Type alias for the Native Messaging handler function
pub type NativeMessagingHandler = Box<dyn Fn(NativeMessage) -> NativeResponse + Send + Sync>;

/// Create a Native Messaging handler wired to the result handler
pub fn create_native_messaging_handler(
    result_handler: Arc<ResultHandler>,
    session_id: String,
) -> NativeMessagingHandler {
    Box::new(move |message: NativeMessage| {
        result_handler.handle_native_message(message, &session_id)
    })
}

// ============================================
// ERROR HANDLING INTEGRATION (T-5.7, T-5.8)
// ============================================

/// Classify an error message into a category
pub fn classify_error(error_message: &str) -> String {
    let error_lower = error_message.to_lowercase();

    if error_lower.contains("rate limit") || error_lower.contains("too many requests") {
        "RATE_LIMITED".to_string()
    } else if error_lower.contains("session") && error_lower.contains("expired") {
        "SESSION_EXPIRED".to_string()
    } else if error_lower.contains("group") && error_lower.contains("not found") {
        "GROUP_NOT_FOUND".to_string()
    } else if error_lower.contains("content rejected") || error_lower.contains("blocked") {
        "CONTENT_REJECTED".to_string()
    } else if error_lower.contains("media") || error_lower.contains("upload") {
        "MEDIA_UPLOAD_FAILED".to_string()
    } else if error_lower.contains("permission") || error_lower.contains("denied") {
        "PERMISSION_DENIED".to_string()
    } else if error_lower.contains("network") || error_lower.contains("connection") {
        "NETWORK_ERROR".to_string()
    } else if error_lower.contains("browser") || error_lower.contains("chrome") {
        "BROWSER_ERROR".to_string()
    } else {
        "UNKNOWN_ERROR".to_string()
    }
}

/// Process an error through the aggregation system
pub fn process_posting_error(
    job: &PostJobModel,
    session: &PostSessionModel,
    error_message: &str,
) -> ErrorGroup {
    let category = classify_error(error_message);

    let (group, _is_new) = ErrorAggregator::process_error(
        &category,
        Some(&job.platform),
        Some(&session.account_id),
        error_message,
    );

    group
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_store() -> Arc<InMemoryStore> {
        Arc::new(InMemoryStore::new())
    }

    fn create_test_session(store: &InMemoryStore) -> String {
        let session = PostSessionModel::new(
            "sess_test".to_string(),
            "acct_123".to_string(),
            None,
            3,
            "{}".to_string(),
        );
        store.sessions.create_session(session).unwrap();
        "sess_test".to_string()
    }

    fn create_test_job(store: &InMemoryStore, session_id: &str, job_id: &str) {
        let job = PostJobModel::new(
            job_id.to_string(),
            session_id.to_string(),
            "group_123".to_string(),
            "facebook_groups".to_string(),
            1,
            "Test content".to_string(),
        );
        store.jobs.create_job(job).unwrap();
    }

    // ========================================
    // T-5.1: Test for job result types
    // ========================================

    #[test]
    fn test_post_result_success_creation() {
        let result = PostResult::success(
            "job_123".to_string(),
            "sess_456".to_string(),
            Some("https://facebook.com/post/123".to_string()),
            Some("fb_post_123".to_string()),
            Some(5000),
        );

        assert_eq!(result.job_id, "job_123");
        assert_eq!(result.session_id, "sess_456");
        assert!(result.success);
        assert!(result.post_url.is_some());
        assert!(result.platform_post_id.is_some());
        assert!(result.error.is_none());
    }

    #[test]
    fn test_post_result_failure_creation() {
        let result = PostResult::failure(
            "job_456".to_string(),
            "sess_789".to_string(),
            "Network error".to_string(),
            Some("NETWORK_ERROR".to_string()),
            Some(3000),
        );

        assert_eq!(result.job_id, "job_456");
        assert!(!result.success);
        assert!(result.post_url.is_none());
        assert_eq!(result.error, Some("Network error".to_string()));
        assert_eq!(result.error_category, Some("NETWORK_ERROR".to_string()));
    }

    // ========================================
    // T-5.2: Create JobResult, PostResult structs
    // ========================================

    #[test]
    fn test_job_result_new() {
        let result = JobResult::new("sess_123".to_string(), 5);

        assert_eq!(result.session_id, "sess_123");
        assert_eq!(result.total_jobs, 5);
        assert_eq!(result.successful_jobs, 0);
        assert_eq!(result.failed_jobs, 0);
        assert!(result.results.is_empty());
    }

    #[test]
    fn test_job_result_add_success() {
        let mut result = JobResult::new("sess_123".to_string(), 3);

        result.add_result(PostResult::success(
            "job_1".to_string(),
            "sess_123".to_string(),
            Some("https://fb.com/1".to_string()),
            None,
            None,
        ));

        assert_eq!(result.successful_jobs, 1);
        assert_eq!(result.failed_jobs, 0);
        assert_eq!(result.results.len(), 1);
    }

    #[test]
    fn test_job_result_add_failure() {
        let mut result = JobResult::new("sess_123".to_string(), 3);

        result.add_result(PostResult::failure(
            "job_1".to_string(),
            "sess_123".to_string(),
            "Error".to_string(),
            None,
            None,
        ));

        assert_eq!(result.successful_jobs, 0);
        assert_eq!(result.failed_jobs, 1);
    }

    #[test]
    fn test_job_result_success_rate() {
        let mut result = JobResult::new("sess_123".to_string(), 10);

        // Add 7 successes
        for i in 0..7 {
            result.add_result(PostResult::success(
                format!("job_{}", i),
                "sess_123".to_string(),
                None,
                None,
                None,
            ));
        }

        // Add 3 failures
        for i in 7..10 {
            result.add_result(PostResult::failure(
                format!("job_{}", i),
                "sess_123".to_string(),
                "Error".to_string(),
                None,
                None,
            ));
        }

        assert_eq!(result.success_rate(), 70.0);
    }

    #[test]
    fn test_job_result_is_complete() {
        let mut result = JobResult::new("sess_123".to_string(), 2);

        assert!(!result.is_complete());

        result.add_result(PostResult::success(
            "job_1".to_string(),
            "sess_123".to_string(),
            None,
            None,
            None,
        ));

        assert!(!result.is_complete());

        result.add_result(PostResult::success(
            "job_2".to_string(),
            "sess_123".to_string(),
            None,
            None,
            None,
        ));

        assert!(result.is_complete());
    }

    #[test]
    fn test_job_result_failed_results() {
        let mut result = JobResult::new("sess_123".to_string(), 3);

        result.add_result(PostResult::success(
            "job_1".to_string(),
            "sess_123".to_string(),
            None,
            None,
            None,
        ));
        result.add_result(PostResult::failure(
            "job_2".to_string(),
            "sess_123".to_string(),
            "Error 1".to_string(),
            None,
            None,
        ));
        result.add_result(PostResult::failure(
            "job_3".to_string(),
            "sess_123".to_string(),
            "Error 2".to_string(),
            None,
            None,
        ));

        let failed = result.failed_results();
        assert_eq!(failed.len(), 2);
    }

    // ========================================
    // T-5.3: Test for result processing handler
    // ========================================

    #[test]
    fn test_result_handler_creation() {
        let store = create_test_store();
        let handler = ResultHandler::new(store);

        // Should be able to create handler
        assert!(true);
    }

    // ========================================
    // T-5.4: Implement handle_job_result() with status update
    // ========================================

    #[test]
    fn test_handle_job_result_success() {
        let store = create_test_store();
        let session_id = create_test_session(&store);
        create_test_job(&store, &session_id, "job_123");

        let handler = ResultHandler::new(store.clone());

        let result = PostResult::success(
            "job_123".to_string(),
            session_id.clone(),
            Some("https://facebook.com/post/123".to_string()),
            None,
            Some(5000),
        );

        let outcome = handler.handle_job_result(result).unwrap();

        assert_eq!(outcome.job_id, "job_123");
        assert!(outcome.success);

        // Verify job was updated
        let job = store.jobs.get_job("job_123").unwrap().unwrap();
        assert_eq!(job.status, "success");
        assert!(job.post_url.is_some());
    }

    #[test]
    fn test_handle_job_result_failure() {
        let store = create_test_store();
        let session_id = create_test_store_session(&store);
        create_test_job(&store, &session_id, "job_456");

        let handler = ResultHandler::new(store.clone());

        let result = PostResult::failure(
            "job_456".to_string(),
            session_id.clone(),
            "Network error".to_string(),
            Some("NETWORK_ERROR".to_string()),
            None,
        );

        let outcome = handler.handle_job_result(result).unwrap();

        assert_eq!(outcome.job_id, "job_456");
        assert!(!outcome.success);

        // Verify job was updated
        let job = store.jobs.get_job("job_456").unwrap().unwrap();
        assert_eq!(job.status, "failed");
        assert_eq!(job.error_message, Some("Network error".to_string()));
    }

    #[test]
    fn test_handle_job_result_updates_session_counters() {
        let store = create_test_store();
        let session_id = create_test_store_session(&store);
        create_test_job(&store, &session_id, "job_1");
        create_test_job(&store, &session_id, "job_2");

        let handler = ResultHandler::new(store.clone());

        // First job succeeds
        let result1 =
            PostResult::success("job_1".to_string(), session_id.clone(), None, None, None);
        handler.handle_job_result(result1).unwrap();

        // Check session
        let session = store.sessions.get_session(&session_id).unwrap().unwrap();
        assert_eq!(session.successful_jobs, 1);
        assert_eq!(session.completed_jobs, 1);

        // Second job fails
        let result2 = PostResult::failure(
            "job_2".to_string(),
            session_id.clone(),
            "Error".to_string(),
            None,
            None,
        );
        handler.handle_job_result(result2).unwrap();

        let session = store.sessions.get_session(&session_id).unwrap().unwrap();
        assert_eq!(session.failed_jobs, 1);
        assert_eq!(session.completed_jobs, 2);
    }

    // ========================================
    // T-5.5: Test for Native Messaging callback wiring
    // ========================================

    #[test]
    fn test_create_native_messaging_handler() {
        let store = create_test_store();
        let session_id = create_test_store_session(&store);
        create_test_job(&store, &session_id, "job_nm");

        let handler = ResultHandler::new(store.clone());
        let nm_handler = create_native_messaging_handler(Arc::new(handler), session_id.clone());

        // Should be able to call handler
        // (Actual message handling tested below)
        assert!(true);
    }

    // ========================================
    // T-5.6: Connect Native Messaging to result handler
    // ========================================

    #[test]
    fn test_native_messaging_handler_processes_task_result() {
        let store = create_test_store();
        let session_id = create_test_store_session(&store);
        create_test_job(&store, &session_id, "task_123");

        let handler = ResultHandler::new(store.clone());
        let nm_handler = create_native_messaging_handler(Arc::new(handler), session_id.clone());

        let message = NativeMessage::TaskResult {
            result: TaskResultPayload {
                task_id: "task_123".to_string(),
                success: true,
                post_url: Some("https://fb.com/post/123".to_string()),
                platform_post_id: Some("fb_123".to_string()),
                error: None,
            },
        };

        let response = nm_handler(message);

        match response {
            NativeResponse::Ack { success } => assert!(success),
            _ => panic!("Expected Ack response"),
        }
    }

    #[test]
    fn test_native_messaging_handler_returns_error_for_missing_job() {
        let store = create_test_store();
        let session_id = create_test_store_session(&store);
        // Don't create the job

        let handler = ResultHandler::new(store.clone());
        let nm_handler = create_native_messaging_handler(Arc::new(handler), session_id.clone());

        let message = NativeMessage::TaskResult {
            result: TaskResultPayload {
                task_id: "nonexistent".to_string(),
                success: false,
                error: Some("Failed".to_string()),
                post_url: None,
                platform_post_id: None,
            },
        };

        let response = nm_handler(message);

        match response {
            NativeResponse::Error { error } => assert!(error.contains("not found")),
            _ => panic!("Expected Error response"),
        }
    }

    // ========================================
    // T-5.7: Test for error handling integration
    // ========================================

    #[test]
    fn test_classify_error_rate_limit() {
        assert_eq!(classify_error("Rate limit exceeded"), "RATE_LIMITED");
        assert_eq!(classify_error("Too many requests"), "RATE_LIMITED");
    }

    #[test]
    fn test_classify_error_session_expired() {
        assert_eq!(
            classify_error("Session expired, please login"),
            "SESSION_EXPIRED"
        );
    }

    #[test]
    fn test_classify_error_network() {
        assert_eq!(
            classify_error("Network connection timeout"),
            "NETWORK_ERROR"
        );
        assert_eq!(classify_error("Connection refused"), "NETWORK_ERROR");
    }

    #[test]
    fn test_classify_error_unknown() {
        assert_eq!(classify_error("Something went wrong"), "UNKNOWN_ERROR");
    }

    // ========================================
    // T-5.8: Wire error aggregation to posting flow
    // ========================================

    #[test]
    fn test_handle_job_result_creates_error_group() {
        let store = create_test_store();
        let session_id = create_test_store_session(&store);
        create_test_job(&store, &session_id, "job_err");

        // Clear any existing error groups
        ErrorAggregator::clear_all();

        let handler = ResultHandler::new(store.clone());

        let result = PostResult::failure(
            "job_err".to_string(),
            session_id.clone(),
            "Rate limit exceeded for posting".to_string(),
            Some("RATE_LIMITED".to_string()),
            None,
        );

        let outcome = handler.handle_job_result(result).unwrap();

        // Should have an error group
        assert!(outcome.error_group.is_some());

        let group = outcome.error_group.unwrap();
        assert_eq!(group.error_type, "RATE_LIMITED");
    }

    #[test]
    fn test_process_posting_error_aggregates() {
        ErrorAggregator::clear_all();

        let job = PostJobModel::new(
            "job_test".to_string(),
            "sess_test".to_string(),
            "group_123".to_string(),
            "facebook_groups".to_string(),
            1,
            "Test".to_string(),
        );

        let session = PostSessionModel::new(
            "sess_test".to_string(),
            "acct_123".to_string(),
            None,
            1,
            "{}".to_string(),
        );

        let group = process_posting_error(&job, &session, "Network timeout");

        assert!(!group.id.is_empty());
        assert_eq!(group.error_type, "NETWORK_ERROR");
    }

    #[test]
    fn test_error_aggregation_deduplicates() {
        ErrorAggregator::clear_all();

        let job = PostJobModel::new(
            "job_test".to_string(),
            "sess_test".to_string(),
            "group_123".to_string(),
            "facebook_groups".to_string(),
            1,
            "Test".to_string(),
        );

        let session = PostSessionModel::new(
            "sess_test".to_string(),
            "acct_123".to_string(),
            None,
            1,
            "{}".to_string(),
        );

        // Process same error twice
        let group1 = process_posting_error(&job, &session, "Rate limit exceeded");
        let group2 = process_posting_error(&job, &session, "Rate limit exceeded");

        // Should be same group (deduplicated)
        assert_eq!(group1.id, group2.id);
        assert_eq!(group2.count, 2);
    }

    // ========================================
    // Helper functions for tests
    // ========================================

    fn create_test_store_session(store: &InMemoryStore) -> String {
        let session = PostSessionModel::new(
            "sess_test".to_string(),
            "acct_123".to_string(),
            None,
            2,
            "{}".to_string(),
        );
        store.sessions.create_session(session).unwrap();
        "sess_test".to_string()
    }
}
