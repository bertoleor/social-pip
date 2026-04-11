import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { usePostsStore } from "@/stores/postsStore";
import type {
	CreatePostInput,
	Platform,
	PostFilter,
	PostStatus,
	UpdatePostInput,
} from "@social-pip/types";
import { useCallback, useEffect } from "react";

export interface UsePostsOptions {
	filter?: PostFilter;
	autoFetch?: boolean;
}

export interface UsePostsReturn {
	posts: ReturnType<typeof usePostsStore.getState>["posts"];
	loading: boolean;
	error: string | null;
	selectedId: string | null;
	selectedPost:
		| ReturnType<typeof usePostsStore.getState>["posts"][number]
		| undefined;
	fetchPosts: (filter?: PostFilter) => Promise<void>;
	createPost: (data: CreatePostInput) => Promise<boolean>;
	updatePost: (id: string, data: UpdatePostInput) => Promise<boolean>;
	deletePost: (id: string) => Promise<boolean>;
	selectPost: (id: string | null) => void;
	setFilter: (filter: PostFilter) => void;
	getPostsByStatus: (
		status: PostStatus,
	) => ReturnType<typeof usePostsStore.getState>["posts"];
	getPostsByPlatform: (
		platform: Platform,
	) => ReturnType<typeof usePostsStore.getState>["posts"];
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
	const { filter, autoFetch = true } = options;

	const {
		posts,
		loading,
		error,
		selectedId,
		fetchPosts,
		createPost: storeCreatePost,
		updatePost: storeUpdatePost,
		deletePost: storeDeletePost,
		selectPost,
		setFilter,
		getPostsByStatus,
		getPostsByPlatform,
	} = usePostsStore();

	useEffect(() => {
		if (autoFetch) {
			fetchPosts(filter).catch((err) => {
				console.error("Failed to fetch posts:", err);
			});
		}
	}, [autoFetch, filter, fetchPosts]);

	const createPost = useCallback(
		async (data: CreatePostInput): Promise<boolean> => {
			try {
				await storeCreatePost(data);
				toast.success("Post created successfully");
				return true;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to create post";
				toast.error(message);
				return false;
			}
		},
		[storeCreatePost],
	);

	const updatePost = useCallback(
		async (id: string, data: UpdatePostInput): Promise<boolean> => {
			try {
				await storeUpdatePost(id, data);
				toast.success("Post updated successfully");
				return true;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to update post";
				toast.error(message);
				return false;
			}
		},
		[storeUpdatePost],
	);

	const deletePost = useCallback(
		async (id: string): Promise<boolean> => {
			const confirmed = await confirm(
				"Delete Post",
				"Are you sure you want to delete this post? This action cannot be undone.",
				{ confirmText: "Delete", cancelText: "Cancel" },
			);

			if (!confirmed) {
				return false;
			}

			try {
				await storeDeletePost(id);
				toast.success("Post deleted successfully");
				return true;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to delete post";
				toast.error(message);
				return false;
			}
		},
		[storeDeletePost],
	);

	const selectedPost = posts.find((p) => p.id === selectedId);

	return {
		posts,
		loading,
		error,
		selectedId,
		selectedPost,
		fetchPosts,
		createPost,
		updatePost,
		deletePost,
		selectPost,
		setFilter,
		getPostsByStatus,
		getPostsByPlatform,
	};
}
