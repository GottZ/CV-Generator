# Architecture Patterns: PDF Pagination, Print CSS, and Automated Testing

**Domain:** PDF pagination improvements, HTML/PDF print parity, automated PDF testing
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

This document describes how improved PDF pagination, print CSS parity, and automated PDF testing integrate with the existing CV Generator architecture. The existing Puppeteer-based HTML-to-PDF pipeline provides solid foundations; the new features primarily require CSS modifications in templates and new test files rather than architectural changes.

**Key finding:** The existing architecture already supports the integration points needed. Pagination improvements are pure CSS changes. Print parity requires consistent @media print rules. Automated testing needs new test files using existing Playwright infrastructure plus pdf-parse for content verification.

## Existing Architecture Overview

```
Input                    Processing                   Output
-----                    ----------                   ------

cv.md (Markdown)
    |
    v
[gray-matter + marked]
    |
    v
CVData (JSON)
    |
    v
[Nunjucks Templates]  <---  CSS (styles.css + _print.css)
    |
    v
HTML (intermediate)
    |
    +------> [Output Writer] ------> HTML file
    |
    +------> [Puppeteer + pdf-lib] ------> PDF file
    |
    +------> [docx library] ------> DOCX file
```

### Existing Component Boundaries

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Template Engine | `packages/templates/src/` | Renders CVData to HTML with embedded CSS |
| PDF Generator | `packages/cli/src/lib/pdf-generator.ts` | HTML-to-PDF via Puppeteer with injected print CSS |
| PDF Metadata | `packages/cli/src/lib/pdf-metadata.ts` | Sets title, author, subject via pdf-lib |
| PDF Bookmarks | `packages/cli/src/lib/pdf-bookmarks.ts` | Adds section bookmarks via @lillallol/outline-pdf |
| Browser Manager | `packages/cli/src/lib/browser-manager.ts` | Singleton Puppeteer browser lifecycle |
| CSS Files | `templates/_shared/partials/`, `templates/*/styles.css` | Styling including @media print rules |

## Integration Points

### 1. PDF Pagination (CSS Changes Only)

**Where changes occur:** Template CSS files only

**Existing integration points:**
- `templates/_shared/partials/_print.css` - Shared print rules
- `templates/*/styles.css` - Template-specific print rules
- `packages/cli/src/lib/pdf-generator.ts` - Injects `ATS_PRINT_CSS` at render time

**Data flow (unchanged):**
```
HTML with embedded CSS
    |
    v
Puppeteer page.goto()
    |
    v
ATS_PRINT_CSS injected via page.addStyleTag()
    |
    v
page.pdf() with preferCSSPageSize: true
    |
    v
PDF with pagination
```

**Current pagination CSS (from `_print.css`):**
```css
@media print {
  .section {
    break-inside: auto;
    page-break-inside: auto;
    orphans: 3;
    widows: 3;
  }

  .section h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  .entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

**Improvements needed:**
- Fine-tune orphans/widows values
- Add `.entry.long-entry` escape hatch for long entries
- Ensure skill categories stay together
- Test with various CV lengths (1-page, 2-page, edge cases)

### 2. Print CSS Parity (CSS + Testing)

**Where changes occur:** CSS files and new test assertions

**Existing integration points:**
- `templates/_shared/partials/_print.css` - Shared print rules
- `templates/*/styles.css` - Template-specific @media print blocks
- `packages/cli/src/lib/pdf-generator.ts` - `ATS_PRINT_CSS` constant

**Current approach:**
The codebase has three layers of print CSS:
1. **Shared print rules** (`_print.css`) - Imported by templates
2. **Template-specific print rules** - In each template's `styles.css`
3. **Runtime injection** - `ATS_PRINT_CSS` in pdf-generator.ts

**Problem:** Duplication between `_print.css` and `ATS_PRINT_CSS` creates maintenance burden and potential drift.

**Recommended consolidation:**
```
templates/_shared/partials/_print.css   <-- Single source of truth
        |
        v
templates/*/styles.css (imports _print.css)
        |
        v
HTML output (CSS embedded via template rendering)
        |
        v
