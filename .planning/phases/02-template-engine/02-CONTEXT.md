# Phase 2: Template Engine - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply design templates to parsed CV data, producing intermediate HTML that downstream phases (HTML/PDF/DOCX output) will consume. Templates use Nunjucks for rendering, support inheritance, and comply with ATS requirements (single-column, semantic HTML, standard fonts).

</domain>

<decisions>
## Implementation Decisions

### Template Structure
- Single directory per template (`/templates/modern/` contains HTML, CSS, config.json, assets)
- Lowercase kebab-case directory naming required (modern-professional, classic-serif)
- config.json is minimal: name + description + ATS compliance metadata fields
- Filesystem scan for discovery: scan `/templates/` for directories containing config.json
- Simple inheritance: templates can extend a base template, overriding specific blocks
- Single `template.njk` entry point per template (not split by section)
- Base template is usable as a default option, not just abstract foundation
- If template.njk missing, fall back to base template with the config
- Templates can include preview image showing what output looks like
- Malformed config.json causes fail fast (error thrown, CLI exits)
- CSS with variables (CSS custom properties) but no preprocessor
- Per-template custom Nunjucks filters allowed via filters.js file
- `.njk` extension for templates
- `cv-gen validate-template <name>` command for template validation
- App-provided filters live in separate `@gottz/cv-templates` package

### Section Rendering
- Template controls section order (same order for all CVs using that template)
- Auto-skip for empty/missing sections (render function omits them automatically)
- Section headers derived from CV language (German CV shows "Berufserfahrung", English shows "Work Experience")
- Base template provides default section header translations; config.json can override
- Skills rendered with category headers (each category gets subheading with skills below)
- Template decides experience entry format (role-first vs company-first)
- Template decides date range formatting (can use Nunjucks filters)
- Markdown in sections rendered to HTML where ATS-safe (bullets, bold, links) but avoid complex formatting
- Template decides contact link presentation (icons, text labels, etc.)
- Template decides whether to show/hide skill proficiency levels
- Template decides honors/distinctions placement
- No required block names; templates free to structure however they want
- CSS bullets for experience bullet points (styled divs with ::before, not `<ul><li>`)

### Styling Approach
- Web fonts with system font fallback
- Fonts embedded as base64 for self-contained files
- Spacing scale using CSS variables: --spacing-sm, --spacing-md, --spacing-lg
- Semantic color names: --color-heading, --color-body, --color-accent, --color-muted
- Optional dark mode via @media (prefers-color-scheme: dark)
- A4 fixed page dimensions for HTML preview

### Multi-language Handling
- Separate files per language: johndoe_modern_en.html, johndoe_modern_de.html
- Missing translation: log warning, skip the section (no fallback to other language)

### Claude's Discretion
- CSS delivery method (inline `<style>` vs element styles) based on PDF/DOCX conversion needs
- Print styling approach based on PDF generation
- Template access pattern for localized content (flat resolved vs nested) based on template simplicity
- HTML lang attribute handling based on accessibility/ATS implications

</decisions>

<specifics>
## Specific Ideas

- ATS compliance metadata in config.json (atsCompliant, singleColumn flags) for validation
- Base template should work standalone as a plain/simple option for Phase 8's three themes
- Section headers should be language-aware with template-level overrides possible

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-template-engine*
*Context gathered: 2026-01-22*
