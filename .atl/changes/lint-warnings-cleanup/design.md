# Technical Design: lint-warnings-cleanup

**Status**: success
**Created**: 2026-04-17
**Change ID**: lint-warnings-cleanup

---

## Executive Summary

This design converts non-semantic HTML patterns to proper semantic elements (`<button>`, `<dialog>`, `<output>`), adds missing accessibility attributes (tabIndex, keyboard handlers), and resolves code quality issues (forEach → for...of, stable keys, proper types). All changes are proper implementations following WAI-ARIA best practices—no silencing or workarounds.

---

## Architecture Decisions

### Decision 1: Use Semantic `<dialog>` Element

**What**: Replace `<div role="dialog">` with native `<dialog>` element in DayModal and AccountFormModal.

**Rationale**:
- Native `<dialog>` provides built-in focus trap (no manual management)
- Escape key handling is automatic
- `role="dialog"` and `aria-modal="true"` are implicit
- Better accessibility support without custom JS

**Alternatives Considered**:
- Keep `<div role="dialog">` with manual focus management → Rejected: More code, more bugs
- Use a modal library (Radix, Headless UI) → Rejected: Adds dependency, overkill for 2 modals

**Implementation Notes**:
- `<dialog>` requires `open` attribute for visibility control
- Use `::backdrop` CSS pseudo-element for backdrop styling
- Need to style dialog to remove default browser chrome (padding, max-width)

### Decision 2: Use Semantic `<output>` Element for Live Regions

**What**: Replace `<Badge role="status">` and `<span role="status">` with `<output>` element.

**Rationale**:
- `<output>` has implicit `role="status"` - no redundant attribute
- Semantically represents live output/status information
- Properly announced by screen readers as live region

**Alternatives Considered**:
- Keep `role="status"` on span/div → Rejected: Redundant with aria-label
- Use `<div role="status">` → Rejected: Same redundancy issue
- Use `aria-live="polite"` → Rejected: `<output>` is more semantic

**Implementation Notes**:
- Must extract Badge styles to apply directly to `<output>`
- Need to maintain variant color classes

### Decision 3: Use Semantic `<button>` for AccountCard

**What**: Convert `<div role="button">` to `<button type="button">` in AccountCard.

**Rationale**:
- Native button has built-in keyboard support (Enter, Space)
- `role="button"` and `tabIndex={0}` are implicit
- Proper form integration if card ever inside form

**Alternatives Considered**:
- Keep `<div role="button">` → Rejected: Anti-pattern, requires manual keyboard handlers
- Use `<a>` with href → Rejected: Not a navigation action

**Implementation Notes**:
- Add `type="button"` to prevent form submission
- Add `text-left` to reset button's default text-align
- Add `w-full` to maintain layout width
- Inner Edit/Delete buttons use `stopPropagation` - must preserve

### Decision 4: Stable Date-Based Keys for Calendar

**What**: Use `date.toDateString()` as key instead of `day-${day}-${dayIndex}`.

**Rationale**:
- Day numbers can repeat (prev/next month overlap)
- Index is unstable during month transitions
- Date string is unique and stable per calendar cell

**Alternatives Considered**:
- Use `day-${month}-${year}` composition → Rejected: Already computing date object
- Use ISO string → Rejected: `toDateString()` is shorter and sufficient

**Implementation Notes**:
- Already computing `dateKey` in the loop - just use it as key
- No functional changes, just key stability

### Decision 5: Replace `forEach` with `for...of`

**What**: Convert `array.forEach()` to `for (const item of array)`.

**Rationale**:
- Allows early return with `break` if needed
- Better performance in some JS engines
- Consistent with project's lint rules

**Alternatives Considered**:
- Keep `forEach` → Rejected: Violates lint rule
- Use `for` loop with index → Rejected: Less readable

### Decision 6: Specific Type for vite-env.d.ts

**What**: Replace `[key: string]: any` with proper HTML element type.

**Rationale**:
- `any` bypasses TypeScript's safety
- `DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>` allows arbitrary props
- Better type checking for custom elements

**Alternatives Considered**:
- Remove the extension entirely → Need to verify if required for Tauri components
- Use `Record<string, unknown>` → Too permissive, loses element type info

---

## Implementation Order

Dependencies between fixes are minimal. Order is based on:

