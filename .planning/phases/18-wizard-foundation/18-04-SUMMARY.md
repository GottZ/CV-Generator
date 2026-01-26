---
phase: 18-wizard-foundation
plan: 04
subsystem: ui
tags: [inquirer, prompts, wizard, projects, certifications]

# Dependency graph
requires:
  - phase: 18-01
    provides: Wizard types (WizardMode), validation (validateDate)
provides:
  - Projects prompt flow (collectProjects, collectSingleProject)
  - Certifications prompt flow (collectCertifications, collectSingleCertification)
  - Optional section prompts with "add another" loop
affects: [18-05, 18-06, 19-wizard-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optional section with default false on initial confirm
    - Project links with type selection
    - Quick vs detailed mode field filtering

key-files:
  created:
    - packages/cli/src/wizard/prompts/projects.ts
    - packages/cli/src/wizard/prompts/certifications.ts
  modified:
    - packages/cli/src/wizard/prompts/index.ts

key-decisions:
  - "Project links collected with type selection (github, demo, npm, docs, website, other)"
  - "Certification logo skipped in wizard - complex file handling, manual addition via cv.md"
  - "Both sections optional with default: false on initial 'Add a...?' prompt"

patterns-established:
  - "Optional section pattern: confirm with default false, then add another loop"
  - "Type-safe project type selection using PROJECT_TYPES const with as const"

# Metrics
duration: 8min
completed: 2026-01-26
---

# Phase 18 Plan 04: Projects and Certifications Prompts Summary

**Optional CV section prompts for projects with link collection and certifications with credential tracking**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-26T11:50:15Z
- **Completed:** 2026-01-26T11:58:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Projects prompt with name, description, tech stack, and typed links
- Certifications prompt with name, issuer, date, and optional credential ID
- Both sections fully optional with "add another" loop pattern
- Quick/detailed mode support for field filtering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create projects prompt flow** - `331af51` (feat)
2. **Task 2: Create certifications prompt flow** - `9c8c880` (feat)

## Files Created/Modified
- `packages/cli/src/wizard/prompts/projects.ts` - Projects collection with links and detailed fields
- `packages/cli/src/wizard/prompts/certifications.ts` - Certifications collection with credential tracking
- `packages/cli/src/wizard/prompts/index.ts` - Updated exports for new prompts

## Decisions Made
- Project link types predefined as constants: github, demo, npm, docs, website, other
- Certification date earned validation disallows "present" value
- Logo field skipped in wizard due to file handling complexity - users can add manually

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- File system race condition caused projects.ts to disappear during creation
- Resolved by recreating file and syncing filesystem
- Parallel plan execution (18-02, 18-03) created interleaved commits

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All six CV section prompts now complete (contact, experience, education, skills, projects, certifications)
- Ready for Phase 18-05 (Wizard Flow Orchestration) to integrate prompts
- No blockers or concerns

---
*Phase: 18-wizard-foundation*
*Completed: 2026-01-26*
