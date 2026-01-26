# Phase 19: Wizard Non-Interactive & Integration - Research

**Researched:** 2026-01-26
**Domain:** CLI Non-Interactive Mode, TTY Detection, JSON Input, stdin Handling, STAR Method Questioning
**Confidence:** HIGH

## Summary

Phase 19 extends the existing wizard commands (from Phase 18) to work in CI/CD pipelines by adding non-interactive mode support with command-line flags, JSON input, and TTY detection. The project already has established patterns for TTY detection (`tty-check.ts`), JSON output (`--json` flag across all commands), and AI enhancement integration (Phase 17). The existing tech stack (Commander.js 14.0.0, @inquirer/prompts 8.2.0, Zod 4.3.6) provides all necessary capabilities.

The implementation follows the locked decisions from CONTEXT.md: auto-switch to non-interactive when non-TTY detected, `--no-input` flag for explicit non-interactive use, `--json-input` for structured input (including stdin with `-`), `--enhance` for AI suggestions with section-by-section review, and `--dry-run` for validation without writes. Standard exit codes (0 success, 1 general error, 2 validation error) and stderr for progress messages align with Unix conventions.

**Primary recommendation:** Extend existing wizard commands with Commander.js negatable options (`--no-input`), add JSON input parsing with Zod validation using `z.toJSONSchema()` for schema export, implement stdin reading using native Node.js `fs/promises` and `readline/promises`, and integrate AI enhancement flow from Phase 17's review session patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `commander` | 14.0.0 | CLI command parsing with options | Already used, supports negatable options, requiredOption |
| `@inquirer/prompts` | 8.2.0 | Interactive prompts (TTY mode only) | Already used, graceful TTY handling |
| `zod` | 4.3.6 | JSON input validation and schema generation | Already used, native `z.toJSONSchema()` in v4 |
| `node:fs/promises` | Node.js built-in | Read JSON input from files | Native, async/await support |
| `node:readline/promises` | Node.js built-in | Read stdin line-by-line (if needed) | Native, Promise-based |
| `picocolors` | 1.1.0 | Terminal colors for output formatting | Already used in console.ts |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@gottz/cv-core` | workspace | CV schema types & validation | Type definitions, `parseCV()` validation |
| `ora` | 9.1.0 | Spinners for progress indication | Non-interactive mode progress |
| `@inquirer/password` | via prompts | Masked API key input (WIZ-11) | When prompting for sensitive input |

### No New Dependencies Needed

The existing stack handles all requirements:
- TTY detection: `process.stdin.isTTY` (existing `tty-check.ts`)
- JSON parsing: `JSON.parse()` + Zod validation
- Stdin reading: `fs.readFile('/dev/stdin')` or async iteration on `process.stdin`
- Schema export: `z.toJSONSchema()` native in Zod 4
- CLI options: Commander.js negatable booleans (`--no-input`)

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── wizard/
│   ├── index.ts                 # Existing - add non-interactive exports
│   ├── runner.ts                # Extend - add non-interactive flow
│   ├── non-interactive/         # NEW: Non-interactive mode handling
│   │   ├── index.ts             # Export public API
│   │   ├── input-reader.ts      # Read JSON from file/stdin
│   │   ├── flag-collector.ts    # Build state from CLI flags
│   │   ├── validation.ts        # Zod schemas for JSON input
│   │   ├── schema-export.ts     # z.toJSONSchema() for --help json
│   │   └── output-formatter.ts  # JSON/human output formatting
│   ├── enhance/                 # NEW: AI enhancement integration
│   │   ├── index.ts             # Section-by-section enhance flow
│   │   ├── section-enhancer.ts  # Enhance contact/experience/etc
│   │   └── star-prompts.ts      # STAR example bullets for inline help
│   └── prompts/                 # Existing - add STAR hints to experience
└── commands/
    └── wizard.ts                # Extend - add flags for non-interactive
```

