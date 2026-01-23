# Phase 6: CLI Commands - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete CLI interface with four commands: `build` (generates all formats), `init` (scaffolds new CV), `validate` (checks markdown), and `list-templates` (shows available templates). Clear error messages with fix suggestions.

</domain>

<decisions>
## Implementation Decisions

### Error messaging
- Error display format: Claude's discretion based on error severity/type
- Fix suggestions: Always include a "Try: ..." suggestion with every error
- Warnings: Show by default, suppress with --quiet flag
- Colors: TTY auto-detect (colors when interactive, plain when piped)
- Multiple errors: Fail on first error, fix one at a time
- Exit codes: Claude's discretion on convention
- Fuzzy matching: Suggest similar names for "not found" errors ("Did you mean 'john-doe'?")
- Documentation links: No links in error messages, keep self-contained

### Init scaffolding
- Example content: Commented guide with inline comments explaining each section
- Images folder: Create with simple colored square placeholder (solid color with "PHOTO" text)
- Existing directory: Interactive prompt (overwrite, skip, or cancel options)
- Interactive mode: Optional prompting (prompt for name if not provided as argument)
- Language coverage: Include both EN and DE section examples
- Section coverage: All core sections (summary, experience, education, skills)
- Output directory: Not created by init, build creates it when needed
- Directory naming: Lowercase hyphenated ("John Doe" becomes "john-doe/")

### Output feedback
- Default verbosity: Detailed (show each step: "Parsing... Rendering... Writing PDF...")
- File sizes: Always show ("johndoe_modern.pdf (124 KB)")
- Path format: Relative to cwd ("people/johndoe/output/johndoe_modern.pdf")
- Progress indicator: Animated spinner for slow operations (PDF/DOCX generation)
- Template listing: Table format (Name | Description | ATS Compliant columns)
- Validate success: Summary stats ("Valid: 4 sections, 3 jobs, 2 degrees")
- Watch mode: Timestamp + file count ("[14:32:15] Rebuilt 3 files")

### Command defaults
- Default formats: All three (PDF, HTML, DOCX) unless --no-* flags used
- Template selection: Auto-select if only one template available
- Default locale: System locale from LANG/LC_ALL environment, fall back to 'en'
- Locale behavior: Use specified locale, fall back to available sections if missing
- Dry run: Support --dry-run flag to show what would be generated
- Quiet mode: Support --quiet flag, suppress all non-errors
- Directory configuration: --people-dir and --template-dir flags with current defaults (./people/, ./templates/)
- Config file: No config file, all settings via flags
- Help examples: Inline examples shown directly in --help output

### Claude's Discretion
- Error display format (compact vs detailed based on context)
- Exit code convention
- Spinner animation style
- Table column widths and formatting

</decisions>

<specifics>
## Specific Ideas

- Fuzzy matching for person names similar to git's "Did you mean?" suggestions
- Placeholder photo should be simple solid color square with "PHOTO" text (not a silhouette)
- Watch mode timestamps help distinguish which rebuild you're looking at
- Summary stats on validate gives confidence the CV is complete without generating

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-cli-commands*
*Context gathered: 2026-01-23*
