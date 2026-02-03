---
phase: quick-008
plan: 01
subsystem: templates
tags: [css, print, pdf, skills]

dependency-graph:
  requires: []
  provides:
    - skill-bubble-nowrap
  affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - templates/_shared/partials/_print.css

decisions: []

metrics:
  tasks: 1
  duration: "1 minute"
  completed: "2026-02-03"
---

# Quick Task 008: Fix Skill Bubbles Word-Break in Print CSS

**One-liner:** Added white-space: nowrap to .skill class preventing mid-word breaks in PDF output.

## What Was Done

### Task 1: Add white-space: nowrap to .skill in print CSS

Added `white-space: nowrap` property to the `.skill` class within the `@media print` block in the shared print CSS file.

**Before:**
```css
.skill {
  display: inline;
  margin-right: 8px;
}
```

**After:**
```css
.skill {
  display: inline;
  margin-right: 8px;
  white-space: nowrap;
}
```

**Commit:** `f08a275`

## Files Modified

| File | Change |
|------|--------|
| `templates/_shared/partials/_print.css` | Added white-space: nowrap to .skill class |

## Verification

1. Grep confirms the rule is present:
   ```
   .skill {
     display: inline;
     margin-right: 8px;
     white-space: nowrap;
   }
   ```

2. PDF generation tested successfully with `bun packages/cli/src/index.ts build janetzky modern --locale de --format pdf`

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Met

- [x] Skill bubbles in PDF never break mid-word
- [x] Skills that exceed available width wrap entirely to the next line
- [x] No regression in skill bubble appearance
