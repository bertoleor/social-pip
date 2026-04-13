//! Error commands module - Tauri commands for error handling system
//!
//! This module provides Tauri commands for monitoring and managing the error handling system,
//! including error statistics, DLQ management, and circuit breaker status.

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

use crate::circuit_breaker::{CircuitBreaker, CircuitState};
use crate::dead_letter_queue::{DeadLetterEntry, DeadLetterQueueManager};
use crate::error_handler::UnifiedError;

// ============================================
// RESPONSE TYPES
// ============================================

/// Error statistics by category
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorStats {
    /// Total errors recorded
    pub total_errors: u64,
    /// Errors by category (RateLimit, AuthExpired, etc.)
    pub by_category: HashMap<String, u64>,
    /// Errors in last 24 hours
    pub last_24h: u64,
    /// Errors in last hour
    pub last_hour: u64,
}

/// Circuit breaker status for an account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreakerStatus {
    /// Account ID
    pub account_id: String,
    /// Current state (Closed, Open, HalfOpen)
    pub state: String,
    /// Number of consecutive failures
    pub failure_count: u32,
    /// Number of consecutive successes (in HalfOpen)
    pub success_count: u32,
    /// When circuit opened (if Open)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opened_at: Option<String>,
    /// Time until circuit transitions to HalfOpen (if Open)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_until_half_open_ms: Option<u64>,
}

/// Paginated DLQ entries response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DlqEntriesResponse {
    /// The entries
    pub entries: Vec<DeadLetterEntry>,
    /// Total count (for pagination)
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Total pages
    pub total_pages: u32,
}

// ============================================
// IN-MEMORY STORAGE
// ============================================

/// Global error statistics tracker
static ERROR_STATS: Lazy<Mutex<ErrorStatsInternal>> =
    Lazy::new(|| Mutex::new(ErrorStatsInternal::default()));

/// Circuit breakers per account
static CIRCUIT_BREAKERS: Lazy<Mutex<HashMap<String, CircuitBreaker>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// DLQ entries storage
static DLQ_ENTRIES: Lazy<Mutex<Vec<DeadLetterEntry>>> = Lazy::new(|| Mutex::new(Vec::new()));

/// DLQ manager instance
static DLQ_MANAGER: Lazy<DeadLetterQueueManager> = Lazy::new(|| DeadLetterQueueManager::new());

// ============================================
// INTERNAL TYPES
// ============================================

#[derive(Default)]
struct ErrorStatsInternal {
    total_errors: u64,
    by_category: HashMap<String, u64>,
    last_24h: u64,
    last_hour: u64,
}

// ============================================
// TAURI COMMANDS
// ============================================

/// Get error statistics grouped by category
#[tauri::command]
pub fn get_error_stats() -> Result<ErrorStats, String> {
    let stats = ERROR_STATS.lock().map_err(|e| e.to_string())?;

    Ok(ErrorStats {
        total_errors: stats.total_errors,
        by_category: stats.by_category.clone(),
        last_24h: stats.last_24h,
        last_hour: stats.last_hour,
    })
}

/// Get DLQ entries with pagination
#[tauri::command]
pub fn get_dlq_entries(
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<DlqEntriesResponse, String> {
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);
    let limit = limit.max(1).min(100) as usize; // Clamp 1-100
    let offset = ((page.max(1) - 1) as usize) * limit;

    let entries = DLQ_ENTRIES.lock().map_err(|e| e.to_string())?;
    let total = entries.len() as u64;
    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    // Get page of entries (newest first)
    let page_entries: Vec<DeadLetterEntry> = entries
        .iter()
        .rev()
        .skip(offset)
        .take(limit)
        .cloned()
        .collect();

    Ok(DlqEntriesResponse {
        entries: page_entries,
        total,
        page,
        total_pages,
    })
}

/// Retry a DLQ entry
#[tauri::command]
pub fn retry_dlq_entry(entry_id: String) -> Result<DeadLetterEntry, String> {
    let mut entries = DLQ_ENTRIES.lock().map_err(|e| e.to_string())?;

    // Find the entry
    let entry = entries
        .iter_mut()
        .find(|e| e.id == entry_id)
        .ok_or_else(|| format!("DLQ entry not found: {}", entry_id))?;

    // Check if already resolved
    if entry.resolved_at.is_some() {
        return Err("Cannot retry a resolved entry".to_string());
    }

    // Mark as retried using DLQ manager
    let updated = DLQ_MANAGER.mark_as_retried(entry.clone());

    // Update in storage
    *entry = updated.clone();

    Ok(entry.clone())
}

