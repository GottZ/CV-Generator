# Phase 9: Test Infrastructure Foundation - Research

**Researched:** 2026-01-23
**Domain:** PDF testing infrastructure, Docker CI, snapshot baselines
**Confidence:** HIGH

## Summary

Phase 9 establishes the testing infrastructure required before any CSS changes, enabling regression detection throughout milestone v1.1. The work involves three key areas: (1) Docker-based CI environment for consistent PDF rendering, (2) baseline PDF snapshots for all three templates (Modern, Minimal, Classic), and (3) GitHub Actions workflow configuration.

The existing stack already provides most tools needed: Playwright 1.57.0 for visual regression, pdf-lib 1.17.1 for metadata, and Puppeteer 24.36.0 for PDF generation. The only new dependency needed is `unpdf` for text extraction testing (used in later Phase 13).

**Primary recommendation:** Use Playwright's built-in screenshot comparison for visual regression, run tests inside Docker with Chromium and `--font-render-hinting=none` for deterministic font rendering, and store baseline PNGs in version control.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | ^1.57.0 | Visual regression via screenshots | Already installed, built-in `toHaveScreenshot()`, CI-ready, maintained by Microsoft |
| `bun test` | (runtime) | Test runner | Native to Bun, Jest-compatible, built-in snapshot support |
| `oven/bun` | latest | Docker base image | Official Bun Docker image, consistent environment |
| `puppeteer` | ^24.36.0 | PDF generation in tests | Already installed, Google-maintained, generates PDFs with `--font-render-hinting=none` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pdf-lib` | ^1.17.1 | PDF metadata (page count) | Already installed, use for structural assertions |
| `unpdf` | ^1.4.0 | Text extraction from PDFs | Test-time only, use for content verification (Phase 13) |
| `pixelmatch` | (via Playwright) | Perceptual image diff | Built into Playwright's visual comparison |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright screenshots | pdf-visual-diff | Requires Jest, incompatible with Bun test runner |
| Playwright screenshots | jest-image-snapshot | Jest-only, not Bun-compatible |
| unpdf | pdf-parse v2 | Node version requirements (>=20.16.0), heavier |
| oven/bun Docker | ghcr.io/puppeteer/puppeteer | No Bun runtime, Node-only |

**Installation:**
```bash
# Test-time dependency for text extraction (Phase 13, but install now)
bun add -D unpdf

# No additional runtime dependencies needed for Phase 9
# Playwright and pdf-lib already installed
```

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── fixtures/                  # Test input data
│   ├── sample-cv.md          # Standard CV content for testing
│   └── multi-page-cv.md      # Long CV for pagination testing
├── __snapshots__/            # Playwright baseline images
│   ├── pdf-modern.spec.ts-snapshots/
│   │   ├── modern-page-1-chromium-linux.png
│   │   └── modern-page-2-chromium-linux.png
│   ├── pdf-minimal.spec.ts-snapshots/
│   └── pdf-classic.spec.ts-snapshots/
├── pdf-modern.spec.ts        # Modern template PDF tests
├── pdf-minimal.spec.ts       # Minimal template PDF tests
├── pdf-classic.spec.ts       # Classic template PDF tests
└── helpers/
    └── pdf-utils.ts          # PDF generation and screenshot helpers
```

### Pattern 1: PDF-to-Screenshot for Visual Regression
**What:** Generate PDF, render each page in Chromium, compare screenshots
**When to use:** Visual regression testing of PDF output
**Example:**
```typescript
// Source: Playwright official docs + Puppeteer PDF guide
import { test, expect } from '@playwright/test';
import { generatePdf } from '../packages/cli/src/lib/pdf-generator';

test('Modern template PDF visual regression', async ({ page }) => {
  // Generate PDF from test fixture
  const pdfPath = await generateTestPdf('modern', 'sample-cv');

  // Open PDF in browser (Chromium renders PDFs natively)
  await page.goto(`file://${pdfPath}`);

  // Wait for PDF to render
  await page.waitForSelector('embed[type="application/pdf"]', { timeout: 5000 });

  // Screenshot comparison with tolerance for anti-aliasing
  await expect(page).toHaveScreenshot('modern-page-1.png', {
    maxDiffPixelRatio: 0.01,  // Allow 1% pixel difference
  });
});
```

### Pattern 2: Docker-based Test Environment
**What:** Run all tests inside Docker container with consistent fonts and Chromium
**When to use:** CI pipeline, ensuring deterministic results
**Example Dockerfile:**
```dockerfile
# Source: Puppeteer Docker guide + Bun official image
FROM oven/bun:latest

# Install Chromium and fonts for consistent rendering
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-freefont-ttf \
    fonts-noto-cjk \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "test"]
```

### Pattern 3: Baseline Snapshot Management
**What:** Store baseline images in git, update with `--update-snapshots`
**When to use:** Initial baseline creation and after intentional visual changes
**Example:**
```bash
# Generate initial baselines (run in Docker for consistency)
docker compose run test bun test --update-snapshots

