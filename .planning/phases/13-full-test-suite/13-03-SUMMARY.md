---
phase: 13-full-test-suite
plan: 03
subsystem: test-infrastructure
tags: [playwright, visual-regression, artifact-management, puppeteer-upgrade, testing-documentation]

dependency-graph:
  requires: [13-01, 13-02, 09-02]
  provides: [TEST-01-enhanced, TEST-08]
  affects: [test-maintainability, debugging-workflow]

tech-stack:
  patterns: [centralized-artifact-management, beforeAll-cleanup, failure-only-artifacts]

key-files:
  created:
    - tests/helpers/artifact-utils.ts
    - docs/TESTING.md
  modified:
    - tests/pdf-modern.spec.ts
    - tests/pdf-classic.spec.ts
    - tests/pdf-minimal.spec.ts

decisions:
  - id: cleanup-in-beforeAll
    choice: Clean test output directory in beforeAll, not afterAll
    rationale: Preserves artifacts for debugging after failures; fresh state per run
  - id: failure-only-artifacts
    choice: Only save PDF/HTML artifacts on test failure
    rationale: Non-empty failures directory clearly indicates test issues
  - id: biome-ignore-empty-pattern
    choice: Use biome-ignore for Playwright's required empty object pattern
    rationale: Playwright requires destructuring pattern; linter doesn't allow empty {}

metrics:
  duration: ~5 minutes
  completed: 2026-01-25
---

# Phase 13 Plan 03: Visual Regression Enhancement Summary

**One-liner:** Centralized artifact management utilities with beforeAll cleanup, failure-only artifact saving, and comprehensive testing documentation including Puppeteer upgrade process for TEST-08.

## What Was Done

### Task 1: Create artifact management utilities

Created `/workspace/tests/helpers/artifact-utils.ts` with:

**Exports:**
- `TEST_OUTPUT_DIR` - Constant pointing to `tests/output/`
- `cleanTestOutput()` - Removes and recreates output directory
- `saveFailureArtifacts(testInfo, artifacts)` - Saves PDF/HTML on test failure

**Design per CONTEXT.md:**
- Cleanup in beforeAll (not afterAll) for debugging preservation
- Failure-only saving (passed tests leave no artifacts)
- Safe directory naming with regex sanitization

**Commit:** 800dda5

### Task 2: Update visual regression tests with artifact management

Updated all three visual test files:
- `tests/pdf-modern.spec.ts`
- `tests/pdf-classic.spec.ts`
- `tests/pdf-minimal.spec.ts`

**Changes:**
1. Import `cleanTestOutput` and `saveFailureArtifacts` from artifact-utils
2. Call `cleanTestOutput()` at start of `beforeAll` hook
3. Remove `afterAll` cleanup (was calling `cleanupTestOutput()`)
4. Add `afterEach` hook calling `saveFailureArtifacts()` on failure
5. Used biome-ignore comment for Playwright's required empty pattern

All 9 visual tests pass after changes.

**Commit:** dce4709

### Task 3: Create testing documentation with Puppeteer upgrade process

Created `/workspace/docs/TESTING.md` (275 lines) documenting:

1. **Overview** - Test categories (visual, structural, text extraction)
2. **Running Tests** - Commands for all test scenarios
3. **Test Infrastructure** - Helpers, fixtures, output directory
4. **Visual Regression Tests** - How snapshots work, diff threshold, Docker requirement
5. **Updating Playwright/Puppeteer (TEST-08)** - Complete upgrade process with:
   - Branch creation for updates
   - Dependency update commands
   - Manual review process for rendering changes
   - Snapshot update procedure
   - Warning signs to watch for
   - Revert instructions
6. **Artifact Management** - Cleanup behavior, failure artifacts location
7. **CI/Docker** - Why Docker required, configuration files
8. **Troubleshooting** - Common issues and solutions

