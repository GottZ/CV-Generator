# Phase 12: Print Parity Verification - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that browser Ctrl+P print output matches CLI-generated PDF output across all three templates (Modern, Minimal, Classic). Focus is on HTML print capability — the existing Puppeteer PDF generation (including two-pass layout optimization) is not modified.

</domain>

<decisions>
## Implementation Decisions

### Verification workflow
- Use Playwright with Chromium to automate browser print-to-PDF for comparison
- Compare Playwright browser print vs existing Puppeteer PDF (not Puppeteer vs Puppeteer)
- Visual diff using screenshots, not text extraction
- Identical viewport, page sizes, and margins for both methods
- Tests run on-demand only (not on every PR)
- Generate diff images showing discrepancies
- Store diff images and comparison artifacts in `tests/output/` directory
- Reuse existing CV fixtures from Phase 9 baseline tests

### Acceptable differences
- 2-5% pixel difference threshold for visual comparison
- Minor font rendering differences (anti-aliasing, hinting) are acceptable
- Page breaks must occur at same positions — this is critical
- Minor spacing differences (1-2px margins/padding) are acceptable
- Minor color variations are acceptable
- Link styling must be compared (not just text content)
- Headers and footers must match between methods
- Core PDF metadata (title, author) must match; timestamps can differ

### Documentation approach
- Verification report in `.planning/phases/12-*/12-VERIFICATION.md`
- Include screenshots only on failure
- Map results to requirement IDs (PRINT-01, PRINT-05)
- Include dedicated "Known Limitations" section for browser/engine issues
- Create `PRINTING.md` user guide with:
  - Full print workflow (step-by-step from HTML to printed output)
  - Chrome-only instructions (matches Puppeteer engine)
  - Annotated screenshots of browser print dialog
  - Recommended settings and troubleshooting

### Failure handling
- Case-by-case assessment for fix vs log decision
- Claude decides severity based on real-world print usage impact
- If parity can't be achieved due to browser limitations:
  - Document limitation in PRINTING.md with workaround
  - Accept with "known issues" notation
- CSS modifications from Phase 10-11 are allowed if needed for parity
- Baseline updates allowed only if change is an improvement
- If template consistently fails: Claude decides based on fix effort vs scope
- Tests are on-demand only, so no CI blocking concerns

### Claude's Discretion
- Exact diff threshold within 2-5% range
- Severity assessment for fix vs log decisions
- Whether template exclusion is justified for fundamental limitations
- Technical approach to achieve identical Playwright/Puppeteer settings

</decisions>

<specifics>
## Specific Ideas

- "We should not touch PDF generation (multi-pass approach) — only focus on HTML print capability"
- Goal is that users can open generated HTML, press Ctrl+P, and get equivalent output to CLI PDF

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-print-parity-verification*
*Context gathered: 2026-01-25*
