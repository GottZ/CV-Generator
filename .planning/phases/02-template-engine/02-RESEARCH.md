# Phase 2: Template Engine - Research

**Researched:** 2026-01-22
**Domain:** Nunjucks templating, ATS-compliant HTML, multi-language CV rendering
**Confidence:** HIGH

## Summary

Phase 2 implements the template engine that transforms parsed CVData into styled HTML. The template system uses Nunjucks 3.2.4 for rendering, with a directory-based template discovery pattern where each template lives in `/templates/{name}/` containing `template.njk`, `styles.css`, and `config.json`.

The standard approach for this phase is:
1. Create a new `@gottz/cv-templates` package in the monorepo for template engine and app-provided filters
2. Configure Nunjucks with FileSystemLoader pointing to `/templates/` directory
3. Implement custom filters for date formatting, markdown rendering, and i18n translations
4. Build a base template with semantic HTML structure (h1 for name, h2 for sections)
5. Design CSS using flexbox for single-column layout with CSS custom properties for theming
6. Implement template loader that scans directories for `config.json` files

**Primary recommendation:** Use Nunjucks template inheritance with a functional base template that child templates can extend. Provide default section header translations in the base template. Render markdown content with `marked` inside a custom Nunjucks filter. Embed fonts as base64 in CSS for self-contained output.

## Standard Stack

The established libraries/tools for Phase 2:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nunjucks | ^3.2.4 | Template engine | Jinja2-style, template inheritance, filters, Mozilla-backed |
| @types/nunjucks | ^3.2.6 | TypeScript definitions | Required for typed Nunjucks API |
| marked | ^17.0.1 | Markdown rendering in templates | Already in stack, renders bullets/bold/links |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dayjs | ^1.11.13 | Date formatting | Lightweight moment.js replacement for date filters |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nunjucks | Handlebars | Simpler but lacks template inheritance, worse for layout composition |
| nunjucks | EJS | More JS-native but embedded JS syntax is harder to maintain |
| dayjs | date-fns | Tree-shakeable but overkill for simple YYYY-MM to "Month Year" |
| dayjs | moment.js | Feature-complete but deprecated; dayjs is drop-in replacement |

**Installation:**
```bash
# From monorepo root
bun add nunjucks dayjs
bun add -d @types/nunjucks
```

## Architecture Patterns

### Recommended Project Structure
```
cvgen/
├── packages/
│   ├── core/                    # @gottz/cv-core (Phase 1 - exists)
│   │   └── src/
│   │       ├── schema/          # CVData, Contact, etc.
│   │       └── parser/          # parseCV function
│   ├── templates/               # @gottz/cv-templates (NEW)
│   │   ├── src/
│   │   │   ├── index.ts         # Package entry
│   │   │   ├── engine/          # Nunjucks setup
│   │   │   │   ├── index.ts     # Environment configuration
│   │   │   │   ├── loader.ts    # Template discovery
│   │   │   │   └── filters.ts   # App-provided filters
│   │   │   ├── render.ts        # renderCV function
│   │   │   ├── types.ts         # TemplateConfig, RenderOptions
│   │   │   └── i18n/            # Section header translations
│   │   │       ├── index.ts
│   │   │       ├── en.ts
│   │   │       └── de.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                     # @gottz/cvgen (Phase 6)
├── templates/                   # Template directory (outside packages)
│   ├── base/                    # Base template (usable standalone)
│   │   ├── template.njk
│   │   ├── styles.css
│   │   └── config.json
│   └── modern/                  # Example child template
│       ├── template.njk         # {% extends "../base/template.njk" %}
│       ├── styles.css
│       └── config.json
```

### Pattern 1: Nunjucks Environment Configuration

**What:** Configure Nunjucks with autoescape, FileSystemLoader, and custom filters
**When to use:** Application initialization before any rendering

**Example:**
```typescript
// Source: https://mozilla.github.io/nunjucks/api.html
import nunjucks from 'nunjucks';
import path from 'node:path';

export function createTemplateEnvironment(templatesDir: string): nunjucks.Environment {
  const loader = new nunjucks.FileSystemLoader(templatesDir, {
    watch: false,  // No auto-reload in production
    noCache: false // Cache compiled templates
  });

  const env = new nunjucks.Environment(loader, {
    autoescape: true,           // Prevent XSS
    throwOnUndefined: false,    // Missing vars -> empty string
    trimBlocks: true,           // Remove first newline after block
    lstripBlocks: true          // Strip leading whitespace before blocks
  });

  // Register custom filters
  registerFilters(env);

  return env;
}
```

