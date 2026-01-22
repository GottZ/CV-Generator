# Project State: CV Generator

**Last Updated:** 2026-01-22
**Session:** Phase 2 complete

## Project Reference

**Core Value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current Focus:** Phase 3 - HTML Output (Phase 2 complete)

## Current Position

**Phase:** 2 of 8 - Template Engine (COMPLETE)
**Plan:** 3 of 3 complete
**Status:** Phase complete
**Last activity:** 2026-01-22 - Completed 02-03-PLAN.md (template rendering)

**Progress:**
```
Phase 1: [██████████] 100% - Foundation + Data Schema (3/3 plans) COMPLETE
Phase 2: [██████████] 100% - Template Engine (3/3 plans) COMPLETE
Phase 3: [..........] 0% - HTML Output
Phase 4: [..........] 0% - PDF Output
Phase 5: [..........] 0% - DOCX Output
Phase 6: [..........] 0% - CLI Commands
Phase 7: [..........] 0% - IT Professional Features
Phase 8: [..........] 0% - Multi-Template + Polish
```

**Overall:** 2/8 phases complete (6/~24 plans complete, ~25%)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Created | 6 |
| Plans Completed | 6 |
| Requirements Delivered | 16/41 (DATA-*, REPO-02, REPO-03, TMPL-01-03, TMPL-06, ATS-02, ATS-03, ATS-05) |
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

### Technical Context

**Stack (from research + implementation):**
- Runtime: Bun with TypeScript 5.9.3
- CLI: Commander.js 14+ (planned)
- PDF: Puppeteer 24+ (planned)
- DOCX: docx 9.5+ (planned)
- Markdown: marked 17+ with gray-matter 4+
- Templates: Nunjucks 3.2.4 (installed)
- Dates: dayjs 1.11.13 (installed)
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

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | fix Biome version references in research docs (1.9.4 -> 2.3.11) | 2026-01-22 | 6b6bc5d | [001-fix-biome-version-references-in-research-docs](./quick/001-fix-biome-version-references-in-research-docs/) |
| 002 | set up pre-commit hook for Biome linting | 2026-01-22 | (local) | [002-ensure-linting-is-done-appropriately-pri](./quick/002-ensure-linting-is-done-appropriately-pri/) |

## Session Continuity

### For Next Session

**Immediate next step:** Plan Phase 3 (HTML Output) with `/gsd:plan-phase 3`.

**Context to remember:**
- Phase 1 complete: monorepo, schema, parser all working
- Phase 2 complete: templates package with engine, filters, renderCV
- renderCV(cv, options, templatesDir) produces HTML from CVData
- Custom filters available: formatDate, md, mdBlock, sectionHeader
- Base template tested and working
- Ready for HTML file output (Phase 3) and PDF generation (Phase 4)

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

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-22 (02-03-PLAN.md complete, Phase 2 complete)*
