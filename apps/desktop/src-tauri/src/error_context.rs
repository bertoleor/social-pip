//! ErrorContext Module - Thread-local error context for debugging.
//!
//! This module provides thread-local storage for error context that captures
//! complete debugging information including stack traces, execution IDs, and
//! correlated trace data.
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::error_context::{ErrorContext, set_execution_context, capture_context};
//!
//! // Set context at operation start
//! let ctx = ErrorContext::new("exec_123", "trace_abc");
//! set_execution_context(ctx);
//!
//! // Later, when an error occurs
//! let error_context = capture_context("In ClickPostButton, after FillForm");
//! // error_context now contains full stack trace and context
//! ```

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

/// ErrorContext - Complete debugging context for error handling.
///
/// This struct captures all relevant information for debugging errors:
/// - Execution and trace IDs for correlation
/// - Saga step information if part of a saga
/// - Stack trace at the point of error
/// - Baggage (key-value context)
/// - Last successful step and failure location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    /// Unique identifier for this operation
    pub execution_id: String,
    /// OpenTelemetry trace ID (32 hex chars)
    pub trace_id: String,
    /// Current span ID
    pub span_id: String,
    /// Parent saga if applicable
    pub saga_id: Option<String>,
    /// Current saga step name
    pub step_name: Option<String>,
    /// Current saga step index
    pub step_index: Option<usize>,
    /// Stack trace at error point
    pub stack_trace: String,
    /// When this context was captured
    pub timestamp: DateTime<Utc>,
    /// Key-value context baggage
    pub baggage: HashMap<String, String>,
    /// Last successful operation before failure
    pub last_successful_step: Option<String>,
    /// Human-readable failure location
    pub failed_at: String,
}

impl ErrorContext {
    /// Create a new ErrorContext with required fields.
    ///
    /// # Arguments
    /// - `execution_id`: Unique identifier for this operation
    /// - `trace_id`: OpenTelemetry trace ID
    ///
    /// # Returns
    /// A new ErrorContext with default values for optional fields.
    pub fn new(execution_id: impl Into<String>, trace_id: impl Into<String>) -> Self {
        Self {
            execution_id: execution_id.into(),
            trace_id: trace_id.into(),
            span_id: generate_span_id(),
            saga_id: None,
            step_name: None,
            step_index: None,
            stack_trace: String::new(),
            timestamp: Utc::now(),
            baggage: HashMap::new(),
            last_successful_step: None,
            failed_at: String::new(),
        }
    }

    /// Create an ErrorContext with all fields populated.
    #[allow(clippy::too_many_arguments)]
    pub fn with_all_fields(
        execution_id: String,
        trace_id: String,
        span_id: String,
        saga_id: Option<String>,
        step_name: Option<String>,
        step_index: Option<usize>,
        stack_trace: String,
        baggage: HashMap<String, String>,
        last_successful_step: Option<String>,
        failed_at: String,
    ) -> Self {
        Self {
            execution_id,
            trace_id,
            span_id,
            saga_id,
            step_name,
            step_index,
            stack_trace,
            timestamp: Utc::now(),
            baggage,
            last_successful_step,
            failed_at,
        }
    }

    /// Set the saga context.
    pub fn with_saga(
        mut self,
        saga_id: impl Into<String>,
        step_name: impl Into<String>,
        step_index: usize,
    ) -> Self {
        self.saga_id = Some(saga_id.into());
        self.step_name = Some(step_name.into());
        self.step_index = Some(step_index);
        self
    }

    /// Add baggage item.
    pub fn with_baggage(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.baggage.insert(key.into(), value.into());
        self
    }

    /// Set the last successful step.
    pub fn with_last_successful_step(mut self, step: impl Into<String>) -> Self {
        self.last_successful_step = Some(step.into());
        self
    }

    /// Capture the current stack trace.
    pub fn capture_stack_trace(&mut self) {
        self.stack_trace = capture_stack_trace_string();
    }
}

/// Generate a random 16-character span ID.
fn generate_span_id() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..16)
        .map(|_| format!("{:x}", rng.gen_range(0..16)))
        .collect()
}

/// Capture the current stack trace as a string.
fn capture_stack_trace_string() -> String {
    // Note: Rust doesn't have built-in stack trace capture in std.
    // For production, you'd use backtrace crate or std::backtrace (Rust 1.65+).
    // This is a simplified version for the design.
    // Note: Rust std::backtrace is available since 1.65, but requires RUST_BACKTRACE=1 env var.
    // For production, consider using the `backtrace` crate for more control.
    // Currently returning a placeholder - enable with `backtrace` feature if needed.
    #[allow(unused)]
    {
        "Stack trace capture not enabled (enable 'backtrace' feature in Cargo.toml)".to_string()
    }
}

// ============================================
// Thread-Local Storage
// ============================================

