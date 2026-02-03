---
phase: quick-015
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/modern/styles.css
autonomous: true

must_haves:
  truths:
    - "Horizontal line in work experience appears BELOW technologies, not above"
    - "Visual separation between experience entries is maintained"
  artifacts:
    - path: "templates/modern/styles.css"
      provides: "Updated .job-tech-stack styling with border-bottom instead of border-top"
      contains: "border-bottom"
  key_links:
    - from: "templates/modern/styles.css"
      to: ".job-tech-stack class"
      via: "CSS rule modification"
      pattern: "border-bottom.*solid.*color-border"
---

<objective>
Fix the horizontal line position in the modern template's work experience section - the line should appear BELOW the technologies, not above them.

Purpose: Improve visual hierarchy in the modern CV template by placing the separator line after the tech stack, creating cleaner visual separation between experience entries.

Output: Updated modern template CSS with corrected line positioning.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@templates/modern/styles.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix .job-tech-stack border position</name>
  <files>templates/modern/styles.css</files>
  <action>
Modify the `.job-tech-stack` CSS rule (lines 327-331) to move the horizontal line from above the technologies to below them.

Current CSS:
```css
.job-tech-stack {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
}
```

Change to:
```css
.job-tech-stack {
  margin-top: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}
```

Changes:
1. `padding-top` -> `padding-bottom` (padding should be on the side with the border)
2. `border-top` -> `border-bottom` (line goes below instead of above)
  </action>
  <verify>
1. Run `bun run cvgen build janetzky -t modern -l en` to regenerate the CV
2. Open the generated HTML in browser and verify:
   - The horizontal line appears BELOW each tech stack (not above)
   - Experience entries are still visually separated
   - No styling regressions in other areas
  </verify>
  <done>
The horizontal line in work experience entries appears below the technologies section instead of above it in the modern template.
  </done>
</task>

</tasks>

<verification>
1. Visual inspection of generated HTML shows border-bottom on .job-tech-stack
2. `grep "border-bottom" templates/modern/styles.css` returns the .job-tech-stack rule
3. The change only affects the modern template (other templates unchanged)
</verification>

<success_criteria>
- Modern template work experience entries show horizontal line BELOW technologies
- Visual separation between experience entries is maintained
- No styling regressions in print CSS or other sections
</success_criteria>

<output>
After completion, create `.planning/quick/015-fix-modern-theme-horizontal-line-positio/015-SUMMARY.md`
</output>
