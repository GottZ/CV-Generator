---
phase: quick-011
plan: 01
subsystem: parser
tags: [bugfix, certifications, localization]

dependency-graph:
  requires: []
  provides:
    - "Single certification section selection in parser"
  affects: []

tech-stack:
  added: []
  patterns:
    - "Filter-then-select pattern for preferential section picking"

key-files:
  created: []
  modified:
    - packages/core/src/parser/cv-parser.ts

decisions:
  - id: QUICK-011-01
    summary: "Prefer English certification section, fallback to first found"
    rationale: "Certifications are NOT localized per schema design - cert names are universal"
    alternatives: "Merge all sections (causes duplicates), use locale preference from config"

metrics:
  duration: "5 minutes"
  completed: 2026-02-03
---

# Quick Task 011: Fix Duplicate Certifications Entries Summary

**One-liner:** Parser now picks single certification section (prefer en, fallback first) instead of merging all language sections

## Problem

When a CV has both `## Certifications \`en\`` and `## Zertifizierungen \`de\`` sections containing the same certifications, the parser was collecting certifications from ALL sections, resulting in duplicate entries in the parsed data.

The existing comment in the code stated "Certifications are NOT localized (cert names are universal)" but the implementation contradicted this by parsing all language sections.

## Solution

Modified the certification parsing logic in `cv-parser.ts` to:

1. First filter all certification sections from the parsed sections
2. Select ONE section using priority:
   - Prefer section with language `'en'` if available
   - Fall back to first certification section found
3. Parse only that single section for certifications
4. Return empty array if no certification sections exist

**Before (buggy):**
```typescript
const certifications: Certification[] = [];
for (const section of sectionsResult.sections) {
  if (section.sectionType === 'certifications' && section.content) {
    certifications.push(...parseCertificationEntries(section.content, context));
  }
}
```

**After (fixed):**
```typescript
const certificationSections = sectionsResult.sections.filter(
  (s) => s.sectionType === 'certifications' && s.content,
);
const certificationSection =
  certificationSections.find((s) => s.language === 'en') ??
  certificationSections[0];

const certifications: Certification[] = certificationSection
  ? parseCertificationEntries(certificationSection.content, { warnings, startLine: certificationSection.line })
  : [];
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 29b7b0c | fix | Prevent duplicate certifications when both language sections exist |

## Verification

1. **Unit test:** Created test with both `## Certifications \`en\`` and `## Zertifizierungen \`de\`` containing same cert - verified count is 1, not 2
2. **Fallback test:** Verified German-only CV still gets certifications (fallback works)
3. **Preference test:** Verified English section is preferred when both exist
4. **Real CV test:** Tested with `people/janetzky/cv.md` which has both sections - 8 certifications (not 16 duplicates)
5. **Type check:** `bun run typecheck` passes
6. **Test suite:** 86 tests pass across 5 files

## Deviations from Plan

None - plan executed exactly as written.
