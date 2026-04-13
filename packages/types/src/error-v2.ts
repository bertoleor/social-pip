/**
 * Error Handling v2.0 - TypeScript Types
 * 
 * Mirrors Rust types from:
 * - src-tauri/src/outbox.rs
 * - src-tauri/src/observability.rs
 * - src-tauri/src/error_context.rs
 * 
 * @module @social-pip/types/error-v2
 */

// ============================================
// Outbox Types
// ============================================

/**
 * Outbox entry lifecycle states
 */
export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * Outbox entry - Task persisted before execution for crash recovery
 */
export interface OutboxEntry {
  /** Unique identifier (cuid) */
  id: string;
  /** Hash-based unique key for deduplication */
  idempotencyKey: string;
  /** Type of aggregate: "Post", "Account", "Batch" */
  aggregateType: string;
  /** Target entity ID */
  aggregateId: string;
  /** Event type: "PostCreated", "PostRetry" */
  eventType: string;
  /** JSON payload of full task data */
  payload: string;
  /** OpenTelemetry trace ID for correlation */
  traceId: string;
  /** Parent saga if applicable */
  sagaId?: string;
  /** Current lifecycle status */
  status: OutboxStatus;
  /** When entry was created */
  createdAt: Date;
  /** When entry was processed (null if pending) */
  processedAt?: Date;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Next retry time (for exponential backoff) */
  nextRetryAt?: Date;
  /** Last error message */
  lastError?: string;
}

/**
 * Options for creating an outbox entry
 */
export interface CreateOutboxEntryOptions {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: string;
  traceId: string;
  sagaId?: string;
  maxRetries?: number;
}

// ============================================
// Saga Types
// ============================================

/**
 * Saga execution states
 */
export type SagaState = 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'COMPENSATING' 
  | 'FAILED' 
  | 'COMPENSATED' 
  | 'TIMED_OUT';

/**
 * Saga step status
 */
export type SagaStepStatus = 
  | 'PENDING' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'COMPENSATED' 
  | 'FAILED';

/**
 * Saga execution - Multi-step operation with automatic compensation
 */
export interface SagaExecution {
  /** Unique identifier */
  id: string;
  /** Saga definition name */
  name: string;
  /** Current state machine state */
  state: SagaState;
  /** Current step index */
  currentStep: number;
  /** Completed step indices */
  completedSteps: number[];
  /** Saga variables (JSON) */
  context: Record<string, unknown>;
  /** OpenTelemetry trace ID */
  traceId: string;
  /** When saga started */
  startedAt: Date;
  /** When saga completed */
  completedAt?: Date;
  /** Last error message */
  lastError?: string;
  /** Overall timeout in milliseconds */
  timeoutMs: number;
  /** Saga steps */
  steps: SagaStep[];
}

/**
 * Individual saga step
 */
export interface SagaStep {
  /** Unique identifier */
  id: string;
  /** Parent saga ID */
  sagaId: string;
  /** Step name */
  name: string;
  /** Step order index */
  stepOrder: number;
  /** Current status */
  status: SagaStepStatus;
  /** Action result (JSON) */
  actionResult?: unknown;
  /** Compensation result (JSON) */
  compensationResult?: unknown;
  /** When step started */
  startedAt?: Date;
  /** When step completed */
  completedAt?: Date;
  /** Error message if failed */
  errorMessage?: string;
}

// ============================================
// Error Context Types
// ============================================

/**
 * ErrorContext - Complete debugging context for error handling
 */
export interface ErrorContext {
  /** Unique identifier for this operation */
  executionId: string;
  /** OpenTelemetry trace ID (32 hex chars) */
  traceId: string;
  /** Current span ID (16 hex chars) */
  spanId: string;
  /** Parent saga if applicable */
  sagaId?: string;
  /** Current saga step name */
  stepName?: string;
  /** Current saga step index */
  stepIndex?: number;
  /** Stack trace at error point */
  stackTrace: string;
  /** When this context was captured */
  timestamp: Date;
  /** Key-value context baggage */
  baggage: Record<string, string>;
  /** Last successful operation before failure */
  lastSuccessfulStep?: string;
  /** Human-readable failure location */
  failedAt: string;
}

// ============================================
// Bulkhead Types
// ============================================

/**
 * Bulkhead configuration per platform
 */
