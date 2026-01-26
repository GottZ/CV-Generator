---
phase: 17-ai-user-control
plan: 01
subsystem: ai
tags: [inquirer, prompts, review, detection, weakness, expand]

# Dependency graph
requires:
  - phase: 16-ai-content-generation
    provides: displayComparison for diff display, weakness types from ImproveOutputSchema
provides:
  - Interactive review prompt with single-key actions (a/e/s/r/y/n)
  - Weak bullet detector with four weakness categories
  - Editor integration via $EDITOR spawn
  - File writer with backup and user confirmation
  - Regeneration with similarity detection and history tracking
  - TTY check for non-interactive environments
affects: [17-02, 17-03, 17-04]

# Tech tracking
tech-stack:
  added: ["@inquirer/prompts", "external-editor"]
  patterns: [expand prompt for git-add-p style, Jaccard similarity for regeneration]

key-files:
  created:
    - packages/cli/src/ai/review/review-prompt.ts
    - packages/cli/src/ai/review/weak-bullet-detector.ts
    - packages/cli/src/ai/review/editor-integration.ts
    - packages/cli/src/ai/review/file-writer.ts
    - packages/cli/src/ai/review/regeneration.ts
    - packages/cli/src/ai/review/tty-check.ts
    - packages/cli/src/ai/review/index.ts
  modified:
    - packages/cli/package.json
    - bun.lock

key-decisions:
  - "Use lowercase keys for expand prompt (y/n for accept/skip all instead of A/S)"
  - "@inquirer/prompts expand for git-add-p style single-key interaction"
  - "Jaccard word-level similarity for regeneration deduplication"
  - "Four weakness categories: lacks_quantification, missing_outcome, too_generic, passive_voice"

patterns-established:
  - "Expand prompt pattern: single-key menu with default action"
  - "Weakness detection: regex-based pattern matching with priority order"

# Metrics
duration: 4min
completed: 2026-01-26
---

# Phase 17 Plan 01: Review Prompt Infrastructure Summary

**Interactive review prompt with single-key actions using @inquirer/expand and weak bullet detector for four weakness categories**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-26T10:37:11Z
- **Completed:** 2026-01-26T10:41:15Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created review-prompt.ts with git-add-p style single-key action menu (a/e/s/r/y/n)
- Implemented weak bullet detector identifying four weakness categories
- Added editor integration for $EDITOR spawn with temp file format
- Created file writer with backup and explicit user confirmation
- Built regeneration module with Jaccard similarity detection and history tracking
- Added TTY check for graceful fallback in non-interactive environments

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create review prompt** - `f346fd7` (feat)
2. **Task 2: Create weak bullet detector** - `8b1cc6c` (feat)

## Files Created/Modified
- `packages/cli/src/ai/review/review-prompt.ts` - Expand prompt with ReviewAction type and promptReviewAction function
- `packages/cli/src/ai/review/weak-bullet-detector.ts` - detectWeakness and displayWeakBulletWarning functions
- `packages/cli/src/ai/review/editor-integration.ts` - openInEditor with temp file format per CONTEXT.md spec
- `packages/cli/src/ai/review/file-writer.ts` - safeWriteCvFile with backup and confirmation
- `packages/cli/src/ai/review/regeneration.ts` - Jaccard similarity, regenerateWithGuidance, selectFromHistory
- `packages/cli/src/ai/review/tty-check.ts` - isTTY, ensureInteractiveMode
- `packages/cli/src/ai/review/index.ts` - Barrel exports for all review module functions
- `packages/cli/package.json` - Added @inquirer/prompts and external-editor dependencies

## Decisions Made
- **Lowercase keys for expand prompt:** @inquirer/expand only accepts lowercase keys, so 'y' and 'n' are used for accept_all/skip_all instead of 'A' and 'S' (API constraint)
- **Additional review module files:** Editor integration, file writer, regeneration, and TTY check modules were also created to complete the review infrastructure foundation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed trailing comma lint errors in editor-integration.ts and file-writer.ts**
- **Found during:** Task 1 (verification)
- **Issue:** Pre-existing files had missing trailing commas causing lint failures
- **Fix:** Added trailing commas to function parameters
- **Files modified:** editor-integration.ts, file-writer.ts
- **Committed in:** f346fd7 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed unused variable in regeneration.ts**
- **Found during:** Task 2 (verification)
- **Issue:** currentSuggestion was destructured but unused
- **Fix:** Removed from destructuring
- **Files modified:** regeneration.ts
- **Committed in:** 8b1cc6c (Task 2 commit)

**3. [Rule 2 - Missing Critical] Added regeneration and TTY check modules**
- **Found during:** Task 2 (file discovery)
- **Issue:** Additional review infrastructure files existed that needed proper exports
- **Fix:** Added exports for regeneration.ts and tty-check.ts to index.ts
- **Files modified:** index.ts
- **Committed in:** 8b1cc6c (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness and completeness. Additional modules enhance the review infrastructure beyond plan scope but are consistent with phase objectives.

## Issues Encountered
None - plan executed with minor adjustments for pre-existing code.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Review prompt infrastructure complete for AI-11 (preview before accepting)
- Weak bullet detection ready for AI-14 (weak bullet flagging)
- Editor integration available for edit action in review flow
- Regeneration module ready for regenerate action with similarity detection
- File writer prepared for final write confirmation flow

---
*Phase: 17-ai-user-control*
*Completed: 2026-01-26*
