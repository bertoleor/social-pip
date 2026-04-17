import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useGlobalShortcuts } from "./useGlobalShortcuts";

// Mock Tauri event API
const mockListen = vi.fn();
const mockUnlisten = vi.fn();

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => {
    mockListen(...args);
    return Promise.resolve(mockUnlisten);
  },
}));

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();
window.dispatchEvent = mockDispatchEvent;

describe("useGlobalShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListen.mockReset();
    mockUnlisten.mockReset();
    mockDispatchEvent.mockReset();
  });

  describe("initialization", () => {
    it("should return an object with isListening state", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current).toHaveProperty("isListening");
      expect(typeof result.current.isListening).toBe("boolean");
    });

    it("should return shortcut handlers object", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current).toHaveProperty("handlers");
      expect(typeof result.current.handlers).toBe("object");
    });
  });

  describe("event listener registration", () => {
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

    it("should set isListening to true after successful registration", async () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });
    });
  });

  describe("shortcut handlers", () => {
    it("should provide onNewPost handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onNewPost");
      expect(typeof result.current.handlers.onNewPost).toBe("function");
    });

    it("should provide onSave handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onSave");
      expect(typeof result.current.handlers.onSave).toBe("function");
    });

    it("should provide onQuit handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onQuit");
      expect(typeof result.current.handlers.onQuit).toBe("function");
    });

    it("should provide onSettings handler", () => {
      const { result } = renderHook(() => useGlobalShortcuts());

      expect(result.current.handlers).toHaveProperty("onSettings");
      expect(typeof result.current.handlers.onSettings).toBe("function");
    });
  });

  describe("custom handler registration", () => {
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
        newPostCallback({ payload: { shortcut_id: "new_post", event_name: "shortcut:new-post" } });
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

      // Simulate shortcut trigger
      if (saveCallback) {
        saveCallback({ payload: { shortcut_id: "save", event_name: "shortcut:save" } });
      }

      expect(customHandler).toHaveBeenCalled();
    });

    it("should call custom onQuit handler when shortcut is triggered", async () => {
      const customHandler = vi.fn();
      let quitCallback: ((event: unknown) => void) | null = null;

      mockListen.mockImplementation((event: string, callback: (e: unknown) => void) => {
        if (event === "shortcut:quit") {
          quitCallback = callback;
        }
        return Promise.resolve(mockUnlisten);
      });

      renderHook(() =>
        useGlobalShortcuts({
          onQuit: customHandler,
        }),
      );

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      // Simulate shortcut trigger
      if (quitCallback) {
        quitCallback({ payload: { shortcut_id: "quit", event_name: "shortcut:quit" } });
      }

      expect(customHandler).toHaveBeenCalled();
    });

    it("should call custom onSettings handler when shortcut is triggered", async () => {
      const customHandler = vi.fn();
      let settingsCallback: ((event: unknown) => void) | null = null;

      mockListen.mockImplementation((event: string, callback: (e: unknown) => void) => {
        if (event === "shortcut:settings") {
          settingsCallback = callback;
        }
        return Promise.resolve(mockUnlisten);
      });

      renderHook(() =>
        useGlobalShortcuts({
          onSettings: customHandler,
        }),
      );

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      // Simulate shortcut trigger
      if (settingsCallback) {
        settingsCallback({ payload: { shortcut_id: "settings", event_name: "shortcut:settings" } });
      }

      expect(customHandler).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should unlisten all events on unmount", async () => {
      const { unmount } = renderHook(() => useGlobalShortcuts());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      // Get the number of registered listeners before unmount
      const registeredCount = mockListen.mock.calls.length;

      unmount();

      // Should call unlisten for each registered event
      await waitFor(() => {
        expect(mockUnlisten).toHaveBeenCalledTimes(registeredCount);
      });
    });
  });

  describe("disabled state", () => {
    it("should not register listeners when disabled", async () => {
      renderHook(() => useGlobalShortcuts({ enabled: false }));

      // Should not register any listeners when disabled
      await waitFor(() => {
        expect(mockListen).not.toHaveBeenCalled();
      });
    });

    it("should return isListening false when disabled", () => {
      const { result } = renderHook(() => useGlobalShortcuts({ enabled: false }));

      expect(result.current.isListening).toBe(false);
    });
  });
});
