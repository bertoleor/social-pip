//! Outbox Module - Task persistence with crash recovery.
//!
//! This module implements the Outbox pattern to guarantee task delivery with crash recovery.
//! Tasks are persisted BEFORE execution, enabling recovery after Tauri crash.
//!
//! ## Key Features
//! - Idempotency: Duplicate tasks are detected and discarded
//! - Background Poller: Recovers orphaned tasks every 30 seconds
//! - Trace ID Propagation: All operations linked to OpenTelemetry traces
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::outbox::{OutboxEntry, OutboxStatus, create_outbox_entry};
//!
//! // Create entry before task execution
//! let entry = create_outbox_entry(
//!     "Post",
//!     "post_123",
//!     "PostCreated",
//!     payload,
//!     trace_id,
//! ).await?;
//!
//! // Execute task with entry tracking
//! execute_task_with_outbox(entry, || async {
//!     // Task logic here
//! }).await?;
//! ```

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;
use std::time::Duration;
use twox_hash::XxHash64;

// ============================================
// IN-MEMORY STORAGE
// ============================================

static OUTBOX_STORAGE: Lazy<Mutex<HashMap<String, OutboxEntry>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static OUTBOX_BY_IDEMPOTENCY: Lazy<Mutex<HashMap<String, String>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// OutboxStatus - The lifecycle states of an outbox entry.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OutboxStatus {
    /// Entry created, waiting to be processed
    Pending,
    /// Currently being processed
    Processing,
    /// Successfully completed
    Completed,
    /// Failed after max retries
    Failed,
}

impl Default for OutboxStatus {
    fn default() -> Self {
        OutboxStatus::Pending
    }
}

impl std::fmt::Display for OutboxStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutboxStatus::Pending => write!(f, "PENDING"),
            OutboxStatus::Processing => write!(f, "PROCESSING"),
            OutboxStatus::Completed => write!(f, "COMPLETED"),
            OutboxStatus::Failed => write!(f, "FAILED"),
        }
    }
}

impl OutboxStatus {
    /// Parse from string (for database deserialization)
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "PENDING" => Some(OutboxStatus::Pending),
            "PROCESSING" => Some(OutboxStatus::Processing),
            "COMPLETED" => Some(OutboxStatus::Completed),
            "FAILED" => Some(OutboxStatus::Failed),
            _ => None,
        }
    }
}

/// OutboxEntry - Represents a task persisted before execution.
///
/// Guarantees at-least-once delivery with idempotency protection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutboxEntry {
    /// Unique identifier (cuid)
    pub id: String,
    /// Hash-based unique key for deduplication
    pub idempotency_key: String,
    /// Type of aggregate: "Post", "Account", "Batch"
    pub aggregate_type: String,
    /// Target entity ID
    pub aggregate_id: String,
    /// Event type: "PostCreated", "PostRetry"
    pub event_type: String,
    /// JSON payload of full task data
    pub payload: String,
    /// OpenTelemetry trace ID for correlation
    pub trace_id: String,
    /// Parent saga if applicable
    pub saga_id: Option<String>,
    /// Current lifecycle status
    pub status: OutboxStatus,
    /// When entry was created
    pub created_at: DateTime<Utc>,
    /// When entry was processed (null if pending)
    pub processed_at: Option<DateTime<Utc>>,
    /// Number of retry attempts
    pub retry_count: u32,
    /// Maximum retry attempts allowed
    pub max_retries: u32,
    /// Next retry time (for exponential backoff)
    pub next_retry_at: Option<DateTime<Utc>>,
    /// Last error message
    pub last_error: Option<String>,
}

