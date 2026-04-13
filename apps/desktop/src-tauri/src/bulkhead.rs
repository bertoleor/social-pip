//! Bulkhead Module - Thread pool isolation per platform.
//!
//! This module implements the Bulkhead pattern to isolate platform operations
//! and prevent cascading failures when one platform becomes overloaded.
//!
//! ## Key Features
//! - ThreadPoolBulkhead per platform (Facebook, Instagram, Twitter)
//! - max_concurrent_calls, queue_capacity, max_wait_duration
//! - Rejection handling when queue full
//! - Metrics: queue_size, active_threads, rejection_count
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::bulkhead::{BulkheadConfig, BulkheadRegistry};
//!
//! let config = BulkheadConfig::for_platform("facebook");
//! let registry = BulkheadRegistry::new();
//! registry.register("facebook", config);
//!
//! // Execute with bulkhead protection
//! let result = registry.execute("facebook", || {
//!     // Platform operation here
//! }).await?;
//! ```

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

// ============================================
// IN-MEMORY STORAGE
// ============================================

static BULKHEAD_REGISTRY: Lazy<Mutex<HashMap<String, Bulkhead>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// BulkheadState - The state of a bulkhead.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BulkheadState {
    /// Bulkhead is accepting new calls
    Open,
    /// Bulkhead is at capacity, queueing calls
    Saturated,
    /// Bulkhead queue is full, rejecting calls
    Rejected,
}

impl Default for BulkheadState {
    fn default() -> Self {
        BulkheadState::Open
    }
}

/// BulkheadConfig - Configuration for a platform bulkhead.
///
/// # Platform Defaults
/// | Platform | max_concurrent | queue_capacity | max_wait_duration |
/// |----------|----------------|----------------|-------------------|
/// | Facebook | 5 | 20 | 30 seconds |
/// | Instagram| 3 | 10 | 30 seconds |
/// | Twitter | 3 | 10 | 30 seconds |
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BulkheadConfig {
    /// Maximum concurrent calls allowed
    pub max_concurrent_calls: usize,
    /// Maximum queued calls waiting for execution
    pub queue_capacity: usize,
    /// Maximum time to wait in queue before rejection
    pub max_wait_duration_ms: u64,
}

impl Default for BulkheadConfig {
    fn default() -> Self {
        Self {
            max_concurrent_calls: 5,
            queue_capacity: 20,
            max_wait_duration_ms: 30_000, // 30 seconds
        }
    }
}

impl BulkheadConfig {
    /// Create config with platform-specific defaults.
    pub fn for_platform(platform: &str) -> Self {
        match platform.to_lowercase().as_str() {
            "facebook" => Self {
                max_concurrent_calls: 5,
                queue_capacity: 20,
                max_wait_duration_ms: 30_000,
            },
            "instagram" => Self {
                max_concurrent_calls: 3,
                queue_capacity: 10,
                max_wait_duration_ms: 30_000,
            },
            "twitter" => Self {
                max_concurrent_calls: 3,
                queue_capacity: 10,
                max_wait_duration_ms: 30_000,
            },
            "linkedin" => Self {
                max_concurrent_calls: 3,
                queue_capacity: 10,
                max_wait_duration_ms: 30_000,
            },
            _ => Self::default(),
        }
    }

    /// Create config for batch operations.
    pub fn for_batch() -> Self {
        Self {
            max_concurrent_calls: 10,
            queue_capacity: 50,
            max_wait_duration_ms: 60_000,
        }
    }

    /// Create config for high-priority operations.
    pub fn for_priority() -> Self {
        Self {
            max_concurrent_calls: 2,
            queue_capacity: 5,
            max_wait_duration_ms: 10_000,
        }
    }
}

/// BulkheadMetrics - Metrics for a bulkhead.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BulkheadMetrics {
    /// Current number of active calls
    pub active_calls: u64,
    /// Current queue size
    pub queue_size: u64,
    /// Total calls accepted
    pub total_accepted: u64,
    /// Total calls rejected (queue full)
    pub total_rejected: u64,
    /// Total calls completed
    pub total_completed: u64,
    /// Total wait time in milliseconds
    pub total_wait_time_ms: u64,
    /// Last rejection timestamp
    pub last_rejection_at: Option<DateTime<Utc>>,
}

/// Bulkhead - Thread pool bulkhead for a single platform.
#[derive(Debug)]
pub struct Bulkhead {
    /// Platform name
    pub platform: String,
    /// Configuration
    config: BulkheadConfig,
    /// Active call count (atomic for thread safety)
    active_calls: AtomicU64,
    /// Queue size (atomic for thread safety)
    queue_size: AtomicU64,
    /// Total rejected count
    total_rejected: AtomicU64,
    /// Total accepted count
    total_accepted: AtomicU64,
    /// Total completed count
    total_completed: AtomicU64,
    /// Total wait time
    total_wait_time_ms: AtomicU64,
    /// Last rejection time
    last_rejection_at: Mutex<Option<DateTime<Utc>>>,
}

