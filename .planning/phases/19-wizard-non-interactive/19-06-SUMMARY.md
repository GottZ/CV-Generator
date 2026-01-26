---
phase: 19-wizard-non-interactive
plan: 06
subsystem: cli
tags: [wizard, non-interactive, runner, dry-run, ci-cd]
dependency-graph:
  requires: [19-01, 19-02, 19-03, 19-05]
  provides: [non-interactive-runner, dry-run-mode]
  affects: [19-07]
tech-stack:
  added: []
  patterns: [orchestrator, graceful-degradation, json-output]
key-files:
  created:
    - packages/cli/src/wizard/non-interactive/dry-run.ts
    - packages/cli/src/wizard/non-interactive/runner.ts
  modified:
    - packages/cli/src/wizard/non-interactive/index.ts
decisions:
  - id: dry-run-result-structure
    choice: DryRunResult with valid, wouldWrite, preview, validationErrors fields
    rationale: Provides comprehensive validation feedback for CI/CD pipelines
  - id: enhancement-auto-accept
    choice: Auto-accept all AI suggestions in non-interactive mode
    rationale: Per CONTEXT.md, non-interactive mode should not require user interaction
  - id: minimum-viable-validation
    choice: Require contact + one of experience/education/skills
    rationale: Consistent with interactive wizard validation
metrics:
  duration: 186s
  completed: 2026-01-26
---

# Phase 19 Plan 06: Non-Interactive Runner & Dry-Run Summary

Non-interactive runner orchestrating full wizard flow with dry-run validation mode.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 59aa465 | feat(19-06): create dry-run mode for non-interactive wizard |
| 2 | 01627d3 | feat(19-06): create non-interactive runner for wizard commands |

## What Was Built

### Task 1: Dry-Run Mode

Created `dry-run.ts` with:
- `runDryRun` function for validation without writing files
- `DryRunResult` interface with valid, wouldWrite, preview, validationErrors
- Markdown generation and cv-core schema validation
- Human-readable and JSON output modes

### Task 2: Non-Interactive Runner

Created `runner.ts` with:
- `NonInteractiveOptions` interface capturing all execution settings
- `runNonInteractiveWizard` for full CV creation flow:
  - JSON input reading via `readJsonInput`
  - State building via `buildWizardState`
  - Minimum viable CV validation via `isMinimumViable`
  - AI enhancement with auto-accept mode when `--enhance` flag set
  - Dry-run or file write based on flags
- `runNonInteractiveAdd` for adding sections to existing CV:
  - Load existing CV via `parseCV`
  - Merge new section data
  - Apply enhancement for experience sections
  - Dry-run or file write
- `mergeSection` helper for section merging
- `AddableSection` type union

Updated `index.ts` with exports:
- `runDryRun`, `DryRunResult`
- `runNonInteractiveWizard`, `runNonInteractiveAdd`
- `NonInteractiveOptions`, `NonInteractiveResult`, `AddableSection`

## Key Integration Points

```
runner.ts
  |
  +-- readJsonInput (input-reader.ts) - Read JSON from file/stdin
  |
  +-- buildWizardState (state-builder.ts) - Build state from JSON/flags
  |
  +-- isMinimumViable (state.ts) - Validate minimum CV requirements
  |
  +-- enhanceSection (enhance/section-enhancer.ts) - AI enhancement
  |
  +-- runDryRun (dry-run.ts) - Validate and preview
  |
  +-- writeWizardOutput (markdown-writer.ts) - Write CV file
```

## Technical Decisions

1. **DryRunResult Structure**: Comprehensive feedback with validation status, file paths, preview content, and error details enables CI/CD integration.

2. **Auto-Accept Enhancement**: Non-interactive mode automatically accepts all AI suggestions per CONTEXT.md requirement for fully automated pipelines.

3. **Graceful Enhancement Degradation**: AI enhancement failures are logged but execution continues with original content.

4. **Consistent Error Handling**: All errors use `exitWithError` with structured details for programmatic parsing.

## Verification

```bash
# TypeScript compilation
npx tsc --noEmit  # PASS

# Lint
bun run lint  # PASS

# Export verification
bun -e "import { runNonInteractiveWizard, runNonInteractiveAdd, runDryRun } from './packages/cli/src/wizard/non-interactive/index.ts'; console.log(typeof runNonInteractiveWizard);"  # function
```

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Plan 19-07 (CLI Integration) can now:
- Wire `--no-input`, `--json-input`, `--dry-run` flags to CLI commands
- Call `runNonInteractiveWizard` and `runNonInteractiveAdd` based on mode detection
- Integrate with existing `detectMode` from 19-01

## Files Created/Modified

| File | Change |
|------|--------|
| packages/cli/src/wizard/non-interactive/dry-run.ts | Created - Dry-run validation mode |
| packages/cli/src/wizard/non-interactive/runner.ts | Created - Non-interactive runner orchestration |
| packages/cli/src/wizard/non-interactive/index.ts | Modified - Added runner and dry-run exports |
