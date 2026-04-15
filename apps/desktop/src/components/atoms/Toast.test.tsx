import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";

describe("Toast", () => {
  const mockOnDismiss = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders success toast with message", () => {
      render(
        <Toast
          id="toast-1"
          type="success"
          message="Post published successfully"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText("Post published successfully")).toBeInTheDocument();
      expect(screen.getByTestId("toast-success")).toBeInTheDocument();
    });

    it("renders error toast with message", () => {
      render(
        <Toast
          id="toast-2"
          type="error"
          message="Failed to publish post"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText("Failed to publish post")).toBeInTheDocument();
      expect(screen.getByTestId("toast-error")).toBeInTheDocument();
    });

    it("renders info toast with message", () => {
      render(
        <Toast
          id="toast-3"
          type="info"
          message="Processing your request"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText("Processing your request")).toBeInTheDocument();
      expect(screen.getByTestId("toast-info")).toBeInTheDocument();
    });

    it("renders warning toast with message", () => {
      render(
        <Toast
          id="toast-4"
          type="warning"
          message="Rate limit approaching"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText("Rate limit approaching")).toBeInTheDocument();
      expect(screen.getByTestId("toast-warning")).toBeInTheDocument();
    });
  });

  describe("dismiss button", () => {
    it("renders dismiss button", () => {
      render(
        <Toast
          id="toast-1"
          type="success"
          message="Test"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button clicked", async () => {
      const user = userEvent.setup();
      render(
        <Toast
          id="toast-1"
          type="success"
          message="Test"
          onDismiss={mockOnDismiss}
        />
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("type icons", () => {
    it("shows check icon for success", () => {
      render(
        <Toast
          id="toast-1"
          type="success"
          message="Test"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByTestId("toast-icon-success")).toBeInTheDocument();
    });

    it("shows x-circle icon for error", () => {
      render(
        <Toast
          id="toast-1"
          type="error"
          message="Test"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByTestId("toast-icon-error")).toBeInTheDocument();
    });

    it("shows info icon for info", () => {
      render(
        <Toast
          id="toast-1"
          type="info"
          message="Test"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByTestId("toast-icon-info")).toBeInTheDocument();
    });

    it("shows alert-triangle icon for warning", () => {
      render(
        <Toast
          id="toast-1"
          type="warning"
          message="Test"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByTestId("toast-icon-warning")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has role='alert' for error toasts", () => {
      render(
        <Toast
          id="toast-1"
          type="error"
          message="Error message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has role='status' for non-error toasts", () => {
      render(
        <Toast
          id="toast-1"
          type="success"
          message="Success message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(
        <Toast
          id="toast-1"
          type="success"
          message="Test"
          onDismiss={mockOnDismiss}
          className="custom-toast"
        />
      );

      expect(screen.getByTestId("toast-success")).toHaveClass("custom-toast");
    });
  });
});
