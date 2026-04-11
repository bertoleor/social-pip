import type { Schedule } from "@social-pip/types";
// removed unused import
import userEvent from "@testing-library/user-event";
/**
 * @fileoverview Calendar component tests (TDD - Strict Mode)
 */
// removed unused import
import { Calendar } from "./Calendar";

// Mock schedule data
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

	// ============================================
	// PHASE 6.2: RED - Renders month grid
	// ============================================
	describe("month grid rendering", () => {
		it("renders month grid with 7 columns (Sun-Sat)", () => {
			render(
				<Calendar
					schedules={mockSchedules}
					currentMonth={new Date(2026, 3, 1)}
					onDayClick={mockOnDayClick}
				/>,
			);

			// Find the header row with day names
			const dayHeaders = screen.getAllByRole("columnheader");
			expect(dayHeaders).toHaveLength(7);

			// Verify day names
			expect(dayHeaders[0]).toHaveTextContent("Sun");
			expect(dayHeaders[1]).toHaveTextContent("Mon");
			expect(dayHeaders[2]).toHaveTextContent("Tue");
			expect(dayHeaders[3]).toHaveTextContent("Wed");
			expect(dayHeaders[4]).toHaveTextContent("Thu");
			expect(dayHeaders[5]).toHaveTextContent("Fri");
			expect(dayHeaders[6]).toHaveTextContent("Sat");
		});

		it("shows current month and year in header", () => {
			const testDate = new Date(2026, 3, 1); // April 1, 2026

			render(
				<Calendar
					schedules={mockSchedules}
					currentMonth={testDate}
					onDayClick={mockOnDayClick}
				/>,
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

			// April 2026 starts on Wednesday (April 1) and ends on Thursday (April 30)
			// So we need 35 cells (5 weeks * 7 days)
			const dayCells = screen.getAllByRole("gridcell");
			expect(dayCells.length).toBeGreaterThanOrEqual(30); // At least all days of the month
			expect(dayCells.length).toBeLessThanOrEqual(42); // Max 6 weeks
		});

		it("highlights the current day", () => {
			// Mock current date
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 3, 15));

			render(
				<Calendar
					schedules={mockSchedules}
					currentMonth={new Date(2026, 3, 1)}
					onDayClick={mockOnDayClick}
				/>,
			);

			const todayCell = screen.getByRole("gridcell", { name: /15/ });
			expect(todayCell).toHaveAttribute("aria-current", "date");

			vi.useRealTimers();
		});
	});

	// ============================================
	// PHASE 6.3: RED - Schedule indicators
	// ============================================
	describe("schedule indicators", () => {
		it("shows blue dot on days with pending schedules", () => {
			render(
				<Calendar
					schedules={mockSchedules}
					currentMonth={new Date(2026, 3, 1)}
					onDayClick={mockOnDayClick}
				/>,
			);

			// April 15 has 2 pending schedules
			const day15Cell = screen.getByRole("gridcell", { name: /15/ });
			const pendingIndicator = within(day15Cell).getByTestId(
				"schedule-indicator-pending",
			);
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

			// April 20 has 1 completed schedule
			const day20Cell = screen.getByRole("gridcell", { name: /20/ });
			const completedIndicator = within(day20Cell).getByTestId(
				"schedule-indicator-completed",
			);
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

			// April 10 has 1 failed schedule
			const day10Cell = screen.getByRole("gridcell", { name: /10/ });
			const failedIndicator = within(day10Cell).getByTestId(
				"schedule-indicator-failed",
			);
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

			// April 15 has 2 schedules
			const day15Cell = screen.getByRole("gridcell", { name: /15/ });
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

			const day15Cell = screen.getByRole("gridcell", { name: /15/ });
			await user.hover(day15Cell);

			// Tooltip should show count
			expect(await screen.findByRole("tooltip")).toHaveTextContent(
				"2 schedules",
			);
		});
	});

	// ============================================
	// PHASE 6.4: RED - Day click interaction
	// ============================================
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

			const day15Cell = screen.getByRole("gridcell", { name: /15/ });
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

			const day5Cell = screen.getByRole("gridcell", { name: /5/ });
			await user.click(day5Cell);

			expect(mockOnDayClick).toHaveBeenCalledWith(new Date("2026-04-05"), []);
		});
	});

	// ============================================
	// Month Navigation
	// ============================================
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

		it('jumps to current month when clicking "Today" button', async () => {
			const user = userEvent.setup();
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
			await user.click(todayButton);

			expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2026, 3, 1));

			vi.useRealTimers();
		});

		it("disables navigation beyond 1 year from today", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 3, 15));

			render(
				<Calendar
					schedules={mockSchedules}
					currentMonth={new Date(2027, 3, 1)} // 1 year ahead
					onDayClick={mockOnDayClick}
					onMonthChange={mockOnMonthChange}
				/>,
			);

			const nextButton = screen.getByRole("button", { name: /next month/i });
			expect(nextButton).toBeDisabled();

			vi.useRealTimers();
		});
	});

	// ============================================
	// Accessibility
	// ============================================
	describe("accessibility", () => {
		it("supports keyboard navigation with arrow keys", async () => {
			const user = userEvent.setup();

			render(
				<Calendar
					schedules={mockSchedules}
					currentMonth={new Date(2026, 3, 1)}
					onDayClick={mockOnDayClick}
				/>,
			);

			const day15Cell = screen.getByRole("gridcell", { name: /15/ });
			day15Cell.focus();

			// Press right arrow - should move to day 16
			await user.keyboard("{ArrowRight}");
			expect(screen.getByRole("gridcell", { name: /16/ })).toHaveFocus();

			// Press down arrow - should move to day 23
			await user.keyboard("{ArrowDown}");
			expect(screen.getByRole("gridcell", { name: /23/ })).toHaveFocus();
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

			const day15Cell = screen.getByRole("gridcell", { name: /15/ });
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

	// ============================================
	// Edge Cases
	// ============================================
	describe("edge cases", () => {
		it("renders correctly with no schedules", () => {
			render(
				<Calendar
					schedules={[]}
					currentMonth={new Date(2026, 3, 1)}
					onDayClick={mockOnDayClick}
				/>,
			);

			expect(screen.getByText("April 2026")).toBeInTheDocument();
			// All cells should have no indicators
			const dayCells = screen.getAllByRole("gridcell");
			dayCells.forEach((cell) => {
				expect(
					within(cell).queryByTestId(/schedule-indicator/),
				).not.toBeInTheDocument();
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

			// April 2026 starts on Wednesday, so March 29-31 are shown as grayed out
			const prevMonthCells = screen.getAllByRole("gridcell").filter((cell) => {
				const day = Number.parseInt(cell.textContent ?? "0", 10);
				return (
					day >= 29 && day <= 31 && cell.className.includes("text-gray-400")
				);
			});

			expect(prevMonthCells.length).toBeGreaterThan(0);
		});

		it("handles schedules across month boundaries", () => {
			const schedulesAcrossMonths: Schedule[] = [
				{
					...mockSchedules[0],
					scheduledAt: new Date("2026-03-31T10:00:00Z"), // Previous month
				},
				{
					...mockSchedules[1],
					scheduledAt: new Date("2026-05-01T14:00:00Z"), // Next month
				},
			];

			render(
				<Calendar
					schedules={schedulesAcrossMonths}
					currentMonth={new Date(2026, 3, 1)}
					onDayClick={mockOnDayClick}
				/>,
			);

			// March 31 indicator should show on grayed-out cell
			const mar31Cell = screen.getByRole("gridcell", { name: /31/ });
			expect(
				within(mar31Cell).getByTestId("schedule-indicator-pending"),
			).toBeInTheDocument();
		});
	});
});
