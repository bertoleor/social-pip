import type { Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview useAntiBan hook - encapsulates anti-ban logic with auto-refresh
 */
import { useCallback, useEffect, useRef } from "react";
import { useAntiBanStore } from "../stores/antiBanStore";

export interface UseAntiBanProps {
	platform?: Platform;
	refreshInterval?: number; // default: 30000ms
}

export interface UseAntiBanReturn {
	stats: ReturnType<typeof useAntiBanStore.getState>["stats"];
	loading: ReturnType<typeof useAntiBanStore.getState>["loading"];
	error: ReturnType<typeof useAntiBanStore.getState>["error"];
	canPost: () => Promise<boolean>;
	getNextDelay: () => Promise<number>;
	recordAction: (
		actionType: string,
		success: boolean,
		delayMs?: number,
	) => Promise<void>;
	checkBreak: () => Promise<boolean>;
	initAntiBan: (platform: Platform) => Promise<void>;
}

export function useAntiBan({
	platform,
	refreshInterval = 30000,
}: UseAntiBanProps): UseAntiBanReturn {
	const {
		stats,
		loading,
		error,
		initAntiBan,
		refreshStats,
		recordAction: storeRecordAction,
		platform: currentPlatform,
	} = useAntiBanStore();

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Initialize anti-ban on mount or platform change
	useEffect(() => {
		if (platform) {
			initAntiBan(platform);
		}
	}, [platform, initAntiBan]);

	// Auto-refresh effect
	useEffect(() => {
		if (!currentPlatform) return;

		intervalRef.current = setInterval(() => {
			refreshStats();
		}, refreshInterval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [currentPlatform, refreshInterval, refreshStats]);

	const canPost = useCallback(async (): Promise<boolean> => {
		if (!currentPlatform) return false;

		try {
			return await invoke<boolean>("check_can_post", {
				platform: currentPlatform,
				actionType: "post",
			});
		} catch {
			return false;
		}
	}, [currentPlatform]);

	const getNextDelay = useCallback(async (): Promise<number> => {
		if (!currentPlatform) return 0;

		try {
			return await invoke<number>("get_next_delay", {
				platform: currentPlatform,
			});
		} catch {
			return 0;
		}
	}, [currentPlatform]);

	const recordAction = useCallback(
		async (
			actionType: string,
			success: boolean,
			delayMs?: number,
		): Promise<void> => {
			await storeRecordAction(actionType, success, delayMs);
		},
		[storeRecordAction],
	);

	const checkBreak = useCallback(async (): Promise<boolean> => {
		if (!currentPlatform) return false;

		try {
			return await invoke<boolean>("should_break", {
				platform: currentPlatform,
			});
		} catch {
			return false;
		}
	}, [currentPlatform]);

	return {
		stats,
		loading,
		error,
		canPost,
		getNextDelay,
		recordAction,
		checkBreak,
		initAntiBan,
	};
}
