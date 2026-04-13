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

test.describe("Navigation", () => {
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
	})

	test("navigates to Accounts page", async ({ page }) => {
		await page.click('nav a:has-text("Accounts")')

		await expect(page.locator('[data-testid="page-accounts"]')).toBeVisible({
			timeout: 5000,
		})

		await expect(page.locator("h1")).toContainText("Accounts")
	})

	test("navigates to Posts page", async ({ page }) => {
		await page.click('nav a:has-text("Posts")')

		await expect(page.locator('[data-testid="page-posts"]')).toBeVisible({
			timeout: 5000,
		})

		await expect(page.locator("h1")).toContainText("Posts")
	})

	test("navigates to Schedule page", async ({ page }) => {
		await page.click('nav a:has-text("Schedule")')

		await expect(page.locator('[data-testid="page-schedule"]')).toBeVisible({
			timeout: 5000,
		})

		await expect(page.locator("h1")).toContainText("Schedule")
	})

	test("navigates to Analytics page", async ({ page }) => {
		await page.click('nav a:has-text("Analytics")')

		await expect(page.locator('[data-testid="page-analytics"]')).toBeVisible({
			timeout: 5000,
		})

		await expect(page.locator("h1")).toContainText("Analytics")
	})

	test("navigates to Settings page", async ({ page }) => {
		await page.click('nav a:has-text("Settings")')

		await expect(page.locator('[data-testid="page-settings"]')).toBeVisible({
			timeout: 5000,
		})

		await expect(page.locator("h1")).toContainText("Settings")
	})

	test("navigates back to Dashboard", async ({ page }) => {
		await page.click('nav a:has-text("Accounts")')
		await expect(page.locator('[data-testid="page-accounts"]')).toBeVisible()

		await page.click('nav a:has-text("Dashboard")')
		await expect(page.locator('[data-testid="page-dashboard"]')).toBeVisible({
			timeout: 5000,
		})
	})

	test("sidebar toggle opens and closes", async ({ page }) => {
		const sidebar = page.locator("nav")
		await expect(sidebar).toBeVisible()

		const toggleButton = page.locator('button[aria-label*="sidebar"]')
		await toggleButton.click()

		await page.waitForTimeout(500)
	})
})
