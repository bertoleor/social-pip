import { describe, it, expect } from 'vitest';
import type {
  UnifiedError,
  RecoveryStrategy,
  Severity,
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStatus,
  PlatformHealthStatus,
} from './error';
import {
  rateLimitError,
  authExpiredError,
  accountRestrictedError,
  networkFailureError,
  browserFailureError,
  platformErrorError,
  validationFailedError,
  circuitOpenError,
  duplicateTaskError,
  unknownError,
} from './error';

describe('UnifiedError Type Mirrors', () => {
  describe('error constructors', () => {
    it('should create rate_limit error', () => {
      const error = rateLimitError('hourly_limit');
      expect(error.type).toBe('rate_limit');
      expect(error.subcategory).toBe('hourly_limit');
    });

    it('should create auth_expired error', () => {
      const error = authExpiredError('facebook', 'acc_123');
      expect(error.type).toBe('auth_expired');
      expect(error.platform).toBe('facebook');
      expect(error.accountId).toBe('acc_123');
    });

    it('should create account_restricted error', () => {
      const error = accountRestrictedError('suspicious_activity');
      expect(error.type).toBe('account_restricted');
      expect(error.reason).toBe('suspicious_activity');
    });

    it('should create network_failure error', () => {
      const error = networkFailureError(true);
      expect(error.type).toBe('network_failure');
      expect(error.isTimeout).toBe(true);
    });

    it('should create browser_failure error', () => {
      const error = browserFailureError('chrome');
      expect(error.type).toBe('browser_failure');
      expect(error.browser).toBe('chrome');
    });

    it('should create platform_error with optional code', () => {
      const error1 = platformErrorError('Rate limited', 'E001');
      expect(error1.type).toBe('platform_error');
      expect(error1.message).toBe('Rate limited');
      expect(error1.code).toBe('E001');

      const error2 = platformErrorError('Unknown error');
      expect(error2.type).toBe('platform_error');
      expect(error2.code).toBeUndefined();
    });

    it('should create validation_failed error', () => {
      const error = validationFailedError('content', 'too_long');
      expect(error.type).toBe('validation_failed');
      expect(error.field).toBe('content');
      expect(error.reason).toBe('too_long');
    });

    it('should create circuit_open error', () => {
      const until = new Date('2026-04-12T00:00:00Z');
      const error = circuitOpenError('acc_456', until);
      expect(error.type).toBe('circuit_open');
      expect(error.accountId).toBe('acc_456');
      expect(error.until).toBe(until);
    });

    it('should create duplicate_task error', () => {
      const error = duplicateTaskError('task_789');
      expect(error.type).toBe('duplicate_task');
      expect(error.existingTaskId).toBe('task_789');
    });

    it('should create unknown error', () => {
      const error = unknownError('Unexpected error');
      expect(error.type).toBe('unknown');
      expect(error.message).toBe('Unexpected error');
    });
  });

  describe('type exhaustiveness', () => {
    it('should have all 10 UnifiedError variants', () => {
      const errors: UnifiedError[] = [
        { type: 'rate_limit', subcategory: 'test' },
        { type: 'auth_expired', platform: 'test', accountId: 'test' },
        { type: 'account_restricted', reason: 'test' },
        { type: 'network_failure', isTimeout: false },
        { type: 'browser_failure', browser: 'test' },
        { type: 'platform_error', code: undefined, message: 'test' },
        { type: 'validation_failed', field: 'test', reason: 'test' },
        { type: 'circuit_open', accountId: 'test', until: new Date() },
        { type: 'duplicate_task', existingTaskId: 'test' },
        { type: 'unknown', message: 'test' },
      ];

      expect(errors).toHaveLength(10);
    });
  });

  describe('RecoveryStrategy types', () => {
    it('should have retry_with_backoff strategy', () => {
      const strategy: RecoveryStrategy = {
        type: 'retry_with_backoff',
        maxRetries: 3,
        baseDelayMs: 60000,
      };
      expect(strategy.type).toBe('retry_with_backoff');
    });

    it('should have circuit_break strategy', () => {
      const strategy: RecoveryStrategy = {
        type: 'circuit_break',
        cooldownLevel: 2,
      };
      expect(strategy.type).toBe('circuit_break');
    });

    it('should have dead_letter strategy', () => {
      const strategy: RecoveryStrategy = {
        type: 'dead_letter',
        reason: 'non_retryable',
      };
      expect(strategy.type).toBe('dead_letter');
    });

    it('should have escalate strategy', () => {
      const strategy: RecoveryStrategy = {
        type: 'escalate',
        severity: 'critical',
      };
      expect(strategy.type).toBe('escalate');
    });

    it('should have all 4 RecoveryStrategy variants', () => {
      const strategies: RecoveryStrategy[] = [
        { type: 'retry_with_backoff', maxRetries: 3, baseDelayMs: 60000 },
        { type: 'circuit_break', cooldownLevel: 1 },
        { type: 'dead_letter', reason: 'test' },
        { type: 'escalate', severity: 'error' },
      ];

      expect(strategies).toHaveLength(4);
    });
  });

  describe('Severity type', () => {
    it('should have all 4 severity levels', () => {
      const severities: Severity[] = ['info', 'warning', 'error', 'critical'];
      expect(severities).toHaveLength(4);
    });
  });

  describe('CircuitBreakerState type', () => {
    it('should have all 3 states', () => {
      const states: CircuitBreakerState[] = ['closed', 'open', 'half_open'];
      expect(states).toHaveLength(3);
    });
  });

  describe('CircuitBreakerConfig type', () => {
    it('should have all required config fields', () => {
      const config: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 3,
        waitDurationMs: 60000,
        maxWaitDurationMs: 300000,
      };

      expect(config.failureThreshold).toBe(5);
      expect(config.successThreshold).toBe(3);
      expect(config.waitDurationMs).toBe(60000);
      expect(config.maxWaitDurationMs).toBe(300000);
    });
  });

  describe('CircuitBreakerStatus type', () => {
    it('should represent full circuit breaker status', () => {
      const status: CircuitBreakerStatus = {
        accountId: 'acc_123',
        state: 'closed',
        consecutiveFailures: 2,
        config: {
          failureThreshold: 5,
          successThreshold: 3,
          waitDurationMs: 60000,
          maxWaitDurationMs: 300000,
        },
      };

      expect(status.accountId).toBe('acc_123');
      expect(status.state).toBe('closed');
      expect(status.consecutiveFailures).toBe(2);
      expect(status.config.failureThreshold).toBe(5);
    });

    it('should support open state with lastFailureAt', () => {
      const lastFailureAt = new Date('2026-04-11T12:00:00Z');
      const status: CircuitBreakerStatus = {
        accountId: 'acc_456',
        state: 'open',
        consecutiveFailures: 5,
        lastFailureAt,
        config: {
          failureThreshold: 5,
          successThreshold: 3,
          waitDurationMs: 60000,
          maxWaitDurationMs: 300000,
        },
      };

      expect(status.state).toBe('open');
      expect(status.lastFailureAt).toBe(lastFailureAt);
    });
  });

  describe('PlatformHealthStatus type', () => {
    it('should have all 4 statuses', () => {
      const statuses: PlatformHealthStatus[] = ['healthy', 'degraded', 'unhealthy', 'unknown'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('JSON serialization compatibility', () => {
    it('should serialize UnifiedError to JSON compatible with Rust serde', () => {
      const error: UnifiedError = {
        type: 'rate_limit',
        subcategory: 'hourly_limit',
      };
      
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);
      
      // Should match Rust's serde_json serialization format
      expect(parsed).toHaveProperty('type', 'rate_limit');
      expect(parsed).toHaveProperty('subcategory', 'hourly_limit');
    });

    it('should serialize RecoveryStrategy to JSON compatible with Rust serde', () => {
      const strategy: RecoveryStrategy = {
        type: 'retry_with_backoff',
        maxRetries: 3,
        baseDelayMs: 60000,
      };
      
      const json = JSON.stringify(strategy);
      const parsed = JSON.parse(json);
      
      // Should match Rust's serde_json serialization format
      expect(parsed).toHaveProperty('type', 'retry_with_backoff');
      expect(parsed).toHaveProperty('maxRetries', 3);
      expect(parsed).toHaveProperty('baseDelayMs', 60000);
    });
  });
});
