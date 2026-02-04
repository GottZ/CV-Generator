---
phase: quick-020
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - templates/_shared/partials/_print.css
autonomous: true

must_haves:
  truths:
    - "Date and title text visually align on same baseline in PDF output"
    - "Fix applies only to print media, screen layout unchanged"
  artifacts:
    - path: "templates/_shared/partials/_print.css"
      provides: "Print-specific baseline alignment fix for entry headers"
      contains: "vertical-align"
  key_links:
    - from: "templates/_shared/partials/_print.css"
      to: "templates/modern/styles.css"
      via: "@media print override"
      pattern: "@media print"
---

<objective>
Fix the vertical alignment of dates in the modern theme PDF output so they appear on the same visual baseline as entry titles.

Purpose: The date text (e.g., "Mar 2020 - Present") appears slightly higher than the job/education titles in PDF output because the floated date element doesn't participate in baseline alignment with the inline h3.

Output: Updated print CSS that aligns dates with title baselines using vertical-align or line-height adjustment.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@templates/_shared/partials/_print.css
@templates/modern/styles.css
</context>

<analysis>
**Root cause identified:**

In print mode (lines 106-117 of _print.css):
- `.entry-header` is `display: block` (not flexbox)
- `.entry-title` (h3) is `display: inline` with font-size 12pt
- `.date-range` is `display: inline; float: right` with font-size 10pt

The problem: When an element is floated, it is removed from the normal flow and doesn't baseline-align with adjacent inline content. The smaller-font date sits at the top of its containing block, not aligned with the h3 text baseline.

**Solution:**

Since `.date-range` is floated, we cannot use `vertical-align` on it (it has no effect on floated elements). Instead, we need to give the `.date-range` a consistent top offset or line-height that matches the h3's line position.

The h3 (entry-title) has font-size 12pt and the date-range has font-size 10pt. With a line-height of 1.6 (from body), the difference in visual baseline can be addressed by:

1. Setting `line-height` on `.date-range` in print to match the h3's effective line height
2. Or using `margin-top` on the floated date to push it down to align with the title baseline

The cleanest fix is to set the same `line-height` on `.date-range` as the h3 element has, ensuring they share the same line box height and thus the same baseline position.
</analysis>

<tasks>

<task type="auto">
  <name>Task 1: Fix date baseline alignment in print CSS</name>
  <files>templates/_shared/partials/_print.css</files>
  <action>
In the `@media print` section, update the `.date-range` rule (around line 114-117) to include `line-height` that matches the h3 element's line-height.

The h3 inherits `line-height: 1.6` from body. The date-range at 10pt with line-height 1.6 gives a different visual height than h3 at 12pt with line-height 1.6.

To align baselines when using float, set `.date-range` line-height to match the h3's computed line-height. Since h3 is 12pt * 1.6 = 19.2pt and date is 10pt, we need date line-height of 19.2pt / 10pt = 1.92 (approximately 1.9 or 2).

However, the simpler and more reliable approach is to use the same absolute line-height value as the h3:

```css
.date-range {
  display: inline;
  float: right;
  line-height: 1.6;  /* Match h3 line-height for baseline alignment */
}
```

Wait - that won't work because different font sizes with same relative line-height still have different baselines.

The actual fix is to ensure both elements have the same line-box height. Since the title (h3) uses font-size 12pt and date uses 10pt, and both have the same line-height multiplier, the visual misalignment is about 2pt worth of offset.

Add `margin-top` or `padding-top` to the floated `.date-range` to push it down:

```css
.date-range {
  display: inline;
  float: right;
  margin-top: 0.15em;  /* Align with h3 baseline */
}
```

The value 0.15em (relative to 10pt = 1.5pt) should bring the smaller date text down to align with the 12pt title baseline.

Test with the generated PDF and adjust if needed.
  </action>
  <verify>
Build the jane-developer example and visually inspect the PDF:
```bash
bun run cvgen build --name jane-developer --template modern --locale en
```
Open the PDF and verify that:
- "Senior Software Engineer at TechCorp GmbH" and "Mar 2020 - Present" are on the same visual baseline
- "Software Engineer at StartupXYZ" and "Jun 2017 - Feb 2020" are on the same visual baseline
- Education dates align with degree titles
  </verify>
  <done>Date text visually aligns with title text on the same baseline in PDF output for all entry types (experience, education, projects, certifications)</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Print CSS fix for date vertical alignment in PDF output</what-built>
  <how-to-verify>
1. Open the generated PDF at `examples/jane-developer/output/jane-developer_modern_en.pdf`
2. Look at the WORK EXPERIENCE section
3. Verify "Senior Software Engineer at TechCorp GmbH" and "Mar 2020 - Present" are on the same visual baseline
4. Check EDUCATION section for similar alignment
5. Compare with screen view (HTML) to ensure print-only change didn't affect screen rendering
  </how-to-verify>
  <resume-signal>Type "approved" or describe alignment issues to adjust</resume-signal>
</task>

</tasks>

<verification>
- PDF dates align with entry titles visually (same baseline)
- Screen/HTML layout unchanged (flexbox with align-items: baseline still works)
- All entry types (experience, education, projects, certifications) have aligned dates
</verification>

<success_criteria>
- Date text and title text appear on the same visual line in PDF output
- No regression in screen rendering
- Fix uses print-specific CSS only
</success_criteria>

<output>
After completion, create `.planning/quick/020-fix-modern-theme-pdf-date-vertical-align/020-SUMMARY.md`
</output>