### Pattern 1: TTY Detection with Auto-Switch
**What:** Detect non-TTY environment and auto-switch to non-interactive mode
**When to use:** At wizard entry point, before any prompts
**Example:**
```typescript
// Source: Node.js TTY documentation + CONTEXT.md decisions
interface WizardOptions {
  noInput?: boolean;      // --no-input flag
  forceInteractive?: boolean; // --force-interactive flag
  jsonInput?: string;     // --json-input file path or '-' for stdin
  dryRun?: boolean;       // --dry-run flag
  enhance?: boolean;      // --enhance flag
  json?: boolean;         // --json flag for output format
}

function detectMode(options: WizardOptions): 'interactive' | 'non-interactive' {
  // Explicit flags take precedence
  if (options.forceInteractive) return 'interactive';
  if (options.noInput) return 'non-interactive';

  // Auto-detect from TTY
  if (!process.stdin.isTTY) {
    // Non-TTY: silently switch to non-interactive per CONTEXT.md
    return 'non-interactive';
  }

  return 'interactive';
}

function ensureNonInteractiveRequirements(
  mode: 'non-interactive',
  hasRequiredInput: boolean
): void {
  if (!hasRequiredInput) {
    // Per CONTEXT.md: fail with helpful message if required flags missing
    const errorMsg = {
      error: 'Non-interactive mode requires input via --json-input or flags',
      usage: 'cvgen wizard init <name> --no-input --name "Jane Doe" --email "jane@example.com"',
      alternative: 'cvgen wizard init <name> --json-input data.json',
    };

    // Respect --json flag for error format
    if (process.env.CVGEN_JSON_OUTPUT === 'true') {
      console.error(JSON.stringify(errorMsg, null, 2));
    } else {
      console.error(`Error: ${errorMsg.error}`);
      console.error(`\nUsage: ${errorMsg.usage}`);
      console.error(`Or: ${errorMsg.alternative}`);
    }
    process.exit(2); // Exit code 2 for usage/validation error
  }
}
```

### Pattern 2: JSON Input Reading from File or Stdin
**What:** Read JSON input from file path or stdin (when `-` is passed)
**When to use:** When `--json-input` option is provided
**Example:**
```typescript
// Source: Node.js fs/promises documentation
import { readFile } from 'node:fs/promises';

async function readJsonInput(source: string): Promise<unknown> {
  let content: string;

  if (source === '-') {
    // Read from stdin
    content = await readStdin();
  } else {
    // Read from file
    try {
      content = await readFile(source, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read JSON input file: ${source}`);
    }
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in input: ${(error as Error).message}`);
  }
}

async function readStdin(): Promise<string> {
  // Check if stdin has data (non-TTY or piped)
  if (process.stdin.isTTY) {
    throw new Error('No stdin input available. Use a file path instead of "-"');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
```

### Pattern 3: Zod Validation for JSON Input with Schema Export
**What:** Validate JSON input and export schema for documentation
**When to use:** Input validation and `--help json` subcommand
**Example:**
```typescript
// Source: Zod 4 documentation - z.toJSONSchema()
import { z } from 'zod';

// Contact input schema
export const ContactInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    label: z.string().optional(),
  })).optional(),
});

// Experience input schema - supports plain strings OR STAR objects
export const ExperienceInputSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Date must be YYYY-MM'),
  endDate: z.string(),
  location: z.string().optional(),
  bullets: z.array(
    z.union([
      z.string(), // Plain bullet text
      z.object({  // STAR structured object (auto-detect)
        situation: z.string().optional(),
        task: z.string().optional(),
        action: z.string(),
        result: z.string().optional(),
      })
    ])
  ),
  techStack: z.array(z.string()).optional(),
});

// Full wizard init input schema
export const WizardInitInputSchema = z.object({
  contact: ContactInputSchema,
  experience: z.array(ExperienceInputSchema).optional(),
  education: z.array(EducationInputSchema).optional(),
  skills: z.array(SkillCategoryInputSchema).optional(),
  projects: z.array(ProjectInputSchema).optional(),
  certifications: z.array(CertificationInputSchema).optional(),
});

// Export JSON Schema for documentation
export function getJsonSchema(command: 'init' | 'add-experience' | 'add-skills'): object {
  const schemas = {
    'init': WizardInitInputSchema,
    'add-experience': z.object({ experience: z.array(ExperienceInputSchema) }),
    'add-skills': z.object({ skills: z.array(SkillCategoryInputSchema) }),
  };
  return z.toJSONSchema(schemas[command]);
}

// Validate and return typed data
export function validateWizardInput<T extends z.ZodType>(
  schema: T,
  data: unknown,
  jsonOutput: boolean
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formatted = result.error.format();
    if (jsonOutput) {
      console.error(JSON.stringify({ error: 'Validation failed', details: formatted }, null, 2));
    } else {
      console.error('Validation failed:');
      console.error(result.error.message);
    }
    process.exit(2);
  }
  return result.data;
}
```

