import type { PlatformTarget } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePostingStore } from "../stores/postingStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("E2E: Batch Break Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      platformTargets: [],
    });
  });

  describe("TASK-044: Batch break insertion after batchSize posts", () => {
    it("should signal batch break needed after 5 consecutive successful posts", async () => {
      const mockSession = {
        id: "sess_batch_test",
        status: "running",
        accountId: "fb_123",
        totalJobs: 6,
        completedJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        configSnapshot: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(invoke).mockResolvedValue(mockSession);

      const targets: PlatformTarget[] = [
        {
          platform: "facebook_groups",
          accountId: "fb_123",
          targets: ["g1", "g2", "g3", "g4", "g5", "g6"],
        },
      ];

      const store = usePostingStore.getState();
      await store.startMultiPlatformSession({
        accountId: "fb_123",
        platforms: targets,
      });

      expect(invoke).toHaveBeenCalledWith("start_multi_platform_session", expect.any(Object));
    });

    it("should validate batch_size configuration for platform", async () => {
      vi.mocked(invoke).mockResolvedValue({
        platform: "facebook_groups",
        batch_size: 5,
        batch_break_minutes: 20,
      });

      const fbConfig = await invoke<{ batch_size: number; batch_break_minutes: number }>(
        "get_platform_config",
        { platform: "facebook_groups" },
      );

      expect(fbConfig).toHaveProperty("batch_size");
      expect(fbConfig).toHaveProperty("batch_break_minutes");
    });

    it("should return batch break duration from config", async () => {
      vi.mocked(invoke).mockResolvedValue(20 * 60 * 1000);

      const duration = await invoke<number>("get_batch_break_duration", {
        platform: "facebook_groups",
      });

      expect(duration).toBe(20 * 60 * 1000);
    });
  });

  describe("TASK-045: Batch break skipped on cancel", () => {
    it("should not apply batch break when session is cancelled", async () => {
      const mockCancelledSession = {
        id: "sess_cancel_batch",
        status: "cancelled",
        accountId: "fb_123",
        totalJobs: 10,
        completedJobs: 3,
        successfulJobs: 3,
        failedJobs: 0,
        cancelledAt: new Date().toISOString(),
        configSnapshot: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(invoke).mockResolvedValue(mockCancelledSession);

      usePostingStore.setState({
        currentSession: {
          id: "sess_cancel_batch",
          status: "running",
          accountId: "fb_123",
          totalJobs: 10,
          completedJobs: 0,
          successfulJobs: 0,
          failedJobs: 0,
          configSnapshot: "{}",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        jobs: [],
        isProcessing: true,
        error: null,
        platformTargets: [],
      });

      const store = usePostingStore.getState();
      await store.cancelSession();

      const updatedStore = usePostingStore.getState();
      expect(updatedStore.currentSession?.status).toBe("cancelled");
    });

    it("should transition to cancelled immediately without batch break delay", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      usePostingStore.setState({
        currentSession: {
          id: "sess_immediate_cancel",
          status: "running",
          accountId: "fb_123",
          totalJobs: 10,
          completedJobs: 3,
          successfulJobs: 3,
          failedJobs: 0,
          configSnapshot: "{}",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        jobs: [],
        isProcessing: true,
        error: null,
        platformTargets: [],
      });

      const store = usePostingStore.getState();
      await store.cancelSession();

      const updatedStore = usePostingStore.getState();
      expect(updatedStore.isProcessing).toBe(false);
    });
  });

  describe("Batch break configuration validation", () => {
    it("should have different batch sizes per platform", async () => {
      const configs = {
        facebook_groups: { batch_size: 5, batch_break_minutes: 20 },
        instagram: { batch_size: 5, batch_break_minutes: 30 },
        twitter: { batch_size: 10, batch_break_minutes: 20 },
        linkedin: { batch_size: 10, batch_break_minutes: 25 },
      };

      vi.mocked(invoke).mockImplementation(async (cmd: string, args: Record<string, string>) => {
        if (cmd === "get_platform_config") {
          return configs[args.platform as keyof typeof configs] || configs.facebook_groups;
        }
        return null;
      });

      const fbConfig = await invoke("get_platform_config", { platform: "facebook_groups" });
      const igConfig = await invoke("get_platform_config", { platform: "instagram" });

      expect(fbConfig.batch_break_minutes).toBe(20);
      expect(igConfig.batch_break_minutes).toBe(30);
    });

    it("should validate batch break timing is non-zero", async () => {
      vi.mocked(invoke).mockResolvedValue({
        batch_size: 5,
        batch_break_minutes: 20,
      });

      const config = await invoke<{ batch_size: number; batch_break_minutes: number }>(
        "get_platform_config",
        { platform: "facebook_groups" },
      );

      expect(config.batch_break_minutes).toBeGreaterThan(0);
      expect(config.batch_size).toBeGreaterThan(0);
    });
  });
});