### Pattern 2: Template Discovery via Filesystem Scan

**What:** Scan `/templates/` for directories containing `config.json`
**When to use:** Loading available templates at startup or on-demand

**Example:**
```typescript
// Source: CONTEXT.md decisions
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

interface TemplateConfig {
  name: string;
  description: string;
  atsCompliant?: boolean;
  singleColumn?: boolean;
}

interface DiscoveredTemplate {
  id: string;           // Directory name (kebab-case)
  config: TemplateConfig;
  templatePath: string; // Path to template.njk
  stylesPath: string;   // Path to styles.css
}

async function discoverTemplates(templatesDir: string): Promise<DiscoveredTemplate[]> {
  const templates: DiscoveredTemplate[] = [];
  const entries = await readdir(templatesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = path.join(templatesDir, entry.name, 'config.json');
    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent) as TemplateConfig;

      templates.push({
        id: entry.name,
        config,
        templatePath: path.join(entry.name, 'template.njk'),
        stylesPath: path.join(templatesDir, entry.name, 'styles.css')
      });
    } catch {
      // No config.json or invalid JSON - skip this directory
      continue;
    }
  }

  return templates;
}
```

### Pattern 3: Custom Filters for Date Formatting

**What:** Transform ISO dates (YYYY-MM) to localized display format
**When to use:** Rendering date ranges in experience/education sections

**Example:**
```typescript
// Source: https://github.com/e-picas/nunjucks-date-filter pattern
import dayjs from 'dayjs';
import type { Environment } from 'nunjucks';

export function registerDateFilter(env: Environment): void {
  env.addFilter('formatDate', (date: string, locale: string = 'en') => {
    if (!date) return '';
    if (date.toLowerCase() === 'present') {
      return locale === 'de' ? 'heute' : 'Present';
    }

    const parsed = dayjs(date);
    if (!parsed.isValid()) return date;

    // Format based on locale
    const formats: Record<string, string> = {
      en: 'MMM YYYY',    // "Jan 2024"
      de: 'MMM YYYY'     // "Jan 2024" (same, dayjs handles month names)
    };

    return parsed.format(formats[locale] ?? formats.en);
  });

  // Date range filter: "Jan 2020 - Present"
  env.addFilter('dateRange', (start: string, end: string, locale: string = 'en') => {
    const formatted = env.getFilter('formatDate');
    const separator = locale === 'de' ? ' - ' : ' - ';
    return `${formatted(start, locale)}${separator}${formatted(end, locale)}`;
  });
}
```

### Pattern 4: Markdown Rendering Filter

**What:** Render markdown content to HTML within templates
**When to use:** Rendering summary text, bullet points with bold/links

**Example:**
```typescript
// Source: https://marked.js.org/ + CONTEXT.md decisions
import { marked } from 'marked';
import type { Environment } from 'nunjucks';

export function registerMarkdownFilter(env: Environment): void {
  // Configure marked for ATS-safe output
  marked.use({
    gfm: true,
    breaks: false  // Don't convert single \n to <br>
  });

  // Inline markdown (for single lines like summary)
  env.addFilter('md', (content: string) => {
    if (!content) return '';
    // parseInline doesn't wrap in <p>
    return marked.parseInline(content);
  });

  // Block markdown (for bullet points)
  env.addFilter('mdBlock', (content: string) => {
    if (!content) return '';
    return marked.parse(content);
  });
}
```

### Pattern 5: Section Header Translations

**What:** Provide localized section headers (EN: "Work Experience", DE: "Berufserfahrung")
**When to use:** Rendering section headings based on CV language

**Example:**
```typescript
// Source: CONTEXT.md - section headers derived from CV language
export const sectionHeaders: Record<string, Record<string, string>> = {
  en: {
    summary: 'Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications'
  },
  de: {
    summary: 'Zusammenfassung',
    experience: 'Berufserfahrung',
    education: 'Ausbildung',
    skills: 'Kenntnisse',
    projects: 'Projekte',
    certifications: 'Zertifizierungen'
  }
};

// Filter for templates
export function registerI18nFilter(env: Environment): void {
  env.addFilter('sectionHeader', (section: string, locale: string = 'en') => {
    const headers = sectionHeaders[locale] ?? sectionHeaders.en;
    return headers[section] ?? section;
  });
}
```

### Pattern 6: CSS Custom Properties for Theming

