# Project State: CV Generator

**Last Updated:** 2026-01-25
**Session:** Phase 13 Plan 01 Complete

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.1 Improved PDF Creation

## Current Position

**Phase:** 13 - Full Test Suite (IN PROGRESS)
**Plan:** 2 of 3 complete
**Status:** In progress
**Last activity:** 2026-01-25 - Completed 13-01-PLAN.md (ATS Text Extraction Tests)

**Progress:**
```
v1.1 Improved PDF Creation [████████░-] 85%
├── Phase 9:  Test Infrastructure Foundation [████] TEST-06, TEST-07 VERIFIED
│   ├── 09-01: Docker CI Infrastructure [x]
│   ├── 09-02: Test Utilities and Fixtures [x]
│   ├── 09-03: Baseline Snapshots [x]
│   └── 09-04: Test Documentation (Gap Closure) [x]
├── Phase 10: Print CSS Consolidation        [████] PRINT-02, PRINT-03, PRINT-04 VERIFIED
│   ├── 10-01: Print CSS Consolidation [x]
│   ├── 10-02: ATS_PRINT_CSS Simplification [x]
│   └── 10-03: Page Margins Fix (Gap Closure) [x]
├── Phase 11: CSS Pagination Improvements    [████] PAG-01 to PAG-07 VERIFIED
│   ├── 11-01: Core Pagination CSS [x]
│   ├── 11-02: Long-Entry Template Logic [x]
│   └── 11-03: Visual Baselines & Two-Pass PDF [x]
├── Phase 12: Print Parity Verification      [████] PRINT-01, PRINT-05 VERIFIED
│   ├── 12-01: Print Parity Test Infrastructure [x]
│   ├── 12-02: Run Parity Tests [x] 6/6 PASS
│   └── 12-03: PRINTING.md Documentation [x]
└── Phase 13: Full Test Suite                [███-] TEST-02, TEST-03, TEST-04, TEST-05 VERIFIED
    ├── 13-01: ATS Text Extraction Tests [x] 6/6 PASS
    ├── 13-02: Structural Tests [x] 11/11 PASS
    └── 13-03: Visual Regression Tests [ ]
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases | 5 |
| Requirements (v1.1) | 20 |
| Plans Created | 16 |
| Plans Completed | 14 |
| Requirements Delivered | 18/20 |
| Blockers Encountered | 5 |
| Blockers Resolved | 5 |

## Accumulated Context

### Key Decisions

Carried from v1.0:
- HTML as intermediate format for PDF (Puppeteer)
- CSS-to-DOCX style extraction for visual parity
- Configuration cascade (template < global < env < frontmatter)

v1.1 decisions:
- Test infrastructure before CSS changes (baselines needed first)
- Print CSS consolidation before pagination (single source of truth)
- Use both legacy and modern CSS fragmentation properties (Puppeteer compatibility)
- unpdf for text extraction (zero-dependency, Bun-compatible)
- Docker for CI test consistency (font rendering)

Phase 11-01 decisions:
- Convert flexbox to block display in print media for break property support
- Use both modern (break-*) and legacy (page-break-*) properties for Puppeteer compatibility
- Float right for date-range elements to maintain alignment after block conversion

Phase 11-02 decisions:
- 15+ bullets triggers long-entry class for experience entries
- 10+ tech stack items triggers long-entry class for project entries

Phase 11-03 decisions:
- @page { margin: 20mm 0 } to match Puppeteer header/footer space
- @page :first { margin-top: 0 } for first page (no header)
- Two-pass PDF generation: analyze page distribution, redistribute if last page sparse (<20%)
- REDISTRIBUTION_CSS with extra section/entry margins for content reflow

Phase 12-01 decisions:
- Page count is the critical print parity metric (not metadata)
- BROWSER_PDF_OPTIONS match pdf-generator.ts for maximum parity
- Store artifacts in tests/output/parity/ for manual review

Phase 12-02 findings:
- All 6 template/fixture combinations achieve print parity
- No CSS fixes needed - Phase 10-11 CSS sufficient
- Known limitations: footer (CLI only), ATS CSS (CLI only)

Phase 12-03 decisions:
- Chrome/Chromium browsers recommended for printing (matches Puppeteer)
- Three known differences documented: footer, ATS CSS, two-pass optimization

Phase 13-01 decisions:
- unpdf@1.4.0 for PDF text extraction (serverless-optimized, Bun-compatible)
- Test ligature words with fi sequences (Proficient, notification) to verify font-variant-ligatures:none

Phase 13-02 decisions:
- Centralized structural tests in single spec file for maintainability
- Pre-fetch all PDF metadata in beforeAll hook for performance
- File size bounds: 10KB minimum (catches failures), 5MB maximum (catches bloat)

### Research Insights

From `.planning/research/SUMMARY.md`:
- Print CSS duplicated in 3 locations (needs consolidation) - RESOLVED in Phase 10
- `break-inside: avoid` unreliable in headless Puppeteer (use legacy fallback) - ADDRESSED in Phase 11
- Flexbox breaks page-break properties (convert to block for print) - IMPLEMENTED in Phase 11
- Font rendering differs between environments (Docker + pinned versions)

### Open TODOs

None.

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Ready for 13-03 (Visual Regression Tests)
**Resume file:** None

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/ROADMAP.md` - v1.1 phase structure
- `/workspace/.planning/REQUIREMENTS.md` - v1.1 requirements with traceability
- `/workspace/.planning/research/SUMMARY.md` - Research findings
- `/workspace/.planning/phases/12-print-parity-verification/12-VERIFICATION.md` - Print parity verification report
- `/workspace/docs/PRINTING.md` - User guide for browser printing

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-25 (Phase 13 Plan 01 Complete)*
