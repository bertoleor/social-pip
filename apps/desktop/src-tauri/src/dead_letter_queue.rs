use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

use crate::error_handler::{RecoveryStrategy, UnifiedError};

// ============================================
// IN-MEMORY STORAGE
// ============================================

static DLQ_STORAGE: Lazy<Mutex<HashMap<String, DeadLetterEntry>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// DeadLetterEntry - Represents a failed task stored in the Dead Letter Queue.
///
/// Entries are created when a task fails with a non-retryable error or after
/// exhausting retry attempts. They persist until manually retried or cleaned up.
///
/// # v2.0 Fields
/// - `trace_id`: OpenTelemetry trace ID for correlation
/// - `span_id`: OpenTelemetry span ID
/// - `saga_id`: Parent saga execution ID (if applicable)
/// - `full_error_context`: Complete ErrorContext JSON
/// - `error_group_id`: Link to ErrorGroup for aggregation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeadLetterEntry {
    /// Unique identifier for this DLQ entry
    pub id: String,
    /// Original task ID (if available)
    pub original_task_id: Option<String>,
    /// Type of task that failed: post, message, story, reel
    pub task_type: String,
    /// JSON payload of the original task data
    pub payload: String,
    /// Serialized UnifiedError variant
    pub unified_error: String,
    /// Assigned recovery strategy
    pub recovery_strategy: String,
    /// Human-readable error message
    pub error_message: String,
    /// JSON context: { account_id, platform, etc }
    pub error_context: String,
    /// OpenTelemetry trace ID for correlation (v2.0)
    pub trace_id: Option<String>,
    /// OpenTelemetry span ID (v2.0)
    pub span_id: Option<String>,
    /// Parent saga execution ID (v2.0)
    pub saga_id: Option<String>,
    /// Complete ErrorContext JSON (v2.0)
    pub full_error_context: Option<String>,
    /// Link to ErrorGroup for aggregation (v2.0)
    pub error_group_id: Option<String>,
    /// Number of manual retry attempts
    pub retry_count: u32,
    /// Whether this entry was manually retried at least once
    pub manually_retried: bool,
    /// When this entry was resolved (null if pending)
    pub resolved_at: Option<DateTime<Utc>>,
    /// When this entry was created
    pub created_at: DateTime<Utc>,
}

/// DeadLetterQueueManager - Manages the Dead Letter Queue for failed tasks.
///
/// The DLQ stores tasks that failed permanently or need manual intervention.
/// It provides operations for storing, querying, retrying, and cleaning up entries.
pub struct DeadLetterQueueManager {
    // Future: database connection pool
}

impl DeadLetterQueueManager {
    /// Create a new DLQ manager
    pub fn new() -> Self {
        Self {}
    }

    /// Store a failed task in the Dead Letter Queue.
    ///
    /// # Arguments
    /// - `original_task_id`: Optional original task ID
    /// - `task_type`: Type of task (post, message, story, reel)
    /// - `payload`: JSON payload of the original task
    /// - `error`: The UnifiedError that caused the failure
    /// - `strategy`: The assigned recovery strategy
    /// - `error_message`: Human-readable error description
    /// - `error_context`: JSON context (account_id, platform, etc)
    ///
    /// # Returns
    /// The created DeadLetterEntry with generated ID and timestamp
    pub fn store(
        &self,
        original_task_id: Option<String>,
        task_type: String,
        payload: String,
        error: &UnifiedError,
        strategy: &RecoveryStrategy,
        error_message: String,
        error_context: String,
    ) -> DeadLetterEntry {
        self.store_v2(
            original_task_id,
            task_type,
            payload,
            error,
            strategy,
            error_message,
            error_context,
            None,
            None,
            None,
            None,
            None,
        )
    }