Puppeteer reads HTML (no separate injection needed)
```

Remove duplicated rules from `ATS_PRINT_CSS` in `pdf-generator.ts`, keeping only the ATS-specific ligature disabling:
```typescript
const ATS_PRINT_CSS = `
@media print {
  /* Disable ligatures for ATS text extraction (ATS-01) */
  * {
    font-variant-ligatures: none !important;
    font-feature-settings: "liga" 0, "clig" 0 !important;
  }
}
`;
```

### 3. Automated PDF Testing (New Test Files)

**Where changes occur:** New test files in `tests/` directory

**Existing test infrastructure:**
- Playwright configured (`@playwright/test` in devDependencies)
- Existing test: `tests/theme-toggle.spec.ts` (Playwright browser tests)
- Test runner: `bun test` for unit tests, Playwright for E2E

**New components needed:**

| Component | Purpose | Location |
|-----------|---------|----------|
| PDF content tests | Verify text extraction, page count | `tests/pdf-content.test.ts` |
| PDF pagination tests | Verify page breaks, no orphans | `tests/pdf-pagination.test.ts` |
| Visual regression tests | Screenshot comparison | `tests/pdf-visual.spec.ts` |
| Test utilities | PDF parsing helpers | `tests/utils/pdf-utils.ts` |

**New dev dependency:**
```json
{
  "devDependencies": {
    "pdf-parse": "^1.1.1"
  }
}
```

**Testing data flow:**
```
Generate test PDF
    |
    +------> [pdf-parse] ------> Text content + page count
    |                               |
    |                               v
    |                           Assert text present
    |                           Assert page count
    |
    +------> [Playwright] ------> Screenshot of PDF in browser
                                    |
                                    v
                                Visual comparison with baseline
```

## Recommended Project Structure

```
/tests/
    pdf-content.test.ts       # Text extraction, page count (bun test)
    pdf-pagination.test.ts    # Page break validation (bun test)
    pdf-visual.spec.ts        # Visual regression (Playwright)
    theme-toggle.spec.ts      # Existing Playwright test
    utils/
        pdf-utils.ts          # PDF parsing helpers

/templates/
    _shared/
        partials/
            _print.css        # SINGLE SOURCE OF TRUTH for print rules
            _reset.css
            _theme.css
    base/
        styles.css            # Imports _print.css, adds template-specific
    modern/
        styles.css            # Imports _print.css, adds template-specific
    minimal/
        styles.css            # Imports _print.css, adds template-specific
    classic/
        styles.css            # Imports _print.css, adds template-specific

/packages/cli/src/lib/
    pdf-generator.ts          # Simplified: only ATS-specific injection
