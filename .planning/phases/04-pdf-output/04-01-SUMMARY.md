---
phase: 04-pdf-output
plan: 01
subsystem: cli
tags: [puppeteer, pdf-lib, pdf-generation, ats-optimization]

# Dependency graph
requires:
  - phase: 03-html-output
    provides: HTML files with embedded CSS and images for PDF conversion
provides:
  - Browser lifecycle management with singleton pattern
  - HTML-to-PDF conversion via Puppeteer
  - Configurable footer with i18n page numbers
  - ATS-safe text extraction (ligatures disabled)
affects: [04-02, 04-03, 06-cli-commands]

# Tech tracking
tech-stack:
  added: [puppeteer ^24.36.0, pdf-lib ^1.17.1, @lillallol/outline-pdf ^4.0.0]
  patterns: [browser-singleton, page-lifecycle-cleanup]

key-files:
  created:
    - packages/cli/src/lib/browser-manager.ts
    - packages/cli/src/lib/pdf-generator.ts
  modified:
    - packages/cli/package.json

key-decisions:
  - "Browser singleton with connected check for crash recovery"
  - "pdf-lib for accurate page count instead of DOM estimation"
  - "ATS CSS injected via page.addStyleTag at generation time"

patterns-established:
  - "Browser reuse: getBrowser() returns existing or launches new"
  - "Page cleanup: always close page in finally block"
  - "Footer config: enabled/showName/showPageNumbers/template for flexibility"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 4 Plan 01: PDF Core Summary

**Puppeteer PDF generation with browser lifecycle management, configurable i18n footers, and ATS-safe text extraction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T21:34:26Z
- **Completed:** 2026-01-22T21:37:25Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Installed puppeteer, pdf-lib, and outline-pdf dependencies
- Created browser-manager with singleton pattern and crash recovery
- Created pdf-generator with configurable footer and ATS optimization
- Footer supports enable/disable, name display, page numbers, and custom templates
- i18n page numbers: "Page X of Y" (en) / "Seite X von Y" (de)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Puppeteer and pdf-lib dependencies** - `33179cd` (chore)
2. **Task 2: Create browser-manager.ts with singleton pattern** - `71a8e60` (feat)
3. **Task 3: Create pdf-generator.ts with ATS-optimized PDF generation** - `dc6c91d` (feat)

## Files Created/Modified
- `packages/cli/package.json` - Added puppeteer, pdf-lib, @lillallol/outline-pdf dependencies
- `packages/cli/src/lib/browser-manager.ts` - Browser lifecycle with getBrowser() and closeBrowser()
- `packages/cli/src/lib/pdf-generator.ts` - PDF generation with FooterConfig, PdfOptions, PdfResult interfaces

## Decisions Made
- **Browser connected check:** Using `browser?.connected` to handle browser crashes and reconnection
- **pdf-lib for page count:** Instead of DOM height estimation, using pdf-lib to get accurate page count from generated PDF
- **ATS CSS injection:** Injecting ligature-disabling CSS at generation time via page.addStyleTag rather than modifying templates

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **Biome lint optional chain:** Line `browser && browser.connected` flagged as needing optional chain - fixed to `browser?.connected`
- **DOM types in evaluate:** Initially tried to estimate page count via document.scrollHeight but TypeScript lacks DOM types for Puppeteer evaluate callbacks - switched to pdf-lib for accurate page count

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Browser manager and PDF generator ready for Plan 04-02 (metadata and bookmarks)
- pdf-lib already installed for metadata manipulation
- @lillallol/outline-pdf ready for bookmark generation
- generatePdf function ready to be enhanced with metadata post-processing

---
*Phase: 04-pdf-output*
*Completed: 2026-01-22*
