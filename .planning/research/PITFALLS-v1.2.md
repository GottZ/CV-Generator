# Domain Pitfalls: v1.2 LLM Integration, CLI Wizards, and Template Generation

**Domain:** CV Generator CLI - AI-assisted content generation, interactive wizards, template scaffolding
**Researched:** 2026-01-25
**Confidence:** HIGH (verified via official documentation, OWASP, and authoritative sources)

## Executive Summary

Adding LLM integration, CLI wizards, and template generation to an existing CLI tool presents specific integration challenges beyond generic implementation pitfalls. This document catalogs mistakes commonly made when **adding** these features to existing systems, with emphasis on:

1. **LLM Integration** - API reliability, security (prompt injection is OWASP #1), cost control, and graceful degradation
2. **CLI Wizards** - State persistence, signal handling, non-interactive environment detection
3. **Template Generation** - CSS print compatibility, maintainability of dual HTML/PDF templates
4. **Multi-Provider Support** - Abstraction timing, fallback complexity, provider-specific quirks

Key finding: The most critical pitfall is **tight coupling to a single LLM provider early in development**. This should be an architectural decision from day one, not retrofitted later.

---

## Critical Pitfalls

Mistakes that cause rewrites, security vulnerabilities, or major user experience failures.

### CRIT-01: Prompt Injection Vulnerabilities

**Severity:** CRITICAL
**Phase:** LLM Integration (early)
**Confidence:** HIGH (OWASP Top 10 for LLM Applications 2025)

**What goes wrong:** User-provided CV content (job descriptions, skills, summaries) is passed directly to LLM prompts without sanitization. Malicious content in the CV data can manipulate LLM behavior, causing it to ignore system instructions, leak prompt templates, or generate inappropriate content.

**Why it happens:** Developers treat CV data as trusted input because it's "the user's own content." However, the CV might contain content copied from job postings, which could include hidden instructions designed to manipulate AI systems.

**Consequences:**
- LLM generates unintended content
- System prompts leaked to users
- Potential for inappropriate or off-brand generated text
- Reputational damage if generated CVs contain manipulated content

**Prevention:**
1. Treat ALL user content as untrusted input
2. Use structured output formats (JSON mode) to constrain responses
3. Validate LLM output before presenting to user
4. Implement output filtering for obviously wrong content
5. Use role separation in prompts (system vs user content clearly delineated)

**Detection (warning signs):**
- LLM responses that don't follow expected format
- Generated content that echoes parts of the system prompt
- Unexpectedly long or short responses

**Sources:**
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Lakera - Indirect Prompt Injection](https://www.lakera.ai/blog/indirect-prompt-injection)

---

### CRIT-02: Hardcoded API Keys in Source Code

**Severity:** CRITICAL
**Phase:** Initial LLM integration
**Confidence:** HIGH (industry consensus)

**What goes wrong:** API keys are hardcoded in source files, configuration templates, or accidentally committed to version control. Even temporary hardcoding during development leads to keys in git history.

**Why it happens:**
- "Just for testing" becomes permanent
- Copy-paste from documentation examples
- Configuration templates include real keys as examples

**Consequences:**
- Keys exposed in public repositories
- Unauthorized usage and unexpected bills
- Account termination by provider
- Security breach notification requirements

**Prevention:**
1. NEVER put real keys in source files, even temporarily
2. Use environment variables from day one (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
3. Add API key patterns to `.gitignore` and pre-commit hooks
4. Use placeholder values in examples (`sk-your-key-here`)
5. Implement key validation at startup with clear error messages

**Detection:**
- Pre-commit hooks scanning for key patterns
- Repository scanning tools (GitHub secret scanning)
- Keys appearing in error logs

**Sources:**
- [GitHub LLMs API Usage Best Practices](https://github.com/Praveen76/LLMs-API-Usage-Best-Practices)

---

### CRIT-03: Single Provider Lock-in Without Abstraction

**Severity:** CRITICAL
**Phase:** Architecture (must be addressed first)
**Confidence:** HIGH (industry consensus)

**What goes wrong:** Code is written directly against OpenAI's SDK. When needing to add Anthropic or handle OpenAI outages, massive refactoring is required. Provider-specific concepts (like OpenAI's function calling vs Claude's tool use) leak throughout the codebase.

**Why it happens:**
- "We only need OpenAI for now"
- SDK convenience encourages direct usage
- Provider-specific features seem simpler than abstractions

**Consequences:**
- Complete rewrite to add second provider
- No fallback during provider outages
- Vendor lock-in limits negotiating power
- Cannot leverage cheaper/faster models from other providers

**Prevention:**
1. Design provider abstraction interface BEFORE first provider integration
2. Define minimal interface: `generateText(prompt, options) => Result`
3. Standardize on common denominator features initially
4. Implement provider adapter pattern from the start
5. Consider existing abstractions (LiteLLM, Vercel AI SDK) vs custom

**Example interface:**
```typescript
interface LLMProvider {
  generateText(prompt: string, options: GenerateOptions): Promise<GenerateResult>;
  isAvailable(): Promise<boolean>;
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

interface GenerateResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  provider: string;
}
```

**Detection:**
- Imports from provider SDKs scattered throughout codebase
- Provider-specific error types in business logic
- Configuration tightly coupled to one provider's format

**Sources:**
- [Statsig - Provider Fallbacks](https://www.statsig.com/perspectives/providerfallbacksllmavailability)
- [TrueFoundry - LiteLLM Alternatives](https://www.truefoundry.com/blog/litellm-alternatives)

---

### CRIT-04: Ignoring Non-Interactive Environments

**Severity:** CRITICAL
**Phase:** CLI Wizard implementation
**Confidence:** HIGH (Inquirer.js official documentation)

**What goes wrong:** Interactive prompts crash or hang when run in CI/CD pipelines, Docker containers, or piped input scenarios. `process.stdin.isTTY` is false, and prompt libraries throw errors or wait forever for input that never comes.

**Why it happens:**
- Development always happens in interactive terminals
- CI/CD pipeline failures only discovered late
- Docker container behavior differs from local testing

**Consequences:**
- Broken CI/CD pipelines
- Docker-based workflows fail silently
- Automation scripts can't use the CLI

**Prevention:**
1. Check `process.stdin.isTTY` before prompting
2. Require all interactive inputs be passable as CLI arguments
3. Implement `--non-interactive` or `--yes` flag for CI use
4. Return clear error when prompts needed in non-interactive mode
5. Test in non-interactive environments early (add to CI)

**Implementation pattern:**
```typescript
async function getRequiredInput(argValue: string | undefined, promptFn: () => Promise<string>): Promise<string> {
  if (argValue) return argValue;

  if (!process.stdin.isTTY) {
    throw new Error('Interactive mode not available. Provide --name argument.');
  }

  return promptFn();
}
```

**Detection:**
- CI pipeline hangs without output
- `isTtyError` exceptions in logs
- Container processes that never complete

**Sources:**
- [Inquirer.js README](https://github.com/SBoudrias/Inquirer.js)
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)

---

### CRIT-05: PII/Sensitive Data Sent to LLM APIs

**Severity:** CRITICAL
**Phase:** LLM Integration
**Confidence:** HIGH (privacy regulations, OWASP)

**What goes wrong:** CV data containing phone numbers, addresses, social security numbers, or other PII is sent to external LLM APIs. This data may be logged, used for training, or stored by the provider.

**Why it happens:**
- CV data inherently contains personal information
- "It's the user's own data" rationalization
- Not reading provider data handling policies

**Consequences:**
- GDPR/privacy regulation violations
- User data used for model training (some providers)
- Data breach if provider is compromised
- Legal liability

**Prevention:**
1. Document exactly what data goes to LLM APIs
2. Offer "prompt export" mode for sensitive users (generate prompt locally, user pastes to ChatGPT)
3. Strip unnecessary PII before sending (generate summary without contact details)
4. Use providers with explicit data handling guarantees (OpenAI API data not used for training)
5. Display clear warning about data being sent externally
6. Consider local model option for privacy-conscious users

**Detection:**
- Audit logs showing full CV data in API requests
- User complaints about privacy
- Compliance audit findings

**Sources:**
- [Protecto - LLM Data Privacy 2025](https://www.protecto.ai/blog/how-to-preserve-data-privacy-in-llms/)
- [Lasso Security - LLM Data Privacy](https://www.lasso.security/blog/llm-data-privacy)

---

## High-Severity Pitfalls

Mistakes that cause significant user experience issues, unexpected costs, or technical debt.

### HIGH-01: No Rate Limit Handling

**Severity:** HIGH
**Phase:** LLM Integration
**Confidence:** HIGH (OpenAI official documentation)

**What goes wrong:** Burst usage (user generating multiple CV sections) hits rate limits. Without proper handling, users see cryptic errors or the application crashes.

**Why it happens:**
- Rate limits not hit during development (low volume)
- Error handling treats 429 as fatal error
- Not implementing exponential backoff

**Consequences:**
- Poor user experience during high usage
- Lost work if errors not handled gracefully
- Users retry manually, making rate limiting worse

**Prevention:**
1. Use SDK built-in retry logic (OpenAI SDK retries 429 automatically)
2. Implement exponential backoff for custom retry logic
3. Show user-friendly "please wait" messages
4. Queue requests rather than firing simultaneously
5. Cache responses for identical prompts

**Implementation:**
```typescript
// OpenAI SDK has built-in retry
const client = new OpenAI({
  maxRetries: 3,  // default is 2
  timeout: 30_000,
});
```

**Detection:**
- 429 errors in logs
- User reports of failures during multi-section generation
- Sudden increase in error rates

**Sources:**
- [OpenAI Error Codes](https://platform.openai.com/docs/guides/error-codes)
- [Portkey - Rate Limiting for LLM Apps](https://portkey.ai/blog/tackling-rate-limiting-for-llm-apps/)

---

### HIGH-02: Unbounded Cost Exposure

**Severity:** HIGH
**Phase:** LLM Integration
**Confidence:** HIGH (industry experience)

**What goes wrong:** No limits on token usage. A bug, malicious user, or unexpected use case causes massive API bills. Output tokens cost 3-6x more than input tokens.

**Why it happens:**
- No max_tokens limit set
- LLM asked to "generate complete CV" without section limits
- Retry loops without circuit breakers

**Consequences:**
- Unexpected bills ($100s to $1000s)
- Service shutdown to stop bleeding
- User trust damage if passing costs through

**Prevention:**
1. ALWAYS set `max_tokens` in API calls
2. Implement per-user and global daily limits
3. Set up billing alerts with provider
4. Monitor usage in real-time
5. Calculate expected cost per operation, alert on anomalies
6. Use cheaper models (GPT-4o-mini, Claude Haiku) for simple tasks

**Cost awareness:**
```typescript
const COST_PER_1K_INPUT = 0.0025;   // GPT-4o-mini
const COST_PER_1K_OUTPUT = 0.01;    // GPT-4o-mini (4x input!)

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000 * COST_PER_1K_INPUT) +
         (outputTokens / 1000 * COST_PER_1K_OUTPUT);
}
```

**Detection:**
- Billing alerts from provider
- Unusual spikes in token usage logs
- Long response times (more tokens = longer)

**Sources:**
- [Binadox - LLM API Pricing 2025](https://www.binadox.com/blog/llm-api-pricing-comparison-2025-complete-cost-analysis-guide/)
- [Medium - LLM Cost Analysis Q2 2025](https://ashah007.medium.com/navigating-the-llm-cost-maze-a-q2-2025-pricing-and-limits-analysis-80e9c832ef39)

---

### HIGH-03: Unhandled SIGINT in Wizard Flows

**Severity:** HIGH
**Phase:** CLI Wizard
**Confidence:** HIGH (Inquirer.js official documentation)

**What goes wrong:** User presses Ctrl+C during multi-step wizard. Instead of graceful exit, they see stack traces, partial files are left, or worse - data corruption.

**Why it happens:**
- Inquirer.js throws on Ctrl+C (by design for cleanup opportunity)
- Async/await without try/catch propagates as unhandled rejection
- No cleanup logic for interrupted operations

**Consequences:**
- Poor user experience (stack traces in terminal)
- Partial/corrupted files
- User loses progress without clear message

**Prevention:**
1. Wrap all prompt calls in try/catch
2. Detect ExitPromptError or check error properties
3. Perform cleanup (delete partial files, restore state)
4. Exit with code 130 (standard for SIGINT)
5. Show friendly "Cancelled" message

**Implementation:**
```typescript
import { ExitPromptError } from '@inquirer/prompts';

try {
  const answer = await input({ message: 'Your name:' });
} catch (error) {
  if (error instanceof ExitPromptError) {
    console.log('\nCancelled');
    process.exit(130);
  }
  throw error;
}
```

**Detection:**
- Stack traces when pressing Ctrl+C
- Exit codes other than 130 on cancellation
- Leftover temp files after interruption

**Sources:**
- [Inquirer.js Documentation](https://github.com/SBoudrias/Inquirer.js)
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)

---

### HIGH-04: LLM Response Format Assumptions

**Severity:** HIGH
**Phase:** LLM Integration
**Confidence:** HIGH (industry experience)

**What goes wrong:** Code assumes LLM will return valid JSON, bullet points, or specific format. LLM returns malformed response, and parsing fails without graceful handling.

**Why it happens:**
- LLMs are probabilistic - same prompt, different outputs
- Works in testing, fails in production edge cases
- No validation of LLM output structure

**Consequences:**
- Application crashes on malformed output
- Partial content shown to users
- Infinite retry loops

**Prevention:**
1. Use structured output modes when available (JSON mode)
2. Validate all LLM output before using
3. Implement fallback for unparseable responses
4. Use Zod or similar for runtime validation
5. Log malformed responses for prompt improvement

**Implementation:**
```typescript
import { z } from 'zod';

const CVSummarySchema = z.object({
  summary: z.string().min(50).max(500),
  highlights: z.array(z.string()).min(1).max(5),
});

function parseLLMResponse(text: string): CVSummary | null {
  try {
    const parsed = JSON.parse(text);
    return CVSummarySchema.parse(parsed);
  } catch {
    console.error('Failed to parse LLM response');
    return null;
  }
}
```

**Detection:**
- JSON parse errors in logs
- Unexpected undefined values from LLM processing
- User reports of missing or malformed content

**Sources:**
- [Stack Overflow - Reliability for Unreliable LLMs](https://stackoverflow.blog/2025/06/30/reliability-for-unreliable-llms/)

---

### HIGH-05: Wizard State Not Persisted

**Severity:** HIGH
**Phase:** CLI Wizard
**Confidence:** MEDIUM (Node.js CLI best practices)

**What goes wrong:** Multi-step wizard collects data, but if user exits partway through (intentionally or due to crash), all progress is lost. For long CV creation wizards, this is extremely frustrating.

**Why it happens:**
- State kept only in memory during wizard
- No incremental save logic
- Assuming users complete in one session

**Consequences:**
- Lost user work
- User frustration and abandonment
- Poor perception of tool reliability

**Prevention:**
1. Save state after each wizard step to temp file
2. Detect and offer to resume incomplete sessions
3. Use XDG-compliant paths for state files
4. Clear state files on successful completion or explicit cancel
5. Implement `--resume` flag for explicit continuation

**Implementation pattern:**
```typescript
const STATE_FILE = path.join(xdgState(), 'cvgen', 'wizard-state.json');

async function saveWizardState(state: WizardState): Promise<void> {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loadWizardState(): Promise<WizardState | null> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
```

**Detection:**
- User complaints about lost work
- Support requests to recover data
- Users avoiding wizard for manual editing

**Sources:**
- [Node.js CLI Best Practices - Stateful Experience](https://github.com/lirantal/nodejs-cli-apps-best-practices)

---

### HIGH-06: CSS Print Media Compatibility Issues

**Severity:** HIGH
**Phase:** Template Generation
**Confidence:** HIGH (print-css.rocks, Puppeteer documentation)

**What goes wrong:** Templates use modern CSS (flexbox, grid, CSS variables) that render beautifully in browsers but break in PDF generation. Puppeteer/Playwright PDF output differs from browser preview.

**Why it happens:**
- Developing against browser preview, not PDF output
- Assuming print CSS works like screen CSS
- Not understanding CSS Paged Media limitations

**Consequences:**
- Templates that look broken in PDF
- Page breaks in wrong places
- Elements cut off or overlapping

**Prevention:**
1. Test PDF output early and often, not just HTML preview
2. Use print-specific CSS (`@media print`)
3. Implement explicit page break control
4. Avoid complex layouts that don't translate to print
5. Test with actual Puppeteer PDF output, not browser print preview

**Critical CSS rules for PDF:**
```css
@media print {
  /* Control page breaks */
  .section { page-break-inside: avoid; }
  h2 { page-break-after: avoid; }

  /* Reset margins for print */
  @page { margin: 0; }

  /* Hide interactive elements */
  .no-print { display: none; }
}
```

**Detection:**
- PDF output differs from HTML preview
- Page breaks in wrong places
- User reports of "broken" PDFs

**Sources:**
- [print-css.rocks](https://print-css.rocks/)
- [RisingStack - Puppeteer HTML to PDF](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or minor user experience issues.

### MOD-01: Fallback Provider Without Testing

**Severity:** MODERATE
**Phase:** Multi-provider support
**Confidence:** MEDIUM (industry experience)

**What goes wrong:** Fallback to secondary provider is implemented but never tested. When primary fails, fallback fails too (wrong API format, expired key, different response structure).

**Why it happens:**
- Primary provider rarely fails
- "We'll test it when we need it"
- Different providers require different prompt styles

**Consequences:**
- False sense of reliability
- Both providers fail simultaneously
- User experience worse than single provider (error, then different error)

**Prevention:**
1. Regularly test fallback path (scheduled tests)
2. Implement health checks for all providers
3. Use feature flags to force fallback for testing
4. Monitor fallback usage in production
5. Accept that prompts may need per-provider tuning

**Detection:**
- Fallback never triggered in logs
- Fallback failures when finally triggered
- Different response quality from fallback

**Sources:**
- [Portkey - Fallback System Design](https://portkey.ai/blog/how-to-design-a-reliable-fallback-system-for-llm-apps-using-an-ai-gateway/)

---

### MOD-02: Overly Complex Template Inheritance

**Severity:** MODERATE
**Phase:** Template Generation
**Confidence:** MEDIUM (maintainability principles)

**What goes wrong:** Template system uses deep inheritance (base -> theme -> variant -> customization). Changes to base break children in unexpected ways. Template debugging becomes extremely difficult.

**Why it happens:**
- DRY principle taken too far
- "Future-proofing" for customization
- Not considering maintenance cost

**Consequences:**
- Difficult to understand template rendering
- Changes have unexpected cascade effects
- New template creation is complex

**Prevention:**
1. Prefer composition over inheritance
2. Maximum 2 levels of template inheritance
3. Document template dependencies clearly
4. Use mixins/partials for shared components
5. Each template should be readable standalone

**Detection:**
- Template changes break unrelated templates
- Developers avoid touching templates
- Long debugging sessions for styling issues

---

### MOD-03: Synchronous Readline in Async Codebase

**Severity:** MODERATE
**Phase:** CLI Wizard
**Confidence:** HIGH (existing codebase analysis)

**What goes wrong:** Mixing sync and async readline patterns. Creating new readline interface for each prompt without proper cleanup. Event handlers not properly removed.

**Why it happens:**
- Node.js readline API is confusing
- Quick fixes add another interface
- Not using modern `readline/promises`

**Consequences:**
- Process hangs after prompts
- Multiple listeners on stdin
- Inconsistent prompt behavior

**Prevention:**
1. Use `readline/promises` consistently (as already done in existing code)
2. Single readline interface for wizard session
3. Always close interface in finally block
4. Consider Inquirer.js for complex wizards
5. Test that process exits cleanly after prompts

**Detection:**
- Process hangs after all prompts answered
- Multiple "input" listeners warning
- Inconsistent stdin behavior

---

### MOD-04: Not Respecting Terminal Capabilities

**Severity:** MODERATE
**Phase:** CLI Wizard
**Confidence:** MEDIUM (CLI best practices)

**What goes wrong:** Rich terminal features (colors, spinners, cursor movement) assumed available. Fails or looks wrong in limited terminals, CI logs, or when piped.

**Why it happens:**
- Development in feature-rich terminals
- Not testing in plain environments
- Libraries that don't gracefully degrade

**Consequences:**
- Gibberish output in CI logs
- Broken output when piped to file
- Accessibility issues

**Prevention:**
1. Detect terminal capabilities (`process.stdout.isTTY`, `TERM`)
2. Provide `--no-color` and `--plain` flags
3. Support `NO_COLOR` environment variable standard
4. Test output when piped (`cvgen wizard | cat`)
5. Use libraries that auto-detect (picocolors, ora)

**Detection:**
- CI logs with ANSI escape codes
- User complaints about garbled output
- Piped output unreadable

---

### MOD-05: Prompt Template Duplication

**Severity:** MODERATE
**Phase:** LLM Integration
**Confidence:** MEDIUM (maintainability)

**What goes wrong:** Similar prompts for different sections (summary, experience, skills) are copy-pasted with slight modifications. Changes to tone or formatting require updating multiple places.

**Why it happens:**
- Each section seems unique enough
- No prompt templating system
- "Just one more similar prompt"

**Consequences:**
- Inconsistent tone across sections
- Difficult to update prompt style globally
- Testing burden multiplies

**Prevention:**
1. Create prompt template system with variables
2. Define shared components (tone, format instructions, constraints)
3. Compose section-specific prompts from shared base
4. Version prompts like code (changes reviewed)
5. Test prompts systematically

**Structure:**
```typescript
const SHARED_INSTRUCTIONS = `
You are a professional CV writer.
Write in third person.
Be concise and impactful.
`;

const generateSummaryPrompt = (cv: CV) => `
${SHARED_INSTRUCTIONS}
Generate a professional summary for:
${formatCVContext(cv)}
`;
```

**Detection:**
- Prompts with duplicated paragraphs
- Inconsistent tone in generated sections
- Prompt updates missed in some places

---

### MOD-06: LLM Timeout Without Feedback

**Severity:** MODERATE
**Phase:** LLM Integration
**Confidence:** HIGH (UX principles)

**What goes wrong:** LLM requests take 10-30 seconds. User stares at blank terminal, unsure if anything is happening. They press Ctrl+C, losing the in-progress generation.

**Why it happens:**
- No progress indicator during API call
- Default timeout too long or not set
- Streaming not implemented

**Consequences:**
- User thinks tool is frozen
- Unnecessary cancellations
- Poor perceived performance

**Prevention:**
1. Show spinner/progress indicator during LLM calls
2. Implement streaming for real-time output
3. Set reasonable timeout (30-60 seconds)
4. Show elapsed time during long operations
5. Provide clear feedback on completion

**Detection:**
- User reports of "hanging" or "frozen" CLI
- High cancellation rate during generation
- Support requests about tool responsiveness

---

### MOD-07: Integration with Existing CLI Architecture

**Severity:** MODERATE
**Phase:** CLI Wizard / LLM Integration
**Confidence:** HIGH (existing codebase analysis)

**What goes wrong:** New wizard/LLM commands don't follow existing patterns. Inconsistent option naming (`--quiet` vs `--silent`), different output formats, conflicting error handling.

**Why it happens:**
- New features developed in isolation
- Not reviewing existing command patterns
- Different developers with different styles

**Consequences:**
- Inconsistent user experience
- Documentation confusion
- Maintenance burden

**Prevention:**
1. Review existing commands before adding new ones
2. Follow established patterns (see existing `init` command)
3. Use shared utilities (`createConsole`, existing prompts)
4. Consistent option naming across all commands
5. Shared error handling approach

**Detection:**
- Inconsistent `--help` output formatting
- Different behavior for common flags
- Code review feedback on pattern divergence

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

### MIN-01: Poor Error Messages for API Failures

**Severity:** MINOR
**Phase:** LLM Integration
**Confidence:** HIGH (UX principles)

**What goes wrong:** API errors shown directly to users ("Error: 429 Too Many Requests"). Users don't understand what went wrong or what to do.

**Prevention:**
- Map technical errors to user-friendly messages
- Include actionable next steps in error messages
- Log technical details, show user-friendly version

---

### MIN-02: Template CSS Not Scoped

**Severity:** MINOR
**Phase:** Template Generation
**Confidence:** MEDIUM (CSS best practices)

**What goes wrong:** Template CSS uses generic selectors (`.header`, `.title`). When embedding generated HTML or when user adds custom CSS, styles conflict.

**Prevention:**
- Use template-specific prefixes (`.cv-base-header`)
- Or use scoped CSS techniques
- Document CSS conventions for custom templates

---

### MIN-03: Wizard Doesn't Show Progress

**Severity:** MINOR
**Phase:** CLI Wizard
**Confidence:** MEDIUM (UX best practices)

**What goes wrong:** Long wizard with many steps. User doesn't know how much is left, leading to abandonment or frustration.

**Prevention:**
- Show step progress (`Step 3 of 7`)
- Allow skipping optional sections
- Show estimated time remaining for LLM operations

---

### MIN-04: Cache Not Invalidated on Prompt Changes

**Severity:** MINOR
**Phase:** LLM Integration
**Confidence:** MEDIUM (caching principles)

**What goes wrong:** Responses are cached by input hash. Prompt template is updated, but cache still returns old responses because user input (hash key) unchanged.

**Prevention:**
- Include prompt version in cache key
- Implement cache invalidation on prompt changes
- Set reasonable TTL on cache entries

---

### MIN-05: No Dry-Run Mode for LLM Operations

**Severity:** MINOR
**Phase:** LLM Integration
**Confidence:** MEDIUM (CLI best practices)

**What goes wrong:** Users want to see what would be generated without incurring API costs. No way to preview prompt without sending to API.

**Prevention:**
- Implement `--dry-run` flag that shows prompt without API call
- Pair with prompt export feature
- Useful for debugging and cost control

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|----------------|------------|----------|
| Provider Abstraction | CRIT-03: Single provider lock-in | Design interface before first integration | P0 |
| LLM Integration | CRIT-01: Prompt injection | Input sanitization, output validation | P0 |
| LLM Integration | CRIT-05: PII sent to APIs | Prompt export fallback, data minimization | P0 |
| LLM Integration | CRIT-02: Hardcoded API keys | Environment variables from day 1 | P0 |
| CLI Wizard | CRIT-04: Non-interactive crashes | TTY detection, CLI fallback args | P0 |
| CLI Wizard | HIGH-03: SIGINT handling | ExitPromptError catch, cleanup | P1 |
| CLI Wizard | HIGH-05: State not persisted | Incremental save, resume support | P1 |
| CLI Wizard | MOD-07: Integration patterns | Review existing commands, follow patterns | P1 |
| Multi-Provider | MOD-01: Untested fallback | Scheduled fallback testing | P2 |
| Template Gen | HIGH-06: CSS print issues | Test PDF output, not just HTML | P1 |
| Cost Control | HIGH-02: Unbounded costs | max_tokens, usage limits, alerts | P1 |

---

## Prevention Checklist

Use this checklist before implementing each feature area.

### Before Starting LLM Integration
- [ ] Provider abstraction interface designed
- [ ] Environment variable handling for API keys (never hardcode)
- [ ] Error mapping for user-friendly messages
- [ ] Rate limit handling strategy defined
- [ ] Cost limits and monitoring planned (max_tokens always set)
- [ ] Prompt injection mitigations documented
- [ ] Data privacy approach decided (what data sent where)
- [ ] Prompt export fallback for privacy-conscious users

### Before Starting CLI Wizard
- [ ] Non-interactive fallback (all inputs as CLI args)
- [ ] TTY detection implemented
- [ ] SIGINT handling with cleanup (ExitPromptError)
- [ ] State persistence location decided (XDG-compliant)
- [ ] Progress indication planned (step X of Y)
- [ ] Resume functionality designed
- [ ] Review existing command patterns in codebase

### Before Starting Template Generation
- [ ] Print CSS testing workflow established
- [ ] Template inheritance depth limited (max 2 levels)
- [ ] CSS scoping convention decided
- [ ] PDF output testing automated (not just HTML preview)

### Before Adding Multi-Provider Support
- [ ] Abstraction layer tested with primary provider
- [ ] Fallback testing approach defined (scheduled tests)
- [ ] Per-provider prompt variations documented
- [ ] Health check strategy implemented
- [ ] Response format normalization planned

---

## Ranked Pitfall List (by Impact x Likelihood)

| Rank | Pitfall | Impact | Likelihood | Score |
|------|---------|--------|------------|-------|
| 1 | CRIT-03: Single Provider Lock-in | 10 | 9 | 90 |
| 2 | CRIT-04: Non-Interactive Env Crash | 9 | 9 | 81 |
| 3 | CRIT-02: Hardcoded API Keys | 10 | 8 | 80 |
| 4 | HIGH-04: Response Format Assumptions | 8 | 9 | 72 |
| 5 | HIGH-02: Unbounded Costs | 9 | 7 | 63 |
| 6 | HIGH-03: SIGINT Not Handled | 7 | 9 | 63 |
| 7 | CRIT-01: Prompt Injection | 10 | 6 | 60 |
| 8 | HIGH-06: CSS Print Issues | 7 | 8 | 56 |
| 9 | HIGH-01: No Rate Limit Handling | 6 | 9 | 54 |
| 10 | CRIT-05: PII Sent to APIs | 10 | 5 | 50 |
| 11 | MOD-07: Integration Patterns | 5 | 9 | 45 |
| 12 | HIGH-05: Wizard State Not Persisted | 6 | 7 | 42 |
| 13 | MOD-01: Untested Fallback | 7 | 6 | 42 |
| 14 | MOD-06: LLM Timeout No Feedback | 5 | 8 | 40 |
| 15 | MOD-02: Complex Template Inheritance | 5 | 6 | 30 |
| 16 | MOD-03: Readline Issues | 5 | 5 | 25 |
| 17 | MOD-04: Terminal Capability Issues | 4 | 6 | 24 |
| 18 | MOD-05: Prompt Duplication | 4 | 6 | 24 |

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|------------|-----------|
| LLM Security (Prompt Injection) | HIGH | OWASP Top 10 2025, multiple authoritative sources |
| LLM API Error Handling | HIGH | OpenAI official documentation, SDK source |
| LLM Cost Management | HIGH | Provider documentation, pricing analysis articles |
| CLI Wizard Issues | HIGH | Inquirer.js official docs, Node.js CLI best practices repo, existing codebase analysis |
| Multi-Provider Patterns | MEDIUM | Industry articles, less formal documentation |
| Template/CSS Issues | HIGH | Existing v1.1 research verified, print CSS documentation |
| Data Privacy | HIGH | GDPR/OWASP guidance, privacy research papers |
| Integration with Existing System | HIGH | Direct analysis of existing codebase patterns |

---

## Sources

### LLM Integration
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [OpenAI Error Codes Documentation](https://platform.openai.com/docs/guides/error-codes)
- [GitHub - OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Stack Overflow - Reliability for Unreliable LLMs](https://stackoverflow.blog/2025/06/30/reliability-for-unreliable-llms/)
- [Binadox - LLM API Pricing 2025](https://www.binadox.com/blog/llm-api-pricing-comparison-2025-complete-cost-analysis-guide/)
- [Portkey - Rate Limiting for LLM Apps](https://portkey.ai/blog/tackling-rate-limiting-for-llm-apps/)
- [Lakera - Indirect Prompt Injection](https://www.lakera.ai/blog/indirect-prompt-injection)
- [Protecto - LLM Data Privacy 2025](https://www.protecto.ai/blog/how-to-preserve-data-privacy-in-llms/)
- [GitHub - LLMs API Usage Best Practices](https://github.com/Praveen76/LLMs-API-Usage-Best-Practices)

### CLI Wizard
- [Inquirer.js GitHub Repository](https://github.com/SBoudrias/Inquirer.js)
- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)
- [DigitalOcean - Interactive CLI Prompts with Inquirer.js](https://www.digitalocean.com/community/tutorials/nodejs-interactive-command-line-prompts)
- [node-interactive-commander](https://github.com/fardjad/node-interactive-commander)

### Multi-Provider Support
- [Statsig - Provider Fallbacks](https://www.statsig.com/perspectives/providerfallbacksllmavailability)
- [Portkey - Fallback System Design](https://portkey.ai/blog/how-to-design-a-reliable-fallback-system-for-llm-apps-using-an-ai-gateway/)
- [TrueFoundry - LiteLLM Alternatives](https://www.truefoundry.com/blog/litellm-alternatives)
- [Portkey - Retries, Fallbacks, and Circuit Breakers](https://portkey.ai/blog/retries-fallbacks-and-circuit-breakers-in-llm-apps/)

### Template/CSS Generation
- [print-css.rocks - CSS Paged Media Tutorial](https://print-css.rocks/)
- [RisingStack - Puppeteer HTML to PDF](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)
- [Joyfill - Creating PDFs from HTML + CSS in JavaScript](https://joyfill.io/blog/creating-pdfs-from-html-css-in-javascript-what-actually-works)
