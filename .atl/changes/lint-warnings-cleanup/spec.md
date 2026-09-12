# Specification: lint-warnings-cleanup

**Status**: success  
**Created**: 2026-04-17  
**Change ID**: lint-warnings-cleanup  

---

## Executive Summary

Fix 20 unique lint warnings across 11 files in 8 categories by applying proper accessibility patterns and code quality improvements. All fixes follow WAI-ARIA best practices and React conventions—no silencing or workarounds.

---

## Requirements

### REQ-001: Remove redundant role="columnheader"

**Category**: a11y/useSemanticElements  
**Priority**: HIGH  
**Severity**: Warning

**Description**: The `<th>` element already has implicit role="columnheader" when inside a table with scope="col". Adding role="columnheader" is redundant.

**Files Affected**:
- `apps/desktop/src/components/Schedule/Calendar.tsx` (line 260)

**Current Code**:
```tsx
<th
  key={day}
  scope="col"
  role="columnheader"  // ← REDUNDANT
  className="p-2 text-center font-medium text-gray-600 border-b"
>
```

**Fix Required**:
Remove the explicit `role="columnheader"` attribute. The semantic `<th scope="col">` already provides this role.

**Acceptance Criteria**:
- [ ] Line 260 no longer has `role="columnheader"`
- [ ] `scope="col"` is preserved
- [ ] Lint warning resolved
- [ ] Calendar header row still renders correctly
- [ ] Screen reader announces column headers properly

**Test Scenarios**:
1. Visual: Calendar renders with day headers (Sun-Sat)
2. Accessibility: Screen reader announces "Sunday columnheader" etc.
3. Lint: `pnpm lint` shows no useSemanticElements warning for this file

---

### REQ-002: Remove redundant role="status" from Badge

**Category**: a11y/useSemanticElements  
**Priority**: HIGH  
**Severity**: Warning

**Description**: When an element has `aria-label` or `aria-labelledby`, it becomes a live region. The `role="status"` is redundant for elements with aria-label that are already semantically appropriate.

**Files Affected**:
- `apps/desktop/src/components/atoms/AntiBanWarningBadge.tsx` (line 68)

**Current Code**:
```tsx
<Badge
  variant={config.variant}
  size="md"
  className="inline-flex items-center gap-1.5"
  title={tooltip}
  role="status"  // ← REDUNDANT with aria-label
  aria-label={config.ariaLabel}
>
```

**Fix Required**:
Replace `<Badge>` with semantic `<output>` element which has implicit role="status":

```tsx
<output
  className={cn(
    "inline-flex items-center gap-1.5",
    // Badge styles
  )}
  title={tooltip}
  aria-label={config.ariaLabel}
>
  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
  {config.label}
</output>
```

**Acceptance Criteria**:
- [ ] Uses `<output>` element instead of Badge with role="status"
- [ ] All visual styling preserved
- [ ] Tooltip functionality maintained
- [ ] Lint warning resolved
- [ ] Screen reader announces as live region

**Test Scenarios**:
1. Visual: Badge renders with correct color variant (green/yellow/red)
2. Accessibility: Screen reader announces "Low risk: Safe to post" etc.
3. Hover: Tooltip shows hourly/daily stats
4. Lint: No useSemanticElements warning

---

### REQ-003: Remove redundant role="status" from RiskBadge

**Category**: a11y/useSemanticElements  
**Priority**: HIGH  
**Severity**: Warning

**Description**: Same issue as REQ-002 - role="status" is redundant when using semantic elements.

**Files Affected**:
- `apps/desktop/src/components/atoms/RiskBadge.tsx` (line 32)

**Current Code**:
```tsx
<span
  className={cn(
    "inline-flex items-center font-medium rounded-full",
    riskStyles[level],
    sizeStyles[size],
    className,
  )}
  role="status"  // ← REDUNDANT with aria-label
  aria-label={`Risk level: ${level}`}
>
```

**Fix Required**:
Use `<output>` element instead:

```tsx
<output
  className={cn(
    "inline-flex items-center font-medium rounded-full",
    riskStyles[level],
    sizeStyles[size],
    className,
  )}
  aria-label={`Risk level: ${level}`}
>
  {level}
</output>
```

