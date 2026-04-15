import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./src/e2e-playwright",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  // Enable retries on CI for flaky E2E tests
  retries: process.env["CI"] === "true" ? 2 : 0,
  workers: 1,
  // Multiple reporters: list for console, HTML for local review, JUnit for CI
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "tauri",
      use: {},
    },
  ],
})
