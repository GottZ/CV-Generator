# Phase 5: DOCX Output - Research

**Researched:** 2026-01-22
**Domain:** Word document generation with docx npm library, ATS optimization
**Confidence:** HIGH

## Summary

Phase 5 requires generating ATS-optimized Word documents (.docx) from CV data using the `docx` npm library. The research covers the docx library's declarative API for creating paragraphs, headings, images, headers/footers, and document properties. DOCX is actually the **preferred format** for ATS systems over PDF, as it allows cleaner text extraction.

The `docx` library (v9.5.1) provides a fully-typed TypeScript API that works with Bun. Unlike the PDF phase which renders HTML, DOCX generation builds documents programmatically using the library's component model (Document, Paragraph, TextRun, ImageRun). The library supports native Word field codes via `PageNumber.CURRENT` and `PageNumber.TOTAL_PAGES` for "Page X of Y" footers, and uses `HeadingLevel.HEADING_1/2` for built-in Word styles that populate the Navigation Pane automatically.

Key decisions: Use Word's built-in styles (Heading 1/2, Normal) rather than custom styles to ensure maximum ATS compatibility. Embed images directly using `ImageRun` with Buffer data and explicit dimensions. Mirror the PDF structure (same sections, same ordering) but generate directly from CVData rather than rendering HTML first.

**Primary recommendation:** Use docx 9.5+ for programmatic document generation. Build document from CVData directly (not HTML conversion). Use HeadingLevel enum for built-in styles, PageNumber fields for footers, and ImageRun for embedded images. Output via `Packer.toBuffer()` for Node/Bun environments.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| docx | ^9.5.1 | Word document generation | 100% TypeScript, declarative API, actively maintained, 365+ dependent packages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | (existing) | Image dimension extraction | Get width/height for ImageRun transformation (already in project) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| docx | docxtemplater | Template-based approach; requires .docx template file, paid modules for advanced features |
| docx | officegen | Less maintained, smaller community |
| docx | docxml | Newer library, smaller ecosystem |

**Installation:**
```bash
bun add docx
```

**Note:** The project already uses `sharp` for image processing in `image-processor.ts`. This can be reused for getting image dimensions required by ImageRun.

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/
  src/
    lib/
      docx-generator.ts     # Main DOCX generation from CVData
      docx-styles.ts        # Style definitions (optional helper)
    commands/
      build.ts              # Updated to support DOCX format
```

### Pattern 1: Document Generation from CVData
**What:** Build DOCX directly from CVData without HTML intermediary
**When to use:** All DOCX generation scenarios
**Example:**
```typescript
// Source: https://github.com/dolanmiu/docx
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Footer, PageNumber, AlignmentType } from 'docx';
import type { CVData } from '@gottz/cv-core';

interface DocxOptions {
  cv: CVData;
  locale: string;
  outputPath: string;
}

async function generateDocx(options: DocxOptions): Promise<Buffer> {
  const { cv, locale } = options;

  const doc = new Document({
    // Document properties (metadata)
    creator: 'CV Generator',
    title: `${cv.contact.name} - CV`,
    subject: 'Curriculum Vitae',
    description: `CV for ${cv.contact.name}`,

    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch in TWIPs (720 = 1440 * 0.5)
            bottom: 720,
            left: 1080,  // 0.75 inch
            right: 1080,
          },
        },
      },
      headers: {
        default: new Header({ children: [] }), // Empty header
      },
      footers: {
        default: createFooter(cv.contact.name, locale),
      },
      children: [
        // Name as Heading 1
        new Paragraph({
          text: cv.contact.name,
          heading: HeadingLevel.HEADING_1,
        }),
        // ... sections
      ],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
```

### Pattern 2: Footer with Native Word Field Codes
**What:** Create footers with PAGE and NUMPAGES fields for "Name - Page X of Y"
**When to use:** OUT-07 equivalent for DOCX
**Example:**
```typescript
// Source: https://github.com/dolanmiu/docx/blob/master/demo/39-page-numbers.ts
import { Footer, Paragraph, TextRun, PageNumber, AlignmentType } from 'docx';

