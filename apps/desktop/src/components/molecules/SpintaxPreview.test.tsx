// removed unused import
// removed unused import
import { SpintaxPreview } from "./SpintaxPreview";

describe("SpintaxPreview", () => {
	describe("rendering", () => {
		it("renders content preview", () => {
			render(<SpintaxPreview content="Hello World" variationsCount={1} />);
			expect(screen.getByText("Hello World")).toBeInTheDocument();
		});

		it("shows variation count badge", () => {
			render(<SpintaxPreview content="{Hello|Hi} World" variationsCount={2} />);
			expect(screen.getByText("2 variations")).toBeInTheDocument();
		});

		it("shows singular variation count", () => {
			render(<SpintaxPreview content="Hello World" variationsCount={1} />);
			expect(screen.getByText("1 variation")).toBeInTheDocument();
		});
	});

	describe("cycle variation button", () => {
		it('shows "New Variation" button when variationsCount > 1', () => {
			render(<SpintaxPreview content="{Hello|Hi}" variationsCount={2} />);
			expect(screen.getByText("New Variation")).toBeInTheDocument();
		});

		it('hides "New Variation" button when variationsCount is 1', () => {
			render(<SpintaxPreview content="Hello World" variationsCount={1} />);
			expect(screen.queryByText("New Variation")).not.toBeInTheDocument();
		});

		it("calls onCycleVariation when button clicked", () => {
			const onCycleVariation = vi.fn();
			render(
				<SpintaxPreview
					content="{Hello|Hi}"
					variationsCount={2}
					onCycleVariation={onCycleVariation}
				/>,
			);

			fireEvent.click(screen.getByText("New Variation"));
			expect(onCycleVariation).toHaveBeenCalledTimes(1);
		});
	});

	describe("preview display", () => {
		it("shows content with proper styling", () => {
			render(<SpintaxPreview content="Test content" variationsCount={1} />);
			const contentArea = screen.getByText("Test content");
			expect(contentArea.tagName).toBe("P");
		});

		it("truncates long content", () => {
			const longContent = "A".repeat(500);
			render(<SpintaxPreview content={longContent} variationsCount={1} />);
			const contentArea = screen.getByText(longContent);
			expect(contentArea).toHaveClass("line-clamp-3");
		});
	});

	describe("custom className", () => {
		it("merges custom className", () => {
			render(
				<SpintaxPreview
					content="Test"
					variationsCount={1}
					className="custom-preview"
				/>,
			);
			const container = document.querySelector(".custom-preview");
			expect(container).toBeInTheDocument();
		});
	});

	describe("empty state", () => {
		it("shows placeholder when no content", () => {
			render(<SpintaxPreview content="" variationsCount={0} />);
			expect(screen.getByText("No content to preview")).toBeInTheDocument();
		});
	});
});
