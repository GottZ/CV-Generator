---
phase: quick
plan: 012
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/cli/src/lib/docx-sections.ts
autonomous: true

must_haves:
  truths:
    - "Date/location info appears on same line as job title in DOCX"
    - "Right-aligned tab stop positions dates flush to right margin"
    - "Layout matches HTML/PDF visual appearance (title left, date right)"
  artifacts:
    - path: "packages/cli/src/lib/docx-sections.ts"
      provides: "Tab-stop based same-line date alignment"
      contains: "TabStopType"
  key_links:
    - from: "docx-sections.ts"
      to: "docx library"
      via: "TabStopType.RIGHT import"
      pattern: "TabStopType"
---

<objective>
Fix Word document date alignment to display on same line as job title

Purpose: The current DOCX generation places date information on a separate line from the job title/company, while the HTML/PDF versions show them on the same line using `space-between` flexbox layout. Word documents should match this layout using right-aligned tab stops.

Output: Modified DOCX section builders that render "Company | Role [TAB->RIGHT] Date | Location" on a single line for all entry types (experience, education, projects, certifications).
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/cli/src/lib/docx-sections.ts
@packages/cli/src/lib/docx-generator.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add tab stop support and refactor entry header rendering</name>
  <files>packages/cli/src/lib/docx-sections.ts</files>
  <action>
  1. Import `TabStopType` from 'docx' (add to existing import statement)

  2. Add constant for right tab stop position (in TWIPs - Word's unit system):
     ```typescript
     /** Right margin tab stop position in TWIPs.
      * Standard A4 width (11906) minus margins (1418 * 2) = 9070 TWIPs
      * This positions right-aligned content at the right margin.
      */
     const RIGHT_TAB_POSITION = 9070;
     ```

  3. Create helper function for entry header with tab stop:
     ```typescript
     /**
      * Build entry header with title on left and metadata on right.
      * Uses tab stop for space-between effect like HTML flexbox.
      */
     function buildEntryHeader(
       leftParts: { text: string; bold?: boolean; size: number; color: string; font: string }[],
       rightText: string,
       styles: DocxStyleConfig,
       beforeSpacing?: number,
     ): Paragraph
     ```
     - Create TextRuns for leftParts
     - Add TextRun with `\t` (tab character) to jump to right tab stop
     - Add TextRun for rightText (italic, small, muted)
     - Return Paragraph with `tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_POSITION }]`

  4. Refactor `buildExperienceSection`:
     - Replace separate paragraphs (company line + date line) with single call to `buildEntryHeader`
     - Left: company (bold) + " | " + role
     - Right: startDate - endDate | location

  5. Refactor `buildEducationSection`:
     - Replace separate paragraphs (institution line + field line + date line) with `buildEntryHeader`
     - Left: institution (bold) + " | " + degree
     - Right: startDate - endDate | location
     - Keep field as separate paragraph if present (after header)

  6. Refactor `buildProjectsSection`:
     - Replace separate paragraphs (name line + date line) with `buildEntryHeader`
     - Left: project name (bold) + " | " + role (if present)
     - Right: startDate - endDate | type (if present)

  7. Refactor `buildCertificationsSection`:
     - Replace separate paragraphs (name line + issuer line + date line) with `buildEntryHeader`
     - Left: cert name (bold) + " - " + issuer
     - Right: date (- expiryDate if present)
  </action>
  <verify>
  ```bash
  # Build CLI to check for TypeScript errors
  cd /workspace/packages/cli && bun run build

  # Generate a test DOCX and verify structure
  cd /workspace && bun run cvgen generate --person janetzky --template classic --locale en

  # Open the generated DOCX and verify dates appear on same line as titles
  # (Manual verification of .docx file structure)
  ```
  </verify>
  <done>
  - TabStopType imported from docx
  - buildEntryHeader helper function created
  - All four section builders (experience, education, projects, certifications) use single-line entry headers
  - DOCX builds without TypeScript errors
  - Generated DOCX shows dates right-aligned on same line as job titles
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify DOCX output matches expected layout</name>
  <files>packages/cli/src/lib/docx-sections.ts</files>
  <action>
  Generate DOCX files for multiple test cases and verify the layout:

  1. Generate test CVs:
     ```bash
     bun run cvgen generate --person janetzky --template classic --locale en
     bun run cvgen generate --person janetzky --template modern --locale de
     ```

  2. Visual verification checklist (document the results):
     - Experience entries: "Company | Role" on left, "StartDate - EndDate | Location" on right
     - Education entries: "Institution | Degree" on left, dates/location on right
     - Projects entries: "Project Name | Role" on left, dates/type on right
     - Certifications: "Cert Name - Issuer" on left, dates on right
     - All dates right-aligned and flush to margin
     - No extra blank lines between header and bullets

  3. If any issues found, make targeted fixes to buildEntryHeader or specific section builders.
  </action>
  <verify>
  ```bash
  # Verify DOCX files exist with recent timestamps
  ls -la /workspace/people/janetzky/output/*.docx

  # Run existing DOCX tests to ensure no regressions
  cd /workspace/packages/cli && bun test docx
  ```
  </verify>
  <done>
  - Multiple DOCX files generated successfully
  - Entry headers show title and date on same line
  - No visual regressions in generated documents
  - Existing DOCX tests pass
  </done>
</task>

</tasks>

<verification>
- TypeScript builds without errors
- DOCX generation completes successfully
- Existing DOCX tests pass
- Visual inspection confirms dates on same line as titles
</verification>

<success_criteria>
- Date/location appears right-aligned on same line as job title in DOCX
- Layout matches HTML/PDF space-between appearance
- All entry types (experience, education, projects, certifications) use consistent layout
- No regressions in existing functionality
</success_criteria>

<output>
After completion, create `.planning/quick/012-fix-word-document-date-alignment-to-same/012-SUMMARY.md`
</output>
