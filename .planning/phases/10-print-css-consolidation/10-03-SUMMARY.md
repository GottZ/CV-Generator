---
phase: 10-print-css-consolidation
plan: 03
subsystem: print-css
tags: [css, margins, visual-regression, gap-closure]
gaps_addressed: [1, 2]
source: 10-UAT.md

dependency-graph:
  requires: [10-01, 10-02]
  provides: [PRINT-CSS-MARGINS]
  affects: [visual-regression-baselines]

tech-stack:
  patterns: [css-cascade, print-media]

key-files:
  modified:
    - templates/_shared/partials/_print.css
    - tests/pdf-modern.spec.ts-snapshots/modern-single-page-chromium-linux.png
    - tests/pdf-modern.spec.ts-snapshots/modern-multi-page-chromium-linux.png
    - tests/pdf-classic.spec.ts-snapshots/classic-single-page-chromium-linux.png
    - tests/pdf-classic.spec.ts-snapshots/classic-multi-page-chromium-linux.png
    - tests/pdf-minimal.spec.ts-snapshots/minimal-single-page-chromium-linux.png
    - tests/pdf-minimal.spec.ts-snapshots/minimal-multi-page-chromium-linux.png

decisions:
  - id: remove-print-padding
    choice: Remove padding:0 from print CSS
    rationale: Puppeteer margins only apply during PDF generation; HTML print preview needs CSS padding

metrics:
  duration: ~10 minutes
  completed: 2026-01-24
---

# Phase 10 Plan 03: Fix Page Margins in Print CSS Summary

**One-liner:** Removed erroneous `padding: 0` from print CSS to restore template page margins in visual regression tests and HTML print preview.

## What Was Done

### Task 1: Remove padding: 0 from _print.css

Edited `templates/_shared/partials/_print.css` to remove lines 17-18:
```css
/* Removed: */
/* Remove padding for print - Puppeteer margins handle page spacing */
padding: 0;
```

The `.cv-page` rule now preserves the template's `padding: var(--page-margin)` setting in print media, which provides 20-30mm margins depending on template.

**Commit:** 7f8c280

### Task 2: Regenerate visual regression baselines

Updated all 6 visual regression baseline snapshots using Docker for consistency:
- modern-single-page-chromium-linux.png
- modern-multi-page-chromium-linux.png
- classic-single-page-chromium-linux.png
- classic-multi-page-chromium-linux.png
- minimal-single-page-chromium-linux.png
- minimal-multi-page-chromium-linux.png

All baselines now show proper page margins (visible white space around content).

**Commit:** c95eea2

### Task 3: Verification

Verified the fix by:
1. Confirming `padding: 0` no longer appears in _print.css
2. Checking generated HTML output has correct print CSS (no padding override)
3. Visual inspection of new baseline screenshots shows proper margins
4. Running visual regression tests without --update-snapshots: 24/24 pass

## Root Cause Analysis

The `padding: 0` line was added with a misleading comment: "Puppeteer margins handle page spacing". This was incorrect because:
1. Puppeteer margins only apply during PDF generation via Puppeteer
2. HTML print preview (browser Ctrl+P) needs CSS padding for margins
3. Visual regression tests use HTML with print media emulation, not Puppeteer

The fix allows the template's `--page-margin` CSS variable to control padding in all contexts.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| `padding: 0;` removed from _print.css | PASS |
| Visual regression baselines regenerated | PASS |
| All 24 Playwright tests pass | PASS |
| HTML output has correct print CSS | PASS |

## UAT Gaps Addressed

- **Gap 1:** Page margins not showing in visual regression snapshots - FIXED
- **Gap 2:** Content extending to edges with no padding - FIXED

## Files Changed

| File | Change |
|------|--------|
| templates/_shared/partials/_print.css | Removed `padding: 0;` (2 lines) |
| tests/pdf-*-snapshots/*.png | Regenerated 6 baseline images |

## Next Steps

Phase 10 gap closure complete. Ready to re-run UAT verification and proceed to Phase 11 (CSS Pagination Improvements) if all criteria pass.
