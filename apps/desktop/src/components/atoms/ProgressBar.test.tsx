// removed unused import
// removed unused import
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
	describe("rendering", () => {
		it("renders with default props", () => {
			render(<ProgressBar value={50} />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toBeInTheDocument();
		});

		it("renders with custom max value", () => {
			render(<ProgressBar value={5} max={10} />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveAttribute("aria-valuenow", "50");
		});

		it("shows label when showLabel is true", () => {
			render(<ProgressBar value={75} showLabel />);
			expect(screen.getByText("75%")).toBeInTheDocument();
		});

		it("hides label by default", () => {
			render(<ProgressBar value={75} />);
			expect(screen.queryByText("75%")).not.toBeInTheDocument();
		});
	});

	describe("sizes", () => {
		it("renders small size", () => {
			render(<ProgressBar value={50} size="sm" />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveClass("h-1");
		});

		it("renders medium size by default", () => {
			render(<ProgressBar value={50} />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveClass("h-2");
		});

		it("renders large size", () => {
			render(<ProgressBar value={50} size="lg" />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveClass("h-3");
		});
	});

	describe("variants", () => {
		it("renders default variant", () => {
			render(<ProgressBar value={50} variant="default" />);
			const fill = document.querySelector(".bg-primary");
			expect(fill).toBeInTheDocument();
		});

		it("renders success variant", () => {
			render(<ProgressBar value={50} variant="success" />);
			const fill = document.querySelector(".bg-green-500");
			expect(fill).toBeInTheDocument();
		});

		it("renders warning variant", () => {
			render(<ProgressBar value={50} variant="warning" />);
			const fill = document.querySelector(".bg-yellow-500");
			expect(fill).toBeInTheDocument();
		});

		it("renders error variant", () => {
			render(<ProgressBar value={50} variant="error" />);
			const fill = document.querySelector(".bg-red-500");
			expect(fill).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has correct aria attributes", () => {
			render(<ProgressBar value={75} max={100} />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveAttribute("aria-valuenow", "75");
			expect(progressBar).toHaveAttribute("aria-valuemin", "0");
			expect(progressBar).toHaveAttribute("aria-valuemax", "100");
		});

		it("calculates percentage from max value", () => {
			render(<ProgressBar value={25} max={50} />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveAttribute("aria-valuenow", "50");
		});

		it("caps value at max", () => {
			render(<ProgressBar value={150} max={100} />);
			const progressBar = document.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveAttribute("aria-valuenow", "100");
		});
	});

	describe("custom className", () => {
		it("merges custom className", () => {
			render(<ProgressBar value={50} className="custom-progress" />);
			const container = document.querySelector(".custom-progress");
			expect(container).toBeInTheDocument();
		});
	});

	describe("animation", () => {
		it("has transition classes for animation", () => {
			render(<ProgressBar value={50} />);
			const fill = document.querySelector(".transition-all");
			expect(fill).toBeInTheDocument();
		});
	});
});
