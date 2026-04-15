### E2E Tests: Dashboard

**Suite ID:** `DASHBOARD`
**Feature:** Main dashboard page displaying app overview, stats, and quick actions after launch.

---

## Test Case: `@APP-LAUNCH-001` - App launches and shows dashboard

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @dashboard

**Description/Objective:** Verify the Tauri desktop application launches successfully and displays the Dashboard page as the initial view.

**Preconditions:**
- Tauri application is built and ready to run
- tauri-driver is spawned (worker-scoped fixture)
- Application navigates to home page (test-scoped fixture)

### Flow Steps:
1. Application launches via tauri-driver
2. Wait for page to load and stabilize
3. Verify Dashboard heading is visible

### Expected Result:
- Dashboard page loads without errors
- Dashboard heading is visible within 10 seconds

### Key verification points:
- `expect(tauriPage.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 })`

### Notes:
- Critical test - application must launch to proceed with any other tests
- Uses custom fixture that pre-navigates to app

---

## Test Case: `@APP-LAUNCH-002` - App displays main navigation

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @dashboard

**Description/Objective:** Verify the main navigation sidebar is visible after app launch.

**Preconditions:**
- Application is launched
- Dashboard page is loaded

### Flow Steps:
1. Application launches
2. Wait for navigation element to be visible
3. Verify nav element exists and is visible

### Expected Result:
- Navigation sidebar is visible within 10 seconds
- Nav container element is present in DOM

### Key verification points:
- `expect(tauriPage.locator("nav")).toBeVisible({ timeout: 10000 })`

### Notes:
- Navigation visibility is required for sidebar-based page navigation

---

## Test Case: `@APP-LAUNCH-003` - App window has correct title

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @dashboard

**Description/Objective:** Verify the application window has the correct title matching the app name.

**Preconditions:**
- Application is launched
- Window is loaded

### Flow Steps:
1. Application launches
2. Check the window title
3. Verify title contains "Social-Pip"

### Expected Result:
- Window title contains "Social-Pip" (case insensitive)

### Key verification points:
- `expect(tauriPage).toHaveTitle(/Social-Pip/i)`

### Notes:
- Simple verification but important for user experience and window identification

---

## Test Case: `@APP-LAUNCH-004` - Sidebar navigation items are present

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @dashboard

**Description/Objective:** Verify all expected navigation items are present in the sidebar.

**Preconditions:**
- Application is launched
- Navigation sidebar is visible

### Flow Steps:
1. Wait for navigation to be visible
2. Check each expected nav item: Dashboard, Accounts, Posts, Schedule, Analytics, Settings
3. Verify each item is visible

### Expected Result:
- All six navigation items are visible: Dashboard, Accounts, Posts, Schedule, Analytics, Settings
- Each nav link is accessible via the sidebar

### Key verification points:
- `expect(nav).toBeVisible({ timeout: 10000 })`
- For each item: `expect(nav a:has-text("${item}")).toBeVisible()`

### Notes:
- Critical for ensuring all main sections are accessible from the dashboard

---

## Test Case: `@APP-LAUNCH-005` - App loads without console errors

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @dashboard

**Description/Objective:** Verify the application loads without critical console errors that could indicate broken functionality.

**Preconditions:**
- Application is launched
- Console listener is set up

### Flow Steps:
1. Set up console message listener
2. Re-navigate to capture fresh load
3. Wait for body to be visible
4. Filter out non-critical errors (warnings, React DevTools, extensions)
5. Verify no critical errors exist

### Expected Result:
- No critical console errors during app load
- Filtered errors array has length 0

### Key verification points:
- `expect(criticalErrors).toHaveLength(0)`
- Filters out: "Warning:", "React DevTools", "chrome-extension"

### Notes:
- Important for catching runtime errors early
- May need adjustment for expected framework warnings
