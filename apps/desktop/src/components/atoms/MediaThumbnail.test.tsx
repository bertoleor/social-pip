import { render, screen } from "@testing-library/react"
import { MediaThumbnail } from "./MediaThumbnail"

const defaultProps = {
	id: "test-id",
	thumbnailUrl: "blob:test",
	fileName: "test-image.jpg",
	onRemove: vi.fn(),
}

describe("MediaThumbnail", () => {
	describe("rendering", () => {
		it("renders image with src", () => {
			render(<MediaThumbnail {...defaultProps} />)

			const img = screen.getByRole("img")
			expect(img).toHaveAttribute("src", "blob:test")
		})

		it("renders file name as alt text", () => {
			render(<MediaThumbnail {...defaultProps} />)

			const img = screen.getByRole("img")
			expect(img).toHaveAttribute("alt", "test-image.jpg")
		})

		it("shows remove button on hover", () => {
			render(<MediaThumbnail {...defaultProps} />)

			expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument()
		})
	})

	describe("interaction", () => {
		it("calls onRemove when remove button clicked", async () => {
			const user = (await import("@testing-library/user-event")).userEvent.setup()
			const onRemove = vi.fn()
			render(<MediaThumbnail {...defaultProps} onRemove={onRemove} />)

			await user.click(screen.getByRole("button", { name: /remove/i }))

			expect(onRemove).toHaveBeenCalledWith("test-id")
		})
	})

	describe("accessibility", () => {
		it("has accessible remove button", () => {
			render(<MediaThumbnail {...defaultProps} />)

			expect(screen.getByRole("button", { name: /remove test-image.jpg/i })).toBeInTheDocument()
		})
	})
})
