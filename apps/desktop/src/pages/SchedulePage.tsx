import { Calendar } from "@/components/Schedule/Calendar";
import { DayModal } from "@/components/Schedule/DayModal";
import { useSchedule } from "@/hooks/useSchedule";
import type { Schedule } from "@social-pip/types";
/**
 * @fileoverview Schedule page - calendar view of scheduled posts
 */
import { useCallback, useState } from "react";

export default function SchedulePage(): React.ReactElement {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use the schedule hook
  const { schedules, cancelSchedule } = useSchedule();

  // Handle day click from calendar
  const handleDayClick = useCallback((date: Date, daySchedules: Schedule[]): void => {
    setSelectedDate(date);
    setSelectedSchedules(daySchedules);
    setIsModalOpen(true);
  }, []);

  // Handle month change from calendar navigation
  const handleMonthChange = useCallback((date: Date): void => {
    setCurrentMonth(date);
  }, []);

  // Handle schedule cancellation from modal
  const handleCancelSchedule = useCallback(
    async (scheduleId: string): Promise<void> => {
      await cancelSchedule(scheduleId);
      // Update local state after cancellation
      setSelectedSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    },
    [cancelSchedule],
  );

  // Close modal
  const handleCloseModal = useCallback((): void => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedSchedules([]);
  }, []);

  return (
    <div data-testid="page-schedule" className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your scheduled posts. Click on a day to see details.
        </p>
      </header>

      {/* Schedule Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-blue-700">
            {schedules.filter((s) => s.status === "pending").length}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-700">
            {schedules.filter((s) => s.status === "completed").length}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-700">
            {schedules.filter((s) => s.status === "failed").length}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-4">
        <Calendar
          schedules={schedules}
          currentMonth={currentMonth}
          onDayClick={handleDayClick}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* Day Modal */}
      <DayModal
        isOpen={isModalOpen}
        date={selectedDate ?? new Date()}
        schedules={selectedSchedules}
        onCancel={handleCancelSchedule}
        onClose={handleCloseModal}
      />
    </div>
  );
}
