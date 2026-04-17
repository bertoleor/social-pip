/**
 * Schedule Page Object Model
 *
 * Represents the Schedule/Calendar page of the Social-Pip application.
 * Provides methods for viewing the calendar, selecting dates, and managing scheduled posts.
 *
 * @example
 * const schedulePage = new SchedulePage(page)
 * await schedulePage.goto()
 * await schedulePage.selectDate(new Date())
 */
import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object Model for the Schedule page
 *
 * Extends BasePage and provides:
 * - Navigation to Schedule
 * - Calendar view interactions
 * - Date selection and scheduling
 */
export class SchedulePage extends BasePage {
  /** The main heading (h1) of the schedule page */
  readonly heading: Locator;

  /** The calendar container */
  readonly calendar: Locator;

  /** Today button for quick navigation */
  readonly todayButton: Locator;

  /** Previous month navigation button */
  readonly prevMonthButton: Locator;

  /** Next month navigation button */
  readonly nextMonthButton: Locator;

  /** Current month/year display */
  readonly currentMonthDisplay: Locator;

  /** View toggle (month/week/day) */
  readonly viewToggle: Locator;

  /** Scheduled posts container */
  readonly scheduledPosts: Locator;

  /**
   * Creates a new SchedulePage instance
   * @param page - Playwright page instance
   */
  constructor(page: Page) {
    super(page, "page-schedule");

    // Use getByRole for heading
    this.heading = page.getByRole("heading", { level: 1 });

    // Use getByTestId for calendar container
    this.calendar = page.getByTestId("calendar");

    // Use getByRole for navigation buttons
    this.todayButton = page.getByRole("button", { name: "Today" });
    this.prevMonthButton = page.getByRole("button", { name: "Previous" });
    this.nextMonthButton = page.getByRole("button", { name: "Next" });

    // Use getByRole for the month display (heading within calendar)
    this.currentMonthDisplay = this.calendar.getByRole("heading", { level: 2 });

    // Use getByRole for view toggle (group of radio buttons or tabs)
    this.viewToggle = page.getByRole("tablist").filter({ hasText: "view" });

    // Use getByTestId for scheduled posts list
    this.scheduledPosts = page.getByTestId("scheduled-posts");
  }

  /**
   * Navigate to the Schedule page from anywhere in the app
   *
   * Clicks the Schedule link in the navigation sidebar.
   */
  protected async navigateHere(): Promise<void> {
    await this.getNavLink("Schedule").click();
  }

  /**
   * Verify the schedule page is fully loaded
   *
   * Checks that:
   * - Page container is visible
   * - Main heading is visible
   * - Calendar is visible
   *
   * @returns this for method chaining
   */
  override async verifyPageLoaded(): Promise<this> {
    await super.verifyPageLoaded();
    await this.heading.waitFor({ state: "visible" });
    await this.calendar.waitFor({ state: "visible" });
    return this;
  }

  /**
   * Select a specific date on the calendar
   *
   * @param date - The date to select
   */
  async selectDate(date: Date): Promise<void> {
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    // Navigate to the correct month if needed
    await this.navigateToMonth(month, year);

    // Click the specific day cell
    // Use getByRole for gridcell with aria-label
    await this.calendar
      .getByRole("gridcell")
      .filter({ has: this.page.getByRole("button", { name: String(day) }) })
      .click();
  }

  /**
   * Navigate to a specific month and year
   *
   * @param month - The month name (e.g., "January")
   * @param year - The year (e.g., 2024)
   */
  async navigateToMonth(month: string, year: number): Promise<void> {
    // Check current month and navigate if needed
    const currentDisplay = await this.currentMonthDisplay.textContent();

    if (!currentDisplay?.includes(month) || !currentDisplay?.includes(String(year))) {
      // Navigate using prev/next buttons until we reach the target month
      // This is a simplified approach - in production you might want more sophisticated navigation
      const targetDate = new Date(`${month} 1, ${year}`);
      const now = new Date();

      const monthsDiff =
        (targetDate.getFullYear() - now.getFullYear()) * 12 +
        targetDate.getMonth() -
        now.getMonth();

      const button = monthsDiff > 0 ? this.nextMonthButton : this.prevMonthButton;
      const clicks = Math.abs(monthsDiff);

      for (let i = 0; i < clicks; i++) {
        await button.click();
        await this.page.waitForTimeout(100); // Small delay for animation
      }
    }
  }

  /**
   * Click the Today button to jump to current date
   */
  async goToToday(): Promise<void> {
    await this.todayButton.click();
  }

  /**
   * Go to the previous month
   */
  async goToPreviousMonth(): Promise<void> {
    await this.prevMonthButton.click();
  }

  /**
   * Go to the next month
   */
  async goToNextMonth(): Promise<void> {
    await this.nextMonthButton.click();
  }

  /**
   * Switch calendar view (month/week/day)
   *
   * @param view - The view to switch to
   */
  async switchView(view: "month" | "week" | "day"): Promise<void> {
    await this.page.getByRole("tab", { name: view }).click();
  }

  /**
   * Get all events for a specific date
   *
   * @param date - The date to get events for
   * @returns Locator for events on that date
   */
  getEventsForDate(date: Date): Locator {
    const dateStr = date.toISOString().split("T")[0];
    return this.calendar.getByRole("button").filter({
      has: this.page.getByTestId(`event-${dateStr}`),
    });
  }

  /**
   * Get a scheduled post by its title
   *
   * @param title - The title of the scheduled post
   * @returns Locator for the scheduled post item
   */
  getScheduledPost(title: string): Locator {
    return this.scheduledPosts.getByRole("article").filter({
      hasText: title,
    });
  }

  /**
   * Get the current month/year display text
   *
   * @returns Promise resolving to the current month display text
   */
  async getCurrentMonthText(): Promise<string> {
    return (await this.currentMonthDisplay.textContent()) ?? "";
  }
}
