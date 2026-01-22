# Research Summary: CV/Resume Generator CLI Tool

**Project:** CLI-based CV/resume generator (Markdown to PDF/HTML/DOCX)
**Target Users:** IT professionals
**Core Goal:** iCIMS expert-grade ATS optimization
**Synthesized:** 2026-01-22
**Overall Confidence:** HIGH

---

## Executive Summary

This project builds a CLI tool that transforms markdown-formatted CVs into ATS-optimized PDF, HTML, and DOCX files, specifically targeting IT professionals who need to pass iCIMS and similar ATS systems. Research reveals that the critical success factor is not visual design but text extractability and structural compatibility with ATS parsers.

The recommended approach uses **Node.js 20+ with TypeScript** and a browser-based PDF generation strategy (Puppeteer) to ensure text layers are properly embedded. The architecture follows a clear pipeline: markdown parsing (gray-matter + marked) -> template rendering (Nunjucks) -> multi-format output (Puppeteer for PDF, docx library for DOCX, self-contained HTML). This stack prioritizes ATS compatibility over visual creativity, as 97%+ of Fortune 500 companies use ATS systems that silently reject poorly formatted resumes.

Key risks center on PDF text extraction failures (garbled ToUnicode maps), ATS parser confusion (tables, headers/footers, non-standard sections), and multi-format consistency. These are mitigated through: (1) automated copy-paste testing of generated PDFs, (2) single-column template constraints, (3) standard section headers, and (4) shared intermediate HTML representation across all formats.

---

## Key Findings

### From STACK.md: Technology Recommendations

**Core Stack:**
- **Runtime:** Node.js 20+ LTS with TypeScript 5.x - Required by modern dependencies, provides type safety for structured CV data
- **CLI Framework:** Commander.js 14+ - Lightweight, TypeScript-native, sufficient for focused single-purpose CLI
- **PDF Generation:** Puppeteer 24+ - Browser-based HTML-to-PDF ensures ATS-compatible text layers, Google-backed maintenance
- **DOCX Generation:** docx 9.5+ - Declarative API, full control over ATS-friendly structure, 13k+ dependents
- **Markdown Parsing:** marked 17+ (speed) + gray-matter 4+ (frontmatter) - Battle-tested combination, 21M+ weekly downloads
- **Templating:** Nunjucks 3.2.4 - Template inheritance for theme variations, Jinja2-style syntax, Mozilla-backed
- **Build Tool:** tsup 8.5+ - Zero-config TypeScript bundling, 10-100x faster than Webpack

**Critical Version Requirements:**
- Node.js 20+ required by Commander 14
- Puppeteer downloads ~150MB Chromium (acceptable for CLI tool; users can use puppeteer-core with local Chrome)

**Stack Rationale:**
Browser-based PDF generation is non-negotiable for ATS compatibility. Tools like wkhtmltopdf or PDFKit either lack modern CSS support or require manual layout, producing PDFs with poor text extraction. Puppeteer generates text-layer PDFs that ATS systems can reliably parse.

### From FEATURES.md: Feature Requirements

**Table Stakes (MVP Requirements):**
1. Multi-format output (PDF, HTML, DOCX) - Recruiters expect all three
2. ATS-compatible output - Single-column, standard fonts, parseable text, proper headings
3. Standard CV sections - Contact, Summary, Work Experience, Education, Skills
4. Template system - Minimum 3-5 templates with style variations
5. Consistent date formatting - ISO 8601 input, flexible display
6. Error handling - Clear messages for malformed markdown

**IT Professional Differentiators:**
1. **Skills taxonomy** - Categorized by type (languages, frameworks, databases, cloud, tools)
2. **Project section** - GitHub links, tech stack, role, outcome
3. **Certifications with expiry** - AWS, GCP, Cisco certs require dates
4. **Tech stack per job** - List technologies used in each position
5. **Keyword optimization** - Both acronym AND full form ("Kubernetes (K8s)")

