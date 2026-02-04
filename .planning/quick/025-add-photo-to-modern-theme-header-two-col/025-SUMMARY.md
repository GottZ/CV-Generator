---
phase: quick-025
plan: 01
subsystem: templates
tags: [css, nunjucks, photo, header, modern-theme]
dependency-graph:
  requires: []
  provides: [photo-support, two-column-header]
  affects: []
tech-stack:
  added: []
  patterns: [conditional-template-layout, css-grid]
key-files:
  created: []
  modified:
    - packages/core/src/schema/contact.ts
    - packages/core/src/parser/frontmatter.ts
    - packages/templates/src/render.ts
    - templates/modern/template.njk
    - templates/modern/styles.css
decisions:
  - id: photo-field-type
    choice: "Optional string path (relative to person directory)"
    rationale: "Consistent with other path-based fields, embedImages processor handles conversion"
  - id: two-column-layout
    choice: "CSS Grid with 1fr auto columns"
    rationale: "Photo column auto-sizes, content column takes remaining space"
  - id: graceful-degradation
    choice: "Conditional template rendering with original layout fallback"
    rationale: "Existing CVs without photo continue to work unchanged"
metrics:
  duration: "2m 29s"
  completed: "2026-02-04"
---

# Quick Task 025: Add Photo to Modern Theme Header (Two-Column) Summary

Photo support for modern theme with two-column header layout using CSS Grid and conditional Nunjucks template rendering.

## Changes Made

### 1. Contact Type and Parser Updates

**File: `packages/core/src/schema/contact.ts`**
- Added optional `photo?: string` field to Contact interface
- JSDoc: "Optional photo path (relative to person directory)"

**File: `packages/core/src/parser/frontmatter.ts`**
- Extract `photo` field from YAML frontmatter
- Added after `slug` field in contact object construction

**File: `packages/templates/src/render.ts`**
- Pass `photo: cv.contact.photo` to template context
- Added in both `renderCV` and `createRenderer` functions
- Available as top-level `photo` variable in templates

### 2. Template Updates

**File: `templates/modern/template.njk`**
- Conditional two-column layout when `photo` exists
- Structure:
  - `.contact-header-grid` - CSS Grid container
  - `.contact-info-column` > `.contact-info-stacked` - Vertically stacked contact items
  - `.contact-links-stacked` - Vertically stacked links
  - `.contact-photo-column` - Photo on right side
- Original horizontal layout preserved when no photo (graceful degradation)

### 3. CSS Styles

**File: `templates/modern/styles.css`**
- `.contact-header-grid` - CSS Grid with `1fr auto` columns
- `.contact-info-stacked` - Flex column layout for contact items
- `.contact-links-stacked` - Flex column layout for links
- `.contact-photo-column .photo` - 100px width, auto height, 12px border-radius
- Print media query: 90px photo width, reduced gap

## Usage

Add photo field to CV frontmatter:
```yaml
---
name: John Doe
email: john@example.com
photo: ./images/photo.jpg
---
```

Photo path is relative to person directory. The `embedImages` processor converts it to a data URI for PDF embedding.

## Verification

1. Type check: Passes
2. Build without photo: Shows original horizontal layout (graceful degradation)
3. Build with photo: Shows two-column layout with photo on right
4. Photo sizing: 100px screen, 90px print
5. Print CSS: Proper print-color-adjust for photo rendering

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add photo field to Contact type and parser | 7037597 |
| 2 | Update modern template with two-column header | dbca0ec |
| 3 | Add CSS for two-column header layout | 63d2561 |

## Deviations from Plan

None - plan executed exactly as written.