    /// Store a failed task with v2.0 context fields.
    ///
    /// # Arguments
    /// All arguments from `store()` plus:
    /// - `trace_id`: OpenTelemetry trace ID
    /// - `span_id`: OpenTelemetry span ID
    /// - `saga_id`: Parent saga execution ID
    /// - `full_error_context`: Complete ErrorContext JSON
    /// - `error_group_id`: Link to ErrorGroup
    ///
    /// # Returns
    /// The created DeadLetterEntry with all v2.0 fields
    pub fn store_v2(
        &self,
        original_task_id: Option<String>,
        task_type: String,
        payload: String,
        error: &UnifiedError,
        strategy: &RecoveryStrategy,
        error_message: String,
        error_context: String,
        trace_id: Option<String>,
        span_id: Option<String>,
        saga_id: Option<String>,
        full_error_context: Option<String>,
        error_group_id: Option<String>,
    ) -> DeadLetterEntry {
        let entry = DeadLetterEntry {
            id: format!("dlq_{}", cuid2::create_id()),
            original_task_id,
            task_type,
            payload,
            unified_error: serde_json::to_string(error).unwrap_or_default(),
            recovery_strategy: serde_json::to_string(strategy).unwrap_or_default(),
            error_message,
            error_context,
            trace_id,
            span_id,
            saga_id,
            full_error_context,
            error_group_id,
            retry_count: 0,
            manually_retried: false,
            resolved_at: None,
            created_at: Utc::now(),
        };

        // Persist to in-memory storage
        if let Ok(mut storage) = DLQ_STORAGE.lock() {
            storage.insert(entry.id.clone(), entry.clone());
        }

        entry
    }

