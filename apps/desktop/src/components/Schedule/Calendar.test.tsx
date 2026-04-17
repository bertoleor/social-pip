import type { Schedule } from "@social-pip/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Calendar } from "./Calendar";

const mockSchedules: Schedule[] = [
  {
    id: "sched_001",
    scheduledAt: new Date("2026-04-15T10:00:00Z"),
    variance: 15,
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
    postId: "post_001",
    accountId: "acc_001",
    createdAt: new Date("2026-04-10T08:00:00Z"),
    updatedAt: new Date("2026-04-10T08:00:00Z"),
  },
  {
    id: "sched_002",
    scheduledAt: new Date("2026-04-15T14:00:00Z"),
    variance: 10,
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
    postId: "post_002",
    accountId: "acc_001",
    createdAt: new Date("2026-04-10T09:00:00Z"),
    updatedAt: new Date("2026-04-10T09:00:00Z"),
  },
  {
    id: "sched_003",
    scheduledAt: new Date("2026-04-20T09:00:00Z"),
    variance: 20,
    status: "completed",
    attempts: 1,
    maxAttempts: 3,
    result: "success",
    postId: "post_003",
    accountId: "acc_002",
    createdAt: new Date("2026-04-10T10:00:00Z"),
    updatedAt: new Date("2026-04-20T09:30:00Z"),
  },
  {
    id: "sched_004",
    scheduledAt: new Date("2026-04-10T11:00:00Z"),
    variance: 15,
    status: "failed",
    attempts: 3,
    maxAttempts: 3,
    result: "Error: Network timeout",
    postId: "post_004",
    accountId: "acc_001",
    createdAt: new Date("2026-04-09T08:00:00Z"),
    updatedAt: new Date("2026-04-10T12:00:00Z"),
  },
];

