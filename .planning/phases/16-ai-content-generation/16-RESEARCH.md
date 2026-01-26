# Phase 16: AI Content Generation - Research

**Researched:** 2026-01-26
**Domain:** CV/Resume AI Content Generation with Vercel AI SDK
**Confidence:** HIGH

## Summary

Phase 16 implements standalone AI content generation commands that build upon the Phase 15 multi-stage workflow infrastructure. The research confirms that the existing architecture (Vercel AI SDK 6, Zod schemas, Nunjucks templates) is well-suited for implementing the new commands (`bullets`, `summary`, `keywords`, `improve`, `tailor`). The key insight is that these commands are **standalone generators** that produce cv.md-formatted output, distinct from the workflow stages that save state.

The primary challenges are: (1) implementing robust ATS keyword matching with fuzzy/exact modes, (2) generating STAR-formatted bullets with optional breakdown display, (3) handling job descriptions from multiple sources (file, URL, stdin), and (4) displaying side-by-side comparisons for content improvements. The existing Fuse.js library (already installed) provides fuzzy matching, while the `diff` npm package offers text comparison capabilities.

**Primary recommendation:** Implement each command as a standalone generator that outputs cv.md format to stdout by default, with `--output` flag for file writing. Use existing Zod schemas for structured LLM output, extend with new schemas for bullets and keywords. Implement retry logic with exponential backoff for API errors.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | 6.x (existing) | Vercel AI SDK for structured LLM output | Already installed, Output.object() with Zod |
| `zod` | 4.x (existing) | Schema validation for LLM outputs | Already installed, 14x faster in v4 |
| `nunjucks` | 3.x (existing) | Prompt templates | Already installed, proven in Phase 14-15 |
| `fuse.js` | 7.x (existing) | Fuzzy keyword matching | Already installed, threshold-based matching |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `diff` | 8.x | Text comparison for improvements | Side-by-side and inline diff display |
| `unpdf` | 1.x (existing) | PDF text extraction | Job description from PDF files |
| `picocolors` | 1.x (existing) | Terminal coloring | Traffic light quality labels |
| `cli-table3` | 0.6.x (existing) | Table formatting | Keyword lists, comparisons |
| `ora` | 9.x (existing) | Loading spinners | LLM generation feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fuse.js for fuzzy | Levenshtein | Fuse.js already installed, has scoring |
| `diff` for comparison | `jsdiff` | Same package - `diff` is the npm name |
| URL fetch | Puppeteer | Puppeteer overkill for text extraction; use native fetch first, fallback to manual |

**Installation:**
```bash
npm install diff
# Other packages already installed from Phase 14-15
```

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── ai/
│   ├── workflow/                  # Existing from Phase 15
│   │   └── schemas/               # Extend with new schemas
│   │       ├── bullets-output.ts  # NEW: Bullet generation schema
│   │       └── keywords-output.ts # NEW: Keyword analysis schema
│   ├── generators/                # NEW: Standalone generators
│   │   ├── index.ts               # Exports all generators
│   │   ├── bullets.ts             # Generate achievement bullets
│   │   ├── summary.ts             # Generate professional summary
│   │   ├── keywords.ts            # ATS keyword analysis
│   │   └── improve.ts             # Content improvement suggestions
│   ├── display/                   # NEW: Output formatting
│   │   ├── diff-display.ts        # Side-by-side / inline diff
│   │   ├── cv-format.ts           # cv.md output formatting
│   │   └── quality-labels.ts      # Traffic light indicators
│   └── utils/                     # NEW: Shared utilities
│       ├── retry.ts               # API retry with backoff
│       ├── job-description.ts     # Load from file/URL/stdin
│       └── keyword-matcher.ts     # Fuzzy/exact keyword matching
└── commands/
    └── ai/
        ├── bullets.ts             # NEW: cvgen ai bullets
        ├── summary.ts             # EXTEND existing summarize
        ├── keywords.ts            # NEW: cvgen ai keywords
        └── tailor.ts              # EXTEND existing tailor
