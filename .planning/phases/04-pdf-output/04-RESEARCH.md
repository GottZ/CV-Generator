# Phase 4: PDF Output - Research

**Researched:** 2026-01-22
**Domain:** Puppeteer PDF generation, ATS optimization, PDF metadata/security
**Confidence:** HIGH

## Summary

Phase 4 requires generating ATS-optimized PDF files from the existing HTML output using Puppeteer. The research covers Puppeteer's PDF generation API, text layer optimization for copy-paste reliability, PDF metadata/bookmarks via pdf-lib, PDF security/permissions via node-qpdf2, and page break handling.

Puppeteer 24+ provides robust PDF generation via `Page.pdf()` with built-in support for headers/footers, page numbers, and print CSS. However, several requirements need post-processing libraries: **pdf-lib** for metadata (title, author, subject) and **node-qpdf2** for security permissions (copy-only, disable editing). Bookmarks require either the experimental `outline: true` option or the **@lillallol/outline-pdf** library.

The critical ATS requirement is ensuring the text layer is copy-paste verifiable. The main pitfall is **font ligatures** (like "ft" in Calibri) that corrupt text extraction. The solution is adding `font-variant-ligatures: none;` to the CSS. Additionally, using standard fonts (Arial/Helvetica), PDF 1.4 format, and avoiding complex layouts ensures maximum ATS compatibility.

**Primary recommendation:** Use Puppeteer 24+ for HTML-to-PDF rendering, pdf-lib 1.17 for metadata, node-qpdf2 for security permissions, and @lillallol/outline-pdf for bookmarks. Add ligature-disabling CSS and implement browser reuse for performance.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| puppeteer | ^24.0.0 | HTML to PDF rendering | Official Chrome/Chromium automation, full CSS/JS support, active maintenance |
| pdf-lib | ^1.17.1 | PDF metadata manipulation | Pure JavaScript, no native deps, works in Node.js and browser |
| node-qpdf2 | ^4.0.0 | PDF encryption/permissions | TypeScript support, Promise-based, wraps qpdf for security features |
| @lillallol/outline-pdf | ^4.0.0 | PDF bookmarks/outline | Pure JS, uses pdf-lib, supports nested hierarchies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| puppeteer-cluster | ^0.24.0 | Browser pool management | High-volume PDF generation, parallel processing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| puppeteer | playwright | Playwright supports multiple browsers but Puppeteer has better PDF options |
| pdf-lib | pdfkit | pdfkit creates PDFs from scratch; pdf-lib modifies existing PDFs |
| node-qpdf2 | pdf-lib | pdf-lib lacks encryption support; qpdf required for permissions |
| @lillallol/outline-pdf | Puppeteer outline:true | Puppeteer's outline is experimental and has reported issues |

**Installation:**
```bash
bun add puppeteer pdf-lib @lillallol/outline-pdf
# node-qpdf2 requires qpdf system binary - evaluate if security features needed
```

**System Dependency (if using node-qpdf2):**
```bash
# Ubuntu/Debian
apt-get install qpdf

# macOS
brew install qpdf
```

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/
  src/
    lib/
      pdf-generator.ts      # Puppeteer PDF generation
      pdf-metadata.ts       # pdf-lib metadata manipulation
      pdf-security.ts       # node-qpdf2 permissions (optional)
      pdf-bookmarks.ts      # outline-pdf bookmark generation
      browser-manager.ts    # Puppeteer browser lifecycle
    commands/
      build.ts              # Updated to support PDF format
```

### Pattern 1: Puppeteer PDF Generation with Browser Reuse
**What:** Launch browser once, reuse for multiple PDF generations
**When to use:** All PDF generation scenarios (per CONTEXT.md: reuse browser across PDFs in same session)
**Example:**
```typescript
// Source: https://pptr.dev/guides/pdf-generation
import puppeteer, { Browser, Page } from 'puppeteer';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

