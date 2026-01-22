# Project State: CV Generator

**Last Updated:** 2026-01-22
**Session:** Phase 4 Plan 02 complete

## Project Reference

**Core Value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current Focus:** Phase 4 - PDF Output (in progress)

## Current Position

**Phase:** 4 of 8 - PDF Output
**Plan:** 2 of 3 complete
**Status:** In progress
**Last activity:** 2026-01-22 - Completed 04-02-PLAN.md (PDF metadata and bookmarks)

**Progress:**
```
Phase 1: [██████████] 100% - Foundation + Data Schema (3/3 plans) COMPLETE
Phase 2: [██████████] 100% - Template Engine (3/3 plans) COMPLETE
Phase 3: [██████████] 100% - HTML Output (3/3 plans) COMPLETE
Phase 4: [██████....] 67% - PDF Output (2/3 plans)
Phase 5: [..........] 0% - DOCX Output
Phase 6: [..........] 0% - CLI Commands
Phase 7: [..........] 0% - IT Professional Features
Phase 8: [..........] 0% - Multi-Template + Polish
```

**Overall:** 3/8 phases complete (11/~24 plans complete, ~46%)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Created | 12 |
| Plans Completed | 11 |
| Requirements Delivered | 24/41 (Phase 1-3 complete, Phase 4 in progress) |
| Blockers Encountered | 0 |
| Blockers Resolved | 0 |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 8-phase structure | Comprehensive depth setting; let natural boundaries stand | 2026-01-22 |
| Sequential phases | Each phase builds on previous foundation | 2026-01-22 |
| HTML before PDF | Puppeteer uses HTML as intermediate format | 2026-01-22 |
| DOCX after PDF | Parallel capability but deferred to ensure HTML foundation | 2026-01-22 |
| Biome v2.3.11 with tabs | Biome v2 has breaking changes from v1; tabs are more accessible | 2026-01-22 |
| Exclude .planning from Biome | Planning docs have different formatting requirements | 2026-01-22 |
| Alphabetical schema exports | Biome organizeImports scrambles semantic comments; clean order preferred | 2026-01-22 |
| gray-matter for frontmatter | Standard library, well-tested YAML parsing | 2026-01-22 |
| EN/DE section normalization | Hardcoded variants to canonical types (summary, experience, education, skills) | 2026-01-22 |
| Entry delimiter --- | Separates multiple entries within a section | 2026-01-22 |
| Standard fonts only | Arial, Helvetica for maximum ATS compatibility (TMPL-03) | 2026-01-22 |
| CSS bullets via ::before | Using pseudo-element on divs instead of ul/li for better ATS parsing | 2026-01-22 |
| Contact in body | Not HTML header/footer per ATS-02 requirement | 2026-01-22 |
| i18n-fallback-chain | Locale fallback to English, then to section key for graceful degradation | 2026-01-22 |
| section-keys | Lowercase canonical keys (summary, experience, education, skills) consistent with parser | 2026-01-22 |
| marked-for-markdown | Use marked library for markdown rendering in filters | 2026-01-22 |
| safestring-bypass | Return SafeString from md filters to bypass autoescape | 2026-01-22 |
| locale-context-flattening | Flatten Localized<T> to T in template context for requested locale | 2026-01-22 |
| bun-types-global | Add @types/bun to root for node: protocol support | 2026-01-22 |
| sharp-for-images | Sharp library for image processing - 4-5x faster than ImageMagick | 2026-01-22 |
| jpeg-to-webp | Convert photos (JPEG) to WebP for smaller size; keep PNG for graphics | 2026-01-22 |
| picocolors-for-terminal | Smallest and fastest terminal color library, zero dependencies | 2026-01-22 |
| tty-aware-output | TTY detection for colored vs plain output per RESEARCH.md Pattern 5 | 2026-01-22 |
| stderr-for-warnings | Warnings go to stderr for clean stdout redirection | 2026-01-22 |
| browser-singleton | Puppeteer browser reuse with connected check for crash recovery | 2026-01-22 |
| pdf-lib-page-count | Use pdf-lib for accurate page count instead of DOM estimation | 2026-01-22 |
| ats-css-injection | Inject ligature-disabling CSS at generation time via page.addStyleTag | 2026-01-22 |
| buffer-pdf-io | Use Buffer for PDF module input/output for consistency with Node.js file APIs | 2026-01-22 |
| page-1-bookmarks | Default all CV section bookmarks to page 1 (typical for 1-2 page CVs) | 2026-01-22 |

