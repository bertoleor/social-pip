//! Error Aggregation Module - Reduce error noise via fingerprinting and deduplication.
//!
//! This module implements error fingerprinting to group similar errors and reduce
//! alert noise by deduplic repeated occurrences.
//!
//! ## Key Features
//! - Fingerprinting: xxHash(error_type + platform + account_id + normalized_message)
//! - Deduplication window per error type
//! - ErrorGroup tracking with occurrence counts
//! - Sample storage (not all errors stored)
//!
//! ## Dedup Windows
//! | Error Type | Dedup Window | Sample Rate |
//! |------------|--------------|-------------|
//! | RateLimit | 5 minutes | 1/10 |
//! | NetworkFailure | 1 minute | 1/5 |
//! | AuthExpired | 0 (no dedup) | All |
//! | PlatformError | 5 minutes | 1/10 |
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::error_aggregation::{ErrorFingerprint, ErrorGroup, ErrorAggregator};
//!
//! let aggregator = ErrorAggregator::new();
//!
//! // Process an error
//! let fingerprint = aggregator.fingerprint_error(&error, Some("facebook"), Some("account_123"));
//!
//! // Check if should create new group or increment existing
//! if let Some(group) = aggregator.find_group(&fingerprint) {
//!     aggregator.increment_group(&group.id, sample_entry)?;
//! } else {
//!     aggregator.create_group(fingerprint, error)?;
//! }
//! ```

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;
use twox_hash::XxHash64;

// ============================================
// IN-MEMORY STORAGE
// ============================================

static ERROR_GROUPS: Lazy<Mutex<HashMap<String, ErrorGroup>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static FINGERPRINT_INDEX: Lazy<Mutex<HashMap<String, String>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

// ============================================
// ERROR GROUP STATUS
// ============================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorGroupStatus {
    Active,
    Resolved,
    Ignored,
}

impl Default for ErrorGroupStatus {
    fn default() -> Self {
        ErrorGroupStatus::Active
    }
}

impl std::fmt::Display for ErrorGroupStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ErrorGroupStatus::Active => write!(f, "ACTIVE"),
            ErrorGroupStatus::Resolved => write!(f, "RESOLVED"),
            ErrorGroupStatus::Ignored => write!(f, "IGNORED"),
        }
    }
}

impl ErrorGroupStatus {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "ACTIVE" => Some(ErrorGroupStatus::Active),
            "RESOLVED" => Some(ErrorGroupStatus::Resolved),
            "IGNORED" => Some(ErrorGroupStatus::Ignored),
            _ => None,
        }
    }
}

// ============================================
// ERROR FINGERPRINT
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorFingerprint {
    pub hash: String,
    pub error_type: String,
    pub platform: Option<String>,
    pub account_id: Option<String>,
    pub normalized_message: String,
}

impl ErrorFingerprint {
    pub fn new(
        error_type: impl Into<String>,
        platform: Option<&str>,
        account_id: Option<&str>,
        message: impl Into<String>,
    ) -> Self {
        let error_type = error_type.into();
        let message = message.into();
        let normalized = Self::normalize_message(&message);
        let hash = Self::compute_hash(&error_type, platform, account_id, &normalized);

        Self {
            hash,
            error_type,
            platform: platform.map(String::from),
            account_id: account_id.map(String::from),
            normalized_message: normalized,
        }
    }

    fn normalize_message(message: &str) -> String {
        let normalized = message
            .to_lowercase()
            .replace(|c: char| c.is_numeric(), "N")
            .replace(|c: char| c.is_whitespace(), " ");

        let words: Vec<&str> = normalized.split_whitespace().take(10).collect();
        words.join(" ")
    }

    fn compute_hash(
        error_type: &str,
        platform: Option<&str>,
        account_id: Option<&str>,
        normalized_message: &str,
    ) -> String {
        let mut hasher = XxHash64::with_seed(0);

        error_type.hash(&mut hasher);
        platform.unwrap_or("").hash(&mut hasher);
        account_id.unwrap_or("").hash(&mut hasher);
        normalized_message.hash(&mut hasher);

        format!("{:016x}", hasher.finish())
    }
}

impl std::fmt::Display for ErrorFingerprint {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ErrorFingerprint({} [{}])", self.hash, self.error_type)
    }
}

// ============================================
// ERROR GROUP
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorGroup {
    pub id: String,
    pub fingerprint: String,
    pub error_type: String,
    pub platform: Option<String>,
    pub account_id: Option<String>,
    pub normalized_message: String,
    pub first_occurrence: DateTime<Utc>,
    pub last_occurrence: DateTime<Utc>,
    pub count: u64,
    pub sample_ids: Vec<String>,
    pub status: ErrorGroupStatus,
    pub resolved_at: Option<DateTime<Utc>>,
}

