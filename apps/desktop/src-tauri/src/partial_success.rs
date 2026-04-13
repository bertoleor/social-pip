//! Partial Success Module - Handle batches where some items succeed, some fail.
//!
//! This module implements the ContinueOnFail pattern for batch operations,
//! allowing graceful handling of partial failures.
//!
//! ## Key Features
//! - BatchResult<T> with total, succeeded, failed, success_rate
//! - ContinueOnFail with max_failures threshold
//! - Retry failed items only (not entire batch)
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::partial_success::{BatchResult, BatchConfig, BatchProcessor};
//!
//! let config = BatchConfig {
//!     batch_type: "PostToGroups".to_string(),
//!     continue_on_fail: true,
//!     max_failures: Some(5),
//!     ..Default::default()
//! };
//!
//! let items = vec!["group1", "group2", "group3"];
//! let result = processor.process_batch(items, config, |item| {
//!     post_to_group(item)
//! }).await;
//!
//! // Retry only failed items
//! if result.has_failures() {
//!     let retry_result = processor.retry_failed(&result, |item| {
//!         post_to_group(item)
//!     }).await;
//! }
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================
// BATCH ERROR
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchError {
    pub error_type: String,
    pub message: String,
    pub context: Option<HashMap<String, String>>,
}

impl BatchError {
    pub fn new(error_type: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            error_type: error_type.into(),
            message: message.into(),
            context: None,
        }
    }

    pub fn with_context(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.context
            .get_or_insert_with(HashMap::new)
            .insert(key.into(), value.into());
        self
    }
}

impl std::fmt::Display for BatchError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.error_type, self.message)
    }
}

// ============================================
// BATCH RESULT
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult<T> {
    pub total: usize,
    pub succeeded: Vec<(usize, T)>,
    pub failed: Vec<(usize, BatchError)>,
    pub success_rate: f64,
    pub continue_on_fail: bool,
    pub stopped_early: bool,
    pub stopped_reason: Option<String>,
}

impl<T> BatchResult<T> {
    pub fn new(total: usize, continue_on_fail: bool) -> Self {
        Self {
            total,
            succeeded: Vec::new(),
            failed: Vec::new(),
            success_rate: 0.0,
            continue_on_fail,
            stopped_early: false,
            stopped_reason: None,
        }
    }

    pub fn add_success(&mut self, index: usize, result: T) {
        self.succeeded.push((index, result));
        self.update_success_rate();
    }

    pub fn add_failure(&mut self, index: usize, error: BatchError) {
        self.failed.push((index, error));
        self.update_success_rate();
    }

    fn update_success_rate(&mut self) {
        if self.total > 0 {
            self.success_rate = self.succeeded.len() as f64 / self.total as f64;
        }
    }

    pub fn success_count(&self) -> usize {
        self.succeeded.len()
    }

    pub fn failure_count(&self) -> usize {
        self.failed.len()
    }

    pub fn has_failures(&self) -> bool {
        !self.failed.is_empty()
    }

    pub fn is_complete_success(&self) -> bool {
        self.failed.is_empty() && self.succeeded.len() == self.total
    }

    pub fn is_complete_failure(&self) -> bool {
        self.succeeded.is_empty() && self.failed.len() == self.total
    }

    pub fn mark_stopped(&mut self, reason: impl Into<String>) {
        self.stopped_early = true;
        self.stopped_reason = Some(reason.into());
    }

    pub fn failed_indices(&self) -> Vec<usize> {
        self.failed.iter().map(|(i, _)| *i).collect()
    }

    pub fn succeeded_indices(&self) -> Vec<usize> {
        self.succeeded.iter().map(|(i, _)| *i).collect()
    }

    pub fn get_failed_items<'a>(&self, original: &'a [T]) -> Vec<(usize, &'a T)>
    where
        T: Clone,
    {
        self.failed
            .iter()
            .filter_map(|(idx, _)| original.get(*idx).map(|item| (*idx, item)))
            .collect()
    }

    pub fn success_percentage(&self) -> u8 {
        (self.success_rate * 100.0).round() as u8
    }
}

impl<T: Clone> BatchResult<T> {
    pub fn retryable_errors(&self) -> impl Iterator<Item = &(usize, BatchError)> {
        self.failed
            .iter()
            .filter(|(_, error)| error.error_type != "NON_RETRYABLE")
    }
}

// ============================================
// MAX FAILURE ACTION
// ============================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MaxFailureAction {
    StopAndReport,
    Escalate,
    DeadLetter,
}

