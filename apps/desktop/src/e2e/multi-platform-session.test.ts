import type { PlatformTarget } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePostingStore } from "../stores/postingStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

interface MockPostSession {
  id: string;
  status: "pending" | "running" | "completed" | "cancelled" | "failed";
  templateId?: string;
  accountId: string;
  totalJobs: number;
  completedJobs: number;
  successfulJobs: number;
  failedJobs: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  lastError?: string;
  errorCategory?: string;
  configSnapshot: string;
  createdAt: string;
  updatedAt: string;
}

interface MockPostJob {
  id: string;
  sessionId: string;
  groupId: string;
  platform: string;
  priority: number;
  content: string;
  postUrl?: string;
  status: "pending" | "processing" | "success" | "failed" | "skipped";
  errorMessage?: string;
  errorCategory?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

describe("E2E: Multi-Platform Session Flow", () => {
  beforeEach(() => {
    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      mediaFiles: [],
      mediaValidation: new Map(),
      platformTargets: [],
    });
    vi.clearAllMocks();
  });

  describe("TASK-037: Session creation with multiple platforms", () => {
    it("should create session with Facebook Groups (priority 0) and Instagram (priority 1)", async () => {
      const mockSession: MockPostSession = {
        id: "sess_1234567890",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 2,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockInvoke.mockResolvedValueOnce(mockSession);

      const platforms: PlatformTarget[] = [
        {
          platform: "facebook_groups",
          accountId: "acc_123",
          targets: ["group_1"],
          priority: 0,
        },
        {
          platform: "instagram",
          accountId: "acc_123",
          targets: ["profile_1"],
          priority: 20,
        },
      ];

      const session = await act(async () => {
        return usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms,
          content: "Test post content",
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("start_multi_platform_session", {
        config: {
          account_id: "acc_123",
          platforms: expect.arrayContaining([
            expect.objectContaining({
              platform: "facebook_groups",
              priority: 0,
            }),
            expect.objectContaining({
              platform: "instagram",
              priority: 20,
            }),
          ]),
          template_id: undefined,
          content: "Test post content",
        },
      });

      expect(session.id).toBe("sess_1234567890");
      expect(session.totalJobs).toBe(2);
    });

    it("should create jobs with correct platforms and priorities", async () => {
      const mockSession: MockPostSession = {
        id: "sess_test",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 2,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockJobs: MockPostJob[] = [
        {
          id: "job_1",
          sessionId: "sess_test",
          groupId: "group_1",
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "job_2",
          sessionId: "sess_test",
          groupId: "profile_1",
          platform: "instagram",
          priority: 20,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockInvoke
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ session: mockSession, jobs: mockJobs });

      const platforms: PlatformTarget[] = [
        {
          platform: "facebook_groups",
          accountId: "acc_123",
          targets: ["group_1"],
          priority: 0,
        },
        {
          platform: "instagram",
          accountId: "acc_123",
          targets: ["profile_1"],
          priority: 20,
        },
      ];

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms,
        });
      });

      await act(async () => {
        await usePostingStore.getState().getSessionStatus("sess_test");
      });

      const state = usePostingStore.getState();
      expect(state.jobs).toHaveLength(2);

      const fbJob = state.jobs.find((j) => j.platform === "facebook_groups");
      const igJob = state.jobs.find((j) => j.platform === "instagram");

      expect(fbJob).toBeDefined();
      expect(fbJob?.priority).toBe(0);
      expect(igJob).toBeDefined();
      expect(igJob?.priority).toBe(20);
    });

    it("should validate jobs are ordered by priority", async () => {
      const mockSession: MockPostSession = {
        id: "sess_ordered",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 3,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockJobs: MockPostJob[] = [
        {
          id: "job_1",
          sessionId: "sess_ordered",
          groupId: "group_1",
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "job_2",
          sessionId: "sess_ordered",
          groupId: "profile_1",
          platform: "instagram",
          priority: 20,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "job_3",
          sessionId: "sess_ordered",
          groupId: "twitter_1",
          platform: "twitter",
          priority: 30,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockInvoke
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ session: mockSession, jobs: mockJobs });

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms: [
            { platform: "twitter", accountId: "acc_123", targets: ["twitter_1"], priority: 30 },
            {
              platform: "facebook_groups",
              accountId: "acc_123",
              targets: ["group_1"],
              priority: 0,
            },
            { platform: "instagram", accountId: "acc_123", targets: ["profile_1"], priority: 20 },
          ],
        });
      });

      await act(async () => {
        await usePostingStore.getState().getSessionStatus("sess_ordered");
      });

      const state = usePostingStore.getState();
      const priorities = state.jobs.map((j) => j.priority);

      expect(priorities).toEqual([0, 20, 30]);
    });
  });

  describe("store state management", () => {
    it("should update platformTargets after session creation", async () => {
      const mockSession: MockPostSession = {
        id: "sess_test",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 2,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockInvoke.mockResolvedValueOnce(mockSession);

      const platforms: PlatformTarget[] = [
        { platform: "facebook_groups", accountId: "acc_123", targets: ["g1"], priority: 0 },
        { platform: "instagram", accountId: "acc_123", targets: ["p1"], priority: 20 },
      ];

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms,
        });
      });

      const state = usePostingStore.getState();
      expect(state.platformTargets).toHaveLength(2);
      expect(state.platformTargets[0].platform).toBe("facebook_groups");
      expect(state.platformTargets[1].platform).toBe("instagram");
    });

    it("should set isProcessing to true during session start", async () => {
      const mockSession: MockPostSession = {
        id: "sess_test",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 1,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockInvoke.mockResolvedValueOnce(mockSession);

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms: [
            { platform: "facebook_groups", accountId: "acc_123", targets: ["g1"], priority: 0 },
          ],
        });
      });

      expect(usePostingStore.getState().isProcessing).toBe(true);
    });

    it("should clear error on successful session start", async () => {
      usePostingStore.setState({ error: "Previous error" });

      const mockSession: MockPostSession = {
        id: "sess_test",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 1,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockInvoke.mockResolvedValueOnce(mockSession);

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms: [
            { platform: "facebook_groups", accountId: "acc_123", targets: ["g1"], priority: 0 },
          ],
        });
      });

      expect(usePostingStore.getState().error).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should set error when session creation fails", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Platform not supported"));

      await act(async () => {
        try {
          await usePostingStore.getState().startMultiPlatformSession({
            accountId: "acc_123",
            platforms: [
              { platform: "invalid" as never, accountId: "acc_123", targets: ["t1"], priority: 99 },
            ],
          });
        } catch {
          // Expected error
        }
      });

      const state = usePostingStore.getState();
      expect(state.error).toBe("Platform not supported");
      expect(state.isProcessing).toBe(false);
    });

    it("should handle empty platforms array", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("At least one platform target is required"));

      await act(async () => {
        try {
          await usePostingStore.getState().startMultiPlatformSession({
            accountId: "acc_123",
            platforms: [],
          });
        } catch {
          // Expected error
        }
      });

      expect(usePostingStore.getState().error).toContain("platform");
    });
  });
});