impl ErrorGroup {
    pub fn new(fingerprint: ErrorFingerprint) -> Self {
        Self {
            id: format!("errgrp_{}", cuid2::create_id()),
            fingerprint: fingerprint.hash.clone(),
            error_type: fingerprint.error_type,
            platform: fingerprint.platform,
            account_id: fingerprint.account_id,
            normalized_message: fingerprint.normalized_message,
            first_occurrence: Utc::now(),
            last_occurrence: Utc::now(),
            count: 1,
            sample_ids: Vec::new(),
            status: ErrorGroupStatus::Active,
            resolved_at: None,
        }
    }

    pub fn increment(&mut self, sample_id: Option<&str>) {
        self.count += 1;
        self.last_occurrence = Utc::now();

        if let Some(id) = sample_id {
            self.sample_ids.push(id.to_string());
        }
    }

    pub fn resolve(&mut self) {
        self.status = ErrorGroupStatus::Resolved;
        self.resolved_at = Some(Utc::now());
    }

    pub fn ignore(&mut self) {
        self.status = ErrorGroupStatus::Ignored;
    }

    pub fn duration_since_first(&self) -> i64 {
        (self.last_occurrence - self.first_occurrence).num_seconds()
    }

    pub fn is_recent(&self, within_seconds: i64) -> bool {
        (Utc::now() - self.last_occurrence).num_seconds() <= within_seconds
    }
}

// ============================================
// DEDUP CONFIG
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DedupConfig {
    pub dedup_window_ms: u64,
    pub sample_rate: f64,
    pub max_samples_per_group: usize,
}

impl Default for DedupConfig {
    fn default() -> Self {
        Self {
            dedup_window_ms: 300_000,
            sample_rate: 0.1,
            max_samples_per_group: 10,
        }
    }
}

impl DedupConfig {
    pub fn for_error_type(error_type: &str) -> Self {
        let (dedup_window_ms, sample_rate) = match error_type {
            "RateLimit" | "RateLimitApproaching" => (300_000, 0.1),
            "NetworkFailure" | "NetworkError" => (60_000, 0.2),
            "AuthExpired" | "AuthenticationError" => (0, 1.0),
            "PlatformError" | "PlatformAPIError" => (300_000, 0.1),
            "ValidationError" => (0, 1.0),
            _ => (300_000, 0.1),
        };

        Self {
            dedup_window_ms,
            sample_rate,
            max_samples_per_group: 10,
        }
    }

    pub fn should_sample(&self) -> bool {
        if self.sample_rate >= 1.0 {
            return true;
        }

        let random: f64 = (std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
            % 1000) as f64
            / 1000.0;

        random < self.sample_rate
    }

    pub fn should_dedup(&self) -> bool {
        self.dedup_window_ms > 0
    }
}

// ============================================
// ERROR AGGREGATOR
// ============================================

pub struct ErrorAggregator;

impl ErrorAggregator {
    pub fn new() -> Self {
        Self
    }

    pub fn fingerprint_error(
        error_type: &str,
        platform: Option<&str>,
        account_id: Option<&str>,
        message: &str,
    ) -> ErrorFingerprint {
        ErrorFingerprint::new(error_type, platform, account_id, message)
    }

    pub fn create_group(fingerprint: ErrorFingerprint) -> ErrorGroup {
        let group = ErrorGroup::new(fingerprint.clone());

        let mut groups = ERROR_GROUPS.lock().unwrap();
        let mut index = FINGERPRINT_INDEX.lock().unwrap();

        index.insert(fingerprint.hash.clone(), group.id.clone());
        groups.insert(group.id.clone(), group.clone());

        group
    }

    pub fn find_group_by_fingerprint(fingerprint: &str) -> Option<ErrorGroup> {
        let index = FINGERPRINT_INDEX.lock().unwrap();
        let groups = ERROR_GROUPS.lock().unwrap();

        index
            .get(fingerprint)
            .and_then(|id| groups.get(id).cloned())
    }

    pub fn find_group_by_id(id: &str) -> Option<ErrorGroup> {
        let groups = ERROR_GROUPS.lock().unwrap();
        groups.get(id).cloned()
    }

    pub fn increment_group(group_id: &str, sample_id: Option<&str>) -> Option<ErrorGroup> {
        let mut groups = ERROR_GROUPS.lock().unwrap();

        if let Some(group) = groups.get_mut(group_id) {
            group.increment(sample_id);
            Some(group.clone())
        } else {
            None
        }
    }

