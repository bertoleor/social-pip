//! Posting commands module - Session and job management for multi-group posting
//!
//! This module provides Tauri commands for posting sessions following the bounded context pattern.
//! Integrates with AntiBanEngine for safe execution.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use chrono::Utc;

use crate::anti_ban::{AntiBanEngine, AntiBanConfig, get_platform_config};

// ============================================
// DOMAIN TYPES
// ============================================

/// PostJobStatus enum matching TypeScript types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PostJobStatus {
    Pending,
    Processing,
    Success,
    Failed,
    Skipped,
}

impl PostJobStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            PostJobStatus::Pending => "pending",
            PostJobStatus::Processing => "processing",
            PostJobStatus::Success => "success",
            PostJobStatus::Failed => "failed",
            PostJobStatus::Skipped => "skipped",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "pending" => Some(PostJobStatus::Pending),
            "processing" => Some(PostJobStatus::Processing),
            "success" => Some(PostJobStatus::Success),
            "failed" => Some(PostJobStatus::Failed),
            "skipped" => Some(PostJobStatus::Skipped),
            _ => None,
        }
    }
}

/// SessionStatus enum matching TypeScript types
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

/// PostJob entity - individual post to a single group
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostJob {
    pub id: String,
    pub session_id: String,
    pub group_id: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_url: Option<String>,
    pub status: PostJobStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    pub retry_count: u32,
    pub max_retries: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_retry_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// PostSession entity - a posting session with multiple jobs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostSession {
    pub id: String,
    pub status: SessionStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,
    pub account_id: String,
    pub total_jobs: u32,
    pub completed_jobs: u32,
    pub successful_jobs: u32,
    pub failed_jobs: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    pub config_snapshot: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Input for starting a new posting session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartSessionInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,
    pub account_id: String,
    pub group_ids: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

/// Result of a session complete event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionCompleteResult {
    pub session_id: String,
    pub status: SessionStatus,
    pub total_jobs: u32,
    pub success_count: u32,
    pub failed_count: u32,
    pub skipped_count: u32,
}

// ============================================
// IN-MEMORY STORAGE
// ============================================

static SESSIONS: Lazy<Mutex<HashMap<String, PostSession>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

static JOBS: Lazy<Mutex<HashMap<String, PostJob>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

static ANTI_BAN_ENGINES: Lazy<Mutex<HashMap<String, AntiBanEngine>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

// ============================================
// HELPER FUNCTIONS
// ============================================

fn generate_session_id() -> String {
    format!("sess_{}", Utc::now().timestamp_millis())
}

fn generate_job_id() -> String {
    format!("job_{}", Utc::now().timestamp_millis())
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

// ============================================
// TAURI COMMANDS
// ============================================

/// Start a new posting session
#[tauri::command]
pub async fn start_posting_session(config: StartSessionInput) -> Result<PostSession, String> {
    // Validate account_id
    if config.account_id.trim().is_empty() {
        return Err("Account ID is required".to_string());
    }

    // Validate group_ids
    if config.group_ids.is_empty() {
        return Err("At least one group ID is required".to_string());
    }

    let now = now_iso();
    let session_id = generate_session_id();
    let total_jobs = config.group_ids.len() as u32;

    // Create anti-ban engine for this session
    let anti_ban_config = get_platform_config("facebook_groups");
    let anti_ban_engine = AntiBanEngine::new(anti_ban_config);
    
    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.insert(session_id.clone(), anti_ban_engine);
    }

    // Create session
    let session = PostSession {
        id: session_id.clone(),
        status: SessionStatus::Pending,
        template_id: config.template_id,
        account_id: config.account_id.clone(),
        total_jobs,
        completed_jobs: 0,
        successful_jobs: 0,
        failed_jobs: 0,
        started_at: None,
        completed_at: None,
        cancelled_at: None,
        last_error: None,
        error_category: None,
        config_snapshot: serde_json::to_string(&config).unwrap_or_default(),
        created_at: now.clone(),
        updated_at: now,
    };

    // Create jobs for each group
    {
        let mut jobs = JOBS.lock().map_err(|e| e.to_string())?;
        
        for group_id in config.group_ids {
            let job_id = generate_job_id();
            let job = PostJob {
                id: job_id.clone(),
                session_id: session_id.clone(),
                group_id,
                content: config.content.clone().unwrap_or_default(),
                post_url: None,
                status: PostJobStatus::Pending,
                error_message: None,
                error_category: None,
                started_at: None,
                completed_at: None,
                duration_ms: None,
                retry_count: 0,
                max_retries: 3,
                next_retry_at: None,
                created_at: now_iso(),
                updated_at: now_iso(),
            };
            jobs.insert(job_id, job);
        }
    }

    // Store session
    {
        let mut sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
        sessions.insert(session_id.clone(), session.clone());
    }

    Ok(session)
}

