import { render, screen } from "@testing-library/react";
/**
 * @fileoverview Settings page tests
 */
import { describe, expect, it } from "vitest";
import SettingsPage from "./SettingsPage";

describe("SettingsPage", () => {
	describe("rendering", () => {
		it("renders the page container", () => {
			render(<SettingsPage />);

			expect(screen.getByTestId("page-settings")).toBeInTheDocument();
		});

		it("renders the page title", () => {
			render(<SettingsPage />);

			expect(
				screen.getByRole("heading", { name: "Settings" }),
			).toBeInTheDocument();
		});

		it("renders description", () => {
			render(<SettingsPage />);

			expect(
				screen.getByText(/configure application settings and preferences/i),
			).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has proper heading structure", () => {
			render(<SettingsPage />);

			const heading = screen.getByRole("heading", { level: 1 });
			expect(heading).toHaveTextContent("Settings");
		});
	});
});
