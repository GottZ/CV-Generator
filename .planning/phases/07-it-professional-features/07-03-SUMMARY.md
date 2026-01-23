---
phase: "07"
plan: "03"
subsystem: "templates"
tags: ["nunjucks", "css", "html", "projects", "certifications", "tech-stack"]
dependency-graph:
  requires: ["07-01", "07-02"]
  provides: ["formatLinkUrl filter", "projects template", "certifications template", "tech-stack-per-job template"]
  affects: ["07-04"]
tech-stack:
  added: []
  patterns: ["conditional sections", "flex-wrap tags", "url cleaning", "dark-mode support"]
key-files:
  modified:
    - "packages/templates/src/engine/filters.ts"
    - "packages/templates/src/render.ts"
    - "templates/base/template.njk"
    - "templates/base/styles.css"
    - "packages/core/src/parser/cv-parser.ts"
decisions:
  - id: "formatLinkUrl-export"
    choice: "Export formatLinkUrl for reuse"
    rationale: "DOCX generator will need same URL cleaning logic"
metrics:
  duration: "~10 minutes"
  completed: "2026-01-23"
---

# Phase 7 Plan 3: HTML Template Rendering for IT Features Summary

**One-liner:** Nunjucks templates for Projects/Certifications sections with formatLinkUrl filter, tech stack tags per job, and dark mode CSS support.

## What Was Built

### Task 1: formatLinkUrl Filter and Render Context

**filters.ts:**
- Added `formatLinkUrl(url)` function that strips protocol and trailing slash
- Registered filter in Nunjucks environment
- Exported function for reuse in DOCX generator

**render.ts:**
- Extended template context with `projects` (localized) and `certifications` (not localized)
- Both renderCV() and createRenderer() updated

### Task 2: Projects and Certifications Template Sections

**template.njk:**
- Projects section renders after Education, before Skills
- All Project fields supported: name, dates, role, type, description, techStack, outcome, links
- Highlighted projects get `.highlighted` CSS class
- Links use formatLinkUrl filter for clean display
- Certifications section renders after Skills
- All Certification fields: name, issuer, dates, credentialId, verificationUrl
- Tech stack tags added to Experience entries after bullets

### Task 3: CSS Styles for New Sections

**styles.css:**
- `.tech-stack` flex container with gap
- `.tech-tag` inline badge styling
- `.job-tech-stack` with border-top separator
- `.project-entry.highlighted` with accent border
- `.project-outcome` callout styling
- `.certification-entry` issuer and credential styling
- Full dark/light/system theme support for all new styles

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Export formatLinkUrl | DOCX generator will reuse same URL cleaning |
| Flex-wrap for tech tags | Natural wrapping on narrow displays |
| Border-top for job tech stack | Visual separation from bullets |
| Accent border for highlighted | Matches section header style |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Project outcome not parsed after Links subsection**
- **Found during:** Task 2 verification
- **Issue:** Outcome line was ignored when appearing after Links subsection because `inLinks` flag stayed true
- **Fix:** Moved outcome check before subsection content checks, reset subsection flags
- **Files modified:** packages/core/src/parser/cv-parser.ts
- **Commit:** 037568b

**2. [Rule 3 - Blocking] Unused DOCX section builders causing lint error**
- **Found during:** Task 1 commit
- **Issue:** buildProjectsSection and buildCertificationsSection were unused (prepared for 07-04)
- **Fix:** Prefixed with underscore to satisfy linter until 07-04 connects them
- **Files modified:** packages/cli/src/lib/docx-sections.ts
- **Commit:** 35ac79a (combined with Task 1)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 35ac79a | feat(07-03): add formatLinkUrl filter and extend render context |
| 2 | 7587d8b | feat(07-03): add Projects and Certifications sections to template |
| 3 | 7b0d48d | feat(07-03): add CSS styles for IT professional sections |
| Bug fix | 037568b | fix(07-03): parse project outcome after links subsection |

## Verification Results

1. `bun run typecheck` passes across all packages
2. Projects section renders with all fields (name, dates, role, type, description, tech tags, outcome, links)
3. Certifications section renders with name, issuer, dates, credential ID, verification link
4. Experience entries show tech stack tags when present (job-tech-stack class)
5. Project links display as "github.com/user/repo" not "https://github.com/user/repo/"
6. Highlighted projects have `.highlighted` class with accent border styling
7. Existing CVs without projects/certifications render correctly (jane-developer)
8. Dark/light/system theme support for tech tags and project outcome

## Technical Notes

### Template Context
```typescript
const context = {
  // ... existing fields
  projects: cv.projects?.[locale],      // Localized Project[]
  certifications: cv.certifications,     // Not localized Certification[]
};
```

### CSS Variables Used
- `--color-accent` for highlighted border and links
- `--color-surface` for dark mode tech tags
- `--color-border` for job tech stack separator

### formatLinkUrl Behavior
```
"https://github.com/user/repo/" -> "github.com/user/repo"
"http://example.com/docs/"      -> "example.com/docs"
"https://cv-generator.dev"      -> "cv-generator.dev"
```

## Next Phase Readiness

**Ready for:** 07-04 (DOCX Section Integration)

**Dependencies satisfied:**
- formatLinkUrl exported for DOCX reuse
- Projects and Certifications context available
- All HTML templates complete for reference

---

*Plan completed: 2026-01-23*
