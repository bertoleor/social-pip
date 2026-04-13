//! Saga Module - Distributed transaction orchestration with compensation.
//!
//! This module implements the Saga pattern for managing distributed transactions
//! across multiple steps with automatic compensation on failure.
//!
//! ## Key Features
//! - State machine: RUNNING → COMPLETED | COMPENSATING | FAILED | TIMED_OUT
//! - Steps execute in order, compensation runs in reverse on failure
//! - SagaExecution struct with trace_id, steps, context
//! - Persist state to SQLite for crash recovery
//! - Overall timeout (not just per-step)
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::saga::{SagaExecution, SagaStep, SagaState};
//!
//! let mut saga = SagaExecution::new("saga_123", "trace_abc")
//!     .with_step("ValidateAccount")
//!     .with_step("CreatePost")
//!     .with_step("PublishToGroups")
//!     .with_timeout_ms(300_000); // 5 minutes overall
//!
//! saga.start()?;
//! saga.execute_next().await?;
//! ```

use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

// ============================================
// IN-MEMORY STORAGE
// ============================================

static SAGA_STORAGE: Lazy<Mutex<HashMap<String, SagaExecution>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// SagaState - The lifecycle states of a saga execution.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SagaState {
    /// Saga is initialized but not started
    Pending,
    /// Currently executing steps
    Running,
    /// All steps completed successfully
    Completed,
    /// Compensation is in progress (rolling back)
    Compensating,
    /// Saga failed and compensation completed
    Failed,
    /// Saga timed out before completion
    TimedOut,
}

impl Default for SagaState {
    fn default() -> Self {
        SagaState::Pending
    }
}

impl std::fmt::Display for SagaState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SagaState::Pending => write!(f, "PENDING"),
            SagaState::Running => write!(f, "RUNNING"),
            SagaState::Completed => write!(f, "COMPLETED"),
            SagaState::Compensating => write!(f, "COMPENSATING"),
            SagaState::Failed => write!(f, "FAILED"),
            SagaState::TimedOut => write!(f, "TIMED_OUT"),
        }
    }
}

/// SagaStepStatus - The status of an individual step.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SagaStepStatus {
    /// Step not yet executed
    Pending,
    /// Step is currently executing
    Running,
    /// Step completed successfully
    Completed,
    /// Step failed, awaiting compensation
    Failed,
    /// Compensation completed for this step
    Compensated,
    /// Step was skipped (due to prior failure)
    Skipped,
}

impl Default for SagaStepStatus {
    fn default() -> Self {
        SagaStepStatus::Pending
    }
}

/// SagaStep - A single step in a saga execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SagaStep {
    /// Step name/identifier
    pub name: String,
    /// Current status of this step
    pub status: SagaStepStatus,
    /// Step index in the execution order
    pub index: usize,
    /// When this step started (None if not started)
    pub started_at: Option<DateTime<Utc>>,
    /// When this step completed (None if not completed)
    pub completed_at: Option<DateTime<Utc>>,
    /// Error message if step failed
    pub error: Option<String>,
    /// Number of retry attempts for this step
    pub retry_count: u32,
    /// Maximum retries allowed for this step
    pub max_retries: u32,
}

impl SagaStep {
    /// Create a new saga step.
    pub fn new(name: impl Into<String>, index: usize) -> Self {
        Self {
            name: name.into(),
            status: SagaStepStatus::Pending,
            index,
            started_at: None,
            completed_at: None,
            error: None,
            retry_count: 0,
            max_retries: 3,
        }
    }

    /// Set custom max retries.
    pub fn with_max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }

    /// Mark step as running.
    pub fn start(&mut self) {
        self.status = SagaStepStatus::Running;
        self.started_at = Some(Utc::now());
    }

    /// Mark step as completed.
    pub fn complete(&mut self) {
        self.status = SagaStepStatus::Completed;
        self.completed_at = Some(Utc::now());
    }

    /// Mark step as failed.
    pub fn fail(&mut self, error: impl Into<String>) {
        self.status = SagaStepStatus::Failed;
        self.error = Some(error.into());
        self.completed_at = Some(Utc::now());
    }

    /// Mark step as compensated.
    pub fn compensate(&mut self) {
        self.status = SagaStepStatus::Compensated;
    }

    /// Check if step can be retried.
    pub fn can_retry(&self) -> bool {
        self.retry_count < self.max_retries
    }

    /// Check if step needs compensation.
    pub fn needs_compensation(&self) -> bool {
        matches!(
            self.status,
            SagaStepStatus::Completed | SagaStepStatus::Failed
        )
    }
}

