# Test Documentation

## Running Tests

### All Tests

```bash
cd apps/desktop
pnpm test
```

### Specific Test File

```bash
cd apps/desktop
pnpm vitest run path/to/test.test.ts
```

### Watch Mode

```bash
cd apps/desktop
pnpm vitest watch
```

### Coverage Report

```bash
cd apps/desktop
pnpm vitest run --coverage
```

### Specific Test Categories

```bash
# Visual regression tests
pnpm vitest run src/test/visual/

# Performance tests
pnpm vitest run src/test/performance/

# Integration tests
pnpm vitest run src/test/integration/

# Accessibility tests
pnpm vitest run src/test/accessibility.test.tsx
```

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does something when condition", async () => {
    const user = userEvent.setup()
    render(<Component />)

    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Result")).toBeInTheDocument()
  })
})
```

### Test Organization

- **Unit tests**: Place next to source file (`Component.test.tsx`)
- **Integration tests**: Place in `src/test/integration/`
- **Visual tests**: Place in `src/test/visual/`
- **Performance tests**: Place in `src/test/performance/`

## Mock Patterns

### Tauri APIs

```typescript
import { vi } from "vitest"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue({ data: "mock" }),
}))
```

### Zustand Stores

```typescript
import { vi } from "vitest"
import { useStore } from "./store"

vi.mock("./store", () => ({
  useStore: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(useStore).mockReturnValue({
    state: "value",
    action: vi.fn(),
  })
})
```

### Using Fixtures

```typescript
import { createPostFixture, createPostFixtures } from "@/test/fixtures/posts"

const singlePost = createPostFixture({ status: "draft" })
const multiplePosts = createPostFixtures(10)
```

### Custom Render with Providers

```typescript
import { render } from "@/test/utils/render"

const { container } = render(<Component />, {
  providers: [ToastProvider, ThemeProvider],
})
```

## Testing Patterns

### Async Operations

```typescript
import { waitFor } from "@testing-library/react"

it("handles async operation", async () => {
  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument()
  })
})
```

### User Interactions

```typescript
import userEvent from "@testing-library/user-event"

it("handles click", async () => {
  const user = userEvent.setup()
  render(<Component />)

  await user.click(screen.getByRole("button"))
})
```

### Accessibility Testing

```typescript
import { axe } from "jest-axe"

it("has no accessibility violations", async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Visual Snapshots

```typescript
it("matches snapshot", () => {
  const { container } = render(<Component />)
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div class="expected-class">
      Content
    </div>
  `)
})
```

### Performance Testing

```typescript
it("handles large data efficiently", () => {
  const start = performance.now()

  const result = processLargeData(arrayOf100Items)

  const duration = performance.now() - start
  expect(duration).toBeLessThan(100)
})
```

## Test Utilities

### Available Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `createPostFixture` | `@/test/fixtures/posts` | Create mock post |
| `createAccountFixture` | `@/test/fixtures/accounts` | Create mock account |
| `createScheduleFixture` | `@/test/fixtures/schedules` | Create mock schedule |
| `waitForStoreState` | `@/test/utils/waiters` | Wait for Zustand state |
| `toHaveBeenInvokedWith` | `@/test/utils/assertions` | Custom Tauri matcher |

### Custom Matchers

```typescript
expect(invoke).toHaveBeenInvokedWith("command_name", { arg: "value" })
expect("clh1234xyz").toBeValidUuid()
```

## Troubleshooting

### Tests Fail with "Cannot find module"

- Check the import path uses aliases correctly (`@/`, `@components/`)
- Verify the file exists and has correct extension
- Run `pnpm install` to ensure dependencies are installed

### Tests Fail with "element not found"

- Use `findBy*` queries for async elements
- Add `await` and `waitFor` for dynamic content
- Check that elements are rendered before assertions

### Mock Not Working

- Ensure `vi.clearAllMocks()` is called in `beforeEach`
- Check that mock is defined before the test runs
- Use `vi.mocked(fn).mockImplementation()` for custom behavior

### Coverage Below Threshold

- Run `pnpm vitest run --coverage` to see detailed report
- Focus on uncovered branches and functions
- Add edge case tests for missing coverage

### Snapshot Tests Failing

- Run `pnpm vitest run --update` to update snapshots
- Review snapshot changes before committing
- Use inline snapshots for better readability

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Use descriptive names**: `it("returns error when input is empty", ...)`
3. **Test behavior, not implementation**: Focus on user-visible outcomes
4. **Avoid test.skip**: Fix or delete failing tests
5. **Keep tests fast**: Use mocks for external dependencies
6. **Clean up**: Reset state in `afterEach` when needed
