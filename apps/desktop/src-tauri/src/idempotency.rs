use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// IdempotencyEntry - Tracks a processed operation to prevent duplicates.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdempotencyEntry {
    /// The unique key for this operation
    pub key: String,
    /// When this entry was created
    pub created_at: DateTime<Utc>,
    /// Optional result payload (JSON)
    pub result: Option<String>,
}

/// IdempotencyChecker - In-memory idempotency tracking with 24-hour expiry.
///
/// Prevents duplicate operations by tracking unique keys derived from operation
/// parameters. Entries expire after 24 hours to prevent unbounded memory growth.
pub struct IdempotencyChecker {
    /// In-memory store of processed operations
    entries: HashMap<String, IdempotencyEntry>,
    /// Maximum age of entries before expiry (default: 24 hours)
    expiry_duration: Duration,
    /// Maximum number of entries before cleanup (default: 10,000)
    max_entries: usize,
}

impl IdempotencyChecker {
    /// Create a new idempotency checker with default settings.
    ///
    /// Default settings:
    /// - Expiry: 24 hours
    /// - Max entries: 10,000
    pub fn new() -> Self {
        Self {
            entries: HashMap::new(),
            expiry_duration: Duration::hours(24),
            max_entries: 10_000,
        }
    }

    /// Create a new idempotency checker with custom settings.
    pub fn with_settings(expiry_hours: i64, max_entries: usize) -> Self {
        Self {
            entries: HashMap::new(),
            expiry_duration: Duration::hours(expiry_hours),
            max_entries,
        }
    }

    /// Generate a SHA256 hash for idempotency key.
    ///
    /// The key is generated from a combination of identifying parameters:
    /// - account_id: The account performing the operation
    /// - operation_type: Type of operation (post, message, story, etc.)
    /// - content_hash: Hash of the content being operated on
    ///
    /// # Arguments
    /// - `account_id`: Unique identifier for the account
    /// - `operation_type`: Type of operation
    /// - `content`: The content payload to hash
    ///
    /// # Returns
    /// A 64-character hex string (SHA256)
    pub fn generate_key(account_id: &str, operation_type: &str, content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(account_id.as_bytes());
        hasher.update(":".as_bytes());
        hasher.update(operation_type.as_bytes());
        hasher.update(":".as_bytes());
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Check if an operation has been processed recently.
    ///
    /// Returns:
    /// - `Some(entry)`: Operation was already processed, returns the entry
    /// - `None`: Operation has not been processed, safe to proceed
    ///
    /// This method also performs cleanup of expired entries.
    pub fn check(&mut self, key: &str) -> Option<IdempotencyEntry> {
        self.cleanup_expired();

        self.entries.get(key).cloned()
    }

    /// Record a processed operation.
    ///
    /// Call this after successfully processing an operation to prevent
    /// duplicate processing for the next 24 hours.
    ///
    /// # Arguments
    /// - `key`: The idempotency key
    /// - `result`: Optional result payload to store
    pub fn record(&mut self, key: String, result: Option<String>) {
        // Enforce max entries limit
        if self.entries.len() >= self.max_entries {
            self.cleanup_expired();
            // If still over limit after cleanup, remove oldest entry
            if self.entries.len() >= self.max_entries {
                self.remove_oldest();
            }
        }

        let entry = IdempotencyEntry {
            key: key.clone(),
            created_at: Utc::now(),
            result,
        };

        self.entries.insert(key, entry);
    }

    /// Remove a specific entry by key.
    pub fn remove(&mut self, key: &str) -> bool {
        self.entries.remove(key).is_some()
    }

    /// Get the number of tracked entries.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Check if there are no entries.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Remove expired entries from the store.
    fn cleanup_expired(&mut self) {
        let cutoff = Utc::now() - self.expiry_duration;
        self.entries.retain(|_, entry| entry.created_at > cutoff);
    }

    /// Remove the oldest entry from the store.
    fn remove_oldest(&mut self) {
        if let Some(oldest_key) = self
            .entries
            .iter()
            .min_by_key(|(_, entry)| entry.created_at)
            .map(|(k, _)| k.clone())
        {
            self.entries.remove(&oldest_key);
        }
    }

    /// Clear all entries.
    pub fn clear(&mut self) {
        self.entries.clear();
    }
}

impl Default for IdempotencyChecker {
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

    // ============================================
    // T4.1: generate_idempotency_key() tests
    // ============================================

