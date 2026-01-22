# Pitfalls Research: CV/Resume Generator Tool

**Domain:** CLI resume generator (Markdown to PDF/HTML/DOCX)
**Target Users:** IT professionals
**ATS Target:** iCIMS expert-grade scoring
**Researched:** 2026-01-22
**Confidence:** HIGH (verified against multiple authoritative sources)

---

## ATS/iCIMS Pitfalls

### Critical: Missing or Corrupt ToUnicode Map in PDFs

**What goes wrong:** PDF appears perfect visually but ATS extracts garbled text. When copy-pasting from the PDF, text comes out as gibberish symbols.

**Why it happens:** PDF generation tools sometimes fail to embed proper Unicode character mapping tables (ToUnicode map). The PDF renders correctly on screen but the underlying text layer is broken.

**Warning signs:**
- Copy-paste from generated PDF produces garbled characters
- ATS test tools show blank or scrambled content
- Font substitution warnings during PDF generation

**Prevention:**
- Always test generated PDFs by copy-pasting text into a plain text editor
- Use PDF generation tools that explicitly handle font embedding (Puppeteer with proper font loading, WeasyPrint)
- Avoid exotic fonts; stick to Arial, Calibri, Times New Roman, Helvetica
- Include `await page.evaluateHandle('document.fonts.ready')` before PDF generation in Puppeteer

**Phase:** Core PDF generation (early phase)

