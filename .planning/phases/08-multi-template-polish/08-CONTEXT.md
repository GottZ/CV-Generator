# Phase 8: Multi-Template + Polish - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver three template themes (Modern, Minimal, Classic) with configurable styling via config.json, plus comprehensive documentation (README, CLI guide, customization guide). All templates maintain ATS compliance. External templates and agentic prompt files are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Template Themes

- **Three templates:** Names lowercase, Claude's discretion on exact names (modern, minimal, classic or similar)
- **Modern:** Bold and geometric, strong contrast, generous whitespace, machine-readable
- **Minimal:** Single font family, no decoratives, pure text hierarchy, enough space for pen notes, prints well on monochrome but has colors
- **Classic:** Business formal, clean but traditional, balanced margins, professional without flair
- **Distinct color palettes:** Each template has signature colors, but accent is user-overridable (deriving the rest)
- **Varying density:** Modern=spacious, Minimal=airy, Classic=compact
- **Distinct font pairings:** Each template has different fonts, but fonts are also user-configurable
- **Section dividers:** Visual variety as ATS research allows (Modern=colored bars, Minimal=hairline/none, Classic=rules)
- **Photo styles:** Template-specific (Modern=rounded, Minimal=square, Classic=oval/formal)
- **Bullet styles:** Vary by template (dashes, dots, traditional)
- **Date formatting:** Template-specific defaults with locale variations (en/de)
- **Dark mode:** HTML preview only, PDF/DOCX always light

### Customization Options

- **Core config options:** Accent color, font family, margins
- **Color derivation:** Progressive — if only accent provided, derive all; if partial, fill gaps; if full palette, use as-is
- **Margin configuration:** Named sizes ("narrow", "normal", "wide") but accept numeric mm values if provided
- **Config cascade:** Global (/config.json) → Template (/templates/{name}/config.json) → Person (cv.md frontmatter)
- **Environment variables:** Supported (CVGEN_ACCENT_COLOR etc.) override config files
- **Locale-specific config:** Supported — config can have locale-specific values
- **Invalid config handling:** Warn and fallback to template default, generation continues
- **JSON Schema:** Provide schema for config.json with IDE autocomplete support

### Documentation Structure

- **README.md:** Balanced — quick-start section + reference sections
- **Table of Contents:** Auto-generated
- **Badges:** Full set (version, license, CI, coverage)
- **Template screenshots:** Inline images in README showing each template
- **Documentation in /docs/:**
  - MARKDOWN.md — CV markdown format specification
  - CLI.md — Comprehensive CLI reference with all flags
  - CUSTOMIZATION.md — Template customization guide
  - CONTRIBUTING.md — Contribution guidelines
  - FAQ.md — Frequently asked questions
  - CHANGELOG.md — Version history (also GitHub releases)
- **Troubleshooting:** Common issues section + link to GitHub issues/wiki
- **Examples:** /examples/ with fictional developer CV + outputs in all formats

### Template Architecture

- **Inheritance:** Hybrid — templates can extend base or be standalone
- **CSS:** Mixins/partials in /templates/_shared/ — templates import what they need
- **Nunjucks macros:** Hybrid — shared utility macros + template-specific presentation macros
- **Shared resources:** /templates/_shared/ directory (underscore prefix)
- **Template discovery:** config.json `private: true` hides from list-templates (not underscore prefix)
- **Version compatibility:** config.json includes `minVersion` field
- **Custom templates:** Document manual copy workflow + consider scaffold command (Claude's discretion)
- **DOCX styling:** Derive from CSS but allow parallel docx-specific config if desired
- **Custom Nunjucks filters:** Templates can register custom filters via config or JS file
- **External templates:** Support npm packages and git URLs, installed to /templates/

### Claude's Discretion

- Exact template names (modern/minimal/classic or alternatives)
- Specific font choices per template
- Section divider designs within ATS constraints
- Whether to include new-template scaffold command in this phase
- Specific badge implementations (shields.io, etc.)
- Example person details (name, fictional work history)

</decisions>

<specifics>
## Specific Ideas

- "Minimal should have enough space to take pen-notes" — wider margins, breathing room
- "Prints decent on monochrome but has colors" — accessible color choices
- Config is "floaty" — fill in gaps, derive missing values from what's provided
- Named margin sizes with fallback to numeric: "wide" or "25mm" both work
- Modern should be "decently machine-readable" — ATS-first within bold aesthetic

</specifics>

<deferred>
## Deferred Ideas

- **Agentic prompt files** — LLM interview-like experience for CV generation/customization (prompt files that let users iterate with language models to create/modify CVs and themes). This is a significant new capability deserving its own phase.

</deferred>

---

*Phase: 08-multi-template-polish*
*Context gathered: 2026-01-23*