**Acceptance Criteria**:
- [ ] Uses `<output>` element
- [ ] Visual styling preserved (colors, padding, rounded)
- [ ] Lint warning resolved

**Test Scenarios**:
1. Visual: Renders with correct color per risk level
2. Accessibility: Screen reader announces "Risk level: LOW" etc.
3. Lint: No useSemanticElements warning

---

### REQ-004: Convert role="button" div to semantic button

**Category**: a11y/useSemanticElements  
**Priority**: HIGH  
**Severity**: Warning

**Description**: Using `<div role="button">` instead of `<button>` is an anti-pattern. Semantic `<button>` provides built-in keyboard accessibility and focus management.

**Files Affected**:
- `apps/desktop/src/components/molecules/AccountCard.tsx` (lines 59-73)

**Current Code**:
```tsx
<div
  className={cn(
    "relative bg-white rounded-lg border border-gray-200 p-4",
    "transition-all duration-200",
    "hover:shadow-md hover:cursor-pointer",
    isHovered && "border-primary",
    className,
  )}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  onClick={handleClick}
  role="button"  // ← USE SEMANTIC BUTTON
  tabIndex={0}
  aria-label={`${account.name} - ${account.platform}`}
>
```

**Fix Required**:
Change to semantic `<button>` element:

```tsx
<button
  type="button"
  className={cn(
    "relative bg-white rounded-lg border border-gray-200 p-4",
    "transition-all duration-200",
    "hover:shadow-md hover:cursor-pointer",
    "text-left w-full",  // ← Reset button styles
    isHovered && "border-primary",
    className,
  )}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  onClick={handleClick}
  aria-label={`${account.name} - ${account.platform}`}
>
```

**Important Notes**:
- Add `type="button"` to prevent form submission
- Add `text-left` to reset button's default center alignment
- Add `w-full` to maintain layout
- Remove `tabIndex={0}` - button has this by default
- Remove `role="button"` - semantic button already has this

**Acceptance Criteria**:
- [ ] Uses `<button type="button">` instead of `<div role="button">`
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Click handlers preserved
- [ ] Visual styling unchanged
- [ ] Inner buttons (Edit/Delete) still work with `stopPropagation`
- [ ] Lint warning resolved

**Test Scenarios**:
1. Keyboard: Tab to card, press Enter/Space to activate
2. Mouse: Click card to trigger onClick
3. Inner buttons: Click Edit/Delete without triggering card click
4. Visual: Hover state shows border highlight
5. Lint: No useSemanticElements warning

---

### REQ-005: Convert role="dialog" divs to dialog element

**Category**: a11y/useSemanticElements  
**Priority**: HIGH  
**Severity**: Warning

**Description**: Using `<div role="dialog">` instead of `<dialog>` is an anti-pattern. The `<dialog>` element provides built-in focus trapping and accessibility features.

**Files Affected**:
- `apps/desktop/src/components/Schedule/DayModal.tsx` (lines 67-73)
- `apps/desktop/src/components/organisms/AccountFormModal.tsx` (lines 122-128)

**Current Code (DayModal.tsx)**:
```tsx
<div
  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  onClick={handleBackdropClick}
  role="dialog"  // ← USE SEMANTIC DIALOG
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

**Current Code (AccountFormModal.tsx)**:
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  onClick={onCancel}
  role="dialog"  // ← USE SEMANTIC DIALOG
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

**Fix Required**:
Use `<dialog>` element with proper styling:

```tsx
<dialog
  open={isOpen}
  className="bg-transparent p-0 max-w-full max-h-full"
  onClick={handleBackdropClick}
  aria-labelledby="modal-title"
