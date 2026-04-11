import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
	describe("rendering", () => {
		it("renders children correctly", () => {
			render(<Badge>Active</Badge>);
			expect(screen.getByText("Active")).toBeInTheDocument();
		});

		it("renders as a span element", () => {
			render(<Badge>Badge</Badge>);
			const badge = screen.getByText("Badge");
			expect(badge.tagName).toBe("SPAN");
		});
	});

	describe("status variants", () => {
		it("renders success variant with green color", () => {
			render(<Badge variant="success">Success</Badge>);
			const badge = screen.getByText("Success");
			expect(badge).toHaveClass("bg-green-100");
			expect(badge).toHaveClass("text-green-700");
		});

		it("renders warning variant with yellow color", () => {
			render(<Badge variant="warning">Warning</Badge>);
			const badge = screen.getByText("Warning");
			expect(badge).toHaveClass("bg-yellow-100");
			expect(badge).toHaveClass("text-yellow-700");
		});

		it("renders error variant with red color", () => {
			render(<Badge variant="error">Error</Badge>);
			const badge = screen.getByText("Error");
			expect(badge).toHaveClass("bg-red-100");
			expect(badge).toHaveClass("text-red-700");
		});

		it("renders info variant with blue color", () => {
			render(<Badge variant="info">Info</Badge>);
			const badge = screen.getByText("Info");
			expect(badge).toHaveClass("bg-blue-100");
			expect(badge).toHaveClass("text-blue-700");
		});

		it("renders neutral variant with gray color", () => {
			render(<Badge variant="neutral">Neutral</Badge>);
			const badge = screen.getByText("Neutral");
			expect(badge).toHaveClass("bg-gray-100");
			expect(badge).toHaveClass("text-gray-700");
		});

		it("defaults to neutral variant", () => {
			render(<Badge>Default</Badge>);
			const badge = screen.getByText("Default");
			expect(badge).toHaveClass("bg-gray-100");
		});
	});

	describe("sizes", () => {
		it("renders small size", () => {
			render(<Badge size="sm">Small</Badge>);
			const badge = screen.getByText("Small");
			expect(badge).toHaveClass("px-2");
			expect(badge).toHaveClass("py-0.5");
			expect(badge).toHaveClass("text-xs");
		});

		it("renders medium size", () => {
			render(<Badge size="md">Medium</Badge>);
			const badge = screen.getByText("Medium");
			expect(badge).toHaveClass("px-2.5");
			expect(badge).toHaveClass("py-1");
			expect(badge).toHaveClass("text-sm");
		});

		it("defaults to medium size", () => {
			render(<Badge>Default</Badge>);
			const badge = screen.getByText("Default");
			expect(badge).toHaveClass("px-2.5");
		});
	});

	describe("custom className", () => {
		it("merges custom className with default classes", () => {
			render(<Badge className="custom-badge">Custom</Badge>);
			const badge = screen.getByText("Custom");
			expect(badge).toHaveClass("custom-badge");
			expect(badge).toHaveClass("bg-gray-100"); // still has default
		});
	});
});
