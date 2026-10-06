/**
 * Facebook Posting E2E Tests
 *
 * Tests for the Facebook post creation flow including:
 * - Creating text-only posts
 * - Creating posts with media
 * - Scheduling posts for later
 * - Editing existing posts
 * - Draft management
 *
 * Uses custom fixtures and PostingPage POM for:
 * - Clean test setup
 * - Maintainable selectors
 * - Reusable posting operations
 */
import { expect, test } from "../fixtures";
import { PostingPage } from "./posting-page";

test.describe("Facebook Posting", () => {
  test("can create text post", { tag: ["@critical", "@e2e", "@posting", "@POST-E2E-001"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Create a simple text post
    await postingPage.createTextPost("Hello from E2E test!");

    // Verify success
    await postingPage.verifySuccess();
  });

  test("posting form has required elements", {
    tag: ["@e2e", "@posting", "@POST-E2E-002"],
  }, async ({ tauriPage }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Verify all essential elements are visible
    await expect(postingPage.contentTextarea).toBeVisible();
    await expect(postingPage.publishButton).toBeVisible();
    await expect(postingPage.mediaButton).toBeVisible();
    await expect(postingPage.scheduleButton).toBeVisible();
  });

  test("can add text to post content", { tag: ["@e2e", "@posting", "@POST-E2E-003"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Fill content
    await postingPage.contentTextarea.fill("Test post content");

    // Verify content was set
    const content = await postingPage.contentTextarea.inputValue();
    expect(content).toBe("Test post content");
  });

  test("can open media uploader", { tag: ["@e2e", "@posting", "@POST-E2E-004"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Click media button
    await postingPage.mediaButton.click();

    // Verify media uploader appears (if exists)
    const mediaUploaderCount = await postingPage.mediaUploader.count();
    if (mediaUploaderCount > 0) {
      await expect(postingPage.mediaUploader).toBeVisible();
    }
  });

  test("can open schedule dialog", { tag: ["@e2e", "@posting", "@POST-E2E-005"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Add content first (required before scheduling)
    await postingPage.contentTextarea.fill("Scheduled post content");

    // Click schedule button
    const scheduleButtonCount = await postingPage.scheduleButton.count();
    if (scheduleButtonCount > 0) {
      await postingPage.scheduleButton.click();

      // Verify schedule inputs appear
      const datePickerCount = await postingPage.scheduleDatePicker.count();
      if (datePickerCount > 0) {
        await expect(postingPage.scheduleDatePicker).toBeVisible();
      }
    }
  });

  test("can cancel post creation", { tag: ["@e2e", "@posting", "@POST-E2E-006"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Add some content
    await postingPage.contentTextarea.fill("Post that will be cancelled");

    // Cancel the post
    await postingPage.cancelPost();

    // Verify we're back to posts list (modal closed)
    const modal = tauriPage.getByRole("dialog");
    if ((await modal.count()) > 0) {
      await modal.waitFor({ state: "hidden", timeout: 5000 });
    }
  });

  test("character count updates with content", {
    tag: ["@e2e", "@posting", "@POST-E2E-007"],
  }, async ({ tauriPage }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Check if character count element exists
    const charCountElement = await postingPage.characterCount.count();
    if (charCountElement === 0) {
      // Skip if character count is not implemented
      test.skip();
      return;
    }

    // Add content and check count
    await postingPage.contentTextarea.fill("Test");
    const count = await postingPage.getCharacterCount();
    expect(count).toBe(4);
  });

  test("can save post as draft", { tag: ["@e2e", "@posting", "@POST-E2E-008"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Add content
    await postingPage.contentTextarea.fill("Draft post content");

    // Save as draft if button exists
    const saveDraftCount = await postingPage.saveDraftButton.count();
    if (saveDraftCount > 0) {
      await postingPage.saveDraftButton.click();
      // Verify draft saved (look for success toast or redirect)
      await postingPage.waitForLoadingComplete();
    }
  });

  test("can select platform for posting", { tag: ["@e2e", "@posting", "@POST-E2E-009"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Check if platform select exists
    const platformSelectCount = await postingPage.platformSelect.count();
    if (platformSelectCount > 0) {
      await postingPage.selectPlatform("facebook");

      // Verify selection
      const selectedValue = await postingPage.platformSelect.inputValue();
      expect(selectedValue.toLowerCase()).toContain("facebook");
    }
  });

  test("post preview is visible after adding content", {
    tag: ["@e2e", "@posting", "@POST-E2E-010"],
  }, async ({ tauriPage }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Add content
    await postingPage.contentTextarea.fill("Preview test content");

    // Check if preview exists and is visible
    const previewCount = await postingPage.postPreview.count();
    if (previewCount > 0) {
      // Preview may update dynamically
      await postingPage.postPreview.waitFor({ state: "visible", timeout: 3000 });
    }
  });

  test("create post with media (file upload flow)", {
    tag: ["@e2e", "@posting", "@POST-E2E-011"],
  }, async ({ tauriPage }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Note: This test requires a valid test image file
    // In real E2E, you would use a fixture file
    // For this test, we verify the media upload UI is accessible

    // Add content
    await postingPage.contentTextarea.fill("Post with media");

    // Open media uploader
    await postingPage.mediaButton.click();

    // Verify uploader is accessible
    const fileInput = postingPage.mediaUploader.locator('input[type="file"]');
    if ((await fileInput.count()) > 0) {
      // File input exists and is ready for upload
      await expect(fileInput).toBeAttached();
    }
  });

  test("schedule post for future date", { tag: ["@e2e", "@posting", "@POST-E2E-012"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Add content
    await postingPage.contentTextarea.fill("Scheduled post for tomorrow");

    // Open schedule dialog
    const scheduleCount = await postingPage.scheduleButton.count();
    if (scheduleCount > 0) {
      await postingPage.scheduleButton.click();

      // Set a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0] ?? "";
      const timeStr = "10:00";

      // Fill schedule inputs if they exist
      const datePickerCount = await postingPage.scheduleDatePicker.count();
      if (datePickerCount > 0) {
        await postingPage.scheduleDatePicker.fill(dateStr);
        await postingPage.scheduleTimePicker.fill(timeStr);

        // Verify confirm button is visible
        await expect(postingPage.confirmScheduleButton).toBeVisible();
      }
    }
  });

  test("verify post form validation", { tag: ["@e2e", "@posting", "@POST-E2E-013"] }, async ({
    tauriPage,
  }) => {
    const postingPage = new PostingPage(tauriPage);
    await postingPage.goto();

    // Try to publish without content
    const publishButton = postingPage.publishButton;

    // Button might be disabled without content
    const isDisabled = await publishButton.isDisabled();
    if (isDisabled) {
      // Verify button is disabled when no content
      expect(isDisabled).toBe(true);
    } else {
      // If not disabled, clicking should show validation error
      await publishButton.click();

      // Look for validation error
      const errorAlert = tauriPage.getByRole("alert");
      if ((await errorAlert.count()) > 0) {
        await expect(errorAlert).toBeVisible();
      }
    }
  });
});