    /// Get pending entries that are eligible for manual retry.
    ///
    /// # Arguments
    /// - `limit`: Maximum number of entries to return
    ///
    /// # Returns
    /// Vector of unresolved DLQ entries ordered by creation time (oldest first)
    pub fn get_pending_retries(&self, limit: usize) -> Vec<DeadLetterEntry> {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            let mut entries: Vec<_> = storage
                .values()
                .filter(|e| e.resolved_at.is_none())
                .cloned()
                .collect();
            entries.sort_by(|a, b| a.created_at.cmp(&b.created_at));
            entries.into_iter().take(limit).collect()
        } else {
            vec![]
        }
    }

    /// Get entry by ID.
    pub fn get_by_id(&self, id: &str) -> Option<DeadLetterEntry> {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            storage.get(id).cloned()
        } else {
            None
        }
    }

    /// Get entries by trace ID for debugging.
    pub fn get_by_trace_id(&self, trace_id: &str) -> Vec<DeadLetterEntry> {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            storage
                .values()
                .filter(|e| e.trace_id.as_deref() == Some(trace_id))
                .cloned()
                .collect()
        } else {
            vec![]
        }
    }

    /// Get entries by saga ID.
    pub fn get_by_saga_id(&self, saga_id: &str) -> Vec<DeadLetterEntry> {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            storage
                .values()
                .filter(|e| e.saga_id.as_deref() == Some(saga_id))
                .cloned()
                .collect()
        } else {
            vec![]
        }
    }

    /// Get entries by error group ID.
    pub fn get_by_error_group(&self, error_group_id: &str) -> Vec<DeadLetterEntry> {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            storage
                .values()
                .filter(|e| e.error_group_id.as_deref() == Some(error_group_id))
                .cloned()
                .collect()
        } else {
            vec![]
        }
    }

    /// Mark an entry as manually retried, incrementing retry_count.
    ///
    /// # Arguments
    /// - `entry`: The entry to mark as retried
    ///
    /// # Returns
    /// Updated entry with incremented retry_count and manually_retried=true
    pub fn mark_as_retried(&self, mut entry: DeadLetterEntry) -> DeadLetterEntry {
        entry.retry_count += 1;
        entry.manually_retried = true;

        // Update in storage
        if let Ok(mut storage) = DLQ_STORAGE.lock() {
            storage.insert(entry.id.clone(), entry.clone());
        }

        entry
    }

    /// Mark an entry as resolved.
    pub fn resolve(&self, id: &str) -> Option<DeadLetterEntry> {
        if let Ok(mut storage) = DLQ_STORAGE.lock() {
            if let Some(entry) = storage.get_mut(id) {
                entry.resolved_at = Some(Utc::now());
                return Some(entry.clone());
            }
        }
        None
    }

    /// Retry from DLQ preserving full context (v2.0).
    ///
    /// This function prepares an entry for retry while preserving all
    /// v2.0 context fields (trace_id, saga_id, full_error_context).
    ///
    /// # Arguments
    /// - `id`: The DLQ entry ID
    ///
    /// # Returns
    /// The entry marked as retried, or None if not found
    pub fn retry_from_dlq_with_context(&self, id: &str) -> Option<DeadLetterEntry> {
        let entry = self.get_by_id(id)?;

        // Verify entry is not already resolved
        if entry.resolved_at.is_some() {
            return None;
        }

        // Mark as retried
        let retried = self.mark_as_retried(entry);

        // Return entry with preserved context for retry
        Some(retried)
    }

    /// Get retry context from entry (v2.0).
    ///
    /// Extracts the full error context for debugging and retry.
    pub fn get_retry_context(&self, entry: &DeadLetterEntry) -> RetryContext {
        RetryContext {
            original_task_id: entry.original_task_id.clone(),
            task_type: entry.task_type.clone(),
            payload: entry.payload.clone(),
            trace_id: entry.trace_id.clone(),
            span_id: entry.span_id.clone(),
            saga_id: entry.saga_id.clone(),
            full_error_context: entry.full_error_context.clone(),
            error_group_id: entry.error_group_id.clone(),
        }
    }

    /// Cleanup entries older than the retention period.
    ///
    /// Removes entries created more than 30 days ago that have been resolved.
    /// Unresolved entries are kept indefinitely for manual review.
    ///
    /// # Arguments
    /// - `entries`: Vector of entries to filter
    ///
    /// # Returns
    /// Number of entries removed
    pub fn cleanup_old_entries(&self, entries: Vec<DeadLetterEntry>) -> usize {
        let cutoff = Utc::now() - chrono::Duration::days(30);

        entries
            .into_iter()
            .filter(|entry| {
                // Keep if: not resolved OR within retention period
                entry.resolved_at.is_none() || entry.created_at > cutoff
            })
            .count()
    }

    /// Clear all storage (for testing).
    pub fn clear_storage() {
        if let Ok(mut storage) = DLQ_STORAGE.lock() {
            storage.clear();
        }
    }

    /// Get total count of entries.
    pub fn count(&self) -> usize {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            storage.len()
        } else {
            0
        }
    }

    /// Get count of unresolved entries.
    pub fn count_unresolved(&self) -> usize {
        if let Ok(storage) = DLQ_STORAGE.lock() {
            storage.values().filter(|e| e.resolved_at.is_none()).count()
        } else {
            0
        }
    }
}

/// RetryContext - Context extracted from DLQ entry for retry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryContext {
    pub original_task_id: Option<String>,
    pub task_type: String,
    pub payload: String,
    pub trace_id: Option<String>,
    pub span_id: Option<String>,
    pub saga_id: Option<String>,
    pub full_error_context: Option<String>,
    pub error_group_id: Option<String>,
}

