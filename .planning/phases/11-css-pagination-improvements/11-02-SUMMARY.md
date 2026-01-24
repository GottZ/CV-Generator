---
phase: 11-css-pagination-improvements
plan: 02
subsystem: templates
tags: [nunjucks, pagination, long-entries, conditional-class]

dependency-graph:
  requires: []
  provides: [LONG-ENTRY-DETECTION]
  affects: [11-03, print-pagination]

tech-stack:
  patterns: [nunjucks-filters, conditional-classes]

key-files:
  modified:
    - templates/_shared/macros/entry.njk

decisions:
  - id: experience-threshold
    choice: 15+ bullets triggers long-entry class for experience entries
    rationale: Conservative threshold; most entries stay atomic, only truly long lists get break-inside:auto
  - id: project-threshold
    choice: 10+ tech stack items triggers long-entry class for project entries
    rationale: Projects rarely have extensive bullet lists; tech stack count indicates complexity

metrics:
  duration: ~5 minutes
  completed: 2026-01-24
---

# Phase 11 Plan 02: Long Entry Class Detection Summary

**One-liner:** Added Nunjucks conditionals to `entry.njk` to mark long entries with `.long-entry` class, enabling CSS to allow page breaks within very long bullet lists while keeping individual bullets atomic.

## What Was Done

### Task 1: Add long-entry class detection to experienceEntry macro

Modified line 3 of `templates/_shared/macros/entry.njk`:

**Before:**
```nunjucks
<article class="entry experience-entry">
```

**After:**
```nunjucks
<article class="entry experience-entry{% if job.bullets and job.bullets | length >= 15 %} long-entry{% endif %}">
```

This uses Nunjucks' `length` filter to count bullet points. Entries with 15+ bullets receive the `.long-entry` class, which triggers the existing CSS rule:
```css
.entry.long-entry {
  break-inside: auto;
  page-break-inside: auto;
}
```

**Commit:** 2d06bcc

### Task 2: Add long-entry class detection to projectEntry macro

Modified line 42 of `templates/_shared/macros/entry.njk`:

**Before:**
```nunjucks
<article class="entry project-entry{% if project.highlight %} highlighted{% endif %}">
```

**After:**
```nunjucks
<article class="entry project-entry{% if project.highlight %} highlighted{% endif %}{% if project.techStack and project.techStack | length >= 10 %} long-entry{% endif %}">
```

Projects with 10+ tech stack items indicate complex, multi-faceted projects that may benefit from internal page breaks.

**Commit:** abf9af0

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| Template syntax is valid Nunjucks | PASS |
| experienceEntry has conditional long-entry class | PASS |
| projectEntry has conditional long-entry class | PASS |
| grep -c "long-entry" returns 2 | PASS |

## Design Rationale

From CONTEXT.md:
- "Very long single entries (15+ bullets): keep job header + first bullets together, break within bullet list"
- "Individual bullet points are atomic - never break mid-bullet"

The thresholds are conservative:
- **Experience entries: 15 bullets** - Most job entries have 3-8 bullets; only truly extensive entries qualify
- **Project entries: 10 tech stack items** - Complex projects may have many technologies listed

The existing `_print.css` already has:
- `.entry.long-entry { break-inside: auto; }` - allows internal breaks
- `.bullet-item { break-inside: avoid; }` - keeps individual bullets atomic

This combination allows page breaks BETWEEN bullets but never IN THE MIDDLE of a single bullet.

## Files Changed

| File | Change |
|------|--------|
| templates/_shared/macros/entry.njk | Added conditional .long-entry class to experienceEntry and projectEntry macros |

## Next Steps

Plan 11-02 complete. Ready for subsequent pagination plans that may add additional rules or test the long-entry behavior.
