# Feature Landscape: PDF Pagination, Print Parity & Automated Testing

**Domain:** CV Generator CLI - PDF quality improvements milestone
**Researched:** 2026-01-23
**Confidence:** HIGH (verified with official Puppeteer docs and multiple authoritative sources)

---

## Table Stakes

Features users expect for professional PDF output. Missing these = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **No orphan headings** | Section headers alone at page bottom look broken | Low | Existing CSS | `break-after: avoid` on h1-h4 |
| **No widow content** | Single lines at page top waste space and look sloppy | Low | Existing CSS | `orphans: 3; widows: 3` on paragraphs |
| **Keep sections together** | Work experience entries split mid-item is jarring | Medium | Template refactor | `break-inside: avoid` on entry containers |
| **Consistent margins** | Professional documents have balanced whitespace | Low | CSS `@page` | Already using Puppeteer, just needs `@page` rules |
| **Print backgrounds** | Colors/shading should appear in PDF | Low | Puppeteer config | `printBackground: true` (verify current config) |
| **Browser print parity** | Ctrl+P should match CLI output | Medium | Dual CSS approach | `@media print` rules must mirror Puppeteer settings |

### Implementation Details

**Orphan/Widow Control:**
```css
/* Prevent headers from being orphaned at page bottom */
h1, h2, h3, h4 {
  break-after: avoid;
  page-break-after: avoid; /* fallback for older renderers */
}

/* Prevent single lines at page boundaries */
p, li, td {
  orphans: 3;
  widows: 3;
}
```

**Section Container Protection:**
```css
/* Keep resume entries together on same page */
.experience-entry,
.education-entry,
.project-entry,
.certification-entry {
  break-inside: avoid;
  page-break-inside: avoid; /* fallback */
}
```

**@page Margin Setup:**
```css
@page {
  size: letter; /* or A4 for international */
  margin: 0.75in 0.75in 0.75in 0.75in;
}

/* Optional: Different first page margins */
@page :first {
  margin-top: 0.5in;
}
```

**Browser Support Notes:**
- `break-after: avoid` has incomplete Firefox support
- Chrome/Chromium (Puppeteer) support is excellent
- Include legacy `page-break-*` properties as fallbacks
- `orphans` and `widows` supported in all major browsers

---

## Differentiators

Features that set the tool apart. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Smart content fitting** | Reduce whitespace before page breaks by micro-adjusting spacing | High | Custom algorithm | Inspired by Eric Draken's algorithm |
| **Page number footer** | "Page 1 of 2" in multi-page CVs | Low | Puppeteer config | Special CSS classes: `pageNumber`, `totalPages` |
| **Named page styles** | Different margins for first page vs continuation | Medium | CSS `@page` named pages | `@page :first { }` syntax |
| **PDF visual regression tests** | Catch unintended layout changes automatically | Medium | pdf-visual-diff or similar | Integrates with Jest |
| **Template-specific baselines** | Each template has its own visual test baseline | Low | Test infrastructure | Separate snapshot directories per template |
| **Dynamic content masking** | Ignore dates/timestamps in visual comparisons | Low | pdf-visual-diff maskRegions | Prevents false positives |
| **Multi-page snapshot testing** | Test each page of PDF independently | Medium | pdf-visual-diff page iteration | Important for 2+ page CVs |
| **Page count assertions** | Verify expected page count in tests | Low | pdf-parse or similar | Catch unexpected pagination changes |

### Smart Content Fitting Algorithm