    pub fn process_error(
        error_type: &str,
        platform: Option<&str>,
        account_id: Option<&str>,
        message: &str,
    ) -> (ErrorGroup, bool) {
        let config = DedupConfig::for_error_type(error_type);
        let fingerprint = Self::fingerprint_error(error_type, platform, account_id, message);

        let should_sample = config.should_sample();

        if let Some(mut existing) = Self::find_group_by_fingerprint(&fingerprint.hash) {
            let sample_id = if should_sample {
                Some(format!("sample_{}", cuid2::create_id()))
            } else {
                None
            };

            Self::increment_group(&existing.id, sample_id.as_deref());
            existing = Self::find_group_by_id(&existing.id).unwrap();

            (existing, false)
        } else {
            let group = Self::create_group(fingerprint);
            (group, true)
        }
    }

    pub fn get_active_groups() -> Vec<ErrorGroup> {
        let groups = ERROR_GROUPS.lock().unwrap();
        groups
            .values()
            .filter(|g| g.status == ErrorGroupStatus::Active)
            .cloned()
            .collect()
    }

    pub fn get_groups_by_platform(platform: &str) -> Vec<ErrorGroup> {
        let groups = ERROR_GROUPS.lock().unwrap();
        groups
            .values()
            .filter(|g| g.platform.as_deref() == Some(platform))
            .cloned()
            .collect()
    }

    pub fn get_top_groups(limit: usize) -> Vec<ErrorGroup> {
        let mut groups: Vec<ErrorGroup> = {
            let storage = ERROR_GROUPS.lock().unwrap();
            storage.values().cloned().collect()
        };

        groups.sort_by(|a, b| b.count.cmp(&a.count));
        groups.into_iter().take(limit).collect()
    }

    pub fn resolve_group(group_id: &str) -> Option<ErrorGroup> {
        let mut groups = ERROR_GROUPS.lock().unwrap();

        if let Some(group) = groups.get_mut(group_id) {
            group.resolve();
            Some(group.clone())
        } else {
            None
        }
    }

    pub fn ignore_group(group_id: &str) -> Option<ErrorGroup> {
        let mut groups = ERROR_GROUPS.lock().unwrap();

        if let Some(group) = groups.get_mut(group_id) {
            group.ignore();
            Some(group.clone())
        } else {
            None
        }
    }

    pub fn cleanup_old_groups(older_than_hours: i64) -> usize {
        let mut groups = ERROR_GROUPS.lock().unwrap();
        let mut index = FINGERPRINT_INDEX.lock().unwrap();

        let threshold = Utc::now() - chrono::Duration::hours(older_than_hours);

        let old_ids: Vec<String> = groups
            .iter()
            .filter(|(_, g)| g.status != ErrorGroupStatus::Active && g.last_occurrence < threshold)
            .map(|(id, _)| id.clone())
            .collect();

        let count = old_ids.len();

        for id in &old_ids {
            if let Some(group) = groups.remove(id) {
                index.remove(&group.fingerprint);
            }
        }

        count
    }

    pub fn clear_all() {
        let mut groups = ERROR_GROUPS.lock().unwrap();
        let mut index = FINGERPRINT_INDEX.lock().unwrap();
        groups.clear();
        index.clear();
    }

    pub fn get_stats() -> AggregationStats {
        let groups = ERROR_GROUPS.lock().unwrap();

        let total_groups = groups.len();
        let active_groups = groups
            .values()
            .filter(|g| g.status == ErrorGroupStatus::Active)
            .count();
        let total_occurrences: u64 = groups.values().map(|g| g.count).sum();
        let total_samples: usize = groups.values().map(|g| g.sample_ids.len()).sum();

        AggregationStats {
            total_groups,
            active_groups,
            total_occurrences,
            total_samples,
        }
    }
}

impl Default for ErrorAggregator {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// AGGREGATION STATS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregationStats {
    pub total_groups: usize,
    pub active_groups: usize,
    pub total_occurrences: u64,
    pub total_samples: usize,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

pub fn compute_fingerprint(
    error_type: &str,
    platform: Option<&str>,
    account_id: Option<&str>,
    message: &str,
) -> ErrorFingerprint {
    ErrorAggregator::fingerprint_error(error_type, platform, account_id, message)
}

pub fn process_error(
    error_type: &str,
    platform: Option<&str>,
    account_id: Option<&str>,
    message: &str,
) -> (ErrorGroup, bool) {
    ErrorAggregator::process_error(error_type, platform, account_id, message)
}

pub fn get_error_group(fingerprint: &str) -> Option<ErrorGroup> {
    ErrorAggregator::find_group_by_fingerprint(fingerprint)
}

pub fn get_active_error_groups() -> Vec<ErrorGroup> {
    ErrorAggregator::get_active_groups()
}

pub fn get_top_error_groups(limit: usize) -> Vec<ErrorGroup> {
    ErrorAggregator::get_top_groups(limit)
}

pub fn clear_aggregation_storage() {
    ErrorAggregator::clear_all();
}
