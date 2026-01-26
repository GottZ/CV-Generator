# Phase 17: AI User Control - Research

**Researched:** 2026-01-26
**Domain:** Interactive CLI Review Flow for AI-Generated Content
**Confidence:** HIGH

## Summary

Phase 17 implements an interactive review system where users control AI-generated CV improvements one bullet at a time. The research confirms that the standard Node.js stack for this pattern is the `@inquirer/expand` prompt for git-add-p-style single-key actions, combined with `external-editor` for $EDITOR spawning. The existing `displayComparison()` from Phase 16-02 provides diff rendering, eliminating the need for additional diff display libraries.

The architecture follows the proven "interactive patch" pattern popularized by `git add -p`: show content, offer single-key choices (a/e/s/r/A/S), handle each action, repeat. The key technical challenges are: (1) raw mode keypress handling with proper Ctrl+C support, (2) cross-platform editor spawning with temp file management, (3) similarity detection for regeneration using Jaccard index, and (4) atomic file writes with backup.

**Primary recommendation:** Use `@inquirer/expand` for the accept/edit/skip/regenerate prompt (provides single-key shortcuts with help expansion), `external-editor` for $EDITOR spawning, and native Node.js readline for any custom keypress needs. Implement Jaccard similarity inline (simple function, no library needed). Create backup via `fs.copyFileSync()` before writing.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@inquirer/expand` | 4.x | Single-key action prompts (a/e/s/r/A/S) | Git add -p style, built-in help, modern API |
| `@inquirer/confirm` | 4.x | Yes/no confirmations (final write) | Simple y/n with defaults |
| `external-editor` | 3.x | $EDITOR/$VISUAL spawning | Handles temp files, cross-platform |
| `diff` | 8.x (existing) | Text comparison for regeneration detection | Already installed from Phase 16 |
| `picocolors` | 1.x (existing) | Terminal coloring | Already installed, lightweight |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `string-comparison` | 1.x | Jaccard similarity for regen detection | If inline implementation insufficient |
| `write-file-atomic` | 6.x | Atomic file writes | For extra safety beyond backup |
| `readline` (builtin) | N/A | Raw keypress events | Custom key handling if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@inquirer/expand` | Native readline rawMode | Inquirer handles edge cases, has help built-in |
| `external-editor` | Manual `spawnSync` + `tmp` | external-editor wraps both with error handling |
| `string-comparison` | Inline Jaccard function | Inline is simpler for one use case |
| `write-file-atomic` | fs.copyFileSync backup | Backup approach is simpler, sufficient |

**Installation:**
```bash
cd packages/cli && bun add @inquirer/prompts external-editor
```

Note: `@inquirer/prompts` bundles expand, confirm, input, select, and other prompt types.

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── ai/
│   ├── review/                      # NEW: Interactive review system
│   │   ├── index.ts                 # Exports all review functions
│   │   ├── review-session.ts        # Main review loop orchestrator
│   │   ├── review-prompt.ts         # @inquirer/expand prompt wrapper
│   │   ├── editor-integration.ts    # $EDITOR spawning with temp files
│   │   ├── regeneration.ts          # Regen logic with similarity detection
│   │   └── file-writer.ts           # Backup + atomic write to cv.md
│   ├── display/                     # Existing from Phase 16
│   │   └── diff-display.ts          # displayComparison() - REUSE
│   └── generators/                  # Existing from Phase 16
│       └── improve-standalone.ts    # generateImprovements() - REUSE
└── commands/
    └── ai/
        └── improve.ts               # EXTEND with interactive review
```

### Pattern 1: Interactive Review Session (git add -p style)
**What:** Process suggestions one at a time with single-key actions
**When to use:** Main review flow after AI generates improvements
**Example:**
```typescript
// Source: CONTEXT.md review flow specification
import { expand } from '@inquirer/prompts';
import { displayComparison } from '../display/diff-display.ts';

interface ReviewChoice {
  action: 'accept' | 'edit' | 'skip' | 'regenerate' | 'accept_all' | 'skip_all';
}

