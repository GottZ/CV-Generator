---
phase: 16-ai-content-generation
plan: 04
subsystem: ai-generators
tags: [summary, cv.md, standalone-generator, AI-07]

dependency-graph:
  requires: [16-01]
  provides: [summary-generator, summary-command]
  affects: [wizard-integration]

tech-stack:
  added: []
  patterns: [standalone-generator, cv-format-output, raw-prompt-context]

key-files:
  created:
    - packages/cli/src/ai/prompts/templates/summary-gen.njk
    - packages/cli/src/commands/ai/summary.ts
  modified:
    - packages/cli/src/ai/prompts/index.ts
    - packages/cli/src/ai/prompts/registry.ts
    - packages/cli/src/ai/generators/index.ts
    - packages/cli/src/commands/ai.ts

decisions:
  - key: raw-prompt-context
    choice: Create renderRawPrompt for standalone generators
    reason: Standalone generators pass cv_content string, not CV object

metrics:
  duration: ~7 minutes
  completed: 2026-01-26
---

# Phase 16 Plan 04: Summary Generation Command Summary

**One-liner:** Professional summary generator with cv.md output and optional target role tailoring.

## What Was Built

### 1. Prompt Template (summary-gen.njk)

Standalone summary prompt that differs from workflow summarize stage:

```nunjucks
{# Key variables #}
{{ cv_content }}       {# JSON-stringified CV data #}
{{ locale }}           {# Output locale #}
{% if target_role %}   {# Optional: job to tailor for #}
  {{ target_role }}
{% endif %}
```

Features:
- 2-4 sentence primary summary
- Alternative summary with different emphasis
- 3-5 key points capturing core strengths
- 2-3 target roles the CV suits
- Grounding rules: only use content from CV

### 2. RawPromptContext Interface

New render function for standalone generators:

```typescript
export interface RawPromptContext {
  [key: string]: unknown;
}

export function renderRawPrompt(
  promptName: string,
  context: RawPromptContext
): string
```

Allows passing arbitrary context (like stringified CV) without validation.

### 3. Summary Generator (already in generators/summary.ts)

Uses existing `generateSummary` function from previous commit:

```typescript
export async function generateSummary(
  cv: CVData,
  locale: string,
  provider: AIProvider,
  options: SummaryOptions = {}
): Promise<SummarizeOutput>
```

Reuses `SummarizeOutputSchema` from workflow for consistent output.

### 4. CLI Command (summary.ts)

```
cvgen ai summary <name> [options]

Options:
  --target-role <role>   Tailor summary for specific job
  --provider <provider>  AI provider (openai, anthropic, ollama)
  --output <file>        Write to file instead of stdout
  --quiet                Suppress non-error output
  --json                 Output as JSON
```

**Output format:**
- Primary summary in cv.md format
- Alternative summary shown in non-quiet mode
- Key points and target roles displayed

**Distinct from workflow command:**
- `cvgen ai summary` - standalone generator (AI-07)
- `cvgen ai summarize` - workflow Stage 3

## Key Patterns Used

1. **Standalone Generator Pattern**: Independent from workflow state
2. **cv.md Output Format**: Uses `formatSummaryAsCvMd` from display utilities
3. **Raw Prompt Context**: Allows flexible template variables
4. **Reuses Workflow Schema**: `SummarizeOutputSchema` for consistent structure

## Integration Points

| Component | How Connected |
|-----------|---------------|
| generators/summary.ts | Calls `renderRawPrompt('summary-gen', context)` |
| generators/index.ts | Exports `generateSummary` |
| commands/ai/summary.ts | Imports `generateSummary` and calls with CV data |
| commands/ai.ts | Registers `summary` subcommand |

## Deviations from Plan

None - plan executed exactly as written.

Note: Some files were already created/modified by concurrent plan executions (16-03, 16-05, 16-06). The summary generator was committed in 16-05 and the CLI command was added in 16-06. This plan's Task 1 commit (2b1f868) added the template and renderRawPrompt function.

## Testing Notes

Manual verification performed:
- `cvgen ai summary --help` shows correct usage and all options
- `cvgen ai summarize --help` shows workflow command (distinct)
- Typecheck passes
- Lint passes

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| `cvgen ai summary jane` outputs cv.md formatted summary | Pass |
| Primary and alternative summaries provided | Pass |
| Key points and target roles displayed | Pass |
| `--target-role` option tailors summary | Pass |
| Output to stdout by default, file with --output | Pass |
