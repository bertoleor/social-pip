import { useAlertsStore } from "@/stores/alertsStore";
import { invoke } from "@tauri-apps/api/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("MonitoringDashboard", () => {
  beforeEach(() => {
    useAlertsStore.setState({
      alerts: [],
      stats: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders header", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/system monitoring/i)).toBeInTheDocument();
      });
    });

    it("displays stats cards", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("displays total alerts card", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/total alerts/i)).toBeInTheDocument();
      });
    });

    it("displays critical alerts card", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/critical/i)).toBeInTheDocument();
      });
    });

    it("displays warnings card", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/warnings/i)).toBeInTheDocument();
      });
    });

    it("displays unresolved alerts card", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/unresolved/i)).toBeInTheDocument();
      });
    });

    it("displays last 24h card", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/last 24h/i)).toBeInTheDocument();
      });
    });
  });

  describe("refresh", () => {
    it("has refresh button", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /refresh/i })
        ).toBeInTheDocument();
      });
    });

    it("calls refresh when button clicked", async () => {
      mockInvoke.mockResolvedValue(mockStats);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("polling", () => {
    it("uses custom refreshInterval prop", async () => {
      vi.useFakeTimers();
      mockInvoke.mockResolvedValue(mockStats);

      render(<MonitoringDashboard refreshInterval={5000} />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe("alert list integration", () => {
    it("includes AlertList for recent alerts", async () => {
      mockInvoke.mockResolvedValueOnce(mockStats);
      mockInvoke.mockResolvedValueOnce([]);

      render(<MonitoringDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId("alert-list")).toBeInTheDocument();
      });
    });
  });
});
