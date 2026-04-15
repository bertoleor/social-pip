/**
 * Playwright fixtures for Tauri E2E testing
 *
 * This file defines custom fixtures that handle:
 * - Worker-scoped tauriApp: builds app and spawns tauri-driver once per worker
 * - Test-scoped tauriPage: navigates to app and ensures readiness
 *
 * @example
 * import { test, expect } from './fixtures'
 *
 * test('my test', async ({ tauriPage }) => {
 *   await expect(tauriPage.locator('nav')).toBeVisible()
 * })
 */
import { test as base, type Page } from "@playwright/test"
import {
  buildTauriApp,
  startTauriDriver,
  stopTauriDriver,
  setupShutdownHandler,
  type TauriDriverProcess,
} from "./helpers"

/**
 * Worker-scoped fixture state
 * Contains the tauri-driver process that persists across all tests in a worker
 */
interface TauriWorkerFixture {
  driverProcess: TauriDriverProcess
}

/**
 * Test-scoped fixtures
 * These are provided to each test
 */
interface TauriTestFixtures {
  /** Page pre-navigated to tauri://localhost with app ready */
  tauriPage: Page
}

/**
 * Worker fixtures (for worker-scoped state)
 */
interface TauriWorkerFixtures {
  /** The tauri-driver process (worker-scoped) */
  tauriApp: TauriWorkerFixture
}

/**
 * Combined fixture types for the test
 */
type MyFixtures = TauriTestFixtures
type MyWorkerFixtures = TauriWorkerFixtures

/**
 * Custom Playwright test with Tauri fixtures
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures'
 *
 * test('my test', async ({ tauriPage }) => {
 *   // tauriPage is already navigated and ready
 *   await expect(tauriPage.locator('nav')).toBeVisible()
 * })
 * ```
 */
export const test = base.extend<MyFixtures, MyWorkerFixtures>({
  /**
   * Worker-scoped fixture for tauri-driver lifecycle
   * - Builds Tauri app once per worker
   * - Spawns tauri-driver once per worker
   * - Handles cleanup on worker shutdown
   */
  tauriApp: [
    async ({}, use) => {
      // Build Tauri app in debug mode
      buildTauriApp()

      // Start tauri-driver process
      const driverProcess = startTauriDriver()

      // Setup cleanup handler for process exit
      setupShutdownHandler(() => {
        stopTauriDriver(driverProcess)
      })

      // Provide to tests
      await use({ driverProcess })

      // Cleanup after all tests in worker complete
      stopTauriDriver(driverProcess)
    },
    { scope: "worker", auto: true },
  ],

  /**
   * Test-scoped fixture that provides a page pre-navigated to the Tauri app
   * - Navigates to tauri://localhost
   * - Waits for navigation to be visible (app loaded)
   * - Returns the page for test use
   */
  tauriPage: async ({ page }, use) => {
    // Navigate to the Tauri app
    await page.goto("tauri://localhost")

    // Wait for the app to be ready (navigation visible)
    await page.locator("nav").waitFor({ state: "visible", timeout: 10000 })

    // Provide the page to the test
    await use(page)
  },
})

/**
 * Re-export expect from Playwright for convenience
 */
export { expect } from "@playwright/test"

/**
 * Type exports for consumers
 */
export type { TauriTestFixtures, TauriWorkerFixture, TauriWorkerFixtures }
