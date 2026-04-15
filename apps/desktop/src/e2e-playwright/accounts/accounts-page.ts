/**
 * Accounts Page Object Model
 *
 * Represents the Accounts management page of the Social-Pip application.
 * Provides methods for viewing accounts, adding new accounts, and managing existing ones.
 *
 * @example
 * const accountsPage = new AccountsPage(page)
 * await accountsPage.goto()
 * await accountsPage.clickAddAccount()
 */
import type { Locator, Page } from "@playwright/test"
import { BasePage } from "../base-page"

/**
 * Page Object Model for the Accounts page
 *
 * Extends BasePage and provides:
 * - Navigation to Accounts
 * - Account creation flow (modal interactions)
 * - Account list management
 */
export class AccountsPage extends BasePage {
	/** The main heading (h1) of the accounts page */
	readonly heading: Locator

	/** Add Account button */
	readonly addAccountButton: Locator

	/** Account creation/edit modal */
	readonly accountModal: Locator

	/** Account name input field */
	readonly nameInput: Locator

	/** Username input field */
	readonly usernameInput: Locator

	/** Platform selection dropdown */
	readonly platformSelect: Locator

	/** Submit button in modal */
	readonly submitButton: Locator

	/** Cancel button in modal */
	readonly cancelButton: Locator

	/** List of accounts */
	readonly accountsList: Locator

	/**
	 * Creates a new AccountsPage instance
	 * @param page - Playwright page instance
	 */
	constructor(page: Page) {
		super(page, "page-accounts")

		// Use getByRole for heading
		this.heading = page.getByRole("heading", { level: 1 })

		// Use getByRole for interactive elements
		this.addAccountButton = page.getByRole("button", { name: "Add Account" })

		// Use getByRole for modal/dialog
		this.accountModal = page.getByRole("dialog")

		// Use getByLabel for form inputs (accessibility-first)
		this.nameInput = page.getByLabel("Name")
		this.usernameInput = page.getByLabel("Username")

		// Use getByRole for select/combobox
		this.platformSelect = page.getByRole("combobox", { name: "Platform" })

		// Modal action buttons
		this.submitButton = this.accountModal.getByRole("button", { name: "Submit" })
		this.cancelButton = this.accountModal.getByRole("button", { name: "Cancel" })

		// Use getByTestId for list container
		this.accountsList = page.getByTestId("accounts-list")
	}

	/**
	 * Navigate to the Accounts page from anywhere in the app
	 *
	 * Clicks the Accounts link in the navigation sidebar.
	 */
	protected async navigateHere(): Promise<void> {
		await this.getNavLink("Accounts").click()
	}

	/**
	 * Verify the accounts page is fully loaded
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
	 * Click the Add Account button to open the creation modal
	 */
	async clickAddAccount(): Promise<void> {
		await this.addAccountButton.click()
	}

	/**
	 * Fill the account creation form
	 *
	 * @param name - The display name for the account
	 * @param username - The username/handle for the account
	 */
	async fillAccountForm(name: string, username: string): Promise<void> {
		await this.nameInput.fill(name)
		await this.usernameInput.fill(username)
	}

	/**
	 * Select a platform from the dropdown
	 *
	 * @param platform - The platform name to select
	 */
	async selectPlatform(platform: string): Promise<void> {
		await this.platformSelect.click()
		await this.page.getByRole("option", { name: platform }).click()
	}

	/**
	 * Submit the account creation form
	 */
	async submitAccount(): Promise<void> {
		await this.submitButton.click()
	}

	/**
	 * Cancel the account creation modal
	 */
	async cancelAccountCreation(): Promise<void> {
		await this.cancelButton.click()
	}

	/**
	 * Complete account creation flow in one call
	 *
	 * @param name - The display name for the account
	 * @param username - The username/handle for the account
	 * @param platform - The platform name to select
	 */
	async createAccount(
		name: string,
		username: string,
		platform: string,
	): Promise<void> {
		await this.clickAddAccount()
		await this.accountModal.waitFor({ state: "visible" })
		await this.fillAccountForm(name, username)
		await this.selectPlatform(platform)
		await this.submitAccount()
	}

	/**
	 * Get an account card by name
	 *
	 * @param accountName - The name of the account
	 * @returns Locator for the account card
	 */
	getAccountByName(accountName: string): Locator {
		return this.accountsList.getByRole("article").filter({
			hasText: accountName,
		})
	}

	/**
	 * Get the delete button for a specific account
	 *
	 * @param accountName - The name of the account
	 * @returns Locator for the delete button
	 */
	getDeleteButton(accountName: string): Locator {
		return this.getAccountByName(accountName).getByRole("button", {
			name: "Delete",
		})
	}

	/**
	 * Verify the account modal is visible
	 *
	 * @param timeout - Maximum time to wait in milliseconds
	 */
	async verifyModalVisible(timeout = 5000): Promise<void> {
		await this.accountModal.waitFor({ state: "visible", timeout })
	}

	/**
	 * Verify the account modal is hidden/closed
	 *
	 * @param timeout - Maximum time to wait in milliseconds
	 */
	async verifyModalClosed(timeout = 5000): Promise<void> {
		await this.accountModal.waitFor({ state: "hidden", timeout })
	}
}
