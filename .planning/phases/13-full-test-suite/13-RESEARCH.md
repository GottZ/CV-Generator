# Phase 13: Full Test Suite - Research

**Researched:** 2026-01-25
**Domain:** PDF testing automation, visual regression, text extraction
**Confidence:** HIGH

## Summary

This research investigates the testing stack for comprehensive PDF quality verification. The project already has substantial test infrastructure from Phase 9 (Docker CI, Playwright snapshots, pdf-lib metadata extraction). Phase 13 extends this to cover visual regression detection (TEST-01), ATS text extraction verification (TEST-02), and structural tests for page count, metadata, and file size (TEST-03 through TEST-05), plus Puppeteer regression detection (TEST-08).

The standard approach combines three libraries: **Playwright** for visual regression via HTML screenshot comparison, **unpdf** for PDF text extraction (ATS verification), and **pdf-lib** for PDF structure/metadata. Visual tests compare HTML screenshots at print media emulation (not PDF renders) to avoid font rendering inconsistencies. Text extraction tests verify that PDF text can be extracted reliably (mimicking ATS parsers).

**Primary recommendation:** Extend existing Playwright test infrastructure with unpdf for text extraction tests. Use HTML screenshots (not PDF-to-image) for visual regression. Keep structural tests using pdf-lib. Clean `tests/output/` in beforeAll, save artifacts only on failure.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | ^1.57.0 | Visual regression via toHaveScreenshot | Already installed, native snapshot support |
| unpdf | ^1.4.0 | PDF text extraction | Bun-compatible, zero-dep, serverless-optimized PDF.js |
| pdf-lib | ^1.17.1 | PDF metadata/structure | Already installed, pure JS, TypeScript support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdf-lib | ^1.17.1 | Page count, file size | Structural tests (TEST-03, TEST-04, TEST-05) |
| Node.js fs | Built-in | File operations | Cleanup, file size checks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| unpdf | pdf-parse | pdf-parse unmaintained, unpdf actively developed |
| unpdf | pdfjs-dist direct | More complex setup, unpdf wraps with simpler API |
| @cantoo/pdf-lib | pdf-lib | Fork has SVG support but original sufficient for metadata |

**Installation:**
```bash
bun add -d unpdf
# pdf-lib and @playwright/test already installed
```

## Architecture Patterns

### Recommended Test Structure
```
tests/
├── helpers/
│   ├── pdf-utils.ts         # Existing: metadata, page count
│   ├── test-generator.ts    # Existing: CV generation
│   ├── parity-utils.ts      # Existing: parity comparison
│   └── text-extraction.ts   # NEW: unpdf text extraction
├── fixtures/
│   ├── sample-cv.md         # Short CV fixture
│   └── multi-page-cv.md     # Multi-page CV fixture
├── output/                  # Gitignored, cleaned before runs
│   └── [artifacts on failure only]
├── pdf-modern.spec.ts       # Visual + structural for modern
├── pdf-classic.spec.ts      # Visual + structural for classic
├── pdf-minimal.spec.ts      # Visual + structural for minimal
├── text-extraction.spec.ts  # NEW: ATS text extraction tests
└── structural.spec.ts       # NEW: page count, metadata, file size
```

### Pattern 1: Visual Regression via HTML Screenshots
**What:** Screenshot HTML with print media emulation, compare to baselines
**When to use:** TEST-01 visual regression detection
**Why not PDF screenshots:** Font rendering varies by OS; HTML screenshots are deterministic in Docker
**Example:**
```typescript
// Source: Playwright docs - test-snapshots
await page.goto(`file://${htmlPath}`);
await page.emulateMedia({ media: 'print' });
await page.setViewportSize({ width: 794, height: 1123 }); // A4 at 96 DPI
await expect(page).toHaveScreenshot('template-variant.png', {
  fullPage: true,
  maxDiffPixelRatio: 0.01, // 1% tolerance (from playwright.config.ts)
});
```

### Pattern 2: Text Extraction Test Structure
**What:** Extract text from PDF, verify expected content present
**When to use:** TEST-02 ATS text extraction verification
**Example:**
```typescript
// Source: unpdf GitHub README
import { extractText, getDocumentProxy } from 'unpdf';
import { readFile } from 'node:fs/promises';

