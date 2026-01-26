# Phase 15 Plan 01: Workflow Foundation Summary

**Completed:** 2026-01-26
**Duration:** ~4 minutes
**Status:** Complete

## One-liner

Zod schemas and discriminated union state machine for type-safe multi-stage CV workflow with atomic per-person state persistence.

## What Was Built

### Workflow Types (`packages/cli/src/ai/workflow/types.ts`)
- `WorkflowStage` discriminated union: `'not_started' | 'analyzed' | 'improved' | 'summarized' | 'tailored'`
- `STAGE_ORDER` constant array for linear progression validation
- `WorkflowState` interface with version, currentStage, completedAt, stageResults, cvPath, locale, lastUpdated
- `canTransitionTo()` and `getNextStage()` helper functions for stage progression
- `WorkflowError` class with stage context for better error messages

### State Persistence (`packages/cli/src/ai/workflow/state.ts`)
- Per-person state at `/people/[name]/output/.ai-state.json`
- `STATE_VERSION = 1` for schema migration support
- `WorkflowStateSchema` Zod schema for runtime validation
- `atomicWrite()` using temp file + rename pattern to prevent corruption
- `loadWorkflowState()` with safeParse and version warning
- `saveWorkflowState()` with mkdir and atomic write
- `createInitialState()` factory for new workflows
- `updateStageResult()` for immutable state updates

### Zod Schemas (`packages/cli/src/ai/workflow/schemas/`)
- `AnalyzeOutputSchema`: sections array with status/bulletCount/issues, gaps, priorities with impact levels
- `ImproveOutputSchema`: jobImprovements with bullets (original, improved, reasoning, metrics)
- `SummarizeOutputSchema`: primary/alternative summaries, keyPoints, targetRoles
- `TailorOutputSchema`: matchScore (0-100), keywordAnalysis (present/missing/suggestions), tailoredSummary/bullets

### Public API (`packages/cli/src/ai/workflow/index.ts`)
Re-exports all types, state functions, schemas, and helpers for clean imports.

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ai/workflow/types.ts` | Stage types and progression helpers |
| `packages/cli/src/ai/workflow/state.ts` | Per-person state persistence |
| `packages/cli/src/ai/workflow/schemas/*.ts` | 4 Zod schemas for structured LLM outputs |
| `packages/cli/src/ai/workflow/index.ts` | Public API exports |

## Commits

| Hash | Message |
|------|---------|
| e861430 | feat(15-01): install Zod and create workflow types |
| ef30fc8 | feat(15-01): create per-person state persistence |
| 5007d6d | feat(15-01): create workflow public API exports |

## Decisions Made

1. **Zod 4.3.6** - Installed for structured LLM output validation (14x faster than Zod 3)
2. **Discriminated union state machine** - Simple TypeScript types vs XState (right-sized for 4-stage linear workflow)
3. **Per-person state files** - State at `/people/[name]/output/.ai-state.json` not global `.cvgen-state.json`
4. **Atomic writes** - Temp file + rename pattern prevents corruption from interrupted writes
5. **Version field in state** - Enables future schema migration with backward compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `bun run typecheck` passes
- [x] `bun run lint` passes
- [x] Zod is in package.json dependencies
- [x] All workflow files compile and export correctly
- [x] State persistence can create, load, and save workflow state
- [x] Schemas validate sample outputs correctly
- [x] `STAGE_ORDER` contains 5 stages in correct order
- [x] `canTransitionTo('not_started', 'analyzed')` returns true
- [x] `canTransitionTo('analyzed', 'tailored')` returns false
- [x] `getStatePath('/workspace/people/jane')` returns correct path
- [x] `createInitialState('./cv.md', 'en')` returns valid state with currentStage 'not_started'

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| zod | 4.3.6 | Structured LLM output validation |

## Next Steps

This plan provides the foundation for:
- **15-02**: Stage command implementations (analyze, improve, summarize, tailor)
- **15-03**: Status and context CLI commands

All stage commands will use these types, schemas, and state persistence.
