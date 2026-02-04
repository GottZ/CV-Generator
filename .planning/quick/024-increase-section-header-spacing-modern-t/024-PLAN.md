---
phase: quick-024
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/modern/styles.css
autonomous: true

must_haves:
  truths:
    - "Section headers have visible breathing room from previous content"
    - "Visual hierarchy is improved with clear section boundaries"
    - "Spacing is consistent across all section types"
  artifacts:
    - path: "templates/modern/styles.css"
      provides: "Updated section header spacing"
      contains: "margin-top"
  key_links: []
---

<objective>
Increase visual distance between section headers and the preceding section content in the modern CV theme.

Purpose: The current spacing makes section headers appear too cramped against the previous section's content, reducing visual hierarchy and readability.

Output: Modified modern theme CSS with increased top margin on section headers.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@templates/modern/styles.css
</context>

<analysis>
Current spacing structure:
- `.section` has `margin-bottom: var(--spacing-lg)` (28px) - gap after section
- `h2` has `margin-bottom: var(--spacing-md)` (18px) - gap after header
- No explicit `margin-top` on sections or h2

The issue: 28px between end of previous section and start of next section header is insufficient for clear visual separation.

Solution: Add `margin-top` to `h2` elements within sections (except the first section which follows the contact header). This creates additional breathing room above section headers without affecting the gap between header and its content.

Target spacing: Use `var(--spacing-xl)` (36px) for margin-top on h2, creating ~64px total separation (28px section margin + 36px h2 margin) which provides generous whitespace consistent with modern theme design philosophy.
</analysis>

<tasks>

<task type="auto">
  <name>Task 1: Add top margin to section headers</name>
  <files>templates/modern/styles.css</files>
  <action>
In the `h2` rule block (around line 177), add `margin-top: var(--spacing-xl);` to increase the space above section headers.

Then add a new rule to remove the top margin from the first section's h2 (which follows the contact header and doesn't need extra space):

```css
/* First section doesn't need extra top margin (follows contact header) */
.section:first-of-type h2 {
  margin-top: 0;
}
```

This ensures:
1. All section headers get generous top spacing
2. The first section header (after contact) doesn't have unnecessary whitespace
3. Uses existing CSS variable for consistency
  </action>
  <verify>
1. Open generated PDF and verify section headers have increased visual separation from previous content
2. Verify first section (likely Profile/Summary) doesn't have excessive gap after contact header
3. Run `bun run cvgen build alex-chen modern` and visually inspect result
  </verify>
  <done>
Section headers have increased top margin (36px via --spacing-xl), creating clear visual separation between sections while maintaining proper spacing after the contact header.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Increased section header spacing in modern theme</what-built>
  <how-to-verify>
1. Run: `bun run cvgen build alex-chen modern`
2. Open the generated PDF in `examples/alex-chen/output/alex-chen-modern.pdf`
3. Verify:
   - Section headers have visible breathing room from previous section content
   - First section (Profile) has appropriate spacing from contact header
   - Overall visual hierarchy is improved
   - Spacing is consistent across Experience, Projects, Education, Skills, Certifications
  </how-to-verify>
  <resume-signal>Type "approved" if spacing looks good, or describe needed adjustments</resume-signal>
</task>

</tasks>

<verification>
- [ ] `bun run cvgen build alex-chen modern` completes without errors
- [ ] PDF shows increased visual separation between sections
- [ ] First section maintains proper proximity to contact header
- [ ] Spacing is consistent and professional
</verification>

<success_criteria>
Modern theme section headers have visibly increased spacing from previous section content, improving visual hierarchy without excessive whitespace.
</success_criteria>

<output>
After completion, create `.planning/quick/024-increase-section-header-spacing-modern-t/024-SUMMARY.md`
</output>