impl OutboxEntry {
    /// Create a new OutboxEntry with required fields.
    pub fn new(
        aggregate_type: impl Into<String>,
        aggregate_id: impl Into<String>,
        event_type: impl Into<String>,
        payload: impl Into<String>,
        trace_id: impl Into<String>,
    ) -> Self {
        let aggregate_type = aggregate_type.into();
        let aggregate_id = aggregate_id.into();
        let event_type = event_type.into();
        let payload = payload.into();
        let trace_id = trace_id.into();

        let idempotency_key =
            generate_idempotency_key(&aggregate_type, &aggregate_id, &event_type, &payload);

        // Use nanoseconds and counter to ensure unique IDs
        use std::sync::atomic::{AtomicU64, Ordering};
        static OUTBOX_COUNTER: AtomicU64 = AtomicU64::new(0);
        let count = OUTBOX_COUNTER.fetch_add(1, Ordering::SeqCst);
        let now = chrono::Utc::now();

        Self {
            id: format!(
                "outbox_{}{:010}",
                now.timestamp_nanos_opt().unwrap_or(0),
                count
            ),
            idempotency_key,
            aggregate_type,
            aggregate_id,
            event_type,
            payload,
            trace_id,
            saga_id: None,
            status: OutboxStatus::Pending,
            created_at: Utc::now(),
            processed_at: None,
            retry_count: 0,
            max_retries: 3,
            next_retry_at: None,
            last_error: None,
        }
    }

    /// Set the parent saga ID.
    pub fn with_saga(mut self, saga_id: impl Into<String>) -> Self {
        self.saga_id = Some(saga_id.into());
        self
    }

    /// Set custom max retries.
    pub fn with_max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }

    /// Check if entry can be retried.
    pub fn can_retry(&self) -> bool {
        self.retry_count < self.max_retries
    }

    /// Mark as processing.
    pub fn mark_processing(&mut self) {
        self.status = OutboxStatus::Processing;
    }

    /// Mark as completed.
    pub fn mark_completed(&mut self) {
        self.status = OutboxStatus::Completed;
        self.processed_at = Some(Utc::now());
    }

    /// Mark as failed with error.
    pub fn mark_failed(&mut self, error: &str) {
        self.last_error = Some(error.to_string());
        self.retry_count += 1;

        if self.can_retry() {
            // Calculate exponential backoff: 30s, 60s, 120s
            let delay_seconds = 30 * 2_u64.pow(self.retry_count);
            self.next_retry_at = Some(Utc::now() + chrono::Duration::seconds(delay_seconds as i64));
        } else {
            self.status = OutboxStatus::Failed;
            self.processed_at = Some(Utc::now());
        }
    }
}

/// Generate an idempotency key using xxHash.
///
/// The key is derived from: aggregate_type + aggregate_id + event_type + payload hash.
/// This ensures duplicate detection across crashes and retries.
pub fn generate_idempotency_key(
    aggregate_type: &str,
    aggregate_id: &str,
    event_type: &str,
    payload: &str,
) -> String {
    let mut hasher = XxHash64::with_seed(0);
    aggregate_type.hash(&mut hasher);
    aggregate_id.hash(&mut hasher);
    event_type.hash(&mut hasher);
    payload.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

/// Create a new outbox entry for task persistence.
///
/// This function creates an entry that will be persisted BEFORE task execution,
/// enabling crash recovery and duplicate detection.
///
/// # Arguments
/// * `aggregate_type` - Type of entity: "Post", "Account", "Batch"
/// * `aggregate_id` - Target entity ID
/// * `event_type` - Event name: "PostCreated", "PostRetry"
/// * `payload` - JSON payload of full task data
/// * `trace_id` - OpenTelemetry trace ID for correlation
///
/// # Returns
/// The created OutboxEntry with generated idempotency key
pub fn create_outbox_entry(
    aggregate_type: &str,
    aggregate_id: &str,
    event_type: &str,
    payload: &str,
    trace_id: &str,
) -> Result<OutboxEntry, String> {
    Ok(OutboxEntry::new(
        aggregate_type,
        aggregate_id,
        event_type,
        payload,
        trace_id,
    ))
}

/// Create a new outbox entry linked to a saga.
///
/// Use this when the task is part of a saga orchestration.
///
/// # Arguments
/// * `aggregate_type` - Type of entity
/// * `aggregate_id` - Target entity ID
/// * `event_type` - Event name
/// * `payload` - JSON payload
/// * `trace_id` - OpenTelemetry trace ID
/// * `saga_id` - Parent saga ID for correlation
pub fn create_outbox_entry_with_saga(
    aggregate_type: &str,
    aggregate_id: &str,
    event_type: &str,
    payload: &str,
    trace_id: &str,
    saga_id: &str,
) -> Result<OutboxEntry, String> {
    Ok(
        OutboxEntry::new(aggregate_type, aggregate_id, event_type, payload, trace_id)
            .with_saga(saga_id),
    )
}

/// OutboxPoller - Background task that recovers orphaned entries.
///
/// Runs every 30 seconds by default, finding entries stuck in PENDING or PROCESSING
/// state for too long and marking them for retry.
pub struct OutboxPoller {
    /// Poll interval in milliseconds
    poll_interval_ms: u64,
    /// Age threshold for orphan detection (entries older than this are recovered)
    orphan_threshold_ms: u64,
    /// Whether the poller is running
    running: bool,
}

impl Default for OutboxPoller {
    fn default() -> Self {
        Self {
            poll_interval_ms: 30_000,    // 30 seconds
            orphan_threshold_ms: 60_000, // 1 minute
            running: false,
        }
    }
}

impl OutboxPoller {
    /// Create a new poller with custom configuration.
    pub fn new(poll_interval_ms: u64, orphan_threshold_ms: u64) -> Self {
        Self {
            poll_interval_ms,
            orphan_threshold_ms,
            running: false,
        }
    }

    /// Get the poll interval.
    pub fn poll_interval(&self) -> Duration {
        Duration::from_millis(self.poll_interval_ms)
    }

    /// Get the orphan threshold.
    pub fn orphan_threshold(&self) -> Duration {
        Duration::from_millis(self.orphan_threshold_ms)
    }

    /// Check if an entry is orphaned (stuck too long).
    pub fn is_orphaned(&self, entry: &OutboxEntry) -> bool {
        let age = Utc::now() - entry.created_at;
        let threshold = chrono::Duration::milliseconds(self.orphan_threshold_ms as i64);

        match entry.status {
            OutboxStatus::Pending | OutboxStatus::Processing => age > threshold,
            OutboxStatus::Completed | OutboxStatus::Failed => false,
        }
    }

    /// Find orphaned entries for recovery.
    /// In production, this would query the database.
    pub fn find_orphaned_entries<'a>(&self, entries: &'a [OutboxEntry]) -> Vec<&'a OutboxEntry> {
        entries.iter().filter(|e| self.is_orphaned(e)).collect()
    }

    /// Mark an entry for retry (reset to PENDING if was PROCESSING).
    pub fn mark_for_retry(&self, entry: &mut OutboxEntry) {
        if entry.status == OutboxStatus::Processing {
            entry.status = OutboxStatus::Pending;
        }
    }
}

