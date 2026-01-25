# Testing Guide

This document describes the test infrastructure for the CV Generator project, including how to run tests, manage visual baselines, and handle Playwright/Puppeteer version updates.

## Overview

The test suite validates PDF quality across three dimensions:

1. **Visual Regression Tests** - Screenshot comparisons to detect layout changes
2. **Structural Tests** - Page count, metadata, and file size validation
3. **Text Extraction Tests** - ATS readability and content verification

## Running Tests

### All Tests

```bash
bunx playwright test
```

### Specific Test Suites

```bash
# ATS text extraction tests
bunx playwright test text-extraction.spec.ts

# Structural tests (page count, metadata, file size)
bunx playwright test structural.spec.ts

# Visual tests by template
bunx playwright test pdf-modern.spec.ts
bunx playwright test pdf-classic.spec.ts
bunx playwright test pdf-minimal.spec.ts

# All visual tests
bunx playwright test pdf-*.spec.ts
```

### Update Visual Baselines

When making intentional CSS/template changes, update baselines after review:

```bash
bunx playwright test --update-snapshots
```

## Test Infrastructure

### Helpers

The `tests/helpers/` directory contains shared test utilities:

| File | Purpose |
|------|---------|
| `artifact-utils.ts` | Cleanup and failure artifact management |
| `pdf-utils.ts` | PDF parsing (page count, metadata extraction) |
| `test-generator.ts` | CV generation via CLI for test fixtures |
| `text-extraction.ts` | PDF text extraction using unpdf |
| `parity-utils.ts` | Browser vs CLI PDF comparison utilities |

### Fixtures

Test fixtures in `tests/fixtures/`:

| File | Purpose |
|------|---------|
| `sample-cv.md` | Standard single-page CV for baseline tests |
| `multi-page-cv.md` | Extended CV (294 lines) for multi-page tests |

### Output Directory

`tests/output/` (gitignored) contains generated test artifacts:

- `{fixture}_{template}/output/` - Generated CV files during test runs
- `failures/` - Saved artifacts from failed tests for debugging

## Visual Regression Tests

Visual tests capture screenshots of rendered HTML with print media emulation and compare against baseline snapshots.

### How It Works

1. Tests generate CVs using the CLI (`generateTestCv()`)
2. Playwright navigates to the HTML file with `file://` protocol
3. Print media is emulated (`page.emulateMedia({ media: 'print' })`)
4. Viewport is set to A4 dimensions (794 x 1123 pixels at 96 DPI)
5. Full-page screenshots are compared against baselines

### Diff Threshold

From `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.01,  // 1% tolerance
    animations: 'disabled',
  },
},
```

### Docker Requirement

Visual tests must run in Docker for consistent font rendering across environments.

```bash
# CI runs tests in Docker automatically
# Local Docker testing:
docker build -t cv-generator-test -f Dockerfile.test .
docker run cv-generator-test
```

Different operating systems render fonts differently. Docker ensures:
- Consistent glyph shapes
- Identical kerning/spacing
- Matching baseline snapshots

### Updating Baselines

After intentional visual changes:

1. Run tests to see failures: `bunx playwright test pdf-*.spec.ts`
2. Review diff images in `playwright-report/`
3. Update if changes are correct: `bunx playwright test --update-snapshots`
4. Commit updated snapshots with explanation

## Updating Playwright/Puppeteer

Visual tests may fail after updating Playwright/Chromium due to rendering changes. This section documents the review process for dependency updates.

### Process

1. **Create a branch for the version update:**
   ```bash
   git checkout -b chore/playwright-1.XX
   ```

2. **Update the dependency:**
   ```bash
   bun update @playwright/test
   bunx playwright install chromium
   ```

3. **Run visual tests (expect failures):**
   ```bash
   bunx playwright test --reporter=list
   ```

4. **Review failures manually:**
   - Check `tests/output/failures/` for actual outputs (PDF, HTML)
   - Check `playwright-report/` for visual diff images
   - Compare with baseline snapshots in `tests/*.spec.ts-snapshots/`
   - Verify changes are rendering improvements, not regressions

5. **Update snapshots if changes are acceptable:**
   ```bash
   bunx playwright test --update-snapshots
   ```

6. **Commit with explanatory message:**
   ```bash
   git add tests/*.spec.ts-snapshots/
   git commit -m "chore: update Playwright to 1.XX

   Visual snapshot updates due to Chromium rendering changes:
   - [describe changes observed]

   All changes reviewed and confirmed as improvements/expected."
   ```

### Warning Signs

Review carefully if you observe:

- **Many tests fail:** Chromium had significant rendering changes
- **Text appears different:** Font rendering engine changed
- **Layout shifts:** CSS interpretation changed
- **Spacing changes:** Kerning or line-height calculations differ

Always review visual diffs before accepting snapshot updates. When in doubt, compare PDFs manually in a PDF viewer.

### Reverting Updates

If an update causes unacceptable regressions:

```bash
# Revert to previous Playwright version
bun add @playwright/test@1.XX  # Previous version
bunx playwright install chromium
```

## Artifact Management

### Cleanup Behavior

Per project decisions, cleanup happens in `beforeAll()` hooks, not `afterAll()`:

- `cleanTestOutput()` clears `tests/output/` at the start of each test run
- Artifacts are preserved after tests complete for debugging
- Fresh state guaranteed for each run

### Failure Artifacts

When tests fail, `saveFailureArtifacts()` saves debugging files:

| File | Description |
|------|-------------|
| `actual.pdf` | The generated PDF that failed comparison |
| `source.html` | The intermediate HTML before PDF conversion |

Location: `tests/output/failures/{template}-{test-name}/`

Non-empty `tests/output/failures/` directory indicates test failures.

### Diff Images

Playwright automatically saves visual comparison images on failure:

- `*-diff.png` - Highlighted differences
- `*-actual.png` - What the test produced
- `*-expected.png` - The baseline snapshot

Location: `playwright-report/` or `test-results/`

## CI/Docker

### Why Docker

Docker is required for CI to ensure consistent test results:

1. **Font rendering:** Different OS have different fonts and rendering
2. **Chromium version:** Docker pins the exact Chromium build
3. **Reproducibility:** Same results across all environments

### Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile.test` | Test container with fonts and Chromium |
| `.github/workflows/test.yml` | CI workflow running tests in Docker |
| `playwright.config.ts` | Test configuration and thresholds |

### Running CI Tests Locally

```bash
# Build test container
docker build -t cv-generator-test -f Dockerfile.test .

# Run tests
docker run --rm cv-generator-test bunx playwright test

# Run specific tests
docker run --rm cv-generator-test bunx playwright test pdf-modern.spec.ts
```

## Troubleshooting

### Tests fail only in CI

Font rendering differences. Run tests in Docker locally to reproduce.

### Tests fail after Playwright update

See "Updating Playwright/Puppeteer" section above.

### Visual tests pass but PDF looks wrong

Visual tests compare HTML rendering, not PDF directly. Check:
1. Print media styles are correct (`@media print`)
2. PDF generation options match (`pdf-generator.ts`)
3. Compare HTML output in browser print preview

### Text extraction tests fail

Check `font-variant-ligatures: none` is applied. Ligatures (fi, fl) break ATS parsing.
