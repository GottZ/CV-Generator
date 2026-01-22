---
phase: 05-docx-output
plan: 03
subsystem: cli
tags: [docx, build-command, cli-flags, format-integration]

# Dependency graph
requires:
  - phase: 05-docx-output
    plan: 01
    provides: generateDocx function with footer and metadata
  - phase: 05-docx-output
    plan: 02
    provides: buildDocumentContent with section builders
  - phase: 04-pdf-output
    plan: 03
    provides: build command structure with format handling
provides:
  - DOCX format support in build command
  - --no-docx CLI flag for skipping DOCX generation
  - Complete build output (HTML + PDF + DOCX)
affects: [06-cli-commands]

# Tech tracking
tech-stack:
  added: []
  patterns: [multi-format-build, commander-negated-flags]

key-files:
  created: []
  modified:
    - packages/cli/src/commands/build.ts
    - packages/cli/src/index.ts

key-decisions:
  - "DOCX generation independent of HTML/PDF - builds directly from CVData"
  - "No retry logic for DOCX (no browser involved, unlike PDF)"
  - "Format filtering order: --html-only first, then --no-pdf, then --no-docx"

patterns-established:
  - "buildDocx function parallel to buildPdf for format consistency"
  - "Commander --no-* flags with manual negated option handling"

# Metrics
duration: 8min
completed: 2026-01-22
---

# Phase 5 Plan 03: Build Command Integration Summary

**DOCX format fully integrated into build command with --no-docx flag and multi-format output (HTML + PDF + DOCX)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-22
- **Completed:** 2026-01-22
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 2

## Accomplishments
- Added DOCX to supportedFormats array in build command
- Created buildDocx function for DOCX generation orchestration
- Integrated generateDocx call with proper options (cv, locale, outputPath, imagesDir)
- Added --no-docx CLI flag to index.ts
- Added noDocx option to BuildOptions interface
- Implemented format filtering for --no-docx flag
- Fixed Commander.js --no-* flag handling (manual negated option required)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DOCX format support to build command** - `92303cf` (feat)
   - Added 'docx' to supportedFormats
   - Created buildDocx function
   - Added DOCX case in format loop
2. **Task 2: Add --no-docx CLI flag** - `79c8f7f` (feat)
   - Added --no-docx option to CLI
   - Added noDocx to BuildOptions interface
   - Implemented format filtering logic
3. **Fix: Commander --no-* flag handling** - `35997f8` (fix)
   - Commander negated options need explicit .option('--no-docx') definition
   - Also fixed existing --no-pdf flag handling

## Files Modified
- `packages/cli/src/commands/build.ts` - Added buildDocx function and DOCX format handling
- `packages/cli/src/index.ts` - Added --no-docx CLI option

## Decisions Made
- **Direct CVData processing:** DOCX generation doesn't need HTML intermediate - builds directly from CVData unlike PDF which uses Puppeteer on HTML
- **No retry logic:** Unlike buildPdf which has browser retry logic, buildDocx is simple and synchronous
- **Format filename pattern:** Consistent with HTML/PDF: `{slug}_{template}_{locale}.docx`

## Deviations from Plan

### Bug Fix Added
**[Rule 1 - Bug] Fixed Commander --no-* flag handling**
- **Found during:** Task 2 verification
- **Issue:** Commander.js requires explicit `.option('--no-docx')` definition and manual negated option handling
- **Fix:** Added `.option('--no-docx')` to CLI and used `options.docx === false` check
- **Files modified:** packages/cli/src/commands/build.ts, packages/cli/src/index.ts
- **Commit:** 35997f8

## Known Gaps Identified

### Gap 1: CSS Styling Not Reflected in DOCX
**Status:** Documented for future gap closure

The DOCX output does not fully reflect the CSS styling from the HTML template:
- Right alignment not applied
- Font sizes differ from CSS specification
- Colors not mapped from CSS custom properties
- Spacing differs from HTML/PDF rendering

**Recommended Approach (per user feedback):**
Puppeteer-based layout extraction - render HTML, extract exact positioning/sizing via `page.evaluate()`, use measurements to build DOCX with precise styling that matches HTML/PDF output.

**Impact:** DOCX is functional but visually different from HTML/PDF. Users get content-correct output that may require manual style adjustments in Word.

### Gap 2: Linebreak Quirk
**Status:** Documented for investigation

There's a quirk with linebreaks in DOCX output that needs investigation:
- Linebreaks in source content may not render as expected
- May need explicit `TextRun` with `break: true` or `Paragraph` boundaries

**Impact:** Minor formatting issue. Needs documentation of expected behavior and potential fix.

## Issues Encountered
- **Commander negated options:** Required explicit definition and manual check (not automatic boolean inversion)
- TypeScript strict mode required explicit type annotations for BuildOptions extension

## User Setup Required

None - no external service configuration required.

## Phase 5 Complete

All DOCX output plans complete:
- Plan 01: Core generator with footer and metadata
- Plan 02: Section content and image embedding
- Plan 03: Build command integration

**Phase deliverables:**
- `generateDocx()` function in docx-generator.ts
- `buildDocumentContent()` function in docx-sections.ts
- Build command produces .docx files alongside HTML and PDF
- --no-docx flag to skip DOCX generation

**Known limitations to address in future:**
- CSS styling not reflected (needs Puppeteer extraction approach)
- Linebreak quirk (needs investigation)

---
*Phase: 05-docx-output*
*Completed: 2026-01-22*
