---
phase: "07"
plan: "01"
subsystem: "schema-parser"
tags: ["typescript", "parser", "schema", "projects", "certifications"]
dependency-graph:
  requires: ["01-02", "01-03"]
  provides: ["Project type", "Certification type", "projects parsing", "certifications parsing"]
  affects: ["07-02", "07-03"]
tech-stack:
  added: []
  patterns: ["entry delimiter parsing", "subsection parsing", "meta line parsing"]
key-files:
  created:
    - "packages/core/src/schema/project.ts"
    - "packages/core/src/schema/certification.ts"
  modified:
    - "packages/core/src/schema/cv.ts"
    - "packages/core/src/schema/index.ts"
    - "packages/core/src/parser/sections.ts"
    - "packages/core/src/parser/cv-parser.ts"
decisions:
  - id: "certifications-not-localized"
    choice: "Certifications are NOT localized"
    rationale: "Cert names are universal (AWS SAA is AWS SAA everywhere)"
  - id: "project-sorting"
    choice: "Sort in parser: highlighted first, then by startDate descending"
    rationale: "Keeps templates simple, consistent ordering"
  - id: "links-subsection"
    choice: "Use #### Links subsection with type: url format"
    rationale: "Matches tech stack subsection pattern"
metrics:
  duration: "~15 minutes"
  completed: "2026-01-23"
---

# Phase 7 Plan 1: Schema and Parser Extensions Summary

**One-liner:** Project and Certification types with parser support for extracting these optional sections from markdown, including tech stack, links, and expiry validation.

## What Was Built

### Task 1: Schema Interfaces
Created new TypeScript interfaces for Projects and Certifications:

**project.ts:**
- `Project` interface with name (required), description, techStack, links, outcome, role, type, startDate, endDate, highlight
- `ProjectLink` interface with url (required), type, label
- Project types: personal, professional, open-source, freelance

**certification.ts:**
- `Certification` interface with name, issuer, date (all required), expiryDate, verificationUrl, credentialId, logo

**cv.ts:**
- Added `projects?: Localized<Project[]>` (localized like experience)
- Added `certifications?: Certification[]` (NOT localized - cert names are universal)

### Task 2: Section Mappings
Extended SECTION_MAPPINGS in sections.ts:

**English:** projects, personal projects, portfolio, certifications, certificates
**German:** projekte, persoenliche projekte, zertifizierungen, zertifikate

Updated warning message to include new known sections.

### Task 3: Parser Functions
Added parsing functions following existing patterns:

**parseProjectEntries:**
- Parses `### Project Name` headers
- Parses `*dates | role | type | highlight*` meta lines
- Parses `#### Technologies` or `#### Tech Stack` subsections
- Parses `#### Links` subsections with `- type: url` format
- Parses `**Outcome:**` lines
- Sorting: highlighted first, then by startDate descending

**parseCertificationEntries:**
- Parses `### Certification Name` headers
- Parses `*issuer | date | expires expiryDate*` meta lines
- Parses `Credential ID: XXX` lines
- Parses standalone URLs as verificationUrl
- Adds warning on expired certifications

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Certifications NOT localized | Cert names are universal (AWS SAA is AWS SAA everywhere) |
| Sort in parser | Keep templates simple, consistent ordering across formats |
| Links in subsection | Matches tech stack subsection pattern |
| Highlight flag | Allows promoting specific projects for tailored CVs |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e99a7a1 | feat(07-01): add Project and Certification schema interfaces |
| 2 | 25006f5 | feat(07-01): add section mappings for Projects and Certifications |
| 3 | d20512c | feat(07-01): implement parseProjectEntries and parseCertificationEntries |

## Verification Results

1. `bun run typecheck` passes across all packages
2. Existing CVs without projects/certifications still parse correctly
3. CVs with projects section produce Project[] with correct field extraction
4. CVs with certifications section produce Certification[] with correct field extraction
5. Expired certification produces warning in ParseResult.warnings
6. German sections (## Projekte, ## Zertifizierungen) recognized and parsed
7. Project highlight flag affects ordering (highlighted first)

## Technical Notes

### Markdown Format - Projects
```markdown
### Project Name
*2024-01 - present | Lead Developer | open-source | highlight*

Description paragraph.

#### Technologies
- TypeScript
- React

#### Links
- github: https://github.com/user/repo
- demo: https://example.com

**Outcome:** Achieved X% improvement
```

### Markdown Format - Certifications
```markdown
### AWS Solutions Architect - Associate
*Amazon Web Services | 2023-05 | expires 2026-05*

Credential ID: ABC123
https://verify.aws.com/ABC123
```

## Next Phase Readiness

**Ready for:** 07-02 (Tech Stack per Job + Skills Acronyms - already partially implemented)

**Dependencies satisfied:**
- Project and Certification types exported from @gottz/cv-core
- Parser extracts projects and certifications sections
- Section mappings include EN/DE variants

---

*Plan completed: 2026-01-23*