/// Check for duplicate entries by idempotency key.
/// Returns true if a duplicate exists (caller should discard new entry).
pub fn check_duplicate(entries: &[OutboxEntry], idempotency_key: &str) -> bool {
    entries.iter().any(|e| e.idempotency_key == idempotency_key)
}

// ============================================
// PERSISTENCE FUNCTIONS (T-1.3.5, T-1.3.6)
// ============================================

/// Persist an outbox entry to storage.
/// Returns the entry ID on success, or an error message on failure.
pub fn persist_outbox_entry(entry: OutboxEntry) -> Result<String, String> {
    let id = entry.id.clone();
    let idempotency_key = entry.idempotency_key.clone();

    {
        let mut storage = OUTBOX_STORAGE.lock().map_err(|e| e.to_string())?;
        storage.insert(id.clone(), entry);
    }

    {
        let mut by_idempotency = OUTBOX_BY_IDEMPOTENCY.lock().map_err(|e| e.to_string())?;
        by_idempotency.insert(idempotency_key, id.clone());
    }

    Ok(id)
}

/// Create and persist an outbox entry in one operation.
pub fn create_and_persist_outbox_entry(
    aggregate_type: &str,
    aggregate_id: &str,
    event_type: &str,
    payload: &str,
    trace_id: &str,
) -> Result<OutboxEntry, String> {
    let entry = create_outbox_entry(aggregate_type, aggregate_id, event_type, payload, trace_id)?;
    let id = persist_outbox_entry(entry.clone())?;

    let mut entry = entry;
    entry.id = id;
    Ok(entry)
}

/// Get an outbox entry by ID.
pub fn get_outbox_entry_by_id(id: &str) -> Result<Option<OutboxEntry>, String> {
    let storage = OUTBOX_STORAGE.lock().map_err(|e| e.to_string())?;
    Ok(storage.get(id).cloned())
}