Based on [Eric Draken's optimized PDF page layout algorithm](https://ericdraken.com/algorithm-optimized-pdf-page-layout/):

**Problem Statement:**
When content slightly overflows to next page (creating near-empty final pages), instead of accepting the overflow, analyze whether spacing adjustments can fit it on the current page.

**Algorithm Concept:**
1. Identify content "slices" (sections, entries, paragraphs)
2. Calculate page boundaries with current spacing
3. When content slightly overflows (< 10% of page height):
   - Calculate required whitespace reduction to fit
   - If reduction is < 10% of current whitespace, apply proportional reduction
   - If insufficient, reduce content block spacing up to 5%
4. Only accept page break if reduction would exceed thresholds

**Example Implementation Approach:**
```javascript
// Pseudo-code concept
function optimizePageBreaks(contentSlices, pageHeight) {
  for (const page of pages) {
    const overflow = calculateOverflow(page, contentSlices);

    if (overflow > 0 && overflow < pageHeight * 0.1) {
      const whitespaceReduction = calculateRequiredReduction(page, overflow);

      if (whitespaceReduction < 0.1) { // Less than 10% reduction
        applyProportionalReduction(page, whitespaceReduction);
      }
    }
  }
}
```

**Complexity:** HIGH - requires DOM analysis and iterative adjustment. Consider as a post-MVP enhancement.

### Puppeteer Page Numbers

```javascript
await page.pdf({
  displayHeaderFooter: true,
  footerTemplate: `
    <div style="width: 100%; font-size: 9px; text-align: center; color: #666; padding-top: 5px;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
  margin: {
    top: '0.75in',
    bottom: '0.75in', // Must have margin for footer to show
    left: '0.75in',
    right: '0.75in'
  },
  printBackground: true,
  preferCSSPageSize: true,
});
```

**Important Notes:**
- Header/footer templates are separate from main document content
- They use special CSS classes that Puppeteer replaces at render time:
  - `pageNumber` - current page number
  - `totalPages` - total page count
  - `date` - formatted print date
  - `title` - document title
  - `url` - document URL
- Margins MUST be large enough to accommodate headers/footers
- Styles in templates must be inline (no external CSS)

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Complex margin box headers** | Chrome/Puppeteer support for `@page` margin boxes is incomplete; images in margin boxes fail in headless mode | Use Puppeteer's `headerTemplate`/`footerTemplate` with inline styles |
| **Cross-browser print perfection** | Safari/Firefox print behavior differs significantly from Chromium; endless edge cases | Target Puppeteer (Chromium) only; document browser print as "best effort" |
| **Pixel-perfect PDF-to-HTML matching** | PDF rendering engine differs from screen rendering; some differences inevitable | Aim for "visually equivalent" not "pixel identical" |
| **Fully automated page break optimization** | Complex algorithms (TeX-level) are deep rabbit holes with diminishing returns | Provide sensible CSS defaults plus manual override option |
| **Total pages in body content** | Puppeteer can only inject `totalPages` in header/footer templates, not main document body | Use footer for page numbers, not body text |
| **URL-based images in @page rules** | Headless Chrome silently fails to load external URLs in @page CSS | Use data URIs (base64) for any images in page margins |
| **Screen media type for PDFs** | Forces `page.emulateMediaType('screen')` which defeats print-specific styling | Keep print media type; ensure print styles are complete |
| **Exact visual regression thresholds** | Font rendering, anti-aliasing vary by system; 0% tolerance causes false positives | Use small threshold (0.1-0.5% pixel difference allowed) |
| **Testing every page size variation** | A4, Letter, Legal, etc. creates exponential test matrix | Pick one primary size (Letter for US, A4 for international), document others |

### Why "Pixel-Perfect" is an Anti-Feature

Sources consistently report these unavoidable variations:
- Puppeteer/headless Chrome rendering differs subtly from graphical Chrome
- `@media print` preview in DevTools doesn't show actual pagination
- Font rendering, anti-aliasing, and sub-pixel calculations vary by OS
- Same PDF may render slightly differently on different machines

**Recommendation:** Visual regression testing with a **threshold** (e.g., 0.1-0.5% pixel difference allowed) rather than exact match.

### Headless Chrome @page Image Limitation

From [Andre Arko's research](https://andre.arko.net/2025/05/25/chrome-headless-print-to-pdf/):

> "Headless Chrome will silently refuse to fetch any resources referenced in your @page CSS rules, so your `url()` images are fully invisible."

**Workaround:** Use data URIs (base64-encoded images) which do work in headless mode:
```css
@page {
  @top-center {
    /* This FAILS in headless: */
    /* content: url('/logo.png'); */

    /* This WORKS in headless: */
    content: url('data:image/png;base64,iVBORw0KGgo...');
  }
}
```

---

## Feature Dependencies

```
Existing Features (Already Built)
        |
        v
[PDF Generation via Puppeteer] -----> [Print CSS @media rules]
        |                                      |
        v                                      v
[Page Break Control CSS] <-------------> [Browser Print Parity]
        |
        v
[Visual Regression Tests] -----> [Template Baselines]
        |
        v
