---
phase: 19-wizard-non-interactive
plan: 01
subsystem: cli
tags: [tty, non-interactive, ci-cd, exit-codes, stderr, stdout]

# Dependency graph
requires:
  - phase: 18-wizard-foundation
    provides: Wizard infrastructure and types
provides:
  - Mode detection with TTY auto-switch
  - Output formatting with stderr/stdout separation
  - Standard exit codes for CI/CD
  - Non-interactive mode infrastructure
affects: [19-02, 19-03, 19-05, 19-06, 19-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TTY detection pattern for mode switching
    - stderr/stdout separation for CI/CD pipelines
    - Standard exit codes (0, 1, 2, 130)

key-files:
  created:
    - packages/cli/src/wizard/non-interactive/mode-detector.ts
    - packages/cli/src/wizard/non-interactive/output-formatter.ts
  modified:
    - packages/cli/src/wizard/non-interactive/index.ts

key-decisions:
  - "Exit code 2 for validation errors (per CONTEXT.md)"
  - "Progress to stderr, output to stdout (Unix convention)"
  - "JSON mode skips progress messages for clean parsing"
  - "--force-interactive as escape hatch for non-TTY environments"

patterns-established:
  - "detectMode() for interactive vs non-interactive selection"
  - "progress()/output()/exitWithError() for CI/CD-safe output"
  - "EXIT_CODES constant for standard exit codes"

# Metrics
duration: 5min
completed: 2026-01-26
---

# Phase 19 Plan 01: Non-Interactive Mode Infrastructure Summary

**Mode detection with TTY auto-switch and stderr/stdout separation for CI/CD pipelines**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-26T13:37:55Z
- **Completed:** 2026-01-26T13:42:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Mode detector that auto-switches to non-interactive when stdin is not a TTY
- Output formatter with proper stderr/stdout separation
- Standard exit codes (0 success, 1 error, 2 validation, 130 SIGINT)
- JSON error format for programmatic consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Create mode detector with TTY auto-switch** - `648511e` (feat)
2. **Task 2: Create output formatter with stderr/stdout separation** - `4ab3df4` (feat)

## Files Created/Modified

- `packages/cli/src/wizard/non-interactive/mode-detector.ts` - TTY detection and mode switching
- `packages/cli/src/wizard/non-interactive/output-formatter.ts` - stderr/stdout separation and exit codes
- `packages/cli/src/wizard/non-interactive/index.ts` - Public API exports
- `packages/cli/tests/wizard/non-interactive/mode-detector.test.ts` - Mode detector tests

## Decisions Made

- **Exit code 2 for validation errors:** Per CONTEXT.md locked decision
- **Progress to stderr:** Unix convention for separating status from output
- **JSON mode skips progress:** Clean stdout for JSON parsing in pipelines
- **--force-interactive escape hatch:** Allows interactive mode even in non-TTY environments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation following existing patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Non-interactive infrastructure ready for:
  - 19-02: --no-input flag integration
  - 19-03: --json-input file/stdin reading
  - 19-05: Dry run mode
  - 19-06: AI enhancement integration

---
*Phase: 19-wizard-non-interactive*
*Completed: 2026-01-26*