### Pattern 4: Non-Interactive Flag Collection
**What:** Build wizard state from CLI flags
**When to use:** When user provides values via flags instead of JSON
**Example:**
```typescript
// Source: Commander.js documentation + CONTEXT.md decisions
interface InitFlagOptions {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  // Experience flags (for single entry)
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[]; // Commander supports multiple: --bullet "x" --bullet "y"
}

function buildStateFromFlags(flags: InitFlagOptions, jsonInput?: unknown): Partial<WizardState> {
  const state: Partial<WizardState> = {};

  // JSON input takes precedence for arrays/objects
  if (jsonInput) {
    return buildStateFromJson(jsonInput);
  }

  // Build contact from flags
  if (flags.name) {
    state.contact = {
      name: flags.name,
      ...(flags.email && { email: flags.email }),
      ...(flags.phone && { phone: flags.phone }),
      ...(flags.location && { location: flags.location }),
    };
  }

  return state;
}

// Detect conflict between JSON and flags
function detectConflicts(
  jsonData: Record<string, unknown> | undefined,
  flags: Record<string, unknown>
): string[] {
  const conflicts: string[] = [];
  if (!jsonData) return conflicts;

  for (const [key, flagValue] of Object.entries(flags)) {
    if (flagValue !== undefined && jsonData[key] !== undefined) {
      if (JSON.stringify(flagValue) !== JSON.stringify(jsonData[key])) {
        conflicts.push(`${key}: flag="${flagValue}" vs json="${jsonData[key]}"`);
      }
    }
  }
  return conflicts;
}
```

### Pattern 5: STAR Method Inline Prompting
**What:** Combined prompt with STAR hints and example bullets
**When to use:** Experience bullet collection in interactive mode
**Example:**
```typescript
// Source: CONTEXT.md decisions - combined prompt with hints
import { input } from '@inquirer/prompts';
import pc from 'picocolors';

// STAR example bullets by role type
const STAR_EXAMPLES: Record<string, string[]> = {
  engineering: [
    'Reduced API latency by 40% by implementing Redis caching layer, improving user experience for 50K daily users',
    'Led migration of 15 microservices to Kubernetes, achieving 99.9% uptime and 30% cost reduction',
  ],
  management: [
    'Grew engineering team from 5 to 15 engineers while maintaining sprint velocity, reducing time-to-hire by 25%',
    'Implemented quarterly OKR process that increased team goal completion rate from 60% to 85%',
  ],
  general: [
    'Streamlined reporting process by automating Excel workflows, saving 10 hours weekly across team',
    'Increased customer satisfaction score from 3.5 to 4.2 by redesigning support ticket workflow',
  ],
};

async function collectBulletWithSTAR(
  bulletNumber: number,
  roleType: string = 'general'
): Promise<string> {
  const examples = STAR_EXAMPLES[roleType] ?? STAR_EXAMPLES.general;
  const exampleToShow = examples[bulletNumber % examples.length];

  // Show example before prompt (per CONTEXT.md)
  console.log(pc.dim(`\n  Example: ${exampleToShow}`));

  // Combined prompt with STAR guidance
  const bullet = await input({
    message: `Bullet ${bulletNumber + 1} (describe your achievement - think: situation, what you did, outcome):`,
    validate: (value) => {
      if (!value.trim()) return true; // Empty = done
      if (value.length < 20) return 'Bullet seems too short. Add more detail about impact/results.';
      return true;
    },
  });

  return bullet.trim();
}

// Convert STAR object to bullet string
function starToBullet(star: { situation?: string; task?: string; action: string; result?: string }): string {
  const parts = [];
  if (star.situation) parts.push(star.situation);
  parts.push(star.action);
  if (star.result) parts.push(star.result);
  return parts.join(', ');
}
```

