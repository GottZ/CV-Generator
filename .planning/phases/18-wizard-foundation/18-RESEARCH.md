# Phase 18: Wizard Foundation - Research

**Researched:** 2026-01-26
**Domain:** Interactive CLI Wizards with @inquirer/prompts
**Confidence:** HIGH

## Summary

Phase 18 builds interactive CLI wizards for CV creation and modification using `@inquirer/prompts`, which is already a dependency in the project (v8.2.0). The codebase has existing patterns for prompts (`/packages/cli/src/lib/prompts.ts`), TTY detection (`tty-check.ts`), spinners (`spinner.ts`), and console output (`console.ts`). The review session (`review-session.ts`) demonstrates an advanced interactive pattern using Inquirer's `expand` prompt.

The wizard must collect CV data matching the existing schema types (`CVData`, `Contact`, `WorkExperience`, `Education`, `SkillCategory`, `Project`, `Certification`) and produce markdown compatible with the existing parser. The CONTEXT.md decisions specify menu-driven navigation with breadcrumb escape, quick/detailed modes, immediate validation, and structured summary before commit.

**Primary recommendation:** Use `@inquirer/prompts` individual imports (`input`, `select`, `confirm`, `password`, `number`, `checkbox`). Build a menu-driven wizard state machine with explicit state tracking for clean Ctrl+C exit. Reuse existing scaffolder patterns for markdown generation and validation via `parseCV()`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@inquirer/prompts` | 8.2.0 | Interactive prompts | Already in project, TypeScript-first, modular imports, Bun compatible |
| `picocolors` | 1.1.0 | Terminal colors | Already in project, used by console.ts |
| `ora` | 9.1.0 | Spinners | Already in project, used by spinner.ts |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@gottz/cv-core` | workspace | CV schema & parsing | Validate wizard output, type definitions |
| `commander` | 14.0.0 | CLI framework | Register wizard commands |
| `zod` | 4.3.6 | Schema validation | Runtime validation of wizard inputs |

### No New Dependencies Needed

The existing stack provides everything required:
- Interactive prompts: `@inquirer/prompts`
- Validation: `@gottz/cv-core` parser + Zod schemas
- Output: Existing scaffolder patterns
- UI feedback: picocolors + ora

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── wizard/                      # New wizard module
│   ├── index.ts                 # Exports: runWizard, addExperience, etc.
│   ├── types.ts                 # WizardState, WizardSection, FieldConfig
│   ├── state.ts                 # State machine: pending/editing/completed
│   ├── prompts/                 # Section-specific prompt flows
│   │   ├── contact.ts           # Contact info prompts
│   │   ├── experience.ts        # Work experience prompts (with "add another")
│   │   ├── education.ts         # Education prompts
│   │   ├── skills.ts            # Skills by category
│   │   ├── projects.ts          # Project prompts
│   │   └── certifications.ts    # Certification prompts
│   ├── menu.ts                  # Main menu with checkmark progress
│   ├── summary.ts               # Pre-commit summary display
│   ├── validation.ts            # Real-time validation layer
│   └── markdown-writer.ts       # Convert WizardState -> cv.md format
└── commands/
    └── wizard.ts                # CLI command registration
```

### Pattern 1: Menu-Driven State Machine
**What:** Central menu that tracks section completion state
**When to use:** Per CONTEXT.md - user picks which section to fill next
**Example:**
```typescript
// Source: CONTEXT.md decision - checkmark-style progress
interface WizardState {
  contact: Contact | null;
  experience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  projects: Project[];
  certifications: Certification[];
  mode: 'quick' | 'detailed';
  currentSection: string | null;
  validationIssues: Map<string, string[]>;
}

type SectionStatus = 'empty' | 'partial' | 'complete';

function getSectionStatus(state: WizardState, section: string): SectionStatus {
  // Per CONTEXT.md: ✓ Experience (2) | ✗ Education | ○ Skills (optional)
  // Returns status for menu display
}

