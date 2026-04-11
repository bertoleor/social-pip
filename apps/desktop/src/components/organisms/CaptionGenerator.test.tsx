import type { GenerateCaptionOutput, Platform } from "@social-pip/types";
// removed unused import
// removed unused import
import { CaptionGenerator } from "./CaptionGenerator";

const mockGenerateCaption = vi.fn();
const mockSetProvider = vi.fn();
const mockClearHistory = vi.fn();

vi.mock("../../hooks/useAI", () => ({
	useAI: () => ({
		loading: false,
		error: null,
		selectedProvider: "nim",
		generateCaption: mockGenerateCaption,
		setProvider: mockSetProvider,
		clearHistory: mockClearHistory,
	}),
}));

const mockCaptionOutput: GenerateCaptionOutput = {
	caption: "Generated caption for testing",
	hashtags: ["#test", "#example"],
	alternatives: ["Alternative 1", "Alternative 2"],
};

describe("CaptionGenerator", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("renders content input field", () => {
			render(<CaptionGenerator />);

			expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
		});

		it("renders platform selector", () => {
			render(<CaptionGenerator />);

			expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
		});

		it("renders tone selector", () => {
			render(<CaptionGenerator />);

			expect(screen.getByLabelText(/tone/i)).toBeInTheDocument();
		});

		it("renders generate button", () => {
			render(<CaptionGenerator />);

			expect(
				screen.getByRole("button", { name: /generate/i }),
			).toBeInTheDocument();
		});

		it("renders provider selector", () => {
			render(<CaptionGenerator />);

			expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
		});

		it("renders all platform options", () => {
			render(<CaptionGenerator />);

			const platformSelect = screen.getByLabelText(/platform/i);
			fireEvent.click(platformSelect);

			expect(screen.getByText("Facebook")).toBeInTheDocument();
			expect(screen.getByText("Instagram")).toBeInTheDocument();
			expect(screen.getByText("TikTok")).toBeInTheDocument();
			expect(screen.getByText("Twitter")).toBeInTheDocument();
			expect(screen.getByText("LinkedIn")).toBeInTheDocument();
		});

		it("renders all tone options", () => {
			render(<CaptionGenerator />);

			const toneSelect = screen.getByLabelText(/tone/i);
			fireEvent.click(toneSelect);

			expect(screen.getByText("Professional")).toBeInTheDocument();
			expect(screen.getByText("Casual")).toBeInTheDocument();
			expect(screen.getByText("Humorous")).toBeInTheDocument();
			expect(screen.getByText("Inspirational")).toBeInTheDocument();
		});
	});

	describe("interaction", () => {
		it("calls generateCaption with form values", async () => {
			mockGenerateCaption.mockResolvedValueOnce(mockCaptionOutput);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, {
				target: { value: "Test content for caption" },
			});

			const platformSelect = screen.getByLabelText(/platform/i);
			fireEvent.change(platformSelect, { target: { value: "instagram" } });

			const toneSelect = screen.getByLabelText(/tone/i);
			fireEvent.change(toneSelect, { target: { value: "casual" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(mockGenerateCaption).toHaveBeenCalledWith({
					content: "Test content for caption",
					platform: "instagram",
					tone: "casual",
					maxLength: expect.any(Number),
					includeHashtags: expect.any(Boolean),
				});
			});
		});

		it("disables generate button when content is empty", () => {
			render(<CaptionGenerator />);

			const generateButton = screen.getByRole("button", { name: /generate/i });
			expect(generateButton).toBeDisabled();
		});

		it("enables generate button when content is provided", () => {
			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Some content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			expect(generateButton).not.toBeDisabled();
		});

		it("shows loading state during generation", async () => {
			mockGenerateCaption.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100)),
			);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(screen.getByText(/generating/i)).toBeInTheDocument();
			});
		});

		it("displays generated caption after success", async () => {
			mockGenerateCaption.mockResolvedValueOnce(mockCaptionOutput);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(
					screen.getByText("Generated caption for testing"),
				).toBeInTheDocument();
			});
		});

		it("displays hashtags after generation", async () => {
			mockGenerateCaption.mockResolvedValueOnce(mockCaptionOutput);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(screen.getByText("#test")).toBeInTheDocument();
				expect(screen.getByText("#example")).toBeInTheDocument();
			});
		});

		it("displays alternatives after generation", async () => {
			mockGenerateCaption.mockResolvedValueOnce(mockCaptionOutput);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(screen.getByText("Alternative 1")).toBeInTheDocument();
				expect(screen.getByText("Alternative 2")).toBeInTheDocument();
			});
		});

		it("displays error message on failure", async () => {
			mockGenerateCaption.mockRejectedValueOnce(new Error("Generation failed"));

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
			});
		});

		it("calls setProvider when provider is changed", () => {
			render(<CaptionGenerator />);

			const providerSelect = screen.getByLabelText(/provider/i);
			fireEvent.change(providerSelect, { target: { value: "openai" } });

			expect(mockSetProvider).toHaveBeenCalledWith("openai");
		});

		it("allows copying generated caption", async () => {
			mockGenerateCaption.mockResolvedValueOnce(mockCaptionOutput);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /copy/i }),
				).toBeInTheDocument();
			});
		});
	});

	describe("accessibility", () => {
		it("has proper form labels", () => {
			render(<CaptionGenerator />);

			expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/tone/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
		});

		it("has proper ARIA attributes for loading state", async () => {
			mockGenerateCaption.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100)),
			);

			render(<CaptionGenerator />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(generateButton).toHaveAttribute("aria-busy", "true");
			});
		});
	});

	describe("props", () => {
		it("accepts initial platform prop", () => {
			render(<CaptionGenerator initialPlatform="instagram" />);

			const platformSelect = screen.getByLabelText(
				/platform/i,
			) as HTMLSelectElement;
			expect(platformSelect.value).toBe("instagram");
		});

		it("accepts onCaptionGenerated callback", async () => {
			const onCaptionGenerated = vi.fn();
			mockGenerateCaption.mockResolvedValueOnce(mockCaptionOutput);

			render(<CaptionGenerator onCaptionGenerated={onCaptionGenerated} />);

			const contentInput = screen.getByLabelText(/content/i);
			fireEvent.change(contentInput, { target: { value: "Test content" } });

			const generateButton = screen.getByRole("button", { name: /generate/i });
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(onCaptionGenerated).toHaveBeenCalledWith(mockCaptionOutput);
			});
		});

		it("accepts className prop", () => {
			render(<CaptionGenerator className="custom-class" />);

			const container = screen.getByTestId("caption-generator");
			expect(container).toHaveClass("custom-class");
		});
	});
});
