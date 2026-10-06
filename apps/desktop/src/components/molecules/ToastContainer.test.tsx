import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/stores/toastStore";
import { ToastContainer } from "./ToastContainer";

describe("ToastContainer", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders empty container when no toasts", () => {
      render(<ToastContainer />);

      expect(screen.queryByTestId("toast-container")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("renders single toast from store", () => {
      useToastStore.setState({
        toasts: [{ id: "toast-1", type: "success", message: "Success message" }],
      });

      render(<ToastContainer />);

      expect(screen.getByText("Success message")).toBeInTheDocument();
    });

    it("renders multiple toasts from store", () => {
      useToastStore.setState({
        toasts: [
          { id: "toast-1", type: "success", message: "First toast" },
          { id: "toast-2", type: "error", message: "Second toast" },
          { id: "toast-3", type: "info", message: "Third toast" },
        ],
      });

      render(<ToastContainer />);

      expect(screen.getByText("First toast")).toBeInTheDocument();
      expect(screen.getByText("Second toast")).toBeInTheDocument();
      expect(screen.getByText("Third toast")).toBeInTheDocument();
    });
  });

  describe("positioning", () => {
    it("positions toasts in top-right by default", () => {
      render(<ToastContainer />);

      const container = screen.getByTestId("toast-container");
      expect(container).toHaveClass("top-4");
      expect(container).toHaveClass("right-4");
    });
  });

  describe("dismiss behavior", () => {
    it("removes toast when dismiss button clicked", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useToastStore.setState({
        toasts: [{ id: "toast-1", type: "success", message: "Test toast" }],
      });

      render(<ToastContainer />);

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("auto-dismisses toast after 5 seconds", () => {
      useToastStore.setState({
        toasts: [{ id: "toast-1", type: "success", message: "Auto dismiss" }],
      });

      render(<ToastContainer />);

      expect(screen.getByText("Auto dismiss")).toBeInTheDocument();

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Toast should be removed from store
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("clears timeout when toast manually dismissed", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      useToastStore.setState({
        toasts: [{ id: "toast-1", type: "success", message: "Manual dismiss" }],
      });

      render(<ToastContainer />);

      // Dismiss before auto-dismiss triggers
      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      // Verify toast was removed
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe("z-index", () => {
    it("has high z-index to appear above other content", () => {
      render(<ToastContainer />);

      const container = screen.getByTestId("toast-container");
      expect(container).toHaveClass("z-50");
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(<ToastContainer className="custom-class" />);

      const container = screen.getByTestId("toast-container");
      expect(container).toHaveClass("custom-class");
      expect(container).toHaveClass("top-4");
    });
  });
});
