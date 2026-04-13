# E2E Playwright Tests for Tauri Desktop App

This directory contains end-to-end tests for the Social-Pip Tauri desktop application using Playwright with tauri-driver.

## Prerequisites

### 1. Install tauri-driver

tauri-driver is a Rust crate that provides WebDriver support for Tauri applications:

```bash
cargo install tauri-driver --locked
```

### 2. Build the Tauri App

Before running E2E tests, build the app in debug mode:

```bash
cd apps/desktop
pnpm tauri build --debug --no-bundle
```

Or simply run `pnpm tauri:dev` once to ensure the binary exists.

## Running Tests

### Run all E2E tests

```bash
pnpm test:e2e
```

### Run tests with UI mode

```bash
pnpm test:e2e:ui
```

### Run tests in debug mode

```bash
pnpm test:e2e:debug
```

### Run specific test file

```bash
pnpm playwright test app-launch.spec.ts
pnpm playwright test navigation.spec.ts
pnpm playwright test account-creation.spec.ts
```

## Test Files

| File | Description |
|------|-------------|
| `app-launch.spec.ts` | Tests app launch, window title, navigation visibility |
| `navigation.spec.ts` | Tests navigation between pages |
| `account-creation.spec.ts` | Tests account creation flow |
| `helpers.ts` | Shared utilities and selectors |

## How It Works

1. **tauri-driver**: A WebDriver server that bridges Playwright with the Tauri app
2. **Playwright**: Connects to tauri-driver at `http://127.0.0.1:4444`
3. **Tauri App**: The actual desktop binary being tested

### Test Lifecycle

Each test file:
1. Builds the Tauri app (if not already built)
2. Starts tauri-driver process
3. Connects Playwright to tauri-driver
4. Runs tests against the real desktop app
5. Cleans up tauri-driver process

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Playwright    │────▶│  tauri-driver   │────▶│   Tauri App     │
│   Test Runner   │     │  (WebDriver)    │     │   (Binary)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │    localhost:4444     │    WRY WebView       │
        └───────────────────────┴───────────────────────┘
```

## Selectors

Use data-testid attributes for reliable element selection:

```typescript
await page.locator('[data-testid="page-dashboard"]')
await page.locator('[data-testid="page-accounts"]')
```

## Debugging

### View Playwright Report

After tests run, view the HTML report:

```bash
pnpm playwright show-report
```

### Trace Viewer

For failed tests, traces are automatically captured:

```bash
pnpm playwright show-trace test-results/<test-name>/trace.zip
```

### Manual Debugging

Use debug mode to step through tests:

```bash
pnpm test:e2e:debug
```

## Troubleshooting

### tauri-driver not found

```
Error: spawn tauri-driver ENOENT
```

**Solution**: Install tauri-driver via cargo:
```bash
cargo install tauri-driver --locked
```

### App binary not found

```
Error: App binary not found
```

**Solution**: Build the app first:
```bash
pnpm tauri build --debug --no-bundle
```

### Port 4444 already in use

```
Error: listen EADDRINUSE: address already in use :::4444
```

**Solution**: Kill the existing tauri-driver process:
```bash
# Windows
taskkill /F /IM tauri-driver.exe

# Linux/macOS
pkill -f tauri-driver
```

## CI Integration

For CI pipelines, ensure:

1. Rust toolchain is installed
2. `cargo install tauri-driver --locked` runs before tests
3. App is built in debug mode before testing
4. Display server is available (X11/Wayland on Linux)

Example GitHub Actions workflow:

```yaml
- name: Install tauri-driver
  run: cargo install tauri-driver --locked

- name: Build Tauri App
  run: pnpm tauri build --debug --no-bundle

- name: Run E2E Tests
  run: pnpm test:e2e
```

## Best Practices

1. **Use data-testid**: Prefer `data-testid` attributes over CSS classes
2. **Wait for visibility**: Use `toBeVisible()` with timeout for async content
3. **Isolate tests**: Each test should be independent
4. **Clean up**: Ensure modals/forms are closed after tests
5. **Avoid hard-coded delays**: Use Playwright's auto-waiting instead of `waitForTimeout`

## Related Documentation

- [Tauri WebDriver Testing](https://v2.tauri.app/develop/tests/webdriver/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [tauri-driver on crates.io](https://crates.io/crates/tauri-driver)
