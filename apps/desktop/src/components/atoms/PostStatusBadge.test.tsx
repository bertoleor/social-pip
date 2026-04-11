import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostStatusBadge } from "./PostStatusBadge";

describe("PostStatusBadge", () => {
	it("renders draft status", () => {
		render(<PostStatusBadge status="draft" />);
		expect(screen.getByText("Draft")).toBeInTheDocument();
	});

	it("renders scheduled status", () => {
		render(<PostStatusBadge status="scheduled" />);
		expect(screen.getByText("Scheduled")).toBeInTheDocument();
	});

	it("renders published status", () => {
		render(<PostStatusBadge status="published" />);
		expect(screen.getByText("Published")).toBeInTheDocument();
	});

	it("renders failed status", () => {
		render(<PostStatusBadge status="failed" />);
		expect(screen.getByText("Failed")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<PostStatusBadge status="draft" className="custom-class" />,
		);
		expect(container.firstChild).toHaveClass("custom-class");
	});
});
