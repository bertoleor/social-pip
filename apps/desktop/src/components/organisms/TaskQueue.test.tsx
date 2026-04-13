import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Platform, Task, TaskStatus } from "@social-pip/types";
import { TaskQueue } from "./TaskQueue";

const mockTask: Task = {
	id: "task_001",
	type: "post",
	platform: "facebook" as Platform,
	accountId: "acc_001",
	status: "pending" as TaskStatus,
	priority: 1,
	retryCount: 0,
	maxRetries: 3,
	createdAt: new Date("2026-04-11T10:00:00Z"),
	updatedAt: new Date("2026-04-11T10:00:00Z"),
};

const mockTasks: Task[] = [
	mockTask,
	{
		...mockTask,
		id: "task_002",
		status: "running" as TaskStatus,
		createdAt: new Date("2026-04-11T09:00:00Z"),
	},
	{
		...mockTask,
		id: "task_003",
		status: "completed" as TaskStatus,
		createdAt: new Date("2026-04-11T08:00:00Z"),
	},
	{
		...mockTask,
		id: "task_004",
		status: "failed" as TaskStatus,
		errorMessage: "Network timeout",
		createdAt: new Date("2026-04-11T07:00:00Z"),
	},
];

describe("TaskQueue", () => {
	describe("rendering", () => {
		it("renders all tasks", () => {
			render(<TaskQueue tasks={mockTasks} />);
			expect(screen.getAllByText("post").length).toBe(4);
			expect(screen.getByText("Network timeout")).toBeInTheDocument();
		});

		it("renders loading state", () => {
			const { container } = render(<TaskQueue tasks={[]} loading={true} />);
			const skeletons = container.querySelectorAll(".animate-pulse");
			expect(skeletons.length).toBeGreaterThan(0);
		});

		it("renders empty state when no tasks", () => {
			render(<TaskQueue tasks={[]} />);
			expect(screen.getByText("No tasks in queue")).toBeInTheDocument();
			expect(
				screen.getByText("Tasks will appear here when scheduled"),
			).toBeInTheDocument();
		});

		it("displays task count", () => {
			render(<TaskQueue tasks={mockTasks} />);
			expect(screen.getByText("4 tasks")).toBeInTheDocument();
		});

		it("displays singular task count", () => {
			render(<TaskQueue tasks={[mockTask]} />);
			expect(screen.getByText("1 task")).toBeInTheDocument();
		});
	});

	describe("filtering", () => {
		it("filters by status", () => {
			render(<TaskQueue tasks={mockTasks} />);

			const statusSelect = screen.getByLabelText("Filter by status");
			fireEvent.change(statusSelect, { target: { value: "pending" } });

			const pendingBadges = screen.getAllByText("Pending");
			expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
		});

		it("shows all tasks when filter is all", () => {
			render(<TaskQueue tasks={mockTasks} />);

			const statusSelect = screen.getByLabelText("Filter by status");
			fireEvent.change(statusSelect, { target: { value: "all" } });

			const pendingBadges = screen.getAllByText("Pending");
			expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
		});

		it("shows no results message when filtered", () => {
			render(<TaskQueue tasks={[mockTask]} />);

			const statusSelect = screen.getByLabelText("Filter by status");
			fireEvent.change(statusSelect, { target: { value: "failed" } });

			expect(
				screen.getByText("No tasks match your filter"),
			).toBeInTheDocument();
		});
	});

	describe("task actions", () => {
		it("calls onCancel when cancel button clicked", () => {
			const onCancel = vi.fn();
			render(<TaskQueue tasks={[mockTask]} onCancel={onCancel} />);

			const cancelButton = screen.getByLabelText("Cancel task");
			fireEvent.click(cancelButton);

			expect(onCancel).toHaveBeenCalledWith("task_001");
		});

		it("calls onRetry when retry button clicked on failed task", () => {
			const onRetry = vi.fn();
			render(<TaskQueue tasks={[mockTasks[3]]} onRetry={onRetry} />);

			const retryButton = screen.getByLabelText("Retry task");
			fireEvent.click(retryButton);

			expect(onRetry).toHaveBeenCalledWith("task_004");
		});

		it("calls onSelect when task card is clicked", () => {
			const onSelect = vi.fn();
			render(<TaskQueue tasks={[mockTask]} onSelect={onSelect} />);

			const taskCard = screen.getByRole("button", { name: /post/i });
			fireEvent.click(taskCard);

			expect(onSelect).toHaveBeenCalledWith("task_001");
		});

		it("shows cancel button for pending and running tasks", () => {
			render(<TaskQueue tasks={[mockTasks[0], mockTasks[1]]} />);

			expect(screen.getAllByLabelText("Cancel task")).toHaveLength(2);
		});

		it("shows retry button for failed tasks", () => {
			render(<TaskQueue tasks={[mockTasks[3]]} onRetry={vi.fn()} />);

			expect(screen.getByLabelText("Retry task")).toBeInTheDocument();
		});
	});

	describe("selection", () => {
		it("highlights selected task", () => {
			const { container } = render(
				<TaskQueue tasks={[mockTask]} selectedId="task_001" />,
			);

			expect(container.querySelector(".border-primary")).toBeInTheDocument();
		});

		it("does not highlight unselected tasks", () => {
			const { container } = render(
				<TaskQueue tasks={[mockTask]} selectedId="other_id" />,
			);

			expect(container.querySelector(".border-gray-200")).toBeInTheDocument();
		});
	});

	describe("error display", () => {
		it("shows error message for failed tasks", () => {
			render(<TaskQueue tasks={[mockTasks[3]]} />);

			expect(screen.getByText("Network timeout")).toBeInTheDocument();
		});

		it("does not show error for non-failed tasks", () => {
			render(<TaskQueue tasks={[mockTask]} />);

			expect(screen.queryByText("Network timeout")).not.toBeInTheDocument();
		});
	});

	describe("running state", () => {
		it("shows processing indicator for running tasks", () => {
			render(<TaskQueue tasks={[mockTasks[1]]} />);

			expect(screen.getByText("Processing...")).toBeInTheDocument();
		});

		it("does not show processing for non-running tasks", () => {
			render(<TaskQueue tasks={[mockTask]} />);

			expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has filter select with proper label", () => {
			render(<TaskQueue tasks={mockTasks} />);
			expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
		});

		it("task cards are keyboard navigable", () => {
			const onSelect = vi.fn();
			render(<TaskQueue tasks={[mockTask]} onSelect={onSelect} />);

			const taskCard = screen.getByRole("button", { name: /post/i });
			fireEvent.keyDown(taskCard, { key: "Enter" });

			expect(onSelect).toHaveBeenCalled();
		});
	});
});
