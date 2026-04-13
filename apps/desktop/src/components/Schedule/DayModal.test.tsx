import type { Schedule } from "@social-pip/types"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { DayModal } from "./DayModal"

const mockPendingSchedule: Schedule = {
  id: "sched_pending",
  postId: "post_test001",
  accountId: "acc_test001",
  scheduledAt: new Date("2026-04-15T10:00:00Z"),
  variance: 15,
  status: "pending",
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-01T00:00:00Z"),
}

const mockCompletedSchedule: Schedule = {
  id: "sched_completed",
  postId: "post_test002",
  accountId: "acc_test001",
  scheduledAt: new Date("2026-04-15T14:00:00Z"),
  variance: 10,
  status: "completed",
  attempts: 1,
  maxAttempts: 3,
  result: "success",
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-15T14:30:00Z"),
}

const mockFailedSchedule: Schedule = {
  id: "sched_failed",
  postId: "post_test003",
  accountId: "acc_test001",
  scheduledAt: new Date("2026-04-15T09:00:00Z"),
  variance: 20,
  status: "failed",
  attempts: 3,
  maxAttempts: 3,
  result: "Error: Network timeout",
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-15T09:30:00Z"),
}

const mockRunningSchedule: Schedule = {
  id: "sched_running",
  postId: "post_test004",
  accountId: "acc_test001",
  scheduledAt: new Date("2026-04-15T11:00:00Z"),
  variance: 5,
  status: "running",
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-01T00:00:00Z"),
}

const mockCancelledSchedule: Schedule = {
  id: "sched_cancelled",
  postId: "post_test005",
  accountId: "acc_test001",
  scheduledAt: new Date("2026-04-15T12:00:00Z"),
  variance: 10,
  status: "cancelled",
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  updatedAt: new Date("2026-04-01T00:00:00Z"),
}

describe("DayModal", () => {
  const mockDate = new Date(2026, 3, 15)
  const mockOnCancel = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("renders when open is true", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("does not render when open is false", () => {
      render(
        <DayModal
          isOpen={false}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("renders formatted date in header", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText(/Wednesday, April 15, 2026/)).toBeInTheDocument()
    })

    it("renders modal title with id modal-title", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByLabelText(/Wednesday, April 15, 2026/)).toBeInTheDocument()
    })
  })

  describe("schedule list", () => {
    it("displays schedules for selected day", () => {
      const schedules = [mockPendingSchedule, mockCompletedSchedule]
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={schedules}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const listItems = screen.getAllByRole("listitem")
      expect(listItems).toHaveLength(2)
    })

    it("shows schedule time correctly", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText(/07:00 AM/i)).toBeInTheDocument()
    })

    it("shows status badge for each schedule", () => {
      const schedules = [
        mockPendingSchedule,
        mockCompletedSchedule,
        mockFailedSchedule,
        mockRunningSchedule,
        mockCancelledSchedule,
      ]
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={schedules}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText("Pending")).toBeInTheDocument()
      expect(screen.getByText("Completed")).toBeInTheDocument()
      expect(screen.getByText("Failed")).toBeInTheDocument()
      expect(screen.getByText("Running")).toBeInTheDocument()
      expect(screen.getByText("Cancelled")).toBeInTheDocument()
    })

    it("shows post ID preview", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText(/post_tes/)).toBeInTheDocument()
    })

    it("shows result for completed schedules", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockCompletedSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText("success")).toBeInTheDocument()
    })

    it("shows result for failed schedules", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockFailedSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText("Error: Network timeout")).toBeInTheDocument()
    })

    it("shows attempts when greater than 0", () => {
      const scheduleWithAttempts: Schedule = {
        ...mockFailedSchedule,
        attempts: 2,
        maxAttempts: 5,
      }
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[scheduleWithAttempts]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText(/Attempts: 2\/5/)).toBeInTheDocument()
    })

    it("does not show attempts when 0", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.queryByText(/Attempts:/)).not.toBeInTheDocument()
    })
  })

  describe("empty state", () => {
    it("shows message when no schedules", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByText("No schedules for this day")).toBeInTheDocument()
    })

    it("shows empty state with proper styling", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const emptyMessage = screen.getByText("No schedules for this day")
      expect(emptyMessage).toHaveClass("text-gray-500")
    })
  })

  describe("schedule cancel action", () => {
    it("shows cancel button for pending schedules", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByRole("button", { name: /cancel schedule/i })).toBeInTheDocument()
    })

    it("does not show cancel button for non-pending schedules", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockCompletedSchedule, mockFailedSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.queryByRole("button", { name: /cancel schedule/i })).not.toBeInTheDocument()
    })

    it("calls onCancel with schedule id when cancel clicked", async () => {
      const user = userEvent.setup()
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      await user.click(screen.getByRole("button", { name: /cancel schedule/i }))

      expect(mockOnCancel).toHaveBeenCalledWith("sched_pending")
    })
  })

  describe("modal controls", () => {
    it("renders close button", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      expect(screen.getByRole("button", { name: "Close modal" })).toBeInTheDocument()
    })

    it("calls onClose when close button clicked", async () => {
      const user = userEvent.setup()
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      await user.click(screen.getByRole("button", { name: "Close modal" }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it("calls onClose when backdrop clicked", async () => {
      const user = userEvent.setup()
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const backdrop = screen.getByRole("dialog")
      await user.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it("does not call onClose when modal content clicked", async () => {
      const user = userEvent.setup()
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const modalContent = screen.getByText(/Wednesday, April 15, 2026/)
      await user.click(modalContent)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe("accessibility", () => {
    it("has correct ARIA attributes", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const dialog = screen.getByRole("dialog")
      expect(dialog).toHaveAttribute("aria-modal", "true")
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title")
    })

    it("has proper list structure for schedules", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule, mockCompletedSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const list = screen.getByRole("list")
      expect(list).toBeInTheDocument()
      expect(within(list).getAllByRole("listitem")).toHaveLength(2)
    })
  })

  describe("status colors", () => {
    it("applies blue color for pending status", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockPendingSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const pendingBadge = screen.getByText("Pending")
      expect(pendingBadge).toHaveClass("bg-blue-100")
      expect(pendingBadge).toHaveClass("text-blue-800")
    })

    it("applies green color for completed status", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockCompletedSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const completedBadge = screen.getByText("Completed")
      expect(completedBadge).toHaveClass("bg-green-100")
      expect(completedBadge).toHaveClass("text-green-800")
    })

    it("applies red color for failed status", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockFailedSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const failedBadge = screen.getByText("Failed")
      expect(failedBadge).toHaveClass("bg-red-100")
      expect(failedBadge).toHaveClass("text-red-800")
    })

    it("applies yellow color for running status", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockRunningSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const runningBadge = screen.getByText("Running")
      expect(runningBadge).toHaveClass("bg-yellow-100")
      expect(runningBadge).toHaveClass("text-yellow-800")
    })

    it("applies gray color for cancelled status", () => {
      render(
        <DayModal
          isOpen={true}
          date={mockDate}
          schedules={[mockCancelledSchedule]}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />,
      )

      const cancelledBadge = screen.getByText("Cancelled")
      expect(cancelledBadge).toHaveClass("bg-gray-100")
      expect(cancelledBadge).toHaveClass("text-gray-800")
    })
  })
})
