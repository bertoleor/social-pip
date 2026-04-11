import type {
	CreatePostInput,
	Platform,
	Post,
	PostFilter,
	PostStatus,
	UpdatePostInput,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Posts store - Zustand state management for post management
 * Bounded Context: Posts
 * Aggregate: Post
 */
import { create } from "zustand";

// State interface
export interface PostsState {
	posts: Post[];
	selectedId: string | null;
	loading: boolean;
	error: string | null;
	filter: PostFilter;
	fetchPosts: (filter?: PostFilter) => Promise<void>;
	createPost: (data: CreatePostInput) => Promise<Post>;
	updatePost: (id: string, data: UpdatePostInput) => Promise<Post>;
	deletePost: (id: string) => Promise<void>;
	selectPost: (id: string | null) => void;
	setFilter: (filter: PostFilter) => void;
	getPostsByStatus: (status: PostStatus) => Post[];
	getPostsByPlatform: (platform: Platform) => Post[];
}

// Helper to convert filter to invoke params
function filterToParams(
	filter: PostFilter,
): Record<string, string | number | undefined> {
	const params: Record<string, string | number | undefined> = {};

	if (filter.accountId !== undefined) {
		params["account_id"] = filter.accountId;
	}
	if (filter.platform !== undefined) {
		params["platform"] = filter.platform;
	}
	if (filter.status !== undefined) {
		params["status"] = filter.status;
	}
	if (filter.scheduledAfter !== undefined) {
		params["scheduled_after"] = filter.scheduledAfter.toISOString();
	}
	if (filter.scheduledBefore !== undefined) {
		params["scheduled_before"] = filter.scheduledBefore.toISOString();
	}
	if (filter.limit !== undefined) {
		params["limit"] = filter.limit;
	}
	if (filter.offset !== undefined) {
		params["offset"] = filter.offset;
	}

	return params;
}

// Helper to convert API post to Post type
function apiPostToPost(apiPost: Record<string, unknown>): Post {
	return {
		id: apiPost["id"] as string,
		content: apiPost["content"] as string,
		mediaUrls: (apiPost["media_urls"] as string[]) ?? [],
		platform: apiPost["platform"] as Platform,
		status: apiPost["status"] as PostStatus,
		altCaptions: (apiPost["alt_captions"] as string[]) ?? [],
		currentCaption: apiPost["current_caption"] as string | undefined,
		hashtags: (apiPost["hashtags"] as string[]) ?? [],
		scheduledAt:
			apiPost["scheduled_at"] !== undefined && apiPost["scheduled_at"] !== null
				? new Date(apiPost["scheduled_at"] as string)
				: undefined,
		variance: (apiPost["variance"] as number) ?? 15,
		publishedAt:
			apiPost["published_at"] !== undefined && apiPost["published_at"] !== null
				? new Date(apiPost["published_at"] as string)
				: undefined,
		externalId: apiPost["external_id"] as string | undefined,
		errorMessage: apiPost["error_message"] as string | undefined,
		accountId: apiPost["account_id"] as string,
		createdAt: new Date(apiPost["created_at"] as string),
		updatedAt: new Date(apiPost["updated_at"] as string),
	};
}

// Helper to sort posts by createdAt descending
function sortPosts(posts: Post[]): Post[] {
	return [...posts].sort((a, b) => {
		const dateA = new Date(a.createdAt).getTime();
		const dateB = new Date(b.createdAt).getTime();
		return dateB - dateA;
	});
}

// Store implementation
export const usePostsStore = create<PostsState>((set, get) => ({
	posts: [],
	selectedId: null,
	loading: false,
	error: null,
	filter: {},

	fetchPosts: async (filter?: PostFilter) => {
		const currentFilter = filter ?? get().filter;
		set({ loading: true, error: null });

		try {
			const params = filterToParams(currentFilter);
			const apiPosts = await invoke<Record<string, unknown>[]>(
				"get_posts",
				params,
			);
			const posts = apiPosts.map(apiPostToPost);
			set({
				posts,
				loading: false,
				error: null,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({
				error: errorMessage,
				loading: false,
				// Keep existing posts on failure
			});
		}
	},

	createPost: async (data: CreatePostInput) => {
		const params: Record<string, string | string[] | undefined> = {
			account_id: data.accountId,
			platform: data.platform,
			content: data.content,
		};

		if (data.mediaUrls !== undefined && data.mediaUrls.length > 0) {
			params["media_urls"] = data.mediaUrls;
		}
		if (data.hashtags !== undefined && data.hashtags.length > 0) {
			params["hashtags"] = data.hashtags;
		}
		if (data.scheduledAt !== undefined) {
			params["scheduled_at"] = data.scheduledAt.toISOString();
		}
		if (data.status !== undefined) {
			params["status"] = data.status;
		}

		try {
			const apiPost = await invoke<Record<string, unknown>>(
				"create_post",
				params,
			);
			const post = apiPostToPost(apiPost);

			// Add new post and sort
			const currentPosts = get().posts;
			const updatedPosts = sortPosts([...currentPosts, post]);

			set({
				posts: updatedPosts,
				error: null,
			});

			return post;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
			throw error;
		}
	},

	updatePost: async (id: string, data: UpdatePostInput) => {
		const params: Record<string, string | string[] | undefined> = {
			id,
		};

		if (data.content !== undefined) {
			params["content"] = data.content;
		}
		if (data.mediaUrls !== undefined) {
			params["media_urls"] = data.mediaUrls;
		}
		if (data.hashtags !== undefined) {
			params["hashtags"] = data.hashtags;
		}
		if (data.status !== undefined) {
			params["status"] = data.status;
		}
		if (data.scheduledAt !== undefined) {
			params["scheduled_at"] = data.scheduledAt.toISOString();
		}
		if (data.publishedAt !== undefined) {
			params["published_at"] = data.publishedAt.toISOString();
		}
		if (data.externalId !== undefined) {
			params["external_id"] = data.externalId;
		}
		if (data.errorMessage !== undefined) {
			params["error_message"] = data.errorMessage;
		}

		try {
			const apiPost = await invoke<Record<string, unknown>>(
				"update_post",
				params,
			);
			const post = apiPostToPost(apiPost);

			// Update post in state and resort
			const currentPosts = get().posts;
			const updatedPosts = currentPosts.map((p) => (p.id === id ? post : p));
			const sortedPosts = sortPosts(updatedPosts);

			set({
				posts: sortedPosts,
				error: null,
			});

			return post;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
			throw error;
		}
	},

	deletePost: async (id: string) => {
		try {
			await invoke<void>("delete_post", { id });

			// Remove post from state
			const currentPosts = get().posts;
			const updatedPosts = currentPosts.filter((p) => p.id !== id);

			// Clear selectedId if it matches
			const currentSelectedId = get().selectedId;
			const newSelectedId = currentSelectedId === id ? null : currentSelectedId;

			set({
				posts: updatedPosts,
				selectedId: newSelectedId,
				error: null,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			set({ error: errorMessage });
		}
	},

	selectPost: (id: string | null) => {
		set({ selectedId: id });
	},

	setFilter: (filter: PostFilter) => {
		const currentFilter = get().filter;
		set({ filter: { ...currentFilter, ...filter } });
	},

	getPostsByStatus: (status: PostStatus) => {
		return get().posts.filter((p) => p.status === status);
	},

	getPostsByPlatform: (platform: Platform) => {
		return get().posts.filter((p) => p.platform === platform);
	},
}));
