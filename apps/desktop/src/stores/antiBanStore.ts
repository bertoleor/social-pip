import type { AntiBanStats, Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview AntiBan store - Zustand state management for anti-ban engine
 */
import { create } from "zustand";

// State interface
export interface AntiBanState {
	stats: AntiBanStats | null;
	loading: boolean;
	error: string | null;
	platform: Platform | null;
	initAntiBan: (platform: Platform) => Promise<void>;
	refreshStats: () => Promise<void>;
	recordAction: (
		actionType: string,
		success: boolean,
		delayUsedMs?: number,
	) => Promise<void>;
	reset: () => void;
}

// Store implementation
export const useAntiBanStore = create<AntiBanState>((set, get) => ({
	stats: null,
	loading: false,
	error: null,
	platform: null,

	initAntiBan: async (platform: Platform) => {
		set({ loading: true, error: null });

		try {
			const stats = await invoke<AntiBanStats>("init_anti_ban", { platform });
			set({
				stats,
				loading: false,
				platform,
				error: null,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({
				error: errorMessage,
				loading: false,
				stats: null,
			});
		}
	},

	refreshStats: async () => {
		try {
			const stats = await invoke<AntiBanStats | null>("get_anti_ban_stats");
			if (stats) {
				set({ stats, error: null });
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
		}
	},

	recordAction: async (
		actionType: string,
		success: boolean,
		delayUsedMs?: number,
	) => {
		const { platform } = get();
		if (!platform) {
			set({ error: "No platform selected" });
			return;
		}

		try {
			const stats = await invoke<AntiBanStats>("record_post_action", {
				platform,
				actionType,
				success,
				delayUsedMs,
			});
			set({ stats, error: null });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
		}
	},

	reset: () => {
		set({
			stats: null,
			loading: false,
			error: null,
			platform: null,
		});
	},
}));
