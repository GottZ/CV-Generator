---
phase: quick-016
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/_shared/macros/entry.njk
  - templates/modern/styles.css
autonomous: true

must_haves:
  truths:
    - "Project outcome appears above tech tags in rendered output"
    - "Horizontal line appears below project tags in modern template"
  artifacts:
    - path: "templates/_shared/macros/entry.njk"
      provides: "Reordered project entry layout"
      contains: "project-outcome.*tech-stack"
    - path: "templates/modern/styles.css"
      provides: "Project tech stack styling with border"
      contains: "project-tech-stack"
  key_links:
    - from: "templates/_shared/macros/entry.njk"
      to: "templates/modern/styles.css"
      via: "project-tech-stack CSS class"
      pattern: "project-tech-stack"
---

<objective>
Modern theme: move outcome above tags in projects section, add horizontal line below tags

Purpose: Visual consistency with work experience section - both sections should have tech tags at the bottom with a horizontal separator line below them.

Output: Updated macro with reordered elements and CSS styling for project tech stack border.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@templates/_shared/macros/entry.njk
@templates/modern/styles.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reorder project entry - outcome above tags, add tech-stack class</name>
  <files>templates/_shared/macros/entry.njk</files>
  <action>
In the `projectEntry` macro, reorder the elements so outcome appears BEFORE techStack:

Current order (lines 55-67):
1. description
2. techStack (tags)
3. outcome
4. links

New order:
1. description
2. outcome
3. techStack (tags) - add class "project-tech-stack" to the tech-stack div
4. links

Specifically:
- Move the `{% if project.outcome %}` block (lines 63-66) to appear BEFORE the `{% if project.techStack %}` block
- Add `project-tech-stack` class to the tech-stack div: `<div class="tech-stack project-tech-stack">`
  </action>
  <verify>Visually inspect the macro - outcome block should be before techStack block, tech-stack div should have both classes</verify>
  <done>Project entry macro has outcome above tags and tech-stack div has project-tech-stack class</done>
</task>

<task type="auto">
  <name>Task 2: Add CSS for project tech stack horizontal line</name>
  <files>templates/modern/styles.css</files>
  <action>
Add CSS rule for `.project-tech-stack` similar to the existing `.job-tech-stack` styling (lines 327-331).

Add after the existing `.job-tech-stack` rule (around line 331):

```css
.project-tech-stack {
  margin-top: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}
```

This mirrors the job-tech-stack styling which adds:
- margin-top for spacing from content above
- padding-bottom for spacing before the border
- border-bottom for the horizontal line separator
  </action>
  <verify>CSS file contains .project-tech-stack rule with border-bottom property</verify>
  <done>Modern template styles include horizontal line below project tags</done>
</task>

<task type="auto">
  <name>Task 3: Verify rendering with build command</name>
  <files></files>
  <action>
Run the build command for the modern template to verify the changes render correctly:

```bash
bun run cvgen build janetzky --template modern --locale en
```

Check that:
1. No rendering errors occur
2. The generated HTML shows outcome before tech tags in project entries
  </action>
  <verify>Build completes without errors, inspect generated HTML shows correct element order</verify>
  <done>Modern template builds successfully with updated project layout</done>
</task>

</tasks>

<verification>
- Build modern template: `bun run cvgen build janetzky --template modern --locale en`
- Inspect generated HTML: outcome div should appear before tech-stack div in project entries
- Visual check: Project tags should have horizontal line below them (matching work experience style)
</verification>

<success_criteria>
- Project outcome appears above tech tags in all rendered modern template output
- Horizontal line separator appears below project tags (consistent with work experience section)
- No visual regression in other templates (shared macro change should be backward compatible)
</success_criteria>

<output>
After completion, create `.planning/quick/016-modern-theme-move-outcome-above-tags-add/016-SUMMARY.md`
</output>
