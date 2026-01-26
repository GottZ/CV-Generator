---
phase: 15-multi-stage-workflow
verified: 2026-01-26T02:16:59Z
status: passed
score: 7/7 must-haves verified
---

# Phase 15: Multi-Stage Workflow Verification Report

**Phase Goal:** Users can progress through a structured AI workflow with persistent state across sessions.

**Verified:** 2026-01-26T02:16:59Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can start Stage 1 (Analyze) and state is saved | ✓ VERIFIED | `analyzeAction` calls `saveWorkflowState` after `runAnalyzeStage` completes (analyze.ts:125) |
| 2 | User can progress through stages sequentially | ✓ VERIFIED | `checkStagePrerequisites` enforces stage order: analyze → improve → summarize → tailor (runner.ts:176-214) |
| 3 | User can view current workflow status with stage completion | ✓ VERIFIED | `statusAction` loads state and displays table with completion timestamps via `formatStatus` (status.ts:25-63) |
| 4 | User can resume workflow after closing/reopening terminal | ✓ VERIFIED | State persisted to `.ai-state.json` via `saveWorkflowState` with atomic writes (state.ts:139-153) |
| 5 | User can view section context from previous stage results | ✓ VERIFIED | `contextAction` retrieves section details from `state.stageResults` via `formatSectionContext` (context.ts:29-98) |
| 6 | Stage 4 (Tailor) is optional and can be skipped | ✓ VERIFIED | Tailor stage only requires summarize (not vice versa), and uses `requiredOption` for `--job` flag (ai.ts:169, tailor.ts:42-44) |
| 7 | Each stage produces structured output that feeds into next stage | ✓ VERIFIED | All stages use `Output.object()` with Zod schemas, `getPreviousResults` passes prior stage outputs as context (runner.ts:115-166) |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/cli/src/ai/workflow/state.ts` | State persistence with atomic writes | ✓ VERIFIED | 219 lines, exports `loadWorkflowState`, `saveWorkflowState`, `createInitialState`, `updateStageResult`, uses Zod schema validation |
| `packages/cli/src/ai/workflow/types.ts` | Workflow stage types and progression helpers | ✓ VERIFIED | 109 lines, defines `WorkflowStage` discriminated union, `STAGE_ORDER`, `canTransitionTo`, `getNextStage` |
| `packages/cli/src/ai/workflow/schemas/analyze-output.ts` | Analyze stage Zod schema | ✓ VERIFIED | 45 lines, exports `AnalyzeOutputSchema` with sections, gaps, priorities |
| `packages/cli/src/ai/workflow/schemas/improve-output.ts` | Improve stage Zod schema | ✓ VERIFIED | Exists with `ImproveOutputSchema` for STAR-formatted bullets |
| `packages/cli/src/ai/workflow/schemas/summarize-output.ts` | Summarize stage Zod schema | ✓ VERIFIED | Exists with `SummarizeOutputSchema` for professional summaries |
| `packages/cli/src/ai/workflow/schemas/tailor-output.ts` | Tailor stage Zod schema | ✓ VERIFIED | Exists with `TailorOutputSchema` for job-specific adaptations |
| `packages/cli/src/ai/workflow/runner.ts` | Stage runner infrastructure | ✓ VERIFIED | 230 lines, exports `loadCVForStage`, `getPreviousResults`, `checkStagePrerequisites`, `isStageComplete` |
| `packages/cli/src/ai/workflow/stages/analyze.ts` | Stage 1 implementation | ✓ VERIFIED | 52 lines, calls `generateText` with `Output.object`, uses `AnalyzeOutputSchema` |
| `packages/cli/src/ai/workflow/stages/improve.ts` | Stage 2 implementation | ✓ VERIFIED | 58 lines, receives `analyzeResult` as input, uses `ImproveOutputSchema` |
| `packages/cli/src/ai/workflow/stages/summarize.ts` | Stage 3 implementation | ✓ VERIFIED | 70 lines, receives `analyzeResult` and optional `improveResult`, uses `SummarizeOutputSchema` |
| `packages/cli/src/ai/workflow/stages/tailor.ts` | Stage 4 implementation | ✓ VERIFIED | 77 lines, validates `jobDescription` required, receives all prior stage results, uses `TailorOutputSchema` |
| `packages/cli/src/ai/workflow/display.ts` | Display helpers for status/context | ✓ VERIFIED | 320 lines, exports `formatStatus`, `formatStatusJson`, `formatSectionContext` with terminal/JSON/markdown formats |
| `packages/cli/src/commands/ai/analyze.ts` | Analyze CLI command | ✓ VERIFIED | 192 lines, handles state loading, prerequisite checking, AI provider setup, state saving |
| `packages/cli/src/commands/ai/improve.ts` | Improve CLI command | ✓ VERIFIED | 178 lines, checks analyze stage complete before running |
| `packages/cli/src/commands/ai/summarize.ts` | Summarize CLI command | ✓ VERIFIED | Exists and checks improve stage complete (per SUMMARY.md) |
| `packages/cli/src/commands/ai/tailor.ts` | Tailor CLI command | ✓ VERIFIED | Exists with `requiredOption('--job')` (ai.ts:169) |
| `packages/cli/src/commands/ai/status.ts` | Status CLI command | ✓ VERIFIED | 64 lines, loads state and displays via `formatStatus` |
| `packages/cli/src/commands/ai/context.ts` | Context CLI command | ✓ VERIFIED | 99 lines, lists sections or shows section details with `--verbose`, `--format` options |
| `packages/cli/src/commands/ai.ts` | AI command group registration | ✓ VERIFIED | 229 lines, all 6 workflow commands registered (analyze, improve, summarize, tailor, status, context) |
| `packages/cli/src/ai/prompts/templates/analyze.njk` | Analyze prompt template | ✓ VERIFIED | Exists, registered in registry with stage 1 |
| `packages/cli/src/ai/prompts/templates/improve.njk` | Improve prompt template | ✓ VERIFIED | Exists, registered in registry with stage 2 |
| `packages/cli/src/ai/prompts/templates/summarize.njk` | Summarize prompt template | ✓ VERIFIED | Exists, registered in registry with stage 3 |
| `packages/cli/src/ai/prompts/templates/tailor.njk` | Tailor prompt template | ✓ VERIFIED | Exists, registered in registry with stage 4 |

**All required artifacts verified.**

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Analyze command | runAnalyzeStage | Direct call | ✓ WIRED | `analyzeAction` calls `runAnalyzeStage` with cv, locale, provider (analyze.ts:117-121) |
| Analyze command | State persistence | saveWorkflowState | ✓ WIRED | Result saved via `updateStageResult` + `saveWorkflowState` (analyze.ts:124-125) |
| runAnalyzeStage | Zod schema | Output.object | ✓ WIRED | Uses `Output.object({ schema: AnalyzeOutputSchema })` for structured output (analyze.ts:41-43) |
| runAnalyzeStage | Prompt template | renderPrompt | ✓ WIRED | Calls `renderPrompt('analyze', { cv, locale })` (analyze.ts:31-34) |
| Improve command | Prerequisites | checkStagePrerequisites | ✓ WIRED | Checks analyze stage complete before running (improve.ts:77-81) |
| Improve command | Previous results | state.stageResults.analyze | ✓ WIRED | Passes `analyzeResult` to `runImproveStage` (improve.ts:124) |
| Status command | State persistence | loadWorkflowState | ✓ WIRED | Loads state and displays via `formatStatus` (status.ts:38-61) |
| Context command | Display helpers | formatSectionContext | ✓ WIRED | Calls `formatSectionContext(state, section, verbose)` (context.ts:88-90) |
| All stage runners | AI SDK structured output | generateText + Output.object | ✓ WIRED | All 4 stages use `generateText` with `Output.object` and Zod schemas |
| AI command group | Main CLI | aiCommand import | ✓ WIRED | `aiCommand` imported in index.ts:3 and added to program at line 112 |

**All key links verified and wired correctly.**

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| AI-03: Multi-stage workflow with state in `.ai-state.json` | ✓ SATISFIED | State stored at `people/[name]/output/.ai-state.json` via `getStatePath` (state.ts:63-65) |
| AI-04: View current stage and resume via `cvgen ai status` | ✓ SATISFIED | `statusAction` displays stage table, shows next command hint (status.ts:25-63) |
| AI-05: Lookup context via `cvgen ai context [name] [section]` | ✓ SATISFIED | `contextAction` shows section analysis, improvements, and history with `--verbose` (context.ts:29-98) |
| AI-15: Stage 1 analyzes CV structure | ✓ SATISFIED | `runAnalyzeStage` uses analyze prompt template, returns sections/gaps/priorities (analyze.ts:28-51) |
| AI-16: Stage 2 improves bullets with STAR method | ✓ SATISFIED | `runImproveStage` uses improve prompt template, receives analyze results, returns job improvements (improve.ts:33-57) |
| AI-17: Stage 3 generates professional summary | ✓ SATISFIED | `runSummarizeStage` receives analyze + improve results, returns primary/alternative summaries (summarize.ts:36-69) |
| AI-18: Stage 4 tailors for job description (optional) | ✓ SATISFIED | `runTailorStage` requires `jobDescription`, validates it exists, returns match score and keyword analysis (tailor.ts:39-76) |

**All 7 requirements satisfied.**

### Anti-Patterns Found

No blocking anti-patterns detected. All checked files show substantive implementation:

- **No TODO/FIXME comments** in workflow files
- **No placeholder returns** (only legitimate `null` returns for optional values)
- **No stub patterns** found in stage runners or CLI commands
- **All stages use structured output** via AI SDK's `Output.object()`
- **All commands properly handle errors** and exit with appropriate codes
- **State persistence uses atomic writes** to prevent corruption (state.ts:71-75)

### Human Verification Required

The following items require human testing to fully verify the phase goal:

#### 1. Complete Workflow Execution

**Test:** Run the full 4-stage workflow on a real CV
```bash
cd /workspace
cvgen ai analyze jane
cvgen ai improve jane
cvgen ai summarize jane
cvgen ai tailor jane --job examples/job-posting.txt
```

**Expected:**
- Each stage completes successfully without errors
- State file `.ai-state.json` is created and updated after each stage
- Each stage displays formatted results in terminal
- Next command hint is shown after each stage completion

**Why human:** Requires real AI provider API keys and live LLM calls. Cannot verify without actual execution.

#### 2. State Persistence Across Sessions

**Test:** 
1. Run `cvgen ai analyze jane`
2. Close terminal completely
3. Open new terminal session
4. Run `cvgen ai status jane`
5. Run `cvgen ai improve jane` (should continue from last state)

**Expected:**
- Status shows "Analyze: Complete" and "Improve: Next"
- Improve command runs successfully without re-running analyze
- State is correctly loaded from `.ai-state.json`

**Why human:** Requires actual terminal session management and file system persistence verification.

#### 3. Context Lookup and Display

**Test:**
```bash
cvgen ai context jane                    # List sections
cvgen ai context jane experience         # Show experience section
cvgen ai context jane experience --verbose
cvgen ai context jane experience --format=json
cvgen ai context jane experience --format=md
```

**Expected:**
- Section list shows all analyzed sections with status
- Section details show analysis, improvements, and metrics
- Verbose mode includes summarize and tailor results
- JSON and markdown formats are well-structured

**Why human:** Requires visual inspection of formatted output quality and completeness.

#### 4. Prerequisites Enforcement

**Test:** Try to run stages out of order
```bash
cvgen ai improve jane    # Should fail - analyze not complete
cvgen ai summarize jane  # Should fail - improve not complete
cvgen ai tailor jane --job posting.txt  # Should fail - summarize not complete
```

**Expected:**
- Each command shows clear error message about missing prerequisite
- Error message suggests the correct command to run next

**Why human:** Requires testing error handling and user experience of error messages.

#### 5. Force Re-run

**Test:**
```bash
cvgen ai analyze jane          # First run
cvgen ai analyze jane          # Should skip - already complete
cvgen ai analyze jane --force  # Should re-run
```

**Expected:**
- Second run shows "already complete" message with status
- Force flag causes stage to re-run and update results
- Timestamps in state file update correctly

**Why human:** Requires comparing timestamps and verifying state updates.

#### 6. Stage 4 Optional Behavior

**Test:**
```bash
cvgen ai analyze jane
cvgen ai improve jane
cvgen ai summarize jane
cvgen ai status jane      # Should show workflow complete, tailor optional
```

**Expected:**
- Summarize command indicates workflow is complete
- Tailor stage shown as optional
- Status command does not require tailor to show "complete"

**Why human:** Requires understanding workflow completion semantics and UX verification.

---

## Summary

**Phase 15 verification: PASSED (with human verification pending)**

All automated checks passed:
- ✓ 7/7 observable truths verified
- ✓ 23/23 required artifacts verified (substantive and wired)
- ✓ 10/10 key links verified
- ✓ 7/7 requirements satisfied
- ✓ No blocking anti-patterns found
- ✓ TypeScript compilation passes
- ✓ Lint checks pass
- ✓ Zod 4.3.6 installed in dependencies

The multi-stage workflow infrastructure is complete and correctly implemented:

1. **State Management:** Per-person workflow state persisted to `.ai-state.json` with atomic writes and version support
2. **Stage Progression:** Linear 4-stage workflow with prerequisite enforcement and stage transition validation
3. **Structured Output:** All stages use AI SDK 6 `Output.object()` with Zod schemas for type-safe LLM responses
4. **CLI Commands:** All 6 workflow commands registered and wired (analyze, improve, summarize, tailor, status, context)
5. **Prompt Templates:** All 4 stage prompt templates exist and registered in prompt registry
6. **Display Helpers:** Comprehensive formatting for terminal, JSON, and markdown outputs

**Next Steps:**
1. Human verification of live workflow execution (6 test scenarios above)
2. Consider adding integration tests with mock LLM responses
3. Phase 16: AI Content Generation (standalone commands like bullets, summary, keywords)

---

_Verified: 2026-01-26T02:16:59Z_
_Verifier: Claude Code (gsd-verifier)_
