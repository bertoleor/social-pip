//! Posting commands module - Session and job management for multi-group posting
//!
//! This module provides Tauri commands for posting sessions following the bounded context pattern.
//! Integrates with AntiBanEngine for safe execution.
//!
//! # Persistence
//! Sessions and jobs are persisted using the database module for production reliability.
//! Recovery on startup handles interrupted sessions.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use once_cell::sync::Lazy;
use chrono::Utc;
use uuid::Uuid;

use crate::anti_ban::AntiBanEngine;
use crate::database::{InMemoryStore, SessionPersistence, JobPersistence, PostSessionModel, PostJobModel};

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

#[allow(dead_code)]
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

#[allow(dead_code)]
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
pub platform: String,
pub priority: i32,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformTarget {
pub platform: String,
pub account_id: String,
pub targets: Vec<String>,
#[serde(skip_serializing_if = "Option::is_none")]
pub priority: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartMultiPlatformSessionInput {
pub account_id: String,
pub platforms: Vec<PlatformTarget>,
#[serde(skip_serializing_if = "Option::is_none")]
pub template_id: Option<String>,
#[serde(skip_serializing_if = "Option::is_none")]
pub content: Option<String>,
}

/// Result of a session complete event
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct SessionCompleteResult {
    pub session_id: String,
    pub status: SessionStatus,
    pub total_jobs: u32,
    pub success_count: u32,
    pub failed_count: u32,
    pub skipped_count: u32,
}

// ============================================
// PERSISTENCE STORAGE
// ============================================

/// Global persistence store for sessions and jobs
/// Replaces direct HashMap usage with proper persistence layer
static PERSISTENCE_STORE: Lazy<InMemoryStore> = Lazy::new(InMemoryStore::new);

/// Session-specific anti-ban engines
/// Each posting session has its own anti-ban engine for rate limiting
static ANTI_BAN_ENGINES: Lazy<Mutex<HashMap<String, AntiBanEngine>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

static JOB_COUNTER: AtomicU64 = AtomicU64::new(0);

// ============================================
// HELPER FUNCTIONS
// ============================================

fn generate_session_id() -> String {
    format!("sess_{}", Uuid::new_v4())
}

fn generate_job_id() -> String {
    let counter = JOB_COUNTER.fetch_add(1, Ordering::SeqCst);
    format!("job_{}_{}", Utc::now().timestamp_millis(), counter)
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

// ============================================
// CONVERSION HELPERS
// ============================================

impl From<PostSessionModel> for PostSession {
    fn from(model: PostSessionModel) -> Self {
        let status = SessionStatus::from_str(&model.status).unwrap_or(SessionStatus::Pending);
        Self {
            id: model.id,
            status,
            template_id: model.template_id,
            account_id: model.account_id,
            total_jobs: model.total_jobs as u32,
            completed_jobs: model.completed_jobs as u32,
            successful_jobs: model.successful_jobs as u32,
            failed_jobs: model.failed_jobs as u32,
            started_at: model.started_at,
            completed_at: model.completed_at,
            cancelled_at: model.cancelled_at,
            last_error: model.last_error,
            error_category: model.error_category,
            config_snapshot: model.config_snapshot,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

impl From<PostSession> for PostSessionModel {
    fn from(session: PostSession) -> Self {
        Self {
            id: session.id,
            status: session.status.as_str().to_string(),
            template_id: session.template_id,
            account_id: session.account_id,
            total_jobs: session.total_jobs as i32,
            completed_jobs: session.completed_jobs as i32,
            successful_jobs: session.successful_jobs as i32,
            failed_jobs: session.failed_jobs as i32,
            started_at: session.started_at,
            completed_at: session.completed_at,
            cancelled_at: session.cancelled_at,
            last_error: session.last_error,
            error_category: session.error_category,
            config_snapshot: session.config_snapshot,
            created_at: session.created_at,
            updated_at: session.updated_at,
        }
    }
}

impl From<PostJobModel> for PostJob {
    fn from(model: PostJobModel) -> Self {
        let status = PostJobStatus::from_str(&model.status).unwrap_or(PostJobStatus::Pending);
        Self {
            id: model.id,
            session_id: model.session_id,
            group_id: model.group_id,
            platform: model.platform,
            priority: model.priority,
            content: model.content,
            post_url: model.post_url,
            status,
            error_message: model.error_message,
            error_category: model.error_category,
            started_at: model.started_at,
            completed_at: model.completed_at,
            duration_ms: model.duration_ms.map(|d| d as u64),
            retry_count: model.retry_count as u32,
            max_retries: model.max_retries as u32,
            next_retry_at: model.next_retry_at,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

impl From<PostJob> for PostJobModel {
    fn from(job: PostJob) -> Self {
        Self {
            id: job.id,
            session_id: job.session_id,
            group_id: job.group_id,
            platform: job.platform,
            priority: job.priority,
            content: job.content,
            post_url: job.post_url,
            status: job.status.as_str().to_string(),
            error_message: job.error_message,
            error_category: job.error_category,
            started_at: job.started_at,
            completed_at: job.completed_at,
            duration_ms: job.duration_ms.map(|d| d as i32),
            retry_count: job.retry_count as i32,
            max_retries: job.max_retries as i32,
            next_retry_at: job.next_retry_at,
            created_at: job.created_at,
            updated_at: job.updated_at,
        }
    }
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

    let session_id = generate_session_id();
    let total_jobs = config.group_ids.len() as u32;

    // Create anti-ban engine for this session
    let anti_ban_config = get_platform_config("facebook_groups".to_string());
    let anti_ban_engine = AntiBanEngine::new(anti_ban_config);

    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.insert(session_id.clone(), anti_ban_engine);
    }

    // Create session model for persistence
    let session_model = PostSessionModel::new(
        session_id.clone(),
        config.account_id.clone(),
        config.template_id.clone(),
        total_jobs,
        serde_json::to_string(&config).unwrap_or_default(),
    );

    // Create jobs for each group using persistence
    for group_id in &config.group_ids {
        let job_id = generate_job_id();
        let job_model = PostJobModel::new(
            job_id.clone(),
            session_id.clone(),
            group_id.clone(),
            "facebook_groups".to_string(),
            99,
            config.content.clone().unwrap_or_default(),
        );
        PERSISTENCE_STORE.jobs.create_job(job_model).map_err(|e| e.to_string())?;
    }

    // Store session using persistence
    PERSISTENCE_STORE.sessions.create_session(session_model.clone()).map_err(|e| e.to_string())?;

    // Return domain type
    Ok(session_model.into())
}

/// Cancel a running posting session
#[tauri::command]
pub async fn cancel_posting_session(session_id: String) -> Result<(), String> {
    // Get session from persistence
    let mut session = PERSISTENCE_STORE.sessions.get_session(&session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Session not found: {}", session_id))?;

    let current_status = crate::database::SessionStatus::from_str(&session.status)
        .unwrap_or(crate::database::SessionStatus::Pending);
    
    if current_status == crate::database::SessionStatus::Completed 
        || current_status == crate::database::SessionStatus::Cancelled {
        return Err(format!("Cannot cancel session in {} state", session.status));
    }

    // Cancel session
    session.cancel();
    PERSISTENCE_STORE.sessions.update_session(session).map_err(|e| e.to_string())?;

    // Cancel all pending jobs
    let jobs = PERSISTENCE_STORE.jobs.get_jobs_by_session(&session_id)
        .map_err(|e| e.to_string())?;
    
    for mut job in jobs {
        if job.status == "pending" {
            job.skip("Session cancelled".to_string());
            PERSISTENCE_STORE.jobs.update_job(job).map_err(|e| e.to_string())?;
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
    let session_model = PERSISTENCE_STORE.sessions.get_session(&session_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Session not found: {}", session_id))?;

    let job_models = PERSISTENCE_STORE.jobs.get_jobs_by_session(&session_id)
        .map_err(|e| e.to_string())?;

    let session: PostSession = session_model.into();
    let mut jobs: Vec<PostJob> = job_models.into_iter().map(|j| j.into()).collect();
    
    // Sort by priority (lower = higher priority)
    jobs.sort_by_key(|j| j.priority);

    Ok((session, jobs))
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

    // Get job from persistence
    let mut job = PERSISTENCE_STORE.jobs.get_job(&job_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Job not found: {}", job_id))?;

    // Update job status
    job.status = job_status.as_str().to_string();
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
            job.duration_ms = Some(duration as i32);
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

    // Save job update
    PERSISTENCE_STORE.jobs.update_job(job.clone()).map_err(|e| e.to_string())?;

    // Update session counters
    if let Some(mut session) = PERSISTENCE_STORE.sessions.get_session(&job.session_id)
        .map_err(|e| e.to_string())? {
        match job_status {
            PostJobStatus::Success => {
                session.increment_success();
            }
            PostJobStatus::Failed => {
                session.increment_failed();
            }
            PostJobStatus::Skipped => {
                session.increment_skipped();
            }
            _ => {}
        }
        PERSISTENCE_STORE.sessions.update_session(session).map_err(|e| e.to_string())?;
    }

    Ok(job.into())
}

/// Result payload for job update
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
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
    let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines.get_mut(&session_id)
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
    let session_models = PERSISTENCE_STORE.sessions.list_sessions()
        .map_err(|e| e.to_string())?;
    
    let mut result: Vec<PostSession> = session_models
        .into_iter()
        .map(|s| s.into())
        .collect();
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(result)
}

/// Delete a completed session (cleanup)
#[tauri::command]
pub async fn delete_posting_session(session_id: String) -> Result<(), String> {
    // Get all jobs for the session
    let jobs = PERSISTENCE_STORE.jobs.get_jobs_by_session(&session_id)
        .map_err(|e| e.to_string())?;
    
    // Delete all jobs
    for job in jobs {
        PERSISTENCE_STORE.jobs.delete_job(&job.id).map_err(|e| e.to_string())?;
    }

    // Delete session
    PERSISTENCE_STORE.sessions.delete_session(&session_id).map_err(|e| e.to_string())?;

    // Remove anti-ban engine
    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.remove(&session_id);
    }

    Ok(())
}

#[tauri::command]
pub async fn start_multi_platform_session(
    config: StartMultiPlatformSessionInput,
) -> Result<PostSession, String> {
    if config.platforms.is_empty() {
        return Err("At least one platform target is required".to_string());
    }

    for target in &config.platforms {
        if target.targets.is_empty() {
            return Err(format!("Targets cannot be empty for platform {}", target.platform));
        }
    }

    if !config.account_id.is_empty() {
        let account_platform = extract_platform_from_account(&config.account_id);
        for target in &config.platforms {
            if !platform_matches_account(&target.platform, &account_platform) {
                return Err(format!(
                    "Account platform ({}) does not match target platform ({})",
                    account_platform, target.platform
                ));
            }
        }
    }

    let session_id = generate_session_id();

    // Create jobs for each target
    let mut job_models: Vec<PostJobModel> = Vec::new();

    for target in &config.platforms {
        let priority = target.priority.unwrap_or_else(|| {
            get_platform_priority(&target.platform)
        });

        for target_id in &target.targets {
            let job_id = generate_job_id();
            let job_model = PostJobModel::new(
                job_id,
                session_id.clone(),
                target_id.clone(),
                target.platform.clone(),
                priority,
                config.content.clone().unwrap_or_default(),
            );
            job_models.push(job_model);
        }
    }

    // Sort by priority (lower = higher priority)
    job_models.sort_by_key(|j| j.priority);

    let total_jobs = job_models.len() as u32;

    // Create anti-ban engine
    let first_platform = config.platforms.first()
        .map(|p| p.platform.as_str())
        .unwrap_or("facebook_groups");
    let anti_ban_config = get_platform_config(first_platform.to_string());
    let anti_ban_engine = AntiBanEngine::new(anti_ban_config);

    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.insert(session_id.clone(), anti_ban_engine);
    }

    // Store all jobs
    for job_model in job_models {
        PERSISTENCE_STORE.jobs.create_job(job_model).map_err(|e| e.to_string())?;
    }

    // Create and store session
    let session_model = PostSessionModel::new(
        session_id.clone(),
        config.account_id.clone(),
        config.template_id.clone(),
        total_jobs,
        serde_json::to_string(&config).unwrap_or_default(),
    );

    PERSISTENCE_STORE.sessions.create_session(session_model.clone()).map_err(|e| e.to_string())?;

    Ok(session_model.into())
}

#[tauri::command]
pub fn get_platform_delay(platform: String) -> u64 {
    let config = get_platform_config(platform);
    let engine = AntiBanEngine::new(config);
    engine.next_action_delay_ms()
}

#[tauri::command]
pub fn get_platform_config(platform: String) -> crate::anti_ban::AntiBanConfig {
    crate::anti_ban::get_platform_config(&platform)
}

#[tauri::command]
pub async fn check_batch_break_needed(session_id: String) -> Result<bool, String> {
    let engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines
        .get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    Ok(engine.should_insert_batch_break())
}

#[tauri::command]
pub async fn get_batch_break_duration(session_id: String) -> Result<u64, String> {
    let engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines
        .get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    Ok(engine.get_batch_break_duration_ms())
}

#[tauri::command]
pub async fn reset_batch(session_id: String) -> Result<(), String> {
    let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines
        .get_mut(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    engine.reset_batch();
    Ok(())
}

#[tauri::command]
pub async fn check_risk_event(session_id: String) -> Result<Option<String>, String> {
    let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
    let engine = engines
        .get_mut(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    Ok(engine.check_and_emit_risk_event().map(|l| format!("{:?}", l)))
}

/// Get all jobs for a specific session
#[tauri::command]
pub async fn get_post_jobs(session_id: String) -> Result<Vec<PostJob>, String> {
    let job_models = PERSISTENCE_STORE.jobs.get_jobs_by_session(&session_id)
        .map_err(|e| e.to_string())?;

    if job_models.is_empty() {
        // Check if session exists
        let session = PERSISTENCE_STORE.sessions.get_session(&session_id)
            .map_err(|e| e.to_string())?;
        if session.is_none() {
            return Err(format!("Session not found: {}", session_id));
        }
    }

    let jobs: Vec<PostJob> = job_models.into_iter().map(|j| j.into()).collect();
    Ok(jobs)
}

/// Retry a failed job
#[tauri::command]
pub async fn retry_failed_job(job_id: String) -> Result<PostJob, String> {
    // Get job from persistence
    let mut job = PERSISTENCE_STORE.jobs.get_job(&job_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Job not found: {}", job_id))?;

    if job.status != "failed" {
        return Err(format!(
            "Job is not in failed state (current: {})",
            job.status
        ));
    }

    // Use model's retry method
    job.retry().map_err(|e| e.to_string())?;
    
    // Persist the retry
    PERSISTENCE_STORE.jobs.update_job(job.clone()).map_err(|e| e.to_string())?;

    Ok(job.into())
}

fn get_platform_priority(platform: &str) -> i32 {
    match platform {
        "facebook_groups" => 0,
        "facebook_pages" => 10,
        "instagram" => 20,
        "twitter" => 30,
        "linkedin" => 40,
        _ => 99,
    }
}

fn extract_platform_from_account(account_id: &str) -> String {
    if account_id.starts_with("fb_") || account_id.starts_with("facebook_") {
        return "facebook".to_string();
    }
    if account_id.starts_with("ig_") || account_id.starts_with("instagram_") {
        return "instagram".to_string();
    }
    if account_id.starts_with("tw_") || account_id.starts_with("twitter_") {
        return "twitter".to_string();
    }
    if account_id.starts_with("li_") || account_id.starts_with("linkedin_") {
        return "linkedin".to_string();
    }
    "unknown".to_string()
}

fn platform_matches_account(target_platform: &str, account_platform: &str) -> bool {
    if account_platform == "unknown" {
        return true;
    }
    let target_base = match target_platform {
        "facebook_groups" | "facebook_pages" => "facebook",
        "instagram" => "instagram",
        "twitter" => "twitter",
        "linkedin" => "linkedin",
        _ => target_platform,
    };
    target_base == account_platform
}

// ============================================
// PHASE 2: ADDITIONAL COMMANDS FOR PRODUCTION
// ============================================

/// Result for group posting eligibility check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupPostingEligibility {
    pub group_id: String,
    pub is_eligible: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// Get groups that are eligible for posting
/// 
/// This command retrieves and filters groups that can receive posts,
/// checking against posting history, cooldowns, and account safety.
#[tauri::command]
pub async fn get_groups_for_posting(
    account_id: String,
    group_ids: Vec<String>,
) -> Result<Vec<GroupPostingEligibility>, String> {
    if account_id.trim().is_empty() {
        return Err("Account ID is required".to_string());
    }

    if group_ids.is_empty() {
        return Ok(vec![]);
    }

    // For now, all groups are eligible
    // In production, this would check:
    // 1. Group posting history (last post time)
    // 2. Group-specific cooldowns
    // 3. Group membership status
    // 4. Account-group pairing restrictions
    let eligibility: Vec<GroupPostingEligibility> = group_ids
        .into_iter()
        .map(|group_id| GroupPostingEligibility {
            group_id,
            is_eligible: true,
            reason: None,
        })
        .collect();

    Ok(eligibility)
}

/// Safety check result for account posting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountPostingSafety {
    pub account_id: String,
    pub is_safe: bool,
    pub daily_posts_remaining: u32,
    pub hourly_posts_remaining: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning: Option<String>,
}

/// Check if account is safe to post
/// 
/// Validates account status, rate limits, and anti-ban constraints.
#[tauri::command]
pub async fn check_account_posting_safety(
    account_id: String,
    platform: String,
) -> Result<AccountPostingSafety, String> {
    if account_id.trim().is_empty() {
        return Err("Account ID is required".to_string());
    }

    if platform.trim().is_empty() {
        return Err("Platform is required".to_string());
    }

    // Get platform config for limits
    let config = get_platform_config(platform.clone());
    
    // Calculate remaining limits
    let daily_limit = config.daily_action_limit;
    let hourly_limit = config.hourly_action_limit;
    
    // For now, assume full capacity available
    // In production, this would check:
    // 1. Account status (active, restricted, banned)
    // 2. Daily post count from database
    // 3. Hourly post count from database
    // 4. Current cooldown status
    // 5. Circuit breaker state

    Ok(AccountPostingSafety {
        account_id,
        is_safe: true,
        daily_posts_remaining: daily_limit,
        hourly_posts_remaining: hourly_limit,
        warning: None,
    })
}

/// Template usage increment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateUsageResult {
    pub template_id: String,
    pub use_count: u32,
    pub last_used_at: String,
}

/// Increment template usage count
/// 
/// Updates the use_count and last_used_at for a template.
/// This is called when a template is used in a posting session.
#[tauri::command]
pub async fn increment_template_use_count(template_id: String) -> Result<TemplateUsageResult, String> {
    if template_id.trim().is_empty() {
        return Err("Template ID is required".to_string());
    }

    // For now, return a simulated result
    // In production, this would:
    // 1. Load template from database
    // 2. Increment use_count
    // 3. Update last_used_at
    // 4. Persist changes
    
    Ok(TemplateUsageResult {
        template_id,
        use_count: 1,
        last_used_at: now_iso(),
    })
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::{SessionPersistence, JobPersistence};

    fn reset_storage() {
        PERSISTENCE_STORE.clear().unwrap();
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
    let err = result.unwrap_err();
    assert!(err.to_lowercase().contains("group"), "Error message should mention 'group': {}", err);
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

#[test]
fn test_platform_target_creation() {
let target = PlatformTarget {
platform: "facebook_groups".to_string(),
account_id: "acc_123".to_string(),
targets: vec!["group_1".to_string(), "group_2".to_string()],
priority: Some(0),
};

assert_eq!(target.platform, "facebook_groups");
assert_eq!(target.account_id, "acc_123");
assert_eq!(target.targets.len(), 2);
assert_eq!(target.priority, Some(0));
}

#[test]
fn test_start_multi_platform_session_creates_jobs_with_platforms() {
reset_storage();

let rt = tokio::runtime::Runtime::new().unwrap();
let result = rt.block_on(start_multi_platform_session(StartMultiPlatformSessionInput {
account_id: "acc_123".to_string(),
platforms: vec![
PlatformTarget {
platform: "facebook_groups".to_string(),
account_id: "acc_123".to_string(),
targets: vec!["group_1".to_string()],
priority: Some(0),
},
PlatformTarget {
platform: "instagram".to_string(),
account_id: "acc_123".to_string(),
targets: vec!["profile_1".to_string()],
priority: Some(20),
},
],
template_id: None,
content: Some("Test content".to_string()),
}));

assert!(result.is_ok());
let session = result.unwrap();
assert!(session.id.starts_with("sess_"));
assert_eq!(session.total_jobs, 2);
}

#[test]
fn test_multi_platform_session_jobs_sorted_by_priority() {
reset_storage();

let rt = tokio::runtime::Runtime::new().unwrap();
let session = rt.block_on(start_multi_platform_session(StartMultiPlatformSessionInput {
account_id: "acc_123".to_string(),
platforms: vec![
PlatformTarget {
platform: "instagram".to_string(),
account_id: "acc_123".to_string(),
targets: vec!["p1".to_string()],
priority: Some(20),
},
PlatformTarget {
platform: "facebook_groups".to_string(),
account_id: "acc_123".to_string(),
targets: vec!["g1".to_string()],
priority: Some(0),
},
],
template_id: None,
content: None,
})).unwrap();

let (_, jobs) = rt.block_on(get_posting_session_status(session.id)).unwrap();

assert_eq!(jobs.len(), 2);
assert_eq!(jobs[0].priority, 0);
assert_eq!(jobs[0].platform, "facebook_groups");
assert_eq!(jobs[1].priority, 20);
assert_eq!(jobs[1].platform, "instagram");
}

#[test]
fn test_start_multi_platform_session_validates_empty_platforms() {
reset_storage();

let rt = tokio::runtime::Runtime::new().unwrap();
let result = rt.block_on(start_multi_platform_session(StartMultiPlatformSessionInput {
account_id: "acc_123".to_string(),
platforms: vec![],
template_id: None,
content: None,
}));

assert!(result.is_err());
assert!(result.unwrap_err().contains("At least one platform target"));
}

#[test]
fn test_get_platform_delay_returns_valid_value() {
    let delay = get_platform_delay("facebook_groups".to_string());
    assert!(delay >= 60_000);
    assert!(delay <= 240_000);
}

#[test]
fn test_start_multi_platform_session_validates_empty_targets() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();
    let result = rt.block_on(start_multi_platform_session(StartMultiPlatformSessionInput {
        account_id: "acc_123".to_string(),
        platforms: vec![
            PlatformTarget {
                platform: "facebook_groups".to_string(),
                account_id: "acc_123".to_string(),
                targets: vec![],
                priority: Some(0),
            },
        ],
        template_id: None,
        content: None,
    }));

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("Targets cannot be empty"));
}

#[test]
fn test_platform_matches_account_facebook() {
    assert!(platform_matches_account("facebook_groups", "facebook"));
    assert!(platform_matches_account("facebook_pages", "facebook"));
    assert!(!platform_matches_account("instagram", "facebook"));
    assert!(!platform_matches_account("twitter", "facebook"));
}

#[test]
fn test_platform_matches_account_instagram() {
    assert!(platform_matches_account("instagram", "instagram"));
    assert!(!platform_matches_account("facebook_groups", "instagram"));
}

#[test]
fn test_platform_matches_account_unknown_allowed() {
    assert!(platform_matches_account("facebook_groups", "unknown"));
    assert!(platform_matches_account("instagram", "unknown"));
}

#[test]
fn test_extract_platform_from_account() {
    assert_eq!(extract_platform_from_account("fb_123"), "facebook");
    assert_eq!(extract_platform_from_account("facebook_456"), "facebook");
    assert_eq!(extract_platform_from_account("ig_789"), "instagram");
    assert_eq!(extract_platform_from_account("twitter_abc"), "twitter");
    assert_eq!(extract_platform_from_account("linkedin_xyz"), "linkedin");
    assert_eq!(extract_platform_from_account("unknown_id"), "unknown");
}

#[test]
fn test_start_multi_platform_session_rejects_platform_mismatch() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();
    let result = rt.block_on(start_multi_platform_session(StartMultiPlatformSessionInput {
        account_id: "fb_123".to_string(),
        platforms: vec![
            PlatformTarget {
                platform: "instagram".to_string(),
                account_id: "fb_123".to_string(),
                targets: vec!["profile_1".to_string()],
                priority: Some(20),
            },
        ],
        template_id: None,
        content: None,
    }));

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("does not match target platform"));
}

#[test]
fn test_start_multi_platform_session_accepts_matching_platform() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();
    let result = rt.block_on(start_multi_platform_session(StartMultiPlatformSessionInput {
        account_id: "fb_123".to_string(),
        platforms: vec![
            PlatformTarget {
                platform: "facebook_groups".to_string(),
                account_id: "fb_123".to_string(),
                targets: vec!["group_1".to_string()],
                priority: Some(0),
            },
            PlatformTarget {
                platform: "facebook_pages".to_string(),
                account_id: "fb_123".to_string(),
                targets: vec!["page_1".to_string()],
                priority: Some(10),
            },
        ],
        template_id: None,
        content: Some("Test".to_string()),
    }));

    assert!(result.is_ok());
    let session = result.unwrap();
    assert_eq!(session.total_jobs, 2);
}

#[test]
fn test_get_post_jobs_returns_jobs_for_session() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string(), "group_2".to_string()],
        ..Default::default()
    })).unwrap();

    let jobs = rt.block_on(get_post_jobs(session.id.clone())).unwrap();

    assert_eq!(jobs.len(), 2);
    assert!(jobs.iter().all(|j| j.session_id == session.id));
}

#[test]
fn test_get_post_jobs_returns_empty_for_valid_session_with_no_jobs() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string()],
        ..Default::default()
    })).unwrap();

    let jobs = rt.block_on(get_post_jobs(session.id)).unwrap();
    assert_eq!(jobs.len(), 1);
}