# Run tests to compare against baselines
docker compose run test bun test

# Update baselines after intentional changes
docker compose run test bun test --update-snapshots
```

### Anti-Patterns to Avoid
- **Running visual tests outside Docker:** Different fonts, rendering engines cause flaky tests
- **Using pixel-exact comparison (0 threshold):** Anti-aliasing differences cause false failures
- **Storing baselines generated on macOS:** Linux CI will have different font rendering
- **Testing PDF directly without screenshot:** Playwright can't diff PDF bytes meaningfully

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image comparison algorithm | Custom pixel diff | Playwright's built-in `toHaveScreenshot()` | Handles anti-aliasing, generates diff images |
| PDF page count | Parse PDF manually | `pdf-lib` getPageCount() | Already installed, battle-tested |
| Font rendering consistency | Install fonts manually in CI | Docker container with pinned fonts | Reproducible across all environments |
| CI workflow | Custom bash scripts | GitHub Actions with Docker | Native Docker support, caching, artifacts |

**Key insight:** The biggest complexity in PDF testing is environment consistency, not the testing itself. Docker solves this completely - don't fight font rendering differences across platforms.

## Common Pitfalls

### Pitfall 1: Font Rendering Differs Between Environments
**What goes wrong:** Tests pass locally on macOS, fail in CI on Linux due to font rendering differences
**Why it happens:** Different fontconfig versions, font hinting, anti-aliasing algorithms between OS
**How to avoid:**
- Run ALL tests inside Docker container
- Use `--font-render-hinting=none` Chromium flag
- Generate baselines in same Docker environment used in CI
**Warning signs:** Pixel diffs concentrated on text areas, tests flaky between local and CI

### Pitfall 2: PDF-to-Image Conversion Artifacts
**What goes wrong:** Visual regression detects differences that aren't in actual PDF
**Why it happens:** Different PDF renderers (pdf.js vs PDFium) produce different images from same PDF
**How to avoid:**
- Use Chromium's native PDF viewer (PDFium) for consistency
- Don't convert PDF to image with external library
- Capture screenshot of Chromium rendering the PDF
**Warning signs:** Edge anti-aliasing variations, slight color differences not visible in PDF

### Pitfall 3: Threshold Tuning Leads to False Negatives
**What goes wrong:** To stop flaky tests, threshold set too high, real bugs pass through
**Why it happens:** Fighting flaky tests by increasing tolerance eventually tolerates real bugs
**How to avoid:**
- Start with strict threshold (0.01 = 1% pixel ratio)
- Only loosen with documented justification
- Use `maxDiffPixelRatio` not `maxDiffPixels` for resolution independence
**Warning signs:** Threshold keeps increasing, developers distrust test results

### Pitfall 4: Dynamic Content Causes Flaky Tests
**What goes wrong:** Tests fail intermittently due to timestamps or dates in PDF
**Why it happens:** Generation timestamps change between baseline and test run
**How to avoid:**
- Use fixed test fixture data (no dates in test content)
- If dates required, mock `Date.now()` during test
- Exclude dynamic regions from comparison using Playwright's `mask` option
**Warning signs:** Failures correlate with time, diff shows date areas

### Pitfall 5: Multi-Page PDF Comparison Complexity
**What goes wrong:** Tests only compare first page, missing regressions on page 2+
**Why it happens:** Naive testing screenshots single view, PDF may have multiple pages
**How to avoid:**
- Navigate PDF pages using keyboard (Page Down) or PDF viewer controls
- Capture separate screenshot per page
- Store baselines as `template-page-N.png`
**Warning signs:** Regression on later pages undetected, manual review catches issues

## Code Examples

Verified patterns from official sources:

### PDF Generation Test Helper
```typescript
// Source: Existing pdf-generator.ts API + test patterns
import { generatePdf } from '../packages/cli/src/lib/pdf-generator';
import { PDFDocument } from 'pdf-lib';
import * as path from 'node:path';
import * as fs from 'node:fs';

export async function generateTestPdf(
  template: 'modern' | 'minimal' | 'classic',
  fixture: 'sample-cv' | 'multi-page-cv'
): Promise<string> {
  const fixtureDir = path.resolve(__dirname, '../fixtures');
  const outputDir = path.resolve(__dirname, '../output');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate HTML first (using existing template engine)
  const htmlPath = path.join(outputDir, `${fixture}_${template}.html`);
  const pdfPath = path.join(outputDir, `${fixture}_${template}.pdf`);

  // Use existing PDF generator
  await generatePdf({
    htmlPath,
    outputPath: pdfPath,
    name: 'Test User',
    locale: 'en',
  });

  return pdfPath;
}

export async function getPdfPageCount(pdfPath: string): Promise<number> {
  const pdfBuffer = await Bun.file(pdfPath).arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}
```

### Playwright Visual Regression Test
```typescript
// Source: Playwright docs - Visual comparisons
import { test, expect } from '@playwright/test';
import { generateTestPdf, getPdfPageCount } from './helpers/pdf-utils';

