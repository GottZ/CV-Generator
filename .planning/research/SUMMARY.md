# Research Summary: v1.1 PDF Pagination Improvements

**Project:** CV Generator CLI - PDF Quality Enhancements
**Milestone:** v1.1 Improved PDF Creation
**Research Date:** 2026-01-23
**Overall Confidence:** HIGH

---

## Executive Summary

The v1.1 milestone focuses on three interconnected PDF quality improvements: eliminating wasted whitespace through better pagination, ensuring HTML print output matches CLI-generated PDFs, and establishing automated PDF testing to catch regressions. The excellent news: the existing Puppeteer-based architecture already provides all necessary foundations.

**Key finding:** This milestone requires minimal new dependencies (only `unpdf` for test-time text extraction) and no architectural changes. The work is primarily CSS refinement in existing template files, test infrastructure additions using already-installed Playwright, and consolidation of duplicated print CSS rules. The current codebase has print CSS spread across three locations (_print.css, template CSS, and ATS_PRINT_CSS in pdf-generator.ts), creating maintenance burden. Consolidating to a single source of truth is the critical first step.

**Risk mitigation:** The primary technical risks are browser-specific CSS fragmentation bugs (break-inside ignored in headless mode, flexbox breaking page-break properties) and test infrastructure complexity (font rendering differences, PDF-to-image artifacts). Both are well-documented with proven workarounds: use legacy fallback properties alongside modern ones, run tests in Docker for consistency, and use perceptual diff algorithms with appropriate thresholds.

---

## Key Findings

### From STACK.md: Technology Readiness

**Current stack already supports pagination improvements:**
- Puppeteer 24.36.0 has full CSS @page support with `preferCSSPageSize: true` option
- CSS fragmentation properties (break-inside, orphans, widows) work in Chromium print context
- No additional runtime dependencies needed for pagination or print parity

**New dependency for testing only:**
- `unpdf` v1.4.0 - Zero-dependency PDF text extraction, Bun-compatible, TypeScript-native
- Already installed: `@playwright/test` v1.57.0 for visual regression, `pdf-lib` v1.17.1 for metadata

**What NOT to add:**
- Paged.js (overkill for CV-length documents)
- pdf-visual-diff (requires Jest, incompatible with Bun test runner)
- pdf-parse v2 (complex Node version requirements)

### From FEATURES-pdf-pagination.md: User Expectations

**Table stakes (must have):**
1. No orphan headings - section headers at page bottom with content on next page
2. No widow content - single lines isolated at page top
3. Keep sections together - work experience entries not split mid-item
4. Consistent margins - professional balanced whitespace
5. Browser print parity - Ctrl+P should match CLI output

**Differentiators (nice to have):**
- Smart content fitting algorithm (reduce whitespace to avoid near-empty pages)
- Page number footers ("Page 1 of 2")
- Template-specific visual test baselines
- Dynamic content masking in visual comparisons

**Anti-features (explicitly avoid):**
- Complex margin box headers (incomplete Chrome support)
- Pixel-perfect PDF-to-HTML matching (font rendering varies)
- Fully automated page break optimization (diminishing returns)
- URL-based images in @page rules (fail in headless mode)

### From ARCHITECTURE-pdf-pagination.md: Implementation Strategy

**Integration points identified:**
- `templates/_shared/partials/_print.css` - Shared print rules (single source of truth)
- `templates/*/styles.css` - Template-specific print rules
- `packages/cli/src/lib/pdf-generator.ts` - Currently injects `ATS_PRINT_CSS` (duplicated rules)

**Critical architectural finding:**
Current codebase has print CSS duplication across three locations. Recommended consolidation:
1. Move all print rules to `_print.css` (single source of truth)
2. Templates import `_print.css`
3. Simplify `ATS_PRINT_CSS` to only ligature disabling for ATS