### Pattern 6: AI Enhancement Integration
**What:** Section-by-section AI enhancement with review flow
**When to use:** When `--enhance` flag is provided
**Example:**
```typescript
// Source: Phase 17 review-session.ts patterns + CONTEXT.md decisions
import { runReviewSession, type ReviewItem } from '../ai/review/review-session.ts';
import { displayComparison } from '../ai/display/diff-display.ts';
import { confirm, select } from '@inquirer/prompts';

interface EnhanceOptions {
  provider?: string;
  job?: string;           // Job description for tailored enhancement
  nonInteractive: boolean; // Auto-accept in non-interactive mode
}

async function enhanceSection(
  section: 'contact' | 'experience' | 'skills' | 'education' | 'projects',
  data: unknown,
  options: EnhanceOptions
): Promise<unknown> {
  try {
    const enhanced = await generateEnhancement(section, data, options);

    if (options.nonInteractive) {
      // Per CONTEXT.md: non-interactive mode auto-accepts all
      return enhanced;
    }

    // Interactive mode: show diff and get user decision
    // Reuse Phase 16/17 diff display
    console.log(displayComparison(
      JSON.stringify(data, null, 2),
      JSON.stringify(enhanced, null, 2)
    ));

    const action = await select({
      message: 'AI enhancement for this section:',
      choices: [
        { value: 'accept', name: 'Accept enhancement' },
        { value: 'edit', name: 'Edit in external editor' },
        { value: 'skip', name: 'Keep original' },
        { value: 'regenerate', name: 'Generate new suggestion' },
      ],
    });

    // Handle action (same flow as Phase 17)
    switch (action) {
      case 'accept': return enhanced;
      case 'skip': return data;
      case 'edit': return await editInEditor(enhanced);
      case 'regenerate': return enhanceSection(section, data, options);
    }
  } catch (error) {
    // Per CONTEXT.md: prompt to continue if AI unavailable
    if (!options.nonInteractive) {
      const continueWithout = await confirm({
        message: `AI unavailable: ${(error as Error).message}. Continue without enhancement?`,
        default: true,
      });
      if (continueWithout) return data;
    }
    throw error;
  }
}
```

### Pattern 7: Output Formatting with stderr/stdout Separation
**What:** Progress to stderr, final output to stdout
**When to use:** Non-interactive mode for CI/CD compatibility
**Example:**
```typescript
// Source: CONTEXT.md decisions - stdout reserved for final output
function progress(message: string, jsonMode: boolean): void {
  if (!jsonMode) {
    process.stderr.write(`${message}\n`);
  }
}

function output(data: unknown, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Human-readable output to stdout
    console.log(formatHumanReadable(data));
  }
}

function error(message: string, details: unknown, jsonMode: boolean): never {
  if (jsonMode) {
    console.error(JSON.stringify({ error: message, details }, null, 2));
  } else {
    console.error(`Error: ${message}`);
    if (details) console.error(details);
  }
  process.exit(1);
}
```

### Pattern 8: Dry-Run Mode Implementation
**What:** Validate and preview without writing files
**When to use:** When `--dry-run` flag is provided
**Example:**
```typescript
// Source: Unix dry-run conventions
interface DryRunResult {
  valid: boolean;
  wouldWrite: string[];
  preview: {
    path: string;
    content: string;
  }[];
  validationErrors?: string[];
}

async function runDryRun(
  state: WizardState,
  personDir: string,
  locale: string
): Promise<DryRunResult> {
  // Generate markdown without writing
  const markdown = generateMarkdown(state, locale);
  const cvPath = path.join(personDir, 'cv.md');

  // Validate generated content
  const parseResult = parseCV(markdown);

  return {
    valid: !parseResult.errors || parseResult.errors.length === 0,
    wouldWrite: [cvPath],
    preview: [{ path: cvPath, content: markdown }],
    validationErrors: parseResult.errors?.map(e => e.message),
  };
}
```