### Technical Context

**Stack (from research + implementation):**
- Runtime: Bun with TypeScript 5.9.3
- CLI: Commander.js 12+ (installed)
- PDF: Puppeteer 24.36+ (installed), pdf-lib 1.17+ (installed), @lillallol/outline-pdf 4.0+ (installed)
- DOCX: docx 9.5+ (planned)
- Markdown: marked 17+ with gray-matter 4+
- Templates: Nunjucks 3.2.4 (installed)
- Dates: dayjs 1.11.13 (installed)
- Images: Sharp 0.34+ (installed)
- Terminal: picocolors 1.1+ (installed)
- Linting: Biome 2.3.11

**Schema Structure (implemented):**
- CVData: Main interface with contact, summary, experience, education, skills
- Localized<T>: Wrapper for multi-language content
- ParseResult<T>: Error collection pattern with errors and warnings arrays

**Parser Structure (implemented):**
- parseFrontmatter: Extracts Contact from YAML frontmatter
- extractSections: Parses `## Header \`lang\`` format, normalizes section types
- parseCV: Orchestrates parsing, builds CVData with Localized sections
- SectionMatch: Interface for section metadata (header, type, language, content, line)

**Template Types (implemented):**
- TemplateConfig: Template metadata (name, description, atsCompliant, etc.)
- DiscoveredTemplate: Resolved template with paths
- RenderOptions: Rendering parameters (templateId, locale)
- RenderResult: Output (html, locale, templateId)

**Template Engine (implemented):**
- createTemplateEnvironment(): Configured Nunjucks with FileSystemLoader
- discoverTemplates(): Finds templates in /templates/ directory
- renderCV(): Main entry point for CV-to-HTML rendering
- Custom filters: formatDate, md, mdBlock, sectionHeader

**i18n (implemented):**
- getSectionHeader(section, locale): Localized section headers
- Supported locales: en, de
- Fallback chain: locale -> en -> section key

**CV Format (established):**
- Frontmatter: `name` (required), email, phone, location, links array
- Sections: `## Section Name \`lang\`` with content until next section
- Entries: `### Title at Company`, `*dates | location*`, `- bullets`
- Skills: `### Category` with `- Skill (level)` items

**Template Structure (established):**
- Directory: `/templates/{name}/` with config.json, template.njk, styles.css
- Base template: Usable standalone or as foundation for custom templates
- CSS: Custom properties for typography, colors, spacing
- HTML: Semantic h1/h2/h3 hierarchy, single-column flexbox layout

**Critical ATS Constraints:**
- Single-column layouts only
- Standard fonts (Arial, Calibri, Times New Roman)
- Contact info in body, not headers/footers
- No tables for layout
- Semantic HTML (h1 for name, h2 for sections)
- Text layers must be copy-paste verifiable
- Font ligatures disabled (font-variant-ligatures: none)

**PDF Generation (implemented):**
- browser-manager.ts: Singleton browser lifecycle with getBrowser()/closeBrowser()
- pdf-generator.ts: generatePdf() with FooterConfig, PdfOptions, PdfResult interfaces
- pdf-metadata.ts: setPdfMetadata() with PdfMetadata interface (title, author, subject, creator, keywords)
- pdf-bookmarks.ts: addPdfBookmarks() with SectionInfo, getDefaultSections(locale)
- Configurable footer: enabled/showName/showPageNumbers/template
- i18n page numbers: "Page X of Y" (en) / "Seite X von Y" (de)
- i18n section bookmarks: Experience/Berufserfahrung, Education/Ausbildung, Skills/Kenntnisse
- ATS CSS injection: Disables ligatures, hides theme toggle, controls page breaks

### Open TODOs

- [x] Plan Phase 1 with `/gsd:plan-phase 1`
- [x] Execute 01-01-PLAN.md (monorepo setup)
- [x] Execute 01-02-PLAN.md (TypeScript interfaces)
- [x] Execute 01-03-PLAN.md (Markdown parser)
- [x] Plan Phase 2 with `/gsd:plan-phase 2`
- [x] Execute 02-01-PLAN.md (package scaffold and types)
- [x] Execute 02-02-PLAN.md (base template files)
- [x] Execute 02-03-PLAN.md (template rendering)
- [ ] Plan Phase 3 with `/gsd:plan-phase 3`
- [ ] Clarify HTML object tag embedding requirement (research flagged this as non-standard)
- [ ] Define specific template visual styles (Modern, Minimal, Classic)

