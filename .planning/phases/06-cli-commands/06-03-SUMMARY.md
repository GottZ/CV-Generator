---
phase: 06-cli-commands
plan: 03
completed: 2026-01-23
subsystem: cli
tags: [cli, validate, list-templates, fuzzy-matching, commander]

dependency-graph:
  requires:
    - 06-01  # spinner, cli-table3 dependencies
  provides:
    - validate command action
    - list-templates command action
    - person fuzzy matcher
  affects:
    - 06-04  # watch mode may use validation

tech-stack:
  added: []
  patterns:
    - command-module pattern (separate file per command)
    - fuzzy matching for error suggestions
    - stats gathering from parsed CV

file-tracking:
  key-files:
    created:
      - packages/cli/src/commands/validate.ts
      - packages/cli/src/commands/list-templates.ts
    modified:
      - packages/cli/src/lib/fuzzy-matcher.ts
      - packages/cli/src/index.ts

decisions:
  - decision: "Person fuzzy matching threshold 0.4"
    rationale: "Same as template matching for consistency"
  - decision: "Stats format: sections, jobs, degrees, skill categories, locales"
    rationale: "Per CONTEXT.md user wants confidence about CV completeness"
  - decision: "cli-table3 cyan header styling"
    rationale: "Consistent with picocolors cyan used elsewhere"

metrics:
  duration: "4 minutes"
  tasks_completed: 4
  tasks_total: 4
---

# Phase 6 Plan 03: Validate and List-Templates Commands Summary

**One-liner:** Validate command checks CV structure and shows stats; list-templates displays formatted table with ATS compliance info.

## What Was Built

### validate command
- Checks person directory and cv.md existence
- Parses CV without generating output files
- Shows statistics: sections, jobs, degrees, skill categories, locales
- Displays parse errors with line numbers
- Suggests similar person names via fuzzy matching
- Always includes "Try: cvgen init <name>" hint for missing persons

### list-templates command
- Discovers templates in templates/ directory
- Displays formatted table with cli-table3
- Columns: Name, Description, ATS Compliant
- Cyan header styling for visual consistency
- Shows template count

### Extended fuzzy-matcher
- Added suggestPerson() function (same pattern as suggestTemplate)
- Added personNotFoundError() with suggestions and Try hint
- Shows available people if <= 5 entries

## Key Implementation Details

**validate.ts exports:**
- `validateAction(name: string, options: ValidateOptions): Promise<void>`
- `ValidateOptions` interface: locale?, quiet?, json?

**list-templates.ts exports:**
- `listTemplatesAction(options: ListTemplatesOptions): Promise<void>`
- `ListTemplatesOptions` interface: json?, quiet?

**fuzzy-matcher.ts additions:**
- `suggestPerson(input: string, available: string[]): string | null`
- `personNotFoundError(personName: string, available: string[]): Error`

**ValidationStats interface:**
```typescript
interface ValidationStats {
  sections: number;
  jobs: number;
  degrees: number;
  skillCategories: number;
  locales: string[];
}
```

## Commits

| Commit | Description |
|--------|-------------|
| d562178 | feat(06-03): extend fuzzy-matcher for person name suggestions |
| fdb0801 | feat(06-03): create validate command |
| 4a2fd1e | feat(06-03): register validate and list-templates commands |

Note: list-templates.ts was committed as part of a parallel plan's lint:fix operation (14b3b38).

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. `bun run typecheck` - PASS
2. `cvgen validate --help` - Shows command description and examples
3. `cvgen list-templates` - Shows table with Name | Description | ATS Compliant
4. `cvgen validate nonexistent` - Shows "Try: cvgen init nonexistent"
5. `cvgen validate testuer` - Shows "Did you mean 'testuser'?"
6. Both commands support --json output - PASS

## Success Criteria Status

| Criteria | Status |
|----------|--------|
| `cvgen validate johndoe` reports validation stats | PASS |
| `cvgen list-templates` displays formatted table | PASS |
| Person not found errors suggest similar names | PASS |
| All errors include "Try: ..." suggestions | PASS |
| Both commands work in quiet and json modes | PASS |

## Next Phase Readiness

**Ready for Plan 06-04:** Watch mode and build command enhancements
- validate command provides foundation for --dry-run preview
- Error messaging patterns established for consistency

## Files Reference

- `/workspace/packages/cli/src/commands/validate.ts` - Validate command implementation
- `/workspace/packages/cli/src/commands/list-templates.ts` - List templates command
- `/workspace/packages/cli/src/lib/fuzzy-matcher.ts` - Extended with person matching
- `/workspace/packages/cli/src/index.ts` - Commands registered with Commander