interface PdfOptions {
  htmlPath: string;
  outputPath: string;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

async function generatePdf(options: PdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Load HTML file
    await page.goto(`file://${options.htmlPath}`, {
      waitUntil: 'networkidle0',
    });

    // Wait for fonts to load (automatic in Puppeteer 24+)
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF with ATS-optimized settings
    const pdfBuffer = await page.pdf({
      path: options.outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: options.displayHeaderFooter ?? false,
      headerTemplate: options.headerTemplate ?? '',
      footerTemplate: options.footerTemplate ?? '',
      margin: {
        top: '25.4mm',    // 1 inch
        bottom: '25.4mm',
        left: '25.4mm',
        right: '25.4mm',
      },
      tagged: true, // Accessibility - generates tagged PDF
      timeout: 30000,
    });

    return pdfBuffer;
  } finally {
    await page.close();
  }
}
```

### Pattern 2: Header/Footer with Page Numbers
**What:** Template-driven headers/footers with i18n support
**When to use:** OUT-07 requirement - page identification
**Example:**
```typescript
// Source: https://pptr.dev/api/puppeteer.pdfoptions
// Puppeteer injects values via CSS classes: pageNumber, totalPages, date, title

interface HeaderFooterOptions {
  name: string;
  locale: string;
}

function createFooterTemplate(options: HeaderFooterOptions): string {
  const { name, locale } = options;

  // i18n page format per CONTEXT.md
  const pageFormat = locale === 'de'
    ? 'Seite <span class="pageNumber"></span> von <span class="totalPages"></span>'
    : 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>';

  return `
    <div style="
      width: 100%;
      font-size: 9pt;
      font-family: Arial, Helvetica, sans-serif;
      color: #666666;
      padding: 0 25.4mm;
      display: flex;
      justify-content: space-between;
    ">
      <span>${name}</span>
      <span>${pageFormat}</span>
    </div>
  `;
}

// Usage in page.pdf():
// {
//   displayHeaderFooter: true,
//   footerTemplate: createFooterTemplate({ name: 'John Doe', locale: 'en' }),
//   margin: { bottom: '25.4mm' }, // Must have margin for footer
// }
```

### Pattern 3: PDF Metadata with pdf-lib
**What:** Set title, author, subject after Puppeteer generation
**When to use:** OUT-07 requirement - full metadata
**Example:**
```typescript
// Source: https://pdf-lib.js.org/
import { PDFDocument } from 'pdf-lib';

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  creator?: string;
  keywords?: string[];
}

async function setPdfMetadata(
  pdfBuffer: Buffer,
  metadata: PdfMetadata,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  pdfDoc.setTitle(metadata.title);
  pdfDoc.setAuthor(metadata.author);
  pdfDoc.setSubject(metadata.subject);
  pdfDoc.setCreator(metadata.creator ?? 'CV Generator');

  if (metadata.keywords) {
    pdfDoc.setKeywords(metadata.keywords);
  }

  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  const modifiedPdf = await pdfDoc.save();
  return Buffer.from(modifiedPdf);
}

// Usage:
// const pdfWithMetadata = await setPdfMetadata(pdfBuffer, {
//   title: 'John Doe - CV',
//   author: 'John Doe',
//   subject: 'Curriculum Vitae',
// });
```

### Pattern 4: PDF Bookmarks with outline-pdf
**What:** Add section bookmarks for Experience, Education, Skills
**When to use:** CONTEXT.md requirement - PDF bookmarks
**Example:**
```typescript
// Source: https://github.com/lillallol/outline-pdf
import * as pdfLib from 'pdf-lib';
import { outlinePdfFactory } from '@lillallol/outline-pdf';

const outlinePdf = outlinePdfFactory(pdfLib);

interface SectionInfo {
  title: string;
  page: number;
}

async function addPdfBookmarks(
  pdfBuffer: Buffer,
  sections: SectionInfo[],
): Promise<Buffer> {
  // Build outline string format: "pageNum||title"
  const outlineString = sections
    .map(s => `${s.page}||${s.title}`)
    .join('\n');

  const pdfDoc = await outlinePdf({
    pdf: pdfBuffer,
    outline: outlineString,
  });

  const savedPdf = await pdfDoc.save();
  return Buffer.from(savedPdf);
}

// Example usage:
// const bookmarkedPdf = await addPdfBookmarks(pdfBuffer, [
//   { title: 'Experience', page: 1 },
//   { title: 'Education', page: 2 },
//   { title: 'Skills', page: 2 },
// ]);
```

### Pattern 5: PDF Security with node-qpdf2 (Optional)
**What:** Set copy-only permissions (allow text copying, disable editing)
**When to use:** CONTEXT.md requirement - copy-only security
**Example:**
```typescript
// Source: https://github.com/Sparticuz/node-qpdf2
// Note: Requires qpdf binary installed on system
import { encrypt } from 'node-qpdf2';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

