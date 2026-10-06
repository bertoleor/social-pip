import { invoke } from "@tauri-apps/api/core";
import { type PostJob, type PostSession, usePostingStore } from "@/stores/postingStore";
import { useQuickPostStore } from "@/stores/quickPostStore";
import { useTemplateStore } from "@/stores/templateStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

function createMockSession(overrides: Partial<PostSession> = {}): PostSession {
  return {
    id: "session_001",
    status: "running",
    accountId: "acc_001",
    totalJobs: 3,
    completedJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    configSnapshot: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockJob(overrides: Partial<PostJob> = {}): PostJob {
  return {
    id: "job_001",
    sessionId: "session_001",
    groupId: "group_001",
    platform: "facebook",
    priority: 1,
    content: "Test content",
    status: "pending",
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("Template to Posting Session Flow", () => {
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
      templates: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: null,
      preview: null,
      previewVariations: 0,
      previewValidation: null,
    });

    useQuickPostStore.setState({
      selectedTemplateId: null,
      selectedGroupIds: [],
      selectedAccountId: null,
      canPost: false,
      estimatedTime: 0,
      warningMessage: null,
      groups: [],
      groupsLoading: false,
      groupsError: null,
      accountRiskLevel: null,
      dailyPostCount: 0,
      dailyPostLimit: 30,
      cooldownUntil: null,
    });
  });

  describe("creates posting session from template", () => {
    it("starts session with valid template and account", async () => {
      const mockSession = createMockSession();
      mockInvoke.mockResolvedValueOnce(mockSession);

      useQuickPostStore.setState({
        selectedTemplateId: "tpl_001",
        selectedGroupIds: ["group_001", "group_002", "group_003"],
        selectedAccountId: "acc_001",
      });

      useTemplateStore.setState({
        templates: [
          {
            id: "tpl_001",
            name: "Test Template",
            sector: "marketing",
            platforms: ["facebook"],
            content: "{Hello|Hi} World",
            variants: [],
            imagePaths: [],
            includeLink: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        preview: {
          content: "Hello World",
          variation: 1,
          seed: 123,
        },
      });

      const { startSession } = usePostingStore.getState();
      const result = await startSession({
        templateId: "tpl_001",
        accountId: "acc_001",
        groupIds: ["group_001", "group_002", "group_003"],
      });

      expect(result.id).toBe("session_001");
      expect(mockInvoke).toHaveBeenCalledWith("start_posting_session", expect.any(Object));
    });

    it("passes content from template preview to session", async () => {
      const mockSession = createMockSession();
      mockInvoke.mockResolvedValueOnce(mockSession);

      const { startSession } = usePostingStore.getState();
      await startSession({
        accountId: "acc_001",
        groupIds: ["group_001"],
        content: "Custom content without template",
      });

      const callArgs = mockInvoke.mock.calls[0];
      const configArg = callArgs?.[1] as { config: { content?: string } } | undefined;

      expect(configArg?.config?.content).toBe("Custom content without template");
    });

    it("sets isProcessing to true during session", async () => {
      const mockSession = createMockSession({ status: "running" });
      mockInvoke.mockResolvedValueOnce(mockSession);

      const { startSession } = usePostingStore.getState();

      await startSession({
        accountId: "acc_001",
        groupIds: ["group_001"],
      });

      const state = usePostingStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.currentSession).not.toBeNull();
    });
  });

  describe("generates jobs for each group", () => {
    it("session tracks total jobs based on group count", async () => {
      const mockSession = createMockSession({
        totalJobs: 5,
      });
      mockInvoke.mockResolvedValueOnce(mockSession);

      const { startSession } = usePostingStore.getState();
      const result = await startSession({
        accountId: "acc_001",
        groupIds: ["g1", "g2", "g3", "g4", "g5"],
      });

      expect(result.totalJobs).toBe(5);
    });

    it("jobs array starts empty and is populated via updates", async () => {
      const mockSession = createMockSession();
      mockInvoke.mockResolvedValueOnce(mockSession);

      const { startSession } = usePostingStore.getState();
      await startSession({
        accountId: "acc_001",
        groupIds: ["group_001"],
      });

      const state = usePostingStore.getState();
      expect(state.jobs).toEqual([]);
    });

    it("updateJobStatus adds job to tracking", () => {
      usePostingStore.setState({
        jobs: [createMockJob({ id: "job_001", status: "pending" })],
      });

      const { updateJobStatus } = usePostingStore.getState();
      updateJobStatus("job_001", "processing");

      const state = usePostingStore.getState();
      expect(state.jobs[0]?.status).toBe("processing");
    });

    it("updateJobStatus handles success with postUrl", () => {
      usePostingStore.setState({
        jobs: [createMockJob({ id: "job_001" })],
      });

      const { updateJobStatus } = usePostingStore.getState();
      updateJobStatus("job_001", "success", { postUrl: "https://facebook.com/post/123" });

      const state = usePostingStore.getState();
      expect(state.jobs[0]?.status).toBe("success");
      expect(state.jobs[0]?.postUrl).toBe("https://facebook.com/post/123");
    });

    it("updateJobStatus handles failure with error", () => {
      usePostingStore.setState({
        jobs: [createMockJob({ id: "job_001" })],
      });

      const { updateJobStatus } = usePostingStore.getState();
      updateJobStatus("job_001", "failed", {
        error: "Rate limited",
        errorCategory: "rate_limit",
      });

      const state = usePostingStore.getState();
      expect(state.jobs[0]?.status).toBe("failed");
      expect(state.jobs[0]?.errorMessage).toBe("Rate limited");
      expect(state.jobs[0]?.errorCategory).toBe("rate_limit");
    });
  });

  describe("tracks session progress", () => {
    it("updateSessionStatus updates session counts", () => {
      usePostingStore.setState({
        currentSession: createMockSession(),
      });

      const { updateSessionStatus } = usePostingStore.getState();
      updateSessionStatus("running", {
        completed: 2,
        successful: 1,
        failed: 1,
      });

      const state = usePostingStore.getState();
      expect(state.currentSession?.completedJobs).toBe(2);
      expect(state.currentSession?.successfulJobs).toBe(1);
      expect(state.currentSession?.failedJobs).toBe(1);
    });

    it("updateSessionStatus sets completedAt when completed", () => {
      usePostingStore.setState({
        currentSession: createMockSession(),
      });

      const { updateSessionStatus } = usePostingStore.getState();
      updateSessionStatus("completed", { completed: 3, successful: 3 });

      const state = usePostingStore.getState();
      expect(state.currentSession?.status).toBe("completed");
      expect(state.currentSession?.completedAt).toBeInstanceOf(Date);
    });

    it("setSessionComplete finalizes session", () => {
      usePostingStore.setState({
        currentSession: createMockSession(),
        isProcessing: true,
      });

      const { setSessionComplete } = usePostingStore.getState();
      setSessionComplete("session_001", {
        status: "completed",
        totalJobs: 10,
        successCount: 8,
        failedCount: 2,
        skippedCount: 0,
      });

      const state = usePostingStore.getState();
      expect(state.currentSession?.status).toBe("completed");
      expect(state.currentSession?.totalJobs).toBe(10);
      expect(state.currentSession?.successfulJobs).toBe(8);
      expect(state.currentSession?.failedJobs).toBe(2);
      expect(state.isProcessing).toBe(false);
    });

    it("cancelSession stops processing", async () => {
      usePostingStore.setState({
        currentSession: createMockSession({ status: "running" }),
        isProcessing: true,
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      const { cancelSession } = usePostingStore.getState();
      await cancelSession();

      const state = usePostingStore.getState();
      expect(state.currentSession?.status).toBe("cancelled");
      expect(state.isProcessing).toBe(false);
    });

    it("getSessionStatus refreshes state from backend", async () => {
      const freshSession = createMockSession({ completedJobs: 2 });
      const freshJobs = [
        createMockJob({ id: "job_001", status: "success" }),
        createMockJob({ id: "job_002", status: "success" }),
        createMockJob({ id: "job_003", status: "pending" }),
      ];

      mockInvoke.mockResolvedValueOnce({ session: freshSession, jobs: freshJobs });

      const { getSessionStatus } = usePostingStore.getState();
      await getSessionStatus("session_001");

      const state = usePostingStore.getState();
      expect(state.currentSession?.completedJobs).toBe(2);
      expect(state.jobs).toHaveLength(3);
    });
  });
});
