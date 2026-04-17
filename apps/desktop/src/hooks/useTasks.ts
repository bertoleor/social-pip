import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { useTasksStore } from "@/stores/tasksStore";
import type { CreateTaskInput, Platform, TaskFilter, TaskStatus } from "@social-pip/types";
import { useCallback, useEffect } from "react";

export interface UseTasksOptions {
  filter?: TaskFilter;
  autoFetch?: boolean;
}

export interface UseTasksReturn {
  tasks: ReturnType<typeof useTasksStore.getState>["tasks"];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  selectedTask: ReturnType<typeof useTasksStore.getState>["tasks"][number] | undefined;
  fetchTasks: (filter?: TaskFilter) => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<boolean>;
  updateTaskStatus: (id: string, status: TaskStatus, result?: string) => Promise<boolean>;
  cancelTask: (id: string) => Promise<boolean>;
  retryTask: (id: string) => Promise<boolean>;
  selectTask: (id: string | null) => void;
  setFilter: (filter: TaskFilter) => void;
  getTasksByStatus: (status: TaskStatus) => ReturnType<typeof useTasksStore.getState>["tasks"];
  getTasksByPlatform: (platform: Platform) => ReturnType<typeof useTasksStore.getState>["tasks"];
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { filter, autoFetch = true } = options;

  const {
    tasks,
    loading,
    error,
    selectedId,
    fetchTasks,
    createTask: storeCreateTask,
    updateTaskStatus: storeUpdateTaskStatus,
    cancelTask: storeCancelTask,
    retryTask: storeRetryTask,
    selectTask,
    setFilter,
    getTasksByStatus,
    getTasksByPlatform,
  } = useTasksStore();

  useEffect(() => {
    if (autoFetch) {
      fetchTasks(filter).catch((err) => {
        console.error("Failed to fetch tasks:", err);
      });
    }
  }, [autoFetch, filter, fetchTasks]);

  const createTask = useCallback(
    async (data: CreateTaskInput): Promise<boolean> => {
      try {
        await storeCreateTask(data);
        toast.success("Task created successfully");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create task";
        toast.error(message);
        return false;
      }
    },
    [storeCreateTask],
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus, result?: string): Promise<boolean> => {
      try {
        await storeUpdateTaskStatus(id, status, result);
        toast.success("Task status updated");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update task";
        toast.error(message);
        return false;
      }
    },
    [storeUpdateTaskStatus],
  );

  const cancelTask = useCallback(
    async (id: string): Promise<boolean> => {
      const confirmed = await confirm("Cancel Task", "Are you sure you want to cancel this task?", {
        confirmText: "Cancel Task",
        cancelText: "Keep Running",
      });

      if (!confirmed) {
        return false;
      }

      try {
        await storeCancelTask(id);
        toast.success("Task cancelled");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel task";
        toast.error(message);
        return false;
      }
    },
    [storeCancelTask],
  );

  const retryTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await storeRetryTask(id);
        toast.success("Task retry initiated");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to retry task";
        toast.error(message);
        return false;
      }
    },
    [storeRetryTask],
  );

  const selectedTask = tasks.find((t) => t.id === selectedId);

  return {
    tasks,
    loading,
    error,
    selectedId,
    selectedTask,
    fetchTasks,
    createTask,
    updateTaskStatus,
    cancelTask,
    retryTask,
    selectTask,
    setFilter,
    getTasksByStatus,
    getTasksByPlatform,
  };
}
