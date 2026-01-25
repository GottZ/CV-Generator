# Phase 15: Multi-Stage Workflow - Research

**Researched:** 2026-01-25
**Domain:** Multi-Stage LLM Workflow with State Persistence
**Confidence:** HIGH

## Summary

Phase 15 implements a multi-stage CV improvement workflow with persistent state across sessions. The research confirms a clear architecture: use **simple JSON file-based state persistence** (not XState or workflow engines) combined with **Vercel AI SDK 6 structured outputs via Zod schemas** for type-safe stage results. The workflow follows a linear stage progression (Analyze -> Improve -> Summarize -> Tailor) where each stage's output feeds the next.

The existing Phase 14 foundation provides the AI provider abstraction, prompt templates, and basic state persistence. Phase 15 extends this with stage-specific state management, structured LLM outputs, and CLI commands for status/context viewing. The key insight is that for a 4-stage linear workflow, a simple state machine pattern (discriminated union types + JSON persistence) is more appropriate than heavyweight workflow engines like XState or Temporal.

**Primary recommendation:** Implement a simple TypeScript state machine using discriminated unions for stage types, Zod schemas for structured LLM outputs, and per-person JSON state files at `/people/[name]/output/.ai-state.json`. No external workflow libraries needed.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | 4.x | Structured LLM output validation | AI SDK 6 native support, 14x faster parsing in v4, TypeScript-first |
| `ai` | 6.x (existing) | AI SDK core with Output.object() | Already installed, provides structured generation |
| `nunjucks` | 3.x (existing) | Prompt templates | Already installed, proven in Phase 14 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `picocolors` | 1.x (existing) | Terminal styling for status display | Status command colored output |
| `cli-table3` | 0.6.x (existing) | Table formatting | Context section listing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple state file | XState | XState is overkill for 4-stage linear workflow; adds 15KB+ bundle |
| Simple state file | Temporal/Inngest | Distributed workflow engines for server apps, not CLI tools |
| JSON file | SQLite | Database overkill for per-person state; adds complexity |
| Zod schemas | JSON Schema | Zod provides TypeScript inference + runtime validation in one |

**Installation:**
```bash
npm install zod
# Other packages already installed from Phase 14
```

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── ai/
│   ├── workflow/                  # NEW: Multi-stage workflow
│   │   ├── index.ts               # Exports: runStage, getWorkflowState
│   │   ├── types.ts               # Stage types, state schema
│   │   ├── state.ts               # State persistence (.ai-state.json)
│   │   ├── stages/                # Stage implementations
│   │   │   ├── analyze.ts         # Stage 1: CV analysis
│   │   │   ├── improve.ts         # Stage 2: Bullet improvement
│   │   │   ├── summarize.ts       # Stage 3: Summary generation
│   │   │   └── tailor.ts          # Stage 4: Job tailoring
│   │   └── schemas/               # Zod schemas for structured outputs
│   │       ├── analyze-output.ts
│   │       ├── improve-output.ts
│   │       ├── summarize-output.ts
│   │       └── tailor-output.ts
│   ├── prompts/                   # Existing from Phase 14
│   └── providers/                 # Existing from Phase 14
└── commands/
    └── ai/
        ├── status.ts              # NEW: cvgen ai status [name]
        ├── context.ts             # NEW: cvgen ai context [name] [section]
        ├── analyze.ts             # NEW: cvgen ai analyze [name]
        ├── improve.ts             # NEW: cvgen ai improve [name]
        ├── summarize.ts           # NEW: cvgen ai summarize [name]
        └── tailor.ts              # NEW: cvgen ai tailor [name] --job <file>
```

### Pattern 1: Discriminated Union State Machine
**What:** TypeScript types enforce valid state transitions without runtime library
**When to use:** Linear workflow with small number of states (< 10)
**Example:**
```typescript
// Source: TypeScript discriminated union pattern
// See: https://dev.to/davidkpiano/you-don-t-need-a-library-for-state-machines-k7h

type WorkflowStage =
  | 'not_started'
  | 'analyzed'
  | 'improved'
  | 'summarized'
  | 'tailored';