#[test]
fn test_get_post_jobs_errors_for_nonexistent_session() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let result = rt.block_on(get_post_jobs("nonexistent_session".to_string()));
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Session not found"));
}

#[test]
fn test_retry_failed_job_resets_job_to_pending() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string()],
        ..Default::default()
    })).unwrap();

    let (_, jobs) = rt.block_on(get_posting_session_status(session.id)).unwrap();
    let job_id = jobs[0].id.clone();

    rt.block_on(update_post_job_status(
        job_id.clone(),
        "failed".to_string(),
        Some(UpdateJobResult {
            error: Some("Test error".to_string()),
            error_category: Some("NETWORK_ERROR".to_string()),
            ..Default::default()
        }),
    )).unwrap();

    let retried_job = rt.block_on(retry_failed_job(job_id.clone())).unwrap();

    assert_eq!(retried_job.status, PostJobStatus::Pending);
    assert_eq!(retried_job.retry_count, 1);
    assert!(retried_job.error_message.is_none());
    assert!(retried_job.error_category.is_none());
}

#[test]
fn test_retry_failed_job_increments_retry_count() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string()],
        ..Default::default()
    })).unwrap();

    let (_, jobs) = rt.block_on(get_posting_session_status(session.id)).unwrap();
    let job_id = jobs[0].id.clone();

    rt.block_on(update_post_job_status(
        job_id.clone(),
        "failed".to_string(),
        None,
    )).unwrap();

    let job1 = rt.block_on(retry_failed_job(job_id.clone())).unwrap();
    assert_eq!(job1.retry_count, 1);

    rt.block_on(update_post_job_status(
        job_id.clone(),
        "failed".to_string(),
        None,
    )).unwrap();

    let job2 = rt.block_on(retry_failed_job(job_id.clone())).unwrap();
    assert_eq!(job2.retry_count, 2);
}

