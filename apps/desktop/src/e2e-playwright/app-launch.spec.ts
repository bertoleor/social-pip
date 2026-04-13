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

test.describe("Desktop App Launch", () => {
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

	test("app launches and shows dashboard", async ({ page }) => {
		await page.goto("tauri://localhost")

		await expect(page.locator("text=Dashboard").first()).toBeVisible({
			timeout: 10000,
		})
	})

	test("app displays main navigation", async ({ page }) => {
		await page.goto("tauri://localhost")

		await expect(page.locator("nav")).toBeVisible({ timeout: 10000 })
	})

	test("app window has correct title", async ({ page }) => {
		await page.goto("tauri://localhost")

		await expect(page).toHaveTitle(/Social-Pip/i)
	})

	test("sidebar navigation items are present", async ({ page }) => {
		await page.goto("tauri://localhost")

		await expect(page.locator("nav")).toBeVisible({ timeout: 10000 })

		const navItems = [
			"Dashboard",
			"Accounts",
			"Posts",
			"Schedule",
			"Analytics",
			"Settings",
		]

		for (const item of navItems) {
			const link = page.locator(`nav a:has-text("${item}")`)
			await expect(link).toBeVisible()
		}
	})

	test("app loads without console errors", async ({ page }) => {
		const errors: string[] = []

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text())
			}
		})

		await page.goto("tauri://localhost")

		await expect(page.locator("body")).toBeVisible({ timeout: 10000 })

		const criticalErrors = errors.filter(
			(e) =>
				!e.includes("Warning:") &&
				!e.includes("React DevTools") &&
				!e.includes("chrome-extension")
		)

		expect(criticalErrors).toHaveLength(0)
	})
})