**Sources:**
- [Adobe Community - Copying text turns to gibberish](https://community.adobe.com/t5/acrobat-discussions/copying-and-pasting-text-in-pdf-turns-to-gibberish/td-p/10194796)
- [UPDF - PDF copy gibberish fixes](https://updf.com/knowledge/when-i-copy-text-from-a-pdf-it-is-gibberish/)

---

### Critical: Headers/Footers Ignored by ATS

**What goes wrong:** Contact information placed in PDF headers/footers is completely invisible to ATS. Candidate appears to have no contact details.

**Why it happens:** 25% of ATS systems fail to read document headers/footers. iCIMS specifically focuses on main body content.

**Warning signs:**
- ATS preview shows missing contact information
- Resume templates with elegant header designs
- Page number footers with contact info

**Prevention:**
- Place ALL critical information (name, phone, email, LinkedIn) in the main document body
- Use headers/footers only for decorative page numbers (if at all)
- First lines of resume should be: Name, Contact Details (phone, email, location)

**Phase:** Template design (early phase)

**Sources:**
- [Jobscan - ATS formatting mistakes](https://www.jobscan.co/blog/ats-formatting-mistakes/)
- [TopResume research on headers/footers](https://resume.co/blog/ats-mistakes)

---

### Critical: Non-Standard Section Headers

**What goes wrong:** ATS cannot categorize information correctly. "My Journey So Far" is not recognized as work experience.

**Why it happens:** ATS systems are programmed to look for standard section headings like "Work Experience," "Education," "Skills."

**Warning signs:**
- Creative section titles in templates
- Non-English or localized section names
- Icon-based section dividers

**Prevention:**
- Use ONLY standard headers: "Work Experience" (not "Professional History"), "Education" (not "Academic Background"), "Skills" (not "What I Know"), "Summary" (not "About Me")
- Validate template section headers against ATS standards
- Provide template linting that flags non-standard headers

**Phase:** Template validation (mid phase)

**Sources:**
- [Careerflow - ATS resume mistakes](https://www.careerflow.ai/blog/ats-resume-mistakes-to-avoid)
- [Santa Clara University - iCIMS formatting](https://www.scu.edu/careercenter/toolkit/job-scan-common-ats-resume-formatting-mistakes/)

---

### High: Tables and Text Boxes Break Parsing

**What goes wrong:** ATS skips entire sections, misinterprets data order, or creates parsing loops.

**Why it happens:** ATS parsers traverse document structure sequentially. Tables create ambiguous reading order (row-first vs column-first). Text boxes are treated as separate objects, not inline content.

**Warning signs:**
- Two-column layouts using tables for alignment
- Skills presented in multi-column tables
- Sidebar designs using text boxes

**Prevention:**
- Never use Word tables for layout
- Never use text boxes for content
- Use CSS Flexbox/Grid for HTML that converts to linear content in PDF/DOCX
- Single-column is safest; if using columns, ensure they linearize predictably

**Phase:** Template design (early phase)

**Sources:**
- [Mployee - ATS formatting mistakes](https://www.mployee.me/blog/ats-resume-formatting-mistakes-to-avoid)
- [iCIMS Resume Checker Guide](https://jobseekertools.com/blog/icims-resume-checker)

---

### High: Acronym-Only Technical Skills

**What goes wrong:** ATS filters for "Kubernetes" but resume only says "K8s". Filter for "Continuous Integration" misses "CI/CD".

**Why it happens:** ATS keyword matching (especially in older systems) is often literal. iCIMS has improved AI matching, but many resume screeners still use exact keyword filters.

**Warning signs:**
- Skills section contains only acronyms
- Job descriptions spell out terms that resume abbreviates
- Technology versions not specified

**Prevention:**
- Always include both full term AND acronym: "Kubernetes (K8s)", "Continuous Integration/Continuous Deployment (CI/CD)"
- Match terminology to job description exactly
- Include version numbers where relevant: "Python 3.x", "React 18"

**Phase:** Markdown schema design + documentation (early phase)

**Sources:**
- [Toptal - Tech resume ATS keywords](https://www.toptal.com/techresume/career-advice/the-perfect-tech-resume-in-2025-key-trends-ats-keywords-and-formatting-tips)
- [Vitae Express - iCIMS guide](https://www.vitaeexpress.com/new-blog/2024/9/9/the-ultimate-guide-to-crafting-a-resume-for-companies-using-icims)

---

### Medium: Images/Graphics for Skills or Certifications

**What goes wrong:** Star ratings for skills, certification badges, company logos - all invisible to ATS.

**Why it happens:** ATS cannot extract text from images. Even embedded SVG text may not be parsed.

**Warning signs:**
- Skill bars (visual proficiency indicators)
- Icon fonts for contact info (phone icon, email icon)
- Embedded certification badges

**Prevention:**
- All content must be text-based
- Replace skill bars with text: "Python - Expert (5+ years)"
- Spell out contact info without icons
- List certifications as text with issuer and date

**Phase:** Template design + validation (early phase)

**Sources:**
- [Upskillist - ATS parsing mistakes](https://www.upskillist.com/blog/ats-parsing-common-resume-mistakes-to-avoid/)

---

## PDF Generation Pitfalls

### Critical: Page Break Mid-Content

**What goes wrong:** Work experience entry split across pages. Bullet points orphaned from their job title. Section header at page bottom with content on next page.

**Why it happens:** PDF generators don't automatically understand semantic content boundaries. CSS `break-inside: avoid` is inconsistently supported.

**Warning signs:**
- Generated PDFs have awkward page breaks
- Section headers appear alone at page bottoms
- Single bullet points orphaned on new pages

**Prevention:**
- Use `break-inside: avoid` on job entries, education entries, skill groups
- Use `break-before: auto` and `break-after: auto` strategically
- Test with realistic multi-page content during development
- Avoid floated elements (page-break doesn't work with floats)

**Phase:** PDF template CSS (mid phase)

**Sources:**
- [Dev.to - Page break nightmare solved](https://dev.to/resumemind/htmlcss-to-pdf-how-i-solved-the-page-break-nightmare-mdg)
- [CSS-Tricks - page-break](https://css-tricks.com/almanac/properties/p/page-break/)

---

### High: Font Not Embedded or Substituted

**What goes wrong:** PDF looks different on different systems. Custom fonts replaced with system defaults. Non-Latin characters display as boxes.

**Why it happens:** PDF didn't embed fonts, relying on system availability. Or fonts were subset incorrectly.

**Warning signs:**
- PDFs look different on different machines
- Font name warnings during generation
- International characters display incorrectly

**Prevention:**
- Always embed fonts fully (not subset for resumes - file size not critical)
- Test on systems without the font installed
- Use web-safe fonts as fallbacks
- For Puppeteer: ensure fonts loaded before render with `document.fonts.ready`

**Phase:** PDF generation core (early phase)

**Sources:**
- [Puppeteer - Font loading issues #422](https://github.com/puppeteer/puppeteer/issues/422)
- [Puppeteer - Custom fonts #3183](https://github.com/puppeteer/puppeteer/issues/3183)

---

### Medium: Incorrect PDF Metadata

**What goes wrong:** PDF title shows "Untitled" or template name. Author field wrong. Some ATS/recruiters see metadata.

**Why it happens:** Default metadata from generation tool not overwritten with resume-specific values.

**Prevention:**
- Set PDF metadata explicitly: Title = "[Name] - Resume", Author = "[Name]"
- Remove any tool watermarks or version stamps
- Keep file size under 200KB for optimal ATS processing

**Phase:** PDF generation (mid phase)

---

### Medium: Print Background Not Enabled

**What goes wrong:** Colored headers, background sections, design elements all disappear in PDF. Resume looks broken or unfinished.

**Why it happens:** PDF generation tools default to print mode with backgrounds disabled.

**Prevention:**
- Enable `printBackground: true` in Puppeteer
- Design templates that still look complete without backgrounds (graceful degradation)
- Test both with and without background printing

**Phase:** PDF generation config (early phase)

**Sources:**
- [RisingStack - Puppeteer PDF generation](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)

---

## DOCX Generation Pitfalls

### Critical: Word Styles Not Used

**What goes wrong:** Document appears formatted but uses direct formatting instead of styles. Editing becomes nightmare. Some ATS parse styles for structure.

**Why it happens:** Programmatic DOCX generation often applies formatting directly rather than using Word's built-in styles system.

**Warning signs:**
- Heading 1, Heading 2 not appearing in Word's Navigation Pane
- No table of contents generation possible
- Inconsistent formatting when editing

**Prevention:**
- Use Word's built-in styles: Heading 1, Heading 2, Normal, List Bullet
- Map markdown headings to Word styles explicitly
- Verify styles in generated document via Word's Styles pane

**Phase:** DOCX generation (mid phase)

**Sources:**
- [Resumly - ATS formatting fix](https://www.resumly.ai/blog/how-to-fix-formatting-issues-that-break-ats-parsing)

---

### High: Character Escaping in Templates

**What goes wrong:** XML parsing errors. Document won't open. Special characters cause corruption.

**Why it happens:** DOCX is XML-based. Characters like `<`, `>`, `&` in content must be escaped. Template engines may not handle this automatically.

**Warning signs:**
- "Failed to open" errors in Word
- Content with ampersands or angle brackets
- User data containing HTML entities

**Prevention:**
- Always escape XML special characters in content before template insertion
- Use template libraries that handle escaping automatically (docxtpl with escaping enabled)
- Test with content containing: `<>&"'` and international characters

**Phase:** DOCX generation core (mid phase)

**Sources:**
- [docxtpl documentation - escaping](https://docxtpl.readthedocs.io/)

---

### Medium: Jinja2 Tags Spanning Word "Runs"

**What goes wrong:** Template tags split across formatting boundaries. `{{name}}` renders as literal text because Word split it into `{{na` and `me}}`.

**Why it happens:** Word documents have "runs" - sequences of characters with same formatting. If you bold part of a Jinja2 tag in the template, it breaks.

**Warning signs:**
- Some template variables work, others don't
- Tags appear literally in output
- Formatting changes break previously working templates

**Prevention:**
- Apply formatting to entire template tags, not partial
- Use "dummy" content in templates to ensure tag integrity
- After template creation, verify tag wholeness before use
- Consider using RichText objects for styled content

**Phase:** Template creation workflow (mid phase)

**Sources:**
- [docxtpl documentation - runs](https://docxtpl.readthedocs.io/)
- [ML Hive - docxtpl guide](https://mlhive.com/2025/12/mastering-dynamic-word-document-generation-python-docxtpl)

---

### Medium: File Size Bloat

**What goes wrong:** Generated DOCX files are unexpectedly large (1MB+ for a simple resume).

**Why it happens:** Embedded fonts, unoptimized images, or template cruft carried forward.

**Prevention:**
- Keep DOCX under 300KB for optimal ATS processing
- Optimize images before embedding
- Start from minimal template, not existing complex document

**Phase:** DOCX generation optimization (late phase)

---

## HTML Embedding Pitfalls

### Critical: CSS Isolation Failure with Object Tag

**What goes wrong:** Parent page styles bleed into embedded resume. Resume styles affect parent page. Layout breaks.

**Why it happens:** `<object>` tag does NOT provide CSS isolation like `<iframe>` does. You cannot style content inside `<object>` from outside, but the tag itself inherits from parent.

**Warning signs:**
- Resume looks different embedded vs standalone
- Link colors wrong
- Font sizes inconsistent

**Prevention:**
- Use `<iframe>` instead of `<object>` if CSS isolation is critical
- If using `<object>`, the embedded HTML must be fully self-contained with all styles inline or in `<style>` tags
- Test embedded view against standalone HTML rendering
- Use shadow DOM for true isolation if using web components

**Phase:** HTML output format (mid phase)

**Sources:**
- [Treehouse - Styling embedded objects](https://teamtreehouse.com/community/is-it-possible-to-style-an-embedded-html-object-with-css)
- [GeeksforGeeks - object vs embed](https://www.geeksforgeeks.org/html/difference-between-object-and-embed-tags/)

---

### High: Missing Fallback Content

**What goes wrong:** If browser doesn't support embedded content type, nothing displays. No error, just blank space.

**Why it happens:** `<object>` and `<embed>` don't have robust fallback mechanisms like `<picture>` or `<video>`.

**Prevention:**
- Provide fallback content inside `<object>` tag
- Include direct link to HTML file as fallback
- Test in browsers with object support disabled

**Phase:** HTML integration (mid phase)

---

### Medium: Long URLs/Strings Overflow

**What goes wrong:** Long GitHub URLs, email addresses break layout, stick out of containers.

**Why it happens:** CSS `overflow-wrap` not universally supported in print/PDF contexts. Long strings with no natural break points don't wrap.

**Prevention:**
- Use `word-break: break-all` for URLs (aggressive but safe)
- Shorten URLs where possible (link shorteners or display text)
- Test with realistic long content (GitHub URLs, long email addresses)

**Phase:** CSS template refinement (mid phase)

**Sources:**
- [DiDoesDigital - Print styles](https://didoesdigital.com/blog/print-styles/)

---

## Template System Pitfalls

### Critical: Format-Specific Logic in Templates

**What goes wrong:** Template works for PDF but breaks for DOCX. HTML version looks completely different. Maintenance nightmare maintaining three versions.

**Why it happens:** Different formats have different capabilities. If template logic assumes PDF features (page breaks) or HTML features (hyperlinks styled with CSS), other formats fail.

**Prevention:**
- Design templates format-agnostically first
- Use abstraction layer between data and format-specific rendering
- Define clear "template contract" - what features templates can use
- Test all three formats with same template and data

**Phase:** Template architecture (early phase, foundational decision)

---

### High: Inconsistent Date Formatting

**What goes wrong:** Some dates show "2022-01", others show "January 2022", others show "01/2022". Looks unprofessional and confuses ATS.

**Why it happens:** Date formatting not standardized in input schema or template processing.

**Warning signs:**
- Date fields accepting free-form text
- Templates formatting dates inconsistently
- Regional format differences

**Prevention:**
- Define strict date format in schema (ISO 8601: YYYY-MM)
- Single date formatting function used everywhere
- Document recommended display format (MM/YYYY or Month YYYY)
- Validate dates in markdown parsing

**Phase:** Schema design + template implementation (early phase)

**Sources:**
- [Rezi - Resume mistakes](https://www.rezi.ai/posts/common-resume-mistakes)

---

### Medium: Hardcoded Content in Templates

**What goes wrong:** Section headers, labels embedded in template. Can't internationalize. Can't customize "Work Experience" vs "Professional Experience".

**Why it happens:** Quick templating puts text directly in template files rather than making it configurable.

**Prevention:**
- All visible text should come from configuration or data
- Templates should only contain structure and formatting
- Support i18n/l10n from the start

**Phase:** Template architecture (early phase)

---

## Markdown Schema Pitfalls

### Critical: No Schema Validation

**What goes wrong:** Users create invalid markdown structures. Missing required fields. Inconsistent data shapes. Generator fails cryptically or produces broken output.

**Why it happens:** Markdown is flexible by nature. Without explicit schema, anything goes.

**Warning signs:**
- User errors result in confusing error messages
- Generated resumes missing sections
- Inconsistent output quality

**Prevention:**
- Define explicit YAML frontmatter schema (consider JSON Resume as base)
- Validate on parse with helpful error messages
- Provide IDE support (JSON Schema for YAML validation in VS Code)
- Document required vs optional fields clearly

**Phase:** Schema design (foundational, early phase)

**Sources:**
- [JSON Resume Schema](https://jsonresume.org/schema)
- [RenderCV JSON Schema](https://docs.rendercv.com/developer_guide/json_schema/)

---

### High: Skills Without Context

**What goes wrong:** Skills list is just names: "Python, JavaScript, Docker". No indication of proficiency, years of experience, or context.

**Why it happens:** Schema allows simple list without requiring structured skill data.

**Warning signs:**
- Skills section looks like keyword stuffing
- No way to filter or prioritize skills
- Can't generate proficiency indicators

**Prevention:**
- Require structured skill format: name, category, proficiency (optional), years (optional)
- Support both simple (string) and complex (object) skill entries
- Template should handle both gracefully

**Phase:** Schema design (early phase)

---

### Medium: Employment Gaps Not Representable

**What goes wrong:** Resume generator can't express career breaks, sabbaticals, contract gaps elegantly.

**Why it happens:** Schema assumes continuous employment with employer-title-dates format.

**Prevention:**
- Allow "gap" entries in work experience
- Support flexible entry types (employment, contract, volunteer, break)
- Document how to handle career transitions

**Phase:** Schema design (early-mid phase)

---

## Multi-Format Consistency Pitfalls

### Critical: Hyperlinks Work in HTML, Missing in PDF/DOCX

**What goes wrong:** Clickable links in HTML become plain text in PDF/DOCX. Or links present but don't work.

**Why it happens:** Link handling differs by format. PDF links require explicit annotation. DOCX links need proper hyperlink XML elements.

**Warning signs:**
- URLs visible but not clickable
- Email addresses not mailto links
- LinkedIn URL just displays as text

**Prevention:**
- Test link clicking in all three formats
- Ensure PDF generator creates proper link annotations
- DOCX must use Word hyperlink elements, not just styled text
- Consider both display and click behavior

**Phase:** Multi-format output (mid phase)

---

### High: Visual Hierarchy Inconsistent Across Formats

**What goes wrong:** PDF has clear visual hierarchy. DOCX looks flat. HTML renders differently.

**Why it happens:** Each format handles spacing, sizing, font weights differently. CSS rem/em units behave differently in HTML vs PDF render.

**Warning signs:**
- Same template looks "off" in different formats
- Relative sizing doesn't translate
- Margins/padding inconsistent

**Prevention:**
- Use absolute units (pt, px) rather than relative for print formats
- Establish format-specific style overrides
- Visual regression testing across all formats
- Side-by-side comparison in review process

**Phase:** Template CSS refinement (mid phase)

---

### Medium: Content Truncation/Overflow Differences

**What goes wrong:** Content fits in PDF but overflows in DOCX. Or HTML wraps text that PDF doesn't.

**Why it happens:** Different rendering engines have different line-height, character-width calculations.

**Prevention:**
- Test with maximum realistic content lengths
- Avoid fixed-height containers
- Use text overflow strategies (`overflow-wrap`, `word-break`) consistently

**Phase:** Template testing (mid-late phase)

---

## Prevention Strategies Summary

### By Phase

**Phase 1: Schema & Architecture**
- Define explicit markdown/YAML schema with validation
- Choose format-agnostic template approach
- Decide on PDF generation technology (Puppeteer recommended for HTML-first)
- Establish section header standards (ATS-compatible)

**Phase 2: Core Generation**
- Implement PDF generation with font embedding verification
- Implement copy-paste test for ATS text extraction
- Implement DOCX with proper Word styles
- Implement HTML with fully embedded CSS

**Phase 3: Template System**
- Create ATS-compliant base templates
- Implement page break handling
- Establish consistent date formatting
- Test all three formats from same data

**Phase 4: Validation & Testing**
- Automated ATS simulation testing (copy-paste extraction)
- Visual regression testing across formats
- Schema validation with helpful errors
- Multi-format consistency checks

### Testing Checklist (Every Build)

- [ ] PDF: Copy-paste all text to plain text editor, verify no garbled characters
- [ ] PDF: Open in multiple viewers (Chrome, Adobe, Preview)
- [ ] PDF: Verify all links clickable
- [ ] DOCX: Open in Word, check Styles pane shows proper heading styles
- [ ] DOCX: Verify document opens without repair prompts
- [ ] DOCX: Test with special characters in content (`<>&"'`)
- [ ] HTML: View standalone and embedded, compare rendering
- [ ] All: Test with 2+ pages of content for page break behavior
- [ ] All: Verify section headers are standard ATS-compatible names

---

## Sources

### ATS & iCIMS
- [Jobscan - iCIMS ATS](https://www.jobscan.co/blog/icims-ats/)
- [Jobscan - ATS formatting mistakes](https://www.jobscan.co/blog/ats-formatting-mistakes/)
- [Careerflow - ATS mistakes to avoid](https://www.careerflow.ai/blog/ats-resume-mistakes-to-avoid)
- [Elite Resumes - ATS formatting](https://eliteresumes.co/career-resources/ats-optimization/ats-formatting.html)
- [iCIMS - CV/Resume parsing](https://www.icims.com/blog/what-is-cv-resume-parsing/)
- [Vitae Express - iCIMS guide](https://www.vitaeexpress.com/new-blog/2024/9/9/the-ultimate-guide-to-crafting-a-resume-for-companies-using-icims)

### PDF Generation
- [RisingStack - Puppeteer PDF](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)
- [Puppeteer PDF documentation](https://pptr.dev/guides/pdf-generation)
- [Dev.to - Page break solutions](https://dev.to/resumemind/htmlcss-to-pdf-how-i-solved-the-page-break-nightmare-mdg)
- [CSS-Tricks - page-break](https://css-tricks.com/almanac/properties/p/page-break/)

### DOCX Generation
- [python-docx-template docs](https://docxtpl.readthedocs.io/)
- [python-docx docs](https://python-docx.readthedocs.io/)
- [Softkraft - Word automation](https://www.softkraft.co/python-word-automation/)

### Schema Standards
- [JSON Resume Schema](https://jsonresume.org/schema)
- [FRESH Resume Schema](https://github.com/fresh-standard/fresh-resume-schema)
- [RenderCV JSON Schema](https://docs.rendercv.com/developer_guide/json_schema/)

### Text Extraction Issues
- [Adobe Community - PDF gibberish](https://community.adobe.com/t5/acrobat-discussions/copying-and-pasting-text-in-pdf-turns-to-gibberish/td-p/10194796)
- [Docparser - garbled PDF conversion](https://help.docparser.com/hc/en-us/articles/16254860582676-What-to-do-when-a-PDF-document-is-converted-to-garbled-characters-and-symbols)
