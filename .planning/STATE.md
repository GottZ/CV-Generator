# Project State: CV Generator

**Last Updated:** 2026-01-25
**Session:** v1.2 MILESTONE STARTED

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.2 Prompts for CV and Template Generation

## Current Position

**Phase:** Not started (defining requirements)
**Status:** Defining requirements
**Last activity:** 2026-01-25 — Milestone v1.2 started

## Shipped Milestones

| Version | Name | Phases | Requirements | Shipped |
|---------|------|--------|--------------|---------|
| v1.1 | Improved PDF Creation | 9-13 | 20/20 | 2026-01-25 |
| v1.0 | MVP | 1-8 | 41/41 | 2026-01-23 |

## Accumulated Context

### Key Decisions

v1.0 decisions:
- CLI over web app (KISS principle)
- HTML as intermediate format for PDF (Puppeteer)
- CSS-to-DOCX style extraction for visual parity
- Configuration cascade (template < global < env < frontmatter)

v1.1 decisions:
- Test infrastructure before CSS changes (baselines needed first)
- Print CSS consolidation before pagination (single source of truth)
- Use both legacy and modern CSS fragmentation properties (Puppeteer compatibility)
- unpdf for text extraction (zero-dependency, Bun-compatible)
- Docker for CI test consistency (font rendering)
- Two-pass PDF generation for sparse last page elimination
- Flexbox-to-block for print (break properties don't work with flexbox)

v1.2 scope decisions:
- AI content generation is top priority
- New subcommands (cv-gen ai, cv-gen wizard) over flags
- Support API keys, local models, AND prompt export fallback
- Minimal new dependencies

### Open TODOs

None - requirements being defined.

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Defining requirements for v1.2
**Resume file:** None

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/ROADMAP.md` - Milestone history
- `/workspace/.planning/MILESTONES.md` - Milestone summaries
- `/workspace/.planning/milestones/v1.1-ROADMAP.md` - v1.1 archive
- `/workspace/.planning/milestones/v1.1-REQUIREMENTS.md` - v1.1 requirements archive

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-25 (v1.2 started)*