export interface BulkheadConfig {
  /** Maximum concurrent calls */
  maxConcurrentCalls: number;
  /** Maximum wait duration in milliseconds */
  maxWaitDurationMs: number;
  /** Core thread pool size */
  corePoolSize: number;
  /** Maximum thread pool size */
  maxPoolSize: number;
  /** Queue capacity */
  queueCapacity: number;
}

/**
 * Bulkhead runtime status
 */
export interface BulkheadStatus {
  /** Platform name */
  platform: string;
  /** Currently active calls */
  activeCount: number;
  /** Current queue size */
  queueSize: number;
  /** Maximum allowed concurrent */
  maxConcurrentCalls: number;
  /** Total rejections */
  rejectionCount: number;
}

// ============================================
// Timeout Types
// ============================================

/**
 * OnTimeout action variants
 */
export type OnTimeoutAction = 
  | { type: 'FAIL' }
  | { type: 'RETRY'; maxRetries: number; baseDelayMs: number }
  | { type: 'DEAD_LETTER'; reason: string };

/**
 * Job timeout configuration
 */
export interface TimeoutConfig {
  /** Job type identifier */
  jobType: string;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Action on timeout */
  onTimeout: OnTimeoutAction;
  /** Graceful shutdown period */
  gracefulShutdownMs: number;
}

// ============================================
// Partial Success Types
// ============================================

/**
 * Batch result with success/failure tracking
 */
export interface BatchResult<T> {
  /** Total items in batch */
  total: number;
  /** Successful items with their indices */
  succeeded: Array<[number, T]>;
  /** Failed items with their indices */
  failed: Array<[number, BatchError]>;
  /** Success rate (0.0 - 1.0) */
  successRate: number;
  /** Whether to continue on failure */
  continueOnFail: boolean;
  /** Whether batch stopped early */
  stoppedEarly: boolean;
  /** Reason for early stop */
  stoppedReason?: string;
}

/**
 * Batch error with context
 */
export interface BatchError {
  /** Error type */
  error: string;
  /** Error context */
  context?: ErrorContext;
}

// ============================================
// Error Aggregation Types
// ============================================

/**
 * Error group for deduplication
 */
export interface ErrorGroup {
  /** Unique identifier */
  id: string;
  /** xxHash fingerprint */
  fingerprint: string;
  /** Error type classification */
  errorType: string;
  /** Platform where error occurred */
  platform?: string;
  /** Account where error occurred */
  accountId?: string;
  /** Normalized error message */
  normalizedMessage: string;
  /** First occurrence timestamp */
  firstOccurrence: Date;
  /** Most recent occurrence */
  lastOccurrence: Date;
  /** Total occurrence count */
  count: number;
  /** DLQ entry IDs for samples */
  sampleIds: string[];
  /** Group status */
  status: 'ACTIVE' | 'RESOLVED' | 'IGNORED';
  /** When resolved */
  resolvedAt?: Date;
}

// ============================================
// Circuit Breaker v2.0 Types
// ============================================

/**
 * Circuit breaker configuration with v2.0 extensions
 */
export interface CircuitBreakerConfigV2 {
  /** Consecutive failures to trip circuit */
  failureThreshold: number;
  /** Consecutive successes to close circuit */
  successThreshold: number;
  /** Wait duration before half-open (ms) */
  waitDurationMs: number;
  /** Slow call threshold (ms) - NEW in v2.0 */
  slowCallThresholdMs: number;
  /** Slow call rate threshold (0.0 - 1.0) - NEW in v2.0 */
  slowCallRateThreshold: number;
  /** Minimum calls before rate calculation - NEW in v2.0 */
  minimumNumberOfCalls: number;
}

/**
 * Circuit breaker runtime metrics
 */
export interface CircuitBreakerMetrics {
  /** Current failure rate */
  failureRate: number;
  /** Current slow call rate - NEW in v2.0 */
  slowCallRate: number;
  /** State transition history */
  stateTransitions: StateTransition[];
}

/**
 * State transition record
 */
