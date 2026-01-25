# Phase 14: AI Foundation - Research

**Researched:** 2026-01-25
**Domain:** LLM Provider Abstraction & CLI Configuration
**Confidence:** HIGH

## Summary

Phase 14 establishes the AI provider abstraction layer using Vercel AI SDK 6 and extends the existing configuration cascade with AI-specific settings. The research confirms a clear standard stack: use `ai` package for core SDK, provider-specific packages (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `ollama-ai-provider-v2`) for multi-provider support, and extend the existing config system with an `ai` section.

The existing codebase already has strong patterns to follow: Nunjucks templating for prompt templates (same as CV templates), cosmiconfig-style config cascade in `/packages/templates/src/config/index.ts`, and environment variable mapping patterns. The project uses JSON files for config (`config.json`, template `config.json`), not cosmiconfig directly, but follows the same cascade principles.

**Primary recommendation:** Use Vercel AI SDK 6 with provider packages. Store prompt templates as Nunjucks `.njk` files alongside existing templates. Extend config cascade pattern with `ai` section. Store project state in `.cvgen-state.json` per CONTEXT.md decision.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | 6.x | Core AI SDK | Vercel's unified interface, 20M+ monthly downloads, handles streaming/tools/agents |
| `@ai-sdk/openai` | 1.x | OpenAI provider | Official provider package, auto-reads `OPENAI_API_KEY` |
| `@ai-sdk/anthropic` | 1.x | Anthropic provider | Official provider package, auto-reads `ANTHROPIC_API_KEY` |
| `ollama-ai-provider-v2` | 3.x | Ollama provider | Community provider for local LLMs, supports custom baseURL |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `conf` | 15.x | Project state persistence | Store last-used provider in `.cvgen-state.json` |
| `nunjucks` | (existing) | Prompt templates | Already in project for CV templates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | LangChain.js | LangChain has more abstraction layers, harder to debug, overkill for simple text generation |
| Vercel AI SDK | Direct API calls | Loss of unified interface, must handle each provider's quirks |
| `ollama-ai-provider-v2` | `ai-sdk-ollama` | ai-sdk-ollama (jagreehal) has better tool calling support; use if Phase 15+ needs tools |
| `conf` | Manual JSON read/write | conf provides atomic writes, schema validation, XDG compliance |

**Installation:**
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic ollama-ai-provider-v2
npm install conf  # For state persistence
```

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── ai/                     # New AI module
│   ├── index.ts            # Exports public API
│   ├── config.ts           # AI config schema, cascade loading
│   ├── providers/          # Provider abstraction
│   │   ├── index.ts        # Factory: createProvider(type)
│   │   ├── types.ts        # Provider interface
│   │   ├── openai.ts       # OpenAI wrapper
│   │   ├── anthropic.ts    # Anthropic wrapper
│   │   └── ollama.ts       # Ollama wrapper
│   ├── prompts/            # Prompt template system
│   │   ├── index.ts        # Prompt loader
│   │   ├── registry.ts     # Available prompts registry
│   │   └── templates/      # .njk prompt templates
│   │       ├── analyze.njk
│   │       ├── improve.njk
│   │       └── summarize.njk
│   └── state.ts            # State management (.cvgen-state.json)
└── commands/
    └── ai.ts               # cvgen ai <subcommand>
```

### Pattern 1: Provider Factory Pattern
**What:** Single factory creates any provider from config
**When to use:** User selects provider at runtime, need consistent interface
**Example:**
```typescript
// Source: AI SDK official docs - provider instantiation
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOllama } from 'ollama-ai-provider-v2';

export type ProviderType = 'openai' | 'anthropic' | 'ollama';

export interface AIProvider {
  type: ProviderType;
  model: ReturnType<typeof createOpenAI | typeof createAnthropic | typeof createOllama>;
  modelId: string;
}

export function createProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      const openai = createOpenAI({ apiKey: config.openai?.apiKey });
      return {
        type: 'openai',
        model: openai(config.openai?.model ?? 'gpt-4o'),
        modelId: config.openai?.model ?? 'gpt-4o',
      };
    case 'anthropic':
      const anthropic = createAnthropic({ apiKey: config.anthropic?.apiKey });
      return {
        type: 'anthropic',
        model: anthropic(config.anthropic?.model ?? 'claude-sonnet-4-20250514'),
        modelId: config.anthropic?.model ?? 'claude-sonnet-4-20250514',
      };
    case 'ollama':
      const ollama = createOllama({
        baseURL: config.ollama?.endpoint ?? 'http://localhost:11434/api'
      });
      return {
        type: 'ollama',
        model: ollama(config.ollama?.model ?? 'llama3.2'),
        modelId: config.ollama?.model ?? 'llama3.2',
      };
  }
}
```