async function showMainMenu(state: WizardState): Promise<string> {
  const choices = [
    { value: 'contact', name: formatMenuItem('Contact', state.contact ? 'complete' : 'empty', true) },
    { value: 'experience', name: formatMenuItem('Experience', getArrayStatus(state.experience), false, state.experience.length) },
    { value: 'education', name: formatMenuItem('Education', getArrayStatus(state.education), false, state.education.length) },
    { value: 'skills', name: formatMenuItem('Skills', getArrayStatus(state.skills), true) },
    { value: 'projects', name: formatMenuItem('Projects', getArrayStatus(state.projects), true) },
    { value: 'certifications', name: formatMenuItem('Certifications', getArrayStatus(state.certifications), true) },
    new Separator(),
    { value: 'finish', name: 'Review & Save' },
    { value: 'cancel', name: 'Cancel' },
  ];

  return select({ message: 'CV Wizard - Select section:', choices });
}

function formatMenuItem(name: string, status: SectionStatus, optional: boolean, count?: number): string {
  const icon = status === 'complete' ? pc.green('✓') :
               status === 'partial' ? pc.yellow('◐') :
               optional ? pc.dim('○') : pc.red('✗');
  const countStr = count !== undefined ? ` (${count})` : '';
  const optStr = optional ? pc.dim(' (optional)') : '';
  return `${icon} ${name}${countStr}${optStr}`;
}
```

### Pattern 2: Section Prompt Flow with "Add Another"
**What:** Collect array entries with loop and confirmation
**When to use:** Experience, education, projects, skills - per CONTEXT.md
**Example:**
```typescript
// Source: CONTEXT.md decision - "Add another?" prompt
async function collectExperience(state: WizardState): Promise<WorkExperience[]> {
  const entries: WorkExperience[] = [...state.experience];

  while (true) {
    console.log(pc.cyan(`\nWork Experience (${entries.length} added)`));

    const entry = await collectSingleExperience(state.mode);
    entries.push(entry);

    const addAnother = await confirm({
      message: 'Add another work experience?',
      default: false,
    });

    if (!addAnother) break;
  }

  return entries;
}

async function collectSingleExperience(mode: 'quick' | 'detailed'): Promise<WorkExperience> {
  const company = await input({
    message: 'Company name *:',
    required: true,
    validate: (v) => v.trim() ? true : 'Company name is required',
  });

  const role = await input({
    message: 'Job title/role *:',
    required: true,
  });

  const startDate = await input({
    message: 'Start date (YYYY-MM) *:',
    required: true,
    validate: validateDate,
  });

  const endDate = await input({
    message: 'End date (default: Present):',
    default: 'present',
    validate: (v) => v.trim() === '' || v.toLowerCase() === 'present' || validateDate(v),
  });

  // Quick mode: skip optional location
  const location = mode === 'detailed' ? await input({
    message: 'Location (city, country):',
  }) : undefined;

  // Collect bullets
  const bullets = await collectBullets();

  // Quick mode: skip optional tech stack
  const techStack = mode === 'detailed' ? await collectTechStack() : undefined;

  return {
    company: company.trim(),
    role: role.trim(),
    startDate: startDate.trim(),
    endDate: endDate.trim() || 'present',
    ...(location && { location: location.trim() }),
    bullets,
    ...(techStack?.length && { techStack }),
  };
}
```

### Pattern 3: Immediate Validation with Re-prompt
**What:** Validate on Enter, re-prompt on error, warn-and-continue on second attempt
**When to use:** Per CONTEXT.md - immediate validation with re-prompt pattern
**Example:**
```typescript
// Source: CONTEXT.md decision - validation timing
interface ValidationState {
  previousValue: string | null;
  attemptCount: number;
}

