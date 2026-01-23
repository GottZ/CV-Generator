---
phase: "08"
plan: "03"
subsystem: "templates"
tags: ["nunjucks", "css", "minimal", "serif", "print-optimized"]

dependency-graph:
  requires: ["08-01"]
  provides: ["templates/minimal"]
  affects: ["08-06"]

tech-stack:
  added: []
  patterns: ["wide-margins", "serif-typography", "en-dash-bullets", "inline-skills"]

key-files:
  created:
    - templates/minimal/config.json
    - templates/minimal/template.njk
    - templates/minimal/styles.css
  modified: []

decisions:
  - id: "minimal-wide-margins"
    choice: "30mm page margins for pen annotations"
    rationale: "Minimal template designed for printing and physical note-taking during interviews"

  - id: "minimal-single-font"
    choice: "Times New Roman for both headings and body"
    rationale: "Classic serif font throughout creates cohesive, traditional aesthetic"

  - id: "minimal-en-dash-bullets"
    choice: "En-dash (\\2013) bullets instead of circles"
    rationale: "More subtle, typographically refined bullet style for minimal aesthetic"

  - id: "minimal-inline-skills"
    choice: "Skills displayed inline with commas, not pills"
    rationale: "Cleaner look matching minimal design; no background colors"

  - id: "minimal-light-headers"
    choice: "font-weight: 400 for h1/h2 headers"
    rationale: "Light weight headers contribute to airy, open feel"

metrics:
  duration: "~8 minutes"
  completed: "2026-01-23"
---

# Phase 8 Plan 3: Minimal Template Summary

Times New Roman serif template with 30mm wide margins, en-dash bullets, inline comma-separated skills, hairline dividers, and print-optimized monochrome design.

## What Was Built

### config.json

```json
{
  "$schema": "../../schemas/template-config.schema.json",
  "name": "Minimal",
  "description": "Clean, spacious design with wide margins for annotations. Single font family, prints beautifully in monochrome.",
  "atsCompliant": true,
  "singleColumn": true,
  "style": {
    "accentColor": "#1a365d",
    "fontHeading": "'Times New Roman', Times, serif",
    "fontBody": "'Times New Roman', Times, serif",
    "margins": "wide"
  }
}
```

### template.njk

- Imports shared macros from `../_shared/macros/entry.njk`
- Body class `minimal` for CSS scoping
- Renders all CV sections: summary, experience, education, projects, skills, certifications
- Theme toggle with system/light/dark modes
- Semantic HTML structure matching ATS requirements

### styles.css

**Typography:**
- Times New Roman serif font throughout
- Light 400 weight for h1/h2 headers
- Italic date ranges and locations
- Uppercase section headers with 2px letter-spacing

**Layout:**
- 30mm wide margins for pen annotations
- Single-column flexbox layout
- Hairline (1px) section dividers

**Distinctive Features:**
- En-dash bullets (`\2013`) instead of circles
- Skills inline with commas (no pills/badges)
- Square photo (no border-radius)
- Subtle deep navy accent (#1a365d)
- Monochrome-friendly color scheme

**Theme Support:**
- System preference detection (prefers-color-scheme)
- Explicit light/dark modes via data-theme attribute
- Dark mode uses light blue accent (#63b3ed)

**Print Styles:**
- A4 portrait page size
- Page break avoidance for sections and entries
- Hidden theme toggle in print

## Commits

| Hash | Description |
|------|-------------|
| 211522c | feat(08-02): create Modern template config.json (included minimal config.json) |
| 951d97a | feat(08-03): create Minimal template.njk |
| 8734a65 | feat(08-05): add config cascade module (included minimal styles.css) |

## Deviations from Plan

None - plan executed exactly as written. Files were committed as part of parallel plan executions but content matches plan specifications exactly.

## Verification Results

1. `ls templates/minimal/` shows config.json, template.njk, styles.css
2. `cat templates/minimal/config.json | jq .name` returns "Minimal"
3. Template imports shared macros via `{% from "../_shared/macros/entry.njk" import ... %}`
4. CSS contains Minimal-specific values:
   - `--page-margin: 30mm`
   - `--font-heading: 'Times New Roman', Times, serif`
   - `--bullet-char: '\2013'`
5. Skills display inline with comma separators (`.skill:not(:last-child)::after { content: ',' }`)
6. Template is ATS-compliant (single-column, semantic HTML, standard fonts)

## Template Comparison

| Feature | Base | Minimal |
|---------|------|---------|
| Font | Arial (sans-serif) | Times New Roman (serif) |
| Margins | 20mm | 30mm |
| Header weight | 700 | 400 |
| Bullets | Circle (2022) | En-dash (2013) |
| Skills | Pills with background | Inline with commas |
| Section dividers | 1px solid | 1px solid (hairline) |
| Accent | Blue (#2563eb) | Deep navy (#1a365d) |
| Photo | Rounded | Square |

## Next Phase Readiness

**Ready for 08-06 (Template Integration Testing):**
- Minimal template complete and committed
- All three files (config, template, styles) in place
- Template uses shared macros correctly
- Template can be selected via `cvgen build <name> minimal`
