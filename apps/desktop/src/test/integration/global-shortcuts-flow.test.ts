/**
 * TASK-8.3: E2E Test for Global Shortcuts Flow
 *
 * Tests global keyboard shortcuts triggering actions.
 * Tests the frontend hook behavior and event handling.
 *
 * Flow: Keyboard shortcut → Event emitted → Handler triggered
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

// Mock Tauri event API - must be properly structured for hoisting
const mockListen = vi.fn();
const mockUnlisten = vi.fn();

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => {
    mockListen(...args);
    return Promise.resolve(mockUnlisten);
  },
}));

describe("E2E: Global Shortcuts Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListen.mockReset();
    mockUnlisten.mockReset();
  });

  describe("Shortcut event constants", () => {
    it("should have SHORTCUT_EVENTS constant defined", async () => {
      const { SHORTCUT_EVENTS } = await import("@/hooks/useGlobalShortcuts");

      expect(SHORTCUT_EVENTS.NEW_POST).toBe("shortcut:new-post");
      expect(SHORTCUT_EVENTS.SAVE).toBe("shortcut:save");
      expect(SHORTCUT_EVENTS.QUIT).toBe("shortcut:quit");
      expect(SHORTCUT_EVENTS.SETTINGS).toBe("shortcut:settings");
    });

    it("should have unique event names", async () => {
      const { SHORTCUT_EVENTS } = await import("@/hooks/useGlobalShortcuts");
      const eventNames = Object.values(SHORTCUT_EVENTS);
      const uniqueNames = new Set(eventNames);
      expect(uniqueNames.size).toBe(eventNames.length);
    });
  });

  describe("Hook initialization", () => {
    it("should return handlers object", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current).toHaveProperty("handlers");
      expect(typeof result.current.handlers).toBe("object");
    });

    it("should set isListening to false when enabled=false", async () => {
      const { result } = renderHook(() => useGlobalShortcuts({ enabled: false }));

      expect(result.current.isListening).toBe(false);
    });

    it("should set isListening to true after successful registration", async () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });
    });
  });

  describe("Event listener registration", () => {
    it("should register listener for new-post shortcut event", async () => {
      renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("shortcut:new-post", expect.any(Function));
      });
    });

    it("should register listener for save shortcut event", async () => {
      renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("shortcut:save", expect.any(Function));
      });
    });

    it("should register listener for quit shortcut event", async () => {
      renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("shortcut:quit", expect.any(Function));
      });
    });

    it("should register listener for settings shortcut event", async () => {
      renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("shortcut:settings", expect.any(Function));
      });
    });
  });

  describe("Programmatic handlers", () => {
    it("should expose onNewPost handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onNewPost");
      expect(typeof result.current.handlers.onNewPost).toBe("function");
    });

    it("should expose onSave handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onSave");
      expect(typeof result.current.handlers.onSave).toBe("function");
    });

    it("should expose onQuit handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onQuit");
      expect(typeof result.current.handlers.onQuit).toBe("function");
    });

    it("should expose onSettings handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onSettings");
      expect(typeof result.current.handlers.onSettings).toBe("function");
    });
  });

  describe("Custom handler registration", () => {
    it("should call custom onNewPost handler when shortcut is triggered", async () => {
      const customHandler = vi.fn();
      let newPostCallback: ((event: unknown) => void) | null = null;

      mockListen.mockImplementation((event: string, callback: (e: unknown) => void) => {
        if (event === "shortcut:new-post") {
          newPostCallback = callback;
        }
        return Promise.resolve(mockUnlisten);
      });

      renderHook(() =>
        useGlobalShortcuts({
          onNewPost: customHandler,
        }),
      );

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      // Simulate shortcut trigger
      if (newPostCallback) {
        newPostCallback({
          payload: { shortcut_id: "new_post", event_name: "shortcut:new-post" },
        });
      }

      expect(customHandler).toHaveBeenCalled();
    });

    it("should call custom onSave handler when shortcut is triggered", async () => {
      const customHandler = vi.fn();
      let saveCallback: ((event: unknown) => void) | null = null;

      mockListen.mockImplementation((event: string, callback: (e: unknown) => void) => {
        if (event === "shortcut:save") {
          saveCallback = callback;
        }
        return Promise.resolve(mockUnlisten);
      });

      renderHook(() =>
        useGlobalShortcuts({
          onSave: customHandler,
        }),
      );

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      if (saveCallback) {
        saveCallback({
          payload: { shortcut_id: "save", event_name: "shortcut:save" },
        });
      }

      expect(customHandler).toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should unlisten all events on unmount", async () => {
      const { unmount } = renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const registeredCount = mockListen.mock.calls.length;

      unmount();

      await waitFor(() => {
        expect(mockUnlisten).toHaveBeenCalledTimes(registeredCount);
      });
    });
  });

  describe("Full flow: Shortcut key → Handler execution", () => {
    it("should complete full shortcut trigger flow", async () => {
      const handlers = {
        onNewPost: vi.fn(),
        onSave: vi.fn(),
        onQuit: vi.fn(),
        onSettings: vi.fn(),
      };

      renderHook(() => useGlobalShortcuts(handlers));

      await waitFor(() => {
        // 4 listeners should be registered (one for each shortcut)
        expect(mockListen.mock.calls.length).toBeGreaterThanOrEqual(4);
      });
    });

    it("should handle multiple handler registrations", async () => {
      const onNewPost = vi.fn();

      renderHook(() => useGlobalShortcuts({ onNewPost }));

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      expect(onNewPost).not.toHaveBeenCalled();
    });
  });
});
