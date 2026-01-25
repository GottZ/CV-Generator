# Phase 12: Print Parity Verification - Research

**Researched:** 2026-01-25
**Domain:** Browser print-to-PDF, Playwright automation, visual comparison, print parity testing
**Confidence:** HIGH

## Summary

Phase 12 verifies that browser Ctrl+P print output matches CLI-generated PDF output across all three templates (Modern, Minimal, Classic). The work focuses exclusively on HTML print capability verification - the existing Puppeteer PDF generation (including two-pass layout optimization) is not modified.

**Key findings:** Playwright provides both `page.pdf()` for browser print-to-PDF and screenshot comparison via `toHaveScreenshot()`. The project already has Playwright configured with visual regression testing for HTML print-media emulation. For true browser print parity testing, we need to compare Playwright's browser-generated PDF against Puppeteer's CLI-generated PDF, not screenshot comparisons which are already in place.

**Primary recommendation:** Use Playwright `page.pdf()` to generate browser print PDFs, then compare against existing Puppeteer PDFs using screenshot-based visual diff. Tests should run on-demand only (not in CI) and store artifacts in `tests/output/`. Reuse existing test fixtures (`sample-cv.md`, `multi-page-cv.md`) and test generator infrastructure from Phase 9.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | ^1.57.0 | Browser automation and PDF generation | Already installed, `page.pdf()` for print-to-PDF, visual comparison built-in |
| `puppeteer` | ^24.36.0 | CLI PDF generation (existing) | Already used by pdf-generator.ts |
| `pdf-lib` | ^1.17.1 | PDF metadata extraction | Already installed, page count and metadata comparison |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sharp` | ^0.34.5 | Image manipulation for comparison | Already installed, optional for diff image generation |
| `pixelmatch` | (via Playwright) | Perceptual image diff | Built into Playwright's `toHaveScreenshot()` |

### No Additional Dependencies Needed
All required tools are already installed in the project. The existing Playwright and Puppeteer infrastructure provides everything needed for print parity verification.

## Architecture Patterns

### Comparison Strategy Overview

The phase verifies two methods produce equivalent output:

```
Method A: CLI PDF Generation (Puppeteer)
  cv.md -> render.ts -> HTML -> pdf-generator.ts -> Puppeteer page.pdf() -> PDF

Method B: Browser Print (Playwright)
  cv.md -> render.ts -> HTML -> Open in Browser -> Playwright page.pdf() -> PDF
```

The key insight is that both Puppeteer and Playwright use Chromium's PDFium engine, so differences should be minimal. The main variables are:
1. CSS injection (ATS_PRINT_CSS is added in Puppeteer path only)
2. Page margins (Puppeteer uses explicit margins, browser uses @page rules)
3. Header/footer (Puppeteer injects footer template)

### Pattern 1: Playwright page.pdf() for Browser Print Simulation

**What:** Use Playwright's `page.pdf()` to generate a PDF that simulates browser Ctrl+P output
**When to use:** Testing print parity between browser and CLI
**Example:**
```typescript
// Source: Playwright docs - page.pdf()
import { test } from '@playwright/test';

test('browser print generates valid PDF', async ({ page }) => {
  // Open the generated HTML file
  await page.goto(`file://${htmlPath}`);

  // Wait for fonts and content
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  // Generate PDF using browser print engine
  // This simulates Ctrl+P -> Save as PDF
  await page.pdf({
    path: 'tests/output/browser-print.pdf',
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true, // Use @page rules from CSS
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '25mm',
      right: '25mm',
    },
  });
});
```

### Pattern 2: PDF-to-Screenshot Comparison

**What:** Convert both PDFs to screenshots and compare visually
**When to use:** Comparing CLI PDF vs browser PDF output
**Example:**
```typescript
// Source: Phase 9 approach + pdf rendering pattern
import { test, expect } from '@playwright/test';

