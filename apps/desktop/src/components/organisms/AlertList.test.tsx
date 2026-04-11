import { useAlertsStore } from "@/stores/alertsStore";
import { invoke } from "@tauri-apps/api/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AlertList } from "./AlertList";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockAlert = {
  id: "alert-1",
  alert_type: "PostPublished",
  severity: "INFO" as const,
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

const mockCriticalAlert = {
  id: "alert-2",
  alert_type: "AccountBlocked",
  severity: "CRITICAL" as const,
  platform: "instagram",
  account_id: "acc-2",
  message: "Account blocked",
  details: { reason: "suspicious activity" },
  timestamp: new Date().toISOString(),
  acknowledged: false,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null,
};

describe("AlertList", () => {
  beforeEach(() => {
    useAlertsStore.setState({
      alerts: [],
      stats: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading spinner initially when loading", () => {
      useAlertsStore.setState({ loading: true, alerts: [] });

      render(<AlertList />);

      expect(screen.getByTestId("alert-list-loading")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no alerts", async () => {
      mockInvoke.mockResolvedValueOnce([]);
      
      useAlertsStore.setState({ alerts: [], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
      });
    });
  });

  describe("rendering alerts", () => {
    it("renders alerts after loading", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });
    });

    it("displays severity badge with correct color", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        const badge = screen.getByTestId("severity-badge-INFO");
        expect(badge).toBeInTheDocument();
      });
    });

    it("displays critical severity with red color", async () => {
      useAlertsStore.setState({ alerts: [mockCriticalAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        const badge = screen.getByTestId("severity-badge-CRITICAL");
        expect(badge).toHaveClass("bg-red-100");
      });
    });

    it("displays platform badge", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText("facebook")).toBeInTheDocument();
      });
    });

    it("displays relative timestamp", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByTestId("alert-timestamp")).toBeInTheDocument();
      });
    });
  });

  describe("actions", () => {
    it("shows acknowledge button for unacknowledged alerts", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList showAcknowledge />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /acknowledge/i })).toBeInTheDocument();
      });
    });

    it("calls acknowledge when button clicked", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList showAcknowledge />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("acknowledge_alert", {
          alertId: "alert-1",
        });
      });
    });

    it("shows resolve button for unresolved alerts", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /resolve/i })).toBeInTheDocument();
      });
    });

    it("calls resolve when button clicked", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /resolve/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("resolve_alert", {
          alertId: "alert-1",
        });
      });
    });
  });

  describe("props", () => {
    it("respects limit prop", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      render(<AlertList limit={5} />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
          limit: 5,
          severityFilter: null,
        });
      });
    });

    it("respects severityFilter prop", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      render(<AlertList severityFilter="CRITICAL" />);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
          limit: 50,
          severityFilter: "CRITICAL",
        });
      });
    });

    it("hides acknowledge button when showAcknowledge is false", async () => {
      useAlertsStore.setState({ alerts: [mockAlert], loading: false });

      render(<AlertList showAcknowledge={false} />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });

      expect(screen.queryByRole("button", { name: /acknowledge/i })).not.toBeInTheDocument();
    });
  });
});