[Smart Content Fitting] (optional enhancement)
```

### Dependency Notes

1. **Page Break CSS** depends on template HTML structure having proper container elements (`.experience-entry`, etc.)
2. **Browser Print Parity** depends on CSS being authored for both `@media print` and Puppeteer consumption
3. **Visual Regression Tests** depend on stable PDF generation (page breaks must be predictable first)
4. **Smart Content Fitting** depends on page breaks working first (it's an optimization layer on top)

### Integration with Existing Codebase

Based on milestone context (already built):
- PDF generation via Puppeteer exists
- HTML output with embedded CSS exists
- 3 templates (Modern, Minimal, Classic) exist
- ATS-optimized single-column layouts exist

**Changes Required:**
1. Add page break CSS rules to existing template stylesheets
2. Add `@page` rules to each template
3. Verify/update Puppeteer PDF options (`printBackground`, margins)
4. Create `@media print` stylesheet section or file
5. Add test infrastructure for visual regression

---

## MVP Recommendation

### Phase 1: Page Break Foundation (Table Stakes)

**Must include:**
1. CSS page break rules (`break-inside: avoid`, `break-after: avoid`)
2. Orphan/widow control (`orphans: 3; widows: 3`)
3. Template HTML structure with proper container classes
4. `@page` rules for consistent margins
5. Verify `printBackground: true` in Puppeteer config

**Outcome:** PDFs no longer have awkward section splits, orphan headings, or near-empty last pages.

**Estimated effort:** Low - mostly CSS additions to existing templates

### Phase 2: Testing Infrastructure

**Must include:**
1. pdf-visual-diff integration with Jest
2. Baseline snapshots for all 3 templates
3. Sample CV data files for consistent testing
4. Threshold configuration (0.1-0.5% pixel variance allowed)
5. CI pipeline integration

**Outcome:** Layout regressions caught automatically before release.

**Estimated effort:** Medium - new test infrastructure, but well-documented libraries

### Phase 3: Print Parity

**Must include:**
1. `@media print` stylesheet that mirrors Puppeteer PDF output
2. Test workflow: generate PDF, then Ctrl+P HTML, compare
3. Documentation for users about browser print expectations
4. Handle edge cases (print dialogs, browser-specific quirks)

**Outcome:** Users can Ctrl+P the HTML output and get acceptable (not identical) results.

**Estimated effort:** Medium - requires careful CSS authoring and testing

### Defer to Post-MVP

- **Smart content fitting algorithm:** HIGH complexity, diminishing returns for CV use case
- **Page number footers:** Nice to have, not essential for 1-2 page CVs
- **Named page styles:** Edge case for most CVs
- **Multi-page PDF visual testing:** Can start with single-page, expand later

---

## Testing Strategy Recommendations

### Recommended Tool: pdf-visual-diff

[pdf-visual-diff](https://github.com/moshensky/pdf-visual-diff) is purpose-built for PDF visual regression testing.

**Why this tool:**
- Uses pdf.js (same renderer as browsers) for PDF-to-image conversion
- Jest integration with `toMatchPdfSnapshot()` matcher
- Supports region masking for dynamic content (dates, names)
- CLI for snapshot management (`approve`, `discard`)
- Lightweight - no external services required

**Installation:**
```bash
npm install -D pdf-visual-diff
```

**Jest Configuration:**
```json
{
  "jest": {
    "setupFilesAfterEnv": ["pdf-visual-diff/lib/toMatchPdfSnapshot"]
  }
}
```

**Example Test:**
```typescript
import { comparePdfToSnapshot } from 'pdf-visual-diff';
import { generateCV } from '../src/generator';

describe('CV PDF Generation', () => {
  const sampleData = require('./fixtures/sample-cv.json');

  it('modern template renders correctly', async () => {
    const pdfBuffer = await generateCV(sampleData, 'modern');
    const result = await comparePdfToSnapshot(
      pdfBuffer,
      __dirname + '/__snapshots__',
      'modern-template'
    );
    expect(result).toBe(true);
  });

  it('minimal template renders correctly', async () => {
    const pdfBuffer = await generateCV(sampleData, 'minimal');
    const result = await comparePdfToSnapshot(
      pdfBuffer,
      __dirname + '/__snapshots__',
      'minimal-template'
    );
    expect(result).toBe(true);
  });

  it('classic template renders correctly', async () => {
    const pdfBuffer = await generateCV(sampleData, 'classic');
    const result = await comparePdfToSnapshot(
      pdfBuffer,
      __dirname + '/__snapshots__',
      'classic-template'
    );
    expect(result).toBe(true);
  });
});
```

### Masking Dynamic Content

For CVs with dynamic dates or personalized content:

```typescript
import { comparePdfToSnapshot, RegionMask } from 'pdf-visual-diff';