interface WorkflowState {
  currentStage: WorkflowStage;
  completedAt: Record<WorkflowStage, string | null>;
  stageResults: {
    analyze?: AnalyzeOutput;
    improve?: ImproveOutput;
    summarize?: SummarizeOutput;
    tailor?: TailorOutput;
  };
  cvPath: string;
  locale: string;
  lastUpdated: string;
}

// Allowed transitions (linear progression)
const STAGE_ORDER: WorkflowStage[] = [
  'not_started',
  'analyzed',
  'improved',
  'summarized',
  'tailored',
];

function canTransitionTo(current: WorkflowStage, target: WorkflowStage): boolean {
  const currentIdx = STAGE_ORDER.indexOf(current);
  const targetIdx = STAGE_ORDER.indexOf(target);
  // Can only advance one stage or stay
  return targetIdx === currentIdx + 1;
}
```

### Pattern 2: Structured Output with Zod + AI SDK 6
**What:** Define expected LLM output shape, get type-safe results
**When to use:** Every stage that needs structured data for the next stage
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Define the schema with descriptions for better LLM guidance
const AnalyzeOutputSchema = z.object({
  sections: z.array(z.object({
    name: z.string().describe('Section heading from CV (e.g., "Experience", "Education")'),
    status: z.enum(['strong', 'needs_improvement', 'missing']),
    bullets: z.number().describe('Number of bullet points in this section'),
    issues: z.array(z.string()).describe('Specific problems identified'),
  })).describe('Analysis of each CV section'),
  gaps: z.array(z.string()).describe('Missing information or unexplained gaps'),
  priorities: z.array(z.object({
    section: z.string(),
    issue: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
  })).describe('Ranked improvement priorities'),
});

type AnalyzeOutput = z.infer<typeof AnalyzeOutputSchema>;

// Usage
const { output } = await generateText({
  model: provider,
  system: 'You are an expert CV consultant...',
  prompt: renderedPrompt,
  output: Output.object({
    schema: AnalyzeOutputSchema,
  }),
});

// output is fully typed as AnalyzeOutput
```

### Pattern 3: Per-Person State File
**What:** Store workflow state in person's output directory
**When to use:** Persist state across CLI invocations
**Example:**
```typescript
// Source: Phase 14 state.ts pattern + requirements AI-03
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const STATE_FILENAME = '.ai-state.json';

export function getStatePath(personDir: string): string {
  // /people/[name]/output/.ai-state.json
  return path.join(personDir, 'output', STATE_FILENAME);
}

export async function loadWorkflowState(personDir: string): Promise<WorkflowState | null> {
  const statePath = getStatePath(personDir);
  try {
    const content = await readFile(statePath, 'utf-8');
    return JSON.parse(content) as WorkflowState;
  } catch {
    return null;
  }
}

export async function saveWorkflowState(
  personDir: string,
  state: WorkflowState
): Promise<void> {
  const outputDir = path.join(personDir, 'output');
  await mkdir(outputDir, { recursive: true });
  const statePath = getStatePath(personDir);
  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
}
```

### Pattern 4: Stage Result Chaining
**What:** Pass previous stage output as context to next stage
**When to use:** Each stage after analyze
**Example:**
```typescript
// Source: Existing improve.njk template pattern
interface StageContext {
  cv: CVData;
  locale: string;
  previousResults?: {
    analyze?: AnalyzeOutput;
    improve?: ImproveOutput;
    summarize?: SummarizeOutput;
  };
}

async function runImproveStage(
  state: WorkflowState,
  provider: AIProvider
): Promise<ImproveOutput> {
  // Validate prerequisite
  if (!state.stageResults.analyze) {
    throw new WorkflowError('improve', 'Must run analyze stage first');
  }

  const context: StageContext = {
    cv: await loadCV(state.cvPath),
    locale: state.locale,
    previousResults: {
      analyze: state.stageResults.analyze,
    },
  };

  const prompt = renderPrompt('improve', {
    ...context,
    previousAnalysis: JSON.stringify(state.stageResults.analyze, null, 2),
  });

  const { output } = await generateText({
    model: provider,
    prompt,
    output: Output.object({ schema: ImproveOutputSchema }),
  });

  return output;
}
```

