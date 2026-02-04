---
phase: quick-023
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/modern/styles.css
autonomous: true

must_haves:
  truths:
    - "No horizontal line below the header/contact section"
    - "No horizontal line below the last experience entry's tech stack"
    - "No horizontal line below the last project entry's tech stack"
    - "Horizontal lines still appear between experience entries"
    - "Horizontal lines still appear between project entries"
  artifacts:
    - path: "templates/modern/styles.css"
      provides: "Modern theme CSS without redundant horizontal lines"
      contains: ":last-child"
  key_links:
    - from: "templates/modern/styles.css"
      to: "HTML structure"
      via: ".entry:last-child .job-tech-stack, .entry:last-child .project-tech-stack"
      pattern: "entry:last-child.*border-bottom.*none"
---

<objective>
Remove redundant horizontal lines from the modern theme to improve visual clarity.

Purpose: The modern theme currently has visual redundancy:
1. A thick horizontal line below the header AND section titles both have lines - double separation
2. Every experience/project entry's tech stack has a border-bottom line, but the last entry in each section doesn't need this separator (nothing follows it within the section)

Output: Clean modern theme CSS with appropriate horizontal line usage
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
  <name>Task 1: Remove header border-bottom</name>
  <files>templates/modern/styles.css</files>
  <action>
Remove the `border-bottom` property from the `.contact` selector (around line 124).

The contact header currently has:
```css
.contact {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: var(--divider-width) solid var(--color-accent);  /* REMOVE THIS */
}
```

This line is redundant because the first section (Summary, Experience, etc.) already has its own horizontal line below the h2 title via:
```css
h2 {
  border-bottom: var(--divider-width) solid var(--color-accent);
}
```

Keep the margin-bottom and padding-bottom for spacing, just remove the border.
  </action>
  <verify>Visual inspection of generated CV shows no thick line directly below header</verify>
  <done>Contact section no longer has border-bottom property</done>
</task>

<task type="auto">
  <name>Task 2: Remove border-bottom from last entry's tech stack</name>
  <files>templates/modern/styles.css</files>
  <action>
Add CSS rules to remove the border-bottom from tech-stack elements when they are inside the last entry of experience or projects sections.

Current CSS (lines 327-337):
```css
.job-tech-stack {
  margin-top: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.project-tech-stack {
  margin-top: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}
```

Add the following rules AFTER the existing .job-tech-stack and .project-tech-stack rules:

```css
/* Remove border from tech stack in last entry (no separator needed at section end) */
.entry:last-child .job-tech-stack,
.entry:last-child .project-tech-stack {
  border-bottom: none;
  padding-bottom: 0;
}
```

This targets the tech-stack div when it's inside the last .entry within a section. The HTML structure is:
- section.experience > article.entry.experience-entry > div.tech-stack.job-tech-stack
- section.projects > article.entry.project-entry > div.tech-stack.project-tech-stack
  </action>
  <verify>Visual inspection shows horizontal lines between entries but not after the last entry in experience/projects sections</verify>
  <done>Last entry in experience and projects sections has no trailing border below tech stack</done>
</task>

</tasks>

<verification>
1. Build a CV using the modern template:
   ```bash
   bun run cvgen build examples/alex-chen/cv.md --template modern --format html
   ```
2. Open the generated HTML and verify:
   - No thick blue line below the header/contact section
   - Horizontal lines still appear between experience entries (separating them visually)
   - NO horizontal line after the last experience entry's tech stack
   - Horizontal lines still appear between project entries
   - NO horizontal line after the last project entry's tech stack

3. Generate PDF and verify same behavior in print:
   ```bash
   bun run cvgen build examples/alex-chen/cv.md --template modern --format pdf
   ```
</verification>

<success_criteria>
- Contact section has no border-bottom
- Tech stack borders only appear between entries, not after the last entry
- Visual hierarchy is cleaner with less redundant separation
- No regression in other themes (changes are scoped to modern/styles.css)
</success_criteria>

<output>
After completion, create `.planning/quick/023-remove-redundant-horizontal-lines-modern-theme/023-SUMMARY.md`
</output>
