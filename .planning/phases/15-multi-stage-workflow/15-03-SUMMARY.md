# Phase 15 Plan 03: Summarize and Tailor Stages Summary

**Completed:** 2026-01-26
**Duration:** ~4 minutes
**Status:** Complete

## One-liner

Summarize and Tailor workflow stages with CLI commands using AI SDK structured outputs and state management.

## What Was Built

### Stage Implementations

**Summarize Stage (`packages/cli/src/ai/workflow/stages/summarize.ts`)**
- `runSummarizeStage()` function using AI SDK's `generateText` with `Output.object`
- Uses `SummarizeOutputSchema` for structured output validation
- Takes previous analysis and optional improvements as context
- Returns primary summary, alternative, key points, and target roles

**Tailor Stage (`packages/cli/src/ai/workflow/stages/tailor.ts`)**
- `runTailorStage()` function for job-specific CV tailoring
- Validates job description is provided
- Uses `TailorOutputSchema` for structured output validation
- Returns match score, keyword analysis, tailored summary, and bullet rewrites

**Barrel Export (`packages/cli/src/ai/workflow/stages/index.ts`)**
- Re-exports both stage functions and input types

### CLI Commands

**Summarize Command (`packages/cli/src/commands/ai/summarize.ts`)**
- `cvgen ai summarize <name>` - Stage 3 of workflow
- Requires analyze stage to be complete
- Displays primary/alternative summaries, key points, target roles
- Updates workflow state with summarize results
- Indicates workflow is complete, tailor is optional

**Tailor Command (`packages/cli/src/commands/ai/tailor.ts`)**
- `cvgen ai tailor <name> --job <file>` - Stage 4 of workflow
- Uses Commander `requiredOption` for --job flag
- Reads job description from file
- Displays match score with color coding (green >75%, yellow >50%, red below)
- Shows present/missing keywords and suggestions
- Displays tailored summary and bullet rewrites

### Command Integration

Updated `packages/cli/src/commands/ai.ts`:
- Added `summarizeAction` import and subcommand
- Added `tailorAction` import and subcommand with requiredOption

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ai/workflow/stages/summarize.ts` | Stage 3 implementation |
| `packages/cli/src/ai/workflow/stages/tailor.ts` | Stage 4 implementation |
| `packages/cli/src/ai/workflow/stages/index.ts` | Barrel exports |
| `packages/cli/src/commands/ai/summarize.ts` | Summarize CLI action |
| `packages/cli/src/commands/ai/tailor.ts` | Tailor CLI action |
| `packages/cli/src/commands/ai.ts` | AI command group (updated) |

## Commits

| Hash | Message |
|------|---------|
| 7d0b23a | feat(15-03): implement summarize and tailor workflow stages |
| 9822a74 | feat(15-03): add summarize CLI command |
| 947afcf | feat(15-03): add tailor CLI command |

## Decisions Made

1. **No separate stage prerequisites** - Summarize only requires analyze (improve is optional context), allowing flexible workflow progression
2. **Color-coded match score** - Green for 75%+, yellow for 50%+, red below for quick visual feedback
3. **requiredOption for --job** - Commander-level enforcement with helpful error messages in action

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed lint issues in 15-02 parallel files**
- **Found during:** Task 2
- **Issue:** analyze.ts, improve.ts had template literal and implicit any type lint errors
- **Fix:** Updated string concatenation to template literals, added type annotations
- **Files modified:** analyze.ts, improve.ts (from parallel 15-02 work)
- **Reason:** Lint errors blocked commits for this plan

## Verification Results

- [x] `bun run typecheck` passes
- [x] `bun run lint` passes
- [x] `cvgen ai summarize --help` shows correct usage
- [x] `cvgen ai tailor --help` shows --job as required option
- [x] Summarize command requires analyze to be complete
- [x] Tailor command requires analyze and job description
- [x] Tailor throws error if --job not provided
- [x] Both stages export their runner functions

## Dependencies Added

None - uses existing Zod and AI SDK from Phase 14/15-01.

## Next Steps

The 4-stage workflow is now complete:
1. **Analyze** (15-02) - Identify improvement opportunities
2. **Improve** (15-02) - Generate STAR method bullets
3. **Summarize** (15-03) - Generate professional summary
4. **Tailor** (15-03, optional) - Adapt for specific job posting

Future phases may add:
- `cvgen ai status <name>` - Show workflow progress
- `cvgen ai full <name>` - Run all stages in sequence
