# Architecture Research: v1.2 LLM Integration, CLI Wizards, and Template Generation

**Project:** CV Generator CLI - AI Enhancement Milestone
**Researched:** 2026-01-25
**Confidence:** HIGH (existing architecture well-documented, LLM SDKs mature)

## Executive Summary

The v1.2 milestone adds three major feature categories to the existing CV generator: LLM-powered content generation, interactive CLI wizards, and template scaffolding. The existing architecture is well-suited for these additions with clear integration points and minimal disruption to existing functionality.

**Key architectural decisions:**
1. **LLM Provider Abstraction** - Use Vercel AI SDK for unified multi-provider interface (OpenAI, Anthropic, Ollama) with prompt export fallback
2. **CLI Wizard System** - Extend existing Commander.js + readline patterns with @inquirer/prompts for complex multi-step flows
3. **Template Generator** - Extend existing scaffolder.ts with Nunjucks-based template scaffolding

The existing monorepo structure (`packages/core`, `packages/templates`, `packages/cli`) naturally accommodates these additions with a new `packages/ai` package for LLM concerns.

## Existing Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  packages/cli/                 packages/core/           packages/templates/ │
│  ├── src/                      ├── src/                 ├── src/            │
│  │   ├── index.ts              │   ├── parser/          │   ├── engine/     │
│  │   │   (Commander.js)        │   │   (frontmatter,    │   │   (Nunjucks)  │
│  │   ├── commands/             │   │    sections)       │   ├── config/     │
│  │   │   ├── build.ts          │   └── schema/          │   │   (cascade)   │
│  │   │   ├── init.ts           │       (CVData types)   │   └── i18n/       │
│  │   │   ├── validate.ts       │                        │                   │
│  │   │   └── list-templates.ts │                        │                   │
│  │   └── lib/                  │                        │                   │
│  │       ├── prompts.ts        │                        │                   │
│  │       ├── scaffolder.ts     │                        │                   │
│  │       ├── pdf-generator.ts  │                        │                   │
│  │       ├── docx-generator.ts │                        │                   │
│  │       └── ...               │                        │                   │
│  │                             │                        │                   │
└──┴─────────────────────────────┴────────────────────────┴───────────────────┘

Data Flow: cv.md -> parseCV() -> CVData -> renderCV() -> HTML -> PDF/DOCX
```

### Key Existing Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Commander.js CLI | `packages/cli/src/index.ts` | Subcommand routing, option parsing |
| Prompts | `packages/cli/src/lib/prompts.ts` | Basic readline-based user input |
| Scaffolder | `packages/cli/src/lib/scaffolder.ts` | CV directory creation (`init` command) |
| CV Parser | `packages/core/src/parser/` | Markdown + YAML frontmatter parsing |
| Template Engine | `packages/templates/src/engine/` | Nunjucks environment, filters |
| Config Cascade | `packages/templates/src/config/` | Style resolution from multiple sources |
| Template Loader | `packages/templates/src/engine/loader.ts` | Template discovery and validation |

### Configuration Cascade (Existing)

```
Priority (lowest to highest):
1. Template defaults (config.json style field)
2. Global config (/config.json)
3. Environment variables (CVGEN_ACCENT_COLOR, etc.)
4. Person frontmatter (cv.md style field)
```

This cascade pattern should be extended for AI configuration.

## Integration Points

### 1. CLI Integration Points

**New Commands to Add:**

| Command | Integrates With | Purpose |
|---------|-----------------|---------|
| `cvgen ai enhance <name>` | Existing build pipeline, new AI package | Enhance CV sections with AI |
| `cvgen ai suggest <name>` | CV parser, new AI package | Generate improvement suggestions |
| `cvgen ai export-prompt <name>` | CV parser | Export prompt for manual LLM use |
| `cvgen wizard cv` | New prompts module | Interactive CV creation |
| `cvgen wizard template` | Scaffolder, template loader | Interactive template creation |
| `cvgen create-template <name>` | Scaffolder | Non-interactive template scaffolding |

**Commander.js Pattern (existing):**
```typescript
// packages/cli/src/index.ts - current pattern
program
  .command('build')
  .argument('<name>', 'Person directory name')
  .option('--format <formats>', 'Output formats', 'html,pdf,docx')
  .action(buildAction);
