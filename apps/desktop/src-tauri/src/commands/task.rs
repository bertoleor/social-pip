//! Task commands module - Task queue management for browser automation
//!
//! This module provides Tauri commands for task management following the bounded context pattern.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================
// DOMAIN TYPES
// ============================================

/// Task type for browser automation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskType {
    Post,
    Message,
    Story,
    Reel,
}

impl TaskType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskType::Post => "post",
            TaskType::Message => "message",
            TaskType::Story => "story",
            TaskType::Reel => "reel",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "post" => Some(TaskType::Post),
            "message" => Some(TaskType::Message),
            "story" => Some(TaskType::Story),
            "reel" => Some(TaskType::Reel),
            _ => None,
        }
    }
}

/// Task status matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Pending => "pending",
            TaskStatus::Running => "running",
            TaskStatus::Completed => "completed",
            TaskStatus::Failed => "failed",
            TaskStatus::Cancelled => "cancelled",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "pending" => Some(TaskStatus::Pending),
            "running" => Some(TaskStatus::Running),
            "completed" => Some(TaskStatus::Completed),
            "failed" => Some(TaskStatus::Failed),
            "cancelled" => Some(TaskStatus::Cancelled),
            _ => None,
        }
    }
}

/// Platform enum for tasks
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Facebook,
    Instagram,
    Tiktok,
    Twitter,
    Linkedin,
    Threads,
    Telegram,
    Whatsapp,
}

impl Platform {
    pub fn as_str(&self) -> &'static str {
        match self {
            Platform::Facebook => "facebook",
            Platform::Instagram => "instagram",
            Platform::Tiktok => "tiktok",
            Platform::Twitter => "twitter",
            Platform::Linkedin => "linkedin",
            Platform::Threads => "threads",
            Platform::Telegram => "telegram",
            Platform::Whatsapp => "whatsapp",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "facebook" => Some(Platform::Facebook),
            "instagram" => Some(Platform::Instagram),
            "tiktok" => Some(Platform::Tiktok),
            "twitter" => Some(Platform::Twitter),
            "linkedin" => Some(Platform::Linkedin),
            "threads" => Some(Platform::Threads),
            "telegram" => Some(Platform::Telegram),
            "whatsapp" => Some(Platform::Whatsapp),
            _ => None,
        }
    }
}

/// Task entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    #[serde(rename = "type")]
    pub task_type: TaskType,
    pub platform: Platform,
    pub account_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_id: Option<String>,
    pub status: TaskStatus,
    pub priority: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub retry_count: i32,
    pub max_retries: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// Filter parameters for get_tasks
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TaskFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "type")]
    pub task_type: Option<String>,
}

/// Input for creating a new task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskInput {
    #[serde(rename = "type")]
    pub task_type: String,
    pub platform: String,
    pub account_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_id: Option<String>,
    #[serde(default)]
    pub priority: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<String>,
    #[serde(default = "default_max_retries")]
    pub max_retries: i32,
}

fn default_max_retries() -> i32 {
    3
}

// ============================================
// IN-MEMORY STORAGE (for MVP)
// ============================================

use std::sync::Mutex;
use once_cell::sync::Lazy;

static TASKS: Lazy<Mutex<HashMap<String, Task>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

// ============================================
// HELPER FUNCTIONS
// ============================================

