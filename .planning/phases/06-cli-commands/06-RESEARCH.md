# Phase 6: CLI Commands - Research

**Researched:** 2026-01-23
**Domain:** CLI interface design, command patterns, terminal UX
**Confidence:** HIGH

## Summary

Phase 6 implements a complete CLI interface with four commands: `build` (already partially implemented), `init`, `validate`, and `list-templates`. The existing codebase provides a strong foundation with Commander.js 14+, picocolors, Fuse.js for fuzzy matching, and established patterns for console output and error handling.

Key findings:
- The `build` command exists with full functionality; needs enhancement for output feedback per CONTEXT.md
- Commander.js 14+ supports all required features including `addHelpText` for inline examples
- Spinners for slow operations should use `ora` (more robust) or `yocto-spinner` (smaller)
- Table formatting for `list-templates` should use `cli-table3`
- Sharp already installed; can create placeholder images with `sharp({ create: {...} })`
- Node.js built-in `readline` sufficient for interactive prompts (init overwrite confirmation)

**Primary recommendation:** Extend existing CLI structure with new commands, add ora spinner and cli-table3 dependencies, leverage existing console.ts and fuzzy-matcher.ts patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | ^14.0.0 | CLI framework | Industry standard, TypeScript support, negatable options |
| picocolors | ^1.1.0 | Terminal colors | Already in use, smallest color library, TTY-aware |
| fuse.js | ^7.0.0 | Fuzzy matching | Already in use for template suggestions |
| sharp | ^0.33.0 | Image generation | Already in use, can create placeholder images |

### New Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ora | ^8.0.0 | Terminal spinner | PDF/DOCX generation progress indicator |
| cli-table3 | ^0.6.5 | Table formatting | list-templates output display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ora | yocto-spinner | Smaller (3KB vs 50KB), but less robust edge case handling |
| cli-table3 | console-table-printer | More features but larger, cli-table3 is sufficient |
| readline | inquirer | Overkill for simple y/n prompts, adds dependency |

**Installation:**
```bash
cd packages/cli && bun add ora cli-table3
```

## Architecture Patterns

### Recommended Command Structure
```
packages/cli/src/
├── index.ts              # Main entry, Commander program setup
├── commands/
│   ├── build.ts          # [EXISTS] Extend with spinner, feedback
│   ├── init.ts           # [NEW] Scaffold new CV directory
│   ├── validate.ts       # [NEW] Check markdown without generating
│   └── list-templates.ts # [NEW] Display templates table
├── lib/
│   ├── console.ts        # [EXISTS] Terminal output utilities
│   ├── fuzzy-matcher.ts  # [EXISTS] Suggestion generation
│   ├── spinner.ts        # [NEW] Ora wrapper with TTY detection
│   ├── prompts.ts        # [NEW] Interactive readline prompts
│   └── scaffolder.ts     # [NEW] Init directory/file creation
```

### Pattern 1: Command Module Pattern
**What:** Each command in separate file exporting action function
**When to use:** All commands
**Example:**
```typescript
// Source: Existing build.ts pattern
export interface ValidateOptions {
  locale?: string;
  quiet?: boolean;
  json?: boolean;
}

export async function validateAction(
  name: string,
  options: ValidateOptions,
): Promise<void> {
  // Command implementation
}
```

### Pattern 2: Spinner Wrapper with TTY Detection
**What:** Wrap ora to respect --quiet and non-TTY environments
**When to use:** PDF/DOCX generation (slow operations)
**Example:**
```typescript
// Source: ora documentation + existing console.ts pattern
import ora, { type Ora } from 'ora';

interface SpinnerOptions {
  quiet?: boolean;
  json?: boolean;
}

export function createSpinner(text: string, options: SpinnerOptions): Ora | null {
  // Don't show spinner if quiet/json mode or non-interactive
  if (options.quiet || options.json || !process.stdout.isTTY) {
    return null;
  }
  return ora({ text, color: 'cyan' }).start();
}

// Usage in build.ts
const spinner = createSpinner('Generating PDF...', options);
try {
  await generatePdf(/* ... */);
  spinner?.succeed('PDF generated');
} catch (error) {
  spinner?.fail('PDF generation failed');
  throw error;
}
```

### Pattern 3: Table Output for Templates
**What:** Formatted table with columns for Name, Description, ATS Compliant
**When to use:** list-templates command
**Example:**
```typescript
// Source: cli-table3 documentation
import Table from 'cli-table3';

function formatTemplatesTable(templates: DiscoveredTemplate[]): string {
  const table = new Table({
    head: ['Name', 'Description', 'ATS Compliant'],
    style: { head: ['cyan'] },
  });

  for (const t of templates) {
    table.push([
      t.id,
      t.config.description,
      t.config.atsCompliant ? 'Yes' : 'No',
    ]);
  }

  return table.toString();
}
```

