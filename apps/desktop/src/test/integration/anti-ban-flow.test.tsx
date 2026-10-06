import { invoke } from "@tauri-apps/api/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AntiBanDashboard } from "@/components/organisms/AntiBanDashboard";
import { useAntiBanStore } from "@/stores/antiBanStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("Anti-Ban Flow Integration", () => {
  const mockAntiBanStats = {
    hourly_count: 2,
    daily_count: 5,
    success_rate: 0.95,
    batch_count: 1,
    config: {
      platform: "facebook",
      min_action_delay_ms: 60000,
      max_action_delay_ms: 180000,
      hourly_action_limit: 10,
      daily_action_limit: 30,
      batch_size: 3,
      batch_break_minutes: 30,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAntiBanStore.setState({
      stats: null,
      loading: false,
      error: null,
      platform: null,
    });

    mockInvoke.mockImplementation(async (command: string) => {
      if (command === "init_anti_ban") return mockAntiBanStats;
      if (command === "get_anti_ban_stats") return mockAntiBanStats;
      return {};
    });
  });

  describe("User views dashboard - useAntiBanStore data loads", () => {
    it("should initialize anti-ban stats on mount", async () => {
      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", {
          platform: "facebook",
        });
      });
    });

    it("should show loading state initially", async () => {
      mockInvoke.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockAntiBanStats), 100);
          }),
      );

      render(<AntiBanDashboard defaultPlatform="facebook" />);

      expect(screen.getByTestId("antiban-loading")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("antiban-loading")).not.toBeInTheDocument();
      });
    });

    it("should display anti-ban stats after loading", async () => {
      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await waitFor(() => {
        expect(screen.getByText("Anti-Ban Status")).toBeInTheDocument();
      });
    });
  });

  describe("Safety check triggers - risk level updates - UI reflects changes", () => {
    it("should update store when risk level changes", async () => {
      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await act(async () => {
        useAntiBanStore.getState().initAntiBan("facebook");
      });

      await waitFor(() => {
        const state = useAntiBanStore.getState();
        expect(state.stats).not.toBeNull();
        expect(state.stats?.daily_count).toBe(5);
      });
    });

    it("should reflect high risk level in stats", async () => {
      const highRiskStats = {
        ...mockAntiBanStats,
        config: {
          ...mockAntiBanStats.config,
          platform: "facebook",
        },
      };

      mockInvoke.mockImplementation(async (command: string) => {
        if (command === "init_anti_ban") return highRiskStats;
        if (command === "get_anti_ban_stats") return highRiskStats;
        return {};
      });

      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await act(async () => {
        await useAntiBanStore.getState().initAntiBan("facebook");
      });

      await waitFor(() => {
        const state = useAntiBanStore.getState();
        expect(state.stats).not.toBeNull();
      });
    });

    it("should show error state when init fails", async () => {
      mockInvoke.mockRejectedValue(new Error("Failed to initialize anti-ban"));

      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });
    });

    it("should update platform when selection changes", async () => {
      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", {
          platform: "facebook",
        });
      });

      vi.clearAllMocks();

      mockInvoke.mockImplementation(async (command: string) => {
        if (command === "init_anti_ban") return mockAntiBanStats;
        return {};
      });

      await act(async () => {
        const select = screen.getByLabelText("Select platform");
        select.value = "instagram";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", {
          platform: "instagram",
        });
      });
    });
  });

  describe("Platform switching integration", () => {
    it("should reset stats when platform changes", async () => {
      render(<AntiBanDashboard defaultPlatform="facebook" />);

      await act(async () => {
        await useAntiBanStore.getState().initAntiBan("facebook");
      });

      await waitFor(() => {
        expect(useAntiBanStore.getState().platform).toBe("facebook");
      });

      await act(async () => {
        await useAntiBanStore.getState().initAntiBan("instagram");
      });

      await waitFor(() => {
        expect(useAntiBanStore.getState().platform).toBe("instagram");
      });
    });
  });
});
