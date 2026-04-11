import { invoke } from "@tauri-apps/api/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAlertsStore } from "../stores/alertsStore";
import { useAlerts } from "./useAlerts";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockAlertStats = {
  total_alerts: 10,
  unresolved: 3,
  critical: 1,
  warnings: 5,
  last_24h: 8,
  last_hour: 2,
};

const mockAlert = {
  id: "alert-1",
  alert_type: "PostPublished",
  severity: "INFO",
  platform: "facebook",
  account_id: "acc-1",
  message: "Post published successfully",
  details: null,
  timestamp: new Date().toISOString(),
  acknowledged: false,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null,
};

describe("useAlerts", () => {
  beforeEach(() => {
    useAlertsStore.setState({
      alerts: [],
      stats: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes with empty alerts", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.alerts).toEqual([]);
      });
    });

    it("loads stats on mount", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });
    });

    it("sets loading to false after initialization", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("createAlert", () => {
    it("calls invoke create_alert with correct params", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);
      mockInvoke.mockResolvedValueOnce(mockAlert);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });

      await act(async () => {
        await result.current.createAlert(
          "post_published",
          "INFO",
          "Test message",
          "facebook",
          "acc-1"
        );
      });

      expect(mockInvoke).toHaveBeenCalledWith("create_alert", {
        alertType: "post_published",
        severity: "INFO",
        message: "Test message",
        platform: "facebook",
        accountId: "acc-1",
      });
    });

    it("adds new alert to the list", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);
      mockInvoke.mockResolvedValueOnce(mockAlert);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });

      await act(async () => {
        await result.current.createAlert(
          "post_published",
          "INFO",
          "Test message"
        );
      });

      await waitFor(() => {
        expect(result.current.alerts).toHaveLength(1);
        expect(result.current.alerts[0].message).toBe("Test message");
      });
    });
  });

  describe("acknowledgeAlert", () => {
    it("calls invoke acknowledge_alert with alert ID", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });

      await act(async () => {
        await result.current.acknowledgeAlert("alert-1");
      });

      expect(mockInvoke).toHaveBeenCalledWith("acknowledge_alert", {
        alertId: "alert-1",
      });
    });
  });

  describe("resolveAlert", () => {
    it("calls invoke resolve_alert with alert ID", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });

      await act(async () => {
        await result.current.resolveAlert("alert-1");
      });

      expect(mockInvoke).toHaveBeenCalledWith("resolve_alert", {
        alertId: "alert-1",
      });
    });
  });

  describe("refresh", () => {
    it("reloads alerts and stats", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);
      mockInvoke.mockResolvedValueOnce([mockAlert]);
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
        limit: 50,
        severityFilter: null,
      });
      expect(mockInvoke).toHaveBeenCalledWith("get_alert_stats");
    });
  });

  describe("error handling", () => {
    it("sets error when initialization fails", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Init failed"));

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.error).toBe("Init failed");
      });
    });

    it("sets error when createAlert fails", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);
      mockInvoke.mockRejectedValueOnce(new Error("Create failed"));

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockAlertStats);
      });

      await act(async () => {
        await result.current.createAlert("post_published", "INFO", "Test");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Create failed");
      });
    });
  });
});
