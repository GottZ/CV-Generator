# CV Generator

## What This Is

A CLI tool that generates professional CVs from markdown content files and design templates. IT professionals store their CV data in structured markdown within `/people/[name]/` directories, select a template from `/templates/`, and generate ATS-optimized output in PDF, HTML, and DOCX formats. Built as an open-source portfolio project.

## Core Value

Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

## Requirements

### Validated

- [x] CLI reads markdown CV data from `/people/[name]/` directories — v1.0
- [x] CLI applies design templates from `/templates/` — v1.0
- [x] CLI outputs to `/people/[name]/output/[name]-[template].{pdf,html,docx}` — v1.0
- [x] Templates are ATS-optimized (iCIMS expert-grade scoring) — v1.0
- [x] PDF output for sending/printing — v1.0
- [x] HTML output with embedded CSS (self-contained single file) — v1.0
- [x] DOCX output for recruiters requiring Word format — v1.0
- [x] Data schema designed for IT professionals (work history with tech stacks, projects, certifications, skills taxonomy) — v1.0
- [x] Templates support style variations (colors, fonts, margins) while maintaining ATS parseability — v1.0
- [x] Regeneration overwrites existing output files — v1.0
- [x] Repository includes README.md with getting started guide — v1.0
- [x] Repository includes MIT LICENSE (2026 Jan-Stefan Janetzky (GottZ) https://contact.GottZ.de) — v1.0
- [x] Repository includes .gitignore protecting `/people/` personal data from commits — v1.0

### Active

(None yet — next milestone will define requirements)

### Out of Scope

- Web application UI — CLI is sufficient for v1
- User authentication — local tool, no accounts
- Cloud storage/hosting — local file system only
- Real-time collaboration — single-user workflow
- CV content suggestions/AI writing — user provides content

## Context

**Author:** Jan-Stefan Janetzky (GottZ)
- Contact: https://contact.GottZ.de
- License: MIT 2026

**Distribution:** Public GitHub repository, open source

**Target users:** IT professionals who want:
- Markdown-based CV management (version control friendly)
- Multiple output formats from single source
- ATS-optimized templates that don't sacrifice visual appeal
- Easy customization of styling without touching content

**ATS Considerations (iCIMS):**
- Clean document structure with standard section headings
- Parseable text hierarchy (no text-as-images)
- Standard fonts and consistent formatting
- Proper semantic markup that automated systems can extract
- Avoid multi-column layouts that confuse parsers
- Clear contact information placement

**Current State (v1.0 shipped):**
- 7,045 lines of TypeScript
- Tech stack: Bun, Commander.js, Nunjucks, Puppeteer, docx, Sharp
- 3 templates: Modern, Minimal, Classic
- 4 CLI commands: build, init, validate, list-templates

**Post-build:** Author's personal CV created using the tool.

## Constraints

- **Output formats**: Must support PDF, HTML, and DOCX
- **ATS compliance**: Templates must achieve expert-grade iCIMS scoring
- **Privacy**: `/people/` directory must be gitignored to prevent personal data leaks
- **Simplicity**: CLI tool, no web server or database required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI over web app | KISS principle, reduces complexity | Good |
| Markdown for CV data | Version control friendly, portable, human-readable | Good |
| Per-person subdirectories | Clean organization, supports multiple CVs | Good |
| Template name in output filename | Clear identification of which template generated which file | Good |
| HTML as intermediate for PDF | Puppeteer uses HTML rendering for PDF generation | Good |
| CSS-to-DOCX style extraction | Visual parity across formats | Good |
| Configuration cascade | Flexible styling: template < global < env < frontmatter | Good |
| Standard fonts only | Arial, Helvetica, Times New Roman for ATS compatibility | Good |
| Single-column layouts | Multi-column breaks ATS parsing | Good |

---
*Last updated: 2026-01-23 after v1.0 milestone*