export async function promptReviewAction(
  original: string,
  suggested: string,
  context: { section: string; index: number; total: number }
): Promise<ReviewChoice> {
  // Show context header
  console.log(`\n[${context.section}] (${context.index}/${context.total})\n`);

  // Show diff using existing Phase 16-02 infrastructure
  console.log(displayComparison(original, suggested));
  console.log();

  const answer = await expand({
    message: 'Action',
    default: 'a',
    choices: [
      { key: 'a', name: 'Accept this suggestion', value: 'accept' },
      { key: 'e', name: 'Edit in $EDITOR', value: 'edit' },
      { key: 's', name: 'Skip (keep original)', value: 'skip' },
      { key: 'r', name: 'Regenerate with guidance', value: 'regenerate' },
      { key: 'A', name: 'Accept ALL remaining', value: 'accept_all' },
      { key: 'S', name: 'Skip ALL remaining', value: 'skip_all' },
      // 'h' for help is automatically included by @inquirer/expand
    ],
  });

  return { action: answer };
}
```

### Pattern 2: External Editor Integration
**What:** Spawn $EDITOR with temp file containing original + suggestion
**When to use:** User presses 'e' to edit a suggestion
**Example:**
```typescript
// Source: external-editor npm package + CONTEXT.md edit spec
import { edit } from 'external-editor';

interface EditorResult {
  content: string | null;  // null if user cancelled (empty)
  cancelled: boolean;
}

export function openInEditor(
  original: string,
  suggested: string
): EditorResult {
  // Create temp file content per CONTEXT.md specification
  const tempContent = `# Original (read-only reference):
# ${original}

# Edit the suggestion below (delete all to cancel):
${suggested}
`;

  try {
    // external-editor handles:
    // - $VISUAL / $EDITOR / vi fallback
    // - Temp file creation and cleanup
    // - Sync execution (required for editor to control terminal)
    const edited = edit(tempContent, {
      postfix: '.md',  // Syntax highlighting hint
    });

    // Strip comment lines and trim
    const content = edited
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .join('\n')
      .trim();

    // Empty content = cancel
    if (!content) {
      return { content: null, cancelled: true };
    }

    return { content, cancelled: false };
  } catch (error) {
    // Editor errors (e.g., user killed editor without saving)
    console.error('Editor session cancelled or failed');
    return { content: null, cancelled: true };
  }
}
```

### Pattern 3: Regeneration with Direction and Similarity Detection
**What:** Ask user for guidance, regenerate, detect similar results, show history
**When to use:** User presses 'r' to regenerate a suggestion
**Example:**
```typescript
// Source: CONTEXT.md regeneration spec
import { input } from '@inquirer/prompts';

interface RegenerationAttempt {
  text: string;
  temperature: number;
}

export async function regenerateWithGuidance(
  original: string,
  currentSuggestion: string,
  history: RegenerationAttempt[],
  generateFn: (guidance: string, temperature: number) => Promise<string>
): Promise<{ newSuggestion: string; history: RegenerationAttempt[] }> {
  // Prompt for direction per CONTEXT.md
  const guidance = await input({
    message: 'What would you like different?',
    default: '',
    // Show examples in prompt
  });
  console.log('(e.g., "more specific metrics", "focus on leadership", "shorter")');

  // Calculate temperature
  let temperature = 0.7;  // Base
  if (history.length > 0) {
    const lastTemp = history[history.length - 1].temperature;
    temperature = Math.min(1.0, lastTemp + 0.1);  // Auto-bump if similar
  }

  // Generate new suggestion
  const newText = await generateFn(guidance || '', temperature);

  // Check similarity with previous attempt
  if (history.length > 0) {
    const lastText = history[history.length - 1].text;
    const similarity = jaccardSimilarity(lastText, newText);

    if (similarity > 0.8) {
      console.log('Result similar to previous. Increasing variety...');
      temperature = Math.min(1.0, temperature + 0.1);
    }
  }

  // Update history (keep last 5)
  const newHistory = [...history, { text: newText, temperature }].slice(-5);

  return { newSuggestion: newText, history: newHistory };
}

