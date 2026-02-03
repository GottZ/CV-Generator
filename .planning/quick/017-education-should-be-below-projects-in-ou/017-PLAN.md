---
phase: quick-017
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/base/template.njk
  - templates/modern/template.njk
  - templates/classic/template.njk
  - templates/minimal/template.njk
autonomous: true

must_haves:
  truths:
    - "Projects section appears before Education section in all templates"
    - "Section order is: Summary > Experience > Projects > Education > Skills > Certifications"
  artifacts:
    - path: "templates/base/template.njk"
      provides: "Reordered sections"
      contains: "projects.*education"
    - path: "templates/modern/template.njk"
      provides: "Reordered sections"
      contains: "projects.*education"
    - path: "templates/classic/template.njk"
      provides: "Reordered sections"
      contains: "projects.*education"
    - path: "templates/minimal/template.njk"
      provides: "Reordered sections"
      contains: "projects.*education"
  key_links: []
---

<objective>
Reorder CV sections so Education appears below Projects in all template output.

Purpose: Current order is Summary > Experience > Education > Projects > Skills > Certifications. User wants Projects to appear before Education, making Education the penultimate section before Skills.

Output: All four templates updated with new section order.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@templates/base/template.njk
@templates/modern/template.njk
@templates/classic/template.njk
@templates/minimal/template.njk
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reorder sections in all templates</name>
  <files>
    templates/base/template.njk
    templates/modern/template.njk
    templates/classic/template.njk
    templates/minimal/template.njk
  </files>
  <action>
In each of the four template files, move the Projects section block ABOVE the Education section block.

Current order in main tag:
1. Summary section
2. Experience section
3. Education section (lines ~69-86 in base, ~52-60 in others)
4. Projects section (lines ~88-129 in base, ~62-70 in others)
5. Skills section
6. Certifications section

New order:
1. Summary section
2. Experience section
3. Projects section (move up)
4. Education section (move down)
5. Skills section
6. Certifications section

For each file:
- Cut the entire Projects section block (from `{# Projects section #}` comment through closing `{% endif %}`)
- Paste it BEFORE the Education section block
- Ensure proper spacing between sections is maintained
  </action>
  <verify>
Run `bun run cvgen build examples/alex-chen/cv.md --template modern --locale en -o /tmp/test-reorder.html` and verify in the output that Projects section appears before Education section.
  </verify>
  <done>
All four templates have Projects section appearing before Education section in the main content flow.
  </done>
</task>

</tasks>

<verification>
- Build a CV with `bun run cvgen build examples/alex-chen/cv.md --template modern --locale en -o /tmp/verify.html`
- Open /tmp/verify.html and confirm section order: Summary > Experience > Projects > Education > Skills > Certifications
- Repeat for classic and minimal templates to ensure consistency
</verification>

<success_criteria>
- All four templates (base, modern, classic, minimal) have Projects section before Education section
- CV builds successfully with no errors
- Generated HTML shows correct section ordering
</success_criteria>

<output>
After completion, create `.planning/quick/017-education-should-be-below-projects-in-ou/017-SUMMARY.md`
</output>