**What:** Use CSS variables for colors, fonts, spacing that can be overridden
**When to use:** Base template CSS that child templates can customize

**Example:**
```css
/* Source: CONTEXT.md styling decisions */
:root {
  /* Typography */
  --font-heading: Arial, Helvetica, sans-serif;
  --font-body: Arial, Helvetica, sans-serif;
  --font-size-name: 24pt;
  --font-size-section: 14pt;
  --font-size-body: 11pt;

  /* Colors (semantic names) */
  --color-heading: #1a1a1a;
  --color-body: #333333;
  --color-accent: #2563eb;
  --color-muted: #666666;

  /* Spacing scale */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Page dimensions (A4) */
  --page-width: 210mm;
  --page-height: 297mm;
  --page-margin: 20mm;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-heading: #f0f0f0;
    --color-body: #e0e0e0;
    --color-muted: #a0a0a0;
  }
}
```

### Anti-Patterns to Avoid
- **Tables for layout:** Use CSS flexbox with `flex-direction: column` for single-column layout
- **Hardcoded section headers:** Use i18n filter with locale parameter
- **Inline styles everywhere:** Use CSS classes with custom properties
- **Processing order error:** Extract language tags before marked parsing (marked converts backticks to `<code>`)
- **Async filters in macros:** Nunjucks doesn't support async in macros; keep markdown filter sync

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom parsing | dayjs | Locale handling, edge cases, ISO parsing |
| Template inheritance | Include chains | Nunjucks extends/block | Built-in super() support, cleaner syntax |
| Markdown in templates | Regex replacement | marked with filter | Full GFM, handles edge cases |
| i18n section headers | Template conditionals | Translation lookup object | Cleaner, extensible, override support |
| Font embedding | Manual base64 | Build step with woff2base tool | Correct data URI format, caching |
| CSS variables | SCSS/Less | Native CSS custom properties | No preprocessor, runtime overrides work |

**Key insight:** The template engine should focus on composition and rendering, not data transformation. Filters handle transformations; templates handle structure.

## Common Pitfalls

### Pitfall 1: Nunjucks Autoescape Breaks HTML Content

**What goes wrong:** Markdown-rendered HTML displays as escaped text: `&lt;strong&gt;Bold&lt;/strong&gt;`
**Why it happens:** Nunjucks autoescape is enabled (correctly for security), but filters returning HTML need to bypass it
**How to avoid:** Use the `safe` filter after markdown rendering OR return `nunjucks.runtime.SafeString`
**Warning signs:** Seeing HTML tags as text in output

**Solution:**
```typescript
// In template:
{{ summary | md | safe }}

// OR in filter implementation:
import nunjucks from 'nunjucks';
env.addFilter('md', (content: string) => {
  const html = marked.parseInline(content);
  return new nunjucks.runtime.SafeString(html);
});
```

### Pitfall 2: Template Inheritance Path Resolution

**What goes wrong:** `{% extends "../base/template.njk" %}` fails with "template not found"
**Why it happens:** Nunjucks FileSystemLoader resolves from the configured root, not the current file
**How to avoid:** Use paths relative to the templates root directory
**Warning signs:** "template not found" errors with correct-looking paths

**Correct pattern:**
```jinja
{# In templates/modern/template.njk #}
{% extends "base/template.njk" %}

{# NOT #}
{% extends "../base/template.njk" %}
```

### Pitfall 3: CSS Bullet Points for ATS Compliance

**What goes wrong:** Using `<ul><li>` creates actual bullets that some ATS misinterpret
**Why it happens:** CONTEXT.md specifies styled divs with `::before` pseudo-elements, not native lists
**How to avoid:** Use div-based bullets with CSS pseudo-elements
**Warning signs:** HTML validation warnings about non-list use of `<li>`

**Solution:**
```html
<!-- Instead of -->
<ul>
  <li>Achievement 1</li>
  <li>Achievement 2</li>
</ul>

<!-- Use -->
<div class="bullet-list">
  <div class="bullet-item">Achievement 1</div>
  <div class="bullet-item">Achievement 2</div>
</div>
```

```css
.bullet-item {
  padding-left: var(--spacing-md);
  position: relative;
}
.bullet-item::before {
  content: '\2022'; /* bullet character */
  position: absolute;
  left: 0;
}
```

### Pitfall 4: Missing Font Fallback

