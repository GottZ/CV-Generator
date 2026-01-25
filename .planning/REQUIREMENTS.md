# Requirements: v1.2 Prompts for CV and Template Generation

**Milestone:** v1.2
**Created:** 2026-01-25
**Status:** Active

---

## v1.2 Requirements

### AI Content Generation (AI-*)

**Core Infrastructure:**
- [ ] **AI-01**: User can configure LLM provider (OpenAI, Anthropic, Ollama) via environment variables or config file
- [ ] **AI-02**: User can export AI prompts to clipboard/file for manual LLM use when no API key is configured
- [ ] **AI-03**: System uses multi-stage prompt workflow with progression state stored in `/people/[name]/output/.ai-state.json`
- [ ] **AI-04**: User can view current stage and resume from any point after context reset via `cvgen ai status [name]`
- [ ] **AI-05**: User can lookup context details (CV sections, previous stage results) via `cvgen ai context [name] [section]`

**Content Generation:**
- [ ] **AI-06**: User can generate achievement bullets from job descriptions using `cvgen ai bullets [name]`
- [ ] **AI-07**: User can generate professional summary from CV data using `cvgen ai summary [name]`
- [ ] **AI-08**: User can get keyword optimization suggestions for ATS using `cvgen ai keywords [name]`
- [ ] **AI-09**: User can improve existing CV content with suggestions using `cvgen ai improve [name]`
- [ ] **AI-10**: User can tailor CV to specific job description using `cvgen ai tailor [name] --job [file|url]`

**User Control:**
- [ ] **AI-11**: User previews all AI suggestions before accepting (never auto-write)
- [ ] **AI-12**: User sees before/after diff view for all suggested changes
- [ ] **AI-13**: User can accept, edit, skip, or regenerate each suggestion individually
- [ ] **AI-14**: System detects weak bullets (lacking impact/metrics) and flags for improvement

**Staged Workflow:**
- [ ] **AI-15**: Stage 1 "Analyze" extracts CV structure, identifies sections, gaps, and improvement opportunities
- [ ] **AI-16**: Stage 2 "Improve" generates better bullets with STAR method and quantification
- [ ] **AI-17**: Stage 3 "Summarize" generates professional summary from improved content
- [ ] **AI-18**: Stage 4 "Tailor" adapts content for specific job descriptions (optional, requires job input)

### CLI Wizard (WIZ-*)

**Wizard Infrastructure:**
- [ ] **WIZ-01**: User can create full CV from scratch via `cvgen wizard init [name]`
- [ ] **WIZ-02**: User can add work experience via `cvgen wizard add experience [name]`
- [ ] **WIZ-03**: User can add skills via `cvgen wizard add skills [name]`
- [ ] **WIZ-04**: User can add projects via `cvgen wizard add project [name]`
- [ ] **WIZ-05**: User can add certifications via `cvgen wizard add certification [name]`
- [ ] **WIZ-06**: User can add education via `cvgen wizard add education [name]`

**Wizard UX:**
- [ ] **WIZ-07**: Wizard validates input as-you-go with clear error messages
- [ ] **WIZ-08**: Wizard provides sensible defaults for all optional fields
- [ ] **WIZ-09**: User can exit wizard cleanly with Ctrl+C (no partial state saved)
- [ ] **WIZ-10**: Wizard shows summary of all inputs before committing changes
- [ ] **WIZ-11**: API keys and sensitive inputs are masked during entry
- [ ] **WIZ-12**: Wizard supports arrow key navigation for selections
- [ ] **WIZ-13**: Wizard shows progress indication during long operations
- [ ] **WIZ-14**: Each prompt includes inline help text

**Non-Interactive Support:**
- [ ] **WIZ-15**: All wizard commands support `--no-input` flag for non-interactive use
- [ ] **WIZ-16**: All wizard commands accept values via flags (e.g., `--company "Acme"`)
- [ ] **WIZ-17**: All wizard commands accept JSON input via `--json-input [file]`
- [ ] **WIZ-18**: Wizard detects non-TTY environment and fails gracefully with helpful message

**Guided Content:**
- [ ] **WIZ-19**: Experience wizard asks STAR-method questions to craft achievement bullets
- [ ] **WIZ-20**: Wizard can optionally invoke AI to enhance entered content (if API configured)

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

| Requirement | Phase | Plan |
|-------------|-------|------|
| AI-01 to AI-05 | TBD | — |
| AI-06 to AI-14 | TBD | — |
| AI-15 to AI-18 | TBD | — |
| WIZ-01 to WIZ-06 | TBD | — |
| WIZ-07 to WIZ-14 | TBD | — |
| WIZ-15 to WIZ-18 | TBD | — |
| WIZ-19 to WIZ-20 | TBD | — |
| TPL-01 to TPL-05 | TBD | — |
| TPL-06 to TPL-09 | TBD | — |

---

*Generated: 2026-01-25*
