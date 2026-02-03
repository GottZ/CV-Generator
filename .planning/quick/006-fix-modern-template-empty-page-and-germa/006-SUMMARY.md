---
plan: 006
type: quick
scope: bugfix
subsystem: templates
completed: 2026-02-03
duration: 5m

tech-stack:
  patterns:
    - i18n filter pattern for Nunjucks templates
    - Multi-language regex patterns for markdown parsing

key-files:
  modified:
    - packages/templates/src/i18n/de.ts
    - packages/templates/src/i18n/en.ts
    - packages/templates/src/i18n/index.ts
    - packages/templates/src/engine/filters.ts
    - templates/_shared/macros/entry.njk
    - templates/base/template.njk
    - templates/_shared/partials/_print.css
    - packages/core/src/parser/cv-parser.ts
---

# Quick Task 006: Fix Modern Template Empty Page and German Localization Summary

**One-liner:** German CV job titles now show "bei" instead of "at", parser supports both languages, and print CSS prevents empty trailing pages.

## What Was Done

### Task 1: Add Localized "at" Filter for Job Titles

- Added `roleAt` key to English translations (`at`)
- Added `roleAt` key to German translations (`bei`)
- Created `getLocalizedText()` function for general i18n (beyond section headers)
- Added `i18n` filter to Nunjucks for template use
- Renamed `sectionHeaders` to `translations` (kept alias for backward compatibility)

### Task 2: Update Templates to Use Localized "at" Text

- Updated `entry.njk` macro to use `{{ 'roleAt' | i18n(locale) }}`
- Updated `base/template.njk` to use the same pattern
- **Bug discovered and fixed:** Parser only matched "at" (English), not "bei" (German)
- Fixed parser regex from `/at/` to `/(?:at|bei)/` for both experience and education entries

### Task 3: Fix Modern Template Empty Trailing Page

- Added CSS rules to remove margin-bottom from last section in print media
- Added CSS rules to remove padding-bottom from last section
- Added CSS rules to remove margin-bottom from last entry in last section
- Added padding-bottom: 0 to .cv-page in print (additional fix after verification)
- These rules prevent empty page overflow caused by trailing whitespace

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Parser didn't support German "bei" separator**

- **Found during:** Task 2 verification
- **Issue:** Parser regex at line 178 only matched "at", causing German job titles to parse incorrectly (entire header became role, empty company)
- **Fix:** Changed regex from `/^###\s+(.+?)\s+at\s+(.+)$/i` to `/^###\s+(.+?)\s+(?:at|bei)\s+(.+)$/i`
- **Files modified:** packages/core/src/parser/cv-parser.ts
- **Commit:** ad280f3 (included in Task 2 commit)

## Test Results

- TypeScript compilation: PASS (templates and core packages)
- Unit tests: 86 pass, 0 fail
- German HTML verification: Job titles show "bei" correctly
- English HTML verification: Job titles show "at" correctly

## Commits

| Hash | Message |
|------|---------|
| 9948a5a | feat(006): add i18n filter for localized job title preposition |
| ad280f3 | fix(006): use localized job title preposition in templates |
| bbec5c1 | fix(006): prevent empty trailing page in PDF output |
| fc814d7 | fix(006): remove cv-page padding-bottom in print to prevent empty page |

## Verification Notes

- PDF generation verified with Puppeteer/Chrome
- German PDF: 8 pages with content (was 9 with empty last page)
- English PDF: 8 pages with content
- German HTML: Job titles show "bei" correctly
- English HTML: Job titles show "at" correctly