**What goes wrong:** Template specifies custom font but PDF renders with different font
**Why it happens:** Font not available on system, no fallback defined, font not embedded
**How to avoid:** Always specify system font stack as fallback; embed fonts for PDF/HTML output
**Warning signs:** Different rendering on different machines

**Solution:**
```css
/* Always include system fallbacks */
body {
  font-family: 'Custom Font', Arial, Helvetica, sans-serif;
}
```

### Pitfall 5: A4 Page Dimensions Not Applied

**What goes wrong:** HTML preview doesn't show page boundaries; PDF has wrong dimensions
**Why it happens:** CSS page dimensions only apply to print/PDF context, not screen preview
**How to avoid:** Use fixed dimensions for preview container; @page rule for print
**Warning signs:** Resume looks different in browser vs PDF

**Solution:**
```css
/* For HTML preview */
.cv-page {
  width: 210mm;
  height: 297mm;
  padding: var(--page-margin);
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  margin: 20px auto;
}

/* For PDF/print */
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  .cv-page {
    box-shadow: none;
    margin: 0;
  }
}
```

### Pitfall 6: Empty Section Rendering

**What goes wrong:** Template renders empty section headers for missing data
**Why it happens:** Template checks for existence but not emptiness of arrays
**How to avoid:** Check both existence AND length of arrays before rendering sections
**Warning signs:** "Work Experience" heading with no content below it

**Solution:**
```jinja
{# Check both existence AND non-empty #}
{% if experience and experience | length > 0 %}
  <section>
    <h2>{{ 'experience' | sectionHeader(locale) }}</h2>
    {% for job in experience %}
      ...
    {% endfor %}
  </section>
{% endif %}
```

## Code Examples

Verified patterns from official sources:

### Base Template Structure
```jinja
{# Source: CONTEXT.md + Nunjucks templating.html #}
<!DOCTYPE html>
<html lang="{{ locale }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ contact.name }} - CV</title>
  <style>
    {% block styles %}
    {{ css | safe }}
    {% endblock %}
  </style>
</head>
<body>
  <div class="cv-page">
    {# Contact in body, not header - ATS-02 #}
    <header class="contact">
      <h1>{{ contact.name }}</h1>
      {% block contact_details %}
      <div class="contact-info">
        {% if contact.email %}<span>{{ contact.email }}</span>{% endif %}
        {% if contact.phone %}<span>{{ contact.phone }}</span>{% endif %}
        {% if contact.location %}<span>{{ contact.location }}</span>{% endif %}
      </div>
      {% if contact.links and contact.links | length > 0 %}
      <div class="contact-links">
        {% for link in contact.links %}
        <a href="{{ link.url }}">{{ link.label or link.type }}</a>
        {% endfor %}
      </div>
      {% endif %}
      {% endblock %}
    </header>

    <main>
      {% block summary %}
      {% if summary %}
      <section class="summary">
        <h2>{{ 'summary' | sectionHeader(locale) }}</h2>
        <p>{{ summary | md | safe }}</p>
      </section>
      {% endif %}
      {% endblock %}

      {% block experience %}
      {% if experience and experience | length > 0 %}
      <section class="experience">
        <h2>{{ 'experience' | sectionHeader(locale) }}</h2>
        {% for job in experience %}
        <article class="experience-entry">
          <div class="entry-header">
            <h3>{{ job.role }} at {{ job.company }}</h3>
            <span class="date-range">{{ job.startDate | formatDate(locale) }} - {{ job.endDate | formatDate(locale) }}</span>
          </div>
          {% if job.location %}<div class="location">{{ job.location }}</div>{% endif %}
          {% if job.bullets and job.bullets | length > 0 %}
          <div class="bullet-list">
            {% for bullet in job.bullets %}
            <div class="bullet-item">{{ bullet | md | safe }}</div>
            {% endfor %}
          </div>
          {% endif %}
        </article>
        {% endfor %}
      </section>
      {% endif %}
      {% endblock %}

      {% block education %}
      {% if education and education | length > 0 %}
      <section class="education">
        <h2>{{ 'education' | sectionHeader(locale) }}</h2>
        {% for edu in education %}
        <article class="education-entry">
          <h3>{{ edu.degree }}{% if edu.field %}, {{ edu.field }}{% endif %}</h3>
          <div>{{ edu.institution }}</div>
          <div class="date-range">{{ edu.startDate | formatDate(locale) }} - {{ edu.endDate | formatDate(locale) }}</div>
          {% if edu.honors %}<div class="honors">{{ edu.honors }}</div>{% endif %}
        </article>
        {% endfor %}
      </section>
      {% endif %}
      {% endblock %}

      {% block skills %}
      {% if skills and skills | length > 0 %}
      <section class="skills">
        <h2>{{ 'skills' | sectionHeader(locale) }}</h2>
        {% for category in skills %}
        <div class="skill-category">
          <h3>{{ category.name }}</h3>
          <div class="skill-list">
            {% for skill in category.skills %}
            <span class="skill">{{ skill.name }}{% if skill.level %} ({{ skill.level }}){% endif %}</span>
            {% endfor %}
          </div>
        </div>
        {% endfor %}
      </section>
      {% endif %}
      {% endblock %}
    </main>
  </div>
</body>
</html>
```

