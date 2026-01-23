# Roadmap: CV Generator

**Created:** 2026-01-22
**Depth:** Comprehensive
**Phases:** 8
**Coverage:** 41/41 v1 requirements mapped

## Overview

This roadmap delivers a CLI tool that generates ATS-optimized CVs from markdown. The phases are structured to build a stable foundation first (schema + parsing), then layer rendering capabilities (HTML, PDF, DOCX), then expand with CLI commands and IT professional features, and finally polish with multiple templates and documentation.

Each phase delivers a verifiable capability. Phase dependencies ensure that foundational components are proven before building on them.

---

## Phase 1: Foundation + Data Schema

**Goal:** Establish Bun monorepo with TypeScript, define CVData schema, and implement markdown parser with multi-language support.

**Dependencies:** None (first phase)

**Requirements:**
- DATA-01: Schema supports contact information (name, email, phone, location, links)
- DATA-02: Schema supports professional summary section
- DATA-03: Schema supports work experience (company, role, dates, location, bullets)
- DATA-04: Schema supports education (institution, degree, field, dates, honors)
- DATA-05: Schema supports skills list with categories (languages, frameworks, databases, cloud, tools)
- DATA-09: Missing sections are skipped silently (no empty sections, no errors)
- DATA-10: Unknown sections trigger warning but generation continues without them
- REPO-02: MIT LICENSE (2026 Jan-Stefan Janetzky (GottZ) https://contact.GottZ.de)
- REPO-03: .gitignore protects `/people/` directory from commits

**Success Criteria:**
1. TypeScript project compiles and runs with `bun run typecheck`
2. CVData interface validates sample markdown with all basic sections (contact, summary, work, education, skills)
3. Parser extracts structured data from markdown frontmatter and body
4. Missing sections in input produce no errors and no empty sections in output
5. LICENSE and .gitignore files exist and protect personal data

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffolding (monorepo, TypeScript, Biome, LICENSE, .gitignore)
- [x] 01-02-PLAN.md — CVData schema (TypeScript interfaces for all sections)
- [x] 01-03-PLAN.md — Markdown parser (frontmatter + section extraction with language tags)

---

## Phase 2: Template Engine

**Goal:** Users can apply design templates to parsed CV data, producing intermediate HTML.

**Dependencies:** Phase 1 (requires CVData schema and parser)

**Requirements:**
- TMPL-01: Templates use single-column ATS-compliant layout
- TMPL-02: Templates use standard section headers (Work Experience, Education, Skills, etc.)
- TMPL-03: Templates use standard fonts only (Arial, Calibri, Times New Roman)
- TMPL-06: Templates stored in `/templates/` directory with config.json per template
- ATS-02: All contact info in main body (not headers/footers)
- ATS-03: No tables used for layout (CSS/flexbox only)
- ATS-05: Semantic HTML structure (h1 for name, h2 for sections)

**Success Criteria:**
1. Template loader discovers templates from `/templates/` directory
2. Nunjucks renders CVData into styled HTML with semantic structure
3. Rendered HTML uses single-column layout with CSS/flexbox (no tables)
4. Contact information appears in document body, not headers/footers
5. Output HTML uses h1 for name, h2 for section headers

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Package scaffolding (@gottz/cv-templates, types, i18n)
- [x] 02-02-PLAN.md — Base template files (template.njk, styles.css, config.json)
- [x] 02-03-PLAN.md — Engine core (Nunjucks environment, filters, renderCV function)

---

## Phase 3: HTML Output

**Goal:** Users can generate self-contained HTML files with fully embedded CSS and images.

**Dependencies:** Phase 2 (requires template engine producing HTML)

**Requirements:**
- OUT-02: CLI generates HTML output with fully embedded CSS (self-contained single file)
- OUT-04: Output files named `{name}_{template}.{format}` (e.g., `johndoe_modern.pdf`)
- OUT-05: Regeneration overwrites existing output files
- OUT-06: Output written to `/people/[name]/output/` directory
- OUT-08: HTML output base64 encodes images for self-contained file
- DATA-11: Images stored in `/people/[name]/images/` directory
- DATA-12: Standard markdown image syntax supported (`![alt](./images/file.png)`)
- ATS-06: Warning printed when images are included (ATS cannot parse image content)

**Success Criteria:**
1. User can run build command and receive single HTML file with all CSS inlined
2. Output file follows naming convention: `{name}_{template}.html`
3. Images are base64 encoded within the HTML (no external dependencies)
4. Running build twice overwrites previous output without prompting
5. Warning is displayed when images are included in the CV

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — CLI scaffold (dependencies, console utilities, Commander.js entry point)
- [x] 03-02-PLAN.md — Image processing (Sharp-based processing, base64 encoding, HTML embedding)
- [x] 03-03-PLAN.md — Build command (CV parsing, rendering, output writing, watch mode)

---

## Phase 4: PDF Output

**Goal:** Users can generate ATS-optimized PDF files with proper text layers for parsing.

**Dependencies:** Phase 3 (requires HTML output as intermediate format for Puppeteer)

**Requirements:**
- OUT-01: CLI generates PDF output via Puppeteer with ATS-optimized text layers
- OUT-07: PDF and DOCX include configurable header/footer for page identification (e.g., "Name - Page X of Y")
- OUT-09: PDF output embeds images properly
- ATS-01: PDF text layers are copy-paste verifiable (no garbled characters)

**Success Criteria:**
1. User can generate PDF that opens in any PDF reader
2. Copy-pasting text from PDF produces correct characters (no garbled text)
3. PDF includes configurable header/footer with name and page numbers
4. Images in CV render correctly in PDF output

**Plans:** 3 plans

Plans:
- [x] 04-01-PLAN.md — Puppeteer PDF core (browser manager, PDF generator, ATS-safe print CSS)
- [x] 04-02-PLAN.md — PDF metadata and bookmarks (pdf-lib metadata, outline-pdf bookmarks)
- [x] 04-03-PLAN.md — Build command integration (PDF format support, retry logic, skip flags)

---

## Phase 5: DOCX Output

**Goal:** Users can generate Word documents with proper styles that ATS systems can parse.

**Dependencies:** Phase 4 (parallel to PDF, but scheduled after to ensure HTML foundation is solid)

**Requirements:**
- OUT-03: CLI generates DOCX output with proper Word styles (Heading 1/2, Normal)
- OUT-10: DOCX output embeds images properly

**Success Criteria:**
1. User can generate DOCX that opens in Microsoft Word and LibreOffice
2. Document uses Word built-in styles (Heading 1 for name, Heading 2 for sections)
3. Navigation Pane in Word shows document structure from headings
4. Images in CV render correctly in DOCX output

**Plans:** 5 plans (3 core + 2 gap closure)

Plans:
- [x] 05-01-PLAN.md — DOCX generator core (docx library, footer with Word field codes, document metadata)
- [x] 05-02-PLAN.md — Section content and images (all CV sections, HeadingLevel styles, ImageRun embedding)
- [x] 05-03-PLAN.md — Build command integration (DOCX format support, --no-docx flag)
- [x] 05-04-PLAN.md — [GAP] CSS style extraction for visual parity (extract template styles, apply to DOCX)
- [x] 05-05-PLAN.md — [GAP] Linebreak handling investigation (test suite, TextRun breaks, edge cases)

---

## Phase 6: CLI Commands

**Goal:** Users have a complete CLI interface with commands for building, validating, and exploring templates.

**Dependencies:** Phase 5 (requires all output formats for build command)

**Requirements:**
- CLI-01: `build` command generates all formats for specified person and template
- CLI-02: `init` command scaffolds new CV directory with example markdown
- CLI-03: `validate` command checks markdown against schema without generating
- CLI-04: `list-templates` command shows available templates
- CLI-05: Clear error messages for malformed markdown input
- CLI-06: Helpful validation errors with fix suggestions

**Success Criteria:**
1. `cv-gen build johndoe modern` generates PDF, HTML, and DOCX in output directory
2. `cv-gen init newperson` creates `/people/newperson/` with example cv.md
3. `cv-gen validate johndoe` reports schema errors without generating files
4. `cv-gen list-templates` displays available templates with descriptions
5. Malformed markdown produces actionable error messages with fix suggestions

**Plans:** 4 plans

Plans:
- [x] 06-01-PLAN.md — Spinner and prompt utilities (ora, cli-table3, TTY-aware helpers)
- [x] 06-02-PLAN.md — Init command (scaffolder, placeholder photo, example markdown)
- [x] 06-03-PLAN.md — Validate and list-templates commands (stats, table formatting, fuzzy matching)
- [x] 06-04-PLAN.md — Build command enhancement (spinner integration, dry-run, auto-template)

---

## Phase 7: IT Professional Features

**Goal:** Users can document IT-specific CV elements: projects, certifications, and tech stacks per job.

**Dependencies:** Phase 6 (requires working CLI and all output formats)

**Requirements:**
- DATA-06: Schema supports projects section (name, description, tech stack, GitHub link, outcome)
- DATA-07: Schema supports certifications (name, issuer, date, expiry date)
- DATA-08: Schema supports tech stack per job position
- ATS-04: Skills include both acronym and full form where applicable (e.g., "Kubernetes (K8s)")

**Success Criteria:**
1. User can add projects section with tech stack and links that renders in all formats
2. User can add certifications with expiry dates that render in all formats
3. User can specify technologies used per job position
4. Skills section supports acronym pattern (e.g., "Kubernetes (K8s)")
5. All new sections are optional (existing CVs without them still work)

**Plans:** 4 plans

Plans:
- [x] 07-01-PLAN.md — Schema and parser for Projects and Certifications
- [x] 07-02-PLAN.md — Tech stack per job and skills acronym handling
- [x] 07-03-PLAN.md — HTML template rendering for new sections
- [x] 07-04-PLAN.md — DOCX section builders for Projects and Certifications

---

## Phase 8: Multi-Template + Polish

**Goal:** Users can choose from multiple template themes and customize styling while maintaining ATS compliance.

**Dependencies:** Phase 7 (requires complete feature set)

**Requirements:**
- TMPL-04: Three template themes available: Modern, Minimal, Classic
- TMPL-05: Templates support style variations (colors, fonts, margins) via configuration
- REPO-01: README.md with installation and getting started guide

**Success Criteria:**
1. User can select from three distinct templates: Modern, Minimal, Classic
2. Each template has config.json with customizable colors, fonts, and margins
3. README.md documents installation, usage examples, and template customization
4. All templates maintain ATS compliance (single-column, standard fonts, semantic structure)

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation + Data Schema | 9 | Complete |
| 2 | Template Engine | 7 | Complete |
| 3 | HTML Output | 8 | Complete |
| 4 | PDF Output | 4 | Complete |
| 5 | DOCX Output | 2 | Complete |
| 6 | CLI Commands | 6 | Complete |
| 7 | IT Professional Features | 4 | Complete |
| 8 | Multi-Template + Polish | 3 | Pending |

**Total:** 43 requirement mappings (some requirements support multiple phases through shared infrastructure)

---

## Dependency Graph

```
Phase 1: Foundation + Data Schema
    |
    v
Phase 2: Template Engine
    |
    v
Phase 3: HTML Output
    |
    v
Phase 4: PDF Output
    |
    v
Phase 5: DOCX Output
    |
    v
Phase 6: CLI Commands
    |
    v
Phase 7: IT Professional Features
    |
    v
Phase 8: Multi-Template + Polish
```

All phases are sequential. Each phase builds on the previous phase's foundation.

---

*Last updated: 2026-01-23 (Phase 7 complete)*
