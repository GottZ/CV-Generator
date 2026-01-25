# Project State: CV Generator

**Last Updated:** 2026-01-25
**Session:** v1.2 ROADMAP CREATED

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.2 Prompts for CV and Template Generation

## Current Position

**Milestone:** v1.2
**Phase:** 14 - AI Foundation (not started)
**Plan:** Not started
**Status:** Roadmap complete, ready for phase planning

```
[                    ] 0% (0/47 requirements)
```

**Last activity:** 2026-01-25 - Roadmap created with 7 phases (14-20)

## v1.2 Milestone Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 14 | AI Foundation | 2 | Pending |
| 15 | Multi-Stage Workflow | 6 | Pending |
| 16 | AI Content Generation | 5 | Pending |
| 17 | AI User Control | 4 | Pending |
| 18 | Wizard Foundation | 14 | Pending |
| 19 | Wizard Non-Interactive & Integration | 6 | Pending |
| 20 | Template Scaffolding | 9 | Pending |

**Critical path:** 14 -> 15 -> 16 -> 17
**Parallel track:** 14 -> 18 -> 19/20

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
- New subcommands (cvgen ai, cvgen wizard) over flags
- Support API keys, local models, AND prompt export fallback
- Minimal new dependencies (~430KB for AI + wizard stack)
- Provider abstraction FIRST (critical pitfall prevention)

v1.2 architecture decisions (from research):
- Vercel AI SDK for multi-provider abstraction
- @inquirer/prompts for interactive wizards
- Zod for structured LLM outputs
- Extend existing Nunjucks for prompt templates

### Open TODOs

None - ready for phase planning.

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Plan Phase 14 (AI Foundation)
**Resume command:** `/gsd:plan-phase 14`

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/ROADMAP.md` - v1.2 phases and success criteria
- `/workspace/.planning/REQUIREMENTS.md` - 47 v1.2 requirements with traceability
- `/workspace/.planning/research/SUMMARY.md` - Stack recommendations and pitfalls

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-25 (v1.2 roadmap created)*
