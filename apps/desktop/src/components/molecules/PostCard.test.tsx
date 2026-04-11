import type { Post } from "@social-pip/types";
// removed unused import
// removed unused import
import { PostCard } from "./PostCard";

const mockPost: Post = {
	id: "post_1",
	content: "Test post content for display",
	mediaUrls: [],
	platform: "facebook",
	status: "draft",
	altCaptions: [],
	hashtags: ["test", "post"],
	variance: 15,
	accountId: "account_1",
	createdAt: new Date("2026-04-10T10:00:00Z"),
	updatedAt: new Date("2026-04-10T10:00:00Z"),
};

describe("PostCard", () => {
	it("renders post content", () => {
		render(<PostCard post={mockPost} />);
		expect(
			screen.getByText("Test post content for display"),
		).toBeInTheDocument();
	});

	it("renders platform icon", () => {
		render(<PostCard post={mockPost} />);
		expect(screen.getByLabelText("facebook icon")).toBeInTheDocument();
	});

	it("renders status badge", () => {
		render(<PostCard post={mockPost} />);
		expect(screen.getByText("Draft")).toBeInTheDocument();
	});

	it("renders hashtags", () => {
		render(<PostCard post={mockPost} />);
		expect(screen.getByText("#test")).toBeInTheDocument();
		expect(screen.getByText("#post")).toBeInTheDocument();
	});

	it("truncates long content", () => {
		const longPost = {
			...mockPost,
			content: "A".repeat(150),
		};
		render(<PostCard post={longPost} />);
		expect(screen.getByText(`${"A".repeat(100)}...`)).toBeInTheDocument();
	});

	it("calls onClick when card is clicked", () => {
		const onClick = vi.fn();
		render(<PostCard post={mockPost} onClick={onClick} />);
		fireEvent.click(screen.getByText("Test post content for display"));
		expect(onClick).toHaveBeenCalledWith("post_1");
	});

	it("calls onEdit when edit button is clicked", () => {
		const onEdit = vi.fn();
		render(<PostCard post={mockPost} onEdit={onEdit} />);
		fireEvent.click(screen.getByLabelText("Edit post"));
		expect(onEdit).toHaveBeenCalledWith("post_1");
	});

	it("calls onDelete when delete button is clicked", () => {
		const onDelete = vi.fn();
		render(<PostCard post={mockPost} onDelete={onDelete} />);
		fireEvent.click(screen.getByLabelText("Delete post"));
		expect(onDelete).toHaveBeenCalledWith("post_1");
	});

	it("shows scheduled date", () => {
		const scheduledPost = {
			...mockPost,
			status: "scheduled" as const,
			scheduledAt: new Date("2026-04-15T14:30:00Z"),
		};
		render(<PostCard post={scheduledPost} />);
		expect(screen.getByText(/Apr.*15/)).toBeInTheDocument();
	});

	it("shows error message for failed posts", () => {
		const failedPost = {
			...mockPost,
			status: "failed" as const,
			errorMessage: "Network timeout",
		};
		render(<PostCard post={failedPost} />);
		expect(screen.getByText("Network timeout")).toBeInTheDocument();
	});
});