const dateMask: RegionMask = {
  type: 'rectangle-mask',
  x: 400,      // X position of date region
  y: 50,       // Y position of date region
  width: 150,  // Width of masked area
  height: 20,  // Height of masked area
  color: 'White', // Mask color (white blends with typical CV backgrounds)
};

it('handles dynamic dates correctly', async () => {
  const pdfBuffer = await generateCV(dataWithDates, 'modern');
  const result = await comparePdfToSnapshot(
    pdfBuffer,
    __dirname + '/__snapshots__',
    'modern-with-dates',
    {
      maskRegions: (page) => page === 1 ? [dateMask] : [],
    }
  );
  expect(result).toBe(true);
});
```

### Alternative: Puppeteer Screenshot Method

If pdf-visual-diff doesn't meet needs, use the [PuppetMaster approach](https://medium.com/the-crc-tech-blog/pdf-visual-regression-testing-the-puppetmaster-approach-7a575d6c5559):

1. Open generated PDF in Chrome's built-in PDF viewer via Puppeteer
2. Navigate pages using keyboard simulation (right arrow)
3. Screenshot each page
4. Compare with jest-image-snapshot

```typescript
import puppeteer from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

async function screenshotPdfPages(pdfPath: string): Promise<Buffer[]> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Open PDF in Chrome's viewer
  await page.goto(`file://${pdfPath}`, { waitUntil: 'networkidle0' });

  const screenshots: Buffer[] = [];

  // Screenshot first page
  screenshots.push(await page.screenshot({ fullPage: true }));

  // Navigate to subsequent pages (right arrow in Chrome PDF viewer)
  // Note: Need to detect page count first
  for (let i = 1; i < pageCount; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100); // Allow render
    screenshots.push(await page.screenshot({ fullPage: true }));
  }

  await browser.close();
  return screenshots;
}
```

**Pros:** More control over comparison process
**Cons:** More infrastructure to maintain, browser-dependent

### Test Matrix

| Test Type | What It Catches | Frequency | Tool |
|-----------|-----------------|-----------|------|
| Visual regression (full PDF) | Layout shifts, font changes, spacing issues | Every PR | pdf-visual-diff |
| Page count assertion | Unexpected pagination changes | Every PR | pdf-parse |
| Content extraction | Text missing or reordered | On template changes | pdf-parse |
| Multi-page boundary check | Section splits across pages | On pagination logic changes | Custom |
| Print parity check | HTML print diverges from PDF | On CSS changes | Manual + screenshots |

### Page Count Test Example

```typescript
import { PdfReader } from 'pdfreader';

async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  return new Promise((resolve, reject) => {
    let pageCount = 0;
    new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
      if (err) reject(err);
      else if (!item) resolve(pageCount);
      else if (item.page) pageCount = item.page;
    });
  });
}

it('generates 1-page PDF for short CV', async () => {
  const shortCV = require('./fixtures/short-cv.json');
  const pdfBuffer = await generateCV(shortCV, 'modern');
  const pageCount = await getPdfPageCount(pdfBuffer);
  expect(pageCount).toBe(1);
});

it('generates 2-page PDF for long CV', async () => {
  const longCV = require('./fixtures/long-cv.json');
  const pdfBuffer = await generateCV(longCV, 'modern');
  const pageCount = await getPdfPageCount(pdfBuffer);
  expect(pageCount).toBe(2);
});
```

---

## Print Parity Implementation

### Challenge

Users expect Ctrl+P on the HTML output to match the PDF generated by the CLI. However:
- Browser print dialogs vary
- `@media print` has different behavior than Puppeteer
- Header/footer handling differs

### Strategy

1. **Unified CSS:** Write styles that work for both `@media print` and Puppeteer
2. **Explicit Print Styles:** Add `@media print { }` block with same rules as Puppeteer uses
3. **Test Both Paths:** Generate PDF via CLI, then print HTML via browser, compare
4. **Document Limitations:** Some differences are unavoidable - set expectations

### CSS Structure

```css
/* Base styles (screen) */
.cv-container {
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.75in;
}