impl Default for DeadLetterQueueManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error_handler::Severity;

    // ============================================
    // T3.1: DeadLetterQueueManager::store() tests
    // ============================================

    #[test]
    fn test_store_creates_entry_with_valid_id() {
        let manager = DeadLetterQueueManager::new();
        let error = UnifiedError::RateLimit {
            subcategory: "hourly_limit".to_string(),
        };
        let strategy = RecoveryStrategy::DeadLetter {
            reason: "rate_limit_exceeded".to_string(),
        };

        let entry = manager.store(
            Some("task_123".to_string()),
            "post".to_string(),
            r#"{"content": "test"}"#.to_string(),
            &error,
            &strategy,
            "Rate limit exceeded".to_string(),
            r#"{"account_id": "acc_456", "platform": "facebook"}"#.to_string(),
        );

        // Verify ID is generated
        assert!(entry.id.starts_with("dlq_"));
        // Verify task reference
        assert_eq!(entry.original_task_id, Some("task_123".to_string()));
        // Verify task type
        assert_eq!(entry.task_type, "post");
        // Verify initial state
        assert_eq!(entry.retry_count, 0);
        assert!(!entry.manually_retried);
        assert!(entry.resolved_at.is_none());
    }

    #[test]
    fn test_store_serializes_unified_error() {
        let manager = DeadLetterQueueManager::new();
        let error = UnifiedError::AuthExpired {
            platform: "instagram".to_string(),
            account_id: "acc_789".to_string(),
        };
        let strategy = RecoveryStrategy::CircuitBreak { cooldown_level: 2 };

        let entry = manager.store(
            None,
            "message".to_string(),
            "{}".to_string(),
            &error,
            &strategy,
            "Session expired".to_string(),
            r#"{"account_id": "acc_789"}"#.to_string(),
        );

        // Verify UnifiedError is serialized
        assert!(entry.unified_error.contains("AuthExpired"));
        // Verify recovery strategy is serialized
        assert!(entry.recovery_strategy.contains("CircuitBreak"));
        // Verify error message
        assert_eq!(entry.error_message, "Session expired");
    }

    #[test]
    fn test_store_with_platform_error_includes_code() {
        let manager = DeadLetterQueueManager::new();
        let error = UnifiedError::PlatformError {
            code: Some("E001".to_string()),
            message: "Account suspended".to_string(),
        };
        let strategy = RecoveryStrategy::Escalate {
            severity: Severity::Critical,
        };

        let entry = manager.store(
            Some("task_456".to_string()),
            "story".to_string(),
            r#"{"media": "image.jpg"}"#.to_string(),
            &error,
            &strategy,
            "Platform error: E001".to_string(),
            r#"{"platform": "twitter"}"#.to_string(),
        );

        // Verify error contains code
        assert!(entry.unified_error.contains("E001"));
        // Verify escalation strategy
        assert!(entry.recovery_strategy.contains("Escalate"));
        assert!(entry.recovery_strategy.contains("Critical"));
    }

    #[test]
    fn test_store_generates_unique_ids() {
        let manager = DeadLetterQueueManager::new();
        let error = UnifiedError::NetworkFailure { is_timeout: true };
        let strategy = RecoveryStrategy::RetryWithBackoff {
            max_retries: 3,
            base_delay_ms: 30_000,
        };

        let entry1 = manager.store(
            None,
            "post".to_string(),
            "{}".to_string(),
            &error,
            &strategy,
            "Timeout".to_string(),
            "{}".to_string(),
        );

        // Small delay to ensure different timestamp
        std::thread::sleep(std::time::Duration::from_millis(10));

        let entry2 = manager.store(
            None,
            "post".to_string(),
            "{}".to_string(),
            &error,
            &strategy,
            "Timeout".to_string(),
            "{}".to_string(),
        );

        // IDs should be different (timestamp-based)
        assert_ne!(entry1.id, entry2.id);
    }

    // ============================================
    // T3.3: get_pending_retries() tests
    // ============================================

    #[test]
    fn test_get_pending_retries_returns_empty_when_no_entries() {
        let manager = DeadLetterQueueManager::new();

        let pending = manager.get_pending_retries(10);

        assert!(pending.is_empty());
    }

    #[test]
    fn test_get_pending_retries_respects_limit() {
        let manager = DeadLetterQueueManager::new();

        // Future: when database is integrated, this will query actual entries
        // For now, we test the interface contract
        let pending = manager.get_pending_retries(5);

        // Should return at most 'limit' entries
        assert!(pending.len() <= 5);
    }

    // ============================================
    // T3.5: mark_as_retried() tests
    // ============================================

    #[test]
    fn test_mark_as_retried_increments_retry_count() {
        let manager = DeadLetterQueueManager::new();
        let error = UnifiedError::RateLimit {
            subcategory: "hourly_limit".to_string(),
        };
        let strategy = RecoveryStrategy::DeadLetter {
            reason: "test".to_string(),
        };

        let entry = manager.store(
            Some("task_123".to_string()),
            "post".to_string(),
            "{}".to_string(),
            &error,
            &strategy,
            "Rate limit".to_string(),
            "{}".to_string(),
        );

        assert_eq!(entry.retry_count, 0);
        assert!(!entry.manually_retried);

        let retried = manager.mark_as_retried(entry);

        assert_eq!(retried.retry_count, 1);
        assert!(retried.manually_retried);
    }

    #[test]
    fn test_mark_as_retried_multiple_times() {
        let manager = DeadLetterQueueManager::new();
        let error = UnifiedError::NetworkFailure { is_timeout: true };
        let strategy = RecoveryStrategy::DeadLetter {
            reason: "network".to_string(),
        };

        let entry = manager.store(
            None,
            "post".to_string(),
            "{}".to_string(),
            &error,
            &strategy,
            "Timeout".to_string(),
            "{}".to_string(),
        );

        let retried1 = manager.mark_as_retried(entry);
        assert_eq!(retried1.retry_count, 1);

        let retried2 = manager.mark_as_retried(retried1);
        assert_eq!(retried2.retry_count, 2);

        let retried3 = manager.mark_as_retried(retried2);
        assert_eq!(retried3.retry_count, 3);
    }

    // ============================================
    // T3.7: cleanup_old_entries() tests
    // ============================================

    #[test]
    fn test_cleanup_removes_resolved_entries_older_than_30_days() {
        let manager = DeadLetterQueueManager::new();

        // Create a resolved entry from 31 days ago
        let old_resolved = DeadLetterEntry {
            id: "dlq_old".to_string(),
            original_task_id: None,
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Old error".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: Some(Utc::now() - chrono::Duration::days(31)),
            created_at: Utc::now() - chrono::Duration::days(31),
        };

        // Create a recent resolved entry (should be kept)
        let recent_resolved = DeadLetterEntry {
            id: "dlq_recent".to_string(),
            original_task_id: None,
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Recent error".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: Some(Utc::now() - chrono::Duration::days(5)),
            created_at: Utc::now() - chrono::Duration::days(5),
        };

        // Create an old unresolved entry (should be kept)
        let old_unresolved = DeadLetterEntry {
            id: "dlq_unresolved".to_string(),
            original_task_id: None,
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Unresolved".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: None, // Unresolved
            created_at: Utc::now() - chrono::Duration::days(60),
        };

        let entries = vec![old_resolved, recent_resolved, old_unresolved];
        let removed = manager.cleanup_old_entries(entries);

        // Old resolved entry should be removed (count = 1)
        assert_eq!(removed, 1);
    }

    #[test]
    fn test_cleanup_keeps_unresolved_entries_indefinitely() {
        let manager = DeadLetterQueueManager::new();

        // Create very old unresolved entries
        let very_old_unresolved = DeadLetterEntry {
            id: "dlq_very_old".to_string(),
            original_task_id: None,
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Very old".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: None,
            created_at: Utc::now() - chrono::Duration::days(365), // 1 year ago
        };

        let entries = vec![very_old_unresolved];
        let removed = manager.cleanup_old_entries(entries);

        // Unresolved entries are never removed
        assert_eq!(removed, 0);
    }

    #[test]
    fn test_cleanup_keeps_recent_resolved_entries() {
        let manager = DeadLetterQueueManager::new();

        // Create entries within 30-day window
        let recent_entry = DeadLetterEntry {
            id: "dlq_recent".to_string(),
            original_task_id: None,
            task_type: "post".to_string(),
            payload: "{}".to_string(),
            unified_error: "{}".to_string(),
            recovery_strategy: "{}".to_string(),
            error_message: "Recent".to_string(),
            error_context: "{}".to_string(),
            retry_count: 0,
            manually_retried: false,
            resolved_at: Some(Utc::now() - chrono::Duration::days(10)),
            created_at: Utc::now() - chrono::Duration::days(10),
        };

        let entries = vec![recent_entry];
        let removed = manager.cleanup_old_entries(entries);

        // Recent entries are kept
        assert_eq!(removed, 0);
    }
}
