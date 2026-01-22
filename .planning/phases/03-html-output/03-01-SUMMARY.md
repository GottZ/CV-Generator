---
phase: 03-html-output
plan: 01
status: complete
completed: 2026-01-22
subsystem: cli
tags: [commander, picocolors, cli, tty, console]

dependencies:
  requires: [02-03]
  provides: [cli-scaffold, console-utilities, build-command-skeleton]
  affects: [03-03, 06-cli-commands]

tech-stack:
  added: [commander, picocolors, chokidar, fuse.js, mime-types, lodash.debounce]
  patterns: [tty-detection, json-output-mode, commander-subcommands]

key-files:
  created:
    - packages/cli/src/lib/console.ts
  modified:
    - packages/cli/package.json
    - packages/cli/src/index.ts
    - packages/core/src/schema/contact.ts
    - packages/core/src/parser/frontmatter.ts
    - bun.lock

decisions:
  - id: tty-aware-output
    choice: "TTY detection for colored vs plain output"
    rationale: "Per RESEARCH.md Pattern 5: detect isTTY for piped vs interactive use"
  - id: json-output-mode
    choice: "JSON output mode for scripting"
    rationale: "Enables integration with CI/CD and other tools"
  - id: stderr-for-warnings
    choice: "Warnings go to stderr"
    rationale: "Per CONTEXT.md: ATS warnings should not interfere with stdout redirection"

metrics:
  duration: ~2m
  tasks_completed: 3
  commits: 3
---

# Phase 3 Plan 1: CLI Package Scaffold Summary

Commander.js CLI with build command skeleton, console utilities with TTY detection, and Contact schema slug field.

## What Was Built

### CLI Dependencies (package.json)

Added all required CLI dependencies to @gottz/cvgen:
- **commander** ^14.0.0 - CLI framework
- **sharp** ^0.33.0 - Image processing
- **chokidar** ^5.0.0 - File watching
- **picocolors** ^1.1.0 - Terminal colors
- **fuse.js** ^7.0.0 - Fuzzy matching for template suggestions
- **mime-types** ^2.1.0 - MIME type lookup
- **lodash.debounce** ^4.0.8 - Watch debouncing
- **@gottz/cv-templates** workspace:* - Template rendering

### Contact Schema (contact.ts)

Added optional `slug` field to Contact interface for filename override:
```typescript
/** Optional slug for filename (defaults to directory name) */
slug?: string;
```

Updated parseFrontmatter to extract slug from YAML frontmatter.

### Console Utilities (console.ts)

TTY-aware colored output system:

1. **createConsole(options)** - Factory for console with quiet/json modes
   - `success()` - Green checkmark or "OK:" prefix
   - `warn()` - Yellow warning to stderr
   - `error()` - Red X or JSON error object
   - `info()` - Cyan info message

2. **outputJson(result)** - Pretty-print JSON output

TTY Detection Logic:
- TTY mode: Colored output with Unicode symbols
- Pipe mode: Plain text prefixes (OK:, WARN:, ERROR:)
- JSON mode: Structured JSON output, suppresses non-error messages

### CLI Entry Point (index.ts)

Commander.js setup with build command skeleton:

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

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add CLI dependencies and slug field | ff7da28 | package.json, contact.ts, frontmatter.ts |
| 2 | Create console utilities | 54ca951 | console.ts |
| 3 | Create CLI entry point | 7ede769 | index.ts |

## Deviations from Plan

### Commit Order Note

Task 1 changes (CLI dependencies, slug field) were committed as part of a parallel 03-02 execution (commit ff7da28). The changes are correct and complete, just attributed to the other plan. This is normal when multiple plans execute concurrently.

## API Surface

```typescript
// From @gottz/cvgen/lib/console.ts

export interface ConsoleOptions {
  quiet?: boolean;
  json?: boolean;
}

export interface ConsoleResult {
  success: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export function createConsole(options: ConsoleOptions): ConsoleResult;

export interface JsonOutput {
  status: 'success' | 'error';
  files?: Array<{ path: string; bytes: number; overwritten: boolean }>;
  errors?: Array<{ code: number; message: string; line?: number }>;
  warnings?: string[];
}

export function outputJson(result: JsonOutput): void;
```

## Verification Results

```
bun install - OK (46 packages installed)
bun run typecheck - OK (no errors)
cvgen --help - Shows "Generate ATS-optimized CVs from markdown"
cvgen build --help - Shows all 7 options
Contact schema includes slug field
```

## Next Phase Readiness

Plan 03-01 complete. Foundation laid for:

- **Plan 03-02:** Image processing for HTML embedding (parallel, already committed)
- **Plan 03-03:** Build command implementation with HTML output
- **Plan 03-04:** Watch mode implementation

## Requirements Coverage

| Requirement | Status |
|------------|--------|
| CLI-01 (Commander.js CLI) | Foundation complete |
| CLI-02 (Build command) | Skeleton registered |
| CLI-03 (Watch mode option) | Option registered |
| CLI-04 (Format selection) | Option registered |
| DATA-09 (slug field) | Complete |

## Files Reference

- `/workspace/packages/cli/package.json` - CLI dependencies
- `/workspace/packages/cli/src/index.ts` - CLI entry point with Commander.js
- `/workspace/packages/cli/src/lib/console.ts` - Console utilities
- `/workspace/packages/core/src/schema/contact.ts` - Contact interface with slug
- `/workspace/packages/core/src/parser/frontmatter.ts` - Frontmatter parser with slug extraction