### Anti-Patterns to Avoid
- **Mixing interactive prompts in non-interactive mode:** Check mode before any Inquirer call
- **Blocking stdin indefinitely:** Use TTY check before attempting stdin read
- **Writing to stdout in non-interactive mode:** Use stderr for progress, stdout for final output only
- **Ignoring exit codes:** Use standard codes (0, 1, 2) for CI/CD compatibility
- **Hand-rolling JSON schema:** Use `z.toJSONSchema()` from Zod 4
- **Custom TTY detection:** Use existing `tty-check.ts` patterns
- **Duplicating review flow:** Reuse Phase 17 `runReviewSession()` for AI enhancement review

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTY detection | `process.stdin.isTTY` checks | Existing `tty-check.ts` | Already handles edge cases, consistent patterns |
| JSON schema export | Manual schema object | `z.toJSONSchema()` | Zod 4 native, handles all types correctly |
| Input validation | Custom validation logic | Zod schemas + `.safeParse()` | Type-safe, auto-generated error messages |
| Stdin reading | Manual event handling | Async iteration on `process.stdin` | Modern, clean, handles backpressure |
| Password masking | readline with manual masking | `@inquirer/password` | Handles terminal quirks, cross-platform |
| Diff display | Custom string diff | Existing `diff-display.ts` | Already styled, tested, reusable |
| Review flow | Custom accept/skip/edit loop | `runReviewSession()` from Phase 17 | Full feature set including regeneration |
| Spinner progress | Manual animation | `ora` via existing `spinner.ts` | TTY-aware, graceful degradation |
| Exit codes | Arbitrary numbers | Standard Unix codes (0, 1, 2) | CI/CD expects standard codes |

**Key insight:** Phase 19 is primarily an integration phase. The core infrastructure (TTY handling, Zod validation, AI review flow, diff display) already exists. Focus on wiring existing components together with new CLI flags.

## Common Pitfalls

### Pitfall 1: Stdin Hangs in Non-Piped Mode
**What goes wrong:** `process.stdin` read waits forever when no data is piped
**Why it happens:** Stdin stream doesn't close when no input is provided
**How to avoid:** Always check `process.stdin.isTTY` before reading; if TTY and `--json-input -`, error immediately
**Warning signs:** Process hangs, no output
```typescript
// Prevention: Check before reading
if (source === '-' && process.stdin.isTTY) {
  throw new Error('Cannot read from stdin in interactive mode. Use a file path.');
}
```

### Pitfall 2: Flag and JSON Input Conflicts
**What goes wrong:** User provides `--name "Jane"` AND JSON with `{"name": "John"}`
**Why it happens:** No conflict detection
**How to avoid:** Per CONTEXT.md, error if both provide same field with different values
**Warning signs:** Unexpected data written, user confusion
```typescript
// Prevention: Detect and error on conflicts
const conflicts = detectConflicts(jsonData, flags);
if (conflicts.length > 0) {
  console.error(`Error: Conflicting values between flags and JSON input:\n${conflicts.join('\n')}`);
  process.exit(2);
}
```

### Pitfall 3: Mixed stdout/stderr in CI
**What goes wrong:** Progress messages pollute JSON output, breaking parsers
**Why it happens:** Using `console.log` for both progress and output
**How to avoid:** Progress to stderr, final output to stdout only
**Warning signs:** `jq` parsing failures, CI script errors
```typescript
// Prevention: Strict separation
progress('Processing...', jsonMode); // -> stderr
output(result, jsonMode);            // -> stdout
```

### Pitfall 4: AI Unavailable Crashes Non-Interactive Mode
**What goes wrong:** `--enhance` in CI fails with unhandled error when no API key
**Why it happens:** AI provider throws, not caught in non-interactive flow
**How to avoid:** Wrap AI calls, log warning and continue without enhancement
**Warning signs:** CI failures, exit code 1 when API key missing
```typescript
// Prevention: Graceful degradation
try {
  return await enhanceWithAI(data);
} catch (error) {
  if (nonInteractive) {
    process.stderr.write(`Warning: AI unavailable (${error.message}), proceeding without enhancement\n`);
    return data;
  }
  // Interactive: prompt user
}
```

