import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaPreview } from "./MediaPreview";

const mockRemoveMediaFile = vi.fn();

const mockMediaFiles = [
  {
    id: "test-1",
    path: "/path/1.jpg",
    fileName: "image1.jpg",
    fileSize: 1024 * 1024,
    format: "jpg" as const,
    dimensions: { width: 1080, height: 1080 },
    thumbnailUrl: "blob:test1",
    validationStatus: "valid" as const,
  },
  {
    id: "test-2",
    path: "/path/2.jpg",
    fileName: "image2.jpg",
    fileSize: 2 * 1024 * 1024,
    format: "png" as const,
    dimensions: { width: 800, height: 600 },
    thumbnailUrl: "blob:test2",
    validationStatus: "invalid" as const,
  },
];

vi.mock("../../stores/postingStore", () => ({
  usePostingStore: vi.fn(),
}));

import { usePostingStore } from "../../stores/postingStore";

describe("MediaPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePostingStore).mockImplementation((selector) => {
      const state = {
        mediaFiles: mockMediaFiles,
        mediaValidation: new Map([
          ["test-1", { valid: true, errors: [] }],
          ["test-2", { valid: false, errors: [{ code: "SIZE_EXCEEDED", message: "Too large" }] }],
        ]),
        removeMediaFile: mockRemoveMediaFile,
      };
      if (typeof selector === "function") {
        return selector(state);
      }
      return state;
    });
  });

  describe("rendering", () => {
    it("renders grid of thumbnails", () => {
      render(<MediaPreview />);

      expect(screen.getByRole("img", { name: "image1.jpg" })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "image2.jpg" })).toBeInTheDocument();
    });

    it("shows validation status for each file", () => {
      render(<MediaPreview />);

      expect(screen.getByText("Valid")).toBeInTheDocument();
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("removes file when remove button clicked", async () => {
      const user = userEvent.setup();
      render(<MediaPreview />);

      await user.click(screen.getByRole("button", { name: /remove image1.jpg/i }));

      expect(mockRemoveMediaFile).toHaveBeenCalledWith("test-1");
    });
  });

  describe("empty state", () => {
    it("renders nothing when no files", () => {
      vi.mocked(usePostingStore).mockImplementation((selector) => {
        const state = {
          mediaFiles: [],
          mediaValidation: new Map(),
          removeMediaFile: mockRemoveMediaFile,
        };
        if (typeof selector === "function") {
          return selector(state);
        }
        return state;
      });

      const { container } = render(<MediaPreview />);

      expect(container.firstChild).toBeNull();
    });
  });
});
