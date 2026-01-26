# Phase 16 Plan 06: Standalone Improve Generator (AI-09) Summary

**Completed:** 2026-01-26
**Duration:** ~7 minutes
**Status:** Complete

## One-liner

Standalone improvement analyzer with priority-grouped suggestions, weakness type categorization, and diff display integration for before/after comparisons.

## What Was Built

### Standalone Improve Generator (`packages/cli/src/ai/generators/improve-standalone.ts`)
- `generateImprovements()` - Main generator function with retry logic
- `ImprovementsOutputSchema` - Zod schema with priority levels and weakness types
- Priority levels: high, medium, low
- Weakness types: lacks_quantification, missing_outcome, too_generic, passive_voice
- Summary object with counts per priority level
- Uses `withRetry()` for resilient API calls

### Prompt Template (`packages/cli/src/ai/prompts/templates/improve-standalone.njk`)
- STAR method improvement guidance
- Priority level definitions (High/Medium/Low)
- Weak bullet indicators with examples
- Output requirements specification
- Metrics handling (extracted vs estimated)

### Enhanced Improve Command (`packages/cli/src/commands/ai/improve.ts`)
- Integrated `displayComparison` for diff display
- Side-by-side comparison when terminal >= 120 columns
- Inline diff when terminal < 120 columns
- Terminal width detection automatic

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ai/generators/improve-standalone.ts` | Priority-grouped improvement generator |
| `packages/cli/src/ai/prompts/templates/improve-standalone.njk` | Prompt template for improvements |
| `packages/cli/src/commands/ai/improve.ts` | Enhanced CLI with diff display |
| `packages/cli/src/ai/prompts/registry.ts` | Prompt registration (improve-standalone entry) |
| `packages/cli/src/ai/generators/index.ts` | Generator exports |

## Commits

| Hash | Message |
|------|---------|
| 5c4a7dd | feat(16-06): create standalone improve generator with priority grouping |
| c8c2ccf | feat(16-06): enhance improve command with diff display |

## Schema Details

### ImprovementsOutputSchema

```typescript
{
  improvements: [{
    section: string,      // CV section containing the bullet
    original: string,     // Original bullet text
    improved: string,     // Improved bullet text
    reasoning: string,    // Specific feedback on why improvement needed
    priority: 'high' | 'medium' | 'low',
    metrics?: string[],   // Quantifiable metrics added
    weaknessType?: string // lacks_quantification, missing_outcome, etc.
  }],
  summary: {
    total: number,
    high: number,
    medium: number,
    low: number
  },
  overallAssessment: string // Brief assessment of CV content quality
}
```

## Decisions Made

1. **Priority-based grouping** - Suggestions sorted by impact (High first, then Medium, then Low)
2. **Weakness type categorization** - Specific feedback types for actionable improvements
3. **Enhance existing command** - Added diff display to workflow improve rather than creating separate standalone command
4. **Use displayComparison** - Reuses existing diff-display infrastructure from 16-02

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `bun run typecheck` passes
- [x] `bun run lint` passes
- [x] `cvgen ai improve <name>` shows help correctly
- [x] Priority grouping in schema (high/medium/low)
- [x] Terminal width detection via displayComparison

## Technical Notes

### Diff Display Integration
- Uses `displayComparison` from `ai/display/diff-display.ts`
- Automatically adapts to terminal width (120 col threshold)
- Green + bold for additions, red + strikethrough for removals

### Generator Architecture
- Standalone generator separate from workflow stage
- Uses `renderRawPrompt` for flexible template rendering
- Includes `withRetry` for API call resilience
- Returns structured Zod-validated output

## Dependencies

No new dependencies added. Uses existing:
- `ai` package for `generateText` + `Output.object`
- `zod` for schema validation
- `diff` package (via displayComparison)

## Key Links Verified

| From | To | Via | Pattern |
|------|-----|-----|---------|
| improve.ts | diff-display.ts | Uses diff display | displayComparison |
| improve-standalone.ts | quality-labels.ts | Uses quality labels | formatPriority |

## Next Steps

Ready for Phase 16-07: Standalone tailor generator with multi-source job input.