/// Cancel a running posting session
#[tauri::command]
pub async fn cancel_posting_session(session_id: String) -> Result<(), String> {
    let mut sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
    
    let session = sessions.get_mut(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;

    if session.status == SessionStatus::Completed || session.status == SessionStatus::Cancelled {
        return Err(format!("Cannot cancel session in {} state", session.status.as_str()));
    }

    session.status = SessionStatus::Cancelled;
    session.cancelled_at = Some(now_iso());
    session.updated_at = now_iso();

    // Cancel all pending jobs
    let mut jobs = JOBS.lock().map_err(|e| e.to_string())?;
    for job in jobs.values_mut() {
        if job.session_id == session_id && job.status == PostJobStatus::Pending {
            job.status = PostJobStatus::Skipped;
            job.error_message = Some("Session cancelled".to_string());
            job.error_category = Some(ErrorCategory::Cancelled.as_str().to_string());
            job.updated_at = now_iso();
        }
    }

    // Remove anti-ban engine
    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.remove(&session_id);
    }

    Ok(())
}

/// Get posting session status with all jobs
#[tauri::command]
pub async fn get_posting_session_status(session_id: String) -> Result<(PostSession, Vec<PostJob>), String> {
    let sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
    let session = sessions.get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?
        .clone();

    let jobs = JOBS.lock().map_err(|e| e.to_string())?;
    let session_jobs: Vec<PostJob> = jobs.values()
        .filter(|j| j.session_id == session_id)
        .cloned()
        .collect();

    Ok((session, session_jobs))
}

/// Update job status (called by extension after posting)
#[tauri::command]
pub async fn update_post_job_status(
    job_id: String,
    status: String,
    result: Option<UpdateJobResult>,
) -> Result<PostJob, String> {
    let job_status = PostJobStatus::from_str(&status)
        .ok_or_else(|| format!("Invalid job status: {}", status))?;

    let mut jobs = JOBS.lock().map_err(|e| e.to_string())?;
    let job = jobs.get_mut(&job_id)
        .ok_or_else(|| format!("Job not found: {}", job_id))?;

    job.status = job_status.clone();
    job.updated_at = now_iso();

    if let Some(ref res) = result {
        if let Some(ref url) = res.post_url {
            job.post_url = Some(url.clone());
        }
        if let Some(ref error) = res.error {
            job.error_message = Some(error.clone());
        }
        if let Some(ref category) = res.error_category {
            job.error_category = Some(category.clone());
        }
        if let Some(duration) = res.duration_ms {
            job.duration_ms = Some(duration);
        }
    }

    // Mark timing based on status
    match job_status {
        PostJobStatus::Processing => {
            job.started_at = Some(now_iso());
        }
        PostJobStatus::Success | PostJobStatus::Failed | PostJobStatus::Skipped => {
            job.completed_at = Some(now_iso());
        }
        PostJobStatus::Pending => {}
    }

    // Update session counters
    {
        let mut sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
        if let Some(session) = sessions.get_mut(&job.session_id) {
            match job_status {
                PostJobStatus::Success => {
                    session.successful_jobs += 1;
                    session.completed_jobs += 1;
                }
                PostJobStatus::Failed => {
                    session.failed_jobs += 1;
                    session.completed_jobs += 1;
                }
                PostJobStatus::Skipped => {
                    session.completed_jobs += 1;
                }
                _ => {}
            }
            session.updated_at = now_iso();

            // Check if all jobs complete
            if session.completed_jobs >= session.total_jobs {
                session.status = SessionStatus::Completed;
                session.completed_at = Some(now_iso());
            }
        }
    }

    Ok(job.clone())
}

/// Result payload for job update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateJobResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
}

/// Get anti-ban stats for a session
#[tauri::command]
pub async fn get_session_anti_ban_stats(session_id: String) -> Result<crate::anti_ban::AntiBanStats, String> {
    let engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines.get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    Ok(engine.get_stats())
}

/// Get next delay for posting (using anti-ban engine)
#[tauri::command]
pub async fn get_next_posting_delay(session_id: String) -> Result<u64, String> {
    let engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines.get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    Ok(engine.next_action_delay_ms())
}

/// Check if posting is allowed (rate limit check)
#[tauri::command]
pub async fn can_post_to_group(session_id: String, action_type: String) -> Result<bool, String> {
    let engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines.get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    Ok(engine.can_execute(&action_type).is_ok())
}

