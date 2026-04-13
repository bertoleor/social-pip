import type { Post } from "@social-pip/types";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostPreview } from "./PostPreview";

const mockPost: Post = {
	id: "post_1",
	content:
		"This is a test post content for preview. Check out our amazing product!",
	mediaUrls: ["https://example.com/image.jpg"],
	platform: "facebook",
	status: "draft",
	altCaptions: [],
	hashtags: ["marketing", "product"],
	variance: 15,
	accountId: "account_1",
	createdAt: new Date("2026-04-10T10:00:00Z"),
	updatedAt: new Date("2026-04-10T10:00:00Z"),
};

const mockScheduledPost: Post = {
	id: "post_2",
	content: "Scheduled post content",
	mediaUrls: [],
	platform: "instagram",
	status: "scheduled",
	scheduledAt: new Date("2026-04-15T14:30:00Z"),
	altCaptions: [],
	hashtags: [],
	variance: 15,
	accountId: "account_1",
	createdAt: new Date("2026-04-10T10:00:00Z"),
	updatedAt: new Date("2026-04-10T10:00:00Z"),
};

describe("PostPreview", () => {
	it("renders post content", () => {
		render(<PostPreview post={mockPost} />);

		expect(
			screen.getByText(/This is a test post content/i),
		).toBeInTheDocument();
	});

	it("renders platform icon", () => {
		render(<PostPreview post={mockPost} />);

		expect(screen.getByLabelText("facebook icon")).toBeInTheDocument();
	});

	it("renders status badge", () => {
		render(<PostPreview post={mockPost} />);

		expect(screen.getByText("Draft")).toBeInTheDocument();
	});

	it("renders hashtags", () => {
		render(<PostPreview post={mockPost} />);

		expect(screen.getByText("#marketing")).toBeInTheDocument();
		expect(screen.getByText("#product")).toBeInTheDocument();
	});

	it("renders media preview when available", () => {
		render(<PostPreview post={mockPost} />);

		expect(screen.getByRole("img")).toBeInTheDocument();
	});

	it("renders scheduled date for scheduled posts", () => {
		render(<PostPreview post={mockScheduledPost} />);

		expect(screen.getByText(/Apr.*15/)).toBeInTheDocument();
	});

	it("renders character count", () => {
		render(<PostPreview post={mockPost} />);

		expect(screen.getByText(/characters/i)).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<PostPreview post={mockPost} className="custom-preview" />,
		);

		expect(container.firstChild).toHaveClass("custom-preview");
	});

	it("renders empty state when no post provided", () => {
		render(<PostPreview />);

		expect(screen.getByText("No post to preview")).toBeInTheDocument();
	});
});