async function extractPdfText(pdfPath: string): Promise<string> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// In test:
const text = await extractPdfText(result.pdf);
expect(text).toContain('Test User'); // Name extracted
expect(text).toContain('Senior Software Engineer'); // Title extracted
expect(text).not.toContain('fi'); // No ligature artifacts
```

### Pattern 3: Cleanup in beforeAll (Not afterAll)
**What:** Clean tests/output/ before each test run, not after
**When to use:** All test files per CONTEXT.md decision
**Why:** Per CONTEXT.md - prevents stale artifact confusion, fresh state each run
**Example:**
```typescript
// Source: CONTEXT.md decision + Playwright best practices
import { rm, mkdir } from 'node:fs/promises';

test.beforeAll(async () => {
  // Clean output directory (CONTEXT.md: cleanup in beforeAll)
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(TEST_OUTPUT_DIR, { recursive: true });
});

// No cleanup in afterAll - artifacts preserved for debugging
```

### Pattern 4: Save Artifacts Only on Failure
**What:** Save PDF, diff images, HTML only when test fails
**When to use:** All tests per CONTEXT.md decision
**Example:**
```typescript
// Source: CONTEXT.md decision
import { copyFile, writeFile } from 'node:fs/promises';

test.afterEach(async ({ }, testInfo) => {
  if (testInfo.status !== 'passed') {
    const failDir = path.join(TEST_OUTPUT_DIR, testInfo.title.replace(/\s+/g, '-'));
    await mkdir(failDir, { recursive: true });

    // Save everything + HTML (CONTEXT.md decision)
    await copyFile(result.pdf, path.join(failDir, 'actual.pdf'));
    await copyFile(result.html, path.join(failDir, 'source.html'));
    // Diff images saved automatically by Playwright in test-results/
  }
});
```

### Anti-Patterns to Avoid
- **PDF-to-image comparison:** Font rendering inconsistency across OS; use HTML screenshots instead
- **Cleanup in afterAll:** Loses artifacts before debugging; clean in beforeAll instead
- **Always saving artifacts:** Clutters output; save on failure only per CONTEXT.md
- **Hard-coded absolute thresholds:** Use maxDiffPixelRatio (0.01) not maxDiffPixels for scale independence

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF parser | unpdf | PDF structure is complex, edge cases abound |
| Visual diff | Pixel-by-pixel comparison | Playwright toHaveScreenshot | Built-in perceptual diff, threshold support |
| PDF page count | Read PDF raw | pdf-lib | PDF format internals are complex |
| PDF metadata | Parse PDF header | pdf-lib | Metadata encoding varies, pdf-lib handles it |
| Test artifact cleanup | Manual file management | beforeAll/afterAll hooks | Playwright lifecycle guarantees execution |

**Key insight:** PDF is a complex format. Libraries like unpdf and pdf-lib abstract away encoding, compression, and structure details that would take months to implement correctly.

## Common Pitfalls

### Pitfall 1: Font Rendering Inconsistency
**What goes wrong:** Visual regression tests fail when run on different OS (Mac vs Linux)
**Why it happens:** Font rendering is handled by OS, not browser; sub-pixel differences compound
**How to avoid:**
- Run all visual tests inside Docker (Dockerfile.test already configured)
- Use `--font-render-hinting=none` Chrome flag (already in playwright.config.ts)
- Generate baseline snapshots in Docker, not locally
**Warning signs:** Tests pass locally but fail in CI, or vice versa

### Pitfall 2: Flaky Tests from Dynamic Content
**What goes wrong:** Tests fail randomly due to timestamps, dates, or variable content
**Why it happens:** CVs may contain dates, dynamic content changes between runs
**How to avoid:**
- Use fixed test fixtures with static dates (tests/fixtures/*.md already static)
- Mock Date.now() if generation includes current date
- Mask dynamic regions in screenshots if unavoidable
**Warning signs:** Intermittent failures with identical code

### Pitfall 3: Ligature Text Extraction Failure
**What goes wrong:** ATS can't find "efficient" because PDF contains "effi" ligature glyph
**Why it happens:** Fonts substitute character sequences with single glyphs
**How to avoid:**
- Already handled: pdf-generator.ts injects `font-variant-ligatures: none`
- Test for common ligature words: "efficient", "office", "different", "difficult"
**Warning signs:** Text extraction missing words with fi, fl, ff sequences

### Pitfall 4: Test Isolation with Serial Mode
**What goes wrong:** Tests pass individually but fail when run together
**Why it happens:** Serial mode with shared state between tests
**How to avoid:**
- Generate fresh CVs in beforeAll for each describe block
- Use separate output directories per test group
- Don't rely on cleanup between tests
**Warning signs:** Order-dependent test failures

### Pitfall 5: Puppeteer Version Drift
**What goes wrong:** PDF rendering changes after Puppeteer update (TEST-08)
**Why it happens:** Chromium/Puppeteer updates change text shaping, layout
**How to avoid:**
- Pin Puppeteer version in package.json
- Run visual tests after dependency updates
- Document expected snapshot updates in PRs that bump Puppeteer
**Warning signs:** Many visual test failures after package updates

### Pitfall 6: Empty Test Output Directory Assumption
**What goes wrong:** Tests fail because output directory doesn't exist
**Why it happens:** First run or after git clean has no tests/output/
**How to avoid:**
- Always mkdir with { recursive: true } before writing
- Gitignore tests/output/ (done via .gitignore)
**Warning signs:** ENOENT errors in test output

## Code Examples

Verified patterns from official sources:

### Text Extraction with unpdf
```typescript
// Source: https://github.com/unjs/unpdf
import { extractText, getDocumentProxy } from 'unpdf';
import { readFile } from 'node:fs/promises';