// Simple Jaccard similarity for similarity detection
// No library needed - straightforward implementation
function jaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
```

### Pattern 4: History Selection (Multiple Attempts)
**What:** Display previous regeneration attempts for user selection
**When to use:** After regenerating, let user pick from history
**Example:**
```typescript
// Source: CONTEXT.md "Show up to last 5 attempts" spec
import { select } from '@inquirer/prompts';
import pc from 'picocolors';

export async function selectFromHistory(
  history: RegenerationAttempt[],
  current: string
): Promise<string> {
  // Display numbered history
  console.log(pc.bold('\nPrevious attempts:'));
  history.forEach((attempt, i) => {
    const marker = attempt.text === current ? ' <-- current' : '';
    console.log(`  ${i + 1}. ${truncate(attempt.text, 60)}${marker}`);
  });

  const answer = await select({
    message: 'Which version?',
    choices: [
      ...history.map((attempt, i) => ({
        name: `${i + 1}. ${truncate(attempt.text, 50)}`,
        value: attempt.text,
      })),
      { name: 'r. Regenerate again', value: '__regenerate__' },
    ],
  });

  return answer;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
```

### Pattern 5: Safe File Writing with Backup
**What:** Create backup before modifying cv.md, require explicit confirmation
**When to use:** Final write step after review session
**Example:**
```typescript
// Source: CONTEXT.md file safety spec
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { confirm } from '@inquirer/prompts';
import pc from 'picocolors';

interface WriteResult {
  success: boolean;
  backupPath?: string;
  error?: string;
}

export async function safeWriteCvFile(
  cvPath: string,
  newContent: string,
  changes: { accepted: number; skipped: number; edited: number }
): Promise<WriteResult> {
  // Show summary
  console.log(pc.bold('\nReview Summary:'));
  console.log(`  Accepted: ${pc.green(changes.accepted)}`);
  console.log(`  Skipped:  ${pc.yellow(changes.skipped)}`);
  console.log(`  Edited:   ${pc.blue(changes.edited)}`);

  // NEVER auto-write - require explicit confirmation
  const shouldWrite = await confirm({
    message: `Write changes to ${cvPath}?`,
    default: false,  // Safe default
  });

  if (!shouldWrite) {
    console.log(pc.dim('Changes discarded.'));
    return { success: false };
  }

  try {
    // Create backup per CONTEXT.md
    const backupPath = cvPath + '.bak';
    if (existsSync(cvPath)) {
      copyFileSync(cvPath, backupPath);
      console.log(pc.dim(`Backup created: ${backupPath}`));
    }

    // Write new content
    writeFileSync(cvPath, newContent, 'utf-8');
    console.log(pc.green(`Updated: ${cvPath}`));

    return { success: true, backupPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(pc.red(`Failed to write: ${message}`));
    return { success: false, error: message };
  }
}
```

### Pattern 6: Weak Bullet Detection and Inline Warning
**What:** Flag bullets with weaknesses and show inline warnings
**When to use:** During review, before showing each suggestion
**Example:**
```typescript
// Source: CONTEXT.md weak bullet spec, Phase 16-06 weakness types
import pc from 'picocolors';

type WeaknessType =
  | 'lacks_quantification'
  | 'missing_outcome'
  | 'too_generic'
  | 'passive_voice';

interface WeaknessWarning {
  type: WeaknessType;
  reason: string;
}

const WEAKNESS_REASONS: Record<WeaknessType, string> = {
  lacks_quantification: 'lacks specific numbers or metrics',
  missing_outcome: 'describes activity without result',
  too_generic: 'uses weak verbs or filler phrases',
  passive_voice: 'uses passive construction',
};

export function displayWeakBulletWarning(
  bullet: string,
  weakness: WeaknessType | undefined
): void {
  if (!weakness) return;

  // Format: [!] [Bullet text] -- lacks quantification
  // Yellow warning indicator
  console.log(
    pc.yellow('[!]') + ' ' +
    bullet + ' ' +
    pc.dim('-- ' + WEAKNESS_REASONS[weakness])
  );
}
```

### Anti-Patterns to Avoid
- **Auto-writing without confirmation:** NEVER write to cv.md without explicit "y" confirmation
- **Blocking event loop during editor:** Use `external-editor` which handles sync properly
- **Ignoring TTY detection:** Check `process.stdin.isTTY` before raw mode operations
- **Hardcoded editor path:** Always respect $VISUAL > $EDITOR > vi fallback
- **No backup before write:** Always create cv.md.bak before modifying
- **Losing regeneration history:** Keep last 5 attempts for user reference
- **Raw mode without Ctrl+C handling:** @inquirer handles this; if using raw mode directly, handle manually

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Single-key prompts with help | readline rawMode + switch | `@inquirer/expand` | Handles edge cases, has built-in 'h' for help |
| $EDITOR spawning | spawnSync + tmp file | `external-editor` | Handles $VISUAL/$EDITOR/vi, temp cleanup, errors |
| Diff display | Manual string comparison | `displayComparison()` (Phase 16) | Already exists, handles terminal width |
| Yes/No confirmation | readline question | `@inquirer/confirm` | Handles y/n/Y/N, defaults, validation |
| Terminal width detection | Manual `process.stdout.columns` | Existing `getTerminalWidth()` | Already has fallback for non-TTY |
| Similarity detection (complex) | Multiple algorithms | Simple Jaccard inline | For 80% threshold, word-based Jaccard is sufficient |
| Atomic file write | Write + rename | `fs.copyFileSync` backup | Backup is simpler, sufficient for CLI |

**Key insight:** The interactive review pattern is solved by `@inquirer/expand` + `external-editor`. These libraries handle the edge cases (terminal states, signal handling, cross-platform differences) that would otherwise require significant custom code.

## Common Pitfalls

### Pitfall 1: Raw Mode Cleanup on Exit
**What goes wrong:** Terminal stuck in raw mode after Ctrl+C or error
**Why it happens:** Setting `setRawMode(true)` without cleanup handlers
**How to avoid:** Use `@inquirer/prompts` which handles this; if manual, add SIGINT handler
**Warning signs:** Terminal echoes strangely after CLI exits, requires `reset` command

```typescript
// Prevention: @inquirer/prompts handles this automatically
// If using raw mode directly:
process.on('SIGINT', () => {
  process.stdin.setRawMode(false);
  process.exit(0);
});
```

### Pitfall 2: Editor Async/Sync Confusion
**What goes wrong:** Editor launches but immediately returns, or terminal input corrupted
**Why it happens:** Using async spawn when editor needs sync control of terminal
**How to avoid:** Use `external-editor` which uses sync operations by design
**Warning signs:** Editor flashes and closes, partial content, readline conflicts

```typescript
// Correct: external-editor uses sync by design
import { edit } from 'external-editor';
const result = edit(content);  // Blocks until editor closes

// WRONG: async spawn loses terminal control
import { spawn } from 'child_process';
spawn(editor, [tempFile], { stdio: 'inherit' });  // Doesn't wait!
```

### Pitfall 3: Non-TTY Environment Crashes
**What goes wrong:** CLI crashes when piped or run in CI
**Why it happens:** Prompts require TTY; raw mode fails on non-TTY
**How to avoid:** Check `process.stdin.isTTY`, provide non-interactive fallback
**Warning signs:** "Error: Input is not a TTY", crashes in CI

```typescript
// Prevention: Check TTY before interactive mode
if (!process.stdin.isTTY) {
  console.error('Interactive mode requires a terminal.');
  console.error('Use --accept-all or --json for non-interactive usage.');
  process.exit(1);
}
```

### Pitfall 4: Lost User Edits on Validation Failure
**What goes wrong:** User's edited content discarded when STAR check warns
**Why it happens:** Re-prompting without preserving edited content
**How to avoid:** Show warning but still offer to keep edited content
**Warning signs:** User complains "I edited it and it's gone"

```typescript
// Prevention: Warn but don't discard
const edited = openInEditor(original, suggested);
const starCheck = validateSTAR(edited.content);

if (starCheck.warnings.length > 0) {
  console.log(pc.yellow(`Warning: ${starCheck.warnings.join(', ')}`));
  const keep = await confirm({ message: 'Keep anyway?', default: true });
  if (keep) {
    return edited.content;  // Don't discard!
  }
  // Only now return to edit/regenerate
}
```

### Pitfall 5: Uppercase Keys Not Working
**What goes wrong:** 'A' for Accept All doesn't register
**Why it happens:** Key normalization converts to lowercase
**How to avoid:** `@inquirer/expand` handles this correctly with `key` property
**Warning signs:** Bulk actions don't work

```typescript
// Correct: @inquirer/expand handles case properly
choices: [
  { key: 'a', name: 'Accept', value: 'accept' },
  { key: 'A', name: 'Accept ALL', value: 'accept_all' },  // Uppercase works
]
```

### Pitfall 6: Backup Overwrites Previous Backup
**What goes wrong:** Multiple review sessions overwrite cv.md.bak
**Why it happens:** Always using same backup filename
**How to avoid:** Check if backup exists, or use timestamped backup
**Warning signs:** "I can't restore, backup is from different session"

```typescript
// Prevention: Warn if backup exists or use timestamp
const backupPath = existsSync(cvPath + '.bak')
  ? `${cvPath}.${Date.now()}.bak`
  : cvPath + '.bak';
```

## Code Examples

Verified patterns from official sources:

### Complete Review Session Loop
```typescript
// Source: Combined patterns from CONTEXT.md spec
import { expand, confirm, input } from '@inquirer/prompts';
import { edit } from 'external-editor';
import { displayComparison } from '../display/diff-display.ts';
import type { Improvement } from '../generators/improve-standalone.ts';

interface ReviewState {
  accepted: Improvement[];
  skipped: Improvement[];
  edited: Map<Improvement, string>;  // original -> edited content
}

export async function runReviewSession(
  improvements: Improvement[]
): Promise<ReviewState> {
  const state: ReviewState = {
    accepted: [],
    skipped: [],
    edited: new Map(),
  };

  let i = 0;
  while (i < improvements.length) {
    const imp = improvements[i];
    const remaining = improvements.length - i;

    // Display context and diff
    console.log(`\n${pc.dim(`[${imp.section}]`)} (${i + 1}/${improvements.length})`);

    // Show weak bullet warning if applicable
    if (imp.weaknessType) {
      displayWeakBulletWarning(imp.original, imp.weaknessType as WeaknessType);
    }

    console.log(displayComparison(imp.original, imp.improved));

    const action = await expand({
      message: `(${remaining} remaining)`,
      default: 'a',
      choices: [
        { key: 'a', name: 'Accept', value: 'accept' },
        { key: 'e', name: 'Edit', value: 'edit' },
        { key: 's', name: 'Skip', value: 'skip' },
        { key: 'r', name: 'Regenerate', value: 'regenerate' },
        { key: 'A', name: 'Accept ALL remaining', value: 'accept_all' },
        { key: 'S', name: 'Skip ALL remaining', value: 'skip_all' },
      ],
    });

    switch (action) {
      case 'accept':
        state.accepted.push(imp);
        i++;
        break;

      case 'skip':
        state.skipped.push(imp);
        i++;
        break;

      case 'edit':
        const result = openInEditor(imp.original, imp.improved);
        if (!result.cancelled && result.content) {
          state.edited.set(imp, result.content);
        }
        i++;  // Move forward even if cancelled
        break;

      case 'regenerate':
        // Handle regeneration (implementation in Pattern 3)
        // Don't increment i - stay on same item
        break;

      case 'accept_all':
        // Accept all remaining
        for (let j = i; j < improvements.length; j++) {
          state.accepted.push(improvements[j]);
        }
        i = improvements.length;  // Exit loop
        break;

      case 'skip_all':
        // Skip all remaining
        for (let j = i; j < improvements.length; j++) {
          state.skipped.push(improvements[j]);
        }
        i = improvements.length;  // Exit loop
        break;
    }
  }

  return state;
}
```

### TTY Detection and Fallback
```typescript
// Source: Node.js TTY documentation + CLI UX best practices
export function ensureInteractiveMode(options: { force?: boolean }): void {
  if (options.force) return;  // --force flag bypasses check

  if (!process.stdin.isTTY) {
    console.error(pc.red('Error: Interactive mode requires a terminal.'));
    console.error('');
    console.error('For non-interactive use:');
    console.error('  --json           Output suggestions as JSON');
    console.error('  --accept-all     Accept all suggestions without review');
    console.error('  --dry-run        Show changes without writing');
    process.exit(1);
  }
}
```

### Terminal Width-Aware Display
```typescript
// Source: Existing Phase 16-02 pattern
export function getTerminalWidth(): number {
  // process.stdout.columns is undefined in non-TTY
  return process.stdout.columns || 80;
}

export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

export function shouldUseSideBySide(): boolean {
  return getTerminalWidth() >= 120;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy Inquirer | `@inquirer/prompts` | 2024-2025 | Smaller bundles, modern API, TypeScript-first |
| Manual readline prompts | Dedicated prompt libraries | 2020+ | Better UX, consistent patterns |
| Custom editor spawning | `external-editor` | Established | Handles cross-platform edge cases |
| Read-line-sync | Native readline + async | Node 10+ | Better async patterns available |
| Callback-based prompts | Promise/async-await | ES2017+ | Cleaner control flow |

**Deprecated/outdated:**
- `inquirer` (legacy): Still maintained but `@inquirer/prompts` is recommended
- `readline-sync`: Blocking I/O, better alternatives exist
- Manual `spawnSync` for editors: `external-editor` handles edge cases

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Jaccard threshold for similarity**
   - What we know: CONTEXT.md specifies 80% threshold
   - What's unclear: Whether word-based or character-based Jaccard is better
   - Recommendation: Start with word-based at 80%, tune if regenerations seem too similar

2. **Editor timeout behavior**
   - What we know: `external-editor` blocks until editor closes
   - What's unclear: Should there be a timeout for hung editors?
   - Recommendation: No timeout (user's editor, their choice); document Ctrl+C as escape

3. **Partial acceptance persistence**
   - What we know: Session state is in-memory
   - What's unclear: Should accepted items persist across CLI invocations?
   - Recommendation: No persistence - each run is a fresh session (matches git add -p)

4. **Weak bullet threshold tuning**
   - What we know: Phase 16-06 defines weakness categories
   - What's unclear: How aggressively to flag (false positives vs missed weaknesses)
   - Recommendation: Start conservative (flag only clear weaknesses), tune based on feedback

## Sources

### Primary (HIGH confidence)
- [Node.js readline documentation](https://nodejs.org/api/readline.html) - emitKeypressEvents, raw mode
- [Node.js TTY documentation](https://nodejs.org/api/tty.html) - Terminal width, isTTY
- [@inquirer/prompts README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/prompts/README.md) - Modern prompt API
- [@inquirer/expand README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/expand/README.md) - Single-key shortcuts
- [@inquirer/core README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/core/README.md) - useKeypress hook
- [external-editor GitHub](https://github.com/mrkmg/node-external-editor) - $EDITOR handling

### Secondary (MEDIUM confidence)
- [Command Line Interface Guidelines](https://clig.dev/) - CLI UX best practices
- [cross-spawn npm](https://www.npmjs.com/package/cross-spawn) - Cross-platform spawn
- [write-file-atomic npm](https://www.npmjs.com/package/write-file-atomic) - Atomic writes
- [string-comparison npm](https://www.npmjs.com/package/string-comparison) - Jaccard implementation

### Tertiary (LOW confidence)
- [CLI UX Patterns blog](https://lucasfcosta.com/2022/06/01/ux-patterns-cli-tools.html) - General UX advice
- [git add -p documentation](https://git-scm.com/book/en/v2/Git-Tools-Interactive-Staging) - Pattern reference

## Metadata

**Confidence breakdown:**
- Interactive prompts: HIGH - @inquirer/prompts is well-documented, widely used
- Editor integration: HIGH - external-editor is mature, handles edge cases
- Diff display: HIGH - Reusing existing Phase 16-02 infrastructure
- Similarity detection: MEDIUM - Simple Jaccard may need tuning
- File safety: HIGH - fs.copyFileSync + confirm pattern is straightforward
- TTY handling: HIGH - Node.js APIs are well-documented

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - @inquirer/prompts API is stable)