/* Print styles - mirrors Puppeteer PDF settings */
@media print {
  @page {
    size: letter;
    margin: 0.75in;
  }

  body {
    margin: 0;
    padding: 0;
  }

  .cv-container {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  /* Page break controls */
  h1, h2, h3, h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  .experience-entry,
  .education-entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  p, li {
    orphans: 3;
    widows: 3;
  }

  /* Hide non-print elements */
  .no-print,
  nav,
  .download-button {
    display: none !important;
  }
}
```

### DevTools Testing

Chrome DevTools allows previewing print styles:

1. Open DevTools (F12)
2. Open Command Menu (Ctrl+Shift+P)
3. Type "Rendering" and select "Show Rendering"
4. Find "Emulate CSS media type" dropdown
5. Select "print"

**Limitation:** This only shows print *styles*, not actual pagination. To see real page breaks:
1. Press Ctrl+P to open Print dialog
2. Use "Print to PDF" destination
3. Examine preview thumbnails

---

## Sources

### Official Documentation (HIGH confidence)
- [Puppeteer PDFOptions](https://pptr.dev/api/puppeteer.pdfoptions) - Official API reference for PDF generation options
- [Puppeteer page.pdf()](https://pptr.dev/api/puppeteer.page.pdf) - Method documentation with media type notes
- [MDN @page](https://developer.mozilla.org/en-US/docs/Web/CSS/@page) - CSS paged media reference
- [MDN CSS Printing Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing) - Print stylesheet guidance
- [Chrome Print Margins Blog](https://developer.chrome.com/blog/print-margins) - Chrome team on @page margin boxes support

### Technical Articles (MEDIUM confidence)
- [Eric Draken PDF Layout Algorithm](https://ericdraken.com/algorithm-optimized-pdf-page-layout/) - Whitespace optimization approach
- [Aaron Saray Print CSS Deep Dive](https://aaronsaray.com/2025/a-deep-dive-into-print-css-headers-and-footers/) - Headers/footers in print CSS (2025)
- [Andre Arko Headless Chrome Differences](https://andre.arko.net/2025/05/25/chrome-headless-print-to-pdf/) - Headless vs graphical Chrome print differences
- [CustomJS Print CSS Cheatsheet](https://www.customjs.space/blog/print-css-cheatsheet/) - Practical print CSS tips
- [Latenode Puppeteer PDF Guide](https://latenode.com/blog/converting-html-to-pdf-with-puppeteer-style-configuration-and-pagination) - Pagination configuration
- [Browserless Puppeteer PDF Guide](https://www.browserless.io/blog/puppeteer-pdf-generator) - Production PDF generation patterns
- [PuppetMaster PDF Testing Approach](https://medium.com/the-crc-tech-blog/pdf-visual-regression-testing-the-puppetmaster-approach-7a575d6c5559) - Visual regression testing strategy

### Libraries & Tools (HIGH confidence)
- [pdf-visual-diff npm](https://www.npmjs.com/package/pdf-visual-diff) - Visual regression testing for PDFs
- [pdf-visual-diff GitHub](https://github.com/moshensky/pdf-visual-diff) - Source and documentation
- [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot) - Image comparison matcher for Jest

### CSS Page Break References (MEDIUM confidence)
- [CSS-Tricks @page Rule](https://css-tricks.com/almanac/rules/p/page/) - @page rule overview
- [DocRaptor Page Breaks](https://docraptor.com/documentation/article/1067996-page-breaks) - Page break documentation
- [Clevago Page Break Guide](https://www.clevago.com/blog/page-break-perfection-adding-avoiding-breaks-in-html-pdfs/) - Adding/avoiding breaks in HTML PDFs
- [ConvertAPI Page Breaks](https://www.convertapi.com/blog/css-pagebreaks) - CSS pagebreaks in HTML to PDF conversion

### CV/Resume Tool References (MEDIUM confidence)
- [VisualCV Page Break Management](https://support.visualcv.com/article/17-manage-page-breaks-on-my-pdf) - Page break best practices for CVs
- [FlowCV](https://flowcv.com/) - Professional CV builder with pagination handling
- [RenderCV GitHub](https://github.com/rendercv/rendercv) - YAML to PDF CV generator with page configuration
