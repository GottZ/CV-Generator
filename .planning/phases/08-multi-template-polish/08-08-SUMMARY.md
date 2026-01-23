---
phase: 08-multi-template-polish
plan: 08
subsystem: pdf
tags: [css, print, pagination, puppeteer, pdf]

# Dependency graph
requires:
  - phase: 08-multi-template-polish
    provides: All templates with print styles that needed pagination fixes
provides:
  - Improved PDF pagination with orphans/widows rules
  - Sections that can span pages instead of forcing breaks
  - Consistent print styles across all templates
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS pagination: sections break-inside: auto with orphans/widows"
    - "CSS pagination: section headers break-after: avoid"
    - "CSS pagination: entries break-inside: avoid for atomic units"

key-files:
  created: []
  modified:
    - templates/_shared/partials/_print.css
    - packages/cli/src/lib/pdf-generator.ts
    - templates/modern/styles.css
    - templates/minimal/styles.css
    - templates/classic/styles.css
    - templates/base/styles.css

key-decisions:
  - "sections-span-pages: Allow sections to span pages (break-inside: auto) instead of forcing to new page"
  - "orphans-widows-3: Use orphans: 3 and widows: 3 to prevent single lines at page boundaries"
  - "entries-stay-intact: Individual entries still avoid breaking mid-entry"
  - "section-headers-with-content: Section h2 uses break-after: avoid to stay with following content"

patterns-established:
  - "Print pagination: Sections break-inside: auto; entries break-inside: avoid"
  - "Orphan/widow control: orphans: 3; widows: 3 for readability"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 8 Plan 8: PDF Pagination Gap Closure Summary

**Improved PDF pagination with smarter CSS break rules - sections span pages naturally, entries stay intact, orphans/widows prevent single-line page boundaries**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-23T10:38:00Z
- **Completed:** 2026-01-23T10:46:00Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Fixed empty last page issue caused by aggressive page-break-inside: avoid
- Sections now span pages naturally instead of being pushed to new pages
- Added orphans/widows rules to prevent single lines at page boundaries
- Maintained entry integrity (entries still avoid mid-entry breaks)
- Consistent pagination rules across all templates and ATS_PRINT_CSS

## Task Commits

Each task was committed atomically:

1. **Task 1: Update shared print CSS partial** - `b31b205` (fix)
2. **Task 2: Update ATS_PRINT_CSS in pdf-generator.ts** - `53c0083` (fix)
3. **Task 3: Update all template print styles** - `3da1322` (fix)
4. **Task 4: Regenerate example outputs** - `3161371` (docs)

## Files Created/Modified

- `templates/_shared/partials/_print.css` - Shared print styles with improved pagination
- `packages/cli/src/lib/pdf-generator.ts` - ATS_PRINT_CSS constant with pagination rules
- `templates/modern/styles.css` - Modern template print section updated
- `templates/minimal/styles.css` - Minimal template print section updated
- `templates/classic/styles.css` - Classic template print section updated
- `templates/base/styles.css` - Base template print section updated

## Decisions Made

- **sections-span-pages:** Changed sections from `break-inside: avoid` to `break-inside: auto` to allow natural page spanning. This prevents empty last pages and excessive gaps.
- **orphans-widows-3:** Added `orphans: 3` and `widows: 3` to prevent single lines at page boundaries for better readability.
- **section-headers-with-content:** Section h2 elements use `break-after: avoid` to ensure headers stay with at least some of their content.
- **bullet-lists-can-break:** Bullet lists can break between items, but individual bullet items stay intact.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - CSS updates applied cleanly to all templates.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PDF pagination issues resolved
- All templates have consistent print behavior
- Example outputs regenerated with improved pagination
- Project remains complete with improved PDF quality

---
*Phase: 08-multi-template-polish*
*Completed: 2026-01-23*
