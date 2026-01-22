---
phase: 01-foundation-data-schema
plan: 02
title: Define TypeScript interfaces for CVData
subsystem: data-schema
tags: [typescript, interfaces, schema, localization, error-handling]
dependency-graph:
  requires: [01-01]
  provides: [cvdata-interface, contact-types, section-types, localized-wrapper, parse-result]
  affects: [01-03, 02-01, 03-01, all-rendering-phases]
tech-stack:
  added: []
  patterns: [type-only-exports, localized-wrapper, error-collection]
key-files:
  created:
    - packages/core/src/schema/localized.ts
    - packages/core/src/schema/result.ts
    - packages/core/src/schema/contact.ts
    - packages/core/src/schema/experience.ts
    - packages/core/src/schema/education.ts
    - packages/core/src/schema/skills.ts
    - packages/core/src/schema/cv.ts
    - packages/core/src/schema/index.ts
  modified:
    - packages/core/src/index.ts
decisions:
  - id: DEC-01-02-001
    decision: Remove comment groupings from schema/index.ts
    rationale: Biome organizeImports scrambles comments; alphabetical export order is clear enough
metrics:
  duration: 1m 50s
  completed: 2026-01-22
  tasks: 3/3
---

# Phase 01 Plan 02: TypeScript Interfaces for CVData Summary

**One-liner:** Strongly-typed CVData schema with Localized<T> wrapper for multi-language support and ParseResult for error collection.

## What Was Built

### Localization and Error Types (`localized.ts`, `result.ts`)
- `Localized<T>` - Generic wrapper type for multi-language content with open-ended locale keys
- `ParseError` - Error/warning with line, column, message, suggestion, and context snippet
- `ParseResult<T>` - Result container with data (null on errors), errors array, and warnings array

### Contact Types (`contact.ts`)
- `Link` - External link with type identifier (linkedin, github, website, etc.) and optional label
- `Contact` - Contact info with required name, optional email, phone, location, and links array

### Section Types (`experience.ts`, `education.ts`, `skills.ts`)
- `WorkExperience` - Company, role, startDate, endDate, location, bullets, optional techStack
- `Education` - Institution, degree, field, startDate, endDate, location, honors, notes
- `Skill` - Individual skill with name and optional proficiency level
- `SkillCategory` - Category name with array of skills

### Main Interface (`cv.ts`)
- `CVData` - Complete CV structure with:
  - `contact: Contact` (not localized - same across all languages)
  - `summary?: Localized<string>` (localized)
  - `experience?: Localized<WorkExperience[]>` (localized)
  - `education?: Localized<Education[]>` (localized)
  - `skills?: Localized<SkillCategory[]>` (localized)
  - Forward-compatibility comments for Phase 7 additions (projects, certifications)

### Package Exports (`schema/index.ts`, `src/index.ts`)
- All types re-exported from schema barrel file in alphabetical order
- Package entry (`src/index.ts`) exports all schema types for consumers

## Commits

| Hash | Message |
|------|---------|
| 6f33a19 | feat(01-02): define localization and result types |
| 016779f | feat(01-02): define contact, experience, education, and skills types |
| b2764cc | feat(01-02): create CVData interface and package exports |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double quote usage to single quotes**
- **Found during:** Task 3 verification
- **Issue:** Plan code snippets used double quotes, but Biome config requires single quotes
- **Fix:** Ran `bun run format` to auto-fix quote style
- **Files modified:** result.ts, cv.ts, index.ts, schema/index.ts
- **Commit:** b2764cc

**2. [Rule 2 - Missing Critical] Removed comment groupings from schema/index.ts**
- **Found during:** Task 3 verification
- **Issue:** Biome organizeImports rule reorders exports alphabetically, scrambling semantic comments
- **Fix:** Removed comments and used clean alphabetical export order
- **Files modified:** schema/index.ts
- **Commit:** b2764cc

## Verification Results

| Check | Status |
|-------|--------|
| `bun run typecheck` passes | PASS |
| `bun run lint` passes | PASS |
| CVData importable from package entry | PASS |
| CVData has contact, summary, experience, education, skills | PASS |
| All body sections use Localized<T> | PASS |
| ParseResult/ParseError support error collection | PASS |

## Requirements Traceability

| Requirement | Coverage |
|-------------|----------|
| DATA-01: Contact info (name, email, phone, location, links) | Contact interface |
| DATA-02: Professional summary | summary field in CVData |
| DATA-03: Work experience (company, role, dates, bullets) | WorkExperience interface |
| DATA-04: Education (institution, degree, field, dates, honors) | Education interface |
| DATA-05: Skills by category | SkillCategory and Skill interfaces |
| INTL-01: Multi-language support | Localized<T> wrapper on all body sections |

## Next Phase Readiness

**Ready for 01-03:** The schema is complete. Plan 01-03 can proceed to implement the markdown parser that produces CVData.

**Dependencies satisfied:**
- CVData interface defines the contract between parser and templates
- Localized<T> wrapper enables multi-language content
- ParseResult/ParseError types ready for parser error handling
- All types exportable from @gottz/cv-core

**No blockers identified.**
