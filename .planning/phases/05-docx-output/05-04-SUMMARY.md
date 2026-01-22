---
phase: 05-docx-output
plan: 04
type: summary
status: complete
completed: 2026-01-22
duration: ~7 minutes

subsystem: docx
tags: [css, styles, docx, typography, colors]

dependency-graph:
  requires:
    - 05-02: docx-sections.ts foundation
    - 05-03: build command integration
  provides:
    - CSS-to-DOCX style mapping module
    - Template-aware DOCX styling
    - Visual parity with HTML/PDF
  affects:
    - future: DOCX template customization

tech-stack:
  added: []
  patterns:
    - CSS custom property extraction
    - TWIPs/half-points unit conversion
    - Style configuration propagation

key-files:
  created:
    - packages/cli/src/lib/docx-style-extractor.ts
  modified:
    - packages/cli/src/lib/docx-sections.ts
    - packages/cli/src/lib/docx-generator.ts
    - packages/cli/src/commands/build.ts
    - packages/cli/src/lib/__tests__/docx-linebreaks.test.ts

decisions:
  - css-regex-extraction: Use regex to parse CSS custom properties (no Puppeteer)
  - half-points-convention: Font sizes in half-points (11pt = 22)
  - twips-spacing: Spacing in TWIPs (1mm ~ 57 TWIPs)
  - fallback-defaults: DEFAULT_DOCX_STYLES when CSS unavailable

metrics:
  tasks-completed: 3
  tasks-total: 3
  deviations: 1
---

# Phase 05 Plan 04: CSS-to-DOCX Style Extraction Summary

CSS style extraction for DOCX visual parity with HTML/PDF output.

## One-liner

CSS custom property extraction from template to DOCX style config with font sizes, colors, and alignment.

## What Was Built

### Task 1: CSS-to-DOCX Style Extractor Module
**Commit:** 3fb5912

Created `docx-style-extractor.ts` with:
- `DocxStyleConfig` interface for DOCX styling parameters
- `extractStylesFromCss()` function to parse CSS custom properties
- Helper functions: `mapFontSizeHalfPoints`, `mapColorHex`, `mapSpacingTwips`, `mapMmToTwips`
- `DEFAULT_DOCX_STYLES` constant as fallback

### Task 2a: Update docx-sections.ts to Use Extracted Styles
**Commit:** 05b69b5

Updated section builders to accept DocxStyleConfig:
- All TextRun elements now receive size, color, and font from config
- Contact info and links are left-aligned (matching HTML flexbox)
- Date ranges are right-aligned (matching HTML entry-header space-between)
- Section headers use heading font and color
- Body text uses body font and color
- Muted text (dates, locations) uses small size and muted color

### Task 2b: Wire Styles Through Generator and Build Command
**Commit:** 6c5e1c8

Connected style extraction to generation pipeline:
- Added `templatePath` option to `DocxOptions` interface
- Generator loads CSS from template directory
- Extracted styles passed to `buildDocumentContent`
- Build command passes `templatesDir` to `buildDocx`

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Regex CSS extraction | Simpler than Puppeteer, works on raw CSS content |
| Half-points for fonts | docx library convention (11pt = 22 half-points) |
| TWIPs for spacing | Word document standard (1mm ~ 57 TWIPs) |
| DEFAULT_DOCX_STYLES | Graceful fallback when CSS unavailable |

## Verification Results

All verifications passed:

1. **TypeScript compiles:** `bun run typecheck` - clean
2. **DOCX generation:** Both en and de locales generated successfully
3. **Font sizes in DOCX:**
   - 48 (24pt name)
   - 28 (14pt section)
   - 24 (12pt subsection)
   - 22 (11pt body)
   - 20 (10pt small)
4. **Colors in DOCX:**
   - `1a1a1a` (heading)
   - `333333` (body)
   - `666666` (muted)
   - `2563eb` (accent)
5. **Alignment:** 5 right-aligned (dates), 2 left-aligned (contact/links)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test file type errors**
- **Found during:** Task 2a verification
- **Issue:** `docx-linebreaks.test.ts` (from plan 05-05) had type errors blocking typecheck
- **Fix:** Updated type assertions to use `unknown`, added required `startDate`/`endDate` to test fixtures, changed `break: true` to `break: 1` (docx library uses number)
- **Files modified:** `packages/cli/src/lib/__tests__/docx-linebreaks.test.ts`
- **Commit:** 05b69b5

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| packages/cli/src/lib/docx-style-extractor.ts | Created | +284 |
| packages/cli/src/lib/docx-sections.ts | Modified | +254/-61 |
| packages/cli/src/lib/docx-generator.ts | Modified | +22/-2 |
| packages/cli/src/commands/build.ts | Modified | +3/-1 |
| packages/cli/src/lib/__tests__/docx-linebreaks.test.ts | Modified (fix) | multiple |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 3fb5912 | feat | add CSS-to-DOCX style extractor module |
| 05b69b5 | feat | update docx-sections to use extracted styles |
| 6c5e1c8 | feat | wire CSS style extraction through generator and build |

## What's Next

Gap 1 (DOCX visual parity) is now closed. The remaining gap from 05-VERIFICATION.md is:
- Gap 2: Linebreak handling (plan 05-05 - test suite already exists)