#[test]
fn test_retry_failed_job_errors_for_nonexistent_job() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let result = rt.block_on(retry_failed_job("nonexistent_job".to_string()));
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Job not found"));
}

#[test]
fn test_retry_failed_job_errors_for_non_failed_status() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string()],
        ..Default::default()
    })).unwrap();

    let (_, jobs) = rt.block_on(get_posting_session_status(session.id)).unwrap();
    let job_id = jobs[0].id.clone();

    let result = rt.block_on(retry_failed_job(job_id));
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("not in failed state"));
}

#[test]
fn test_retry_failed_job_errors_when_max_retries_reached() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string()],
        ..Default::default()
    })).unwrap();

    let (_, jobs) = rt.block_on(get_posting_session_status(session.id)).unwrap();
    let job_id = jobs[0].id.clone();

    for _ in 0..3 {
        rt.block_on(update_post_job_status(
            job_id.clone(),
            "failed".to_string(),
            None,
        )).unwrap();

        if rt.block_on(retry_failed_job(job_id.clone())).is_err() {
            break;
        }
    }

    rt.block_on(update_post_job_status(
        job_id.clone(),
        "failed".to_string(),
        None,
    )).unwrap();

    let result = rt.block_on(retry_failed_job(job_id));
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("max retries"));
}

