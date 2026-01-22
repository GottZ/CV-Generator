# Phase 1: Foundation + Data Schema - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the TypeScript project structure and define the CVData interface that all parsing, rendering, and output components depend on. This includes the markdown parser that extracts structured data from CV files. The target audience is established IT professionals, often with German "Ausbildung" rather than university degrees.

</domain>

<decisions>
## Implementation Decisions

### Schema Structure
- Contact info structure: Claude's discretion based on template needs
- Links: Generic array format `[{ type: "linkedin", url: "..." }]` — not fixed fields
- Dates: ISO format in schema (YYYY-MM-DD or YYYY-MM), locale-aware formatting at render time
- Date formatting: German (dd.MM.yyyy) and American (MM/dd/yyyy, "Jan 2020") styles supported
- Skills: Categories with optional proficiency levels per skill
- Education: GPA/honors are optional fields (not emphasized for established professionals)
- Work experience bullets: Full markdown supported (bold, links, inline code)
- Multi-language: Single file with translations per field/section — `{ en: "...", de: "..." }`
- Section order: Schema is unordered; templates control section ordering

### Markdown Format
- Metadata: YAML frontmatter for contact info and short fields
- Body content: Markdown body for longer content (experience, education sections)
- Language tags: Code-style backtick notation — `## Work Experience `en`` / `## Berufserfahrung `de``
- Language sections: Grouped by language for readability (not per-line interleaving)
- Entry delimiters: Horizontal rules (`---`) separate work experience entries
- Language requirements: Explicit tags required on every section (no default language)
- Inherit marker: `(same as en)` or similar to reuse content from another language
- Extensible languages: Any language tag accepted (not limited to DE/EN)
- Comments: HTML comment syntax `<!-- -->` supported and stripped during parsing

### Parser Behavior
- Missing required fields: Hard error with clear message
- Unknown sections: Warn and skip (continue generation without them)
- Incomplete language: Warn and omit section for that language (no fallback to other language)
- Date parsing: Strict ISO only — error on "Jan 2020", require "2020-01" format
- URL validation: None — accept any string as URL
- Duplicate sections: Last wins with warning
- Error reporting: Collect all errors, display together (not fail-fast)
- Error messages: Line numbers + context snippet + suggested fixes where applicable
- Inherit from missing source: Warn and omit (not error)
- Strict mode: Optional `--strict` flag turns warnings into errors
- Strict mode exception: Image ATS warnings remain non-fatal even in strict mode

### Project Setup
- CLI name: `cvgen`
- Package name: `@gottz/cvgen` (CLI), potentially `@gottz/cv-core` (core library)
- Package manager & runtime: Bun exclusively
- Source structure: Feature folders (`src/parser/`, `src/schema/`, etc.)
- Testing: Bun's built-in test runner
- Linting: Biome (fast Rust-based linter + formatter)
- TypeScript: Moderate strictness (strict: true with some escape hatches)
- CI: GitHub Actions with lint + type-check + tests on push/PR
- Runtime target: Bun only (no Node.js version specified)
- Distribution: Works locally, optionally publishable to npm
- Monorepo: Bun workspaces with packages/core + packages/cli structure
- Example CV: Generic but realistic fake data ("Jane Developer" style)
- Init command: `--example` flag scaffolds full project structure with example template and CV

### Claude's Discretion
- Contact info nesting (flat vs nested object)
- Exact proficiency level values if used
- Internal code organization within feature folders
- Biome configuration details
- Whether @gottz/cv-core is published independently

</decisions>

<specifics>
## Specific Ideas

- Target audience is established IT professionals, not job starters — GPA is not the focus
- German "Ausbildung" is common; university degrees are optional
- Multi-language CV editing should feel natural — translations kept close together for easy editing
- Example CV should be useful for testing all features, not just a placeholder

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-data-schema*
*Context gathered: 2026-01-22*
