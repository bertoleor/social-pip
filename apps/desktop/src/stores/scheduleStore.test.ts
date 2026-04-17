import type { Schedule, ScheduleFilter } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
/**
 * @fileoverview Schedule store tests (TDD - Strict Mode)
 */
// removed unused import
import { useScheduleStore } from "./scheduleStore";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

// Mock Schedule data for testing
const mockSchedule1: Schedule = {
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

const mockSchedule2: Schedule = {
  id: "sched_002",
  scheduledAt: new Date("2026-04-12T14:00:00Z"),
  variance: 10,
  status: "pending",
  attempts: 0,
  maxAttempts: 3,
  postId: "post_002",
  accountId: "acc_001",
  createdAt: new Date("2026-04-10T09:00:00Z"),
  updatedAt: new Date("2026-04-10T09:00:00Z"),
};

const mockSchedule3: Schedule = {
  id: "sched_003",
  scheduledAt: new Date("2026-04-20T09:00:00Z"),
  variance: 20,
  status: "completed",
  attempts: 1,
  maxAttempts: 3,
  result: "success",
  postId: "post_003",
  accountId: "acc_002",
  createdAt: new Date("2026-04-10T10:00:00Z"),
  updatedAt: new Date("2026-04-20T09:30:00Z"),
};

describe("useScheduleStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useScheduleStore.setState({
      schedules: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: {},
    });
    // Clear all mocks
    vi.clearAllMocks();
  });

  // ============================================
  // PHASE 4.2: RED - Initial State Tests
  // ============================================
  describe("initial state", () => {
    it("has schedules set to empty array by default", () => {
      const state = useScheduleStore.getState();
      expect(state.schedules).toEqual([]);
      expect(state.schedules).toHaveLength(0);
    });

    it("has selectedId set to null by default", () => {
      const state = useScheduleStore.getState();
      expect(state.selectedId).toBeNull();
    });

    it("has loading set to false by default", () => {
      const state = useScheduleStore.getState();
      expect(state.loading).toBe(false);
    });

    it("has error set to null by default", () => {
      const state = useScheduleStore.getState();
      expect(state.error).toBeNull();
    });

    it("has filter set to empty object by default", () => {
      const state = useScheduleStore.getState();
      expect(state.filter).toEqual({});
    });
  });

  // ============================================
  // PHASE 4.2: RED - fetchSchedules Tests
  // ============================================
  describe("fetchSchedules", () => {
    it("sets loading to true during request", async () => {
      mockInvoke.mockResolvedValueOnce([mockSchedule1, mockSchedule2]);

      const filter: ScheduleFilter = { status: "pending" };
      const promise = act(async () => {
        await useScheduleStore.getState().fetchSchedules(filter);
      });

      // Check loading was set during the call
      expect(useScheduleStore.getState().loading).toBe(true);

      await promise;
    });

    it("populates schedules and sets loading to false on success", async () => {
      mockInvoke.mockResolvedValueOnce([mockSchedule1, mockSchedule2]);

      await act(async () => {
        await useScheduleStore.getState().fetchSchedules({ status: "pending" });
      });

      const state = useScheduleStore.getState();
      expect(state.schedules).toHaveLength(2);
      expect(state.schedules[0].id).toBe("sched_001");
      expect(state.schedules[1].id).toBe("sched_002");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("calls invoke with correct filter parameters", async () => {
      mockInvoke.mockResolvedValueOnce([mockSchedule1]);

      const filter: ScheduleFilter = {
        accountId: "acc_001",
        status: "pending",
        from: new Date("2026-04-01"),
        to: new Date("2026-04-30"),
      };

      await act(async () => {
        await useScheduleStore.getState().fetchSchedules(filter);
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_schedules", {
        account_id: "acc_001",
        status: "pending",
        from: "2026-04-01T00:00:00.000Z",
        to: "2026-04-30T00:00:00.000Z",
      });
    });

    it("sets error and keeps existing schedules on failure", async () => {
      // First, populate with existing data
      useScheduleStore.setState({ schedules: [mockSchedule3] });

      mockInvoke.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        await useScheduleStore.getState().fetchSchedules();
      });

      const state = useScheduleStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.loading).toBe(false);
      // Should keep existing schedules
      expect(state.schedules).toHaveLength(1);
      expect(state.schedules[0].id).toBe("sched_003");
    });

    it("uses empty filter when none provided", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await useScheduleStore.getState().fetchSchedules();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_schedules", {});
    });
  });

  // ============================================
  // PHASE 4.3: RED - schedulePost Tests
  // ============================================
  describe("schedulePost", () => {
    it("calls invoke with correct parameters", async () => {
      mockInvoke.mockResolvedValueOnce(mockSchedule1);

      await act(async () => {
        await useScheduleStore
          .getState()
          .schedulePost("post_001", new Date("2026-04-15T10:00:00Z"), 15);
      });

      expect(mockInvoke).toHaveBeenCalledWith("schedule_post", {
        post_id: "post_001",
        scheduled_at: "2026-04-15T10:00:00.000Z",
        variance: 15,
      });
    });

    it("adds new schedule to state and sorts by scheduledAt", async () => {
      // Pre-populate with an existing schedule
      useScheduleStore.setState({ schedules: [mockSchedule1] });

      mockInvoke.mockResolvedValueOnce(mockSchedule2);

      await act(async () => {
        await useScheduleStore
          .getState()
          .schedulePost("post_002", new Date("2026-04-12T14:00:00Z"), 10);
      });

      const state = useScheduleStore.getState();
      expect(state.schedules).toHaveLength(2);
      // Should be sorted by scheduledAt ascending
      expect(state.schedules[0].id).toBe("sched_002"); // April 12
      expect(state.schedules[1].id).toBe("sched_001"); // April 15
    });

    it("uses default variance of 15 when not provided", async () => {
      mockInvoke.mockResolvedValueOnce(mockSchedule1);

      await act(async () => {
        await useScheduleStore
          .getState()
          .schedulePost("post_001", new Date("2026-04-15T10:00:00Z"));
      });

      expect(mockInvoke).toHaveBeenCalledWith("schedule_post", {
        post_id: "post_001",
        scheduled_at: "2026-04-15T10:00:00.000Z",
        variance: 15,
      });
    });

    it("returns the created schedule", async () => {
      mockInvoke.mockResolvedValueOnce(mockSchedule1);

      let result: Schedule | undefined;
      await act(async () => {
        result = await useScheduleStore
          .getState()
          .schedulePost("post_001", new Date("2026-04-15T10:00:00Z"), 15);
      });

      expect(result).toEqual(mockSchedule1);
    });

    it("sets error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Post not found"));

      await act(async () => {
        try {
          await useScheduleStore
            .getState()
            .schedulePost("invalid_post", new Date("2026-04-15T10:00:00Z"));
        } catch (e) {
          // Expected to throw
        }
      });

      const state = useScheduleStore.getState();
      expect(state.error).toBe("Post not found");
    });
  });

  // ============================================
  // PHASE 4.4: RED - cancelSchedule Tests
  // ============================================
  describe("cancelSchedule", () => {
    it("calls invoke with correct schedule_id", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useScheduleStore.getState().cancelSchedule("sched_001");
      });

      expect(mockInvoke).toHaveBeenCalledWith("cancel_schedule", {
        schedule_id: "sched_001",
      });
    });

    it("removes schedule from state after cancellation", async () => {
      useScheduleStore.setState({ schedules: [mockSchedule1, mockSchedule2] });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useScheduleStore.getState().cancelSchedule("sched_001");
      });

      const state = useScheduleStore.getState();
      expect(state.schedules).toHaveLength(1);
      expect(state.schedules[0].id).toBe("sched_002");
    });

    it("clears selectedId if matches cancelled schedule", async () => {
      useScheduleStore.setState({
        schedules: [mockSchedule1],
        selectedId: "sched_001",
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useScheduleStore.getState().cancelSchedule("sched_001");
      });

      const state = useScheduleStore.getState();
      expect(state.selectedId).toBeNull();
    });

    it("keeps selectedId if different schedule cancelled", async () => {
      useScheduleStore.setState({
        schedules: [mockSchedule1, mockSchedule2],
        selectedId: "sched_001",
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useScheduleStore.getState().cancelSchedule("sched_002");
      });

      const state = useScheduleStore.getState();
      expect(state.selectedId).toBe("sched_001");
    });

    it("sets error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Schedule not found"));

      await act(async () => {
        await useScheduleStore.getState().cancelSchedule("invalid_sched");
      });

      const state = useScheduleStore.getState();
      expect(state.error).toBe("Schedule not found");
    });
  });

  // ============================================
  // Additional Actions Tests
  // ============================================
  describe("updateSchedule", () => {
    it("calls invoke with correct parameters", async () => {
      const updatedSchedule: Schedule = {
        ...mockSchedule1,
        scheduledAt: new Date("2026-04-16T12:00:00Z"),
        variance: 20,
      };
      mockInvoke.mockResolvedValueOnce(updatedSchedule);

      await act(async () => {
        await useScheduleStore.getState().updateSchedule("sched_001", {
          scheduledAt: new Date("2026-04-16T12:00:00Z"),
          variance: 20,
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_schedule", {
        schedule_id: "sched_001",
        scheduled_at: "2026-04-16T12:00:00.000Z",
        variance: 20,
      });
    });

    it("updates schedule in state", async () => {
      useScheduleStore.setState({ schedules: [mockSchedule1] });

      const updatedSchedule: Schedule = {
        ...mockSchedule1,
        variance: 25,
      };
      mockInvoke.mockResolvedValueOnce(updatedSchedule);

      await act(async () => {
        await useScheduleStore.getState().updateSchedule("sched_001", {
          variance: 25,
        });
      });

      const state = useScheduleStore.getState();
      expect(state.schedules[0].variance).toBe(25);
    });

    it("resorts schedules after update", async () => {
      useScheduleStore.setState({ schedules: [mockSchedule1, mockSchedule2] });

      const updatedSchedule: Schedule = {
        ...mockSchedule1,
        scheduledAt: new Date("2026-04-20T10:00:00Z"), // Later than mockSchedule2
      };
      mockInvoke.mockResolvedValueOnce(updatedSchedule);

      await act(async () => {
        await useScheduleStore.getState().updateSchedule("sched_001", {
          scheduledAt: new Date("2026-04-20T10:00:00Z"),
        });
      });

      const state = useScheduleStore.getState();
      // mockSchedule2 (April 12) should be first now
      expect(state.schedules[0].id).toBe("sched_002");
      expect(state.schedules[1].id).toBe("sched_001");
    });
  });

  describe("selectSchedule", () => {
    it("sets selectedId to provided id", () => {
      act(() => {
        useScheduleStore.getState().selectSchedule("sched_001");
      });

      expect(useScheduleStore.getState().selectedId).toBe("sched_001");
    });

    it("sets selectedId to null when null provided", () => {
      useScheduleStore.setState({ selectedId: "sched_001" });

      act(() => {
        useScheduleStore.getState().selectSchedule(null);
      });

      expect(useScheduleStore.getState().selectedId).toBeNull();
    });
  });

  describe("setFilter", () => {
    it("updates filter in state", () => {
      const filter: ScheduleFilter = {
        status: "pending",
        accountId: "acc_001",
      };

      act(() => {
        useScheduleStore.getState().setFilter(filter);
      });

      expect(useScheduleStore.getState().filter).toEqual(filter);
    });

    it("merges with existing filter", () => {
      useScheduleStore.setState({ filter: { status: "pending" } });

      act(() => {
        useScheduleStore.getState().setFilter({ accountId: "acc_001" });
      });

      expect(useScheduleStore.getState().filter).toEqual({
        status: "pending",
        accountId: "acc_001",
      });
    });
  });

  describe("type safety", () => {
    it("store has all required actions", () => {
      const state = useScheduleStore.getState();
      expect(typeof state.fetchSchedules).toBe("function");
      expect(typeof state.schedulePost).toBe("function");
      expect(typeof state.cancelSchedule).toBe("function");
      expect(typeof state.updateSchedule).toBe("function");
      expect(typeof state.selectSchedule).toBe("function");
      expect(typeof state.setFilter).toBe("function");
    });
  });
});