### Blockers

None currently.

### Learnings

- gray-matter ships its own TypeScript types; no @types/gray-matter needed
- Biome v2 moved organizeImports to assist.actions.source.organizeImports
- Bun lockfile is bun.lock (not bun.lockb)
- Biome organizeImports rule reorders exports alphabetically, scrambling semantic comments
- TypeScript strict mode requires nullish coalescing for array access and regex match groups
- nunjucks requires @types/nunjucks for TypeScript support
- marked.parseInline() avoids <p> wrapping for inline markdown
- @types/bun includes Node.js types for Bun runtime
- Puppeteer page.evaluate callbacks need DOM types; use pdf-lib for page count instead
- Browser singleton needs browser?.connected check for crash recovery

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | fix Biome version references in research docs (1.9.4 -> 2.3.11) | 2026-01-22 | 6b6bc5d | [001-fix-biome-version-references-in-research-docs](./quick/001-fix-biome-version-references-in-research-docs/) |
| 002 | set up pre-commit hook for Biome linting | 2026-01-22 | (local) | [002-ensure-linting-is-done-appropriately-pri](./quick/002-ensure-linting-is-done-appropriately-pri/) |
| 003 | fix dark theme background and clean up playwright dependency | 2026-01-22 | 2eeec67 | [003-fix-dark-theme-background-and-clean-up-p](./quick/003-fix-dark-theme-background-and-clean-up-p/) |
| 004 | add light/dark/system theme toggle to HTML output | 2026-01-22 | 3d8641a | [004-add-light-dark-system-color-toggle-to-ht](./quick/004-add-light-dark-system-color-toggle-to-ht/) |
| 005 | fix system dark mode CSS differences from explicit dark mode | 2026-01-22 | bc5d0e9 | [005-fix-system-dark-mode-css-differences-fro](./quick/005-fix-system-dark-mode-css-differences-fro/) |

## Session Continuity

### For Next Session

**Immediate next step:** Execute 04-03-PLAN.md (integrate PDF into build command).

**Context to remember:**
- Phases 1-3 complete: monorepo, schema, parser, templates, HTML output all working
- Build command: `cvgen build <name> <template>` generates HTML files
- HTML files are self-contained with embedded CSS and base64 images
- Watch mode with debounced rebuilds functional
- JSON output mode for CI integration
- PDF modules complete: browser-manager, pdf-generator, pdf-metadata, pdf-bookmarks
- Next: Integrate PDF generation into build command with buildPdf function

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/REQUIREMENTS.md` - All requirements with traceability
- `/workspace/.planning/ROADMAP.md` - Phase structure and success criteria
- `/workspace/.planning/research/SUMMARY.md` - Technology decisions and pitfalls
- `/workspace/.planning/phases/01-foundation-data-schema/01-01-SUMMARY.md` - Plan 01-01 completion
- `/workspace/.planning/phases/01-foundation-data-schema/01-02-SUMMARY.md` - Plan 01-02 completion
- `/workspace/.planning/phases/01-foundation-data-schema/01-03-SUMMARY.md` - Plan 01-03 completion
- `/workspace/.planning/phases/02-template-engine/02-01-SUMMARY.md` - Plan 02-01 completion
- `/workspace/.planning/phases/02-template-engine/02-02-SUMMARY.md` - Plan 02-02 completion
- `/workspace/.planning/phases/02-template-engine/02-03-SUMMARY.md` - Plan 02-03 completion
- `/workspace/.planning/phases/03-html-output/03-01-SUMMARY.md` - Plan 03-01 completion
- `/workspace/.planning/phases/03-html-output/03-02-SUMMARY.md` - Plan 03-02 completion
- `/workspace/.planning/phases/03-html-output/03-03-SUMMARY.md` - Plan 03-03 completion
- `/workspace/.planning/phases/03-html-output/03-VERIFICATION.md` - Phase 3 verification
- `/workspace/.planning/phases/04-pdf-output/04-01-SUMMARY.md` - Plan 04-01 completion
- `/workspace/.planning/phases/04-pdf-output/04-02-SUMMARY.md` - Plan 04-02 completion

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-22 (Plan 04-02 complete)*
