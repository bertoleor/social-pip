import type { MediaFile, MediaValidationResult, Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
import { usePostingStore } from "./postingStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockMediaFile: MediaFile = {
  id: "test-id-1",
  path: "/path/to/image.jpg",
  fileName: "image.jpg",
  fileSize: 1024 * 1024,
  format: "jpg",
  dimensions: { width: 1080, height: 1080 },
  validationStatus: "pending",
};

const mockMediaFile2: MediaFile = {
  id: "test-id-2",
  path: "/path/to/image2.png",
  fileName: "image2.png",
  fileSize: 2 * 1024 * 1024,
  format: "png",
  dimensions: { width: 800, height: 600 },
  validationStatus: "valid",
};

const mockValidationResult: MediaValidationResult = {
  fileId: "test-id-1",
  valid: true,
  errors: [],
  warnings: [],
  platform: "facebook" as Platform,
};

describe("usePostingStore - Media Extensions", () => {
  beforeEach(() => {
    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      mediaFiles: [],
      mediaValidation: new Map(),
    });
    vi.clearAllMocks();
  });

  describe("mediaFiles initial state", () => {
    it("has mediaFiles as empty array by default", () => {
      const state = usePostingStore.getState();
      expect(state.mediaFiles).toEqual([]);
    });

    it("has mediaValidation as empty Map by default", () => {
      const state = usePostingStore.getState();
      expect(state.mediaValidation).toBeInstanceOf(Map);
      expect(state.mediaValidation.size).toBe(0);
    });
  });

  describe("addMediaFiles", () => {
    it("adds files to mediaFiles array", () => {
      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile]);
      });

      const state = usePostingStore.getState();
      expect(state.mediaFiles).toHaveLength(1);
      expect(state.mediaFiles[0]).toEqual(mockMediaFile);
    });

    it("appends files to existing mediaFiles", () => {
      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile]);
      });

      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile2]);
      });

      const state = usePostingStore.getState();
      expect(state.mediaFiles).toHaveLength(2);
      expect(state.mediaFiles[0]).toEqual(mockMediaFile);
      expect(state.mediaFiles[1]).toEqual(mockMediaFile2);
    });

    it("does not duplicate files with same id", () => {
      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile]);
      });

      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile]);
      });

      const state = usePostingStore.getState();
      expect(state.mediaFiles).toHaveLength(1);
    });
  });

  describe("removeMediaFile", () => {
    it("removes file by id", () => {
      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile, mockMediaFile2]);
      });

      act(() => {
        usePostingStore.getState().removeMediaFile("test-id-1");
      });

      const state = usePostingStore.getState();
      expect(state.mediaFiles).toHaveLength(1);
      expect(state.mediaFiles[0].id).toBe("test-id-2");
    });

    it("does nothing if id not found", () => {
      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile]);
      });

      act(() => {
        usePostingStore.getState().removeMediaFile("non-existent-id");
      });

      const state = usePostingStore.getState();
      expect(state.mediaFiles).toHaveLength(1);
    });

    it("removes validation entry when file removed", () => {
      const validationMap = new Map([["test-id-1", mockValidationResult]]);

      usePostingStore.setState({ mediaValidation: validationMap });

      act(() => {
        usePostingStore.getState().removeMediaFile("test-id-1");
      });

      const state = usePostingStore.getState();
      expect(state.mediaValidation.has("test-id-1")).toBe(false);
    });
  });

  describe("clearMedia", () => {
    it("resets mediaFiles to empty array", () => {
      act(() => {
        usePostingStore.getState().addMediaFiles([mockMediaFile]);
      });

      act(() => {
        usePostingStore.getState().clearMedia();
      });

      const state = usePostingStore.getState();
      expect(state.mediaFiles).toEqual([]);
    });

    it("resets mediaValidation to empty Map", () => {
      const validationMap = new Map([["test-id-1", mockValidationResult]]);
      usePostingStore.setState({ mediaValidation: validationMap });

      act(() => {
        usePostingStore.getState().clearMedia();
      });

      const state = usePostingStore.getState();
      expect(state.mediaValidation.size).toBe(0);
    });
  });

  describe("setMediaValidation", () => {
    it("adds validation result to map", () => {
      act(() => {
        usePostingStore.getState().setMediaValidation("test-id-1", mockValidationResult);
      });

      const state = usePostingStore.getState();
      expect(state.mediaValidation.get("test-id-1")).toEqual(mockValidationResult);
    });

    it("updates existing validation result", () => {
      const updatedResult: MediaValidationResult = {
        ...mockValidationResult,
        valid: false,
        errors: [{ code: "SIZE_EXCEEDED", message: "Too large", platform: "facebook" }],
      };

      act(() => {
        usePostingStore.getState().setMediaValidation("test-id-1", mockValidationResult);
      });

      act(() => {
        usePostingStore.getState().setMediaValidation("test-id-1", updatedResult);
      });

      const state = usePostingStore.getState();
      expect(state.mediaValidation.get("test-id-1")).toEqual(updatedResult);
    });
  });

  describe("getMediaValidationState", () => {
    it("returns valid when all files are valid", () => {
      usePostingStore.setState({
        mediaFiles: [mockMediaFile],
        mediaValidation: new Map([["test-id-1", { ...mockValidationResult, valid: true }]]),
      });

      const result = usePostingStore.getState().getMediaValidationState();
      expect(result).toBe("valid");
    });

    it("returns invalid when any file is invalid", () => {
      usePostingStore.setState({
        mediaFiles: [mockMediaFile, mockMediaFile2],
        mediaValidation: new Map([
          ["test-id-1", { ...mockValidationResult, valid: true }],
          [
            "test-id-2",
            {
              ...mockValidationResult,
              valid: false,
              errors: [{ code: "SIZE_EXCEEDED", message: "Too large", platform: "facebook" }],
            },
          ],
        ]),
      });

      const result = usePostingStore.getState().getMediaValidationState();
      expect(result).toBe("invalid");
    });

    it("returns partial when some files not validated", () => {
      usePostingStore.setState({
        mediaFiles: [mockMediaFile, mockMediaFile2],
        mediaValidation: new Map([["test-id-1", { ...mockValidationResult, valid: true }]]),
      });

      const result = usePostingStore.getState().getMediaValidationState();
      expect(result).toBe("partial");
    });

    it("returns valid when no files present", () => {
      usePostingStore.setState({
        mediaFiles: [],
        mediaValidation: new Map(),
      });

      const result = usePostingStore.getState().getMediaValidationState();
      expect(result).toBe("valid");
    });
  });

  describe("type safety", () => {
    it("store has all required media actions", () => {
      const state = usePostingStore.getState();
      expect(typeof state.addMediaFiles).toBe("function");
      expect(typeof state.removeMediaFile).toBe("function");
      expect(typeof state.clearMedia).toBe("function");
      expect(typeof state.setMediaValidation).toBe("function");
      expect(typeof state.getMediaValidationState).toBe("function");
    });
  });
});
