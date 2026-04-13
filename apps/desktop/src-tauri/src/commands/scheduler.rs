use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

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

impl Default for ScheduleStatus {
    fn default() -> Self {
        Self::Pending
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Schedule {
    pub id: String,
    pub scheduled_at: String,
    pub variance: i32,
    pub status: String,
    pub cron_expression: Option<String>,
    pub attempts: i32,
    pub max_attempts: i32,
    pub result: Option<String>,
    pub error_message: Option<String>,
    pub post_id: String,
    pub account_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScheduleFilter {
    pub account_id: Option<String>,
    pub status: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateScheduleInput {
    pub post_id: String,
    pub scheduled_at: String,
    pub variance: Option<i32>,
    pub cron_expression: Option<String>,
    pub max_attempts: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateScheduleInput {
    pub scheduled_at: Option<String>,
    pub variance: Option<i32>,
}

static SCHEDULES: Lazy<Mutex<HashMap<String, Schedule>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

fn generate_id() -> String {
    format!("sched_{}", chrono::Utc::now().timestamp_millis())
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn matches_filter(schedule: &Schedule, filter: &ScheduleFilter) -> bool {
    if let Some(ref account_id) = filter.account_id {
        if &schedule.account_id != account_id {
            return false;
        }
    }

    if let Some(ref status) = filter.status {
        if schedule.status != status.to_uppercase() {
            return false;
        }
    }

    if let Some(ref from) = filter.from {
        if &schedule.scheduled_at < from {
            return false;
        }
    }

    if let Some(ref to) = filter.to {
        if &schedule.scheduled_at > to {
            return false;
        }
    }

    true
}

#[tauri::command]
pub async fn get_schedules(filter: Option<ScheduleFilter>) -> Result<Vec<Schedule>, String> {
    let schedules = SCHEDULES.lock().map_err(|e| e.to_string())?;
    let filter = filter.unwrap_or_default();

    let mut result: Vec<Schedule> = schedules
        .values()
        .filter(|s| matches_filter(s, &filter))
        .cloned()
        .collect();

    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    let offset = filter.offset.unwrap_or(0) as usize;
    let limit = filter.limit.unwrap_or(100) as usize;

    let result: Vec<Schedule> = result
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();

    Ok(result)
}

#[tauri::command]
pub async fn get_schedule(id: String) -> Result<Option<Schedule>, String> {
    let schedules = SCHEDULES.lock().map_err(|e| e.to_string())?;
    Ok(schedules.get(&id).cloned())
}

#[tauri::command]
pub async fn create_schedule(data: CreateScheduleInput) -> Result<Schedule, String> {
    if data.post_id.trim().is_empty() {
        return Err("Post ID is required".to_string());
    }

    if data.scheduled_at.trim().is_empty() {
        return Err("Scheduled time is required".to_string());
    }

    let now = now_iso();
    let id = generate_id();

    let schedule = Schedule {
        id: id.clone(),
        scheduled_at: data.scheduled_at.clone(),
        variance: data.variance.unwrap_or(15),
        status: "PENDING".to_string(),
        cron_expression: data.cron_expression.filter(|c| !c.is_empty()),
        attempts: 0,
        max_attempts: data.max_attempts.unwrap_or(3),
        result: None,
        error_message: None,
        post_id: data.post_id.clone(),
        account_id: "pending".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };

    let mut schedules = SCHEDULES.lock().map_err(|e| e.to_string())?;
    schedules.insert(id, schedule.clone());

    Ok(schedule)
}

#[tauri::command]
pub async fn update_schedule(id: String, data: UpdateScheduleInput) -> Result<Schedule, String> {
    let mut schedules = SCHEDULES.lock().map_err(|e| e.to_string())?;

    let schedule = schedules.get_mut(&id)
        .ok_or_else(|| format!("Schedule not found: {}", id))?;

    if let Some(ref scheduled_at) = data.scheduled_at {
        if scheduled_at.trim().is_empty() {
            return Err("Scheduled time cannot be empty".to_string());
        }
        schedule.scheduled_at = scheduled_at.clone();
    }

    if let Some(variance) = data.variance {
        schedule.variance = variance;
    }

    schedule.updated_at = now_iso();

    Ok(schedule.clone())
}

#[tauri::command]
pub async fn cancel_schedule(id: String) -> Result<(), String> {
    let mut schedules = SCHEDULES.lock().map_err(|e| e.to_string())?;

    if let Some(schedule) = schedules.get_mut(&id) {
        schedule.status = "CANCELLED".to_string();
        schedule.updated_at = now_iso();
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_schedule(id: String) -> Result<(), String> {
    let mut schedules = SCHEDULES.lock().map_err(|e| e.to_string())?;
    schedules.remove(&id);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_schedules() {
        let mut schedules = SCHEDULES.lock().unwrap();
        schedules.clear();
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
    }

    #[test]
    fn test_get_schedules_returns_empty_when_none() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(get_schedules(None));
        assert!(result.is_ok());
        let schedules = result.unwrap();
        assert!(schedules.is_empty());
    }

    #[test]
    fn test_create_schedule_persists() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let result = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "post_123".to_string(),
            scheduled_at: "2024-12-31T10:00:00Z".to_string(),
            variance: Some(15),
            cron_expression: None,
            max_attempts: Some(3),
        }));

        assert!(result.is_ok());
        let schedule = result.unwrap();
        assert!(schedule.id.starts_with("sched_"));
        assert_eq!(schedule.post_id, "post_123");
        assert_eq!(schedule.status, "PENDING");
        assert_eq!(schedule.variance, 15);
        assert_eq!(schedule.max_attempts, 3);

        let _ = rt.block_on(delete_schedule(schedule.id));
    }

    #[test]
    fn test_create_schedule_validates_post_id() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let result = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "".to_string(),
            scheduled_at: "2024-12-31T10:00:00Z".to_string(),
            variance: None,
            cron_expression: None,
            max_attempts: None,
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Post ID is required"));
    }

    #[test]
    fn test_create_schedule_validates_scheduled_at() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let result = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "post_123".to_string(),
            scheduled_at: "".to_string(),
            variance: None,
            cron_expression: None,
            max_attempts: None,
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Scheduled time is required"));
    }

    #[test]
    fn test_update_schedule_modifies_existing() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let created = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "post_123".to_string(),
            scheduled_at: "2024-12-31T10:00:00Z".to_string(),
            variance: Some(15),
            cron_expression: None,
            max_attempts: None,
        })).unwrap();

        let result = rt.block_on(update_schedule(created.id.clone(), UpdateScheduleInput {
            scheduled_at: Some("2025-01-01T12:00:00Z".to_string()),
            variance: Some(30),
        }));

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.scheduled_at, "2025-01-01T12:00:00Z");
        assert_eq!(updated.variance, 30);
        assert_eq!(updated.id, created.id);

        let _ = rt.block_on(delete_schedule(created.id));
    }

    #[test]
    fn test_update_schedule_returns_error_for_nonexistent() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let result = rt.block_on(update_schedule("nonexistent".to_string(), UpdateScheduleInput {
            scheduled_at: Some("2025-01-01T12:00:00Z".to_string()),
            variance: None,
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("not found"));
    }

    #[test]
    fn test_cancel_schedule_sets_status() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let created = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "post_123".to_string(),
            scheduled_at: "2024-12-31T10:00:00Z".to_string(),
            variance: None,
            cron_expression: None,
            max_attempts: None,
        })).unwrap();

        let result = rt.block_on(cancel_schedule(created.id.clone()));
        assert!(result.is_ok());

        let schedule = rt.block_on(get_schedule(created.id.clone()))
            .unwrap()
            .unwrap();
        assert_eq!(schedule.status, "CANCELLED");

        let _ = rt.block_on(delete_schedule(created.id));
    }

    #[test]
    fn test_delete_schedule_removes_from_storage() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let created = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "post_123".to_string(),
            scheduled_at: "2024-12-31T10:00:00Z".to_string(),
            variance: None,
            cron_expression: None,
            max_attempts: None,
        })).unwrap();

        let result = rt.block_on(delete_schedule(created.id.clone()));
        assert!(result.is_ok());

        let schedule = rt.block_on(get_schedule(created.id.clone()))
            .unwrap();
        assert!(schedule.is_none());
    }

    #[test]
    fn test_get_schedules_with_filter() {
        reset_schedules();
        let rt = tokio::runtime::Runtime::new().unwrap();

        let _ = rt.block_on(create_schedule(CreateScheduleInput {
            post_id: "post_1".to_string(),
            scheduled_at: "2024-12-31T10:00:00Z".to_string(),
            variance: None,
            cron_expression: None,
            max_attempts: None,
        }));

        let filter = ScheduleFilter {
            status: Some("PENDING".to_string()),
            ..Default::default()
        };

        let result = rt.block_on(get_schedules(Some(filter)));
        assert!(result.is_ok());
        let schedules = result.unwrap();
        assert!(!schedules.is_empty());

        for schedule in &schedules {
            let _ = rt.block_on(delete_schedule(schedule.id.clone()));
        }
    }
}

impl Default for CreateScheduleInput {
    fn default() -> Self {
        Self {
            post_id: String::new(),
            scheduled_at: String::new(),
            variance: Some(15),
            cron_expression: None,
            max_attempts: Some(3),
        }
    }
}
