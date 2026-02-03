---
phase: quick-008
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/_shared/partials/_print.css
autonomous: true

must_haves:
  truths:
    - "Skill bubbles in PDF output never break mid-word"
    - "Skills that don't fit on current line wrap entirely to next line"
  artifacts:
    - path: "templates/_shared/partials/_print.css"
      provides: "Print styles with white-space: nowrap for skills"
      contains: "white-space: nowrap"
  key_links:
    - from: "templates/_shared/partials/_print.css"
      to: ".skill class in print media"
      via: "white-space: nowrap rule"
      pattern: "\\.skill[^}]*white-space:\\s*nowrap"
---

<objective>
Fix skill bubbles breaking mid-word in PDF/print output by adding `white-space: nowrap` to the `.skill` class in print CSS.

Purpose: Skills should wrap to the next line as complete units, not break mid-word (e.g., "Kuber-\nnetes" is bad, "Kubernetes" on next line is good).

Output: Updated print CSS that prevents word-breaking in skill bubbles.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@templates/_shared/partials/_print.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add white-space: nowrap to .skill in print CSS</name>
  <files>templates/_shared/partials/_print.css</files>
  <action>
In the `@media print` block, find the `.skill` rule (around line 124-127) that currently has:
```css
.skill {
  display: inline;
  margin-right: 8px;
}
```

Add `white-space: nowrap;` to prevent word-breaking:
```css
.skill {
  display: inline;
  margin-right: 8px;
  white-space: nowrap;
}
```

This ensures skill text stays on one line and wraps as a complete unit to the next line if it doesn't fit, rather than breaking mid-word.
  </action>
  <verify>
1. `grep -A3 '\.skill {' templates/_shared/partials/_print.css | grep 'white-space'` shows the new rule
2. Generate a test PDF: `cd /workspace && bun run generate people/alex-chen -t modern -l en` and verify skill bubbles don't break mid-word
  </verify>
  <done>The .skill class in print CSS has white-space: nowrap, preventing mid-word breaks in PDF output</done>
</task>

</tasks>

<verification>
1. Print CSS contains `white-space: nowrap` in the `.skill` rule
2. Visual inspection of generated PDF shows skills wrapping to next line instead of breaking
</verification>

<success_criteria>
- Skill bubbles in PDF never break mid-word
- Skills that exceed available width wrap entirely to the next line
- No regression in skill bubble appearance
</success_criteria>

<output>
After completion, create `.planning/quick/008-fix-skill-bubbles-word-break-in-print-cs/008-SUMMARY.md`
</output>
