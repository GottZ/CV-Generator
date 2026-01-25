# Research Summary: v1.2 AI-Assisted CV Generation

**Milestone:** v1.2 - Prompts for CV and Template Generation
**Research Completed:** 2026-01-25
**Overall Confidence:** HIGH

---

## Executive Summary

The v1.2 milestone adds AI-powered content generation, interactive CLI wizards, and template scaffolding to the existing CV generator CLI. Research across four dimensions (stack, features, architecture, pitfalls) yields a cohesive approach that prioritizes **user control, provider flexibility, and graceful degradation**.

**Core recommendations:**

1. **Use Vercel AI SDK** as a unified abstraction layer over OpenAI, Anthropic, and Ollama. This prevents vendor lock-in (the #1 pitfall) and provides consistent APIs with structured output via Zod schemas.

2. **Provide prompt export fallback** for users without API keys or privacy concerns. This makes AI features accessible without requiring external API calls.

3. **Use @inquirer/prompts** for interactive wizards, following the existing Commander.js pattern. All interactive features must support non-interactive fallback for CI/CD usage.

4. **Extend existing Nunjucks templating** for both CV templates and LLM prompt templates. No new template engines needed.

5. **Prioritize security from day one:** Prompt injection is OWASP #1 for LLM apps. PII in CV data requires careful handling. API keys via environment variables only.

The recommended stack additions are minimal (6 runtime packages) and integrate cleanly with the existing architecture. The existing monorepo structure (`packages/core`, `packages/templates`, `packages/cli`) naturally accommodates a new `packages/ai` package for LLM concerns.

---

## Key Findings

### From STACK.md: Recommended Technologies

**LLM Integration:**
- **AI SDK Core:** `ai@^6.0.49` - Vercel AI SDK for unified multi-provider interface
- **OpenAI Provider:** `@ai-sdk/openai@^3.0.18` - GPT-4o, GPT-4.5 access
- **Anthropic Provider:** `@ai-sdk/anthropic@^3.0.23` - Claude Opus 4.5, Sonnet, Haiku
- **Ollama Provider:** `ai-sdk-ollama@^3.3.0` - Local models (llama3, mistral, etc.)
- **Schema Validation:** `zod@^4.3.6` - Structured outputs, runtime validation

**CLI Wizard:**
- **Prompts Library:** `@inquirer/prompts@^8.2.0` - Modern, modular Inquirer.js rewrite

**Rationale:** Vercel AI SDK provides consistent streaming, error handling, and structured outputs across all providers. This avoids the #1 critical pitfall (single provider lock-in) identified in PITFALLS.md. The stack adds ~430KB total - reasonable for a CLI tool.

**What NOT to use:**
- Direct provider SDKs (`openai`, `@anthropic-ai/sdk`, `ollama`) - Creates triple implementation burden
- LangChain - Over-abstraction for straightforward text generation use case
- Legacy `inquirer` - Use modular `@inquirer/prompts` instead

### From FEATURES.md: Table Stakes and Differentiators

**Table Stakes (Must Have):**
1. Achievement bullet generation - Core AI value proposition
2. Professional summary generation - Second most common AI feature
3. Keyword optimization suggestions - 97%+ Fortune 500 use ATS
4. STAR method formatting - Industry standard
5. Multi-provider support - Users have different LLM access
6. **Prompt export fallback** - Critical for users without API keys
7. Preview before accepting - Never auto-write without confirmation
8. Error handling for API failures - LLM APIs are unreliable

**Differentiators (Competitive Advantages):**
1. **Job description tailoring** - Rewrite CV content for specific job postings (HIGH priority)
2. **Before/after diff view** - Show exactly what AI changed (HIGH priority)
3. **Local model support (Ollama)** - Privacy-focused, no API costs (HIGH priority)
4. Weak bullet detection - Identify bullets lacking impact/metrics
5. Context-aware suggestions - AI understands full CV, not just current section
6. IT-specific prompt templates - Domain expertise for tech roles

**Anti-Features (Deliberately Avoid):**
- Auto-write without preview - 62% of employers reject AI content without personalization
- Hallucinated credentials - Legal/ethical issues
- Keyword stuffing mode - Modern ATS detects this
- Full CV generation from scratch - Produces generic, detectable AI content
- Real-time API calls during build - Slows build, fails on network issues

**Key insight:** AI features must enhance user content, not replace it. Employers actively reject fully AI-generated resumes.

### From ARCHITECTURE.md: Integration Strategy

**Recommended Package Structure:**

```
packages/ai/                  # NEW - LLM provider abstraction
├── src/
│   ├── providers/           # OpenAI, Anthropic, Ollama adapters
│   ├── prompts/             # Nunjucks-based prompt templates
│   ├── config/              # AI config resolution + Zod schemas
│   └── export/              # Prompt export for manual use

packages/cli/src/lib/wizard/ # NEW - Interactive prompts
├── cv/                      # CV creation wizard steps
└── template/                # Template creation wizard steps

packages/cli/src/lib/        # EXTEND EXISTING
└── scaffolder.ts            # Add template generation methods
```

**Provider Abstraction Interface:**

```typescript
interface AIProvider {
  readonly name: string;
  readonly isAvailable: () => Promise<boolean>;
  enhance(cv: CVData, options: EnhanceOptions): Promise<EnhanceResult>;
  suggest(cv: CVData, options: SuggestOptions): Promise<SuggestResult>;
}
```

**New CLI Commands:**

```bash
cvgen ai enhance <name>        # Enhance CV sections with AI
cvgen ai suggest <name>        # Generate improvement suggestions
cvgen ai export-prompt <name>  # Export prompt for manual LLM use
cvgen wizard cv                # Interactive CV creation
cvgen wizard template          # Interactive template creation
```

**Configuration Cascade (extends existing):**

```json
{
  "style": { /* existing */ },
  "ai": {
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "prompts": {
      "enhance": "./custom-prompts/enhance.md"
    }
  }
}
```

**Integration Points:**
- AI commands use existing CV parser (`packages/core/src/parser/`)
- Prompt templates use existing Nunjucks engine
- Wizard extends existing Commander.js patterns
- Template scaffolder extends existing `scaffolder.ts`

**Key architectural decision:** Provider abstraction MUST be designed before first integration. Retrofitting is a major rewrite (PITFALLS.md CRIT-03).

### From PITFALLS.md: Critical Risks to Mitigate

**Critical Pitfalls (Security & Architecture):**

1. **CRIT-03: Single Provider Lock-in (Score: 90)** - Design provider abstraction interface BEFORE first provider integration. Retrofitting requires complete rewrite.

2. **CRIT-04: Non-Interactive Environment Crash (Score: 81)** - Check `process.stdin.isTTY` before prompts. All interactive inputs must be passable as CLI arguments.

3. **CRIT-02: Hardcoded API Keys (Score: 80)** - NEVER put keys in source files, even temporarily. Use environment variables from day one.

4. **CRIT-01: Prompt Injection (Score: 60)** - OWASP #1 for LLM apps. User CV content can manipulate LLM behavior. Use structured outputs (JSON mode), validate all LLM responses.

5. **CRIT-05: PII Sent to LLM APIs (Score: 50)** - CV data contains phone numbers, addresses. Offer prompt export mode for privacy-conscious users. Document what data goes where.

**High-Severity Pitfalls:**

1. **HIGH-04: Response Format Assumptions (Score: 72)** - LLMs are probabilistic. Use Zod validation for all LLM outputs. Implement fallback for unparseable responses.

2. **HIGH-02: Unbounded Costs (Score: 63)** - ALWAYS set `max_tokens`. Output tokens cost 3-6x more than input. Implement per-user daily limits.

3. **HIGH-03: SIGINT Not Handled (Score: 63)** - Catch `ExitPromptError` from @inquirer/prompts. Clean up partial files. Exit with code 130.

4. **HIGH-06: CSS Print Issues (Score: 56)** - Test PDF output early, not just HTML preview. Use `@media print` rules. Puppeteer PDF differs from browser print preview.

**Prevention Checklist:**

Before LLM Integration:
- [ ] Provider abstraction interface designed
- [ ] Environment variables for API keys (never hardcode)
- [ ] Rate limit handling strategy
- [ ] Cost limits (max_tokens always set)
- [ ] Prompt injection mitigations
- [ ] Prompt export fallback for privacy

Before CLI Wizard:
- [ ] Non-interactive fallback (all inputs as CLI args)
- [ ] TTY detection implemented
- [ ] SIGINT handling with cleanup
- [ ] State persistence (XDG-compliant paths)
- [ ] Review existing command patterns

---

## Recommended Stack Additions for v1.2

### Runtime Dependencies

| Package | Version | Purpose | Size | Rationale |
|---------|---------|---------|------|-----------|
| `ai` | `^6.0.49` | Vercel AI SDK core | ~150KB | Unified multi-provider interface |
| `@ai-sdk/openai` | `^3.0.18` | OpenAI provider | ~50KB | GPT-4o, GPT-4.5 access |
| `@ai-sdk/anthropic` | `^3.0.23` | Anthropic provider | ~50KB | Claude Opus 4.5, Sonnet, Haiku |
| `ai-sdk-ollama` | `^3.3.0` | Ollama provider | ~30KB | Local models (privacy) |
| `@inquirer/prompts` | `^8.2.0` | Interactive prompts | ~100KB | Modern Inquirer.js |
| `zod` | `^4.3.6` | Schema validation | ~50KB | Structured LLM outputs |

**Total addition:** ~430KB (reasonable for CLI tool)

**Installation:**
```bash
bun add ai @ai-sdk/openai @ai-sdk/anthropic ai-sdk-ollama @inquirer/prompts zod
```

**No New Template Dependencies:** Existing Nunjucks engine handles template scaffolding and prompt templates.

---

## Feature Priorities: Phased Rollout

### Phase A: Foundation (Week 1)
**Goal:** Provider abstraction and prompt export (no API required)

1. Create `packages/ai/` package structure
2. Implement provider interface and factory
3. OpenAI provider adapter
4. Prompt templates (Nunjucks-based)
5. **Prompt export command** (`cvgen ai export-prompt <name>`)

**Deliverable:** Users can generate prompts without API keys.

**Pitfalls to avoid:** CRIT-03 (design abstraction first), CRIT-02 (env vars only)

### Phase B: Core AI Features (Weeks 2-3)
**Goal:** Basic AI-assisted content generation

1. Enhance command (`cvgen ai enhance <name>`)
2. Suggest command (`cvgen ai suggest <name>`)
3. Improvement suggestions with preview
4. Before/after diff view

**Deliverable:** AI-powered bullet generation, summary writing, keyword suggestions.

**Pitfalls to avoid:** CRIT-01 (prompt injection), HIGH-04 (response validation), HIGH-02 (max_tokens)

### Phase C: CLI Wizard Foundation (Week 4)
**Goal:** Interactive CV creation

1. Install @inquirer/prompts
2. Wizard runner infrastructure
3. Enhanced init wizard
4. Add experience wizard

**Deliverable:** Interactive CV creation with guided prompts.

**Pitfalls to avoid:** CRIT-04 (TTY detection), HIGH-03 (SIGINT handling), MOD-07 (follow existing patterns)

### Phase D: Integration & Advanced Features (Weeks 5-6)
**Goal:** Multi-provider support and template generation

1. Anthropic provider
2. Ollama provider (local models)
3. Job description tailoring
4. Template customization wizard

**Deliverable:** Multi-provider support, local model option, template scaffolding.

**Pitfalls to avoid:** MOD-01 (test fallback), HIGH-06 (PDF CSS testing)

---

## Critical Pitfalls to Avoid (Ranked by Impact)

| Rank | Pitfall | Impact×Likelihood | Prevention | Phase |
|------|---------|-------------------|------------|-------|
| 1 | Single provider lock-in | 90 | Design abstraction first | Phase A |
| 2 | Non-interactive crash | 81 | TTY detection, CLI args | Phase C |
| 3 | Hardcoded API keys | 80 | Env vars from day 1 | Phase A |
| 4 | Response format assumptions | 72 | Zod validation | Phase B |
| 5 | Unbounded costs | 63 | max_tokens, limits | Phase B |
| 6 | SIGINT not handled | 63 | ExitPromptError catch | Phase C |
| 7 | Prompt injection | 60 | Structured outputs | Phase B |
| 8 | CSS print issues | 56 | Test PDF early | Phase D |
| 9 | No rate limit handling | 54 | SDK retry logic | Phase B |
| 10 | PII sent to APIs | 50 | Prompt export option | Phase A |

---

## Architecture Patterns: Build Order

```
Phase A: AI Foundation
    ├──> Phase B: LLM Integration (depends on Phase A)
    │       └──> Phase D: Multi-provider (extends Phase B)
    │
    └──> Phase C: Wizard Infrastructure (parallel to Phase B)
            └──> Phase D: Template Scaffolding (extends Phase C)
```

**Dependencies:**
- Phase B requires Phase A (provider abstraction)
- Phase D requires both Phase B (AI features) and Phase C (wizard infrastructure)
- Phases B and C can run in parallel

**Integration with Existing Architecture:**
- All phases extend existing Commander.js command structure
- AI features use existing CV parser (`packages/core/src/parser/`)
- Wizard and template features extend existing `scaffolder.ts`
- Configuration follows existing cascade pattern

---

## Confidence Assessment

| Research Area | Confidence | Basis | Gaps |
|---------------|------------|-------|------|
| **Stack** | HIGH | Official npm registry verification, SDK documentation | Bun runtime compatibility needs spike testing |
| **Features** | HIGH | Multiple industry sources, employer surveys, competitor analysis | LLM prompt engineering will require iteration |
| **Architecture** | HIGH | Existing codebase analysis, SDK patterns, established CLI conventions | Ollama API quirks may surface during implementation |
| **Pitfalls** | HIGH | OWASP guidance, official docs, existing v1.1 research | Multi-provider edge cases need production validation |

### High Confidence Sources Used:

**Official Documentation:**
- [Vercel AI SDK Docs](https://ai-sdk.dev/docs/introduction)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Inquirer.js GitHub](https://github.com/SBoudrias/Inquirer.js)
- [Commander.js v14](https://github.com/tj/commander.js)

**Security & Best Practices:**
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/)
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)
- [clig.dev - CLI Guidelines](https://clig.dev/)

**Industry Research:**
- [Resume Now Survey](https://www.resume-now.com/job-resources/careers/ai-applicant-report) - 62% employers reject AI resumes without personalization
- [Binadox LLM Pricing 2025](https://www.binadox.com/blog/llm-api-pricing-comparison-2025-complete-cost-analysis-guide/)

### Areas Needing Phase-Specific Research:

**During Phase B (LLM Integration):**
- Prompt engineering iteration for CV-specific use cases
- Real-world testing of structured output reliability across providers
- Cost benchmarking with actual CV data

**During Phase C (CLI Wizard):**
- @inquirer/prompts Bun compatibility validation (should work based on v1.0.36 fix)
- State persistence UX testing
- Terminal capability detection edge cases

**During Phase D (Multi-provider):**
- Ollama model availability and quality for CV generation
- Provider fallback behavior under load
- Prompt tuning per-provider (OpenAI vs Claude differences)

---

## Gaps to Address During Implementation

1. **Prompt Engineering:** Templates will require iteration based on real CV data. Initial prompts are starting points.

2. **Cost Monitoring:** Implement usage tracking from day one. Add alerts before implementing bulk operations.

3. **Privacy Documentation:** Clear documentation about what data goes to which providers. Privacy policy implications.

4. **Bun Runtime Compatibility:** Spike test @inquirer/prompts with Bun before Phase C. Known to work since v1.0.36, but validate.

5. **Provider-Specific Quirks:** OpenAI's structured output differs from Anthropic's approach. May need per-provider adapters.

6. **Wizard UX Testing:** State persistence and resume functionality need user testing to validate UX.

---

## Roadmap Implications

### Suggested Phase Structure

**Phase 1: AI Foundation (No API Required)**
- **Rationale:** Provides value without API keys via prompt export
- **Features:** Provider abstraction, prompt templates, export command
- **Pitfalls:** CRIT-03, CRIT-02
- **Research needed:** No additional research

**Phase 2: Core AI Features**
- **Rationale:** Basic AI enhancement with single provider (OpenAI)
- **Features:** Enhance, suggest, diff view
- **Pitfalls:** CRIT-01, HIGH-04, HIGH-02
- **Research needed:** Prompt engineering iteration

**Phase 3: CLI Wizard**
- **Rationale:** Parallel to Phase 2, independent feature
- **Features:** Interactive CV creation, experience wizard
- **Pitfalls:** CRIT-04, HIGH-03, MOD-07
- **Research needed:** Bun compatibility spike

**Phase 4: Advanced Features**
- **Rationale:** Builds on Phases 2 & 3
- **Features:** Multi-provider, job tailoring, template wizard
- **Pitfalls:** MOD-01, HIGH-06
- **Research needed:** Provider-specific testing

### Research Flags

**Phases needing additional research:**
- Phase 2: Prompt engineering (iterative)
- Phase 3: Bun compatibility validation (spike)
- Phase 4: Ollama integration testing

**Phases with well-documented patterns:**
- Phase 1: Provider abstraction (standard SDK patterns)
- Phase 3: CLI wizards (Inquirer.js established patterns)

---

## Ready for Requirements

### Summary for Roadmapper

The v1.2 research is complete and comprehensive. The recommended approach is:

1. **Use Vercel AI SDK** for multi-provider abstraction (prevents vendor lock-in)
2. **Provide prompt export fallback** (no API required, privacy-friendly)
3. **Extend existing architecture** (minimal new dependencies, clean integration)
4. **Prioritize security** (prompt injection, PII handling, API key management)

**Stack additions are minimal:** 6 runtime packages (~430KB), no new template engines.

**Critical risks identified and mitigations defined:** Provider lock-in (#1), non-interactive environments (#2), API key security (#3).

**Build order is clear:** Phase A (foundation) → Phases B/C (parallel) → Phase D (integration).

**Integration points are well-defined:** Existing CV parser, Commander.js patterns, Nunjucks templating, configuration cascade.

The roadmapper can proceed to define detailed requirements for each phase with high confidence. All table stakes, differentiators, and anti-features are documented. Critical pitfalls are ranked with prevention checklists.

---

## Sources (Aggregated)

### Stack Research
- [Vercel AI SDK](https://github.com/vercel/ai) - v6.0.49
- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts) - v8.2.0
- [ai-sdk-ollama](https://github.com/jagreehal/ai-sdk-ollama) - v3.3.0
- [Zod for TypeScript](https://workos.com/blog/zod-for-typescript)

### Features Research
- [Resume Now AI Report](https://www.resume-now.com/job-resources/careers/ai-applicant-report)
- [Built In - AI Resume Risks](https://builtin.com/articles/risks-ai-resume-builders)
- [clig.dev](https://clig.dev/) - CLI design guidelines
- [AWS CLI Wizard](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-wizard.html)

### Architecture Research
- [Vercel AI SDK Docs](https://ai-sdk.dev/docs/introduction)
- [Commander.js GitHub](https://github.com/tj/commander.js)
- [Inquirer.js Documentation](https://github.com/SBoudrias/Inquirer.js)

### Pitfalls Research
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [OpenAI Error Codes](https://platform.openai.com/docs/guides/error-codes)
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)
- [Protecto LLM Privacy](https://www.protecto.ai/blog/how-to-preserve-data-privacy-in-llms/)
- [Binadox LLM Pricing 2025](https://www.binadox.com/blog/llm-api-pricing-comparison-2025-complete-cost-analysis-guide/)
- [print-css.rocks](https://print-css.rocks/)

---

**Research completed:** 2026-01-25
**Next step:** Roadmapper agent defines detailed requirements for Phase 1 (AI Foundation)