### Anti-Patterns to Avoid
- **Using XState for 4-stage linear workflow:** Overkill; simple discriminated union is sufficient
- **Storing state in global .cvgen-state.json:** Per requirements, state is per-person at `/people/[name]/output/.ai-state.json`
- **Hand-rolling JSON validation:** Use Zod `safeParse()` for state file validation
- **Blocking on missing previous stage:** Provide clear error message with the command to run
- **Storing raw LLM text:** Always use structured output for stage results
- **Re-running completed stages without --force:** Preserve idempotency, skip if already done

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM output parsing | Regex/string splitting | AI SDK Output.object() + Zod | LLM outputs are unpredictable; structured generation guarantees format |
| State file validation | Manual JSON checks | Zod schema with safeParse() | Catches corrupted/migrated state files |
| Stage dependency checking | if/else chains | STAGE_ORDER array lookup | Single source of truth for progression |
| Terminal formatting | Console.log strings | picocolors + cli-table3 | Already in project, consistent styling |
| Section matching | String.includes() | Case-insensitive exact match | Per CONTEXT.md decision |

**Key insight:** Structured LLM outputs via Zod schemas are the breakthrough. They eliminate the fragile "parse the AI response" anti-pattern. Every stage result is type-safe and validated.

## Common Pitfalls

### Pitfall 1: LLM Refuses Structured Output
**What goes wrong:** Some models or prompts cause the LLM to ignore the schema
**Why it happens:** Prompt conflicts with schema, or model doesn't support structured output well
**How to avoid:** Test with all three providers; include schema hints in prompt; use fallback models
**Warning signs:** `output` is null or partial; parse errors

```typescript
// Prevention: Validate output and retry with different prompt
const { output } = await generateText({...});
if (!output) {
  // Fallback: Try with explicit JSON instruction
  const { text } = await generateText({
    ...config,
    prompt: `${prompt}\n\nRespond ONLY with valid JSON matching this schema: ${JSON.stringify(schema)}`,
  });
  output = ImproveOutputSchema.parse(JSON.parse(text));
}
```

### Pitfall 2: State File Corruption
**What goes wrong:** Partial write leaves state file invalid
**Why it happens:** Process killed during write; disk full
**How to avoid:** Write to temp file, then rename (atomic operation)
**Warning signs:** JSON parse errors on state load

```typescript
// Prevention: Atomic write pattern
import { rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

async function atomicWrite(path: string, content: string): Promise<void> {
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(tempPath, content, 'utf-8');
  await rename(tempPath, path);  // Atomic on most filesystems
}
```

### Pitfall 3: Section Name Mismatch
**What goes wrong:** User asks for "Experience" but CV has "Work Experience"
**Why it happens:** Case-insensitive exact match per CONTEXT.md, but headings vary
**How to avoid:** On mismatch, suggest available sections
**Warning signs:** "Section not found" when user knows it exists

```typescript
// Prevention: Helpful error with suggestions
const sections = getSectionNames(cvData);
const match = sections.find(s => s.toLowerCase() === input.toLowerCase());
if (!match) {
  const suggestions = sections.filter(s =>
    s.toLowerCase().includes(input.toLowerCase())
  );
  throw new Error(
    `Section '${input}' not found.\n` +
    `Available: ${sections.join(', ')}` +
    (suggestions.length ? `\nDid you mean: ${suggestions.join(', ')}?` : '')
  );
}
```

### Pitfall 4: Stage 4 Without Job Description
**What goes wrong:** User runs tailor without providing job file
**Why it happens:** Tailor is optional but requires input
**How to avoid:** Clear error message; allow skipping stage 4 in status display
**Warning signs:** Missing job description error

