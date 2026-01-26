---
phase: 18-wizard-foundation
plan: 03
subsystem: wizard
tags: [inquirer, education, skills, prompts, validation]

# Dependency graph
requires:
  - phase: 18-01
    provides: "Wizard infrastructure (types, validation, state)"
provides:
  - "Education prompt flow with institution, degree, field, dates"
  - "Skills by category prompt flow with proficiency levels"
  - "Add another pattern for multiple entries"
affects: [18-05, wizard-command]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "collectSection + collectSingleEntry pattern for multiple entries"
    - "Quick vs detailed mode conditional prompts"
    - "Comma-separated input parsing for skills"

key-files:
  created:
    - packages/cli/src/wizard/prompts/education.ts
    - packages/cli/src/wizard/prompts/skills.ts
  modified:
    - packages/cli/src/wizard/prompts/index.ts

key-decisions:
  - "Education end date required (no 'present' for education)"
  - "Skills entered as comma-separated list for faster input"
  - "Proficiency levels optional and only in detailed mode"
  - "CommonCategoryValue type for type-safe category selection"

patterns-established:
  - "Add another loop: collect first entry, then confirm loop for more"
  - "Category selection: quick mode uses select, detailed mode uses input"
  - "Skill entry: comma-separated parsing with optional per-skill attributes"

# Metrics
duration: 7min
completed: 2026-01-26
---

# Phase 18 Plan 03: Education and Skills Prompts Summary

**Education and skills prompt flows with validation, mode-aware field collection, and add-another patterns for multiple entries**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-26T11:50:10Z
- **Completed:** 2026-01-26T11:57:08Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Education prompt flow handles all Education schema fields (institution, degree, field, startDate, endDate, location, honors, notes)
- Skills organized by category with common options (Languages, Frameworks, Databases, Cloud, Tools) or custom input
- Quick mode skips optional fields; detailed mode prompts for all including proficiency levels
- Multiple entries via "add another" confirmation loop
- Comma-separated skill entry for fast input

## Task Commits

Each task was committed atomically:

1. **Task 1: Create education prompt flow** - `33c4e89` (feat)
2. **Task 2: Create skills prompt flow by category** - `85bd15d` (feat)

## Files Created/Modified

- `packages/cli/src/wizard/prompts/education.ts` - Education collection with institution, degree, dates, optional honors/notes
- `packages/cli/src/wizard/prompts/skills.ts` - Skills by category with proficiency levels
- `packages/cli/src/wizard/prompts/index.ts` - Updated exports for education and skills

## Decisions Made

1. **Education end date required** - Unlike experience (which can be "present"), education end dates are required since ongoing education is less common for job seekers
2. **Skills as comma-separated list** - Faster input than prompting for each skill individually; proficiency levels added per-skill only if user opts in
3. **CommonCategoryValue type** - Extracted type union for category values to ensure type-safe select default matching
4. **Proficiency levels optional** - Only prompted in detailed mode and only if user confirms wanting levels (keeps quick mode fast)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Education and skills prompts complete core CV sections
- Ready for 18-04 (Projects and Certifications) and 18-05 (Wizard Flow Integration)
- All prompt flows follow consistent patterns from 18-02

---
*Phase: 18-wizard-foundation*
*Completed: 2026-01-26*
