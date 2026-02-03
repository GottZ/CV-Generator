# Project State: CV Generator

**Last Updated:** 2026-01-26
**Session:** v1.2 MILESTONE COMPLETE

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current focus:** v1.2 Prompts for CV and Template Generation

## Current Position

**Milestone:** v1.2
**Phase:** 20 - Template Scaffolding (complete)
**Plan:** 5 of 5 complete
**Status:** Complete — verified ✓

```
[################################] 100% (47/47 requirements)
```

**Last activity:** 2026-02-03 - Completed quick task 015: Fix modern template job-tech-stack border position

## v1.2 Milestone Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 14 | AI Foundation | 2 | Complete (2/2) |
| 15 | Multi-Stage Workflow | 6 | Complete (6/6) |
| 16 | AI Content Generation | 5 | Complete (5/5) |
| 17 | AI User Control | 4 | Complete (4/4) |
| 18 | Wizard Foundation | 13 | Complete (13/13) |
| 19 | Wizard Non-Interactive & Integration | 7 | Complete (7/7) |
| 20 | Template Scaffolding | 9 | Complete (9/9) |

**Critical path:** 14 -> 15 -> 16 -> 17 (COMPLETE)
**Parallel track:** 14 -> 18 -> 19 -> 20 (COMPLETE)

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

v1.2 Phase 18 decisions (18-01):
- SectionStatus 'partial' for incomplete entries (experience with 0 bullets, education missing fields)
- Contact is 'partial' if name exists but no contact details (encourages adding email/phone)
- Unicode menu icons: checkmark U+2713, half-circle U+25D0, circle U+25CB, X U+2717
- Re-prompt validation pattern: warn and continue on second attempt with same invalid value

v1.2 Phase 18 decisions (18-02):
- URL validation accepts various formats, normalizes to https://
- Links preserve existing when user declines to add new ones
- Bullets require minimum 1 with re-prompt on empty
- End date defaults to 'present' for current positions

v1.2 Phase 18 decisions (18-03):
- Education end date required (no 'present' for education)
- Skills entered as comma-separated list for faster input
- Proficiency levels optional and only in detailed mode
- CommonCategoryValue type for type-safe category selection

v1.2 Phase 18 decisions (18-04):
- Project link types predefined: github, demo, npm, docs, website, other
- Certification date earned validation disallows "present" value
- Logo field skipped in wizard - users can add manually to cv.md

v1.2 Phase 18 decisions (18-05):
- Unicode warning symbol for inline validation issues
- Missing section warnings at end of summary (Skills, Experience/Education)
- Certifications section not localized per schema
- generateMarkdown matches scaffolder.ts format exactly

v1.2 Phase 18 decisions (18-06):
- ExitPromptError caught via process.on('uncaughtException') with exit code 130
- runAddSection recursively calls itself when user selects 'edit' after add
- ParseResult uses data field not success field for cv-core compatibility

v1.2 Phase 18 decisions (18-08):
- Locale selection uses predefined common locales with custom option
- Back option uses Unicode left arrow character for visual clarity
- Null return pattern allows parent collectors to skip cancelled entries
- Empty URL provides second escape path from nested prompts

v1.2 Phase 19 decisions (19-01):
- Exit code 2 for validation errors (per CONTEXT.md)
- Progress to stderr, output to stdout (Unix convention)
- JSON mode skips progress messages for clean parsing
- --force-interactive as escape hatch for non-TTY environments

v1.2 Phase 19 decisions (19-04):
- Combined prompt with STAR hints (not separate STAR questions)
- Show 1 example before each bullet prompt, cycling through 3 per role
- Role detection via keyword matching on job title
- 30-char minimum bullet length for quality enforcement

v1.2 Phase 19 decisions (19-02):
- STAR bullets use z.union([z.string(), StarBulletSchema]) for auto-detection
- TTY check in readStdin() prevents process hang on missing input
- JSON Schema uses draft-2020-12 target for modern tooling support
- validateWizardInput() returns typed data or throws structured error

