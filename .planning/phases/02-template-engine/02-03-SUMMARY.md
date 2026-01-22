---
phase: 02-template-engine
plan: 03
status: complete
completed: 2026-01-22
subsystem: template-engine
tags: [nunjucks, filters, dayjs, marked, rendering]

dependencies:
  requires: [02-01, 02-02]
  provides: [renderCV, template-filters, template-loader]
  affects: [03-html-output, 04-pdf-output, 05-docx-output, 06-cli-commands]

tech-stack:
  added: [marked]
  patterns: [nunjucks-filters, filesystem-loader, locale-context-flattening]

key-files:
  created:
    - packages/templates/src/engine/filters.ts
    - packages/templates/src/engine/index.ts
    - packages/templates/src/engine/loader.ts
    - packages/templates/src/render.ts
  modified:
    - packages/templates/src/index.ts
    - packages/templates/package.json
    - package.json

decisions:
  - id: marked-for-markdown
    choice: "Use marked library for markdown rendering"
    rationale: "Lightweight, GFM support, parseInline to avoid <p> wrapping"
  - id: safestring-for-html
    choice: "Return SafeString from md filters"
    rationale: "Per RESEARCH.md Pitfall 1: bypass autoescape for rendered HTML"
  - id: locale-context-flattening
    choice: "Flatten Localized<T> to T in template context"
    rationale: "Template receives only data for requested locale, simpler template logic"
  - id: bun-types-global
    choice: "Add @types/bun to root package.json"
    rationale: "Enables node: protocol imports across all packages"

metrics:
  duration: ~3m
  tasks_completed: 3
  commits: 3
---

# Phase 2 Plan 3: Template Engine Core Summary

Nunjucks filters, loader, and renderCV function wired - HTML rendering from CVData operational.

## What Was Built

### Custom Nunjucks Filters (filters.ts)

1. **formatDate** - Formats ISO dates ("2024-01") to display format ("Jan 2024")
   - Handles "present"/"heute"/"current" for ongoing positions
   - Locale-aware: returns "heute" for German locale

2. **dateRange** - Combines start/end dates with separator

3. **md** - Inline markdown rendering using marked.parseInline
   - Returns SafeString to bypass autoescape
   - Avoids `<p>` wrapping for bullets

4. **mdBlock** - Block markdown for multi-paragraph content

5. **sectionHeader** - Localized section headers via i18n system

### Template Loader (loader.ts)

- **discoverTemplates()** - Scans /templates/ for directories with config.json
- **getTemplate()** - Retrieves specific template by ID
- Fail-fast on malformed config.json per CONTEXT.md

### Nunjucks Environment (index.ts)

- FileSystemLoader with templates directory root
- Configured options: autoescape, trimBlocks, lstripBlocks
- Custom filters auto-registered

### Render Function (render.ts)

- **renderCV()** - Main entry point for CV-to-HTML rendering
- **createRenderer()** - Factory for batch rendering efficiency
- Flattens Localized<T> to T for requested locale
- Logs warnings for missing translations

## Integration Test Results

```
Discovered templates: [ "base" ]
Rendered HTML length: 11545
Contains h1: true
Contains h2: true
No tables: true
```

English section headers: Summary, Work Experience, Education, Skills
German section headers: Zusammenfassung, Berufserfahrung, Ausbildung, Kenntnisse

## Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create custom Nunjucks filters | 96fe9df | engine/filters.ts |
| 2 | Create environment and loader | 6b22702 | engine/index.ts, engine/loader.ts |
| 3 | Create renderCV and wire exports | f49956c | render.ts, index.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @types/bun for Node.js type support**
- **Found during:** Task 2
- **Issue:** TypeScript couldn't find `node:fs/promises` and `node:path` modules
- **Fix:** Added `@types/bun` to root package.json devDependencies
- **Files modified:** package.json, bun.lock
- **Commit:** 6b22702

**2. [Rule 3 - Blocking] Added marked dependency**
- **Found during:** Task 1
- **Issue:** marked was specified in plan but not in package.json
- **Fix:** Added `marked: ^17.0.0` to @gottz/cv-templates dependencies
- **Files modified:** packages/templates/package.json, bun.lock
- **Commit:** 96fe9df

## API Surface

```typescript
// From @gottz/cv-templates

// Render functions
export async function renderCV(
  cv: CVData,
  options: RenderOptions,
  templatesDir: string
): Promise<RenderResult>

export function createRenderer(templatesDir: string): (
  cv: CVData,
  options: RenderOptions
) => Promise<RenderResult>

// Template discovery
export async function discoverTemplates(
  templatesDir: string
): Promise<DiscoveredTemplate[]>

export async function getTemplate(
  templatesDir: string,
  templateId: string
): Promise<DiscoveredTemplate>

// Environment
export function createTemplateEnvironment(
  templatesDir: string
): nunjucks.Environment
```

## Next Phase Readiness

Phase 2 complete. Ready for:

- **Phase 3 (HTML Output):** renderCV produces complete HTML string for file output
- **Phase 4 (PDF Output):** HTML can be fed to Puppeteer for PDF generation
- **Phase 5 (DOCX Output):** HTML structure can guide DOCX document building

## Requirements Coverage

| Requirement | Status |
|------------|--------|
| TMPL-01 (Nunjucks templating) | Complete |
| TMPL-02 (Multiple templates) | Foundation ready (loader discovers any template) |
| i18n-01 (Localized headers) | Complete via sectionHeader filter |
| i18n-02 (Date formatting) | Complete via formatDate filter |

## Files Reference

- `/workspace/packages/templates/src/engine/filters.ts` - Custom filter registration
- `/workspace/packages/templates/src/engine/index.ts` - Environment creation and exports
- `/workspace/packages/templates/src/engine/loader.ts` - Template discovery
- `/workspace/packages/templates/src/render.ts` - renderCV and createRenderer
- `/workspace/packages/templates/src/index.ts` - Package exports