### Pattern 2: Config Cascade Extension
**What:** Extend existing config cascade with AI section
**When to use:** AI config at template, global, env, frontmatter levels
**Example:**
```typescript
// Source: Existing pattern in packages/templates/src/config/index.ts
export interface AIConfig {
  provider?: 'openai' | 'anthropic' | 'ollama';
  openai?: {
    apiKey?: string;  // Falls back to OPENAI_API_KEY env var
    model?: string | string[];  // Per CONTEXT.md: array/string hybrid
  };
  anthropic?: {
    apiKey?: string;  // Falls back to ANTHROPIC_API_KEY env var
    model?: string | string[];
  };
  ollama?: {
    endpoint?: string;  // Per CONTEXT.md: separate fields
    model?: string | string[];
  };
}

// Environment variable mappings (extend existing ENV_MAPPINGS pattern)
const AI_ENV_MAPPINGS: Record<string, (value: string) => Partial<AIConfig>> = {
  CVGEN_AI_PROVIDER: (v) => ({ provider: v as AIConfig['provider'] }),
  CVGEN_AI_OPENAI_MODEL: (v) => ({ openai: { model: v.includes(',') ? v.split(',') : v } }),
  CVGEN_AI_ANTHROPIC_MODEL: (v) => ({ anthropic: { model: v.includes(',') ? v.split(',') : v } }),
  CVGEN_AI_OLLAMA_ENDPOINT: (v) => ({ ollama: { endpoint: v } }),
  CVGEN_AI_OLLAMA_MODEL: (v) => ({ ollama: { model: v.includes(',') ? v.split(',') : v } }),
  // Standard API keys (read directly, not prefixed)
  OPENAI_API_KEY: (v) => ({ openai: { apiKey: v } }),
  ANTHROPIC_API_KEY: (v) => ({ anthropic: { apiKey: v } }),
};
```

### Pattern 3: Prompt Template with Nunjucks
**What:** Use existing Nunjucks environment for AI prompts
**When to use:** Rendering prompts with CV data interpolated
**Example:**
```typescript
// Source: Existing pattern in packages/templates/src/engine/index.ts
import nunjucks from 'nunjucks';
import path from 'node:path';

// Prompt templates directory
const PROMPTS_DIR = path.join(__dirname, 'prompts/templates');

export function createPromptEnvironment(): nunjucks.Environment {
  const loader = new nunjucks.FileSystemLoader(PROMPTS_DIR, {
    watch: false,
    noCache: false,
  });

  const env = new nunjucks.Environment(loader, {
    autoescape: false,  // Prompts are plain text, not HTML
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
  });

  return env;
}

export function renderPrompt(
  templateName: string,
  context: { cv: CVData; locale: string; options?: Record<string, unknown> }
): string {
  const env = createPromptEnvironment();
  return env.render(`${templateName}.njk`, context);
}
```

### Pattern 4: State Persistence with conf
**What:** Store project-level state for last-used provider
**When to use:** Remember user's provider choice across sessions
**Example:**
```typescript
// Source: conf documentation - project-scoped state
import Conf from 'conf';
import path from 'node:path';

export function getProjectState(projectRoot: string) {
  return new Conf({
    cwd: projectRoot,
    configName: '.cvgen-state',  // Creates .cvgen-state.json
    projectSuffix: '',  // No -nodejs suffix
    schema: {
      lastProvider: {
        type: 'string',
        enum: ['openai', 'anthropic', 'ollama'],
      },
      lastModel: {
        type: 'object',
        properties: {
          openai: { type: 'string' },
          anthropic: { type: 'string' },
          ollama: { type: 'string' },
        },
      },
    },
  });
}
```

