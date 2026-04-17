import type { Schedule } from "@social-pip/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CalendarDay } from "./CalendarDay";

const mockPendingSchedule: Schedule = {
  id: "sched_001",
  postId: "post_001",
  accountId: "acc_001",
  scheduledAt: new Date("2026-04-15T10:00:00Z"),
  variance: 15,
  status: "pending",
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-01T00:00:00Z"),
};

const mockCompletedSchedule: Schedule = {
  id: "sched_002",
  postId: "post_002",
  accountId: "acc_001",
  scheduledAt: new Date("2026-04-15T14:00:00Z"),
  variance: 10,
  status: "completed",
  attempts: 1,
  maxAttempts: 3,
  result: "success",
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-15T14:30:00Z"),
};

const mockFailedSchedule: Schedule = {
  id: "sched_003",
  postId: "post_003",
  accountId: "acc_001",
  scheduledAt: new Date("2026-04-15T09:00:00Z"),
  variance: 20,
  status: "failed",
  attempts: 3,
  maxAttempts: 3,
  result: "Error: Network timeout",
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-15T09:30:00Z"),
};

const mockRunningSchedule: Schedule = {
  id: "sched_004",
  postId: "post_004",
  accountId: "acc_001",
  scheduledAt: new Date("2026-04-15T11:00:00Z"),
  variance: 5,
  status: "running",
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-01T00:00:00Z"),
};

const mockCancelledSchedule: Schedule = {
  id: "sched_005",
  postId: "post_005",
  accountId: "acc_001",
  scheduledAt: new Date("2026-04-15T12:00:00Z"),
  variance: 10,
  status: "cancelled",
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-01T00:00:00Z"),
};

describe("CalendarDay", () => {
  const mockDate = new Date(2026, 3, 15);
  const mockOnClick = vi.fn();
  const mockOnKeyDown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("day rendering", () => {
    it("shows day number correctly", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders as cell", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.getByRole("cell")).toBeInTheDocument();
    });

    it("has correct aria-label for day", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveAttribute("aria-label", "15");
    });
  });

  describe("schedule indicators", () => {
    it("shows blue dot for pending schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-pending");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-blue-500");
    });

    it("shows green dot for completed schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockCompletedSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-completed");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-green-500");
    });

    it("shows red dot for failed schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockFailedSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-failed");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-red-500");
    });

    it("shows yellow dot for running schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockRunningSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-running");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-yellow-500");
    });

    it("shows gray dot for cancelled schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockCancelledSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-cancelled");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-gray-400");
    });

    it("shows multiple status indicators", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule, mockCompletedSchedule, mockFailedSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.getByTestId("schedule-indicator-pending")).toBeInTheDocument();
      expect(screen.getByTestId("schedule-indicator-completed")).toBeInTheDocument();
      expect(screen.getByTestId("schedule-indicator-failed")).toBeInTheDocument();
    });

    it("has aria-label for schedule indicator", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-pending");
      expect(indicator).toHaveAttribute("aria-label", "1 pending schedule");
    });

    it("shows plural in aria-label for multiple schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule, { ...mockPendingSchedule, id: "sched_002" }]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const indicator = screen.getByTestId("schedule-indicator-pending");
      expect(indicator).toHaveAttribute("aria-label", "2 pending schedules");
    });
  });

  describe("count badge", () => {
    it("shows count badge when multiple schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule, mockCompletedSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("does not show count badge for single schedule", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("does not show count badge for no schedules", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      const badge = cell.querySelector(".absolute.top-1.right-1");
      expect(badge).not.toBeInTheDocument();
    });

    it("count badge has correct styling", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule, mockCompletedSchedule, mockFailedSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const badge = screen.getByText("3");
      expect(badge).toHaveClass("bg-blue-500");
      expect(badge).toHaveClass("text-white");
    });
  });

  describe("click handling", () => {
    it("calls onClick with correct date when clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      await user.click(screen.getByRole("cell"));

      expect(mockOnClick).toHaveBeenCalledWith(mockDate);
    });

    it("is clickable with cursor pointer", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveClass("cursor-pointer");
    });
  });

  describe("current day", () => {
    it("has ring styling for today", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={true}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveClass("ring-2");
      expect(cell).toHaveClass("ring-blue-500");
    });

    it("has aria-current set to date for today", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={true}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveAttribute("aria-current", "date");
    });

    it("does not have aria-current for non-today", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).not.toHaveAttribute("aria-current");
    });
  });

  describe("other month", () => {
    it("has grayed out styling for other month days", () => {
      render(
        <CalendarDay
          day={31}
          date={new Date(2026, 2, 31)}
          schedules={[]}
          isCurrentMonth={false}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveClass("text-gray-400");
    });

    it("still renders day number for other month", () => {
      render(
        <CalendarDay
          day={31}
          date={new Date(2026, 2, 31)}
          schedules={[]}
          isCurrentMonth={false}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.getByText("31")).toBeInTheDocument();
    });

    it("still shows schedules for other month days", () => {
      render(
        <CalendarDay
          day={31}
          date={new Date(2026, 2, 31)}
          schedules={[mockPendingSchedule]}
          isCurrentMonth={false}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      expect(screen.getByTestId("schedule-indicator-pending")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has tabIndex 0 when focused", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={true}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveAttribute("tabIndex", "0");
    });

    it("has tabIndex -1 when not focused", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveAttribute("tabIndex", "-1");
    });

    it("calls onKeyDown when key pressed", async () => {
      const user = userEvent.setup();
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={true}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      cell.focus();
      await user.keyboard("{ArrowRight}");

      expect(mockOnKeyDown).toHaveBeenCalled();
    });

    it("shows tooltip on hover", async () => {
      const user = userEvent.setup();
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule, mockCompletedSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      await user.hover(cell);

      expect(await screen.findByRole("tooltip")).toHaveTextContent("2 schedules");
    });

    it("hides tooltip when mouse leaves", async () => {
      const user = userEvent.setup();
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      await user.hover(cell);
      expect(await screen.findByRole("tooltip")).toBeInTheDocument();

      await user.unhover(cell);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("hover effects", () => {
    it("has hover styling class", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveClass("hover:bg-gray-100");
    });

    it("has transition colors class", () => {
      render(
        <CalendarDay
          day={15}
          date={mockDate}
          schedules={[]}
          isCurrentMonth={true}
          isToday={false}
          isFocused={false}
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />,
      );

      const cell = screen.getByRole("cell");
      expect(cell).toHaveClass("transition-colors");
    });
  });
});