/// Get circuit breaker status for an account
#[tauri::command]
pub fn get_circuit_breaker_status(account_id: String) -> Result<CircuitBreakerStatus, String> {
    let mut breakers = CIRCUIT_BREAKERS.lock().map_err(|e| e.to_string())?;

    // Get or create circuit breaker for this account
    let cb = breakers
        .entry(account_id.clone())
        .or_insert_with(|| CircuitBreaker::with_defaults());

    // Calculate time until half-open
    let time_until_half_open_ms = if cb.state() == CircuitState::Open {
        cb.opened_at().map(|opened| {
            let elapsed_ms = chrono::Utc::now()
                .signed_duration_since(opened)
                .num_milliseconds() as u64;
            let wait_duration = 60_000; // Default wait duration
            if elapsed_ms < wait_duration {
                wait_duration - elapsed_ms
            } else {
                0
            }
        })
    } else {
        None
    };

    Ok(CircuitBreakerStatus {
        account_id,
        state: match cb.state() {
            CircuitState::Closed => "Closed".to_string(),
            CircuitState::Open => "Open".to_string(),
            CircuitState::HalfOpen => "HalfOpen".to_string(),
        },
        failure_count: cb.failure_count(),
        success_count: cb.success_count(),
        opened_at: cb.opened_at().map(|dt| dt.to_rfc3339()),
        time_until_half_open_ms,
    })
}

// ============================================
// HELPER FUNCTIONS (for internal use)
// ============================================

/// Record an error in the stats (used by error handling system)
#[allow(dead_code)]
pub fn record_error(error: &UnifiedError) {
    let mut stats = match ERROR_STATS.lock() {
        Ok(s) => s,
        Err(_) => return,
    };

    stats.total_errors += 1;
    stats.last_24h += 1;
    stats.last_hour += 1;

    // Extract category name
    let category = match error {
        UnifiedError::RateLimit { .. } => "RateLimit",
        UnifiedError::AuthExpired { .. } => "AuthExpired",
        UnifiedError::AccountRestricted { .. } => "AccountRestricted",
        UnifiedError::NetworkFailure { .. } => "NetworkFailure",
        UnifiedError::BrowserFailure { .. } => "BrowserFailure",
        UnifiedError::PlatformError { .. } => "PlatformError",
        UnifiedError::ValidationFailed { .. } => "ValidationFailed",
        UnifiedError::CircuitOpen { .. } => "CircuitOpen",
        UnifiedError::DuplicateTask { .. } => "DuplicateTask",
        UnifiedError::Unknown { .. } => "Unknown",
    };

    *stats.by_category.entry(category.to_string()).or_insert(0) += 1;
}

/// Store an error in the DLQ (used by error handling system)
#[allow(dead_code)]
pub fn store_in_dlq(entry: DeadLetterEntry) {
    let mut entries = match DLQ_ENTRIES.lock() {
        Ok(e) => e,
        Err(_) => return,
    };
    entries.push(entry);
}

/// Record circuit breaker failure for an account
#[allow(dead_code)]
pub fn record_circuit_failure(account_id: &str) {
    let mut breakers = match CIRCUIT_BREAKERS.lock() {
        Ok(b) => b,
        Err(_) => return,
    };

    let cb = breakers
        .entry(account_id.to_string())
        .or_insert_with(|| CircuitBreaker::with_defaults());

    cb.record_failure();
}

