---
phase: "08"
plan: "04"
subsystem: "templates"
tags: ["nunjucks", "css", "classic-template", "business-formal"]

dependency-graph:
  requires: ["08-01"]
  provides: ["templates/classic"]
  affects: ["08-06"]

tech-stack:
  added: []
  patterns: ["mixed-font-pairing", "double-rule-headers", "centered-contact"]

key-files:
  created:
    - templates/classic/config.json
    - templates/classic/template.njk
    - templates/classic/styles.css
  modified: []

decisions:
  - id: "classic-double-rule"
    choice: "Use thin top border + thick bottom border for section headers"
    rationale: "Traditional business document styling that communicates professionalism"

  - id: "classic-mixed-fonts"
    choice: "Times New Roman for headings, Arial for body text"
    rationale: "Classic serif/sans-serif pairing common in formal documents"

  - id: "classic-justified-summary"
    choice: "Use justified text alignment for summary section"
    rationale: "Traditional newspaper/book style appropriate for conservative industries"

metrics:
  duration: "~5 minutes"
  completed: "2026-01-23"
---

# Phase 8 Plan 4: Classic Template Summary

Traditional business formal template with Times New Roman/Arial mixed font pairing, double-rule section headers, and centered contact layout for corporate environments.

## What Was Built

### config.json

Template configuration with Classic signature:
- Name: "Classic"
- Deep blue accent: #1e40af (traditional, professional)
- Mixed fonts: Times New Roman headings, Arial body
- Normal margins: 20mm (compact but readable)
- ATS-compliant: true

### template.njk

Nunjucks template importing shared macros:
- `{% from "../_shared/macros/entry.njk" import experienceEntry, educationEntry, projectEntry, certificationEntry %}`
- Body class "classic" for CSS scoping
- Centered contact header layout
- Full CV sections: summary, experience, education, projects, skills, certifications
- Theme toggle for light/dark/system mode support

### styles.css

Comprehensive stylesheet implementing Classic design language:

**Typography:**
- Heading font: 'Times New Roman', Times, serif
- Body font: Arial, Helvetica, sans-serif
- Name: 22pt uppercase with letter-spacing
- Sections: 13pt uppercase
- Body: 10.5pt

**Layout:**
- Page margin: 20mm (var(--page-margin))
- Centered contact header with thick bottom border
- Double-rule section headers (thin top, thick bottom)
- Justified summary text

**Visual Elements:**
- Deep blue accent (#1e40af)
- Bordered skill pills (background + border)
- Bordered tech tags
- Traditional bullet points
- 50% border-radius for oval photo
- Conservative color palette

**Theme Support:**
- System preference detection
- Explicit light/dark mode via data-theme attribute
- Print optimization with page break controls

## Commits

| Hash | Description |
|------|-------------|
| 16cd3d4 | feat(08-04): add Classic template config.json |
| aa198e9 | feat(08-04): add Classic template.njk with shared macros |
| 32feeb6 | feat(08-04): add Classic template styles.css |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. `ls templates/classic/` - config.json, template.njk, styles.css present
2. `cat templates/classic/config.json | jq .name` - Returns "Classic"
3. `list-templates` - Classic appears with correct description
4. `build testuser classic --format html` - Template renders successfully
5. CSS verification:
   - `--page-margin: 20mm` confirmed
   - `--font-heading: 'Times New Roman', Times, serif` confirmed
   - `--font-body: Arial, Helvetica, sans-serif` confirmed
   - `.contact { text-align: center; }` confirmed

## Next Phase Readiness

**Ready for 08-05 (Accent Color Override):**
- Classic template provides #1e40af as base accent color
- CSS custom properties ready for override
- config.json style.accentColor can be modified

**Dependencies satisfied:**
- templates/classic/ directory complete
- Template discoverable via loader
- ATS-compliant design verified
