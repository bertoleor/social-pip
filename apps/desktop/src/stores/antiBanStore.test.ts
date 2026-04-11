import type { AntiBanStats, Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
/**
 * @fileoverview AntiBan store tests (TDD)
 */
// removed unused import
import { useAntiBanStore } from "./antiBanStore";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

// Mock AntiBanStats for testing
const mockAntiBanStats: AntiBanStats = {
	hourly_count: 5,
	daily_count: 25,
	success_rate: 0.95,
	batch_count: 3,
	config: {
		platform: "facebook",
		min_action_delay_ms: 60000,
		max_action_delay_ms: 240000,
		hourly_action_limit: 50,
		daily_action_limit: 300,
		batch_size: 10,
		batch_break_minutes: 20,
	},
};

describe("useAntiBanStore", () => {
	beforeEach(() => {
		// Reset store to initial state before each test
		useAntiBanStore.setState({
			stats: null,
			loading: false,
			error: null,
			platform: null,
		});
		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("has stats set to null by default", () => {
			const state = useAntiBanStore.getState();
			expect(state.stats).toBeNull();
		});

		it("has loading set to false by default", () => {
			const state = useAntiBanStore.getState();
			expect(state.loading).toBe(false);
		});

		it("has error set to null by default", () => {
			const state = useAntiBanStore.getState();
			expect(state.error).toBeNull();
		});

		it("has platform set to null by default", () => {
			const state = useAntiBanStore.getState();
			expect(state.platform).toBeNull();
		});
	});

	describe("initAntiBan", () => {
		it("sets loading to true and calls invoke on initialization", async () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			const platform: Platform = "facebook";
			const promise = act(async () => {
				await useAntiBanStore.getState().initAntiBan(platform);
			});

			// Check loading was set during the call
			expect(useAntiBanStore.getState().loading).toBe(true);

			await promise;

			// Check invoke was called with correct params
			expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", { platform });
		});

		it("sets stats and loading to false on success", async () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			await act(async () => {
				await useAntiBanStore.getState().initAntiBan("facebook");
			});

			const state = useAntiBanStore.getState();
			expect(state.stats).toEqual(mockAntiBanStats);
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
			expect(state.platform).toBe("facebook");
		});

		it("sets error and loading to false on failure", async () => {
			const errorMessage = "Failed to initialize anti-ban engine";
			mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

			await act(async () => {
				await useAntiBanStore.getState().initAntiBan("facebook");
			});

			const state = useAntiBanStore.getState();
			expect(state.error).toBe(errorMessage);
			expect(state.loading).toBe(false);
			expect(state.stats).toBeNull();
		});

		it("handles unknown errors gracefully", async () => {
			mockInvoke.mockRejectedValueOnce("Unknown error string");

			await act(async () => {
				await useAntiBanStore.getState().initAntiBan("facebook");
			});

			const state = useAntiBanStore.getState();
			expect(state.error).toBe("Unknown error string");
			expect(state.loading).toBe(false);
		});
	});

	describe("refreshStats", () => {
		it("calls invoke with get_anti_ban_stats and updates stats", async () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			// First initialize with some state
			useAntiBanStore.setState({ platform: "facebook" });

			await act(async () => {
				await useAntiBanStore.getState().refreshStats();
			});

			expect(mockInvoke).toHaveBeenCalledWith("get_anti_ban_stats");
			const state = useAntiBanStore.getState();
			expect(state.stats).toEqual(mockAntiBanStats);
		});

		it("does not update stats if null is returned", async () => {
			mockInvoke.mockResolvedValueOnce(null);

			await act(async () => {
				await useAntiBanStore.getState().refreshStats();
			});

			const state = useAntiBanStore.getState();
			expect(state.stats).toBeNull();
		});

		it("sets error on failure", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Network error"));

			await act(async () => {
				await useAntiBanStore.getState().refreshStats();
			});

			const state = useAntiBanStore.getState();
			expect(state.error).toBe("Network error");
		});
	});

	describe("recordAction", () => {
		it("calls invoke with record_post_action and updates stats", async () => {
			const updatedStats: AntiBanStats = {
				...mockAntiBanStats,
				hourly_count: 6,
				daily_count: 26,
			};
			mockInvoke.mockResolvedValueOnce(updatedStats);

			useAntiBanStore.setState({
				platform: "facebook",
				stats: mockAntiBanStats,
			});

			await act(async () => {
				await useAntiBanStore.getState().recordAction("post_feed", true, 5000);
			});

			expect(mockInvoke).toHaveBeenCalledWith("record_post_action", {
				platform: "facebook",
				actionType: "post_feed",
				success: true,
				delayUsedMs: 5000,
			});

			const state = useAntiBanStore.getState();
			expect(state.stats).toEqual(updatedStats);
		});

		it("works without delayMs parameter", async () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			useAntiBanStore.setState({ platform: "facebook" });

			await act(async () => {
				await useAntiBanStore.getState().recordAction("post_feed", false);
			});

			expect(mockInvoke).toHaveBeenCalledWith("record_post_action", {
				platform: "facebook",
				actionType: "post_feed",
				success: false,
				delayUsedMs: undefined,
			});
		});

		it("sets error on failure", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Recording failed"));

			useAntiBanStore.setState({ platform: "facebook" });

			await act(async () => {
				await useAntiBanStore.getState().recordAction("post_feed", true);
			});

			const state = useAntiBanStore.getState();
			expect(state.error).toBe("Recording failed");
		});
	});

	describe("reset", () => {
		it("clears state to initial values", () => {
			// Set some state first
			useAntiBanStore.setState({
				stats: mockAntiBanStats,
				loading: true,
				error: "Some error",
				platform: "facebook",
			});

			act(() => {
				useAntiBanStore.getState().reset();
			});

			const state = useAntiBanStore.getState();
			expect(state.stats).toBeNull();
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
			expect(state.platform).toBeNull();
		});

		it("can be called multiple times without error", () => {
			act(() => {
				useAntiBanStore.getState().reset();
				useAntiBanStore.getState().reset();
			});

			const state = useAntiBanStore.getState();
			expect(state.stats).toBeNull();
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
			expect(state.platform).toBeNull();
		});
	});

	describe("type safety", () => {
		it("store has all required actions", () => {
			const state = useAntiBanStore.getState();
			expect(typeof state.initAntiBan).toBe("function");
			expect(typeof state.refreshStats).toBe("function");
			expect(typeof state.recordAction).toBe("function");
			expect(typeof state.reset).toBe("function");
		});
	});
});
