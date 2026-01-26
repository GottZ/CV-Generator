---
phase: 16-ai-content-generation
plan: 03
subsystem: ai-generators
tags: [bullets, STAR, cv.md, standalone-generator]

dependency-graph:
  requires: [16-01, 16-02]
  provides: [bullets-generator, bullets-command]
  affects: [wizard-integration]

tech-stack:
  added: []
  patterns: [standalone-generator, cv-format-output]

key-files:
  created:
    - packages/cli/src/ai/workflow/schemas/bullets-output.ts
    - packages/cli/src/ai/prompts/templates/bullets.njk
    - packages/cli/src/ai/generators/bullets.ts
    - packages/cli/src/commands/ai/bullets.ts
  modified:
    - packages/cli/src/ai/workflow/schemas/index.ts
    - packages/cli/src/ai/prompts/registry.ts
    - packages/cli/src/ai/generators/index.ts
    - packages/cli/src/commands/ai.ts

decisions: []

metrics:
  duration: ~6 minutes
  completed: 2026-01-26
---

# Phase 16 Plan 03: Bullets Generation Command Summary

**One-liner:** STAR-formatted achievement bullet generator with cv.md output and job tailoring support.

## What Was Built

### 1. BulletsOutputSchema (bullets-output.ts)

Zod schema for structured LLM output:

```typescript
// Core schema hierarchy
BulletsOutputSchema
  └── roles: RoleBulletsSchema[]
        ├── company, role, startDate, endDate
        ├── bullets: BulletSchema[]
        │     ├── text: string (40 words max)
        │     ├── starBreakdown?: { situation, task, action, result }
        │     ├── metrics?: string[]
        │     ├── keywords?: string[]
        │     └── quality: 'strong' | 'good' | 'needs_review'
        └── bulletCountReasoning: string
  └── overallQuality: 'strong' | 'good' | 'needs_review'
```

### 2. Prompt Template (bullets.njk)

Template features:
- Iterates over CV work experience by locale
- Dynamic bullet count guidance (3-8 based on complexity)
- Optional STAR breakdown inclusion via `options.showStar`
- Job description context for tailoring via `options.tailored`
- Grounding rules: only use metrics from CV, don't invent numbers

### 3. Generator Function (bullets.ts)

```typescript
export async function generateBullets(
  cv: CVData,
  locale: string,
  provider: AIProvider,
  options: BulletsOptions = {}
): Promise<BulletsOutput>
```

Features:
- Uses `renderPrompt` with standard PromptContext
- Retry logic via `withRetry` utility
- Structured output via `Output.object({ schema })`

### 4. CLI Command (bullets.ts command)

```
cvgen ai bullets <name> [options]

Options:
  --show-star            Include STAR breakdown in output
  --tailored             Use job description context
  --job <source>         Job description (file/URL)
  --provider <provider>  AI provider selection
  --output <file>        Write to file instead of stdout
  --quiet                Suppress non-error output
  --json                 Output as JSON
```

Output format:
- Default: cv.md formatted bullets with section headers
- JSON mode: raw BulletsOutput structure
- Quality labels shown per bullet and overall

## Key Patterns Used

1. **Standalone Generator Pattern**: Not part of workflow state, can be used independently
2. **cv.md Output Format**: Uses `formatBulletsAsCvMd` from display utilities
3. **Quality Traffic Light**: Uses `formatQualityLabel` for colored output
4. **Retry with Backoff**: Uses `withRetry` for API resilience

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate RawPromptContext export**
- **Found during:** Task 1 verification
- **Issue:** prompts/index.ts had both interface definition and re-export
- **Fix:** Removed redundant `export type { RawPromptContext }` line
- **Files modified:** packages/cli/src/ai/prompts/index.ts

**2. [Rule 1 - Bug] Fixed improve-standalone using wrong render function**
- **Found during:** Task 1 verification
- **Issue:** improve-standalone.ts used `renderPrompt` with non-standard context
- **Fix:** Changed to `renderRawPrompt` which accepts arbitrary context
- **Files modified:** packages/cli/src/ai/generators/improve-standalone.ts

**3. [Rule 1 - Bug] Fixed summary.ts using deprecated AI SDK API**
- **Found during:** Task 1 verification
- **Issue:** Used `generateObject` which doesn't exist in AI SDK 6
- **Fix:** Changed to `generateText` with `Output.object()` pattern
- **Files modified:** packages/cli/src/ai/generators/summary.ts

## Testing Notes

Manual verification performed:
- `cvgen ai bullets --help` shows correct usage and all options
- Typecheck passes
- Lint passes (after auto-fixes)

## Next Steps

- Integration with wizard for guided bullet generation
- Consider adding `--count` option to specify bullet count per role
- E2E tests with mock AI provider