**Must-Have Differentiators (Core Value):**
- iCIMS expert-grade optimization - Standard section headers, single-column, text-based content
- Single-file HTML with embedded CSS - Portable, embeddable via object/iframe tag
- Per-person directory structure - `/people/[name]/cv.md` pattern supports teams

**Anti-Features (Deliberately Avoid):**
- Multi-column layouts (confuse ATS parsers)
- Graphics/icons/skill bars (ATS cannot parse images)
- Headers/footers for contact info (25% of ATS ignore these)
- Tables for layout (break sequential reading order)
- AI/LLM content generation (out of scope)
- Web application UI (CLI only)

**File Format Recommendations:**
- **PDF:** Default for applications (96% parsing accuracy from Google Docs -> PDF)
- **DOCX:** When portal explicitly requests Word (95% parsing accuracy)
- **HTML:** For portfolio embedding only (not for ATS submission)

### From ARCHITECTURE.md: Component Structure

**High-Level Pipeline:**
```
CLI Interface (Commander)
    -> Data Layer (gray-matter + marked + validator)
    -> Template Engine (Nunjucks)
    -> Renderer Layer (PDF/HTML/DOCX in parallel)
    -> Output Layer (filesystem)
```

**Component Boundaries:**

1. **CLI Interface Layer** - Parse commands, validate paths, orchestrate execution. Does NOT process markdown or generate documents.

2. **Data Layer (Parser)** - Extract structured CVData object from markdown. Sub-components:
   - Frontmatter Extractor (gray-matter) - YAML metadata
   - Markdown Parser (marked) - Body content to HTML
   - Schema Validator - Ensures required fields, helpful errors

3. **Template Engine Layer** - Apply design templates to CVData. Sub-components:
   - Template Loader - Discover and cache templates
   - Template Processor (Nunjucks) - Inject data, produce styled HTML
   - Style Processor - Embed CSS for self-contained HTML

4. **Renderer Layer** - Three parallel renderers consuming same intermediate HTML:
   - **HTML Renderer:** Embed CSS in `<style>` tag, single-file output
   - **PDF Renderer:** Puppeteer with `printBackground: true`, Letter/A4 format
   - **DOCX Renderer:** Use docx library (NOT html-to-docx) for full control over structure

5. **Output Layer** - Write files with pattern `{name}_{template}.{format}`

**Critical ATS Architecture Decisions:**
- Single-column template constraint (multi-column breaks ATS parsing)
- Semantic HTML structure (h1 for name, h2 for sections)
- Contact info in main body (not headers/footers)
- Standard fonts only (Arial, Calibri, Times New Roman)
- No tables for layout (CSS/HTML structure for visual layout only)

**Recommended File Structure:**
```
src/
  cli/ - Commands, UI helpers
  parser/ - Frontmatter, markdown, validator
  template/ - Loader, processor
  renderers/ - html.ts, pdf.ts, docx.ts
  output/ - File writing
  types/ - TypeScript interfaces
templates/
  modern/ - template.njk, styles.css, config.json
  ats-optimized/
  minimal/
people/ - [name]/cv.md (user data)
```

### From PITFALLS.md: Critical Risks

**Critical Pitfalls (Must Address Early):**

1. **Missing ToUnicode Map in PDFs** - PDF looks perfect but ATS extracts gibberish when copy-pasting
   - **Prevention:** Test every PDF by copy-pasting to plain text editor, ensure Puppeteer waits for fonts with `document.fonts.ready`
   - **Phase Impact:** Core PDF generation (Phase 1)

2. **Headers/Footers Ignored by ATS** - 25% of ATS fail to read document headers/footers
   - **Prevention:** Place ALL contact info in main body, use headers only for decorative page numbers
   - **Phase Impact:** Template design (Phase 1)

3. **Non-Standard Section Headers** - ATS cannot categorize "My Journey So Far" as work experience
   - **Prevention:** Enforce standard headers (Work Experience, Education, Skills, Summary), template validation
   - **Phase Impact:** Template validation (Phase 2)

