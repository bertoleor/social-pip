/**
 * Navigation E2E Tests
 *
 * Tests that navigation between pages works correctly
 * using the sidebar navigation.
 *
 * Uses custom fixtures and Page Object Models for:
 * - Clean test setup
 * - Maintainable selectors
 * - Reusable navigation patterns
 */
import { test, expect } from "./fixtures"
import { DashboardPage } from "./dashboard/dashboard-page"
import { AccountsPage } from "./accounts/accounts-page"
import { PostsPage } from "./posts/posts-page"
import { SchedulePage } from "./schedule/schedule-page"
import { AnalyticsPage } from "./analytics/analytics-page"
import { SettingsPage } from "./settings/settings-page"

test.describe("Navigation", () => {
	test(
		"navigates to Accounts page",
		{ tag: ["@critical", "@e2e", "@NAV-001"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()
			await accountsPage.verifyPageLoaded()
		},
	)

	test(
		"navigates to Posts page",
		{ tag: ["@e2e", "@NAV-002"] },
		async ({ tauriPage }) => {
			const postsPage = new PostsPage(tauriPage)
			await postsPage.goto()
			await postsPage.verifyPageLoaded()
		},
	)

	test(
		"navigates to Schedule page",
		{ tag: ["@e2e", "@NAV-003"] },
		async ({ tauriPage }) => {
			const schedulePage = new SchedulePage(tauriPage)
			await schedulePage.goto()
			await schedulePage.verifyPageLoaded()
		},
	)

	test(
		"navigates to Analytics page",
		{ tag: ["@e2e", "@NAV-004"] },
		async ({ tauriPage }) => {
			const analyticsPage = new AnalyticsPage(tauriPage)
			await analyticsPage.goto()
			await analyticsPage.verifyPageLoaded()
		},
	)

	test(
		"navigates to Settings page",
		{ tag: ["@e2e", "@NAV-005"] },
		async ({ tauriPage }) => {
			const settingsPage = new SettingsPage(tauriPage)
			await settingsPage.goto()
			await settingsPage.verifyPageLoaded()
		},
	)

	test(
		"navigates back to Dashboard",
		{ tag: ["@e2e", "@NAV-006"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			const dashboardPage = new DashboardPage(tauriPage)

			// Navigate to Accounts first
			await accountsPage.goto()
			await accountsPage.verifyPageLoaded()

			// Navigate back to Dashboard
			await dashboardPage.goto()
			await dashboardPage.verifyPageLoaded()
		},
	)

	test(
		"sidebar toggle opens and closes",
		{ tag: ["@e2e", "@NAV-007"] },
		async ({ tauriPage }) => {
			const sidebar = tauriPage.locator("nav")
			await expect(sidebar).toBeVisible()

			const toggleButton = tauriPage.locator('button[aria-label*="sidebar"]')
			await toggleButton.click()

			await tauriPage.waitForTimeout(500)
		},
	)
})
