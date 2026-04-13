import type {
	MediaFile,
	MediaValidationResult,
	PlatformTarget,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

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
	platform: string;
	priority: number;
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
	mediaPaths?: string[];
}

export interface StartMultiPlatformSessionInput {
	accountId: string;
	platforms: PlatformTarget[];
	templateId?: string;
	content?: string;
}

export interface SessionCompleteResult {
	status: "completed" | "cancelled";
	totalJobs: number;
	successCount: number;
	failedCount: number;
	skippedCount: number;
}

export type PostJobStatus = PostJob["status"];
export type PostSessionStatus = PostSession["status"];

export interface PostingState {
	currentSession: PostSession | null;
	jobs: PostJob[];
	isProcessing: boolean;
	error: string | null;
	mediaFiles: MediaFile[];
	mediaValidation: Map<string, MediaValidationResult>;
	platformTargets: PlatformTarget[];

	startSession: (input: StartSessionInput) => Promise<PostSession>;
	startMultiPlatformSession: (
		input: StartMultiPlatformSessionInput,
	) => Promise<PostSession>;
	cancelSession: () => Promise<void>;
	getSessionStatus: (sessionId: string) => Promise<void>;
	refreshJobs: () => Promise<void>;
	clearError: () => void;
	setPlatformTargets: (targets: PlatformTarget[]) => void;

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

	addMediaFiles: (files: MediaFile[]) => void;
	removeMediaFile: (id: string) => void;
	clearMedia: () => void;
	setMediaValidation: (fileId: string, result: MediaValidationResult) => void;
	getMediaValidationState: () => "valid" | "invalid" | "partial";
}

export const usePostingStore = create<PostingState>((set, get) => ({
	currentSession: null,
	jobs: [],
	isProcessing: false,
	error: null,
	mediaFiles: [],
	mediaValidation: new Map(),
	platformTargets: [],

	setPlatformTargets: (targets: PlatformTarget[]) => {
		set({ platformTargets: targets });
	},

	startSession: async (input: StartSessionInput) => {
		set({ isProcessing: true, error: null });

		try {
			const session = await invoke<PostSession>("start_posting_session", {
				config: {
					template_id: input.templateId,
					account_id: input.accountId,
					group_ids: input.groupIds,
					content: input.content,
					media_paths: input.mediaPaths,
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

	startMultiPlatformSession: async (input: StartMultiPlatformSessionInput) => {
		set({ isProcessing: true, error: null });

		try {
			const platforms = input.platforms.map((p) => ({
				platform: p.platform,
				account_id: p.accountId,
				targets: p.targets,
				priority: p.priority,
			}));

			const session = await invoke<PostSession>(
				"start_multi_platform_session",
				{
					config: {
						account_id: input.accountId,
						platforms,
						template_id: input.templateId,
						content: input.content,
					},
				},
			);

			set({
				currentSession: session,
				jobs: [],
				isProcessing: true,
				platformTargets: input.platforms,
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

	addMediaFiles: (files: MediaFile[]) => {
		set((state) => {
			const existingIds = new Set(state.mediaFiles.map((f) => f.id));
			const newFiles = files.filter((f) => !existingIds.has(f.id));
			return {
				mediaFiles: [...state.mediaFiles, ...newFiles],
			};
		});
	},

	removeMediaFile: (id: string) => {
		set((state) => {
			const newValidation = new Map(state.mediaValidation);
			newValidation.delete(id);
			return {
				mediaFiles: state.mediaFiles.filter((f) => f.id !== id),
				mediaValidation: newValidation,
			};
		});
	},

	clearMedia: () => {
		set({
			mediaFiles: [],
			mediaValidation: new Map(),
		});
	},

	setMediaValidation: (fileId: string, result: MediaValidationResult) => {
		set((state) => {
			const newValidation = new Map(state.mediaValidation);
			newValidation.set(fileId, result);
			return {
				mediaValidation: newValidation,
			};
		});
	},

	getMediaValidationState: () => {
		const { mediaFiles, mediaValidation } = get();

		if (mediaFiles.length === 0) {
			return "valid";
		}

		let hasInvalid = false;
		let hasPending = false;

		for (const file of mediaFiles) {
			const result = mediaValidation.get(file.id);
			if (!result) {
				hasPending = true;
			} else if (!result.valid) {
				hasInvalid = true;
			}
		}

		if (hasInvalid) return "invalid";
		if (hasPending) return "partial";
		return "valid";
	},
}));