4. **Tables/Text Boxes Break Parsing** - ATS skips entire sections or creates parsing loops
   - **Prevention:** Never use tables for layout, single-column CSS/Flexbox only
   - **Phase Impact:** Template design constraints (Phase 1)

5. **Acronym-Only Skills** - ATS filters for "Kubernetes" but resume only says "K8s"
   - **Prevention:** Require both forms in schema ("Kubernetes (K8s)"), document in examples
   - **Phase Impact:** Schema design + documentation (Phase 1)

**High Pitfalls (Address Mid-Development):**

6. **Page Breaks Mid-Content** - Work experience split across pages, headers orphaned
   - **Prevention:** Use `break-inside: avoid` on job entries, test with multi-page content
   - **Phase Impact:** PDF template CSS (Phase 2)

7. **Font Not Embedded** - PDFs look different on different systems
   - **Prevention:** Embed fonts fully in Puppeteer, test on systems without fonts installed
   - **Phase Impact:** PDF generation core (Phase 1-2)

8. **Word Styles Not Used in DOCX** - Document formatted but not using Heading 1/2 styles
   - **Prevention:** Map markdown headings to Word built-in styles explicitly
   - **Phase Impact:** DOCX generation (Phase 2)

**Testing Requirements (Every Build):**
- [ ] PDF copy-paste test (no garbled characters)
- [ ] PDF link clicking (all hyperlinks work)
- [ ] DOCX styles verification (Heading 1/2 in Navigation Pane)
- [ ] Multi-format consistency (same data renders predictably)
- [ ] Multi-page content (page breaks handled gracefully)

---

## Implications for Roadmap

### Suggested Phase Structure

Based on component dependencies and risk mitigation, recommend **4 phases**:

#### Phase 1: Core Pipeline (Foundation)
**Rationale:** Establish ATS-compliant foundation before adding features. Cannot build differentiators on broken ATS parsing.

**Deliverables:**
- TypeScript project setup (Node 20+, tsup build)
- Data schema definition with validation (CVData interfaces, Zod/Joi)
- Markdown parser (gray-matter + marked integration)
- Single ATS-optimized template (modern, single-column, standard headers)
- HTML output with embedded CSS
- PDF output via Puppeteer (with ToUnicode map testing)
- Basic CLI (Commander) for `cv-gen build <name>`

**Features from FEATURES.md:**
- Markdown input parsing (table stakes)
- Multi-format output: HTML + PDF (table stakes, DOCX deferred to Phase 2)
- Single template (table stakes)
- ATS-compatible output (table stakes)
- Contact, Summary, Work Experience, Education, Skills sections (table stakes)

**Pitfalls to Avoid:**
- Missing ToUnicode Map (test copy-paste after every PDF generation)
- Headers/Footers for contact info (enforce in template design)
- Non-standard section headers (validate in schema)
- Tables/text boxes (template constraint)
- Acronym-only skills (document both forms in schema examples)

**Research Flags:** Standard patterns, no additional research needed.

---

#### Phase 2: Multi-Format + DOCX
**Rationale:** DOCX is table stakes but requires different rendering path. Add after HTML/PDF pipeline proven.

**Deliverables:**
- DOCX renderer using docx library (NOT html-to-docx)
- Word styles mapping (Heading 1/2, Normal, List Bullet)
- Multi-format consistency testing
- Page break handling in PDF templates (`break-inside: avoid`)
- Font embedding verification in PDFs

**Features from FEATURES.md:**
- DOCX output (table stakes)
- Per-person directory structure (differentiator)
- Template name in output filename (differentiator)

**Pitfalls to Avoid:**
- Word styles not used (map markdown headings to built-in styles)
- Character escaping in DOCX (test with `<>&"'` characters)
- Page breaks mid-content (implement `break-inside` CSS)
- Font not embedded (Puppeteer font loading)

**Research Flags:** Minimal - DOCX generation patterns well-documented, follow docx library examples.

---

#### Phase 3: IT Professional Features
**Rationale:** With stable multi-format output, extend schema for IT-specific needs. These are differentiators that justify using this tool over generic resume generators.

