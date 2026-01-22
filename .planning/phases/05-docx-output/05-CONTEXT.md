# Phase 5: DOCX Output - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate Word documents (.docx) from CV data with proper Word styles for ATS parsing. Output should mirror PDF behavior: headers/footers, metadata, navigation structure. Uses native Word field codes for dynamic content. Creating or modifying templates is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Document Structure
- Mirror PDF output structure: same sections, same ordering
- Use Word built-in styles: Heading 1 for name, Heading 2 for sections, Normal for body
- Navigation Pane works automatically via Heading styles (no explicit TOC needed)

### Headers and Footers
- Match PDF footer format exactly: "Name - Page X of Y"
- i18n support: "Seite X von Y" for German locale
- Use native Word field codes (PAGE, NUMPAGES) — not VBA macros
- Footer format comes from template configuration (same as PDF)

### Metadata
- Include standard DOCX properties: title, author, subject, keywords
- Add generator reference (Creator/Application field)
- Claude's discretion on exact field mapping, following Word conventions

### Image Handling
- Embed images directly in DOCX (same as PDF approach)
- Maintain appropriate sizing for print

### Claude's Discretion
- Exact Word style definitions (font sizes, spacing, colors)
- Image DPI and compression settings
- Paragraph and section spacing within Word conventions
- Metadata field mapping to DOCX properties

</decisions>

<specifics>
## Specific Ideas

- "It should be quite similar to the PDF" — parity with PDF output is the goal
- Use "first party macros that don't require running macros" — i.e., native Word field codes (PAGE, NUMPAGES), not VBA

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-docx-output*
*Context gathered: 2026-01-22*