interface SecurityOptions {
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
}

async function setPdfSecurity(
  pdfBuffer: Buffer,
  options: SecurityOptions = {},
): Promise<Buffer> {
  // Write to temp file (qpdf works with files)
  const tempInput = path.join(os.tmpdir(), `input-${Date.now()}.pdf`);
  const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}.pdf`);

  try {
    await writeFile(tempInput, pdfBuffer);

    await encrypt({
      input: tempInput,
      output: tempOutput,
      keyLength: 256,
      restrictions: {
        print: options.allowPrinting !== false ? 'full' : 'none',
        extract: options.allowCopying !== false ? 'y' : 'n',
        modify: options.allowModifying !== false ? 'all' : 'none',
        useAes: 'y',
      },
    });

    return await readFile(tempOutput);
  } finally {
    // Cleanup temp files
    await unlink(tempInput).catch(() => {});
    await unlink(tempOutput).catch(() => {});
  }
}

// Usage for copy-only (per CONTEXT.md):
// const securePdf = await setPdfSecurity(pdfBuffer, {
//   allowPrinting: true,
//   allowCopying: true,
//   allowModifying: false,
// });
```

### Pattern 6: Retry Logic with Timeout
**What:** Robust PDF generation with retries
**When to use:** CONTEXT.md requirement - retry 3 times with increasing timeouts
**Example:**
```typescript
interface RetryOptions {
  maxRetries: number;
  initialTimeoutMs: number;
  backoffMultiplier: number;
}

async function withRetry<T>(
  operation: (timeoutMs: number) => Promise<T>,
  options: RetryOptions = { maxRetries: 3, initialTimeoutMs: 30000, backoffMultiplier: 2 },
): Promise<T> {
  let lastError: Error | null = null;
  let timeoutMs = options.initialTimeoutMs;

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation(timeoutMs);
    } catch (error) {
      lastError = error as Error;
      console.warn(`PDF generation attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < options.maxRetries) {
        timeoutMs *= options.backoffMultiplier;
      }
    }
  }

  throw lastError ?? new Error('PDF generation failed after retries');
}

