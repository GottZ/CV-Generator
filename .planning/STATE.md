# Project State: CV Generator

**Last Updated:** 2026-01-24
**Session:** Phase 11 Plans 01 and 02 Complete

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.1 Improved PDF Creation

## Current Position

**Phase:** 11 - CSS Pagination Improvements
**Plan:** 2 of 3 complete
**Status:** In progress
**Last activity:** 2026-01-24 - Completed 11-01-PLAN.md (Core Pagination CSS)

**Progress:**
```
v1.1 Improved PDF Creation [███---] 50%
├── Phase 9:  Test Infrastructure Foundation [████] TEST-06, TEST-07 VERIFIED
│   ├── 09-01: Docker CI Infrastructure [x]
│   ├── 09-02: Test Utilities and Fixtures [x]
│   ├── 09-03: Baseline Snapshots [x]
│   └── 09-04: Test Documentation (Gap Closure) [x]
├── Phase 10: Print CSS Consolidation        [████] PRINT-02, PRINT-03, PRINT-04 RE-VERIFIED ✓
│   ├── 10-01: Print CSS Consolidation [x]
│   ├── 10-02: ATS_PRINT_CSS Simplification [x]
│   └── 10-03: Page Margins Fix (Gap Closure) [x]
├── Phase 11: CSS Pagination Improvements    [███-] PAG-01 to PAG-07
│   ├── 11-01: Core Pagination CSS [x]
│   ├── 11-02: Long Entry Class Detection [x]
│   └── 11-03: [ ]
├── Phase 12: Print Parity Verification      [ ] PRINT-01, PRINT-05
└── Phase 13: Full Test Suite                [ ] TEST-01 to TEST-05, TEST-08
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases | 5 |
| Requirements (v1.1) | 20 |
| Plans Created | 10 |
| Plans Completed | 9 |
| Requirements Delivered | 5/20 |
| Blockers Encountered | 4 |
| Blockers Resolved | 4 |

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

Phase 09-01 decisions:
- Use Debian `chromium` package instead of Puppeteer download for consistency
- Include fonts-liberation, fonts-freefont-ttf, fonts-noto-cjk for cross-platform font parity
- Single worker (workers: 1) for deterministic PDF generation
- 1% pixel tolerance for visual regression to handle anti-aliasing differences
- `--font-render-hinting=none` flag for deterministic font output

Phase 09-02 decisions:
- Use realistic IT professional content in fixtures (not lorem ipsum)
- Multi-page fixture at 294 lines ensures 2-3 page output for pagination testing
- pdf-lib added to root devDependencies for test helper module resolution
- Use CLI subprocess for CV generation to leverage all production features

Phase 09-03 decisions:
- Use HTML with print media emulation instead of direct PDF rendering
- Add npm to Docker for npx playwright (bunx has compatibility issues in Docker)
- Test helpers must use Node.js APIs (not Bun) for Playwright runtime compatibility
- Viewport set to A4 (794x1123px) for consistent visual snapshots

Phase 09-04 decisions:
- Add documentation to README.md (vs separate TESTING.md) for discoverability

Phase 10-01 decisions:
- Print CSS loaded AFTER template CSS for correct cascade order
- Use path.join for cross-platform path handling
- Apply changes to both renderCV and createRenderer functions
- Build-time CSS concatenation pattern for shared partials

Phase 10-02 decisions:
- ATS_PRINT_CSS contains only ligature and color-scheme rules
- Pagination rules handled exclusively by _print.css
- Playwright test.describe.configure() must be inside describe blocks (v1.57+ requirement)

Phase 10-03 decisions:
- Remove padding:0 from print CSS (Puppeteer margins only apply during PDF generation)
- Template --page-margin CSS variable controls padding in HTML print preview

Phase 11-01 decisions:
- Convert flexbox to block display in print media for break property support
- Use both modern (break-*) and legacy (page-break-*) properties for Puppeteer compatibility
- Float right for date-range elements to maintain alignment after block conversion

Phase 11-02 decisions:
- Experience entries: 15+ bullets triggers .long-entry class
- Project entries: 10+ tech stack items triggers .long-entry class
- Conservative thresholds preserve atomic behavior for most entries

### Research Insights

From `.planning/research/SUMMARY.md`:
- Print CSS duplicated in 3 locations (needs consolidation) - RESOLVED in Phase 10
- `break-inside: avoid` unreliable in headless Puppeteer (use legacy fallback)
- Flexbox breaks page-break properties (convert to block for print)
- Font rendering differs between environments (Docker + pinned versions)

### Open TODOs

None.

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Phase 11 Plans 01 and 02 complete, continue with 11-03
**Resume file:** None

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/ROADMAP.md` - v1.1 phase structure
- `/workspace/.planning/REQUIREMENTS.md` - v1.1 requirements with traceability
- `/workspace/.planning/research/SUMMARY.md` - Research findings
- `/workspace/.planning/phases/11-css-pagination-improvements/11-02-SUMMARY.md` - Long entry class detection
- `/workspace/.planning/phases/10-print-css-consolidation/10-03-SUMMARY.md` - Page margins fix (gap closure)
- `/workspace/.planning/phases/10-print-css-consolidation/10-02-SUMMARY.md` - ATS_PRINT_CSS simplification
- `/workspace/.planning/phases/10-print-css-consolidation/10-01-SUMMARY.md` - Print CSS consolidation

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-24 (Phase 11 Plans 01 and 02 complete)*
