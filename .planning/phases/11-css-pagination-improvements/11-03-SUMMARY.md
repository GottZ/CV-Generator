---
phase: 11-css-pagination-improvements
plan: 03
subsystem: pdf-generation
tags: [visual-regression, pagination, two-pass, pdf-lib]

dependency-graph:
  requires: [11-01, 11-02]
  provides: [VISUAL-BASELINES, TWO-PASS-PDF]
  affects: [pdf-output-quality]

tech-stack:
  patterns: [two-pass-generation, content-analysis, css-injection]

key-files:
  modified:
    - templates/_shared/partials/_print.css
    - packages/cli/src/lib/pdf-generator.ts
    - tests/pdf-modern.spec.ts-snapshots/modern-multi-page-chromium-linux.png
    - tests/pdf-minimal.spec.ts-snapshots/minimal-multi-page-chromium-linux.png
    - tests/pdf-classic.spec.ts-snapshots/classic-multi-page-chromium-linux.png

decisions:
  - id: page-margin-fix
    choice: Set @page { margin: 20mm 0 } with @page :first { margin-top: 0 }
    rationale: Browser needs to know about Puppeteer footer space for proper page break calculation; first page has no header
  - id: two-pass-generation
    choice: Analyze page distribution after first pass, redistribute if last page sparse
    rationale: CSS-only solutions cannot detect near-empty last pages; two-pass allows runtime optimization
  - id: sparse-threshold
    choice: 20% of average page content triggers redistribution
    rationale: Catches pages with just 1-2 small entries while avoiding false positives

metrics:
  duration: ~45 minutes (including debugging)
  completed: 2026-01-25
---

# Phase 11 Plan 03: Visual Regression Baselines Summary

**One-liner:** Updated visual regression baselines, fixed @page margins for proper page break calculation, and implemented two-pass PDF generation to detect and fix near-empty last pages.

## What Was Done

### Task 1: Run visual regression tests
Initial tests showed pagination changes from 11-01 and 11-02 affected multi-page snapshots as expected.

### Task 2: Update visual regression baselines
Updated all 6 baseline snapshots using Docker for consistency.

**Commit:** 484244f

### Task 3: Verify tests pass
All 24 Playwright tests pass with updated baselines.

### Task 4: Human verification (with fixes)

Human verification revealed three issues:

1. **Footer overlap**: Content was overlapping "Page X of Y" footer
2. **First page margin**: Excessive top margin (~45mm) from @page margin adding to template padding
3. **Near-empty last page**: Only 1 certification entry on final page

**Fixes applied:**

#### Fix 1: @page margin for footer space (commit 98dc06a)
```css
@page {
  size: A4 portrait;
  margin: 20mm 0;  /* Match Puppeteer header/footer margins */
}
```

#### Fix 2: First page margin exception (commit 06ef7f9)
```css
@page :first {
  margin-top: 0;  /* No header on first page */
}
```

#### Fix 3: Two-pass PDF generation (commit 06ef7f9)
Added to `packages/cli/src/lib/pdf-generator.ts`:
- `analyzePageDistribution()`: Uses pdf-lib to compare content stream sizes
- Detects if last page is <20% of average content
- If sparse, injects `REDISTRIBUTION_CSS` with extra section/entry margins
- Regenerates PDF with better content distribution

## Deviations from Plan

- **Added @page margin fixes**: Not in original plan, discovered during human verification
- **Added two-pass PDF generation**: Not in original plan, implemented to fix near-empty last page issue
- **Multiple verification rounds**: Required 3 iterations to resolve all pagination issues

## Verification Results

| Check | Status |
|-------|--------|
| Visual regression tests pass | PASS |
| Footer text not overlapped | PASS (after fix) |
| First page margin correct | PASS (after fix) |
| Near-empty last page handled | PASS (two-pass) |
| Human verification approved | PASS |

## Root Cause Analysis

**Footer overlap issue:**
- CSS `@page { margin: 0 }` told browser no page margins
- Puppeteer reserved 20mm for footer AFTER page layout
- Browser calculated breaks at wrong boundary

**First page margin issue:**
- `@page { margin: 20mm 0 }` applied to ALL pages
- First page doesn't need top margin (no header content)
- Template padding (25mm) + @page margin (20mm) = 45mm total

**Near-empty last page:**
- CSS break-inside: avoid pushes entire entries to next page
- No CSS mechanism to detect page fill percentage
- Requires runtime analysis and redistribution

## Files Changed

| File | Change |
|------|--------|
| templates/_shared/partials/_print.css | Added @page :first rule, updated margin comment |
| packages/cli/src/lib/pdf-generator.ts | Added analyzePageDistribution(), REDISTRIBUTION_CSS, two-pass logic |
| tests/pdf-*-snapshots/*.png | Regenerated 6 baseline images |

## Next Steps

Phase 11 plan 03 complete. Ready for phase verification to confirm all PAG-01 to PAG-07 requirements are met.
