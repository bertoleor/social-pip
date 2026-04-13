pub mod alert_system;
pub mod anti_ban;
pub mod ai_service;
pub mod scheduler;
pub mod commands;
pub mod error_handler;
pub mod error_context;
pub mod circuit_breaker;
pub mod dead_letter_queue;
pub mod idempotency;
pub mod health_check;
pub mod cooldown;
pub mod feature_flags;
pub mod spintax;
pub mod native_messaging;

// v2.0 Error Handling Modules
pub mod outbox;
pub mod observability;
pub mod saga;
pub mod bulkhead;
pub mod job_timeout;
pub mod partial_success;
pub mod error_aggregation;

pub use commands::{Account, Post, Platform, AccountStatus, PostStatus};
pub use commands::{Schedule, ScheduleStatus, ScheduleFilter};
pub use commands::{Task, TaskStatus, TaskType, TaskFilter};
pub use error_handler::{UnifiedError, RecoveryStrategy, Severity, ErrorClassifier};
pub use error_context::{ErrorContext, EXECUTION_CONTEXT, set_execution_context, get_execution_context, clear_execution_context, capture_context};
pub use circuit_breaker::{CircuitState, CircuitBreaker, CircuitBreakerConfig, CircuitBreakerMetrics, StateTransition};
pub use dead_letter_queue::{DeadLetterEntry, DeadLetterQueueManager, RetryContext};
pub use idempotency::{IdempotencyChecker, IdempotencyEntry};
pub use health_check::{HealthChecker, HealthCheckResult, PlatformHealthConfig, PlatformHealthStatus};
pub use cooldown::{CooldownLevel, CooldownState, CooldownEscalator};
pub use feature_flags::FeatureFlags;
pub use scheduler::RetryPolicy;

// v2.0 Error Handling Exports
pub use outbox::{
    OutboxEntry, OutboxStatus, OutboxPoller,
    generate_idempotency_key, check_duplicate,
    create_outbox_entry, create_outbox_entry_with_saga,
};
pub use observability::{
    ObservabilityConfig, TracingContext, Span, SpanKind, SpanStatus,
    Tracer, TracerProvider, init_tracing, start_span, record_error_event, set_span_error_status,
};
pub use saga::{
    SagaState, SagaStepStatus, SagaStep, SagaExecution,
    persist_saga, get_saga_by_id, update_saga, get_sagas_by_state, get_timed_out_sagas,
};
pub use bulkhead::{
    BulkheadState, BulkheadConfig, Bulkhead, BulkheadRegistry, BulkheadMetrics,
    init_bulkhead_registry, get_bulkhead_metrics, get_all_bulkhead_metrics,
};
pub use job_timeout::{
    OnTimeoutAction, TimeoutConfig, ActiveJob, TimeoutResult, JobTimeoutManager, JobTimeoutHandle,
    register_timeout_config, get_timeout_config, start_job_timeout, check_job_timeout,
};
pub use partial_success::{
    BatchError, BatchResult, BatchConfig, MaxFailureAction, BatchProcessor,
    create_batch_result, get_batch_config, process_batch, retry_failed,
};
pub use error_aggregation::{
    ErrorGroupStatus, ErrorFingerprint, ErrorGroup, DedupConfig, ErrorAggregator, AggregationStats,
    compute_fingerprint, process_error, get_error_group, get_active_error_groups,
};
pub use alert_system::{
    AlertType, Alert, AlertStats, AlertRule, AlertEngine, SloThreshold, SloMetric,
};
