/**
 * Posting Page Object Model
 *
 * Represents the Facebook post creation flow in the Social-Pip application.
 * Handles media uploads, scheduling, and platform-specific posting functionality.
 *
 * @example
 * const postingPage = new PostingPage(page)
 * await postingPage.navigateHere()
 * await postingPage.createTextPost('Hello from E2E test!')
 */
import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object Model for the Posting/Post Creation flow
 *
 * Extends BasePage and provides:
 * - Navigation to post creation
 * - Text post creation
 * - Media upload handling
 * - Post scheduling options
 * - Platform-specific interactions
 */
export class PostingPage extends BasePage {
  /** Content textarea for post text */
  readonly contentTextarea: Locator;

  /** Button to add media (photos/videos) */
  readonly mediaButton: Locator;

  /** Button to schedule post for later */
  readonly scheduleButton: Locator;

  /** Button to publish post immediately */
  readonly publishButton: Locator;

  /** Success toast notification after publish */
  readonly successToast: Locator;

  /** Media uploader component */
  readonly mediaUploader: Locator;

  /** Schedule date picker */
  readonly scheduleDatePicker: Locator;

  /** Schedule time picker */
  readonly scheduleTimePicker: Locator;

  /** Confirm schedule button */
  readonly confirmScheduleButton: Locator;

  /** Platform selection dropdown */
  readonly platformSelect: Locator;

  /** Caption input for media posts */
  readonly captionInput: Locator;

  /** Post preview container */
  readonly postPreview: Locator;

  /** Character count indicator */
  readonly characterCount: Locator;

  /** Draft save button */
  readonly saveDraftButton: Locator;