v1.2 Phase 19 decisions (19-03):
- Conflict detection only compares top-level contact fields (name, email, phone, location)
- JSON takes full precedence for arrays/nested data (flags don't support arrays)
- mergeContactFlags allows flags to supplement JSON when no overlap
- Flag builder pattern: buildXFromFlags returns typed object or null if required fields missing

v1.2 Phase 19 decisions (19-05):
- Focus on experience bullets as primary AI enhancement target (other sections deferred)
- Use generateText directly for single bullet improvement (not workflow improve stage)
- Capture provider and context in closure for regeneration support
- tryGetProvider pattern for graceful AI degradation

v1.2 Phase 19 decisions (19-06):
- DryRunResult with valid, wouldWrite, preview, validationErrors for CI/CD feedback
- Auto-accept all AI suggestions in non-interactive mode (per CONTEXT.md)
- Minimum viable validation consistent with interactive wizard
- Graceful AI enhancement degradation (log warning, continue with original)

v1.2 Phase 19 decisions (19-07):
- --help-json flag instead of subcommand for JSON schema display
- SECTION_MAP for CLI section names to AddableSection types
- Enhancement status message when --enhance flag enabled
- Mode detection routes to interactive vs non-interactive runners

v1.2 Phase 20 decisions (20-02):
- Plan 20-01 completed Tasks 1-2 as part of TDD setup (types.ts, constants.ts fully implemented)
- Barrel export pattern for template module: packages/cli/src/template/index.ts
- Include copier and validator exports in barrel for complete module API

v1.2 Phase 20 decisions (20-03):
- Color prompt uses select for presets + input fallback for custom hex
- Font prompts have no custom input - ATS-safe fonts only per RESEARCH.md Pitfall 1
- Margins use named sizes (narrow/normal/wide), cv-templates resolves to mm
- Sections checkbox defaults all optional sections to visible

v1.2 Phase 20 decisions (20-04):
- discoverTemplates already filters private templates, no additional filtering needed
- Confirmation step required before template creation for safe UX
- Section visibility stored in config.sections, not config.style
- Validation warnings shown but don't block template creation

v1.2 Phase 20 decisions (20-05):
- Exit code 130 for Ctrl+C (standard Unix convention)
- Exit code 1 for validation failures
- --json flag for validate command for CI/CD integration
- Default templates-dir is ./templates (relative to cwd)

### Open TODOs

- Run `/gsd:audit-milestone` to verify v1.2 requirements and cross-phase integration

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 006 | Fix modern template empty page and German HTML 'at' suffix bugs | 2026-02-03 | 0a7f5ad | [006-fix-modern-template-empty-page-and-germa](./quick/006-fix-modern-template-empty-page-and-germa/) |
| 007 | Fix German date localization in CV rendering | 2026-02-03 | 1677505 | [007-fix-german-date-localization-in-cv-rende](./quick/007-fix-german-date-localization-in-cv-rende/) |
| 008 | Fix skill bubbles word-break in print CSS | 2026-02-03 | f08a275 | [008-fix-skill-bubbles-word-break-in-print-cs](./quick/008-fix-skill-bubbles-word-break-in-print-cs/) |
| 009 | Add bun run cvgen script to root package.json | 2026-02-03 | bcd1af7 | [009-make-bun-run-cvgen-a-thing](./quick/009-make-bun-run-cvgen-a-thing/) |
| 010 | Document bun run cvgen in README | 2026-02-03 | d3c9709 | [010-extend-readme-for-bun-run-cvgen](./quick/010-extend-readme-for-bun-run-cvgen/) |
| 011 | Fix duplicate certifications entries | 2026-02-03 | 29b7b0c | [011-fix-duplicate-certifications-entries](./quick/011-fix-duplicate-certifications-entries/) |
| 012 | Fix Word document date alignment to same line | 2026-02-03 | 34b3ec9 | [012-fix-word-document-date-alignment-to-same](./quick/012-fix-word-document-date-alignment-to-same/) |
| 012 | Fix DOCX date alignment to same line | 2026-02-03 | 3ac90cc | [012-fix-word-document-date-alignment-to-same](./quick/012-fix-word-document-date-alignment-to-same/) |
| 013 | Rename Summary/Zusammenfassung to Profile/Profil | 2026-02-03 | af42e6b | [013-rename-summary-category-to-profile-in-te](./quick/013-rename-summary-category-to-profile-in-te/) |
| 014 | Add "all" template alias to build command | 2026-02-03 | 1c2014e | [014-add-all-template-alias-to-build-all-temp](./quick/014-add-all-template-alias-to-build-all-temp/) |
| 015 | Fix modern template job-tech-stack border position | 2026-02-03 | 7e9bee5 | [015-fix-modern-theme-horizontal-line-positio](./quick/015-fix-modern-theme-horizontal-line-positio/) |

### Blockers

None.

## Session Continuity

### For Next Session

**Current step:** Milestone v1.2 complete, ready for audit
**Resume command:** `/gsd:audit-milestone`

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
- `/workspace/.planning/phases/18-wizard-foundation/18-01-SUMMARY.md` - Wizard Infrastructure summary
- `/workspace/.planning/phases/18-wizard-foundation/18-02-SUMMARY.md` - Contact and Experience Prompts summary
- `/workspace/.planning/phases/18-wizard-foundation/18-03-SUMMARY.md` - Education and Skills Prompts summary
- `/workspace/.planning/phases/18-wizard-foundation/18-04-SUMMARY.md` - Projects and Certifications Prompts summary
- `/workspace/.planning/phases/18-wizard-foundation/18-05-SUMMARY.md` - Summary and Output summary
- `/workspace/.planning/phases/18-wizard-foundation/18-06-SUMMARY.md` - Runner and CLI Commands summary
- `/workspace/.planning/phases/18-wizard-foundation/18-08-SUMMARY.md` - Gap Closure summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-01-SUMMARY.md` - Non-Interactive Mode Infrastructure summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-02-SUMMARY.md` - Zod Schemas and JSON Input summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-03-SUMMARY.md` - Flag Collector and State Builder summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-04-SUMMARY.md` - STAR Method Prompts summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-05-SUMMARY.md` - AI Enhancement Integration summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-06-SUMMARY.md` - Non-Interactive Runner & Dry-Run summary
- `/workspace/.planning/phases/19-wizard-non-interactive/19-07-SUMMARY.md` - CLI Integration summary
- `/workspace/.planning/phases/20-template-scaffolding/20-01-SUMMARY.md` - TDD Copier and Validator summary
- `/workspace/.planning/phases/20-template-scaffolding/20-02-SUMMARY.md` - Types and Constants summary
- `/workspace/.planning/phases/20-template-scaffolding/20-03-SUMMARY.md` - Template Customization Prompts summary
- `/workspace/.planning/phases/20-template-scaffolding/20-04-SUMMARY.md` - Template Wizard Orchestrator summary
- `/workspace/.planning/phases/20-template-scaffolding/20-05-SUMMARY.md` - CLI Commands Integration summary

---

*State initialized: 2026-01-22*
*Last updated: 2026-02-03 (completed quick task 015 - fix modern template job-tech-stack border position)*