### Pitfall 5: Wrong Exit Code for Validation Errors
**What goes wrong:** Validation error exits with code 1 instead of 2
**Why it happens:** Generic error handling
**How to avoid:** Use exit code 2 specifically for validation/usage errors
**Warning signs:** CI can't distinguish between runtime errors and bad input
```typescript
// Prevention: Specific exit codes
if (!isValid) {
  process.exit(2); // Usage/validation error
}
if (runtimeError) {
  process.exit(1); // General error
}
```

### Pitfall 6: STAR Object Not Auto-Detected
**What goes wrong:** JSON with STAR structure treated as plain strings
**Why it happens:** Not using union type in Zod schema
**How to avoid:** Use `z.union([z.string(), StarObjectSchema])` and check at runtime
**Warning signs:** STAR context lost, poor bullet quality
```typescript
// Prevention: Auto-detect in processing
function processBullet(input: string | StarObject): string {
  if (typeof input === 'string') return input;
  return starToBullet(input); // Convert STAR object to formatted string
}
```

## Code Examples

Verified patterns from official sources and existing codebase:

### Commander.js Negatable Option
```typescript
// Source: Commander.js documentation
import { Command } from 'commander';

const wizard = new Command('wizard');

wizard
  .command('init')
  .argument('<name>', 'Person name or directory name')
  .option('--no-input', 'Non-interactive mode (requires flags or --json-input)')
  .option('--force-interactive', 'Force interactive mode even in non-TTY')
  .option('--json-input <file>', 'JSON input file (use "-" for stdin)')
  .option('--dry-run', 'Validate without writing files')
  .option('--enhance', 'Enable AI enhancement for sections')
  .option('--job <file>', 'Job description for tailored enhancement')
  .option('--json', 'Output results as JSON')
  // Contact flags
  .option('--name <name>', 'Full name')
  .option('--email <email>', 'Email address')
  .option('--phone <phone>', 'Phone number')
  .option('--location <location>', 'Location (city, country)')
  .action(initAction);
```

### Zod 4 JSON Schema Export
```typescript
// Source: Zod 4 documentation - z.toJSONSchema()
import { z } from 'zod';

const ExperienceSchema = z.object({
  company: z.string().describe('Company or organization name'),
  role: z.string().describe('Job title'),
  startDate: z.string().describe('Start date (YYYY-MM format)'),
  endDate: z.string().describe('End date (YYYY-MM or "present")'),
  bullets: z.array(z.string()).describe('Achievement bullet points'),
});

// Export for documentation
const jsonSchema = z.toJSONSchema(ExperienceSchema, {
  target: 'draft-2020-12',
});
// => { type: 'object', properties: { company: { type: 'string', ... }, ... } }

// For `cvgen wizard init --help json`
function showJsonSchema(command: string): void {
  console.log(JSON.stringify(getJsonSchema(command), null, 2));
}
```

### Stdin Reading with Async Iteration
```typescript
// Source: Node.js documentation - async iterators
async function readStdinAsJson(): Promise<unknown> {
  if (process.stdin.isTTY) {
    throw new Error('stdin is a TTY - pipe data or use a file');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const content = Buffer.concat(chunks).toString('utf-8');
  return JSON.parse(content);
}
```

### Password Masking for API Key (WIZ-11)
```typescript
// Source: @inquirer/password documentation
import { password } from '@inquirer/prompts';

async function promptApiKey(): Promise<string> {
  return password({
    message: 'API Key (input will be masked):',
    mask: '*',
    validate: (value) => {
      if (value.length < 10) return 'API key seems too short';
      if (!/^[A-Za-z0-9_-]+$/.test(value)) return 'Invalid characters in API key';
      return true;
    },
  });
}
```

