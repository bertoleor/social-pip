//! Job Timeout Module - Configurable timeout per job type with cancellation.
//!
//! This module prevents jobs from hanging indefinitely by enforcing timeouts
//! with configurable actions on timeout.
//!
//! ## Default Timeouts
//! | Job Type | Default Timeout | OnTimeout Action |
//! |----------|-----------------|------------------|
//! | PostToGroup | 5 minutes | DeadLetter |
//! | GenerateCaption | 60 seconds | Retry |
//! | BrowserAutomation | 10 minutes | Fail |
//! | UploadMedia | 2 minutes | Retry |
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::job_timeout::{TimeoutConfig, OnTimeoutAction, JobTimeoutManager};
//!
//! let config = TimeoutConfig {
//!     job_type: "PostToGroup".to_string(),
//!     timeout_ms: 300_000,
//!     on_timeout: OnTimeoutAction::DeadLetter { reason: "Timeout".to_string() },
//!     graceful_shutdown_ms: 5000,
//! };
//!
//! let manager = JobTimeoutManager::new();
//! let handle = manager.start_job("job_123", config);
//!
//! // Check if job timed out
//! if handle.is_timed_out() {
//!     handle.cancel();
//! }
//! ```

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

// ============================================
// IN-MEMORY STORAGE
// ============================================

static TIMEOUT_CONFIGS: Lazy<Mutex<HashMap<String, TimeoutConfig>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static ACTIVE_JOBS: Lazy<Mutex<HashMap<String, ActiveJob>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

// ============================================
// ON TIMEOUT ACTION
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OnTimeoutAction {
    Fail,
    Retry {
        max_retries: u32,
        base_delay_ms: u64,
    },
    DeadLetter {
        reason: String,
    },
}

impl Default for OnTimeoutAction {
    fn default() -> Self {
        OnTimeoutAction::Fail
    }
}

impl OnTimeoutAction {
    pub fn action_type(&self) -> &'static str {
        match self {
            OnTimeoutAction::Fail => "FAIL",
            OnTimeoutAction::Retry { .. } => "RETRY",
            OnTimeoutAction::DeadLetter { .. } => "DEAD_LETTER",
        }
    }
}

// ============================================
// TIMEOUT CONFIG
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutConfig {
    pub job_type: String,
    pub timeout_ms: u64,
    pub on_timeout: OnTimeoutAction,
    pub graceful_shutdown_ms: u64,
}

impl Default for TimeoutConfig {
    fn default() -> Self {
        Self {
            job_type: "default".to_string(),
            timeout_ms: 60000,
            on_timeout: OnTimeoutAction::Fail,
            graceful_shutdown_ms: 5000,
        }
    }
}

impl TimeoutConfig {
    pub fn for_job_type(job_type: &str) -> Self {
        let (timeout_ms, on_timeout) = match job_type {
            "PostToGroup" => (
                300_000,
                OnTimeoutAction::DeadLetter {
                    reason: "PostToGroup timed out".to_string(),
                },
            ),
            "GenerateCaption" => (
                60_000,
                OnTimeoutAction::Retry {
                    max_retries: 2,
                    base_delay_ms: 5000,
                },
            ),
            "BrowserAutomation" => (600_000, OnTimeoutAction::Fail),
            "UploadMedia" => (
                120_000,
                OnTimeoutAction::Retry {
                    max_retries: 3,
                    base_delay_ms: 10_000,
                },
            ),
            "ValidateAccount" => (30_000, OnTimeoutAction::Fail),
            "FetchGroups" => (
                60_000,
                OnTimeoutAction::Retry {
                    max_retries: 2,
                    base_delay_ms: 5000,
                },
            ),
            _ => (60_000, OnTimeoutAction::Fail),
        };

        Self {
            job_type: job_type.to_string(),
            timeout_ms,
            on_timeout,
            graceful_shutdown_ms: 5000,
        }
    }

    pub fn deadline_from(&self, start: DateTime<Utc>) -> DateTime<Utc> {
        start + chrono::Duration::milliseconds(self.timeout_ms as i64)
    }
}

// ============================================
// ACTIVE JOB
// ============================================

#[derive(Debug, Clone)]
pub struct ActiveJob {
    pub job_id: String,
    pub job_type: String,
    pub started_at: DateTime<Utc>,
    pub deadline: DateTime<Utc>,
    pub config: TimeoutConfig,
    pub cancelled: bool,
    pub trace_id: Option<String>,
}

impl ActiveJob {
    pub fn new(job_id: String, config: TimeoutConfig, trace_id: Option<String>) -> Self {
        let started_at = Utc::now();
        let deadline = config.deadline_from(started_at);

        Self {
            job_id,
            job_type: config.job_type.clone(),
            started_at,
            deadline,
            config,
            cancelled: false,
            trace_id,
        }
    }

    pub fn is_timed_out(&self) -> bool {
        Utc::now() >= self.deadline
    }

    pub fn remaining_ms(&self) -> i64 {
        let now = Utc::now();
        if now >= self.deadline {
            0
        } else {
            (self.deadline - now).num_milliseconds()
        }
    }

    pub fn elapsed_ms(&self) -> i64 {
        (Utc::now() - self.started_at).num_milliseconds()
    }

    pub fn cancel(&mut self) {
        self.cancelled = true;
    }
}

// ============================================
// JOB TIMEOUT HANDLE
// ============================================

pub struct JobTimeoutHandle {
    job_id: String,
    cancelled: AtomicBool,
}

