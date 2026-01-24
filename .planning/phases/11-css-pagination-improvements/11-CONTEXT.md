# Phase 11: CSS Pagination Improvements - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate pagination problems (orphaned headers, split entries, widow lines) through CSS fragmentation properties that work reliably in Puppeteer. This phase implements PAG-01 through PAG-07 from requirements.

</domain>

<decisions>
## Implementation Decisions

### Break Priority
- Template components should stay together — don't split logical units across pages
- Section titles always stick to section content
- Job entries: header + first bullets stay together, but long bullet lists can break mid-list
- Skill categories are atomic units, but can break between different categories
- Education entries: core info (degree + institution + dates) stays together, but long descriptions/coursework can split
- Certifications and awards are fully atomic — keep entire entry together
- Summary/About sections can break between paragraphs if multiple paragraphs
- Project entries: header stays with first items, but sub-item lists can break
- Same break rules apply regardless of CV section order (non-standard structures get same treatment)

### Header Proximity
- Section headers need at least 2 lines of content before a page break is allowed
- Sub-headers (job titles, education degrees) are less strict — just need some content
- If not enough room for header + 2 lines, push the header to the next page
- Section intro paragraphs stay with at least some list items that follow
- Small sections (Languages, References, Interests) treated independently — no grouping preference
- Job title + dates should be on same visual line; only wrap if title is too long

### Page Fill Preference
- Cleaner breaks preferred over maximizing page density
- Up to ~25% whitespace at bottom of page is acceptable for cleaner breaks
- Actively avoid near-empty final pages (< 20% filled) — try to fit content on fewer pages
- Minor spacing variations between sections are acceptable if it helps page breaks significantly
- Consistent spacing is baseline, but small adjustments OK when beneficial

### Edge Case Handling
- Very long single entries (15+ bullets): keep job header + first bullets together, break within bullet list
- Individual bullet points are atomic — never break mid-bullet (even if 4+ lines)
- When orphan/widow rules conflict with break-avoidance: orphan/widow wins (never have isolated single lines)
- For borderline page count: accept extra page with clean breaks over cramming to fit fewer pages
- Two-column layouts: each column paginates independently
- Tables: let browser/Puppeteer handle table pagination naturally

### Claude's Discretion
- Contact info / header section positioning (page 1 only vs. special treatment)
- Nested list handling (parent bullet + child proximity)
- Multi-role at same company layout
- Sidebar repetition on multi-page CVs (page 1 only vs. all pages)

</decisions>

<specifics>
## Specific Ideas

- "Template components should stay together" — think of each section element as a semantic unit
- "Contextual flow is preserved" — when bullets split, the reader should still understand the context
- Prioritize readability and professional appearance over aggressive page filling
- Accept minor visual spacing variations if they produce significantly cleaner page breaks

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-css-pagination-improvements*
*Context gathered: 2026-01-24*