/// Record an action for anti-ban tracking
#[tauri::command]
pub async fn record_posting_action(
    session_id: String,
    action_type: String,
    success: bool,
    delay_used_ms: u64,
) -> Result<(), String> {
    let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines.get_mut(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    engine.record_action(action_type, success, delay_used_ms);
    Ok(())
}

/// List all sessions (for debugging/admin)
#[tauri::command]
pub async fn list_posting_sessions() -> Result<Vec<PostSession>, String> {
    let sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
    let mut result: Vec<PostSession> = sessions.values().cloned().collect();
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(result)
}

/// Delete a completed session (cleanup)
#[tauri::command]
pub async fn delete_posting_session(session_id: String) -> Result<(), String> {
    // Remove session
    {
        let mut sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
        sessions.remove(&session_id);
    }
    
    // Remove all jobs
    {
        let mut jobs = JOBS.lock().map_err(|e| e.to_string())?;
        jobs.retain(|_, j| j.session_id != session_id);
    }
    
    // Remove anti-ban engine
    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.remove(&session_id);
    }
    
    Ok(())
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_storage() {
        let mut sessions = SESSIONS.lock().unwrap();
        sessions.clear();
        let mut jobs = JOBS.lock().unwrap();
        jobs.clear();
        let mut engines = ANTI_BAN_ENGINES.lock().unwrap();
        engines.clear();
    }

    #[test]
    fn test_start_posting_session_creates_session_and_jobs() {
        reset_storage();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(start_posting_session(StartSessionInput {
            account_id: "acct_123".to_string(),
            template_id: Some("tmpl_456".to_string()),
            group_ids: vec!["group_1".to_string(), "group_2".to_string()],
            content: Some("Test content".to_string()),
        }));

        assert!(result.is_ok());
        let session = result.unwrap();
        
        assert!(session.id.starts_with("sess_"));
        assert_eq!(session.status, SessionStatus::Pending);
        assert_eq!(session.total_jobs, 2);
        assert_eq!(session.account_id, "acct_123");
    }

    #[test]
    fn test_start_posting_session_validates_account_id() {
        reset_storage();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(start_posting_session(StartSessionInput {
            account_id: "".to_string(),
            group_ids: vec!["group_1".to_string()],
            ..Default::default()
        }));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Account ID is required"));
    }

    #[test]
    fn test_start_posting_session_validates_group_ids() {
        reset_storage();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(start_posting_session(StartSessionInput {
            account_id: "acct_123".to_string(),
            group_ids: vec![],
            ..Default::default()
        }));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("at least one group"));
    }

    #[test]
    fn test_cancel_posting_session() {
        reset_storage();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        // Create session
        let session = rt.block_on(start_posting_session(StartSessionInput {
            account_id: "acct_123".to_string(),
            group_ids: vec!["group_1".to_string()],
            ..Default::default()
        })).unwrap();

        // Cancel it
        let result = rt.block_on(cancel_posting_session(session.id.clone()));
        assert!(result.is_ok());

        // Verify status
        let (updated, _) = rt.block_on(get_posting_session_status(session.id)).unwrap();
        assert_eq!(updated.status, SessionStatus::Cancelled);
    }

    #[test]
    fn test_update_post_job_status_success() {
        reset_storage();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        // Create session
        let session = rt.block_on(start_posting_session(StartSessionInput {
            account_id: "acct_123".to_string(),
            group_ids: vec!["group_1".to_string()],
            ..Default::default()
        })).unwrap();

        // Get the job
        let (_, jobs) = rt.block_on(get_posting_session_status(session.id.clone())).unwrap();
        let job_id = jobs[0].id.clone();

        // Update to success
        let result = rt.block_on(update_post_job_status(
            job_id.clone(),
            "success".to_string(),
            Some(UpdateJobResult {
                post_url: Some("https://facebook.com/post/123".to_string()),
                duration_ms: Some(5000),
                ..Default::default()
            }),
        ));

        assert!(result.is_ok());
        let job = result.unwrap();
        assert_eq!(job.status, PostJobStatus::Success);
        assert!(job.post_url.is_some());
    }

    #[test]
    fn test_error_category_retryable() {
        assert!(ErrorCategory::RateLimited.is_retryable());
        assert!(ErrorCategory::NetworkError.is_retryable());
        assert!(!ErrorCategory::ContentRejected.is_retryable());
        assert!(!ErrorCategory::PermissionDenied.is_retryable());
    }
}

impl Default for StartSessionInput {
    fn default() -> Self {
        Self {
            template_id: None,
            account_id: String::new(),
            group_ids: vec![],
            content: None,
        }
    }
}
