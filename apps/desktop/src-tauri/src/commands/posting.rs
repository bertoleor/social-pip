//! Posting commands module - Session and job management for multi-group posting
//!
//! This module provides Tauri commands for posting sessions following the bounded context pattern.
//! Integrates with AntiBanEngine for safe execution.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use once_cell::sync::Lazy;
use chrono::Utc;
use uuid::Uuid;

use crate::anti_ban::AntiBanEngine;

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
    let anti_ban_config = get_platform_config("facebook_groups".to_string());
    let anti_ban_engine = AntiBanEngine::new(anti_ban_config);
    
    {
        let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
        engines.insert(session_id.clone(), anti_ban_engine);
    }

    // Create session
    let session = PostSession {
        id: session_id.clone(),
        status: SessionStatus::Pending,
        template_id: config.template_id.clone(),
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
platform: "facebook_groups".to_string(),
priority: 99,
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

    let now = now_iso();
    let session_id = generate_session_id();

let mut all_jobs: Vec<PostJob> = Vec::new();

for target in &config.platforms {
let priority = target.priority.unwrap_or_else(|| {
get_platform_priority(&target.platform)
});

for target_id in &target.targets {
let job_id = generate_job_id();
let job = PostJob {
id: job_id,
session_id: session_id.clone(),
group_id: target_id.clone(),
platform: target.platform.clone(),
priority,
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
created_at: now.clone(),
updated_at: now.clone(),
};
all_jobs.push(job);
}
}

all_jobs.sort_by_key(|j| j.priority);

let total_jobs = all_jobs.len() as u32;

let first_platform = config.platforms.first()
.map(|p| p.platform.as_str())
.unwrap_or("facebook_groups");
let anti_ban_config = get_platform_config(first_platform.to_string());
let anti_ban_engine = AntiBanEngine::new(anti_ban_config);

{
let mut engines = ANTI_BAN_ENGINES.lock().map_err(|e| e.to_string())?;
engines.insert(session_id.clone(), anti_ban_engine);
}

{
let mut jobs = JOBS.lock().map_err(|e| e.to_string())?;
for job in all_jobs {
jobs.insert(job.id.clone(), job);
}
}

let session = PostSession {
        id: session_id.clone(),
        status: SessionStatus::Pending,
        template_id: config.template_id.clone(),
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

{
let mut sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
sessions.insert(session_id, session.clone());
}

Ok(session)
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
    let jobs = JOBS.lock().map_err(|e| e.to_string())?;
    let session_jobs: Vec<PostJob> = jobs
        .values()
        .filter(|j| j.session_id == session_id)
        .cloned()
        .collect();

    if session_jobs.is_empty() {
        let sessions = SESSIONS.lock().map_err(|e| e.to_string())?;
        if !sessions.contains_key(&session_id) {
            return Err(format!("Session not found: {}", session_id));
        }
    }

    Ok(session_jobs)
}

/// Retry a failed job
#[tauri::command]
pub async fn retry_failed_job(job_id: String) -> Result<PostJob, String> {
    let mut jobs = JOBS.lock().map_err(|e| e.to_string())?;

    let job = jobs
        .get_mut(&job_id)
        .ok_or_else(|| format!("Job not found: {}", job_id))?;

    if job.status != PostJobStatus::Failed {
        return Err(format!(
            "Job is not in failed state (current: {})",
            job.status.as_str()
        ));
    }

    if job.retry_count >= job.max_retries {
        return Err(format!(
            "Job has reached max retries ({}/{})",
            job.retry_count, job.max_retries
        ));
    }

    job.status = PostJobStatus::Pending;
    job.retry_count += 1;
    job.error_message = None;
    job.error_category = None;
    job.post_url = None;
    job.started_at = None;
    job.completed_at = None;
    job.duration_ms = None;
    job.updated_at = now_iso();

    Ok(job.clone())
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
