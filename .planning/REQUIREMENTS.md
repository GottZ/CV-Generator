# Requirements: v1.2 Prompts for CV and Template Generation

**Milestone:** v1.2
**Created:** 2026-01-25
**Status:** Active

---

## v1.2 Requirements

### AI Content Generation (AI-*)

**Core Infrastructure:**
- [x] **AI-01**: User can configure LLM provider (OpenAI, Anthropic, Ollama) via environment variables or config file
- [x] **AI-02**: User can export AI prompts to clipboard/file for manual LLM use when no API key is configured
- [x] **AI-03**: System uses multi-stage prompt workflow with progression state stored in `/people/[name]/output/.ai-state.json`
- [x] **AI-04**: User can view current stage and resume from any point after context reset via `cvgen ai status [name]`
- [x] **AI-05**: User can lookup context details (CV sections, previous stage results) via `cvgen ai context [name] [section]`

**Content Generation:**
- [x] **AI-06**: User can generate achievement bullets from job descriptions using `cvgen ai bullets [name]`
- [x] **AI-07**: User can generate professional summary from CV data using `cvgen ai summary [name]`
- [x] **AI-08**: User can get keyword optimization suggestions for ATS using `cvgen ai keywords [name]`
- [x] **AI-09**: User can improve existing CV content with suggestions using `cvgen ai improve [name]`
- [x] **AI-10**: User can tailor CV to specific job description using `cvgen ai tailor [name] --job [file|url]`

**User Control:**
- [x] **AI-11**: User previews all AI suggestions before accepting (never auto-write)
- [x] **AI-12**: User sees before/after diff view for all suggested changes
- [x] **AI-13**: User can accept, edit, skip, or regenerate each suggestion individually
- [x] **AI-14**: System detects weak bullets (lacking impact/metrics) and flags for improvement

**Staged Workflow:**
- [x] **AI-15**: Stage 1 "Analyze" extracts CV structure, identifies sections, gaps, and improvement opportunities
- [x] **AI-16**: Stage 2 "Improve" generates better bullets with STAR method and quantification
- [x] **AI-17**: Stage 3 "Summarize" generates professional summary from improved content
- [x] **AI-18**: Stage 4 "Tailor" adapts content for specific job descriptions (optional, requires job input)

### CLI Wizard (WIZ-*)

**Wizard Infrastructure:**
- [x] **WIZ-01**: User can create full CV from scratch via `cvgen wizard init [name]`
- [x] **WIZ-02**: User can add work experience via `cvgen wizard add experience [name]`
- [x] **WIZ-03**: User can add skills via `cvgen wizard add skills [name]`
- [x] **WIZ-04**: User can add projects via `cvgen wizard add project [name]`
- [x] **WIZ-05**: User can add certifications via `cvgen wizard add certification [name]`
- [x] **WIZ-06**: User can add education via `cvgen wizard add education [name]`

**Wizard UX:**
- [x] **WIZ-07**: Wizard validates input as-you-go with clear error messages
- [x] **WIZ-08**: Wizard provides sensible defaults for all optional fields
- [x] **WIZ-09**: User can exit wizard cleanly with Ctrl+C (no partial state saved)
- [x] **WIZ-10**: Wizard shows summary of all inputs before committing changes
- [x] **WIZ-11**: API keys and sensitive inputs are masked during entry
- [x] **WIZ-12**: Wizard supports arrow key navigation for selections
- [x] **WIZ-13**: Wizard shows progress indication during long operations
- [x] **WIZ-14**: Each prompt includes inline help text

**Non-Interactive Support:**
- [x] **WIZ-15**: All wizard commands support `--no-input` flag for non-interactive use
- [x] **WIZ-16**: All wizard commands accept values via flags (e.g., `--company "Acme"`)
- [x] **WIZ-17**: All wizard commands accept JSON input via `--json-input [file]`
- [x] **WIZ-18**: Wizard detects non-TTY environment and fails gracefully with helpful message

**Guided Content:**
- [x] **WIZ-19**: Experience wizard asks STAR-method questions to craft achievement bullets
- [x] **WIZ-20**: Wizard can optionally invoke AI to enhance entered content (if API configured)

### Template Scaffolding (TPL-*)

**Template Operations:**
- [ ] **TPL-01**: User can copy/fork existing template via `cvgen template copy [source] [target]`
- [ ] **TPL-02**: User can customize template colors via config or wizard
- [ ] **TPL-03**: User can customize template fonts (ATS-safe options) via config or wizard
- [ ] **TPL-04**: User can customize template margins via config or wizard
- [ ] **TPL-05**: User can validate custom template structure via `cvgen template validate [name]`

**Template Wizard:**
- [ ] **TPL-06**: User can create customized template via `cvgen template wizard`
- [ ] **TPL-07**: Template wizard allows selecting base template to customize
- [ ] **TPL-08**: Template wizard allows setting section visibility (show/hide optional sections)
- [ ] **TPL-09**: Template wizard generates valid template files in `/templates/[name]/`

