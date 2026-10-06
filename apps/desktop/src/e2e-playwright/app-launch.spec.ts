/**
 * App Launch E2E Tests
 *
 * Tests that the Tauri desktop application launches correctly
 * and displays the expected initial UI elements.
 *
 * Uses custom fixtures that handle:
 * - Building Tauri app (worker-scoped)
 * - Spawning tauri-driver (worker-scoped)
 * - Pre-navigating to the app (test-scoped)
 */
import { expect, test } from "./fixtures";

test.describe("Desktop App Launch", () => {
  test("app launches and shows dashboard", {
    tag: ["@critical", "@e2e", "@APP-LAUNCH-001"],
  }, async ({ tauriPage }) => {
    // tauriPage is already navigated and ready (handled by fixture)
    await expect(tauriPage.locator("text=Dashboard").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("app displays main navigation", { tag: ["@e2e", "@APP-LAUNCH-002"] }, async ({
    tauriPage,
  }) => {
    // Navigation is already visible (fixture waits for nav)
    await expect(tauriPage.locator("nav")).toBeVisible({ timeout: 10000 });
  });

  test("app window has correct title", { tag: ["@e2e", "@APP-LAUNCH-003"] }, async ({
    tauriPage,
  }) => {
    await expect(tauriPage).toHaveTitle(/Social-Pip/i);
  });

  test("sidebar navigation items are present", { tag: ["@e2e", "@APP-LAUNCH-004"] }, async ({
    tauriPage,
  }) => {
    await expect(tauriPage.locator("nav")).toBeVisible({ timeout: 10000 });

    const navItems = ["Dashboard", "Accounts", "Posts", "Schedule", "Analytics", "Settings"];

    for (const item of navItems) {
      const link = tauriPage.locator(`nav a:has-text("${item}")`);
      await expect(link).toBeVisible();
    }
  });

  test("app loads without console errors", { tag: ["@e2e", "@APP-LAUNCH-005"] }, async ({
    tauriPage,
  }) => {
    const errors: string[] = [];

    tauriPage.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Re-navigate to capture console errors from fresh load
    await tauriPage.goto("tauri://localhost");

    await expect(tauriPage.locator("body")).toBeVisible({ timeout: 10000 });

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Warning:") && !e.includes("React DevTools") && !e.includes("chrome-extension"),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