```

### Pattern 1: Standalone Generator (Non-Workflow)
**What:** Generate content directly without workflow state dependency
**When to use:** `cvgen ai bullets`, `cvgen ai summary`, `cvgen ai keywords`
**Example:**
```typescript
// Source: Phase 16 requirements - standalone commands
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Standalone generator - no workflow state required
export async function generateBullets(
  cv: CVData,
  locale: string,
  provider: AIProvider,
  options: BulletsOptions
): Promise<BulletsOutput> {
  const prompt = renderPrompt('bullets', {
    cv,
    locale,
    bulletCount: options.bulletCount,
    showStar: options.showStar,
    tailored: options.tailored,
    jobDescription: options.jobDescription,
  });

  const { output } = await generateText({
    model: provider.model,
    prompt,
    output: Output.object({ schema: BulletsOutputSchema }),
  });

  return output;
}

// Command outputs cv.md format to stdout
export async function bulletsAction(name: string, options: Options): Promise<void> {
  const result = await generateBullets(cv, locale, provider, options);

  if (options.output) {
    await writeFile(options.output, formatAsCvMd(result));
  } else {
    console.log(formatAsCvMd(result));
  }
}
```

### Pattern 2: STAR Method Bullet Schema
**What:** Structured output for STAR-formatted achievement bullets
**When to use:** Bullet generation with optional STAR breakdown
**Example:**
```typescript
// Source: STAR method best practices from search results
// "S: Situation, T: Task, A: Action, R: Result"
const STARBreakdownSchema = z.object({
  situation: z.string().describe('Context or challenge faced'),
  task: z.string().describe('Your specific responsibility'),
  action: z.string().describe('Actions you took'),
  result: z.string().describe('Measurable outcome achieved'),
});

const BulletSchema = z.object({
  text: z.string().describe('The complete bullet point (40 words max)'),
  starBreakdown: STARBreakdownSchema.optional()
    .describe('STAR breakdown, included if --show-star flag used'),
  metrics: z.array(z.string()).optional()
    .describe('Quantifiable metrics in the bullet'),
  keywords: z.array(z.string()).optional()
    .describe('ATS-relevant keywords used'),
  quality: z.enum(['strong', 'good', 'needs_review'])
    .describe('Quality assessment: strong=green, good=yellow, needs_review=red'),
});

const RoleBulletsSchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  bullets: z.array(BulletSchema),
  bulletCountReasoning: z.string()
    .describe('Why this number of bullets (tenure + seniority + scope)'),
});

export const BulletsOutputSchema = z.object({
  roles: z.array(RoleBulletsSchema),
  overallQuality: z.enum(['strong', 'good', 'needs_review']),
});
```

### Pattern 3: ATS Keyword Matching with Fuzzy/Exact Modes
**What:** Match job description keywords against CV with configurable matching
**When to use:** `cvgen ai keywords` command
**Example:**
```typescript
// Source: Fuse.js docs + CONTEXT.md fuzzy/exact decision
import Fuse from 'fuse.js';

interface KeywordMatch {
  keyword: string;
  found: boolean;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  matchedText?: string;
  section?: string;
  confidence: number;
}

export function matchKeywords(
  jobKeywords: string[],
  cvText: string,
  cvSections: CVSection[],
  options: { exact: boolean }
): KeywordMatch[] {
  if (options.exact) {
    // Exact matching - case-insensitive
    return jobKeywords.map(keyword => {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      const found = regex.test(cvText);
      return {
        keyword,
        found,
        matchType: 'exact' as const,
        matchedText: found ? keyword : undefined,
        section: findSection(cvSections, keyword),
        confidence: found ? 1.0 : 0,
      };
    });
  }

  // Fuzzy matching - uses Fuse.js
  const cvTokens = extractTokens(cvText);
  const fuse = new Fuse(cvTokens, {
    threshold: 0.3,        // Lower = stricter matching
    distance: 100,
    includeScore: true,
    ignoreLocation: true,  // Match anywhere in token
  });

  return jobKeywords.map(keyword => {
    const results = fuse.search(keyword);
    const bestMatch = results[0];

    return {
      keyword,
      found: bestMatch !== undefined && (bestMatch.score ?? 1) < 0.3,
      matchType: 'fuzzy' as const,
      matchedText: bestMatch?.item,
      section: bestMatch ? findSection(cvSections, bestMatch.item) : undefined,
      confidence: bestMatch ? 1 - (bestMatch.score ?? 1) : 0,
    };
  });
}

