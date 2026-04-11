import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { useScheduleStore } from "@/stores/scheduleStore";
import type { Schedule, UpdateScheduleData } from "@social-pip/types";
/**
 * @fileoverview useSchedule hook - Wrapper for schedule operations with auto-polling
 */
import { useCallback, useEffect, useRef } from "react";

// Polling configuration
const POLL_INTERVAL_MS = 30000; // 30 seconds
const MAX_BACKOFF_MS = 300000; // 5 minutes

interface UseScheduleReturn {
	schedules: Schedule[];
	selectedSchedule: Schedule | null;
	loading: boolean;
	error: string | null;
	schedulePost: (
		postId: string,
		scheduledAt: Date,
		variance?: number,
	) => Promise<void>;
	cancelSchedule: (scheduleId: string) => Promise<void>;
	updateSchedule: (
		scheduleId: string,
		data: UpdateScheduleData,
	) => Promise<void>;
	selectSchedule: (id: string | null) => void;
	refresh: () => Promise<void>;
}

/**
 * Hook for managing scheduled posts with auto-polling and notifications
 */
export function useSchedule(): UseScheduleReturn {
	// Get store state and actions
	const schedules = useScheduleStore((state) => state.schedules);
	const selectedId = useScheduleStore((state) => state.selectedId);
	const loading = useScheduleStore((state) => state.loading);
	const error = useScheduleStore((state) => state.error);
	const fetchSchedules = useScheduleStore((state) => state.fetchSchedules);
	const schedulePostAction = useScheduleStore((state) => state.schedulePost);
	const cancelScheduleAction = useScheduleStore(
		(state) => state.cancelSchedule,
	);
	const updateScheduleAction = useScheduleStore(
		(state) => state.updateSchedule,
	);
	const selectScheduleAction = useScheduleStore(
		(state) => state.selectSchedule,
	);

	// Polling state refs
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const backoffMsRef = useRef<number>(POLL_INTERVAL_MS);
	const isPollingRef = useRef<boolean>(false);

	// Find selected schedule
	const selectedSchedule = selectedId
		? (schedules.find((s) => s.id === selectedId) ?? null)
		: null;

	// Schedule post with toast notification
	const schedulePost = useCallback(
		async (
			postId: string,
			scheduledAt: Date,
			variance?: number,
		): Promise<void> => {
			try {
				await schedulePostAction(postId, scheduledAt, variance);
				toast.success("Post scheduled successfully");
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				toast.error(`Failed to schedule post: ${message}`);
				throw err;
			}
		},
		[schedulePostAction],
	);

	// Cancel schedule with confirmation
	const cancelSchedule = useCallback(
		async (scheduleId: string): Promise<void> => {
			const confirmed = await confirm(
				"Cancel Schedule",
				"Are you sure you want to cancel this scheduled post?",
			);

			if (!confirmed) {
				return;
			}

			try {
				await cancelScheduleAction(scheduleId);
				toast.success("Schedule cancelled successfully");
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				toast.error(`Failed to cancel schedule: ${message}`);
				throw err;
			}
		},
		[cancelScheduleAction],
	);

	// Update schedule with toast notification
	const updateSchedule = useCallback(
		async (scheduleId: string, data: UpdateScheduleData): Promise<void> => {
			try {
				await updateScheduleAction(scheduleId, data);
				toast.success("Schedule updated successfully");
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				toast.error(`Failed to update schedule: ${message}`);
				throw err;
			}
		},
		[updateScheduleAction],
	);

	// Select schedule
	const selectSchedule = useCallback(
		(id: string | null): void => {
			selectScheduleAction(id);
		},
		[selectScheduleAction],
	);

	// Refresh schedules
	const refresh = useCallback(async (): Promise<void> => {
		await fetchSchedules();
	}, [fetchSchedules]);

	// Visibility change handler
	const handleVisibilityChange = useCallback(() => {
		if (document.visibilityState === "visible") {
			// Refresh immediately when becoming visible
			refresh();
			// Reset backoff
			backoffMsRef.current = POLL_INTERVAL_MS;
		}
	}, [refresh]);

	// Setup auto-polling
	useEffect(() => {
		// Initial fetch on mount
		refresh();

		// Only poll if there are schedules
		if (schedules.length === 0) {
			return;
		}

		isPollingRef.current = true;

		const poll = async (): Promise<void> => {
			if (!isPollingRef.current) return;

			try {
				await fetchSchedules();
				// Reset backoff on success
				backoffMsRef.current = POLL_INTERVAL_MS;
			} catch {
				// Increase backoff on error (exponential, capped at max)
				backoffMsRef.current = Math.min(
					backoffMsRef.current * 2,
					MAX_BACKOFF_MS,
				);
			}

			// Schedule next poll
			if (isPollingRef.current) {
				pollTimeoutRef.current = setTimeout(poll, backoffMsRef.current);
			}
		};

		// Start polling
		pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);

		// Listen for visibility changes
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			isPollingRef.current = false;
			if (pollTimeoutRef.current) {
				clearTimeout(pollTimeoutRef.current);
				pollTimeoutRef.current = null;
			}
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [schedules.length, fetchSchedules, handleVisibilityChange, refresh]);

	return {
		schedules,
		selectedSchedule,
		loading,
		error,
		schedulePost,
		cancelSchedule,
		updateSchedule,
		selectSchedule,
		refresh,
	};
}
