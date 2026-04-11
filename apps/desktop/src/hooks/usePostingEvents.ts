import { usePostingStore } from "@/stores/postingStore";
import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

export type PostJobStatus =
	| "pending"
	| "posting"
	| "success"
	| "failed"
	| "skipped";

export interface PostJobUpdateEvent {
	type: "post-job-update";
	payload: {
		sessionId: string;
		jobId: string;
		status: PostJobStatus;
		duration?: number;
		postUrl?: string;
		error?: {
			category: string;
			message: string;
			retryable: boolean;
		};
	};
}

export interface PostSessionCompleteEvent {
	type: "post-session-complete";
	payload: {
		sessionId: string;
		status: "completed" | "cancelled";
		totalJobs: number;
		successCount: number;
		failedCount: number;
		skippedCount: number;
	};
}

export type PostingEvent = PostJobUpdateEvent | PostSessionCompleteEvent;

export interface UsePostingEventsReturn {
	isConnected: boolean;
	error: Error | null;
}

// ============================================================================
// Hook
// ============================================================================

export function usePostingEvents(
	sessionId: string | null,
	onEvent?: (event: PostingEvent) => void,
): UsePostingEventsReturn {
	const { updateJobStatus, setSessionComplete } = usePostingStore();
	const unlistenRefs = useRef<UnlistenFn[]>([]);
	const errorRef = useRef<Error | null>(null);
	const connectedRef = useRef(false);

	const setupListeners = useCallback(async () => {
		if (!sessionId) return;

		try {
			// Listen for job updates
			const unlistenJobUpdate = await listen<PostJobUpdateEvent["payload"]>(
				"post-job-update",
				(event) => {
					const payload = event.payload;

					// Update store
					updateJobStatus(payload.jobId, payload.status as Parameters<typeof updateJobStatus>[1], {
						postUrl: payload.postUrl,
						error: payload.error?.message,
						errorCategory: payload.error?.category,
					});

					// Notify callback
					onEvent?.({
						type: "post-job-update",
						payload,
					});
				},
			);

			// Listen for session complete
			const unlistenSessionComplete =
				await listen<PostSessionCompleteEvent["payload"]>(
					"post-session-complete",
					(event) => {
						const payload = event.payload;

						// Update store
						setSessionComplete(payload.sessionId, {
							status: payload.status,
							totalJobs: payload.totalJobs,
							successCount: payload.successCount,
							failedCount: payload.failedCount,
							skippedCount: payload.skippedCount,
						});

						// Notify callback
						onEvent?.({
							type: "post-session-complete",
							payload,
						});
					},
				);

			unlistenRefs.current = [unlistenJobUpdate, unlistenSessionComplete];
			connectedRef.current = true;
			errorRef.current = null;
		} catch (error) {
			connectedRef.current = false;
			errorRef.current =
				error instanceof Error
					? error
					: new Error("Failed to setup event listeners");
			console.error("[usePostingEvents] Setup error:", error);
		}
	}, [sessionId, updateJobStatus, setSessionComplete, onEvent]);

	const cleanupListeners = useCallback(() => {
		for (const unlisten of unlistenRefs.current) {
			unlisten();
		}
		unlistenRefs.current = [];
		connectedRef.current = false;
	}, []);

	useEffect(() => {
		setupListeners();

		return () => {
			cleanupListeners();
		};
	}, [setupListeners, cleanupListeners]);

	return {
		isConnected: connectedRef.current,
		error: errorRef.current,
	};
}
