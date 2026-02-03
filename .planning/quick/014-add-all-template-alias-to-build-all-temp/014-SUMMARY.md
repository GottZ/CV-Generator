---
task: 014
type: quick
status: complete
completed: 2026-02-03
duration: 5min
commits:
  - 530989b: feat(quick-014): add 'all' template alias to build command
  - 4a12ca7: docs(quick-014): update CLI help text for 'all' template alias
files_modified:
  - packages/cli/src/commands/build.ts
  - packages/cli/src/index.ts
---

# Quick Task 014: Add "all" Template Alias to Build Command

**One-liner:** Added `cvgen build <name> all` to generate CVs with all available templates in a single command.

## What Was Done

### Task 1: Add "all" template handling to buildAction (530989b)

Modified `packages/cli/src/commands/build.ts` to handle `template="all"`:

- Added check for watch mode incompatibility with "all" (exits with helpful error)
- Discovers all templates via `discoverTemplates(templatesDir)`
- Iterates through each template, calling `runBuild()` for each
- Uses try/catch per template to continue on failure (graceful degradation)
- Returns early after processing all templates

Key code addition (lines 88-130):

```typescript
// "all" template alias - build with all available templates
if (template === 'all') {
  // Watch mode doesn't make sense with "all" templates
  if (options.watch) {
    cons.error('Watch mode not supported with "all" templates. Specify a single template.');
    process.exit(1);
  }

  const templates = await discoverTemplates(templatesDir);
  // ... discover, iterate, build each
}
```

### Task 2: Update CLI help text and examples (4a12ca7)

Modified `packages/cli/src/index.ts`:

- Updated template argument description from `'Template ID to use (e.g., base, or "auto")'` to `'Template ID to use (e.g., base, "auto" for single, or "all" for all templates)'`
- Added example: `$ cvgen build johndoe all               # Build with all available templates`

## Verification Results

1. `bun run cvgen build janetzky all --dry-run` - Shows files for all 3 templates (classic, minimal, modern)
2. `bun run cvgen build janetzky all --watch` - Correctly produces error: "Watch mode not supported with 'all' templates"
3. `bun run cvgen build --help` - Shows "all" in description and examples
4. `bun run typecheck` - No type errors

## Deviations from Plan

None - plan executed exactly as written.

## Usage

```bash
# Generate CVs for all templates at once
cvgen build janetzky all

# Dry-run to see what would be generated
cvgen build janetzky all --dry-run

# Only English locale with all templates
cvgen build janetzky all --locale en

# HTML only for quick comparison
cvgen build janetzky all --html-only
```