---

## Future Requirements (Deferred)

**Deferred from AI features:**
- Interview-style content extraction (conversational flow) - complex UX
- Batch improvement mode (entire CV analysis) - can use staged workflow instead
- Tone adjustment - low priority
- Context-aware suggestions - partially covered by staged workflow

**Deferred from Wizard features:**
- Partial completion resume (exit and continue later) - complex state management
- Multi-step undo - medium complexity
- Preview CV at any step - medium complexity
- Import from LinkedIn/JSON Resume - external format parsing

**Deferred from Template features:**
- Section ordering customization - medium complexity
- Template themes (color scheme presets) - can add in v1.3
- Custom section support - schema extension needed

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-write without preview | 62% employer rejection rate for unreviewed AI content |
| Hallucinated credentials | Legal/ethical issues - never generate claims user didn't provide |
| Keyword stuffing mode | Modern ATS detects this, hurts readability |
| Full CV generation from scratch | Produces generic, detectable AI content |
| Real-time API calls during build | Slows build, fails on network issues - AI commands separate |
| Store API keys in CV files | Security risk - use env vars or config |
| Web-based wizard UI | Explicitly out of scope per PROJECT.md |
| WYSIWYG template editor | Massive complexity - edit files directly |
| Multi-column template layouts | ATS parsing issues per v1.0 decisions |
| Custom font upload | ATS compatibility issues |

---

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| AI-01 | Phase 14 | 14-01, 14-03 | Complete |
| AI-02 | Phase 14 | 14-02, 14-03 | Complete |
| AI-03 | Phase 15 | 15-01, 15-02, 15-03 | Complete |
| AI-04 | Phase 15 | 15-04 | Complete |
| AI-05 | Phase 15 | 15-04 | Complete |
| AI-06 | Phase 16 | 16-03 | Complete |
| AI-07 | Phase 16 | 16-04 | Complete |
| AI-08 | Phase 16 | 16-05 | Complete |
| AI-09 | Phase 16 | 16-06 | Complete |
| AI-10 | Phase 16 | 16-07 | Complete |
| AI-11 | Phase 17 | 17-03, 17-05 | Complete |
| AI-12 | Phase 17 | 17-04 | Complete |
| AI-13 | Phase 17 | 17-01, 17-02, 17-04 | Complete |
| AI-14 | Phase 17 | 17-01 | Complete |
| AI-15 | Phase 15 | 15-02 | Complete |
| AI-16 | Phase 15 | 15-02 | Complete |
| AI-17 | Phase 15 | 15-03 | Complete |
| AI-18 | Phase 15 | 15-03 | Complete |
| WIZ-01 | Phase 18 | 18-01, 18-06 | Complete |
| WIZ-02 | Phase 18 | 18-02, 18-06 | Complete |
| WIZ-03 | Phase 18 | 18-03, 18-06 | Complete |
| WIZ-04 | Phase 18 | 18-04, 18-06 | Complete |
| WIZ-05 | Phase 18 | 18-04, 18-06 | Complete |
| WIZ-06 | Phase 18 | 18-03, 18-06 | Complete |
| WIZ-07 | Phase 18 | 18-01 | Complete |
| WIZ-08 | Phase 18 | 18-01, 18-08 | Complete |
| WIZ-09 | Phase 18 | 18-06 | Complete |
| WIZ-10 | Phase 18 | 18-05 | Complete |
| WIZ-11 | Phase 19 | 19-05 | Complete |
| WIZ-12 | Phase 18 | 18-01, 18-08 | Complete |
| WIZ-13 | Phase 18 | 18-05 | Complete |
| WIZ-14 | Phase 18 | 18-02, 18-03, 18-04 | Complete |
| WIZ-15 | Phase 19 | 19-01, 19-07 | Complete |
| WIZ-16 | Phase 19 | 19-03, 19-07 | Complete |
| WIZ-17 | Phase 19 | 19-02, 19-06, 19-07 | Complete |
| WIZ-18 | Phase 19 | 19-01 | Complete |
| WIZ-19 | Phase 19 | 19-04 | Complete |
| WIZ-20 | Phase 19 | 19-05, 19-07 | Complete |
| TPL-01 | Phase 20 | - | Pending |
| TPL-02 | Phase 20 | - | Pending |
| TPL-03 | Phase 20 | - | Pending |
| TPL-04 | Phase 20 | - | Pending |
| TPL-05 | Phase 20 | - | Pending |
| TPL-06 | Phase 20 | - | Pending |
| TPL-07 | Phase 20 | - | Pending |
| TPL-08 | Phase 20 | - | Pending |
| TPL-09 | Phase 20 | - | Pending |

---

*Generated: 2026-01-25*
