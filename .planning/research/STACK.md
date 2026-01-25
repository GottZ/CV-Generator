# Stack Research: CV/Resume Generator CLI Tool

**Project:** CLI-based CV/resume generator (Markdown to PDF/HTML/DOCX)
**Researched:** 2026-01-22
**Overall Confidence:** HIGH

## Executive Summary

For a modern CV/resume generator CLI targeting IT professionals with ATS optimization, the recommended stack is:

- **Runtime:** Node.js 20+ LTS with TypeScript
- **CLI Framework:** Commander.js (lightweight, TypeScript-native)
- **PDF Generation:** Puppeteer (browser-based HTML-to-PDF for ATS compatibility)
- **DOCX Generation:** docx (declarative API, actively maintained)
- **Markdown Parsing:** marked + gray-matter (fast, battle-tested)
- **Templating:** Nunjucks (Jinja2-style inheritance, Mozilla-backed)
- **Build Tool:** tsup (zero-config TypeScript bundling)

This stack prioritizes: ATS text extraction compatibility, clean architecture, maintainability, and broad format support.

---

## Recommended Stack

### Runtime: Node.js 20+ LTS with TypeScript

**Recommendation:** Node.js 20.x LTS (or 22.x LTS) with TypeScript 5.x

**Rationale:**
- TypeScript provides type safety critical for a tool handling structured data (CV fields)
- CLI tools benefit from TypeScript's IDE support for contributors
- Node.js 20+ is required by modern dependencies (Commander 14)
- Node.js 22+ has experimental native TypeScript support, but production builds should still compile

**Confidence:** HIGH (official Node.js and TypeScript documentation)

