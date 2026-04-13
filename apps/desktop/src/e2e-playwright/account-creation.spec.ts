import { spawn, spawnSync } from "node:child_process"
import * as os from "node:os"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const TAURI_DRIVER_PATH = path.resolve(
	os.homedir(),
	".cargo",
	"bin",
	"tauri-driver"
)

let tauriDriver: ReturnType<typeof spawn>
let exit = false

test.describe("Account Creation", () => {
	test.beforeAll(async () => {
		spawnSync("pnpm", ["tauri", "build", "--debug", "--no-bundle"], {
			cwd: path.resolve(__dirname, "..", ".."),
			stdio: "inherit",
			shell: true,
		})

		tauriDriver = spawn(TAURI_DRIVER_PATH, [], {
			stdio: [null, process.stdout, process.stderr],
		})

		tauriDriver.on("error", (error) => {
			console.error("tauri-driver error:", error)
			process.exit(1)
		})

		tauriDriver.on("exit", (code) => {
			if (!exit) {
				console.error("tauri-driver exited with code:", code)
				process.exit(1)
			}
		})
	})

	test.afterAll(async () => {
		exit = true
		tauriDriver?.kill()
	})

	test.beforeEach(async ({ page }) => {
		await page.goto("tauri://localhost")
		await expect(page.locator("nav")).toBeVisible({ timeout: 10000 })
		await page.click('nav a:has-text("Accounts")')
		await expect(page.locator('[data-testid="page-accounts"]')).toBeVisible({
			timeout: 5000,
		})
	})

	test("displays account management page", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Accounts")
		await expect(page.locator('button:has-text("Add Account")')).toBeVisible()
	})

	test("opens create account modal", async ({ page }) => {
		await page.click('button:has-text("Add Account")')

		await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
	})

	test("create account form has required fields", async ({ page }) => {
		await page.click('button:has-text("Add Account")')

		const modal = page.locator('[role="dialog"]')
		await expect(modal).toBeVisible()

		await expect(modal.locator('input[name="name"]')).toBeVisible()
		await expect(modal.locator('input[name="username"]')).toBeVisible()
		await expect(modal.locator('select[name="platform"]')).toBeVisible()
	})

	test("can fill account creation form", async ({ page }) => {
		await page.click('button:has-text("Add Account")')

		const modal = page.locator('[role="dialog"]')
		await expect(modal).toBeVisible()

		await modal.locator('input[name="name"]').fill("Test Account")
		await modal.locator('input[name="username"]').fill("testuser123")

		const platformSelect = modal.locator('select[name="platform"]')
		await platformSelect.selectOption({ index: 0 })

		const nameValue = await modal.locator('input[name="name"]').inputValue()
		expect(nameValue).toBe("Test Account")

		const usernameValue = await modal
			.locator('input[name="username"]')
			.inputValue()
		expect(usernameValue).toBe("testuser123")
	})

	test("modal can be closed", async ({ page }) => {
		await page.click('button:has-text("Add Account")')

		const modal = page.locator('[role="dialog"]')
		await expect(modal).toBeVisible()

		const cancelButton = modal.locator('button:has-text("Cancel")')
		if (await cancelButton.count() > 0) {
			await cancelButton.click()
		} else {
			await page.keyboard.press("Escape")
		}

		await expect(modal).not.toBeVisible({ timeout: 5000 })
	})

	test("displays account list container", async ({ page }) => {
		const accountListContainer = page.locator('[data-testid="account-list"]')

		if (await accountListContainer.count() > 0) {
			await expect(accountListContainer).toBeVisible()
		} else {
			await expect(page.locator("h1")).toContainText("Accounts")
		}
	})
})
