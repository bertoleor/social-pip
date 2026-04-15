### E2E Tests: Settings

**Suite ID:** `SETTINGS`
**Feature:** Application settings configuration including toggles, inputs, and save/reset functionality.

---

## Test Case: `@NAV-005` - Navigates to Settings page

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify navigation to the Settings page works correctly.

**Preconditions:**
- Application is launched
- Navigation sidebar is visible

### Flow Steps:
1. Create SettingsPage POM instance
2. Navigate to Settings page using goto()
3. Verify page loaded using verifyPageLoaded()

### Expected Result:
- Settings page loads successfully
- Main heading is visible
- Settings sections are accessible

### Key verification points:
- `settingsPage.goto()`
- `settingsPage.verifyPageLoaded()`

### Notes:
- Uses SettingsPage POM for maintainability
- Heading visibility confirms page load

---

## Test Case: `SETTINGS-UI-001` - Save button is visible

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify the Save button is visible for saving settings changes.

**Preconditions:**
- Settings page is loaded

### Flow Steps:
1. Navigate to Settings page
2. Verify page is loaded
3. Check Save button visibility

### Expected Result:
- Save button is visible
- Button has accessible name "Save"

### Key verification points:
- `expect(settingsPage.saveButton).toBeVisible()`

### Notes:
- Required for persisting settings changes
- Uses getByRole for button

---

## Test Case: `SETTINGS-UI-002` - Reset button is visible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify the Reset to defaults button is visible.

**Preconditions:**
- Settings page is loaded

### Flow Steps:
1. Navigate to Settings page
2. Verify page is loaded
3. Check Reset button visibility

### Expected Result:
- Reset button is visible
- Button has accessible name "Reset"

### Key verification points:
- `expect(settingsPage.resetButton).toBeVisible()`

### Notes:
- Allows restoring default settings
- May show confirmation dialog

---

## Test Case: `SETTINGS-UI-003` - Settings sections are present

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify the main settings sections (General, Notifications, Privacy, Account) are present.

**Preconditions:**
- Settings page is loaded

### Flow Steps:
1. Navigate to Settings page
2. Check General section exists
3. Check Notifications section exists
4. Check Privacy section exists
5. Check Account section exists

### Expected Result:
- All four settings sections are accessible
- Each section uses region role

### Key verification points:
- `expect(settingsPage.generalSection).toBeDefined()`
- `expect(settingsPage.notificationsSection).toBeDefined()`
- `expect(settingsPage.privacySection).toBeDefined()`
- `expect(settingsPage.accountSection).toBeDefined()`

### Notes:
- Sections use role="region" for accessibility
- May be tabs or separate sections

---

## Test Case: `SETTINGS-TOGGLE-001` - Toggle switches are accessible

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify toggle switches are accessible via switch role.

**Preconditions:**
- Settings page is loaded
- Settings contain toggle controls

### Flow Steps:
1. Navigate to Settings page
2. Use getToggle() method to locate a toggle
3. Verify toggle is accessible

### Expected Result:
- Toggle elements use switch role
- Toggles are accessible by label

### Key verification points:
- `settingsPage.getToggle("setting-name")`
- Uses getByRole for accessibility

### Notes:
- Toggle pattern for boolean settings
- Uses switch role for modern accessibility

---

## Test Case: `SETTINGS-TOGGLE-002` - Toggle state can be changed

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify toggle switches can be toggled on/off.

**Preconditions:**
- Settings page is loaded
- Toggle setting is present

### Flow Steps:
1. Navigate to Settings page
2. Get current toggle state
3. Toggle to opposite state
4. Verify new state

### Expected Result:
- Toggle state changes on click
- isChecked() reflects new state

### Key verification points:
- `settingsPage.toggleSetting("setting-name", value)`
- `toggle.isChecked()` returns new state

### Notes:
- Only clicks if state needs to change
- Optimized to avoid unnecessary clicks

---

## Test Case: `SETTINGS-INPUT-001` - Text inputs are accessible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify text input settings are accessible by label.

**Preconditions:**
- Settings page is loaded
- Text input setting is present

### Flow Steps:
1. Navigate to Settings page
2. Use getTextInput() method
3. Verify input is accessible

### Expected Result:
- Text inputs are accessible by label
- Inputs can be filled

### Key verification points:
- `settingsPage.getTextInput("setting-name")`
- Uses getByLabel for accessibility

### Notes:
- Text inputs for string settings
- Label association required for accessibility

---

## Test Case: `SETTINGS-INPUT-002` - Select dropdowns are accessible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify select/dropdown settings are accessible.

**Preconditions:**
- Settings page is loaded
- Select setting is present

### Flow Steps:
1. Navigate to Settings page
2. Use getSelect() method
3. Verify select is accessible
4. Verify options can be selected

### Expected Result:
- Select uses combobox role
- Options are accessible

### Key verification points:
- `settingsPage.getSelect("setting-name")`
- `settingsPage.selectOption("setting-name", "option")`

### Notes:
- Select pattern for choice-based settings
- Uses combobox role for accessibility

---

## Test Case: `SETTINGS-ACTION-001` - Save changes works

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify saving settings changes persists the changes.

**Preconditions:**
- Settings page is loaded
- Settings have been modified

### Flow Steps:
1. Navigate to Settings page
2. Modify a setting (toggle or input)
3. Click Save button
4. Verify success notification

### Expected Result:
- Save button triggers save action
- Success notification appears
- Settings persist

### Key verification points:
- `settingsPage.saveChanges()`
- `waitForNotification("Settings saved", "success")`

### Notes:
- May show toast notification
- Settings persist across sessions

---

## Test Case: `SETTINGS-ACTION-002` - Reset to defaults works

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @settings

**Description/Objective:** Verify resetting settings to defaults works.

**Preconditions:**
- Settings page is loaded
- Settings may have been modified

### Flow Steps:
1. Navigate to Settings page
2. Click Reset button
3. Handle confirmation dialog if present
4. Verify settings return to defaults

### Expected Result:
- Reset button triggers reset
- Confirmation dialog may appear
- Settings return to default values

### Key verification points:
- `settingsPage.resetToDefaults()`
- Handle confirm button if visible

### Notes:
- Destructive action - may require confirmation
- All settings reset to defaults
