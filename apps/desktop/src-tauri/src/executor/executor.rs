//! Executor implementation - Tokio-based background job processor

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, Mutex};
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

use crate::anti_ban::{AntiBanEngine, get_platform_config};
use crate::database::{InMemoryStore, PostJobModel};

// ============================================
// CONFIGURATION
// ============================================

/// Configuration for the Executor
#[derive(Debug, Clone)]
pub struct ExecutorConfig {
    /// Polling interval in milliseconds
    pub poll_interval_ms: u64,
    /// Maximum concurrent jobs to process
    pub max_concurrent_jobs: usize,
    /// Enable anti-ban integration
    pub anti_ban_enabled: bool,
    /// Default platform for anti-ban engine
    pub default_platform: String,
}

impl Default for ExecutorConfig {
    fn default() -> Self {
        Self {
            poll_interval_ms: 5000,
            max_concurrent_jobs: 3,
            anti_ban_enabled: true,
            default_platform: "facebook_groups".to_string(),
        }
    }
}

// ============================================
// EXECUTOR STATE
// ============================================

/// Current state of the executor
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ExecutorState {
    /// Executor is stopped
    Stopped,
    /// Executor is starting up
    Starting,
    /// Executor is running and processing jobs
    Running,
    /// Executor is shutting down gracefully
    Stopping,
}

// ============================================
// JOB EVENTS
// ============================================

/// Events emitted by the executor
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum JobEvent {
    /// Job started processing
    JobStarted { 
        job_id: String, 
        session_id: String 
    },
    /// Job completed successfully
    JobCompleted { 
        job_id: String, 
        session_id: String, 
        post_url: Option<String> 
    },
    /// Job failed
    JobFailed { 
        job_id: String, 
        session_id: String, 
        error: String, 
        category: Option<String> 
    },
    /// Batch break needed
    BatchBreakNeeded { 
        session_id: String, 
        duration_ms: u64 
    },
    /// Risk level event
    RiskLevel { 
        session_id: String, 
        level: String 
    },
}

// ============================================
// EXECUTOR
// ============================================

/// Background job executor
pub struct Executor {
    /// Configuration
    config: ExecutorConfig,
    /// Current state
    state: Arc<Mutex<ExecutorState>>,
    /// Cancellation token for graceful shutdown
    cancellation_token: CancellationToken,
    /// Anti-ban engine per session
    anti_ban_engines: Arc<Mutex<std::collections::HashMap<String, AntiBanEngine>>>,
    /// Event broadcaster
    event_tx: broadcast::Sender<JobEvent>,
    /// Background task handle
    task_handle: Arc<Mutex<Option<JoinHandle<()>>>>,
    /// Persistence store reference
    store: Option<Arc<InMemoryStore>>,
}

impl Executor {
    /// Create a new executor with default configuration
    pub fn new() -> Self {
        Self::with_config(ExecutorConfig::default())
    }

    /// Create a new executor with custom configuration
    pub fn with_config(config: ExecutorConfig) -> Self {
        let (event_tx, _) = broadcast::channel(100);
        
        Self {
            config,
            state: Arc::new(Mutex::new(ExecutorState::Stopped)),
            cancellation_token: CancellationToken::new(),
            anti_ban_engines: Arc::new(Mutex::new(std::collections::HashMap::new())),
            event_tx,
            task_handle: Arc::new(Mutex::new(None)),
            store: None,
        }
    }

    /// Set the persistence store
    pub fn with_store(mut self, store: Arc<InMemoryStore>) -> Self {
        self.store = Some(store);
        self
    }

    /// Get current state
    pub async fn state(&self) -> ExecutorState {
        *self.state.lock().await
    }

    /// Subscribe to job events
    pub fn subscribe(&self) -> broadcast::Receiver<JobEvent> {
        self.event_tx.subscribe()
    }