>
```

**Important Notes**:
- `<dialog>` requires `open` attribute for visibility (already controlled by `isOpen`)
- `aria-modal="true"` is implicit on `<dialog>`
- `role="dialog"` is implicit on `<dialog>`
- Need to handle backdrop styling differently (CSS ::backdrop pseudo-element)
- Focus trap is automatic with `<dialog>`

**Acceptance Criteria**:
- [ ] Both modals use `<dialog>` element
- [ ] `open={isOpen}` controls visibility
- [ ] Backdrop click closes modal
- [ ] Focus trap works automatically
- [ ] Escape key closes modal (built-in for dialog)
- [ ] Visual styling preserved
- [ ] Lint warnings resolved

**Test Scenarios**:
1. Open modal, verify it appears
2. Click backdrop, verify modal closes
3. Press Escape, verify modal closes
4. Tab navigation trapped within modal
5. Visual: Modal renders with correct styling
6. Lint: No useSemanticElements warnings

---

### REQ-006: Add keyboard handlers to clickable elements

**Category**: a11y/useKeyWithClickEvents  
**Priority**: HIGH  
**Severity**: Warning

**Description**: Elements with `onClick` must also have `onKeyDown` handler for keyboard accessibility. Users must be able to activate with Enter and Space keys.

**Files Affected**:
- `apps/desktop/src/components/Schedule/Calendar.tsx` (line 69 - backdrop click in DayModal pattern)
- `apps/desktop/src/components/Schedule/DayModal.tsx` (lines 67-73)
- `apps/desktop/src/components/molecules/ToastContainer.tsx` (line 64 - toast container)

**Current Code (DayModal.tsx)**:
```tsx
<div
  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  onClick={handleBackdropClick}  // ← MISSING onKeyDown
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

**Fix Required**:
Add keyboard handler for backdrop:

```tsx
const handleBackdropKeyDown = useCallback(
  (event: React.KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  },
  [onClose],
);

// In JSX:
<dialog
  open={isOpen}
  className="bg-transparent p-0 max-w-full max-h-full"
  onClick={handleBackdropClick}
  onKeyDown={handleBackdropKeyDown}
  aria-labelledby="modal-title"
>
```

**Note**: After fixing REQ-005 (dialog element), Escape key handling is built-in. The keyboard handler may only be needed for backdrop click simulation.

**Acceptance Criteria**:
- [ ] All elements with onClick have onKeyDown
- [ ] Enter and Space keys trigger same action as click
- [ ] Lint warnings resolved

**Test Scenarios**:
1. Focus on element, press Enter - action triggers
2. Focus on element, press Space - action triggers
3. Lint: No useKeyWithClickEvents warnings

---

### REQ-007: Add tabIndex to progressbar elements

**Category**: a11y/useFocusableInteractive  
**Priority**: MEDIUM  
**Severity**: Warning

**Description**: Elements with `role="progressbar"` must be focusable to allow screen reader users to interact with them.

**Files Affected**:
- `apps/desktop/src/components/atoms/PostLimitIndicator.tsx` (lines 40-47)
- `apps/desktop/src/components/atoms/ProgressBar.tsx` (lines 42-48)

**Current Code (PostLimitIndicator.tsx)**:
```tsx
<div
  className="h-2 bg-gray-200 rounded-full overflow-hidden"
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`${type} posts: ${current} of ${limit}`}
>  // ← MISSING tabIndex
```

**Current Code (ProgressBar.tsx)**:
```tsx
<div
  className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeStyles[size])}
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
>  // ← MISSING tabIndex
```

**Fix Required**:
Add `tabIndex={0}` to make progressbars focusable:

```tsx
<div
  className="h-2 bg-gray-200 rounded-full overflow-hidden"
  role="progressbar"
  tabIndex={0}  // ← ADD THIS
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`${type} posts: ${current} of ${limit}`}
>
```

**Acceptance Criteria**:
- [ ] Both progressbars have `tabIndex={0}`
- [ ] Can Tab to progressbar elements
- [ ] Screen readers announce progress value
- [ ] Lint warnings resolved

**Test Scenarios**:
1. Keyboard: Tab to progressbar, verify focus outline
2. Screen reader: Announces progress percentage
3. Lint: No useFocusableInteractive warnings

---

### REQ-008: Add type attribute to button

**Category**: a11y/useButtonType  
**Priority**: MEDIUM  
**Severity**: Warning

**Description**: Buttons must have explicit `type` attribute to prevent accidental form submission.

