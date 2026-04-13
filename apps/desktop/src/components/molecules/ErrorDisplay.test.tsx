import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorDisplay } from "./ErrorDisplay";

describe("ErrorDisplay", () => {
	const mockError = {
		category: "rate_limit" as const,
		message: "Rate limit exceeded",
		retryable: true,
	};

	describe("rendering", () => {
		it("renders error message", () => {
			render(<ErrorDisplay error={mockError} />);
			expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
		});

		it("renders as a container element", () => {
			render(<ErrorDisplay error={mockError} />);
			const container = screen.getByTestId("error-display");
			expect(container).toBeInTheDocument();
		});
	});

	describe("category icons", () => {
		it("shows alert icon for rate_limit", () => {
			render(<ErrorDisplay error={{ ...mockError, category: "rate_limit" }} />);
			expect(screen.getByTestId("error-icon-rate_limit")).toBeInTheDocument();
		});

		it("shows alert icon for auth_expired", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "auth_expired" }} />,
			);
			expect(screen.getByTestId("error-icon-auth_expired")).toBeInTheDocument();
		});

		it("shows alert icon for group_not_found", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "group_not_found" }} />,
			);
			expect(
				screen.getByTestId("error-icon-group_not_found"),
			).toBeInTheDocument();
		});

		it("shows alert icon for permission_denied", () => {
			render(
				<ErrorDisplay
					error={{ ...mockError, category: "permission_denied" }}
				/>,
			);
			expect(
				screen.getByTestId("error-icon-permission_denied"),
			).toBeInTheDocument();
		});

		it("shows alert icon for network_error", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "network_error" }} />,
			);
			expect(
				screen.getByTestId("error-icon-network_error"),
			).toBeInTheDocument();
		});

		it("shows alert icon for facebook_changed", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "facebook_changed" }} />,
			);
			expect(
				screen.getByTestId("error-icon-facebook_changed"),
			).toBeInTheDocument();
		});

		it("shows alert icon for spam_detected", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "spam_detected" }} />,
			);
			expect(
				screen.getByTestId("error-icon-spam_detected"),
			).toBeInTheDocument();
		});

		it("shows alert icon for unknown", () => {
			render(<ErrorDisplay error={{ ...mockError, category: "unknown" }} />);
			expect(screen.getByTestId("error-icon-unknown")).toBeInTheDocument();
		});
	});

	describe("severity colors", () => {
		it("uses yellow for rate_limit (recoverable)", () => {
			render(<ErrorDisplay error={{ ...mockError, category: "rate_limit" }} />);
			const icon = screen.getByTestId("error-icon-rate_limit");
			expect(icon.parentElement).toHaveClass("text-yellow-600");
		});

		it("uses red for auth_expired (critical)", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "auth_expired" }} />,
			);
			const icon = screen.getByTestId("error-icon-auth_expired");
			expect(icon.parentElement).toHaveClass("text-red-600");
		});

		it("uses red for permission_denied (critical)", () => {
			render(
				<ErrorDisplay
					error={{ ...mockError, category: "permission_denied" }}
				/>,
			);
			const icon = screen.getByTestId("error-icon-permission_denied");
			expect(icon.parentElement).toHaveClass("text-red-600");
		});

		it("uses yellow for network_error (recoverable)", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "network_error" }} />,
			);
			const icon = screen.getByTestId("error-icon-network_error");
			expect(icon.parentElement).toHaveClass("text-yellow-600");
		});

		it("uses red for facebook_changed (critical)", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "facebook_changed" }} />,
			);
			const icon = screen.getByTestId("error-icon-facebook_changed");
			expect(icon.parentElement).toHaveClass("text-red-600");
		});

		it("uses red for spam_detected (critical)", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "spam_detected" }} />,
			);
			const icon = screen.getByTestId("error-icon-spam_detected");
			expect(icon.parentElement).toHaveClass("text-red-600");
		});

		it("uses gray for unknown", () => {
			render(<ErrorDisplay error={{ ...mockError, category: "unknown" }} />);
			const icon = screen.getByTestId("error-icon-unknown");
			expect(icon.parentElement).toHaveClass("text-gray-500");
		});
	});

	describe("retry button", () => {
		it("shows retry button when retryable and onRetry provided", async () => {
			const handleRetry = vi.fn();
			const user = userEvent.setup();
			render(<ErrorDisplay error={mockError} onRetry={handleRetry} />);

			const retryButton = screen.getByRole("button", { name: /retry/i });
			expect(retryButton).toBeInTheDocument();

			await user.click(retryButton);
			expect(handleRetry).toHaveBeenCalledTimes(1);
		});

		it("does not show retry button when not retryable", () => {
			render(
				<ErrorDisplay
					error={{ ...mockError, retryable: false }}
					onRetry={vi.fn()}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: /retry/i }),
			).not.toBeInTheDocument();
		});

		it("does not show retry button when onRetry not provided", () => {
			render(<ErrorDisplay error={mockError} />);
			expect(
				screen.queryByRole("button", { name: /retry/i }),
			).not.toBeInTheDocument();
		});
	});

	describe("category labels", () => {
		it("shows category label for rate_limit", () => {
			render(<ErrorDisplay error={{ ...mockError, category: "rate_limit" }} />);
			expect(screen.getByText("Rate Limit")).toBeInTheDocument();
		});

		it("shows category label for auth_expired", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "auth_expired" }} />,
			);
			expect(screen.getByText("Authentication Required")).toBeInTheDocument();
		});

		it("shows category label for network_error", () => {
			render(
				<ErrorDisplay error={{ ...mockError, category: "network_error" }} />,
			);
			expect(screen.getByText("Network Error")).toBeInTheDocument();
		});
	});

	describe("custom className", () => {
		it("merges custom className with default classes", () => {
			render(<ErrorDisplay error={mockError} className="custom-class" />);
			const container = screen.getByTestId("error-display");
			expect(container).toHaveClass("custom-class");
		});
	});
});