impl Default for MaxFailureAction {
    fn default() -> Self {
        MaxFailureAction::StopAndReport
    }
}

// ============================================
// BATCH CONFIG
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchConfig {
    pub batch_type: String,
    pub continue_on_fail: bool,
    pub max_failures: Option<usize>,
    pub on_max_failures: MaxFailureAction,
}

impl Default for BatchConfig {
    fn default() -> Self {
        Self {
            batch_type: "default".to_string(),
            continue_on_fail: true,
            max_failures: None,
            on_max_failures: MaxFailureAction::StopAndReport,
        }
    }
}

impl BatchConfig {
    pub fn for_batch_type(batch_type: &str) -> Self {
        let (continue_on_fail, max_failures, on_max_failures) = match batch_type {
            "PostToGroups" => (true, Some(5), MaxFailureAction::StopAndReport),
            "UploadMedia" => (true, Some(3), MaxFailureAction::StopAndReport),
            "GenerateCaptions" => (false, Some(0), MaxFailureAction::StopAndReport),
            "ValidateAccounts" => (true, Some(10), MaxFailureAction::Escalate),
            "FetchGroupList" => (true, Some(2), MaxFailureAction::StopAndReport),
            _ => (true, None, MaxFailureAction::StopAndReport),
        };

        Self {
            batch_type: batch_type.to_string(),
            continue_on_fail,
            max_failures,
            on_max_failures,
        }
    }

    pub fn should_stop(&self, failure_count: usize) -> bool {
        if !self.continue_on_fail {
            return failure_count > 0;
        }

        if let Some(max) = self.max_failures {
            return failure_count >= max;
        }

        false
    }
}

// ============================================
// BATCH PROCESSOR
// ============================================

pub struct BatchProcessor;

impl BatchProcessor {
    pub fn new() -> Self {
        Self
    }

    pub fn process_batch<T, R, F>(
        items: &[T],
        config: BatchConfig,
        mut processor: F,
    ) -> BatchResult<R>
    where
        F: FnMut(&T) -> Result<R, BatchError>,
    {
        let mut result = BatchResult::new(items.len(), config.continue_on_fail);

        for (index, item) in items.iter().enumerate() {
            match processor(item) {
                Ok(value) => result.add_success(index, value),
                Err(error) => {
                    result.add_failure(index, error);

                    if config.should_stop(result.failure_count()) {
                        result.mark_stopped(format!(
                            "Max failures ({}) reached",
                            result.failure_count()
                        ));
                        break;
                    }
                }
            }
        }

        result
    }

    pub fn retry_failed<T, R, F>(
        original_items: &[T],
        result: &BatchResult<R>,
        mut processor: F,
    ) -> BatchResult<R>
    where
        F: FnMut(&T) -> Result<R, BatchError>,
        T: Clone,
    {
        let failed_indices = result.failed_indices();
        let mut retry_result = BatchResult::new(failed_indices.len(), true);

        for (original_index, _) in result.failed.iter() {
            if let Some(item) = original_items.get(*original_index) {
                match processor(item) {
                    Ok(value) => retry_result.add_success(*original_index, value),
                    Err(error) => retry_result.add_failure(*original_index, error),
                }
            }
        }

        retry_result
    }

    pub fn merge_results<R>(original: BatchResult<R>, retry: BatchResult<R>) -> BatchResult<R> {
        let mut merged = BatchResult::new(original.total, original.continue_on_fail);

        for (idx, result) in original.succeeded {
            merged.add_success(idx, result);
        }

        for (idx, result) in retry.succeeded {
            merged.add_success(idx, result);
        }

        for (idx, error) in retry.failed {
            merged.add_failure(idx, error);
        }

        merged
    }
}

impl Default for BatchProcessor {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

pub fn create_batch_result<T>(total: usize, continue_on_fail: bool) -> BatchResult<T> {
    BatchResult::new(total, continue_on_fail)
}

pub fn get_batch_config(batch_type: &str) -> BatchConfig {
    BatchConfig::for_batch_type(batch_type)
}

pub fn process_batch<T, R, F>(items: &[T], config: BatchConfig, processor: F) -> BatchResult<R>
where
    F: FnMut(&T) -> Result<R, BatchError>,
{
    BatchProcessor::process_batch(items, config, processor)
}

pub fn retry_failed<T, R, F>(
    original_items: &[T],
    result: &BatchResult<R>,
    processor: F,
) -> BatchResult<R>
where
    F: FnMut(&T) -> Result<R, BatchError>,
    T: Clone,
{
    BatchProcessor::retry_failed(original_items, result, processor)
}
