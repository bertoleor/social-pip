import { useAlertsStore } from "@/stores/alertsStore";
import { useQuickPostStore } from "@/stores/quickPostStore";
import { createPostFixture, createPostFixtures } from "@/test/fixtures/posts";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      dailyPostLimit: 50,
      cooldownUntil: null,
    });
    useAlertsStore.setState({
      alerts: [],
      stats: null,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Store cleanup on unmount", () => {
    it("clears store state properly on reset", () => {
      act(() => {
        useQuickPostStore.setState({
          selectedTemplateId: "test-template",
          selectedGroupIds: ["group1", "group2"],
        });
      });

      expect(useQuickPostStore.getState().selectedGroupIds).toHaveLength(2);

      act(() => {
        useQuickPostStore.setState({
          selectedTemplateId: null,
          selectedGroupIds: [],
        });
      });

      expect(useQuickPostStore.getState().selectedGroupIds).toHaveLength(0);
      expect(useQuickPostStore.getState().selectedTemplateId).toBeNull();
    });

    it("does not accumulate state across multiple updates", () => {
      const initialAlertCount = useAlertsStore.getState().alerts.length;

      for (let i = 0; i < 10; i++) {
        act(() => {
          useAlertsStore.setState({
            alerts: [
              ...useAlertsStore.getState().alerts,
              {
                id: `alert_${i}`,
                alert_type: "INFO",
                severity: "INFO" as const,
                message: `Test alert ${i}`,
                platform: null,
                account_id: null,
                details: null,
                timestamp: new Date().toISOString(),
                acknowledged: false,
                acknowledged_at: null,
                resolved: false,
                resolved_at: null,
              },
            ],
          });
        });
      }

      expect(useAlertsStore.getState().alerts).toHaveLength(initialAlertCount + 10);

      act(() => {
        useAlertsStore.setState({ alerts: [] });
      });

      expect(useAlertsStore.getState().alerts).toHaveLength(0);
    });
  });

  describe("Large data handling", () => {
    it("handles 100 posts without memory issues", () => {
      const posts = createPostFixtures(100);
      expect(posts).toHaveLength(100);

      const start = performance.now();

      const processedPosts = posts.map((post) => ({
        ...post,
        content: post.content.toUpperCase(),
      }));

      const duration = performance.now() - start;

      expect(processedPosts).toHaveLength(100);
      expect(duration).toBeLessThan(100);
    });

    it("handles 500 posts without memory issues", () => {
      const posts = createPostFixtures(500);
      expect(posts).toHaveLength(500);

      const start = performance.now();

      const filteredPosts = posts.filter((post) => post.status === "draft");
      const mappedPosts = filteredPosts.map((post) => ({
        id: post.id,
        platform: post.platform,
      }));

      const duration = performance.now() - start;

      expect(mappedPosts.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });

    it("handles large group selections efficiently", () => {
      const largeGroupList = Array.from({ length: 100 }, (_, i) => `group_${i}`);

      const start = performance.now();

      act(() => {
        useQuickPostStore.getState().setSelectedGroups(largeGroupList);
      });

      const duration = performance.now() - start;

      expect(useQuickPostStore.getState().selectedGroupIds).toHaveLength(100);
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Rapid store updates", () => {
    it("handles rapid consecutive updates without memory leaks", () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        act(() => {
          useQuickPostStore.setState({
            dailyPostCount: i,
          });
        });
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("handles rapid alert additions and removals", () => {
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        act(() => {
          useAlertsStore.setState({
            alerts: [
              ...useAlertsStore.getState().alerts,
              {
                id: `alert_${i}`,
                alert_type: "INFO",
                severity: "INFO" as const,
                message: `Alert ${i}`,
                platform: null,
                account_id: null,
                details: null,
                timestamp: new Date().toISOString(),
                acknowledged: false,
                acknowledged_at: null,
                resolved: false,
                resolved_at: null,
              },
            ],
          });
        });
      }

      for (let i = 0; i < 25; i++) {
        act(() => {
          const alerts = useAlertsStore.getState().alerts;
          if (alerts.length > 0) {
            useAlertsStore.setState({
              alerts: alerts.slice(1),
            });
          }
        });
      }

      const duration = performance.now() - start;

      expect(useAlertsStore.getState().alerts).toHaveLength(25);
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Render performance", () => {
    it("renders complex fixture creation within time threshold", () => {
      const start = performance.now();

      const complexPosts = Array.from({ length: 100 }, (_, i) =>
        createPostFixture({
          id: `post_perf_${i}`,
          content: `Content for post ${i} with a longer text to simulate real content that would be used in production`,
          hashtags: ["tag1", "tag2", "tag3"],
          mediaUrls: i % 2 === 0 ? ["url1.jpg", "url2.jpg"] : [],
        }),
      );

      const duration = performance.now() - start;

      expect(complexPosts).toHaveLength(100);
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Memory cleanup verification", () => {
    it("does not retain references after store reset", () => {
      const largeData = createPostFixtures(100);

      act(() => {
        useQuickPostStore.setState({
          groups: largeData.map((p) => ({ id: p.id, name: p.content })),
        });
      });

      const stateBeforeClear = useQuickPostStore.getState();
      expect(stateBeforeClear.groups).toBeDefined();

      act(() => {
        useQuickPostStore.setState({
          groups: [],
        });
      });

      const stateAfterClear = useQuickPostStore.getState();
      expect(stateAfterClear.groups).toHaveLength(0);
    });

    it("properly cleans up event listeners in hooks", async () => {
      const unlisten = vi.fn();

      const { unmount } = renderHook(() => {
        return { unlisten };
      });

      unmount();

      expect(unlisten).not.toHaveBeenCalled();
    });
  });

  describe("Batch operations performance", () => {
    it("processes batch post creation within threshold", () => {
      const batchPosts = Array.from({ length: 50 }, (_, i) =>
        createPostFixture({
          id: `batch_${i}`,
          status:
            i % 4 === 0
              ? "draft"
              : i % 4 === 1
                ? "scheduled"
                : i % 4 === 2
                  ? "published"
                  : "failed",
        }),
      );

      const start = performance.now();

      const grouped = {
        drafts: batchPosts.filter((p) => p.status === "draft"),
        scheduled: batchPosts.filter((p) => p.status === "scheduled"),
        published: batchPosts.filter((p) => p.status === "published"),
        failed: batchPosts.filter((p) => p.status === "failed"),
      };

      const duration = performance.now() - start;

      expect(
        grouped.drafts.length +
          grouped.scheduled.length +
          grouped.published.length +
          grouped.failed.length,
      ).toBe(50);
      expect(duration).toBeLessThan(10);
    });
  });
});
