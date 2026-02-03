---
phase: quick
plan: 007
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/templates/src/engine/filters.ts
autonomous: true

must_haves:
  truths:
    - "German CV output shows German month names (Januar, Februar, Marz, etc.)"
    - "English CV output continues to show English month names"
    - "Date ranges like 'Apr 2022 - Jan 2026' render as 'Apr. 2022 - Jan. 2026' in German"
  artifacts:
    - path: "packages/templates/src/engine/filters.ts"
      provides: "Locale-aware date formatting"
      contains: "dayjs().locale"
  key_links:
    - from: "packages/templates/src/engine/filters.ts"
      to: "dayjs/locale/de"
      via: "dynamic import"
      pattern: "import.*dayjs/locale"
---

<objective>
Fix German date localization in CV rendering

Purpose: The CV generator currently shows English month names (Jan, Feb, Mar) even when rendering German locale CVs. This needs to use dayjs locale support to show German month names (Jan., Feb., Marz) for German output.

Output: Updated filters.ts that correctly localizes date formatting based on the locale parameter.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@packages/templates/src/engine/filters.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dayjs locale support to date formatting</name>
  <files>packages/templates/src/engine/filters.ts</files>
  <action>
  Update the date formatting in filters.ts to properly use dayjs locales:

  1. Import the German locale at the top of the file:
     ```typescript
     import 'dayjs/locale/de';
     ```

  2. In the formatDate filter, use the locale parameter with dayjs:
     Change line 38 from:
     ```typescript
     return parsed.format('MMM YYYY');
     ```
     To:
     ```typescript
     return parsed.locale(locale).format('MMM YYYY');
     ```

  The dayjs library supports locale-aware formatting when you call .locale() before .format(). The 'de' locale file provides German month names (Jan., Feb., Marz, Apr., Mai, Juni, Juli, Aug., Sept., Okt., Nov., Dez.).

  Note: dayjs locales are already available in node_modules/dayjs/locale/ - no new dependencies needed.
  </action>
  <verify>
  1. Run the CV generator for janetzky with German locale:
     ```bash
     cd /workspace && bun run cli render people/janetzky --locale de --format html
     ```
  2. Check the output HTML for German month names:
     ```bash
     grep -E "class=\"date-range\"" people/janetzky/output/janetzky_modern_de.html | head -5
     ```
  3. Verify English output still works:
     ```bash
     cd /workspace && bun run cli render people/janetzky --locale en --format html
     grep -E "class=\"date-range\"" people/janetzky/output/janetzky_modern_en.html | head -5
     ```
  </verify>
  <done>
  - German CV shows German month abbreviations (Jan., Feb., Marz, Apr., Mai, Juni, Juli, Aug., Sept., Okt., Nov., Dez.)
  - English CV continues showing English month abbreviations (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec)
  - No test failures
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify fix and run tests</name>
  <files>packages/templates/src/engine/filters.ts</files>
  <action>
  Run the full test suite to ensure no regressions:

  1. Run template package tests:
     ```bash
     cd /workspace && bun test packages/templates
     ```

  2. Run full test suite:
     ```bash
     cd /workspace && bun test
     ```

  If any tests fail related to date formatting, they may have hardcoded English expectations. Update those tests to account for locale-aware formatting or use a fixed locale in the test setup.
  </action>
  <verify>
  - `bun test` passes with no failures
  - No regressions in date formatting for other locales
  </verify>
  <done>
  - All tests pass
  - German date localization verified working
  - English date formatting unchanged
  </done>
</task>

</tasks>

<verification>
1. Generate German CV: `bun run cli render people/janetzky --locale de`
2. Check HTML output for German months in date ranges
3. Generate English CV and verify English months preserved
4. Run full test suite: `bun test`
</verification>

<success_criteria>
- German CV output shows localized month names (Jan., Feb., Marz, etc.)
- English CV output shows English month names (Jan, Feb, Mar, etc.)
- All existing tests pass
- No new dependencies required (dayjs locales bundled)
</success_criteria>

<output>
After completion, create `.planning/quick/007-fix-german-date-localization-in-cv-rende/007-SUMMARY.md`
</output>
