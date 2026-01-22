---
phase: 02-template-engine
plan: 01
status: complete
completed: 2026-01-22
duration: ~5 minutes

subsystem: templates
tags: [typescript, i18n, nunjucks, package-scaffold]

dependency-graph:
  requires:
    - 01-foundation-data-schema
  provides:
    - "@gottz/cv-templates package"
    - "TemplateConfig, RenderOptions, RenderResult types"
    - "EN/DE section header translations"
  affects:
    - 02-02 (engine core)
    - 02-03 (template discovery)

tech-stack:
  added:
    - nunjucks: "^3.2.4"
    - dayjs: "^1.11.13"
    - "@types/nunjucks": "^3.2.6"
  patterns:
    - "Type-first development"
    - "Locale fallback chain"

key-files:
  created:
    - packages/templates/package.json
    - packages/templates/tsconfig.json
    - packages/templates/src/index.ts
    - packages/templates/src/types.ts
    - packages/templates/src/i18n/index.ts
    - packages/templates/src/i18n/en.ts
    - packages/templates/src/i18n/de.ts
    - templates/base/config.json
    - templates/base/template.njk
  modified: []

decisions:
  - id: i18n-fallback-chain
    choice: "Locale fallback to English, then to section key"
    why: "Graceful degradation for unknown locales or missing translations"
  - id: section-keys
    choice: "Lowercase canonical keys (summary, experience, education, skills)"
    why: "Consistent with parser section type normalization from Phase 1"

metrics:
  tasks-completed: 3
  tasks-total: 3
  commits: 3
  files-created: 9
  files-modified: 1
---

# Phase 02 Plan 01: Package Scaffold and Types Summary

**One-liner:** @gottz/cv-templates package with TypeScript interfaces and EN/DE i18n translations using locale fallback chain.

## What Was Built

### Package Structure
- Created `@gottz/cv-templates` package in monorepo
- Dependencies: nunjucks ^3.2.4, dayjs ^1.11.13, @gottz/cv-core workspace link
- TypeScript configuration extending root tsconfig

### Type Definitions
- **TemplateConfig**: Template metadata (name, description, atsCompliant, singleColumn, sectionHeaders overrides, preview)
- **DiscoveredTemplate**: Resolved template with id, config, templatePath, stylesPath
- **RenderOptions**: Rendering parameters (templateId, locale)
- **RenderResult**: Output (html, locale, templateId)

### i18n System
- English translations: Summary, Work Experience, Education, Skills, Projects, Certifications
- German translations: Zusammenfassung, Berufserfahrung, Ausbildung, Kenntnisse, Projekte, Zertifizierungen
- `getSectionHeader(section, locale)` helper with fallback chain:
  1. Try requested locale
  2. Fall back to English
  3. Fall back to section key as-is

### Base Template Assets
- `templates/base/config.json`: Base template configuration with ATS compliance flags
- `templates/base/template.njk`: Nunjucks template with semantic HTML structure

## Commits

| Hash | Type | Description |
|------|------|-------------|
| b9078a1 | feat | Scaffold @gottz/cv-templates package |
| bb86414 | feat | Define template types and interfaces |
| 54fa16c | feat | Implement i18n section header translations |

## Verification Results

```
bun run typecheck  # Pass
bun run lint       # Pass
getSectionHeader('experience', 'de')  # Returns "Berufserfahrung"
```

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 02-02:** Engine core can now:
- Import types from @gottz/cv-templates
- Use getSectionHeader for localized section titles
- Reference TemplateConfig for template metadata structure
- Use RenderOptions/RenderResult for rendering API

**Dependencies satisfied:**
- [x] Package exists and compiles
- [x] Types exported
- [x] i18n translations available
