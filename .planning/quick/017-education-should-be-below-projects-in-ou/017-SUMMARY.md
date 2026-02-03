---
phase: quick-017
plan: 01
subsystem: templates
tags: [templates, nunjucks, section-order, layout]
dependency-graph:
  requires: []
  provides: [projects-before-education-order]
  affects: [all-cv-output]
tech-stack:
  added: []
  patterns: []
file-tracking:
  key-files:
    created: []
    modified:
      - templates/base/template.njk
      - templates/modern/template.njk
      - templates/classic/template.njk
      - templates/minimal/template.njk
decisions: []
metrics:
  duration: ~1m
  completed: 2026-02-03
---

# Quick Task 017: Education Below Projects Summary

**One-liner:** Reordered CV sections so Projects appears before Education in all templates.

## What Changed

Swapped the order of Projects and Education sections in all four template files.

**Previous order:**
1. Summary (Profile)
2. Experience
3. Education
4. Projects
5. Skills
6. Certifications

**New order:**
1. Summary (Profile)
2. Experience
3. Projects
4. Education
5. Skills
6. Certifications

## Files Modified

| File | Change |
|------|--------|
| `templates/base/template.njk` | Moved Projects section (lines 88-129) before Education section (lines 69-86) |
| `templates/modern/template.njk` | Swapped Projects and Education section blocks |
| `templates/classic/template.njk` | Swapped Projects and Education section blocks |
| `templates/minimal/template.njk` | Swapped Projects and Education section blocks |

## Verification

Built CVs with all three user-facing templates (modern, classic, minimal) and verified section order:

```
$ grep -n '<h2>' examples/alex-chen/output/alex-chen_modern_en.html
703:        <h2>Profile</h2>
709:        <h2>Work Experience</h2>
771:        <h2>Projects</h2>      # Now before Education
818:        <h2>Education</h2>
834:        <h2>Skills</h2>
```

## Commits

| Hash | Message |
|------|---------|
| 6f5d0f5 | fix(quick-017): reorder sections - projects before education |

## Deviations from Plan

None - plan executed exactly as written.