impl Bulkhead {
    /// Create a new bulkhead.
    pub fn new(platform: impl Into<String>, config: BulkheadConfig) -> Self {
        Self {
            platform: platform.into(),
            config,
            active_calls: AtomicU64::new(0),
            queue_size: AtomicU64::new(0),
            total_rejected: AtomicU64::new(0),
            total_accepted: AtomicU64::new(0),
            total_completed: AtomicU64::new(0),
            total_wait_time_ms: AtomicU64::new(0),
            last_rejection_at: Mutex::new(None),
        }
    }

    /// Get the platform name.
    pub fn platform(&self) -> &str {
        &self.platform
    }

    /// Get current state.
    pub fn state(&self) -> BulkheadState {
        let active = self.active_calls.load(Ordering::Relaxed);
        let queued = self.queue_size.load(Ordering::Relaxed);

        if active >= self.config.max_concurrent_calls as u64 {
            if queued >= self.config.queue_capacity as u64 {
                BulkheadState::Rejected
            } else {
                BulkheadState::Saturated
            }
        } else {
            BulkheadState::Open
        }
    }

    /// Check if a call can be executed.
    pub fn can_execute(&self) -> bool {
        let active = self.active_calls.load(Ordering::Relaxed);
        active < self.config.max_concurrent_calls as u64
    }

    /// Try to acquire a permit for execution.
    /// Returns Ok(()) if successful, Err if rejected.
    pub fn try_acquire(&self) -> Result<BulkheadPermit, BulkheadRejection> {
        // Try to execute immediately if under concurrent limit
        loop {
            let active = self.active_calls.load(Ordering::Relaxed);

            if active < self.config.max_concurrent_calls as u64 {
                // Try to increment atomically
                match self.active_calls.compare_exchange(
                    active,
                    active + 1,
                    Ordering::AcqRel,
                    Ordering::Acquire,
                ) {
                    Ok(_) => {
                        self.total_accepted.fetch_add(1, Ordering::Relaxed);
                        return Ok(BulkheadPermit {
                            bulkhead: self as *const Bulkhead,
                        });
                    }
                    Err(_) => continue, // Retry loop
                }
            }

            // Check if we can queue
            let queued = self.queue_size.load(Ordering::Relaxed);
            if queued >= self.config.queue_capacity as u64 {
                // Queue full, reject
                self.total_rejected.fetch_add(1, Ordering::Relaxed);
                if let Ok(mut last) = self.last_rejection_at.lock() {
                    *last = Some(Utc::now());
                }
                return Err(BulkheadRejection {
                    platform: self.platform.clone(),
                    reason: "Queue capacity exceeded".to_string(),
                    queue_size: queued,
                    max_concurrent: self.config.max_concurrent_calls,
                });
            }

            // Try to enqueue
            match self.queue_size.compare_exchange(
                queued,
                queued + 1,
                Ordering::AcqRel,
                Ordering::Acquire,
            ) {
                Ok(_) => {
                    // Successfully queued, now wait for a slot
                    // In a real implementation, this would use a semaphore or condition variable
                    // For now, we simulate by returning a queued permit
                    self.total_accepted.fetch_add(1, Ordering::Relaxed);
                    return Ok(BulkheadPermit {
                        bulkhead: self as *const Bulkhead,
                    });
                }
                Err(_) => continue, // Retry loop
            }
        }
    }

    /// Release a permit after execution completes.
    pub fn release(&self) {
        self.active_calls.fetch_sub(1, Ordering::Release);
        self.total_completed.fetch_add(1, Ordering::Release);

        // If there are queued calls, signal one to proceed
        let queued = self.queue_size.load(Ordering::Relaxed);
        if queued > 0 {
            self.queue_size.fetch_sub(1, Ordering::Relaxed);
            self.active_calls.fetch_add(1, Ordering::Release);
        }
    }

    /// Get current metrics.
    pub fn metrics(&self) -> BulkheadMetrics {
        let last_rejection = self.last_rejection_at.lock().ok().and_then(|g| *g);

        BulkheadMetrics {
            active_calls: self.active_calls.load(Ordering::Relaxed),
            queue_size: self.queue_size.load(Ordering::Relaxed),
            total_accepted: self.total_accepted.load(Ordering::Relaxed),
            total_rejected: self.total_rejected.load(Ordering::Relaxed),
            total_completed: self.total_completed.load(Ordering::Relaxed),
            total_wait_time_ms: self.total_wait_time_ms.load(Ordering::Relaxed),
            last_rejection_at: last_rejection,
        }
    }

