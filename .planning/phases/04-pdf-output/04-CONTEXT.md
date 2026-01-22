# Phase 4: PDF Output - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate ATS-optimized PDF files from HTML output using Puppeteer, with proper text layers that allow copy-paste extraction by applicant tracking systems. Includes page headers/footers, image embedding, and skills acronym pattern.

</domain>

<decisions>
## Implementation Decisions

### Page layout & margins

- **Page size:** A4 default, template-configurable via variable (can be switched to US Letter)
- **Margins:** Standard (1 inch / 2.54cm) default, template-configurable (standard/compact/custom)
- **Header/footer:** Template-driven — both supported. If no header section present, no header generated. If no footer section, no footer generated. Include HTML comments with examples for alternatives
- **Page breaks:** Avoid mid-entry breaks — keep job entries, education items, project blocks intact across pages
- **PDF metadata:** Full metadata — title="Name - CV", author=name, subject="Curriculum Vitae"
- **Security:** Copy-only — allow text copying, disable editing
- **Bookmarks:** Yes — PDF bookmarks for Experience, Education, Skills sections
- **PDF version:** PDF 1.4 for maximum ATS compatibility
- **Links:** Clickable hyperlinks for URLs, email, LinkedIn, GitHub
- **Photo:** Optional in top-right corner when provided in CV data
- **Attachments:** No embedded HTML — standalone PDF
- **Page numbers:** Template-configurable with i18n support. Variables for current page and total pages with HTML comment examples. Default: "Page X of Y" (English) / "Seite X von Y" (German)

### Text layer handling

- **Fonts:** Embed web fonts (converted to PDF format) plus Arial/Helvetica fallback for ATS
- **Encoding:** UTF-8 with ToUnicode CMap for proper character extraction
- **Shadow layer:** Hidden plain text layer for ATS extraction behind styled content
- **Hidden ATS context:** Optional hidden section for job-application-specific clarifications (omitted if empty)

### Claude's Discretion
- Bullet point representation in text layer (Unicode vs dashes vs stripped)

### Print styling

- **Theme:** Light mode only for PDF — always renders light background
- **Colors:** Keep template accent colors in PDF
- **Contrast:** WCAG AAA (7:1) minimum contrast ratio
- **Photos:** Keep in full color (no grayscale conversion)
- **Backgrounds:** Keep background colors/shading
- **Crop marks:** Include crop marks with 3mm bleed — marks not visible unless template enables them
- **Image DPI:** 300 DPI for print-quality images
- **Image compression:** JPEG quality 90
- **Icons:** Vector SVG preserved as vectors in PDF

### Claude's Discretion
- Minimum line/rule thickness

### Generation behavior

- **Progress:** Verbose — step-by-step output (loading HTML, rendering, saving...)
- **Timeout:** Retry 3 times with increasing timeouts, then fail. Reasonable limits (not hours)
- **Partial output:** Delete partial files on failure
- **Watch mode:** Available via flag — HTML-focused by default, PDF optional in watch
- **Browser lifecycle:** Reuse Puppeteer browser across PDFs in same session
- **Skip flag:** `--no-pdf` or `--html-only` flag to skip PDF generation
- **Warnings:** Generate PDF despite HTML validation warnings
- **Filename:** Same pattern as HTML (includes locale suffix if multiple locales)
- **Theme toggle:** Color switcher not included in PDF output

</decisions>

<specifics>
## Specific Ideas

- GitHub repo: https://Github.com/GottZ/CV-Generator
- Git remote: git@github.com:GottZ/CV-Generator.git (Claude cannot push — that's user's job)
- Hidden ATS context section for additional job-application-specific clarifications invisible to humans but readable by ATS
- Template should control whether crop marks are visible
- Page number format should be i18n-aware with template variables and HTML comment examples

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-pdf-output*
*Context gathered: 2026-01-22*
