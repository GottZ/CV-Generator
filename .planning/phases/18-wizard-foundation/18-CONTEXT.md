# Phase 18: Wizard Foundation - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive CLI wizards for creating and modifying CVs through guided prompts. Users can create a full CV from scratch via `wizard init` or add individual sections via `wizard add`. The wizard handles input validation, sensible defaults, clean exit behavior, and confirmation before saving. AI enhancement of entered content is Phase 19 scope.

</domain>

<decisions>
## Implementation Decisions

### Question Flow
- Menu-driven navigation — user picks which section to fill next
- Breadcrumb escape — can back out mid-section to return to menu
- "Save partial progress?" prompt when backing out mid-section
- "Add another?" prompt after completing each entry + menu shows count (e.g., "Experience (2 added)")
- Checkmark-style progress in menu: ✓ Experience (2) | ✗ Education | ○ Skills (optional)
- Quick/detailed mode offered at start — quick skips optional fields
- Fresh preferences each run — no stored wizard preferences
- `wizard add` commands match the same flow as `wizard init` for consistency

### Validation Timing
- Immediate validation — errors appear as soon as user presses Enter on each field
- Re-prompt on first error; if same invalid value submitted again, continue but track the issue
- Full validation stack: format + content + ATS warnings
- ATS warnings require explicit acknowledgment before continuing

### Empty/Skip Handling
- Empty Enter to skip optional fields
- Required fields marked with asterisk (*) or (required)
- All sections always shown in menu (optional ones marked)
- Minimum viable CV: contact info + at least one section (experience, education, or skills)
- Track explicitly skipped fields vs never-visited fields
- Defaults shown inline: "End date (default: Present):" — Enter accepts default
- At summary: warn if critical optional sections are missing (e.g., no Skills section)
- When editing existing CV: show existing values as defaults, Enter keeps them

### Summary Presentation
- Structured preview format showing exactly what will be written
- Scrollable output for long CVs (no pagination)
- Three actions: Confirm / Edit (returns to menu) / Cancel
- Issues shown inline next to relevant fields in summary

### Claude's Discretion
- Exact prompt wording and help text
- Which sections count as "critical optional" for warnings
- Progress spinner implementation during file writes
- Keyboard navigation specifics beyond arrow keys

</decisions>

<specifics>
## Specific Ideas

- Checkmarks in menu should feel like a todo list — clear visual of what's done vs pending
- Quick mode should feel like express checkout — minimal friction for users who just want basics
- When editing existing CVs, pre-filling fields should feel safe — user knows they won't lose existing data by accident

</specifics>

<deferred>
## Deferred Ideas

- AI enhancement of wizard-entered content — Phase 19 (WIZ-20)
- STAR-method guided questions for experience bullets — Phase 19 (WIZ-19)

</deferred>

---

*Phase: 18-wizard-foundation*
*Context gathered: 2026-01-26*
