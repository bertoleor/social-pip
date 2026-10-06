import { listen } from "@tauri-apps/api/event";
import { act, renderHook } from "@testing-library/react";
import { usePostingStore } from "@/stores/postingStore";
import type { PostJobUpdateEvent, PostSessionCompleteEvent } from "./usePostingEvents";
import { usePostingEvents } from "./usePostingEvents";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

const mockListen = vi.mocked(listen);

const mockUpdateJobStatus = vi.fn();
const mockSetSessionComplete = vi.fn();

vi.mock("@/stores/postingStore", () => ({
  usePostingStore: vi.fn(),
}));

describe("usePostingEvents", () => {
  const mockUnlisten = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListen.mockResolvedValue(mockUnlisten);
    vi.mocked(usePostingStore).mockReturnValue({
      updateJobStatus: mockUpdateJobStatus,
      setSessionComplete: mockSetSessionComplete,
    } as unknown as ReturnType<typeof usePostingStore>);
  });

  describe("Listener setup on mount", () => {
    it("should setup listeners when sessionId provided", async () => {
      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockListen).toHaveBeenCalledWith("post-job-update", expect.any(Function));
      expect(mockListen).toHaveBeenCalledWith("post-session-complete", expect.any(Function));
    });

    it("should call listen twice (for both event types)", async () => {
      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockListen).toHaveBeenCalledTimes(2);
    });

    it("should not setup listeners when sessionId is null", async () => {
      renderHook(() => usePostingEvents(null));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockListen).not.toHaveBeenCalled();
    });

    it("should not setup listeners when sessionId is empty string", async () => {
      renderHook(() => usePostingEvents(""));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockListen).not.toHaveBeenCalled();
    });
  });

  describe("Listener cleanup on unmount", () => {
    it("should call unlisten on unmount when sessionId provided", async () => {
      const { unmount } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      unmount();

      expect(mockUnlisten).toHaveBeenCalledTimes(2);
    });

    it("should not throw when unmounting without listeners", async () => {
      const { unmount } = renderHook(() => usePostingEvents(null));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(() => unmount()).not.toThrow();
    });

    it("should cleanup all listeners on unmount", async () => {
      const { unmount } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      unmount();

      expect(mockUnlisten).toHaveBeenCalledTimes(2);
    });
  });

  describe("post-job-update event handling", () => {
    it("should update job status on post-job-update event", async () => {
      let jobUpdateHandler:
        | ((event: { payload: PostJobUpdateEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-job-update") {
          jobUpdateHandler = handler as (event: { payload: PostJobUpdateEvent["payload"] }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostJobUpdateEvent["payload"] = {
        sessionId: "session-123",
        jobId: "job-1",
        status: "success",
        postUrl: "https://facebook.com/post/123",
      };

      act(() => {
        jobUpdateHandler!({ payload: mockPayload });
      });

      expect(mockUpdateJobStatus).toHaveBeenCalledWith(
        "job-1",
        "success",
        expect.objectContaining({
          postUrl: "https://facebook.com/post/123",
        }),
      );
    });

    it("should handle failed job status", async () => {
      let jobUpdateHandler:
        | ((event: { payload: PostJobUpdateEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-job-update") {
          jobUpdateHandler = handler as (event: { payload: PostJobUpdateEvent["payload"] }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostJobUpdateEvent["payload"] = {
        sessionId: "session-123",
        jobId: "job-1",
        status: "failed",
        error: {
          category: "network",
          message: "Connection timeout",
          retryable: true,
        },
      };

      act(() => {
        jobUpdateHandler!({ payload: mockPayload });
      });

      expect(mockUpdateJobStatus).toHaveBeenCalledWith(
        "job-1",
        "failed",
        expect.objectContaining({
          error: "Connection timeout",
          errorCategory: "network",
        }),
      );
    });

    it("should handle pending job status", async () => {
      let jobUpdateHandler:
        | ((event: { payload: PostJobUpdateEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-job-update") {
          jobUpdateHandler = handler as (event: { payload: PostJobUpdateEvent["payload"] }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostJobUpdateEvent["payload"] = {
        sessionId: "session-123",
        jobId: "job-1",
        status: "pending",
      };

      act(() => {
        jobUpdateHandler!({ payload: mockPayload });
      });

      expect(mockUpdateJobStatus).toHaveBeenCalledWith("job-1", "pending", expect.any(Object));
    });

    it("should handle posting job status", async () => {
      let jobUpdateHandler:
        | ((event: { payload: PostJobUpdateEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-job-update") {
          jobUpdateHandler = handler as (event: { payload: PostJobUpdateEvent["payload"] }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostJobUpdateEvent["payload"] = {
        sessionId: "session-123",
        jobId: "job-1",
        status: "posting",
      };

      act(() => {
        jobUpdateHandler!({ payload: mockPayload });
      });

      expect(mockUpdateJobStatus).toHaveBeenCalledWith("job-1", "posting", expect.any(Object));
    });

    it("should handle skipped job status", async () => {
      let jobUpdateHandler:
        | ((event: { payload: PostJobUpdateEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-job-update") {
          jobUpdateHandler = handler as (event: { payload: PostJobUpdateEvent["payload"] }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostJobUpdateEvent["payload"] = {
        sessionId: "session-123",
        jobId: "job-1",
        status: "skipped",
      };

      act(() => {
        jobUpdateHandler!({ payload: mockPayload });
      });

      expect(mockUpdateJobStatus).toHaveBeenCalledWith("job-1", "skipped", expect.any(Object));
    });
  });

  describe("post-session-complete event handling", () => {
    it("should set session complete on post-session-complete event", async () => {
      let sessionCompleteHandler:
        | ((event: { payload: PostSessionCompleteEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-session-complete") {
          sessionCompleteHandler = handler as (event: {
            payload: PostSessionCompleteEvent["payload"];
          }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostSessionCompleteEvent["payload"] = {
        sessionId: "session-123",
        status: "completed",
        totalJobs: 10,
        successCount: 8,
        failedCount: 1,
        skippedCount: 1,
      };

      act(() => {
        sessionCompleteHandler!({ payload: mockPayload });
      });

      expect(mockSetSessionComplete).toHaveBeenCalledWith(
        "session-123",
        expect.objectContaining({
          status: "completed",
          totalJobs: 10,
          successCount: 8,
          failedCount: 1,
          skippedCount: 1,
        }),
      );
    });

    it("should handle cancelled session status", async () => {
      let sessionCompleteHandler:
        | ((event: { payload: PostSessionCompleteEvent["payload"] }) => void)
        | undefined;

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-session-complete") {
          sessionCompleteHandler = handler as (event: {
            payload: PostSessionCompleteEvent["payload"];
          }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostSessionCompleteEvent["payload"] = {
        sessionId: "session-123",
        status: "cancelled",
        totalJobs: 5,
        successCount: 3,
        failedCount: 0,
        skippedCount: 2,
      };

      act(() => {
        sessionCompleteHandler!({ payload: mockPayload });
      });

      expect(mockSetSessionComplete).toHaveBeenCalledWith(
        "session-123",
        expect.objectContaining({
          status: "cancelled",
        }),
      );
    });
  });

  describe("onEvent callback invocation", () => {
    it("should call onEvent callback for job update", async () => {
      let jobUpdateHandler:
        | ((event: { payload: PostJobUpdateEvent["payload"] }) => void)
        | undefined;
      const mockOnEvent = vi.fn();

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-job-update") {
          jobUpdateHandler = handler as (event: { payload: PostJobUpdateEvent["payload"] }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123", mockOnEvent));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostJobUpdateEvent["payload"] = {
        sessionId: "session-123",
        jobId: "job-1",
        status: "success",
      };

      act(() => {
        jobUpdateHandler!({ payload: mockPayload });
      });

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: "post-job-update",
        payload: mockPayload,
      });
    });

    it("should call onEvent callback for session complete", async () => {
      let sessionCompleteHandler:
        | ((event: { payload: PostSessionCompleteEvent["payload"] }) => void)
        | undefined;
      const mockOnEvent = vi.fn();

      mockListen.mockImplementation(async (event, handler) => {
        if (event === "post-session-complete") {
          sessionCompleteHandler = handler as (event: {
            payload: PostSessionCompleteEvent["payload"];
          }) => void;
        }
        return mockUnlisten;
      });

      renderHook(() => usePostingEvents("session-123", mockOnEvent));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockPayload: PostSessionCompleteEvent["payload"] = {
        sessionId: "session-123",
        status: "completed",
        totalJobs: 10,
        successCount: 10,
        failedCount: 0,
        skippedCount: 0,
      };

      act(() => {
        sessionCompleteHandler!({ payload: mockPayload });
      });

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: "post-session-complete",
        payload: mockPayload,
      });
    });

    it("should work without onEvent callback", async () => {
      renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockListen).toHaveBeenCalled();
    });
  });

  describe("Error handling in setup", () => {
    it("should set error when listen throws", async () => {
      mockListen.mockRejectedValue(new Error("Connection failed"));

      const { result, rerender } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender();

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe("Connection failed");
    });

    it("should set isConnected false when listen throws", async () => {
      mockListen.mockRejectedValue(new Error("Connection failed"));

      const { result, rerender } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender();

      expect(result.current.isConnected).toBe(false);
    });

    it("should handle non-Error throws in setup", async () => {
      mockListen.mockRejectedValue("String error");

      const { result, rerender } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender();

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe("Failed to setup event listeners");
    });

    it("should set isConnected true on successful setup", async () => {
      const { result, rerender } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender();

      expect(result.current.isConnected).toBe(true);
    });

    it("should set error null on successful setup", async () => {
      const { result, rerender } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender();

      expect(result.current.error).toBeNull();
    });
  });

  describe("Return values", () => {
    it("should return isConnected status", async () => {
      const { result } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current).toHaveProperty("isConnected");
    });

    it("should return error status", async () => {
      const { result } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current).toHaveProperty("error");
    });

    it("should return null error when connected", async () => {
      const { result } = renderHook(() => usePostingEvents("session-123"));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBeNull();
    });

    it("should return false isConnected when no sessionId", async () => {
      const { result } = renderHook(() => usePostingEvents(null));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("Re-render behavior", () => {
    it("should re-setup listeners when sessionId changes", async () => {
      const { rerender } = renderHook(({ sessionId }) => usePostingEvents(sessionId), {
        initialProps: { sessionId: "session-1" },
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      vi.clearAllMocks();
      mockListen.mockResolvedValue(mockUnlisten);

      rerender({ sessionId: "session-2" });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockListen).toHaveBeenCalled();
    });

    it("should cleanup old listeners on sessionId change", async () => {
      const { rerender } = renderHook(({ sessionId }) => usePostingEvents(sessionId), {
        initialProps: { sessionId: "session-1" },
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender({ sessionId: "session-2" });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockUnlisten).toHaveBeenCalled();
    });
  });
});
