# Project State: CV Generator

**Last Updated:** 2026-01-26
**Session:** v1.2 PHASE 16 IN PROGRESS (16-03 complete)

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.2 Prompts for CV and Template Generation

## Current Position

**Milestone:** v1.2
**Phase:** 16 - AI Content Generation (in progress)
**Plan:** 03 of 7 complete
**Status:** In progress

```
[#######             ] 14% (7/47 requirements)
```

**Last activity:** 2026-01-26 - Completed 16-03 (Bullets Generation Command)

## v1.2 Milestone Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 14 | AI Foundation | 2 | Complete (2/2) |
| 15 | Multi-Stage Workflow | 6 | Complete (6/6) |
| 16 | AI Content Generation | 5 | In progress (3/5) |
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

v1.2 Phase 15 decisions (15-01):
- Zod 4.3.6 for structured LLM outputs (14x faster than Zod 3)
- Discriminated union state machine vs XState (right-sized for 4-stage linear workflow)
- Per-person workflow state at `/people/[name]/output/.ai-state.json`
- Atomic writes using temp file + rename pattern
- Version field in state for future schema migration

v1.2 Phase 15 decisions (15-02):
- Type annotations for uninitialized variables (CVLoadResult, AIProvider)
- String type for provider option in StageRunnerOptions (cast at call site)
- Double prerequisite checking in improve (checkStagePrerequisites + explicit state check)

v1.2 Phase 15 decisions (15-03):
- Summarize requires only analyze (improve is optional context)
- Color-coded match score in tailor output (green >75%, yellow >50%, red below)
- Commander requiredOption for --job enforcement with helpful error messages

v1.2 Phase 15 decisions (15-04):
- Terminal table via cli-table3 for consistent status display
- Case-insensitive section matching for better UX
- Three output formats (terminal, JSON, markdown) for flexibility
- Verbose mode shows full stage history

v1.2 Phase 16 decisions (16-01):
- Exponential backoff formula: baseDelay * 2^(attempt-1) capped at maxDelay
- Dynamic unpdf import to avoid bundling issues
- Simple regex HTML extraction sufficient for job postings
- STAR breakdown as markdown comments (hidden by default)

v1.2 Phase 16 decisions (16-02):
- Terminal width threshold: 120 columns for side-by-side vs inline diff
- Fuse.js threshold: 0.3 for fuzzy keyword matching
- Synonym mappings hardcoded for common tech abbreviations (JS, TS, K8s, ML)
- Biome-ignore for ANSI regex control characters

v1.2 Phase 16 decisions (16-03):
- Standalone generator pattern (not part of workflow state)
- BulletsOutputSchema with STAR breakdown, quality levels, and metrics
- Bullet count reasoning for transparency on 3-8 bullet range
- renderPrompt for bullets (uses standard PromptContext with options)

### Open TODOs

- Continue Phase 16 (AI Content Generation) - 16-04 next

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Phase 16 plan 03 complete, continue with 16-04
**Resume command:** `/gsd:execute-plan .planning/phases/16-ai-content-generation/16-04-PLAN.md`

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/ROADMAP.md` - v1.2 phases and success criteria
- `/workspace/.planning/REQUIREMENTS.md` - 47 v1.2 requirements with traceability
- `/workspace/.planning/research/SUMMARY.md` - Stack recommendations and pitfalls
- `/workspace/.planning/phases/14-ai-foundation/14-01-SUMMARY.md` - AI infrastructure summary
- `/workspace/.planning/phases/14-ai-foundation/14-02-SUMMARY.md` - Prompt templates summary
- `/workspace/.planning/phases/14-ai-foundation/14-03-SUMMARY.md` - CLI commands summary
- `/workspace/.planning/phases/15-multi-stage-workflow/15-01-SUMMARY.md` - Workflow foundation summary
- `/workspace/.planning/phases/15-multi-stage-workflow/15-02-SUMMARY.md` - Stage commands summary
- `/workspace/.planning/phases/15-multi-stage-workflow/15-03-SUMMARY.md` - Summarize/Tailor stages summary
- `/workspace/.planning/phases/15-multi-stage-workflow/15-04-SUMMARY.md` - Status/Context commands summary
- `/workspace/.planning/phases/16-ai-content-generation/16-01-SUMMARY.md` - Core Utility Infrastructure summary
- `/workspace/.planning/phases/16-ai-content-generation/16-02-SUMMARY.md` - Display Utilities and Keyword Matcher summary
- `/workspace/.planning/phases/16-ai-content-generation/16-03-SUMMARY.md` - Bullets Generation Command summary

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-26 (completed 16-03 Bullets Generation Command)*
