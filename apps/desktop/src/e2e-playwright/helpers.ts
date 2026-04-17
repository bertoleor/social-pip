import { spawn, spawnSync } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const APP_BINARY = path.resolve(
  __dirname,
  "..",
  "..",
  "src-tauri",
  "target",
  "debug",
  "social-pip",
);

export const TAURI_DRIVER_PATH = path.resolve(os.homedir(), ".cargo", "bin", "tauri-driver");

export interface TauriDriverProcess {
  process: ReturnType<typeof spawn>;
  exit: boolean;
}

export function buildTauriApp(): void {
  spawnSync("pnpm", ["tauri", "build", "--debug", "--no-bundle"], {
    cwd: path.resolve(__dirname, "..", ".."),
    stdio: "inherit",
    shell: true,
  });
}

export function startTauriDriver(): TauriDriverProcess {
  const tauriDriver = spawn(TAURI_DRIVER_PATH, [], {
    stdio: [null, process.stdout, process.stderr],
  });

  tauriDriver.on("error", (error) => {
    console.error("tauri-driver error:", error);
    process.exit(1);
  });

  tauriDriver.on("exit", (code) => {
    if (code !== 0) {
      console.error("tauri-driver exited with code:", code);
    }
  });

  return {
    process: tauriDriver,
    exit: false,
  };
}

export function stopTauriDriver(driver: TauriDriverProcess): void {
  driver.exit = true;
  driver.process.kill();
}

export function setupShutdownHandler(cleanup: () => void): void {
  const cleanupHandler = () => {
    try {
      cleanup();
    } finally {
      process.exit();
    }
  };

  process.on("exit", cleanupHandler);
  process.on("SIGINT", cleanupHandler);
  process.on("SIGTERM", cleanupHandler);
  process.on("SIGHUP", cleanupHandler);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitForAppReady(timeout = 30000): number {
  const startTime = Date.now();
  return startTime + timeout;
}

/**
 * Selector constants for E2E tests
 *
 * NOTE: For new Page Object Models, prefer using Playwright's
 * locator methods (getByRole, getByLabel, getByTestId) directly
 * instead of these string selectors. This type is kept for
 * backward compatibility during migration.
 *
 * @example
 * // Prefer this in POMs:
 * this.addButton = page.getByRole('button', { name: 'Add Account' })
 *
 * // Over this:
 * this.addButton = page.locator(SELECTORS.common.button)
 */
export const SELECTORS = {
  pages: {
    dashboard: '[data-testid="page-dashboard"]',
    accounts: '[data-testid="page-accounts"]',
    posts: '[data-testid="page-posts"]',
    schedule: '[data-testid="page-schedule"]',
    analytics: '[data-testid="page-analytics"]',
    settings: '[data-testid="page-settings"]',
  },
  navigation: {
    sidebar: "nav",
    navLink: "nav a",
    menuToggle: 'button[aria-label*="sidebar"]',
  },
  common: {
    heading: "h1",
    button: "button",
    input: "input",
    select: "select",
    modal: '[role="dialog"]',
    loading: '[data-testid="loading"]',
  },
} as const;

/**
 * Type for SELECTORS constant
 * Useful for typing in POMs that need reference to selector structure
 */
export type SelectorsType = typeof SELECTORS;

export async function waitForElement(page: Page, selector: string, timeout = 10000): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

export async function clickAndWait(
  page: Page,
  selector: string,
  waitForSelector?: string,
): Promise<void> {
  await page.click(selector);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 5000 });
  }
}
