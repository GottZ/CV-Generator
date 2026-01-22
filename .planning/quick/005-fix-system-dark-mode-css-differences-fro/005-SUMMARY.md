# Quick Task 005: Fix System Dark Mode CSS Summary

**Completed:** 2026-01-22
**Duration:** ~2 minutes

## One-liner

Fixed system dark mode CSS to match explicit dark mode by correcting body background selector and adding missing .skill rule.

## What Was Fixed

### Problem

System dark mode (via `@media (prefers-color-scheme: dark)`) had two issues:
1. **Invalid body selector**: Used `body:has(:root:not([data-theme="light"]))` which doesn't work (`:root` is an ancestor of `body`, not a descendant)
2. **Missing .skill rule**: Skill pills didn't get the dark surface color in system dark mode

### Solution

Updated `templates/base/styles.css`:

**Before:**
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) body,
  body:has(:root:not([data-theme="light"])) {
    background: #111827;
  }
}
```

**After:**
```css
@media (prefers-color-scheme: dark) {
  /* Body background for system dark mode */
  :root:not([data-theme="light"]) body {
    background: #111827;
  }

  /* Skill pills for system dark mode */
  :root:not([data-theme="light"]) .skill {
    background: var(--color-surface);
  }
}
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| bc5d0e9 | fix | Align system dark mode CSS with explicit dark mode |

## Verification

- [x] Linter passes
- [x] HTML rebuild successful
- [x] System dark mode now has same body background as explicit dark mode
- [x] System dark mode now has same skill pill styling as explicit dark mode

## Parity Check

| Property | System Dark | Explicit Dark |
|----------|-------------|---------------|
| CSS Variables | ✓ identical | ✓ identical |
| Body background | #111827 | #111827 |
| .skill background | var(--color-surface) | var(--color-surface) |
