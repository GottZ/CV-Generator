# Quick Task 003: Fix dark theme background and clean up playwright dependency

## Task Description

Fix the dark mode example having a bright background behind the page, and clean up playwright dependency (should be optional dev dependency for testing via Claude Code).

## Tasks

1. **Reset bad commit** - Reset the previous commit that didn't follow project guidelines
2. **Fix dark mode CSS** - Add proper body background color for dark mode so the viewport background is dark
3. **Move playwright to optionalDependencies** - Playwright is only used for visual testing via Claude Code, not a runtime dependency
4. **Verify with screenshots** - Use playwright to take light/dark mode screenshots to confirm fix
5. **Clean up artifacts** - Remove temporary screenshot files

## Verification

- Dark mode screenshot shows dark background surrounding the CV page
- Light mode screenshot shows light gray background as before
- Playwright in optionalDependencies, not dependencies
- No temporary files left in repo
