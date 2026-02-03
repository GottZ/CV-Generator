---
phase: quick
plan: 013
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/templates/src/i18n/en.ts
  - packages/templates/src/i18n/de.ts
  - packages/core/src/parser/sections.ts
  - packages/cli/src/lib/scaffolder.ts
  - people/janetzky/cv.md
  - people/testuser/cv.md
  - examples/jane-developer/cv.md
  - examples/alex-chen/cv.md
autonomous: true

must_haves:
  truths:
    - "CV section header displays 'Profile' in English templates"
    - "CV section header displays 'Profil' in German templates"
    - "Parser recognizes both Profile/Profil as valid section headers"
    - "New CVs scaffolded via wizard use Profile/Profil"
  artifacts:
    - path: "packages/templates/src/i18n/en.ts"
      provides: "English Profile translation"
      contains: "summary: 'Profile'"
    - path: "packages/templates/src/i18n/de.ts"
      provides: "German Profil translation"
      contains: "summary: 'Profil'"
    - path: "packages/core/src/parser/sections.ts"
      provides: "Parser mappings for profile/profil"
      contains: "profile"
    - path: "packages/cli/src/lib/scaffolder.ts"
      provides: "Example markdown with Profile/Profil headers"
      contains: "## Profile"
  key_links:
    - from: "packages/templates/src/i18n/en.ts"
      to: "rendered CV output"
      via: "i18n section header lookup"
      pattern: "summary.*Profile"
---

<objective>
Rename the Summary/Zusammenfassung CV category to Profile/Profil across all template code and CV files.

Purpose: "Profile" is more industry-standard terminology for the brief professional summary section at the top of a CV.
Output: All templates render "Profile" (EN) / "Profil" (DE) as section header, all existing CV files updated.
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@packages/templates/src/i18n/en.ts
@packages/templates/src/i18n/de.ts
@packages/core/src/parser/sections.ts
@packages/cli/src/lib/scaffolder.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update i18n translations and parser</name>
  <files>
    - packages/templates/src/i18n/en.ts
    - packages/templates/src/i18n/de.ts
    - packages/core/src/parser/sections.ts
  </files>
  <action>
    1. In `packages/templates/src/i18n/en.ts`:
       - Change `summary: 'Summary'` to `summary: 'Profile'`

    2. In `packages/templates/src/i18n/de.ts`:
       - Change `summary: 'Zusammenfassung'` to `summary: 'Profil'`

    3. In `packages/core/src/parser/sections.ts`:
       - Add `'profile': 'summary'` to SECTION_MAPPINGS (English section)
       - The German 'profil' mapping already exists
       - Update the suggestion string from "Summary" to "Profile" in the warning message (line ~105)
  </action>
  <verify>
    Run: `bun run typecheck` - no type errors
    Grep: `grep -n "Profile" packages/templates/src/i18n/en.ts` shows the new translation
    Grep: `grep -n "Profil" packages/templates/src/i18n/de.ts` shows the new translation
  </verify>
  <done>
    - i18n files use Profile/Profil for the summary section key
    - Parser recognizes 'profile' as a valid section header (maps to 'summary' type)
    - Parser suggestion text references "Profile" not "Summary"
  </done>
</task>

<task type="auto">
  <name>Task 2: Update scaffolder and all CV files</name>
  <files>
    - packages/cli/src/lib/scaffolder.ts
    - people/janetzky/cv.md
    - people/testuser/cv.md
    - examples/jane-developer/cv.md
    - examples/alex-chen/cv.md
  </files>
  <action>
    1. In `packages/cli/src/lib/scaffolder.ts` createExampleMarkdown():
       - Change `## Summary \`en\`` to `## Profile \`en\``
       - Change `## Zusammenfassung \`de\`` to `## Profil \`de\``
       - Update the HTML comment from "Professional summary" to "Professional profile"
       - Update the German comment from "Berufliche Zusammenfassung" to "Berufsprofil"

    2. Update all CV files in people/ and examples/:
       - `people/janetzky/cv.md`: Change `## Summary \`en\`` to `## Profile \`en\`` and `## Zusammenfassung \`de\`` to `## Profil \`de\``
       - `people/testuser/cv.md`: Change `## Summary \`en\`` to `## Profile \`en\`` and `## Summary \`de\`` to `## Profil \`de\`` (note: testuser uses Summary for both)
       - `examples/jane-developer/cv.md`: Change `## Summary \`en\`` to `## Profile \`en\`` and `## Zusammenfassung \`de\`` to `## Profil \`de\``
       - `examples/alex-chen/cv.md`: Change `## Summary \`en\`` to `## Profile \`en\`` and `## Zusammenfassung \`de\`` to `## Profil \`de\``
  </action>
  <verify>
    Run: `grep -r "## Summary" people/ examples/` - should return nothing
    Run: `grep -r "## Zusammenfassung" people/ examples/` - should return nothing
    Run: `grep -r "## Profile" people/ examples/` - should show all files
    Run: `grep -r "## Profil" people/ examples/` - should show all files
  </verify>
  <done>
    - Scaffolder generates new CVs with Profile/Profil headers
    - All existing CV files in people/ use Profile/Profil
    - All existing CV files in examples/ use Profile/Profil
  </done>
</task>

<task type="auto">
  <name>Task 3: Verify build and tests pass</name>
  <files>None (verification only)</files>
  <action>
    1. Run typecheck: `bun run typecheck`
    2. Run tests: `bun run test`
    3. Build a sample CV to verify rendering: `bun run cvgen build people/testuser --template modern`
    4. Verify the output contains "Profile" header (not "Summary")
  </action>
  <verify>
    Run: `bun run typecheck && bun run test`
    Build completes without errors
    Generated HTML contains "Profile" section header
  </verify>
  <done>
    - All type checks pass
    - All tests pass
    - CVs build successfully with new Profile/Profil headers
  </done>
</task>

</tasks>

<verification>
1. `bun run typecheck` - no errors
2. `bun run test` - all tests pass
3. `grep -rn "summary: 'Profile'" packages/templates/src/i18n/` - shows en.ts
4. `grep -rn "summary: 'Profil'" packages/templates/src/i18n/` - shows de.ts
5. `grep -rn "## Summary" people/ examples/` - returns nothing (all renamed)
6. `grep -rn "## Profile" people/ examples/` - shows all 4 CV files
</verification>

<success_criteria>
- i18n translations use Profile (EN) and Profil (DE) for the summary section
- Parser accepts Profile/Profil as valid section headers
- Scaffolder generates new CVs with Profile/Profil
- All existing CV files in people/ and examples/ updated
- Build and tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/013-rename-summary-category-to-profile-in-te/013-SUMMARY.md`
</output>
