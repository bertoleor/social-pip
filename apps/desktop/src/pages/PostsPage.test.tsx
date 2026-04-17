import { render, screen } from "@testing-library/react";
/**
 * @fileoverview Posts page tests
 */
// removed unused import
import PostsPage from "./PostsPage";

vi.mock("@/hooks/usePosts", () => ({
  usePosts: vi.fn(),
}));

vi.mock("@/stores/accountsStore", () => ({
  useAccountsStore: vi.fn(),
}));

import { usePosts } from "@/hooks/usePosts";
import { useAccountsStore } from "@/stores/accountsStore";

const mockUsePosts = vi.mocked(usePosts);
const mockUseAccountsStore = vi.mocked(useAccountsStore);

describe("PostsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUsePosts.mockReturnValue({
      posts: [],
      loading: false,
      error: null,
      selectedId: null,
      selectedPost: undefined,
      fetchPosts: vi.fn(),
      createPost: vi.fn(),
      updatePost: vi.fn(),
      deletePost: vi.fn(),
      selectPost: vi.fn(),
      setFilter: vi.fn(),
      getPostsByStatus: vi.fn(),
      getPostsByPlatform: vi.fn(),
    });

    mockUseAccountsStore.mockReturnValue({
      accounts: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: {},
      fetchAccounts: vi.fn(),
      createAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      selectAccount: vi.fn(),
      setFilter: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("renders the page container", () => {
      render(<PostsPage />);

      expect(screen.getByTestId("page-posts")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<PostsPage />);

      expect(screen.getByRole("heading", { name: "Posts" })).toBeInTheDocument();
    });

    it("renders description", () => {
      render(<PostsPage />);

      expect(
        screen.getByText(/Manage your social media posts across all platforms/i),
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<PostsPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Posts");
    });
  });
});