impl JobTimeoutHandle {
    pub fn new(job_id: String) -> Self {
        Self {
            job_id,
            cancelled: AtomicBool::new(false),
        }
    }

    pub fn job_id(&self) -> &str {
        &self.job_id
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    pub fn check_or_cancel(&self, job: &ActiveJob) -> bool {
        if job.is_timed_out() {
            self.cancel();
            return true;
        }
        self.is_cancelled()
    }
}

// ============================================
// TIMEOUT RESULT
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutResult {
    pub job_id: String,
    pub job_type: String,
    pub timed_out: bool,
    pub elapsed_ms: i64,
    pub action_taken: Option<String>,
    pub trace_id: Option<String>,
}

impl TimeoutResult {
    pub fn success(job: &ActiveJob) -> Self {
        Self {
            job_id: job.job_id.clone(),
            job_type: job.job_type.clone(),
            timed_out: false,
            elapsed_ms: job.elapsed_ms(),
            action_taken: None,
            trace_id: job.trace_id.clone(),
        }
    }

    pub fn timeout(job: &ActiveJob, action: &str) -> Self {
        Self {
            job_id: job.job_id.clone(),
            job_type: job.job_type.clone(),
            timed_out: true,
            elapsed_ms: job.elapsed_ms(),
            action_taken: Some(action.to_string()),
            trace_id: job.trace_id.clone(),
        }
    }
}

// ============================================
// TIMEOUT MANAGER
// ============================================

pub struct JobTimeoutManager;

impl JobTimeoutManager {
    pub fn new() -> Self {
        Self::init_defaults();
        Self
    }

    fn init_defaults() {
        let mut configs = TIMEOUT_CONFIGS.lock().unwrap();
        if configs.is_empty() {
            for job_type in [
                "PostToGroup",
                "GenerateCaption",
                "BrowserAutomation",
                "UploadMedia",
                "ValidateAccount",
                "FetchGroups",
            ] {
                let config = TimeoutConfig::for_job_type(job_type);
                configs.insert(job_type.to_string(), config);
            }
        }
    }

    pub fn register_config(config: TimeoutConfig) {
        let mut configs = TIMEOUT_CONFIGS.lock().unwrap();
        configs.insert(config.job_type.clone(), config);
    }

    pub fn get_config(job_type: &str) -> TimeoutConfig {
        let configs = TIMEOUT_CONFIGS.lock().unwrap();
        configs
            .get(job_type)
            .cloned()
            .unwrap_or_else(|| TimeoutConfig::for_job_type(job_type))
    }

    pub fn start_job(job_id: String, config: TimeoutConfig, trace_id: Option<String>) -> ActiveJob {
        let job = ActiveJob::new(job_id, config, trace_id);
        let mut jobs = ACTIVE_JOBS.lock().unwrap();
        jobs.insert(job.job_id.clone(), job.clone());
        job
    }

    pub fn start_job_with_type(
        job_id: String,
        job_type: &str,
        trace_id: Option<String>,
    ) -> ActiveJob {
        let config = Self::get_config(job_type);
        Self::start_job(job_id, config, trace_id)
    }

    pub fn get_job(job_id: &str) -> Option<ActiveJob> {
        let jobs = ACTIVE_JOBS.lock().unwrap();
        jobs.get(job_id).cloned()
    }

    pub fn complete_job(job_id: &str) -> Option<TimeoutResult> {
        let mut jobs = ACTIVE_JOBS.lock().unwrap();
        jobs.remove(job_id).map(|job| TimeoutResult::success(&job))
    }

    pub fn cancel_job(job_id: &str) -> Option<ActiveJob> {
        let mut jobs = ACTIVE_JOBS.lock().unwrap();
        if let Some(job) = jobs.get_mut(job_id) {
            job.cancel();
        }
        jobs.remove(job_id)
    }

    pub fn get_timed_out_jobs() -> Vec<ActiveJob> {
        let jobs = ACTIVE_JOBS.lock().unwrap();
        jobs.values()
            .filter(|j| j.is_timed_out() && !j.cancelled)
            .cloned()
            .collect()
    }

    pub fn get_active_count() -> usize {
        let jobs = ACTIVE_JOBS.lock().unwrap();
        jobs.values()
            .filter(|j| !j.cancelled && !j.is_timed_out())
            .count()
    }

    pub fn clear_all() {
        let mut jobs = ACTIVE_JOBS.lock().unwrap();
        jobs.clear();
    }
}

impl Default for JobTimeoutManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

pub fn register_timeout_config(config: TimeoutConfig) {
    JobTimeoutManager::register_config(config);
}

pub fn get_timeout_config(job_type: &str) -> TimeoutConfig {
    JobTimeoutManager::get_config(job_type)
}

pub fn start_job_timeout(job_id: String, job_type: &str, trace_id: Option<String>) -> ActiveJob {
    JobTimeoutManager::start_job_with_type(job_id, job_type, trace_id)
}

pub fn check_job_timeout(job_id: &str) -> Option<bool> {
    JobTimeoutManager::get_job(job_id).map(|j| j.is_timed_out())
}

pub fn complete_job_timeout(job_id: &str) -> Option<TimeoutResult> {
    JobTimeoutManager::complete_job(job_id)
}

pub fn get_timed_out_jobs() -> Vec<ActiveJob> {
    JobTimeoutManager::get_timed_out_jobs()
}

pub fn clear_timeout_storage() {
    JobTimeoutManager::clear_all();
}