1. **Foundation fixes first** (affects other fixes)
2. **Component fixes second** (independent of each other)
3. **Test updates last** (verify all fixes)

### Phase 1: Foundation (No Dependencies)

1. **REQ-008**: Add `type="button"` to AccountFormModal close button
   - Isolated, one-line fix
   - No test changes needed

2. **REQ-007**: Add `tabIndex={0}` to progressbar components
   - PostLimitIndicator.tsx
   - ProgressBar.tsx
   - Independent, straightforward

3. **REQ-011**: Fix `any` type in vite-env.d.ts
   - Foundation file, fix first
   - May affect type checking

### Phase 2: Semantic Element Conversions (Order by Complexity)

4. **REQ-001**: Remove `role="columnheader"` from Calendar
   - Simplest fix, just remove attribute
   - Verify test still passes

5. **REQ-002**: Convert AntiBanWarningBadge to `<output>`
   - Need to extract Badge styles
   - No test file exists

6. **REQ-003**: Convert RiskBadge to `<output>`
   - Similar to REQ-002
   - Has test file (RiskBadge.test.tsx)

7. **REQ-004**: Convert AccountCard to `<button>`
   - Most complex - inner buttons need `stopPropagation`
   - Has test file with accessibility assertions

8. **REQ-005**: Convert modals to `<dialog>`
   - DayModal.tsx
   - AccountFormModal.tsx
   - Requires CSS changes for backdrop

### Phase 3: Code Quality Fixes

9. **REQ-009**: Replace `forEach` with `for...of`
   - ToastContainer.tsx (line 20)
   - Calendar.test.tsx (line 415)

10. **REQ-010**: Fix array index keys in Calendar
    - Use `dateKey` as stable key

11. **REQ-012**: Remove unnecessary `isOpen` dependency
    - AccountFormModal.tsx useEffect

### Phase 4: Test Updates

12. Update tests for changed components
    - Calendar.test.tsx (forEach fix)
    - AccountCard.test.tsx (button role assertion)
    - RiskBadge.test.tsx (output element)
    - DayModal.test.tsx (dialog element)

---

## Component Changes

### REQ-001: Calendar.tsx (Line 260)

**Before**:
```tsx
<th
  key={day}
  scope="col"
  role="columnheader"
  className="p-2 text-center font-medium text-gray-600 border-b"
>
  {day}
</th>
```

**After**:
```tsx
<th
  key={day}
  scope="col"
  className="p-2 text-center font-medium text-gray-600 border-b"
>
  {day}
</th>
```

**Change**: Remove `role="columnheader"` - `<th scope="col">` has this role implicitly.

---

### REQ-002: AntiBanWarningBadge.tsx

**Before**:
```tsx
<Badge
  variant={config.variant}
  size="md"
  className="inline-flex items-center gap-1.5"
  title={tooltip}
  role="status"
  aria-label={config.ariaLabel}
>
  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
  {config.label}
</Badge>
```

**After**:
```tsx
<output
  className={cn(
    "inline-flex items-center gap-1.5 font-medium rounded-full",
    "px-2.5 py-1 text-sm", // size="md"
    variantStyles[config.variant],
    className,
  )}
  title={tooltip}
  aria-label={config.ariaLabel}
>
  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
  {config.label}
</output>
```

**Additional Changes**:
- Import variant styles from Badge or define locally
- Add `cn` utility import if not present

**New File-Level Code**:
```tsx
const variantStyles = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};
```

---

### REQ-003: RiskBadge.tsx

**Before**:
```tsx
<span
  className={cn(
    "inline-flex items-center font-medium rounded-full",
    riskStyles[level],
    sizeStyles[size],
    className,
  )}
  role="status"
  aria-label={`Risk level: ${level}`}
>
  {level}
</span>
```

**After**:
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

**Change**: Replace `<span>` with `<output>`, remove `role="status"`.

---

### REQ-004: AccountCard.tsx

**Before**:
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
  role="button"
  tabIndex={0}
  aria-label={`${account.name} - ${account.platform}`}
>
```

**After**:
```tsx
<button
  type="button"
  className={cn(
    "relative bg-white rounded-lg border border-gray-200 p-4",
    "transition-all duration-200",
    "hover:shadow-md hover:cursor-pointer",
    "text-left w-full", // Reset button styles
    isHovered && "border-primary",
    className,
  )}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  onClick={handleClick}
  aria-label={`${account.name} - ${account.platform}`}
