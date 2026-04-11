import { render, screen } from "@testing-library/react";
/**
 * @fileoverview Analytics page tests
 */
import { describe, expect, it } from "vitest";
import AnalyticsPage from "./AnalyticsPage";

describe("AnalyticsPage", () => {
	describe("rendering", () => {
		it("renders the page container", () => {
			render(<AnalyticsPage />);

			expect(screen.getByTestId("page-analytics")).toBeInTheDocument();
		});

		it("renders the page title", () => {
			render(<AnalyticsPage />);

			expect(
				screen.getByRole("heading", { name: "Analytics" }),
			).toBeInTheDocument();
		});

		it("renders description", () => {
			render(<AnalyticsPage />);

			expect(
				screen.getByText(/view performance metrics and insights/i),
			).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has proper heading structure", () => {
			render(<AnalyticsPage />);

			const heading = screen.getByRole("heading", { level: 1 });
			expect(heading).toHaveTextContent("Analytics");
		});
	});
});
