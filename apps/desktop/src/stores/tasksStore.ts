import type {
	CreateTaskInput,
	Platform,
	Task,
	TaskFilter,
	TaskStatus,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export interface TasksState {
	tasks: Task[];
	selectedId: string | null;
	loading: boolean;
	error: string | null;
	filter: TaskFilter;
	fetchTasks: (filter?: TaskFilter) => Promise<void>;
	createTask: (data: CreateTaskInput) => Promise<Task>;
	updateTaskStatus: (
		id: string,
		status: TaskStatus,
		result?: string,
	) => Promise<void>;
	cancelTask: (id: string) => Promise<void>;
	retryTask: (id: string) => Promise<void>;
	selectTask: (id: string | null) => void;
	setFilter: (filter: TaskFilter) => void;
	getTasksByStatus: (status: TaskStatus) => Task[];
	getTasksByPlatform: (platform: Platform) => Task[];
}

function filterToParams(
	filter: TaskFilter,
): Record<string, string | undefined> {
	const params: Record<string, string | undefined> = {};

	if (filter.accountId !== undefined) {
		params["account_id"] = filter.accountId;
	}
	if (filter.platform !== undefined) {
		params["platform"] = filter.platform;
	}
	if (filter.status !== undefined) {
		params["status"] = filter.status;
	}
	if (filter.type !== undefined) {
		params["task_type"] = filter.type;
	}

	return params;
}

function apiTaskToTask(apiTask: Record<string, unknown>): Task {
	return {
		id: apiTask["id"] as string,
		type: apiTask["type"] as Task["type"],
		platform: apiTask["platform"] as Platform,
		accountId: apiTask["account_id"] as string,
		postId: apiTask["post_id"] as string | undefined,
		status: apiTask["status"] as TaskStatus,
		priority: (apiTask["priority"] as number) ?? 0,
		scheduledAt:
			apiTask["scheduled_at"] !== undefined && apiTask["scheduled_at"] !== null
				? new Date(apiTask["scheduled_at"] as string)
				: undefined,
		startedAt:
			apiTask["started_at"] !== undefined && apiTask["started_at"] !== null
				? new Date(apiTask["started_at"] as string)
				: undefined,
		completedAt:
			apiTask["completed_at"] !== undefined && apiTask["completed_at"] !== null
				? new Date(apiTask["completed_at"] as string)
				: undefined,
		result: apiTask["result"] as string | undefined,
		errorMessage: apiTask["error_message"] as string | undefined,
		retryCount: (apiTask["retry_count"] as number) ?? 0,
		maxRetries: (apiTask["max_retries"] as number) ?? 3,
		createdAt: new Date(apiTask["created_at"] as string),
		updatedAt: new Date(apiTask["updated_at"] as string),
	};
}

export const useTasksStore = create<TasksState>((set, get) => ({
	tasks: [],
	selectedId: null,
	loading: false,
	error: null,
	filter: {},

	fetchTasks: async (filter?: TaskFilter) => {
		const currentFilter = filter ?? get().filter;
		set({ loading: true, error: null });

		try {
			const params = filterToParams(currentFilter);
			const apiTasks = await invoke<Record<string, unknown>[]>(
				"get_tasks",
				params,
			);
			const tasks = apiTasks.map(apiTaskToTask);
			set({ tasks, loading: false, error: null });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage, loading: false });
		}
	},

	createTask: async (data: CreateTaskInput) => {
		const params: Record<string, string | number | undefined> = {
			type: data.type,
			platform: data.platform,
			account_id: data.accountId,
			priority: data.priority ?? 0,
			max_retries: data.maxRetries ?? 3,
		};

		if (data.postId !== undefined) {
			params["post_id"] = data.postId;
		}
		if (data.scheduledAt !== undefined) {
			params["scheduled_at"] = data.scheduledAt.toISOString();
		}

		try {
			const apiTask = await invoke<Record<string, unknown>>(
				"create_task",
				params,
			);
			const task = apiTaskToTask(apiTask);

			const currentTasks = get().tasks;
			set({ tasks: [task, ...currentTasks], error: null });

			return task;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
			throw error;
		}
	},

	updateTaskStatus: async (id: string, status: TaskStatus, result?: string) => {
		const params: Record<string, string> = { id, status };

		if (result !== undefined) {
			params["result"] = result;
		}

		try {
			const apiTask = await invoke<Record<string, unknown>>(
				"update_task_status",
				params,
			);
			const task = apiTaskToTask(apiTask);

			const currentTasks = get().tasks;
			const updatedTasks = currentTasks.map((t) => (t.id === id ? task : t));
			set({ tasks: updatedTasks, error: null });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
			throw error;
		}
	},

	cancelTask: async (id: string) => {
		try {
			await invoke<void>("cancel_task", { id });

			const currentTasks = get().tasks;
			const updatedTasks = currentTasks.map((t) =>
				t.id === id ? { ...t, status: "cancelled" as TaskStatus } : t,
			);
			set({ tasks: updatedTasks, error: null });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
		}
	},

	retryTask: async (id: string) => {
		try {
			const apiTask = await invoke<Record<string, unknown>>("retry_task", {
				id,
			});
			const task = apiTaskToTask(apiTask);

			const currentTasks = get().tasks;
			const updatedTasks = currentTasks.map((t) => (t.id === id ? task : t));
			set({ tasks: updatedTasks, error: null });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
			throw error;
		}
	},

	selectTask: (id: string | null) => {
		set({ selectedId: id });
	},

	setFilter: (filter: TaskFilter) => {
		const currentFilter = get().filter;
		set({ filter: { ...currentFilter, ...filter } });
	},

	getTasksByStatus: (status: TaskStatus) => {
		return get().tasks.filter((t) => t.status === status);
	},

	getTasksByPlatform: (platform: Platform) => {
		return get().tasks.filter((t) => t.platform === platform);
	},
}));
