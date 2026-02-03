---
phase: quick-018
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/core/src/parser/cv-parser.ts
  - packages/templates/src/engine/filters.ts
  - packages/core/src/parser/__tests__/date-parsing.test.ts
  - packages/templates/src/engine/__tests__/filters.test.ts
autonomous: true

must_haves:
  truths:
    - "Year-only dates like '2001 - present' parse correctly in CV markdown"
    - "Year-only dates render as '2001' not 'Jan 2001' or '-'"
    - "Existing YYYY-MM dates continue to work unchanged"
  artifacts:
    - path: "packages/core/src/parser/cv-parser.ts"
      provides: "Updated date regex supporting YYYY format"
      contains: "\\d{4}(?:-\\d{2})?(?:-\\d{2})?"
    - path: "packages/templates/src/engine/filters.ts"
      provides: "formatDate filter handling year-only dates"
      contains: "YYYY"
    - path: "packages/core/src/parser/__tests__/date-parsing.test.ts"
      provides: "Unit tests for date parsing"
      min_lines: 30
  key_links:
    - from: "packages/core/src/parser/cv-parser.ts"
      to: "packages/templates/src/engine/filters.ts"
      via: "parsed date strings"
      pattern: "startDate|endDate"
---

<objective>
Fix year-only date rendering in CV generation.

Purpose: Currently dates like "2001 - heute" render as "-" because the parser regex requires YYYY-MM format. The janetzky CV has education entries with year-only dates that don't display.

Output: Working date parsing and rendering for year-only dates (YYYY), with tests to prevent regression.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@packages/core/src/parser/cv-parser.ts
@packages/templates/src/engine/filters.ts
@people/janetzky/cv.md (lines 610-640 show the year-only date issue)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update date parsing in cv-parser.ts to support year-only format</name>
  <files>packages/core/src/parser/cv-parser.ts</files>
  <action>
Update the date parsing regex patterns in three locations to support year-only (YYYY) format in addition to YYYY-MM and YYYY-MM-DD:

1. Line 194-195 in parseExperienceEntries:
   Change: `/^(\d{4}-\d{2}(?:-\d{2})?)\s*-\s*(.+)$/`
   To: `/^(\d{4}(?:-\d{2})?(?:-\d{2})?)\s*-\s*(.+)$/`

2. Line 257-258 in parseEducationEntries:
   Change: `/^(\d{4}-\d{2}(?:-\d{2})?)\s*-\s*(.+)$/`
   To: `/^(\d{4}(?:-\d{2})?(?:-\d{2})?)\s*-\s*(.+)$/`

3. Line 560 in parseProjectMeta:
   Change: `/^(\d{4}-\d{2}(?:-\d{2})?)\s*-\s*(.+)$/`
   To: `/^(\d{4}(?:-\d{2})?(?:-\d{2})?)\s*-\s*(.+)$/`

The regex change makes the month part optional with `(?:-\d{2})?` instead of requiring `-\d{2}`.
  </action>
  <verify>
Run: `bun run cvgen build janetzky --all`
Check output HTML contains "2001" in the date range for "Autodidaktische Softwarearchitektur" entry.
  </verify>
  <done>Year-only dates parsed and stored in startDate/endDate fields correctly.</done>
</task>

<task type="auto">
  <name>Task 2: Update formatDate filter to handle year-only strings</name>
  <files>packages/templates/src/engine/filters.ts</files>
  <action>
Update the formatDate filter (line 22-40) to detect year-only dates and format them appropriately:

1. After the present/heute check, add detection for year-only format:
   - If date matches `/^\d{4}$/` (exactly 4 digits), return just the year string
   - This prevents dayjs from formatting "2001" as "Jan 2001"

2. The updated filter logic should be:
   ```typescript
   if (!date) return '';

   // Handle "present" / "heute" for current positions
   const lowerDate = date.toLowerCase();
   if (lowerDate === 'present' || lowerDate === 'heute' || lowerDate === 'current') {
     return locale === 'de' ? 'heute' : 'Present';
   }

   // Year-only format (e.g., "2001") - return as-is
   if (/^\d{4}$/.test(date)) {
     return date;
   }

   const parsed = dayjs(date);
   if (!parsed.isValid()) return date;

   return parsed.locale(locale).format('MMM YYYY');
   ```
  </action>
  <verify>
Run: `bun run cvgen build janetzky --all`
Check the German output HTML shows "2001 - heute" for the education entry.
  </verify>
  <done>Year-only dates render as "2001" not "Jan 2001".</done>
</task>

<task type="auto">
  <name>Task 3: Add unit tests for year-only date parsing and formatting</name>
  <files>
    packages/core/src/parser/__tests__/date-parsing.test.ts
    packages/templates/src/engine/__tests__/filters.test.ts
  </files>
  <action>
Create two test files:

1. `packages/core/src/parser/__tests__/date-parsing.test.ts`:
   - Test parseEducationEntries with year-only dates
   - Test parseExperienceEntries with year-only dates
   - Test that YYYY-MM format still works
   - Test that YYYY-MM-DD format still works

2. `packages/templates/src/engine/__tests__/filters.test.ts`:
   - Test formatDate with year-only input "2001" returns "2001"
   - Test formatDate with YYYY-MM input "2024-01" returns "Jan 2024" (en) or "Jan. 2024" (de)
   - Test formatDate with "present" returns "Present" (en) or "heute" (de)
   - Test dateRange with year-only start/end

Use vitest (already in the project) for test runner. Follow existing test patterns in packages/cli/src/template/__tests__/.
  </action>
  <verify>
Run: `bun test packages/core/src/parser/__tests__/date-parsing.test.ts`
Run: `bun test packages/templates/src/engine/__tests__/filters.test.ts`
All tests pass.
  </verify>
  <done>Tests verify year-only date handling and prevent regression.</done>
</task>

</tasks>

<verification>
1. `bun run cvgen build janetzky --all` completes without error
2. German HTML output shows "2001 - heute" for "Autodidaktische Softwarearchitektur"
3. English HTML output shows "2001 - Present" for "Self-Taught Software Architecture"
4. Other dates (YYYY-MM format) still render correctly (e.g., "Sept. 2019 - heute")
5. All new tests pass
</verification>

<success_criteria>
- Year-only dates like `*2001 - present*` and `*2001 - heute*` parse and render correctly
- No regression in existing YYYY-MM date handling
- Tests exist to prevent future regression
- janetzky CV renders properly with "2001 - heute" visible
</success_criteria>

<output>
After completion, create `.planning/quick/018-fix-year-only-date-rendering-e-g-2001-he/018-SUMMARY.md`
</output>
