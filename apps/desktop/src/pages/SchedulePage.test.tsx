import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SchedulePage from "./SchedulePage";

vi.mock("@/hooks/useSchedule", () => ({
  useSchedule: vi.fn(),
}));

vi.mock("@/components/Schedule/Calendar", () => ({
  Calendar: () => <div data-testid="calendar" />,
}));

vi.mock("@/components/Schedule/DayModal", () => ({
  DayModal: () => null,
}));

import { useSchedule } from "@/hooks/useSchedule";

const mockUseSchedule = vi.mocked(useSchedule);

describe("SchedulePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSchedule.mockReturnValue({
      schedules: [],
      selectedSchedule: null,
      loading: false,
      error: null,
      schedulePost: vi.fn(),
      cancelSchedule: vi.fn(),
      updateSchedule: vi.fn(),
      selectSchedule: vi.fn(),
      refresh: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("renders the page container", () => {
      render(<SchedulePage />);

      expect(screen.getByTestId("page-schedule")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<SchedulePage />);

      expect(screen.getByRole("heading", { name: "Schedule" })).toBeInTheDocument();
    });

    it("renders description", () => {
      render(<SchedulePage />);

      expect(screen.getByText(/view and manage your scheduled posts/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<SchedulePage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Schedule");
    });
  });
});