### Anti-Patterns to Avoid
- **Hand-rolling provider abstraction:** AI SDK already provides this; don't rebuild it
- **Storing API keys in state file:** Keys belong in env vars or secure config, never `.cvgen-state.json`
- **Global state for project-specific settings:** Per CONTEXT.md, state is project-level in `.cvgen-state.json`
- **Using LangChain for simple generation:** Overkill for text generation without RAG/agents
- **Mixing `generateText` and `streamText` unnecessarily:** Phase 14 is prompt export only, no streaming needed
- **Creating custom error classes for API key issues:** AI SDK provides `LoadAPIKeyError` for this

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Provider abstraction | Custom switch/case per provider | AI SDK provider packages | Each provider has auth quirks, rate limiting, error formats |
| API key loading | `process.env.OPENAI_KEY` direct | AI SDK auto-loading | Handles missing key error with clear message |
| Ollama endpoint discovery | HTTP probing | `createOllama({ baseURL })` | Community provider handles connection, errors |
| Prompt templating | Template literals | Nunjucks (existing) | Already in project, supports includes, filters, inheritance |
| State persistence | Raw JSON read/write | `conf` package | Atomic writes prevent corruption, schema validation |
| Config cascade | Manual merge logic | Extend existing pattern | Already proven in `/packages/templates/src/config/index.ts` |

**Key insight:** The AI SDK solves provider differences. The existing codebase solves config cascade. Don't rebuild either.

## Common Pitfalls

### Pitfall 1: Missing API Key Silent Failure
**What goes wrong:** SDK throws `AI_LoadAPIKeyError`, CLI crashes without helpful message
**Why it happens:** Not catching the specific error type
**How to avoid:** Check for API key before calling `generateText`, provide setup instructions
**Warning signs:** User reports "crash when running ai command"

```typescript
// Prevention: Validate key exists before provider creation
import { LoadAPIKeyError } from 'ai';

try {
  const provider = createProvider(config);
} catch (error) {
  if (LoadAPIKeyError.isInstance(error)) {
    // Per CONTEXT.md: Hard error with clear instructions
    console.error(`API key missing for ${config.provider}.`);
    console.error('Set via environment variable or config file:');
    console.error('  OPENAI_API_KEY=sk-... (env)');
    console.error('  ai.openai.apiKey in .cvgenrc (config)');
    process.exit(1);
  }
  throw error;
}
```

### Pitfall 2: Ollama Not Running
**What goes wrong:** Connection refused when Ollama server isn't started
**Why it happens:** Ollama requires separate server process
**How to avoid:** Check endpoint reachability, provide retry prompt
**Warning signs:** "Connection refused" or "ECONNREFUSED"

```typescript
// Prevention: Test Ollama connectivity before using
async function checkOllamaConnection(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### Pitfall 3: Config Array vs String Confusion
**What goes wrong:** Code expects string but gets array from comma-separated env var
**Why it happens:** Per CONTEXT.md, model can be string OR array
**How to avoid:** Always normalize to array internally, display first as default
**Warning signs:** "Cannot read property 'split' of array" or similar

```typescript
// Prevention: Normalize model config
function normalizeModel(model: string | string[] | undefined): string[] {
  if (!model) return [];
  if (Array.isArray(model)) return model;
  return model.includes(',') ? model.split(',').map(m => m.trim()) : [model];
}

function getPrimaryModel(model: string | string[] | undefined): string | undefined {
  const models = normalizeModel(model);
  return models[0];
}
```

### Pitfall 4: Prompt Export Without Full Context
**What goes wrong:** Exported prompt references undefined variables
**Why it happens:** Prompt template uses CV data that isn't loaded
**How to avoid:** Validate CV is loaded before prompt rendering
**Warning signs:** Empty sections in exported prompt, Nunjucks errors

```typescript
// Prevention: Pre-flight check before rendering
function validatePromptContext(cv: CVData, promptType: string): void {
  const required = PROMPT_REQUIREMENTS[promptType];
  for (const field of required) {
    if (!cv[field]) {
      throw new Error(`Cannot generate ${promptType} prompt: missing ${field} in CV data`);
    }
  }
}
```

### Pitfall 5: First-Run Provider Selection Race
**What goes wrong:** Multiple providers configured, interactive prompt starts before terminal ready
**Why it happens:** CLI outputs before tty check
**How to avoid:** Check `process.stdout.isTTY` before prompting, fail gracefully in non-TTY
**Warning signs:** Garbled output, prompt doesn't show

## Code Examples

Verified patterns from official sources:

### generateText Basic Usage
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  system: 'You are a professional CV writer.',
  prompt: 'Write a professional summary for a senior software engineer.',
});
```

### Multi-Provider Setup
```typescript
// Source: AI SDK provider documentation
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOllama } from 'ollama-ai-provider-v2';

// Each provider auto-reads its standard env var
const providers = {
  openai: openai('gpt-4o'),  // Reads OPENAI_API_KEY
  anthropic: anthropic('claude-sonnet-4-20250514'),  // Reads ANTHROPIC_API_KEY
  ollama: createOllama({ baseURL: 'http://localhost:11434/api' })('llama3.2'),
};

// Use whichever is configured
async function generate(provider: keyof typeof providers, prompt: string) {
  return generateText({
    model: providers[provider],
    prompt,
  });
}
```