function createValidatingInput(config: {
  message: string;
  validate?: (value: string) => true | string;
  atsCheck?: (value: string) => string | null; // ATS warning
}): Promise<string> {
  const state: ValidationState = { previousValue: null, attemptCount: 0 };

  return input({
    message: config.message,
    validate: (value) => {
      const formatError = config.validate?.(value);
      if (formatError !== true && formatError) {
        // First attempt: show error and re-prompt
        if (state.previousValue !== value) {
          state.previousValue = value;
          state.attemptCount = 1;
          return formatError;
        }
        // Same value submitted again: warn but continue
        state.attemptCount++;
        if (state.attemptCount >= 2) {
          console.log(pc.yellow(`Warning: ${formatError} (continuing anyway)`));
          return true;
        }
        return formatError;
      }

      // Check ATS warnings
      const atsWarning = config.atsCheck?.(value);
      if (atsWarning) {
        // Per CONTEXT.md: ATS warnings require explicit acknowledgment
        console.log(pc.yellow(`ATS Warning: ${atsWarning}`));
        // Return true - warning shown, continue
      }

      return true;
    },
  });
}
```

### Pattern 4: Clean Ctrl+C Exit (No Partial State)
**What:** Catch ExitPromptError globally, exit without saving
**When to use:** Per CONTEXT.md WIZ-09 - no partial state saved on Ctrl+C
**Example:**
```typescript
// Source: Inquirer.js GitHub issue #1502
import { select, input, confirm } from '@inquirer/prompts';

export async function runWizard(options: WizardOptions): Promise<void> {
  // Global handler for clean exit
  process.on('uncaughtException', (error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(pc.dim('\nWizard cancelled. No changes saved.'));
      process.exit(130); // Standard SIGINT exit code
    }
    throw error;
  });

  try {
    const state = createInitialState(options);
    await runWizardLoop(state);
  } catch (error) {
    // ExitPromptError handled by uncaughtException
    if ((error as Error).name === 'ExitPromptError') {
      return; // Silent exit
    }
    throw error;
  }
}
```

### Pattern 5: Structured Summary Before Commit
**What:** Display full CV preview with inline issues before saving
**When to use:** Per CONTEXT.md WIZ-10 - show summary before committing
**Example:**
```typescript
// Source: CONTEXT.md decision - summary presentation
function displaySummary(state: WizardState): void {
  console.log(pc.bold('\n=== CV Summary ===\n'));

  // Contact
  console.log(pc.cyan('Contact Information'));
  if (state.contact) {
    console.log(`  Name: ${state.contact.name}`);
    console.log(`  Email: ${state.contact.email ?? pc.dim('(not set)')}`);
    if (state.contact.phone) console.log(`  Phone: ${state.contact.phone}`);
    if (state.contact.location) console.log(`  Location: ${state.contact.location}`);
  }

  // Experience
  console.log(pc.cyan(`\nWork Experience (${state.experience.length})`));
  for (const exp of state.experience) {
    console.log(`  ${pc.bold(exp.role)} at ${exp.company}`);
    console.log(`  ${exp.startDate} - ${exp.endDate}`);
    if (state.validationIssues.has(`exp:${exp.company}`)) {
      console.log(pc.yellow(`  ⚠ ${state.validationIssues.get(`exp:${exp.company}`)}`));
    }
  }

  // ... similar for other sections

  // Show critical optional warnings
  if (state.skills.length === 0) {
    console.log(pc.yellow('\n⚠ Skills section is empty - consider adding skills for better ATS matching'));
  }
}

async function confirmSave(state: WizardState): Promise<'confirm' | 'edit' | 'cancel'> {
  displaySummary(state);

  return select({
    message: 'What would you like to do?',
    choices: [
      { value: 'confirm', name: '✓ Save CV' },
      { value: 'edit', name: '✎ Return to menu and edit' },
      { value: 'cancel', name: '✗ Cancel without saving' },
    ],
  });
}
```

### Pattern 6: Quick vs Detailed Mode
**What:** Offer mode selection at start, skip optionals in quick mode
**When to use:** Per CONTEXT.md - quick/detailed mode offered at start
**Example:**
```typescript
// Source: CONTEXT.md decision - quick mode
async function selectMode(): Promise<'quick' | 'detailed'> {
  return select({
    message: 'Select wizard mode:',
    choices: [
      {
        value: 'quick',
        name: 'Quick - Essential fields only (faster)',
        description: 'Collects required fields, skips optional details'
      },
      {
        value: 'detailed',
        name: 'Detailed - All fields (comprehensive)',
        description: 'Collects all fields including optional ones'
      },
    ],
  });
}

