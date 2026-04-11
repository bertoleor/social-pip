import { useScheduleStore } from "@/stores/scheduleStore";
import type { Schedule } from "@social-pip/types";
import { act, renderHook, waitFor } from "@testing-library/react";
/**
 * @fileoverview useSchedule hook tests (TDD - Strict Mode)
 */
// removed unused import
import { useSchedule } from "./useSchedule";

// Mock the store
vi.mock("@/stores/scheduleStore", () => ({
	useScheduleStore: vi.fn(),
}));

// Mock toast notifications
const mockToast = {
	success: vi.fn(),
	error: vi.fn(),
};

vi.mock("@/lib/toast", () => ({
	toast: mockToast,
}));

// Mock confirmation dialog
const mockConfirm = vi.fn();
vi.mock("@/lib/dialog", () => ({
	confirm: mockConfirm,
}));

// Mock schedule data
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

describe("useSchedule", () => {
	let mockStoreState: {
		schedules: Schedule[];
		selectedId: string | null;
		loading: boolean;
		error: string | null;
		fetchSchedules: ReturnType<typeof vi.fn>;
		schedulePost: ReturnType<typeof vi.fn>;
		cancelSchedule: ReturnType<typeof vi.fn>;
		updateSchedule: ReturnType<typeof vi.fn>;
		selectSchedule: ReturnType<typeof vi.fn>;
		setFilter: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();

		mockStoreState = {
			schedules: [mockSchedule],
			selectedId: null,
			loading: false,
			error: null,
			fetchSchedules: vi.fn().mockResolvedValue(undefined),
			schedulePost: vi.fn().mockResolvedValue(mockSchedule),
			cancelSchedule: vi.fn().mockResolvedValue(undefined),
			updateSchedule: vi.fn().mockResolvedValue(mockSchedule),
			selectSchedule: vi.fn(),
			setFilter: vi.fn(),
		};

		vi.mocked(useScheduleStore).mockImplementation((selector) => {
			if (typeof selector === "function") {
				return selector(mockStoreState);
			}
			return mockStoreState;
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// ============================================
	// PHASE 5.2: RED - schedulePost with toast
	// ============================================
	describe("schedulePost", () => {
		it("shows success toast on completion", async () => {
			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.schedulePost(
					"post_001",
					new Date("2026-04-15T10:00:00Z"),
				);
			});

			expect(mockStoreState.schedulePost).toHaveBeenCalledWith(
				"post_001",
				expect.any(Date),
				undefined,
			);
			expect(mockToast.success).toHaveBeenCalledWith(
				"Post scheduled successfully",
			);
		});

		it("shows error toast on failure", async () => {
			mockStoreState.schedulePost.mockRejectedValueOnce(
				new Error("Post not found"),
			);

			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.schedulePost("invalid_post", new Date());
			});

			expect(mockToast.error).toHaveBeenCalledWith(
				"Failed to schedule post: Post not found",
			);
		});

		it("passes variance parameter correctly", async () => {
			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.schedulePost(
					"post_001",
					new Date("2026-04-15T10:00:00Z"),
					20,
				);
			});

			expect(mockStoreState.schedulePost).toHaveBeenCalledWith(
				"post_001",
				expect.any(Date),
				20,
			);
		});
	});

	// ============================================
	// PHASE 5.3: RED - cancelSchedule with confirmation
	// ============================================
	describe("cancelSchedule", () => {
		it("shows confirmation dialog before canceling", async () => {
			mockConfirm.mockResolvedValueOnce(true);

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

			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.cancelSchedule("sched_001");
			});

			expect(mockToast.success).toHaveBeenCalledWith(
				"Schedule cancelled successfully",
			);
		});

		it("shows error toast on failure", async () => {
			mockConfirm.mockResolvedValueOnce(true);
			mockStoreState.cancelSchedule.mockRejectedValueOnce(
				new Error("Network error"),
			);

			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.cancelSchedule("sched_001");
			});

			expect(mockToast.error).toHaveBeenCalledWith(
				"Failed to cancel schedule: Network error",
			);
		});
	});

	// ============================================
	// PHASE 5.4: RED - Auto-polling
	// ============================================
	describe("auto-polling", () => {
		it("starts polling on mount when schedules exist", async () => {
			const { unmount } = renderHook(() => useSchedule());

			// Initial call on mount
			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);

			// Fast-forward 30 seconds
			await act(async () => {
				vi.advanceTimersByTimeAsync(30000);
			});

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(2);

			// Fast-forward another 30 seconds
			await act(async () => {
				vi.advanceTimersByTimeAsync(30000);
			});

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(3);

			unmount();
		});

		it("stops polling when component unmounts", async () => {
			const { unmount } = renderHook(() => useSchedule());

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);

			unmount();

			// Fast-forward 30 seconds - should NOT trigger another fetch
			await act(async () => {
				vi.advanceTimersByTimeAsync(30000);
			});

			// Should still be 1 (only the initial mount call)
			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);
		});

		it("does not start polling when no schedules exist", async () => {
			mockStoreState.schedules = [];

			const { unmount } = renderHook(() => useSchedule());

			// Fast-forward 30 seconds
			await act(async () => {
				vi.advanceTimersByTimeAsync(30000);
			});

			// Should NOT have called fetchSchedules (no schedules to poll)
			// Only the initial mount check, not the polling
			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);

			unmount();
		});

		it("uses exponential backoff on errors (max 5 min)", async () => {
			mockStoreState.fetchSchedules.mockRejectedValueOnce(
				new Error("Network error"),
			);

			const { unmount } = renderHook(() => useSchedule());

			// First call fails
			await act(async () => {
				vi.advanceTimersByTimeAsync(0);
			});

			// Initial + first attempt
			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(2);

			// Wait for backoff (starts at 30s, doubles on each error)
			await act(async () => {
				vi.advanceTimersByTimeAsync(30000); // First backoff
			});

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(3);

			// Simulate another error
			mockStoreState.fetchSchedules.mockRejectedValueOnce(
				new Error("Network error"),
			);

			await act(async () => {
				vi.advanceTimersByTimeAsync(60000); // Second backoff (doubled)
			});

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(4);

			unmount();
		});
	});

	// ============================================
	// PHASE 5.9: Visibility API
	// ============================================
	describe("visibility API", () => {
		it("pauses polling when window is hidden", async () => {
			const { unmount } = renderHook(() => useSchedule());

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);

			// Simulate visibility change to hidden
			Object.defineProperty(document, "visibilityState", {
				value: "hidden",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// Fast-forward 30 seconds
			await act(async () => {
				vi.advanceTimersByTimeAsync(30000);
			});

			// Should NOT have polled while hidden (still just the initial call)
			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);

			unmount();
		});

		it("resumes polling when window becomes visible", async () => {
			const { unmount } = renderHook(() => useSchedule());

			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(1);

			// Hide window
			Object.defineProperty(document, "visibilityState", {
				value: "hidden",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// Wait while hidden
			await act(async () => {
				vi.advanceTimersByTimeAsync(60000);
			});

			// Make visible again
			Object.defineProperty(document, "visibilityState", {
				value: "visible",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// Should trigger immediate refresh on visibility
			await act(async () => {
				vi.advanceTimersByTimeAsync(0);
			});

			// Initial + refresh on visible
			expect(mockStoreState.fetchSchedules).toHaveBeenCalledTimes(2);

			unmount();
		});
	});

	// ============================================
	// Hook Return Values
	// ============================================
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
			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.refresh();
			});

			expect(mockStoreState.fetchSchedules).toHaveBeenCalled();
		});
	});

	describe("updateSchedule", () => {
		it("calls store updateSchedule and shows success toast", async () => {
			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.updateSchedule("sched_001", { variance: 20 });
			});

			expect(mockStoreState.updateSchedule).toHaveBeenCalledWith("sched_001", {
				variance: 20,
			});
			expect(mockToast.success).toHaveBeenCalledWith(
				"Schedule updated successfully",
			);
		});

		it("shows error toast on failure", async () => {
			mockStoreState.updateSchedule.mockRejectedValueOnce(
				new Error("Update failed"),
			);

			const { result } = renderHook(() => useSchedule());

			await act(async () => {
				await result.current.updateSchedule("sched_001", { variance: 20 });
			});

			expect(mockToast.error).toHaveBeenCalledWith(
				"Failed to update schedule: Update failed",
			);
		});
	});
});
