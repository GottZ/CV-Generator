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

## PDF Pagination Improvement Pitfalls

### Critical: break-inside:avoid Ignored in Headless Mode

**What goes wrong:** CSS `break-inside: avoid` works in browser print preview but not in Puppeteer headless PDF generation. Content still splits mid-element.

**Why it happens:** Chromium's headless mode has historically had bugs with CSS fragmentation properties. The browser and print preview may behave differently than programmatic PDF generation.

**Warning signs:**
- PDF looks correct when printed from Chrome browser
- Puppeteer-generated PDF has different page breaks
- Same HTML, different break behavior between screen print and Puppeteer

**Prevention:**
- Test pagination specifically with Puppeteer, not just browser print preview
- Use both legacy `page-break-inside: avoid` AND modern `break-inside: avoid` for redundancy
- Apply break properties to block-level elements only (not inline, not floated)
- Convert flex containers to `display: block` in print CSS if break-inside fails

**Detection:**
- Automated test comparing page break positions between expected and actual PDF

**Phase:** PDF pagination improvements

**Sources:**
- [Puppeteer Issue #6366 - break-inside ignored in headless](https://github.com/puppeteer/puppeteer/issues/6366)
- [Puppeteer Issue #5277 - page break not working](https://github.com/puppeteer/puppeteer/issues/5277)

---

### Critical: Flexbox/Grid Breaks Page-Break Properties

**What goes wrong:** `page-break-inside: avoid` stops working when applied inside flex or grid containers. Content splits anyway.

**Why it happens:** CSS fragmentation is poorly supported inside flexbox and grid layouts in print contexts. Chrome and Safari specifically have this limitation.

**Warning signs:**
- Page breaks work for some elements but not others
- Elements inside flex containers split across pages
- Removing `display: flex` fixes the page break issue

**Prevention:**
- In `@media print`, convert flex containers to `display: block`
- Apply page-break to a block-level pseudo-element inside flex items
- Test with actual PDF export, not just DevTools print emulation
- Use single-column, non-flex layout for printable content

**Detection:**
- Visual inspection of multi-page PDFs with flexbox layouts

**Phase:** PDF pagination improvements

**Sources:**
- [IPython Issue #5115 - Page breaks broken by display:flex](https://github.com/ipython/ipython/issues/5115)
- [Smashing Magazine - CSS Fragmentation](https://www.smashingmagazine.com/2019/02/css-fragmentation/)

---

### High: orphans/widows Properties Not Honored

**What goes wrong:** Single lines of text appear orphaned at page bottoms or widowed at page tops, despite CSS `orphans` and `widows` properties.

**Why it happens:** Firefox does not support `orphans`/`widows`. Even in Chrome, these properties can be overridden by other layout constraints.

**Warning signs:**
- Single bullet point at bottom of page with rest on next page
- Single line of job description isolated on new page
- Professional appearance degraded

**Prevention:**
- Set `orphans: 3; widows: 3;` as baseline
- Combine with `break-inside: avoid` on entry containers
- Accept that Firefox users printing locally may see different behavior
- For Puppeteer (Chromium), these should work - verify in generated PDFs

**Detection:**
- Visual review of multi-page PDFs at various content lengths

**Phase:** PDF pagination improvements

**Sources:**
- [Smashing Magazine - CSS Fragmentation](https://www.smashingmagazine.com/2019/02/css-fragmentation/)
- [CSS-Tricks - orphans property](https://css-tricks.com/almanac/properties/o/orphans/)

---

### High: Page Breaks Inside Tables

**What goes wrong:** Table rows get cut in half across page boundaries. Half a row at bottom, half at top of next page.

**Why it happens:** Tables have complex layout rules. `break-inside: avoid` on `<tr>` may be ignored because browsers apply special fragmentation rules to table elements.

**Warning signs:**
- Skills table split mid-row
- Experience entries using table layouts break incorrectly
- Text appears cut off at page boundaries

**Prevention:**
- Avoid using tables for layout (semantic tables for data only)
- Apply `break-inside: avoid` to the entire table, not individual rows
- If table must span pages, use explicit `<thead>` to repeat headers
- Apply page-break to block-level pseudo-element on `<tbody>` instead of rows

**Detection:**
- Generate PDFs with tables that would span pages; verify integrity

**Phase:** PDF pagination improvements

**Sources:**
- [Puppeteer Issue #8708 - Page break within table doesn't work](https://github.com/puppeteer/puppeteer/issues/8708)
- [CopyProgramming - Avoid page break inside row of table](https://copyprogramming.com/howto/avoid-page-break-inside-row-of-table)

---

### Medium: Section Headers Orphaned from Content

**What goes wrong:** "Work Experience" header appears at bottom of page with all content on next page. Looks broken/incomplete.

**Why it happens:** `break-after: avoid` on headings has limited browser support. Only Chrome 108+ supports it; Safari and Firefox do not.

**Warning signs:**
- Section titles isolated at page bottoms
- Large gaps at end of pages
- Unprofessional appearance

**Prevention:**
- Wrap section headers with first entry in a container with `break-inside: avoid`
- Use `break-before: always` on sections instead (force new page)
- For critical sections, add explicit page break before rather than relying on avoid-after
- Test with realistic content lengths that trigger pagination

**Detection:**
- Visual review with various content lengths

**Phase:** PDF pagination improvements

**Sources:**
- [Clagnut - Pagination widows](https://clagnut.com/blog/2426)
- [Smashing Magazine - CSS Fragmentation](https://www.smashingmagazine.com/2019/02/css-fragmentation/)

---

### Medium: Margin/Padding Accumulation at Page Breaks

**What goes wrong:** Extra whitespace appears at top of new pages after page breaks. Margins "double up."

**Why it happens:** Element margins don't collapse across page breaks. Top margin of continued content adds to page margin.

**Warning signs:**
- Inconsistent vertical spacing on continuation pages
- First page looks correct, subsequent pages have extra space at top
- Content appears "pushed down" on page 2+

**Prevention:**
- Use `padding` instead of `margin` for internal spacing
- In print CSS, reduce or zero out top margins on elements that can break
- Use `@page` margin rules rather than element margins for page edges

**Detection:**
- Visual comparison of first page vs subsequent pages

**Phase:** PDF pagination improvements

---

## Print CSS / HTML Parity Pitfalls

### Critical: Print Styles Bleed into Screen Display

**What goes wrong:** Adding print CSS breaks the screen display. Elements hidden for print disappear on screen. Layout shifts occur.

**Why it happens:** CSS specificity issues - print rules without proper `@media print` scoping override screen rules. Or print rules accidentally apply to both media.

**Warning signs:**
- Screen layout changes after adding print.css
- Elements unexpectedly hidden/shown
- Colors or fonts different on screen
- "It was working before we added print styles"

**Prevention:**
- ALWAYS wrap print-specific CSS in `@media print { }`
- Keep print CSS in separate file with `media="print"` on link tag
- Use `@media screen { }` for screen-only styles that conflict
- Add visual regression tests for BOTH screen AND print views
- Test screen rendering after every print CSS change

**Detection:**
- Visual regression test of screen view before/after print CSS changes
- Developer review: search for CSS rules not inside media queries

**Phase:** Print CSS implementation

**Sources:**
- [PixelFreeStudio - Print styles gone wrong](https://blog.pixelfreestudio.com/print-styles-gone-wrong-avoiding-pitfalls-in-media-print-css/)
- [Smashing Magazine - How to set up a print style sheet](https://www.smashingmagazine.com/2011/11/how-to-set-up-a-print-style-sheet/)

---

### Critical: CSS Variable Fallbacks Missing for Print

**What goes wrong:** CSS variables (`var(--color-text)`) that work on screen resolve to nothing in print context, causing invisible text or missing styles.

**Why it happens:** CSS variables defined in `:root` for screen may not be available in print context if defined inside `@media screen`, or print media may have different cascade.

**Warning signs:**
- Elements invisible in PDF but visible on screen
- Colors different between screen and PDF
- CSS using `var()` extensively

**Prevention:**
- Define CSS variables in both screen AND print media queries, or outside any media query
- Always provide fallback values: `color: var(--text-color, #333333);`
- In print CSS, explicitly re-declare critical colors as fixed values
- Test PDF output whenever modifying CSS variable definitions

**Detection:**
- PDF output with missing or wrong colors
- Compare screen hex colors to PDF hex colors

**Phase:** Print CSS implementation

---

### High: Background Colors Disappear in Print

**What goes wrong:** Colored headers, highlighted sections, background styling all vanish in PDF. Resume looks incomplete or broken.

**Why it happens:** Browsers default to NOT printing backgrounds to save ink. Puppeteer inherits this default behavior.

**Warning signs:**
- Template looks complete on screen but plain in PDF
- Section dividers disappear
- Emphasis styling lost

**Prevention:**
- Set `printBackground: true` in Puppeteer `page.pdf()` options
- Add `-webkit-print-color-adjust: exact` and `print-color-adjust: exact` to print CSS
- Design templates that still look acceptable without backgrounds (graceful degradation)
- Verify PDF output, not just DevTools print preview

**Detection:**
- Visual comparison of screen vs PDF backgrounds

**Phase:** Print CSS implementation

**Sources:**
- [SitePoint - CSS printer-friendly pages](https://www.sitepoint.com/css-printer-friendly-pages/)

---

### High: Responsive Layouts Break in Print

**What goes wrong:** Two-column responsive layout collapses or expands incorrectly when printed. Content overflows or leaves large gaps.

**Why it happens:** Print has a fixed page size (A4, Letter). Responsive breakpoints based on viewport width don't apply correctly to print context.

**Warning signs:**
- Sidebar content wraps incorrectly
- Multi-column layout becomes single column unexpectedly
- Content overflows page width

**Prevention:**
- Define explicit fixed-width layout for print: `@media print { .container { width: 170mm; } }`
- Flatten responsive layouts to single-column for print
- Don't rely on viewport-based breakpoints; print context width is ambiguous
- Set explicit widths in mm or pt for print layouts

**Detection:**
- PDF output with different widths than expected
- Content overflow visible in PDF

**Phase:** Print CSS implementation

**Sources:**
- [PixelFreeStudio - Print styles gone wrong](https://blog.pixelfreestudio.com/print-styles-gone-wrong-avoiding-pitfalls-in-media-print-css/)

---

### Medium: Font Sizes Don't Match Screen/Print

**What goes wrong:** Text appears larger or smaller in PDF than on screen. Relative units (em, rem) calculate differently.

**Why it happens:** Print context has different base font size, different DPI assumptions. `rem` units based on `:root` may differ. Browser may scale fonts for print.

**Warning signs:**
- Resume looks cramped or too sparse in PDF
- Font sizes visually different between screen and PDF
- Using `em` or `rem` extensively

**Prevention:**
- Use absolute units (pt) for print CSS: `@media print { body { font-size: 11pt; } }`
- Define explicit print font sizes rather than inheriting screen sizes
- Test with actual PDF output, not just print preview

**Detection:**
- Side-by-side comparison of screen and PDF text sizes

**Phase:** Print CSS implementation

---

### Medium: Link Styling Invisible in Print

**What goes wrong:** Hyperlinks that are obvious on screen (blue, underlined) are indistinguishable from regular text in black-and-white print.

**Why it happens:** Link colors may print as black. No hover state in PDF to indicate interactivity.

**Warning signs:**
- URLs mentioned but not visually distinct
- Reader doesn't know text is clickable
- PDF viewer doesn't highlight links on hover

**Prevention:**
- Keep underlines for links in print CSS
- Optionally append URL after link text: `a::after { content: " (" attr(href) ")"; }` (but carefully for resume context)
- Ensure links are actually clickable in PDF (test by clicking)
- Use consistent link styling that's visible in both color and B&W

**Detection:**
- Visual inspection of link visibility in PDF
- Link click testing in PDF viewer

**Phase:** Print CSS implementation

---

### Low: Interactive Elements Visible in PDF

**What goes wrong:** Theme toggle buttons, hover tooltips, or other interactive elements appear in PDF where they serve no purpose.

**Why it happens:** Elements not hidden in print CSS remain visible. Developers forget to hide non-printable elements.

**Warning signs:**
- Buttons visible in PDF
- Dropdown indicators showing
- Navigation elements present

**Prevention:**
- Hide all interactive elements in print: `.theme-toggle, .nav, .tooltip { display: none; }`
- Review PDF for any elements that only make sense on screen
- Create checklist of interactive elements to hide

**Detection:**
- Visual review of PDF for inappropriate elements

**Phase:** Print CSS implementation

---

## Automated PDF Testing Pitfalls

### Critical: Font Rendering Differs Between Environments

**What goes wrong:** PDF visual tests pass locally but fail in CI. Screenshot comparisons show font differences that aren't real bugs.

**Why it happens:** Different operating systems, fontconfig versions, and installed fonts produce different font rendering. Even same fonts render differently on macOS vs Linux.

**Warning signs:**
- Tests pass on developer machine, fail on CI
- Pixel diffs concentrated on text areas
- Anti-aliasing differences visible in diffs

**Prevention:**
- Run tests in Docker container matching CI environment
- Use `--font-render-hinting=none` Chromium flag for consistent rendering
- Install identical fonts in all environments (web fonts recommended)
- Use looser pixel diff thresholds (accept 0.1-1% variance)
- Consider text-based testing (extraction) over pixel testing for content verification

**Detection:**
- CI failures with font-related diff images
- Consistent failures only on specific platforms

**Phase:** Automated PDF testing

**Sources:**
- [Puppeteer Issue #661 - Consistent font rendering](https://github.com/puppeteer/puppeteer/issues/661)
- [Puppeteer Issue #4437 - Different font render on Windows vs Lambda](https://github.com/puppeteer/puppeteer/issues/4437)

---

### Critical: PDF-to-Image Conversion Introduces Artifacts

**What goes wrong:** Visual regression tests detect differences that aren't in the actual PDF - they're artifacts of the conversion to image for comparison.

**Why it happens:** Different PDF renderers (pdf.js, PDFium, Poppler) produce different images from identical PDFs. Scaling, color profiles, and anti-aliasing differ.

**Warning signs:**
- Slight color differences in diff
- Edge anti-aliasing variations
- Tests fail after upgrading pdf-to-image library

**Prevention:**
- Pin PDF rendering library version
- Use PDFium for consistency (same renderer as Chromium)
- Render at higher DPI (300+) then compare at lower resolution
- Use perceptual diff algorithms that tolerate anti-aliasing (pixelmatch's AA detection)
- Consider multiple rendering passes to verify consistency

**Detection:**
- Diff images showing artifacts not visible in actual PDF
- Flaky tests that pass/fail randomly

**Phase:** Automated PDF testing

**Sources:**
- [Lost Pixel - PDF visual regression testing](https://www.lost-pixel.com/blog/pdf-visual-regression-testing)
- [Nutrient - Evaluating render fidelity of PDF.js](https://www.nutrient.io/blog/render-fidelity-of-pdfjs/)

---

### High: Flaky Tests from Dynamic Content

**What goes wrong:** Tests fail intermittently due to timestamps, dates, or other dynamic content changing between baseline and test run.

**Why it happens:** PDFs may contain generation dates, version numbers, or other content that changes each run.

**Warning signs:**
- Tests fail showing date/time differences
- Metadata comparisons fail
- Random test failures without code changes

**Prevention:**
- Mock current date/time during test runs
- Exclude dynamic regions from visual comparison (use ignore rectangles)
- Separate content tests from metadata tests
- Use fixtures with fixed timestamps

**Detection:**
- Diff images highlighting date/time areas
- Pattern of failures correlating with time

**Phase:** Automated PDF testing

**Sources:**
- [ShakaCode - Flaky visual regression tests](https://www.shakacode.com/blog/flaky-visual-regression-tests-and-what-to-do-about-them/)

---

### High: Multi-Page PDF Comparison Complexity

**What goes wrong:** Tests only compare first page, missing regressions on subsequent pages. Or page count changes cause cascading false failures.

**Why it happens:** Naive visual testing compares single screenshots. Multi-page documents need page-by-page comparison with tolerance for page count changes.

**Warning signs:**
- Regression on page 2+ goes undetected
- Adding content causes all pages after to show as "different"
- Tests only capture first page screenshot

**Prevention:**
- Render each PDF page to separate image, compare individually
- Use Puppeteer's PDF viewer navigation (arrow keys) to capture each page
- Store baseline images per-page, not per-document
- Handle page count changes gracefully (report new/removed pages)

**Detection:**
- Manual review finds issues on non-first pages
- Test coverage analysis shows single-page only

**Phase:** Automated PDF testing

**Sources:**
- [Medium - PDF visual regression testing with Puppeteer](https://medium.com/the-crc-tech-blog/pdf-visual-regression-testing-the-puppetmaster-approach-7a575d6c5559)

---

### High: Threshold Tuning Leads to False Negatives

**What goes wrong:** To stop flaky tests, threshold is set too high. Real bugs pass through undetected because diff percentage is "acceptable."

**Why it happens:** Fighting flaky tests by increasing tolerance eventually tolerates real bugs. Line between "acceptable variance" and "real bug" is unclear.

**Warning signs:**
- Known visual bugs pass tests
- Threshold keeps increasing to pass tests
- Developers distrust test results

**Prevention:**
- Start with strict threshold (0.1%), only loosen with documented justification
- Use smart diff tools that distinguish structural changes from noise
- Consider AI-powered comparison (Applitools, Percy) that understand "expected" variation
- Separate "exactly same" tests from "visually acceptable" tests
- Log threshold changes with reasoning

**Detection:**
- Track threshold changes over time
- Audit: manually verify tests catch known intentional changes

**Phase:** Automated PDF testing

**Sources:**
- [BrowserStack - Visual regression testing tools](https://www.browserstack.com/guide/visual-regression-testing-open-source)

---

### Medium: Screenshot Size/Viewport Inconsistency

**What goes wrong:** PDF renders at different sizes between baseline and test, causing entire comparison to fail despite identical content.

**Why it happens:** Viewport size, device scale factor, or browser window size differs between test runs. PDF viewer zooms differently.

**Warning signs:**
- Entire page shows as different
- Content is identical but scaled differently
- Comparison fails on CI but passes locally

**Prevention:**
- Set explicit viewport size before screenshots: `page.setViewport({ width: 1200, height: 1600 })`
- Use Puppeteer's `clip` option to capture fixed region
- Crop out PDF viewer chrome (filename, scrollbars)
- Pin browser/Puppeteer version in CI

**Detection:**
- Diff images showing scale differences
- Comparison of baseline and test image dimensions

**Phase:** Automated PDF testing

**Sources:**
- [Puppeteer Issue #2278 - Inconsistent page width and height](https://github.com/puppeteer/puppeteer/issues/2278)

---

### Medium: Text Extraction Inconsistency Across Versions

**What goes wrong:** Text extraction tests pass on one Puppeteer version, fail on another. Extracted text format changes unexpectedly.

**Why it happens:** Chromium's PDF text layer encoding can vary between versions. Copy-paste behavior changes. Ligatures handled differently.

**Warning signs:**
- Tests fail after Puppeteer upgrade
- Extracted text has extra/missing spaces
- Character encoding issues appear

**Prevention:**
- Pin Puppeteer/Chromium version for stability
- Test text extraction specifically when upgrading Puppeteer
- Use `font-variant-ligatures: none` to avoid ligature extraction issues
- Compare extracted text with normalization (collapse whitespace, trim)

**Detection:**
- Text extraction assertions fail after dependency updates
- Character-by-character diff shows unexpected changes

**Phase:** Automated PDF testing

**Sources:**
- [Puppeteer Issue #4125 - Copy content missing characters](https://github.com/puppeteer/puppeteer/issues/4125)
- [Puppeteer Issue #12447 - Text encoding in PDF generation](https://github.com/puppeteer/puppeteer/issues/12447)

---

### Low: CI Resource Constraints Cause Timeouts

**What goes wrong:** PDF generation times out in CI but works locally. Tests sporadically fail due to resource limits.

**Why it happens:** CI environments often have fewer resources (CPU, memory) than development machines. Puppeteer/Chrome is resource-intensive.

**Warning signs:**
- TimeoutError in CI logs
- Tests pass locally, flaky in CI
- Slower CI runs correlate with failures

**Prevention:**
- Increase timeout for PDF operations in CI (60s+)
- Use `--disable-dev-shm-usage` flag in Docker
- Limit parallelism in CI PDF tests
- Consider dedicated larger runner for PDF tests
- Implement retry logic with backoff

**Detection:**
- CI logs showing timeout errors
- Correlation analysis: failures during high-load periods

**Phase:** Automated PDF testing

**Sources:**
- [Baeldung - Run Chrome headless in Docker](https://www.baeldung.com/ops/docker-google-chrome-headless)

---

## Integration Pitfalls (Adding Features to Existing System)

### Critical: Existing PDF Generation Disrupted

**What goes wrong:** Adding pagination improvements or print CSS breaks existing working PDF output. Users report regressions.

**Why it happens:** New CSS rules conflict with existing ones. Print CSS overrides affect screen or existing print behavior. Integration not tested end-to-end.

**Warning signs:**
- "It was working before this change"
- Existing tests start failing after pagination changes
- User complaints after feature release

**Prevention:**
- Establish baseline test suite BEFORE making changes
- Run full regression suite after each change
- Use feature flags to test new pagination without affecting default
- Incremental rollout with monitoring
- Code review specifically focused on unintended side effects

**Detection:**
- Regression test failures
- Production monitoring for changed behavior

**Phase:** Before any changes begin

---

### High: CSS Specificity Wars Between Screen and Print

**What goes wrong:** Print CSS overrides screen rules with `!important`, then screen needs `!important !important` (impossible). Specificity escalation begins.

**Why it happens:** Both screen and print styles targeting same selectors. Developers add `!important` to force print rules, breaking carefully balanced specificity.

**Warning signs:**
- Increasing use of `!important` in codebase
- Print styles require increasingly specific selectors
- Styles behave unexpectedly after minor changes

**Prevention:**
- Keep print CSS in completely separate file with `media="print"`
- Use distinct class names for print-only elements (`.print-header`)
- Avoid `!important` - restructure selectors instead
- Document CSS architecture and specificity strategy

**Detection:**
- Code review flagging `!important`
- Static analysis of CSS specificity conflicts

**Phase:** Print CSS implementation

**Sources:**
- [Philip Walton - Side effects in CSS](https://philipwalton.com/articles/side-effects-in-css/)

---

### High: Test Infrastructure Not Ready for PDF Testing

**What goes wrong:** Team tries to add PDF visual regression tests but lacks infrastructure. Tests are slow, flaky, or never actually run.

**Why it happens:** PDF testing requires: image comparison library, baseline storage, CI configuration, Docker setup for consistency. This is a significant infrastructure investment.

**Warning signs:**
- "We'll add tests later"
- Tests exist but are skipped
- Only manual testing performed
- No baseline images in repository

**Prevention:**
- Set up test infrastructure BEFORE implementing features
- Choose testing approach early (visual regression vs text extraction vs hybrid)
- Allocate time specifically for test infrastructure
- Start with simple tests, incrementally add sophistication

**Detection:**
- Test coverage metrics show PDF tests missing
- No test failures when deliberately introducing bugs

**Phase:** Test infrastructure setup (first priority)

---

### Medium: Performance Regression from Pagination Logic

**What goes wrong:** PDF generation becomes significantly slower after adding pagination improvements. User-facing performance degraded.

**Why it happens:** Complex CSS calculations for pagination. Multiple render passes. Additional DOM manipulation before PDF generation.

**Warning signs:**
- Longer PDF generation times after changes
- Browser consumes more memory during generation
- Users complain about slower exports

**Prevention:**
- Benchmark PDF generation before and after changes
- Set performance budget (e.g., <3 seconds for 2-page PDF)
- Profile slow generation to identify bottlenecks
- Avoid JavaScript-based pagination calculation if CSS suffices

**Detection:**
- Performance tests comparing generation times
- Production monitoring of PDF generation duration

**Phase:** All PDF-related changes

---

### Medium: Incomplete Testing of Edge Cases

**What goes wrong:** Features work for common cases but break for edge cases: very long content, empty sections, special characters, unusual content combinations.

**Why it happens:** Testing focuses on happy path. Edge cases not identified or prioritized. Time pressure leads to incomplete test coverage.

**Warning signs:**
- User-reported bugs for unusual content
- "It works on my sample data"
- No tests for boundary conditions

**Prevention:**
- Define explicit test cases for: empty content, maximum content, special characters, different page counts, all template variations
- Use property-based testing to generate edge cases
- Review user-reported issues for edge case patterns
- Test with real (anonymized) user data if possible

**Detection:**
- Bug reports for edge cases
- Code coverage showing untested branches

**Phase:** All phases - continuous attention

---

## Prevention Strategies Summary

### By Phase

**Phase 1: Test Infrastructure Setup (Before Any Changes)**
- Set up visual regression testing framework
- Establish baselines for current PDF output
- Configure CI environment for consistent rendering
- Document testing strategy and thresholds

**Phase 2: Print CSS Implementation**
- Verify no screen display regression after each change
- Test both screen AND print views
- Use separate print stylesheet with media attribute
- Avoid `!important` escalation

**Phase 3: PDF Pagination Improvements**
- Use both legacy and modern break properties
- Convert flex layouts to block for print context
- Test with realistic multi-page content
- Verify page breaks with Puppeteer, not just browser print preview

**Phase 4: Automated PDF Testing**
- Pin all versions (Puppeteer, Chromium, pdf libraries)
- Use Docker for environment consistency
- Set appropriate thresholds with documented rationale
- Separate content tests from visual tests

**Phase 5: Integration & Verification**
- Run full regression suite
- Performance benchmark before/after
- Test edge cases explicitly
- Monitor production for regressions

### Testing Checklist (Every Change)

- [ ] Screen display unchanged (visual regression)
- [ ] Print preview matches expectations (manual spot check)
- [ ] PDF output matches print preview (automated comparison)
- [ ] Page breaks in correct locations (multi-page content)
- [ ] Text extraction produces correct content (copy-paste test)
- [ ] Performance within budget (generation time)
- [ ] CI tests pass (not just local)
- [ ] Edge cases covered (long content, empty sections)

---

## Sources

### PDF Pagination / CSS Fragmentation
- [Puppeteer Issue #6366 - break-inside ignored](https://github.com/puppeteer/puppeteer/issues/6366)
- [Puppeteer Issue #5277 - page break not working](https://github.com/puppeteer/puppeteer/issues/5277)
- [Puppeteer Issue #8708 - table page breaks](https://github.com/puppeteer/puppeteer/issues/8708)
- [Smashing Magazine - CSS Fragmentation](https://www.smashingmagazine.com/2019/02/css-fragmentation/)
- [CSS-Tricks - page-break](https://css-tricks.com/almanac/properties/p/page-break/)
- [Dev.to - Page break nightmare solved](https://dev.to/resumemind/htmlcss-to-pdf-how-i-solved-the-page-break-nightmare-mdg)

### Print Stylesheets
- [PixelFreeStudio - Print styles pitfalls](https://blog.pixelfreestudio.com/print-styles-gone-wrong-avoiding-pitfalls-in-media-print-css/)
- [Smashing Magazine - Print stylesheets guide](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/)
- [SitePoint - CSS printer-friendly pages](https://www.sitepoint.com/css-printer-friendly-pages/)

### Visual Regression Testing
- [Lost Pixel - PDF visual regression](https://www.lost-pixel.com/blog/pdf-visual-regression-testing)
- [ShakaCode - Flaky visual regression tests](https://www.shakacode.com/blog/flaky-visual-regression-tests-and-what-to-do-about-them/)
- [Medium - PuppetMaster PDF testing](https://medium.com/the-crc-tech-blog/pdf-visual-regression-testing-the-puppetmaster-approach-7a575d6c5559)
- [BrowserStack - Visual testing tools](https://www.browserstack.com/guide/visual-testing-tools)

### Font Rendering / Environment Consistency
- [Puppeteer Issue #661 - Consistent font rendering](https://github.com/puppeteer/puppeteer/issues/661)
- [Puppeteer Issue #4437 - Windows vs Lambda rendering](https://github.com/puppeteer/puppeteer/issues/4437)
- [Baeldung - Chrome headless in Docker](https://www.baeldung.com/ops/docker-google-chrome-headless)

### Text Extraction
- [Puppeteer Issue #4125 - Copy missing characters](https://github.com/puppeteer/puppeteer/issues/4125)
- [Puppeteer Issue #12447 - Text encoding issues](https://github.com/puppeteer/puppeteer/issues/12447)

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
