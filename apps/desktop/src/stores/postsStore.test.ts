import type { CreatePostInput, Post, PostFilter } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
// removed unused import
import { usePostsStore } from "./postsStore";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

describe("postsStore", () => {
	const mockPost: Post = {
		id: "post_1",
		content: "Test post content",
		mediaUrls: [],
		platform: "facebook",
		status: "draft",
		altCaptions: [],
		hashtags: .test,
		variance: 15,
		accountId: "account_1",
		createdAt: new Date("2026-04-10T10:00:00Z"),
		updatedAt: new Date("2026-04-10T10:00:00Z"),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		usePostsStore.setState({
			posts: [],
			selectedId: null,
			loading: false,
			error: null,
			filter: {},
		});
	});

	describe("fetchPosts", () => {
		it("populates state and sets loading=false on success", async () => {
			const apiResponse = [
				{
					id: "post_1",
					content: "Test post",
					media_urls: [],
					platform: "facebook",
					status: "draft",
					alt_captions: [],
					hashtags: [],
					variance: 15,
					account_id: "account_1",
					created_at: "2026-04-10T10:00:00Z",
					updated_at: "2026-04-10T10:00:00Z",
				},
			];

			vi.mocked(invoke).mockResolvedValueOnce(apiResponse);

			const { fetchPosts } = usePostsStore.getState();
			await fetchPosts();

			const state = usePostsStore.getState();
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
			expect(state.posts).toHaveLength(1);
			expect(state.posts[0]?.id).toBe("post_1");
		});

		it("sets error on failure", async () => {
			vi.mocked(invoke).mockRejectedValueOnce(new Error("Database error"));

			const { fetchPosts } = usePostsStore.getState();
			await fetchPosts();

			const state = usePostsStore.getState();
			expect(state.loading).toBe(false);
			expect(state.error).toBe("Database error");
		});
	});

	describe("createPost", () => {
		it("adds post and sorts by createdAt descending", async () => {
			usePostsStore.setState({
				posts: [
					{
						...mockPost,
						id: "post_old",
						createdAt: new Date("2026-04-09T10:00:00Z"),
					},
				],
			});

			const apiResponse = {
				id: "post_new",
				content: "New post",
				media_urls: [],
				platform: "facebook",
				status: "draft",
				alt_captions: [],
				hashtags: [],
				variance: 15,
				account_id: "account_1",
				created_at: "2026-04-10T12:00:00Z",
				updated_at: "2026-04-10T12:00:00Z",
			};

			vi.mocked(invoke).mockResolvedValueOnce(apiResponse);

			const input: CreatePostInput = {
				accountId: "account_1",
				platform: "facebook",
				content: "New post",
			};

			const { createPost } = usePostsStore.getState();
			const result = await createPost(input);

			const state = usePostsStore.getState();
			expect(result.id).toBe("post_new");
			expect(state.posts[0]?.id).toBe("post_new");
			expect(state.posts[1]?.id).toBe("post_old");
		});
	});

	describe("updatePost", () => {
		it("updates post in state", async () => {
			usePostsStore.setState({ posts: [mockPost] });

			const apiResponse = {
				...mockPost,
				content: "Updated content",
				updated_at: "2026-04-10T11:00:00Z",
			};

			vi.mocked(invoke).mockResolvedValueOnce(apiResponse);

			const { updatePost } = usePostsStore.getState();
			const result = await updatePost("post_1", { content: "Updated content" });

			const state = usePostsStore.getState();
			expect(result.content).toBe("Updated content");
			expect(state.posts[0]?.content).toBe("Updated content");
		});
	});

	describe("deletePost", () => {
		it("removes post from state", async () => {
			usePostsStore.setState({ posts: [mockPost], selectedId: "post_1" });

			vi.mocked(invoke).mockResolvedValueOnce(undefined);

			const { deletePost } = usePostsStore.getState();
			await deletePost("post_1");

			const state = usePostsStore.getState();
			expect(state.posts).toHaveLength(0);
			expect(state.selectedId).toBeNull();
		});
	});

	describe("selectPost", () => {
		it("sets selectedId", () => {
			const { selectPost } = usePostsStore.getState();
			selectPost("post_1");

			const state = usePostsStore.getState();
			expect(state.selectedId).toBe("post_1");
		});
	});

	describe("setFilter", () => {
		it("merges filter with existing", () => {
			usePostsStore.setState({ filter: { platform: "facebook" } });

			const { setFilter } = usePostsStore.getState();
			setFilter({ status: "draft" });

			const state = usePostsStore.getState();
			expect(state.filter.platform).toBe("facebook");
			expect(state.filter.status).toBe("draft");
		});
	});

	describe("getPostsByStatus", () => {
		it("filters posts by status", () => {
			usePostsStore.setState({
				posts: [
					{ ...mockPost, id: "post_1", status: "draft" },
					{ ...mockPost, id: "post_2", status: "published" },
					{ ...mockPost, id: "post_3", status: "draft" },
				],
			});

			const { getPostsByStatus } = usePostsStore.getState();
			const drafts = getPostsByStatus("draft");

			expect(drafts).toHaveLength(2);
			expect(drafts.map((p) => p.id)).toEqual(["post_1", "post_3"]);
		});
	});

	describe("getPostsByPlatform", () => {
		it("filters posts by platform", () => {
			usePostsStore.setState({
				posts: [
					{ ...mockPost, id: "post_1", platform: "facebook" },
					{ ...mockPost, id: "post_2", platform: "instagram" },
					{ ...mockPost, id: "post_3", platform: "facebook" },
				],
			});

			const { getPostsByPlatform } = usePostsStore.getState();
			const fbPosts = getPostsByPlatform("facebook");

			expect(fbPosts).toHaveLength(2);
			expect(fbPosts.map((p) => p.id)).toEqual(["post_1", "post_3"]);
		});
	});
});
