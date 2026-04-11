import type { Schedule } from "@social-pip/types";
/**
 * @fileoverview Calendar component - Month view with schedule indicators
 */
import { useCallback, useMemo, useState } from "react";
import { CalendarDay } from "./CalendarDay";

interface CalendarProps {
	schedules: Schedule[];
	currentMonth: Date;
	onDayClick: (date: Date, schedules: Schedule[]) => void;
	onMonthChange?: (date: Date) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

/**
 * Calendar component showing month view with schedule indicators
 */
export function Calendar({
	schedules,
	currentMonth,
	onDayClick,
	onMonthChange,
}: CalendarProps): React.ReactElement {
	const [focusedDate, setFocusedDate] = useState<Date | null>(null);

	// Get schedules grouped by date for quick lookup
	const schedulesByDate = useMemo(() => {
		const map = new Map<string, Schedule[]>();
		for (const schedule of schedules) {
			const dateKey = new Date(schedule.scheduledAt).toDateString();
			const existing = map.get(dateKey) ?? [];
			existing.push(schedule);
			map.set(dateKey, existing);
		}
		return map;
	}, [schedules]);

	// Calculate days to render
	const { days, prevMonthDays, nextMonthDays } = useMemo(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();

		// First day of the month
		const firstDay = new Date(year, month, 1);
		const firstDayOfWeek = firstDay.getDay();

		// Last day of the month
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();

		// Days from previous month to show
		const prevMonthLastDay = new Date(year, month, 0).getDate();
		const prevMonthDaysArray: number[] = [];
		for (let i = firstDayOfWeek - 1; i >= 0; i--) {
			prevMonthDaysArray.push(prevMonthLastDay - i);
		}

		// Days of current month
		const daysArray: number[] = [];
		for (let i = 1; i <= daysInMonth; i++) {
			daysArray.push(i);
		}

		// Days from next month to show (to fill the grid)
		const totalCells = 42; // 6 rows * 7 days
		const nextMonthDaysCount =
			totalCells - prevMonthDaysArray.length - daysArray.length;
		const nextMonthDaysArray: number[] = [];
		for (let i = 1; i <= nextMonthDaysCount; i++) {
			nextMonthDaysArray.push(i);
		}

		return {
			days: daysArray,
			prevMonthDays: prevMonthDaysArray,
			nextMonthDays: nextMonthDaysArray,
		};
	}, [currentMonth]);

	// Check if a day is today
	const isToday = useCallback(
		(day: number, isCurrentMonth: boolean): boolean => {
			if (!isCurrentMonth) return false;
			const today = new Date();
			return (
				today.getDate() === day &&
				today.getMonth() === currentMonth.getMonth() &&
				today.getFullYear() === currentMonth.getFullYear()
			);
		},
		[currentMonth],
	);

	// Get date object for a day
	const getDateForDay = useCallback(
		(day: number, isCurrentMonth: boolean, isPrevMonth: boolean): Date => {
			const year = currentMonth.getFullYear();
			const month = currentMonth.getMonth();

			if (isPrevMonth) {
				return new Date(year, month - 1, day);
			}
			if (!isCurrentMonth) {
				return new Date(year, month + 1, day);
			}
			return new Date(year, month, day);
		},
		[currentMonth],
	);

	// Handle day click
	const handleDayClick = useCallback(
		(date: Date): void => {
			const dateKey = date.toDateString();
			const daySchedules = schedulesByDate.get(dateKey) ?? [];
			onDayClick(date, daySchedules);
		},
		[schedulesByDate, onDayClick],
	);

	// Navigation handlers
	const handlePrevMonth = useCallback((): void => {
		if (!onMonthChange) return;
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		onMonthChange(new Date(year, month - 1, 1));
	}, [currentMonth, onMonthChange]);

	const handleNextMonth = useCallback((): void => {
		if (!onMonthChange) return;
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		onMonthChange(new Date(year, month + 1, 1));
	}, [currentMonth, onMonthChange]);

	const handleToday = useCallback((): void => {
		if (!onMonthChange) return;
		const today = new Date();
		onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
	}, [onMonthChange]);

