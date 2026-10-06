import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/stores/toastStore";
import { useToast } from "./useToast";

// Mock timers for auto-dismiss
describe("useToast", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.clearAllMocks();
  });

  describe("toast functions", () => {
    it("exposes success function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.success).toBeDefined();
      expect(typeof result.current.success).toBe("function");
    });

    it("exposes error function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.error).toBeDefined();
      expect(typeof result.current.error).toBe("function");
    });

    it("exposes info function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.info).toBeDefined();
      expect(typeof result.current.info).toBe("function");
    });

    it("exposes warning function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.warning).toBeDefined();
      expect(typeof result.current.warning).toBe("function");
    });

    it("exposes dismiss function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.dismiss).toBeDefined();
      expect(typeof result.current.dismiss).toBe("function");
    });

    it("exposes dismissAll function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.dismissAll).toBeDefined();
      expect(typeof result.current.dismissAll).toBe("function");
    });
  });

  describe("success", () => {
    it("adds success toast to store", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success("Operation successful");
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.type).toBe("success");
      expect(toasts[0]?.message).toBe("Operation successful");
    });
  });

  describe("error", () => {
    it("adds error toast to store", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error("Operation failed");
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.type).toBe("error");
      expect(toasts[0]?.message).toBe("Operation failed");
    });
  });

  describe("info", () => {
    it("adds info toast to store", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info("Processing request");
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.type).toBe("info");
      expect(toasts[0]?.message).toBe("Processing request");
    });
  });

  describe("warning", () => {
    it("adds warning toast to store", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning("Rate limit approaching");
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.type).toBe("warning");
      expect(toasts[0]?.message).toBe("Rate limit approaching");
    });
  });

  describe("dismiss", () => {
    it("removes specific toast by id", () => {
      const { result } = renderHook(() => useToast());

      // Add a toast first
      act(() => {
        result.current.success("Test toast");
      });

      const toastId = useToastStore.getState().toasts[0]?.id;
      expect(toastId).toBeDefined();

      // Dismiss it
      act(() => {
        result.current.dismiss(toastId!);
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe("dismissAll", () => {
    it("removes all toasts", () => {
      const { result } = renderHook(() => useToast());

      // Add multiple toasts
      act(() => {
        result.current.success("Toast 1");
        result.current.error("Toast 2");
        result.current.info("Toast 3");
      });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      // Dismiss all
      act(() => {
        result.current.dismissAll();
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