export interface TextExtractionResult {
  totalPages: number;
  text: string;
  /** Text per page for detailed analysis */
  pageTexts: string[];
}

export async function extractTextFromPdf(pdfPath: string): Promise<TextExtractionResult> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  // Get merged text
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  // Get per-page text for detailed assertions
  const { text: pageTexts } = await extractText(pdf, { mergePages: false });

  return {
    totalPages,
    text,
    pageTexts: Array.isArray(pageTexts) ? pageTexts : [pageTexts],
  };
}
```

### Visual Regression with Print Emulation
```typescript
// Source: Playwright docs - emulateMedia, toHaveScreenshot
import { test, expect } from '@playwright/test';

test('CV visual appearance', async ({ page }) => {
  await page.goto(`file://${htmlPath}`);
  await page.emulateMedia({ media: 'print' });
  await page.waitForLoadState('networkidle');

  // A4 dimensions at 96 DPI (standard web)
  await page.setViewportSize({ width: 794, height: 1123 });

  // Full page screenshot with configured threshold
  await expect(page).toHaveScreenshot('cv-appearance.png', {
    fullPage: true,
    // maxDiffPixelRatio from playwright.config.ts expect block
  });
});
```

### PDF Structural Validation
```typescript
// Source: pdf-lib.js.org, existing pdf-utils.ts
import { getPdfMetadata } from './helpers/pdf-utils';