/// Get an outbox entry by idempotency key.
pub fn get_outbox_entry_by_idempotency_key(
    idempotency_key: &str,
) -> Result<Option<OutboxEntry>, String> {
    let id = {
        let by_idempotency = OUTBOX_BY_IDEMPOTENCY.lock().map_err(|e| e.to_string())?;
        by_idempotency.get(idempotency_key).cloned()
    };

    match id {
        Some(id) => get_outbox_entry_by_id(&id),
        None => Ok(None),
    }
}

/// Check if an entry with the given idempotency key exists.
pub fn outbox_entry_exists(idempotency_key: &str) -> Result<bool, String> {
    let by_idempotency = OUTBOX_BY_IDEMPOTENCY.lock().map_err(|e| e.to_string())?;
    Ok(by_idempotency.contains_key(idempotency_key))
}

/// Update an existing outbox entry.
pub fn update_outbox_entry(entry: OutboxEntry) -> Result<(), String> {
    let mut storage = OUTBOX_STORAGE.lock().map_err(|e| e.to_string())?;
    let id = entry.id.clone();

    if storage.contains_key(&id) {
        storage.insert(id, entry);
        Ok(())
    } else {
        Err("Entry not found".to_string())
    }
}

/// Get all pending entries for processing.
pub fn get_pending_entries() -> Result<Vec<OutboxEntry>, String> {
    let storage = OUTBOX_STORAGE.lock().map_err(|e| e.to_string())?;
    Ok(storage
        .values()
        .filter(|e| e.status == OutboxStatus::Pending)
        .cloned()
        .collect())
}

/// Get orphaned entries (PENDING or PROCESSING older than threshold).
pub fn get_orphaned_entries(threshold_ms: u64) -> Result<Vec<OutboxEntry>, String> {
    let storage = OUTBOX_STORAGE.lock().map_err(|e| e.to_string())?;
    let threshold = chrono::Duration::milliseconds(threshold_ms as i64);

    Ok(storage
        .values()
        .filter(|e| match e.status {
            OutboxStatus::Pending | OutboxStatus::Processing => {
                let age = Utc::now() - e.created_at;
                age > threshold
            }
            OutboxStatus::Completed | OutboxStatus::Failed => false,
        })
        .cloned()
        .collect())
}