### Render Function
```typescript
// Source: Nunjucks api.html + project patterns
import nunjucks from 'nunjucks';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CVData } from '@gottz/cv-core';

export interface RenderOptions {
  templateId: string;
  locale: string;
}

export interface RenderResult {
  html: string;
  locale: string;
  templateId: string;
}

export async function renderCV(
  cv: CVData,
  options: RenderOptions,
  env: nunjucks.Environment,
  templatesDir: string
): Promise<RenderResult> {
  const { templateId, locale } = options;

  // Load CSS for template
  const cssPath = path.join(templatesDir, templateId, 'styles.css');
  const css = await readFile(cssPath, 'utf-8');

  // Resolve localized content
  const context = {
    contact: cv.contact,
    summary: cv.summary?.[locale],
    experience: cv.experience?.[locale] ?? [],
    education: cv.education?.[locale] ?? [],
    skills: cv.skills?.[locale] ?? [],
    locale,
    css
  };

  // Render template
  const templatePath = `${templateId}/template.njk`;
  const html = env.render(templatePath, context);

  return { html, locale, templateId };
}
```

### Template Config Schema
```typescript
// Source: CONTEXT.md decisions
export interface TemplateConfig {
  name: string;
  description: string;

  // ATS compliance flags
  atsCompliant?: boolean;
  singleColumn?: boolean;

  // Optional section header overrides
  sectionHeaders?: {
    [locale: string]: {
      [section: string]: string;
    };
  };

  // Optional preview image
  preview?: string;
}

// Example config.json
const exampleConfig: TemplateConfig = {
  name: "Base",
  description: "Clean, ATS-optimized base template with semantic HTML structure",
  atsCompliant: true,
  singleColumn: true,
  sectionHeaders: {
    en: {
      experience: "Professional Experience"  // Override default
    }
  }
};
```