// Usage:
// const pdf = await withRetry(
//   (timeout) => page.pdf({ ...options, timeout }),
//   { maxRetries: 3, initialTimeoutMs: 30000, backoffMultiplier: 2 }
// );
```

### Anti-Patterns to Avoid
- **Launching browser for each PDF:** Expensive (~300-800ms startup). Use browser reuse pattern.
- **Not disabling font ligatures:** Causes "ft", "fi" combinations to be lost in text layer.
- **Using headers/footers without margins:** Headers/footers overlap content without proper margins.
- **Ignoring page.close() in finally block:** Browser tabs consume memory, leak without cleanup.
- **Using `emulateMediaType('screen')`:** Bypasses print styles, produces different colors.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML to PDF | Canvas/SVG rendering | Puppeteer page.pdf() | Full browser rendering, CSS support |
| PDF metadata | PDF byte manipulation | pdf-lib | Complex PDF structure, binary format |
| PDF bookmarks | Low-level PDF structures | @lillallol/outline-pdf | Hierarchical bookmark trees are complex |
| PDF permissions | Custom encryption | node-qpdf2 + qpdf | PDF encryption algorithms are standardized |
| Page numbering | JavaScript injection | Puppeteer footerTemplate | Built-in CSS classes (pageNumber, totalPages) |
| Browser pooling | Manual instance tracking | puppeteer-cluster | Handles crashes, memory leaks, parallelism |

**Key insight:** Puppeteer handles the hard part (rendering). Post-processing libraries handle PDF-specific features that Puppeteer doesn't support natively.

## Common Pitfalls

### Pitfall 1: Font Ligatures Break Text Extraction
**What goes wrong:** Characters like "ft", "fi" disappear when copying from PDF
**Why it happens:** Fonts render ligatures as single glyphs without proper ToUnicode mapping
**How to avoid:** Add CSS: `* { font-variant-ligatures: none; }` to print styles
**Warning signs:** Words like "after" copy as "aer", "difficult" as "dicult"

### Pitfall 2: Headers/Footers Require Margin Space
**What goes wrong:** Header/footer content overlaps main document content
**Why it happens:** Puppeteer places headers/footers in margin area, not document body
**How to avoid:** Set `margin.top` and `margin.bottom` >= header/footer height
**Warning signs:** Text bleeding into header/footer area

### Pitfall 3: Print Background Not Enabled
**What goes wrong:** Background colors and images don't appear in PDF
**Why it happens:** `printBackground` defaults to `false` (browser print behavior)
**How to avoid:** Set `printBackground: true` in page.pdf() options
**Warning signs:** White backgrounds where colors expected

### Pitfall 4: Page Breaks Split Content
**What goes wrong:** Job entries, education items split across pages
**Why it happens:** Browser's default page break algorithm
**How to avoid:** Add CSS: `.entry { break-inside: avoid; page-break-inside: avoid; }`
**Warning signs:** Partial content at bottom of pages

### Pitfall 5: Browser Memory Leaks
**What goes wrong:** Memory usage grows, eventually crashes
**Why it happens:** Tabs not closed, browser not recycled
**How to avoid:** Always close pages in finally block, periodically restart browser
**Warning signs:** Increasing memory over time, OOM errors

### Pitfall 6: Base64 Images in Headers/Footers
**What goes wrong:** Images don't render in header/footer templates
**Why it happens:** Puppeteer 24.4.0+ has regression with base64 images in templates
**How to avoid:** Use file:// URLs or verify Puppeteer version compatibility
**Warning signs:** Broken image icons in PDF headers

### Pitfall 7: Timeout on Complex Documents
**What goes wrong:** PDF generation times out
**Why it happens:** Complex CSS, large images, slow network fonts
**How to avoid:** Use local fonts, preprocess images, implement retry logic
**Warning signs:** TimeoutError after 30 seconds

## Code Examples

Verified patterns from official sources:

### Complete PDF Generation Flow
```typescript
// Complete workflow per CONTEXT.md requirements
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import * as pdfLib from 'pdf-lib';
import { outlinePdfFactory } from '@lillallol/outline-pdf';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

const outlinePdf = outlinePdfFactory(pdfLib);

interface GeneratePdfOptions {
  htmlPath: string;
  outputPath: string;
  name: string;
  locale: string;
  sections: Array<{ title: string; page: number }>;
}

async function generateAtsOptimizedPdf(options: GeneratePdfOptions): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // 1. Load HTML
    await page.goto(`file://${options.htmlPath}`, {
      waitUntil: 'networkidle0',
    });

    // 2. Inject print-specific CSS for ATS optimization
    await page.addStyleTag({
      content: `
        @media print {
          * { font-variant-ligatures: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `,
    });

    // 3. Wait for fonts
    await page.evaluateHandle('document.fonts.ready');

    // 4. Generate PDF with Puppeteer
    const footerTemplate = options.locale === 'de'
      ? `<div style="width:100%;font-size:9pt;font-family:Arial;color:#666;padding:0 25mm;display:flex;justify-content:space-between;">
           <span>${options.name}</span>
           <span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span>
         </div>`
      : `<div style="width:100%;font-size:9pt;font-family:Arial;color:#666;padding:0 25mm;display:flex;justify-content:space-between;">
           <span>${options.name}</span>
           <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
         </div>`;

    let pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>', // Empty header
      footerTemplate,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '25mm',
        right: '25mm',
      },
      tagged: true,
      timeout: 30000,
    });

    await page.close();

    // 5. Add metadata with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdfDoc.setTitle(`${options.name} - CV`);
    pdfDoc.setAuthor(options.name);
    pdfDoc.setSubject('Curriculum Vitae');
    pdfDoc.setCreator('CV Generator');
    pdfDoc.setCreationDate(new Date());
    pdfBuffer = Buffer.from(await pdfDoc.save());

    // 6. Add bookmarks with outline-pdf
    if (options.sections.length > 0) {
      const outlineString = options.sections
        .map(s => `${s.page}||${s.title}`)
        .join('\n');

      const outlinedDoc = await outlinePdf({
        pdf: pdfBuffer,
        outline: outlineString,
      });
      pdfBuffer = Buffer.from(await outlinedDoc.save());
    }

    // 7. Write final PDF
    await Bun.write(options.outputPath, pdfBuffer);

  } finally {
    await browser.close();
  }
}
```

### ATS-Safe Print Stylesheet Addition
```typescript
// Inject into existing HTML before PDF generation
const atsSafePrintCSS = `
@media print {
  /* Disable ligatures for ATS text extraction (ATS-01) */
  * {
    font-variant-ligatures: none !important;
    font-feature-settings: "liga" 0, "clig" 0 !important;
  }

  /* Force light mode (CONTEXT.md) */
  :root {
    --color-heading: #1a1a1a !important;
    --color-body: #333333 !important;
    --color-background: #ffffff !important;
  }

  /* Page break control (CONTEXT.md) */
  .entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section {
    break-inside: avoid;
  }

  /* Remove interactive elements */
  .theme-toggle {
    display: none !important;
  }
}
`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PhantomJS | Puppeteer headless Chrome | 2018+ | Modern CSS, better rendering |
| wkhtmltopdf | Puppeteer | 2020+ | Active maintenance, JS support |
| Manual PDF.js | pdf-lib | 2020+ | High-level API, easier maintenance |
| Puppeteer outline (experimental) | @lillallol/outline-pdf | 2022+ | Reliable bookmark generation |
| RC4 encryption | AES-256 via qpdf | 2020+ | Stronger security |