test('CLI and browser PDFs match visually', async ({ page, browser }) => {
  const cliPdfPath = 'tests/output/cli-generated.pdf';
  const browserPdfPath = 'tests/output/browser-generated.pdf';

  // Screenshot CLI PDF
  await page.goto(`file://${cliPdfPath}`);
  await page.waitForTimeout(1000); // PDF rendering delay
  const cliScreenshot = await page.screenshot({ fullPage: true });

  // Screenshot browser PDF
  const page2 = await browser.newPage();
  await page2.goto(`file://${browserPdfPath}`);
  await page2.waitForTimeout(1000);
  const browserScreenshot = await page2.screenshot({ fullPage: true });

  // Compare with tolerance
  // Note: Playwright compares against stored baselines by default
  // For direct comparison, use external pixelmatch
});
```

### Pattern 3: Matching Puppeteer Settings in Playwright

**What:** Configure Playwright page.pdf() to match Puppeteer settings exactly
**When to use:** Achieving maximum parity between generation methods
**Key settings alignment:**

| Setting | Puppeteer (pdf-generator.ts) | Playwright Equivalent |
|---------|------------------------------|----------------------|
| `format` | 'A4' | 'A4' |
| `printBackground` | true | true |
| `preferCSSPageSize` | true | true (uses @page rules) |
| `margin.top` | '20mm' | '20mm' |
| `margin.bottom` | '20mm' | '20mm' |
| `margin.left` | '25mm' | '25mm' |
| `margin.right` | '25mm' | '25mm' |
| `displayHeaderFooter` | true | true (if testing footer) |
| `headerTemplate` | `<span></span>` | `<span></span>` |
| `footerTemplate` | (custom) | (same template) |

**Critical difference:** Puppeteer injects `ATS_PRINT_CSS` after page load. For browser print parity, users printing from HTML won't have this CSS injected - they get only what's in the HTML file. This is intentional: the consolidated `_print.css` (Phase 10) should handle all pagination without needing ATS_PRINT_CSS injection.

### Pattern 4: Page-by-Page Comparison

**What:** Compare PDFs page by page rather than full document
**When to use:** Multi-page CVs where single-page comparison is insufficient
**Example:**
```typescript
// Source: Phase 9 approach + multi-page handling
import { PDFDocument } from 'pdf-lib';

async function comparePdfsPageByPage(
  cliPdfPath: string,
  browserPdfPath: string,
  page: Page,
  threshold: number = 0.03 // 3% pixel diff threshold
): Promise<{ match: boolean; diffPages: number[] }> {
  const cliPdf = await PDFDocument.load(await readFile(cliPdfPath));
  const browserPdf = await PDFDocument.load(await readFile(browserPdfPath));

  const cliPageCount = cliPdf.getPageCount();
  const browserPageCount = browserPdf.getPageCount();

  if (cliPageCount !== browserPageCount) {
    return {
      match: false,
      diffPages: [-1] // -1 indicates page count mismatch
    };
  }

  // Screenshot each page and compare
  // Implementation continues with page navigation...
}
```

### Anti-Patterns to Avoid

- **Exact pixel matching (0% threshold):** Anti-aliasing differences are unavoidable between different PDF generation paths
- **Comparing PDF bytes directly:** Timestamps, metadata, compression variations make byte comparison useless
- **Testing in CI pipeline:** Font rendering varies across environments; on-demand testing is more reliable
- **Ignoring header/footer:** The Puppeteer PDF has custom footer; browser print may not - this is a known difference
- **Modifying PDF generation:** This phase tests parity, not changes PDF generation code

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation from HTML | Canvas rendering | Playwright/Puppeteer `page.pdf()` | Full browser rendering engine |
| Visual PDF comparison | Custom pixel diff | Playwright screenshot + threshold | Built-in perceptual diff |
| PDF metadata extraction | PDF byte parsing | `pdf-lib` | Clean API, already installed |
| Test fixture management | New fixtures | Existing `sample-cv.md`, `multi-page-cv.md` | Reuse Phase 9 infrastructure |
| Test output storage | Custom directories | `tests/output/` | Matches existing pattern |

## Common Pitfalls

### Pitfall 1: Footer Mismatch is Expected

**What goes wrong:** Browser print PDF missing the name + page number footer
**Why it happens:** Puppeteer injects footer via `footerTemplate`, browser print uses only HTML/CSS
**How to avoid:** Document as known limitation; browser print shows no footer by design
**Resolution:** Add to PRINTING.md that CLI PDF has footer, browser print does not

### Pitfall 2: ATS_PRINT_CSS Not Applied in Browser Print

**What goes wrong:** Ligatures not disabled in browser print PDF
**Why it happens:** `ATS_PRINT_CSS` is injected at runtime by pdf-generator.ts, not embedded in HTML
**How to avoid:** This is working as designed - `_print.css` handles pagination, ATS rules are CLI-only
**Warning signs:** Text extraction from browser print PDF may have ligature issues

### Pitfall 3: Different @page Margin Handling

**What goes wrong:** Content clipped or shifted in browser print vs CLI PDF
**Why it happens:** Puppeteer margins override @page, browser respects @page directly
**How to avoid:** Ensure `@page { margin: 20mm 0; }` matches Puppeteer settings (already fixed in Phase 10-11)
**Warning signs:** First page header position differs between PDFs

### Pitfall 4: Font Rendering Differences

**What goes wrong:** Text anti-aliasing varies between PDFs
**Why it happens:** Even with same Chromium version, font hinting can vary by code path
**How to avoid:** Use 2-5% pixel threshold for comparison; don't require exact match
**Warning signs:** Diff images show text edges highlighted

### Pitfall 5: Multi-Page Navigation in PDF Viewer

**What goes wrong:** Screenshot captures only visible portion of PDF
**Why it happens:** Chromium PDF viewer is scrollable, not paginated
**How to avoid:** Set viewport to full page height or screenshot each page separately
**Source:** Phase 9 research - same issue documented

### Pitfall 6: Running Tests in CI

**What goes wrong:** Tests pass locally, fail in CI (or vice versa)
**Why it happens:** Font rendering, Chromium versions, Docker environment differences
**How to avoid:** Run parity tests on-demand only, not in automated pipeline
**Rationale:** CONTEXT.md specifies "Tests run on-demand only (not on every PR)"

## Code Examples

### Complete Print Parity Test Suite

```typescript
// Source: Synthesis of Phase 9 patterns + CONTEXT.md requirements
// tests/print-parity.spec.ts

