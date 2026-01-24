---
phase: 10-print-css-consolidation
plan: 02
subsystem: cli
tags: [css, print, ats, puppeteer, consolidation]

# Dependency graph
requires: [10-01]
provides:
  - Simplified ATS_PRINT_CSS with only ATS-specific rules
  - Complete print CSS consolidation (PRINT-02)
  - Single source of truth for all print CSS
affects: [11-css-pagination, 12-print-parity, 13-full-test-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ATS-specific CSS injected at runtime, pagination CSS at build time"

key-files:
  created: []
  modified:
    - packages/cli/src/lib/pdf-generator.ts
    - tests/pdf-modern.spec.ts
    - tests/pdf-minimal.spec.ts
    - tests/pdf-classic.spec.ts
    - Dockerfile.test

key-decisions:
  - "ATS_PRINT_CSS contains only ligature and color-scheme rules"
  - "Pagination rules handled exclusively by _print.css"
  - "Playwright test.describe.configure() must be inside describe blocks (v1.57+ requirement)"

patterns-established:
  - "Runtime CSS injection for ATS rules, build-time loading for pagination"

# Metrics
duration: 15min
completed: 2026-01-24
---

# Phase 10 Plan 02: ATS_PRINT_CSS Simplification Summary

**Simplified ATS_PRINT_CSS from 51 lines to 14 lines by removing duplicated pagination rules, completing the print CSS consolidation**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-24
- **Completed:** 2026-01-24
- **Tasks:** 3
- **Files created:** 0
- **Files modified:** 5
- **Lines removed:** 40 (duplicated pagination CSS)

## Accomplishments

### Task 1: Simplified ATS_PRINT_CSS to only ATS-specific rules

- Removed all pagination rules from ATS_PRINT_CSS:
  - `.section` rules (break-inside, orphans, widows)
  - `.section h2` rules (break-after)
  - `.entry` rules (break-inside)
  - `.bullet-item` rules (break-inside)
  - `.contact` rules (break-inside, break-after)
  - `.theme-toggle` rules (display: none)
- Kept only ATS-specific rules:
  - `font-variant-ligatures: none` for text extraction
  - `font-feature-settings: "liga" 0, "clig" 0` for ligature disabling
  - `color-scheme: light` for forcing light mode in PDF
- Reduced ATS_PRINT_CSS from 51 lines to 14 lines

### Task 2: Verified consolidation through visual regression tests

- Ran all Playwright visual regression tests in Docker
- Updated baseline snapshots for all 6 templates (2 per theme: single-page, multi-page)
- All 24 Playwright tests and 21 Bun tests pass

### Task 3: Manual verification checkpoint

- Verified HTML screen display shows correct styling
- Verified print preview shows proper pagination
- Verified PDF output is visually correct and text-selectable
- Confirmed single source of truth: no print CSS in template styles.css files

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | Simplify ATS_PRINT_CSS to only ATS-specific rules | 29d1f62 | refactor |
| 2 | Update visual regression baselines | 46d26c4 | test |
| fix | Fix Playwright test configuration | d35e7ee | fix |

## Files Modified

| File | Changes |
|------|---------|
| `packages/cli/src/lib/pdf-generator.ts` | -40 lines: removed pagination rules from ATS_PRINT_CSS |
| `tests/pdf-modern.spec.ts` | Moved test.describe.configure() inside describe block |
| `tests/pdf-minimal.spec.ts` | Moved test.describe.configure() inside describe block |
| `tests/pdf-classic.spec.ts` | Moved test.describe.configure() inside describe block |
| `Dockerfile.test` | Separated bun and Playwright test runs |

## Architecture Result

**Complete print CSS architecture after Phase 10:**

```
templates/_shared/partials/_print.css  (ALL pagination rules, loaded by render.ts)
templates/*/styles.css                 (screen CSS only, NO print rules)
packages/cli/.../pdf-generator.ts      (ATS_PRINT_CSS - ligatures + color-scheme only)
```

**CSS injection timeline:**
1. Build time: `_print.css` loaded by render.ts after template CSS
2. Runtime (PDF only): `ATS_PRINT_CSS` injected by Puppeteer before PDF generation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Playwright test configuration**

- **Found during:** Task 2 visual regression tests
- **Issue:** Playwright 1.57+ requires `test.describe.configure()` to be inside describe blocks
- **Fix:** Moved configuration calls into the describe blocks in all test files
- **Files modified:** tests/pdf-*.spec.ts, Dockerfile.test
- **Commit:** d35e7ee

## Verification Results

All verification checks passed:

| Check | Result |
|-------|--------|
| `grep -c ".section\|.entry\|.bullet" pdf-generator.ts` | 0 (PASS) |
| `grep "font-variant-ligatures" pdf-generator.ts` | Found (PASS) |
| Docker visual regression tests | All 24 tests pass (PASS) |
| Bun unit tests | All 21 tests pass (PASS) |
| Manual HTML/PDF verification | Approved (PASS) |
| `grep -r "@media print" templates/*/styles.css` | No matches (PASS) |

## Benefits Achieved

1. **Clean separation of concerns:**
   - Pagination CSS: `_print.css` (loaded at build time)
   - ATS-specific CSS: `ATS_PRINT_CSS` (injected at PDF generation)

2. **Reduced duplication:** Total 278 lines of duplicated CSS removed across Phase 10
   - 10-01: 238 lines removed from template styles.css files
   - 10-02: 40 lines removed from ATS_PRINT_CSS

3. **Easier maintenance:** Future pagination improvements only modify `_print.css`

4. **Clear purpose:** ATS_PRINT_CSS now clearly documents its ATS-specific purpose

## Next Steps

- **Phase 11:** Improve pagination rules in `_print.css` (PAG-01 through PAG-07)
- **Phase 12:** Verify print/PDF parity (PRINT-01, PRINT-05)
- **Phase 13:** Complete full test suite (TEST-01 through TEST-08)

---
*Phase: 10-print-css-consolidation*
*Completed: 2026-01-24*