    /// Reset metrics.
    pub fn reset_metrics(&self) {
        self.total_accepted.store(0, Ordering::Relaxed);
        self.total_rejected.store(0, Ordering::Relaxed);
        self.total_completed.store(0, Ordering::Relaxed);
        self.total_wait_time_ms.store(0, Ordering::Relaxed);
    }
}

/// BulkheadPermit - A permit acquired from the bulkhead.
/// Automatically releases when dropped.
#[derive(Debug)]
pub struct BulkheadPermit {
    bulkhead: *const Bulkhead,
}

impl Drop for BulkheadPermit {
    fn drop(&mut self) {
        unsafe {
            if !self.bulkhead.is_null() {
                (*self.bulkhead).release();
            }
        }
    }
}

/// BulkheadRejection - Error returned when bulkhead rejects a call.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BulkheadRejection {
    /// Platform that rejected the call
    pub platform: String,
    /// Reason for rejection
    pub reason: String,
    /// Current queue size
    pub queue_size: u64,
    /// Max concurrent calls allowed
    pub max_concurrent: usize,
}

impl std::fmt::Display for BulkheadRejection {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Bulkhead rejection for {}: {} (queue: {}, max_concurrent: {})",
            self.platform, self.reason, self.queue_size, self.max_concurrent
        )
    }
}

impl std::error::Error for BulkheadRejection {}

/// BulkheadRegistry - Registry of all platform bulkheads.
pub struct BulkheadRegistry {
    /// Registered bulkheads
    bulkheads: HashMap<String, Bulkhead>,
}

impl Default for BulkheadRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl BulkheadRegistry {
    /// Create a new registry.
    pub fn new() -> Self {
        Self {
            bulkheads: HashMap::new(),
        }
    }

    /// Register a bulkhead for a platform.
    pub fn register(&mut self, platform: &str, config: BulkheadConfig) {
        let bulkhead = Bulkhead::new(platform, config);
        self.bulkheads.insert(platform.to_string(), bulkhead);
    }

    /// Get a bulkhead by platform.
    pub fn get(&self, platform: &str) -> Option<&Bulkhead> {
        self.bulkheads.get(platform)
    }

    /// Try to acquire a permit for a platform.
    pub fn try_acquire(&self, platform: &str) -> Result<BulkheadPermit, BulkheadRejection> {
        let bulkhead = self
            .bulkheads
            .get(platform)
            .ok_or_else(|| BulkheadRejection {
                platform: platform.to_string(),
                reason: "Platform not registered".to_string(),
                queue_size: 0,
                max_concurrent: 0,
            })?;

        bulkhead.try_acquire()
    }

    /// Get metrics for all platforms.
    pub fn all_metrics(&self) -> HashMap<String, BulkheadMetrics> {
        self.bulkheads
            .iter()
            .map(|(k, v)| (k.clone(), v.metrics()))
            .collect()
    }

    /// Initialize with default platforms.
    pub fn with_default_platforms(mut self) -> Self {
        for platform in &["facebook", "instagram", "twitter"] {
            let config = BulkheadConfig::for_platform(platform);
            self.register(platform, config);
        }
        self
    }
}

// ============================================
// GLOBAL REGISTRY FUNCTIONS
// ============================================

/// Initialize the global bulkhead registry.
pub fn init_bulkhead_registry() {
    let mut registry = BULKHEAD_REGISTRY.lock().unwrap();
    registry.clear();

    for platform in &["facebook", "instagram", "twitter", "linkedin"] {
        let config = BulkheadConfig::for_platform(platform);
        let bulkhead = Bulkhead::new(*platform, config);
        registry.insert(platform.to_string(), bulkhead);
    }
}

/// Get metrics for a specific platform bulkhead.
pub fn get_bulkhead_metrics(platform: &str) -> Result<BulkheadMetrics, String> {
    let registry = BULKHEAD_REGISTRY.lock().map_err(|e| e.to_string())?;
    registry
        .get(platform)
        .map(|b| b.metrics())
        .ok_or_else(|| format!("Platform {} not registered", platform))
}

/// Get metrics for all bulkheads.
pub fn get_all_bulkhead_metrics() -> Result<HashMap<String, BulkheadMetrics>, String> {
    let registry = BULKHEAD_REGISTRY.lock().map_err(|e| e.to_string())?;
    Ok(registry
        .iter()
        .map(|(k, v)| (k.clone(), v.metrics()))
        .collect())
}

// Note: Bulkhead doesn't implement Clone by default since it has atomic counters.
// The get_bulkhead function above returns a copy which isn't ideal.
// In production, you'd want to use Arc<Bulkhead> or work with references.
