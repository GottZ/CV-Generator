# Project Milestones: CV Generator

## v1.1 Improved PDF Creation (Shipped: 2026-01-25)

**Delivered:** Better PDF pagination, HTML print parity, and comprehensive automated testing for PDF output quality.

**Phases completed:** 9-13 (16 plans total)

**Key accomplishments:**

- Eliminated pagination problems (orphaned headers, split entries, widow lines) via CSS fragmentation
- Achieved HTML print parity - browser Ctrl+P matches CLI-generated PDFs across all 3 templates
- Consolidated print CSS into single source of truth (removed 278 lines of duplication)
- Implemented two-pass PDF generation to eliminate sparse last pages
- Built comprehensive test suite: 69 automated tests (visual regression, text extraction, structural, parity)
- Created Docker CI infrastructure for consistent font rendering and reproducible tests

**Stats:**

- 90 files changed
- +11,543 net lines of code
- 5 phases, 16 plans, 20 requirements
- 3 days (2026-01-23 → 2026-01-25)

**Git range:** Phase 9 → Phase 13

**Archive:** [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) | [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md)

---

## v1.0 MVP (Shipped: 2026-01-23)

**Delivered:** A CLI tool that generates professional, ATS-optimized CVs from markdown in PDF, HTML, and DOCX formats with multiple template themes.

**Phases completed:** 1-8 (33 plans total)

**Key accomplishments:**

- Markdown CV parser with multi-language support (EN/DE), YAML frontmatter, and automatic section normalization
- Triple output format pipeline (HTML → PDF → DOCX) with ATS-compliant styling, metadata, and bookmarks
- Professional CLI with build, init, validate, list-templates commands, spinner progress, and fuzzy matching
- IT professional features: projects, certifications, tech stacks per job, clickable links
- Three template themes: Modern, Minimal, Classic with configuration cascade
- ATS optimization: copy-paste verifiable PDF text, semantic structure, single-column layouts

**Stats:**

- 78 source files created
- 7,045 lines of TypeScript
- 8 phases, 33 plans, 41 requirements
- 2 days from start to ship (2026-01-22 → 2026-01-23)

**Git range:** `feat(01-01)` → `feat(08-08)`

**What's next:** v1.1 enhancements (batch generation, watch mode, custom sections)

---