**Deliverables:**
- Extended schema (projects, certifications, tech stacks)
- Skills taxonomy (categorized by language/framework/database/cloud/tools)
- Second template option (classic or minimal)
- Schema validation with helpful error messages
- CLI commands: `cv-gen validate <name>`, `cv-gen list-templates`

**Features from FEATURES.md:**
- IT-professional data schema (differentiator)
- Project section with tech context (differentiator)
- Certifications section (differentiator)
- Skills taxonomy (differentiator)
- Additional templates (table stakes)

**Pitfalls to Avoid:**
- Skills without context (require structured format with categories)
- Format-specific logic in templates (keep templates format-agnostic)
- Inconsistent date formatting (single formatting function)

**Research Flags:** Minimal - JSON Resume schema provides good reference for IT professional fields.

---

#### Phase 4: Polish + Advanced Features
**Rationale:** Add nice-to-have features after core functionality proven. These enhance usability but aren't blocking.

**Deliverables:**
- Print-optimized CSS (`@media print` rules)
- Template customization (style variables: colors, fonts)
- CLI command: `cv-gen init <name>` (scaffold new CV)
- Word frequency analysis (identify weak bullet points)
- Documentation and examples
- Third template option

**Features from FEATURES.md:**
- Print-optimized CSS (differentiator)
- Git-friendly workflow (differentiator, inherent in markdown)
- Word frequency analysis (differentiator, defer to v2 acceptable)

**Pitfalls to Avoid:**
- Hardcoded content in templates (externalize all visible text)
- Long URLs overflow (use `word-break: break-all`)
- CSS isolation failure with object tag (test embedded HTML)

**Research Flags:** None - standard patterns for all features.

---

### Phase Dependencies

```
Phase 1 (Core Pipeline)
    |
    +---> Establishes: Data schema, template architecture, PDF/HTML renderers
    |
    v
Phase 2 (Multi-Format + DOCX)
    |
    +---> Depends on: Phase 1 schema, template system
    +---> Establishes: DOCX renderer, multi-format consistency
    |
    v
Phase 3 (IT Professional Features)
    |
    +---> Depends on: Phase 2 multi-format output
    +---> Establishes: Extended schema, second template
    |
    v
Phase 4 (Polish + Advanced)
    |
    +---> Depends on: Phase 3 stable feature set
    +---> Establishes: Usability enhancements, documentation
```

### Which Phases Need `/gsd:research-phase`?

**No additional research needed for any phase.** All phases use well-documented patterns:
- Phase 1: Standard markdown parsing, Puppeteer PDF generation (extensive docs)
- Phase 2: docx library has comprehensive examples
- Phase 3: JSON Resume schema provides IT professional field reference
- Phase 4: Standard CSS and CLI patterns

**Caveat:** If ATS testing reveals unexpected parsing failures, may need targeted research on specific ATS vendor quirks. This would be reactive, not planned.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | All libraries verified at latest versions (Puppeteer 24, Commander 14, marked 17, docx 9.5). Puppeteer for PDF is industry standard for HTML-to-PDF with ATS requirements. |
| **Features** | HIGH | Table stakes features well-defined from existing markdown resume tools. IT professional features match JSON Resume schema. ATS requirements verified across 7+ authoritative sources. |
| **Architecture** | HIGH | Component boundaries follow standard CLI tool patterns. Data pipeline (parse -> validate -> template -> render -> output) is straightforward. Multiple reference implementations examined. |
| **Pitfalls** | HIGH | ATS pitfalls sourced from Jobscan, Careerflow, iCIMS documentation. PDF/DOCX technical pitfalls from Puppeteer issues, docx library docs, Stack Overflow common problems. |

### Gaps to Address During Planning

1. **HTML object tag embedding requirement** - PROJECT.md specifies "CSS embedded in object tag." Research shows `<object>` tag does NOT provide CSS isolation and is non-standard for CSS embedding. **Action:** Clarify requirement with stakeholder. Recommend `<iframe>` for isolation or inline `<style>` tag for self-contained HTML.

