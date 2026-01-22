# Project State: CV Generator

**Last Updated:** 2026-01-22
**Session:** Initial roadmap creation

## Project Reference

**Core Value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

**Current Focus:** Phase 1 - Foundation + Data Schema

## Current Position

**Phase:** 1 of 8 - Foundation + Data Schema
**Plan:** Not yet created
**Status:** Awaiting phase planning

**Progress:**
```
Phase 1: [..........] 0% - Foundation + Data Schema
Phase 2: [..........] 0% - Template Engine
Phase 3: [..........] 0% - HTML Output
Phase 4: [..........] 0% - PDF Output
Phase 5: [..........] 0% - DOCX Output
Phase 6: [..........] 0% - CLI Commands
Phase 7: [..........] 0% - IT Professional Features
Phase 8: [..........] 0% - Multi-Template + Polish
```

**Overall:** 0/8 phases complete (0%)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Created | 0 |
| Plans Completed | 0 |
| Requirements Delivered | 0/41 |
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

### Technical Context

**Stack (from research):**
- Runtime: Node.js 20+ with TypeScript 5.x
- CLI: Commander.js 14+
- PDF: Puppeteer 24+
- DOCX: docx 9.5+
- Markdown: marked 17+ with gray-matter 4+
- Templates: Nunjucks 3.2.4
- Build: tsup 8.5+

**Critical ATS Constraints:**
- Single-column layouts only
- Standard fonts (Arial, Calibri, Times New Roman)
- Contact info in body, not headers/footers
- No tables for layout
- Semantic HTML (h1 for name, h2 for sections)
- Text layers must be copy-paste verifiable

### Open TODOs

- [ ] Plan Phase 1 with `/gsd:plan-phase 1`
- [ ] Clarify HTML object tag embedding requirement (research flagged this as non-standard)
- [ ] Define specific template visual styles (Modern, Minimal, Classic)

### Blockers

None currently.

### Learnings

None yet (project starting).

## Session Continuity

### For Next Session

**Immediate next step:** Run `/gsd:plan-phase 1` to create executable plans for Foundation + Data Schema phase.

**Context to remember:**
- This is a CLI tool for IT professionals
- ATS compliance is the core differentiator
- Puppeteer PDF generation is critical for text layer quality
- 41 v1 requirements across 8 phases

### Files to Reference

- `/workspace/.planning/PROJECT.md` - Core value and constraints
- `/workspace/.planning/REQUIREMENTS.md` - All requirements with traceability
- `/workspace/.planning/ROADMAP.md` - Phase structure and success criteria
- `/workspace/.planning/research/SUMMARY.md` - Technology decisions and pitfalls

---

*State initialized: 2026-01-22*