// Usage in prompts:
function isFieldRequired(field: string, mode: 'quick' | 'detailed'): boolean {
  const alwaysRequired = ['name', 'company', 'role', 'startDate', 'institution', 'degree'];
  const detailedOnly = ['location', 'techStack', 'honors', 'notes', 'credentialId'];

  if (alwaysRequired.includes(field)) return true;
  if (detailedOnly.includes(field)) return mode === 'detailed';
  return false;
}
```

### Anti-Patterns to Avoid
- **Using readline directly:** @inquirer/prompts handles all TTY interaction; don't mix approaches
- **Storing partial state to disk:** Per WIZ-09, wizard should not save on Ctrl+C
- **Building custom validation loops:** Use Inquirer's `validate` option with the re-prompt pattern
- **Creating global wizard preferences:** Per CONTEXT.md, fresh preferences each run
- **Hand-rolling progress indicators:** Use the existing spinner.ts patterns

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Arrow key navigation | Raw keypress handling | `@inquirer/select` | Handles terminal quirks, ANSI codes |
| Input validation | Manual validation loops | Inquirer `validate` option | Built-in re-prompt, error display |
| Password masking | Character-by-character mask | `@inquirer/password` | Handles all terminal edge cases |
| Progress display | Manual spinners | Existing `spinner.ts` + ora | Already in project, TTY-aware |
| CV schema validation | Custom checks | `parseCV()` from @gottz/cv-core | Already handles all section validation |
| Markdown generation | Template strings | Extend existing `scaffolder.ts` | Consistent format with existing CV files |
| TTY detection | `process.stdin.isTTY` checks | Existing `tty-check.ts` | Already provides `ensureInteractiveMode()` |
| Console colors | Raw ANSI codes | `picocolors` via `console.ts` | Consistent with existing CLI output |

**Key insight:** The project already has most patterns needed. The wizard module extends existing infrastructure rather than rebuilding it.

## Common Pitfalls

### Pitfall 1: ExitPromptError Crashes
**What goes wrong:** Ctrl+C during prompt throws uncaught ExitPromptError
**Why it happens:** Default Inquirer behavior rejects promise on SIGINT
**How to avoid:** Global exception handler that checks error.name === 'ExitPromptError'
**Warning signs:** Stack trace on Ctrl+C, or partial state written

### Pitfall 2: Nested Prompt State Corruption
**What goes wrong:** Calling prompts inside other prompt callbacks causes display issues
**Why it happens:** Inquirer manages terminal state; nested calls interfere
**How to avoid:** Sequential prompts only; return control to caller before next prompt
**Warning signs:** Garbled terminal output, cursor position issues

### Pitfall 3: Non-TTY Environment Crashes
**What goes wrong:** Wizard hangs or crashes in piped/non-interactive environments
**Why it happens:** Inquirer prompts require TTY
**How to avoid:** Use `ensureInteractiveMode()` from tty-check.ts before starting wizard
**Warning signs:** Process hangs, no prompt displayed

### Pitfall 4: Date Validation Too Strict
**What goes wrong:** Users can't enter dates in reasonable formats
**Why it happens:** Requiring exact YYYY-MM format rejects common inputs
**How to avoid:** Accept multiple formats, normalize to YYYY-MM internally
**Warning signs:** Users complaining about date entry

```typescript
// Prevention: Flexible date parsing
function validateAndNormalizeDate(value: string): string | true {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'present') return true;

  // Accept: "2023-01", "2023-1", "Jan 2023", "January 2023", "01/2023"
  const formats = [
    /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/,  // 2023-01 or 2023-1 or 2023-01-15
    /^(\d{1,2})\/(\d{4})$/,              // 01/2023
    /^([A-Za-z]+)\s+(\d{4})$/,           // January 2023
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) return true; // Will normalize in transformer
  }

  return 'Enter date as YYYY-MM (e.g., 2023-01) or month name (e.g., January 2023)';
}
```

### Pitfall 5: Skills Array vs Category Confusion
**What goes wrong:** Skills stored as flat array instead of categorized SkillCategory[]
**Why it happens:** Not following existing schema structure
**How to avoid:** Mirror exact schema from `/packages/core/src/schema/skills.ts`
**Warning signs:** Parse errors when validating wizard output

### Pitfall 6: Breadcrumb Navigation State Loss
**What goes wrong:** User backs out of section, loses partially entered data
**Why it happens:** Not saving section state before returning to menu
**How to avoid:** Per CONTEXT.md: prompt "Save partial progress?" when backing out
**Warning signs:** User frustration, data loss complaints

```typescript
// Prevention: Breadcrumb with partial save prompt
async function handleBackNavigation(
  section: string,
  partialData: unknown,
  state: WizardState
): Promise<'save' | 'discard'> {
  if (!partialData || isEmpty(partialData)) {
    return 'discard';
  }

  const save = await confirm({
    message: `Save partial ${section} progress?`,
    default: true,
  });

  return save ? 'save' : 'discard';
}
```

## Code Examples

Verified patterns from project codebase and Inquirer documentation:

### Input with Validation and Default
```typescript
// Source: @inquirer/input documentation + project patterns
import { input } from '@inquirer/prompts';

