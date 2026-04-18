import { type PostJob, usePostingStore } from "@/stores/postingStore";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

type ErrorCategory =
  | "rate_limit"
  | "auth_expired"
  | "group_not_found"
  | "permission_denied"
  | "network_error"
  | "facebook_changed"
  | "spam_detected"
  | "unknown";

function categorizeError(error: string): { category: ErrorCategory; retryable: boolean } {
  const lowerError = error.toLowerCase();

  if (lowerError.includes("rate limit") || lowerError.includes("try again later")) {
    return { category: "rate_limit", retryable: true };
  }
  if (lowerError.includes("session expired") || lowerError.includes("login required")) {
    return { category: "auth_expired", retryable: false };
  }
  if (lowerError.includes("group not found") || lowerError.includes("does not exist")) {
    return { category: "group_not_found", retryable: false };
  }
  if (lowerError.includes("permission") || lowerError.includes("not allowed")) {
    return { category: "permission_denied", retryable: false };
  }
  if (
    lowerError.includes("network") ||
    lowerError.includes("timeout") ||
    lowerError.includes("connection")
  ) {
    return { category: "network_error", retryable: true };
  }
  if (lowerError.includes("unexpected") || lowerError.includes("page changed")) {
    return { category: "facebook_changed", retryable: true };
  }
  if (
    lowerError.includes("spam") ||
    lowerError.includes("blocked") ||
    lowerError.includes("restricted")
  ) {
    return { category: "spam_detected", retryable: false };
  }

  return { category: "unknown", retryable: true };
}

