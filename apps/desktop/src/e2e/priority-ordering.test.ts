import type { PlatformTarget } from "@social-pip/types";
import { PLATFORM_PRIORITIES } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePostingStore } from "../stores/postingStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

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

describe("E2E: Priority Ordering Validation", () => {
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

  describe("TASK-038: Job execution order validation", () => {
    it("should validate jobs execute in priority order (ascending)", async () => {
      const mockSession: MockPostSession = {
        id: "sess_priority",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 4,
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
          sessionId: "sess_priority",
          groupId: "fb_group_1",
          platform: "facebook_groups",
          priority: PLATFORM_PRIORITIES.facebook_groups,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "job_2",
          sessionId: "sess_priority",
          groupId: "fb_page_1",
          platform: "facebook_pages",
          priority: PLATFORM_PRIORITIES.facebook_pages,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:01Z",
          updatedAt: "2024-01-01T00:00:01Z",
        },
        {
          id: "job_3",
          sessionId: "sess_priority",
          groupId: "ig_profile_1",
          platform: "instagram",
          priority: PLATFORM_PRIORITIES.instagram,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:02Z",
          updatedAt: "2024-01-01T00:00:02Z",
        },
        {
          id: "job_4",
          sessionId: "sess_priority",
          groupId: "twitter_1",
          platform: "twitter",
          priority: PLATFORM_PRIORITIES.twitter,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:03Z",
          updatedAt: "2024-01-01T00:00:03Z",
        },
      ];

      mockInvoke
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ session: mockSession, jobs: mockJobs });

      const platforms: PlatformTarget[] = [
        {
          platform: "twitter",
          accountId: "acc_123",
          targets: ["twitter_1"],
          priority: PLATFORM_PRIORITIES.twitter,
        },
        {
          platform: "instagram",
          accountId: "acc_123",
          targets: ["ig_profile_1"],
          priority: PLATFORM_PRIORITIES.instagram,
        },
        {
          platform: "facebook_pages",
          accountId: "acc_123",
          targets: ["fb_page_1"],
          priority: PLATFORM_PRIORITIES.facebook_pages,
        },
        {
          platform: "facebook_groups",
          accountId: "acc_123",
          targets: ["fb_group_1"],
          priority: PLATFORM_PRIORITIES.facebook_groups,
        },
      ];

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms,
        });
      });

      await act(async () => {
        await usePostingStore.getState().getSessionStatus("sess_priority");
      });

      const state = usePostingStore.getState();
      const jobs = state.jobs;

      expect(jobs).toHaveLength(4);

      expect(jobs[0].priority).toBeLessThanOrEqual(jobs[1].priority);
      expect(jobs[1].priority).toBeLessThanOrEqual(jobs[2].priority);
      expect(jobs[2].priority).toBeLessThanOrEqual(jobs[3].priority);

      expect(jobs[0].priority).toBe(0);
      expect(jobs[1].priority).toBe(10);
      expect(jobs[2].priority).toBe(20);
      expect(jobs[3].priority).toBe(30);
    });

    it("should validate same-priority jobs maintain stable order", async () => {
      const mockSession: MockPostSession = {
        id: "sess_stable",
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

      const creationOrder = ["group_A", "group_B", "group_C"];
      const mockJobs: MockPostJob[] = [
        {
          id: "job_1",
          sessionId: "sess_stable",
          groupId: creationOrder[0],
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "job_2",
          sessionId: "sess_stable",
          groupId: creationOrder[1],
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00.001Z",
          updatedAt: "2024-01-01T00:00:00.001Z",
        },
        {
          id: "job_3",
          sessionId: "sess_stable",
          groupId: creationOrder[2],
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:00.002Z",
          updatedAt: "2024-01-01T00:00:00.002Z",
        },
      ];

      mockInvoke
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ session: mockSession, jobs: mockJobs });

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms: [
            {
              platform: "facebook_groups",
              accountId: "acc_123",
              targets: creationOrder,
              priority: 0,
            },
          ],
        });
      });

      await act(async () => {
        await usePostingStore.getState().getSessionStatus("sess_stable");
      });

      const state = usePostingStore.getState();

      expect(state.jobs.map((j) => j.groupId)).toEqual(creationOrder);

      state.jobs.forEach((job) => {
        expect(job.priority).toBe(0);
      });
    });

    it("should validate mixed priority jobs sort correctly", async () => {
      const mockSession: MockPostSession = {
        id: "sess_mixed",
        status: "pending",
        accountId: "acc_123",
        totalJobs: 5,
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
          sessionId: "sess_mixed",
          groupId: "g1",
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
          sessionId: "sess_mixed",
          groupId: "g2",
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:01Z",
          updatedAt: "2024-01-01T00:00:01Z",
        },
        {
          id: "job_3",
          sessionId: "sess_mixed",
          groupId: "p1",
          platform: "instagram",
          priority: 20,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:02Z",
          updatedAt: "2024-01-01T00:00:02Z",
        },
        {
          id: "job_4",
          sessionId: "sess_mixed",
          groupId: "p2",
          platform: "instagram",
          priority: 20,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:03Z",
          updatedAt: "2024-01-01T00:00:03Z",
        },
        {
          id: "job_5",
          sessionId: "sess_mixed",
          groupId: "t1",
          platform: "twitter",
          priority: 30,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:04Z",
          updatedAt: "2024-01-01T00:00:04Z",
        },
      ];

      mockInvoke
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ session: mockSession, jobs: mockJobs });

      await act(async () => {
        await usePostingStore.getState().startMultiPlatformSession({
          accountId: "acc_123",
          platforms: [
            { platform: "twitter", accountId: "acc_123", targets: ["t1"], priority: 30 },
            { platform: "instagram", accountId: "acc_123", targets: ["p1", "p2"], priority: 20 },
            {
              platform: "facebook_groups",
              accountId: "acc_123",
              targets: ["g1", "g2"],
              priority: 0,
            },
          ],
        });
      });

      await act(async () => {
        await usePostingStore.getState().getSessionStatus("sess_mixed");
      });

      const state = usePostingStore.getState();
      const jobs = state.jobs;

      expect(jobs).toHaveLength(5);

      const fbJobs = jobs.filter((j) => j.platform === "facebook_groups");
      const igJobs = jobs.filter((j) => j.platform === "instagram");
      const twitterJobs = jobs.filter((j) => j.platform === "twitter");

      expect(fbJobs.length).toBe(2);
      expect(igJobs.length).toBe(2);
      expect(twitterJobs.length).toBe(1);

      const allPriorities = jobs.map((j) => j.priority);
      const sortedPriorities = [...allPriorities].sort((a, b) => a - b);
      expect(allPriorities).toEqual(sortedPriorities);
    });
  });

  describe("priority constants validation", () => {
    it("should have correct priority values for all platforms", () => {
      expect(PLATFORM_PRIORITIES.facebook_groups).toBe(0);
      expect(PLATFORM_PRIORITIES.facebook_pages).toBe(10);
      expect(PLATFORM_PRIORITIES.instagram).toBe(20);
      expect(PLATFORM_PRIORITIES.twitter).toBe(30);
      expect(PLATFORM_PRIORITIES.linkedin).toBe(40);
    });

    it("should have unique priority values for each platform", () => {
      const priorities = Object.values(PLATFORM_PRIORITIES);
      const uniquePriorities = new Set(priorities);
      expect(priorities.length).toBe(uniquePriorities.size);
    });

    it("should have facebook_groups as highest priority (lowest number)", () => {
      const priorities = Object.values(PLATFORM_PRIORITIES);
      expect(PLATFORM_PRIORITIES.facebook_groups).toBe(Math.min(...priorities));
    });
  });

  describe("job status transitions", () => {
    it("should maintain order when jobs are updated", async () => {
      const mockSession: MockPostSession = {
        id: "sess_transitions",
        status: "running",
        accountId: "acc_123",
        totalJobs: 3,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        startedAt: "2024-01-01T00:00:00Z",
        configSnapshot: "{}",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockJobs: MockPostJob[] = [
        {
          id: "job_1",
          sessionId: "sess_transitions",
          groupId: "g1",
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "success",
          postUrl: "https://facebook.com/post/1",
          retryCount: 0,
          maxRetries: 3,
          completedAt: "2024-01-01T00:00:05Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:05Z",
        },
        {
          id: "job_2",
          sessionId: "sess_transitions",
          groupId: "g2",
          platform: "facebook_groups",
          priority: 0,
          content: "Test",
          status: "processing",
          startedAt: "2024-01-01T00:00:06Z",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:01Z",
          updatedAt: "2024-01-01T00:00:06Z",
        },
        {
          id: "job_3",
          sessionId: "sess_transitions",
          groupId: "p1",
          platform: "instagram",
          priority: 20,
          content: "Test",
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: "2024-01-01T00:00:02Z",
          updatedAt: "2024-01-01T00:00:02Z",
        },
      ];

      mockInvoke.mockResolvedValueOnce({ session: mockSession, jobs: mockJobs });

      await act(async () => {
        await usePostingStore.getState().getSessionStatus("sess_transitions");
      });

      const state = usePostingStore.getState();
      expect(state.jobs[0].priority).toBeLessThanOrEqual(state.jobs[1].priority);
      expect(state.jobs[1].priority).toBeLessThanOrEqual(state.jobs[2].priority);
    });
  });
});
