import { useAlertsStore } from "@/stores/alertsStore";
import { invoke } from "@tauri-apps/api/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlertList } from "./AlertList";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockAcknowledgeAlert = vi.fn();
const mockResolveAlert = vi.fn();
const mockLoadAlerts = vi.fn();

vi.mock("@/stores/alertsStore", () => ({
  useAlertsStore: vi.fn(() => ({
    alerts: [],
    loading: false,
    acknowledgeAlert: mockAcknowledgeAlert,
    resolveAlert: mockResolveAlert,
    loadAlerts: mockLoadAlerts,
  })),
}));

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

const createMockStore = (overrides = {}) => {
  const defaultStore = {
    alerts: [],
    loading: false,
    acknowledgeAlert: mockAcknowledgeAlert,
    resolveAlert: mockResolveAlert,
    loadAlerts: mockLoadAlerts,
    ...overrides,
  };
  vi.mocked(useAlertsStore).mockReturnValue(
    defaultStore as unknown as ReturnType<typeof useAlertsStore>,
  );
  return defaultStore;
};

describe("AlertList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading spinner initially when loading", () => {
      createMockStore({ loading: true, alerts: [] });

      render(<AlertList />);

      expect(screen.getByTestId("alert-list-loading")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no alerts", async () => {
      createMockStore({ alerts: [], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
      });
    });
  });

  describe("rendering alerts", () => {
    it("renders alerts after loading", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });
    });

    it("displays severity badge with correct color", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        const badge = screen.getByTestId("severity-badge-INFO");
        expect(badge).toBeInTheDocument();
      });
    });

    it("displays critical severity with red color", async () => {
      createMockStore({ alerts: [mockCriticalAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        const badge = screen.getByTestId("severity-badge-CRITICAL");
        expect(badge).toHaveClass("bg-red-100");
      });
    });

    it("displays platform badge", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText("facebook")).toBeInTheDocument();
      });
    });

    it("displays relative timestamp", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByTestId("alert-timestamp")).toBeInTheDocument();
      });
    });
  });

  describe("actions", () => {
    it("shows acknowledge button for unacknowledged alerts", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList showAcknowledge />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /acknowledge/i })).toBeInTheDocument();
      });
    });

    it("calls acknowledge when button clicked", async () => {
      mockAcknowledgeAlert.mockResolvedValueOnce(undefined);
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList showAcknowledge />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));

      await waitFor(() => {
        expect(mockAcknowledgeAlert).toHaveBeenCalledWith("alert-1");
      });
    });

    it("shows resolve button for unresolved alerts", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /resolve/i })).toBeInTheDocument();
      });
    });

    it("calls resolve when button clicked", async () => {
      mockResolveAlert.mockResolvedValueOnce(undefined);
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /resolve/i }));

      await waitFor(() => {
        expect(mockResolveAlert).toHaveBeenCalledWith("alert-1");
      });
    });
  });

  describe("props", () => {
    it("respects limit prop", async () => {
      mockLoadAlerts.mockResolvedValueOnce(undefined);
      createMockStore({ alerts: [], loading: false });

      render(<AlertList limit={5} />);

      await waitFor(() => {
        expect(mockLoadAlerts).toHaveBeenCalledWith(5, null);
      });
    });

    it("respects severityFilter prop", async () => {
      mockLoadAlerts.mockResolvedValueOnce(undefined);
      createMockStore({ alerts: [], loading: false });

      render(<AlertList severityFilter="CRITICAL" />);

      await waitFor(() => {
        expect(mockLoadAlerts).toHaveBeenCalledWith(50, "CRITICAL");
      });
    });

    it("hides acknowledge button when showAcknowledge is false", async () => {
      createMockStore({ alerts: [mockAlert], loading: false });

      render(<AlertList showAcknowledge={false} />);

      await waitFor(() => {
        expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      });

      expect(screen.queryByRole("button", { name: /acknowledge/i })).not.toBeInTheDocument();
    });
  });
});
