import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
	describe("rendering", () => {
		it("renders children correctly", () => {
			render(<Card>Card content</Card>);
			expect(screen.getByText("Card content")).toBeInTheDocument();
		});

		it("renders as a div element", () => {
			render(<Card data-testid="card">Card</Card>);
			const card = screen.getByTestId("card");
			expect(card.tagName).toBe("DIV");
		});
	});

	describe("padding variants", () => {
		it("renders with no padding", () => {
			render(
				<Card padding="none" data-testid="card">
					No padding
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).not.toContain("p-");
		});

		it("renders with small padding", () => {
			render(
				<Card padding="sm" data-testid="card">
					Small
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("p-3");
		});

		it("renders with medium padding", () => {
			render(
				<Card padding="md" data-testid="card">
					Medium
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("p-4");
		});

		it("renders with large padding", () => {
			render(
				<Card padding="lg" data-testid="card">
					Large
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("p-6");
		});

		it("defaults to medium padding", () => {
			render(<Card data-testid="card">Default</Card>);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("p-4");
		});
	});

	describe("shadow variants", () => {
		it("renders with no shadow", () => {
			render(
				<Card shadow="none" data-testid="card">
					No shadow
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).not.toContain("shadow");
		});

		it("renders with small shadow", () => {
			render(
				<Card shadow="sm" data-testid="card">
					Small shadow
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("shadow-sm");
		});

		it("renders with medium shadow", () => {
			render(
				<Card shadow="md" data-testid="card">
					Medium shadow
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("shadow-md");
		});

		it("renders with large shadow", () => {
			render(
				<Card shadow="lg" data-testid="card">
					Large shadow
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("shadow-lg");
		});

		it("defaults to small shadow", () => {
			render(<Card data-testid="card">Default</Card>);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("shadow-sm");
		});
	});

	describe("base styling", () => {
		it("has white background", () => {
			render(<Card data-testid="card">Card</Card>);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("bg-white");
		});

		it("has rounded corners", () => {
			render(<Card data-testid="card">Card</Card>);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("rounded-lg");
		});

		it("has border", () => {
			render(<Card data-testid="card">Card</Card>);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("border");
		});
	});

	describe("custom className", () => {
		it("merges custom className with default classes", () => {
			render(
				<Card className="custom-card" data-testid="card">
					Custom
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveClass("custom-card");
			expect(card).toHaveClass("bg-white");
		});
	});
});