    /// Start the executor (spawns background task)
    pub async fn start(&self) -> Result<(), String> {
        let mut state = self.state.lock().await;
        
        if *state != ExecutorState::Stopped {
            return Err(format!("Executor is not stopped (current state: {:?})", *state));
        }

        *state = ExecutorState::Starting;
        drop(state);

        // Spawn the polling loop
        let config = self.config.clone();
        let cancellation_token = self.cancellation_token.clone();
        let anti_ban_engines = self.anti_ban_engines.clone();
        let event_tx = self.event_tx.clone();
        let store = self.store.clone();

        let handle = tokio::spawn(async move {
            poll_pending_jobs_loop(
                config,
                cancellation_token,
                anti_ban_engines,
                event_tx,
                store,
            ).await;
        });

        *self.state.lock().await = ExecutorState::Running;
        *self.task_handle.lock().await = Some(handle);

        Ok(())
    }

    /// Stop the executor gracefully
    pub async fn stop(&self) -> Result<(), String> {
        let mut state = self.state.lock().await;
        
        if *state != ExecutorState::Running {
            return Err(format!("Executor is not running (current state: {:?})", *state));
        }

        *state = ExecutorState::Stopping;
        drop(state);

        // Signal cancellation
        self.cancellation_token.cancel();

        // Wait for task to complete
        if let Some(handle) = self.task_handle.lock().await.take() {
            let _ = handle.await;
        }

        *self.state.lock().await = ExecutorState::Stopped;

        Ok(())
    }

    /// Check if a job can be executed (anti-ban integration)
    pub async fn can_execute_job(&self, session_id: &str, action_type: &str) -> bool {
        let mut engines = self.anti_ban_engines.lock().await;
        
        let engine = engines.entry(session_id.to_string())
            .or_insert_with(|| {
                let config = get_platform_config(&self.config.default_platform);
                AntiBanEngine::new(config)
            });

        engine.can_execute(action_type).is_ok()
    }

    /// Record an action for anti-ban tracking
    pub async fn record_action(&self, session_id: &str, action_type: &str, success: bool, delay_ms: u64) {
        let mut engines = self.anti_ban_engines.lock().await;
        
        if let Some(engine) = engines.get_mut(session_id) {
            engine.record_action(action_type.to_string(), success, delay_ms);
        }
    }

    /// Get next delay for a session
    pub async fn get_next_delay(&self, session_id: &str) -> u64 {
        let engines = self.anti_ban_engines.lock().await;
        
        if let Some(engine) = engines.get(session_id) {
            engine.next_action_delay_ms()
        } else {
            // Default delay
            60_000
        }
    }

    /// Check if batch break is needed
    pub async fn should_take_batch_break(&self, session_id: &str) -> bool {
        let engines = self.anti_ban_engines.lock().await;
        
        if let Some(engine) = engines.get(session_id) {
            engine.should_insert_batch_break()
        } else {
            false
        }
    }

    /// Reset batch counter for a session
    pub async fn reset_batch(&self, session_id: &str) {
        let mut engines = self.anti_ban_engines.lock().await;
        
        if let Some(engine) = engines.get_mut(session_id) {
            engine.reset_batch();
        }
    }

    /// Get or create anti-ban engine for a session
    pub async fn get_or_create_anti_ban(&self, session_id: &str, platform: &str) {
        let mut engines = self.anti_ban_engines.lock().await;
        
        if !engines.contains_key(session_id) {
            let config = get_platform_config(platform);
            engines.insert(session_id.to_string(), AntiBanEngine::new(config));
        }
    }

    /// Remove anti-ban engine for a session
    pub async fn remove_anti_ban(&self, session_id: &str) {
        let mut engines = self.anti_ban_engines.lock().await;
        engines.remove(session_id);
    }

    /// Emit a job event
    pub fn emit_event(&self, event: JobEvent) {
        let _ = self.event_tx.send(event);
    }
}

