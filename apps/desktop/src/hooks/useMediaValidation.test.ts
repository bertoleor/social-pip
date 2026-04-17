import type { Platform, PlatformMediaConstraints } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { renderHook, waitFor } from "@testing-library/react";
import { useMediaValidation } from "./useMediaValidation";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockConstraints: PlatformMediaConstraints = {
  platform: "facebook" as Platform,
  maxImages: 10,
  maxSizeBytes: 4 * 1024 * 1024,
  allowedFormats: ["jpg", "png", "gif", "webp"],
  minDimensions: { width: 200, height: 200 },
  maxDimensions: { width: 2048, height: 2048 },
};

const mockInstagramConstraints: PlatformMediaConstraints = {
  platform: "instagram" as Platform,
  maxImages: 10,
  maxSizeBytes: 30 * 1024 * 1024,
  allowedFormats: ["jpg", "png"],
  minDimensions: { width: 320, height: 320 },
  maxDimensions: { width: 1080, height: 1080 },
};

describe("useMediaValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConstraints", () => {
    it("returns constraints for platform", async () => {
      mockInvoke.mockResolvedValueOnce(mockConstraints);

      const { result } = renderHook(() => useMediaValidation("facebook" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).toEqual(mockConstraints);
      });

      const constraints = await result.current.getConstraints();
      expect(constraints).toEqual(mockConstraints);
    });
  });

  describe("isFormatAllowed", () => {
    it("returns true for allowed format", async () => {
      mockInvoke.mockResolvedValueOnce(mockConstraints);

      const { result } = renderHook(() => useMediaValidation("facebook" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.isFormatAllowed("jpg")).toBe(true);
    });

    it("returns false for disallowed format", async () => {
      mockInvoke.mockResolvedValueOnce(mockInstagramConstraints);

      const { result } = renderHook(() => useMediaValidation("instagram" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.isFormatAllowed("gif")).toBe(false);
    });
  });

  describe("isSizeWithinLimit", () => {
    it("returns true for size within limit", async () => {
      mockInvoke.mockResolvedValueOnce(mockConstraints);

      const { result } = renderHook(() => useMediaValidation("facebook" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.isSizeWithinLimit(1024 * 1024)).toBe(true);
    });

    it("returns false for size exceeding limit", async () => {
      mockInvoke.mockResolvedValueOnce(mockConstraints);

      const { result } = renderHook(() => useMediaValidation("facebook" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.isSizeWithinLimit(10 * 1024 * 1024)).toBe(false);
    });
  });

  describe("areDimensionsValid", () => {
    it("returns true for valid dimensions", async () => {
      mockInvoke.mockResolvedValueOnce(mockConstraints);

      const { result } = renderHook(() => useMediaValidation("facebook" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.areDimensionsValid(1080, 1080)).toBe(true);
    });

    it("returns false for dimensions too small", async () => {
      mockInvoke.mockResolvedValueOnce(mockInstagramConstraints);

      const { result } = renderHook(() => useMediaValidation("instagram" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.areDimensionsValid(100, 100)).toBe(false);
    });

    it("returns false for dimensions too large", async () => {
      mockInvoke.mockResolvedValueOnce(mockInstagramConstraints);

      const { result } = renderHook(() => useMediaValidation("instagram" as Platform));

      await waitFor(() => {
        expect(result.current.constraints).not.toBeNull();
      });

      expect(result.current.areDimensionsValid(2000, 2000)).toBe(false);
    });
  });

  describe("type safety", () => {
    it("hook returns all required properties", async () => {
      mockInvoke.mockResolvedValueOnce(mockConstraints);

      const { result } = renderHook(() => useMediaValidation("facebook" as Platform));

      await waitFor(() => {
        expect(typeof result.current.getConstraints).toBe("function");
        expect(typeof result.current.isFormatAllowed).toBe("function");
        expect(typeof result.current.isSizeWithinLimit).toBe("function");
        expect(typeof result.current.areDimensionsValid).toBe("function");
      });
    });
  });
});
