---
phase: quick-021
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/_shared/partials/_print.css
autonomous: true

must_haves:
  truths:
    - "Skill pills in PDF output have vertical spacing between rows when they wrap"
    - "Skill pills do not appear cramped or overlapping vertically"
  artifacts:
    - path: "templates/_shared/partials/_print.css"
      provides: "line-height for .skill-list in print media"
      contains: ".skill-list.*line-height"
  key_links: []
---

<objective>
Fix skill pills vertical padding in modern theme print output by adding line-height to `.skill-list` container in print CSS.

Purpose: When skill pills wrap to multiple rows in PDF output, they currently have no vertical spacing because the print CSS converts flex layout to inline elements. Screen CSS uses `gap: var(--spacing-sm)` for spacing, but inline elements need line-height for vertical rhythm.

Output: Updated print CSS that provides consistent vertical spacing between skill pill rows.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@templates/_shared/partials/_print.css (lines 122-131 - current .skill-list and .skill print styles)
@templates/modern/styles.css (lines 294-307 - screen styles with flex gap for reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add line-height to .skill-list in print CSS for vertical spacing</name>
  <files>templates/_shared/partials/_print.css</files>
  <action>
In the `@media print` section, update the `.skill-list` rule (around line 123-125) to include `line-height: 2.2` (or similar value that provides ~10px vertical spacing between wrapped rows of 10pt text).

Current CSS:
```css
/* Skill lists */
.skill-list {
  display: block;
}
```

Updated CSS:
```css
/* Skill lists */
.skill-list {
  display: block;
  line-height: 2.2;
}
```

The line-height value of 2.2 on 10pt text creates approximately 12pt between baselines, which provides comfortable vertical spacing similar to the screen CSS `gap: var(--spacing-sm)` (10px). This is a standard technique for creating vertical rhythm with inline elements.

Note: The `.skill` elements remain `display: inline` which means margin-top/margin-bottom would not work. Line-height on the container is the correct approach for inline children.
  </action>
  <verify>
1. `grep -A3 '\.skill-list' templates/_shared/partials/_print.css` shows `line-height: 2.2`
2. Build a sample CV with multiple skills: `bun run cvgen build people/testuser --template modern --format pdf`
3. Open PDF and verify skill pills have visible vertical spacing between rows
  </verify>
  <done>
Skill pills in PDF output have proper vertical spacing between rows when they wrap to multiple lines.
  </done>
</task>

</tasks>

<verification>
- [ ] `line-height` added to `.skill-list` in `@media print` section
- [ ] Syntax valid - CSS file parses without errors
- [ ] PDF generation works with skills section
- [ ] Skill pills visually have spacing between rows (not cramped/overlapping)
</verification>

<success_criteria>
Skill pills (`.skill`) in PDF output display with proper vertical spacing between rows. When skills wrap to multiple lines, each row has comfortable padding similar to the screen layout.
</success_criteria>

<output>
After completion, create `.planning/quick/021-fix-skill-pills-vertical-padding-in-mode/021-SUMMARY.md`
</output>
