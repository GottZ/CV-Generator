---
phase: quick
plan: 005
type: fix
autonomous: true
---

# Quick Task 005: Fix System Dark Mode CSS Differences

## Objective

Align system dark mode CSS (via `prefers-color-scheme: dark`) with explicit dark mode CSS (`data-theme="dark"`) to ensure visual consistency.

## Problem

System dark mode and explicit dark mode had visual differences:
1. Body background selector was broken (using invalid `:has()` pattern)
2. `.skill` background rule was missing for system dark mode

## Tasks

1. **Fix system dark mode body background selector**
   - Replace invalid `body:has(:root:not([data-theme="light"]))` with `:root:not([data-theme="light"]) body`

2. **Add system dark mode .skill rule**
   - Add `:root:not([data-theme="light"]) .skill { background: var(--color-surface); }` inside the media query

## Files Modified

- `templates/base/styles.css`

## Verification

- Rebuild HTML output
- System dark mode should match explicit dark mode visually