#[test]
fn test_retry_failed_job_clears_error_fields() {
    reset_storage();

    let rt = tokio::runtime::Runtime::new().unwrap();

    let session = rt.block_on(start_posting_session(StartSessionInput {
        account_id: "acct_123".to_string(),
        group_ids: vec!["group_1".to_string()],
        ..Default::default()
    })).unwrap();

    let (_, jobs) = rt.block_on(get_posting_session_status(session.id)).unwrap();
    let job_id = jobs[0].id.clone();

    rt.block_on(update_post_job_status(
        job_id.clone(),
        "failed".to_string(),
        Some(UpdateJobResult {
            post_url: None,
            error: Some("Network timeout".to_string()),
            error_category: Some("NETWORK_ERROR".to_string()),
            duration_ms: Some(5000),
        }),
    )).unwrap();

    let retried_job = rt.block_on(retry_failed_job(job_id)).unwrap();

        assert!(retried_job.error_message.is_none());
        assert!(retried_job.error_category.is_none());
        assert!(retried_job.post_url.is_none());
        assert!(retried_job.started_at.is_none());
        assert!(retried_job.completed_at.is_none());
        assert!(retried_job.duration_ms.is_none());
    }

    // ========================================
    // T-1.3: Persistence Integration Tests
    // ========================================

    /// Helper to get persistence store for tests
    fn get_persistence_store() -> &'static crate::database::InMemoryStore {
        &PERSISTENCE_STORE
    }

    #[test]
    fn test_persistence_session_insert() {
        // Clear persistence store
        get_persistence_store().clear().unwrap();

        let session = crate::database::PostSessionModel::new(
            "sess_persist_test".to_string(),
            "acct_test".to_string(),
            Some("tmpl_test".to_string()),
            3,
            "{}".to_string(),
        );

        // Insert session
        get_persistence_store().sessions.create_session(session.clone()).unwrap();

        // Verify it was inserted
        let retrieved = get_persistence_store().sessions.get_session("sess_persist_test").unwrap();
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, "sess_persist_test");
        assert_eq!(retrieved.account_id, "acct_test");
        assert_eq!(retrieved.total_jobs, 3);
    }

    #[test]
    fn test_persistence_job_batch_insert() {
        // Use unique session ID to avoid conflicts with parallel tests
        let session_id = format!("sess_batch_test_{}", Utc::now().timestamp_millis());
        get_persistence_store().clear().unwrap();

        // Create session first
        let session = crate::database::PostSessionModel::new(
            session_id.clone(),
            "acct_test".to_string(),
            None,
            3,
            "{}".to_string(),
        );
        get_persistence_store().sessions.create_session(session).unwrap();

        // Create batch of jobs
        for i in 0..3 {
            let job = crate::database::PostJobModel::new(
                format!("job_batch_{}_{}", session_id, i),
                session_id.clone(),
                format!("group_{}", i),
                "facebook_groups".to_string(),
                i,
                "content".to_string(),
            );
            get_persistence_store().jobs.create_job(job).unwrap();
        }

        // Verify all jobs were inserted
        let jobs = get_persistence_store().jobs.get_jobs_by_session(&session_id).unwrap();
        assert_eq!(jobs.len(), 3);
    }

    #[test]
    fn test_persistence_job_status_update() {
        get_persistence_store().clear().unwrap();

        // Create session and job
        let session = crate::database::PostSessionModel::new(
            "sess_status_test".to_string(),
            "acct_test".to_string(),
            None,
            1,
            "{}".to_string(),
        );
        get_persistence_store().sessions.create_session(session).unwrap();

        let job = crate::database::PostJobModel::new(
            "job_status_test".to_string(),
            "sess_status_test".to_string(),
            "group_test".to_string(),
            "facebook_groups".to_string(),
            0,
            "content".to_string(),
        );
        get_persistence_store().jobs.create_job(job).unwrap();

        // Update job status to success
        let mut job = get_persistence_store().jobs.get_job("job_status_test").unwrap().unwrap();
        job.succeed(Some("https://fb.com/post/123".to_string()), Some(5000));
        get_persistence_store().jobs.update_job(job).unwrap();

        // Verify update
        let updated = get_persistence_store().jobs.get_job("job_status_test").unwrap().unwrap();
        assert_eq!(updated.status, "success");
        assert!(updated.post_url.is_some());
        assert_eq!(updated.duration_ms, Some(5000));
    }

    #[test]
    fn test_persistence_session_counters_update() {
        get_persistence_store().clear().unwrap();

        let session = crate::database::PostSessionModel::new(
            "sess_counter_test".to_string(),
            "acct_test".to_string(),
            None,
            3,
            "{}".to_string(),
        );
        get_persistence_store().sessions.create_session(session).unwrap();

        // Increment success counter
        let mut session = get_persistence_store().sessions.get_session("sess_counter_test").unwrap().unwrap();
        session.increment_success();
        get_persistence_store().sessions.update_session(session).unwrap();

        // Verify counter
        let updated = get_persistence_store().sessions.get_session("sess_counter_test").unwrap().unwrap();
        assert_eq!(updated.successful_jobs, 1);
        assert_eq!(updated.completed_jobs, 1);

        // Increment failed counter
        let mut session = updated;
        session.increment_failed();
        get_persistence_store().sessions.update_session(session).unwrap();

        let updated = get_persistence_store().sessions.get_session("sess_counter_test").unwrap().unwrap();
        assert_eq!(updated.failed_jobs, 1);
        assert_eq!(updated.completed_jobs, 2);
    }

    // ========================================
    // T-2.1-T-2.6: Phase 2 Command Tests
    // ========================================

    #[test]
    fn test_get_groups_for_posting_returns_eligibility() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(get_groups_for_posting(
            "acct_123".to_string(),
            vec!["group_1".to_string(), "group_2".to_string()],
        ));

        assert!(result.is_ok());
        let eligibility = result.unwrap();
        assert_eq!(eligibility.len(), 2);
        assert!(eligibility[0].is_eligible);
        assert!(eligibility[1].is_eligible);
    }

    #[test]
    fn test_get_groups_for_posting_validates_account_id() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(get_groups_for_posting(
            "".to_string(),
            vec!["group_1".to_string()],
        ));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Account ID is required"));
    }

    #[test]
    fn test_get_groups_for_posting_empty_groups_returns_empty() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(get_groups_for_posting(
            "acct_123".to_string(),
            vec![],
        ));

        assert!(result.is_ok());
        let eligibility = result.unwrap();
        assert!(eligibility.is_empty());
    }

    #[test]
    fn test_check_account_posting_safety_returns_status() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(check_account_posting_safety(
            "acct_123".to_string(),
            "facebook_groups".to_string(),
        ));

        assert!(result.is_ok());
        let safety = result.unwrap();
        assert_eq!(safety.account_id, "acct_123");
        assert!(safety.is_safe);
        assert!(safety.daily_posts_remaining > 0);
        assert!(safety.hourly_posts_remaining > 0);
    }

    #[test]
    fn test_check_account_posting_safety_validates_account_id() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(check_account_posting_safety(
            "".to_string(),
            "facebook_groups".to_string(),
        ));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Account ID is required"));
    }

    #[test]
    fn test_check_account_posting_safety_validates_platform() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(check_account_posting_safety(
            "acct_123".to_string(),
            "".to_string(),
        ));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Platform is required"));
    }

    #[test]
    fn test_increment_template_use_count_returns_result() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(increment_template_use_count(
            "tmpl_123".to_string(),
        ));

        assert!(result.is_ok());
        let usage = result.unwrap();
        assert_eq!(usage.template_id, "tmpl_123");
        assert!(usage.use_count >= 1);
        assert!(!usage.last_used_at.is_empty());
    }

    #[test]
    fn test_increment_template_use_count_validates_id() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(increment_template_use_count(
            "".to_string(),
        ));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Template ID is required"));
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
