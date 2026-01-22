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
