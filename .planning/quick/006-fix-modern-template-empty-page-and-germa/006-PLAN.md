---
plan: 006
type: quick
scope: bugfix
files_modified:
  - packages/templates/src/i18n/de.ts
  - packages/templates/src/i18n/en.ts
  - packages/templates/src/i18n/index.ts
  - packages/templates/src/engine/filters.ts
  - templates/_shared/macros/entry.njk
  - templates/base/template.njk
autonomous: true
---

<objective>
Fix two localization bugs in CV template rendering:
1. German HTML output shows " at" (English) instead of " bei" (German) in job titles
2. Modern template generates empty trailing page in PDF output

Purpose: Ensure German CVs display correctly with proper German localization, and modern template doesn't waste paper with empty page.
Output: Properly localized German job titles and clean PDF pagination.
</objective>

<context>
@packages/templates/src/i18n/de.ts
@packages/templates/src/i18n/en.ts
@packages/templates/src/i18n/index.ts
@packages/templates/src/engine/filters.ts
@templates/_shared/macros/entry.njk
@templates/base/template.njk
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add localized "at" filter for job titles</name>
  <files>
    packages/templates/src/i18n/de.ts
    packages/templates/src/i18n/en.ts
    packages/templates/src/i18n/index.ts
    packages/templates/src/engine/filters.ts
  </files>
  <action>
    The bug: Job titles render as "Role at Company" even in German, where it should be "Role bei Company".

    Fix approach: Add a new `roleAt` i18n key and corresponding filter.

    1. In `packages/templates/src/i18n/en.ts`, add:
       ```typescript
       roleAt: 'at',
       ```

    2. In `packages/templates/src/i18n/de.ts`, add:
       ```typescript
       roleAt: 'bei',
       ```

    3. In `packages/templates/src/i18n/index.ts`, update the `getSectionHeader` function or add a new `getLocalizedText` function for general i18n (not just section headers). The existing function name is misleading for general i18n. Add:
       ```typescript
       export function getLocalizedText(key: string, locale: string): string {
         const translations = sectionHeaders[locale] ?? sectionHeaders.en;
         return translations?.[key] ?? key;
       }
       ```

    4. In `packages/templates/src/engine/filters.ts`, add a new filter in `registerI18nFilters`:
       ```typescript
       env.addFilter('i18n', (key: string, locale: string = 'en') => {
         return getLocalizedText(key, locale);
       });
       ```

    Import `getLocalizedText` from the i18n module.
  </action>
  <verify>
    Run `bun run type-check` in packages/templates - no TypeScript errors
    Run `bun test` if tests exist
  </verify>
  <done>
    i18n system supports general text localization beyond section headers, with "roleAt" key available in en/de
  </done>
</task>

<task type="auto">
  <name>Task 2: Update templates to use localized "at" text</name>
  <files>
    templates/_shared/macros/entry.njk
    templates/base/template.njk
  </files>
  <action>
    Update hardcoded "at" to use the new i18n filter.

    1. In `templates/_shared/macros/entry.njk` line 5, change:
       ```njk
       <h3 class="entry-title">{{ job.role }} at {{ job.company }}</h3>
       ```
       to:
       ```njk
       <h3 class="entry-title">{{ job.role }} {{ 'roleAt' | i18n(locale) }} {{ job.company }}</h3>
       ```

    2. In `templates/base/template.njk` line 46, change:
       ```njk
       <h3 class="entry-title">{{ job.role }} at {{ job.company }}</h3>
       ```
       to:
       ```njk
       <h3 class="entry-title">{{ job.role }} {{ 'roleAt' | i18n(locale) }} {{ job.company }}</h3>
       ```

    Note: The modern template uses the shared macro from entry.njk, so fixing entry.njk fixes modern template job titles automatically.
  </action>
  <verify>
    Generate a German CV with `bun run cli generate` using locale=de and verify job titles show "bei" not "at"
    Generate an English CV and verify job titles still show "at"
  </verify>
  <done>
    German job titles display "Role bei Company", English displays "Role at Company"
  </done>
</task>

<task type="auto">
  <name>Task 3: Investigate and fix modern template empty page</name>
  <files>
    templates/modern/styles.css
    templates/_shared/partials/_print.css
  </files>
  <action>
    The empty page at the end typically comes from:
    1. min-height: 297mm on .cv-page pushing content to fill a page even when content doesn't need it
    2. margin-bottom on last section causing overflow to new page
    3. Footer margin in @page causing calculation issues

    Investigation steps:
    1. Check if modern/styles.css has proper print overrides that set min-height: auto
    2. Check margin-bottom on last .section or last .entry
    3. Check if there's padding/margin at bottom of .cv-page or main

    Fix approach (after investigation confirms):
    1. In `templates/modern/styles.css`, add print-specific override if missing:
       ```css
       @media print {
         .cv-page {
           min-height: auto;
         }

         .section:last-child {
           margin-bottom: 0;
         }
       }
       ```

    2. OR if the issue is in _print.css, ensure modern template properly inherits it (already confirmed it does via render.ts concatenation)

    3. Verify the .cv-page min-height: var(--page-height) at line 113 of modern/styles.css is being overridden by _print.css line 25's min-height: auto

    Most likely fix: The modern template may need explicit margin-bottom: 0 on the last section in print to prevent the extra page. Add to modern/styles.css:
    ```css
    @media print {
      main > .section:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
      }
    }
    ```
  </action>
  <verify>
    Generate a PDF with the modern template for a multi-page CV (like janetzky if available, or alex-chen)
    Verify the PDF ends on the last content page without a trailing empty page
    Use `bun run cli generate --template modern --format pdf` command
  </verify>
  <done>
    Modern template PDFs end cleanly without empty trailing page
  </done>
</task>

</tasks>

<verification>
1. Generate German HTML: `bun run cli generate --locale de --format html` - job titles show "bei"
2. Generate English HTML: `bun run cli generate --locale en --format html` - job titles show "at"
3. Generate modern PDF: `bun run cli generate --template modern --format pdf` - no empty trailing page
4. Run type-check: `bun run type-check` - no errors
</verification>

<success_criteria>
- German job titles display "Role bei Company" instead of "Role at Company"
- English job titles continue displaying "Role at Company"
- Modern template PDF output has no empty trailing page
- All existing tests pass
- TypeScript compilation succeeds
</success_criteria>

<output>
After completion, verify fixes work and commit with message:
"fix(templates): localize job title 'at' text and fix modern empty page"
</output>
