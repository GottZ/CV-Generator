# Roadmap: v1.2 Prompts for CV and Template Generation

**Milestone:** v1.2
**Created:** 2026-01-25
**Phases:** 7 (Phase 14-20)
**Requirements:** 47

---

## Overview

This roadmap delivers AI-assisted content generation, interactive CLI wizards, and template scaffolding for the CV Generator CLI. The build order prioritizes provider abstraction (critical pitfall prevention), then multi-stage workflow (core innovation), followed by parallel wizard development, culminating in template scaffolding.

---

## Phases

### Phase 14: AI Foundation

**Goal:** Users can configure AI providers and export prompts for manual LLM use without requiring API keys.

**Dependencies:** None (foundation phase)

**Requirements:**
- AI-01: User can configure LLM provider (OpenAI, Anthropic, Ollama) via environment variables or config file
- AI-02: User can export AI prompts to clipboard/file for manual LLM use when no API key is configured

**Success Criteria:**
1. User can set `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or configure Ollama endpoint via `.cvgenrc` or environment
2. User can run `cvgen ai export-prompt <name>` and receive a copyable prompt without any API key configured
3. Provider abstraction interface exists (validates architecture before integration)
4. Configuration cascade includes `ai` section extending existing pattern

**Plans:** 3 plans (complete)

**Research flags:** None - standard SDK patterns

---

### Phase 15: Multi-Stage Workflow

**Goal:** Users can progress through a structured AI workflow with persistent state across sessions.

**Dependencies:** Phase 14 (provider abstraction)

**Requirements:**
- AI-03: System uses multi-stage prompt workflow with progression state stored in `/people/[name]/output/.ai-state.json`
- AI-04: User can view current stage and resume from any point after context reset via `cvgen ai status [name]`
- AI-05: User can lookup context details (CV sections, previous stage results) via `cvgen ai context [name] [section]`
- AI-15: Stage 1 "Analyze" extracts CV structure, identifies sections, gaps, and improvement opportunities
- AI-16: Stage 2 "Improve" generates better bullets with STAR method and quantification
- AI-17: Stage 3 "Summarize" generates professional summary from improved content
- AI-18: Stage 4 "Tailor" adapts content for specific job descriptions (optional, requires job input)

**Success Criteria:**
1. User can run `cvgen ai status jane` and see current stage (Analyze/Improve/Summarize/Tailor) with progress
2. User can close terminal, reopen, and resume from last completed stage via state in `.ai-state.json`
3. User can run `cvgen ai context jane experience` to see previous stage results for that section
4. Each stage produces structured output that feeds into the next stage
5. Stage 4 (Tailor) is skippable when no job description is provided

**Plans:** 4 plans (complete)
- [x] 15-01-PLAN.md - Workflow Types & State Management (Wave 1)
- [x] 15-02-PLAN.md - Stage Commands: Analyze & Improve (Wave 2)
- [x] 15-03-PLAN.md - Stage Commands: Summarize & Tailor (Wave 2)
- [x] 15-04-PLAN.md - Status & Context Commands (Wave 3)

**Research flags:** Prompt engineering iteration needed

---

### Phase 16: AI Content Generation

**Goal:** Users can generate and improve CV content using AI assistance.

**Dependencies:** Phase 15 (workflow infrastructure)

**Requirements:**
- AI-06: User can generate achievement bullets from job descriptions using `cvgen ai bullets [name]`
- AI-07: User can generate professional summary from CV data using `cvgen ai summary [name]`
- AI-08: User can get keyword optimization suggestions for ATS using `cvgen ai keywords [name]`
- AI-09: User can improve existing CV content with suggestions using `cvgen ai improve [name]`
- AI-10: User can tailor CV to specific job description using `cvgen ai tailor [name] --job [file|url]`

**Success Criteria:**
1. User can run `cvgen ai bullets jane` and receive STAR-formatted achievement suggestions for each role
2. User can run `cvgen ai summary jane` and receive a professional summary draft based on CV content
3. User can run `cvgen ai keywords jane --job posting.txt` and see missing ATS keywords with placement suggestions
4. User can run `cvgen ai improve jane` and receive suggestions for strengthening weak content
5. User can run `cvgen ai tailor jane --job posting.txt` and receive role-specific content adaptations

**Plans:** (created by /gsd:plan-phase)

**Research flags:** Prompt engineering for CV-specific use cases

---

### Phase 17: AI User Control

**Goal:** Users have full control over AI suggestions with preview, comparison, and selective acceptance.

**Dependencies:** Phase 16 (generation features)

**Requirements:**
- AI-11: User previews all AI suggestions before accepting (never auto-write)
- AI-12: User sees before/after diff view for all suggested changes
- AI-13: User can accept, edit, skip, or regenerate each suggestion individually
- AI-14: System detects weak bullets (lacking impact/metrics) and flags for improvement

**Success Criteria:**
1. AI never writes to CV files without explicit user confirmation
2. User sees side-by-side or inline diff showing original vs suggested content
3. User can press `a` to accept, `e` to edit, `s` to skip, `r` to regenerate for each suggestion
4. Weak bullets are highlighted with specific feedback (e.g., "lacks quantification", "missing outcome")
5. User can accept all, skip all, or review one-by-one

**Plans:** (created by /gsd:plan-phase)

**Research flags:** None - established UI patterns

---

### Phase 18: Wizard Foundation

**Goal:** Users can create and modify CVs through interactive guided prompts.

**Dependencies:** Phase 14 (shared CLI infrastructure patterns)

**Requirements:**
- WIZ-01: User can create full CV from scratch via `cvgen wizard init [name]`
- WIZ-02: User can add work experience via `cvgen wizard add experience [name]`
- WIZ-03: User can add skills via `cvgen wizard add skills [name]`
- WIZ-04: User can add projects via `cvgen wizard add project [name]`
- WIZ-05: User can add certifications via `cvgen wizard add certification [name]`
- WIZ-06: User can add education via `cvgen wizard add education [name]`
- WIZ-07: Wizard validates input as-you-go with clear error messages
- WIZ-08: Wizard provides sensible defaults for all optional fields
- WIZ-09: User can exit wizard cleanly with Ctrl+C (no partial state saved)
- WIZ-10: Wizard shows summary of all inputs before committing changes
- WIZ-11: API keys and sensitive inputs are masked during entry
- WIZ-12: Wizard supports arrow key navigation for selections
- WIZ-13: Wizard shows progress indication during long operations
- WIZ-14: Each prompt includes inline help text

**Success Criteria:**
1. User can run `cvgen wizard init jane` and create a complete CV through guided prompts
2. User can run `cvgen wizard add experience jane` and add a new role with validation
3. Pressing Ctrl+C at any point exits cleanly without saving partial data
4. Before saving, user sees a formatted summary of all entered data and confirms
5. Arrow keys navigate select lists, passwords are masked, progress spinners show during file writes

**Plans:** (created by /gsd:plan-phase)

**Research flags:** Bun compatibility spike for @inquirer/prompts

---

### Phase 19: Wizard Non-Interactive & Integration

**Goal:** Wizards work in CI/CD pipelines and can optionally enhance content with AI.

**Dependencies:** Phase 18 (wizard foundation), Phase 16 (AI generation for integration)

**Requirements:**
- WIZ-15: All wizard commands support `--no-input` flag for non-interactive use
- WIZ-16: All wizard commands accept values via flags (e.g., `--company "Acme"`)
- WIZ-17: All wizard commands accept JSON input via `--json-input [file]`
- WIZ-18: Wizard detects non-TTY environment and fails gracefully with helpful message
- WIZ-19: Experience wizard asks STAR-method questions to craft achievement bullets
- WIZ-20: Wizard can optionally invoke AI to enhance entered content (if API configured)

**Success Criteria:**
1. User can run `cvgen wizard init jane --no-input --name "Jane Doe" --title "Engineer"` in CI
2. User can run `cvgen wizard add experience jane --json-input experience.json` for bulk import
3. Running wizard in non-TTY (e.g., piped input) shows error with instructions to use `--no-input`
4. Experience wizard prompts for Situation, Task, Action, Result to build strong bullets
5. User can add `--enhance` flag to wizard commands to get AI suggestions for entered content

**Plans:** (created by /gsd:plan-phase)

**Research flags:** None - standard CLI patterns

---

### Phase 20: Template Scaffolding

**Goal:** Users can create, customize, and validate custom templates through operations and wizards.

**Dependencies:** Phase 18 (wizard infrastructure)

**Requirements:**
- TPL-01: User can copy/fork existing template via `cvgen template copy [source] [target]`
- TPL-02: User can customize template colors via config or wizard
- TPL-03: User can customize template fonts (ATS-safe options) via config or wizard
- TPL-04: User can customize template margins via config or wizard
- TPL-05: User can validate custom template structure via `cvgen template validate [name]`
- TPL-06: User can create customized template via `cvgen template wizard`
- TPL-07: Template wizard allows selecting base template to customize
- TPL-08: Template wizard allows setting section visibility (show/hide optional sections)
- TPL-09: Template wizard generates valid template files in `/templates/[name]/`

**Success Criteria:**
1. User can run `cvgen template copy modern my-custom` and get a working copy in `/templates/my-custom/`
2. User can customize colors, fonts, margins via `.cvgenrc` or template wizard
3. User can run `cvgen template validate my-custom` and see validation results with actionable errors
4. User can run `cvgen template wizard` and create a new template through guided prompts
5. Generated templates pass validation and produce working PDF/HTML/DOCX output

**Plans:** (created by /gsd:plan-phase)

**Research flags:** None - extends existing scaffolder patterns

---

## Progress

| Phase | Name | Requirements | Status | Completion |
|-------|------|--------------|--------|------------|
| 14 | AI Foundation | 2 | Complete | 100% |
| 15 | Multi-Stage Workflow | 6 | Complete | 100% |
| 16 | AI Content Generation | 5 | Pending | 0% |
| 17 | AI User Control | 4 | Pending | 0% |
| 18 | Wizard Foundation | 14 | Pending | 0% |
| 19 | Wizard Non-Interactive & Integration | 6 | Pending | 0% |
| 20 | Template Scaffolding | 9 | Pending | 0% |

**Total:** 47 requirements mapped

---

## Dependency Graph

```
Phase 14: AI Foundation
    |
    +---> Phase 15: Multi-Stage Workflow
    |         |
    |         +---> Phase 16: AI Content Generation
    |                   |
    |                   +---> Phase 17: AI User Control
    |                   |
    |                   +---> Phase 19: Wizard Non-Interactive (AI integration)
    |
    +---> Phase 18: Wizard Foundation
              |
              +---> Phase 19: Wizard Non-Interactive & Integration
              |
              +---> Phase 20: Template Scaffolding
```

**Critical path:** 14 -> 15 -> 16 -> 17
**Parallel track:** 14 -> 18 -> 19/20

---

## Completed Milestones

- **v1.1** Improved PDF Creation (2026-01-25) - [Archive](milestones/v1.1-ROADMAP.md)
- **v1.0** MVP (2026-01-23) - [Archive](milestones/v1.0-ROADMAP.md)

---

*Generated: 2026-01-25*
