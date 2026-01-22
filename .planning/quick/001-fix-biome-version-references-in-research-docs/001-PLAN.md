---
quick_task: 001-fix-biome-version-references-in-research-docs
plan: 001
type: execute
files_modified:
  - .planning/phases/01-foundation-data-schema/01-RESEARCH.md
  - .planning/phases/01-foundation-data-schema/01-01-PLAN.md
autonomous: true

must_haves:
  truths:
    - "All Biome schema references use version 2.3.11"
    - "No references to outdated Biome 1.9.4 remain in planning docs"
  artifacts:
    - path: ".planning/phases/01-foundation-data-schema/01-RESEARCH.md"
      provides: "Research document with correct Biome version"
      contains: "schemas/2.3.11/schema.json"
    - path: ".planning/phases/01-foundation-data-schema/01-01-PLAN.md"
      provides: "Plan document with correct Biome version"
      contains: "schemas/2.3.11/schema.json"
---

<objective>
Update outdated Biome version references from 1.9.4 to 2.3.11 in Phase 1 research and planning documents.

Purpose: Keep planning documentation accurate and consistent with the actual implementation (Biome v2.3.11 is installed and working).

Output: Updated RESEARCH.md and 01-01-PLAN.md files with correct Biome schema version.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update Biome version references</name>
  <files>
    .planning/phases/01-foundation-data-schema/01-RESEARCH.md
    .planning/phases/01-foundation-data-schema/01-01-PLAN.md
  </files>
  <action>
In both files, replace the Biome schema URL version from 1.9.4 to 2.3.11:

- Find: `https://biomejs.dev/schemas/1.9.4/schema.json`
- Replace with: `https://biomejs.dev/schemas/2.3.11/schema.json`

Locations:
- 01-RESEARCH.md line 469 (in Biome Configuration section)
- 01-01-PLAN.md line 234 (in biome.json code block)

Note: Do NOT modify 01-01-SUMMARY.md - it correctly documents the version discrepancy that was discovered and resolved during execution.
  </action>
  <verify>
```bash
# Verify no 1.9.4 references remain
grep -r "1\.9\.4" .planning/phases/01-foundation-data-schema/*.md

# Verify 2.3.11 references exist in both files
grep "2\.3\.11" .planning/phases/01-foundation-data-schema/01-RESEARCH.md
grep "2\.3\.11" .planning/phases/01-foundation-data-schema/01-01-PLAN.md
```
  </verify>
  <done>Both files reference Biome schema version 2.3.11, no 1.9.4 references remain in RESEARCH.md or 01-01-PLAN.md</done>
</task>

</tasks>

<verification>
```bash
# Full verification
grep -rn "schemas/.*schema.json" .planning/phases/01-foundation-data-schema/*.md
# Should show 2.3.11 in RESEARCH.md and 01-01-PLAN.md
# SUMMARY.md mentions 1.9.4 as historical context (acceptable)
```
</verification>

<success_criteria>
- [ ] 01-RESEARCH.md uses Biome schema 2.3.11
- [ ] 01-01-PLAN.md uses Biome schema 2.3.11
- [ ] No stale 1.9.4 references in non-historical contexts
</success_criteria>

<output>
After completion, create `.planning/quick/001-fix-biome-version-references-in-research-docs/001-SUMMARY.md`
</output>