2. **Template count** - Research recommends 3-5 templates minimum, but no specific template designs identified. **Action:** Define template themes during Phase 1 (e.g., "Modern," "ATS-Optimized," "Minimal"). Consider user research or competitor analysis.

3. **ATS testing methodology** - Copy-paste testing validates text extraction, but doesn't verify actual ATS scoring. **Action:** Document recommended ATS testing tools (Jobscan, Resume Worded) for users to validate output.

4. **International considerations** - Research focused on US ATS systems (iCIMS). EU CVs may require photos, different section standards. **Action:** Phase 4 or v2 feature if needed.

5. **Error message strategy** - Validation errors need helpful guidance. **Action:** During Phase 1 schema validation, write error messages that include fix suggestions and schema examples.

---

## Build Order Implications

### Dependencies Driving Order

1. **Schema must be first** - All components depend on CVData interface and validation schema
2. **Template system after parser** - Templates consume CVData output
3. **Renderers after templates** - All renderers consume intermediate HTML from templates
4. **DOCX parallel to PDF** - Both renderers independent, but DOCX has more edge cases (defer to Phase 2)
5. **CLI last for integration** - Can start early for testing, but full integration requires all renderers complete

### Risk-Driven Order

1. **PDF ToUnicode map testing early** - This is silent failure that breaks ATS. Must validate in Phase 1.
2. **ATS template constraints upfront** - Cannot retrofit single-column after multi-column designs exist. Phase 1 constraint.
3. **Multi-format consistency before features** - Adding IT-specific schema to inconsistent formats creates 3x debugging. Fix in Phase 2.

### Value-Driven Order

1. **HTML + PDF first** - Delivers 80% of value (most users submit PDF, HTML for portfolios)
2. **DOCX second** - Completes multi-format story, required by some portals
3. **IT features third** - Differentiators that justify tool over Pandoc or JSON Resume
4. **Polish last** - Nice-to-have enhancements after proven core

---

## ATS/iCIMS Specific Insights

### iCIMS Parsing Characteristics

From research, iCIMS is "notoriously rigid" compared to Greenhouse or Lever:
- **Exact keyword matching** - Match job description terminology precisely (both "Continuous Integration" and "CI/CD")
- **No formatting forgiveness** - Errors are not tolerated; broken structure fails silently
- **Standard section focus** - Non-standard headers ("My Journey") cause categorization failures
- **Single-column preference** - Multi-column layouts scramble reading order

### ATS Scoring Targets

Research indicates ATS scoring ranges:
- **85+**: Well-optimized, consistently reaches recruiters
- **70-79**: May pass but improvement needed
- **Below 60**: Significant optimization required

**Recommendation:** Tool should target 85+ scores by default through:
1. Standard section headers enforced in schema
2. Single-column template constraint
3. Text-based content (no images/graphics)
4. Both acronym and full form for technical terms
5. Clean hierarchy (H1 for name, H2 for sections)

### File Format Preferences by ATS

From Enhancv testing:
- Google Docs -> PDF: 96% parsing accuracy
- Google Docs -> DOC: 95% parsing accuracy
- MS Office -> DOC: 88% parsing accuracy
- MS Office -> PDF: 85% parsing accuracy

**Implication:** Puppeteer-generated PDFs from HTML should achieve 90%+ parsing accuracy (better than MS Office -> PDF). Document this as a selling point.

---

## Open Questions for Requirements Phase

1. **Template design specifics** - What visual styles for "Modern," "ATS-Optimized," "Minimal" templates? Need mockups or design direction.

2. **CV data examples** - Should `/people/` directory include example CVs? Or just documentation in README?

3. **Output directory default** - Where should generated files be written? `/output/`, `/people/[name]/output/`, or user-specified only?

4. **HTML embedding documentation** - If object tag is required, need to document limitations (no CSS isolation, fallback content needed).

