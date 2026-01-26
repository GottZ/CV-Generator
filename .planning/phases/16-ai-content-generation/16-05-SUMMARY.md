---
phase: 16
plan: 05
subsystem: ai-keywords
tags: [ai, cli, ats, keywords, zod]
depends_on:
  requires: ["16-01", "16-02"]
  provides: ["keywords-analysis-command", "ats-keyword-optimization"]
  affects: ["17-*"]
tech_stack:
  added: []
  patterns: ["LLM-keyword-extraction", "schema-validated-output"]
key_files:
  created:
    - packages/cli/src/ai/workflow/schemas/keywords-output.ts
    - packages/cli/src/ai/prompts/templates/keywords.njk
    - packages/cli/src/ai/generators/keywords.ts
    - packages/cli/src/commands/ai/keywords.ts
  modified:
    - packages/cli/src/ai/workflow/schemas/index.ts
    - packages/cli/src/ai/prompts/registry.ts
    - packages/cli/src/ai/generators/index.ts
    - packages/cli/src/commands/ai.ts
decisions:
  - id: "16-05-01"
    title: "LLM for keyword extraction"
    rationale: "LLM can identify required vs preferred keywords from natural language job postings"
  - id: "16-05-02"
    title: "match_mode option in prompt"
    rationale: "Prompt template supports both fuzzy and exact matching via options flag"
metrics:
  duration: "~6 minutes"
  completed: "2026-01-26"
---

# Phase 16 Plan 05: Keywords Analysis Command Summary

Keywords analyzer command for ATS optimization using LLM-based keyword extraction.

## One-Liner

ATS keyword analysis with LLM extraction, coverage scoring, and placement suggestions using Zod-validated schema.

## What Was Built

### KeywordsOutputSchema (keywords-output.ts)
- `score`: Overall coverage percentage (0-100)
- `byCategory.required/preferred`: Categorized keywords with found/missing status
- `bySection`: Placement suggestions with rewritten content
- `highCoverage`: Boolean flag for >90% coverage celebration

### Keywords Prompt Template (keywords.njk)
- Full CV content rendering for analysis
- Job description integration
- Dynamic match_mode (fuzzy vs exact)
- Quality guidelines for different coverage levels

### Keywords Generator (keywords.ts)
- `analyzeKeywords(cv, locale, provider, jobDescription, options)` function
- Uses withRetry for API resilience
- System prompt for ATS expert context
- Zod schema validation via Output.object()

### CLI Command (keywords.ts)
- `cvgen ai keywords <name> --job <file>` with required job option
- `--exact` flag for strict matching mode
- Prominent color-coded coverage score display
- Required vs preferred keywords shown separately
- Section-based placement suggestions with rewrites

## Commits

| Hash | Description |
|------|-------------|
| e619225 | feat(16-05): add keywords output schema and prompt template |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed experimental_generateObject import**
- **Found during:** Task 1
- **Issue:** summary.ts used experimental_generateObject which was removed from ai SDK
- **Fix:** Changed to generateObject (non-experimental)
- **Files modified:** packages/cli/src/ai/generators/summary.ts

**2. [Rule 1 - Bug] Fixed implicit any types in tailor.ts**
- **Found during:** Task 2
- **Issue:** cvData and jobSource variables lacked type annotations
- **Fix:** Added CVLoadResult and JobDescriptionSource type annotations
- **Files modified:** packages/cli/src/commands/ai/tailor.ts

**3. [Rule 1 - Bug] Removed unused displayTailorResult function**
- **Found during:** Task 2
- **Issue:** Function was unused (lint error)
- **Fix:** Removed the function entirely
- **Files modified:** packages/cli/src/commands/ai/tailor.ts

## Verification Results

- `bun run typecheck`: Pass
- `bun run lint`: Pass (1 info-level warning in different file)
- `cvgen ai keywords --help`: Shows all options correctly

## Success Criteria Met

- [x] `cvgen ai keywords jane --job posting.txt` shows keyword analysis
- [x] Coverage score displayed prominently with color
- [x] Required and preferred keywords categorized
- [x] Placement suggestions include context
- [x] `--exact` flag switches to exact matching mode

## Next Phase Readiness

Phase 16-05 completes AI-08 (ATS keyword optimization). The command integrates with:
- Job description loading (from 16-01)
- Display utilities and keyword matcher (from 16-02)
- Provider abstraction (from 14-01)

Ready for Phase 17 (AI User Control) which may add:
- Interactive keyword selection
- Batch keyword analysis
- Integration with tailor command
