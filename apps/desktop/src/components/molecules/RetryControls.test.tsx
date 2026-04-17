import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RetryControls } from "./RetryControls";

describe("RetryControls", () => {
  const defaultProps = {
    failedCount: 3,
    maxRetries: 5,
    currentRetries: 1,
    onRetryAll: vi.fn(),
  };

  describe("rendering", () => {
    it("renders failed count message", () => {
      render(<RetryControls {...defaultProps} />);
      expect(screen.getByText(/3 failed/i)).toBeInTheDocument();
    });

    it("renders retries remaining message", () => {
      render(<RetryControls {...defaultProps} />);
      expect(screen.getByText(/4 retries remaining/i)).toBeInTheDocument();
    });

    it("renders as a container element", () => {
      render(<RetryControls {...defaultProps} />);
      const container = screen.getByTestId("retry-controls");
      expect(container).toBeInTheDocument();
    });
  });

  describe("retry calculations", () => {
    it("calculates remaining retries correctly", () => {
      render(
        <RetryControls {...defaultProps} failedCount={5} maxRetries={10} currentRetries={3} />,
      );
      expect(screen.getByText(/7 retries remaining/i)).toBeInTheDocument();
    });

    it("shows zero retries remaining when max reached", () => {
      render(<RetryControls {...defaultProps} failedCount={3} maxRetries={3} currentRetries={3} />);
      expect(screen.getByText(/0 retries remaining/i)).toBeInTheDocument();
    });
  });

  describe("retry all button", () => {
    it("shows retry all button", () => {
      render(<RetryControls {...defaultProps} />);
      expect(screen.getByRole("button", { name: /retry all/i })).toBeInTheDocument();
    });

    it("calls onRetryAll when clicked", async () => {
      const handleRetryAll = vi.fn();
      const user = userEvent.setup();
      render(<RetryControls {...defaultProps} onRetryAll={handleRetryAll} />);

      await user.click(screen.getByRole("button", { name: /retry all/i }));
      expect(handleRetryAll).toHaveBeenCalledTimes(1);
    });

    it("is disabled when max retries reached", () => {
      render(<RetryControls {...defaultProps} maxRetries={3} currentRetries={3} />);
      const button = screen.getByRole("button", { name: /retry all/i });
      expect(button).toBeDisabled();
    });

    it("is disabled when disabled prop is true", () => {
      render(<RetryControls {...defaultProps} disabled={true} />);
      const button = screen.getByRole("button", { name: /retry all/i });
      expect(button).toBeDisabled();
    });

    it("is enabled when retries remaining", () => {
      render(<RetryControls {...defaultProps} />);
      const button = screen.getByRole("button", { name: /retry all/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("zero failed", () => {
    it("does not render when no failures", () => {
      render(<RetryControls {...defaultProps} failedCount={0} />);
      expect(screen.queryByTestId("retry-controls")).not.toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(<RetryControls {...defaultProps} className="custom-class" />);
      const container = screen.getByTestId("retry-controls");
      expect(container).toHaveClass("custom-class");
    });
  });
});