**Sources:**
- [Node.js Releases](https://nodejs.org/en/about/releases/)
- [TypeScript 2025 Best Practices](https://medium.com/@nikhithsomasani/best-practices-for-using-typescript-in-2025-a-guide-for-experienced-developers-4fca1cfdf052)

---

## Core Dependencies

### CLI Framework: Commander.js

| Property | Value |
|----------|-------|
| Package | `commander` |
| Version | `^14.0.2` |
| Released | October 2025 |
| Node.js Requirement | 20+ |
| Confidence | HIGH |

**Purpose:** Parse CLI arguments, handle subcommands, generate help text.

**Why Commander over alternatives:**

| Feature | Commander | Yargs | Oclif |
|---------|-----------|-------|-------|
| Learning curve | Low | Moderate | Steep |
| TypeScript | Good | Good | Excellent |
| Bundle size | Small | Medium | Large |
| Plugin system | No | No | Yes |
| Best for | Small-to-medium CLIs | Complex arg parsing | Enterprise CLIs |

**Decision:** Commander is the right fit because:
1. This is a focused, single-purpose CLI (not a multi-tool suite)
2. No plugin architecture needed
3. Lower dependency footprint
4. Sufficient for our command structure: `cvgen build`, `cvgen validate`, etc.

**Alternative considered:** Oclif is overkill for a straightforward CLI. Its plugin architecture adds unnecessary complexity for a resume generator.

**Sources:**
- [Commander.js GitHub](https://github.com/tj/commander.js)
- [Commander 14.0.2 Release](https://github.com/tj/commander.js/releases)
- [CLI Framework Comparison](https://npm-compare.com/commander,oclif,vorpal,yargs)

---

### Build Tool: tsup

| Property | Value |
|----------|-------|
| Package | `tsup` |
| Version | `^8.5.0` |
| Purpose | TypeScript bundling |
| Confidence | HIGH |

**Why tsup:**
- Zero-config TypeScript bundling powered by esbuild
- Outputs ESM + CJS in one build
- Generates `.d.ts` type declarations
- 10-100x faster than Webpack/Rollup
- Perfect for CLI tools that need to be distributed via npm

**Configuration:**
```json
{
  "entry": ["src/cli.ts"],
  "format": ["esm", "cjs"],
  "dts": true,
  "clean": true
}
```

**Sources:**
- [tsup GitHub](https://github.com/egoist/tsup)
- [tsup Documentation](https://tsup.egoist.dev/)

---

## Markdown Parsing

### Primary Parser: marked

| Property | Value |
|----------|-------|
| Package | `marked` |
| Version | `^17.0.1` |
| Released | November 2025 |
| Confidence | HIGH |

**Purpose:** Parse markdown content to HTML for template rendering.

**Why marked:**
- 21M+ weekly downloads (most popular markdown parser)
- Fast, lightweight (no dependencies)
- Full CommonMark + GFM support
- Works in browser and Node.js
- Active maintenance (regular releases)

**Alternative considered:** `remark`/`unified` ecosystem is more powerful but introduces complexity (AST manipulation, plugins) that we don't need for simple markdown-to-HTML conversion.

**Sources:**
- [Marked GitHub](https://github.com/markedjs/marked)
- [Marked Documentation](https://marked.js.org/)

### Frontmatter Parser: gray-matter

| Property | Value |
|----------|-------|
| Package | `gray-matter` |
| Version | `^4.0.3` |
| Released | 2019 (stable, battle-tested) |
| Confidence | HIGH |

**Purpose:** Extract YAML frontmatter from markdown files for CV metadata.

**Why gray-matter:**
- Industry standard (used by Gatsby, Netlify, Astro, 11ty, etc.)
- Supports YAML, JSON, TOML frontmatter
- Clean API: `matter(content)` returns `{ data, content }`
- Battle-tested and stable (no recent breaking changes is a feature)

**Example usage:**
```typescript
import matter from 'gray-matter';

const { data, content } = matter(fs.readFileSync('cv.md', 'utf8'));
// data = { name: "John Doe", title: "Software Engineer", ... }
// content = markdown body
```

**Note:** The upstream package hasn't seen releases since 2019, but it's stable and doesn't need changes. 11ty maintains a fork (`@11ty/gray-matter`) if security becomes a concern.

**Sources:**
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter)

---

## PDF Generation

### Recommendation: Puppeteer

| Property | Value |
|----------|-------|
| Package | `puppeteer` |
| Version | `^24.x` (latest) |
| Approach | Browser-based HTML-to-PDF |
| Confidence | HIGH |

**Why browser-based PDF generation:**

**CRITICAL FOR ATS:** Applicant Tracking Systems (iCIMS, Workday, Greenhouse) parse PDFs by extracting text. Browser-generated PDFs from HTML produce "real" text, not shapes.

| Approach | ATS Text Extraction | Modern CSS Support | Maintenance |
|----------|---------------------|-------------------|-------------|
| Puppeteer | Excellent | Full | Google-backed |
| Playwright | Excellent | Full | Microsoft-backed |
| PDFKit | Poor* | N/A | Active |
| wkhtmltopdf | Poor | Limited | Deprecated |
| PhantomJS | Moderate | Outdated | Abandoned |

*PDFKit creates programmatic PDFs with proper text, but requires manual layout (no HTML/CSS).

**Why Puppeteer over Playwright for PDF:**
- Both use Chromium for PDF generation
- Puppeteer is slightly faster for short scripts (~30% in benchmarks)
- Puppeteer is more focused (Chromium-only) vs Playwright's multi-browser scope
- For PDF generation, the extra browsers (Firefox, WebKit) don't help
- Google maintains Puppeteer specifically for Chrome DevTools Protocol

**PDF Options for ATS optimization:**
```typescript
await page.pdf({
  path: 'resume.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  displayHeaderFooter: false, // Avoid headers/footers (ATS may misparse)
});
```

**Tradeoff:** Puppeteer downloads Chromium (~150MB). For a CLI tool, this is acceptable. Users can also use `puppeteer-core` with their own Chrome installation.

**Sources:**
- [Puppeteer GitHub](https://github.com/puppeteer/puppeteer)
- [Puppeteer vs Playwright Performance](https://www.skyvern.com/blog/puppeteer-vs-playwright-complete-performance-comparison-2025/)
- [ATS Resume Optimization Guide](https://www.atshiring.com/en/learn/how-ats-works-parsing-vs-keyword-scoring-2025)
- [Top PDF Generation Libraries 2025](https://pdfbolt.com/blog/top-nodejs-pdf-generation-libraries)

---

## HTML Generation

### Templating Engine: Nunjucks

| Property | Value |
|----------|-------|
| Package | `nunjucks` |
| Version | `^3.2.4` |
| Developed by | Mozilla |
| Confidence | HIGH |

**Purpose:** Generate HTML from templates with CV data.

**Why Nunjucks:**

| Feature | Nunjucks | EJS | Handlebars |
|---------|----------|-----|------------|
| Template inheritance | Yes | No | Partial |
| Filters | Rich built-in | Limited | Custom helpers |
| Async support | Yes | No | No |
| Syntax | Jinja2-style | JS-embedded | Mustache-style |
| Learning curve | Moderate | Easy | Easy |

**Decision factors:**
1. **Template inheritance** is critical for design templates (base layout + theme variations)
2. **Filters** enable clean data formatting (`{{ date | formatDate }}`)
3. **Block system** allows template parts to be overridden
4. Mozilla backing provides confidence in maintenance

**Example template structure:**
```
/templates/
  base.njk          # Common HTML structure
  /modern/
    layout.njk      # extends base.njk
    styles.css
  /classic/
    layout.njk
    styles.css
```

**Alternative considered:** Handlebars is simpler but lacks template inheritance. EJS is too embedded-JS-heavy for clean templates.

**Sources:**
- [Nunjucks Documentation](https://mozilla.github.io/nunjucks/)
- [Template Engine Comparison](https://npm-compare.com/ejs,handlebars,nunjucks,pug)

### HTML Output: Embedded CSS with Object Tag

For the HTML output requirement (CSS embedded in object tag):

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    <object data="data:text/css,{{ cssContent | urlencode }}" type="text/css"></object>
  </style>
  <!-- OR more commonly, inline the CSS directly -->
  <style>{{ cssContent | safe }}</style>
</head>
<body>
  {{ content | safe }}
</body>
</html>
```

**Note:** The `<object>` tag for CSS embedding is non-standard. Most browsers ignore CSS in object tags. Recommend using inline `<style>` tags or `<link>` tags instead. Clarify this requirement with stakeholders.

---

## DOCX Generation

### Recommendation: docx

| Property | Value |
|----------|-------|
| Package | `docx` |
| Version | `^9.5.1` |
| Released | June 2025 |
| Confidence | HIGH |

**Why docx (not docxtemplater or officegen):**

| Library | Approach | ATS Compatibility | Maintenance |
|---------|----------|------------------|-------------|
| docx | Declarative API | Excellent | Active (13k+ dependents) |
| docxtemplater | Template-based | Good | Commercial add-ons |
| officegen | Multi-format | Moderate | Less active |

**Decision factors:**
1. **Declarative API** - Build documents programmatically (matches our code-driven approach)
2. **No template files needed** - Simpler distribution (no .docx template dependencies)
3. **Full control** - Precise ATS-friendly formatting
4. **Active maintenance** - Recent releases, large user base

**Example usage:**
```typescript
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "John Doe",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Software Engineer", bold: true }),
        ],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('resume.docx', buffer);
```

**ATS Optimization for DOCX:**
- Use standard fonts (Arial, Calibri, Times New Roman)
- Use built-in heading styles (HEADING_1, HEADING_2)
- Avoid tables for layout (use for actual tabular data only)
- Keep formatting simple (bold, italic, but avoid complex styling)

**Sources:**
- [docx GitHub](https://github.com/dolanmiu/docx)
- [docx Documentation](https://docx.js.org/)
- [DOCX Libraries Comparison](https://npm-compare.com/docx-preview,docxtemplater,jszip,mammoth,officegen)

---

## Complete Dependency List

### Production Dependencies

```json
{
  "dependencies": {
    "commander": "^14.0.2",
    "gray-matter": "^4.0.3",
    "marked": "^17.0.1",
    "nunjucks": "^3.2.4",
    "puppeteer": "^24.0.0",
    "docx": "^9.5.1"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsup": "^8.5.0",
    "@types/node": "^22.0.0",
    "@types/nunjucks": "^3.2.6",
    "vitest": "^3.0.0"
  }
}
```

### Installation Command

```bash
# Production deps
npm install commander gray-matter marked nunjucks puppeteer docx

# Dev deps
npm install -D typescript tsup @types/node @types/nunjucks vitest
```

---

## What NOT to Use

### PDF Generation - Avoid These

| Library | Reason | Source |
|---------|--------|--------|
| **wkhtmltopdf** | Deprecated/archived project, poor modern CSS support | [Best HTML PDF Libraries](https://blog.logrocket.com/best-html-pdf-libraries-node-js/) |
| **PhantomJS** | Abandoned since 2018, security vulnerabilities | [PhantomJS Status](https://github.com/nicholasf/presentations/issues/2) |
| **html-pdf** | Uses PhantomJS under the hood | npm deprecation notice |
| **PDFKit alone** | No HTML/CSS support, requires manual layout | Only use if you need programmatic drawing |

### CLI Frameworks - Avoid These

| Library | Reason |
|---------|--------|
| **Vorpal** | Unmaintained, last release 2016 |
| **Caporal** | Less active, smaller community than Commander |
| **Oclif** | Overkill for single-purpose CLI (plugin architecture unnecessary) |

### Template Engines - Avoid These

| Library | Reason |
|---------|--------|
| **Jade/Pug** | Whitespace-sensitive syntax is error-prone for contributors |
| **Mustache** | Too limited (no inheritance, no filters) |

### DOCX Generation - Avoid These

| Library | Reason |
|---------|--------|
| **officegen** | Less active maintenance, more bugs reported |
| **docx4js** | Limited documentation, smaller community |

---

## Confidence Assessment

| Component | Confidence | Rationale |
|-----------|------------|-----------|
| Node.js 20+ | HIGH | Official Node.js release schedule, Commander 14 requirement |
| TypeScript | HIGH | Industry standard for CLI tools in 2025/2026 |
| Commander | HIGH | Most popular CLI framework, active maintenance, verified v14 |
| tsup | HIGH | Standard TypeScript bundler, verified v8.5 |
| marked | HIGH | Most downloaded markdown parser, verified v17 |
| gray-matter | HIGH | Industry standard frontmatter parser, stable |
| Puppeteer | HIGH | Google-backed, best HTML-to-PDF for ATS, verified v24 |
| docx | HIGH | Most active DOCX library, verified v9.5 |
| Nunjucks | MEDIUM | Mozilla-backed but version 3.2.4 is 3 years old; stable but monitor |

---

## Architecture Implications

The chosen stack suggests this architecture:

```
Input:                    Processing:              Output:
/people/[name]/
  cv.md (frontmatter) --> gray-matter --> data
  cv.md (body)        --> marked      --> HTML content
                                            |
/templates/                                 v
  [theme]/layout.njk  --> nunjucks   --> Full HTML
  [theme]/styles.css                        |
                                            +---> puppeteer --> PDF
                                            +---> (inline)   --> HTML
                                            +---> docx       --> DOCX
```

**Key design decisions enabled:**
1. **Separation of data and presentation** - Markdown for content, templates for design
2. **Theme system** - Nunjucks inheritance enables multiple themes
3. **Single source of truth** - One markdown file generates all formats
4. **ATS optimization** - Browser-based PDF ensures text extraction works

---

## Sources Summary

### Authoritative Sources Used (HIGH confidence)
- [Commander.js GitHub Releases](https://github.com/tj/commander.js/releases) - Version 14.0.2
- [Puppeteer GitHub](https://github.com/puppeteer/puppeteer) - Version 24.x
- [docx GitHub](https://github.com/dolanmiu/docx) - Version 9.5.1
- [Marked GitHub Releases](https://github.com/markedjs/marked/releases) - Version 17.0.1
- [tsup Documentation](https://tsup.egoist.dev/) - Version 8.5.0

### Ecosystem Research (MEDIUM confidence)
- [Top PDF Generation Libraries 2025](https://pdfbolt.com/blog/top-nodejs-pdf-generation-libraries)
- [Puppeteer vs Playwright Performance 2025](https://www.skyvern.com/blog/puppeteer-vs-playwright-complete-performance-comparison-2025/)
- [ATS Resume Optimization 2025](https://www.atshiring.com/en/learn/how-ats-works-parsing-vs-keyword-scoring-2025)
- [Template Engine Comparison](https://npm-compare.com/ejs,handlebars,nunjucks,pug)
- [CLI Framework Comparison](https://npm-compare.com/commander,oclif,vorpal,yargs)

### Community Patterns (verified with official sources)
- [Node.js 2025 TypeScript Guide](https://medium.com/@gabrieldrouin/node-js-2025-guide-how-to-setup-express-js-with-typescript-eslint-and-prettier-b342cd21c30d)
- [TypeScript Best Practices 2025](https://medium.com/@nikhithsomasani/best-practices-for-using-typescript-in-2025-a-guide-for-experienced-developers-4fca1cfdf052)

---

## Addendum: PDF Pagination, Print CSS, and Automated PDF Testing

**Added:** 2026-01-23
**Context:** Milestone 2 - Improving PDF pagination, HTML print parity, and adding automated PDF testing

### Executive Summary for Milestone 2

This milestone requires **zero new runtime dependencies** for PDF pagination and print CSS - these capabilities exist within the current Puppeteer + CSS stack. For automated PDF testing, we need **one test-time dependency**: `unpdf` for text extraction. Visual regression testing uses already-installed Playwright.

---

### 1. PDF Pagination Control

**Recommendation:** Use existing Puppeteer + CSS @page rules. **No new dependencies.**

| Aspect | Technology | Status | Notes |
|--------|------------|--------|-------|
| Page breaks | CSS `break-inside`, `page-break-*` | Existing | Puppeteer 24+ supports both legacy and modern properties |
| Page sizing | `@page` CSS rule | Existing | Use with `preferCSSPageSize: true` in Puppeteer |
| Orphan/widow control | CSS `orphans`, `widows` | Existing | Standard print CSS |
| Section headers | CSS `break-after: avoid` | Existing | Keep headings with content |

**Key Puppeteer PDF options to leverage:**

```typescript
await page.emulateMediaType('print');  // CRITICAL: Required for @media print rules
await page.pdf({
  format: 'A4',
  preferCSSPageSize: true,  // Let CSS @page rules control sizing
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
});
```

**Required CSS patterns (no libraries needed):**

```css
@page {
  size: A4;
  margin: 0.5in;
}

@media print {
  /* Prevent section breaks */
  .cv-section { break-inside: avoid; page-break-inside: avoid; }

  /* Keep headings with content */
  h2, h3, h4 { break-after: avoid; page-break-after: avoid; }

  /* Control orphans/widows */
  p { orphans: 3; widows: 3; }
}
```

**Known Puppeteer Issues:**
- `break-inside: avoid` may be ignored in some headless modes ([Issue #6366](https://github.com/puppeteer/puppeteer/issues/6366))
- Workaround: Use both legacy `page-break-inside` and modern `break-inside` properties

**Source:** [Puppeteer PDFOptions API](https://pptr.dev/api/puppeteer.pdfoptions), [CSS-Tricks page-break](https://css-tricks.com/almanac/properties/p/page-break/)

---

### 2. Print CSS for HTML Parity

**Recommendation:** CSS-only solution with `@media print` rules. **No new dependencies.**

| Feature | Approach | Notes |
|---------|----------|-------|
| Media query | `@media print {}` | Browser native |
| Page simulation | `@page` CSS rule | Standard CSS |
| Print preview | Browser print dialog | User-initiated `Cmd/Ctrl+P` |

**Implementation strategy:**

The HTML output should include the same CSS used for PDF generation. When a user prints the HTML, the `@media print` rules activate automatically.

```css
/* Shared print styles (included in HTML output) */
@media print {
  /* Hide screen-only elements */
  .no-print { display: none; }

  /* Apply same page breaks as PDF */
  .cv-section { break-inside: avoid; }

  /* Match PDF typography */
  body { font-size: 11pt; line-height: 1.4; }
}
```

**Why no print CSS library:**
- [Paged.js](https://pagedjs.org/) is overkill for single-document CVs
- Browser print engines handle simple pagination well
- Keeping CSS inline avoids JS runtime dependency for static HTML output

---

### 3. Automated PDF Testing

**Recommendation:** Two-pronged approach using Playwright (visual) + unpdf (structural).

#### 3.1 Visual Regression Testing

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `@playwright/test` | ^1.57.0 | Visual snapshot comparison | **Already installed**, mature visual diff, CI-ready |

**Why Playwright over alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| `@playwright/test` | **USE** | Already in stack, built-in `toHaveScreenshot()`, maintained |
| `pdf-visual-diff` | Skip | Requires Jest peer dependency, conflicts with Bun test runner |
| `jest-image-snapshot` | Skip | Jest-only, not compatible with Bun's test runner |
| `pdf-visual-compare` | Skip | Low adoption (70 weekly downloads), marked inactive |

**Testing approach:**

```typescript
import { test, expect } from '@playwright/test';

test('CV PDF visual regression', async ({ page }) => {
  // Open PDF in browser (Chromium renders PDFs)
  await page.goto(`file://${pdfPath}`);

  // Screenshot each page for visual comparison
  await expect(page).toHaveScreenshot('cv-page-1.png', {
    maxDiffPixels: 100  // Allow minor anti-aliasing differences
  });
});
```

**Source:** [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)

#### 3.2 Structural/Text Validation

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `unpdf` | ^1.4.0 | PDF text extraction | Zero deps, TypeScript-first, Bun/serverless compatible |

**Why unpdf over alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| `unpdf` | **USE** | Zero dependencies, TypeScript-native, works in Bun, active maintenance (v1.4.0 Oct 2025) |
| `pdf-parse` | Skip | v2.x has Node version requirements (>=20.16.0), heavier |
| `pdfjs-dist` | Skip | Requires canvas native module, complex setup |
| `pdf-lib` | **Already installed** | Can read PDF structure but limited text extraction |

**Testing approach:**

```typescript
import { extractText, getMeta } from 'unpdf';

test('CV PDF contains expected content', async () => {
  const pdf = await Bun.file('output.pdf').arrayBuffer();

  // Extract all text
  const { text } = await extractText(pdf, { mergePages: true });

  // Verify expected content
  expect(text).toContain('John Doe');
  expect(text).toContain('Software Engineer');

  // Check page count via metadata
  const meta = await getMeta(pdf);
  expect(meta.info?.numPages).toBeLessThanOrEqual(2);
});
```

**Source:** [unpdf GitHub](https://github.com/unjs/unpdf)

---

### Installation for Milestone 2

```bash
# PDF text extraction for tests (dev dependency only)
bun add -D unpdf
```

**Already installed (no action needed):**
- `puppeteer@^24.36.0` - PDF generation with page break support
- `@playwright/test@^1.57.0` - Visual regression testing
- `pdf-lib@^1.17.1` - PDF metadata (outline, page count)

---

### What NOT to Add for Milestone 2

| Library | Why Not |
|---------|---------|
| **Paged.js** | Overkill for CV-length documents; adds JS runtime to HTML output |
| **WeasyPrint** | Python-based, doesn't fit Bun/TypeScript stack |
| **wkhtmltopdf** | Legacy tool, binary dependency, inferior page break support |
| **pdf-visual-diff** | Requires Jest, incompatible with Bun test runner |
| **pdf-parse v2** | Complex Node version requirements, unpdf is simpler |
| **canvas/@napi-rs/canvas** | Native module complexity; Playwright screenshots avoid this |

---

### Confidence Assessment for Milestone 2

| Area | Confidence | Basis |
|------|------------|-------|
| Puppeteer PDF options | HIGH | Official docs at pptr.dev |
| CSS page break properties | HIGH | Long-standing CSS standard, browser support verified |
| Playwright visual testing | HIGH | Official docs, already in project |
| unpdf for text extraction | HIGH | GitHub releases show active maintenance, v1.4.0 from Oct 2025 |
| Bun compatibility | MEDIUM | unpdf claims Bun support but limited direct verification |

---

### Milestone 2 Sources

- [Puppeteer PDFOptions API](https://pptr.dev/api/puppeteer.pdfoptions) - Official documentation
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Official documentation
- [unpdf GitHub Repository](https://github.com/unjs/unpdf) - v1.4.0 release notes
- [CSS-Tricks page-break](https://css-tricks.com/almanac/properties/p/page-break/) - CSS property reference
- [PrintCSS Widows and Orphans](https://printcss.net/articles/widows-and-orphans) - Typography best practices
- [Puppeteer page break issues](https://github.com/puppeteer/puppeteer/issues/6366) - Known limitations

---

## Addendum: v1.2 LLM Integration, Interactive Wizards, and Template Generation

**Added:** 2026-01-25
**Context:** Milestone v1.2 - Adding AI-assisted CV writing, interactive CLI wizards, and template scaffolding

### Executive Summary for v1.2

v1.2 adds AI-assisted CV writing, interactive wizards, and template scaffolding to the existing CLI. The recommended approach is:

1. **LLM Integration:** Use **Vercel AI SDK** (`ai` package) as a unified abstraction layer over OpenAI, Anthropic, and Ollama. This provides consistent APIs, streaming support, and future-proofing without vendor lock-in.

2. **Interactive Prompts:** Use **@inquirer/prompts** for interactive CLI wizards. It's the modern, modular rewrite of Inquirer.js with Bun compatibility fixed since v1.0.36.

3. **No New Template Libraries:** The existing Nunjucks engine handles template generation - no changes needed.

4. **Prompt Export Fallback:** Simple Markdown/JSON export using existing fs primitives - no new dependencies.

The stack additions are deliberately minimal: 6 runtime packages (ai, 3 provider packages, @inquirer/prompts, zod) plus Zod which is already used indirectly.

---

### 1. LLM Integration Stack

#### Recommended: Vercel AI SDK as Unified Abstraction

**Package:** `ai` (Vercel AI SDK) + provider packages
**Version:** `^6.0.49` (AI SDK 6, released October 2025)

**Why AI SDK over direct API calls:**

| Consideration | Direct APIs | AI SDK |
|---------------|-------------|--------|
| Code duplication | 3 separate implementations | Single interface |
| Streaming | Manual SSE handling per provider | Unified streaming API |
| Error handling | Provider-specific error types | Normalized errors |
| Provider switching | Requires refactoring | Change one import |
| Future models | Each requires new implementation | Add provider package |
| Maintenance | Track 3 API changes | SDK handles abstraction |

**Production experience validates this approach:** "After 6 months running both approaches in production, the recommendation is to start with the SDK. The time you 'save' with direct HTTP calls gets consumed 10x over in error handling, context management, and maintenance." ([DEV Community](https://dev.to/dpelleri/openai-sdk-vs-direct-api-calls-what-6-months-of-building-ai-agents-taught-me-15bd))

#### Provider Packages

| Provider | Package | Version | Purpose |
|----------|---------|---------|---------|
| OpenAI | `@ai-sdk/openai` | `^3.0.18` | GPT-4, GPT-5.1 access |
| Anthropic | `@ai-sdk/anthropic` | `^3.0.23` | Claude Opus 4.5, Sonnet, Haiku |
| Ollama | `ai-sdk-ollama` | `^3.3.0` | Local models (llama3, mistral, etc.) |

**Important:** `ai-sdk-ollama` v3+ requires AI SDK v6. For AI SDK v5, use `ai-sdk-ollama@^2.2.0`.

#### Structured Outputs with Zod

**Package:** `zod`
**Version:** `^4.3.6` (already indirectly used, will add as direct dependency)

The AI SDK integrates with Zod for type-safe structured outputs:

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const BulletPointsSchema = z.object({
  bullets: z.array(z.string()).min(3).max(5),
  improved: z.boolean(),
});

const result = await generateObject({
  model: openai('gpt-4o'),
  schema: BulletPointsSchema,
  prompt: 'Improve these bullet points for a software engineer CV...',
});
// result.object is fully typed as { bullets: string[], improved: boolean }
```

This gives us:
- Guaranteed schema-compliant responses
- TypeScript type inference from schema
- Validation at runtime
- Works identically across OpenAI, Anthropic, Ollama

#### Why NOT Direct SDK Calls

**Rejected:** Using `openai`, `@anthropic-ai/sdk`, `ollama` packages directly.

**Reasons:**
1. **Triple implementation burden** - Each provider has different APIs, streaming patterns, error handling
2. **No structured output parity** - OpenAI has `zodResponseFormat`, Anthropic has different patterns, Ollama varies by model
3. **Maintenance nightmare** - API changes ripple through codebase
4. **Bun compatibility varies** - AI SDK abstracts runtime differences

**Exception consideration:** If a feature is OpenAI-only (like Realtime API), use `openai` package directly for that specific feature. But for text generation, use AI SDK.

---

### 2. CLI Wizard/Prompt Library

#### Recommended: @inquirer/prompts

**Package:** `@inquirer/prompts`
**Version:** `^8.2.0`

**Why @inquirer/prompts:**

| Library | Bun Compat | Modularity | TypeScript | Active |
|---------|------------|------------|------------|--------|
| @inquirer/prompts | Yes (fixed v1.0.36) | Individual imports | Native | Yes |
| prompts | Yes | Single package | @types | Minimal |
| bun-promptx | Native Bun | FFI-based | TypeScript | Limited |
| interactive-commander | Yes | Commander plugin | TypeScript | Yes |

**@inquirer/prompts advantages:**
1. **Modular imports** - Only import what you use: `import { input, select, confirm } from '@inquirer/prompts'`
2. **Bun compatibility** - Fixed in Bun v1.0.36 (March 2024), stable since
3. **TypeScript-first** - Built with TypeScript, excellent type inference
4. **Active development** - Recent rewrite, frequent updates, 8.2.0 published recently
5. **Industry standard** - Used by create-react-app, Angular CLI, Yeoman

**Bun compatibility note:** There was a known issue with `@inquirer/prompts` in postinstall hooks, but normal runtime usage works correctly. Test during development.

#### Integration with Commander.js

The existing CLI uses Commander.js v14. Integration pattern:

```typescript
import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';

// Option 1: Wizard as standalone command
program
  .command('wizard')
  .description('Interactive CV creation wizard')
  .action(async () => {
    const name = await input({ message: 'Your full name:' });
    const template = await select({
      message: 'Choose template:',
      choices: [
        { value: 'modern', name: 'Modern - Clean, contemporary design' },
        { value: 'minimal', name: 'Minimal - Simple, focused layout' },
        { value: 'classic', name: 'Classic - Traditional, formal style' },
      ],
    });
    // Continue wizard flow...
  });

// Option 2: Interactive fallback for missing options
program
  .command('ai <action>')
  .description('AI-assisted CV operations')
  .option('--provider <provider>', 'LLM provider (openai, anthropic, ollama)')
  .action(async (action, options) => {
    let provider = options.provider;
    if (!provider) {
      provider = await select({
        message: 'Select LLM provider:',
        choices: [
          { value: 'openai', name: 'OpenAI (GPT-4)' },
          { value: 'anthropic', name: 'Anthropic (Claude)' },
          { value: 'ollama', name: 'Ollama (Local)' },
        ],
      });
    }
    // Proceed with action...
  });
```

#### Why NOT interactive-commander

**Rejected:** `interactive-commander` v0.6.0

**Reasons:**
1. **Limited adoption** - 6,222 weekly downloads vs millions for @inquirer/prompts
2. **Subcommand limitation** - "Interactive options on main command won't be prompted for in interactive mode if no subcommand is invoked"
3. **Less flexible** - Designed for missing options, not full wizard flows
4. **Dependency on Inquirer anyway** - Uses Inquirer under the hood

#### Why NOT bun-promptx

**Rejected:** `bun-promptx`

**Reasons:**
1. **FFI-based** - Uses bun:ffi with bubbles (Go library), adds complexity
2. **Limited ecosystem** - Bun-only, can't use in Node.js if needed
3. **Less mature** - Fewer features than Inquirer ecosystem
4. **Overkill** - We don't need native performance for prompts

#### Why NOT prompts

**Considered but not recommended:** `prompts` v2.4.2

**Reasons:**
1. **Minimal maintenance** - Last meaningful update years ago
2. **No native TypeScript** - Requires @types/prompts
3. **Less feature-rich** - No autocomplete, filepath, etc.
4. **Would work** - But @inquirer/prompts is better maintained

---

### 3. Template Generation Tools

#### No New Dependencies Needed

The existing template scaffolding uses:
- `fs/promises` for file operations
- `sharp` for placeholder image generation
- Existing markdown template strings in `/packages/cli/src/lib/scaffolder.ts`

For v1.2 template generation features:
- **AI-generated CV content** goes into existing markdown format
- **Template selection** uses @inquirer/prompts (added above)
- **File writing** uses existing scaffolder patterns

#### Extending Existing Scaffolder

```typescript
// Existing: createExampleMarkdown() returns template string
// v1.2: Add createAIPopulatedMarkdown(cvData) that takes AI-generated content

export async function createAIPopulatedMarkdown(
  aiContent: AIGeneratedCVData
): Promise<string> {
  // Use same template structure, but with actual content
  return `---
name: ${aiContent.name}
email: ${aiContent.email}
...
---

## Summary \`en\`
${aiContent.summary}

## Experience \`en\`
${aiContent.experiences.map(exp => formatExperience(exp)).join('\n\n')}
...
`;
}
```

---

### 4. Prompt Export Fallback

#### No New Dependencies Needed

For users without API keys, export prompts as Markdown/JSON files they can paste into ChatGPT/Claude web interface.

**Implementation using existing fs primitives:**

```typescript
export async function exportPrompt(
  promptType: 'improve-bullets' | 'generate-summary' | 'tailor-cv',
  context: PromptContext
): Promise<string> {
  const prompt = buildPrompt(promptType, context);
  const outputPath = `./prompts/${promptType}-${Date.now()}.md`;

  await writeFile(outputPath, formatAsMarkdown(prompt), 'utf-8');

  return outputPath;
}

function formatAsMarkdown(prompt: string): string {
  return `# CV Generation Prompt

Copy and paste this prompt into your preferred AI assistant (ChatGPT, Claude, etc.)

---

${prompt}

---

After receiving the response, save it and run:
\`cvgen import-ai-response <response-file>\`
`;
}
```

---

### 5. Recommended Stack Additions for v1.2

#### Runtime Dependencies

| Package | Version | Purpose | Size Impact |
|---------|---------|---------|-------------|
| `ai` | `^6.0.49` | Vercel AI SDK core | ~150KB |
| `@ai-sdk/openai` | `^3.0.18` | OpenAI provider | ~50KB |
| `@ai-sdk/anthropic` | `^3.0.23` | Anthropic provider | ~50KB |
| `ai-sdk-ollama` | `^3.3.0` | Ollama provider | ~30KB |
| `@inquirer/prompts` | `^8.2.0` | Interactive CLI prompts | ~100KB |
| `zod` | `^4.3.6` | Schema validation (already indirect dep) | ~50KB |

**Total addition:** ~430KB (reasonable for CLI tool)

#### Installation Command

```bash
bun add ai @ai-sdk/openai @ai-sdk/anthropic ai-sdk-ollama @inquirer/prompts zod
```

#### Optional: Development Dependencies

None new required. Existing TypeScript, Biome, and test setup sufficient.

---

### 6. What NOT to Add for v1.2 (and Why)

| Library | Why Rejected |
|---------|--------------|
| `openai` | Direct SDK - use AI SDK abstraction instead |
| `@anthropic-ai/sdk` | Direct SDK - use AI SDK abstraction instead |
| `ollama` | Direct SDK - use AI SDK abstraction instead |
| `langchain` | Over-abstraction, rigid chaining, maintenance burden |
| `prompts` | Less maintained than @inquirer/prompts |
| `bun-promptx` | FFI complexity, Bun-only, less mature |
| `interactive-commander` | Limited adoption, subcommand issues |
| `inquirer` (legacy) | Use modular @inquirer/prompts instead |
| `oclif` | Overkill - Commander.js already handles CLI |
| `vorpal` | Abandoned, not maintained |

#### LangChain Rejection Rationale

Specifically rejecting LangChain despite its popularity:

1. **Over-abstraction** - "LangChain's abstractions began to limit ability to customize workflows. One specific challenge was handling custom data extraction tasks that required tight integration between LLM outputs and custom code." ([Medium](https://johnchildseddy.medium.com/typescript-llms-lessons-learned-from-9-months-in-production-4910485e3272))

2. **Maintenance burden** - Frequent breaking changes, complex dependency tree

3. **Not needed** - Our use case is straightforward text generation, not RAG or complex chains

4. **AI SDK is sufficient** - Provides the abstraction we need without the complexity

---

### 7. Integration Points with Existing Codebase

#### File Structure Addition

```
packages/cli/src/
  commands/
    ai.ts          # NEW: cv-gen ai <action> command
    wizard.ts      # NEW: cv-gen wizard command
  lib/
    ai/
      index.ts         # NEW: AI module orchestration
      providers.ts     # NEW: Provider configuration
      prompts/
        improve.ts     # NEW: Bullet point improvement prompts
        summarize.ts   # NEW: Summary generation prompts
        tailor.ts      # NEW: Job-tailored CV prompts
      export.ts        # NEW: Prompt export for fallback
    wizard/
      index.ts         # NEW: Wizard flow orchestration
      steps/
        personal.ts    # NEW: Personal info step
        experience.ts  # NEW: Experience step
        skills.ts      # NEW: Skills step
```

#### Commander.js Integration

Extend existing `/packages/cli/src/index.ts`:

```typescript
// Existing commands
program.command('build')...
program.command('init')...
program.command('validate')...
program.command('list-templates')...

// NEW v1.2 commands
import { aiAction } from './commands/ai.ts';
import { wizardAction } from './commands/wizard.ts';

program
  .command('ai <action>')
  .description('AI-assisted CV operations')
  .argument('<action>', 'Action: improve, summarize, tailor, export-prompt')
  .option('--provider <provider>', 'LLM provider (openai, anthropic, ollama)')
  .option('--model <model>', 'Specific model to use')
  .option('--export-only', 'Export prompt without calling API')
  .action(aiAction);

program
  .command('wizard')
  .description('Interactive CV creation wizard')
  .option('--use-ai', 'Use AI to help write content')
  .option('--provider <provider>', 'LLM provider if using AI')
  .action(wizardAction);
```

#### Configuration Management

Add to existing config patterns:

```typescript
// ~/.cvgen/config.json or .cvgenrc
interface CVGenConfig {
  // Existing
  defaultTemplate?: string;
  peopleDir?: string;

  // NEW v1.2
  ai?: {
    defaultProvider?: 'openai' | 'anthropic' | 'ollama';
    openai?: {
      apiKey?: string;  // Can also use OPENAI_API_KEY env
      model?: string;   // Default: gpt-4o
    };
    anthropic?: {
      apiKey?: string;  // Can also use ANTHROPIC_API_KEY env
      model?: string;   // Default: claude-sonnet-4-5
    };
    ollama?: {
      host?: string;    // Default: http://127.0.0.1:11434
      model?: string;   // Default: llama3.1
    };
  };
}
```

#### Environment Variables

Support standard env vars (AI SDK reads these automatically):

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
# Ollama doesn't need API key for local
```

---

### 8. Confidence Assessment for v1.2

| Component | Confidence | Verification |
|-----------|------------|--------------|
| AI SDK version/API | HIGH | npm view, official docs |
| @inquirer/prompts Bun compat | MEDIUM | Known fixed in v1.0.36, but test recommended |
| Provider packages | HIGH | npm view, official docs |
| Zod integration | HIGH | Official OpenAI/AI SDK documentation |
| No new template libs needed | HIGH | Reviewed existing scaffolder.ts |
| Commander.js integration | HIGH | Already using v14, pattern established |

#### Recommended Verification Steps

1. **Before implementation:** Create spike/POC testing @inquirer/prompts with Bun runtime
2. **During implementation:** Test AI SDK streaming with Bun
3. **Integration testing:** Verify Ollama provider works with local instance

---

### v1.2 Sources

#### AI SDK and LLM Integration
- [Vercel AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [ai-sdk-ollama Provider](https://github.com/jagreehal/ai-sdk-ollama)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Zod for TypeScript AI Development](https://workos.com/blog/zod-for-typescript)

#### CLI Prompts
- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts)
- [Bun Inquirer Compatibility Fix](https://bun.com/blog/bun-v1.0.36)
- [interactive-commander npm](https://www.npmjs.com/package/interactive-commander)

#### LLM Integration Best Practices
- [OpenAI SDK vs Direct API Calls](https://dev.to/dpelleri/openai-sdk-vs-direct-api-calls-what-6-months-of-building-ai-agents-taught-me-15bd)
- [TypeScript and LLMs Production Lessons](https://johnchildseddy.medium.com/typescript-llms-lessons-learned-from-9-months-in-production-4910485e3272)
- [Unified AI Interfaces with Vercel SDK](https://blog.logrocket.com/unified-ai-interfaces-vercel-sdk/)

#### Bun Compatibility
- [Bun Runtime on Vercel](https://vercel.com/blog/bun-runtime-on-vercel-functions)
- [Bun v1.3.5 PTY Support](https://bun.com/blog/bun-v1.3.5)
