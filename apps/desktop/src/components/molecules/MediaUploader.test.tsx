import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { MediaUploader } from "./MediaUploader"
import { usePostingStore } from "../../stores/postingStore"

vi.mock("../../stores/postingStore", () => ({
  usePostingStore: vi.fn(),
}))

const mockOpenFilePicker = vi.fn()
const mockClearMedia = vi.fn()

vi.mock("../../hooks/useMediaUpload", () => ({
  useMediaUpload: () => ({
    openFilePicker: mockOpenFilePicker,
    isUploading: false,
    error: null,
    constraints: {
      platform: "facebook",
      maxImages: 10,
      maxSizeBytes: 4 * 1024 * 1024,
      allowedFormats: ["jpg", "png", "gif", "webp"],
      minDimensions: { width: 200, height: 200 },
      maxDimensions: { width: 2048, height: 2048 },
    },
  }),
}))

describe("MediaUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("empty state", () => {
    it("shows upload button when no files", () => {
      vi.mocked(usePostingStore).mockImplementation((selector) => {
        const state = {
          mediaFiles: [],
          clearMedia: mockClearMedia,
        } as ReturnType<typeof usePostingStore>
        if (typeof selector === "function") {
          return selector(state)
        }
        return state
      })

      render(<MediaUploader platform="facebook" />)

      expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument()
    })

    it("shows platform constraints info", () => {
      vi.mocked(usePostingStore).mockImplementation((selector) => {
        const state = {
          mediaFiles: [],
          clearMedia: mockClearMedia,
        } as ReturnType<typeof usePostingStore>
        if (typeof selector === "function") {
          return selector(state)
        }
        return state
      })

      render(<MediaUploader platform="facebook" />)

      expect(screen.getByText(/max.*10.*images/i)).toBeInTheDocument()
    })
  })

  describe("with files", () => {
    it("shows preview when files exist", () => {
      vi.mocked(usePostingStore).mockImplementation((selector) => {
        const state = {
          mediaFiles: [
            {
              id: "test-1",
              path: "/path/1.jpg",
              fileName: "image1.jpg",
              fileSize: 1024 * 1024,
              format: "jpg",
              dimensions: { width: 1080, height: 1080 },
              thumbnailUrl: "blob:test",
              validationStatus: "valid",
            },
          ],
          mediaValidation: new Map([["test-1", { valid: true, errors: [] }]]),
          clearMedia: mockClearMedia,
        } as ReturnType<typeof usePostingStore>
        if (typeof selector === "function") {
          return selector(state)
        }
        return state
      })

      render(<MediaUploader platform="facebook" />)

      expect(screen.getByRole("img", { name: "image1.jpg" })).toBeInTheDocument()
    })

    it("shows clear all button", () => {
      vi.mocked(usePostingStore).mockImplementation((selector) => {
        const state = {
          mediaFiles: [
            {
              id: "test-1",
              path: "/path/1.jpg",
              fileName: "image1.jpg",
              fileSize: 1024 * 1024,
              format: "jpg",
              dimensions: { width: 1080, height: 1080 },
              thumbnailUrl: "blob:test",
              validationStatus: "valid",
            },
          ],
          mediaValidation: new Map([["test-1", { valid: true, errors: [] }]]),
          clearMedia: mockClearMedia,
        } as ReturnType<typeof usePostingStore>
        if (typeof selector === "function") {
          return selector(state)
        }
        return state
      })

      render(<MediaUploader platform="facebook" />)

      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument()
    })

    it("calls clearMedia when clear all clicked", async () => {
      const user = userEvent.setup()
      vi.mocked(usePostingStore).mockImplementation((selector) => {
        const state = {
          mediaFiles: [
            {
              id: "test-1",
              path: "/path/1.jpg",
              fileName: "image1.jpg",
              fileSize: 1024 * 1024,
              format: "jpg",
              dimensions: { width: 1080, height: 1080 },
              thumbnailUrl: "blob:test",
              validationStatus: "valid",
            },
          ],
          mediaValidation: new Map([["test-1", { valid: true, errors: [] }]]),
          clearMedia: mockClearMedia,
        } as ReturnType<typeof usePostingStore>
        if (typeof selector === "function") {
          return selector(state)
        }
        return state
      })

      render(<MediaUploader platform="facebook" />)

      await user.click(screen.getByRole("button", { name: /clear all/i }))

      expect(mockClearMedia).toHaveBeenCalled()
    })
  })
})
