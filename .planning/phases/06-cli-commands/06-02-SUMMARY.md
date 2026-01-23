---
phase: 06-cli-commands
plan: 02
subsystem: cli
tags: [cli, init-command, scaffolding, sharp, placeholder-image]

# Dependency graph
requires:
  - phase: 06-cli-commands
    plan: 01
    provides: Prompts utility (promptOverwrite, promptName)
provides:
  - Init command for scaffolding CV directories
  - Scaffolder utilities (slugifyName, createPlaceholderPhoto, createExampleMarkdown, createCvDirectory)
  - Example CV markdown with EN/DE sections and inline comments
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [sharp-svg-overlay, directory-scaffolding, slug-conversion]

key-files:
  created:
    - packages/cli/src/lib/scaffolder.ts
    - packages/cli/src/commands/init.ts
  modified:
    - packages/cli/src/index.ts

key-decisions:
  - "Slugify: toLowerCase, trim, replace non-alphanumeric with hyphen, trim leading/trailing hyphens"
  - "Placeholder photo: 200x250 gray JPEG with SVG text overlay for PHOTO label"
  - "Exit code 130 for user cancellation (SIGINT convention)"
  - "Output directory NOT created by init (build creates it)"

patterns-established:
  - "Directory existence check with access(path, F_OK) in try/catch"
  - "SVG overlay pattern with sharp.composite for text on generated images"
  - "Relative path display for user-friendly output"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 6 Plan 02: Init Command Summary

**cvgen init command scaffolds CV directories with example markdown containing EN/DE sections and placeholder photo**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23
- **Completed:** 2026-01-23
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created scaffolder.ts with slugifyName(), createPlaceholderPhoto(), createExampleMarkdown(), createCvDirectory()
- Slugify converts "John Doe" to "john-doe" for directory names
- Placeholder photo is 200x250 gray JPEG with "PHOTO" text using sharp SVG overlay
- Example markdown includes frontmatter, summary, experience, education, skills in both EN and DE
- All sections have inline HTML comments explaining how to fill them out
- Created init.ts with initAction() handling name argument or interactive prompt
- Existing directory prompts with overwrite/skip/cancel options
- Registered init command in CLI entry point with help examples

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scaffolder utility module** - `48bbf47` (feat)
2. **Task 2: Create init command action** - `2fef295` (feat)
3. **Task 3: Register init command in CLI entry point** - `5762c4c` (feat)

## Files Created/Modified
- `packages/cli/src/lib/scaffolder.ts` - Scaffolding utilities (slugifyName, createPlaceholderPhoto, createExampleMarkdown, createCvDirectory)
- `packages/cli/src/commands/init.ts` - Init command action with InitOptions interface
- `packages/cli/src/index.ts` - Added init command registration with help examples

## Decisions Made
- **Slug format:** Lowercase, non-alphanumeric replaced with hyphens, trimmed
- **Photo dimensions:** 200x250 (portrait ratio suitable for CV photos)
- **Photo background:** #CCCCCC (light gray) with #666666 "PHOTO" text
- **Exit code 130:** Standard SIGINT cancellation exit code
- **No output directory:** Init only creates cv.md and images/photo.jpg, build creates output/

## Deviations from Plan

None - plan executed exactly as written. Note: prompts.ts was already created by Plan 06-01.

## Issues Encountered
- **Biome auto-formatting:** Import reordering during commit - no functional impact
- **File reverted by linter:** index.ts was reverted after first edit, re-applied changes successfully

## Verification Results

All verification checks passed:
1. `bun run typecheck` - passes (no TypeScript errors)
2. `cvgen init --help` - shows description and examples
3. `cvgen init test-person` - creates people/test-person/ with cv.md and images/photo.jpg
4. cv.md contains commented example with EN and DE sections
5. images/photo.jpg is valid JPEG (200x250, baseline)
6. Running `cvgen init test-person` again prompts for overwrite/skip/cancel

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Init command fully functional for scaffolding new CVs
- Users can run `cvgen init "John Doe"` immediately after CLI installation
- Example CV provides template for all supported sections
- Placeholder photo ready for replacement with actual photo

---
*Phase: 06-cli-commands*
*Completed: 2026-01-23*
