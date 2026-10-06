import { invoke } from "@tauri-apps/api/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAlertsStore } from "@/stores/alertsStore";
import { MonitoringDashboard } from "./MonitoringDashboard";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockStats = {
  total_alerts: 10,
  unresolved: 3,
  critical: 1,
  warnings: 5,
  last_24h: 8,
  last_hour: 2,
};

const createMockStore = () => ({
  alerts: [],
  stats: null,
  loading: false,
  error: null,
  initAlerts: vi.fn().mockImplementation(async () => {
    useAlertsStore.setState({ stats: mockStats, loading: false });
  }),
  loadAlerts: vi.fn().mockImplementation(async () => {
    useAlertsStore.setState({ alerts: [] });
  }),
  createAlert: vi.fn(),
  acknowledgeAlert: vi.fn(),
  resolveAlert: vi.fn(),
  refreshStats: vi.fn().mockImplementation(async () => {
    useAlertsStore.setState({ stats: mockStats });
  }),
  reset: vi.fn(),
});

describe("MonitoringDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
    useAlertsStore.setState(createMockStore());
  });

  describe("rendering", () => {
    it("renders header", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/system monitoring/i)).toBeInTheDocument();
      });
    });

    it("displays stats cards", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("displays total alerts card", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/total alerts/i)).toBeInTheDocument();
      });
    });

    it("displays critical alerts card", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/critical/i)).toBeInTheDocument();
      });
    });

    it("displays warnings card", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/warnings/i)).toBeInTheDocument();
      });
    });

    it("displays unresolved alerts card", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/unresolved/i)).toBeInTheDocument();
      });
    });

    it("displays last 24h card", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/last 24h/i)).toBeInTheDocument();
      });
    });
  });

  describe("refresh", () => {
    it("has refresh button", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it("calls refresh when button clicked", async () => {
      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => {
        expect(useAlertsStore.getState().loadAlerts).toHaveBeenCalled();
      });
    });
  });

  describe("polling", () => {
    it("uses custom refreshInterval prop", async () => {
      vi.useFakeTimers();

      const loadAlertsMock = vi.fn();
      useAlertsStore.setState({
        stats: mockStats,
        alerts: [],
        loadAlerts: loadAlertsMock,
      });

      render(<MonitoringDashboard refreshInterval={5000} />);

      vi.advanceTimersByTime(6000);

      expect(loadAlertsMock).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("alert list integration", () => {
    it("includes AlertList for recent alerts", () => {
      useAlertsStore.setState({
        stats: mockStats,
        alerts: [],
        loading: false,
      });

      render(<MonitoringDashboard />);

      expect(screen.getByText("No alerts to display")).toBeInTheDocument();
    });
  });
});