**Files Affected**:
- `apps/desktop/src/components/organisms/AccountFormModal.tsx` (line 137)

**Current Code**:
```tsx
<button
  onClick={onCancel}  // ← MISSING type attribute
  className="text-gray-400 hover:text-gray-600 transition-colors"
  aria-label="Close modal"
>
```

**Fix Required**:
Add `type="button"`:

```tsx
<button
  type="button"  // ← ADD THIS
  onClick={onCancel}
  className="text-gray-400 hover:text-gray-600 transition-colors"
  aria-label="Close modal"
>
```

**Acceptance Criteria**:
- [ ] Button has `type="button"`
- [ ] Clicking button does not submit form
- [ ] Lint warning resolved

**Test Scenarios**:
1. Click close button in modal - modal closes without form submission
2. Lint: No useButtonType warning

---

### REQ-009: Replace forEach with for...of loop

**Category**: complexity/noForEach  
**Priority**: LOW  
**Severity**: Warning

**Description**: Using `forEach` is discouraged in favor of `for...of` loops for better performance and early return capability.

**Files Affected**:
- `apps/desktop/src/components/Schedule/Calendar.tsx` (lines 415-418 in test file)
- `apps/desktop/src/components/molecules/ToastContainer.tsx` (line 20)

**Current Code (ToastContainer.tsx)**:
```tsx
useEffect(() => {
  toasts.forEach((toast) => {  // ← USE for...of
    if (!timeoutRefs.current.has(toast.id)) {
      const timeoutId = setTimeout(() => {
        removeToast(toast.id);
        timeoutRefs.current.delete(toast.id);
      }, AUTO_DISMISS_MS);

      timeoutRefs.current.set(toast.id, timeoutId);
    }
  });
  // ...
}, [toasts, removeToast]);
```

**Fix Required**:
Replace with `for...of`:

```tsx
useEffect(() => {
  for (const toast of toasts) {  // ← for...of
    if (!timeoutRefs.current.has(toast.id)) {
      const timeoutId = setTimeout(() => {
        removeToast(toast.id);
        timeoutRefs.current.delete(toast.id);
      }, AUTO_DISMISS_MS);

      timeoutRefs.current.set(toast.id, timeoutId);
    }
  }
  // ...
}, [toasts, removeToast]);
```

**Current Code (Calendar.test.tsx)**:
```tsx
dayCells.forEach((cell) => {  // ← USE for...of
  expect(within(cell).queryByTestId(/schedule-indicator/)).not.toBeInTheDocument();
});
```

**Fix Required**:
Replace with `for...of`:

```tsx
for (const cell of dayCells) {  // ← for...of
  expect(within(cell).queryByTestId(/schedule-indicator/)).not.toBeInTheDocument();
}
```

**Acceptance Criteria**:
- [ ] Both `forEach` calls replaced with `for...of`
- [ ] Functionality preserved
- [ ] Lint warnings resolved

**Test Scenarios**:
1. Toast auto-dismiss still works
2. Calendar test passes
3. Lint: No noForEach warnings

---

### REQ-010: Replace array index keys with stable keys

**Category**: suspicious/noArrayIndexKey  
**Priority**: HIGH  
**Severity**: Warning

**Description**: Using array indices as React keys can cause issues with component state and reconciliation. Use stable, unique identifiers instead.

**Files Affected**:
- `apps/desktop/src/components/Schedule/Calendar.tsx` (line 336)
- `apps/desktop/src/components/molecules/ToastContainer.tsx` (line 64 - already has stable key, may be false positive)

**Current Code (Calendar.tsx - line 336)**:
```tsx
{weekDays.map((day, dayIndex) => {
  // ...
  return (
    <CalendarDay
      key={`day-${day}-${dayIndex}`}  // ← dayIndex is unstable
      // ...
    />
  );
})}
```

**Analysis**:
Looking at the code, the key uses `day-${day}-${dayIndex}` where `day` is the day number and `dayIndex` is the loop index. Since days can repeat (from different months), this could be unstable.

**Fix Required**:
Use the date object for a stable key:

```tsx
{weekDays.map((day, dayIndex) => {
  const isNextMonth = dayIndex >= days.length - startDay && weekDays.length > days.length - startDay;
  const isCurrentMonth = !isNextMonth && startDay + dayIndex < days.length;
  const date = getDateForDay(day, isCurrentMonth, false);
  const dateKey = date.toDateString();
  const daySchedules = schedulesByDate.get(dateKey) ?? [];
  const isFocused = focusedDate?.toDateString() === dateKey;

  return (
    <CalendarDay
      key={dateKey}  // ← Stable key based on date
      day={day}
      date={date}
      schedules={daySchedules}
      isCurrentMonth={isCurrentMonth}
      isToday={isToday(day, isCurrentMonth)}
      isFocused={isFocused}
      onClick={handleDayClick}
      onKeyDown={handleKeyDown}
    />
  );
})}
```

**ToastContainer Analysis**:
Line 64 shows `{toasts.map((toast: ToastType) => (` and line 65 has `key={toast.id}`. This uses `toast.id` which IS a stable key. This may be a false positive from the linter, or there may be another location.

Looking more carefully at the code structure, the key IS stable (`toast.id`). This warning might be coming from elsewhere or could be a false positive. Need to verify with actual lint output.

**Acceptance Criteria**:
- [ ] Calendar uses date-based keys instead of index
- [ ] ToastContainer verified (may already be correct)
- [ ] All React reconciliation works correctly
- [ ] Lint warnings resolved

**Test Scenarios**:
1. Calendar renders correctly when changing months
2. Day cells maintain correct state when focused
3. Schedule indicators appear on correct days
4. Lint: No noArrayIndexKey warnings

---

### REQ-011: Replace any with proper type in vite-env.d.ts

**Category**: suspicious/noExplicitAny  
**Priority**: MEDIUM  
**Severity**: Warning

**Description**: The `any` type bypasses TypeScript's type checking. Use specific type definitions.

**Files Affected**:
- `apps/desktop/src/vite-env.d.ts` (line 7)

**Current Code**:
```tsx
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;  // ← NEEDS SPECIFIC TYPE
    }
  }
}
```

**Analysis**:
This file extends React's JSX.IntrinsicElements to allow custom elements. The `any` type is used to allow arbitrary props on custom elements.

**Fix Required**:
Use a more specific type that still allows flexibility:

```tsx
/// <reference types="vite/client" />

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
```

**Alternative Fix** (if the above is too restrictive):
```tsx
/// <reference types="vite/client" />

// Remove the manual extension if not needed
// React's default types should handle most cases
```

**Important**: Need to verify why this extension exists. If it's for a specific library (like Tauri web components), use that library's types instead.

**Acceptance Criteria**:
- [ ] No `any` types in the file
- [ ] TypeScript compilation succeeds
- [ ] Custom elements still work if needed
- [ ] Lint warning resolved

**Test Scenarios**:
1. TypeScript: `pnpm typecheck` passes
2. Build: `pnpm build` succeeds
3. Lint: No noExplicitAny warning

---

### REQ-012: Remove unnecessary dependency from useEffect

**Category**: correctness/useExhaustiveDependencies  
**Priority**: MEDIUM  
**Severity**: Warning

**Description**: The `isOpen` dependency in AccountFormModal's useEffect is unnecessary and can cause excessive re-renders.

**Files Affected**:
- `apps/desktop/src/components/organisms/AccountFormModal.tsx` (line 60)

**Current Code**:
```tsx
useEffect(() => {
  if (mode === "edit" && account) {
    setFormData({
      platform: account.platform,
      name: account.name,
      username: account.username ?? "",
      displayName: account.displayName ?? "",
      status: account.status,
      notes: "",
    });
  } else if (mode === "create") {
    setFormData(DEFAULT_VALUES);
  }
  setErrors({});
}, [mode, account, isOpen]);  // ← isOpen may be unnecessary
```

**Analysis**:
Looking at the useEffect, it sets form data based on `mode` and `account`. The `isOpen` dependency is likely unnecessary because:
1. When modal opens, `account` or `mode` would change
2. The effect doesn't use `isOpen` directly