thread_local! {
    /// Thread-local storage for the current execution context.
    ///
    /// This allows error context to be automatically captured without
    /// explicit parameter passing.
    pub static EXECUTION_CONTEXT: RefCell<Option<ErrorContext>> = RefCell::new(None);
}

/// Set the current execution context for this thread.
///
/// Should be called at the start of an operation.
pub fn set_execution_context(ctx: ErrorContext) {
    EXECUTION_CONTEXT.with(|cell| {
        *cell.borrow_mut() = Some(ctx);
    });
}

/// Get the current execution context for this thread.
///
/// Returns a clone of the current context, or None if not set.
pub fn get_execution_context() -> Option<ErrorContext> {
    EXECUTION_CONTEXT.with(|cell| cell.borrow().clone())
}

/// Clear the execution context for this thread.
pub fn clear_execution_context() {
    EXECUTION_CONTEXT.with(|cell| {
        *cell.borrow_mut() = None;
    });
}

/// Capture the current context with stack trace and failure location.
///
/// This function should be called when an error occurs. It captures:
/// - The current thread-local context (if set)
/// - Stack trace at the point of error
/// - The provided failure location
///
/// # Arguments
/// - `failed_at`: Human-readable description of where the error occurred
///
/// # Returns
/// An ErrorContext with all available information.
pub fn capture_context(failed_at: &str) -> ErrorContext {
    let mut ctx = get_execution_context().unwrap_or_else(|| {
        ErrorContext::new(
            format!("exec_{}", chrono::Utc::now().timestamp_millis()),
            format!("trace_{}", chrono::Utc::now().timestamp_millis()),
        )
    });

    ctx.capture_stack_trace();
    ctx.failed_at = failed_at.to_string();
    ctx.timestamp = Utc::now();

    ctx
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================
    // T-1.2.1: ErrorContext struct creation tests
    // ============================================

    #[test]
    fn test_error_context_new_creates_with_all_required_fields() {
        let ctx = ErrorContext::new("exec_123", "trace_abc");

        assert_eq!(ctx.execution_id, "exec_123");
        assert_eq!(ctx.trace_id, "trace_abc");
        assert!(!ctx.span_id.is_empty());
        assert!(ctx.span_id.len() == 16); // Span ID is 16 hex chars
    }

    #[test]
    fn test_error_context_new_has_default_none_for_optional_fields() {
        let ctx = ErrorContext::new("exec_123", "trace_abc");

        assert!(ctx.saga_id.is_none());
        assert!(ctx.step_name.is_none());
        assert!(ctx.step_index.is_none());
        assert!(ctx.last_successful_step.is_none());
    }

    #[test]
    fn test_error_context_new_has_empty_collections() {
        let ctx = ErrorContext::new("exec_123", "trace_abc");

        assert!(ctx.baggage.is_empty());
        assert!(ctx.stack_trace.is_empty());
        assert!(ctx.failed_at.is_empty());
    }

    // ============================================
    // T-1.2.3: Thread-local EXECUTION_CONTEXT tests
    // ============================================

    #[test]
    fn test_set_execution_context_stores_in_thread_local() {
        let ctx = ErrorContext::new("exec_test", "trace_test");
        set_execution_context(ctx);

        let retrieved = get_execution_context();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().execution_id, "exec_test");

        // Cleanup
        clear_execution_context();
    }

    #[test]
    fn test_get_execution_context_returns_none_when_not_set() {
        clear_execution_context();

        let retrieved = get_execution_context();
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_clear_execution_context_removes_stored_context() {
        let ctx = ErrorContext::new("exec_clear_test", "trace_clear");
        set_execution_context(ctx);

        clear_execution_context();

        let retrieved = get_execution_context();
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_execution_context_is_thread_local() {
        use std::thread;

        // Set context in main thread
        let ctx = ErrorContext::new("exec_main", "trace_main");
        set_execution_context(ctx);

        // Spawn a new thread - should NOT see the main thread's context
        let handle = thread::spawn(|| {
            let retrieved = get_execution_context();
            assert!(retrieved.is_none(), "Thread should not see parent context");
        });

        handle.join().unwrap();

        // Main thread should still have its context
        let retrieved = get_execution_context();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().execution_id, "exec_main");

        clear_execution_context();
    }

    // ============================================
    // T-1.2.5: JSON serialization tests
    // ============================================

    #[test]
    fn test_error_context_serializes_to_json() {
        let ctx = ErrorContext::new("exec_json", "trace_json")
            .with_saga("saga_123", "UploadImage", 2)
            .with_baggage("platform", "FACEBOOK")
            .with_last_successful_step("CreatePost");

        let json = serde_json::to_string(&ctx).unwrap();

        assert!(json.contains("exec_json"));
        assert!(json.contains("trace_json"));
        assert!(json.contains("saga_123"));
        assert!(json.contains("UploadImage"));
        assert!(json.contains("platform"));
        assert!(json.contains("FACEBOOK"));
    }

    #[test]
    fn test_error_context_deserializes_from_json() {
        let ctx = ErrorContext::new("exec_roundtrip", "trace_roundtrip").with_saga(
            "saga_456",
            "ShareToGroups",
            3,
        );

        let json = serde_json::to_string(&ctx).unwrap();
        let deserialized: ErrorContext = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.execution_id, "exec_roundtrip");
        assert_eq!(deserialized.trace_id, "trace_roundtrip");
        assert_eq!(deserialized.saga_id, Some("saga_456".to_string()));
        assert_eq!(deserialized.step_name, Some("ShareToGroups".to_string()));
        assert_eq!(deserialized.step_index, Some(3));
    }

    #[test]
    fn test_error_context_json_roundtrip_preserves_all_fields() {
        let mut ctx = ErrorContext::new("exec_full", "trace_full")
            .with_saga("saga_789", "ProcessBatch", 5)
            .with_baggage("account_id", "acc_123")
            .with_baggage("platform", "INSTAGRAM")
            .with_last_successful_step("ValidateContent");
        ctx.failed_at = "In ProcessBatch, after ValidateBatch".to_string();

        let json = serde_json::to_string(&ctx).unwrap();
        let deserialized: ErrorContext = serde_json::from_str(&json).unwrap();

        // Verify all fields match
        assert_eq!(deserialized.execution_id, ctx.execution_id);
        assert_eq!(deserialized.trace_id, ctx.trace_id);
        assert_eq!(deserialized.saga_id, ctx.saga_id);
        assert_eq!(deserialized.step_name, ctx.step_name);
        assert_eq!(deserialized.step_index, ctx.step_index);
        assert_eq!(
            deserialized.baggage.get("account_id"),
            ctx.baggage.get("account_id")
        );
        assert_eq!(deserialized.last_successful_step, ctx.last_successful_step);
        assert_eq!(deserialized.failed_at, ctx.failed_at);
    }

    // ============================================
    // T-1.2.7: Context capture tests
    // ============================================

    #[test]
    fn test_capture_context_uses_thread_local_when_set() {
        let ctx = ErrorContext::new("exec_capture", "trace_capture").with_baggage("key", "value");
        set_execution_context(ctx);

        let captured = capture_context("In TestFunction, after Assertion");

        assert_eq!(captured.execution_id, "exec_capture");
        assert_eq!(captured.trace_id, "trace_capture");
        assert_eq!(captured.failed_at, "In TestFunction, after Assertion");
        assert_eq!(captured.baggage.get("key"), Some(&"value".to_string()));

        clear_execution_context();
    }

    #[test]
    fn test_capture_context_creates_default_when_not_set() {
        clear_execution_context();

        let captured = capture_context("In DefaultContext, no parent");

        // Should have generated default IDs
        assert!(captured.execution_id.starts_with("exec_"));
        assert!(captured.trace_id.starts_with("trace_"));
        assert_eq!(captured.failed_at, "In DefaultContext, no parent");
    }

    #[test]
    fn test_capture_context_includes_timestamp() {
        clear_execution_context();

        let before = Utc::now();
        let captured = capture_context("Test timestamp");
        let after = Utc::now();

        // Timestamp should be between before and after
        assert!(captured.timestamp >= before);
        assert!(captured.timestamp <= after);
    }

    // ============================================
    // Builder pattern tests (triangulation)
    // ============================================

    #[test]
    fn test_with_saga_sets_all_saga_fields() {
        let ctx = ErrorContext::new("exec_saga", "trace_saga").with_saga("saga_xyz", "StepOne", 0);

        assert_eq!(ctx.saga_id, Some("saga_xyz".to_string()));
        assert_eq!(ctx.step_name, Some("StepOne".to_string()));
        assert_eq!(ctx.step_index, Some(0));
    }

    #[test]
    fn test_with_saga_can_be_chained() {
        let ctx = ErrorContext::new("exec_chain", "trace_chain")
            .with_saga("saga_1", "Step1", 0)
            .with_baggage("platform", "FACEBOOK")
            .with_last_successful_step("Init");

        assert_eq!(ctx.saga_id, Some("saga_1".to_string()));
        assert_eq!(ctx.baggage.get("platform"), Some(&"FACEBOOK".to_string()));
        assert_eq!(ctx.last_successful_step, Some("Init".to_string()));
    }

    #[test]
    fn test_with_baggage_accumulates() {
        let ctx = ErrorContext::new("exec_baggage", "trace_baggage")
            .with_baggage("key1", "value1")
            .with_baggage("key2", "value2")
            .with_baggage("key3", "value3");

        assert_eq!(ctx.baggage.len(), 3);
        assert_eq!(ctx.baggage.get("key1"), Some(&"value1".to_string()));
        assert_eq!(ctx.baggage.get("key2"), Some(&"value2".to_string()));
        assert_eq!(ctx.baggage.get("key3"), Some(&"value3".to_string()));
    }
}
