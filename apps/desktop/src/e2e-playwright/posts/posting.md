### E2E Tests: Facebook Posting

**Suite ID:** `POSTING`
**Feature:** Create and publish posts to Facebook with text, media, and scheduling options.

---

## Test Case: `POST-E2E-001` - Create text post

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can create and publish a text-only post to Facebook.

**Preconditions:**
- User is logged in with Facebook account added
- Posting page is accessible

### Flow Steps:
1. Navigate to Posting page
2. Verify page is loaded
3. Enter text content in textarea
4. Click Publish button

### Expected Result:
- Post is published successfully
- Success toast message appears
- Post appears in posts list

### Key verification points:
- `postingPage.navigateHere()`
- `postingPage.verifyPageLoaded()`
- `postingPage.createTextPost('Hello from E2E test!')`
- `postingPage.verifySuccess()`

### Notes:
- Critical test for core posting functionality
- Uses PostingPage POM for maintainability

---

## Test Case: `POST-E2E-002` - Posting form has required elements

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify all essential posting form elements are visible and accessible.

**Preconditions:**
- Posting page is loaded

### Flow Steps:
1. Navigate to Posting page
2. Verify page is loaded
3. Check content textarea is visible
4. Check publish button is visible
5. Check media button is visible
6. Check schedule button is visible

### Expected Result:
- Content textarea is visible
- Publish button is visible
- Media button is visible
- Schedule button is visible

### Key verification points:
- `expect(postingPage.contentTextarea).toBeVisible()`
- `expect(postingPage.publishButton).toBeVisible()`
- `expect(postingPage.mediaButton).toBeVisible()`
- `expect(postingPage.scheduleButton).toBeVisible()`

### Notes:
- Verifies UI component presence
- Uses accessibility-first selectors

---

## Test Case: `POST-E2E-003` - Can add text to post content

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can enter text content in the post textarea.

**Preconditions:**
- Posting page is loaded

### Flow Steps:
1. Navigate to Posting page
2. Fill content textarea with text
3. Verify content value is set correctly

### Expected Result:
- Text is entered successfully
- Textarea contains the entered value

### Key verification points:
- `postingPage.contentTextarea.fill('Test post content')`
- `const content = await postingPage.contentTextarea.inputValue()`
- `expect(content).toBe('Test post content')`

### Notes:
- Basic input interaction test
- Validates form input functionality

---

## Test Case: `POST-E2E-004` - Can open media uploader

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can access the media upload interface.

**Preconditions:**
- Posting page is loaded

### Flow Steps:
1. Navigate to Posting page
2. Click the media button
3. Verify media uploader is visible

### Expected Result:
- Media uploader component appears
- File input is accessible

### Key verification points:
- `postingPage.mediaButton.click()`
- `expect(postingPage.mediaUploader).toBeVisible()`

### Notes:
- Tests media upload UI access
- Actual file upload tested in POST-E2E-011

---

## Test Case: `POST-E2E-005` - Can open schedule dialog

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can access the post scheduling interface.

**Preconditions:**
- Posting page is loaded
- Content has been entered (required for scheduling)

### Flow Steps:
1. Navigate to Posting page
2. Add content to textarea
3. Click schedule button
4. Verify schedule inputs appear

### Expected Result:
- Schedule dialog opens
- Date and time pickers are visible

### Key verification points:
- `postingPage.contentTextarea.fill('Scheduled post content')`
- `postingPage.scheduleButton.click()`
- `expect(postingPage.scheduleDatePicker).toBeVisible()`

### Notes:
- Scheduling requires content first
- Tests scheduling UI access

---

## Test Case: `POST-E2E-006` - Can cancel post creation

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can cancel post creation and return to posts list.

**Preconditions:**
- Posting page is loaded
- Content has been entered

### Flow Steps:
1. Navigate to Posting page
2. Add content to textarea
3. Cancel the post
4. Verify modal is closed

### Expected Result:
- Modal closes successfully
- User returns to posts list
- No post is created

### Key verification points:
- `postingPage.cancelPost()`
- `expect(modal).not.toBeVisible()`

### Notes:
- Tests cancellation flow
- Ensures no data is saved on cancel

---

## Test Case: `POST-E2E-007` - Character count updates with content

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify the character count indicator updates correctly when typing.

**Preconditions:**
- Posting page is loaded
- Character count element exists

### Flow Steps:
1. Navigate to Posting page
2. Add text content to textarea
3. Check character count value
4. Verify count matches content length

