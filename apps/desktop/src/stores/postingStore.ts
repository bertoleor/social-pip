import type { MediaFile, MediaValidationResult } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Posting store - Zustand state management for posting sessions
 */
import { create } from "zustand";

// Types matching Prisma models
export interface PostSession {
  id: string;
  status: "pending" | "running" | "completed" | "cancelled" | "failed";
  templateId?: string;
  accountId: string;
  totalJobs: number;
  completedJobs: number;
  successfulJobs: number;
  failedJobs: number;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  lastError?: string;
  errorCategory?: string;
  configSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostJob {
	id: string;
	sessionId: string;
	groupId: string;
	content: string;
	postUrl?: string;
	status: "pending" | "processing" | "success" | "failed" | "skipped";
	errorMessage?: string;
	errorCategory?: string;
	startedAt?: Date;
	completedAt?: Date;
	durationMs?: number;
	retryCount: number;
	maxRetries: number;
	nextRetryAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface StartSessionInput {
	templateId?: string;
	accountId: string;
	groupIds: string[];
	content?: string;
}

export interface SessionCompleteResult {
	status: "completed" | "cancelled";
	totalJobs: number;
	successCount: number;
	failedCount: number;
	skippedCount: number;
}

// Status types for type safety
export type PostJobStatus = PostJob["status"];
export type PostSessionStatus = PostSession["status"];

export interface PostingState {
	currentSession: PostSession | null;
	jobs: PostJob[];
	isProcessing: boolean;
	error: string | null;

	startSession: (input: StartSessionInput) => Promise<PostSession>;
	cancelSession: () => Promise<void>;
	getSessionStatus: (sessionId: string) => Promise<void>;
	refreshJobs: () => Promise<void>;
	clearError: () => void;

	updateJobStatus: (
		jobId: string,
		status: PostJobStatus,
		result?: { postUrl?: string; error?: string; errorCategory?: string },
	) => void;
	updateSessionStatus: (
		status: PostSessionStatus,
		counts?: { completed?: number; successful?: number; failed?: number },
	) => void;
	setSessionComplete: (
		sessionId: string,
		result: SessionCompleteResult,
	) => void;
}

export const usePostingStore = create<PostingState>((set, get) => ({
	currentSession: null,
	jobs: [],
	isProcessing: false,
	error: null,

	startSession: async (input: StartSessionInput) => {
		set({ isProcessing: true, error: null });

		try {
			const session = await invoke<PostSession>("start_posting_session", {
				config: {
					template_id: input.templateId,
					account_id: input.accountId,
					group_ids: input.groupIds,
					content: input.content,
				},
			});

			set({
				currentSession: session,
				jobs: [],
				isProcessing: true,
			});

			return session;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({
				error: errorMessage,
				isProcessing: false,
			});
			throw error;
		}
	},

	cancelSession: async () => {
		const { currentSession } = get();
		if (!currentSession) return;

		try {
			await invoke<void>("cancel_posting_session", {
				sessionId: currentSession.id,
			});

			set((state) => ({
				currentSession: state.currentSession
					? {
							...state.currentSession,
							status: "cancelled",
							cancelledAt: new Date(),
						}
					: null,
				isProcessing: false,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
			throw error;
		}
	},

	getSessionStatus: async (sessionId: string) => {
		try {
			const { session, jobs } = await invoke<{
				session: PostSession;
				jobs: PostJob[];
			}>("get_posting_session_status", { sessionId });

			set({
				currentSession: session,
				jobs,
				isProcessing: session.status === "running",
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
		}
	},

	refreshJobs: async () => {
		const { currentSession } = get();
		if (!currentSession) return;

		await get().getSessionStatus(currentSession.id);
	},

	clearError: () => {
		set({ error: null });
	},

	updateJobStatus: (jobId, status, result) => {
		set((state) => ({
			jobs: state.jobs.map((job) =>
				job.id === jobId
					? {
							...job,
							status,
							...(result?.postUrl && { postUrl: result.postUrl }),
							...(result?.error && { errorMessage: result.error }),
							...(result?.errorCategory && {
								errorCategory: result.errorCategory,
							}),
							completedAt:
								status !== "pending" && status !== "processing"
									? new Date()
									: undefined,
						}
					: job,
			),
		}));
	},

	updateSessionStatus: (status, counts) => {
		set((state) => ({
			currentSession: state.currentSession
				? {
						...state.currentSession,
						status,
						...(counts?.completed !== undefined && {
							completedJobs: counts.completed,
						}),
						...(counts?.successful !== undefined && {
							successfulJobs: counts.successful,
						}),
						...(counts?.failed !== undefined && { failedJobs: counts.failed }),
						...(status === "completed" && { completedAt: new Date() }),
					}
				: null,
			isProcessing: status === "running",
		}));
	},

	setSessionComplete: (sessionId: string, result: SessionCompleteResult) => {
		set((state) => ({
			currentSession:
				state.currentSession?.id === sessionId
					? {
							...state.currentSession,
							status: result.status,
							totalJobs: result.totalJobs,
							successfulJobs: result.successCount,
							failedJobs: result.failedCount,
							completedJobs: result.successCount + result.failedCount,
							completedAt: new Date(),
						}
					: state.currentSession,
			isProcessing: false,
		}));
	},
}));
