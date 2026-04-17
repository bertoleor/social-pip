import { useTasksStore } from "@/stores/tasksStore";
import type { CreateTaskInput, Platform, Task, TaskStatus } from "@social-pip/types";
import { act, renderHook, waitFor } from "@testing-library/react";
// removed unused import
import { useTasks } from "./useTasks";

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/dialog", () => ({
  confirm: vi.fn().mockResolvedValue(true),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.mocked(invoke);
const mockToast = vi.mocked(toast);
const mockConfirm = vi.mocked(confirm);

const mockTask: Task = {
  id: "task_001",
  type: "post",
  platform: "facebook" as Platform,
  accountId: "acc_001",
  status: "pending" as TaskStatus,
  priority: 1,
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

describe("useTasks", () => {
  beforeEach(() => {
    useTasksStore.setState({
      tasks: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: {},
    });
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue([]);
  });

  describe("initial state", () => {
    it("returns tasks from store", () => {
      useTasksStore.setState({ tasks: [mockTask] });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]?.id).toBe("task_001");
    });

    it("returns loading state from store", () => {
      useTasksStore.setState({ loading: true });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      expect(result.current.loading).toBe(true);
    });

    it("returns error state from store", () => {
      useTasksStore.setState({ error: "Some error" });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      expect(result.current.error).toBe("Some error");
    });

    it("returns selectedId from store", () => {
      useTasksStore.setState({ selectedId: "task_001" });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      expect(result.current.selectedId).toBe("task_001");
    });

    it("returns selectedTask when selectedId matches a task", () => {
      useTasksStore.setState({
        tasks: [mockTask],
        selectedId: "task_001",
      });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      expect(result.current.selectedTask).toBeDefined();
      expect(result.current.selectedTask?.id).toBe("task_001");
    });

    it("returns undefined selectedTask when no match", () => {
      useTasksStore.setState({
        tasks: [mockTask],
        selectedId: "nonexistent",
      });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      expect(result.current.selectedTask).toBeUndefined();
    });
  });

  describe("autoFetch", () => {
    it("fetches tasks on mount when autoFetch is true", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      renderHook(() => useTasks({ autoFetch: true }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("get_tasks", {});
      });
    });

    it("does not fetch when autoFetch is false", () => {
      renderHook(() => useTasks({ autoFetch: false }));

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("fetches with filter when provided", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      renderHook(() =>
        useTasks({
          autoFetch: true,
          filter: { status: "pending" },
        }),
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled();
      });
    });
  });

  describe("createTask", () => {
    it("creates task and shows success toast", async () => {
      const newApiTask = {
        id: "task_new",
        type: "post",
        platform: "facebook",
        account_id: "acc_001",
        status: "pending",
        priority: 0,
        retry_count: 0,
        max_retries: 3,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      mockInvoke.mockResolvedValueOnce(newApiTask);

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      const input: CreateTaskInput = {
        type: "post",
        platform: "facebook" as Platform,
        accountId: "acc_001",
      };

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createTask(input);
      });

      expect(success).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith("Task created successfully");
    });

    it("shows error toast on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Creation failed"));

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      const input: CreateTaskInput = {
        type: "post",
        platform: "facebook" as Platform,
        accountId: "acc_001",
      };

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createTask(input);
      });

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith("Creation failed");
    });
  });

  describe("updateTaskStatus", () => {
    it("updates status and shows success toast", async () => {
      mockInvoke.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateTaskStatus("task_001", "completed");
      });

      expect(success).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith("Task status updated");
    });

    it("shows error toast on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Update failed"));

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.updateTaskStatus("task_001", "completed");
      });

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  describe("cancelTask", () => {
    it("cancels task after confirmation", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.cancelTask("task_001");
      });

      expect(success).toBe(true);
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith("Task cancelled");
    });

    it("does not cancel if not confirmed", async () => {
      mockConfirm.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.cancelTask("task_001");
      });

      expect(success).toBe(false);
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe("retryTask", () => {
    it("retries task and shows success toast", async () => {
      mockInvoke.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.retryTask("task_001");
      });

      expect(success).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith("Task retry initiated");
    });

    it("shows error toast on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Retry failed"));

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.retryTask("task_001");
      });

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith("Retry failed");
    });
  });

  describe("selectTask", () => {
    it("selects task in store", () => {
      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      act(() => {
        result.current.selectTask("task_001");
      });

      expect(useTasksStore.getState().selectedId).toBe("task_001");
    });

    it("deselects task with null", () => {
      useTasksStore.setState({ selectedId: "task_001" });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      act(() => {
        result.current.selectTask(null);
      });

      expect(useTasksStore.getState().selectedId).toBeNull();
    });
  });

  describe("setFilter", () => {
    it("updates filter in store", () => {
      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      act(() => {
        result.current.setFilter({ status: "pending" });
      });

      expect(useTasksStore.getState().filter).toEqual({ status: "pending" });
    });
  });

  describe("getTasksByStatus", () => {
    it("returns filtered tasks", () => {
      useTasksStore.setState({
        tasks: [
          { ...mockTask, id: "task_001", status: "pending" },
          { ...mockTask, id: "task_002", status: "running" },
          { ...mockTask, id: "task_003", status: "pending" },
        ],
      });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      const pending = result.current.getTasksByStatus("pending");
      expect(pending).toHaveLength(2);
    });
  });

  describe("getTasksByPlatform", () => {
    it("returns filtered tasks", () => {
      useTasksStore.setState({
        tasks: [
          { ...mockTask, id: "task_001", platform: "facebook" as Platform },
          { ...mockTask, id: "task_002", platform: "instagram" as Platform },
          { ...mockTask, id: "task_003", platform: "facebook" as Platform },
        ],
      });

      const { result } = renderHook(() => useTasks({ autoFetch: false }));

      const facebook = result.current.getTasksByPlatform("facebook" as Platform);
      expect(facebook).toHaveLength(2);
    });
  });
});
