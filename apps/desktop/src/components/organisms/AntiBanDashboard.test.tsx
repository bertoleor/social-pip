import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useAntiBanStore } from "@/stores/antiBanStore";
import type { AntiBanStats, Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { AntiBanDashboard } from "./AntiBanDashboard";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

// Mock AntiBanStats for testing
const mockAntiBanStats: AntiBanStats = {
	hourly_count: 15,
	daily_count: 120,
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

describe("AntiBanDashboard", () => {
	beforeEach(() => {
		// Reset store to initial state before each test
		useAntiBanStore.setState({
			stats: null,
			loading: false,
			error: null,
			platform: null,
		});
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("renders with platform selector dropdown", () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			render(<AntiBanDashboard />);

			expect(screen.getByLabelText("Select platform")).toBeInTheDocument();
		});

		it("displays AntiBanStatsCard with current platform stats", async () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			render(<AntiBanDashboard defaultPlatform="facebook" />);

			await waitFor(() => {
				expect(screen.getByText("Facebook")).toBeInTheDocument();
			});
		});
	});

	describe("platform switching", () => {
		it("switching platform calls initAntiBan with new platform", async () => {
			mockInvoke.mockResolvedValue(mockAntiBanStats);

			render(<AntiBanDashboard defaultPlatform="facebook" />);

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", {
					platform: "facebook",
				});
			});

			mockInvoke.mockClear();

			// Switch to Instagram
			const selector = screen.getByLabelText("Select platform");
			fireEvent.change(selector, { target: { value: "instagram" } });

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", {
					platform: "instagram",
				});
			});
		});

		it("shows loading state during platform switch", async () => {
			let resolveInit: (value: AntiBanStats) => void;
			mockInvoke.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveInit = resolve;
					}),
			);

			render(<AntiBanDashboard defaultPlatform="facebook" />);

			// Should show loading indicator
			await waitFor(() => {
				expect(
					screen.getByTestId("antiban-loading") || screen.getByText(/loading/i),
				).toBeTruthy();
			});

			// Resolve the promise
			resolveInit?.(mockAntiBanStats);

			await waitFor(() => {
				expect(screen.queryByTestId("antiban-loading")).toBeNull();
			});
		});
	});

	describe("error handling", () => {
		it("shows error state when initialization fails", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Connection failed"));

			render(<AntiBanDashboard defaultPlatform="facebook" />);

			await waitFor(() => {
				expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
			});
		});

		it("shows Retry button when initialization fails", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Connection failed"));

			render(<AntiBanDashboard defaultPlatform="facebook" />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /retry/i }),
				).toBeInTheDocument();
			});
		});

		it("clicking Retry re-calls initAntiBan", async () => {
			mockInvoke.mockRejectedValueOnce(new Error("Connection failed"));
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			render(<AntiBanDashboard defaultPlatform="facebook" />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /retry/i }),
				).toBeInTheDocument();
			});

			// Initial call was 1 time
			expect(mockInvoke).toHaveBeenCalledTimes(1);

			fireEvent.click(screen.getByRole("button", { name: /retry/i }));

			await waitFor(() => {
				// After retry, should be 2 times total
				expect(mockInvoke).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("props", () => {
		it("uses defaultPlatform prop for initial platform", async () => {
			mockInvoke.mockResolvedValueOnce(mockAntiBanStats);

			render(<AntiBanDashboard defaultPlatform="instagram" />);

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("init_anti_ban", {
					platform: "instagram",
				});
			});
		});

		it("uses custom refreshInterval prop", async () => {
			mockInvoke.mockResolvedValue(mockAntiBanStats);

			render(
				<AntiBanDashboard defaultPlatform="facebook" refreshInterval={5000} />,
			);

			await waitFor(() => {
				expect(screen.getByText("Facebook")).toBeInTheDocument();
			});
		});
	});
});