```

**Recommended Extension Pattern:**
```typescript
// Add command groups for AI and wizard
const aiCommand = program.command('ai').description('AI-powered CV enhancement');

aiCommand
  .command('enhance')
  .argument('<name>', 'Person directory name')
  .option('--provider <provider>', 'LLM provider (openai, anthropic, ollama)', 'openai')
  .option('--section <sections>', 'Sections to enhance (comma-separated)')
  .option('--dry-run', 'Show what would be changed without applying')
  .action(aiEnhanceAction);

aiCommand
  .command('export-prompt')
  .argument('<name>', 'Person directory name')
  .option('--section <sections>', 'Sections to include')
  .option('--output <file>', 'Output file (default: stdout)')
  .action(exportPromptAction);

const wizardCommand = program.command('wizard').description('Interactive wizards');

wizardCommand
  .command('cv')
  .description('Create a new CV interactively')
  .action(wizardCvAction);

wizardCommand
  .command('template')
  .description('Create a new template interactively')
  .action(wizardTemplateAction);
```

### 2. Parser Integration Points

The AI features need access to parsed CV data:

```typescript
// Existing: packages/core/src/parser/cv-parser.ts
interface ParseResult {
  data: CVData | null;
  errors: ParseError[];
  warnings: ParseWarning[];
}
```

**Integration approach:** AI commands use the existing parser to get structured data, then operate on that data. No changes needed to parser itself.

### 3. Template Engine Integration Points

Template scaffolding needs to:
1. Generate valid `config.json` with schema
2. Generate `template.njk` using shared macros
3. Generate `styles.css` with CSS variable hooks

**Existing template structure:**
```
templates/
├── _shared/
│   ├── macros/
│   │   ├── contact.njk
│   │   ├── section.njk
│   │   └── entry.njk
│   └── partials/
│       ├── _reset.css
│       ├── _theme.css
│       └── _print.css
├── modern/
│   ├── config.json
│   ├── template.njk
│   └── styles.css
└── [other templates]/
```

### 4. Configuration Integration Points

**New AI-specific configuration:**

```typescript
// Extend existing ENV_MAPPINGS pattern in packages/templates/src/config/index.ts
const AI_ENV_MAPPINGS: Record<string, (value: string) => Partial<AIConfig>> = {
  CVGEN_AI_PROVIDER: (v) => ({ provider: v }),
  CVGEN_OPENAI_API_KEY: (v) => ({ openai: { apiKey: v } }),
  CVGEN_ANTHROPIC_API_KEY: (v) => ({ anthropic: { apiKey: v } }),
  CVGEN_OLLAMA_HOST: (v) => ({ ollama: { host: v } }),
  CVGEN_AI_MODEL: (v) => ({ model: v }),
};
```

**Configuration file (optional `config.json` at project root):**
```json
{
  "style": { ... },
  "ai": {
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "prompts": {
      "enhance": "./prompts/enhance.md",
      "suggest": "./prompts/suggest.md"
    }
  }
}
```

## New Components

### 1. LLM Provider Abstraction Layer

**Location:** `packages/ai/` (new package)

**Recommendation:** Use Vercel AI SDK as the foundation.

**Rationale:**
- Unified API across OpenAI, Anthropic, and Ollama
- TypeScript-first with excellent type safety
- Streaming support built-in
- Active development, 20M+ monthly downloads
- Structured output via Zod schema validation
- Single import, multiple providers

**Architecture:**

```
packages/ai/
├── src/
│   ├── index.ts              # Public API exports
│   ├── providers/
│   │   ├── index.ts          # Provider factory
│   │   ├── openai.ts         # OpenAI adapter
│   │   ├── anthropic.ts      # Anthropic adapter
│   │   ├── ollama.ts         # Ollama adapter
│   │   └── types.ts          # Provider interface
│   ├── prompts/
│   │   ├── index.ts          # Prompt loader/renderer
│   │   ├── enhance.ts        # CV enhancement prompt
│   │   ├── suggest.ts        # Suggestion prompt
│   │   └── templates/        # Prompt templates (Nunjucks)
│   │       ├── enhance.njk
│   │       └── suggest.njk
│   ├── config/
│   │   ├── index.ts          # AI config resolution
│   │   └── schema.ts         # Zod schemas for validation
│   └── export/
│       └── index.ts          # Prompt export for manual use
└── package.json
```

**Provider Interface:**

```typescript
// packages/ai/src/providers/types.ts
import type { CVData } from '@gottz/cv-core';

