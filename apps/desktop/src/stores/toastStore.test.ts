import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "./toastStore";

describe("useToastStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useToastStore.setState({
      toasts: [],
    });
  });

  describe("initial state", () => {
    it("has empty toasts array by default", () => {
      const state = useToastStore.getState();
      expect(state.toasts).toEqual([]);
    });
  });

  describe("addToast", () => {
    it("adds a toast with generated id", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Post published successfully",
        });
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.id).toBeDefined();
      expect(toasts[0]?.type).toBe("success");
      expect(toasts[0]?.message).toBe("Post published successfully");
    });

    it("adds toast to the beginning of array (newest first)", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "First toast",
        });
        useToastStore.getState().addToast({
          type: "error",
          message: "Second toast",
        });
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts[0]?.message).toBe("Second toast");
      expect(toasts[1]?.message).toBe("First toast");
    });

    it("supports all toast types", () => {
      const types: Array<"success" | "error" | "info" | "warning"> = [
        "success",
        "error",
        "info",
        "warning",
      ];

      for (const type of types) {
        act(() => {
          useToastStore.getState().addToast({
            type,
            message: `${type} message`,
          });
        });
      }

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(4);
      expect(toasts[0]?.type).toBe("warning");
      expect(toasts[3]?.type).toBe("success");
    });
  });

  describe("removeToast", () => {
    it("removes a toast by id", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Test toast",
        });
      });

      const toastId = useToastStore.getState().toasts[0]?.id;
      expect(toastId).toBeDefined();

      act(() => {
        useToastStore.getState().removeToast(toastId!);
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("does nothing if toast id does not exist", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Test toast",
        });
      });

      const initialLength = useToastStore.getState().toasts.length;

      act(() => {
        useToastStore.getState().removeToast("non-existent-id");
      });

      expect(useToastStore.getState().toasts).toHaveLength(initialLength);
    });

    it("removes correct toast when multiple exist", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "First",
        });
        useToastStore.getState().addToast({
          type: "error",
          message: "Second",
        });
        useToastStore.getState().addToast({
          type: "info",
          message: "Third",
        });
      });

      const middleId = useToastStore.getState().toasts[1]?.id;

      act(() => {
        useToastStore.getState().removeToast(middleId!);
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts.map((t) => t.message)).toEqual(["Third", "First"]);
    });
  });

  describe("clearAll", () => {
    it("removes all toasts", () => {
      act(() => {
        useToastStore.getState().addToast({
          type: "success",
          message: "Toast 1",
        });
        useToastStore.getState().addToast({
          type: "error",
          message: "Toast 2",
        });
        useToastStore.getState().addToast({
          type: "info",
          message: "Toast 3",
        });
      });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      act(() => {
        useToastStore.getState().clearAll();
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("works when called on empty store", () => {
      expect(useToastStore.getState().toasts).toHaveLength(0);

      act(() => {
        useToastStore.getState().clearAll();
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
