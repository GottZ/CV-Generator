# Phase 16 Plan 07: Enhanced Tailor Command Summary

**Completed:** 2026-01-26
**Duration:** ~6 minutes
**Status:** Complete

## One-liner

Standalone tailor generator with multi-source job input (file, URL, stdin), job caching, and cv.md output support.

## What Was Built

### Standalone Tailor Generator (`packages/cli/src/ai/generators/tailor-standalone.ts`)
- `tailorCV()` - Generate tailored content without workflow state dependency
- Reuses `TailorOutputSchema` from Phase 15 workflow schemas
- Uses `generateObject()` from AI SDK for structured output
- Built-in prompt with tailoring guidelines (summary rewrite, bullet rewrites, keyword strategy)
- Wrapped with `withRetry()` for API error resilience

### Prompt Template (`packages/cli/src/ai/prompts/templates/tailor-standalone.md`)
- Comprehensive tailoring instructions
- CV content and job description injection
- Guidelines for summary rewrite, bullet rewrites, and keyword strategy
- Critical constraint: Never add skills not present in original CV

### Enhanced Tailor CLI (`packages/cli/src/commands/ai/tailor.ts`)
- Multi-source job input: file, URL, stdin (via `-`)
- Job description caching to `/people/[name]/jobs/` with date-based naming
- Match score display with color coding (green >= 75%, yellow >= 50%, red below)
- `--output` flag for writing tailored summary to cv.md file
- Uses `loadJobDescription()` from 16-01 utility
- Uses `formatMatchScore()` from 16-02 display utilities

### CLI Command Updates (`packages/cli/src/commands/ai.ts`)
- Updated tailor command description and options
- `--job <source>` accepts file path, URL, or `-` for stdin
- Added `--output <file>` option
- Updated examples to show all input methods

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ai/generators/tailor-standalone.ts` | Standalone tailor generation function |
| `packages/cli/src/ai/generators/index.ts` | Generator module exports |
| `packages/cli/src/ai/prompts/templates/tailor-standalone.md` | Tailoring prompt template |
| `packages/cli/src/commands/ai/tailor.ts` | Enhanced tailor CLI command |
| `packages/cli/src/commands/ai.ts` | Updated command registration |

## Commits

| Hash | Message |
|------|---------|
| e60b769 | feat(16-07): create standalone tailor generator |

Note: CLI enhancements (tailor.ts, ai.ts) were committed as part of parallel plan execution (16-04 commit 2b1f868) due to concurrent working directory modifications.

## Decisions Made

1. **Standalone over workflow** - Tailor command now works independently, doesn't require workflow stages
2. **Date-based job caching** - Jobs cached as `YYYY-MM-DD-job.md` for history tracking
3. **formatMatchScore reuse** - Leverages Phase 16-02 display utility for consistent coloring

## Deviations from Plan

### Pre-existing Type Errors Fixed
**Rule 3 - Blocking**
**Found during:** Task 1 verification
**Issue:** `experimental_generateObject` in summary.ts was invalid import (API changed)
**Fix:** Linter auto-fixed to use `generateObject` from 'ai' package
**Files modified:** `packages/cli/src/ai/generators/summary.ts`

### Parallel Plan Interleaving
**Found during:** Task 2
**Issue:** tailor.ts and ai.ts changes committed under 16-04 commit
**Impact:** Task 2 changes already in HEAD when verification ran
**Resolution:** Verified functionality correct, continued to summary

## Verification Results

- [x] `bun run typecheck` passes
- [x] `bun run lint` passes (for 16-07 specific files)
- [x] `cvgen ai tailor --help` shows job accepts file or URL
- [x] `--output` flag documented in help
- [x] Examples show file, URL, and stdin input methods

## Technical Notes

### TailorCV Function
```typescript
export async function tailorCV(
  cv: CVData,
  locale: string,
  provider: AIProvider,
  jobDescription: string,
): Promise<TailorOutput>
```
- Returns `TailorOutput` with matchScore, keywordAnalysis, tailoredSummary, tailoredBullets
- Built-in prompt construction (no template rendering needed)
- Zod schema validation via AI SDK `generateObject()`

### Job Caching Behavior
- Creates `/people/[name]/jobs/` directory if not exists
- Saves as `YYYY-MM-DD-job.md` (e.g., `2026-01-26-job.md`)
- Multiple tailoring runs on same day overwrite the cached job
- User informed of cache location in output

### CLI Output Format
```
Match Score: 82%  (color-coded)

Keywords:
  Present: TypeScript, React, Node.js
  Missing: GraphQL, Kubernetes

Tailored Summary:
  [rewritten summary text]

Tailored Bullets:
  [Experience]
  Original: Led frontend development
  Tailored: Led React/TypeScript frontend development serving 50k users
  Reason: Added specific tech stack and user impact

Keyword Placement Suggestions:
  GraphQL -> Skills: Add "GraphQL API design" to skills section

Job description cached to: jobs/2026-01-26-job.md
```

## Next Steps

Plan 16-07 complete. Ready for Phase 17 (AI User Control) or remaining Phase 16 plans.
