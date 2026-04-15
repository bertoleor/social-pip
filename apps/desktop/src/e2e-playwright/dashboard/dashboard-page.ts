/**
 * Dashboard Page Object Model
 *
 * Represents the main Dashboard page of the Social-Pip application.
 * Provides methods for navigation and verification of dashboard elements.
 *
 * @example
 * const dashboardPage = new DashboardPage(page)
 * await dashboardPage.goto()
 * await expect(dashboardPage.heading).toBeVisible()
 */
import type { Locator, Page } from "@playwright/test"
import { BasePage } from "../base-page"

/**
 * Page Object Model for the Dashboard page
 *
 * Extends BasePage and provides:
 * - Navigation to Dashboard
 * - Verification of page loaded state
 * - Access to dashboard-specific elements
 */
export class DashboardPage extends BasePage {
	/** The main heading (h1) of the dashboard */
	readonly heading: Locator

	/** Overview stats section */
	readonly statsOverview: Locator

	/** Recent activity section */
	readonly recentActivity: Locator

	/** Quick actions section */
	readonly quickActions: Locator

	/**
	 * Creates a new DashboardPage instance
	 * @param page - Playwright page instance
	 */
	constructor(page: Page) {
		super(page, "page-dashboard")

		// Use getByRole for heading (best practice for headings)
		this.heading = page.getByRole("heading", { level: 1 })

		// Use getByTestId for dashboard-specific sections
		this.statsOverview = page.getByTestId("stats-overview")
		this.recentActivity = page.getByTestId("recent-activity")
		this.quickActions = page.getByTestId("quick-actions")
	}

	/**
	 * Navigate to the Dashboard page from anywhere in the app
	 *
	 * Clicks the Dashboard link in the navigation sidebar.
	 */
	protected async navigateHere(): Promise<void> {
		await this.getNavLink("Dashboard").click()
	}

	/**
	 * Verify the dashboard page is fully loaded
	 *
	 * Checks that:
	 * - Page container is visible
	 * - Main heading is visible
	 *
	 * @returns this for method chaining
	 */
	override async verifyPageLoaded(): Promise<this> {
		await super.verifyPageLoaded()
		await this.heading.waitFor({ state: "visible" })
		return this
	}

	/**
	 * Get a quick action button by name
	 *
	 * @param name - The accessible name of the button (e.g., "New Post")
	 * @returns Locator for the button
	 */
	getQuickActionButton(name: string): Locator {
		return this.quickActions.getByRole("button", { name })
	}

	/**
	 * Click a navigation item in the stats overview
	 *
	 * @param itemName - The name of the stat item
	 * @returns Locator for the stat item
	 */
	getStatItem(itemName: string): Locator {
		return this.statsOverview.getByRole("link", { name: itemName })
	}
}
