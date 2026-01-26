# Phase 15 Plan 02: Stage Commands Summary

**Completed:** 2026-01-26
**Duration:** ~5 minutes
**Status:** Complete

## One-liner

Stage runner infrastructure with analyze and improve CLI commands using AI SDK 6 structured output and per-person state persistence.

## What Was Built

### Stage Runner Infrastructure (`packages/cli/src/ai/workflow/runner.ts`)
- `StageRunnerOptions` interface for stage execution configuration
- `StageResult<T>` generic type for stage outputs
- `CVLoadResult` type for CV loading results
- `loadCVForStage()` - loads and parses CV with locale detection
- `getPreviousResults()` - retrieves prior stage results for context
- `checkStagePrerequisites()` - validates stage dependencies
- `isStageComplete()` - checks if a stage has completed

### Stage Implementations (`packages/cli/src/ai/workflow/stages/`)
- `runAnalyzeStage()` - Stage 1: Analyzes CV structure, identifies gaps and priorities
- `runImproveStage()` - Stage 2: Generates STAR-formatted bullet improvements
- Uses AI SDK 6 `generateText()` with `Output.object()` for structured output
- Imports existing Zod schemas from `workflow/schemas/`

### CLI Commands (`packages/cli/src/commands/ai/`)
- `cvgen ai analyze <name>` - Stage 1 command with progress spinner
- `cvgen ai improve <name>` - Stage 2 command with prerequisite checking
- Both support: `--provider`, `--force`, `--quiet`, `--json`
- Results stored in `people/<name>/output/.ai-state.json`

### Public API Updates (`packages/cli/src/ai/workflow/index.ts`)
- Added runner function exports
- Added stage function exports (analyze, improve, summarize, tailor)
- Added type exports (CVLoadResult, StageResult, etc.)

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ai/workflow/runner.ts` | Stage execution infrastructure |
| `packages/cli/src/ai/workflow/stages/analyze.ts` | Stage 1: CV analysis implementation |
| `packages/cli/src/ai/workflow/stages/improve.ts` | Stage 2: STAR bullet improvements |
| `packages/cli/src/ai/workflow/stages/index.ts` | Stage exports barrel file |
| `packages/cli/src/commands/ai/analyze.ts` | CLI command for analyze stage |
| `packages/cli/src/commands/ai/improve.ts` | CLI command for improve stage |
| `packages/cli/src/commands/ai.ts` | AI command group with subcommands |

## Commits

| Hash | Message |
|------|---------|
| dd62197 | feat(15-02): create stage runner infrastructure |
| 0b32a0e | feat(15-02): implement analyze and improve stage runners |
| 4445e26 | feat(15-02): create analyze and improve CLI commands |

## Decisions Made

1. **Type annotations for uninitialized variables** - Added explicit types (CVLoadResult, AIProvider) to avoid lint errors
2. **String type for provider option** - Used string instead of ProviderType in StageRunnerOptions for simplicity, cast at call site
3. **Prerequisite checking in improve** - Double check for analyze completion (checkStagePrerequisites + explicit state check)

## Deviations from Plan

None - plan executed exactly as written. Summarize and tailor stages were already implemented (committed separately), only needed analyze and improve.

## Verification Results

- [x] `bun run typecheck` passes
- [x] `bun run lint` passes
- [x] `cvgen ai analyze --help` shows correct usage
- [x] `cvgen ai improve --help` shows correct usage
- [x] Both commands require prior stage completion (improve needs analyze)
- [x] Commands registered in ai.ts command group
- [x] `--force` flag allows re-running completed stages

## Dependencies Added

None - all dependencies were added in 15-01.

## Next Steps

This plan enables:
- **15-03**: Status and context commands for workflow visibility
- Future: End-to-end testing with mock LLM responses

All stage commands follow the same pattern and can be extended for summarize and tailor.
