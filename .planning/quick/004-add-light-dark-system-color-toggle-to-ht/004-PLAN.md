# Quick Task 004: Add light/dark/system color toggle to HTML output

## Task Description

Add an interactive toggle button to the generated HTML that allows users to switch between light mode, dark mode, and system preference. The toggle should persist across page reloads using localStorage.

## Context

Current state:
- `templates/base/styles.css` has dark mode support via `@media (prefers-color-scheme: dark)`
- `templates/base/template.njk` generates the HTML structure
- Playwright is available as optional dependency for testing

Design approach:
- Add toggle button fixed in corner (not in print output)
- Use `data-theme="light|dark|system"` attribute on html element
- CSS uses attribute selectors to apply themes
- System preference respects media query, others override it
- Persist choice in localStorage

## Tasks

### Task 1: Add theme toggle to template and CSS

**Files:** `templates/base/template.njk`, `templates/base/styles.css`

**Action:**
1. In `template.njk`, add a theme toggle button inside the body (after cv-page div):
   - Button with sun/moon/auto icons using SVG or Unicode characters
   - Positioned fixed in top-right corner
   - Hidden in print via CSS
   - Includes inline JavaScript for toggle logic:
     - Read theme from localStorage on load
     - Cycle through: system -> light -> dark -> system
     - Apply `data-theme` attribute to `<html>` element
     - Persist choice to localStorage

2. In `styles.css`:
   - Move dark mode colors from `@media` query to `[data-theme="dark"]` selector
   - Add `[data-theme="light"]` selector for explicit light mode
   - Keep `@media (prefers-color-scheme: dark)` for system mode fallback when `data-theme="system"`
   - Add `.theme-toggle` button styles (fixed position, no-print)
   - Add transition for smooth color changes

**Verify:**
- `bun run lint` passes
- Generated HTML contains theme toggle button
- Button not visible in print preview

**Done:** Toggle button renders in HTML output with working JavaScript.

### Task 2: Write playwright tests for theme toggle

**Files:** `tests/theme-toggle.spec.ts`

**Action:**
1. Create `tests/` directory if not exists
2. Write playwright test file that:
   - Serves the generated HTML file from `people/testuser/output/testuser_base_en.html`
   - Test: Initial load follows system preference (check computed styles)
   - Test: Click toggle cycles to explicit light mode
   - Test: Click toggle cycles to dark mode
   - Test: Click toggle returns to system mode
   - Test: Theme persists after page reload (using localStorage)
   - Test: System preference change is reflected when in system mode (use `page.emulateMedia`)

3. Use assertions on:
   - `document.documentElement.dataset.theme` attribute value
   - Computed background color of body element
   - localStorage value

**Verify:**
- `npx playwright test tests/theme-toggle.spec.ts` passes
- Test covers system preference emulation via `page.emulateMedia({ colorScheme: 'dark' })` and `page.emulateMedia({ colorScheme: 'light' })`

**Done:** All playwright tests pass, covering toggle click behavior, persistence, and system preference changes.

### Task 3: Regenerate test HTML and verify manually

**Files:** `people/testuser/output/testuser_base_en.html`

**Action:**
1. Rebuild the test HTML to include the new toggle: `bun run packages/cli/src/index.ts build people/testuser/cv.md --output people/testuser/output/`
2. Take screenshots with playwright showing:
   - Light mode (toggle clicked to light)
   - Dark mode (toggle clicked to dark)
   - System mode following preference

**Verify:**
- Screenshots show toggle button in corner
- Screenshots show distinct light/dark themes
- Toggle button not in screenshot area (or hidden) when using print emulation

**Done:** Test HTML regenerated with working toggle, visual verification complete.

## Verification

- [ ] Theme toggle button visible in generated HTML
- [ ] Click cycles through: system -> light -> dark -> system
- [ ] Theme persists in localStorage across page reload
- [ ] System preference respected when in "system" mode
- [ ] Toggle hidden in print output
- [ ] `bun run lint` passes
- [ ] Playwright tests pass: `npx playwright test tests/theme-toggle.spec.ts`

## Notes

- Use data attributes instead of class names for cleaner separation
- System mode should be the default (no localStorage = system preference)
- Toggle icon should indicate current mode (sun for light, moon for dark, auto/system icon for system)
- Consider accessibility: button should have aria-label describing current state