```

## Patterns to Follow

### Pattern 1: CSS Fragmentation for Page Breaks

**What:** Use modern CSS fragmentation properties with legacy fallbacks
**When:** All pagination rules in print CSS
**Example:**
```css
@media print {
  /* Keep entries together when possible */
  .entry {
    break-inside: avoid;
    page-break-inside: avoid;  /* Legacy fallback */
  }

  /* Allow long entries to break (escape hatch) */
  .entry.long-entry {
    break-inside: auto;
    page-break-inside: auto;
  }

  /* Keep headers with following content */
  .section h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* Control orphans/widows for text blocks */
  .section {
    orphans: 3;
    widows: 3;
  }

  /* Skills categories should stay together */
  .skill-category {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

### Pattern 2: PDF Content Testing with pdf-parse

**What:** Extract text and page count for assertions
**When:** Automated tests verifying PDF content
**Example:**
```typescript
// tests/utils/pdf-utils.ts
import pdfParse from 'pdf-parse';

export interface PdfContent {
  text: string;
  pageCount: number;
  info: {
    title?: string;
    author?: string;
  };
}

export async function parsePdf(pdfPath: string): Promise<PdfContent> {
  const buffer = await Bun.file(pdfPath).arrayBuffer();
  const data = await pdfParse(Buffer.from(buffer));

  return {
    text: data.text,
    pageCount: data.numpages,
    info: {
      title: data.info?.Title,
      author: data.info?.Author,
    },
  };
}

// tests/pdf-content.test.ts
import { describe, expect, test } from 'bun:test';
import { parsePdf } from './utils/pdf-utils';

describe('PDF content verification', () => {
  test('contains expected sections', async () => {
    const pdf = await parsePdf('people/testuser/output/testuser_base_en.pdf');

    expect(pdf.text).toContain('Experience');
    expect(pdf.text).toContain('Education');
    expect(pdf.text).toContain('Skills');
  });

  test('has correct page count for standard CV', async () => {
    const pdf = await parsePdf('people/testuser/output/testuser_base_en.pdf');

    // Typical CV should be 1-2 pages
    expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
    expect(pdf.pageCount).toBeLessThanOrEqual(2);
  });

  test('metadata is set correctly', async () => {
    const pdf = await parsePdf('people/testuser/output/testuser_base_en.pdf');

    expect(pdf.info.title).toContain('CV');
    expect(pdf.info.author).toBeTruthy();
  });
});
```

### Pattern 3: Visual Regression for PDFs with Playwright

**What:** Screenshot comparison to catch unintended visual changes
**When:** Ensuring PDF rendering consistency across changes
**Example:**
```typescript
// tests/pdf-visual.spec.ts
import { expect, test } from '@playwright/test';
import path from 'node:path';

const PDF_PATH = path.resolve(
  __dirname,
  '../people/testuser/output/testuser_base_en.pdf',
);

test.describe('PDF visual regression', () => {
  test('page 1 matches baseline', async ({ page }) => {
    // Load PDF in browser's PDF viewer via iframe
    await page.goto(`file://${PDF_PATH}#page=1`);

    // Wait for PDF to render
    await page.waitForTimeout(1000);

    // Screenshot comparison with threshold for minor rendering differences
    await expect(page).toHaveScreenshot('pdf-page-1.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('page 2 matches baseline (if exists)', async ({ page }) => {
    // Only run if PDF has 2 pages
    await page.goto(`file://${PDF_PATH}#page=2`);
    await page.waitForTimeout(1000);

    // Check if page 2 exists by looking for PDF viewer content
    const hasPage2 = await page.evaluate(() => {
      // PDF viewers typically show page count
      return document.body.innerText.includes('2');
    });

    if (hasPage2) {
      await expect(page).toHaveScreenshot('pdf-page-2.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});
```

### Pattern 4: Pagination Validation Test

**What:** Verify page breaks don't create orphaned content
**When:** Testing pagination rules work correctly
**Example:**
```typescript
// tests/pdf-pagination.test.ts
import { describe, expect, test } from 'bun:test';
import { parsePdf } from './utils/pdf-utils';

describe('PDF pagination', () => {
  test('contact info is on page 1', async () => {
    const pdf = await parsePdf('people/testuser/output/testuser_base_en.pdf');

    // Extract page 1 text (pdf-parse doesn't split by page easily)
    // Alternative: use pdfjs-dist for per-page extraction
    expect(pdf.text.indexOf('testuser@example.com')).toBeLessThan(500);
  });

  test('no empty first page', async () => {
    const pdf = await parsePdf('people/testuser/output/testuser_base_en.pdf');

    // If page count is > 1, first characters should have content
    const firstChars = pdf.text.slice(0, 100).trim();
    expect(firstChars.length).toBeGreaterThan(20);
  });

  test('reasonable page count for content', async () => {
    const pdf = await parsePdf('people/testuser/output/testuser_base_en.pdf');

    // A standard CV shouldn't exceed 3 pages
    expect(pdf.pageCount).toBeLessThanOrEqual(3);
  });
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Duplicated Print CSS
**What:** Same rules in `_print.css`, template CSS, and `ATS_PRINT_CSS`
**Why bad:** Changes must be made in multiple places, rules can drift
**Instead:** Single source of truth in `_print.css`, imported by templates

### Anti-Pattern 2: Testing PDF via File Comparison
**What:** Binary comparison of PDF files
**Why bad:** PDFs contain timestamps, random IDs; will always differ
**Instead:** Test content via pdf-parse, visuals via screenshot comparison

### Anti-Pattern 3: Hardcoded Page Expectations
**What:** `expect(pageCount).toBe(2)` for specific test files
**Why bad:** Content changes require test updates
**Instead:** Use ranges or relative assertions (`<= 3`, `>= 1`)

### Anti-Pattern 4: Testing Print CSS via Screen Rendering
**What:** Using browser's screen mode to test print styles
**Why bad:** Print styles only apply in print/PDF context
**Instead:** Generate actual PDF, then verify

### Anti-Pattern 5: Ignoring Float Interaction
**What:** Using `break-inside: avoid` without checking parent floats
**Why bad:** Floated parents break CSS fragmentation
**Why not an issue here:** CV templates use flexbox, not floats

## Component Boundaries (New vs Modified)

| Status | Component | Changes Required |
|--------|-----------|------------------|
| MODIFY | `templates/_shared/partials/_print.css` | Add/refine pagination rules |
| MODIFY | `templates/*/styles.css` | Remove duplicated print rules, rely on import |
| MODIFY | `packages/cli/src/lib/pdf-generator.ts` | Simplify `ATS_PRINT_CSS` |
| NEW | `tests/pdf-content.test.ts` | Content/page count tests |
| NEW | `tests/pdf-pagination.test.ts` | Pagination verification |
| NEW | `tests/pdf-visual.spec.ts` | Visual regression tests |
| NEW | `tests/utils/pdf-utils.ts` | PDF parsing utilities |
| MODIFY | `package.json` | Add pdf-parse devDependency |

## Suggested Build Order

Based on dependencies between features:

### Phase 1: CSS Pagination Improvements (No New Dependencies)
1. Audit current pagination rules in `_print.css` and template CSS files
2. Consolidate all print rules into `_print.css`
3. Simplify `ATS_PRINT_CSS` in pdf-generator.ts
4. Add refined pagination rules (orphans, widows, skill categories)
5. Manual testing with various CV lengths

### Phase 2: Print CSS Parity (CSS Only)
1. Ensure all templates import `_print.css`
2. Remove duplicated @media print blocks from template CSS
3. Verify HTML print preview matches PDF output
4. Document print CSS architecture

### Phase 3: Automated PDF Testing (New Dependencies)
1. Add `pdf-parse` as devDependency
2. Create `tests/utils/pdf-utils.ts` with parsing helpers
3. Add `tests/pdf-content.test.ts` for text/metadata verification
4. Add `tests/pdf-pagination.test.ts` for page count validation
5. Add `tests/pdf-visual.spec.ts` for visual regression
6. Configure Playwright for PDF screenshot tests
7. Generate baseline screenshots for visual regression

**Rationale for order:**
- Phase 1 is pure CSS, no dependencies, low risk
- Phase 2 depends on Phase 1 consolidation
- Phase 3 depends on working pagination to create meaningful baselines

## Data Flow Changes

**Before (current):**
```
Template CSS (with print rules)
    |
    v
HTML (CSS embedded)
    |
    v
Puppeteer
    |
    +---> Inject ATS_PRINT_CSS (duplicated rules)
    |
    v
PDF
```

**After (recommended):**
```
_print.css (single source of truth)
    |
    v
Template CSS (imports _print.css)
    |
    v
HTML (CSS embedded, includes print rules)
    |
    v
Puppeteer
    |
    +---> Inject minimal ATS_PRINT_CSS (ligatures only)
    |
    v
PDF
    |
    +---> [pdf-parse] ---> Content tests
    |
    +---> [Playwright] ---> Visual tests
```

## Scalability Considerations

| Concern | At 1 Template | At 4 Templates | At 10+ Templates |
|---------|---------------|----------------|------------------|
| Print CSS maintenance | Trivial | Moderate (current state) | High without consolidation |
| Visual regression baselines | 2 screenshots | 8 screenshots | 20+ screenshots |
| Test runtime | ~2s | ~5s | ~15s (parallelize) |

**Recommendation:** Consolidate print CSS now before adding more templates.

## Sources

### Primary (HIGH confidence)
- [MDN: page-break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/page-break-inside) - CSS fragmentation reference
- [MDN: orphans](https://developer.mozilla.org/en-US/docs/Web/CSS/orphans) - Orphan control reference
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Official snapshot testing docs
- [Playwright Snapshot Assertions](https://playwright.dev/docs/api/class-snapshotassertions) - API reference

### Secondary (MEDIUM confidence)
- [PDF Content Verification in Playwright](https://medium.com/bosphorusiss/verify-pdf-contents-using-playwright-and-node-js-dd3cf6749f70) - Integration approach
- [PDF Visual Regression Testing](https://medium.com/the-crc-tech-blog/pdf-visual-regression-testing-the-puppetmaster-approach-7a575d6c5559) - Testing patterns
- [CSS-Tricks: page-break](https://css-tricks.com/almanac/properties/p/page-break/) - Practical guidance
- [PrintCSS: Widows and Orphans](https://printcss.net/articles/widows-and-orphans) - Print typography

### Tertiary (LOW confidence)
- Various blog posts on PDF testing strategies

## Metadata

**Confidence breakdown:**
- Integration points: HIGH - Based on direct codebase analysis
- CSS patterns: HIGH - Based on MDN and established best practices
- Testing patterns: MEDIUM - Based on community approaches, not official docs
- Build order: HIGH - Based on dependency analysis

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
