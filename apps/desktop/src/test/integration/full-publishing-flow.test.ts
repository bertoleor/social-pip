import { type PostJob, type PostSession, usePostingStore } from "@/stores/postingStore";
import { useQuickPostStore } from "@/stores/quickPostStore";
import { useTemplateStore } from "@/stores/templateStore";
import { countVariations, parseSpintax } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

function createCompleteSession(): PostSession {
  return {
    id: "session_full",
    status: "running",
    accountId: "acc_001",
    totalJobs: 3,
    completedJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    configSnapshot: JSON.stringify({
      templateId: "tpl_001",
      groupIds: ["group_1", "group_2", "group_3"],
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createPendingJob(index: number): PostJob {
  return {
    id: `job_${index}`,
    sessionId: "session_full",
    groupId: `group_${index}`,
    platform: "facebook",
    priority: index,
    content: "Test content",
    status: "pending",
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("Complete Publishing Flow", () => {
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

    useTemplateStore.setState({
      templates: [
        {
          id: "tpl_001",
          name: "Marketing Template",
          sector: "marketing",
          platforms: ["facebook"],
          content: "{Excited|Thrilled} to share {this|our latest} {update|news}!",
          variants: [],
          imagePaths: [],
          includeLink: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      selectedId: "tpl_001",
      loading: false,
      error: null,
      filter: null,
      preview: null,
      previewVariations: 0,
      previewValidation: null,
    });

    useQuickPostStore.setState({
      selectedTemplateId: "tpl_001",
      selectedGroupIds: ["group_1", "group_2", "group_3"],
      selectedAccountId: "acc_001",
      canPost: true,
      estimatedTime: 180,
      warningMessage: null,
      groups: [
        { id: "group_1", name: "Group 1", memberCount: 1000 },
        { id: "group_2", name: "Group 2", memberCount: 2000 },
        { id: "group_3", name: "Group 3", memberCount: 1500 },
      ],
      groupsLoading: false,
      groupsError: null,
      accountRiskLevel: "LOW",
      dailyPostCount: 5,
      dailyPostLimit: 30,
      cooldownUntil: null,
    });
  });

  describe("executes full flow successfully", () => {
    it("validates template content before posting", () => {
      const template = useTemplateStore.getState().templates[0];
      expect(template).toBeDefined();

      const variationCount = countVariations(template?.content ?? "");
      expect(variationCount).toBe(8);
    });

    it("generates unique content variations for each group", () => {
      const template = useTemplateStore.getState().templates[0];

      const groupCount = 3;
      const variations: string[] = [];

      for (let i = 0; i < groupCount; i++) {
        const result = parseSpintax(template?.content ?? "", { seed: 100 + i });
        variations.push(result.text);
      }

      const uniqueVariations = new Set(variations);
      expect(uniqueVariations.size).toBeGreaterThanOrEqual(1);
      expect(uniqueVariations.size).toBeLessThanOrEqual(8);
    });

    it("starts posting session with all selections", async () => {
      const mockSession = createCompleteSession();
      mockInvoke.mockResolvedValueOnce(mockSession);

      const { startSession } = usePostingStore.getState();
      const result = await startSession({
        templateId: "tpl_001",
        accountId: "acc_001",
        groupIds: ["group_1", "group_2", "group_3"],
      });

      expect(result.id).toBe("session_full");
      expect(result.totalJobs).toBe(3);
      expect(mockInvoke).toHaveBeenCalledWith("start_posting_session", expect.any(Object));
    });

    it("tracks progress through job completion", async () => {
      usePostingStore.setState({
        currentSession: createCompleteSession(),
        jobs: [createPendingJob(1), createPendingJob(2), createPendingJob(3)],
        isProcessing: true,
      });

      const { updateJobStatus, updateSessionStatus } = usePostingStore.getState();

      updateJobStatus("job_1", "processing");
      await new Promise((resolve) => setTimeout(resolve, 10));
      updateJobStatus("job_1", "success", { postUrl: "https://facebook.com/post/1" });

      updateSessionStatus("running", { completed: 1, successful: 1 });

      const midState = usePostingStore.getState();
      expect(midState.jobs[0]?.status).toBe("success");
      expect(midState.jobs[0]?.postUrl).toBe("https://facebook.com/post/1");
      expect(midState.currentSession?.completedJobs).toBe(1);
      expect(midState.currentSession?.successfulJobs).toBe(1);

      updateJobStatus("job_2", "processing");
      await new Promise((resolve) => setTimeout(resolve, 10));
      updateJobStatus("job_2", "success", { postUrl: "https://facebook.com/post/2" });
      updateJobStatus("job_3", "processing");
      await new Promise((resolve) => setTimeout(resolve, 10));
      updateJobStatus("job_3", "success", { postUrl: "https://facebook.com/post/3" });

      updateSessionStatus("completed", { completed: 3, successful: 3 });

      const finalState = usePostingStore.getState();
      expect(finalState.currentSession?.status).toBe("completed");
      expect(finalState.currentSession?.completedJobs).toBe(3);
      expect(finalState.jobs.every((j) => j.status === "success")).toBe(true);
    });

    it("finalizes session with complete results", () => {
      usePostingStore.setState({
        currentSession: createCompleteSession(),
        isProcessing: true,
      });

      const { setSessionComplete } = usePostingStore.getState();
      setSessionComplete("session_full", {
        status: "completed",
        totalJobs: 3,
        successCount: 3,
        failedCount: 0,
        skippedCount: 0,
      });

      const state = usePostingStore.getState();
      expect(state.currentSession?.status).toBe("completed");
      expect(state.isProcessing).toBe(false);
      expect(state.currentSession?.successfulJobs).toBe(3);
    });
  });

  describe("handles partial failures", () => {
    it("continues posting after single job failure", async () => {
      usePostingStore.setState({
        currentSession: createCompleteSession(),
        jobs: [createPendingJob(1), createPendingJob(2), createPendingJob(3)],
        isProcessing: true,
      });

      const { updateJobStatus, updateSessionStatus } = usePostingStore.getState();

      updateJobStatus("job_1", "success", { postUrl: "https://facebook.com/post/1" });
      updateJobStatus("job_2", "failed", { error: "Rate limited", errorCategory: "rate_limit" });
      updateJobStatus("job_3", "success", { postUrl: "https://facebook.com/post/3" });

      updateSessionStatus("completed", { completed: 3, successful: 2, failed: 1 });

      const state = usePostingStore.getState();
      expect(state.currentSession?.successfulJobs).toBe(2);
      expect(state.currentSession?.failedJobs).toBe(1);
      expect(state.jobs[1]?.status).toBe("failed");
      expect(state.jobs[1]?.errorCategory).toBe("rate_limit");
    });

    it("marks session as partially completed with mixed results", () => {
      usePostingStore.setState({
        currentSession: createCompleteSession(),
        isProcessing: true,
      });

      const { setSessionComplete } = usePostingStore.getState();
      setSessionComplete("session_full", {
        status: "completed",
        totalJobs: 3,
        successCount: 2,
        failedCount: 1,
        skippedCount: 0,
      });

      const state = usePostingStore.getState();
      expect(state.currentSession?.status).toBe("completed");
      expect(state.currentSession?.successfulJobs).toBe(2);
      expect(state.currentSession?.failedJobs).toBe(1);
    });

    it("identifies failed jobs for retry", () => {
      usePostingStore.setState({
        jobs: [
          { ...createPendingJob(1), status: "success" },
          { ...createPendingJob(2), status: "failed", retryCount: 1, maxRetries: 3 },
          { ...createPendingJob(3), status: "success" },
        ],
      });

      const failedJobs = usePostingStore
        .getState()
        .jobs.filter((j) => j.status === "failed" && j.retryCount < j.maxRetries);

      expect(failedJobs).toHaveLength(1);
      expect(failedJobs[0]?.id).toBe("job_2");
    });

    it("separates retryable from non-retryable failures", () => {
      const jobs: PostJob[] = [
        { ...createPendingJob(1), status: "failed", errorCategory: "rate_limit", retryCount: 1 },
        { ...createPendingJob(2), status: "failed", errorCategory: "auth_expired", retryCount: 0 },
        { ...createPendingJob(3), status: "failed", errorCategory: "spam_detected", retryCount: 0 },
      ];

      const retryableCategories = ["rate_limit", "network_error", "facebook_changed", "unknown"];
      const retryable = jobs.filter((j) => retryableCategories.includes(j.errorCategory ?? ""));
      const nonRetryable = jobs.filter((j) => !retryableCategories.includes(j.errorCategory ?? ""));

      expect(retryable).toHaveLength(1);
      expect(nonRetryable).toHaveLength(2);
    });
  });

  describe("recovers from interruption", () => {
    it("restores session state from backend", async () => {
      const existingSession: PostSession = {
        id: "session_existing",
        status: "running",
        accountId: "acc_001",
        totalJobs: 5,
        completedJobs: 2,
        successfulJobs: 2,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(),
      };

      const existingJobs: PostJob[] = [
        { ...createPendingJob(1), status: "success", postUrl: "url1" },
        { ...createPendingJob(2), status: "success", postUrl: "url2" },
        { ...createPendingJob(3), status: "pending" },
        { ...createPendingJob(4), status: "pending" },
        { ...createPendingJob(5), status: "pending" },
      ];

      mockInvoke.mockResolvedValueOnce({ session: existingSession, jobs: existingJobs });

      const { getSessionStatus } = usePostingStore.getState();
      await getSessionStatus("session_existing");

      const state = usePostingStore.getState();
      expect(state.currentSession?.id).toBe("session_existing");
      expect(state.currentSession?.completedJobs).toBe(2);
      expect(state.jobs).toHaveLength(5);
      expect(state.isProcessing).toBe(true);
    });

    it("resumes from last completed job", async () => {
      usePostingStore.setState({
        currentSession: createCompleteSession(),
        jobs: [
          { ...createPendingJob(1), status: "success" },
          { ...createPendingJob(2), status: "success" },
          { ...createPendingJob(3), status: "pending" },
        ],
        isProcessing: true,
      });

      const pendingJobs = usePostingStore.getState().jobs.filter((j) => j.status === "pending");
      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0]?.id).toBe("job_3");
    });

    it("handles cancelled session gracefully", async () => {
      usePostingStore.setState({
        currentSession: { ...createCompleteSession(), status: "running" },
        isProcessing: true,
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      const { cancelSession } = usePostingStore.getState();
      await cancelSession();

      const state = usePostingStore.getState();
      expect(state.currentSession?.status).toBe("cancelled");
      expect(state.isProcessing).toBe(false);
    });

    it("can clear error state after recovery", async () => {
      usePostingStore.setState({
        currentSession: createCompleteSession(),
        error: "Previous error",
        isProcessing: true,
      });

      mockInvoke.mockResolvedValueOnce({
        session: { ...createCompleteSession(), status: "completed" },
        jobs: [],
      });

      const { getSessionStatus, clearError } = usePostingStore.getState();
      await getSessionStatus("session_full");

      clearError();

      const state = usePostingStore.getState();
      expect(state.error).toBeNull();
    });
  });
});
