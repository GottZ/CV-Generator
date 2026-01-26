# Project State: CV Generator

**Last Updated:** 2026-01-26
**Session:** v1.2 PHASE 17 COMPLETE

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.2 Prompts for CV and Template Generation

## Current Position

**Milestone:** v1.2
**Phase:** 17 - AI User Control (complete)
**Plan:** 05 of 5 complete
**Status:** Phase complete

```
[################    ] 36% (17/47 requirements)
```

**Last activity:** 2026-01-26 - Completed 17-05-PLAN.md (Review Integration)

## v1.2 Milestone Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 14 | AI Foundation | 2 | Complete (2/2) |
| 15 | Multi-Stage Workflow | 6 | Complete (6/6) |
| 16 | AI Content Generation | 5 | Complete (5/5) |
| 17 | AI User Control | 4 | Complete (4/4) |
| 18 | Wizard Foundation | 14 | Pending |
| 19 | Wizard Non-Interactive & Integration | 6 | Pending |
| 20 | Template Scaffolding | 9 | Pending |

**Critical path:** 14 -> 15 -> 16 -> 17 (COMPLETE)
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

v1.2 Phase 16 decisions (16-05):
- LLM for keyword extraction from natural language job postings
- match_mode option in prompt template for fuzzy vs exact matching
- KeywordsOutputSchema with byCategory (required/preferred) and bySection grouping
- highCoverage boolean flag for >90% celebration mode

v1.2 Phase 16 decisions (16-04):
- renderRawPrompt for standalone generators with arbitrary context
- Reuse SummarizeOutputSchema for summary generator consistency
- Distinct 'summary' command from 'summarize' workflow stage

v1.2 Phase 16 decisions (16-06):
- Priority-based grouping for improvements (High/Medium/Low)
- Weakness type categorization (lacks_quantification, missing_outcome, too_generic, passive_voice)
- Enhance existing improve command with diff display rather than separate command
- Use displayComparison from 16-02 for terminal-width-adaptive diff display

v1.2 Phase 17 decisions (17-01):
- Use lowercase keys for expand prompt (y/n for accept/skip all instead of A/S) - API constraint
- @inquirer/prompts expand for git-add-p style single-key interaction
- Jaccard word-level similarity for regeneration deduplication
- Four weakness categories: lacks_quantification, missing_outcome, too_generic, passive_voice

v1.2 Phase 17 decisions (17-02):
- external-editor handles $VISUAL/$EDITOR/vi fallback automatically
- Word-level Jaccard similarity with 0.8 threshold for similarity warning
- Temperature starts at 0.7, bumps 0.1 per attempt, capped at 1.0
- REGENERATE_SIGNAL constant for signaling regeneration from history

v1.2 Phase 17 decisions (17-03):
- Default confirmation is false (safe default per CONTEXT.md)
- Timestamped backup when .bak already exists prevents overwrite
- TTY check exits with helpful alternatives rather than crashing
- Force bypass option for ensureInteractiveMode in testing

v1.2 Phase 17 decisions (17-04):
- getItemAt helper for type-safe array access with noUncheckedIndexedAccess
- Regenerated suggestions stored in separate Map, not mutating original items

v1.2 Phase 17 decisions (17-05):
- CV updater sorts replacements by length (longest first) to avoid partial matches
- Only first occurrence replaced for duplicate safety
- generateFn captures provider and locale in closure for regeneration

### Open TODOs

- Begin Phase 18 (Wizard Foundation)

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Phase 17 complete
**Resume command:** Begin Phase 18 planning

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
- `/workspace/.planning/phases/16-ai-content-generation/16-04-SUMMARY.md` - Summary Generation Command summary
- `/workspace/.planning/phases/16-ai-content-generation/16-05-SUMMARY.md` - Keywords Analysis Command summary
- `/workspace/.planning/phases/16-ai-content-generation/16-06-SUMMARY.md` - Standalone Improve Generator summary
- `/workspace/.planning/phases/16-ai-content-generation/16-07-SUMMARY.md` - Standalone Tailor Generator summary
- `/workspace/.planning/phases/17-ai-user-control/17-01-SUMMARY.md` - Review Prompt Infrastructure summary
- `/workspace/.planning/phases/17-ai-user-control/17-02-SUMMARY.md` - Editor Integration and Regeneration summary
- `/workspace/.planning/phases/17-ai-user-control/17-03-SUMMARY.md` - File Writer and TTY Detection summary
- `/workspace/.planning/phases/17-ai-user-control/17-04-SUMMARY.md` - Review Session Orchestrator summary
- `/workspace/.planning/phases/17-ai-user-control/17-05-SUMMARY.md` - Review Integration summary

---

*State initialized: 2026-01-22*
*Last updated: 2026-01-26 (completed 17-05 Review Integration - Phase 17 complete)*
