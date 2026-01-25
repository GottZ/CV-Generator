# Roadmap: CV Generator v1.1

**Milestone:** v1.1 Improved PDF Creation
**Created:** 2026-01-23
**Depth:** Comprehensive
**Coverage:** 20/20 requirements mapped

---

## Overview

This milestone improves PDF output quality through better pagination, HTML print parity, and automated testing. The work follows a dependency-driven sequence: establish test baselines first, consolidate duplicated print CSS, implement pagination improvements, verify print parity across all templates, then complete the full test suite. Phase numbering continues from v1.0 (which ended at Phase 8).

---

## Phase 9: Test Infrastructure Foundation

**Goal:** Establish testing infrastructure and baseline snapshots before any CSS changes, enabling regression detection throughout the milestone.

**Dependencies:** None (first phase of v1.1)

**Requirements:**
- TEST-06: Tests run in CI with consistent environment (Docker)
- TEST-07: Baseline snapshots exist for all 3 templates

**Success Criteria:**
1. `bun test` runs PDF generation tests in consistent Docker environment
2. Baseline PDF snapshots exist for Modern, Minimal, and Classic templates
3. CI pipeline executes tests on every PR with deterministic results
4. Test infrastructure documented in project README or dedicated test docs

**Research Notes:**
- Use Docker for font rendering consistency
- Use `--font-render-hinting=none` for reproducible results
- Pin Puppeteer/Playwright versions in CI

**Plans:** 4 plans

Plans:
- [x] 09-01-PLAN.md - Docker CI Infrastructure (Dockerfile.test, GitHub Actions workflow)
- [x] 09-02-PLAN.md - Test Utilities and Fixtures (CV fixtures, PDF helpers)
- [x] 09-03-PLAN.md - Baseline Snapshots (Visual regression tests for all 3 templates)
- [x] 09-04-PLAN.md - Documentation (Test infrastructure docs for contributors) [gap closure]

---

## Phase 10: Print CSS Consolidation

**Goal:** Establish a single source of truth for print CSS, eliminating duplication across three locations and preventing maintenance conflicts.

**Dependencies:** Phase 9 (baselines needed to detect regressions)

**Requirements:**
- PRINT-02: Unified @media print stylesheet (single source of truth)
- PRINT-03: @page rules match Puppeteer PDF settings
- PRINT-04: Print-specific layout adjustments do not affect screen display

**Success Criteria:**
1. All print CSS rules live in `_print.css` (templates import this file)
2. `ATS_PRINT_CSS` in pdf-generator.ts contains only ATS-specific rules (ligature disabling)
3. Screen display unchanged after consolidation (visual regression passes)
4. @page margins match Puppeteer's PDF margin settings

**Research Notes:**
- Current duplication: _print.css, template CSS files, ATS_PRINT_CSS in pdf-generator.ts
- Wrap all print CSS in strict @media print {} blocks
- Test both screen and print views after every change

**Plans:** 3 plans

Plans:
- [x] 10-01-PLAN.md - Consolidate print CSS (modify render.ts, remove from templates)
- [x] 10-02-PLAN.md - Simplify ATS_PRINT_CSS and verify with visual tests
- [x] 10-03-PLAN.md - Fix page margins in print CSS [gap closure]

---

## Phase 11: CSS Pagination Improvements

**Goal:** Eliminate pagination problems (orphaned headers, split entries, widow lines) through CSS fragmentation properties that work reliably in Puppeteer.

**Dependencies:** Phase 10 (consolidated CSS required for clean implementation)

**Requirements:**
- PAG-01: Job entries do not split across page breaks (break-inside: avoid)
- PAG-02: Education blocks do not split across page breaks
- PAG-03: Skills sections do not split across page breaks
- PAG-04: Section headers are not orphaned at page bottom (stay with content)
- PAG-05: Minimum 2 lines before/after page breaks (orphans/widows control)
- PAG-06: Consistent page margins via @page CSS rules
- PAG-07: No near-empty last pages (content fits on previous page when possible)

**Success Criteria:**
1. Multi-page PDF with work experience shows no mid-entry page breaks
2. Section headers (Experience, Education, Skills) always appear with at least one entry on same page
3. No single isolated lines at top or bottom of any page
4. Page margins consistent across all pages (matching @page rules)
5. 3-page CV content does not produce 4 pages with near-empty final page