import { test, expect } from '@playwright/test';
import { generateTestCv, cleanupTestOutput, type TemplateType } from './helpers/test-generator';
import { getPdfPageCount, getPdfMetadata } from './helpers/pdf-utils';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.join(process.cwd(), 'tests', 'output', 'parity');

// Note: These tests run on-demand only, not in CI
test.describe('Print parity verification', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await mkdir(OUTPUT_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    // Don't cleanup - keep artifacts for review
    // await cleanupTestOutput();
  });

  for (const template of ['modern', 'minimal', 'classic'] as TemplateType[]) {
    test.describe(`${template} template`, () => {

      test('single-page CV parity', async ({ page }) => {
        // Generate CLI PDF using existing infrastructure
        const cliResult = await generateTestCv({
          template,
          fixture: 'sample-cv',
        });

        // Generate browser print PDF using Playwright
        await page.goto(`file://${cliResult.html}`);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);

        const browserPdfPath = path.join(
          OUTPUT_DIR,
          `${template}-single-browser.pdf`
        );

        await page.pdf({
          path: browserPdfPath,
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            top: '20mm',
            bottom: '20mm',
            left: '25mm',
            right: '25mm',
          },
        });

        // Compare page counts
        const cliPageCount = await getPdfPageCount(cliResult.pdf);
        const browserPageCount = await getPdfPageCount(browserPdfPath);

        expect(browserPageCount).toBe(cliPageCount);

        // Visual comparison via screenshots
        // Screenshot CLI PDF
        await page.goto(`file://${cliResult.pdf}`);
        await page.waitForTimeout(1000);
        await page.setViewportSize({ width: 794, height: 1123 });
        const cliScreenshot = await page.screenshot({ fullPage: true });

        // Screenshot browser PDF
        await page.goto(`file://${browserPdfPath}`);
        await page.waitForTimeout(1000);
        const browserScreenshot = await page.screenshot({ fullPage: true });

        // Store for manual review
        await writeFile(
          path.join(OUTPUT_DIR, `${template}-single-cli.png`),
          cliScreenshot
        );
        await writeFile(
          path.join(OUTPUT_DIR, `${template}-single-browser.png`),
          browserScreenshot
        );

        // Note: toHaveScreenshot requires baseline - use manual comparison
        // or implement custom pixelmatch comparison
      });

      test('multi-page CV parity', async ({ page }) => {
        const cliResult = await generateTestCv({
          template,
          fixture: 'multi-page-cv',
        });

        await page.goto(`file://${cliResult.html}`);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);

        const browserPdfPath = path.join(
          OUTPUT_DIR,
          `${template}-multi-browser.pdf`
        );

        await page.pdf({
          path: browserPdfPath,
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            top: '20mm',
            bottom: '20mm',
            left: '25mm',
            right: '25mm',
          },
        });

        // Critical: Page counts must match
        const cliPageCount = await getPdfPageCount(cliResult.pdf);
        const browserPageCount = await getPdfPageCount(browserPdfPath);

        expect(browserPageCount).toBe(cliPageCount);
      });
    });
  }
});
```

### PDF Metadata Comparison Helper

```typescript
// Source: Existing pdf-utils.ts + CONTEXT.md requirements
// tests/helpers/parity-utils.ts

