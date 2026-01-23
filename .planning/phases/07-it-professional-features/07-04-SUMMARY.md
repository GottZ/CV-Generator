---
phase: 07-it-professional-features
plan: 04
subsystem: docx-generation
tags: [docx, word, projects, certifications, tech-stack]
dependency-graph:
  requires: [07-01, 07-02]
  provides: [buildProjectsSection, buildCertificationsSection, tech-stack-in-experience]
  affects: [08-01]
tech-stack:
  added: []
  patterns: [section-builder-functions, heading-level-navigation]
key-files:
  modified:
    - packages/cli/src/lib/docx-sections.ts
decisions: []
metrics:
  duration: ~4 minutes
  completed: 2026-01-23
---

# Phase 7 Plan 4: DOCX Section Builders Summary

**One-liner:** Added buildProjectsSection and buildCertificationsSection functions with Heading 2 support for Navigation Pane, extended buildExperienceSection with tech stack display.

## What Was Built

### Task 1: buildProjectsSection Function

Added complete project section builder following existing section patterns:

**File:** `packages/cli/src/lib/docx-sections.ts`

- Imported `Project`, `Certification` types from `@gottz/cv-core`
- Added `formatLinkUrl()` helper for clean URL display (removes protocol and trailing slash)
- Implemented `buildProjectsSection()` with:
  - Section header as Heading 2 (Navigation Pane support)
  - Project name + role (bold name, normal role)
  - Dates and type (right-aligned, italic)
  - Description with `textWithBreaks()` for line break support
  - Tech stack as comma-separated list (italic, muted color)
  - Outcome with bold "Outcome:" label
  - Clickable hyperlinks for project links via `ExternalHyperlink`

### Task 2: buildCertificationsSection and Experience Tech Stack

**buildCertificationsSection:**
- Section header as Heading 2 (Navigation Pane support)
- Certification name (bold)
- Issuer (muted color)
- Dates with optional expiry (right-aligned, italic)
- Optional credential ID
- Optional verification URL as clickable "Verify Credential" link

**buildExperienceSection extension:**
- Added tech stack display after bullets
- Format: "Technologies: tech1, tech2, tech3"
- Style: italic, muted color, small font
- Spacing matches other experience content

### Task 3: buildDocumentContent Integration

Updated `buildDocumentContent()` to include new sections in proper order:

1. Name (Heading 1)
2. Contact info
3. Links
4. Profile image
5. Summary section
6. Experience section (with tech stack)
7. Education section
7.5. **Projects section (new)**
8. Skills section
9. **Certifications section (new)**

Updated JSDoc to reflect new section ordering.

## Verification Results

| Check | Result |
|-------|--------|
| `bun run typecheck` passes | PASS |
| buildProjectsSection function exists | PASS |
| buildCertificationsSection function exists | PASS |
| Experience entries include tech stack | PASS |
| Project links use ExternalHyperlink | PASS |
| Certification verification URLs are clickable | PASS |
| Section ordering correct | PASS |
| Heading 2 for Navigation Pane | PASS |

## Files Changed

| File | Changes |
|------|---------|
| `packages/cli/src/lib/docx-sections.ts` | +230 lines (new section builders, tech stack) |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Section Structure Pattern

Both new sections follow the established pattern:
```typescript
function buildXxxSection(
  items: ItemType[],
  locale: string,
  styles: DocxStyleConfig,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Section header (Heading 2)
  paragraphs.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    // ...
  }));

  for (const item of items) {
    // Item content
  }

  return paragraphs;
}
```

### Link Display

Project links use `formatLinkUrl()` for clean display:
- Input: `https://github.com/user/repo/`
- Output: `github.com/user/repo`

User-provided labels override auto-formatting.

### Navigation Pane Support

All section headers use `HeadingLevel.HEADING_2`:
- Summary, Experience, Education, Projects, Skills, Certifications
- Name uses `HeadingLevel.HEADING_1`

This ensures proper Navigation Pane structure in Microsoft Word.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1-3 | 7587d8b | feat(07-03): add Projects and Certifications sections (includes DOCX builders) |

Note: The commit message references 07-03 due to combined template and DOCX work, but all 07-04 plan tasks were completed in this commit.

## Next Phase Readiness

**Ready for:** Phase 8 (Multi-Template + Polish)

**Dependencies satisfied:**
- DOCX output includes all IT professional content sections
- Projects render with all optional fields
- Certifications render with verification links
- Experience entries show tech stack
- Navigation Pane shows all sections

---

*Plan completed: 2026-01-23*
