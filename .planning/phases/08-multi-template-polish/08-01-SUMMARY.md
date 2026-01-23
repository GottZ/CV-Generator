---
phase: "08"
plan: "01"
subsystem: "templates"
tags: ["nunjucks", "css", "template-loader", "json-schema"]

dependency-graph:
  requires: ["02-02", "02-03"]
  provides: ["_shared/macros", "_shared/partials", "TemplateConfig.private", "template-config.schema.json"]
  affects: ["08-02", "08-03", "08-04", "08-05"]

tech-stack:
  added: []
  patterns: ["nunjucks-macros", "css-partials", "json-schema-validation", "underscore-prefix-convention"]

key-files:
  created:
    - templates/_shared/macros/contact.njk
    - templates/_shared/macros/section.njk
    - templates/_shared/macros/entry.njk
    - templates/_shared/partials/_reset.css
    - templates/_shared/partials/_print.css
    - templates/_shared/partials/_theme.css
    - schemas/template-config.schema.json
  modified:
    - packages/templates/src/engine/loader.ts
    - packages/templates/src/types.ts
    - templates/base/config.json

decisions:
  - id: "underscore-prefix-skip"
    choice: "Skip directories starting with underscore in discoverTemplates"
    rationale: "Standard convention for private resources; _shared contains utilities, not standalone templates"

  - id: "private-flag-filter"
    choice: "Filter templates with private: true from discovery but allow direct getTemplate access"
    rationale: "Private templates can still be used programmatically; only hidden from list-templates"

  - id: "macro-caller-pattern"
    choice: "Section macro uses caller() pattern for content injection"
    rationale: "Allows templates to pass section content while macro handles wrapper and heading"

  - id: "css-partials-fallbacks"
    choice: "CSS partials use fallback values in var() calls"
    rationale: "Partials work standalone but integrate with template custom properties when available"

metrics:
  duration: "~10 minutes"
  completed: "2026-01-23"
---

# Phase 8 Plan 1: Shared Template Infrastructure Summary

Nunjucks macros for contact, section, and entry components; CSS partials for reset, print, and theme; loader updates for private templates; JSON Schema for IDE autocomplete.

## What Was Built

### Nunjucks Macros (templates/_shared/macros/)

**contact.njk**
- Renders name, contact info, and links in header block
- Accepts contactData and locale parameters
- Outputs semantic HTML with contact-item and contact-link classes

**section.njk**
- Section wrapper with localized heading via sectionHeader filter
- Uses caller() pattern for content injection
- Accepts sectionType, locale, and optional className

**entry.njk**
- Four entry macros: experienceEntry, educationEntry, projectEntry, certificationEntry
- Each renders appropriate fields with date formatting and markdown support
- Consistent CSS class naming (entry, entry-header, entry-title, date-range)

### CSS Partials (templates/_shared/partials/)

**_reset.css**
- Box-sizing border-box for all elements
- Margin/padding reset
- Link color inheritance and hover underline

**_print.css**
- @page A4 portrait with zero margins
- Print-specific layout adjustments (no shadow, full width)
- Page break control for sections and entries
- Hide theme toggle in print

**_theme.css**
- Theme toggle button with system/light/dark icon display
- Dark mode CSS custom properties (prefers-color-scheme media query)
- Explicit dark mode via data-theme attribute
- Fallback values for standalone use

### Loader Updates (packages/templates/src/engine/loader.ts)

- Skip directories starting with underscore (e.g., _shared)
- Skip templates with `private: true` in config.json
- Validation still runs before private check (fail fast on malformed config)

### Type Updates (packages/templates/src/types.ts)

Added to TemplateConfig interface:
- `private?: boolean` - Hide from list-templates
- `minVersion?: string` - Minimum cvgen version required
- `style?: { ... }` - Style configuration block
- `locales?: { ... }` - Locale-specific configuration

### JSON Schema (schemas/template-config.schema.json)

- Full schema for template config.json files
- Validates all TemplateConfig fields
- Hex color pattern validation for style.colors
- Margins as enum or numeric mm value
- IDE autocomplete support via $schema reference

## Commits

| Hash | Description |
|------|-------------|
| f926599 | feat(08-01): add shared Nunjucks macros for template components |
| 3a08a82 | feat(08-01): add shared CSS partials for reset, print, and theme |
| c559ebb | feat(08-01): update loader to skip _shared and handle private flag |
| 4248fad | feat(08-01): add JSON Schema for template config.json |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. `ls templates/_shared/macros/` - contact.njk, section.njk, entry.njk present
2. `ls templates/_shared/partials/` - _reset.css, _print.css, _theme.css present
3. `bun run typecheck` - Passes with no errors
4. `list-templates` - Shows only "base" template, _shared not visible
5. Private template test - Template with `private: true` correctly hidden
6. Base template - Still loads and renders correctly

## Next Phase Readiness

**Ready for 08-02 (Modern Template):**
- Shared macros available for import
- CSS partials can be included
- TemplateConfig.style fields ready for style customization
- JSON Schema provides autocomplete for new template config.json

**Dependencies satisfied:**
- _shared/macros/contact.njk - Contact block macro
- _shared/macros/section.njk - Section wrapper with caller()
- _shared/macros/entry.njk - All entry type macros
- Loader correctly skips _shared directory