import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

export interface ParityResult {
  match: boolean;
  cliPageCount: number;
  browserPageCount: number;
  cliMetadata: {
    title: string | undefined;
    author: string | undefined;
  };
  browserMetadata: {
    title: string | undefined;
    author: string | undefined;
  };
  issues: string[];
}

export async function compareForParity(
  cliPdfPath: string,
  browserPdfPath: string
): Promise<ParityResult> {
  const cliBytes = await readFile(cliPdfPath);
  const browserBytes = await readFile(browserPdfPath);

  const cliPdf = await PDFDocument.load(cliBytes);
  const browserPdf = await PDFDocument.load(browserBytes);

  const issues: string[] = [];

  // Page count comparison (critical)
  const cliPageCount = cliPdf.getPageCount();
  const browserPageCount = browserPdf.getPageCount();

  if (cliPageCount !== browserPageCount) {
    issues.push(`Page count mismatch: CLI=${cliPageCount}, Browser=${browserPageCount}`);
  }

  // Metadata comparison (non-critical per CONTEXT.md)
  const cliMetadata = {
    title: cliPdf.getTitle(),
    author: cliPdf.getAuthor(),
  };

  const browserMetadata = {
    title: browserPdf.getTitle(),
    author: browserPdf.getAuthor(),
  };

  // Note: Browser print may not preserve metadata - document as known limitation

  return {
    match: issues.length === 0,
    cliPageCount,
    browserPageCount,
    cliMetadata,
    browserMetadata,
    issues,
  };
}
```

### Diff Image Generation (Optional)

```typescript
// Source: Sharp documentation + visual diff pattern
// tests/helpers/diff-generator.ts

import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