```typescript
// Prevention: Early validation in command
if (!options.job) {
  console.error('Stage 4 (Tailor) requires a job description.');
  console.error('Usage: cvgen ai tailor jane --job ./job.md');
  console.error('Or skip this stage - workflow is complete after stage 3.');
  process.exit(1);
}
```

### Pitfall 5: Resume After Code Change
**What goes wrong:** State file has old schema version, new code expects different shape
**Why it happens:** Schema evolution without migration
**How to avoid:** Include schema version in state file; validate on load
**Warning signs:** Unexpected undefined values; type errors at runtime

```typescript
// Prevention: Versioned state schema
const STATE_VERSION = 1;

const WorkflowStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  currentStage: z.enum(['not_started', 'analyzed', 'improved', 'summarized', 'tailored']),
  // ... rest of schema
});

export async function loadWorkflowState(personDir: string): Promise<WorkflowState | null> {
  const content = await readFile(statePath, 'utf-8');
  const data = JSON.parse(content);

  if (data.version !== STATE_VERSION) {
    console.warn(`State file version ${data.version} is outdated. Consider re-running analysis.`);
    // Could implement migration here
  }

  return WorkflowStateSchema.parse(data);
}
```

## Code Examples

Verified patterns from official sources:

### AI SDK 6 Structured Output
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
import { generateText, Output } from 'ai';
import { z } from 'zod';

const BulletImprovementSchema = z.object({
  original: z.string().describe('The original bullet text'),
  improved: z.string().describe('The improved bullet using STAR method'),
  reasoning: z.string().describe('Why this improvement is better'),
  metrics: z.array(z.string()).optional().describe('Quantifiable metrics added'),
});

const ImproveOutputSchema = z.object({
  jobImprovements: z.array(z.object({
    company: z.string(),
    role: z.string(),
    bullets: z.array(BulletImprovementSchema),
  })),
  overallNotes: z.string().optional(),
});

const { output } = await generateText({
  model: openai('gpt-4o'),
  system: 'You are an expert CV writer...',
  prompt: promptText,
  output: Output.object({
    schema: ImproveOutputSchema,
  }),
});

// output is typed as z.infer<typeof ImproveOutputSchema>
console.log(output.jobImprovements[0].bullets[0].improved);
```

### Zod safeParse for Runtime Validation
```typescript
// Source: https://zod.dev/
const result = WorkflowStateSchema.safeParse(jsonData);
if (!result.success) {
  console.error('Invalid state file:', result.error.issues);
  return null;
}
return result.data;  // Fully typed WorkflowState
```

### Status Command Output Format
```typescript
// Source: CONTEXT.md decisions
import pc from 'picocolors';
import Table from 'cli-table3';

function displayStatus(state: WorkflowState): void {
  const stages = [
    { name: 'Analyze', key: 'analyzed', cmd: 'cvgen ai analyze' },
    { name: 'Improve', key: 'improved', cmd: 'cvgen ai improve' },
    { name: 'Summarize', key: 'summarized', cmd: 'cvgen ai summarize' },
    { name: 'Tailor', key: 'tailored', cmd: 'cvgen ai tailor --job <file>' },
  ];

  const table = new Table({
    head: ['Stage', 'Status', 'Completed'],
  });

  for (const stage of stages) {
    const completed = state.completedAt[stage.key];
    const isCurrent = STAGE_ORDER.indexOf(state.currentStage) ===
                      STAGE_ORDER.indexOf(stage.key as WorkflowStage) - 1;

    table.push([
      isCurrent ? pc.cyan(`> ${stage.name}`) : stage.name,
      completed ? pc.green('Done') : pc.dim('Pending'),
      completed || '-',
    ]);
  }

  console.log(table.toString());

  if (state.currentStage !== 'tailored') {
    const nextStage = stages[STAGE_ORDER.indexOf(state.currentStage)];
    console.log(`\nNext: ${pc.cyan(nextStage.cmd)}`);
  }
}
```

### Context Section Display
```typescript
// Source: CONTEXT.md decisions - case-insensitive exact match
function findSection(state: WorkflowState, sectionArg: string): string | null {
  const analyzeResult = state.stageResults.analyze;
  if (!analyzeResult) return null;

  const section = analyzeResult.sections.find(
    s => s.name.toLowerCase() === sectionArg.toLowerCase()
  );

  return section ? section.name : null;
}

