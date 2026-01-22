# Phase 03 Plan 03: Build Command Summary

**Completed:** 2026-01-22
**Duration:** ~8 minutes

## One-liner

Build command with full CV-to-HTML pipeline: parsing, rendering, image embedding, output writing, and watch mode.

## What Was Built

### Support Utilities

**output-writer.ts** - File output with automatic directory creation:
- `writeOutput(outputDir, filename, content)` - Creates dir if missing, writes file
- Returns `WriteResult` with path, bytes, overwritten flag

**fuzzy-matcher.ts** - Template name suggestions:
- `suggestTemplate(input, available)` - Fuse.js fuzzy matching
- `templateNotFoundError(templateId, available)` - Error with "Did you mean?" suggestion

**file-watcher.ts** - Chokidar-based file watching:
- `createWatcher(options)` - Watches people/ and templates/ directories
- `parseWatchFilter(filterArg)` - Parses `cv:name,t:template` filter syntax
- Debounced rebuilds (300ms) to handle rapid successive changes
- Ignores output/, node_modules/, .git/

### Build Command (`commands/build.ts`)

Full CV-to-HTML pipeline:

1. **Validation** - Checks person directory and template exist
2. **Parsing** - Uses `parseCV()` from @gottz/cv-core
3. **Locale detection** - Builds all locales in CV, or filtered by `--locale`
4. **Rendering** - Uses `renderCV()` from @gottz/cv-templates
5. **Image embedding** - Uses `embedImages()` for base64 data URIs
6. **Output** - Writes to `/people/{name}/output/{slug}_{template}_{locale}.html`

Features:
- Exit codes: 1 (parse error), 2 (template error), 3 (file error)
- JSON output mode (`--json`) for CI integration
- Quiet mode (`--quiet`) suppresses non-error output
- Watch mode (`--watch`) with filtered watching and debouncing
- ATS warnings displayed when images detected
- "Overwrote existing" message on regeneration

### CLI Integration (`index.ts`)

Commander.js wired to `buildAction`:
```bash
cvgen build <name> <template> [options]

Options:
  --format <formats>   Output formats (comma-separated: html,pdf,docx)
  --locale <locales>   Locales to build (comma-separated, default: all in CV)
  --watch [filter]     Watch for changes and rebuild (cv:name, t:template)
  --parallel           Build formats in parallel
  --sequential         Build formats sequentially (default)
  --quiet              Suppress non-error output
  --json               Output results as JSON
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 60dcacf | feat | Add build support utilities (output-writer, fuzzy-matcher, file-watcher) |
| 5c62280 | feat | Implement build command with CV-to-HTML flow |

## Files Changed

### Created
- `packages/cli/src/lib/output-writer.ts` (30 lines)
- `packages/cli/src/lib/fuzzy-matcher.ts` (28 lines)
- `packages/cli/src/lib/file-watcher.ts` (75 lines)
- `packages/cli/src/commands/build.ts` (270 lines)

### Modified
- `packages/cli/src/index.ts` (wired buildAction)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Fuse.js for fuzzy matching | Simple, well-tested library for template suggestions |
| lodash.debounce for watch | Standard debounce implementation, already a dependency |
| Exit code constants | Clear error categorization for scripting |
| Locale auto-detection | Builds all locales by default, filter with --locale |
| Format filtering | Gracefully skips unsupported formats with warning |

## Requirements Delivered

| Requirement | How Addressed |
|-------------|---------------|
| OUT-02 | HTML output with fully embedded CSS (self-contained) |
| OUT-04 | Output named {slug}_{template}_{locale}.html |
| OUT-05 | Regeneration overwrites with "Overwrote existing" message |
| OUT-06 | Output in /people/[name]/output/ directory |
| OUT-08 | Images base64 encoded via embedImages() |
| ATS-06 | Warning displayed when images detected |

## Verification

All verification criteria met:

- [x] `bun run typecheck` passes without errors
- [x] Build command creates HTML file at correct path
- [x] HTML file is self-contained with embedded CSS
- [x] Overwrite shows "Overwrote existing" message
- [x] JSON output is valid
- [x] Template suggestions work ("Did you mean 'base'?")
- [x] Watch mode detects changes and rebuilds (manual verification)

## Human Verification

Checkpoint approved by user after testing:
- Test CV created and built successfully
- Output file generated at expected path
- Overwrite behavior confirmed
- JSON output validated
- Template suggestion error confirmed

## Deviations from Plan

None. Implementation matched plan specifications.

## Next Phase Readiness

Phase 3 complete. Ready for:
- **Phase 4:** PDF Output (Puppeteer-based PDF generation)
- **Phase 5:** DOCX Output (docx library)