>
```

**Changes**:
- `<div>` → `<button>`
- Add `type="button"` (prevent form submission)
- Add `text-left` (reset button default)
- Add `w-full` (maintain layout width)
- Remove `role="button"` (implicit on button)
- Remove `tabIndex={0}` (implicit on button)

---

### REQ-005: DayModal.tsx

**Before**:
```tsx
<div
  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  onClick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

**After**:
```tsx
<dialog
  open={isOpen}
  className="bg-transparent p-0 max-w-full max-h-full w-full h-full"
  onClick={handleBackdropClick}
  aria-labelledby="modal-title"
>
```

**CSS Addition** (index.css):
```css
/* Dialog backdrop styling */
dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Remove default dialog styling */
dialog {
  background: transparent;
  border: none;
  padding: 0;
  max-width: none;
  max-height: none;
}
```

**Additional Change**:
- Wrap content in inner `<div>` for positioning
- Update structure:

```tsx
<dialog
  open={isOpen}
  className="w-full h-full bg-transparent"
  onClick={handleBackdropClick}
  aria-labelledby="modal-title"
>
  <div className="flex items-center justify-center min-h-full p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
      {/* Existing content */}
    </div>
  </div>
</dialog>
```

---

### REQ-005: AccountFormModal.tsx

**Before**:
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  onClick={onCancel}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

**After**:
```tsx
<dialog
  open={isOpen}
  className="w-full h-full bg-transparent"
  onClick={(e) => {
    if (e.target === e.currentTarget) onCancel();
  }}
  aria-labelledby="modal-title"
>
  <div className="flex items-center justify-center min-h-full">
    <div
      className={cn("bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Existing content */}
    </div>
  </div>
</dialog>
```

**Note**: Remove the manual Escape key handler (lines 62-71) - `<dialog>` handles this automatically.

---

### REQ-006: Add Keyboard Handlers (After Dialog Conversion)

After converting to `<dialog>`, the Escape key handler is built-in. No additional keyboard handlers needed for modals.

**If keeping backdrop click**: The `onClick` handler is sufficient. For keyboard users, Escape key closes the dialog automatically.

---

### REQ-007: PostLimitIndicator.tsx

**Before**:
```tsx
<div
  className="h-2 bg-gray-200 rounded-full overflow-hidden"
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`${type} posts: ${current} of ${limit}`}
>
```

**After**:
```tsx
<div
  className="h-2 bg-gray-200 rounded-full overflow-hidden"
  role="progressbar"
  tabIndex={0}
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`${type} posts: ${current} of ${limit}`}
>
```

**Change**: Add `tabIndex={0}` after `role="progressbar"`.

---

### REQ-007: ProgressBar.tsx

**Before**:
```tsx
<div
  className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeStyles[size])}
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
>
```

**After**:
```tsx
<div
  className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeStyles[size])}
  role="progressbar"
  tabIndex={0}
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
>
```

**Change**: Add `tabIndex={0}` after `role="progressbar"`.

---

### REQ-008: AccountFormModal.tsx (Close Button)

**Before**:
```tsx
<button
  onClick={onCancel}
  className="text-gray-400 hover:text-gray-600 transition-colors"
  aria-label="Close modal"
>
  <X className="h-5 w-5" />
</button>
```

**After**:
```tsx
<button
  type="button"
  onClick={onCancel}
  className="text-gray-400 hover:text-gray-600 transition-colors"
  aria-label="Close modal"
>
  <X className="h-5 w-5" />
</button>
```

**Change**: Add `type="button"` attribute.

---

### REQ-009: ToastContainer.tsx

