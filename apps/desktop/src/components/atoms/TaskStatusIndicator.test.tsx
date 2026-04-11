import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskStatusIndicator } from "./TaskStatusIndicator";

describe("TaskStatusIndicator", () => {
	describe("rendering", () => {
		it("renders pending status", () => {
			render(<TaskStatusIndicator status="pending" />);
			expect(screen.getByText("Pending")).toBeInTheDocument();
		});

		it("renders running status", () => {
			render(<TaskStatusIndicator status="running" />);
			expect(screen.getByText("Running")).toBeInTheDocument();
		});

		it("renders completed status", () => {
			render(<TaskStatusIndicator status="completed" />);
			expect(screen.getByText("Completed")).toBeInTheDocument();
		});

		it("renders failed status", () => {
			render(<TaskStatusIndicator status="failed" />);
			expect(screen.getByText("Failed")).toBeInTheDocument();
		});

		it("renders cancelled status", () => {
			render(<TaskStatusIndicator status="cancelled" />);
			expect(screen.getByText("Cancelled")).toBeInTheDocument();
		});
	});

	describe("variants", () => {
		it("pending uses neutral variant", () => {
			const { container } = render(<TaskStatusIndicator status="pending" />);
			expect(container.firstChild).toHaveClass("bg-gray-100");
		});

		it("running uses info variant", () => {
			const { container } = render(<TaskStatusIndicator status="running" />);
			expect(container.firstChild).toHaveClass("bg-blue-100");
		});

		it("completed uses success variant", () => {
			const { container } = render(<TaskStatusIndicator status="completed" />);
			expect(container.firstChild).toHaveClass("bg-green-100");
		});

		it("failed uses error variant", () => {
			const { container } = render(<TaskStatusIndicator status="failed" />);
			expect(container.firstChild).toHaveClass("bg-red-100");
		});

		it("cancelled uses warning variant", () => {
			const { container } = render(<TaskStatusIndicator status="cancelled" />);
			expect(container.firstChild).toHaveClass("bg-yellow-100");
		});
	});

	describe("custom className", () => {
		it("applies custom className", () => {
			const { container } = render(
				<TaskStatusIndicator status="pending" className="custom-class" />,
			);
			expect(container.firstChild).toHaveClass("custom-class");
		});

		it("preserves default classes with custom className", () => {
			const { container } = render(
				<TaskStatusIndicator status="completed" className="custom-class" />,
			);
			expect(container.firstChild).toHaveClass("custom-class");
			expect(container.firstChild).toHaveClass("bg-green-100");
		});
	});

	describe("accessibility", () => {
		it("renders as span element", () => {
			const { container } = render(<TaskStatusIndicator status="pending" />);
			expect(container.firstChild?.nodeName).toBe("SPAN");
		});

		it("has text-xs class for small text", () => {
			const { container } = render(<TaskStatusIndicator status="pending" />);
			expect(container.firstChild).toHaveClass("text-xs");
		});
	});
});
