---
phase: 10-print-css-consolidation
plan: 01
subsystem: templates
tags: [css, print, consolidation, maintenance, render]

# Dependency graph
requires: [09-test-infrastructure-foundation]
provides:
  - Single source of truth for print CSS in _shared/partials/_print.css
  - Print CSS loading in render.ts (PRINT-02)
  - Template styles.css files contain only screen CSS
affects: [10-02, 11-css-pagination, 12-print-parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-time CSS concatenation for shared partials"

key-files:
  created: []
  modified:
    - packages/templates/src/render.ts
    - templates/base/styles.css
    - templates/modern/styles.css
    - templates/minimal/styles.css
    - templates/classic/styles.css

key-decisions:
  - "Print CSS loaded AFTER template CSS for correct cascade order"
  - "Use path.join for cross-platform path handling"
  - "Apply changes to both renderCV and createRenderer functions"

patterns-established:
  - "Shared CSS partials loaded via render.ts concatenation"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 10 Plan 01: Print CSS Consolidation Summary

**Consolidated print CSS from 3 duplicate locations into single source of truth (_print.css), eliminating 238 lines of duplicated CSS across 4 template files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-23
- **Completed:** 2026-01-23
- **Tasks:** 2
- **Files created:** 0
- **Files modified:** 5
- **Lines removed:** 238 (duplicated print CSS)

## Accomplishments

### Task 1: Modified render.ts to load _print.css

- Added `path` import from `node:path` for path joining
- Added `_print.css` loading in `renderCV` function after baseCss
- Added `_print.css` loading in `createRenderer` function after baseCss
- Updated CSS concatenation: `styleOverrides -> baseCss -> printCss`
- Correct cascade order ensures print CSS can override template rules

### Task 2: Removed print CSS from all template styles.css files

- Removed `@page` rule and `@media print` block from base/styles.css (61 lines)
- Removed `@page` rule and `@media print` block from modern/styles.css (59 lines)
- Removed `@page` rule and `@media print` block from minimal/styles.css (59 lines)
- Removed `@page` rule and `@media print` block from classic/styles.css (59 lines)
- Total: 238 lines of duplicated CSS removed

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | Load shared print CSS in render.ts | 7961c85 | feat |
| 2 | Remove duplicated print CSS from template styles | 7e84b2f | refactor |

## Files Modified

| File | Changes |
|------|---------|
| `packages/templates/src/render.ts` | +13 lines: path import, printCss loading in both functions |
| `templates/base/styles.css` | -61 lines: removed @page and @media print block |
| `templates/modern/styles.css` | -59 lines: removed @page and @media print block |
| `templates/minimal/styles.css` | -59 lines: removed @page and @media print block |
| `templates/classic/styles.css` | -59 lines: removed @page and @media print block |

## Architecture Change

**Before (3 locations with drift):**
```
templates/_shared/partials/_print.css  (unused, 85 lines)
templates/*/styles.css                 (duplicated print CSS, ~60 lines each)
packages/cli/.../pdf-generator.ts      (ATS_PRINT_CSS, pagination rules + ATS rules)
```

**After (1 source of truth):**
```
templates/_shared/partials/_print.css  (ALL print rules, loaded by render.ts)
templates/*/styles.css                 (screen CSS only, NO print rules)
packages/cli/.../pdf-generator.ts      (ATS_PRINT_CSS - unchanged, pending 10-02)
```

## CSS Cascade Order

The final CSS cascade order is now:
1. `styleOverrides` - User/global config CSS variables
2. `baseCss` - Template screen styles
3. `printCss` - Shared print styles from _print.css

This order ensures print CSS can override any template-specific rules while preserving the ability to customize via style overrides.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification checks passed:

| Check | Result |
|-------|--------|
| `grep -r "@media print" templates/*/styles.css` | No matches (PASS) |
| `grep -r "@page" templates/*/styles.css` | No matches (PASS) |
| `grep "_print.css" packages/templates/src/render.ts` | 2 matches (PASS) |
| `bun run typecheck` | Success (PASS) |

## Benefits Achieved

1. **Single source of truth:** All print CSS changes now happen in one file
2. **No drift:** Template styles cannot accidentally diverge in print behavior
3. **Easier maintenance:** Future print CSS improvements (Phase 11 pagination) only need to modify _print.css
4. **Cleaner templates:** Template styles.css files focus on screen presentation only
5. **Correct _print.css usage:** The partial that existed but was unused is now properly loaded

## Next Steps

- **10-02:** Simplify ATS_PRINT_CSS in pdf-generator.ts (remove duplicated pagination rules, keep only ATS-specific ligature and color-scheme rules)
- **Phase 11:** Enhance _print.css with improved pagination rules (PAG-01 through PAG-07)

---
*Phase: 10-print-css-consolidation*
*Completed: 2026-01-23*
