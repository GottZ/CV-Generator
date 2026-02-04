---
phase: quick-019
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/_shared/partials/_print.css
autonomous: true

must_haves:
  truths:
    - "Technology tags (.tech-tag) do not break mid-word in PDF output"
    - "Tags wrap to next line as complete units, not partial words"
  artifacts:
    - path: "templates/_shared/partials/_print.css"
      provides: "white-space: nowrap for .tech-tag in print media"
      contains: ".tech-tag.*white-space.*nowrap"
  key_links: []
---

<objective>
Prevent technology tags from breaking mid-word in PDF output by adding `white-space: nowrap` to `.tech-tag` elements in print CSS.

Purpose: Technology tags (e.g., "Kubernetes", "TypeScript") appear below experience entries and should stay intact as visual units. Currently, they can break mid-word when the line wraps, causing "Kuber-\nnetes" or similar awkward breaks.

Output: Updated print CSS that keeps tech tags as atomic units.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@templates/_shared/partials/_print.css (lines 131-138 - current .tech-tag print styles)
@templates/_shared/macros/entry.njk (lines 16-22, 61-67 - tech-tag HTML structure)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add white-space: nowrap to .tech-tag in print CSS</name>
  <files>templates/_shared/partials/_print.css</files>
  <action>
In the `@media print` section, update the `.tech-tag` rule (around line 135-138) to include `white-space: nowrap`.

Current CSS:
```css
.tech-tag {
  display: inline;
  margin-right: 8px;
}
```

Updated CSS:
```css
.tech-tag {
  display: inline;
  margin-right: 8px;
  white-space: nowrap;
}
```

This mirrors the existing `.skill` rule which already has `white-space: nowrap` (lines 124-128).
  </action>
  <verify>
1. `grep -A3 '\.tech-tag' templates/_shared/partials/_print.css` shows `white-space: nowrap`
2. Build a sample CV with tech stack: `bun run cvgen build examples/jane-developer --template modern --format pdf`
3. Open PDF and verify tech tags like "TypeScript", "Kubernetes", "PostgreSQL" appear as complete words
  </verify>
  <done>
Technology tags in PDF output remain intact as single units without mid-word breaks.
  </done>
</task>

</tasks>

<verification>
- [ ] `white-space: nowrap` added to `.tech-tag` in `@media print` section
- [ ] Syntax valid - CSS file parses without errors
- [ ] PDF generation works with tech stack entries
- [ ] Tech tags visually wrap as complete units, not mid-word
</verification>

<success_criteria>
Technology tags (`.tech-tag`) in PDF output display as complete words. When line wrapping occurs, entire tags move to the next line rather than breaking mid-word.
</success_criteria>

<output>
After completion, create `.planning/quick/019-prevent-technology-tags-from-breaking-in/019-SUMMARY.md`
</output>