impl Default for Executor {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// SPAWN HELPER
// ============================================

/// Spawn an executor with the given configuration
/// 
/// This is a convenience function that creates and starts an executor.
pub async fn spawn_executor(config: ExecutorConfig) -> Result<Arc<Executor>, String> {
    let executor = Arc::new(Executor::with_config(config));
    executor.start().await?;
    Ok(executor)
}

// ============================================
// POLLING LOOP
// ============================================

/// Background polling loop for pending jobs
async fn poll_pending_jobs_loop(
    config: ExecutorConfig,
    cancellation_token: CancellationToken,
    anti_ban_engines: Arc<Mutex<std::collections::HashMap<String, AntiBanEngine>>>,
    event_tx: broadcast::Sender<JobEvent>,
    store: Option<Arc<InMemoryStore>>,
) {
    let poll_interval = Duration::from_millis(config.poll_interval_ms);

    loop {
        // Check for cancellation
        if cancellation_token.is_cancelled() {
            break;
        }

        // Poll for pending jobs if we have a store
        if let Some(ref store) = store {
            if let Ok(jobs) = poll_pending_jobs(store.as_ref()).await {
                for job in jobs {
                    // Emit job started event
                    let _ = event_tx.send(JobEvent::JobStarted {
                        job_id: job.id.clone(),
                        session_id: job.session_id.clone(),
                    });

                    // Check anti-ban if enabled
                    if config.anti_ban_enabled {
                        let can_execute = {
                            let mut engines = anti_ban_engines.lock().await;
                            let engine = engines.entry(job.session_id.clone())
                                .or_insert_with(|| {
                                    let cfg = get_platform_config(&config.default_platform);
                                    AntiBanEngine::new(cfg)
                                });
                            engine.can_execute("post").is_ok()
                        };

                        if !can_execute {
                            // Skip job due to anti-ban
                            let _ = event_tx.send(JobEvent::JobFailed {
                                job_id: job.id,
                                session_id: job.session_id,
                                error: "Rate limit exceeded".to_string(),
                                category: Some("RATE_LIMITED".to_string()),
                            });
                            continue;
                        }
                    }

                    // Note: Actual job processing would be done by the extension
                    // The executor just handles the polling and anti-ban checks
                }
            }
        }

        // Wait for next poll interval or cancellation
        tokio::select! {
            _ = cancellation_token.cancelled() => {
                break;
            }
            _ = tokio::time::sleep(poll_interval) => {
                // Continue polling
            }
        }
    }
}

/// Poll for pending jobs from the store
async fn poll_pending_jobs(store: &InMemoryStore) -> Result<Vec<PostJobModel>, String> {
    // Get all pending jobs
    let jobs = store.get_pending_jobs()?;
    Ok(jobs)
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // T-3.1: Test for executor module structure
    // ========================================

    #[test]
    fn test_executor_module_structure() {
        // Test that Executor can be created with default config
        let executor = Executor::new();
        assert!(matches!(executor.config, ExecutorConfig { .. }));
    }

    #[test]
    fn test_executor_config_default_values() {
        let config = ExecutorConfig::default();
        
        assert_eq!(config.poll_interval_ms, 5000);
        assert_eq!(config.max_concurrent_jobs, 3);
        assert!(config.anti_ban_enabled);
        assert_eq!(config.default_platform, "facebook_groups");
    }

    #[test]
    fn test_executor_config_custom_values() {
        let config = ExecutorConfig {
            poll_interval_ms: 10_000,
            max_concurrent_jobs: 5,
            anti_ban_enabled: false,
            default_platform: "instagram".to_string(),
        };
        
        assert_eq!(config.poll_interval_ms, 10_000);
        assert_eq!(config.max_concurrent_jobs, 5);
        assert!(!config.anti_ban_enabled);
        assert_eq!(config.default_platform, "instagram");
    }

    // ========================================
    // T-3.2: Test Executor struct creation
    // ========================================

    #[test]
    fn test_executor_creation_with_default_config() {
        let executor = Executor::new();
        
        assert_eq!(executor.config.poll_interval_ms, 5000);
        assert_eq!(executor.config.max_concurrent_jobs, 3);
    }

    #[test]
    fn test_executor_creation_with_custom_config() {
        let config = ExecutorConfig {
            poll_interval_ms: 3000,
            max_concurrent_jobs: 10,
            ..Default::default()
        };
        
        let executor = Executor::with_config(config);
        
        assert_eq!(executor.config.poll_interval_ms, 3000);
        assert_eq!(executor.config.max_concurrent_jobs, 10);
    }

    #[test]
    fn test_executor_has_event_channel() {
        let executor = Executor::new();
        
        // Should be able to subscribe
        let _receiver = executor.subscribe();
    }

    // ========================================
    // T-3.3: Test for job polling loop structure
    // ========================================

    #[test]
    fn test_executor_state_initial() {
        let executor = Executor::new();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        let state = rt.block_on(executor.state());
        
        assert_eq!(state, ExecutorState::Stopped);
    }

    #[test]
    fn test_executor_state_transitions() {
        let executor = Executor::new();
        
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        // Initial state
        let state = rt.block_on(executor.state());
        assert_eq!(state, ExecutorState::Stopped);
    }

    // ========================================
    // T-3.5: Test for anti-ban integration
    // ========================================

    #[tokio::test]
    async fn test_executor_can_execute_job_without_session() {
        let executor = Executor::new();
        
        // Without a session, should create default engine and allow execution
        let can_execute = executor.can_execute_job("test_session", "post").await;
        assert!(can_execute);
    }

    #[tokio::test]
    async fn test_executor_creates_anti_ban_engine_on_demand() {
        let executor = Executor::new();
        
        // Initially no engines
        {
            let engines = executor.anti_ban_engines.lock().await;
            assert!(engines.is_empty());
        }
        
        // Check execution (should create engine)
        let _ = executor.can_execute_job("session_1", "post").await;
        
        // Now should have an engine
        {
            let engines = executor.anti_ban_engines.lock().await;
            assert!(engines.contains_key("session_1"));
        }
    }

    #[tokio::test]
    async fn test_executor_anti_ban_blocks_after_failures() {
        let executor = Executor::new();
        
        // First, create the engine by checking execution
        let can_execute = executor.can_execute_job("session_test", "post").await;
        assert!(can_execute);
        
        // Record failures to trip the circuit breaker
        for _ in 0..5 {
            executor.record_action("session_test", "post", false, 60_000).await;
        }
        
        // Now should be blocked
        let can_execute = executor.can_execute_job("session_test", "post").await;
        assert!(!can_execute);
    }

    // ========================================
    // T-3.7: Test for job status event emission
    // ========================================

    #[tokio::test]
    async fn test_executor_emits_job_started_event() {
        let executor = Executor::new();
        let mut receiver = executor.subscribe();
        
        // Emit event
        executor.emit_event(JobEvent::JobStarted {
            job_id: "job_123".to_string(),
            session_id: "sess_456".to_string(),
        });
        
        // Receive event
        if let Ok(JobEvent::JobStarted { job_id, session_id }) = receiver.try_recv() {
            assert_eq!(job_id, "job_123");
            assert_eq!(session_id, "sess_456");
        } else {
            panic!("Expected JobStarted event");
        }
    }

    #[tokio::test]
    async fn test_executor_emits_job_completed_event() {
        let executor = Executor::new();
        let mut receiver = executor.subscribe();
        
        executor.emit_event(JobEvent::JobCompleted {
            job_id: "job_789".to_string(),
            session_id: "sess_123".to_string(),
            post_url: Some("https://facebook.com/post/123".to_string()),
        });
        
        if let Ok(JobEvent::JobCompleted { job_id, post_url, .. }) = receiver.try_recv() {
            assert_eq!(job_id, "job_789");
            assert!(post_url.is_some());
        } else {
            panic!("Expected JobCompleted event");
        }
    }

    #[tokio::test]
    async fn test_executor_emits_job_failed_event() {
        let executor = Executor::new();
        let mut receiver = executor.subscribe();
        
        executor.emit_event(JobEvent::JobFailed {
            job_id: "job_fail".to_string(),
            session_id: "sess_fail".to_string(),
            error: "Network error".to_string(),
            category: Some("NETWORK_ERROR".to_string()),
        });
        
        if let Ok(JobEvent::JobFailed { job_id, error, category, .. }) = receiver.try_recv() {
            assert_eq!(job_id, "job_fail");
            assert_eq!(error, "Network error");
            assert_eq!(category, Some("NETWORK_ERROR".to_string()));
        } else {
            panic!("Expected JobFailed event");
        }
    }

    // ========================================
    // T-3.9: Test for executor lifecycle
    // ========================================

    #[tokio::test]
    async fn test_executor_lifecycle_start_stop() {
        let executor = Arc::new(Executor::new());
        
        // Start
        let result = executor.start().await;
        assert!(result.is_ok());
        
        let state = executor.state().await;
        assert_eq!(state, ExecutorState::Running);
        
        // Stop
        let result = executor.stop().await;
        assert!(result.is_ok());
        
        let state = executor.state().await;
        assert_eq!(state, ExecutorState::Stopped);
    }

    #[tokio::test]
    async fn test_executor_cannot_start_twice() {
        let executor = Arc::new(Executor::new());
        
        // First start
        let result = executor.start().await;
        assert!(result.is_ok());
        
        // Second start should fail
        let result = executor.start().await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not stopped"));
        
        // Cleanup
        executor.stop().await.unwrap();
    }

    #[tokio::test]
    async fn test_executor_cannot_stop_when_not_running() {
        let executor = Executor::new();
        
        // Try to stop when not running
        let result = executor.stop().await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not running"));
    }

    #[tokio::test]
    async fn test_spawn_executor_convenience_function() {
        let config = ExecutorConfig {
            poll_interval_ms: 100,
            ..Default::default()
        };
        
        let executor = spawn_executor(config).await;
        assert!(executor.is_ok());
        
        let executor = executor.unwrap();
        let state = executor.state().await;
        assert_eq!(state, ExecutorState::Running);
        
        // Cleanup
        executor.stop().await.unwrap();
    }

    // ========================================
    // Additional tests for anti-ban integration
    // ========================================

    #[tokio::test]
    async fn test_executor_get_next_delay() {
        let executor = Executor::new();
        
        // Create engine for session
        executor.get_or_create_anti_ban("session_delay", "facebook_groups").await;
        
        // Get delay
        let delay = executor.get_next_delay("session_delay").await;
        assert!(delay >= 60_000);
        assert!(delay <= 276_000); // max + jitter
    }

    #[tokio::test]
    async fn test_executor_batch_break_detection() {
        let executor = Executor::new();
        
        // Create engine
        executor.get_or_create_anti_ban("session_batch", "facebook_groups").await;
        
        // Initially no break needed
        let should_break = executor.should_take_batch_break("session_batch").await;
        assert!(!should_break);
        
        // Record batch_size actions
        for _ in 0..5 {
            executor.record_action("session_batch", "post", true, 60_000).await;
        }
        
        // Now should need break
        let should_break = executor.should_take_batch_break("session_batch").await;
        assert!(should_break);
        
        // Reset batch
        executor.reset_batch("session_batch").await;
        
        // No longer need break
        let should_break = executor.should_take_batch_break("session_batch").await;
        assert!(!should_break);
    }

    #[tokio::test]
    async fn test_executor_remove_anti_ban_engine() {
        let executor = Executor::new();
        
        // Create engine
        executor.get_or_create_anti_ban("session_remove", "facebook_groups").await;
        
        // Verify it exists
        {
            let engines = executor.anti_ban_engines.lock().await;
            assert!(engines.contains_key("session_remove"));
        }
        
        // Remove
        executor.remove_anti_ban("session_remove").await;
        
        // Verify it's gone
        {
            let engines = executor.anti_ban_engines.lock().await;
            assert!(!engines.contains_key("session_remove"));
        }
    }

    #[tokio::test]
    async fn test_executor_with_store() {
        let store = Arc::new(InMemoryStore::new());
        let executor = Executor::new().with_store(store.clone());
        
        assert!(executor.store.is_some());
    }

    // ========================================
    // Event emission tests
    // ========================================

    #[test]
    fn test_job_event_batch_break_needed() {
        let event = JobEvent::BatchBreakNeeded {
            session_id: "sess_123".to_string(),
            duration_ms: 1_200_000, // 20 minutes
        };
        
        if let JobEvent::BatchBreakNeeded { session_id, duration_ms } = event {
            assert_eq!(session_id, "sess_123");
            assert_eq!(duration_ms, 1_200_000);
        } else {
            panic!("Expected BatchBreakNeeded event");
        }
    }

    #[test]
    fn test_job_event_risk_level() {
        let event = JobEvent::RiskLevel {
            session_id: "sess_456".to_string(),
            level: "High".to_string(),
        };
        
        if let JobEvent::RiskLevel { session_id, level } = event {
            assert_eq!(session_id, "sess_456");
            assert_eq!(level, "High");
        } else {
            panic!("Expected RiskLevel event");
        }
    }
}