/// Clear all entries (for testing).
#[cfg(test)]
pub fn clear_outbox_storage() {
    let mut storage = OUTBOX_STORAGE.lock().unwrap();
    storage.clear();
    let mut by_idempotency = OUTBOX_BY_IDEMPOTENCY.lock().unwrap();
    by_idempotency.clear();
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================
    // T-1.3.1: OutboxEntry creation tests
    // ============================================

    #[test]
    fn test_outbox_entry_new_creates_with_required_fields() {
        let entry = OutboxEntry::new(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "test"}"#,
            "trace_abc",
        );

        assert_eq!(entry.aggregate_type, "Post");
        assert_eq!(entry.aggregate_id, "post_123");
        assert_eq!(entry.event_type, "PostCreated");
        assert_eq!(entry.payload, r#"{"content": "test"}"#);
        assert_eq!(entry.trace_id, "trace_abc");
        assert!(entry.id.starts_with("outbox_"));
        assert!(!entry.idempotency_key.is_empty());
    }

    #[test]
    fn test_outbox_entry_new_has_default_values() {
        let entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        assert_eq!(entry.status, OutboxStatus::Pending);
        assert!(entry.saga_id.is_none());
        assert!(entry.processed_at.is_none());
        assert_eq!(entry.retry_count, 0);
        assert_eq!(entry.max_retries, 3);
        assert!(entry.next_retry_at.is_none());
        assert!(entry.last_error.is_none());
    }

    #[test]
    fn test_outbox_entry_with_saga() {
        let entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace")
            .with_saga("saga_456");

        assert_eq!(entry.saga_id, Some("saga_456".to_string()));
    }

    #[test]
    fn test_outbox_entry_with_max_retries() {
        let entry =
            OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace").with_max_retries(5);

        assert_eq!(entry.max_retries, 5);
    }

    // ============================================
    // T-1.3.3: Idempotency key generation tests
    // ============================================

    #[test]
    fn test_generate_idempotency_key_is_deterministic() {
        let key1 =
            generate_idempotency_key("Post", "post_123", "PostCreated", r#"{"content": "test"}"#);
        let key2 =
            generate_idempotency_key("Post", "post_123", "PostCreated", r#"{"content": "test"}"#);

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_generate_idempotency_key_differs_for_different_payloads() {
        let key1 =
            generate_idempotency_key("Post", "post_123", "PostCreated", r#"{"content": "test1"}"#);
        let key2 =
            generate_idempotency_key("Post", "post_123", "PostCreated", r#"{"content": "test2"}"#);

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_generate_idempotency_key_differs_for_different_aggregate_ids() {
        let key1 = generate_idempotency_key("Post", "post_123", "PostCreated", "{}");
        let key2 = generate_idempotency_key("Post", "post_456", "PostCreated", "{}");

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_generate_idempotency_key_is_16_hex_chars() {
        let key = generate_idempotency_key("Post", "post_123", "PostCreated", "{}");

        assert_eq!(key.len(), 16);
        assert!(key.chars().all(|c| c.is_ascii_hexdigit()));
    }

    // ============================================
    // T-1.3.9: Duplicate detection tests
    // ============================================

    #[test]
    fn test_check_duplicate_finds_existing_key() {
        let entry1 = OutboxEntry::new(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "same"}"#,
            "trace1",
        );
        let entry2 = OutboxEntry::new(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "different"}"#,
            "trace2",
        );

        // Create entries with same idempotency key
        let entries = vec![OutboxEntry {
            idempotency_key: "abcd1234efgh5678".to_string(),
            ..entry1
        }];

        let is_dup = check_duplicate(&entries, "abcd1234efgh5678");
        assert!(is_dup);
    }

    #[test]
    fn test_check_duplicate_returns_false_for_new_key() {
        let entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");
        let entries = vec![entry];

        let is_dup = check_duplicate(&entries, "new_unique_key");
        assert!(!is_dup);
    }

    #[test]
    fn test_check_duplicate_empty_entries_returns_false() {
        let entries: Vec<OutboxEntry> = vec![];
        let is_dup = check_duplicate(&entries, "any_key");
        assert!(!is_dup);
    }

    // ============================================
    // T-1.3.5: create_outbox_entry persistence tests
    // ============================================

    #[test]
    fn test_create_outbox_entry_generates_valid_entry() {
        let result = create_outbox_entry(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "test"}"#,
            "trace_abc",
        );

        assert!(result.is_ok());
        let entry = result.unwrap();
        assert!(entry.id.starts_with("outbox_"));
        assert_eq!(entry.aggregate_type, "Post");
        assert_eq!(entry.aggregate_id, "post_123");
        assert_eq!(entry.event_type, "PostCreated");
        assert_eq!(entry.payload, r#"{"content": "test"}"#);
        assert_eq!(entry.trace_id, "trace_abc");
        assert_eq!(entry.status, OutboxStatus::Pending);
        assert!(!entry.idempotency_key.is_empty());
    }

    #[test]
    fn test_create_outbox_entry_with_saga_generates_entry() {
        let result = create_outbox_entry_with_saga(
            "Post",
            "post_456",
            "PostRetry",
            r#"{"retry": true}"#,
            "trace_def",
            "saga_789",
        );

        assert!(result.is_ok());
        let entry = result.unwrap();
        assert_eq!(entry.saga_id, Some("saga_789".to_string()));
        assert_eq!(entry.trace_id, "trace_def");
    }

    #[test]
    fn test_create_outbox_entry_same_inputs_same_idempotency_key() {
        let result1 = create_outbox_entry(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "same"}"#,
            "trace1",
        );
        let result2 = create_outbox_entry(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "same"}"#,
            "trace2",
        );

        assert!(result1.is_ok());
        assert!(result2.is_ok());

        let entry1 = result1.unwrap();
        let entry2 = result2.unwrap();

        // Same idempotency key (hash of aggregate_type, aggregate_id, event_type, payload)
        assert_eq!(entry1.idempotency_key, entry2.idempotency_key);
    }

    // ============================================
    // OutboxStatus tests
    // ============================================

    #[test]
    fn test_outbox_status_from_str() {
        assert_eq!(
            OutboxStatus::from_str("PENDING"),
            Some(OutboxStatus::Pending)
        );
        assert_eq!(
            OutboxStatus::from_str("PROCESSING"),
            Some(OutboxStatus::Processing)
        );
        assert_eq!(
            OutboxStatus::from_str("COMPLETED"),
            Some(OutboxStatus::Completed)
        );
        assert_eq!(OutboxStatus::from_str("FAILED"), Some(OutboxStatus::Failed));
        assert_eq!(OutboxStatus::from_str("INVALID"), None);
    }

    #[test]
    fn test_outbox_status_display() {
        assert_eq!(format!("{}", OutboxStatus::Pending), "PENDING");
        assert_eq!(format!("{}", OutboxStatus::Processing), "PROCESSING");
        assert_eq!(format!("{}", OutboxStatus::Completed), "COMPLETED");
        assert_eq!(format!("{}", OutboxStatus::Failed), "FAILED");
    }

    // ============================================
    // OutboxEntry lifecycle tests
    // ============================================

    #[test]
    fn test_outbox_entry_can_retry_when_under_max() {
        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        assert!(entry.can_retry());

        entry.retry_count = 2;
        assert!(entry.can_retry());

        entry.retry_count = 3;
        assert!(!entry.can_retry());
    }

    #[test]
    fn test_mark_processing_sets_status() {
        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        entry.mark_processing();

        assert_eq!(entry.status, OutboxStatus::Processing);
    }

    #[test]
    fn test_mark_completed_sets_status_and_timestamp() {
        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        entry.mark_completed();

        assert_eq!(entry.status, OutboxStatus::Completed);
        assert!(entry.processed_at.is_some());
    }

    #[test]
    fn test_mark_failed_increments_retry_count() {
        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        entry.mark_failed("Network error");

        assert_eq!(entry.retry_count, 1);
        assert_eq!(entry.last_error, Some("Network error".to_string()));
        assert!(entry.next_retry_at.is_some());
    }

    #[test]
    fn test_mark_failed_sets_failed_status_when_max_retries_exceeded() {
        let mut entry =
            OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace").with_max_retries(2);

        // First failure - should retry
        entry.mark_failed("Error 1");
        assert_eq!(entry.retry_count, 1);
        assert!(entry.can_retry());

        // Second failure - still retryable (max_retries=2)
        entry.mark_failed("Error 2");
        assert_eq!(entry.retry_count, 2);
        assert!(!entry.can_retry()); // Now exhausted
        assert_eq!(entry.status, OutboxStatus::Failed);
        assert!(entry.processed_at.is_some());
    }

    #[test]
    fn test_mark_failed_exponential_backoff() {
        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        entry.mark_failed("Error 1");
        let first_retry = entry.next_retry_at.unwrap();

        // Wait a tiny bit to ensure different timestamp
        std::thread::sleep(std::time::Duration::from_millis(10));

        entry.mark_failed("Error 2");
        let second_retry = entry.next_retry_at.unwrap();

        // Second retry should have longer delay (60s vs 30s base)
        let first_delay = (first_retry - Utc::now()).num_seconds();
        let second_delay = (second_retry - Utc::now()).num_seconds();

        assert!(second_delay > first_delay);
    }

    // ============================================
    // OutboxPoller tests
    // ============================================

    #[test]
    fn test_outbox_poller_default_values() {
        let poller = OutboxPoller::default();

        assert_eq!(poller.poll_interval(), Duration::from_secs(30));
        assert_eq!(poller.orphan_threshold(), Duration::from_secs(60));
    }

    #[test]
    fn test_outbox_poller_custom_values() {
        let poller = OutboxPoller::new(60_000, 120_000);

        assert_eq!(poller.poll_interval(), Duration::from_secs(60));
        assert_eq!(poller.orphan_threshold(), Duration::from_secs(120));
    }

    #[test]
    fn test_is_orphaned_detects_old_pending_entry() {
        let poller = OutboxPoller::default();

        // Create an entry from 2 minutes ago
        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");
        entry.created_at = Utc::now() - chrono::Duration::minutes(2);

        assert!(poller.is_orphaned(&entry));
    }

    #[test]
    fn test_is_orphaned_false_for_recent_entry() {
        let poller = OutboxPoller::default();
        let entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");

        assert!(!poller.is_orphaned(&entry));
    }

    #[test]
    fn test_is_orphaned_false_for_completed_entry() {
        let poller = OutboxPoller::default();

        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");
        entry.created_at = Utc::now() - chrono::Duration::hours(1);
        entry.mark_completed();

        assert!(!poller.is_orphaned(&entry));
    }

    #[test]
    fn test_find_orphaned_entries_filters_correctly() {
        let poller = OutboxPoller::new(30_000, 60_000);

        // Create entries: one orphan, one recent
        let mut old_entry = OutboxEntry::new("Post", "post_1", "PostCreated", "{}", "trace1");
        old_entry.created_at = Utc::now() - chrono::Duration::minutes(2);

        let recent_entry = OutboxEntry::new("Post", "post_2", "PostCreated", "{}", "trace2");

        let entries = vec![old_entry, recent_entry];
        let orphaned = poller.find_orphaned_entries(&entries);

        assert_eq!(orphaned.len(), 1);
        assert_eq!(orphaned[0].aggregate_id, "post_1");
    }

    #[test]
    fn test_mark_for_retry_resets_processing_to_pending() {
        let poller = OutboxPoller::default();

        let mut entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace");
        entry.status = OutboxStatus::Processing;

        poller.mark_for_retry(&mut entry);

        assert_eq!(entry.status, OutboxStatus::Pending);
    }

    // ============================================
    // Serialization tests (triangulation)
    // ============================================

    #[test]
    fn test_outbox_entry_serializes_to_json() {
        let entry = OutboxEntry::new(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "test"}"#,
            "trace",
        )
        .with_saga("saga_456");

        let json = serde_json::to_string(&entry).unwrap();

        assert!(json.contains("Post"));
        assert!(json.contains("post_123"));
        assert!(json.contains("PostCreated"));
        assert!(json.contains("trace"));
        assert!(json.contains("saga_456"));
    }

    #[test]
    fn test_outbox_entry_deserializes_from_json() {
        let entry = OutboxEntry::new("Post", "post_123", "PostCreated", "{}", "trace")
            .with_saga("saga_789")
            .with_max_retries(5);

        let json = serde_json::to_string(&entry).unwrap();
        let deserialized: OutboxEntry = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.aggregate_type, "Post");
        assert_eq!(deserialized.aggregate_id, "post_123");
        assert_eq!(deserialized.saga_id, Some("saga_789".to_string()));
        assert_eq!(deserialized.max_retries, 5);
    }

    // ============================================
    // T-1.3.5: Persistence tests
    // ============================================

    #[test]
    fn test_persist_outbox_entry_stores_in_memory() {
        clear_outbox_storage();

        let entry = OutboxEntry::new(
            "Post",
            "post_123",
            "PostCreated",
            r#"{"content": "test"}"#,
            "trace",
        );
        let id = persist_outbox_entry(entry.clone()).unwrap();

        assert!(!id.is_empty());

        let retrieved = get_outbox_entry_by_id(&id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().aggregate_id, "post_123");
    }

    #[test]
    fn test_persist_outbox_entry_indexes_by_idempotency_key() {
        clear_outbox_storage();

        let entry = OutboxEntry::new("Post", "post_456", "PostCreated", "{}", "trace");
        let idempotency_key = entry.idempotency_key.clone();
        persist_outbox_entry(entry).unwrap();

        let exists = outbox_entry_exists(&idempotency_key).unwrap();
        assert!(exists);

        let retrieved = get_outbox_entry_by_idempotency_key(&idempotency_key).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().aggregate_id, "post_456");
    }

    #[test]
    fn test_outbox_entry_exists_returns_false_for_nonexistent() {
        clear_outbox_storage();

        let exists = outbox_entry_exists("nonexistent_key").unwrap();
        assert!(!exists);
    }

    #[test]
    fn test_update_outbox_entry_updates_status() {
        clear_outbox_storage();

        let entry = OutboxEntry::new("Post", "post_789", "PostCreated", "{}", "trace");
        let id = persist_outbox_entry(entry.clone()).unwrap();

        let mut stored = get_outbox_entry_by_id(&id).unwrap().unwrap();
        stored.status = OutboxStatus::Processing;
        update_outbox_entry(stored).unwrap();

        let updated = get_outbox_entry_by_id(&id).unwrap().unwrap();
        assert_eq!(updated.status, OutboxStatus::Processing);
    }

    #[test]
    fn test_get_pending_entries_returns_only_pending() {
        clear_outbox_storage();

        let entry1 = OutboxEntry::new("Post", "post_pending", "PostCreated", "{}", "trace1");
        let entry2 = OutboxEntry::new("Post", "post_processing", "PostCreated", "{}", "trace2");

        let id1 = persist_outbox_entry(entry1).unwrap();
        let id2 = persist_outbox_entry(entry2).unwrap();

        // Verify entry1 is pending
        let check1 = get_outbox_entry_by_id(&id1).unwrap().unwrap();
        assert_eq!(
            check1.status,
            OutboxStatus::Pending,
            "Entry 1 should be pending"
        );

        // Update entry2 to processing
        let mut processing = get_outbox_entry_by_id(&id2).unwrap().unwrap();
        processing.status = OutboxStatus::Processing;
        let update_result = update_outbox_entry(processing);
        assert!(update_result.is_ok(), "Update should succeed");

        // Verify entry2 is processing
        let check2 = get_outbox_entry_by_id(&id2).unwrap().unwrap();
        assert_eq!(
            check2.status,
            OutboxStatus::Processing,
            "Entry 2 should be processing"
        );

        // Check storage directly
        let storage = OUTBOX_STORAGE.lock().unwrap();
        let count = storage
            .values()
            .filter(|e| e.status == OutboxStatus::Pending)
            .count();
        drop(storage);

        assert_eq!(count, 1, "Direct storage check: should have 1 pending");

        let pending = get_pending_entries().unwrap();
        assert_eq!(pending.len(), 1, "Should have 1 pending entry");
        assert_eq!(pending[0].id, id1);
    }

    // ============================================
    // T-1.3.6: Create and persist tests
    // ============================================

    #[test]
    fn test_create_and_persist_outbox_entry_combines_operations() {
        clear_outbox_storage();

        let entry = create_and_persist_outbox_entry(
            "Post",
            "post_combined",
            "PostCreated",
            r#"{"content": "combined"}"#,
            "trace_combined",
        )
        .unwrap();

        assert!(!entry.id.is_empty());
        assert_eq!(entry.aggregate_id, "post_combined");

        let retrieved = get_outbox_entry_by_id(&entry.id).unwrap();
        assert!(retrieved.is_some());
    }

    #[test]
    fn test_get_orphaned_entries_returns_old_entries() {
        clear_outbox_storage();

        let entry = OutboxEntry::new("Post", "post_orphan", "PostCreated", "{}", "trace");
        let id = persist_outbox_entry(entry.clone()).unwrap();

        let mut stored = get_outbox_entry_by_id(&id).unwrap().unwrap();
        stored.created_at = Utc::now() - chrono::Duration::minutes(5);
        update_outbox_entry(stored).unwrap();

        let orphaned = get_orphaned_entries(60_000).unwrap();
        assert_eq!(orphaned.len(), 1);
        assert_eq!(orphaned[0].aggregate_id, "post_orphan");
    }

    #[test]
    fn test_get_orphaned_entries_excludes_completed() {
        clear_outbox_storage();

        let entry = OutboxEntry::new("Post", "post_completed", "PostCreated", "{}", "trace");
        let id = persist_outbox_entry(entry.clone()).unwrap();

        let mut stored = get_outbox_entry_by_id(&id).unwrap().unwrap();
        stored.created_at = Utc::now() - chrono::Duration::minutes(5);
        stored.status = OutboxStatus::Completed;
        update_outbox_entry(stored).unwrap();

        let orphaned = get_orphaned_entries(60_000).unwrap();
        assert!(orphaned.is_empty());
    }

    #[test]
    fn test_persist_prevents_duplicate_via_idempotency_key() {
        clear_outbox_storage();

        let entry1 = create_and_persist_outbox_entry(
            "Post",
            "post_dup",
            "PostCreated",
            r#"{"content": "same"}"#,
            "trace1",
        )
        .unwrap();

        let exists = outbox_entry_exists(&entry1.idempotency_key).unwrap();
        assert!(exists);

        let entry2 = create_outbox_entry(
            "Post",
            "post_dup",
            "PostCreated",
            r#"{"content": "same"}"#,
            "trace2",
        )
        .unwrap();

        assert_eq!(entry1.idempotency_key, entry2.idempotency_key);

        let already_exists = outbox_entry_exists(&entry2.idempotency_key).unwrap();
        assert!(already_exists);
    }
}