### CSS Base Styles
```css
/* Source: CONTEXT.md + ATS requirements */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --font-heading: Arial, Helvetica, sans-serif;
  --font-body: Arial, Helvetica, sans-serif;
  --font-size-name: 24pt;
  --font-size-section: 14pt;
  --font-size-subsection: 12pt;
  --font-size-body: 11pt;

  --color-heading: #1a1a1a;
  --color-body: #333333;
  --color-accent: #2563eb;
  --color-muted: #666666;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --page-width: 210mm;
  --page-height: 297mm;
  --page-margin: 20mm;
}

body {
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  color: var(--color-body);
  line-height: 1.4;
}

.cv-page {
  width: var(--page-width);
  min-height: var(--page-height);
  padding: var(--page-margin);
  background: white;
  margin: 0 auto;
}

/* Semantic headings - ATS-05 */
h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-name);
  color: var(--color-heading);
  margin-bottom: var(--spacing-sm);
}

h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-section);
  color: var(--color-heading);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-muted);
  padding-bottom: var(--spacing-xs);
}

h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-subsection);
  color: var(--color-heading);
}

/* Contact - in body, not header - ATS-02 */
.contact {
  margin-bottom: var(--spacing-lg);
}

.contact-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  color: var(--color-muted);
  font-size: var(--font-size-body);
}

.contact-info span:not(:last-child)::after {
  content: '|';
  margin-left: var(--spacing-sm);
}

.contact-links {
  margin-top: var(--spacing-xs);
}

.contact-links a {
  color: var(--color-accent);
  text-decoration: none;
  margin-right: var(--spacing-md);
}

.contact-links a:hover {
  text-decoration: underline;
}

/* Single column layout - ATS-03, TMPL-01 */
main {
  display: flex;
  flex-direction: column;
}

section {
  margin-bottom: var(--spacing-lg);
}

/* Experience entries */
.experience-entry,
.education-entry {
  margin-bottom: var(--spacing-md);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
}

.date-range {
  color: var(--color-muted);
  font-size: var(--font-size-body);
}

.location {
  color: var(--color-muted);
  font-size: var(--font-size-body);
}

/* CSS bullets (not <ul><li>) - per CONTEXT.md */
.bullet-list {
  margin-top: var(--spacing-sm);
}

.bullet-item {
  padding-left: var(--spacing-md);
  position: relative;
  margin-bottom: var(--spacing-xs);
}

.bullet-item::before {
  content: '\2022';
  position: absolute;
  left: 0;
  color: var(--color-body);
}

/* Skills */
.skill-category {
  margin-bottom: var(--spacing-sm);
}

.skill-category h3 {
  font-size: var(--font-size-body);
  margin-bottom: var(--spacing-xs);
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.skill {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-body);
}

/* Print styles */
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  body {
    background: white;
  }

  .cv-page {
    box-shadow: none;
    page-break-after: always;
  }

  section {
    page-break-inside: avoid;
  }

  .experience-entry,
  .education-entry {
    page-break-inside: avoid;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js for dates | dayjs (drop-in replacement) | 2020+ | 2KB vs 67KB, same API |
| SCSS/Less preprocessors | CSS custom properties | 2020+ | No build step, runtime theming |
| Icon fonts for bullets | CSS pseudo-elements | 2018+ | No font loading, better ATS |
| `<ul><li>` bullet lists | Styled divs | 2020+ | ATS compatibility, styling control |
| Separate i18n library | Simple translation objects | N/A | For resume use case, objects suffice |
| Full react-intl | Template filters | N/A | Nunjucks filters simpler for static render |

**Deprecated/outdated:**
- **moment.js:** In maintenance mode; use dayjs
- **nunjucks-date-filter (moment-based):** Works but pulls in moment.js; write dayjs filter
- **`<table>` for layout:** ATS parsers struggle; use flexbox

## Open Questions

Things that couldn't be fully resolved:

1. **CSS Delivery Method for PDF/DOCX Conversion**
   - What we know: PDF via Puppeteer renders HTML+CSS fine; DOCX doesn't support CSS
   - What's unclear: Whether to inline all CSS in `<style>` tags or keep separate file
   - Recommendation: Inline in `<style>` for self-contained HTML; DOCX phase will need separate approach

2. **Font Embedding Strategy**
   - What we know: Base64 embedding in CSS works for self-contained files
   - What's unclear: Build step to convert woff2 to base64, or runtime conversion
   - Recommendation: Build step in Phase 3 (HTML Output) since this affects final output, not template rendering

3. **Per-Template Custom Filters (filters.js)**
   - What we know: CONTEXT.md allows per-template filters.js file
   - What's unclear: Exact loading mechanism, sandboxing, TypeScript support
   - Recommendation: Implement in separate task after core engine; load with dynamic import if present

4. **Template Validation CLI Command**
   - What we know: CONTEXT.md specifies `cv-gen validate-template <name>`
   - What's unclear: Full validation criteria
   - Recommendation: Defer to Phase 6 (CLI Commands); core engine just needs to work

## Sources

### Primary (HIGH confidence)
- [Nunjucks API Documentation](https://mozilla.github.io/nunjucks/api.html) - Environment, filters, loaders
- [Nunjucks Templating Reference](https://mozilla.github.io/nunjucks/templating.html) - Syntax, inheritance, built-in filters
- [Marked Documentation](https://marked.js.org/) - Markdown rendering, already in stack

### Secondary (MEDIUM confidence)
- [dayjs Documentation](https://day.js.org/) - Date formatting alternative to moment.js
- [CSS-Tricks Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) - Single-column layout
- [MDN @page Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@page/size) - A4 print dimensions
- [Pat David - Embedding Fonts with Base64](https://patdavid.net/2012/08/embedding-fonts-with-css-and-base64/) - Font embedding pattern

### Tertiary (LOW confidence)
- [nunjucks-i18n GitHub](https://github.com/SamyPesse/nunjucks-i18n) - Reference for i18n patterns (not using directly)
- WebSearch results for ATS HTML structure - Confirmed semantic HTML best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Nunjucks verified with official docs, dayjs well-established
- Architecture: HIGH - Based on CONTEXT.md decisions and Nunjucks patterns
- Pitfalls: HIGH - Based on official documentation and project-specific decisions

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable tooling, Nunjucks 3.2.4 unchanged since 2023)