export interface StateTransition {
  /** Previous state */
  from: CircuitBreakerState;
  /** New state */
  to: CircuitBreakerState;
  /** When transition occurred */
  at: Date;
  /** Reason for transition */
  reason: string;
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'Closed' | 'Open' | 'HalfOpen';

// ============================================
// Alert v2.0 Types
// ============================================

/**
 * Alert with v2.0 extensions
 */
export interface AlertV2 {
  /** Unique identifier */
  id: string;
  /** Alert type */
  alertType: AlertType;
  /** Severity level */
  severity: Severity;
  /** Platform where alert occurred */
  platform?: string;
  /** Account where alert occurred */
  accountId?: string;
  /** Alert message */
  message: string;
  /** Additional details */
  details?: Record<string, unknown>;
  /** When alert was created */
  timestamp: Date;
  /** Whether alert was acknowledged */
  acknowledged: boolean;
  /** When acknowledged */
  acknowledgedAt?: Date;
  /** Whether alert was resolved */
  resolved: boolean;
  /** When resolved */
  resolvedAt?: Date;
  /** OpenTelemetry trace ID - NEW in v2.0 */
  traceId?: string;
  /** Link to error group - NEW in v2.0 */
  errorGroupId?: string;
  /** Aggregated error count - NEW in v2.0 */
  aggregatedCount: number;
}

/**
 * Alert type enum
 */
export type AlertType =
  | 'rate_limit_approaching'
  | 'rate_limit_exceeded'
  | 'account_blocked'
  | 'account_restricted'
  | 'account_needs_reauth'
  | 'post_published'
  | 'post_failed'
  | 'post_retry_exhausted'
  | 'scheduler_stopped'
  | 'scheduler_started'
  | 'api_error'
  | 'network_error'
  | 'suspicious_activity'
  | 'session_expired'
  | 'credential_invalid';

/**
 * Severity enum
 */
export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// ============================================
// DLQ v2.0 Types
// ============================================

/**
 * Dead letter entry with v2.0 extensions
 */
export interface DeadLetterEntryV2 {
  /** Unique identifier */
  id: string;
  /** Original task ID */
  originalTaskId?: string;
  /** Task type */
  taskType: string;
  /** Original payload */
  payload: string;
  /** Serialized UnifiedError */
  unifiedError: string;
  /** Recovery strategy */
  recoveryStrategy: string;
  /** Human-readable error */
  errorMessage: string;
  /** Error context JSON */
  errorContext: string;
  /** OpenTelemetry trace ID - NEW in v2.0 */
  traceId?: string;
  /** OpenTelemetry span ID - NEW in v2.0 */
  spanId?: string;
  /** Parent saga ID - NEW in v2.0 */
  sagaId?: string;
  /** Full ErrorContext JSON - NEW in v2.0 */
  fullErrorContext?: string;
  /** Link to ErrorGroup - NEW in v2.0 */
  errorGroupId?: string;
  /** Manual retry count */
  retryCount: number;
  /** Whether manually retried */
  manuallyRetried: boolean;
  /** When resolved */
  resolvedAt?: Date;
  /** When created */
  createdAt: Date;
}

// ============================================
// SLO Alerting Types (Phase 5)
// ============================================

/**
 * SLO metric type for threshold-based alerting
 */
export type SloMetric = 'ErrorBudgetBurnRate' | 'SuccessRate' | 'LatencyP99';

/**
 * SLO threshold configuration
 */
export interface SloThreshold {
  /** Metric to monitor */
  metric: SloMetric;
  /** Threshold value (e.g., 0.10 for 10% burn rate, 0.95 for 95% success rate) */
  threshold: number;
  /** Alert severity when threshold exceeded */
  alertSeverity: Severity;
}

/**
 * Predefined SLO thresholds
 */
export const SLO_THRESHOLDS = {
  /** Error budget burning at 10% rate - Critical */
  errorBudgetBurn10pct: {
    metric: 'ErrorBudgetBurnRate' as SloMetric,
    threshold: 0.10,
    alertSeverity: 'CRITICAL' as Severity,
  },
  /** Error budget burning at 5% rate - Warning */
  errorBudgetBurn5pct: {
    metric: 'ErrorBudgetBurnRate' as SloMetric,
    threshold: 0.05,
    alertSeverity: 'WARNING' as Severity,
  },
  /** Success rate below 95% - Warning */
  successRateBelow95pct: {
    metric: 'SuccessRate' as SloMetric,
    threshold: 0.95,
    alertSeverity: 'WARNING' as Severity,
  },
  /** Success rate below 90% - Critical */
  successRateBelow90pct: {
    metric: 'SuccessRate' as SloMetric,
    threshold: 0.90,
    alertSeverity: 'CRITICAL' as Severity,
  },
} as const;

// ============================================
// Active Job Types (Phase 2 - Job Timeout)
// ============================================

/**
 * Active job being tracked for timeout
 */
export interface ActiveJob {
  /** Unique job identifier */
  jobId: string;
  /** Job type for config lookup */
  jobType: string;
  /** When job started */
  startedAt: Date;
  /** Deadline for timeout */
  deadline: Date;
  /** Timeout configuration */
  config: TimeoutConfig;
  /** Whether job was cancelled */
  cancelled: boolean;
  /** OpenTelemetry trace ID */
  traceId?: string;
}

/**
 * Timeout result after job completion
 */
export interface TimeoutResult {
  /** Job ID */
  jobId: string;
  /** Job type */
  jobType: string;
  /** Whether job timed out */
  timedOut: boolean;
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Action taken on timeout */
  actionTaken?: string;
  /** OpenTelemetry trace ID */
  traceId?: string;
}

// ============================================
// Retry Context Types (Phase 4 - DLQ v2.0)
// ============================================

/**
 * Context extracted from DLQ entry for retry
 */
export interface RetryContext {
  /** Original task ID */
  originalTaskId?: string;
  /** Task type */
  taskType: string;
  /** Original payload */
  payload: string;
  /** OpenTelemetry trace ID */
  traceId?: string;
  /** OpenTelemetry span ID */
  spanId?: string;
  /** Parent saga ID */
  sagaId?: string;
  /** Full ErrorContext JSON */
  fullErrorContext?: string;
  /** Link to ErrorGroup */
  errorGroupId?: string;
}

// ============================================
// Dedup Configuration Types (Phase 2 - Error Aggregation)
// ============================================

/**
 * Deduplication configuration per error type
 */
export interface DedupConfig {
  /** Dedup window in milliseconds (0 = no dedup) */
  dedupWindowMs: number;
  /** Sample rate (0.0 - 1.0) */
  sampleRate: number;
  /** Maximum samples per group */
  maxSamplesPerGroup: number;
}

/**
 * Predefined dedup configs by error type
 */
export const DEDUP_CONFIGS: Record<string, DedupConfig> = {
  RateLimit: { dedupWindowMs: 300000, sampleRate: 0.1, maxSamplesPerGroup: 10 },
  NetworkFailure: { dedupWindowMs: 60000, sampleRate: 0.2, maxSamplesPerGroup: 10 },
  AuthExpired: { dedupWindowMs: 0, sampleRate: 1.0, maxSamplesPerGroup: 20 },
  PlatformError: { dedupWindowMs: 300000, sampleRate: 0.1, maxSamplesPerGroup: 10 },
  ValidationError: { dedupWindowMs: 0, sampleRate: 1.0, maxSamplesPerGroup: 20 },
};

// ============================================
// Aggregation Stats Types (Phase 2 - Error Aggregation)
// ============================================

/**
 * Error aggregation statistics
 */
export interface AggregationStats {
  /** Total error groups */
  totalGroups: number;
  /** Active error groups */
  activeGroups: number;
  /** Total occurrences across all groups */
  totalOccurrences: number;
  /** Total samples stored */
  totalSamples: number;
}

// ============================================
// Batch Configuration Types (Phase 2 - Partial Success)
// ============================================

/**
 * Batch processing configuration
 */
export interface BatchConfig {
  /** Batch type identifier */
  batchType: string;
  /** Whether to continue on individual failures */
  continueOnFail: boolean;
  /** Maximum failures before stopping */
  maxFailures?: number;
  /** Action when max failures reached */
  onMaxFailures: 'StopAndReport' | 'Escalate' | 'DeadLetter';
}

/**
 * Predefined batch configs
 */
export const BATCH_CONFIGS: Record<string, BatchConfig> = {
  PostToGroups: { batchType: 'PostToGroups', continueOnFail: true, maxFailures: 5, onMaxFailures: 'StopAndReport' },
  UploadMedia: { batchType: 'UploadMedia', continueOnFail: true, maxFailures: 3, onMaxFailures: 'StopAndReport' },
  GenerateCaptions: { batchType: 'GenerateCaptions', continueOnFail: false, maxFailures: 0, onMaxFailures: 'StopAndReport' },
  ValidateAccounts: { batchType: 'ValidateAccounts', continueOnFail: true, maxFailures: 10, onMaxFailures: 'Escalate' },
  FetchGroupList: { batchType: 'FetchGroupList', continueOnFail: true, maxFailures: 2, onMaxFailures: 'StopAndReport' },
};

// ============================================
// Job Timeout Default Configs (Phase 2)
// ============================================

/**
 * Default timeout configurations by job type
 */
export const TIMEOUT_CONFIGS: Record<string, TimeoutConfig> = {
  PostToGroup: {
    jobType: 'PostToGroup',
    timeoutMs: 300000, // 5 minutes
    onTimeout: { type: 'DEAD_LETTER', reason: 'PostToGroup timed out' },
    gracefulShutdownMs: 5000,
  },
  GenerateCaption: {
    jobType: 'GenerateCaption',
    timeoutMs: 60000, // 1 minute
    onTimeout: { type: 'RETRY', maxRetries: 2, baseDelayMs: 5000 },
    gracefulShutdownMs: 5000,
  },
  BrowserAutomation: {
    jobType: 'BrowserAutomation',
    timeoutMs: 600000, // 10 minutes
    onTimeout: { type: 'FAIL' },
    gracefulShutdownMs: 5000,
  },
  UploadMedia: {
    jobType: 'UploadMedia',
    timeoutMs: 120000, // 2 minutes
    onTimeout: { type: 'RETRY', maxRetries: 3, baseDelayMs: 10000 },
    gracefulShutdownMs: 5000,
  },
  ValidateAccount: {
    jobType: 'ValidateAccount',
    timeoutMs: 30000, // 30 seconds
    onTimeout: { type: 'FAIL' },
    gracefulShutdownMs: 5000,
  },
  FetchGroups: {
    jobType: 'FetchGroups',
    timeoutMs: 60000, // 1 minute
    onTimeout: { type: 'RETRY', maxRetries: 2, baseDelayMs: 5000 },
    gracefulShutdownMs: 5000,
  },
};

// ============================================
// Circuit Breaker Per-Platform Configs (Phase 3)
// ============================================

/**
 * Per-platform circuit breaker configurations
 */
export const CIRCUIT_BREAKER_CONFIGS: Record<string, CircuitBreakerConfigV2> = {
  facebook: {
    failureThreshold: 5,
    successThreshold: 3,
    waitDurationMs: 60000,
    slowCallThresholdMs: 3000,
    slowCallRateThreshold: 0.8,
    minimumNumberOfCalls: 10,
  },
  instagram: {
    failureThreshold: 5,
    successThreshold: 3,
    waitDurationMs: 60000,
    slowCallThresholdMs: 2000,
    slowCallRateThreshold: 0.8,
    minimumNumberOfCalls: 10,
  },
  twitter: {
    failureThreshold: 10,
    successThreshold: 3,
    waitDurationMs: 60000,
    slowCallThresholdMs: 1000,
    slowCallRateThreshold: 0.8,
    minimumNumberOfCalls: 10,
  },
  linkedin: {
    failureThreshold: 5,
    successThreshold: 3,
    waitDurationMs: 60000,
    slowCallThresholdMs: 2000,
    slowCallRateThreshold: 0.8,
    minimumNumberOfCalls: 10,
  },
};

// ============================================
// Alert Stats Types (Phase 5)
// ============================================

/**
 * Alert statistics
 */
export interface AlertStats {
  /** Total alerts */
  totalAlerts: number;
  /** Unresolved alerts */
  unresolved: number;
  /** Critical alerts */
  critical: number;
  /** Warning alerts */
  warnings: number;
  /** Alerts in last 24 hours */
  last24h: number;
  /** Alerts in last hour */
  lastHour: number;
}

// ============================================
// Observability Types
// ============================================

/**
 * Tracing context for propagation
 */
export interface TracingContext {
  /** OpenTelemetry trace ID (32 hex chars) */
  traceId: string;
  /** Current span ID (16 hex chars) */
  spanId: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** Trace flags */
  traceFlags: number;
  /** Baggage items */
  baggage: Record<string, string>;
}

/**
 * Span kind
 */
export type SpanKind = 'Client' | 'Server' | 'Internal' | 'Producer' | 'Consumer';

/**
 * Span status
 */
export type SpanStatus = 'Ok' | 'Error' | 'Unset';

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  /** Service name */
  serviceName: string;
  /** Trace sample rate (0.0 - 1.0) */
  traceSampleRate: number;
  /** Metrics export interval (ms) */
  metricsExportIntervalMs: number;
  /** Jaeger endpoint */
  jaegerEndpoint: string;
  /** Prometheus port */
  prometheusPort: number;
}
