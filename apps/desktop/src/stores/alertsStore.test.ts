import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
import type { Alert, AlertStats } from "./alertsStore";
import { useAlertsStore } from "./alertsStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockAlertStats: AlertStats = {
  total_alerts: 10,
  unresolved: 5,
  critical: 2,
  warnings: 3,
  last_24h: 8,
  last_hour: 2,
};

const mockAlert1: Alert = {
  id: "alert-1",
  alert_type: "rate_limit",
  severity: "WARNING",
  platform: "facebook",
  account_id: "acc-1",
  message: "Rate limit approaching",
  details: null,
  timestamp: new Date().toISOString(),
  acknowledged: false,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null,
};

const mockAlert2: Alert = {
  id: "alert-2",
  alert_type: "account_blocked",
  severity: "CRITICAL",
  platform: "instagram",
  account_id: "acc-2",
  message: "Account has been blocked",
  details: { reason: "suspicious_activity" },
  timestamp: new Date().toISOString(),
  acknowledged: false,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null,
};

const mockAlert3: Alert = {
  id: "alert-3",
  alert_type: "info",
  severity: "INFO",
  platform: null,
  account_id: null,
  message: "System notification",
  details: null,
  timestamp: new Date().toISOString(),
  acknowledged: false,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null,
};