	// Check if next button should be disabled (beyond 1 year)
	const isNextDisabled = useMemo(() => {
		const today = new Date();
		const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 1);
		const nextMonth = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth() + 1,
			1,
		);
		return nextMonth > maxDate;
	}, [currentMonth]);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(
			event: React.KeyboardEvent,
			day: number,
			isCurrentMonth: boolean,
			isPrevMonth: boolean,
		): void => {
			const date = getDateForDay(day, isCurrentMonth, isPrevMonth);

			switch (event.key) {
				case "ArrowRight": {
					event.preventDefault();
					const nextDay = new Date(date);
					nextDay.setDate(nextDay.getDate() + 1);
					setFocusedDate(nextDay);
					break;
				}
				case "ArrowLeft": {
					event.preventDefault();
					const prevDay = new Date(date);
					prevDay.setDate(prevDay.getDate() - 1);
					setFocusedDate(prevDay);
					break;
				}
				case "ArrowDown": {
					event.preventDefault();
					const downDay = new Date(date);
					downDay.setDate(downDay.getDate() + 7);
					setFocusedDate(downDay);
					break;
				}
				case "ArrowUp": {
					event.preventDefault();
					const upDay = new Date(date);
					upDay.setDate(upDay.getDate() - 7);
					setFocusedDate(upDay);
					break;
				}
				case "Enter": {
					event.preventDefault();
					handleDayClick(date);
					break;
				}
			}
		},
		[getDateForDay, handleDayClick],
	);

	const monthName = MONTHS[currentMonth.getMonth()];
	const year = currentMonth.getFullYear();

	return (
		<div className="calendar-container">
			{/* Navigation */}
			<nav
				aria-label="Calendar navigation"
				className="flex items-center justify-between mb-4"
			>
				<div className="flex items-center gap-2">
					<button
						type="button"
						aria-label="Previous month"
						onClick={handlePrevMonth}
						className="p-2 rounded hover:bg-gray-100"
					>
						←
					</button>
					<h2 className="text-xl font-semibold" aria-live="polite">
						{monthName} {year}
					</h2>
					<button
						type="button"
						aria-label="Next month"
						onClick={handleNextMonth}
						disabled={isNextDisabled}
						className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						→
					</button>
				</div>
				<button
					type="button"
					onClick={handleToday}
					className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Today
				</button>
			</nav>

			{/* Calendar Grid */}
			<table
				role="grid"
				aria-label="Calendar"
				className="w-full border-collapse"
			>
				<thead>
					<tr>
						{DAYS.map((day) => (
							<th
								key={day}
								scope="col"
								role="columnheader"
								className="p-2 text-center font-medium text-gray-600 border-b"
							>
								{day}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{/* Previous month days */}
					{prevMonthDays.length > 0 && (
						<tr>
							{prevMonthDays.map((day) => {
								const date = getDateForDay(day, false, true);
								const dateKey = date.toDateString();
								const daySchedules = schedulesByDate.get(dateKey) ?? [];
								const isFocused = focusedDate?.toDateString() === dateKey;

								return (
									<CalendarDay
										key={`prev-${day}`}
										day={day}
										date={date}
										schedules={daySchedules}
										isCurrentMonth={false}
										isToday={false}
										isFocused={isFocused}
										onClick={handleDayClick}
										onKeyDown={handleKeyDown}
									/>
								);
							})}
							{/* Current month days */}
							{days.slice(0, 7 - prevMonthDays.length).map((day) => {
								const date = getDateForDay(day, true, false);
								const dateKey = date.toDateString();
								const daySchedules = schedulesByDate.get(dateKey) ?? [];
								const isFocused = focusedDate?.toDateString() === dateKey;

								return (
									<CalendarDay
										key={`curr-${day}`}
										day={day}
										date={date}
										schedules={daySchedules}
										isCurrentMonth
										isToday={isToday(day, true)}
										isFocused={isFocused}
										onClick={handleDayClick}
										onKeyDown={handleKeyDown}
									/>
								);
							})}
						</tr>
					)}

					{/* Remaining weeks */}
					{Array.from({
						length: Math.ceil((days.length - (7 - prevMonthDays.length)) / 7),
					}).map((_, weekIndex) => {
						const startDay =
							(weekIndex === 0 ? 7 - prevMonthDays.length : 0) + weekIndex * 7;
						const weekDays = days.slice(startDay, startDay + 7);

						// Add next month days if needed
						if (weekDays.length < 7) {
							const remaining = 7 - weekDays.length;
							for (let i = 0; i < remaining; i++) {
								const nextDay = nextMonthDays[i];
								if (nextDay !== undefined) {
									weekDays.push(nextDay);
								}
							}
						}

						return (
							<tr key={`week-${weekIndex}`}>
								{weekDays.map((day, dayIndex) => {
									const isNextMonth =
										dayIndex >= days.length - startDay &&
										weekDays.length > days.length - startDay;
									const isCurrentMonth =
										!isNextMonth && startDay + dayIndex < days.length;
									const date = getDateForDay(day, isCurrentMonth, false);
									const dateKey = date.toDateString();
									const daySchedules = schedulesByDate.get(dateKey) ?? [];
									const isFocused = focusedDate?.toDateString() === dateKey;

									return (
										<CalendarDay
											key={`day-${day}-${dayIndex}`}
											day={day}
											date={date}
											schedules={daySchedules}
											isCurrentMonth={isCurrentMonth}
											isToday={isToday(day, isCurrentMonth)}
											isFocused={isFocused}
											onClick={handleDayClick}
											onKeyDown={handleKeyDown}
										/>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
