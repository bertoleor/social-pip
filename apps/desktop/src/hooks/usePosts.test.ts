import { invoke } from "@tauri-apps/api/core";
import { act, renderHook } from "@testing-library/react";
import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { usePostsStore } from "@/stores/postsStore";
// removed unused import
import { usePosts } from "./usePosts";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/lib/dialog", () => ({
  confirm: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("usePosts", () => {
  const mockPost = {
    id: "post_1",
    content: "Test post",
    mediaUrls: [],
    platform: "facebook" as const,
    status: "draft" as const,
    altCaptions: [],
    hashtags: [],
    variance: 15,
    accountId: "account_1",
    createdAt: new Date("2026-04-10T10:00:00Z"),
    updatedAt: new Date("2026-04-10T10:00:00Z"),
  };

  const mockApiPostResponse = {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    usePostsStore.setState({
      posts: [mockPost],
      selectedId: null,
      loading: false,
      error: null,
      filter: {},
    });
  });

  it("returns posts from store", () => {
    const { result } = renderHook(() => usePosts({ autoFetch: false }));
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0]?.id).toBe("post_1");
  });

  it("shows success toast on create", async () => {
    mockInvoke.mockResolvedValueOnce({
      ...mockApiPostResponse,
      id: "post_new",
      content: "New post",
    });

    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    await act(async () => {
      const success = await result.current.createPost({
        accountId: "account_1",
        platform: "facebook",
        content: "New post",
      });
      expect(success).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Post created successfully");
  });

  it("shows error toast on create failure", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Database error"));

    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    await act(async () => {
      const success = await result.current.createPost({
        accountId: "account_1",
        platform: "facebook",
        content: "New post",
      });
      expect(success).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith("Database error");
  });

  it("shows success toast on update", async () => {
    mockInvoke.mockResolvedValueOnce({
      ...mockApiPostResponse,
      content: "Updated",
    });

    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    await act(async () => {
      const success = await result.current.updatePost("post_1", {
        content: "Updated",
      });
      expect(success).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Post updated successfully");
  });

  it("requires confirmation for delete", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(false);

    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    await act(async () => {
      const success = await result.current.deletePost("post_1");
      expect(success).toBe(false);
    });

    expect(confirm).toHaveBeenCalledWith(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      { confirmText: "Delete", cancelText: "Cancel" },
    );
  });

  it("deletes post after confirmation", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    await act(async () => {
      const success = await result.current.deletePost("post_1");
      expect(success).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Post deleted successfully");
  });

  it("selects post", () => {
    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    act(() => {
      result.current.selectPost("post_1");
    });

    expect(result.current.selectedId).toBe("post_1");
    expect(result.current.selectedPost?.id).toBe("post_1");
  });

  it("filters by status", () => {
    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    const drafts = result.current.getPostsByStatus("draft");
    expect(drafts).toHaveLength(1);
  });

  it("filters by platform", () => {
    const { result } = renderHook(() => usePosts({ autoFetch: false }));

    const fbPosts = result.current.getPostsByPlatform("facebook");
    expect(fbPosts).toHaveLength(1);
  });
});