### Pattern 4: Interactive Prompt for Init Overwrite
**What:** readline-based y/n prompt for existing directory handling
**When to use:** init command when directory exists
**Example:**
```typescript
// Source: Node.js readline documentation
import * as readline from 'node:readline/promises';

async function promptOverwrite(dirPath: string): Promise<'overwrite' | 'skip' | 'cancel'> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(
      `Directory "${dirPath}" exists. [o]verwrite, [s]kip, or [c]ancel? `
    );
    const normalized = answer.toLowerCase().trim();
    if (normalized === 'o' || normalized === 'overwrite') return 'overwrite';
    if (normalized === 's' || normalized === 'skip') return 'skip';
    return 'cancel';
  } finally {
    rl.close();
  }
}
```

### Pattern 5: Placeholder Image Generation
**What:** Create solid color placeholder with "PHOTO" text using Sharp
**When to use:** init command to create images/photo.jpg placeholder
**Example:**
```typescript
// Source: https://mitjafelicijan.com/create-placeholder-images-with-sharp.html
import sharp from 'sharp';

async function createPlaceholderPhoto(): Promise<Buffer> {
  const width = 200;
  const height = 250;
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#CCCCCC"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="24"
            fill="#666666" text-anchor="middle" dominant-baseline="middle">
        PHOTO
      </text>
    </svg>`;

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 204, g: 204, b: 204, alpha: 1 },
    },
  })
    .composite([{ input: Buffer.from(svg), gravity: 'center' }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
```

### Pattern 6: Validation Stats Summary
**What:** Parse CV and report statistics without generating files
**When to use:** validate command success output
**Example:**
```typescript
// Source: CONTEXT.md requirement
interface ValidationStats {
  sections: number;
  jobs: number;
  degrees: number;
  skillCategories: number;
  locales: string[];
}

function gatherStats(cv: CVData): ValidationStats {
  const locales = new Set<string>();
  let jobs = 0;
  let degrees = 0;
  let skillCategories = 0;

  // Count experience entries
  if (cv.experience) {
    for (const [locale, entries] of Object.entries(cv.experience)) {
      locales.add(locale);
      jobs += entries.length;
    }
  }
  // ... similar for education, skills

  return {
    sections: Object.keys(cv).filter(k => k !== 'contact').length,
    jobs,
    degrees,
    skillCategories,
    locales: Array.from(locales),
  };
}

// Output: "Valid: 4 sections, 3 jobs, 2 degrees"
```

### Anti-Patterns to Avoid
- **Blocking stdout with spinners during piped output:** Always check `process.stdout.isTTY`
- **Hardcoded colors without TTY check:** Use existing console.ts pattern with picocolors
- **Sync file operations:** Always use async/await with Bun.file() or fs/promises
- **Exit without cleanup:** Ensure browser closes even on error (build command does this)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching | Custom Levenshtein | Fuse.js (installed) | Edge cases, performance |
| Terminal colors | ANSI escape codes | picocolors (installed) | Cross-platform, TTY detection |
| CLI option parsing | Manual argv parsing | Commander.js (installed) | Validation, help generation |
| Spinner animation | setInterval + cursor | ora | Cleanup, cross-platform |
| Table formatting | Manual string padding | cli-table3 | Unicode handling, alignment |
| Image generation | Canvas or raw pixels | Sharp (installed) | Performance, format support |

**Key insight:** Terminal UX has many edge cases (Windows, piped output, non-TTY, color support). Established libraries handle these reliably.

## Common Pitfalls

### Pitfall 1: Spinner Persists After Error
**What goes wrong:** Spinner animation continues after uncaught exception
**Why it happens:** Process exits before spinner cleanup
**How to avoid:** Always use try/finally or spinner?.fail() before throwing
**Warning signs:** Garbled terminal output after CLI error

### Pitfall 2: Colors in Piped Output
**What goes wrong:** ANSI codes appear as garbage in file redirections
**Why it happens:** Output goes to non-TTY but colors still applied
**How to avoid:** Check `process.stdout.isTTY` before coloring (existing pattern)
**Warning signs:** `^[[32m` sequences in output files

### Pitfall 3: Commander --no-* Option Handling
**What goes wrong:** `options.pdf` is `false` not `options.noPdf` is `true`
**Why it happens:** Commander negates the option name, not adds "no" prefix
**How to avoid:** Check `options.pdf === false` not `options.noPdf === true`
**Warning signs:** Options seem to have no effect (already handled in build.ts)

### Pitfall 4: Readline Prompt Not Closing
**What goes wrong:** CLI hangs after prompt answer
**Why it happens:** readline interface keeps process alive
**How to avoid:** Always call `rl.close()` in finally block
**Warning signs:** Process doesn't exit after successful operation

### Pitfall 5: Init Creates Empty Directories
**What goes wrong:** Init creates output/ directory (should be created by build)
**Why it happens:** Developer assumed all directories needed upfront
**How to avoid:** Per CONTEXT.md: output directory NOT created by init
**Warning signs:** Empty output/ folder in scaffolded CV

### Pitfall 6: Exit Codes Not Propagating
**What goes wrong:** CLI exits 0 even on validation failure
**Why it happens:** Async errors not caught at top level
**How to avoid:** Use process.exit() with appropriate code, catch in parseAsync
**Warning signs:** CI pipelines pass despite errors

## Code Examples

Verified patterns from official sources:

### Commander Help with Examples
```typescript
// Source: https://github.com/tj/commander.js documentation
program
  .command('build')
  .description('Build CV output files')
  .argument('<name>', 'Person directory name')
  .argument('<template>', 'Template ID to use')
  .addHelpText('after', `
Examples:
  $ cvgen build johndoe modern
  $ cvgen build johndoe base --locale en --no-pdf
  $ cvgen build johndoe modern --watch
`);
```

### Ora Spinner with Promise
```typescript
// Source: https://github.com/sindresorhus/ora
import ora from 'ora';

const spinner = ora('Loading...').start();

try {
  await someAsyncOperation();
  spinner.succeed('Done!');
} catch (error) {
  spinner.fail('Failed');
  throw error;
}
```

### CLI-Table3 Basic Usage
```typescript
// Source: https://github.com/cli-table/cli-table3
import Table from 'cli-table3';

const table = new Table({
  head: ['Name', 'Description', 'ATS'],
  colWidths: [15, 50, 10],
});

table.push(['base', 'Clean, ATS-optimized template', 'Yes']);
console.log(table.toString());
```

### Sharp Placeholder Image Creation
```typescript
// Source: https://mitjafelicijan.com/create-placeholder-images-with-sharp.html
import sharp from 'sharp';

const placeholder = await sharp({
  create: {
    width: 200,
    height: 250,
    channels: 4,
    background: { r: 204, g: 204, b: 204, alpha: 1 },
  },
})
.jpeg()
.toBuffer();
```

### Slugify Name for Directory
```typescript
// Source: CONTEXT.md requirement "John Doe" -> "john-doe"
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| console.log colors | picocolors/chalk | 2023+ | Smaller, faster, auto TTY detection |
| inquirer for all prompts | readline/promises | Node 18+ | Built-in, no dependency for simple prompts |
| cli-table | cli-table3 | 2022+ | Maintained fork, better ANSI support |
| ora only option | yocto-spinner alternative | 2024 | Choice based on size vs features |

**Deprecated/outdated:**
- cli-table (original): Unmaintained, use cli-table3
- cli-table2: Also unmaintained, cli-table3 is the successor
- chalk: Still works but picocolors is smaller and faster

## Exit Code Convention

Per CONTEXT.md (Claude's discretion), recommend standard POSIX-style exit codes:

| Exit Code | Meaning | When Used |
|-----------|---------|-----------|
| 0 | Success | All operations completed |
| 1 | Parse error | Invalid markdown syntax |
| 2 | Template error | Template not found or invalid |
| 3 | File error | File not found, permission denied |
| 4 | Validation error | Schema violations in validate command |
| 130 | SIGINT | User cancelled (Ctrl+C) |

The existing build.ts already uses codes 1-3; extend pattern to new commands.

## Open Questions

Things that couldn't be fully resolved:

1. **System locale detection fallback**
   - What we know: LANG/LC_ALL environment variables, fall back to 'en'
   - What's unclear: Exact parsing of LANG (e.g., "en_US.UTF-8" -> "en")
   - Recommendation: Use `Intl.DateTimeFormat().resolvedOptions().locale` or parse LANG prefix

2. **Dry-run format selection**
   - What we know: --dry-run shows what would be generated
   - What's unclear: Exact output format (list files? show config?)
   - Recommendation: Show file paths that would be created, similar to validate success

## Sources

### Primary (HIGH confidence)
- Existing codebase: `/workspace/packages/cli/src/` - established patterns
- [Commander.js GitHub](https://github.com/tj/commander.js) - addHelpText, negatable options
- [Ora GitHub](https://github.com/sindresorhus/ora) - spinner API and methods
- [cli-table3 GitHub](https://github.com/cli-table/cli-table3) - table formatting
- [Sharp placeholder tutorial](https://mitjafelicijan.com/create-placeholder-images-with-sharp.html) - image creation pattern
- [Node.js readline/promises](https://nodejs.org/api/readline.html) - interactive prompts

### Secondary (MEDIUM confidence)
- [Node.js Exit Codes](https://www.geeksforgeeks.org/node-js/node-js-exit-codes/) - exit code conventions
- [LogRocket Commander TypeScript](https://blog.logrocket.com/building-typescript-cli-node-js-commander/) - TypeScript patterns

### Tertiary (LOW confidence)
- None - all findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing codebase established, only adding ora/cli-table3
- Architecture: HIGH - extending existing command pattern from build.ts
- Pitfalls: HIGH - based on official documentation warnings and existing code

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable libraries, no breaking changes expected)