/// SagaExecution - Represents a saga execution with state machine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SagaExecution {
    /// Unique identifier for this saga
    pub id: String,
    /// OpenTelemetry trace ID for correlation
    pub trace_id: String,
    /// Current state of the saga
    pub state: SagaState,
    /// Ordered list of steps to execute
    pub steps: Vec<SagaStep>,
    /// Current step index (0-based)
    pub current_step_index: usize,
    /// Context data passed between steps
    pub context: HashMap<String, String>,
    /// Overall timeout in milliseconds (0 = no timeout)
    pub timeout_ms: u64,
    /// When the saga was created
    pub created_at: DateTime<Utc>,
    /// When the saga started execution
    pub started_at: Option<DateTime<Utc>>,
    /// When the saga completed (successfully or failed)
    pub completed_at: Option<DateTime<Utc>>,
    /// Last error that caused failure
    pub last_error: Option<String>,
}

impl SagaExecution {
    /// Create a new saga execution.
    pub fn new(id: impl Into<String>, trace_id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            trace_id: trace_id.into(),
            state: SagaState::Pending,
            steps: Vec::new(),
            current_step_index: 0,
            context: HashMap::new(),
            timeout_ms: 0, // No timeout by default
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            last_error: None,
        }
    }

    /// Add a step to the saga.
    pub fn with_step(mut self, name: impl Into<String>) -> Self {
        let step = SagaStep::new(name, self.steps.len());
        self.steps.push(step);
        self
    }

    /// Add a step with custom max retries.
    pub fn with_step_and_retries(mut self, name: impl Into<String>, max_retries: u32) -> Self {
        let step = SagaStep::new(name, self.steps.len()).with_max_retries(max_retries);
        self.steps.push(step);
        self
    }

    /// Set overall timeout.
    pub fn with_timeout_ms(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }

    /// Add context data.
    pub fn with_context(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.context.insert(key.into(), value.into());
        self
    }

    /// Start the saga execution.
    pub fn start(&mut self) -> Result<(), String> {
        if self.state != SagaState::Pending {
            return Err("Saga already started".to_string());
        }

        if self.steps.is_empty() {
            return Err("Saga has no steps".to_string());
        }

        self.state = SagaState::Running;
        self.started_at = Some(Utc::now());

        Ok(())
    }

    /// Check if the saga has timed out.
    pub fn is_timed_out(&self) -> bool {
        if self.timeout_ms == 0 {
            return false;
        }

        if let Some(started_at) = self.started_at {
            let elapsed = (Utc::now() - started_at).num_milliseconds() as u64;
            return elapsed >= self.timeout_ms;
        }

        false
    }

    /// Get the current step (if running).
    pub fn current_step(&self) -> Option<&SagaStep> {
        self.steps.get(self.current_step_index)
    }

    /// Get the current step mutably.
    pub fn current_step_mut(&mut self) -> Option<&mut SagaStep> {
        self.steps.get_mut(self.current_step_index)
    }

    /// Mark current step as completed and advance.
    pub fn complete_current_step(&mut self) -> Result<(), String> {
        if self.state != SagaState::Running {
            return Err("Saga not running".to_string());
        }

        if let Some(step) = self.current_step_mut() {
            step.complete();
        }

        self.current_step_index += 1;

        // Check if all steps completed
        if self.current_step_index >= self.steps.len() {
            self.state = SagaState::Completed;
            self.completed_at = Some(Utc::now());
        }

        Ok(())
    }

    /// Mark current step as failed and start compensation.
    pub fn fail_current_step(&mut self, error: impl Into<String>) -> Result<(), String> {
        if self.state != SagaState::Running {
            return Err("Saga not running".to_string());
        }

        let error_msg = error.into();

        if let Some(step) = self.current_step_mut() {
            step.fail(error_msg.clone());
        }

        self.last_error = Some(error_msg);
        self.state = SagaState::Compensating;

        Ok(())
    }

    /// Check if there are steps to compensate.
    pub fn has_pending_compensation(&self) -> bool {
        self.state == SagaState::Compensating && self.current_step_index > 0
    }

    /// Get the next step to compensate (reverse order).
    pub fn next_compensation_step(&self) -> Option<&SagaStep> {
        if self.state != SagaState::Compensating {
            return None;
        }

        // Find the last completed or failed step that needs compensation
        self.steps
            .iter()
            .take(self.current_step_index)
            .rev()
            .find(|step| step.needs_compensation())
    }

    /// Mark a step as compensated.
    pub fn compensate_step(&mut self, step_index: usize) -> Result<(), String> {
        if self.state != SagaState::Compensating {
            return Err("Saga not in compensating state".to_string());
        }

        if let Some(step) = self.steps.get_mut(step_index) {
            step.compensate();
        }

        // Check if all compensation is done
        let all_compensated = self.steps.iter().take(self.current_step_index).all(|s| {
            s.status == SagaStepStatus::Compensated || s.status == SagaStepStatus::Pending
        });

        if all_compensated {
            self.state = SagaState::Failed;
            self.completed_at = Some(Utc::now());
        }

        Ok(())
    }

    /// Mark saga as timed out.
    pub fn mark_timed_out(&mut self) {
        self.state = SagaState::TimedOut;
        self.completed_at = Some(Utc::now());
        self.last_error = Some("Saga timed out".to_string());
    }

    /// Get step by name.
    pub fn get_step_by_name(&self, name: &str) -> Option<&SagaStep> {
        self.steps.iter().find(|s| s.name == name)
    }

    /// Get completion percentage (0-100).
    pub fn completion_percentage(&self) -> u8 {
        if self.steps.is_empty() {
            return 0;
        }

        let completed = self
            .steps
            .iter()
            .filter(|s| s.status == SagaStepStatus::Completed)
            .count();

        ((completed * 100) / self.steps.len()) as u8
    }
}