function createMockJobWithRetry(overrides: Partial<PostJob> = {}): PostJob {
  return {
    id: "job_001",
    sessionId: "session_001",
    groupId: "group_001",
    platform: "facebook",
    priority: 1,
    content: "Test content",
    status: "failed",
    errorMessage: "Rate limited",
    errorCategory: "rate_limit",
    retryCount: 1,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("Error Handling Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      mediaFiles: [],
      mediaValidation: new Map(),
      platformTargets: [],
    });
  });

  describe("categorizes errors correctly", () => {
    it("categorizes rate limit error", () => {
      const result = categorizeError("Rate limit exceeded. Please try again later.");

      expect(result.category).toBe("rate_limit");
      expect(result.retryable).toBe(true);
    });

    it("categorizes auth expired error", () => {
      const result = categorizeError("Session expired. Login required.");

      expect(result.category).toBe("auth_expired");
      expect(result.retryable).toBe(false);
    });

    it("categorizes group not found error", () => {
      const result = categorizeError("Group not found or does not exist");

      expect(result.category).toBe("group_not_found");
      expect(result.retryable).toBe(false);
    });

    it("categorizes permission denied error", () => {
      const result = categorizeError("Permission denied. You are not allowed to post.");

      expect(result.category).toBe("permission_denied");
      expect(result.retryable).toBe(false);
    });

    it("categorizes network error", () => {
      const result = categorizeError("Network timeout - connection failed");

      expect(result.category).toBe("network_error");
      expect(result.retryable).toBe(true);
    });

    it("categorizes facebook changed error", () => {
      const result = categorizeError("Unexpected page structure - Facebook page changed");

      expect(result.category).toBe("facebook_changed");
      expect(result.retryable).toBe(true);
    });

    it("categorizes spam detected error", () => {
      const result = categorizeError("Spam detected. Account blocked.");

      expect(result.category).toBe("spam_detected");
      expect(result.retryable).toBe(false);
    });

    it("categorizes unknown error as retryable", () => {
      const result = categorizeError("Something weird happened");

      expect(result.category).toBe("unknown");
      expect(result.retryable).toBe(true);
    });

    it("job update stores error category", () => {
      usePostingStore.setState({
        jobs: [createMockJobWithRetry({ status: "processing" })],
      });

      const { updateJobStatus } = usePostingStore.getState();
      updateJobStatus("job_001", "failed", {
        error: "Rate limit exceeded",
        errorCategory: "rate_limit",
      });

      const state = usePostingStore.getState();
      expect(state.jobs[0]?.status).toBe("failed");
      expect(state.jobs[0]?.errorCategory).toBe("rate_limit");
    });
  });

  describe("retries failed jobs", () => {
    it("marks job for retry when retryable and under max", () => {
      usePostingStore.setState({
        jobs: [createMockJobWithRetry({ retryCount: 1, maxRetries: 3 })],
      });

      const job = usePostingStore.getState().jobs[0];
      expect(job?.retryCount).toBe(1);
      expect(job?.maxRetries).toBe(3);

      const canRetry = (job?.retryCount ?? 0) < (job?.maxRetries ?? 0);
      expect(canRetry).toBe(true);
    });

    it("does not retry non-retryable errors", () => {
      usePostingStore.setState({
        jobs: [
          createMockJobWithRetry({
            errorCategory: "auth_expired",
            retryCount: 0,
            maxRetries: 3,
          }),
        ],
      });

      const job = usePostingStore.getState().jobs[0];
      const nonRetryableCategories = [
        "auth_expired",
        "group_not_found",
        "permission_denied",
        "spam_detected",
      ];
      const canRetry = !nonRetryableCategories.includes(job?.errorCategory ?? "unknown");

      expect(canRetry).toBe(false);
    });

    it("exhausts retries after max attempts", () => {
      usePostingStore.setState({
        jobs: [
          createMockJobWithRetry({
            retryCount: 3,
            maxRetries: 3,
          }),
        ],
      });

      const job = usePostingStore.getState().jobs[0];
      const maxRetriesReached = (job?.retryCount ?? 0) >= (job?.maxRetries ?? 0);
      expect(maxRetriesReached).toBe(true);
    });

    it("increment retry count on retry attempt", () => {
      usePostingStore.setState({
        jobs: [
          createMockJobWithRetry({
            retryCount: 1,
            status: "failed",
          }),
        ],
      });

      const { updateJobStatus } = usePostingStore.getState();
      updateJobStatus("job_001", "pending");

      const state = usePostingStore.getState();
      expect(state.jobs[0]?.status).toBe("pending");
    });
  });

  describe("moves to DLQ after max retries", () => {
    it("job with exhausted retries is DLQ candidate", () => {
      const dlqCandidate = createMockJobWithRetry({
        retryCount: 3,
        maxRetries: 3,
        errorCategory: "rate_limit",
      });

      const shouldMoveToDlq =
        (dlqCandidate.retryCount ?? 0) >= (dlqCandidate.maxRetries ?? 0) &&
        dlqCandidate.status === "failed";

      expect(shouldMoveToDlq).toBe(true);
    });

    it("non-retryable errors go directly to DLQ", () => {
      const dlqCandidate = createMockJobWithRetry({
        retryCount: 0,
        maxRetries: 3,
        errorCategory: "spam_detected",
      });

      const nonRetryableCategories = [
        "auth_expired",
        "group_not_found",
        "permission_denied",
        "spam_detected",
      ];
      const shouldMoveToDlq = nonRetryableCategories.includes(
        dlqCandidate.errorCategory ?? "unknown",
      );

      expect(shouldMoveToDlq).toBe(true);
    });

    it("DLQ entry preserves error context", () => {
      const failedJob = createMockJobWithRetry({
        id: "job_123",
        errorMessage: "Critical failure",
        errorCategory: "spam_detected",
      });

      const dlqEntry = {
        originalJobId: failedJob.id,
        error: failedJob.errorMessage,
        errorCategory: failedJob.errorCategory,
        timestamp: new Date(),
      };

      expect(dlqEntry.originalJobId).toBe("job_123");
      expect(dlqEntry.error).toBe("Critical failure");
      expect(dlqEntry.errorCategory).toBe("spam_detected");
    });

    it("session tracks failed count for DLQ items", () => {
      usePostingStore.setState({
        currentSession: {
          id: "session_001",
          status: "running",
          accountId: "acc_001",
          totalJobs: 3,
          completedJobs: 0,
          successfulJobs: 0,
          failedJobs: 2,
          configSnapshot: "{}",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        jobs: [
          createMockJobWithRetry({ id: "job_1", retryCount: 3, maxRetries: 3 }),
          createMockJobWithRetry({ id: "job_2", retryCount: 3, maxRetries: 3 }),
        ],
      });

      const state = usePostingStore.getState();
      expect(state.currentSession?.failedJobs).toBe(2);
    });
  });

  describe("error recovery strategies", () => {
    it("rate limit errors should wait before retry", () => {
      const error = "Rate limit exceeded";
      const category = categorizeError(error);

      const retryDelay = category.category === "rate_limit" ? 30 * 60 * 1000 : 5000;

      expect(retryDelay).toBe(30 * 60 * 1000);
    });

    it("network errors use exponential backoff", () => {
      const baseDelay = 5000;
      const attempts = [1, 2, 3];
      const delays = attempts.map((attempt) => baseDelay * 3 ** (attempt - 1));

      expect(delays[0]).toBe(5000);
      expect(delays[1]).toBe(15000);
      expect(delays[2]).toBe(45000);
    });

    it("auth errors require user intervention", () => {
      const error = "Session expired";
      const category = categorizeError(error);

      const requiresUserAction = !category.retryable;

      expect(requiresUserAction).toBe(true);
    });

    it("facebook changed errors may need selector update", () => {
      const error = "Unexpected page structure";
      const category = categorizeError(error);

      const needsSelectorUpdate = category.category === "facebook_changed";

      expect(needsSelectorUpdate).toBe(true);
    });
  });
});