const email = await input({
  message: 'Email address:',
  default: existingContact?.email,
  validate: (value) => {
    if (!value.trim()) return true; // Optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? true : 'Please enter a valid email address';
  },
});
```

### Select with Separator and Descriptions
```typescript
// Source: @inquirer/select documentation
import { select, Separator } from '@inquirer/prompts';

const section = await select({
  message: 'Select section to edit:',
  choices: [
    { value: 'contact', name: '✓ Contact (complete)', description: 'Name, email, phone, links' },
    { value: 'experience', name: '✓ Experience (3)', description: 'Work history with bullets' },
    { value: 'education', name: '○ Education', description: 'Degrees and certifications' },
    new Separator(),
    { value: 'finish', name: 'Review & Save' },
  ],
  loop: false, // Per CONTEXT.md: no wrap-around in menu
});
```

### Password for API Key Input
```typescript
// Source: @inquirer/password documentation - WIZ-11 masked entry
import { password } from '@inquirer/prompts';

const apiKey = await password({
  message: 'API Key (will be masked):',
  mask: '*',
  validate: (value) => {
    if (value.length < 10) return 'API key seems too short';
    return true;
  },
});
```

### Checkbox for Multi-Select Skills
```typescript
// Source: @inquirer/checkbox documentation
import { checkbox } from '@inquirer/prompts';

const selectedSkills = await checkbox({
  message: 'Select skills in this category:',
  choices: [
    { value: 'typescript', name: 'TypeScript', checked: existingSkills.includes('typescript') },
    { value: 'javascript', name: 'JavaScript', checked: existingSkills.includes('javascript') },
    { value: 'python', name: 'Python' },
    { value: 'go', name: 'Go' },
  ],
  instructions: 'Space to toggle, Enter to confirm',
});
```

### Expand for Quick Actions (git-add-p style)
```typescript
// Source: Existing project pattern in review-prompt.ts
import { expand } from '@inquirer/prompts';

const action = await expand({
  message: '[1/5] Experience entry:',
  default: 'e', // Edit
  choices: [
    { key: 'e', name: 'Edit this entry', value: 'edit' },
    { key: 'd', name: 'Delete this entry', value: 'delete' },
    { key: 's', name: 'Skip to next', value: 'skip' },
    { key: 'f', name: 'Finish section', value: 'finish' },
  ],
});
```

### Markdown Writer (extend scaffolder pattern)
```typescript
// Source: Existing scaffolder.ts pattern
function generateMarkdown(state: WizardState, locale: string = 'en'): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`name: ${state.contact?.name ?? ''}`);
  if (state.contact?.email) lines.push(`email: ${state.contact.email}`);
  if (state.contact?.phone) lines.push(`phone: ${state.contact.phone}`);
  if (state.contact?.location) lines.push(`location: ${state.contact.location}`);
  if (state.contact?.links?.length) {
    lines.push('links:');
    for (const link of state.contact.links) {
      lines.push(`  - url: ${link.url}`);
      if (link.label) lines.push(`    label: ${link.label}`);
    }
  }
  lines.push('---');
  lines.push('');

  // Experience section
  if (state.experience.length > 0) {
    lines.push(`## Experience \`${locale}\``);
    lines.push('');
    for (let i = 0; i < state.experience.length; i++) {
      const exp = state.experience[i];
      if (i > 0) lines.push('---', '');
      lines.push(`### ${exp.role} at ${exp.company}`);
      lines.push(`*${exp.startDate} - ${exp.endDate}${exp.location ? ` | ${exp.location}` : ''}*`);
      lines.push('');
      for (const bullet of exp.bullets) {
        lines.push(`- ${bullet}`);
      }
      if (exp.techStack?.length) {
        lines.push('');
        lines.push('#### Technologies');
        for (const tech of exp.techStack) {
          lines.push(`- ${tech}`);
        }
      }
      lines.push('');
    }
  }

  // ... similar for education, skills, projects, certifications

  return lines.join('\n');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `inquirer` monolithic | `@inquirer/prompts` modular | 2023-2024 | Tree-shaking, smaller bundles, TypeScript-first |