  /**
   * Creates a new PostingPage instance
   * @param page - Playwright page instance
   */
  constructor(page: Page) {
    super(page, "page-posting");

    // Use getByLabel for form inputs (accessibility-first)
    this.contentTextarea = page.getByLabel(/what's on your mind|content|post content/i);

    // Use getByRole for interactive elements
    this.mediaButton = page.getByRole("button", { name: /add photo|add video|media|attach/i });
    this.scheduleButton = page.getByRole("button", { name: /schedule|schedule post/i });
    this.publishButton = page.getByRole("button", { name: /publish|post now|publish now/i });

    // Use getByText for static content (success message)
    this.successToast = page.getByText(/post published|successfully published|post created/i);

    // Use getByTestId when accessibility selectors don't exist
    this.mediaUploader = page.getByTestId("media-uploader");
    this.postPreview = page.getByTestId("post-preview");

    // Schedule inputs
    this.scheduleDatePicker = page.getByLabel(/schedule date|date/i);
    this.scheduleTimePicker = page.getByLabel(/schedule time|time/i);
    this.confirmScheduleButton = page.getByRole("button", { name: /confirm schedule|schedule/i });

    // Platform selection
    this.platformSelect = page.getByRole("combobox", { name: /platform|select platform/i });

    // Caption for media posts
    this.captionInput = page.getByLabel(/caption|alt text/i);

    // Character count indicator
    this.characterCount = page.getByTestId("character-count");

    // Draft action
    this.saveDraftButton = page.getByRole("button", { name: /save draft|save as draft/i });
  }

  /**
   * Navigate to the posting page from anywhere in the app
   *
   * Clicks the Posts link and then Create Post button.
   */
  protected async navigateHere(): Promise<void> {
    await this.getNavLink("Posts").click();
    await this.page.getByRole("button", { name: /create post|new post/i }).click();
  }

  /**
   * Verify the posting page is fully loaded
   *
   * Checks that:
   * - Page container is visible
   * - Content textarea is visible
   *
   * @returns this for method chaining
   */
  override async verifyPageLoaded(): Promise<this> {
    await super.verifyPageLoaded();
    await this.contentTextarea.waitFor({ state: "visible" });
    return this;
  }

  /**
   * Create a text-only post
   *
   * @param content - The text content for the post
   */
  async createTextPost(content: string): Promise<void> {
    await this.contentTextarea.fill(content);
    await this.publishButton.click();
  }

  /**
   * Create a post with media
   *
   * @param content - The text content for the post
   * @param mediaPath - Path to the media file to upload
   * @param caption - Optional caption for the media
   */
  async createPostWithMedia(content: string, mediaPath: string, caption?: string): Promise<void> {
    await this.contentTextarea.fill(content);

    // Upload media
    await this.uploadMedia(mediaPath);

    // Add caption if provided
    if (caption) {
      await this.captionInput.fill(caption);
    }

    await this.publishButton.click();
  }

  /**
   * Upload media file
   *
   * @param mediaPath - Path to the media file to upload
   */
  async uploadMedia(mediaPath: string): Promise<void> {
    await this.mediaButton.click();
    await this.mediaUploader.waitFor({ state: "visible" });

    // Use setInputFiles for file upload
    const fileInput = this.mediaUploader.locator('input[type="file"]');
    await fileInput.setInputFiles(mediaPath);

    // Wait for upload to complete
    await this.waitForMediaUpload();
  }

  /**
   * Wait for media upload to complete
   *
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForMediaUpload(timeout = 30000): Promise<void> {
    // Wait for upload progress to complete
    const uploadProgress = this.page.getByTestId("upload-progress");
    if ((await uploadProgress.count()) > 0) {
      await uploadProgress.waitFor({ state: "hidden", timeout });
    }

    // Verify preview appears
    await this.postPreview.waitFor({ state: "visible", timeout });
  }

  /**
   * Schedule a post for later
   *
   * @param content - The text content for the post
   * @param date - The date to schedule
   * @param time - The time to schedule (HH:MM format)
   */
  async schedulePost(content: string, date: string, time: string): Promise<void> {
    await this.contentTextarea.fill(content);
    await this.scheduleButton.click();

    // Fill schedule date and time
    await this.scheduleDatePicker.fill(date);
    await this.scheduleTimePicker.fill(time);

    await this.confirmScheduleButton.click();
  }

  /**
   * Save post as draft
   *
   * @param content - The text content for the post
   */
  async saveAsDraft(content: string): Promise<void> {
    await this.contentTextarea.fill(content);
    await this.saveDraftButton.click();
  }

  /**
   * Select target platform
   *
   * @param platform - The platform to select (e.g., "facebook", "instagram")
   */
  async selectPlatform(platform: string): Promise<void> {
    await this.platformSelect.click();
    await this.page.getByRole("option", { name: platform }).click();
  }

  /**
   * Get the current character count
   *
   * @returns The current character count as a number
   */
  async getCharacterCount(): Promise<number> {
    const countText = await this.characterCount.textContent();
    if (countText === null) {
      return 0;
    }
    // Parse format like "150/280" or just "150"
    const match = countText.match(/(\d+)/);
    return match !== null ? Number.parseInt(match[1] ?? "0", 10) : 0;
  }

  /**
   * Verify the character limit is not exceeded
   *
   * @param maxChars - Maximum allowed characters
   */
  async verifyCharacterLimit(maxChars: number): Promise<boolean> {
    const currentCount = await this.getCharacterCount();
    return currentCount <= maxChars;
  }

  /**
   * Verify post was published successfully
   *
   * @param timeout - Maximum time to wait for success message
   */
  async verifySuccess(timeout = 10000): Promise<void> {
    await this.successToast.waitFor({ state: "visible", timeout });
  }

  /**
   * Verify post preview is visible
   */
  async verifyPostPreviewVisible(): Promise<void> {
    await this.postPreview.waitFor({ state: "visible" });
  }

  /**
   * Verify media is uploaded and preview is shown
   *
   * @param mediaName - Partial name of the media file
   */
  async verifyMediaUploaded(mediaName: string): Promise<void> {
    await this.postPreview.getByText(mediaName).waitFor({ state: "visible" });
  }

  /**
   * Remove uploaded media
   */
  async removeMedia(): Promise<void> {
    const removeButton = this.postPreview.getByRole("button", { name: /remove|delete/i });
    await removeButton.click();
  }

  /**
   * Edit an existing post
   *
   * @param postContent - Content to identify the post to edit
   * @param newContent - New content for the post
   */
  async editPost(postContent: string, newContent: string): Promise<void> {
    // Find and click edit button for the post
    const postCard = this.page.getByRole("article").filter({ hasText: postContent });
    await postCard.getByRole("button", { name: /edit/i }).click();

    // Wait for edit modal and update content
    await this.contentTextarea.waitFor({ state: "visible" });
    await this.contentTextarea.fill(newContent);
    await this.publishButton.click();
  }

  /**
   * Cancel post creation
   */
  async cancelPost(): Promise<void> {
    const cancelButton = this.page.getByRole("button", { name: /cancel|close/i });
    await cancelButton.click();
  }

  /**
   * Verify error message is displayed
   *
   * @param errorMessage - The error message to look for
   */
  async verifyError(errorMessage: string): Promise<void> {
    const errorAlert = this.page.getByRole("alert").filter({ hasText: errorMessage });
    await errorAlert.waitFor({ state: "visible" });
  }
}