### Nunjucks Prompt Template
```nunjucks
{# Source: Existing Nunjucks patterns in /workspace/templates #}
{# File: prompts/templates/analyze.njk #}
You are analyzing a CV for improvement opportunities.

## CV Content

### Contact Information
Name: {{ cv.contact.name }}
{% if cv.contact.title %}Title: {{ cv.contact.title }}{% endif %}

### Professional Summary
{% if cv.summary[locale] %}
{{ cv.summary[locale] }}
{% else %}
(No summary provided - this is an improvement opportunity)
{% endif %}

### Work Experience
{% for job in cv.experience[locale] %}
**{{ job.role }}** at {{ job.company }} ({{ job.startDate }} - {{ job.endDate }})
{% for bullet in job.bullets %}
- {{ bullet }}
{% endfor %}
{% endfor %}

## Analysis Tasks

1. Identify sections that lack quantifiable achievements
2. Find vague or generic statements that could be strengthened
3. Note any gaps in the work history
4. Suggest areas where STAR method could improve bullets
```

### Config Schema Extension
```typescript
// Source: Existing schema pattern in /workspace/schemas/template-config.schema.json
export const AI_CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      enum: ['openai', 'anthropic', 'ollama'],
    },
    openai: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        model: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      },
    },
    anthropic: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        model: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      },
    },
    ollama: {
      type: 'object',
      properties: {
        endpoint: { type: 'string', format: 'uri' },
        model: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      },
    },
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LangChain for everything | AI SDK for generation, LangChain for RAG | 2024-2025 | Simpler, faster, fewer abstractions |
| OpenAI SDK directly | Vercel AI SDK unified | AI SDK 5 (July 2025) | One API for all providers |
| Cosmiconfig for config | Project JSON + env cascade | Varies | Simpler for CLIs with defined config |
| Manual provider switching | Provider factory pattern | AI SDK 6 (late 2025) | Cleaner abstraction |

**Deprecated/outdated:**
- `@langchain/core` for simple text generation: Overkill, use AI SDK
- Direct `openai` npm package: Use `@ai-sdk/openai` for unified interface
- AI SDK 5.x syntax: Some breaking changes in 6.x, follow migration guide

## Open Questions

Things that couldn't be fully resolved:

1. **Ollama model availability check**
   - What we know: Can call `/api/tags` to list models
   - What's unclear: Should we auto-pull missing models or error?
   - Recommendation: Error with message "Model X not found. Run: ollama pull X"

2. **Prompt template inheritance**
   - What we know: Nunjucks supports `{% extends %}` and `{% include %}`
   - What's unclear: Should prompts inherit from a base prompt template?
   - Recommendation: Keep prompts independent for Phase 14, evaluate in Phase 15

3. **Validation command latency**
   - What we know: `cvgen ai validate` should test API connectivity
   - What's unclear: What's acceptable timeout? What counts as "valid"?
   - Recommendation: 5s timeout, success = any non-error response from provider

## Sources

### Primary (HIGH confidence)
- [AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - Core SDK patterns, generateText, providers
- [AI SDK Provider Docs: OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) - API key loading, model instantiation
- [AI SDK Provider Docs: Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) - API key loading, model instantiation
- [AI SDK Community Providers: Ollama](https://ai-sdk.dev/providers/community-providers/ollama) - Ollama configuration
- [AI SDK Getting Started: Node.js](https://ai-sdk.dev/docs/getting-started/nodejs) - Basic setup pattern
- [AI SDK Error: LoadAPIKeyError](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-load-api-key-error) - Error handling

### Secondary (MEDIUM confidence)
- [Vercel Blog: AI SDK 6](https://vercel.com/blog/ai-sdk-6) - Version 6 features, agents
- [conf GitHub](https://github.com/sindresorhus/conf) - State persistence patterns
- [Nunjucks Documentation](https://mozilla.github.io/nunjucks/templating.html) - Template syntax

### Tertiary (LOW confidence)
- WebSearch results on multi-provider patterns - General community patterns
- WebSearch results on CLI state persistence - XDG compliance guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official AI SDK documentation confirms all choices
- Architecture: HIGH - Extends existing codebase patterns, well-documented SDK
- Pitfalls: HIGH - Direct from official docs and error handling guides
- Code examples: HIGH - Verified against official documentation

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable ecosystem)