describe("useAlertsStore", () => {
  beforeEach(() => {
    useAlertsStore.setState({
      alerts: [],
      stats: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("has alerts as empty array by default", () => {
      const state = useAlertsStore.getState();
      expect(state.alerts).toEqual([]);
    });

    it("has stats set to null by default", () => {
      const state = useAlertsStore.getState();
      expect(state.stats).toBeNull();
    });

    it("has loading set to false by default", () => {
      const state = useAlertsStore.getState();
      expect(state.loading).toBe(false);
    });

    it("has error set to null by default", () => {
      const state = useAlertsStore.getState();
      expect(state.error).toBeNull();
    });

    it("has all required action methods", () => {
      const state = useAlertsStore.getState();
      expect(typeof state.initAlerts).toBe("function");
      expect(typeof state.loadAlerts).toBe("function");
      expect(typeof state.createAlert).toBe("function");
      expect(typeof state.acknowledgeAlert).toBe("function");
      expect(typeof state.resolveAlert).toBe("function");
      expect(typeof state.refreshStats).toBe("function");
      expect(typeof state.reset).toBe("function");
    });
  });

  describe("initAlerts", () => {
    it("should set stats on success", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      const state = useAlertsStore.getState();
      expect(state.stats).toEqual(mockAlertStats);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should invoke init_alert_system command", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(mockInvoke).toHaveBeenCalledWith("init_alert_system");
    });

    it("should set loading to true during init", async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockAlertStats), 100)),
      );

      const promise = act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(useAlertsStore.getState().loading).toBe(true);

      await promise;
    });

    it("should set error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Init failed"));

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      const state = useAlertsStore.getState();
      expect(state.error).toBe("Init failed");
      expect(state.loading).toBe(false);
      expect(state.stats).toBeNull();
    });
  });

  describe("loadAlerts", () => {
    it("should set alerts on success", async () => {
      mockInvoke.mockResolvedValueOnce([mockAlert1, mockAlert2]);

      await act(async () => {
        await useAlertsStore.getState().loadAlerts();
      });

      const state = useAlertsStore.getState();
      expect(state.alerts).toHaveLength(2);
      expect(state.error).toBeNull();
    });

    it("should invoke get_alerts with default params", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await useAlertsStore.getState().loadAlerts();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
        limit: 50,
        severityFilter: null,
      });
    });

    it("should invoke get_alerts with custom limit", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await useAlertsStore.getState().loadAlerts(100);
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
        limit: 100,
        severityFilter: null,
      });
    });

    it("should invoke get_alerts with severity filter", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await useAlertsStore.getState().loadAlerts(50, "CRITICAL");
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
        limit: 50,
        severityFilter: "CRITICAL",
      });
    });

    it("should set error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Load failed"));

      await act(async () => {
        await useAlertsStore.getState().loadAlerts();
      });

      const state = useAlertsStore.getState();
      expect(state.error).toBe("Load failed");
    });
  });

  describe("createAlert", () => {
    it("should create alert and add to state", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert1);

      const result = await act(async () => {
        return await useAlertsStore
          .getState()
          .createAlert("rate_limit", "WARNING", "Rate limit approaching", "facebook", "acc-1");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts).toHaveLength(1);
      expect(state.alerts[0]).toEqual(mockAlert1);
      expect(result).toEqual(mockAlert1);
    });

    it("should invoke create_alert with correct params", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert1);

      await act(async () => {
        await useAlertsStore
          .getState()
          .createAlert("rate_limit", "WARNING", "Rate limit approaching", "facebook", "acc-1");
      });

      expect(mockInvoke).toHaveBeenCalledWith("create_alert", {
        alertType: "rate_limit",
        severity: "WARNING",
        message: "Rate limit approaching",
        platform: "facebook",
        accountId: "acc-1",
      });
    });

    it("should handle null platform and account", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert3);

      await act(async () => {
        await useAlertsStore.getState().createAlert("info", "INFO", "System notification");
      });

      expect(mockInvoke).toHaveBeenCalledWith("create_alert", {
        alertType: "info",
        severity: "INFO",
        message: "System notification",
        platform: null,
        accountId: null,
      });
    });

    it("should prepend new alert to existing alerts", async () => {
      useAlertsStore.setState({ alerts: [mockAlert2] });
      mockInvoke.mockResolvedValueOnce(mockAlert1);

      await act(async () => {
        await useAlertsStore.getState().createAlert("rate_limit", "WARNING", "New alert");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts).toHaveLength(2);
      expect(state.alerts[0].id).toBe("alert-1");
    });
  });

  describe("acknowledgeAlert", () => {
    it("should mark alert as acknowledged", async () => {
      useAlertsStore.setState({ alerts: [mockAlert1] });
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAlertsStore.getState().acknowledgeAlert("alert-1");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].acknowledged).toBe(true);
      expect(state.alerts[0].acknowledged_at).not.toBeNull();
    });

    it("should invoke acknowledge_alert command", async () => {
      useAlertsStore.setState({ alerts: [mockAlert1] });
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAlertsStore.getState().acknowledgeAlert("alert-1");
      });

      expect(mockInvoke).toHaveBeenCalledWith("acknowledge_alert", {
        alertId: "alert-1",
      });
    });

    it("should not modify other alerts", async () => {
      useAlertsStore.setState({ alerts: [mockAlert1, mockAlert2] });
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAlertsStore.getState().acknowledgeAlert("alert-1");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[1].acknowledged).toBe(false);
    });
  });

  describe("resolveAlert", () => {
    it("should mark alert as resolved", async () => {
      useAlertsStore.setState({ alerts: [mockAlert1] });
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAlertsStore.getState().resolveAlert("alert-1");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].resolved).toBe(true);
      expect(state.alerts[0].resolved_at).not.toBeNull();
    });

    it("should invoke resolve_alert command", async () => {
      useAlertsStore.setState({ alerts: [mockAlert1] });
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAlertsStore.getState().resolveAlert("alert-1");
      });

      expect(mockInvoke).toHaveBeenCalledWith("resolve_alert", {
        alertId: "alert-1",
      });
    });
  });

  describe("refreshStats", () => {
    it("should update stats on success", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().refreshStats();
      });

      const state = useAlertsStore.getState();
      expect(state.stats).toEqual(mockAlertStats);
    });

    it("should invoke get_alert_stats command", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().refreshStats();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_alert_stats");
    });

    it("should set error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Stats failed"));

      await act(async () => {
        await useAlertsStore.getState().refreshStats();
      });

      const state = useAlertsStore.getState();
      expect(state.error).toBe("Stats failed");
    });
  });

  describe("reset", () => {
    it("should clear all state", () => {
      useAlertsStore.setState({
        alerts: [mockAlert1],
        stats: mockAlertStats,
        loading: true,
        error: "Some error",
      });

      act(() => {
        useAlertsStore.getState().reset();
      });

      const state = useAlertsStore.getState();
      expect(state.alerts).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("Alert lifecycle", () => {
    it("should handle create -> acknowledge -> resolve flow", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert1);
      mockInvoke.mockResolvedValueOnce(undefined);
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAlertsStore.getState().createAlert("rate_limit", "WARNING", "Test alert");
      });

      expect(useAlertsStore.getState().alerts).toHaveLength(1);

      await act(async () => {
        await useAlertsStore.getState().acknowledgeAlert("alert-1");
      });

      expect(useAlertsStore.getState().alerts[0].acknowledged).toBe(true);

      await act(async () => {
        await useAlertsStore.getState().resolveAlert("alert-1");
      });

      expect(useAlertsStore.getState().alerts[0].resolved).toBe(true);
    });
  });

  describe("Alert queue management", () => {
    it("should handle multiple alerts in queue", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert1);
      mockInvoke.mockResolvedValueOnce(mockAlert2);
      mockInvoke.mockResolvedValueOnce(mockAlert3);

      await act(async () => {
        await useAlertsStore.getState().createAlert("type1", "INFO", "Alert 1");
      });

      await act(async () => {
        await useAlertsStore.getState().createAlert("type2", "WARNING", "Alert 2");
      });

      await act(async () => {
        await useAlertsStore.getState().createAlert("type3", "CRITICAL", "Alert 3");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts).toHaveLength(3);
    });

    it("should maintain alert order (newest first)", async () => {
      useAlertsStore.setState({ alerts: [mockAlert1] });
      mockInvoke.mockResolvedValueOnce(mockAlert2);

      await act(async () => {
        await useAlertsStore.getState().createAlert("type", "INFO", "New alert");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].id).toBe("alert-2");
      expect(state.alerts[1].id).toBe("alert-1");
    });
  });

  describe("Alert types", () => {
    it("should handle INFO severity alerts", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert3);

      await act(async () => {
        await useAlertsStore.getState().createAlert("info", "INFO", "Info message");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].severity).toBe("INFO");
    });

    it("should handle WARNING severity alerts", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert1);

      await act(async () => {
        await useAlertsStore.getState().createAlert("warning", "WARNING", "Warning message");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].severity).toBe("WARNING");
    });

    it("should handle ERROR severity alerts", async () => {
      const errorAlert = { ...mockAlert1, severity: "ERROR" };
      mockInvoke.mockResolvedValueOnce(errorAlert);

      await act(async () => {
        await useAlertsStore.getState().createAlert("error", "ERROR", "Error message");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].severity).toBe("ERROR");
    });

    it("should handle CRITICAL severity alerts", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlert2);

      await act(async () => {
        await useAlertsStore.getState().createAlert("critical", "CRITICAL", "Critical message");
      });

      const state = useAlertsStore.getState();
      expect(state.alerts[0].severity).toBe("CRITICAL");
    });
  });

  describe("Stats tracking", () => {
    it("should track total alerts count", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(useAlertsStore.getState().stats?.total_alerts).toBe(10);
    });

    it("should track unresolved count", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(useAlertsStore.getState().stats?.unresolved).toBe(5);
    });

    it("should track critical count", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(useAlertsStore.getState().stats?.critical).toBe(2);
    });

    it("should track last 24h count", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(useAlertsStore.getState().stats?.last_24h).toBe(8);
    });

    it("should track last hour count", async () => {
      mockInvoke.mockResolvedValueOnce(mockAlertStats);

      await act(async () => {
        await useAlertsStore.getState().initAlerts();
      });

      expect(useAlertsStore.getState().stats?.last_hour).toBe(2);
    });
  });
});
