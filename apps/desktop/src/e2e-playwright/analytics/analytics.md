### E2E Tests: Analytics Dashboard

**Suite ID:** `ANALYTICS`
**Feature:** Analytics view showing engagement metrics, charts, and data export functionality.

---

## Test Case: `@NAV-004` - Navigates to Analytics page

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify navigation to the Analytics page works correctly.

**Preconditions:**
- Application is launched
- Navigation sidebar is visible

### Flow Steps:
1. Create AnalyticsPage POM instance
2. Navigate to Analytics page using goto()
3. Verify page loaded using verifyPageLoaded()

### Expected Result:
- Analytics page loads successfully
- Main heading is visible
- Stats overview is visible

### Key verification points:
- `analyticsPage.goto()`
- `analyticsPage.verifyPageLoaded()`

### Notes:
- Uses AnalyticsPage POM for maintainability
- Stats overview visibility confirms data loaded

---

## Test Case: `ANALYTICS-UI-001` - Date range picker is visible

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify the date range picker is visible and accessible.

**Preconditions:**
- Analytics page is loaded

### Flow Steps:
1. Navigate to Analytics page
2. Verify page is loaded
3. Check date range picker visibility

### Expected Result:
- Date range picker combobox is visible
- Picker has accessible label "Date range"

### Key verification points:
- `expect(analyticsPage.dateRangePicker).toBeVisible()`

### Notes:
- Essential for filtering analytics data
- Uses getByRole for combobox

---

## Test Case: `ANALYTICS-UI-002` - Stats overview is visible

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify the stats overview section is visible on the page.

**Preconditions:**
- Analytics page is loaded

### Flow Steps:
1. Navigate to Analytics page
2. Verify page is loaded
3. Check stats overview container

### Expected Result:
- Stats overview container is visible
- Container uses test ID for selection

### Key verification points:
- `expect(analyticsPage.statsOverview).toBeVisible()`

### Notes:
- Contains key metrics display
- Uses getByTestId for selection

---

## Test Case: `ANALYTICS-UI-003` - Chart containers are present

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify the analytics chart containers (engagement, reach, growth) are present.

**Preconditions:**
- Analytics page is loaded

### Flow Steps:
1. Navigate to Analytics page
2. Check engagement chart container
3. Check reach chart container
4. Check growth chart container

### Expected Result:
- Engagement chart is present
- Reach chart is present
- Growth chart is present

### Key verification points:
- `expect(analyticsPage.engagementChart).toBeDefined()`
- `expect(analyticsPage.reachChart).toBeDefined()`
- `expect(analyticsPage.growthChart).toBeDefined()`

### Notes:
- Charts may use SVG or canvas rendering
- Uses getByTestId for selection

---

## Test Case: `ANALYTICS-ACTION-001` - Export button is visible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify the Export button is visible for data export functionality.

**Preconditions:**
- Analytics page is loaded

### Flow Steps:
1. Navigate to Analytics page
2. Locate Export button
3. Verify button is visible

### Expected Result:
- Export button is visible
- Button has accessible name "Export"

### Key verification points:
- `expect(analyticsPage.exportButton).toBeVisible()`

### Notes:
- Allows exporting data in various formats
- Uses getByRole for button

---

## Test Case: `ANALYTICS-ACTION-002` - Refresh button is visible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify the Refresh button is visible for manual data refresh.

**Preconditions:**
- Analytics page is loaded

### Flow Steps:
1. Navigate to Analytics page
2. Locate Refresh button
3. Verify button is visible

### Expected Result:
- Refresh button is visible
- Button has accessible name "Refresh"

### Key verification points:
- `expect(analyticsPage.refreshButton).toBeVisible()`

### Notes:
- Allows manual data refresh
- Uses getByRole for button

---

## Test Case: `ANALYTICS-FILTER-001` - Date range selection works

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify selecting a date range preset updates the analytics data.

**Preconditions:**
- Analytics page is loaded
- Date range picker is visible

### Flow Steps:
1. Navigate to Analytics page
2. Click date range picker
3. Select a preset (e.g., "last7days")
4. Wait for data to load

### Expected Result:
- Date range dropdown opens
- Selected range is applied
- Data refreshes accordingly

### Key verification points:
- `analyticsPage.selectDateRange("last7days")`
- Wait for loading complete

### Notes:
- Available presets: today, last7days, last30days, last90days, custom
- Data refreshes after selection

---

## Test Case: `ANALYTICS-CHART-001` - Chart interaction works

**Priority:** `low`

**Tags:**
- type → @e2e
- feature → @analytics

**Description/Objective:** Verify hovering over chart points shows tooltips.

**Preconditions:**
- Analytics page is loaded
- Charts are visible with data

### Flow Steps:
1. Navigate to Analytics page
2. Verify charts are visible
3. Hover over a chart data point
4. Verify tooltip appears

### Expected Result:
- Chart point is hoverable
- Tooltip with data details appears

### Key verification points:
- `analyticsPage.hoverChartPoint(chart, index)`
- `analyticsPage.getChartTooltip()`

### Notes:
- Requires data points to be rendered
- Uses role="tooltip" for accessibility
