import { defineConfig } from "@playwright/test"

export default defineConfig({
testDir: "./src/e2e-playwright",
timeout: 60000,
expect: {
timeout: 10000,
},
retries: 0,
workers: 1,
reporter: [["list"], ["html", { open: "never" }]],
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