| readline-based prompts | Inquirer abstractions | Established | Better UX, validation, terminal handling |
| Manual TTY detection | Built-in TTY-aware prompts | Inquirer 8.x | Graceful degradation |
| Callback-based prompts | async/await prompts | Inquirer 8.x | Cleaner code, better error handling |

**Deprecated/outdated:**
- `inquirer` monolithic package: Use `@inquirer/prompts` individual imports instead
- `readline.createInterface` for interactive prompts: Inquirer handles this better
- Custom ANSI escape sequences: Use picocolors or Inquirer's built-in styling

## Open Questions

Things that couldn't be fully resolved:

1. **Locale handling in wizard**
   - What we know: CV schema supports localized content
   - What's unclear: Should wizard prompt for locale? Create single-locale CV? Allow adding locales later?
   - Recommendation: Default to English, add `--locale` option for other languages. Phase 19 can add multi-locale wizard.

2. **Editing existing CVs**
   - What we know: CONTEXT.md mentions "show existing values as defaults"
   - What's unclear: How to load existing CV and populate wizard state?
   - Recommendation: Parse existing cv.md if it exists, pre-populate state, show message "Editing existing CV"

3. **Links entry flow**
   - What we know: Contact.links is an array of {type, url, label?}
   - What's unclear: Best UX for entering multiple links with types
   - Recommendation: Use "type: url" format prompt, parse automatically, or offer select for common types

4. **Bullet point entry UX**
   - What we know: Experience and projects need multiple bullets
   - What's unclear: Best way to collect multiple bullets (editor? repeated prompts? textarea-like?)
   - Recommendation: Repeated input prompts with "Add another bullet?" or empty Enter to finish

## Sources

### Primary (HIGH confidence)
- `/workspace/packages/cli/src/lib/prompts.ts` - Existing prompt patterns
- `/workspace/packages/cli/src/ai/review/review-session.ts` - Interactive session pattern with Inquirer
- `/workspace/packages/cli/src/ai/review/review-prompt.ts` - Expand prompt usage
- `/workspace/packages/cli/src/lib/spinner.ts` - Spinner patterns
- `/workspace/packages/cli/src/lib/console.ts` - Console output patterns
- `/workspace/packages/cli/src/ai/review/tty-check.ts` - TTY detection patterns
- `/workspace/packages/cli/src/lib/scaffolder.ts` - CV scaffolding patterns
- `/workspace/packages/core/src/schema/*.ts` - CV data types
- [Inquirer.js GitHub README](https://github.com/SBoudrias/Inquirer.js) - Official documentation
- [Inquirer.js input package](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/input) - Validation patterns
- [Inquirer.js select package](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/select) - Select configuration
- [Inquirer.js password package](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/password) - Password masking

### Secondary (MEDIUM confidence)
- [Inquirer.js Ctrl+C handling issue #1502](https://github.com/SBoudrias/Inquirer.js/issues/1502) - ExitPromptError pattern
- `/workspace/.planning/research/STACK.md` - @inquirer/prompts selection rationale
- `/workspace/.planning/phases/14-ai-foundation/14-RESEARCH.md` - CLI patterns reference

### Tertiary (LOW confidence)
- WebSearch results on CLI wizard best practices - General patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Library already in project, well-documented
- Architecture: HIGH - Extends existing codebase patterns, clear CONTEXT.md decisions
- Pitfalls: HIGH - Based on documented issues and existing code patterns
- Code examples: HIGH - Verified against project codebase and official documentation

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable library, established patterns)
