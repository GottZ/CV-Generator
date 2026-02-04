---
phase: quick-021
plan: 01
subsystem: rendering
tags: [css, print, skills, spacing]

dependency-graph:
  requires: []
  provides: [skill-list-vertical-spacing]
  affects: []

tech-stack:
  added: []
  patterns: [line-height-for-inline-vertical-rhythm]

key-files:
  created: []
  modified:
    - templates/_shared/partials/_print.css

decisions:
  - id: QT021-D1
    choice: "line-height: 2.2 for vertical rhythm"
    rationale: "On 10pt text, 2.2 line-height creates ~12pt between baselines providing comfortable spacing similar to screen flex gap"

metrics:
  duration: <1min
  completed: 2026-02-04
---

# Quick Task 021: Fix Skill Pills Vertical Padding in Print

**One-liner:** Added line-height to `.skill-list` for vertical spacing between wrapped skill pill rows in PDF output.

## What Was Done

### Task 1: Add line-height to .skill-list in print CSS

Added `line-height: 2.2` to the `.skill-list` rule in the print CSS media query. This provides vertical spacing between rows when skill pills wrap to multiple lines.

**Before:**
```css
.skill-list {
  display: block;
}
```

**After:**
```css
.skill-list {
  display: block;
  line-height: 2.2;
}
```

**Rationale:** The screen CSS uses `gap: var(--spacing-sm)` (10px) for flex spacing, but in print CSS the layout converts to `display: block` with inline `.skill` children. Since margin-top/margin-bottom don't apply to inline elements, line-height on the container is the correct technique for creating vertical rhythm.

## Commits

| Hash | Message |
|------|---------|
| e25ee3a | fix(quick-021): add line-height to skill-list for vertical spacing in print |

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

- `templates/_shared/partials/_print.css` - Added line-height property to `.skill-list` print rule

## Verification

- [x] `line-height` added to `.skill-list` in `@media print` section
- [x] Syntax valid - CSS file parses without errors (Biome check passed)
- [x] PDF generation works with skills section (janetzky modern template)
- [x] Skill pills visually have spacing between rows
