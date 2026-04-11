import { render, screen } from "@testing-library/react";
/**
 * @fileoverview Schedule page tests
 */
import { describe, expect, it } from "vitest";
import SchedulePage from "./SchedulePage";

describe("SchedulePage", () => {
	describe("rendering", () => {
		it("renders the page container", () => {
			render(<SchedulePage />);

			expect(screen.getByTestId("page-schedule")).toBeInTheDocument();
		});

		it("renders the page title", () => {
			render(<SchedulePage />);

			expect(
				screen.getByRole("heading", { name: "Schedule" }),
			).toBeInTheDocument();
		});

		it("renders description", () => {
			render(<SchedulePage />);

			expect(
				screen.getByText(/view and manage your scheduled posts/i),
			).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has proper heading structure", () => {
			render(<SchedulePage />);

			const heading = screen.getByRole("heading", { level: 1 });
			expect(heading).toHaveTextContent("Schedule");
		});
	});
});