function createFooter(name: string, locale: string): Footer {
  // i18n page format per CONTEXT.md
  const pageLabel = locale === 'de' ? 'Seite' : 'Page';
  const ofLabel = locale === 'de' ? 'von' : 'of';

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${name} - ${pageLabel} `,
            size: 18, // 9pt = 18 half-points
            color: '666666',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            color: '666666',
          }),
          new TextRun({
            text: ` ${ofLabel} `,
            size: 18,
            color: '666666',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 18,
            color: '666666',
          }),
        ],
      }),
    ],
  });
}
```

### Pattern 3: Using Built-in Word Styles with HeadingLevel
**What:** Apply Heading 1, Heading 2, Normal styles for Navigation Pane support
**When to use:** All headings and section titles
**Example:**
```typescript
// Source: https://github.com/dolanmiu/docx/blob/master/docs/usage/styling-with-js.md
import { Paragraph, HeadingLevel, AlignmentType } from 'docx';

// Name (Heading 1) - appears in Navigation Pane
const nameParagraph = new Paragraph({
  text: cv.contact.name,
  heading: HeadingLevel.HEADING_1,
});

// Section headers (Heading 2) - appears in Navigation Pane
const sectionHeader = new Paragraph({
  text: 'Work Experience', // or localized version
  heading: HeadingLevel.HEADING_2,
});

// Body text (Normal style - default)
const bodyParagraph = new Paragraph({
  children: [
    new TextRun('Company Name'),
    new TextRun({ text: ' | Job Title', bold: true }),
  ],
});
```

### Pattern 4: Image Embedding with ImageRun
**What:** Embed images directly in DOCX with proper dimensions
**When to use:** OUT-10 requirement - images in CV
**Example:**
```typescript
// Source: https://github.com/dolanmiu/docx/blob/master/docs/usage/images.md
import { ImageRun, Paragraph } from 'docx';
import sharp from 'sharp';

interface ImageData {
  buffer: Buffer;
  width: number;
  height: number;
}

async function loadImage(imagePath: string): Promise<ImageData> {
  const file = Bun.file(imagePath);
  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: metadata.width ?? 100,
    height: metadata.height ?? 100,
  };
}

function createImageParagraph(imageData: ImageData, maxWidth: number = 150): Paragraph {
  // Scale to max width while maintaining aspect ratio
  const scale = Math.min(1, maxWidth / imageData.width);
  const displayWidth = Math.round(imageData.width * scale);
  const displayHeight = Math.round(imageData.height * scale);

  return new Paragraph({
    children: [
      new ImageRun({
        data: imageData.buffer,
        transformation: {
          width: displayWidth,
          height: displayHeight,
        },
        // Optional accessibility
        altText: {
          title: 'Profile photo',
          description: 'Candidate profile photograph',
          name: 'profile-photo',
        },
      }),
    ],
  });
}
```

### Pattern 5: Document Properties (Metadata)
**What:** Set title, author, subject, keywords in DOCX properties
**When to use:** All DOCX generation (per CONTEXT.md)
**Example:**
```typescript
// Source: https://github.com/dolanmiu/docx/blob/master/demo/54-custom-properties.ts
import { Document } from 'docx';

const doc = new Document({
  // Standard properties mapped to DOCX core properties
  creator: 'CV Generator',           // dc:creator
  title: `${name} - CV`,             // dc:title
  subject: 'Curriculum Vitae',       // dc:subject
  description: `CV for ${name}`,     // dc:description

  // Custom properties (available for Quick Parts in Word)
  customProperties: [
    { name: 'Candidate', value: name },
    { name: 'Locale', value: locale },
  ],

  sections: [/* ... */],
});
```

### Pattern 6: Section Structure Mirroring PDF
**What:** Build sections in same order as PDF/HTML output
**When to use:** All DOCX generation to ensure consistency
**Example:**
```typescript
import { Paragraph, HeadingLevel } from 'docx';
import type { CVData, Localized } from '@gottz/cv-core';

function buildSections(cv: CVData, locale: string, i18n: Record<string, string>): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // 1. Name (Heading 1)
  paragraphs.push(new Paragraph({
    text: cv.contact.name,
    heading: HeadingLevel.HEADING_1,
  }));

  // 2. Contact info
  paragraphs.push(...buildContactSection(cv.contact));

  // 3. Summary (if present)
  if (cv.summary?.[locale]) {
    paragraphs.push(new Paragraph({
      text: i18n.summary,
      heading: HeadingLevel.HEADING_2,
    }));
    paragraphs.push(new Paragraph({ text: cv.summary[locale] }));
  }

  // 4. Experience (if present)
  if (cv.experience?.[locale]) {
    paragraphs.push(new Paragraph({
      text: i18n.experience,
      heading: HeadingLevel.HEADING_2,
    }));
    paragraphs.push(...buildExperienceSection(cv.experience[locale]));
  }

  // 5. Education (if present)
  // 6. Skills (if present)
  // ... same pattern

  return paragraphs;
}
```

### Anti-Patterns to Avoid
- **HTML-to-DOCX conversion:** Don't try to convert HTML to DOCX. Build DOCX directly from data. HTML converters produce inconsistent results.
- **Custom styles instead of built-in:** Using custom style names breaks Navigation Pane. Always use `HeadingLevel.HEADING_1/2`.
- **ImageRun without transformation:** DOCX files with images lacking width/height dimensions are corrupt and won't open.
- **Using toBlob() in Node/Bun:** `Packer.toBlob()` is browser-only. Always use `Packer.toBuffer()` for server-side.
- **Forgetting document properties:** Unlike PDF, DOCX requires properties at document creation time, not post-processing.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOCX generation | XML manipulation / ZIP libraries | docx library | OOXML is complex with many required parts |
| Page numbers | Manual field code insertion | PageNumber.CURRENT/TOTAL_PAGES | Field codes require specific XML structure |
| Image embedding | Manual relationship management | ImageRun | Images need rel IDs, content types, proper paths |
| Document properties | Manual core.xml manipulation | Document options | Properties spread across multiple XML files |
| Navigation Pane headings | Custom outline/TOC | HeadingLevel enum | Word auto-generates Navigation from Heading styles |

**Key insight:** DOCX files are ZIP archives containing multiple XML files with complex relationships. The docx library handles all this complexity with a clean, typed API.

## Common Pitfalls

### Pitfall 1: ImageRun Without Transformation Dimensions
**What goes wrong:** Document is corrupt, won't open in Word
**Why it happens:** DOCX requires explicit image dimensions; Node.js doesn't know raw image sizes
**How to avoid:** Always provide `transformation: { width, height }` - use sharp to extract dimensions
**Warning signs:** "Document is corrupt" error when opening in Word

### Pitfall 2: Using Custom Style Names for Headings
**What goes wrong:** Navigation Pane doesn't show document structure
**Why it happens:** Navigation Pane only recognizes built-in Heading styles
**How to avoid:** Use `heading: HeadingLevel.HEADING_1` not custom style names
**Warning signs:** No entries in Navigation Pane despite having headings

### Pitfall 3: Packer.toBlob() in Node/Bun
**What goes wrong:** Error: "blob is not supported by this platform"
**Why it happens:** Blob API is browser-only
**How to avoid:** Use `Packer.toBuffer()` for Node.js/Bun environments
**Warning signs:** Runtime error about blob

### Pitfall 4: Missing Document Properties
**What goes wrong:** TypeError: Cannot read properties of undefined (reading 'creator')
**Why it happens:** docx 8.x+ requires certain properties at document creation
**How to avoid:** Always provide `creator`, `title`, `subject` in Document options
**Warning signs:** TypeError during document creation

### Pitfall 5: Font Size Units
**What goes wrong:** Text appears too large or too small
**Why it happens:** docx uses half-points, not points. 24pt = size: 48
**How to avoid:** Multiply desired point size by 2 for the `size` property
**Warning signs:** Heading text same size as body, or text much larger than expected

### Pitfall 6: Margin Units (TWIPs)
**What goes wrong:** Margins are wrong (too large or too small)
**Why it happens:** Margins use TWIPs (1/1440 inch), not pixels or mm
**How to avoid:** Use conversion: 1 inch = 1440 TWIPs, 1mm = ~57 TWIPs
**Warning signs:** Document margins different from expected

### Pitfall 7: Missing i18n for Page Labels
**What goes wrong:** German CV has "Page 1 of 2" instead of "Seite 1 von 2"
**Why it happens:** Hardcoded English text in footer
**How to avoid:** Use existing i18n pattern from PDF generator
**Warning signs:** Mixed language in document

## Code Examples

Verified patterns from official sources:

### Complete DOCX Generation Flow
```typescript
// Complete workflow mirroring PDF phase structure
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Footer,
  Header,
  PageNumber,
  AlignmentType,
  ImageRun,
} from 'docx';
import type { CVData } from '@gottz/cv-core';
import sharp from 'sharp';

interface DocxOptions {
  cv: CVData;
  locale: string;
  outputPath: string;
  imagesDir?: string;
}

interface DocxResult {
  path: string;
  bytes: number;
}

async function generateDocx(options: DocxOptions): Promise<DocxResult> {
  const { cv, locale, outputPath, imagesDir } = options;

  // Get i18n labels
  const i18n = getI18n(locale);

  // Build all paragraph children
  const children = await buildDocumentContent(cv, locale, i18n, imagesDir);

  // Create footer with page numbers
  const footer = createFooter(cv.contact.name, locale);

  const doc = new Document({
    // Document properties (metadata)
    creator: 'CV Generator',
    title: `${cv.contact.name} - CV`,
    subject: 'Curriculum Vitae',
    description: `Curriculum Vitae for ${cv.contact.name}`,

    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,    // 20mm in TWIPs
            bottom: 1134,
            left: 1418,   // 25mm in TWIPs
            right: 1418,
          },
        },
      },
      headers: {
        default: new Header({ children: [] }),
      },
      footers: {
        default: footer,
      },
      children,
    }],
  });

  // Generate buffer
  const buffer = Buffer.from(await Packer.toBuffer(doc));

  // Write file
  await Bun.write(outputPath, buffer);

  return {
    path: outputPath,
    bytes: buffer.length,
  };
}

function createFooter(name: string, locale: string): Footer {
  const pageLabel = locale === 'de' ? 'Seite' : 'Page';
  const ofLabel = locale === 'de' ? 'von' : 'of';

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${name} - ${pageLabel} `,
            size: 18, // 9pt
            color: '666666',
            font: 'Arial',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            color: '666666',
            font: 'Arial',
          }),
          new TextRun({
            text: ` ${ofLabel} `,
            size: 18,
            color: '666666',
            font: 'Arial',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 18,
            color: '666666',
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
}

async function buildDocumentContent(
  cv: CVData,
  locale: string,
  i18n: Record<string, string>,
  imagesDir?: string,
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];

  // Name (Heading 1)
  paragraphs.push(new Paragraph({
    text: cv.contact.name,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 120 },
  }));

  // Contact line
  const contactParts: string[] = [];
  if (cv.contact.email) contactParts.push(cv.contact.email);
  if (cv.contact.phone) contactParts.push(cv.contact.phone);
  if (cv.contact.location) contactParts.push(cv.contact.location);

  if (contactParts.length > 0) {
    paragraphs.push(new Paragraph({
      text: contactParts.join(' | '),
      spacing: { after: 240 },
    }));
  }

  // Summary section
  if (cv.summary?.[locale]) {
    paragraphs.push(new Paragraph({
      text: i18n.summary,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    }));
    paragraphs.push(new Paragraph({
      text: cv.summary[locale],
      spacing: { after: 240 },
    }));
  }

  // Experience section
  if (cv.experience?.[locale]) {
    paragraphs.push(new Paragraph({
      text: i18n.experience,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    }));

    for (const exp of cv.experience[locale]) {
      // Company and role
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: exp.company, bold: true }),
          new TextRun({ text: ` | ${exp.role}` }),
        ],
        spacing: { before: 120 },
      }));

      // Date and location
      const dateLine = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      paragraphs.push(new Paragraph({
        text: `${dateLine}${exp.location ? ` | ${exp.location}` : ''}`,
        spacing: { after: 60 },
      }));

      // Description/highlights
      if (exp.highlights) {
        for (const highlight of exp.highlights) {
          paragraphs.push(new Paragraph({
            text: `• ${highlight}`,
            spacing: { after: 60 },
          }));
        }
      }
    }
  }

  // Education and Skills follow same pattern...

  return paragraphs;
}
```

### Image Loading with Dimension Extraction
```typescript
// Reuse existing sharp from image-processor.ts
import sharp from 'sharp';
import { ImageRun, Paragraph } from 'docx';

