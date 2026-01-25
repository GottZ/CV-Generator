---
phase: 13-full-test-suite
plan: 02
subsystem: test-infrastructure
tags: [playwright, structural-tests, pdf-quality, page-count, metadata, file-size]

dependency-graph:
  requires: [09-02]
  provides: [TEST-03, TEST-04, TEST-05]
  affects: [pdf-quality-verification]

tech-stack:
  patterns: [centralized-test-suite, serial-test-mode, pdf-metadata-extraction]

key-files:
  created:
    - tests/structural.spec.ts

decisions:
  - id: centralized-structural-tests
    choice: Create single structural.spec.ts for all structural quality tests
    rationale: Consolidates page count, metadata, and file size tests for easier maintenance
  - id: pre-fetch-metadata
    choice: Fetch all PDF metadata in beforeAll hook
    rationale: Reduces test execution time by generating CVs and fetching metadata once
  - id: reasonable-size-bounds
    choice: 10KB minimum, 5MB maximum for PDF file sizes
    rationale: 10KB catches empty/failed generation; 5MB catches bloated embedded resources

metrics:
  duration: ~2 minutes
  completed: 2026-01-25
---

# Phase 13 Plan 02: PDF Structural Tests Summary

**One-liner:** Created centralized structural test suite verifying PDF page count (TEST-03), metadata presence (TEST-04), and file size sanity (TEST-05) across all templates and fixtures.

## What Was Done

### Task 1: Create structural test suite for page count verification (TEST-03)

Created `/workspace/tests/structural.spec.ts` with:
- Imports from `./helpers/pdf-utils` (getPdfMetadata) and `./helpers/test-generator` (generateTestCv)
- Serial mode configuration for deterministic execution
- beforeAll: Generates CVs for 4 template/fixture combinations
- afterAll: Cleans up test outputs

**Page Count Tests (TEST-03):**
- `sample CV produces 1-2 pages (modern template)` - Short CV fits on 1-2 pages
- `sample CV produces 1-2 pages (minimal template)` - Short CV fits on 1-2 pages
- `sample CV produces 1-2 pages (classic template)` - Short CV fits on 1-2 pages
- `multi-page CV produces 2+ pages` - Long CV validates pagination CSS works
- `page count is reasonable upper bound` - Sanity check: no CV exceeds 10 pages

### Task 2: Add metadata and file size tests (TEST-04, TEST-05)

Extended structural.spec.ts with:

**PDF Metadata Tests (TEST-04):**
- `PDF has title metadata` - Verifies title is defined and non-empty
- `PDF has author metadata` - Verifies author is defined and non-empty

**File Size Sanity Tests (TEST-05):**
- `PDF is not empty (> 10KB)` - Catches generation failures
- `PDF is not bloated (< 5MB)` - Catches embedded resource issues
- `multi-page PDF is reasonably larger` - Multi-page larger but not 10x larger

**Summary Test:**
- `all templates produce valid PDFs` - Validates all 4 combinations have valid metadata

**Commit:** d7c6bfd

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| tests/structural.spec.ts exists with 80+ lines | PASS (155 lines) |
| Tests cover TEST-03 (page count) | PASS (5 tests) |
| Tests cover TEST-04 (metadata) | PASS (2 tests) |
| Tests cover TEST-05 (file size) | PASS (3 tests) |
| All tests pass | PASS (11/11) |
| Tests exercise all 3 templates | PASS (modern, minimal, classic) |
| Tests exercise both fixtures | PASS (sample-cv, multi-page-cv) |
| Key link: structural.spec.ts -> pdf-utils.ts | PASS |
| Key link: structural.spec.ts -> test-generator.ts | PASS |

## Files Changed

| File | Change |
|------|--------|
| tests/structural.spec.ts | Created - Centralized structural tests for PDF quality |

## Key Code

### Test structure with pre-fetched metadata

```typescript
test.describe('PDF Structural Tests', () => {
  test.describe.configure({ mode: 'serial' });

  const results: Record<string, TestCvResult> = {};
  const metadata: Record<string, PdfMetadata> = {};

  test.beforeAll(async () => {
    // Generate all CVs once
    results.modernSample = await generateTestCv({ template: 'modern', fixture: 'sample-cv' });
    results.modernMulti = await generateTestCv({ template: 'modern', fixture: 'multi-page-cv' });
    // ... more combinations

    // Pre-fetch metadata for all PDFs
    metadata.modernSample = await getPdfMetadata(results.modernSample.pdf);
    // ... more metadata
  });
});
```

### Page count verification (TEST-03)

```typescript
test('sample CV produces 1-2 pages (modern template)', () => {
  expect(metadata.modernSample.pageCount).toBeGreaterThanOrEqual(1);
  expect(metadata.modernSample.pageCount).toBeLessThanOrEqual(2);
});

test('multi-page CV produces 2+ pages', () => {
  expect(metadata.modernMulti.pageCount).toBeGreaterThanOrEqual(2);
});
```

### File size sanity (TEST-05)

```typescript
test('PDF is not empty (> 10KB)', () => {
  expect(metadata.modernSample.fileSize).toBeGreaterThan(10_000);
});

test('multi-page PDF is reasonably larger', () => {
  expect(metadata.modernMulti.fileSize).toBeGreaterThan(metadata.modernSample.fileSize);
  expect(metadata.modernMulti.fileSize).toBeLessThan(metadata.modernSample.fileSize * 10);
});
```

## Test Coverage Summary

| Requirement | Tests | Status |
|-------------|-------|--------|
| TEST-03: Page count verification | 5 | PASS |
| TEST-04: PDF metadata presence | 2 | PASS |
| TEST-05: File size sanity | 3 | PASS |
| Summary validation | 1 | PASS |
| **Total** | **11** | **PASS** |

## Next Steps

Plan 03 will add text extraction tests (TEST-01, TEST-02) for ATS verification - ensuring PDF text can be extracted and contains expected content.