export async function generateDiffImage(
  image1Path: string,
  image2Path: string,
  outputPath: string
): Promise<{ diffPixels: number; totalPixels: number; diffRatio: number }> {
  const img1 = await sharp(image1Path).raw().toBuffer({ resolveWithObject: true });
  const img2 = await sharp(image2Path).raw().toBuffer({ resolveWithObject: true });

  if (img1.info.width !== img2.info.width || img1.info.height !== img2.info.height) {
    throw new Error('Image dimensions do not match');
  }

  const { width, height, channels } = img1.info;
  const totalPixels = width * height;
  let diffPixels = 0;

  const diffBuffer = Buffer.alloc(width * height * 4); // RGBA output

  for (let i = 0; i < totalPixels; i++) {
    const offset1 = i * channels;
    const offset2 = i * channels;
    const outOffset = i * 4;

    const r1 = img1.data[offset1];
    const g1 = img1.data[offset1 + 1];
    const b1 = img1.data[offset1 + 2];

    const r2 = img2.data[offset2];
    const g2 = img2.data[offset2 + 1];
    const b2 = img2.data[offset2 + 2];

    // Simple threshold-based diff
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

    if (diff > 30) { // Threshold for "different"
      diffPixels++;
      // Mark as red in diff image
      diffBuffer[outOffset] = 255;
      diffBuffer[outOffset + 1] = 0;
      diffBuffer[outOffset + 2] = 0;
      diffBuffer[outOffset + 3] = 255;
    } else {
      // Keep original (grayscale for clarity)
      const gray = Math.round((r1 + g1 + b1) / 3);
      diffBuffer[outOffset] = gray;
      diffBuffer[outOffset + 1] = gray;
      diffBuffer[outOffset + 2] = gray;
      diffBuffer[outOffset + 3] = 255;
    }
  }

  await sharp(diffBuffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  return {
    diffPixels,
    totalPixels,
    diffRatio: diffPixels / totalPixels,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Ctrl+P comparison | Automated Playwright PDF generation | Always available | Reproducible testing |
| Screenshot diff libraries | Playwright built-in comparison | Playwright 1.22+ | No external deps |
| Puppeteer-only testing | Playwright for browser print simulation | Playwright matured | True browser print testing |
| CI-based visual tests | On-demand parity tests | Phase 12 decision | Avoids environment issues |

**Key insight:** Playwright's `page.pdf()` and Puppeteer's `page.pdf()` both use Chromium, but through different integration paths. Testing both methods validates that the HTML/CSS is correctly structured for browser print, not just Puppeteer's specific rendering.

## Open Questions

### 1. Exact Diff Threshold
- **What we know:** CONTEXT.md specifies 2-5% acceptable pixel difference
- **What's unclear:** Optimal threshold within that range for each template
- **Recommendation:** Start at 3%, adjust per template based on initial test results

### 2. Footer Handling
- **What we know:** CLI PDF has footer (name + page numbers), browser print does not
- **What's unclear:** Should browser print test include footer, or document as known difference?
- **Recommendation:** Document as known limitation in PRINTING.md; footer is CLI-only feature

### 3. Baseline Storage Strategy
- **What we know:** Parity test artifacts go in `tests/output/`
- **What's unclear:** Should parity baselines be committed or generated fresh each run?
- **Recommendation:** Generate fresh each run; compare CLI vs browser within same run

### 4. Failure Handling Workflow
- **What we know:** CONTEXT.md says "Claude decides severity based on real-world print usage impact"
- **What's unclear:** Exact criteria for fix vs. log decision
- **Recommendation:** Page count mismatch = fix required; visual differences within threshold = log as known issue

## Testing Requirements Mapping

| Requirement | Verification Method |
|-------------|---------------------|
| PRINT-01: HTML prints with same pagination as PDF output | Compare page counts between CLI PDF and browser PDF |
| PRINT-05: All 3 templates have print parity | Run tests for modern, minimal, classic templates |

## Files to Create/Modify

| File | Action |
|------|--------|
| `tests/print-parity.spec.ts` | New - Print parity test suite |
| `tests/helpers/parity-utils.ts` | New - PDF comparison helpers |
| `docs/PRINTING.md` | New - User guide for browser printing |
| `.planning/phases/12-*/12-VERIFICATION.md` | New - Verification report with results |

## Existing Infrastructure to Reuse

| Component | Location | Purpose |
|-----------|----------|---------|
| Test fixtures | `tests/fixtures/sample-cv.md`, `multi-page-cv.md` | CV content for testing |
| Test generator | `tests/helpers/test-generator.ts` | `generateTestCv()` for CLI PDF generation |
| PDF utilities | `tests/helpers/pdf-utils.ts` | `getPdfPageCount()`, `getPdfMetadata()` |
| Playwright config | `playwright.config.ts` | Browser settings, screenshot config |
| Docker test environment | `Dockerfile.test`, `docker-compose.test.yml` | Consistent rendering environment |

## Sources

### Primary (HIGH confidence)
- [Playwright page.pdf()](https://playwright.dev/docs/api/class-page#page-pdf) - Official API for browser PDF generation
- [Puppeteer page.pdf()](https://pptr.dev/api/puppeteer.page.pdf) - Official API (for comparison)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Screenshot comparison documentation
- Phase 9-11 research documents - Established patterns in this project

### Secondary (MEDIUM confidence)
- [pdf-lib Documentation](https://pdf-lib.js.org/) - PDF manipulation API
- [Chromium PDF Viewer](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/pdf/) - Understanding PDF rendering

### Tertiary (LOW confidence)
- Stack Overflow discussions on PDF comparison - Various approaches, limited official guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, well-documented
- Architecture: HIGH - Builds directly on Phase 9 patterns
- Pitfalls: HIGH - Known issues documented in previous phases and CONTEXT.md
- Code examples: MEDIUM - Patterns verified but specific implementation needs testing

**Research date:** 2026-01-25
**Valid until:** 2026-04-25 (90 days - Playwright/Puppeteer APIs are stable)

---

## Recommendations for Planning

### Estimated Effort

| Task | Estimate |
|------|----------|
| Create print-parity.spec.ts | 1-2 hours |
| Create parity-utils.ts helpers | 30 min |
| Run initial parity tests, identify issues | 1 hour |
| Fix CSS issues (if any) | 1-2 hours |
| Create PRINTING.md user guide | 1 hour |
| Create 12-VERIFICATION.md report | 30 min |

**Total: 5-7 hours**

### Testing Checklist

- [ ] Modern template: single-page parity (page count, visual)
- [ ] Modern template: multi-page parity (page count, visual)
- [ ] Minimal template: single-page parity
- [ ] Minimal template: multi-page parity
- [ ] Classic template: single-page parity
- [ ] Classic template: multi-page parity
- [ ] Document known limitations (footer, ATS CSS)
- [ ] Create PRINTING.md user guide

### Success Criteria from CONTEXT.md

1. User can open generated HTML, press Ctrl+P, and get visually equivalent output to CLI PDF
2. Page breaks occur at same locations in browser print and Puppeteer PDF
3. All 3 templates verified
4. Known limitations documented in PRINTING.md