async function loadImageForDocx(imagePath: string): Promise<Paragraph | null> {
  const file = Bun.file(imagePath);
  if (!(await file.exists())) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) return null;

  // Scale for print (target ~150px width for profile photos)
  const maxWidth = 150;
  const scale = Math.min(1, maxWidth / metadata.width);

  return new Paragraph({
    children: [
      new ImageRun({
        data: buffer,
        transformation: {
          width: Math.round(metadata.width * scale),
          height: Math.round(metadata.height * scale),
        },
        altText: {
          title: 'Profile photo',
          description: 'Candidate profile photograph',
          name: 'profile',
        },
      }),
    ],
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| officegen | docx | 2020+ | Better TypeScript support, active maintenance |
| Manual OOXML | docx declarative API | 2018+ | Dramatically simpler, type-safe |
| HTML-to-DOCX converters | Direct generation from data | Always | More reliable, consistent output |

**Deprecated/outdated:**
- **officegen**: Less maintained, weaker TypeScript support
- **HTML-to-DOCX libraries**: Inconsistent results, poor style translation
- **docx versions < 8.x**: Breaking changes in document creation API

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Font Embedding Behavior**
   - What we know: docx library uses font names, Word handles embedding
   - What's unclear: If Arial/Helvetica font fallback works correctly on systems without these fonts
   - Recommendation: Test on Windows/Mac/Linux; rely on Word's font substitution

2. **Image DPI for Print Quality**
   - What we know: ImageRun uses pixel dimensions
   - What's unclear: How Word interprets DPI for print
   - Recommendation: Use images at ~150px width for profile photos (adequate for print)

3. **Page Break Control**
   - What we know: docx has `PageBreak` component
   - What's unclear: If automatic page break avoidance (like CSS `break-inside: avoid`) exists
   - Recommendation: Test with multi-page CVs; may need manual page break insertion

## Sources

### Primary (HIGH confidence)
- [docx npm package](https://www.npmjs.com/package/docx) - Version 9.5.1, TypeScript support
- [docx GitHub repository](https://github.com/dolanmiu/docx) - Demo examples, documentation
- [Page numbers demo (39-page-numbers.ts)](https://github.com/dolanmiu/docx/blob/master/demo/39-page-numbers.ts) - PageNumber field codes
- [Custom properties demo (54-custom-properties.ts)](https://github.com/dolanmiu/docx/blob/master/demo/54-custom-properties.ts) - Document metadata
- [Images documentation](https://github.com/dolanmiu/docx/blob/master/docs/usage/images.md) - ImageRun usage
- [Styling documentation](https://github.com/dolanmiu/docx/blob/master/docs/usage/styling-with-js.md) - HeadingLevel usage

### Secondary (MEDIUM confidence)
- [Bun Node.js compatibility](https://bun.com/docs/runtime/nodejs-compat) - 98%+ npm compatibility
- [ATS format preferences](https://www.jobscan.co/blog/ats-formatting-mistakes/) - DOCX preferred over PDF

### Tertiary (LOW confidence)
- Community discussions on docx usage patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Library verified via npm, official documentation, active maintenance
- Architecture: HIGH - Patterns from official demos and documentation
- Pitfalls: HIGH - Based on documented issues and library requirements
- ATS compatibility: HIGH - Industry consensus that DOCX is ATS-preferred format

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain)