// Synonym matching (abbreviations, common variations)
const SKILL_SYNONYMS: Record<string, string[]> = {
  'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
  'typescript': ['ts'],
  'kubernetes': ['k8s'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'project management': ['pm', 'program coordination'],
  // ... extend as needed
};
```

### Pattern 4: Retry with Exponential Backoff
**What:** Auto-retry API errors with increasing delays
**When to use:** All LLM API calls
**Example:**
```typescript
// Source: CONTEXT.md - "Auto-retry for API errors: 2-3 attempts with backoff"
interface RetryOptions {
  maxAttempts?: number;  // Default: 3
  baseDelayMs?: number;  // Default: 1000
  maxDelayMs?: number;   // Default: 10000
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-transient errors
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt - 1),
          maxDelayMs
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('503') ||
    message.includes('429')
  );
}
```

### Pattern 5: Job Description Loading (Multi-Source)
**What:** Load job descriptions from files, URLs, or stdin
**When to use:** `cvgen ai tailor`, `cvgen ai keywords`
**Example:**
```typescript
// Source: CONTEXT.md - file, URL, stdin support
import { readFile } from 'node:fs/promises';

interface JobDescriptionSource {
  type: 'file' | 'url' | 'stdin';
  content: string;
  metadata?: {
    filename?: string;
    url?: string;
    fetchedAt?: string;
  };
}

export async function loadJobDescription(
  source: string | undefined,
  options: { followRedirects?: number }
): Promise<JobDescriptionSource> {
  // Stdin (piped input)
  if (!source || source === '-') {
    const content = await readStdin();
    if (content.length < 100) {
      console.warn('Warning: Job description seems short (<100 words).');
    }
    return { type: 'stdin', content };
  }

  // URL
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return await fetchJobFromUrl(source, options.followRedirects ?? 5);
  }

  // File (txt, md, pdf)
  const ext = path.extname(source).toLowerCase();

  if (ext === '.pdf') {
    const content = await extractPdfText(source);
    if (!content) {
      throw new Error(
        `Could not extract text from PDF: ${source}\n` +
        'Try converting to plain text or markdown.'
      );
    }
    return { type: 'file', content, metadata: { filename: source } };
  }

  // Plain text or markdown
  const content = await readFile(source, 'utf-8');
  return { type: 'file', content, metadata: { filename: source } };
}