fn generate_id() -> String {
    // Use nanoseconds and a thread-local counter for uniqueness
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let count = COUNTER.fetch_add(1, Ordering::SeqCst);
    let now = chrono::Utc::now();
    format!("task_{}{:010}", now.timestamp_nanos_opt().unwrap_or(0), count)
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn matches_filter(task: &Task, filter: &TaskFilter) -> bool {
    if let Some(ref account_id) = filter.account_id {
        if task.account_id != *account_id {
            return false;
        }
    }

    if let Some(ref platform) = filter.platform {
        if task.platform.as_str() != platform.to_lowercase().as_str() {
            return false;
        }
    }

    if let Some(ref status) = filter.status {
        if task.status.as_str() != status.to_lowercase().as_str() {
            return false;
        }
    }

    if let Some(ref task_type) = filter.task_type {
        if task.task_type.as_str() != task_type.to_lowercase().as_str() {
            return false;
        }
    }

    true
}

// ============================================
// TAURI COMMANDS
// ============================================

/// Get all tasks with optional filtering
#[tauri::command]
pub async fn get_tasks(filter: Option<TaskFilter>) -> Result<Vec<Task>, String> {
    let tasks = TASKS.lock().map_err(|e| e.to_string())?;
    let filter = filter.unwrap_or_default();

    let mut result: Vec<Task> = tasks
        .values()
        .filter(|t| matches_filter(t, &filter))
        .cloned()
        .collect();

    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(result)
}

/// Get a single task by ID
#[tauri::command]
pub async fn get_task(id: String) -> Result<Option<Task>, String> {
    let tasks = TASKS.lock().map_err(|e| e.to_string())?;
    Ok(tasks.get(&id).cloned())
}

/// Create a new task
#[tauri::command]
pub async fn create_task(input: CreateTaskInput) -> Result<Task, String> {
    let task_type = TaskType::from_str(&input.task_type)
        .ok_or_else(|| format!("Invalid task type: {}", input.task_type))?;

    let platform = Platform::from_str(&input.platform)
        .ok_or_else(|| format!("Invalid platform: {}", input.platform))?;

    let now = now_iso();
    let id = generate_id();

    let task = Task {
        id: id.clone(),
        task_type,
        platform,
        account_id: input.account_id,
        post_id: input.post_id,
        status: TaskStatus::Pending,
        priority: input.priority,
        scheduled_at: input.scheduled_at,
        started_at: None,
        completed_at: None,
        result: None,
        error_message: None,
        retry_count: 0,
        max_retries: input.max_retries,
        created_at: now.clone(),
        updated_at: now,
    };

    let mut tasks = TASKS.lock().map_err(|e| e.to_string())?;
    tasks.insert(id, task.clone());

    Ok(task)
}

/// Update task status
#[tauri::command]
pub async fn update_task_status(id: String, status: String, result: Option<String>) -> Result<Task, String> {
    let task_status = TaskStatus::from_str(&status)
        .ok_or_else(|| format!("Invalid task status: {}", status))?;

    let mut tasks = TASKS.lock().map_err(|e| e.to_string())?;

    let task = tasks.get_mut(&id)
        .ok_or_else(|| format!("Task not found: {}", id))?;

    task.status = task_status;
    if result.is_some() {
        task.result = result;
    }
    task.updated_at = now_iso();

    if task.status == TaskStatus::Completed || task.status == TaskStatus::Failed {
        task.completed_at = Some(now_iso());
    }

    Ok(task.clone())
}

/// Cancel a task
#[tauri::command]
pub async fn cancel_task(id: String) -> Result<(), String> {
    let mut tasks = TASKS.lock().map_err(|e| e.to_string())?;

    let task = tasks.get_mut(&id)
        .ok_or_else(|| format!("Task not found: {}", id))?;

    if task.status == TaskStatus::Completed || task.status == TaskStatus::Cancelled {
        return Err("Cannot cancel a completed or already cancelled task".to_string());
    }

    task.status = TaskStatus::Cancelled;
    task.updated_at = now_iso();

    Ok(())
}

/// Retry a failed task
#[tauri::command]
pub async fn retry_task(id: String) -> Result<Task, String> {
    let mut tasks = TASKS.lock().map_err(|e| e.to_string())?;

    let task = tasks.get_mut(&id)
        .ok_or_else(|| format!("Task not found: {}", id))?;

    if task.status != TaskStatus::Failed {
        return Err("Can only retry failed tasks".to_string());
    }

    if task.retry_count >= task.max_retries {
        return Err("Max retries exceeded".to_string());
    }

    task.status = TaskStatus::Pending;
    task.retry_count += 1;
    task.error_message = None;
    task.updated_at = now_iso();

    Ok(task.clone())
}

/// Delete a task (idempotent)
#[tauri::command]
pub async fn delete_task(id: String) -> Result<(), String> {
    let mut tasks = TASKS.lock().map_err(|e| e.to_string())?;
    tasks.remove(&id);
    Ok(())
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_tasks() {
        let mut tasks = TASKS.lock().unwrap();
        tasks.clear();
    }

    #[test]
    fn test_task_type_from_str() {
        assert_eq!(TaskType::from_str("post"), Some(TaskType::Post));
        assert_eq!(TaskType::from_str("message"), Some(TaskType::Message));
        assert_eq!(TaskType::from_str("story"), Some(TaskType::Story));
        assert_eq!(TaskType::from_str("reel"), Some(TaskType::Reel));
        assert_eq!(TaskType::from_str("invalid"), None);
    }

    #[test]
    fn test_task_status_from_str() {
        assert_eq!(TaskStatus::from_str("pending"), Some(TaskStatus::Pending));
        assert_eq!(TaskStatus::from_str("running"), Some(TaskStatus::Running));
        assert_eq!(TaskStatus::from_str("completed"), Some(TaskStatus::Completed));
        assert_eq!(TaskStatus::from_str("failed"), Some(TaskStatus::Failed));
        assert_eq!(TaskStatus::from_str("cancelled"), Some(TaskStatus::Cancelled));
        assert_eq!(TaskStatus::from_str("invalid"), None);
    }

    #[test]
    fn test_get_tasks_returns_empty_when_none_exist() {
        reset_tasks();
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(get_tasks(None));
        assert!(result.is_ok());
        let tasks = result.unwrap();
        assert!(tasks.is_empty());
    }

    #[test]
    fn test_create_task_persists_and_returns() {
        reset_tasks();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_task(CreateTaskInput {
            task_type: "post".to_string(),
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
            post_id: None,
            priority: 0,
            scheduled_at: None,
            max_retries: 3,
        }));

        assert!(result.is_ok());
        let task = result.unwrap();

        assert!(task.id.starts_with("task_"));
        assert_eq!(task.task_type, TaskType::Post);
        assert_eq!(task.platform, Platform::Facebook);
        assert_eq!(task.status, TaskStatus::Pending);

        let _ = rt.block_on(delete_task(task.id));
    }

    #[test]
    fn test_update_task_status() {
        reset_tasks();

        let rt = tokio::runtime::Runtime::new().unwrap();

        let created = rt.block_on(create_task(CreateTaskInput {
            task_type: "post".to_string(),
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
            post_id: None,
            priority: 0,
            scheduled_at: None,
            max_retries: 3,
        })).unwrap();

        let result = rt.block_on(update_task_status(created.id.clone(), "completed".to_string(), Some("success".to_string())));
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.status, TaskStatus::Completed);
        assert!(updated.completed_at.is_some());

        let _ = rt.block_on(delete_task(created.id));
    }

    #[test]
    fn test_cancel_task() {
        reset_tasks();

        let rt = tokio::runtime::Runtime::new().unwrap();

        let created = rt.block_on(create_task(CreateTaskInput {
            task_type: "post".to_string(),
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
            post_id: None,
            priority: 0,
            scheduled_at: None,
            max_retries: 3,
        })).unwrap();

        let result = rt.block_on(cancel_task(created.id.clone()));
        assert!(result.is_ok());

        let task = rt.block_on(get_task(created.id.clone())).unwrap().unwrap();
        assert_eq!(task.status, TaskStatus::Cancelled);

        let _ = rt.block_on(delete_task(created.id));
    }

    #[test]
    fn test_retry_failed_task() {
        reset_tasks();

        let rt = tokio::runtime::Runtime::new().unwrap();

        let created = rt.block_on(create_task(CreateTaskInput {
            task_type: "post".to_string(),
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
            post_id: None,
            priority: 0,
            scheduled_at: None,
            max_retries: 3,
        })).unwrap();

        rt.block_on(update_task_status(created.id.clone(), "failed".to_string(), None)).unwrap();

        let result = rt.block_on(retry_task(created.id.clone()));
        assert!(result.is_ok());

        let retried = result.unwrap();
        assert_eq!(retried.status, TaskStatus::Pending);
        assert_eq!(retried.retry_count, 1);

        let _ = rt.block_on(delete_task(created.id));
    }

    #[test]
    fn test_filter_by_status() {
        reset_tasks();

        let rt = tokio::runtime::Runtime::new().unwrap();

        let task1 = rt.block_on(create_task(CreateTaskInput {
            task_type: "post".to_string(),
            platform: "facebook".to_string(),
            account_id: "acc_1".to_string(),
            post_id: None,
            priority: 0,
            scheduled_at: None,
            max_retries: 3,
        })).unwrap();

        let task2 = rt.block_on(create_task(CreateTaskInput {
            task_type: "post".to_string(),
            platform: "instagram".to_string(),
            account_id: "acc_2".to_string(),
            post_id: None,
            priority: 0,
            scheduled_at: None,
            max_retries: 3,
        })).unwrap();

        rt.block_on(update_task_status(task2.id.clone(), "completed".to_string(), None)).unwrap();

        let filter = TaskFilter {
            status: Some("pending".to_string()),
            ..Default::default()
        };

        let result = rt.block_on(get_tasks(Some(filter))).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].status, TaskStatus::Pending);

        let _ = rt.block_on(delete_task(task1.id));
        let _ = rt.block_on(delete_task(task2.id));
    }
}
