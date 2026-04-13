import type { ImageMetadata, Platform, PlatformMediaConstraints, ValidationResult } from "@social-pip/types"
import { invoke } from "@tauri-apps/api/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useMediaUpload } from "./useMediaUpload"
import { usePostingStore } from "../stores/postingStore"

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
	open: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-fs", () => ({
	readFile: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)
const mockOpen = vi.mocked(await import("@tauri-apps/plugin-dialog")).open
const mockReadFile = vi.mocked(await import("@tauri-apps/plugin-fs")).readFile

const mockImageMetadata: ImageMetadata = {
	width: 1080,
	height: 1080,
	format: "jpg",
	file_size: 1024 * 1024,
}

const mockValidationResult: ValidationResult = {
	valid: true,
	errors: [],
	warnings: [],
}

const mockConstraints: PlatformMediaConstraints = {
	platform: "facebook" as Platform,
	maxImages: 10,
	maxSizeBytes: 4 * 1024 * 1024,
	allowedFormats: ["jpg", "png", "gif", "webp"],
	minDimensions: { width: 200, height: 200 },
	maxDimensions: { width: 2048, height: 2048 },
}

describe("useMediaUpload", () => {
	beforeEach(() => {
		usePostingStore.setState({
			mediaFiles: [],
			mediaValidation: new Map(),
		})
		vi.clearAllMocks()
	})

	describe("openFilePicker", () => {
		it("calls Tauri dialog open with correct filters", async () => {
			mockInvoke.mockResolvedValueOnce(mockConstraints)
			mockOpen.mockResolvedValueOnce(null)

			const { result } = renderHook(() => useMediaUpload({ platform: "facebook" as Platform }))

			await act(async () => {
				await result.current.openFilePicker()
			})

			expect(mockOpen).toHaveBeenCalledWith({
				multiple: true,
				filters: [
					{
						name: "Images",
						extensions: ["jpg", "jpeg", "png", "gif", "webp"],
					},
				],
			})
		})

		it("does nothing when dialog returns null", async () => {
			mockInvoke.mockResolvedValueOnce(mockConstraints)
			mockOpen.mockResolvedValueOnce(null)

			const { result } = renderHook(() => useMediaUpload({ platform: "facebook" as Platform }))

			await act(async () => {
				await result.current.openFilePicker()
			})

			expect(mockInvoke).toHaveBeenCalledTimes(1)
		})
	})

	describe("isUploading", () => {
		it("returns false initially", async () => {
			mockInvoke.mockResolvedValueOnce(mockConstraints)

			const { result } = renderHook(() => useMediaUpload({ platform: "facebook" as Platform }))

			await waitFor(() => {
				expect(result.current.isUploading).toBe(false)
			})
		})
	})

	describe("error", () => {
		it("returns null initially", async () => {
			mockInvoke.mockResolvedValueOnce(mockConstraints)

			const { result } = renderHook(() => useMediaUpload({ platform: "facebook" as Platform }))

			await waitFor(() => {
				expect(result.current.error).toBeNull()
			})
		})
	})

	describe("constraints", () => {
		it("fetches platform constraints on mount", async () => {
			mockInvoke.mockResolvedValueOnce(mockConstraints)

			const { result } = renderHook(() => useMediaUpload({ platform: "facebook" as Platform }))

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("get_platform_media_constraints", {
					platform: "facebook",
				})
			})

			await waitFor(() => {
				expect(result.current.constraints).toEqual(mockConstraints)
			})
		})
	})

	describe("type safety", () => {
		it("hook returns all required properties", async () => {
			mockInvoke.mockResolvedValueOnce(mockConstraints)

			const { result } = renderHook(() => useMediaUpload({ platform: "facebook" as Platform }))

			await waitFor(() => {
				expect(typeof result.current.openFilePicker).toBe("function")
				expect(typeof result.current.isUploading).toBe("boolean")
				expect(result.current.error).toBeNull()
				expect(result.current.constraints).toEqual(mockConstraints)
			})
		})
	})
})
