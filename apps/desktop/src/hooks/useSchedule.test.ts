import type { Schedule } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act, renderHook } from "@testing-library/react";
import { useSchedule } from "./useSchedule";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/dialog", () => ({
  confirm: vi.fn(),
}));

let mockStoreState: {
  schedules: Schedule[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  filter: Record<string, unknown>;
  fetchSchedules: () => Promise<void>;
  schedulePost: (postId: string, scheduledAt: Date, variance?: number) => Promise<Schedule>;
  cancelSchedule: (scheduleId: string) => Promise<void>;
  updateSchedule: (scheduleId: string, data: { variance?: number }) => Promise<Schedule>;
  selectSchedule: (id: string | null) => void;
};

vi.mock("@/stores/scheduleStore", () => ({
  useScheduleStore: vi.fn((selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
  ),
}));

const mockInvoke = vi.mocked(invoke);
const mockToast = vi.mocked(await import("@/lib/toast")).toast;
const mockConfirm = vi.mocked(await import("@/lib/dialog")).confirm;

const mockSchedule: Schedule = {
  id: "sched_001",
  scheduledAt: new Date("2026-04-15T10:00:00Z"),
  variance: 15,
  status: "pending",
  attempts: 0,
  maxAttempts: 3,
  postId: "post_001",
  accountId: "acc_001",
  createdAt: new Date("2026-04-10T08:00:00Z"),
  updatedAt: new Date("2026-04-10T08:00:00Z"),
};

function createMockStore(overrides?: Partial<typeof mockStoreState>) {
  return {
    schedules: [mockSchedule],
    selectedId: null,
    loading: false,
    error: null,
    filter: {},
    fetchSchedules: vi.fn().mockResolvedValue(undefined),
    schedulePost: vi.fn().mockResolvedValue(mockSchedule),
    cancelSchedule: vi.fn().mockResolvedValue(undefined),
    updateSchedule: vi.fn().mockResolvedValue(mockSchedule),
    selectSchedule: vi.fn(),
    ...overrides,
  };
}

describe("useSchedule", () => {
  beforeEach(() => {
    mockStoreState = createMockStore();

    vi.clearAllMocks();
    vi.useFakeTimers();

    mockInvoke.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockConfirm.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("schedulePost", () => {
    it("shows success toast on completion", async () => {
      mockInvoke.mockResolvedValueOnce(mockSchedule);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.schedulePost("post_001", new Date("2026-04-15T10:00:00Z"));
      });

      expect(mockStoreState.schedulePost).toHaveBeenCalledWith(
        "post_001",
        expect.any(Date),
        undefined,
      );
      expect(mockToast.success).toHaveBeenCalledWith("Post scheduled successfully");
    });

    it("shows error toast on failure", async () => {
      mockStoreState.schedulePost = vi.fn().mockRejectedValueOnce(new Error("Post not found"));

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        try {
          await result.current.schedulePost("invalid_post", new Date());
        } catch {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith("Failed to schedule post: Post not found");
    });

    it("passes variance parameter correctly", async () => {
      mockInvoke.mockResolvedValueOnce(mockSchedule);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.schedulePost("post_001", new Date("2026-04-15T10:00:00Z"), 20);
      });

      expect(mockStoreState.schedulePost).toHaveBeenCalledWith("post_001", expect.any(Date), 20);
    });
  });

  describe("cancelSchedule", () => {
    it("shows confirmation dialog before canceling", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.cancelSchedule("sched_001");
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        "Cancel Schedule",
        "Are you sure you want to cancel this scheduled post?",
      );
      expect(mockStoreState.cancelSchedule).toHaveBeenCalledWith("sched_001");
    });

    it("does not cancel if user rejects confirmation", async () => {
      mockConfirm.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.cancelSchedule("sched_001");
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockStoreState.cancelSchedule).not.toHaveBeenCalled();
    });

    it("shows success toast after cancellation", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.cancelSchedule("sched_001");
      });

      expect(mockToast.success).toHaveBeenCalledWith("Schedule cancelled successfully");
    });

    it("shows error toast on failure", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockStoreState.cancelSchedule = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        try {
          await result.current.cancelSchedule("sched_001");
        } catch {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith("Failed to cancel schedule: Network error");
    });
  });

  describe("auto-polling", () => {
    it("starts polling on mount when schedules exist", async () => {
      mockInvoke.mockResolvedValue([mockSchedule]);

      const { unmount } = renderHook(() => useSchedule());

      await act(async () => {
        vi.advanceTimersByTimeAsync(0);
      });

      expect(mockStoreState.fetchSchedules).toHaveBeenCalled();

      const initialCallCount = mockStoreState.fetchSchedules.mock.calls.length;

      await act(async () => {
        vi.advanceTimersByTimeAsync(30000);
      });

      expect(mockStoreState.fetchSchedules.mock.calls.length).toBeGreaterThan(initialCallCount);

      unmount();
    });

    it("stops polling when component unmounts", async () => {
      mockInvoke.mockResolvedValue([mockSchedule]);

      const { unmount } = renderHook(() => useSchedule());

      await act(async () => {
        vi.advanceTimersByTimeAsync(0);
      });

      mockStoreState.fetchSchedules.mockClear();

      unmount();

      await act(async () => {
        vi.advanceTimersByTimeAsync(30000);
      });

      expect(mockStoreState.fetchSchedules).not.toHaveBeenCalled();
    });

    it("does not start polling when no schedules exist", async () => {
      mockStoreState = createMockStore({ schedules: [] });

      const { unmount } = renderHook(() => useSchedule());

      mockStoreState.fetchSchedules.mockClear();

      await act(async () => {
        vi.advanceTimersByTimeAsync(30000);
      });

      expect(mockStoreState.fetchSchedules).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe("visibility API", () => {
    it("does not call refresh when window becomes hidden", async () => {
      mockInvoke.mockResolvedValue([mockSchedule]);

      const { unmount } = renderHook(() => useSchedule());

      await act(async () => {
        vi.advanceTimersByTimeAsync(0);
      });

      mockStoreState.fetchSchedules.mockClear();

      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      await act(async () => {
        vi.advanceTimersByTimeAsync(0);
      });

      expect(mockStoreState.fetchSchedules).not.toHaveBeenCalled();

      unmount();
    });

    it("resumes polling when window becomes visible", async () => {
      mockInvoke.mockResolvedValue([mockSchedule]);

      const { unmount } = renderHook(() => useSchedule());

      await act(async () => {
        vi.advanceTimersByTimeAsync(0);
      });

      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      await act(async () => {
        vi.advanceTimersByTimeAsync(60000);
      });

      mockStoreState.fetchSchedules.mockClear();

      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));

      await act(async () => {
        vi.advanceTimersByTimeAsync(0);
      });

      expect(mockStoreState.fetchSchedules).toHaveBeenCalled();

      unmount();
    });
  });

  describe("return values", () => {
    it("returns schedules from store", () => {
      const { result } = renderHook(() => useSchedule());

      expect(result.current.schedules).toEqual([mockSchedule]);
    });

    it("returns selectedSchedule when selectedId matches", () => {
      mockStoreState.selectedId = "sched_001";

      const { result } = renderHook(() => useSchedule());

      expect(result.current.selectedSchedule).toEqual(mockSchedule);
    });

    it("returns null for selectedSchedule when no selection", () => {
      mockStoreState.selectedId = null;

      const { result } = renderHook(() => useSchedule());

      expect(result.current.selectedSchedule).toBeNull();
    });

    it("returns loading from store", () => {
      mockStoreState.loading = true;

      const { result } = renderHook(() => useSchedule());

      expect(result.current.loading).toBe(true);
    });

    it("returns error from store", () => {
      mockStoreState.error = "Something went wrong";

      const { result } = renderHook(() => useSchedule());

      expect(result.current.error).toBe("Something went wrong");
    });
  });

  describe("refresh", () => {
    it("calls fetchSchedules from store", async () => {
      mockInvoke.mockResolvedValueOnce([mockSchedule]);

      const { result } = renderHook(() => useSchedule());

      mockStoreState.fetchSchedules.mockClear();

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockStoreState.fetchSchedules).toHaveBeenCalled();
    });
  });

  describe("updateSchedule", () => {
    it("calls store updateSchedule and shows success toast", async () => {
      mockInvoke.mockResolvedValueOnce(mockSchedule);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.updateSchedule("sched_001", { variance: 20 });
      });

      expect(mockStoreState.updateSchedule).toHaveBeenCalledWith("sched_001", { variance: 20 });
      expect(mockToast.success).toHaveBeenCalledWith("Schedule updated successfully");
    });

    it("shows error toast on failure", async () => {
      mockStoreState.updateSchedule = vi.fn().mockRejectedValueOnce(new Error("Update failed"));

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        try {
          await result.current.updateSchedule("sched_001", { variance: 20 });
        } catch {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith("Failed to update schedule: Update failed");
    });
  });
});
