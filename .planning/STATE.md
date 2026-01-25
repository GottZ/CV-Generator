# Project State: CV Generator

**Last Updated:** 2026-01-25
**Session:** v1.2 PHASE 14 COMPLETE

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.2 Prompts for CV and Template Generation

## Current Position

**Milestone:** v1.2
**Phase:** 14 - AI Foundation (complete)
**Plan:** 03 of 3 complete
**Status:** Phase complete, ready for Phase 15

```
[##                  ] 4% (2/47 requirements)
```

**Last activity:** 2026-01-25 - Completed 14-03 (AI CLI Commands)

## v1.2 Milestone Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 14 | AI Foundation | 2 | Complete (2/2) |
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

v1.2 Phase 14 decisions:
- Use LanguageModel type from AI SDK 6.x (renamed from LanguageModelV1)
- Add nunjucks dependency to cli package for prompt rendering
- State persistence in project-level .cvgen-state.json
- Commander subcommand groups for ai commands
- Prompt export works without API key (AI-02 requirement)

### Open TODOs

- Start Phase 15 (Multi-Stage Workflow)

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Plan Phase 15 (Multi-Stage Workflow)
**Resume command:** `/gsd:discuss-phase 15`

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/ROADMAP.md` - v1.2 phases and success criteria
- `/workspace/.planning/REQUIREMENTS.md` - 47 v1.2 requirements with traceability
- `/workspace/.planning/research/SUMMARY.md` - Stack recommendations and pitfalls
- `/workspace/.planning/phases/14-ai-foundation/14-01-SUMMARY.md` - AI infrastructure summary
- `/workspace/.planning/phases/14-ai-foundation/14-02-SUMMARY.md` - Prompt templates summary
- `/workspace/.planning/phases/14-ai-foundation/14-03-SUMMARY.md` - CLI commands summary

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-25 (completed Phase 14 - AI Foundation)*
