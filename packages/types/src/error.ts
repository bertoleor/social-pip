/**
 * Error Handling Types - TypeScript mirrors for Rust error types
 * 
 * These types match the Rust implementation in src-tauri/src/error_handler.rs
 * for seamless serialization through Tauri commands.
 */

// ============================================
// UnifiedError Types
// ============================================

export type UnifiedError =
  | { type: 'rate_limit'; subcategory: string }
  | { type: 'auth_expired'; platform: string; accountId: string }
  | { type: 'account_restricted'; reason: string }
  | { type: 'network_failure'; isTimeout: boolean }
  | { type: 'browser_failure'; browser: string }
  | { type: 'platform_error'; code?: string; message: string }
  | { type: 'validation_failed'; field: string; reason: string }
  | { type: 'circuit_open'; accountId: string; until: Date }
  | { type: 'duplicate_task'; existingTaskId: string }
  | { type: 'unknown'; message: string };

// ============================================
// RecoveryStrategy Types
// ============================================

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export type RecoveryStrategy =
  | { type: 'retry_with_backoff'; maxRetries: number; baseDelayMs: number }
  | { type: 'circuit_break'; cooldownLevel: number }
  | { type: 'dead_letter'; reason: string }
  | { type: 'escalate'; severity: Severity };

// ============================================
// Circuit Breaker Types
// ============================================

export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  waitDurationMs: number;
  maxWaitDurationMs: number;
}

export interface CircuitBreakerStatus {
  accountId: string;
  state: CircuitBreakerState;
  consecutiveFailures: number;
  lastFailureAt?: Date;
  config: CircuitBreakerConfig;
}

// ============================================
// Platform Health Types
// ============================================

export type PlatformHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface PlatformHealth {
  platform: string;
  status: PlatformHealthStatus;
  lastCheckAt: Date;
  consecutiveFailures: number;
  lastError?: string;
}

// ============================================
// Dead Letter Queue Types
// ============================================

export interface DeadLetterQueueEntry {
  id: string;
  originalTaskId?: string;
  taskType: 'post' | 'message' | 'story' | 'reel';
  payload: string;
  unifiedError: string;
  recoveryStrategy: string;
  errorMessage: string;
  errorContext: string;
  retryCount: number;
  manuallyRetried: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface CreateDlqEntryInput {
  originalTaskId?: string;
  taskType: 'post' | 'message' | 'story' | 'reel';
  payload: string;
  unifiedError: UnifiedError;
  recoveryStrategy: RecoveryStrategy;
  errorMessage: string;
  errorContext: Record<string, unknown>;
}

export interface DlqEntryFilter {
  taskType?: 'post' | 'message' | 'story' | 'reel';
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================
// Error Classification Result
// ============================================

export interface ErrorClassificationResult {
  error: UnifiedError;
  strategy: RecoveryStrategy;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a RateLimit error
 */
export function rateLimitError(subcategory: string): UnifiedError {
  return { type: 'rate_limit', subcategory };
}

/**
 * Create an AuthExpired error
 */
export function authExpiredError(platform: string, accountId: string): UnifiedError {
  return { type: 'auth_expired', platform, accountId };
}

/**
 * Create an AccountRestricted error
 */
export function accountRestrictedError(reason: string): UnifiedError {
  return { type: 'account_restricted', reason };
}

/**
 * Create a NetworkFailure error
 */
export function networkFailureError(isTimeout: boolean): UnifiedError {
  return { type: 'network_failure', isTimeout };
}

/**
 * Create a BrowserFailure error
 */
export function browserFailureError(browser: string): UnifiedError {
  return { type: 'browser_failure', browser };
}

/**
 * Create a PlatformError
 */
export function platformErrorError(message: string, code?: string): UnifiedError {
  return { type: 'platform_error', code, message };
}

/**
 * Create a ValidationFailed error
 */
export function validationFailedError(field: string, reason: string): UnifiedError {
  return { type: 'validation_failed', field, reason };
}

/**
 * Create a CircuitOpen error
 */
export function circuitOpenError(accountId: string, until: Date): UnifiedError {
  return { type: 'circuit_open', accountId, until };
}

/**
 * Create a DuplicateTask error
 */
export function duplicateTaskError(existingTaskId: string): UnifiedError {
  return { type: 'duplicate_task', existingTaskId };
}

/**
 * Create an Unknown error
 */
export function unknownError(message: string): UnifiedError {
  return { type: 'unknown', message };
}