test('PDF structure meets requirements', async () => {
  const metadata = await getPdfMetadata(pdfPath);

  // TEST-03: Page count expectations
  expect(metadata.pageCount).toBeGreaterThanOrEqual(1);
  expect(metadata.pageCount).toBeLessThanOrEqual(10); // Sanity check

  // TEST-04: Metadata presence
  expect(metadata.title).toBeDefined();
  expect(metadata.title).toContain('CV'); // Or candidate name

  // TEST-05: File size sanity
  expect(metadata.fileSize).toBeGreaterThan(10_000); // Not empty (>10KB)
  expect(metadata.fileSize).toBeLessThan(5_000_000); // Not bloated (<5MB)
});
```

### Artifact Saving on Failure
```typescript
// Source: Playwright test hooks, CONTEXT.md decisions
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.join(process.cwd(), 'tests', 'output');

test.afterEach(async ({ }, testInfo) => {
  // Only save artifacts on failure (CONTEXT.md decision)
  if (testInfo.status === 'passed') return;

  const safeTitle = testInfo.title.replace(/[^a-z0-9]/gi, '-');
  const failDir = path.join(OUTPUT_DIR, 'failures', safeTitle);
  await mkdir(failDir, { recursive: true });

  // Save PDF, HTML, and any generated artifacts
  // Diff images saved automatically by Playwright to test-results/
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse for extraction | unpdf | 2024 | pdf-parse unmaintained, unpdf actively developed |
| Screenshot PDF pages | Screenshot HTML with print media | 2023-2024 | Consistent rendering across OS |
| pixelmatch | Playwright toHaveScreenshot | 2022+ | Built-in perceptual diff, better tooling |
| Manual baseline management | Playwright snapshot assertions | 2022+ | Auto-updates, CI integration |

**Deprecated/outdated:**
- pdf-parse: Unmaintained, last update 4+ years ago; use unpdf instead
- pdf.js direct usage: Complex setup; unpdf provides simpler wrapper
- jest-image-snapshot: Still works but Playwright native is better integrated

## Open Questions

Things that couldn't be fully resolved:

1. **unpdf Promise.withResolvers compatibility**
   - What we know: PDF.js v5.x uses Promise.withResolvers, requires Node 22+
   - What's unclear: Bun compatibility status (likely fine, but untested)
   - Recommendation: unpdf bundles a polyfilled serverless build by default; test during implementation

2. **Exact ligature words to test**
   - What we know: fi, fl, ff ligatures are common issues
   - What's unclear: Complete list of affected words in CV context
   - Recommendation: Test "efficient", "office", "professional", "difficult" as representative samples

3. **PDF metadata consistency across generation**
   - What we know: pdf-lib can read metadata, but browser print may not preserve it
   - What's unclear: Whether CLI-generated PDFs consistently have metadata set
   - Recommendation: Verify in implementation; accept undefined as valid for browser PDFs

## Sources

### Primary (HIGH confidence)
- [Playwright test-snapshots docs](https://playwright.dev/docs/test-snapshots) - Visual comparison configuration
- [Playwright SnapshotAssertions API](https://playwright.dev/docs/api/class-snapshotassertions) - toHaveScreenshot options
- [unpdf GitHub](https://github.com/unjs/unpdf) - Text extraction API and examples
- [pdf-lib.js.org](https://pdf-lib.js.org/) - Metadata and page count API

### Secondary (MEDIUM confidence)
- [BrowserStack Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) - Test isolation, hooks
- [TestDino Playwright Visual Testing](https://testdino.com/blog/playwright-visual-testing/) - Docker consistency
- [Medium: OS Independent Screenshot Testing](https://adequatica.medium.com/operating-system-independent-screenshot-testing-with-playwright-and-docker-6e2251a9eb32) - Font rendering in Docker

### Tertiary (LOW confidence)
- General web search results on visual regression flakiness
- Community discussions on ATS PDF parsing behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries verified via official docs, already partially installed
- Architecture: HIGH - Extends proven existing patterns, follows CONTEXT.md decisions
- Pitfalls: MEDIUM - Based on industry experience and official docs, some context-specific

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable libraries, infrequent changes)
