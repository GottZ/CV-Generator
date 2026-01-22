# Phase 3: HTML Output - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate self-contained HTML files with fully embedded CSS and base64-encoded images from rendered CV data. Users run a build command that produces HTML files following a naming convention. This phase establishes the build command interface that PDF and DOCX phases will extend.

</domain>

<decisions>
## Implementation Decisions

### Image handling
- Fail the build if an image path doesn't exist (no silent skipping)
- ATS warning about images appears in console (stderr), not embedded in HTML
- Images always located in `/people/[name]/images/` directory (fixed path, not relative)
- Validate image formats: only PNG, JPG, JPEG, GIF, WebP allowed
- Per-format image conversion: HTML converts to optimal format for web
- HTML format preferences: WebP for photos (JPG/JPEG source), keep PNG for graphics/logos
- Claude's discretion: heuristic for detecting photo vs graphic

### File output behavior
- Create output directory automatically if missing (`/people/[name]/output/`)
- Note overwrites in success message: "Overwrote existing johndoe_modern.html"
- Success message format: "✓ Generated johndoe_modern.html (12KB)" with file size
- No --dry-run option (files cheap to regenerate)
- Filename from frontmatter `slug` field if present, otherwise directory name
- Slug accepted as-is but trimmed on both sides
- Directory name fallback: trim whitespace only, no sanitization

### Build invocation
- Format selection via `--format=html,pdf` flag (comma-separated)
- Default behavior: build all available formats when --format not specified
- Template is required argument: `build johndoe modern`
- Locale via `--locale=de,en` flag; default builds all locales in CV
- Multi-locale naming: suffix pattern (johndoe_modern_de.html, johndoe_modern_en.html)
- Sequential builds by default; `--parallel` flag for concurrent builds, `--sequential` explicit
- Watch mode included: `--watch` for development
- Watch triggers on template files and all CV files
- Watch detects new people and builds them when required files appear
- Watch filtering: `--watch=cv:johndoe` for specific CV, `--watch=t:base` for specific template
- Comma-separated watch filters; default watches all

### Error scenarios
- Template not found: suggest similar names ("Did you mean 'modern'?")
- Parse errors: line numbers + context ("Line 15: Invalid frontmatter...")
- Terminal colors: auto-detect TTY support
- Multiple errors: show as they occur, summarize at end
- Warnings don't block build completion
- Categorized exit codes: 1=parse error, 2=template error, 3=file error
- `--quiet` mode suppresses non-error output (for CI)
- `--json` flag for machine-readable output with status, files, errors, warnings

### Claude's Discretion
- Photo vs graphic detection heuristic for WebP/PNG decision
- Image conversion implementation details
- Exit code assignments for specific error types
- Watch debouncing and change detection implementation

</decisions>

<specifics>
## Specific Ideas

- Watch mode should handle rapid successive changes gracefully (debounce)
- JSON output format should be parseable by standard CI tools
- Error suggestions should use fuzzy matching for template names

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-html-output*
*Context gathered: 2026-01-22*