export interface AIProvider {
  readonly name: string;
  readonly isAvailable: () => Promise<boolean>;

  enhance(cv: CVData, options: EnhanceOptions): Promise<EnhanceResult>;
  suggest(cv: CVData, options: SuggestOptions): Promise<SuggestResult>;
  stream?(cv: CVData, options: StreamOptions): AsyncGenerator<string>;
}

export interface EnhanceOptions {
  sections?: string[];        // Which sections to enhance
  locale: string;             // Target language
  targetRole?: string;        // Job title to optimize for
  temperature?: number;       // 0.0-1.0, default 0.7
}

export interface EnhanceResult {
  enhanced: Partial<CVData>;  // Only changed sections
  changes: Change[];          // Detailed change list
  tokensUsed: number;
}

export interface SuggestResult {
  suggestions: Suggestion[];
  tokensUsed: number;
}

export interface Suggestion {
  section: string;
  type: 'add' | 'improve' | 'remove' | 'restructure';
  description: string;
  priority: 'high' | 'medium' | 'low';
}
```

**Vercel AI SDK Integration:**

```typescript
// packages/ai/src/providers/openai.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { AIProvider, EnhanceOptions, EnhanceResult } from './types.ts';
import { buildEnhancePrompt } from '../prompts/enhance.ts';