    #[test]
    fn test_generate_key_produces_sha256_hash() {
        let key = IdempotencyChecker::generate_key("acc_123", "post", "Hello world");

        // SHA256 produces 64 character hex string
        assert_eq!(key.len(), 64);
        // All characters should be valid hex
        assert!(key.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_generate_key_is_deterministic() {
        let key1 = IdempotencyChecker::generate_key("acc_123", "post", "Hello world");
        let key2 = IdempotencyChecker::generate_key("acc_123", "post", "Hello world");

        // Same inputs should produce same key
        assert_eq!(key1, key2);
    }

    #[test]
    fn test_generate_key_different_for_different_content() {
        let key1 = IdempotencyChecker::generate_key("acc_123", "post", "Hello world");
        let key2 = IdempotencyChecker::generate_key("acc_123", "post", "Hello universe");

        // Different content should produce different keys
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_generate_key_different_for_different_accounts() {
        let key1 = IdempotencyChecker::generate_key("acc_123", "post", "Hello world");
        let key2 = IdempotencyChecker::generate_key("acc_456", "post", "Hello world");

        // Different accounts should produce different keys
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_generate_key_different_for_different_operations() {
        let key1 = IdempotencyChecker::generate_key("acc_123", "post", "Hello world");
        let key2 = IdempotencyChecker::generate_key("acc_123", "message", "Hello world");

        // Different operation types should produce different keys
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_generate_key_handles_empty_content() {
        let key = IdempotencyChecker::generate_key("acc_123", "post", "");

        // Should still produce a valid hash
        assert_eq!(key.len(), 64);
    }

    // ============================================
    // T4.3: IdempotencyChecker::check() tests
    // ============================================

    #[test]
    fn test_check_returns_none_for_new_key() {
        let mut checker = IdempotencyChecker::new();

        let result = checker.check("nonexistent_key");

        assert!(result.is_none());
    }

    #[test]
    fn test_check_returns_entry_for_recorded_key() {
        let mut checker = IdempotencyChecker::new();
        let key = IdempotencyChecker::generate_key("acc_123", "post", "Hello");

        // Record the key
        checker.record(key.clone(), Some(r#"{"post_id": "123"}"#.to_string()));

        // Check should return the entry
        let entry = checker.check(&key);

        assert!(entry.is_some());
        let entry = entry.unwrap();
        assert_eq!(entry.key, key);
        assert!(entry.result.is_some());
    }

    #[test]
    fn test_check_returns_none_after_expiry() {
        let mut checker = IdempotencyChecker::with_settings(0, 10);

        let key = "test_key".to_string();
        checker.record(key.clone(), None);

        // Wait a tiny bit to ensure time has passed
        std::thread::sleep(std::time::Duration::from_millis(10));

        // Entry should be expired (0 hour expiry)
        let result = checker.check(&key);
        assert!(result.is_none());
    }

    #[test]
    fn test_check_cleans_up_expired_entries() {
        let mut checker = IdempotencyChecker::with_settings(0, 10);

        // Add entry that will expire
        checker.record("old_key".to_string(), None);

        // Wait for expiry
        std::thread::sleep(std::time::Duration::from_millis(10));

        // Check should trigger cleanup
        checker.check("any_key");

        // Old key should be removed
        assert!(!checker.entries.contains_key("old_key"));
    }

    #[test]
    fn test_record_stores_entry_with_result() {
        let mut checker = IdempotencyChecker::new();
        let key = "test_key".to_string();
        let result = r#"{"status": "success"}"#.to_string();

        checker.record(key.clone(), Some(result.clone()));

        let entry = checker.entries.get(&key).unwrap();
        assert_eq!(entry.result, Some(result));
    }

    #[test]
    fn test_record_stores_entry_without_result() {
        let mut checker = IdempotencyChecker::new();
        let key = "test_key".to_string();

        checker.record(key.clone(), None);

        let entry = checker.entries.get(&key).unwrap();
        assert!(entry.result.is_none());
    }

    #[test]
    fn test_enforces_max_entries_limit() {
        let mut checker = IdempotencyChecker::with_settings(24, 3);

        // Add 4 entries (over limit)
        checker.record("key1".to_string(), None);
        checker.record("key2".to_string(), None);
        checker.record("key3".to_string(), None);
        checker.record("key4".to_string(), None);

        // Should have enforced limit
        assert!(checker.len() <= 3);
    }

    #[test]
    fn test_len_and_is_empty() {
        let mut checker = IdempotencyChecker::new();

        assert!(checker.is_empty());
        assert_eq!(checker.len(), 0);

        checker.record("key1".to_string(), None);
        assert!(!checker.is_empty());
        assert_eq!(checker.len(), 1);

        checker.record("key2".to_string(), None);
        assert_eq!(checker.len(), 2);
    }

    #[test]
    fn test_clear_removes_all_entries() {
        let mut checker = IdempotencyChecker::new();

        checker.record("key1".to_string(), None);
        checker.record("key2".to_string(), None);
        assert_eq!(checker.len(), 2);

        checker.clear();
        assert!(checker.is_empty());
    }

    #[test]
    fn test_remove_deletes_specific_entry() {
        let mut checker = IdempotencyChecker::new();

        checker.record("key1".to_string(), None);
        checker.record("key2".to_string(), None);

        let removed = checker.remove("key1");

        assert!(removed);
        assert_eq!(checker.len(), 1);
        assert!(!checker.entries.contains_key("key1"));
    }

    #[test]
    fn test_remove_returns_false_for_nonexistent() {
        let mut checker = IdempotencyChecker::new();

        let removed = checker.remove("nonexistent");

        assert!(!removed);
    }
}
