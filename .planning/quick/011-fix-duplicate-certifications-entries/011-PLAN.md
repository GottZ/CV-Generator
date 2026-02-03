---
phase: quick-011
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/core/src/parser/cv-parser.ts
autonomous: true

must_haves:
  truths:
    - "When both `## Certifications \`en\`` and `## Zertifizierungen \`de\`` exist, only ONE set of certifications appears in parsed data"
    - "Certifications are not duplicated in the CVData output"
    - "Parser prefers English certification section when available, falls back to first found"
  artifacts:
    - path: "packages/core/src/parser/cv-parser.ts"
      provides: "Fixed certification parsing - picks single language section"
      contains: "certificationSection"
  key_links:
    - from: "cv-parser.ts"
      to: "SectionMatch[]"
      via: "Filter to single certifications section before parsing"
      pattern: "sectionType === 'certifications'"
---

<objective>
Fix duplicate certifications when CV has both language-tagged certification sections.

Purpose: The parser currently collects certifications from ALL language sections (e.g., both `## Certifications \`en\`` and `## Zertifizierungen \`de\``), causing duplicates. Per the existing comment "Certifications are NOT localized (cert names are universal)", the parser should pick ONE language section, not merge them all.

Output: Updated cv-parser.ts that picks a single certification section (preferring 'en', falling back to first found).
</objective>

<execution_context>
@/root/.claude/get-shit-done/workflows/execute-plan.md
@/root/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/core/src/parser/cv-parser.ts (lines 73-86 are the bug)
@packages/core/src/parser/sections.ts (SectionMatch interface)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix certification section selection to pick single language</name>
  <files>packages/core/src/parser/cv-parser.ts</files>
  <action>
Modify the certification parsing logic at lines 73-86 to:

1. First, find all certification sections from `sectionsResult.sections`
2. Pick ONE section using this priority:
   - If 'en' language section exists, use it
   - Otherwise, use the first certification section found
3. Parse only that single section for certifications

Replace this buggy code:
```typescript
// Certifications are NOT localized (cert names are universal)
// Parse all certification sections and collect warnings
const certifications: Certification[] = [];
for (const section of sectionsResult.sections) {
  if (section.sectionType === 'certifications' && section.content) {
    const context: CertificationParseContext = {
      warnings,
      startLine: section.line,
    };
    certifications.push(
      ...parseCertificationEntries(section.content, context),
    );
  }
}
```

With this fix:
```typescript
// Certifications are NOT localized (cert names are universal)
// Pick ONE certification section: prefer 'en', fallback to first found
const certificationSections = sectionsResult.sections.filter(
  (s) => s.sectionType === 'certifications' && s.content,
);
const certificationSection =
  certificationSections.find((s) => s.language === 'en') ??
  certificationSections[0];

const certifications: Certification[] = certificationSection
  ? parseCertificationEntries(certificationSection.content, {
      warnings,
      startLine: certificationSection.line,
    })
  : [];
```

This change:
- Collects all certification sections first
- Selects ONE section (prefer 'en', fallback to first)
- Only parses that single section
- Returns empty array if no certification section exists
  </action>
  <verify>
Create a test markdown string with both `## Certifications \`en\`` and `## Zertifizierungen \`de\`` containing the same certification, call parseCV(), and verify certifications array has no duplicates:

```typescript
// Quick verification in REPL or test:
const md = `---
name: Test
email: test@test.com
---

## Certifications \`en\`

### AWS Solutions Architect
*Amazon | 2023-01*

---

## Zertifizierungen \`de\`

### AWS Solutions Architect
*Amazon | 2023-01*
`;

const result = parseCV(md);
console.log('Cert count:', result.data?.certifications?.length); // Should be 1, not 2
```
  </verify>
  <done>
- parseCV returns exactly 1 certification when same cert is in both `en` and `de` sections
- No duplicate certifications in output
- English section is preferred when both exist
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify fix with existing test data or examples</name>
  <files>packages/core/src/parser/cv-parser.ts</files>
  <action>
Run the project's type check and any existing tests to ensure the fix doesn't break anything:

```bash
cd /workspace && bun run typecheck
```

If example CV files exist (e.g., in examples/ or people/), check them with the CLI to verify certifications parse correctly:

```bash
# Check if any example CVs have certification sections
grep -r "## Certifications" examples/ people/ 2>/dev/null || echo "No cert sections in examples"
grep -r "## Zertifizierungen" examples/ people/ 2>/dev/null || echo "No German cert sections"
```

If dual-language cert sections exist in examples, run a build to verify no duplicates appear.
  </action>
  <verify>
- `bun run typecheck` passes
- If examples exist with certifications, `bun run cvgen <name> <template>` produces output without duplicate certifications
  </verify>
  <done>
- Type check passes
- No regressions in existing functionality
  </done>
</task>

</tasks>

<verification>
1. Parse a markdown file with both `## Certifications \`en\`` and `## Zertifizierungen \`de\`` containing identical certifications
2. Verify `parseCV()` returns only ONE copy of each certification
3. Verify type check passes: `bun run typecheck`
</verification>

<success_criteria>
- Certifications are not duplicated when both language sections exist
- Parser correctly picks English section when available
- Parser falls back to first section when English not available
- All type checks pass
</success_criteria>

<output>
After completion, create `.planning/quick/011-fix-duplicate-certifications-entries/011-SUMMARY.md`
</output>
