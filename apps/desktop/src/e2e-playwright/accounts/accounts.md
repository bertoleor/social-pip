### E2E Tests: Accounts Management

**Suite ID:** `ACCOUNTS`
**Feature:** Account creation, viewing, and management for social media platforms.

---

## Test Case: `@ACCOUNT-001` - Displays account management page

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @accounts

**Description/Objective:** Verify the Accounts page loads correctly with expected UI elements.

**Preconditions:**
- Application is launched
- User is on Dashboard or can navigate to Accounts

### Flow Steps:
1. Navigate to Accounts page
2. Verify page is loaded via POM
3. Verify heading contains "Accounts"
4. Verify "Add Account" button is visible

### Expected Result:
- Accounts page heading is visible
- "Add Account" button is present and visible

### Key verification points:
- `expect(accountsPage.heading).toContainText("Accounts")`
- `expect(accountsPage.addAccountButton).toBeVisible()`

### Notes:
- Critical test - verifies basic page load and key UI elements

---

## Test Case: `@ACCOUNT-002` - Opens create account modal

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @accounts

**Description/Objective:** Verify clicking "Add Account" opens the account creation modal.

**Preconditions:**
- Accounts page is loaded
- "Add Account" button is visible

### Flow Steps:
1. Navigate to Accounts page
2. Click the "Add Account" button
3. Verify modal is visible

### Expected Result:
- Account creation modal/dialog appears
- Modal is visible within default timeout

### Key verification points:
- `accountsPage.clickAddAccount()`
- `accountsPage.verifyModalVisible()`

### Notes:
- Modal must open for account creation flow to proceed

---

## Test Case: `@ACCOUNT-003` - Create account form has required fields

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @accounts

**Description/Objective:** Verify the account creation form contains all required input fields.

**Preconditions:**
- Accounts page is loaded
- Account creation modal is open

### Flow Steps:
1. Navigate to Accounts page
2. Click "Add Account" to open modal
3. Verify modal is visible
4. Check for Name input field
5. Check for Username input field
6. Check for Platform select dropdown

### Expected Result:
- Name input field is visible
- Username input field is visible
- Platform selection dropdown is visible

### Key verification points:
- `expect(accountsPage.nameInput).toBeVisible()`
- `expect(accountsPage.usernameInput).toBeVisible()`
- `expect(accountsPage.platformSelect).toBeVisible()`

### Notes:
- Uses POM locators for maintainability
- Verifies accessibility via getByLabel pattern

---

## Test Case: `@ACCOUNT-004` - Can fill account creation form

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @accounts

**Description/Objective:** Verify user can input data into the account creation form fields.

**Preconditions:**
- Accounts page is loaded
- Account creation modal is open

### Flow Steps:
1. Navigate to Accounts page
2. Click "Add Account" to open modal
3. Verify modal is visible
4. Fill form using POM method with test data
5. Verify values were set correctly

### Expected Result:
- Name input contains "Test Account"
- Username input contains "testuser123"

### Key verification points:
- `accountsPage.fillAccountForm("Test Account", "testuser123")`
- `expect(nameValue).toBe("Test Account")`
- `expect(usernameValue).toBe("testuser123")`

### Notes:
- Tests form interactivity
- Uses POM fillAccountForm method

---

## Test Case: `@ACCOUNT-005` - Modal can be closed

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @accounts

**Description/Objective:** Verify the account creation modal can be closed via cancel button or Escape key.

**Preconditions:**
- Accounts page is loaded
- Account creation modal is open

### Flow Steps:
1. Navigate to Accounts page
2. Click "Add Account" to open modal
3. Verify modal is visible
4. Try to close with cancel button (or Escape fallback)
5. Verify modal is closed

### Expected Result:
- Modal closes after cancel action
- Modal is no longer visible

### Key verification points:
- `cancelButton.click()` OR `keyboard.press("Escape")`
- `accountsPage.verifyModalClosed()`

### Notes:
- Graceful fallback to Escape key if cancel button not present
- Important for user workflow cancellation

---

## Test Case: `@ACCOUNT-006` - Displays account list container

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @accounts

**Description/Objective:** Verify the accounts list container exists on the page (may be empty initially).

**Preconditions:**
- Accounts page is loaded

### Flow Steps:
1. Navigate to Accounts page
2. Check if accounts list container exists
3. If container exists, verify visibility
4. If container doesn't exist, verify page heading as fallback

### Expected Result:
- Accounts list container is visible (if accounts exist)
- OR page heading confirms we're on accounts page (if empty)

### Key verification points:
- `expect(accountListContainer).toBeVisible()` (if count > 0)
- `expect(accountsPage.heading).toContainText("Accounts")` (fallback)

### Notes:
- Gracefully handles empty state
- Container may not exist before any accounts are created