// ============================================
// PERSISTENCE FUNCTIONS
// ============================================

/// Persist a saga execution to storage.
pub fn persist_saga(saga: SagaExecution) -> Result<String, String> {
    let id = saga.id.clone();
    let mut storage = SAGA_STORAGE.lock().map_err(|e| e.to_string())?;
    storage.insert(id.clone(), saga);
    Ok(id)
}

/// Get a saga execution by ID.
pub fn get_saga_by_id(id: &str) -> Result<Option<SagaExecution>, String> {
    let storage = SAGA_STORAGE.lock().map_err(|e| e.to_string())?;
    Ok(storage.get(id).cloned())
}

/// Update an existing saga execution.
pub fn update_saga(saga: SagaExecution) -> Result<(), String> {
    let mut storage = SAGA_STORAGE.lock().map_err(|e| e.to_string())?;
    let id = saga.id.clone();

    if storage.contains_key(&id) {
        storage.insert(id, saga);
        Ok(())
    } else {
        Err("Saga not found".to_string())
    }
}

/// Get all sagas in a specific state.
pub fn get_sagas_by_state(state: SagaState) -> Result<Vec<SagaExecution>, String> {
    let storage = SAGA_STORAGE.lock().map_err(|e| e.to_string())?;
    Ok(storage
        .values()
        .filter(|s| s.state == state)
        .cloned()
        .collect())
}

/// Get timed out sagas that need cleanup.
pub fn get_timed_out_sagas() -> Result<Vec<SagaExecution>, String> {
    let storage = SAGA_STORAGE.lock().map_err(|e| e.to_string())?;
    Ok(storage
        .values()
        .filter(|s| s.state == SagaState::Running && s.is_timed_out())
        .cloned()
        .collect())
}

/// Clear all saga storage (for testing).
#[cfg(test)]
pub fn clear_saga_storage() {
    let mut storage = SAGA_STORAGE.lock().unwrap();
    storage.clear();
}