**Research Notes:**
- Use BOTH `page-break-inside: avoid` (legacy) and `break-inside: avoid` (modern)
- Convert flexbox containers to `display: block` in @media print (flexbox breaks page-break properties)
- Test with Puppeteer specifically, not just browser print preview
- Use padding over margin to avoid accumulation at page breaks

**Plans:** 3 plans

Plans:
- [x] 11-01-PLAN.md - Core pagination CSS (flexbox conversion, entry-type rules, orphan/widow control)
- [x] 11-02-PLAN.md - Long-entry template logic (conditional class for 15+ bullet entries)
- [x] 11-03-PLAN.md - Visual regression baseline updates, @page margin fixes, two-pass PDF generation

---

## Phase 12: Print Parity Verification

**Goal:** Ensure browser Ctrl+P print output matches CLI-generated PDF output across all templates.

**Dependencies:** Phase 11 (pagination must be working first)

**Requirements:**
- PRINT-01: HTML prints with same pagination as PDF output
- PRINT-05: All 3 templates (Modern, Minimal, Classic) have print parity

**Success Criteria:**
1. User can open generated HTML, press Ctrl+P, and get visually equivalent output to CLI PDF
2. Page breaks occur at same locations in browser print and Puppeteer PDF
3. Modern template print parity verified
4. Minimal template print parity verified
5. Classic template print parity verified

**Research Notes:**
- Dual CSS approach: rules must work for both browser print and Puppeteer
- Use `print-color-adjust: exact` for background colors
- Explicit fixed-width for print (responsive layouts break in print)
- Manual verification workflow: generate PDF, then Ctrl+P HTML, visual comparison

---

## Phase 13: Full Test Suite

**Goal:** Complete automated test coverage for PDF quality, catching regressions from content extraction to visual appearance to Puppeteer updates.

**Dependencies:** Phase 12 (pagination and parity must be stable for meaningful tests)

**Requirements:**
- TEST-01: Visual regression tests detect layout changes in PDF output
- TEST-02: Text extraction tests verify ATS-readable content in PDFs
- TEST-03: Structural tests verify page count expectations
- TEST-04: Structural tests verify PDF metadata presence
- TEST-05: Structural tests verify file size sanity (not empty, not bloated)
- TEST-08: Tests catch Puppeteer dependency update regressions

**Success Criteria:**
1. Visual regression test fails when CSS layout changes affect PDF appearance
2. Text extraction test passes when PDF contains expected resume content (name, sections, experience)
3. Page count assertions match expected values for each test fixture
4. PDF metadata includes title and author fields
5. Generated PDF file size between reasonable bounds (not 0 bytes, not 10MB)
6. Puppeteer version bump triggers test run that would catch breaking changes

**Research Notes:**
- Use `unpdf` for text extraction (zero-dependency, Bun-compatible)
- Use Playwright for visual regression via screenshots
- Use perceptual diff algorithms with 0.1-1% variance threshold
- Render at higher DPI, compare at lower resolution to reduce noise
- Mock dates and dynamic content to avoid flaky tests

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 9 | Test Infrastructure Foundation | TEST-06, TEST-07 | Complete |
| 10 | Print CSS Consolidation | PRINT-02, PRINT-03, PRINT-04 | Complete |
| 11 | CSS Pagination Improvements | PAG-01 to PAG-07 | Complete |
| 12 | Print Parity Verification | PRINT-01, PRINT-05 | Complete |
| 13 | Full Test Suite | TEST-01 to TEST-05, TEST-08 | Pending |

**Summary:** 5 phases, 20 requirements, comprehensive depth

---

## Coverage Validation

```
PAG-01 -> Phase 11
PAG-02 -> Phase 11
PAG-03 -> Phase 11
PAG-04 -> Phase 11
PAG-05 -> Phase 11
PAG-06 -> Phase 11
PAG-07 -> Phase 11
PRINT-01 -> Phase 12
PRINT-02 -> Phase 10
PRINT-03 -> Phase 10
PRINT-04 -> Phase 10
PRINT-05 -> Phase 12
TEST-01 -> Phase 13
TEST-02 -> Phase 13
TEST-03 -> Phase 13
TEST-04 -> Phase 13
TEST-05 -> Phase 13
TEST-06 -> Phase 9
TEST-07 -> Phase 9
TEST-08 -> Phase 13

Mapped: 20/20 requirements
Orphaned: 0
```

---

*Roadmap created: 2026-01-23*
*Milestone continues from v1.0 Phase 8*
