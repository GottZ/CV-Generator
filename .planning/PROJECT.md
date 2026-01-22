# CV Generator

## What This Is

A CLI tool that generates professional CVs from markdown content files and design templates. IT professionals store their CV data in structured markdown within `/people/[name]/` directories, select a template from `/templates/`, and generate ATS-optimized output in PDF, HTML, and DOCX formats. Built as an open-source portfolio project.

## Core Value

Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] CLI reads markdown CV data from `/people/[name]/` directories
- [ ] CLI applies design templates from `/templates/`
- [ ] CLI outputs to `/people/[name]/output/[name]-[template].{pdf,html,docx}`
- [ ] Templates are ATS-optimized (iCIMS expert-grade scoring)
- [ ] PDF output for sending/printing
- [ ] HTML output with embedded CSS in `<object>` tag for style isolation
- [ ] DOCX output for recruiters requiring Word format
- [ ] Data schema designed for IT professionals (work history with tech stacks, projects, certifications, skills taxonomy)
- [ ] Templates support style variations (colors, fonts, margins) while maintaining ATS parseability
- [ ] Regeneration overwrites existing output files
- [ ] Repository includes README.md with getting started guide
- [ ] Repository includes MIT LICENSE (2026 Jan-Stefan Janetzky (GottZ) https://contact.GottZ.de)
- [ ] Repository includes .gitignore protecting `/people/` personal data from commits

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

**Post-build:** After tool completion, create author's personal CV using the tool.

## Constraints

- **Output formats**: Must support PDF, HTML (with `<object>` wrapper), and DOCX
- **ATS compliance**: Templates must achieve expert-grade iCIMS scoring
- **Privacy**: `/people/` directory must be gitignored to prevent personal data leaks
- **Simplicity**: CLI tool, no web server or database required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI over web app | KISS principle, reduces complexity | — Pending |
| Markdown for CV data | Version control friendly, portable, human-readable | — Pending |
| Per-person subdirectories | Clean organization, supports multiple CVs | — Pending |
| Template name in output filename | Clear identification of which template generated which file | — Pending |
| `<object>` wrapper for HTML | Style isolation when embedding in existing pages | — Pending |

---
*Last updated: 2026-01-22 after initialization*
