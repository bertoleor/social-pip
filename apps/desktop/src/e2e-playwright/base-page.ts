/**
 * Base Page Object Model for Tauri E2E testing
 *
 * Abstract class that all page objects should extend.
 * Provides common navigation, waiting, and verification methods.
 *
 * @example
 * class DashboardPage extends BasePage {
 *   constructor(page: Page) {
 *     super(page, 'page-dashboard')
 *   }
 *
 *   protected async navigateHere(): Promise<void> {
 *     await this.page.getByRole('link', { name: 'Dashboard' }).click()
 *   }
 * }
 */
import type { Page, Locator } from "@playwright/test"

/**
 * Abstract base class for all Page Object Models
 *
 * Provides:
 * - Common navigation methods
 * - Common wait strategies
 * - Common verification methods
 * - Selector priority enforcement (getByRole > getByLabel > getByTestId)
 *
 * Subclasses MUST implement:
 * - navigateHere(): How to navigate to this page from anywhere
 */
export abstract class BasePage {
  /** Playwright page instance */
  protected readonly page: Page

  /** Container locator for this page (using data-testid) */
  protected readonly pageContainer: Locator

  /** The data-testid identifier for this page */
  protected readonly pageTestId: string

  /**
   * Creates a new BasePage instance
   * @param page - Playwright page instance
   * @param pageTestId - The data-testid attribute value for this page's container
   */
  constructor(page: Page, pageTestId: string) {
    this.page = page
    this.pageTestId = pageTestId
    this.pageContainer = page.getByTestId(pageTestId)
  }

  /**
   * Navigate to this page and verify it's loaded
   *
   * This method calls navigateHere() (implemented by subclass)
   * and then verifies the page is loaded.
   *
   * @returns this for method chaining
   */
  async goto(): Promise<this> {
    await this.navigateHere()
    await this.verifyPageLoaded()
    return this
  }

  /**
   * Verify the page is loaded by checking the page container is visible
   *
   * @param timeout - Maximum time to wait in milliseconds (default: 10000)
   * @returns this for method chaining
   */
  async verifyPageLoaded(timeout = 10000): Promise<this> {
    await this.pageContainer.waitFor({ state: "visible", timeout })
    return this
  }

  /**
   * Wait for a notification/toast message to appear
   *
   * @param message - The text content to wait for
   * @param type - Optional type filter ('success' | 'error')
   * @param timeout - Maximum time to wait in milliseconds (default: 5000)
   */
  async waitForNotification(
    message: string,
    type?: "success" | "error",
    timeout = 5000,
  ): Promise<void> {
    const notification = this.page
      .getByRole("alert")
      .filter({ hasText: message })

    await notification.waitFor({ state: "visible", timeout })

    if (type) {
      // If type is specified, verify the notification has the correct type
      await this.page
        .getByRole("alert", { name: type })
        .filter({ hasText: message })
        .waitFor({ state: "visible", timeout })
    }
  }

  /**
   * Wait for loading indicator to disappear
   *
   * Useful after actions that trigger async operations.
   *
   * @param timeout - Maximum time to wait in milliseconds (default: 10000)
   */
  async waitForLoadingComplete(timeout = 10000): Promise<void> {
    const loading = this.page.getByTestId("loading")
    await loading.waitFor({ state: "hidden", timeout })
  }

  /**
   * Wait for the navigation sidebar to be visible
   *
   * Useful for ensuring the app is ready after launch.
   *
   * @param timeout - Maximum time to wait in milliseconds (default: 10000)
   */
  async waitForNavigation(timeout = 10000): Promise<void> {
    await this.page.locator("nav").waitFor({ state: "visible", timeout })
  }

  /**
   * Get a navigation link by its text content
   *
   * Uses getByRole for accessibility-first selection.
   *
   * @param name - The accessible name of the link
   * @returns Locator for the navigation link
   */
  getNavLink(name: string): Locator {
    return this.page.getByRole("link", { name })
  }

  /**
   * Get a button by its accessible name
   *
   * Uses getByRole for accessibility-first selection.
   *
   * @param name - The accessible name of the button
   * @returns Locator for the button
   */
  getButton(name: string): Locator {
    return this.page.getByRole("button", { name })
  }

  /**
   * Get an input by its label
   *
   * Uses getByLabel for accessibility-first selection.
   *
   * @param label - The label text for the input
   * @returns Locator for the input
   */
  getInput(label: string): Locator {
    return this.page.getByLabel(label)
  }

  /**
   * Get the page heading (h1)
   *
   * @returns Locator for the h1 element
   */
  getHeading(): Locator {
    return this.page.locator("h1")
  }

  /**
   * Get the modal/dialog element
   *
   * Uses getByRole for accessibility-first selection.
   *
   * @returns Locator for the dialog element
   */
  getModal(): Locator {
    return this.page.getByRole("dialog")
  }

  /**
   * Navigate to this page from anywhere in the app
   *
   * MUST be implemented by every subclass.
   * This method should click navigation links or perform
   * whatever actions are needed to reach this page.
   *
   * Note: This is called by goto() and should not verify
   * the page is loaded - that's done separately.
   */
  protected abstract navigateHere(): Promise<void>
}
