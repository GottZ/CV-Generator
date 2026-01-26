# Phase 19: Wizard Non-Interactive & Integration - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend wizard commands to work in CI/CD pipelines (non-interactive mode with flags/JSON input) and optionally enhance content with AI during wizard flow. TTY detection, STAR-method questioning for experience bullets, and integration with existing AI enhancement infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Non-interactive flag design
- All required fields mandatory when using --no-input (no smart defaults)
- JSON and flags must not conflict (error if both provide same field with different values)
- Error output format respects --json flag (JSON errors if --json, human-readable otherwise)
- --json-input supports stdin with `-` (e.g., `--json-input -` reads from stdin)
- Array support in --json-input (can add multiple experiences/skills in single call)
- Contact info only minimum for init (can create CV with just contact, other sections optional)
- Add --dry-run flag to validate without writing files
- JSON schema exposed via `--help json` subcommand and documented in docs

### TTY detection behavior
- Auto-switch to non-interactive mode when non-TTY detected (silently attempt, fail if required flags missing)
- Standard exit codes: 0 success, 1 general error, 2 usage/validation error
- Add --force-interactive flag to override non-TTY detection
- Progress/status messages to stderr (stdout reserved for final output/JSON)

### STAR-method questioning
- Combined prompt with hints: single prompt with STAR guidance ("Describe your achievement - think: situation, what you did, outcome")
- Show example bullets inline before each bullet prompt (1-2 examples relevant to role type)
- Keep adding bullets until done (no fixed limit, prompt "Add another bullet?" until user declines)
- JSON input supports both plain bullet strings and STAR structured objects (auto-detect format)

### AI enhancement integration
- --enhance triggers AI suggestions after each section (not at the end)
- If AI unavailable, prompt to continue: "AI unavailable: [reason]. Continue without enhancement?"
- Full review flow (same accept/edit/skip/regenerate from Phase 17) for enhanced content
- Non-interactive mode with --enhance auto-accepts all AI suggestions
- All wizard commands support --enhance (init and all add commands)
- --enhance is all-or-nothing (no --enhance-type granular control)
- Always show before/after diff for enhanced content (reuse Phase 16/17 diff display)
- --enhance works with --job for job-tailored enhancements during wizard

### Claude's Discretion
- Testing approach for non-interactive mode without API tokens
- Specific STAR example bullets to show inline
- JSON schema structure details
- Error message wording

</decisions>

<specifics>
## Specific Ideas

- Stdin support enables piping from other tools: `cat experience.json | cvgen wizard add experience jane --json-input -`
- STAR hints should feel encouraging, not prescriptive: guide users to better bullets without being rigid
- The --force-interactive flag is an escape hatch for advanced users who know what they're doing

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 19-wizard-non-interactive*
*Context gathered: 2026-01-26*
