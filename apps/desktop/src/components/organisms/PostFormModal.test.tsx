// removed unused import
// removed unused import
import { PostFormModal } from "./PostFormModal";

describe("PostFormModal", () => {
	const mockOnSubmit = vi.fn();
	const mockOnClose = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders create mode", () => {
		render(
			<PostFormModal
				accountId="account_1"
				onSubmit={mockOnSubmit}
				onClose={mockOnClose}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: "Create Post" }),
		).toBeInTheDocument();
	});

	it("renders edit mode with existing post", () => {
		const mockPost = {
			id: "post_1",
			content: "Existing content",
			mediaUrls: [],
			platform: "facebook" as const,
			status: "draft" as const,
			altCaptions: [],
			hashtags: .test,
			variance: 15,
			accountId: "account_1",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		render(
			<PostFormModal
				post={mockPost}
				onSubmit={mockOnSubmit}
				onClose={mockOnClose}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Edit Post" }),
		).toBeInTheDocument();
		expect(screen.getByDisplayValue("Existing content")).toBeInTheDocument();
	});

	it("calls onClose when X button clicked", () => {
		render(
			<PostFormModal
				accountId="account_1"
				onSubmit={mockOnSubmit}
				onClose={mockOnClose}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Close"));
		expect(mockOnClose).toHaveBeenCalled();
	});

	it("submits form with correct data", async () => {
		mockOnSubmit.mockResolvedValueOnce(undefined);

		render(
			<PostFormModal
				accountId="account_1"
				onSubmit={mockOnSubmit}
				onClose={mockOnClose}
			/>,
		);

		fireEvent.change(screen.getByLabelText(/Content/i), {
			target: { value: "New post content" },
		});

		fireEvent.change(screen.getByLabelText(/Hashtags/i), {
			target: { value: "marketing, social" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Create Post" }));

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					content: "New post content",
					hashtags: ["marketing", "social"],
					platform: "facebook",
					status: "draft",
				}),
			);
		});
	});

	it("shows scheduled date input when scheduled status selected", () => {
		render(
			<PostFormModal
				accountId="account_1"
				onSubmit={mockOnSubmit}
				onClose={mockOnClose}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Scheduled" }));

		expect(screen.getByLabelText(/Scheduled Date/i)).toBeInTheDocument();
	});
});