5. **Version numbering** - Should output files include version/date metadata for tracking which version was sent where?

6. **Template contribution** - Should templates be user-extendable? If so, need template validation and documentation.

7. **Multi-page handling** - At what content length should tool warn about 2+ page resume? (Standard guidance: 1 page for <10 years experience, 2 for 10+)

8. **Skills proficiency display** - How to represent proficiency without skill bars? Text labels ("Expert," "Proficient," "Familiar")? Years of experience?

---

## Sources Summary

### Authoritative Sources (HIGH Confidence)

**Stack & Technology:**
- [Commander.js GitHub](https://github.com/tj/commander.js) - v14.0.2 verified
- [Puppeteer GitHub](https://github.com/puppeteer/puppeteer) - v24.x verified
- [docx GitHub](https://github.com/dolanmiu/docx) - v9.5.1 verified
- [Marked GitHub](https://github.com/markedjs/marked) - v17.0.1 verified
- [Node.js Releases](https://nodejs.org/en/about/releases/) - LTS schedule

**ATS & iCIMS:**
- [Jobscan - ATS Formatting Mistakes](https://www.jobscan.co/blog/ats-formatting-mistakes/)
- [Careerflow - ATS Resume Mistakes](https://www.careerflow.ai/blog/ats-resume-mistakes-to-avoid)
- [iCIMS Developer Community](https://developer-community.icims.com/) - Binary file parsing requirements
- [Enhancv - ATS Myths](https://enhancv.com/blog/busting-ats-myths/) - File format testing data

**Architecture Patterns:**
- [markdown-resume (there4)](https://github.com/there4/markdown-resume) - PHP reference
- [markdown-resume-js](https://github.com/c0bra/markdown-resume-js) - Node.js reference
- [JSON Resume Schema](https://jsonresume.org/schema) - Standard CV data structure

**PDF Generation:**
- [RisingStack - Puppeteer PDF](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)
- [Dev.to - Page Break Solutions](https://dev.to/resumemind/htmlcss-to-pdf-how-i-solved-the-page-break-nightmare-mdg)
- [Adobe Community - ToUnicode Issues](https://community.adobe.com/t5/acrobat-discussions/copying-and-pasting-text-in-pdf-turns-to-gibberish/td-p/10194796)

### Ecosystem Research (MEDIUM Confidence)

- [Top PDF Generation Libraries 2025](https://pdfbolt.com/blog/top-nodejs-pdf-generation-libraries)
- [Puppeteer vs Playwright Performance](https://www.skyvern.com/blog/puppeteer-vs-playwright-complete-performance-comparison-2025/)
- [Template Engine Comparison](https://npm-compare.com/ejs,handlebars,nunjucks,pug)
- [Resume Adapter - ATS Optimization Hub](https://www.resumeadapter.com/blog/ats-optimization-hub)
- [Toptal - Tech Resume Keywords](https://www.toptal.com/techresume/career-advice/the-perfect-tech-resume-in-2025-key-trends-ats-keywords-and-formatting-tips)

---

## Ready for Requirements Definition

**Summary written:** /workspace/.planning/research/SUMMARY.md

**Research files synthesized:**
- STACK.md (Node.js 20+, Puppeteer, docx, marked, Nunjucks, Commander, tsup)
- FEATURES.md (Table stakes, IT professional differentiators, anti-features)
- ARCHITECTURE.md (5-layer pipeline, component boundaries, build order)
- PITFALLS.md (8 critical risks, testing checklist, prevention strategies)

**Key recommendations for roadmapper:**
1. **4-phase structure** - Core Pipeline -> Multi-Format -> IT Features -> Polish
2. **No additional research needed** - All patterns well-documented
3. **Phase 1 is ATS-critical** - ToUnicode map testing, template constraints, schema validation
4. **DOCX deferred to Phase 2** - Focus HTML + PDF first for 80% of value

**Confidence level:** HIGH across all areas

**Next step:** Orchestrator can proceed to requirements definition with clear technology choices, feature prioritization, and risk mitigation strategies.