**Before**:
```tsx
useEffect(() => {
  toasts.forEach((toast) => {
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

**After**:
```tsx
useEffect(() => {
  for (const toast of toasts) {
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

**Change**: Replace `toasts.forEach((toast) => {` with `for (const toast of toasts) {`.

---

### REQ-009: Calendar.test.tsx

**Before**:
```tsx
dayCells.forEach((cell) => {
  expect(within(cell).queryByTestId(/schedule-indicator/)).not.toBeInTheDocument();
});
```

**After**:
```tsx
for (const cell of dayCells) {
  expect(within(cell).queryByTestId(/schedule-indicator/)).not.toBeInTheDocument();
}
```

**Change**: Replace `forEach` with `for...of` loop.

---

### REQ-010: Calendar.tsx (Line 347)

**Before**:
```tsx
{weekDays.map((day, dayIndex) => {
  const isNextMonth =
    dayIndex >= days.length - startDay && weekDays.length > days.length - startDay;
  const isCurrentMonth = !isNextMonth && startDay + dayIndex < days.length;
  const date = getDateForDay(day, isCurrentMonth, false);
  const dateKey = date.toDateString();
  const daySchedules = schedulesByDate.get(dateKey) ?? [];
  const isFocused = focusedDate?.toDateString() === dateKey;

  return (
    <CalendarDay
      key={`day-${day}-${dayIndex}`}
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

**After**:
```tsx
{weekDays.map((day, dayIndex) => {
  const isNextMonth =
    dayIndex >= days.length - startDay && weekDays.length > days.length - startDay;
  const isCurrentMonth = !isNextMonth && startDay + dayIndex < days.length;
  const date = getDateForDay(day, isCurrentMonth, false);
  const dateKey = date.toDateString();
  const daySchedules = schedulesByDate.get(dateKey) ?? [];
  const isFocused = focusedDate?.toDateString() === dateKey;

  return (
    <CalendarDay
      key={dateKey}
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

**Change**: Replace `key={`day-${day}-${dayIndex}`}` with `key={dateKey}`.

**Note**: Also check other similar mappings in Calendar.tsx (lines 280, 301) and update if using index-based keys.

---

### REQ-011: vite-env.d.ts

**Before**:
```tsx
/// <reference types="vite/client" />
import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}
```

**After**:
```tsx
/// <reference types="vite/client" />

// If custom elements are needed, use proper type
// Otherwise, remove this extension entirely
```

**Alternative** (if custom elements are required):
```tsx
/// <reference types="vite/client" />

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
```

**Verification Needed**: Check if this extension is required for Tauri web components or other custom elements.

---

### REQ-012: AccountFormModal.tsx (useEffect)

**Before**:
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
}, [mode, account, isOpen]);
```

**After**:
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
}, [mode, account]);
```

**Change**: Remove `isOpen` from dependency array.

**Rationale**: The effect only uses `mode` and `account`. Modal opening triggers `account` change (edit mode) or creates new modal state (create mode).

---

## CSS Adjustments

### New CSS Rules for `<dialog>` Element

Add to `apps/desktop/src/index.css`:

```css
/* ===== Dialog Element Styling ===== */

/* Remove default browser dialog styling */
dialog {
  padding: 0;
  border: none;
  background: transparent;
  max-width: none;
  max-height: none;
}

/* Dialog backdrop (modal overlay) */
dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Ensure dialog content centers properly */
dialog.centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
```

### Button Reset Styles

Already handled inline via `text-left w-full` classes. No additional CSS needed.

---

## Test Updates

### Calendar.test.tsx

**Change**: Line 415 - replace `forEach` with `for...of`

No other changes needed - tests verify behavior, not implementation.

### AccountCard.test.tsx

**Expected Changes**:
- Test already queries by `getByRole("button")` - no update needed
- Accessibility test for `tabIndex="0"` will still pass (implicit on button)
- Click tests remain valid

### RiskBadge.test.tsx

**Expected Changes**:
- If test queries by `getByRole("status")`, it will still work (`<output>` has implicit role)
- Update query to `getByRole("status")` or `container.querySelector('output')` if needed

### DayModal.test.tsx

**Expected Changes**:
- Query `getByRole("dialog")` will still work (implicit on `<dialog>`)
- No `aria-modal` attribute to query (implicit on dialog)
- Test for Escape key will still pass (built-in behavior)

---

## Verification Strategy

### Per-Fix Verification

| Fix | Command | Expected Result |
|-----|---------|-----------------|
| REQ-001 | `pnpm lint apps/desktop/src/components/Schedule/Calendar.tsx` | No useSemanticElements warning |
| REQ-002 | `pnpm lint apps/desktop/src/components/atoms/AntiBanWarningBadge.tsx` | No useSemanticElements warning |
| REQ-003 | `pnpm lint apps/desktop/src/components/atoms/RiskBadge.tsx` | No useSemanticElements warning |
| REQ-004 | `pnpm lint apps/desktop/src/components/molecules/AccountCard.tsx` | No useSemanticElements warning |
| REQ-005 | `pnpm lint apps/desktop/src/components/Schedule/DayModal.tsx` | No useSemanticElements warning |
| REQ-005 | `pnpm lint apps/desktop/src/components/organisms/AccountFormModal.tsx` | No useSemanticElements + no useButtonType warnings |
| REQ-007 | `pnpm lint apps/desktop/src/components/atoms/PostLimitIndicator.tsx` | No useFocusableInteractive warning |
| REQ-007 | `pnpm lint apps/desktop/src/components/atoms/ProgressBar.tsx` | No useFocusableInteractive warning |
| REQ-009 | `pnpm lint apps/desktop/src/components/molecules/ToastContainer.tsx` | No noForEach warning |
| REQ-010 | `pnpm lint apps/desktop/src/components/Schedule/Calendar.tsx` | No noArrayIndexKey warning |
| REQ-011 | `pnpm lint apps/desktop/src/vite-env.d.ts` | No noExplicitAny warning |
| REQ-012 | `pnpm lint apps/desktop/src/components/organisms/AccountFormModal.tsx` | No useExhaustiveDependencies warning |

### Full Suite Verification

```bash
# 1. Run all lints
pnpm lint

# 2. Run all tests
pnpm test

# 3. Type check
pnpm typecheck

# 4. Build
pnpm build
```

### Manual Accessibility Testing

**Keyboard Navigation**:
1. Tab through AccountCard - verify Enter/Space activates
2. Tab through progressbars - verify focus outline visible
3. Open modal - verify Tab cycles through modal content only
4. Press Escape in modal - verify it closes

**Screen Reader** (NVDA/JAWS on Windows):
1. Navigate to AntiBanWarningBadge - verify "Low risk: Safe to post" announced
2. Navigate to RiskBadge - verify "Risk level: LOW" announced
3. Navigate to progressbar - verify value announced
4. Open modal - verify modal title announced first

---

## Risks & Mitigations

### Risk 1: Dialog Element Browser Support

**Risk**: `<dialog>` element may have limited support in older WebView versions.

**Mitigation**: Tauri 2.0 uses WebView2 (Windows), WebKit (macOS), WebKitGTK (Linux) - all support `<dialog>` element since 2022.

**Verification**: Run `pnpm build:desktop` and test on all platforms.

### Risk 2: Dialog Focus Trap Conflicts

**Risk**: Existing manual focus management may conflict with dialog's built-in focus trap.

**Mitigation**: Remove manual Escape key handler (lines 62-71 in AccountFormModal.tsx). Let dialog handle it.

### Risk 3: Button Styling Differences

**Risk**: Converting `<div>` to `<button>` may change layout or styling.

**Mitigation**: Add `text-left w-full` classes to reset button defaults. Test visual regression.

### Risk 4: Test Failures

**Risk**: Tests may query removed attributes (`role`, `aria-modal`).

**Mitigation**: Review test files before running. Update queries to use implicit roles.

### Risk 5: Calendar Key Instability

**Risk**: Date-based keys may behave unexpectedly during month transitions.

**Mitigation**: `date.toDateString()` is unique per day. Same date across months uses different date objects. Test month navigation thoroughly.

---

## Next Recommended Phase

**sdd-tasks** - Break down implementation into granular tasks:

1. Task for each file modification
2. Task for CSS additions
3. Task for test updates
4. Task for verification commands
5. Task for manual accessibility testing

---

## Appendix: File Changes Summary

| File | REQ IDs | Change Type |
|------|---------|-------------|
| Calendar.tsx | 001, 010 | Remove attribute, fix key |
| AntiBanWarningBadge.tsx | 002 | Convert to `<output>` |
| RiskBadge.tsx | 003 | Convert to `<output>` |
| AccountCard.tsx | 004 | Convert to `<button>` |
| DayModal.tsx | 005 | Convert to `<dialog>` |
| AccountFormModal.tsx | 005, 008, 012 | Convert to `<dialog>`, add type, fix deps |
| PostLimitIndicator.tsx | 007 | Add tabIndex |
| ProgressBar.tsx | 007 | Add tabIndex |
| ToastContainer.tsx | 009 | forEach → for...of |
| Calendar.test.tsx | 009 | forEach → for...of |
| vite-env.d.ts | 011 | Fix any type |
| index.css | 005 | Add dialog styles |
