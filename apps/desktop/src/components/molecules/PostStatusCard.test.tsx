import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type PostJobStatus, PostStatusCard } from "./PostStatusCard";

describe("PostStatusCard", () => {
	const mockJob = {
		id: "job-1",
		groupName: "Test Group",
		status: "success" as PostJobStatus,
		duration: 5000,
		postUrl: "https://facebook.com/posts/123",
	};

	describe("rendering", () => {
		it("renders group name", () => {
			render(<PostStatusCard job={mockJob} />);
			expect(screen.getByText("Test Group")).toBeInTheDocument();
		});

		it("renders as a card element", () => {
			render(<PostStatusCard job={mockJob} />);
			const card = screen.getByTestId("post-status-card");
			expect(card).toBeInTheDocument();
		});
	});

	describe("status icons", () => {
		it("shows clock icon for pending status", () => {
			render(<PostStatusCard job={{ ...mockJob, status: "pending" }} />);
			expect(screen.getByTestId("status-icon-pending")).toBeInTheDocument();
		});

		it("shows spinner icon for posting status", () => {
			render(<PostStatusCard job={{ ...mockJob, status: "posting" }} />);
			expect(screen.getByTestId("status-icon-posting")).toBeInTheDocument();
		});

		it("shows check icon for success status", () => {
			render(<PostStatusCard job={{ ...mockJob, status: "success" }} />);
			expect(screen.getByTestId("status-icon-success")).toBeInTheDocument();
		});

		it("shows x icon for failed status", () => {
			render(<PostStatusCard job={{ ...mockJob, status: "failed" }} />);
			expect(screen.getByTestId("status-icon-failed")).toBeInTheDocument();
		});

		it("shows minus icon for skipped status", () => {
			render(<PostStatusCard job={{ ...mockJob, status: "skipped" }} />);
			expect(screen.getByTestId("status-icon-skipped")).toBeInTheDocument();
		});
	});

	describe("duration display", () => {
		it("shows duration when complete with success", () => {
			render(<PostStatusCard job={mockJob} />);
			expect(screen.getByText("5.0s")).toBeInTheDocument();
		});

		it("shows duration when complete with failure", () => {
			render(
				<PostStatusCard
					job={{ ...mockJob, status: "failed", duration: 3000 }}
				/>,
			);
			expect(screen.getByText("3.0s")).toBeInTheDocument();
		});

		it("does not show duration when pending", () => {
			render(
				<PostStatusCard
					job={{ ...mockJob, status: "pending", duration: undefined }}
				/>,
			);
			expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
		});
	});

	describe("post URL link", () => {
		it("shows link to post on success", () => {
			render(<PostStatusCard job={mockJob} />);
			const link = screen.getByRole("link", { name: /view post/i });
			expect(link).toHaveAttribute("href", "https://facebook.com/posts/123");
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		});

		it("does not show link when no postUrl", () => {
			render(<PostStatusCard job={{ ...mockJob, postUrl: undefined }} />);
			expect(screen.queryByRole("link")).not.toBeInTheDocument();
		});
	});

	describe("error display", () => {
		it("shows error message on failure", () => {
			render(
				<PostStatusCard
					job={{
						...mockJob,
						status: "failed",
						error: {
							category: "rate_limit",
							message: "Rate limit exceeded",
							retryable: true,
						},
					}}
				/>,
			);
			expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
		});

		it("does not show error when no error", () => {
			render(<PostStatusCard job={mockJob} />);
			expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
		});
	});

	describe("retry button", () => {
		it("shows retry button when retryable error and onRetry provided", async () => {
			const handleRetry = vi.fn();
			const user = userEvent.setup();
			render(
				<PostStatusCard
					job={{
						...mockJob,
						status: "failed",
						error: {
							category: "rate_limit",
							message: "Rate limit exceeded",
							retryable: true,
						},
					}}
					onRetry={handleRetry}
				/>,
			);

			const retryButton = screen.getByRole("button", { name: /retry/i });
			expect(retryButton).toBeInTheDocument();

			await user.click(retryButton);
			expect(handleRetry).toHaveBeenCalledWith("job-1");
		});

		it("does not show retry button when error not retryable", () => {
			render(
				<PostStatusCard
					job={{
						...mockJob,
						status: "failed",
						error: {
							category: "auth_expired",
							message: "Authentication expired",
							retryable: false,
						},
					}}
					onRetry={vi.fn()}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: /retry/i }),
			).not.toBeInTheDocument();
		});

		it("does not show retry button when onRetry not provided", () => {
			render(
				<PostStatusCard
					job={{
						...mockJob,
						status: "failed",
						error: {
							category: "rate_limit",
							message: "Rate limit exceeded",
							retryable: true,
						},
					}}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: /retry/i }),
			).not.toBeInTheDocument();
		});
	});

	describe("retry count", () => {
		it("shows retry count when present", () => {
			render(<PostStatusCard job={{ ...mockJob, retryCount: 2 }} />);
			expect(screen.getByText(/retry 2/i)).toBeInTheDocument();
		});

		it("does not show retry count when zero", () => {
			render(<PostStatusCard job={{ ...mockJob, retryCount: 0 }} />);
			expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
		});
	});

	describe("custom className", () => {
		it("merges custom className with default classes", () => {
			render(<PostStatusCard job={mockJob} className="custom-class" />);
			const card = screen.getByTestId("post-status-card");
			expect(card).toHaveClass("custom-class");
		});
	});
});