**Commit:** b5de716

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| tests/helpers/artifact-utils.ts exports required functions | PASS |
| All 3 visual test files use cleanTestOutput in beforeAll | PASS |
| All 3 visual test files use saveFailureArtifacts in afterEach | PASS |
| All visual tests still pass (9/9) | PASS |
| docs/TESTING.md exists (275 lines > 80 minimum) | PASS |
| TESTING.md covers TEST-08 with actionable steps | PASS |
| Key link: pdf-modern.spec.ts -> artifact-utils.ts | PASS |

## Files Changed

| File | Change |
|------|--------|
| tests/helpers/artifact-utils.ts | Created - Centralized artifact management |
| tests/pdf-modern.spec.ts | Modified - Use artifact utilities |
| tests/pdf-classic.spec.ts | Modified - Use artifact utilities |
| tests/pdf-minimal.spec.ts | Modified - Use artifact utilities |
| docs/TESTING.md | Created - Test infrastructure documentation |

## Key Code

### Artifact utilities (artifact-utils.ts)

```typescript
export const TEST_OUTPUT_DIR = path.join(process.cwd(), 'tests', 'output');

export async function cleanTestOutput(): Promise<void> {
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(TEST_OUTPUT_DIR, { recursive: true });
}

export async function saveFailureArtifacts(
  testInfo: TestInfo,
  artifacts: FailureArtifacts,
): Promise<void> {
  if (testInfo.status === 'passed') return;

  const safeTitle = artifacts.label.replace(/[^a-z0-9]/gi, '-');
  const failDir = path.join(TEST_OUTPUT_DIR, 'failures', safeTitle);
  await mkdir(failDir, { recursive: true });

  if (artifacts.pdf) await copyFile(artifacts.pdf, path.join(failDir, 'actual.pdf'));
  if (artifacts.html) await copyFile(artifacts.html, path.join(failDir, 'source.html'));
}
```

### Visual test lifecycle hooks

```typescript
test.beforeAll(async () => {
  // Clean output directory first (CONTEXT.md: cleanup in beforeAll)
  await cleanTestOutput();

  // Generate CVs once, reuse for all tests
  singlePageResult = await generateTestCv({ template: 'modern', fixture: 'sample-cv' });
  multiPageResult = await generateTestCv({ template: 'modern', fixture: 'multi-page-cv' });
});

// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring pattern
test.afterEach(async ({}, testInfo) => {
  const isSinglePage = testInfo.title.includes('single');
  await saveFailureArtifacts(testInfo, {
    pdf: isSinglePage ? singlePageResult?.pdf : multiPageResult?.pdf,
    html: isSinglePage ? singlePageResult?.html : multiPageResult?.html,
    label: `modern-${testInfo.title}`,
  });
});
```

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| TEST-01 (enhanced) | PASS | Visual tests use centralized artifact management |
| TEST-08 | PASS | docs/TESTING.md "Updating Playwright/Puppeteer" section |

## Success Criteria Met

- [x] TEST-01 enhanced: Visual regression tests properly manage artifacts
- [x] TEST-08 satisfied: Puppeteer update process documented with clear steps
- [x] Artifact management centralized and consistent across all tests
- [x] Cleanup happens in beforeAll per CONTEXT.md decisions
- [x] Failure artifacts saved for debugging per CONTEXT.md decisions
- [x] Documentation enables contributors to maintain test suite

## Next Steps

Phase 13 is complete. All test infrastructure requirements (TEST-01 through TEST-08) are now implemented:
- TEST-01: Visual regression tests (Phase 9)
- TEST-02: ATS text extraction tests (13-01)
- TEST-03: Page count tests (13-02)
- TEST-04: PDF metadata tests (13-02)
- TEST-05: File size sanity tests (13-02)
- TEST-06: Docker CI infrastructure (Phase 9)
- TEST-07: Unit test coverage (Phase 9)
- TEST-08: Puppeteer upgrade process (13-03)
