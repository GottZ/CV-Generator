---
phase: 05-docx-output
plan: 02
subsystem: cli
tags: [docx, cv-sections, image-embedding, i18n, word-styles]

# Dependency graph
requires:
  - phase: 05-docx-output
    plan: 01
    provides: generateDocx function with footer and metadata
  - phase: 01-foundation-data-schema
    provides: CVData, WorkExperience, Education, SkillCategory interfaces
  - phase: 02-template-engine
    provides: getSectionHeader i18n function
provides:
  - buildDocumentContent function transforming CVData to Paragraph[]
  - loadImageForDocx function with sharp dimension extraction
  - All CV section builders (summary, experience, education, skills)
  - Word Navigation Pane support via HeadingLevel.HEADING_1/2
affects: [05-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [section-builders, image-dimension-extraction, word-builtin-styles]

key-files:
  created:
    - packages/cli/src/lib/docx-sections.ts
  modified:
    - packages/cli/src/lib/docx-generator.ts

key-decisions:
  - "Use HeadingLevel enum for built-in Word styles (Navigation Pane support)"
  - "Section order mirrors PDF: name, contact, links, image, summary, experience, education, skills"
  - "Image type required for ImageRun (jpg, png, gif, bmp) - map from sharp metadata"
  - "Return null for corrupt images without dimensions (avoid RESEARCH.md Pitfall 1)"
  - "Use Unicode bullet character (U+2022) for bullet points"

patterns-established:
  - "Section builders as pure functions returning Paragraph[]"
  - "Spacing constants in TWIPs (1 line ~ 240 TWIPs)"
  - "Profile image search: profile.*, photo.*, avatar.* with jpg/jpeg/png extensions"
  - "Contact line format: email | phone | location"
  - "ExternalHyperlink for clickable link rendering"

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 5 Plan 02: Section Content and Images Summary

**CV section builders with image embedding transforming CVData into properly-styled Word document content with Navigation Pane support**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-22
- **Completed:** 2026-01-22
- **Tasks:** 3 (Task 2 combined with Task 1)
- **Files created:** 1
- **Files modified:** 1

## Accomplishments
- Created docx-sections.ts module with section content builders
- Implemented buildDocumentContent() transforming CVData to Paragraph[]
- Added loadImageForDocx() with sharp dimension extraction
- Built all CV section renderers:
  - Name (Heading 1 - Navigation Pane)
  - Contact info (email | phone | location)
  - Links (clickable ExternalHyperlink)
  - Profile image (optional, scaled to 150px max width)
  - Summary (Heading 2 + paragraphs)
  - Experience (Heading 2 + company/role/dates/bullets)
  - Education (Heading 2 + institution/degree/field/dates)
  - Skills (Heading 2 + categories with bullet items)
- Integrated section builders into docx-generator.ts
- Added imagesDir option to DocxOptions interface

## Task Commits

Each task was committed atomically:

1. **Task 1: Create docx-sections.ts with section builders** - `b4c3300` (feat)
   - Created module with buildDocumentContent and all section builders
   - Includes loadImageForDocx with sharp integration (Task 2 combined)
2. **Task 3: Update docx-generator to use section builders** - `7a694ec` (feat)
   - Imported buildDocumentContent
   - Added imagesDir to DocxOptions
   - Replaced placeholder content with full section rendering

## Files Created/Modified
- `packages/cli/src/lib/docx-sections.ts` - Section builders and image loading (547 lines)
- `packages/cli/src/lib/docx-generator.ts` - Updated to use buildDocumentContent

## Decisions Made
- **HeadingLevel enum:** Using HEADING_1 for name and HEADING_2 for sections ensures Navigation Pane support (per RESEARCH.md Pitfall 2)
- **Image type mapping:** docx requires explicit type (jpg/png/gif/bmp) - mapped from sharp metadata.format
- **Dimension safety:** Return null for images without width/height to avoid corrupt DOCX (per RESEARCH.md Pitfall 1)
- **Unicode bullets:** Using `\u2022` (bullet character) prefix for bullet items
- **Spacing TWIPs:** Defined constants for consistent spacing (120-360 TWIPs for various elements)

## Deviations from Plan

### Task Consolidation
**Task 2 (image embedding) was combined with Task 1** - The loadImageForDocx function was logically part of the section builders module and was included in the initial creation rather than as a separate commit. This is a minor structural change that doesn't affect functionality.

## Issues Encountered
- **docx ImageRun requires type field:** The plan examples didn't include the required `type` property for ImageRun. Fixed by mapping sharp format to docx image type (jpg/png/gif/bmp).
- **TypeScript strict mode array access:** Required nullish coalescing for array index access in links iteration.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- docx-generator.ts now generates complete DOCX from CVData with all sections
- Ready for Plan 05-03 (build command integration)
- Image embedding works for profile photos in jpg/jpeg/png/gif/bmp formats
- i18n section headers working for EN/DE locales via getSectionHeader

---
*Phase: 05-docx-output*
*Completed: 2026-01-22*