function displaySectionContext(
  state: WorkflowState,
  section: string,
  verbose: boolean
): void {
  // Default: show latest analysis
  const latest = getLatestResultForSection(state, section);
  console.log(formatSectionResult(latest));

  // --verbose: show progression through all stages
  if (verbose) {
    console.log(pc.dim('\n--- Stage Progression ---'));
    for (const [stage, result] of Object.entries(state.stageResults)) {
      const sectionData = extractSectionFromResult(result, section);
      if (sectionData) {
        console.log(`\n${pc.cyan(stage.toUpperCase())}:`);
        console.log(formatSectionResult(sectionData));
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Parse LLM text with regex | AI SDK Output.object() + Zod | AI SDK 6 (late 2025) | Type-safe structured outputs |
| XState for all state | Simple discriminated unions | 2024-2025 | Right-sized solution for linear workflows |
| LangChain for everything | Vercel AI SDK + targeted tools | 2025 | Less abstraction, easier debugging |
| Zod 3.x | Zod 4.x | July 2025 | 14x faster parsing, better TS inference |
| generateObject separate call | Output param in generateText | AI SDK 6 | Unified API, single call |

**Deprecated/outdated:**
- `generateObject` as separate function: Use `Output.object()` param in `generateText` instead
- Zod 3.x `.describe()` syntax: Still works, but Zod 4 is faster and recommended
- Manual prompt engineering for JSON: Structured output handles this automatically

## Open Questions

Things that couldn't be fully resolved:

1. **Partial stage results on error**
   - What we know: LLM might complete 2 of 5 job analyses before error
   - What's unclear: Should we save partial results?
   - Recommendation: Yes, save what we have; mark stage as 'partial'; allow resume

2. **Token limits for large CVs**
   - What we know: Some CVs + analysis context might exceed context window
   - What's unclear: What's the threshold? How to chunk?
   - Recommendation: For Phase 15, assume CVs fit; flag for Phase 16 optimization

3. **Ollama structured output support**
   - What we know: Ollama models vary in structured output capability
   - What's unclear: Which local models reliably support Output.object()?
   - Recommendation: Test with llama3.2; fallback to text + manual parse if needed

## Sources

### Primary (HIGH confidence)
- [AI SDK Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - Output.object() API
- [AI SDK 6 Blog Post](https://vercel.com/blog/ai-sdk-6) - Unified generateText/generateObject
- [Zod v4 Release Notes](https://zod.dev/v4) - Version 4 features, performance
- [Zod npm](https://www.npmjs.com/package/zod) - Current version 4.3.5

### Secondary (MEDIUM confidence)
- [Multi-Step LLM Chains Best Practices](https://www.deepchecks.com/orchestrating-multi-step-llm-chains-best-practices/) - State management patterns
- [Microsoft Agent Framework Checkpoints](https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/checkpoints) - Checkpoint structure
- [Inngest Chained LLMs](https://www.inngest.com/blog/running-chained-llms-typescript-in-production) - State handoff patterns
- [9 Best Practices for Zod 2025](https://javascript.plainenglish.io/9-best-practices-for-using-zod-in-2025-31ee7418062e) - Zod usage patterns

### Tertiary (LOW confidence)
- [You don't need a library for state machines](https://dev.to/davidkpiano/you-don-t-need-a-library-for-state-machines-k7h) - Simple state machine justification
- [StateFlow paper](https://arxiv.org/html/2403.11322v1) - Academic pattern, may be overkill

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - AI SDK 6 docs confirm Output.object() + Zod pattern
- Architecture: HIGH - Extends proven Phase 14 patterns; simple linear workflow
- Pitfalls: MEDIUM - Based on general LLM experience; needs validation with specific models
- State persistence: HIGH - JSON file pattern is well-established for CLI tools

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable ecosystem; AI SDK 6 is mature)
