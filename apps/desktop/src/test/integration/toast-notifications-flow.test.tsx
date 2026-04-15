/**
 * TASK-8.5: E2E Test for Toast Notifications Flow
 *
 * Tests toast notification display and dismissal.
 * Tests the complete flow: trigger toast → verify display → dismiss.
 *
 * Flow: Trigger toast → Verify display → Dismiss
 */

import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Toast } from "@/components/atoms/Toast"
import { ToastContainer } from "@/components/molecules/ToastContainer"
import { useToastStore } from "@/stores/toastStore"
import { useToast } from "@/hooks/useToast"

describe("E2E: Toast Notifications Flow", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Trigger toast", () => {
    it("should display success toast when triggered", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Post published successfully",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByText("Post published successfully")).toBeInTheDocument()
      expect(screen.getByTestId("toast-success")).toBeInTheDocument()
    })

    it("should display error toast when triggered", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "error",
          message: "Failed to publish post",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByText("Failed to publish post")).toBeInTheDocument()
      expect(screen.getByTestId("toast-error")).toBeInTheDocument()
    })

    it("should display info toast when triggered", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "info",
          message: "Processing your request",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByText("Processing your request")).toBeInTheDocument()
      expect(screen.getByTestId("toast-info")).toBeInTheDocument()
    })

    it("should display warning toast when triggered", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "warning",
          message: "Rate limit approaching",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByText("Rate limit approaching")).toBeInTheDocument()
      expect(screen.getByTestId("toast-warning")).toBeInTheDocument()
    })
  })

  describe("Verify display", () => {
    it("should show toast with correct type styling", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Success message",
        })
      })

      render(<ToastContainer />)

      const toast = screen.getByTestId("toast-success")
      expect(toast).toBeInTheDocument()
      // Toast uses bg-green-50 for light mode styling
      expect(toast).toHaveClass("bg-green-50")
    })

    it("should show toast with correct icon", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "error",
          message: "Error message",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByTestId("toast-icon-error")).toBeInTheDocument()
    })

    it("should position toast in top-right corner", () => {
      render(<ToastContainer />)

      const container = screen.getByTestId("toast-container")
      expect(container).toHaveClass("top-4")
      expect(container).toHaveClass("right-4")
    })

    it("should have high z-index to appear above content", () => {
      render(<ToastContainer />)

      const container = screen.getByTestId("toast-container")
      expect(container).toHaveClass("z-50")
    })

    it("should display multiple toasts simultaneously", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "First toast",
        })
        useToastStore.getState().addToast({
          type: "error",
          message: "Second toast",
        })
        useToastStore.getState().addToast({
          type: "info",
          message: "Third toast",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByText("First toast")).toBeInTheDocument()
      expect(screen.getByText("Second toast")).toBeInTheDocument()
      expect(screen.getByText("Third toast")).toBeInTheDocument()
    })
  })

  describe("Dismiss toast", () => {
    it("should dismiss toast when dismiss button clicked", async () => {
      vi.useRealTimers()
      const user = userEvent.setup()

      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Test toast",
        })
      })

      render(<ToastContainer />)

      await user.click(screen.getByRole("button", { name: /dismiss/i }))

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it("should auto-dismiss after 5 seconds", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Auto dismiss test",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByText("Auto dismiss test")).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it("should dismiss specific toast when multiple exist", async () => {
      vi.useRealTimers()
      const user = userEvent.setup()

      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "First toast",
        })
        useToastStore.getState().addToast({
          type: "error",
          message: "Second toast",
        })
      })

      render(<ToastContainer />)

      // Get all dismiss buttons and click the first one
      const dismissButtons = screen.getAllByRole("button", { name: /dismiss/i })
      await user.click(dismissButtons[0]!)

      // One toast should remain
      expect(useToastStore.getState().toasts).toHaveLength(1)
    })

    it("should clear all toasts with clearAll", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Toast 1",
        })
        useToastStore.getState().addToast({
          type: "error",
          message: "Toast 2",
        })
        useToastStore.getState().addToast({
          type: "info",
          message: "Toast 3",
        })
      })

      expect(useToastStore.getState().toasts).toHaveLength(3)

      act(() => {
        useToastStore.getState().clearAll()
      })

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe("useToast hook integration", () => {
    it("should provide success method", () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success("Success message")
      })

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0]?.type).toBe("success")
    })

    it("should provide error method", () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.error("Error message")
      })

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0]?.type).toBe("error")
    })

    it("should provide info method", () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.info("Info message")
      })

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0]?.type).toBe("info")
    })

    it("should provide warning method", () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.warning("Warning message")
      })

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0]?.type).toBe("warning")
    })

    it("should provide dismiss method", () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success("Test message")
      })

      const toastId = useToastStore.getState().toasts[0]?.id

      act(() => {
        result.current.dismiss(toastId!)
      })

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it("should provide dismissAll method", () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success("Message 1")
        result.current.error("Message 2")
        result.current.info("Message 3")
      })

      expect(useToastStore.getState().toasts).toHaveLength(3)

      act(() => {
        result.current.dismissAll()
      })

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe("Full flow: Trigger → Verify → Dismiss", () => {
    it("should complete full toast lifecycle", async () => {
      vi.useRealTimers()
      const user = userEvent.setup()

      // Step 1: Trigger toast
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Operation completed",
        })
      })

      render(<ToastContainer />)

      // Step 2: Verify display
      expect(screen.getByText("Operation completed")).toBeInTheDocument()
      expect(screen.getByTestId("toast-success")).toBeInTheDocument()
      expect(screen.getByTestId("toast-icon-success")).toBeInTheDocument()

      // Step 3: Dismiss toast
      await user.click(screen.getByRole("button", { name: /dismiss/i }))

      // Step 4: Verify toast is gone
      await waitFor(() => {
        expect(screen.queryByText("Operation completed")).not.toBeInTheDocument()
      })
    })

    it("should handle auto-dismiss flow", async () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "info",
          message: "Auto-dismiss test",
        })
      })

      render(<ToastContainer />)

      // Verify toast appears
      expect(screen.getByText("Auto-dismiss test")).toBeInTheDocument()

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Verify toast is auto-dismissed
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe("Accessibility", () => {
    it("should have role=alert for error toasts", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "error",
          message: "Error message",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    it("should have role=status for non-error toasts", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Success message",
        })
      })

      render(<ToastContainer />)

      expect(screen.getByRole("status")).toBeInTheDocument()
    })
  })
})