export function createOpenAIProvider(config: OpenAIConfig): AIProvider {
  const model = openai(config.model ?? 'gpt-4o');

  return {
    name: 'openai',

    async isAvailable() {
      return !!process.env.OPENAI_API_KEY || !!config.apiKey;
    },

    async enhance(cv, options) {
      const prompt = buildEnhancePrompt(cv, options);

      const { text, usage } = await generateText({
        model,
        prompt,
        temperature: options.temperature ?? 0.7,
      });

      return parseEnhanceResponse(text, usage.totalTokens);
    },

    async suggest(cv, options) {
      // Similar implementation
    }
  };
}
```

**Prompt Export Fallback:**

For users without API access, provide prompt export:

```typescript
// packages/ai/src/export/index.ts
export function exportPrompt(cv: CVData, options: ExportOptions): string {
  const prompt = buildPrompt(cv, options);

  return `
# CV Enhancement Prompt

Copy this prompt to your preferred LLM (ChatGPT, Claude, etc.)

---

${prompt}

---

## Instructions

1. Copy the prompt above
2. Paste into ChatGPT, Claude, or your preferred AI assistant
3. Copy the response
4. Use 'cvgen ai apply --file response.md' to apply changes
`;
}
```

### 2. Prompt Templates

**Location:** `packages/ai/src/prompts/templates/`

**Recommendation:** Use Nunjucks for prompt templates (consistency with existing template engine).

**Prompt Template Structure:**

```nunjucks
{# packages/ai/src/prompts/templates/enhance.njk #}
You are an expert CV writer specializing in {{ targetRole or 'professional roles' }}.

## Task
Enhance the following CV sections to be more impactful, achievement-focused, and ATS-optimized.

## Current CV Data

### Contact
Name: {{ contact.name }}
{% if contact.location %}Location: {{ contact.location }}{% endif %}

{% if summary %}
### Summary
{{ summary }}
{% endif %}

{% if experience %}
### Experience
{% for job in experience %}
**{{ job.title }}** at {{ job.company }}
{{ job.startDate }} - {{ job.endDate or 'Present' }}
{% for item in job.highlights %}
- {{ item }}
{% endfor %}
{% endfor %}
{% endif %}

{# ... other sections ... #}

## Enhancement Guidelines

1. **Quantify achievements** - Add metrics where possible
2. **Use action verbs** - Start bullets with strong verbs
3. **ATS optimization** - Use industry-standard terminology
4. **Consistency** - Match tense and formatting throughout
5. **Length** - Keep bullets concise (1-2 lines each)

## Output Format

Return ONLY the enhanced sections in this exact YAML format:

```yaml
summary: |
  [Enhanced summary text]

experience:
  - title: [Job Title]
    company: [Company Name]
    highlights:
      - [Enhanced bullet 1]
      - [Enhanced bullet 2]
```

Do not include unchanged sections.
```

### 3. CLI Wizard System

**Location:** `packages/cli/src/lib/wizard/`

**Recommendation:** Use @inquirer/prompts for interactive prompts.

**Rationale:**
- Modern, modular architecture (individual prompt imports)
- Native ESM support
- TypeScript-first
- Smaller bundle than legacy Inquirer
- Same team, actively maintained

**Architecture:**

```
packages/cli/src/lib/wizard/
├── index.ts              # Wizard runner
├── types.ts              # Wizard step types
├── cv/
│   ├── index.ts          # CV wizard orchestration
│   ├── contact.ts        # Contact info step
│   ├── summary.ts        # Summary step
│   ├── experience.ts     # Experience step (multi-entry)
│   ├── education.ts      # Education step
│   └── skills.ts         # Skills step
└── template/
    ├── index.ts          # Template wizard orchestration
    ├── basics.ts         # Name, description step
    ├── style.ts          # Color, fonts step
    └── layout.ts         # Layout options step
```

**Wizard Step Interface:**

```typescript
// packages/cli/src/lib/wizard/types.ts
export interface WizardStep<T> {
  readonly name: string;
  readonly description: string;
  run(context: WizardContext): Promise<T>;
  validate?(value: T): string | true;
  skip?(context: WizardContext): boolean;
}

export interface WizardContext {
  data: Record<string, unknown>;
  locale: string;
  quiet: boolean;
}
```

**Example Wizard Step:**

```typescript
// packages/cli/src/lib/wizard/cv/contact.ts
import { input, confirm } from '@inquirer/prompts';
import type { Contact } from '@gottz/cv-core';
import type { WizardStep, WizardContext } from '../types.ts';

export const contactStep: WizardStep<Contact> = {
  name: 'contact',
  description: 'Basic contact information',

  async run(context) {
    const name = await input({
      message: 'Full name:',
      validate: (v) => v.trim().length > 0 || 'Name is required',
    });

    const email = await input({
      message: 'Email address:',
      validate: (v) => v.includes('@') || 'Invalid email',
    });

    const addPhone = await confirm({
      message: 'Add phone number?',
      default: false,
    });

    const phone = addPhone
      ? await input({ message: 'Phone number:' })
      : undefined;

    const location = await input({
      message: 'Location (city, country):',
      default: '',
    });

    return {
      name,
      email,
      phone: phone || undefined,
      location: location || undefined,
    };
  }
};
```

**Wizard Runner:**

```typescript
// packages/cli/src/lib/wizard/index.ts
import type { WizardStep, WizardContext } from './types.ts';
import { createSpinner } from '../spinner.ts';

export async function runWizard<T>(
  steps: WizardStep<unknown>[],
  context: WizardContext,
): Promise<T> {
  const results: Record<string, unknown> = {};

  for (const step of steps) {
    if (step.skip?.(context)) {
      continue;
    }

    console.log(`\n${step.description}`);
    const value = await step.run({ ...context, data: results });

    if (step.validate) {
      const validation = step.validate(value);
      if (validation !== true) {
        throw new Error(validation);
      }
    }

    results[step.name] = value;
    context.data[step.name] = value;
  }

  return results as T;
}
```

### 4. Template Generator

**Location:** Extend `packages/cli/src/lib/scaffolder.ts`

**Files to Generate:**

| File | Content |
|------|---------|
| `config.json` | Template metadata, style defaults |
| `template.njk` | Nunjucks template with standard sections |
| `styles.css` | CSS with variable hooks, base styles |

**Generator Interface:**

```typescript
// packages/cli/src/lib/template-scaffolder.ts
export interface TemplateScaffoldOptions {
  name: string;            // kebab-case identifier
  displayName: string;     // Human-readable name
  description: string;     // Brief description
  style: {
    accentColor: string;
    fontHeading?: string;
    fontBody?: string;
    margins?: 'narrow' | 'normal' | 'wide';
  };
  atsCompliant?: boolean;
  singleColumn?: boolean;
  baseTemplate?: string;   // Existing template to copy from
}

export async function createTemplateDirectory(
  templatesDir: string,
  options: TemplateScaffoldOptions,
): Promise<void> {
  const templateDir = path.join(templatesDir, options.name);

  // Check for existing
  if (await exists(templateDir)) {
    throw new Error(`Template ${options.name} already exists`);
  }

  await mkdir(templateDir, { recursive: true });

  // Generate config.json
  await writeFile(
    path.join(templateDir, 'config.json'),
    generateConfigJson(options),
  );

  // Generate template.njk
  await writeFile(
    path.join(templateDir, 'template.njk'),
    generateTemplateNjk(options),
  );

  // Generate styles.css
  await writeFile(
    path.join(templateDir, 'styles.css'),
    generateStylesCss(options),
  );
}
```

**Template Generation (styles.css):**

```typescript
function generateStylesCss(options: TemplateScaffoldOptions): string {
  return `/* ${options.displayName} Template Styles */

/* Import shared reset and theme */
@import '../_shared/partials/_reset.css';
@import '../_shared/partials/_theme.css';

/* Template-specific styles */
.cv-page {
  max-width: 8.5in;
  margin: 0 auto;
  padding: var(--page-margin);
  background: var(--color-background);
  color: var(--color-body);
  font-family: var(--font-body);
}

/* Section styling */
.section {
  margin-bottom: 1.5rem;
}

.section h2 {
  color: var(--color-heading);
  font-family: var(--font-heading);
  font-size: 1.25rem;
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: 0.25rem;
  margin-bottom: 0.75rem;
}

/* Add your custom styles below */

`;
}
```

## Data Flow

### AI Enhancement Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   cv.md      │────>│  CV Parser   │────>│   CVData     │
│  (markdown)  │     │ (existing)   │     │  (struct)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐             │
                     │ Prompt       │<────────────┘
                     │ Builder      │
                     └──────┬───────┘
                            │
                     ┌──────v───────┐     ┌──────────────┐
                     │ AI Provider  │────>│ LLM API      │
                     │ (Vercel SDK) │     │ (OpenAI/etc) │
                     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────v───────┐
                     │ Response     │
                     │ Parser       │
                     └──────┬───────┘
                            │
                     ┌──────v───────┐     ┌──────────────┐
                     │ CV Merger    │────>│ Updated      │
                     │              │     │ cv.md        │
                     └──────────────┘     └──────────────┘
```

### Wizard Flow

```
┌──────────────┐
│ cvgen wizard │
│ cv           │
└──────┬───────┘
       │
       v
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Contact Step │────>│ Summary Step │────>│ Experience   │
│ (prompts)    │     │ (prompts)    │     │ Step (loop)  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
       ┌──────────────────────────────────────────┘
       v
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Education    │────>│ Skills Step  │────>│ Markdown     │
│ Step (loop)  │     │ (categories) │     │ Generator    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                           ┌──────v───────┐
                                           │ people/name/ │
                                           │ cv.md        │
                                           └──────────────┘
```

### Template Scaffolding Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ cvgen wizard │────>│ Config       │────>│ Style        │
│ template     │     │ Prompts      │     │ Prompts      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐             │
                     │ Template     │<────────────┘
                     │ Scaffolder   │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              v             v             v
       ┌────────────┐ ┌───────────┐ ┌──────────┐
       │config.json │ │template.  │ │styles.   │
       │            │ │njk        │ │css       │
       └────────────┘ └───────────┘ └──────────┘
```

## Configuration Strategy

### Environment Variables (AI)

| Variable | Purpose | Example |
|----------|---------|---------|
| `CVGEN_AI_PROVIDER` | Default provider | `openai`, `anthropic`, `ollama` |
| `OPENAI_API_KEY` | OpenAI authentication | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic authentication | `sk-ant-...` |
| `CVGEN_OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `CVGEN_AI_MODEL` | Default model | `gpt-4o`, `claude-sonnet-4-20250514`, `llama3.3` |

### Configuration File (Optional)

```json
// config.json at project root
{
  "$schema": "./schemas/config.schema.json",
  "style": {
    "accentColor": "#2563eb"
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 4096,
    "prompts": {
      "enhance": "./custom-prompts/enhance.md",
      "suggest": "./custom-prompts/suggest.md"
    }
  }
}
```

### API Key Security

1. **Never commit API keys** - Use environment variables
2. **Support .env files** - Via existing Bun runtime support
3. **Validate before use** - Check provider availability before prompting
4. **Graceful degradation** - Offer prompt export when no API key

## Suggested Build Order

Based on component dependencies:

### Phase 1: AI Package Foundation

**Why first:** Provides interfaces other components depend on.

1. **Create `packages/ai/` package**
   - `package.json` with ai, @ai-sdk/openai, @ai-sdk/anthropic dependencies
   - Provider interface definitions
   - Configuration types

2. **Implement Provider Abstraction**
   - OpenAI provider (most common)
   - Provider factory function
   - Configuration loader

3. **Implement Prompt Templates**
   - Enhance prompt template
   - Suggest prompt template
   - Nunjucks-based prompt rendering

### Phase 2: Prompt Export (No API Required)

**Why second:** Provides value without requiring API keys.

1. **Export Command**
   - `cvgen ai export-prompt <name>`
   - Output formatted prompt to stdout or file

2. **Apply Command**
   - `cvgen ai apply --file response.md`
   - Parse LLM response and update CV

### Phase 3: LLM Integration

**Why third:** Requires Phase 1 foundation.

1. **Enhance Command**
   - `cvgen ai enhance <name>`
   - Provider selection (OpenAI default)
   - Dry-run mode

2. **Suggest Command**
   - `cvgen ai suggest <name>`
   - Prioritized suggestions

3. **Additional Providers**
   - Anthropic provider
   - Ollama provider

### Phase 4: CLI Wizard Infrastructure

**Why fourth:** Independent of AI work, can parallel.

1. **Install @inquirer/prompts**
2. **Wizard Runner**
   - Step orchestration
   - Context management
   - Error handling

3. **Basic Steps**
   - Contact info step
   - Single-section step pattern

### Phase 5: CV Creation Wizard

**Why fifth:** Depends on wizard infrastructure.

1. **All CV Steps**
   - Summary, Experience, Education, Skills
   - Multi-entry handling (experience loop)

2. **Markdown Generator**
   - Convert wizard data to cv.md format
   - Proper YAML frontmatter

3. **Integration**
   - `cvgen wizard cv` command

### Phase 6: Template Scaffolding

**Why sixth:** Lower priority, builds on existing scaffolder.

1. **Template Scaffolder**
   - Extend existing scaffolder.ts
   - Generate config.json, template.njk, styles.css

2. **Template Wizard**
   - Interactive template creation
   - Style selection prompts

3. **Integration**
   - `cvgen create-template <name>` (non-interactive)
   - `cvgen wizard template` (interactive)

### Dependency Graph

```
Phase 1: AI Foundation
    │
    ├──> Phase 2: Prompt Export (no API)
    │
    └──> Phase 3: LLM Integration
              │
              v
         Phase 4: Wizard Infrastructure ──> Phase 5: CV Wizard
                                                │
                                                v
                                           Phase 6: Template Scaffolding
```

## Confidence Assessment

| Component | Confidence | Rationale |
|-----------|------------|-----------|
| LLM Provider Abstraction | HIGH | Vercel AI SDK is mature, well-documented, widely used |
| Prompt Templates | HIGH | Nunjucks already in use, pattern established |
| CLI Wizard | HIGH | @inquirer/prompts is industry standard, existing prompts.ts shows pattern |
| Template Scaffolding | HIGH | Existing scaffolder.ts provides foundation |
| Integration Points | HIGH | Existing architecture has clear boundaries |
| Configuration | HIGH | Existing config cascade pattern is well-suited |

## Sources

### LLM SDKs
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [Vercel AI SDK GitHub](https://github.com/vercel/ai)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Ollama JavaScript Library](https://github.com/ollama/ollama-js)
- [Token.js Multi-Provider SDK](https://github.com/token-js/token.js)

### CLI and Prompts
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts)
- [Commander.js](https://github.com/tj/commander.js)
- [Building TypeScript CLI with Commander](https://blog.logrocket.com/building-typescript-cli-node-js-commander/)
- [Nested Subcommands in Commander.js](https://maxschmitt.me/posts/nested-subcommands-commander-node-js)

### Prompt Engineering
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Palantir Prompt Engineering Best Practices](https://www.palantir.com/docs/foundry/aip/best-practices-prompt-engineering)

### Scaffolding
- [Node.js CLI Scaffolding](https://sparkbox.com/foundry/use_node_fs_instead_of_javascript_dependencies_to_scaffold_files)
- [Simple Scaffold npm](https://www.npmjs.com/package/simple-scaffold)
