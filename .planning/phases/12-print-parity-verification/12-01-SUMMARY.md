---
phase: 12-print-parity-verification
plan: 01
subsystem: test-infrastructure
tags: [playwright, print-parity, pdf-comparison, pdf-lib]

dependency-graph:
  requires: [09-02]
  provides: [PRINT-PARITY-TESTS, PARITY-UTILS]
  affects: [print-quality-verification]

tech-stack:
  patterns: [browser-pdf-generation, page-count-comparison]

key-files:
  created:
    - tests/helpers/parity-utils.ts
    - tests/print-parity.spec.ts

decisions:
  - id: page-count-primary-metric
    choice: Use page count as the critical comparison metric
    rationale: Page count mismatch indicates print parity failure; metadata differences are informational only
  - id: browser-pdf-options
    choice: Match BROWSER_PDF_OPTIONS to pdf-generator.ts settings
    rationale: Ensures maximum parity between Playwright and Puppeteer PDF generation
  - id: artifacts-retained
    choice: Store CLI and browser PDFs in tests/output/parity/ for manual review
    rationale: Enables visual comparison when investigating parity failures

metrics:
  duration: ~2 minutes
  completed: 2026-01-25
---

# Phase 12 Plan 01: Print Parity Test Infrastructure Summary

**One-liner:** Created print parity test infrastructure with compareForParity utility and Playwright test suite covering all 3 templates and both fixtures.

## What Was Done

### Task 1: Create parity-utils.ts helper module

Created `/workspace/tests/helpers/parity-utils.ts` with:
- `ParityResult` interface for structured comparison results
- `compareForParity()` function to compare CLI vs browser PDF page counts
- `BROWSER_PDF_OPTIONS` constant matching pdf-generator.ts settings

**Commit:** 4fb7249

### Task 2: Create print-parity.spec.ts test suite

Created `/workspace/tests/print-parity.spec.ts` with:
- Print parity tests for all 3 templates (modern, minimal, classic)
- Tests for both fixtures (sample-cv, multi-page-cv)
- 6 parity tests total (3 templates x 2 fixtures)
- 1 known limitations test documenting browser PDF lacks CLI footer
- Results summary logged after all tests
- Artifacts stored in `tests/output/parity/` for manual review

**Commit:** 70179a6

### Task 3: Verify test infrastructure works

Verified:
- TypeScript syntax valid
- Playwright discovers 7 print-parity tests
- Both files exist with reasonable sizes (3KB and 5KB)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| parity-utils.ts exists with compareForParity | PASS |
| print-parity.spec.ts exists with page.pdf() | PASS |
| All 3 templates in TEMPLATES array | PASS |
| Both fixtures (sample-cv, multi-page-cv) tested | PASS |
| Playwright discovers parity tests | PASS (7 tests) |
| Artifacts use tests/output/parity/ | PASS |
| Key link: spec -> test-generator via generateTestCv | PASS |

## Files Changed

| File | Change |
|------|--------|
| tests/helpers/parity-utils.ts | Created - PDF comparison utilities |
| tests/print-parity.spec.ts | Created - Print parity test suite |

## Key Code

### compareForParity function

```typescript
export async function compareForParity(
  cliPdfPath: string,
  browserPdfPath: string,
): Promise<ParityResult> {
  const cliPdf = await PDFDocument.load(await readFile(cliPdfPath));
  const browserPdf = await PDFDocument.load(await readFile(browserPdfPath));

  const cliPageCount = cliPdf.getPageCount();
  const browserPageCount = browserPdf.getPageCount();

  if (cliPageCount !== browserPageCount) {
    issues.push(`Page count mismatch: CLI=${cliPageCount}, Browser=${browserPageCount}`);
  }

  return { match: issues.length === 0, cliPageCount, browserPageCount, ... };
}
```

### Test structure

```typescript
const TEMPLATES: TemplateType[] = ['modern', 'minimal', 'classic'];
const FIXTURES: FixtureType[] = ['sample-cv', 'multi-page-cv'];

for (const template of TEMPLATES) {
  for (const fixture of FIXTURES) {
    test(`${fixture} print parity`, async ({ page }) => {
      // 1. Generate CLI PDF via test-generator
      // 2. Generate browser PDF via page.pdf()
      // 3. Compare page counts
      // 4. Store artifacts
      expect(browserPageCount).toBe(cliPageCount);
    });
  }
}
```

## Next Steps

Plan 02 will run the actual parity tests to verify browser print output matches CLI output.