**Deprecated/outdated:**
- **PhantomJS**: Unmaintained since 2018, poor CSS support
- **wkhtmltopdf**: Limited CSS3/JS support, no longer recommended
- **pdf-lib encryption**: No encryption support; use qpdf instead
- **Puppeteer outline: true**: Experimental, has reported bugs

## Open Questions

Things that couldn't be fully resolved:

1. **Puppeteer 24.4.0+ Base64 Header Image Bug**
   - What we know: Base64 images stopped working in headers/footers
   - What's unclear: If fixed in later versions or permanent regression
   - Recommendation: Test with current Puppeteer version; use file:// URLs as fallback

2. **PDF 1.4 Version Enforcement**
   - What we know: CONTEXT.md requires PDF 1.4 for ATS compatibility
   - What's unclear: How to force Puppeteer to produce PDF 1.4 specifically
   - Recommendation: Test generated PDFs with ATS simulators; qpdf can downgrade if needed

3. **Section Page Number Detection**
   - What we know: Bookmarks need page numbers for each section
   - What's unclear: How to determine page numbers before/during generation
   - Recommendation: Use Puppeteer page evaluation to check element positions, or generate twice

4. **ToUnicode CMap Verification**
   - What we know: CONTEXT.md requires UTF-8 with ToUnicode CMap
   - What's unclear: If Puppeteer's PDF output includes proper CMap by default
   - Recommendation: Test with PDF analysis tools; copy-paste verification is the practical test

## Sources

### Primary (HIGH confidence)
- [Puppeteer PDF Generation Guide](https://pptr.dev/guides/pdf-generation) - Official documentation
- [Puppeteer PDFOptions API](https://pptr.dev/api/puppeteer.pdfoptions) - Complete options reference
- [pdf-lib Documentation](https://pdf-lib.js.org/) - Metadata manipulation
- [outline-pdf GitHub](https://github.com/lillallol/outline-pdf) - Bookmark generation
- [node-qpdf2 GitHub](https://github.com/Sparticuz/node-qpdf2) - PDF encryption

### Secondary (MEDIUM confidence)
- [Puppeteer Issue #4125](https://github.com/puppeteer/puppeteer/issues/4125) - Font ligature bug
- [Puppeteer Issue #6366](https://github.com/puppeteer/puppeteer/issues/6366) - break-inside CSS
- [qpdf encryption docs](https://qpdf.readthedocs.io/en/stable/cli.html#encryption) - Permission flags

### Tertiary (LOW confidence)
- Blog posts on ATS resume optimization
- Stack Overflow discussions on PDF text extraction

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries verified via official documentation, npm registry
- Architecture: HIGH - Patterns from official docs and verified working examples
- Pitfalls: HIGH - Based on documented GitHub issues and known edge cases
- PDF 1.4 enforcement: LOW - No authoritative source for Puppeteer version control

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain)