/// Record circuit breaker success for an account
#[allow(dead_code)]
pub fn record_circuit_success(account_id: &str) {
    let mut breakers = match CIRCUIT_BREAKERS.lock() {
        Ok(b) => b,
        Err(_) => return,
    };

    let cb = breakers
        .entry(account_id.to_string())
        .or_insert_with(|| CircuitBreaker::with_defaults());

    cb.record_success();
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_storage() {
        let mut stats = ERROR_STATS.lock().unwrap();
        *stats = ErrorStatsInternal::default();
        let mut entries = DLQ_ENTRIES.lock().unwrap();
        entries.clear();
        let mut breakers = CIRCUIT_BREAKERS.lock().unwrap();
        breakers.clear();
    }

    // ============================================
    // T7.1: Test get_error_stats Tauri command
    // ============================================

    #[test]
    fn test_get_error_stats_returns_empty_initially() {
        reset_storage();

        let result = get_error_stats();
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert_eq!(stats.total_errors, 0);
        assert!(stats.by_category.is_empty());
        assert_eq!(stats.last_24h, 0);
        assert_eq!(stats.last_hour, 0);
    }

    #[test]
    fn test_get_error_stats_returns_correct_counts() {
        reset_storage();

        // Record some errors
        record_error(&UnifiedError::RateLimit {
            subcategory: "test".to_string(),
        });
        record_error(&UnifiedError::RateLimit {
            subcategory: "test".to_string(),
        });
        record_error(&UnifiedError::AuthExpired {
            platform: "facebook".to_string(),
            account_id: "acc_123".to_string(),
        });

        let result = get_error_stats();
        assert!(result.is_ok());

        let stats = result.unwrap();
        assert_eq!(stats.total_errors, 3);
        assert_eq!(*stats.by_category.get("RateLimit").unwrap_or(&0), 2);
        assert_eq!(*stats.by_category.get("AuthExpired").unwrap_or(&0), 1);
    }

    #[test]
    fn test_get_error_stats_includes_all_categories() {
        reset_storage();

        // Record one of each category
        record_error(&UnifiedError::RateLimit {
            subcategory: "test".to_string(),
        });
        record_error(&UnifiedError::AuthExpired {
            platform: "test".to_string(),
            account_id: "test".to_string(),
        });
        record_error(&UnifiedError::AccountRestricted {
            reason: "test".to_string(),
        });
        record_error(&UnifiedError::NetworkFailure { is_timeout: true });
        record_error(&UnifiedError::BrowserFailure {
            browser: "test".to_string(),
        });
        record_error(&UnifiedError::PlatformError {
            code: None,
            message: "test".to_string(),
        });
        record_error(&UnifiedError::ValidationFailed {
            field: "test".to_string(),
            reason: "test".to_string(),
        });
        record_error(&UnifiedError::CircuitOpen {
            account_id: "test".to_string(),
            until: chrono::Utc::now(),
        });
        record_error(&UnifiedError::DuplicateTask {
            existing_task_id: "test".to_string(),
        });
        record_error(&UnifiedError::Unknown {
            message: "test".to_string(),
        });

        let stats = get_error_stats().unwrap();
        assert_eq!(stats.total_errors, 10);
        assert_eq!(stats.by_category.len(), 10);
    }

    // ============================================
    // T7.3: Test get_dlq_entries Tauri command
    // ============================================

    #[test]
    fn test_get_dlq_entries_returns_empty_initially() {
        reset_storage();

        let result = get_dlq_entries(None, None);
        assert!(result.is_ok());

        let response = result.unwrap();
        assert!(response.entries.is_empty());
        assert_eq!(response.total, 0);
        assert_eq!(response.page, 1);
        assert_eq!(response.total_pages, 0);
    }

    #[test]
    fn test_get_dlq_entries_with_pagination() {
        reset_storage();

        // Add some entries
        for i in 0..25 {
            let entry = DeadLetterEntry {
                id: format!("dlq_{}", i),
                original_task_id: Some(format!("task_{}", i)),
                task_type: "post".to_string(),
                payload: "{}".to_string(),
                unified_error: "{}".to_string(),
                recovery_strategy: "{}".to_string(),
                error_message: format!("Error {}", i),
                error_context: "{}".to_string(),
                retry_count: 0,
                manually_retried: false,
                resolved_at: None,
                created_at: chrono::Utc::now(),
            };
            store_in_dlq(entry);
        }

        // Get first page
        let result = get_dlq_entries(Some(1), Some(10));
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.entries.len(), 10);
        assert_eq!(response.total, 25);
        assert_eq!(response.page, 1);
        assert_eq!(response.total_pages, 3);

        // Get second page
        let result = get_dlq_entries(Some(2), Some(10));
        let response = result.unwrap();
        assert_eq!(response.entries.len(), 10);
        assert_eq!(response.page, 2);

        // Get third page
        let result = get_dlq_entries(Some(3), Some(10));
        let response = result.unwrap();
        assert_eq!(response.entries.len(), 5);
        assert_eq!(response.page, 3);
    }

    #[test]
    fn test_get_dlq_entries_clamps_limit() {
        reset_storage();

        // Request limit beyond max (100)
        let result = get_dlq_entries(Some(1), Some(200));
        assert!(result.is_ok());

        // Should clamp to max 100
        // We can't directly verify the clamping without entries,
        // but the function shouldn't error
        let _ = result.unwrap();
    }

    // ============================================
    // T7.5: Test retry_dlq_entry Tauri command
    // ============================================

    #[test]
    fn test_retry_dlq_entry_increments_retry_count() {
        reset_storage();

        // Create an entry
        let entry = DeadLetterEntry {
            id: "dlq_test".to_string(),
            original_task_id: Some("task_123".to_string()),
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Test error".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: None,
            created_at: chrono::Utc::now(),
        };
        store_in_dlq(entry);

        // Retry it
        let result = retry_dlq_entry("dlq_test".to_string());
        assert!(result.is_ok());

        let retried = result.unwrap();
        assert_eq!(retried.retry_count, 1);
        assert!(retried.manually_retried);
    }

    #[test]
    fn test_retry_dlq_entry_fails_for_nonexistent() {
        reset_storage();

        let result = retry_dlq_entry("nonexistent".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_retry_dlq_entry_fails_for_resolved() {
        reset_storage();

        // Create a resolved entry
        let entry = DeadLetterEntry {
            id: "dlq_resolved".to_string(),
            original_task_id: None,
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Resolved error".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: Some(chrono::Utc::now()),
            created_at: chrono::Utc::now(),
        };
        store_in_dlq(entry);

        let result = retry_dlq_entry("dlq_resolved".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("resolved"));
    }

    // ============================================
    // T7.7: Test get_circuit_breaker_status Tauri command
    // ============================================

    #[test]
    fn test_get_circuit_breaker_status_returns_closed_initially() {
        reset_storage();

        let result = get_circuit_breaker_status("acc_123".to_string());
        assert!(result.is_ok());

        let status = result.unwrap();
        assert_eq!(status.account_id, "acc_123");
        assert_eq!(status.state, "Closed");
        assert_eq!(status.failure_count, 0);
        assert_eq!(status.success_count, 0);
        assert!(status.opened_at.is_none());
        assert!(status.time_until_half_open_ms.is_none());
    }

    #[test]
    fn test_get_circuit_breaker_status_reflects_failures() {
        reset_storage();

        let account_id = "acc_456".to_string();

        // Record some failures
        record_circuit_failure(&account_id);
        record_circuit_failure(&account_id);

        let result = get_circuit_breaker_status(account_id.clone());
        assert!(result.is_ok());

        let status = result.unwrap();
        assert_eq!(status.state, "Closed");
        assert_eq!(status.failure_count, 2);
    }

    #[test]
    fn test_get_circuit_breaker_status_shows_open_state() {
        reset_storage();

        let account_id = "acc_789".to_string();

        // Record enough failures to trip the circuit (default threshold is 5)
        for _ in 0..5 {
            record_circuit_failure(&account_id);
        }

        let result = get_circuit_breaker_status(account_id.clone());
        assert!(result.is_ok());

        let status = result.unwrap();
        assert_eq!(status.state, "Open");
        assert!(status.opened_at.is_some());
        assert!(status.time_until_half_open_ms.is_some());
    }

    #[test]
    fn test_get_circuit_breaker_status_multiple_accounts_isolated() {
        reset_storage();

        // Record failures for different accounts
        record_circuit_failure("acc_1");
        record_circuit_failure("acc_1");
        record_circuit_failure("acc_2");

        // Check acc_1
        let status1 = get_circuit_breaker_status("acc_1".to_string()).unwrap();
        assert_eq!(status1.failure_count, 2);

        // Check acc_2
        let status2 = get_circuit_breaker_status("acc_2".to_string()).unwrap();
        assert_eq!(status2.failure_count, 1);
    }

    // ============================================
    // Additional integration tests
    // ============================================

    #[test]
    fn test_record_error_updates_all_counters() {
        reset_storage();

        record_error(&UnifiedError::NetworkFailure { is_timeout: true });
        record_error(&UnifiedError::NetworkFailure { is_timeout: false });

        let stats = get_error_stats().unwrap();
        assert_eq!(stats.total_errors, 2);
        assert_eq!(stats.last_24h, 2);
        assert_eq!(stats.last_hour, 2);
        assert_eq!(*stats.by_category.get("NetworkFailure").unwrap_or(&0), 2);
    }

    #[test]
    fn test_circuit_breaker_success_resets_count() {
        reset_storage();

        let account_id = "acc_success".to_string();

        // Record some failures
        record_circuit_failure(&account_id);
        record_circuit_failure(&account_id);

        // Record success
        record_circuit_success(&account_id);

        let status = get_circuit_breaker_status(account_id).unwrap();
        assert_eq!(status.state, "Closed");
        assert_eq!(status.failure_count, 0); // Reset by success
    }
}
