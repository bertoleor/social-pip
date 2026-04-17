import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaUploadButton } from "./MediaUploadButton";

const mockOpenFilePicker = vi.fn();

vi.mock("../../hooks/useMediaUpload", () => ({
  useMediaUpload: () => ({
    openFilePicker: mockOpenFilePicker,
    isUploading: false,
    error: null,
    constraints: null,
  }),
}));

describe("MediaUploadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders button with upload icon", () => {
      render(<MediaUploadButton platform="facebook" />);

      expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<MediaUploadButton platform="facebook" className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("interaction", () => {
    it("calls openFilePicker on click", async () => {
      const user = userEvent.setup();
      render(<MediaUploadButton platform="facebook" />);

      await user.click(screen.getByRole("button"));

      expect(mockOpenFilePicker).toHaveBeenCalledTimes(1);
    });

    it("does not call openFilePicker when disabled", async () => {
      const user = userEvent.setup();
      render(<MediaUploadButton platform="facebook" disabled />);

      await user.click(screen.getByRole("button"));

      expect(mockOpenFilePicker).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has correct aria-label", () => {
      render(<MediaUploadButton platform="facebook" />);

      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Upload image");
    });

    it("is disabled when disabled prop is true", () => {
      render(<MediaUploadButton platform="facebook" disabled />);

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
