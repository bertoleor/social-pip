/**
 * Posts Page Object Model
 *
 * Represents the Posts management page of the Social-Pip application.
 * Provides methods for viewing posts, creating new posts, and managing post content.
 *
 * @example
 * const postsPage = new PostsPage(page)
 * await postsPage.goto()
 * await postsPage.clickNewPost()
 */
import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object Model for the Posts page
 *
 * Extends BasePage and provides:
 * - Navigation to Posts
 * - Post creation flow
 * - Post list viewing and management
 */
export class PostsPage extends BasePage {
  /** The main heading (h1) of the posts page */
  readonly heading: Locator;

  /** New Post button */
  readonly newPostButton: Locator;

  /** List of posts */
  readonly postsList: Locator;

  /** Post creation/edit modal */
  readonly postModal: Locator;

  /** Post content textarea */
  readonly contentInput: Locator;

  /** Caption/title input */
  readonly captionInput: Locator;

  /** Submit button for post form */
  readonly submitButton: Locator;

  /** Cancel button for post form */
  readonly cancelButton: Locator;

  /** Filter dropdown for post status */
  readonly statusFilter: Locator;

  /** Search input for posts */
  readonly searchInput: Locator;

  /**
   * Creates a new PostsPage instance
   * @param page - Playwright page instance
   */
  constructor(page: Page) {
    super(page, "page-posts");

    // Use getByRole for heading
    this.heading = page.getByRole("heading", { level: 1 });

    // Use getByRole for interactive elements
    this.newPostButton = page.getByRole("button", { name: "New Post" });

    // Use getByTestId for posts list container
    this.postsList = page.getByTestId("posts-list");

    // Use getByRole for modal/dialog
    this.postModal = page.getByRole("dialog");

    // Use getByLabel for form inputs
    this.contentInput = page.getByLabel("Content");
    this.captionInput = page.getByLabel("Caption");

    // Modal action buttons
    this.submitButton = this.postModal.getByRole("button", { name: "Submit" });
    this.cancelButton = this.postModal.getByRole("button", { name: "Cancel" });

    // Use getByRole for filters
    this.statusFilter = page.getByRole("combobox", { name: "Status" });

    // Use getByLabel for search
    this.searchInput = page.getByLabel("Search posts");
  }

  /**
   * Navigate to the Posts page from anywhere in the app
   *
   * Clicks the Posts link in the navigation sidebar.
   */
  protected async navigateHere(): Promise<void> {
    await this.getNavLink("Posts").click();
  }

  /**
   * Verify the posts page is fully loaded
   *
   * Checks that:
   * - Page container is visible
   * - Main heading is visible
   *
   * @returns this for method chaining
   */
  override async verifyPageLoaded(): Promise<this> {
    await super.verifyPageLoaded();
    await this.heading.waitFor({ state: "visible" });
    return this;
  }

  /**
   * Click the New Post button to open the creation modal
   */
  async clickNewPost(): Promise<void> {
    await this.newPostButton.click();
  }

  /**
   * Fill the post creation form
   *
   * @param content - The main content of the post
   * @param caption - Optional caption for the post
   */
  async fillPostForm(content: string, caption?: string): Promise<void> {
    await this.contentInput.fill(content);
    if (caption) {
      await this.captionInput.fill(caption);
    }
  }

  /**
   * Submit the post creation form
   */
  async submitPost(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel the post creation modal
   */
  async cancelPostCreation(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Complete post creation flow in one call
   *
   * @param content - The main content of the post
   * @param caption - Optional caption for the post
   */
  async createPost(content: string, caption?: string): Promise<void> {
    await this.clickNewPost();
    await this.postModal.waitFor({ state: "visible" });
    await this.fillPostForm(content, caption);
    await this.submitPost();
  }

  /**
   * Filter posts by status
   *
   * @param status - The status to filter by (e.g., "draft", "scheduled", "published")
   */
  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.click();
    await this.page.getByRole("option", { name: status }).click();
  }

  /**
   * Search for posts by text
   *
   * @param query - The search query
   */
  async searchPosts(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Get a post card by its content preview
   *
   * @param contentPreview - Part of the post content to identify it
   * @returns Locator for the post card
   */
  getPostByContent(contentPreview: string): Locator {
    return this.postsList.getByRole("article").filter({
      hasText: contentPreview,
    });
  }

  /**
   * Get the edit button for a specific post
   *
   * @param contentPreview - Part of the post content to identify it
   * @returns Locator for the edit button
   */
  getEditButton(contentPreview: string): Locator {
    return this.getPostByContent(contentPreview).getByRole("button", {
      name: "Edit",
    });
  }

  /**
   * Get the delete button for a specific post
   *
   * @param contentPreview - Part of the post content to identify it
   * @returns Locator for the delete button
   */
  getDeleteButton(contentPreview: string): Locator {
    return this.getPostByContent(contentPreview).getByRole("button", {
      name: "Delete",
    });
  }

  /**
   * Verify the post modal is visible
   *
   * @param timeout - Maximum time to wait in milliseconds
   */
  async verifyModalVisible(timeout = 5000): Promise<void> {
    await this.postModal.waitFor({ state: "visible", timeout });
  }

  /**
   * Verify the post modal is hidden/closed
   *
   * @param timeout - Maximum time to wait in milliseconds
   */
  async verifyModalClosed(timeout = 5000): Promise<void> {
    await this.postModal.waitFor({ state: "hidden", timeout });
  }
}