### Exit Code Handling
```typescript
// Source: Unix conventions + CONTEXT.md
const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  VALIDATION_ERROR: 2,
  SIGINT: 130,
} as const;

function exitWithCode(code: keyof typeof EXIT_CODES, message?: string): never {
  if (message) {
    process.stderr.write(`${message}\n`);
  }
  process.exit(EXIT_CODES[code]);
}

// Usage
if (validationFailed) {
  exitWithCode('VALIDATION_ERROR', 'Invalid input: name is required');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `inquirer` monolithic | `@inquirer/prompts` modular | 2023-2024 | Tree-shaking, smaller bundles |
| `zod-to-json-schema` package | `z.toJSONSchema()` native | Zod 4 (2025) | No extra dependency |
| Manual stdin handling | Async iteration (`for await`) | Node.js 10+ | Cleaner code, backpressure handling |
| Custom exit codes | Standard Unix codes (0, 1, 2) | Established | CI/CD compatibility |
| Interactive-only CLIs | Non-interactive first design | Modern CLI trend | Automation, CI/CD support |

**Deprecated/outdated:**
- `zod-to-json-schema`: Deprecated as of November 2025, Zod 4 has native `z.toJSONSchema()`
- `get-stdin` package: Native async iteration on `process.stdin` is cleaner
- Callback-based stdin reading: Use async/await patterns

## Open Questions

Things that couldn't be fully resolved:

1. **STAR example bullet variety**
   - What we know: Should show 1-2 examples relevant to role type
   - What's unclear: How many role types to support? How to detect role type from input?
   - Recommendation: Start with 3 categories (engineering, management, general), detect from job title keywords

2. **JSON schema versioning**
   - What we know: Zod 4 defaults to Draft 2020-12
   - What's unclear: Should we support older JSON Schema versions for compatibility?
   - Recommendation: Use default Draft 2020-12, add `--schema-version` flag only if users request

3. **Partial JSON input behavior**
   - What we know: JSON can provide some fields, flags can provide others
   - What's unclear: Should we merge JSON + flags or require one approach?
   - Recommendation: Per CONTEXT.md, error on conflicts; otherwise merge (JSON takes precedence for same field)

4. **AI enhancement rate limiting**
   - What we know: `--enhance` calls AI for each section
   - What's unclear: Should we batch sections? What if rate limited mid-wizard?
   - Recommendation: Enhance section-by-section, catch rate limit errors and offer to continue without enhancement

## Sources

### Primary (HIGH confidence)
- `/workspace/packages/cli/src/ai/review/tty-check.ts` - Existing TTY detection patterns
- `/workspace/packages/cli/src/wizard/runner.ts` - Existing wizard flow
- `/workspace/packages/cli/src/commands/ai.ts` - Existing flag patterns (--json, --dry-run, --accept-all)
- `/workspace/packages/cli/src/ai/review/review-session.ts` - AI review flow (accept/edit/skip/regenerate)
- [Node.js TTY Documentation](https://nodejs.org/api/tty.html) - `process.stdin.isTTY`, `tty.isatty()`
- [Zod JSON Schema Documentation](https://zod.dev/json-schema) - `z.toJSONSchema()` API
- [Zod 4 Release Notes](https://zod.dev/v4) - Native JSON Schema support
- [Commander.js GitHub](https://github.com/tj/commander.js) - Negatable boolean options

### Secondary (MEDIUM confidence)
- [Node.js stdin async iteration](https://2ality.com/2018/04/async-iter-nodejs.html) - Reading streams via async iteration
- [get-stdin npm package](https://www.npmjs.com/package/get-stdin) - Pattern reference (not using, but informed approach)
- [STAR Method Resume Examples](https://www.tealhq.com/post/star-method-resume) - Example bullet formatting
- [Artillery Exit Codes](https://www.artillery.io/docs/reference/cli/exit-codes) - Standard CLI exit code patterns

### Tertiary (LOW confidence)
- WebSearch results on CI/CD CLI patterns - General ecosystem patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, well-documented
- Architecture: HIGH - Extends existing patterns, clear CONTEXT.md decisions
- Pitfalls: HIGH - Based on documented issues and existing codebase analysis
- Code examples: HIGH - Verified against official documentation and project codebase
- STAR examples: MEDIUM - Based on web search for resume best practices

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable libraries, established patterns)