**Data flow remains unchanged:**
```
Template CSS (imports _print.css) → HTML (embedded CSS) → Puppeteer → PDF
                                                              ↓
                                                        [unpdf] → Content tests
                                                        [Playwright] → Visual tests
```

**Testing patterns established:**
- Pattern 1: CSS fragmentation with legacy fallbacks
- Pattern 2: PDF content testing with unpdf
- Pattern 3: Visual regression with Playwright screenshots
- Pattern 4: Pagination validation tests

### From PITFALLS.md: Critical Risks and Prevention

**Critical pitfalls for this milestone:**

1. **break-inside:avoid ignored in headless mode** (Puppeteer Issue #6366)
   - Prevention: Use both `page-break-inside: avoid` (legacy) and `break-inside: avoid` (modern)
   - Test specifically with Puppeteer, not just browser print preview

2. **Flexbox/Grid breaks page-break properties** (IPython Issue #5115)
   - Prevention: Convert flex containers to `display: block` in @media print
   - CV templates use flexbox - requires careful print CSS

3. **Print styles bleed into screen display**
   - Prevention: ALWAYS wrap print CSS in `@media print {}` blocks
   - Add visual regression tests for BOTH screen AND print views

4. **Font rendering differs between environments**
   - Prevention: Run tests in Docker matching CI, use `--font-render-hinting=none`
   - Use looser pixel diff thresholds (0.1-1% variance)

5. **PDF-to-image conversion introduces artifacts**
   - Prevention: Pin rendering library versions, use perceptual diff algorithms
   - Render at higher DPI, compare at lower resolution

**ATS pitfalls to maintain awareness:**
- ToUnicode map corruption (garbled text extraction)
- Headers/footers ignored by ATS (already avoided in codebase)
- Non-standard section headers (validate in templates)

---

## Recommended Stack Additions

### New Dev Dependency (Required)

```json
{
  "devDependencies": {
    "unpdf": "^1.4.0"
  }
}
```

**Rationale:** Zero dependencies, TypeScript-first, Bun-compatible, active maintenance. Superior to pdf-parse for this use case.

### Already Available (No Action Needed)

- `puppeteer@^24.36.0` - PDF generation with page break support
- `@playwright/test@^1.57.0` - Visual regression testing via screenshots
- `pdf-lib@^1.17.1` - PDF metadata reading (outline, page count)

### Installation Command

```bash
bun add -D unpdf
```

---

## Suggested Phase Structure

Based on dependency analysis and risk mitigation strategy:

### Phase 1: Print CSS Consolidation (Foundation)

**Rationale:** Must establish single source of truth before adding rules. Reduces risk of conflicts and regressions.

**What it delivers:**
- Consolidated print CSS in `_print.css`
- Removed duplication from template CSS files
- Simplified `ATS_PRINT_CSS` in pdf-generator.ts (ligatures only)
- Documented CSS architecture

**Features from FEATURES.md:** None directly - this is technical debt cleanup

**Pitfalls to avoid:**
- Print styles bleeding into screen display
- CSS specificity wars between screen and print
- Existing PDF generation disrupted

**Research flag:** No additional research needed - well-documented pattern

**Estimated effort:** Low (2-3 hours)

---

### Phase 2: CSS Pagination Improvements (Core Feature)

**Rationale:** Build on consolidated CSS foundation. Pure CSS changes with no new dependencies.

**What it delivers:**
- No orphan headings (break-after: avoid on h1-h4)
- No widow content (orphans: 3, widows: 3 on paragraphs)
- Sections stay together (break-inside: avoid on entry containers)
- Consistent @page margins
- Flexbox → block conversion in print context

**Features from FEATURES.md:** All table stakes items

**Pitfalls to avoid:**
- break-inside ignored in headless mode (use legacy fallbacks)
- Flexbox breaks page-break properties (convert to block for print)
- Section headers orphaned from content (wrap with first entry)
- Margin/padding accumulation at page breaks (use padding over margin)

**Research flag:** No additional research needed - patterns established in ARCHITECTURE.md

**Estimated effort:** Medium (4-6 hours implementation + testing)

---

### Phase 3: Browser Print Parity (Feature Parity)

**Rationale:** Depends on Phase 2 CSS consolidation. Ensures @media print rules mirror Puppeteer settings.

**What it delivers:**
- Dual CSS approach: works for both browser print and Puppeteer
- Documented print CSS architecture
- Manual test workflow (generate PDF, then Ctrl+P HTML, compare)

**Features from FEATURES.md:** Browser print parity (table stakes)

**Pitfalls to avoid:**
- Print styles bleed into screen display (strict @media print scoping)
- CSS variable fallbacks missing for print (explicit re-declaration)
- Background colors disappear (printBackground: true + print-color-adjust: exact)
- Responsive layouts break in print (explicit fixed-width for print)

**Research flag:** No additional research needed - established patterns

**Estimated effort:** Low-Medium (3-4 hours)

---

### Phase 4: Automated PDF Testing (Quality Assurance)

**Rationale:** Depends on working pagination to create meaningful baselines. Catches regressions automatically.

**What it delivers:**
- PDF content tests (text extraction, page count via unpdf)
- PDF pagination tests (page break validation, orphan/widow checks)
- Visual regression tests (screenshot comparison via Playwright)
- Test utilities (PDF parsing helpers)
- Baseline snapshots for all templates

**Features from FEATURES.md:**
- Template-specific baselines (differentiator)
- Multi-page snapshot testing (differentiator)
- Page count assertions (differentiator)

**Pitfalls to avoid:**
- Font rendering differs between environments (Docker, --font-render-hinting=none)
- PDF-to-image conversion artifacts (pin versions, perceptual diff)
- Flaky tests from dynamic content (mock dates, use ignore rectangles)
- Multi-page comparison complexity (page-by-page comparison)
- Threshold tuning false negatives (start strict, document loosening)

**Research flag:** NEEDS RESEARCH - Visual regression testing approach for PDFs
- Specifically: Playwright PDF screenshot strategy, baseline management, CI configuration

**Estimated effort:** High (8-10 hours infrastructure + test writing)

---

## Critical Pitfalls to Avoid

### Ranked by Impact and Likelihood

| Rank | Pitfall | Phase | Prevention Strategy |
|------|---------|-------|---------------------|
| 1 | Existing PDF generation disrupted | Phase 2 | Establish baseline test suite BEFORE changes; feature flags |
| 2 | break-inside ignored in headless mode | Phase 2 | Use both legacy and modern properties; test with Puppeteer |
| 3 | Flexbox breaks page-break properties | Phase 2 | Convert flex to block in @media print; CV templates use flexbox |
| 4 | Print styles bleed into screen display | Phases 2-3 | Strict @media print scoping; visual regression for screen view |
| 5 | Font rendering differs in CI | Phase 4 | Docker containers, pinned versions, looser thresholds |
| 6 | Test infrastructure not ready | Phase 4 | Set up infrastructure BEFORE implementing features |
| 7 | CSS specificity wars | Phases 2-3 | Separate print CSS file; avoid !important; distinct class names |
| 8 | Incomplete edge case testing | All phases | Define explicit edge cases: empty content, max content, all templates |

### Testing Checklist for Every Change

Apply this checklist after each commit:

- [ ] Screen display unchanged (visual regression)
- [ ] Print preview matches expectations (manual spot check)
- [ ] PDF output matches print preview (automated comparison)
- [ ] Page breaks in correct locations (multi-page content)
- [ ] Text extraction produces correct content (copy-paste test)
- [ ] Performance within budget (<3 seconds for 2-page PDF)
- [ ] CI tests pass (not just local)
- [ ] Edge cases covered (long content, empty sections, all 4 templates)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Existing Puppeteer provides all needed capabilities; unpdf verified v1.4.0 Oct 2025 |
| **Features** | HIGH | Based on authoritative sources (MDN, Puppeteer docs, CSS-Tricks); table stakes vs differentiators clear |
| **Architecture** | HIGH | Direct codebase analysis; integration points identified; data flow understood |
| **Pitfalls** | HIGH | Verified against multiple GitHub issues, technical articles, and authoritative sources |
| **CSS Pagination** | HIGH | Long-standing CSS standards, Chromium support verified |
| **Visual Testing** | MEDIUM | Playwright docs official, but CI consistency requires careful setup |
| **Bun Compatibility** | MEDIUM | unpdf claims Bun support but limited direct verification |

### Gaps to Address During Planning

1. **Baseline establishment:** Need to generate baseline PDFs for all 4 templates before any changes
2. **Docker CI configuration:** Playwright PDF screenshot strategy needs CI-specific setup documented
3. **Edge case definition:** Explicitly define test cases for: empty sections, maximum content length (3+ pages), special characters, all template combinations
4. **Performance baseline:** Establish current PDF generation time benchmarks before optimization
5. **Flexbox inventory:** Audit all templates for flexbox usage that needs print CSS conversion

---

## Sources Summary

### Authoritative (HIGH Confidence)
- [Puppeteer PDFOptions API](https://pptr.dev/api/puppeteer.pdfoptions) - Official documentation
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Official documentation
- [MDN @page](https://developer.mozilla.org/en-US/docs/Web/CSS/@page) - CSS paged media reference
- [MDN CSS Printing Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing) - Print stylesheet guidance
- [unpdf GitHub](https://github.com/unjs/unpdf) - v1.4.0 release notes

### Technical Articles (MEDIUM Confidence)
- [Eric Draken PDF Layout Algorithm](https://ericdraken.com/algorithm-optimized-pdf-page-layout/) - Smart content fitting
- [Smashing Magazine - CSS Fragmentation](https://www.smashingmagazine.com/2019/02/css-fragmentation/) - Page break behavior
- [PuppetMaster PDF Testing](https://medium.com/the-crc-tech-blog/pdf-visual-regression-testing-the-puppetmaster-approach-7a575d6c5559) - Visual regression patterns

### Community Issues (HIGH Confidence - Known Bugs)
- [Puppeteer #6366](https://github.com/puppeteer/puppeteer/issues/6366) - break-inside ignored in headless
- [Puppeteer #5277](https://github.com/puppeteer/puppeteer/issues/5277) - page break not working
- [Puppeteer #8708](https://github.com/puppeteer/puppeteer/issues/8708) - table page breaks
- [IPython #5115](https://github.com/ipython/ipython/issues/5115) - Flexbox breaks page-break

---

## Ready for Requirements

### Summary

Research synthesis complete. All four research outputs analyzed and integrated into cohesive roadmap guidance.

**Files synthesized:**
- STACK.md - Technology readiness confirmed, unpdf selected for testing
- FEATURES-pdf-pagination.md - Table stakes vs differentiators identified
- ARCHITECTURE-pdf-pagination.md - Integration points mapped, consolidation strategy defined
- PITFALLS.md - Critical risks documented with prevention strategies

**Recommended phase order:**
1. Print CSS Consolidation (foundation - 2-3 hours)
2. CSS Pagination Improvements (core feature - 4-6 hours)
3. Browser Print Parity (feature parity - 3-4 hours)
4. Automated PDF Testing (quality assurance - 8-10 hours)

**Total estimated effort:** 17-23 hours

**Critical success factors:**
- Establish baseline tests BEFORE any changes
- Consolidate print CSS first to avoid conflicts
- Use Docker for test environment consistency
- Test both screen and print views after every change
- Document flexbox → block conversions for print

**Next step:** Orchestrator can proceed to requirements definition. Roadmapper has clear guidance on phase structure, technology choices, and risk mitigation strategies.
