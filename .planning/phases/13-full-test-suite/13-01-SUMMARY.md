---
phase: 13-full-test-suite
plan: 01
subsystem: test-infrastructure
tags: [unpdf, text-extraction, ats-verification, playwright]

dependency-graph:
  requires: [09-02]
  provides: [TEXT-EXTRACTION-TESTS, UNPDF-HELPER]
  affects: [ats-quality-verification]

tech-stack:
  added: [unpdf@1.4.0]
  patterns: [pdf-text-extraction, ats-content-verification]

key-files:
  created:
    - tests/helpers/text-extraction.ts
    - tests/text-extraction.spec.ts
  modified:
    - package.json

decisions:
  - id: unpdf-for-extraction
    choice: Use unpdf library for PDF text extraction
    rationale: Serverless-optimized, zero-dependency PDF.js wrapper; Bun-compatible
  - id: ligature-verification
    choice: Test words containing fi ligature sequences (Proficient, notification)
    rationale: Verifies font-variant-ligatures:none CSS works correctly for ATS readability

metrics:
  duration: ~5 minutes
  completed: 2026-01-25
---

# Phase 13 Plan 01: ATS Text Extraction Tests Summary

**One-liner:** PDF text extraction helper using unpdf with 6 ATS verification tests confirming name, title, experience, skills, education, and ligature handling.

## What Was Done

### Task 1: Add unpdf dependency and create text extraction helper

Created `/workspace/tests/helpers/text-extraction.ts` with:
- `TextExtractionResult` interface with totalPages, text, pageTexts fields
- `extractTextFromPdf()` function using unpdf's getDocumentProxy and extractText
- JSDoc documentation with usage examples
- Both merged and per-page text extraction for detailed analysis

Added unpdf@1.4.0 to devDependencies in package.json.

**Commit:** d7c6bfd (included in earlier structural tests commit)

### Task 2: Create text extraction test suite

Created `/workspace/tests/text-extraction.spec.ts` with 6 test cases:

1. **extracts candidate name from PDF** - Verifies "Test User" is readable
2. **extracts professional title/summary** - Verifies "Senior Software Engineer" and summary phrases
3. **extracts work experience** - Verifies company names (TechCorp, StartupXYZ) and achievements
4. **extracts skills correctly** - Verifies TypeScript, React, PostgreSQL, etc.
5. **ligature words extract correctly** - Verifies "Proficient" and "notification" (fi ligature words)
6. **extracts education section** - Verifies University of Texas, Bachelor of Science, Computer Science

**Commit:** 4f6b4c5

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed lint errors in tests/structural.spec.ts**

- **Found during:** Task 1 commit attempt
- **Issue:** Pre-existing lint errors blocked commit (unused import, non-null assertions)
- **Fix:** Removed unused TemplateType import, changed ! to ?. for optional chaining
- **Files modified:** tests/structural.spec.ts
- **Commit:** d7c6bfd

**2. [Rule 1 - Bug] Fixed ligature test using wrong words**

- **Found during:** Task 2 test run
- **Issue:** Test used "efficient" which doesn't exist in sample-cv.md fixture
- **Fix:** Changed to test "Proficient" and "notification" which exist in fixture and contain fi ligature
- **Files modified:** tests/text-extraction.spec.ts
- **Commit:** 4f6b4c5

## Verification Results

| Check | Status |
|-------|--------|
| unpdf in devDependencies | PASS |
| text-extraction.ts exports extractTextFromPdf | PASS |
| text-extraction.ts exports TextExtractionResult | PASS |
| text-extraction.spec.ts has 6+ test cases | PASS (6 tests) |
| All tests pass | PASS (6/6) |
| Tests verify real fixture content | PASS |
| Key link: spec -> text-extraction via import | PASS |
| Key link: text-extraction -> unpdf via import | PASS |

## Files Changed

| File | Change |
|------|--------|
| package.json | Modified - added unpdf@1.4.0 |
| bun.lock | Modified - lockfile updated |
| tests/helpers/text-extraction.ts | Created - PDF text extraction utility |
| tests/text-extraction.spec.ts | Created - ATS text extraction tests |

## Key Code

### Text extraction helper

```typescript
export async function extractTextFromPdf(
  pdfPath: string,
): Promise<TextExtractionResult> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const perPageResult = await extractText(pdf, { mergePages: false });
  return { totalPages, text, pageTexts: Array.isArray(perPageResult.text) ? perPageResult.text : [perPageResult.text] };
}
```

### Test structure

```typescript
test.describe('ATS Text Extraction', () => {
  let extractedText: string;

  test.beforeAll(async () => {
    const result = await generateTestCv({ template: 'modern', fixture: 'sample-cv' });
    const extraction = await extractTextFromPdf(result.pdf);
    extractedText = extraction.text;
  });

  test('extracts candidate name from PDF', async () => {
    expect(extractedText).toContain('Test User');
  });

  test('ligature words extract correctly', async () => {
    // Verify fi ligature words extract correctly
    expect(extractedText).toContain('Proficient');
    expect(extractedText).toContain('notification');
  });
});
```

## Test Results

```
Running 6 tests using 1 worker

  ✓ extracts candidate name from PDF (3ms)
  ✓ extracts professional title/summary (3ms)
  ✓ extracts work experience (3ms)
  ✓ extracts skills correctly (4ms)
  ✓ ligature words extract correctly (3ms)
  ✓ extracts education section (2ms)

  6 passed (2.6s)
```

## Next Steps

Plan 02 (if exists) would add visual regression tests (TEST-01) and Puppeteer regression detection (TEST-08).
