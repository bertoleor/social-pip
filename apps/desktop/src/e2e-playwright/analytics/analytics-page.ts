/**
 * Analytics Page Object Model
 *
 * Represents the Analytics/Dashboard page of the Social-Pip application.
 * Provides methods for viewing analytics, selecting date ranges, and viewing charts.
 *
 * @example
 * const analyticsPage = new AnalyticsPage(page)
 * await analyticsPage.goto()
 * await analyticsPage.selectDateRange('last7days')
 */
import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object Model for the Analytics page
 *
 * Extends BasePage and provides:
 * - Navigation to Analytics
 * - Chart interactions
 * - Date range selection
 * - Stats viewing
 */
export class AnalyticsPage extends BasePage {
  /** The main heading (h1) of the analytics page */
  readonly heading: Locator;

  /** Date range picker */
  readonly dateRangePicker: Locator;

  /** Stats overview container */
  readonly statsOverview: Locator;

  /** Engagement chart */
  readonly engagementChart: Locator;

  /** Reach chart */
  readonly reachChart: Locator;

  /** Growth chart */
  readonly growthChart: Locator;

  /** Export data button */
  readonly exportButton: Locator;

  /** Refresh data button */
  readonly refreshButton: Locator;

  /**
   * Creates a new AnalyticsPage instance
   * @param page - Playwright page instance
   */
  constructor(page: Page) {
    super(page, "page-analytics");

    // Use getByRole for heading
    this.heading = page.getByRole("heading", { level: 1 });

    // Use getByRole for date range picker (combobox or button)
    this.dateRangePicker = page.getByRole("combobox", { name: "Date range" });

    // Use getByTestId for stats sections
    this.statsOverview = page.getByTestId("stats-overview");

    // Use getByTestId for charts
    this.engagementChart = page.getByTestId("chart-engagement");
    this.reachChart = page.getByTestId("chart-reach");
    this.growthChart = page.getByTestId("chart-growth");

    // Use getByRole for action buttons
    this.exportButton = page.getByRole("button", { name: "Export" });
    this.refreshButton = page.getByRole("button", { name: "Refresh" });
  }

  /**
   * Navigate to the Analytics page from anywhere in the app
   *
   * Clicks the Analytics link in the navigation sidebar.
   */
  protected async navigateHere(): Promise<void> {
    await this.getNavLink("Analytics").click();
  }

  /**
   * Verify the analytics page is fully loaded
   *
   * Checks that:
   * - Page container is visible
   * - Main heading is visible
   * - Stats overview is visible
   *
   * @returns this for method chaining
   */
  override async verifyPageLoaded(): Promise<this> {
    await super.verifyPageLoaded();
    await this.heading.waitFor({ state: "visible" });
    await this.statsOverview.waitFor({ state: "visible" });
    return this;
  }

  /**
   * Select a date range preset
   *
   * @param range - The date range preset to select
   */
  async selectDateRange(
    range: "today" | "last7days" | "last30days" | "last90days" | "custom",
  ): Promise<void> {
    await this.dateRangePicker.click();
    await this.page.getByRole("option", { name: range }).click();
    await this.waitForLoadingComplete();
  }

  /**
   * Set a custom date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   */
  async setCustomDateRange(startDate: Date, endDate: Date): Promise<void> {
    await this.dateRangePicker.click();
    await this.page.getByRole("option", { name: "custom" }).click();

    // Use getByLabel for date inputs
    const startInput = this.page.getByLabel("Start date");
    const endInput = this.page.getByLabel("End date");

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    await startInput.fill(startStr ?? "");
    await endInput.fill(endStr ?? "");

    await this.page.getByRole("button", { name: "Apply" }).click();
    await this.waitForLoadingComplete();
  }

  /**
   * Export analytics data
   *
   * @param format - Export format
   */
  async exportData(format: "csv" | "pdf" | "excel" = "csv"): Promise<void> {
    await this.exportButton.click();
    await this.page.getByRole("menuitem", { name: format }).click();
  }

  /**
   * Refresh analytics data
   */
  async refreshData(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get a stat value by its label
   *
   * @param statLabel - The label of the stat (e.g., "Total Followers")
   * @returns Locator for the stat value
   */
  getStatValue(statLabel: string): Locator {
    return this.statsOverview
      .getByRole("listitem")
      .filter({ hasText: statLabel })
      .getByRole("status");
  }

  /**
   * Get percentage change for a stat
   *
   * @param statLabel - The label of the stat
   * @returns Locator for the percentage change
   */
  getStatChange(statLabel: string): Locator {
    return this.statsOverview.getByRole("listitem").filter({ hasText: statLabel }).getByText(/%/);
  }

  /**
   * Click on the engagement chart to expand
   */
  async openEngagementChart(): Promise<void> {
    await this.engagementChart.click();
  }

  /**
   * Click on the reach chart to expand
   */
  async openReachChart(): Promise<void> {
    await this.reachChart.click();
  }

  /**
   * Click on the growth chart to expand
   */
  async openGrowthChart(): Promise<void> {
    await this.growthChart.click();
  }

  /**
   * Hover over a chart point to see tooltip
   *
   * @param chart - The chart to interact with
   * @param index - The index of the data point (0-based)
   */
  async hoverChartPoint(chart: Locator, index: number): Promise<void> {
    // Use locator() for chart data points (SVG elements don't have ARIA roles)
    const points = chart.locator("[data-point-index]");
    await points.nth(index).hover();
  }

  /**
   * Get tooltip content from chart
   *
   * @returns Locator for the chart tooltip
   */
  getChartTooltip(): Locator {
    return this.page.getByRole("tooltip");
  }
}
