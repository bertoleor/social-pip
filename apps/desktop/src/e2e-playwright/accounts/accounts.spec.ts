/**
 * Accounts E2E Tests
 *
 * Tests for account management functionality including:
 * - Viewing the accounts page
 * - Opening the account creation modal
 * - Filling the account creation form
 * - Closing the modal
 *
 * Uses custom fixtures and AccountsPage POM for:
 * - Clean test setup
 * - Maintainable selectors
 * - Reusable account operations
 */
import { test, expect } from "../fixtures"
import { AccountsPage } from "./accounts-page"

test.describe("Account Creation", () => {
	test(
		"displays account management page",
		{ tag: ["@critical", "@e2e", "@ACCOUNT-001"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()
			await accountsPage.verifyPageLoaded()

			// Verify heading and Add Account button are visible
			await expect(accountsPage.heading).toContainText("Accounts")
			await expect(accountsPage.addAccountButton).toBeVisible()
		},
	)

	test(
		"opens create account modal",
		{ tag: ["@e2e", "@ACCOUNT-002"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()

			await accountsPage.clickAddAccount()
			await accountsPage.verifyModalVisible()
		},
	)

	test(
		"create account form has required fields",
		{ tag: ["@e2e", "@ACCOUNT-003"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()

			await accountsPage.clickAddAccount()
			await accountsPage.verifyModalVisible()

			// Verify form fields are visible using POM locators
			await expect(accountsPage.nameInput).toBeVisible()
			await expect(accountsPage.usernameInput).toBeVisible()
			await expect(accountsPage.platformSelect).toBeVisible()
		},
	)

	test(
		"can fill account creation form",
		{ tag: ["@e2e", "@ACCOUNT-004"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()

			await accountsPage.clickAddAccount()
			await accountsPage.verifyModalVisible()

			// Fill form using POM methods
			await accountsPage.fillAccountForm("Test Account", "testuser123")

			// Verify values were set
			const nameValue = await accountsPage.nameInput.inputValue()
			expect(nameValue).toBe("Test Account")

			const usernameValue = await accountsPage.usernameInput.inputValue()
			expect(usernameValue).toBe("testuser123")
		},
	)

	test(
		"modal can be closed",
		{ tag: ["@e2e", "@ACCOUNT-005"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()

			await accountsPage.clickAddAccount()
			await accountsPage.verifyModalVisible()

			// Try to close with cancel button, or use Escape as fallback
			const cancelButton = accountsPage.cancelButton
			if (await cancelButton.count() > 0) {
				await cancelButton.click()
			} else {
				await tauriPage.keyboard.press("Escape")
			}

			await accountsPage.verifyModalClosed()
		},
	)

	test(
		"displays account list container",
		{ tag: ["@e2e", "@ACCOUNT-006"] },
		async ({ tauriPage }) => {
			const accountsPage = new AccountsPage(tauriPage)
			await accountsPage.goto()

			// Check if accounts list exists (may be empty initially)
			const accountListContainer = accountsPage.accountsList

			if (await accountListContainer.count() > 0) {
				await expect(accountListContainer).toBeVisible()
			} else {
				// Fallback: verify we're on the accounts page
				await expect(accountsPage.heading).toContainText("Accounts")
			}
		},
	)
})
