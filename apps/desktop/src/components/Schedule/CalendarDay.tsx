import type { Schedule } from "@social-pip/types";
/**
 * @fileoverview CalendarDay component - Single day cell with schedule indicators
 */
import { useCallback, useState } from "react";

interface CalendarDayProps {
  day: number;
  date: Date;
  schedules: Schedule[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isFocused: boolean;
  onClick: (date: Date) => void;
  onKeyDown: (
    event: React.KeyboardEvent,
    day: number,
    isCurrentMonth: boolean,
    isPrevMonth: boolean,
  ) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500",
  running: "bg-yellow-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-400",
};

/**
 * Single day cell in the calendar
 */
export function CalendarDay({
  day,
  date,
  schedules,
  isCurrentMonth,
  isToday,
  isFocused,
  onClick,
  onKeyDown,
}: CalendarDayProps): React.ReactElement {
  const [showTooltip, setShowTooltip] = useState(false);

  // Group schedules by status for indicators
  const schedulesByStatus = schedules.reduce(
    (acc, schedule) => {
      const status = schedule.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  const handleClick = useCallback((): void => {
    onClick(date);
  }, [date, onClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      onKeyDown(event, day, isCurrentMonth, false);
    },
    [onKeyDown, day, isCurrentMonth],
  );

  // Determine cell styling
  const cellClasses = [
    "relative",
    "p-2",
    "h-16",
    "text-center",
    "cursor-pointer",
    "hover:bg-gray-100",
    "transition-colors",
    !isCurrentMonth && "text-gray-400",
    isToday && "ring-2 ring-blue-500",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td
      aria-label={`${day}`}
      aria-current={isToday ? "date" : undefined}
      tabIndex={isFocused ? 0 : -1}
      className={cellClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Day number */}
      <span className="text-sm font-medium">{day}</span>

      {/* Schedule indicators */}
      {schedules.length > 0 && (
        <div className="flex justify-center gap-1 mt-1">
          {Object.entries(schedulesByStatus).map(([status, statusSchedules]) => (
            <div
              key={status}
              data-testid={`schedule-indicator-${status}`}
              className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? "bg-gray-400"}`}
              aria-label={`${statusSchedules.length} ${status} schedule${statusSchedules.length > 1 ? "s" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Count badge */}
      {schedules.length > 1 && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
          {schedules.length}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && schedules.length > 0 && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10"
        >
          {schedules.length} schedule{schedules.length > 1 ? "s" : ""}
        </div>
      )}
    </td>
  );
}