async function fetchJobFromUrl(
  url: string,
  maxRedirects: number
): Promise<JobDescriptionSource> {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    const response = await fetch(currentUrl, {
      headers: { 'User-Agent': 'cvgen/1.0 (job description fetcher)' },
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch job posting from ${url}\n` +
        `Status: ${response.status}\n` +
        'Tip: Some sites block automated requests. ' +
        'Save the posting to a local file instead.'
      );
    }

    const html = await response.text();
    const content = extractTextFromHtml(html);

    return {
      type: 'url',
      content,
      metadata: { url: currentUrl, fetchedAt: new Date().toISOString() },
    };
  }

  throw new Error(`Too many redirects (max: ${maxRedirects})`);
}
```

### Pattern 6: Side-by-Side and Inline Diff Display
**What:** Show content comparisons based on terminal width
**When to use:** `cvgen ai improve` command
**Example:**
```typescript
// Source: CONTEXT.md - side-by-side >= 120, inline below
import { diffWords } from 'diff';
import pc from 'picocolors';

export function displayComparison(
  original: string,
  improved: string,
  terminalWidth: number
): string {
  if (terminalWidth >= 120) {
    return displaySideBySide(original, improved, terminalWidth);
  }
  return displayInlineDiff(original, improved);
}

function displaySideBySide(
  original: string,
  improved: string,
  width: number
): string {
  const colWidth = Math.floor((width - 3) / 2); // 3 for separator
  const originalLines = wrapText(original, colWidth);
  const improvedLines = wrapText(improved, colWidth);
  const maxLines = Math.max(originalLines.length, improvedLines.length);

  const lines: string[] = [];
  lines.push(pc.dim('─'.repeat(colWidth)) + ' │ ' + pc.dim('─'.repeat(colWidth)));
  lines.push(pc.bold(padRight('Original', colWidth)) + ' │ ' + pc.bold('Improved'));
  lines.push(pc.dim('─'.repeat(colWidth)) + ' │ ' + pc.dim('─'.repeat(colWidth)));

  for (let i = 0; i < maxLines; i++) {
    const left = originalLines[i] || '';
    const right = improvedLines[i] || '';
    lines.push(padRight(left, colWidth) + ' │ ' + right);
  }

  return lines.join('\n');
}

function displayInlineDiff(original: string, improved: string): string {
  const diff = diffWords(original, improved);

  return diff.map(part => {
    if (part.added) {
      return pc.green(pc.bold(part.value));
    }
    if (part.removed) {
      return pc.red(pc.strikethrough(part.value));
    }
    return part.value;
  }).join('');
}
```

### Anti-Patterns to Avoid
- **Hand-rolling keyword extraction:** Use the LLM to extract keywords from job descriptions; don't parse manually
- **Storing generated content in workflow state:** Standalone commands output directly; don't pollute state
- **Blocking on workflow completion:** These commands work independently of workflow stages
- **Ignoring terminal width:** Always check `process.stdout.columns` for display decisions
- **Using Puppeteer for all URLs:** Try native fetch first; Puppeteer only if blocked
- **Hard-coding bullet counts:** Let LLM decide based on role complexity (3-8 range)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyword extraction from job posting | Regex patterns | LLM structured output | Job postings vary wildly; LLM understands context |
| Fuzzy string matching | Levenshtein manual | Fuse.js | Already installed, scoring system built-in |
| Text diff display | String comparison | `diff` npm package | Battle-tested, handles edge cases |
| PDF text extraction | Manual parsing | `unpdf` | Already installed, handles various PDF types |
| Retry with backoff | setTimeout loops | Dedicated utility function | Reusable, handles edge cases |
| Quality scoring | Hardcoded rules | LLM assessment | LLM can evaluate nuance |
| cv.md formatting | String templates | Dedicated formatter | Ensures consistent output format |

**Key insight:** Let the LLM handle semantic tasks (keyword importance, quality assessment, STAR breakdown) while using libraries for mechanical tasks (fuzzy matching, text diffing, PDF extraction).

## Common Pitfalls

### Pitfall 1: Hallucinated Metrics
**What goes wrong:** LLM invents impressive-sounding metrics not in original CV
**Why it happens:** LLM optimizes for "impressive" content without grounding
**How to avoid:** Include explicit instruction in prompt: "Only use metrics from the provided CV. Do not invent or estimate numbers."
**Warning signs:** Percentages or dollar amounts that weren't in input

```typescript
// Prevention: Explicit grounding in prompt template
const BULLETS_PROMPT = `
CRITICAL: Only include metrics that are explicitly stated in the CV.
If no metric is available, write the bullet without one.
Do NOT invent, estimate, or "improve" numbers.

{{ cv_content }}
`;
```

### Pitfall 2: Over-Optimization for ATS
**What goes wrong:** Generated content sounds robotic, keyword-stuffed
**Why it happens:** Prioritizing keyword density over readability
**How to avoid:** Include quality assessment; reject results that score low on readability
**Warning signs:** Unnatural phrasing, repetitive keywords

```typescript
// Prevention: Include quality check in schema
const quality = z.enum(['strong', 'good', 'needs_review']);
// In prompt: "If content sounds unnatural or keyword-stuffed, mark as needs_review"
```

### Pitfall 3: Generic STAR Bullets
**What goes wrong:** STAR format produces template-like, non-specific bullets
**Why it happens:** Following STAR structure rigidly without personalization
**How to avoid:** Prompt should emphasize specificity; include original CV context
**Warning signs:** Bullets that could apply to any job

```typescript
// Prevention: Specificity requirement in prompt
const STAR_PROMPT = `
For each bullet:
- Situation: Name the specific project, team, or challenge
- Task: State YOUR role, not "the team"
- Action: List specific tools, methods, or approaches used
- Result: Use EXACT metrics from CV; if none, describe qualitative impact

BAD: "Improved team efficiency"
GOOD: "Reduced CI pipeline runtime from 45min to 12min by parallelizing test suites"
`;
```

### Pitfall 4: Keyword Case Sensitivity
**What goes wrong:** "JavaScript" doesn't match "javascript" or "Javascript"
**Why it happens:** Exact matching without normalization
**How to avoid:** Normalize to lowercase for matching; preserve original case in display
**Warning signs:** Keywords reported as missing when present in different case

```typescript
// Prevention: Case normalization in matcher
function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim();
}
```

### Pitfall 5: URL Fetch Blocked
**What goes wrong:** Job posting URLs return 403/blocked content
**Why it happens:** Sites detect automated requests
**How to avoid:** Fail gracefully with helpful message; suggest manual copy
**Warning signs:** Empty content, blocked messages

```typescript
// Prevention: Helpful error with instructions
if (!response.ok || content.includes('blocked') || content.includes('captcha')) {
  throw new Error(
    `Could not fetch job posting from ${url}\n` +
    'The site may be blocking automated requests.\n\n' +
    'To proceed:\n' +
    '1. Open the URL in your browser\n' +
    '2. Copy the job description text\n' +
    '3. Save to a file: job.txt\n' +
    '4. Run: cvgen ai keywords jane --job job.txt'
  );
}
```

### Pitfall 6: Terminal Width Detection in CI
**What goes wrong:** `process.stdout.columns` returns `undefined` in non-TTY
**Why it happens:** CI environments, piped output don't have terminal
**How to avoid:** Default to safe value (80) when undefined
**Warning signs:** Layout breaks in CI, NaN in width calculations

```typescript
// Prevention: Safe terminal width detection
function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

function isTTY(): boolean {
  return process.stdout.isTTY === true;
}
```

## Code Examples

Verified patterns from official sources:

### cv.md Output Formatting
```typescript
// Source: Project's cv.md format (examples/jane-developer/cv.md)
export function formatBulletsAsCvMd(
  bullets: RoleBullets[],
  locale: string
): string {
  const lines: string[] = [];

  lines.push(`## Work Experience \`${locale}\``);
  lines.push('');

  for (const role of bullets) {
    lines.push('---');
    lines.push(`### ${role.role} at ${role.company}`);
    lines.push(`*${role.startDate} - ${role.endDate || 'present'}*`);
    lines.push('');

    for (const bullet of role.bullets) {
      lines.push(`- ${bullet.text}`);

      // Include STAR as markdown comments if --show-star
      if (bullet.starBreakdown) {
        lines.push(`<!-- STAR:`);
        lines.push(`  S: ${bullet.starBreakdown.situation}`);
        lines.push(`  T: ${bullet.starBreakdown.task}`);
        lines.push(`  A: ${bullet.starBreakdown.action}`);
        lines.push(`  R: ${bullet.starBreakdown.result}`);
        lines.push(`-->`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

### Quality Labels with Traffic Light Colors
```typescript
// Source: CONTEXT.md - Green/Yellow/Red quality labels
import pc from 'picocolors';

type Quality = 'strong' | 'good' | 'needs_review';

export function formatQualityLabel(quality: Quality): string {
  switch (quality) {
    case 'strong':
      return pc.green('Strong');
    case 'good':
      return pc.yellow('Good');
    case 'needs_review':
      return pc.red('Needs Review');
  }
}

export function formatKeywordScore(score: number): string {
  const percentage = Math.round(score * 100);
  const color = percentage >= 80 ? pc.green
              : percentage >= 50 ? pc.yellow
              : pc.red;
  return color(`${percentage}%`);
}
```

### Keyword Analysis Output Schema
```typescript
// Source: Phase 16 requirements + CONTEXT.md keyword decisions
export const KeywordAnalysisSchema = z.object({
  score: z.number().min(0).max(100)
    .describe('Overall keyword coverage percentage'),

  byCategory: z.object({
    required: z.object({
      total: z.number(),
      matched: z.number(),
      keywords: z.array(z.object({
        keyword: z.string(),
        found: z.boolean(),
        suggestedPlacement: z.string().optional(),
        rewrittenContent: z.string().optional(),
      })),
    }),
    preferred: z.object({
      total: z.number(),
      matched: z.number(),
      keywords: z.array(z.object({
        keyword: z.string(),
        found: z.boolean(),
        suggestedPlacement: z.string().optional(),
      })),
    }),
  }),

  bySection: z.array(z.object({
    section: z.string().describe('CV section: skills, experience, summary'),
    suggestions: z.array(z.object({
      keyword: z.string(),
      currentText: z.string().optional(),
      rewrittenText: z.string(),
      context: z.string().describe('2-3 lines surrounding context'),
    })),
  })),

  highCoverage: z.boolean()
    .describe('True if score > 90%'),
});
```

### Bullet Count Determination
```typescript
// Source: CONTEXT.md - 3-8 bullets based on complexity
export function determineBulletCount(role: {
  tenure: number;       // months
  seniority: string;    // junior, mid, senior, lead
  scope: string;        // individual, team, department, company
}): { min: number; max: number; suggested: number } {
  let base = 3;

  // Tenure impact: +1 for every 18 months
  base += Math.floor(role.tenure / 18);

  // Seniority impact
  const seniorityBonus: Record<string, number> = {
    junior: 0,
    mid: 1,
    senior: 2,
    lead: 2,
    principal: 3,
  };
  base += seniorityBonus[role.seniority.toLowerCase()] || 0;

  // Scope impact
  const scopeBonus: Record<string, number> = {
    individual: 0,
    team: 1,
    department: 1,
    company: 2,
  };
  base += scopeBonus[role.scope.toLowerCase()] || 0;

  // Clamp to 3-8 range
  const suggested = Math.min(8, Math.max(3, base));

  return {
    min: 3,
    max: 8,
    suggested,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual STAR formatting | LLM generates with schema | AI SDK 6 (2025) | Consistent, validated output |
| Keyword stuffing | Semantic keyword matching | 2025-2026 | ATS systems now detect stuffing |
| Generic prompts | Structured output + examples | AI SDK 6 (2025) | More reliable, typed results |
| Parse LLM text | Output.object() | AI SDK 6 (2025) | Eliminates parsing errors |
| Single attempt | Retry with backoff | Best practice | Handles transient errors |

**Deprecated/outdated:**
- Keyword density focus: Modern ATS uses semantic matching, not just keyword counting
- Single-shot generation: Multi-step with validation produces better results
- Manual JSON parsing: AI SDK 6 structured output handles this automatically

## Open Questions

Things that couldn't be fully resolved:

1. **Synonym dictionary scope**
   - What we know: Fuse.js handles typos/variations; synonyms need explicit mapping
   - What's unclear: How comprehensive should the synonym dictionary be?
   - Recommendation: Start with common tech abbreviations (JS, TS, K8s, ML, AI); let LLM handle industry-specific synonyms in prompts

2. **PDF extraction reliability**
   - What we know: unpdf works for most PDFs; scanned documents are problematic
   - What's unclear: Failure rate in real-world job postings
   - Recommendation: Use unpdf; on failure, suggest manual text extraction with clear instructions

3. **Optimal Fuse.js threshold**
   - What we know: 0.3-0.4 is typical; lower = stricter
   - What's unclear: Best threshold for resume keyword matching specifically
   - Recommendation: Start with 0.3; make configurable via environment variable for tuning

4. **Bullet count for sparse roles**
   - What we know: CONTEXT.md says prompt for details in TTY, skip in non-TTY
   - What's unclear: What's the minimum context needed for LLM to generate meaningful bullets?
   - Recommendation: Require at least role title and company; generate 1-2 generic bullets if no details

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - Output.object() API
- [Fuse.js Documentation](https://www.fusejs.io/) - Fuzzy search configuration
- [diff npm package](https://www.npmjs.com/package/diff) - Text comparison API
- [unpdf GitHub](https://github.com/unjs/unpdf) - PDF extraction capabilities

### Secondary (MEDIUM confidence)
- [STAR Method Resume Guide](https://www.rezi.ai/posts/star-method-for-a-resume) - STAR formatting patterns
- [LLM Resume Optimizer Article](https://medium.com/@leofgonzalez/how-i-built-an-llm-powered-resume-optimizer-to-beat-ats-filters-8ace36d5d32c) - ATS optimization patterns
- [ResumeFlow Paper](https://arxiv.org/html/2402.06221v1) - LLM pipeline for resume generation
- [Web Scraping Guide 2026](https://www.scrapingdog.com/blog/javascript-web-scraping/) - URL fetching patterns

### Tertiary (LOW confidence)
- [LLM Hallucination Survey](https://www.mdpi.com/2673-2688/6/10/260) - General hallucination prevention (not CV-specific)
- [Fuzzy Search Implementation](https://www.meilisearch.com/blog/fuzzy-search) - General fuzzy matching theory

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and proven in Phase 14-15
- Architecture patterns: HIGH - Extends existing patterns with clear separation
- Keyword matching: MEDIUM - Fuse.js threshold needs real-world tuning
- STAR generation: HIGH - Well-documented approach, LLM handles naturally
- Diff display: HIGH - `diff` package is mature, straightforward API
- URL fetching: MEDIUM - Edge cases with blocked sites need runtime handling

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - patterns are stable; AI SDK 6 is mature)