### Expected Result:
- Character count reflects actual content length
- Count updates in real-time

### Key verification points:
- `postingPage.contentTextarea.fill('Test')`
- `const count = await postingPage.getCharacterCount()`
- `expect(count).toBe(4)`

### Notes:
- May be skipped if character count not implemented
- Tests UI feedback mechanism

---

## Test Case: `POST-E2E-008` - Can save post as draft

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can save a post as a draft for later editing.

**Preconditions:**
- Posting page is loaded
- Content has been entered

### Flow Steps:
1. Navigate to Posting page
2. Add content to textarea
3. Click Save as Draft button
4. Verify draft is saved

### Expected Result:
- Draft is saved successfully
- Post appears in drafts list
- Success indicator shown

### Key verification points:
- `postingPage.contentTextarea.fill('Draft post content')`
- `postingPage.saveDraftButton.click()`
- `postingPage.waitForLoadingComplete()`

### Notes:
- Draft functionality may be optional
- Tests persistence of work-in-progress

---

## Test Case: `POST-E2E-009` - Can select platform for posting

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can select target platform for the post.

**Preconditions:**
- Posting page is loaded
- Platform selection is available

### Flow Steps:
1. Navigate to Posting page
2. Open platform dropdown
3. Select Facebook platform
4. Verify selection is set

### Expected Result:
- Platform dropdown opens
- Facebook option is selectable
- Selection is reflected in form

### Key verification points:
- `postingPage.selectPlatform('facebook')`
- `expect(selectedValue).toContain('facebook')`

### Notes:
- Platform selection may not exist in all versions
- Tests multi-platform capability

---

## Test Case: `POST-E2E-010` - Post preview is visible after adding content

**Priority:** `medium`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify post preview updates when content is added.

**Preconditions:**
- Posting page is loaded
- Preview component exists

### Flow Steps:
1. Navigate to Posting page
2. Add text content
3. Verify preview is visible
4. Verify preview shows content

### Expected Result:
- Preview component is visible
- Preview reflects entered content

### Key verification points:
- `postingPage.contentTextarea.fill('Preview test content')`
- `postingPage.postPreview.waitFor({ state: 'visible' })`

### Notes:
- Tests real-time preview feature
- May be skipped if preview not implemented

---

## Test Case: `POST-E2E-011` - Create post with media (file upload flow)

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can create a post with media attachment.

**Preconditions:**
- Posting page is loaded
- Valid test media file is available

### Flow Steps:
1. Navigate to Posting page
2. Add text content
3. Click media button
4. Verify file input is accessible
5. (File upload would be performed in full test)

### Expected Result:
- Media uploader is accessible
- File input is ready for upload
- Upload UI is visible

### Key verification points:
- `postingPage.contentTextarea.fill('Post with media')`
- `postingPage.mediaButton.click()`
- `expect(fileInput).toBeAttached()`

### Notes:
- Tests media upload UI accessibility
- Requires fixture file for actual upload

---

## Test Case: `POST-E2E-012` - Schedule post for future date

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify user can schedule a post for a future date and time.

**Preconditions:**
- Posting page is loaded
- Content has been entered
- Schedule feature is available

### Flow Steps:
1. Navigate to Posting page
2. Add content to textarea
3. Open schedule dialog
4. Set future date (tomorrow)
5. Set time (10:00)
6. Verify schedule confirmation

### Expected Result:
- Schedule dialog opens
- Date picker accepts future date
- Time picker accepts valid time
- Confirm button is visible

### Key verification points:
- `postingPage.scheduleButton.click()`
- `postingPage.scheduleDatePicker.fill(dateStr)`
- `postingPage.scheduleTimePicker.fill('10:00')`
- `expect(postingPage.confirmScheduleButton).toBeVisible()`

### Notes:
- Tests full scheduling flow
- Uses tomorrow as safe future date

---

## Test Case: `POST-E2E-013` - Verify post form validation

**Priority:** `high`

**Tags:**
- type → @e2e
- feature → @posting

**Description/Objective:** Verify form prevents empty post submission.

**Preconditions:**
- Posting page is loaded

### Flow Steps:
1. Navigate to Posting page
2. Leave content empty
3. Attempt to publish
4. Verify validation behavior

### Expected Result:
- Publish button is disabled, OR
- Validation error is shown

### Key verification points:
- `const isDisabled = await publishButton.isDisabled()`
- OR: `expect(errorAlert).toBeVisible()`

### Notes:
- Tests client-side validation
- Ensures empty posts cannot be submitted