describe("Calendar", () => {
  const mockOnDayClick = vi.fn();
  const mockOnMonthChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("month grid rendering", () => {
    it("renders month grid with 7 columns (Sun-Sat)", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const dayHeaders = screen.getAllByRole("columnheader");
      expect(dayHeaders).toHaveLength(7);

      expect(dayHeaders[0]).toHaveTextContent("Sun");
      expect(dayHeaders[1]).toHaveTextContent("Mon");
      expect(dayHeaders[2]).toHaveTextContent("Tue");
      expect(dayHeaders[3]).toHaveTextContent("Wed");
      expect(dayHeaders[4]).toHaveTextContent("Thu");
      expect(dayHeaders[5]).toHaveTextContent("Fri");
      expect(dayHeaders[6]).toHaveTextContent("Sat");
    });

    it("shows current month and year in header", () => {
      const testDate = new Date(2026, 3, 1);

      render(
        <Calendar schedules={mockSchedules} currentMonth={testDate} onDayClick={mockOnDayClick} />,
      );

      expect(screen.getByText("April 2026")).toBeInTheDocument();
    });

    it("renders correct number of day cells for the month", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const dayCells = screen.getAllByRole("cell");
      expect(dayCells.length).toBeGreaterThanOrEqual(30);
      expect(dayCells.length).toBeLessThanOrEqual(42);
    });

    it("highlights the current day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15));

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const todayCell = screen.getByRole("cell", { name: "15" });
      expect(todayCell).toHaveAttribute("aria-current", "date");

      vi.useRealTimers();
    });
  });

  describe("schedule indicators", () => {
    it("shows blue dot on days with pending schedules", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day15Cell = screen.getByRole("cell", { name: "15" });
      const pendingIndicator = within(day15Cell).getByTestId("schedule-indicator-pending");
      expect(pendingIndicator).toBeInTheDocument();
      expect(pendingIndicator).toHaveClass("bg-blue-500");
    });

    it("shows green dot on days with completed schedules", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day20Cell = screen.getByRole("cell", { name: "20" });
      const completedIndicator = within(day20Cell).getByTestId("schedule-indicator-completed");
      expect(completedIndicator).toBeInTheDocument();
      expect(completedIndicator).toHaveClass("bg-green-500");
    });

    it("shows red dot on days with failed schedules", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day10Cells = screen.getAllByRole("cell", { name: "10" });
      const currentMonthDay10 = day10Cells.find(
        (cell) => !cell.className.includes("text-gray-400"),
      );
      expect(currentMonthDay10).toBeDefined();
      const failedIndicator = within(currentMonthDay10!).getByTestId("schedule-indicator-failed");
      expect(failedIndicator).toBeInTheDocument();
      expect(failedIndicator).toHaveClass("bg-red-500");
    });

    it("shows count badge if >1 schedule on same day", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day15Cell = screen.getByRole("cell", { name: "15" });
      const countBadge = within(day15Cell).getByText("2");
      expect(countBadge).toBeInTheDocument();
    });

    it("shows tooltip with schedule count on hover", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day15Cell = screen.getByRole("cell", { name: "15" });
      await user.hover(day15Cell);

      expect(await screen.findByRole("tooltip")).toHaveTextContent("2 schedules");
    });
  });

  describe("day click interaction", () => {
    it("calls onDayClick when clicking a day", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day15Cell = screen.getByRole("cell", { name: "15" });
      await user.click(day15Cell);

      expect(mockOnDayClick).toHaveBeenCalledWith(
        new Date(2026, 3, 15),
        expect.arrayContaining([
          expect.objectContaining({ id: "sched_001" }),
          expect.objectContaining({ id: "sched_002" }),
        ]),
      );
    });

    it("passes empty array when clicking day with no schedules", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day5Cell = screen.getByRole("cell", { name: "5" });
      await user.click(day5Cell);

      expect(mockOnDayClick).toHaveBeenCalledTimes(1);
      const [calledDate, calledSchedules] = mockOnDayClick.mock.calls[0] ?? [];
      expect(calledDate.getFullYear()).toBe(2026);
      expect(calledDate.getMonth()).toBe(3);
      expect(calledDate.getDate()).toBe(5);
      expect(calledSchedules).toEqual([]);
    });
  });

  describe("month navigation", () => {
    it("shows previous month when clicking left arrow", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
          onMonthChange={mockOnMonthChange}
        />,
      );

      const prevButton = screen.getByRole("button", {
        name: /previous month/i,
      });
      await user.click(prevButton);

      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2026, 2, 1));
    });

    it("shows next month when clicking right arrow", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
          onMonthChange={mockOnMonthChange}
        />,
      );

      const nextButton = screen.getByRole("button", { name: /next month/i });
      await user.click(nextButton);

      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2026, 4, 1));
    });

    it('jumps to current month when clicking "Today" button', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15));

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 0, 1)}
          onDayClick={mockOnDayClick}
          onMonthChange={mockOnMonthChange}
        />,
      );

      const todayButton = screen.getByRole("button", { name: /today/i });
      todayButton.click();

      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2026, 3, 1));

      vi.useRealTimers();
    });

    it("disables navigation beyond 1 year from today", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 15));

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2027, 3, 1)}
          onDayClick={mockOnDayClick}
          onMonthChange={mockOnMonthChange}
        />,
      );

      const nextButton = screen.getByRole("button", { name: /next month/i });
      expect(nextButton).toBeDisabled();

      vi.useRealTimers();
    });
  });

  describe("accessibility", () => {
    it("updates focus state on arrow key navigation", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day15Cells = screen.getAllByRole("cell", { name: "15" });
      const currentMonthDay15 = day15Cells.find(
        (cell) => !cell.className.includes("text-gray-400"),
      );
      expect(currentMonthDay15).toBeDefined();
      currentMonthDay15!.focus();

      await user.keyboard("{ArrowRight}");

      const day16Cells = screen.getAllByRole("cell", { name: "16" });
      const currentMonthDay16 = day16Cells.find(
        (cell) => !cell.className.includes("text-gray-400"),
      );
      expect(currentMonthDay16).toBeDefined();
      expect(currentMonthDay16).toHaveAttribute("tabIndex", "0");
    });

    it("selects day on Enter key press", async () => {
      const user = userEvent.setup();

      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const day15Cell = screen.getByRole("cell", { name: "15" });
      day15Cell.focus();

      await user.keyboard("{Enter}");

      expect(mockOnDayClick).toHaveBeenCalled();
    });

    it("has proper ARIA roles and labels", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const grid = screen.getByRole("grid");
      expect(grid).toHaveAttribute("aria-label", "Calendar");

      const navigation = screen.getByRole("navigation");
      expect(navigation).toHaveAttribute("aria-label", "Calendar navigation");
    });
  });

  describe("edge cases", () => {
    it("renders correctly with no schedules", () => {
      render(
        <Calendar schedules={[]} currentMonth={new Date(2026, 3, 1)} onDayClick={mockOnDayClick} />,
      );

      expect(screen.getByText("April 2026")).toBeInTheDocument();
      const dayCells = screen.getAllByRole("cell");
      dayCells.forEach((cell) => {
        expect(within(cell).queryByTestId(/schedule-indicator/)).not.toBeInTheDocument();
      });
    });

    it("grays out days from previous/next month", () => {
      render(
        <Calendar
          schedules={mockSchedules}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const prevMonthCells = screen.getAllByRole("cell").filter((cell) => {
        const day = Number.parseInt(cell.textContent ?? "0", 10);
        return day >= 29 && day <= 31 && cell.className.includes("text-gray-400");
      });

      expect(prevMonthCells.length).toBeGreaterThan(0);
    });

    it("handles schedules across month boundaries", () => {
      const schedulesAcrossMonths: Schedule[] = [
        {
          ...mockSchedules[0],
          scheduledAt: new Date("2026-03-31T10:00:00Z"),
        },
        {
          ...mockSchedules[1],
          scheduledAt: new Date("2026-05-01T14:00:00Z"),
        },
      ];

      render(
        <Calendar
          schedules={schedulesAcrossMonths}
          currentMonth={new Date(2026, 3, 1)}
          onDayClick={mockOnDayClick}
        />,
      );

      const mar31Cell = screen.getByRole("cell", { name: "31" });
      expect(within(mar31Cell).getByTestId("schedule-indicator-pending")).toBeInTheDocument();
    });
  });
});
