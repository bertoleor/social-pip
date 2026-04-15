### E2E Tests: Posts Management

**Suite ID:** `POSTS`
**Feature:** Post creation, editing, viewing, and management for social media content.

---

## Test Case: `@NAV-002` - Navigates to Posts page

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify navigation to the Posts page works correctly from any other page.

**Preconditions:**
- Application is launched
- Navigation sidebar is visible

### Flow Steps:
1. Create PostsPage POM instance
2. Navigate to Posts page using goto()
3. Verify page loaded using verifyPageLoaded()

### Expected Result:
- Posts page loads successfully
- Main heading is visible
- Page container is visible

### Key verification points:
- `postsPage.goto()`
- `postsPage.verifyPageLoaded()`

### Notes:
- Uses PostsPage POM for maintainability
- Inherits verification from BasePage

---

## Test Case: `POSTS-UI-001` - New Post button is visible

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify the "New Post" button is visible on the Posts page.

**Preconditions:**
- Posts page is loaded
- Page heading is visible

### Flow Steps:
1. Navigate to Posts page
2. Verify page is loaded
3. Check that New Post button is visible

### Expected Result:
- "New Post" button is visible and accessible

### Key verification points:
- `expect(postsPage.newPostButton).toBeVisible()`

### Notes:
- Button is required to initiate post creation flow
- Uses getByRole for accessibility

---

## Test Case: `POSTS-UI-002` - Posts list container exists

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify the posts list container is present on the page.

**Preconditions:**
- Posts page is loaded

### Flow Steps:
1. Navigate to Posts page
2. Check posts list container existence
3. Verify container visibility if present

### Expected Result:
- Posts list container is visible
- Container uses test ID for reliable selection

### Key verification points:
- `expect(postsPage.postsList).toBeVisible()`

### Notes:
- May be empty if no posts exist
- Uses getByTestId for container selection

---

## Test Case: `POSTS-FILTER-001` - Status filter is accessible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify the post status filter dropdown is accessible on the Posts page.

**Preconditions:**
- Posts page is loaded

### Flow Steps:
1. Navigate to Posts page
2. Locate status filter combobox
3. Verify filter is visible

### Expected Result:
- Status filter dropdown is visible
- Filter uses combobox role for accessibility

### Key verification points:
- `expect(postsPage.statusFilter).toBeVisible()`

### Notes:
- Allows filtering by draft, scheduled, published statuses
- Uses getByRole for combobox

---

## Test Case: `POSTS-SEARCH-001` - Search input is accessible

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify the search input field is present and accessible.

**Preconditions:**
- Posts page is loaded

### Flow Steps:
1. Navigate to Posts page
2. Locate search input by label
3. Verify search input is visible

### Expected Result:
- Search input is visible
- Input has accessible label "Search posts"

### Key verification points:
- `expect(postsPage.searchInput).toBeVisible()`

### Notes:
- Uses getByLabel for accessibility
- Search helps users find specific posts

---

## Test Case: `POSTS-MODAL-001` - Post creation modal opens

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify the post creation modal opens when clicking "New Post".

**Preconditions:**
- Posts page is loaded
- New Post button is visible

### Flow Steps:
1. Navigate to Posts page
2. Click New Post button
3. Verify modal is visible

### Expected Result:
- Post creation modal appears
- Modal has dialog role

### Key verification points:
- `postsPage.clickNewPost()`
- `postsPage.verifyModalVisible()`

### Notes:
- Modal must open to create posts
- Uses getByRole for dialog

---

## Test Case: `POSTS-MODAL-002` - Post form has required fields

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posts

**Description/Objective:** Verify the post creation form contains content and caption inputs.

**Preconditions:**
- Posts page is loaded
- Post creation modal is open

### Flow Steps:
1. Navigate to Posts page
2. Open post creation modal
3. Verify Content textarea is visible
4. Verify Caption input is visible

### Expected Result:
- Content input is visible and accessible
- Caption input is visible and accessible

### Key verification points:
- `expect(postsPage.contentInput).toBeVisible()`
- `expect(postsPage.captionInput).toBeVisible()`

### Notes:
- Content is required for posts
- Caption is optional but available
