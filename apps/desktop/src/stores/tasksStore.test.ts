import type {
	CreateTaskInput,
	Platform,
	Task,
	TaskFilter,
	TaskStatus,
} from "@social-pip/types";
import { act } from "@testing-library/react";
// removed unused import
import { useTasksStore } from "./tasksStore";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.mocked(invoke);

const mockTask1: Task = {
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

const mockTask2: Task = {
	id: "task_002",
	type: "message",
	platform: "instagram" as Platform,
	accountId: "acc_002",
	status: "running" as TaskStatus,
	priority: 2,
	retryCount: 0,
	maxRetries: 3,
	createdAt: new Date("2024-01-02T00:00:00Z"),
	updatedAt: new Date("2024-01-02T00:00:00Z"),
};

const mockTask3: Task = {
	id: "task_003",
	type: "story",
	platform: "tiktok" as Platform,
	accountId: "acc_003",
	status: "completed" as TaskStatus,
	priority: 3,
	retryCount: 1,
	maxRetries: 3,
	createdAt: new Date("2024-01-03T00:00:00Z"),
	updatedAt: new Date("2024-01-03T00:00:00Z"),
};

describe("useTasksStore", () => {
	beforeEach(() => {
		useTasksStore.setState({
			tasks: [],
			selectedId: null,
			loading: false,
			error: null,
			filter: {},
		});
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("has empty tasks array by default", () => {
			const state = useTasksStore.getState();
			expect(state.tasks).toEqual([]);
		});

		it("has selectedId set to null by default", () => {
			const state = useTasksStore.getState();
			expect(state.selectedId).toBeNull();
		});

		it("has loading set to false by default", () => {
			const state = useTasksStore.getState();
			expect(state.loading).toBe(false);
		});

		it("has error set to null by default", () => {
			const state = useTasksStore.getState();
			expect(state.error).toBeNull();
		});

		it("has filter set to empty object by default", () => {
			const state = useTasksStore.getState();
			expect(state.filter).toEqual({});
		});
	});

	describe("fetchTasks", () => {
		it("invokes Tauri get_tasks and populates state", async () => {
			const apiTasks = [
				{
					id: "task_001",
					type: "post",
					platform: "facebook",
					account_id: "acc_001",
					status: "pending",
					priority: 1,
					retry_count: 0,
					max_retries: 3,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
				},
			];
			mockInvoke.mockResolvedValueOnce(apiTasks);

			await act(async () => {
				await useTasksStore.getState().fetchTasks();
			});

			const state = useTasksStore.getState();
			expect(mockInvoke).toHaveBeenCalledWith("get_tasks", {});
			expect(state.tasks).toHaveLength(1);
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
		});

		it("sets loading to true during fetch", async () => {
			mockInvoke.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
			);

			const promise = act(async () => {
				await useTasksStore.getState().fetchTasks();
			});

			expect(useTasksStore.getState().loading).toBe(true);

			await promise;
		});

		it("handles errors and sets error state", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Network error"));

			await act(async () => {
				await useTasksStore.getState().fetchTasks();
			});

			const state = useTasksStore.getState();
			expect(state.error).toBe("Network error");
			expect(state.loading).toBe(false);
		});

		it("passes filter params to Tauri invoke", async () => {
			mockInvoke.mockResolvedValueOnce([]);

			const filter: TaskFilter = { status: "pending" };

			await act(async () => {
				await useTasksStore.getState().fetchTasks(filter);
			});

			expect(mockInvoke).toHaveBeenCalledWith("get_tasks", {
				status: "pending",
			});
		});
	});

	describe("createTask", () => {
		it("creates task via Tauri and adds to state", async () => {
			const newApiTask = {
				id: "task_new",
				type: "post",
				platform: "twitter",
				account_id: "acc_new",
				status: "pending",
				priority: 0,
				retry_count: 0,
				max_retries: 3,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			};
			mockInvoke.mockResolvedValueOnce(newApiTask);

			useTasksStore.setState({ tasks: [mockTask1] });

			const input: CreateTaskInput = {
				type: "post",
				platform: "twitter" as Platform,
				accountId: "acc_new",
			};

			let result: Task | undefined;
			await act(async () => {
				result = await useTasksStore.getState().createTask(input);
			});

			expect(result).toBeDefined();
			expect(result?.id).toBe("task_new");

			const state = useTasksStore.getState();
			expect(state.tasks).toHaveLength(2);
			expect(state.tasks[0]?.id).toBe("task_new");
		});

		it("handles creation errors", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Creation failed"));

			const input: CreateTaskInput = {
				type: "post",
				platform: "facebook" as Platform,
				accountId: "acc_001",
			};

			await act(async () => {
				try {
					await useTasksStore.getState().createTask(input);
				} catch {
					// Expected
				}
			});

			const state = useTasksStore.getState();
			expect(state.error).toBe("Creation failed");
		});
	});

	describe("updateTaskStatus", () => {
		it("updates task status via Tauri", async () => {
			const updatedApiTask = {
				...mockTask1,
				status: "completed",
				updated_at: "2024-01-01T01:00:00Z",
			};
			mockInvoke.mockResolvedValueOnce(updatedApiTask);

			useTasksStore.setState({ tasks: [mockTask1] });

			await act(async () => {
				await useTasksStore
					.getState()
					.updateTaskStatus("task_001", "completed");
			});

			const state = useTasksStore.getState();
			expect(state.tasks[0]?.status).toBe("completed");
			expect(state.error).toBeNull();
		});

		it("handles update errors", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Update failed"));

			useTasksStore.setState({ tasks: [mockTask1] });

			await act(async () => {
				try {
					await useTasksStore
						.getState()
						.updateTaskStatus("task_001", "completed");
				} catch {
					// Expected
				}
			});

			const state = useTasksStore.getState();
			expect(state.error).toBe("Update failed");
		});
	});

	describe("cancelTask", () => {
		it("cancels task via Tauri", async () => {
			mockInvoke.mockResolvedValueOnce(undefined);

			useTasksStore.setState({ tasks: [mockTask1] });

			await act(async () => {
				await useTasksStore.getState().cancelTask("task_001");
			});

			const state = useTasksStore.getState();
			expect(state.tasks[0]?.status).toBe("cancelled");
			expect(mockInvoke).toHaveBeenCalledWith("cancel_task", {
				id: "task_001",
			});
		});

		it("handles cancel errors", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Cancel failed"));

			useTasksStore.setState({ tasks: [mockTask1] });

			await act(async () => {
				await useTasksStore.getState().cancelTask("task_001");
			});

			const state = useTasksStore.getState();
			expect(state.error).toBe("Cancel failed");
		});
	});

	describe("retryTask", () => {
		it("retries task via Tauri", async () => {
			const retriedApiTask = {
				...mockTask1,
				status: "pending",
				retry_count: 1,
			};
			mockInvoke.mockResolvedValueOnce(retriedApiTask);

			useTasksStore.setState({ tasks: [{ ...mockTask1, status: "failed" }] });

			await act(async () => {
				await useTasksStore.getState().retryTask("task_001");
			});

			expect(mockInvoke).toHaveBeenCalledWith("retry_task", { id: "task_001" });
		});
	});

	describe("selectTask", () => {
		it("sets selectedId", () => {
			act(() => {
				useTasksStore.getState().selectTask("task_001");
			});

			expect(useTasksStore.getState().selectedId).toBe("task_001");
		});

		it("can deselect by setting to null", () => {
			useTasksStore.setState({ selectedId: "task_001" });

			act(() => {
				useTasksStore.getState().selectTask(null);
			});

			expect(useTasksStore.getState().selectedId).toBeNull();
		});
	});

	describe("setFilter", () => {
		it("updates filter state", () => {
			const filter: TaskFilter = { status: "pending" };

			act(() => {
				useTasksStore.getState().setFilter(filter);
			});

			const state = useTasksStore.getState();
			expect(state.filter).toEqual(filter);
		});

		it("merges with existing filter", () => {
			useTasksStore.setState({ filter: { status: "pending" } });

			act(() => {
				useTasksStore.getState().setFilter({ type: "post" });
			});

			const state = useTasksStore.getState();
			expect(state.filter).toEqual({ status: "pending", type: "post" });
		});
	});

	describe("getTasksByStatus", () => {
		it("filters tasks by status", () => {
			useTasksStore.setState({ tasks: [mockTask1, mockTask2, mockTask3] });

			const pending = useTasksStore.getState().getTasksByStatus("pending");
			expect(pending).toHaveLength(1);
			expect(pending[0]?.id).toBe("task_001");

			const completed = useTasksStore.getState().getTasksByStatus("completed");
			expect(completed).toHaveLength(1);
			expect(completed[0]?.id).toBe("task_003");
		});

		it("returns empty array when no matches", () => {
			useTasksStore.setState({ tasks: [mockTask1] });

			const failed = useTasksStore.getState().getTasksByStatus("failed");
			expect(failed).toEqual([]);
		});
	});

	describe("getTasksByPlatform", () => {
		it("filters tasks by platform", () => {
			useTasksStore.setState({ tasks: [mockTask1, mockTask2, mockTask3] });

			const facebook = useTasksStore
				.getState()
				.getTasksByPlatform("facebook" as Platform);
			expect(facebook).toHaveLength(1);
			expect(facebook[0]?.id).toBe("task_001");

			const instagram = useTasksStore
				.getState()
				.getTasksByPlatform("instagram" as Platform);
			expect(instagram).toHaveLength(1);
			expect(instagram[0]?.id).toBe("task_002");
		});
	});
});