**Fix Required**:
Remove `isOpen` from dependencies:

```tsx
useEffect(() => {
  if (mode === "edit" && account) {
    setFormData({
      platform: account.platform,
      name: account.name,
      username: account.username ?? "",
      displayName: account.displayName ?? "",
      status: account.status,
      notes: "",
    });
  } else if (mode === "create") {
    setFormData(DEFAULT_VALUES);
  }
  setErrors({});
}, [mode, account]);  // ← Remove isOpen
```

**Verification needed**: Ensure modal still resets correctly when opened. If `isOpen` was intentionally added to trigger reset on open, this might need a different approach.

**Alternative Fix** (if isOpen is needed for reset):
Use a separate effect with `isOpen`:

```tsx
useEffect(() => {
  if (!isOpen) return;
  
  // Reset form when modal opens
  if (mode === "edit" && account) {
    setFormData({...});
  } else {
    setFormData(DEFAULT_VALUES);
  }
  setErrors({});
}, [isOpen, mode, account]);
```

**Acceptance Criteria**:
- [ ] Unnecessary dependency removed OR properly documented
- [ ] Modal still resets correctly when opened
- [ ] No excessive re-renders
- [ ] Lint warning resolved

**Test Scenarios**:
1. Open modal in create mode - form is empty
2. Open modal in edit mode - form has account data
3. Close and reopen - form resets correctly
4. Lint: No useExhaustiveDependencies warning

---

## Summary Table

| REQ ID | Category | Files | Priority |
|--------|----------|-------|----------|
| REQ-001 | useSemanticElements | Calendar.tsx (line 260) | HIGH |
| REQ-002 | useSemanticElements | AntiBanWarningBadge.tsx (line 68) | HIGH |
| REQ-003 | useSemanticElements | RiskBadge.tsx (line 32) | HIGH |
| REQ-004 | useSemanticElements | AccountCard.tsx (lines 59-73) | HIGH |
| REQ-005 | useSemanticElements | DayModal.tsx, AccountFormModal.tsx | HIGH |
| REQ-006 | useKeyWithClickEvents | DayModal.tsx (line 69) | HIGH |
| REQ-007 | useFocusableInteractive | PostLimitIndicator.tsx, ProgressBar.tsx | MEDIUM |
| REQ-008 | useButtonType | AccountFormModal.tsx (line 137) | MEDIUM |
| REQ-009 | noForEach | Calendar.test.tsx, ToastContainer.tsx | LOW |
| REQ-010 | noArrayIndexKey | Calendar.tsx (line 336) | HIGH |
| REQ-011 | noExplicitAny | vite-env.d.ts (line 7) | MEDIUM |
| REQ-012 | useExhaustiveDependencies | AccountFormModal.tsx (line 60) | MEDIUM |

---

## Implementation Risks

1. **Dialog element compatibility**: The `<dialog>` element may require polyfills for older browsers. Need to verify Tauri's WebView support.

2. **Styling changes**: Converting `<div>` to `<button>` or `<dialog>` may affect CSS. Need to test visual regression.

3. **Event propagation**: Converting AccountCard to `<button>` requires careful handling of inner Edit/Delete buttons.

4. **Focus management**: Dialog element has built-in focus trap - need to verify it doesn't conflict with manual implementations.

5. **Key stability**: Date-based keys in Calendar may behave differently with edge cases (month transitions).

---

## Testing Strategy

### Pre-Implementation
1. Run `pnpm lint` to capture current warning count
2. Run `pnpm typecheck` to ensure no TypeScript errors
3. Run `pnpm test` to establish baseline

### Per-Requirement
1. Make fix
2. Run lint on specific file
3. Run related tests
4. Visual regression check

### Post-Implementation
1. Full `pnpm lint` - should show 0 warnings
2. Full `pnpm typecheck`
3. Full `pnpm test`
4. Manual accessibility testing with screen reader
5. Keyboard navigation testing

---

## Next Recommended Phase

**sdd-design** - Create technical design document with:
- Implementation order (dependencies between fixes)
- CSS adjustments for semantic elements
- Test updates needed
- Rollback strategy