test.describe('Modern template PDF snapshots', () => {
  test('single page CV matches baseline', async ({ page }) => {
    const pdfPath = await generateTestPdf('modern', 'sample-cv');

    // Navigate to PDF in browser
    await page.goto(`file://${pdfPath}`);

    // Wait for PDF viewer to load
    await page.waitForTimeout(1000); // PDF rendering delay

    // Visual comparison
    await expect(page).toHaveScreenshot('modern-single-page.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });

  test('multi-page CV matches baseline', async ({ page }) => {
    const pdfPath = await generateTestPdf('modern', 'multi-page-cv');
    const pageCount = await getPdfPageCount(pdfPath);

    await page.goto(`file://${pdfPath}`);
    await page.waitForTimeout(1000);

    // Screenshot each page
    for (let i = 1; i <= pageCount; i++) {
      await expect(page).toHaveScreenshot(`modern-page-${i}.png`, {
        maxDiffPixelRatio: 0.01,
      });

      // Navigate to next page (if not last)
      if (i < pageCount) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(500);
      }
    }
  });
});
```

### GitHub Actions Workflow
```yaml
# Source: GitHub Actions docs + Docker guide
name: PDF Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build test container
        run: docker build -t cvgen-test -f Dockerfile.test .

      - name: Run tests
        run: |
          docker run --rm \
            --init \
            --cap-add=SYS_ADMIN \
            -v ${{ github.workspace }}:/app \
            cvgen-test \
            bun test

      - name: Upload test artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload snapshots diff
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: snapshot-diffs
          path: tests/__snapshots__/**/*-diff.png
          retention-days: 7
```

### Playwright Configuration for PDF Testing
```typescript
// Source: Playwright docs - Configuration
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for PDF generation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for consistent PDF generation
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent font rendering
        launchOptions: {
          args: ['--font-render-hinting=none'],
        },
      },
    },
  ],
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jest-image-snapshot | Playwright toHaveScreenshot | Playwright 1.22+ (2022) | Native integration, no external deps |
| Manual font installation | Docker with pinned fonts | Docker adoption ~2020 | Reproducible environments |
| pdf-parse for extraction | unpdf | 2024-2025 | Zero deps, Bun-compatible, serverless-ready |
| Custom pixelmatch setup | Playwright built-in diff | Playwright 1.22+ | Auto diff images, threshold config |

**Deprecated/outdated:**
- `pdf-visual-diff`: Requires Jest, not compatible with Bun
- `phantomjs` for PDF: Abandoned since 2018
- `wkhtmltopdf`: Deprecated, poor CSS support

## Open Questions

Things that couldn't be fully resolved:

1. **Bun + Puppeteer in Docker**
   - What we know: Known issue with `EBADF: Bad file descriptor` in some Docker setups
   - What's unclear: Whether latest Bun versions have resolved this
   - Recommendation: Use workaround script to install Chromium, test thoroughly

2. **Baseline Storage Strategy**
   - What we know: Baselines should be generated in Docker for consistency
   - What's unclear: Git LFS vs inline PNG for baseline storage (repo size concerns)
   - Recommendation: Start with inline PNG, monitor repo size, migrate to LFS if needed

3. **Multi-Page Navigation in Chromium PDF Viewer**
   - What we know: PageDown keyboard navigation works
   - What's unclear: Whether viewport clips correctly for multi-page PDFs
   - Recommendation: Test and document working navigation approach

## Sources

### Primary (HIGH confidence)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Official documentation for `toHaveScreenshot()`
- [Puppeteer Docker Guide](https://pptr.dev/guides/docker) - Official Docker setup
- [Bun Test Runner](https://bun.com/docs/test) - Official Bun testing documentation
- [Bun Docker Image](https://hub.docker.com/r/oven/bun) - Official Bun Docker image

### Secondary (MEDIUM confidence)
- [Puppeteer Issue #661](https://github.com/puppeteer/puppeteer/issues/661) - Font rendering consistency solutions
- [Puppeteer Issue #2410](https://github.com/puppeteer/puppeteer/issues/2410) - `--font-render-hinting=none` recommendation
- [unpdf GitHub](https://github.com/unjs/unpdf) - Zero-dependency PDF extraction, v1.4.0

### Tertiary (LOW confidence)
- [Puppeteer + Bun Issue #5943](https://github.com/oven-sh/bun/issues/5943) - Puppeteer Docker workarounds (needs validation)
- Community Docker images for Bun + Puppeteer - Variable quality, verify before use

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official, well-documented, already partially in use
- Architecture: HIGH - Patterns verified from official Playwright and Puppeteer docs
- Pitfalls: HIGH - Documented in multiple GitHub issues and community articles
- Docker setup: MEDIUM - Bun + Puppeteer combination less documented than Node

**Research date:** 2026-01-23
**Valid until:** 60 days (stable technologies, Docker patterns don't change frequently)
