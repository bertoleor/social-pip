### E2E Tests: Schedule/Calendar

**Suite ID:** `SCHEDULE`
**Feature:** Calendar view for scheduling and managing posts across dates.

---

## Test Case: `@NAV-003` - Navigates to Schedule page

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify navigation to the Schedule/Calendar page works correctly.

**Preconditions:**
- Application is launched
- Navigation sidebar is visible

### Flow Steps:
1. Create SchedulePage POM instance
2. Navigate to Schedule page using goto()
3. Verify page loaded using verifyPageLoaded()

### Expected Result:
- Schedule page loads successfully
- Main heading is visible
- Calendar container is visible

### Key verification points:
- `schedulePage.goto()`
- `schedulePage.verifyPageLoaded()`

### Notes:
- Uses SchedulePage POM for maintainability
- Calendar visibility is required for scheduling functionality

---

## Test Case: `SCHEDULE-UI-001` - Calendar container is visible

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify the calendar component is visible on the Schedule page.

**Preconditions:**
- Schedule page is loaded

### Flow Steps:
1. Navigate to Schedule page
2. Verify page is loaded
3. Check calendar container visibility

### Expected Result:
- Calendar container is visible
- Calendar uses test ID for selection

### Key verification points:
- `expect(schedulePage.calendar).toBeVisible()`

### Notes:
- Calendar is the core component for schedule viewing
- Uses getByTestId for reliable selection

---

## Test Case: `SCHEDULE-UI-002` - Navigation buttons are present

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify calendar navigation buttons (Today, Previous, Next) are present.

**Preconditions:**
- Schedule page is loaded
- Calendar is visible

### Flow Steps:
1. Navigate to Schedule page
2. Verify calendar is visible
3. Check Today button is visible
4. Check Previous button is visible
5. Check Next button is visible

### Expected Result:
- Today button is visible for quick navigation
- Previous button is visible for past months
- Next button is visible for future months

### Key verification points:
- `expect(schedulePage.todayButton).toBeVisible()`
- `expect(schedulePage.prevMonthButton).toBeVisible()`
- `expect(schedulePage.nextMonthButton).toBeVisible()`

### Notes:
- Essential for calendar navigation
- Uses getByRole for button accessibility

---

## Test Case: `SCHEDULE-UI-003` - Current month display is visible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify the current month/year heading is visible in the calendar.

**Preconditions:**
- Schedule page is loaded
- Calendar is visible

### Flow Steps:
1. Navigate to Schedule page
2. Verify calendar is visible
3. Check month/year display heading

### Expected Result:
- Current month and year are displayed
- Display uses heading role for accessibility

### Key verification points:
- `expect(schedulePage.currentMonthDisplay).toBeVisible()`

### Notes:
- Shows current calendar context
- Uses getByRole for heading

---

## Test Case: `SCHEDULE-NAV-001` - Today button navigates to current date

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify clicking "Today" button navigates calendar to current date.

**Preconditions:**
- Schedule page is loaded
- Calendar is visible
- User may be viewing a different month

### Flow Steps:
1. Navigate to Schedule page
2. Click Today button
3. Verify calendar shows current month

### Expected Result:
- Calendar displays current month
- Current date is highlighted/focused

### Key verification points:
- `schedulePage.goToToday()`
- Verify currentMonthDisplay contains current month

### Notes:
- Quick navigation for returning to today
- Important for user efficiency

---

## Test Case: `SCHEDULE-NAV-002` - Previous month navigation works

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify clicking Previous button shows the previous month.

**Preconditions:**
- Schedule page is loaded
- Calendar is visible

### Flow Steps:
1. Navigate to Schedule page
2. Capture current month text
3. Click Previous button
4. Verify month changed

### Expected Result:
- Calendar displays previous month
- Month display updates accordingly

### Key verification points:
- `schedulePage.goToPreviousMonth()`
- Compare month display before/after

### Notes:
- May include small animation delay
- Essential for viewing past scheduled posts

---

## Test Case: `SCHEDULE-NAV-003` - Next month navigation works

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify clicking Next button shows the next month.

**Preconditions:**
- Schedule page is loaded
- Calendar is visible

### Flow Steps:
1. Navigate to Schedule page
2. Capture current month text
3. Click Next button
4. Verify month changed

### Expected Result:
- Calendar displays next month
- Month display updates accordingly

### Key verification points:
- `schedulePage.goToNextMonth()`
- Compare month display before/after

### Notes:
- Essential for scheduling future posts
- Works with animation timing

---

## Test Case: `SCHEDULE-VIEW-001` - View toggle is accessible

**Priority:** `low`

**Tags:**
- type → @e2e
- feature → @schedule

**Description/Objective:** Verify the calendar view toggle (month/week/day) is accessible.

**Preconditions:**
- Schedule page is loaded

### Flow Steps:
1. Navigate to Schedule page
2. Locate view toggle tablist
3. Verify toggle is present

### Expected Result:
- View toggle tablist is present
- Allows switching between month/week/day views

### Key verification points:
- `expect(schedulePage.viewToggle).toBeDefined()`

### Notes:
- Optional feature for different calendar views
- Uses tablist role for accessibility
