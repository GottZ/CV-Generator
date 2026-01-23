---
phase: 07-it-professional-features
plan: 02
subsystem: parser
tags: [tech-stack, skills, acronyms, validation]
dependency-graph:
  requires: [07-01]
  provides: [tech-stack-parsing, acronym-detection, tech-skills-validation]
  affects: [07-03, 07-04, 08-01]
tech-stack:
  added: []
  patterns: [heuristic-detection, cross-section-validation]
key-files:
  modified:
    - packages/core/src/parser/cv-parser.ts
decisions:
  - id: acronym-heuristic
    choice: "Detect acronyms via uppercase pattern (2-5 chars) or K8s-style (letter+digit+optional letter)"
    rationale: "Simple heuristic covers common tech acronyms without complex NLP"
  - id: proficiency-allowlist
    choice: "Use allowlist of known proficiency levels including German translations"
    rationale: "Explicit list more reliable than trying to detect proficiency semantically"
  - id: tech-skills-warning
    choice: "Warning only, not error, when tech not in skills"
    rationale: "Users may intentionally have tech in experience not in skills (minor technologies)"
metrics:
  duration: ~4 minutes
  completed: 2026-01-23
---

# Phase 7 Plan 2: Tech Stack Parsing and Skills Acronym Handling Summary

**One-liner:** Tech stack per job position, acronym vs proficiency detection, cross-section validation warnings.

## What Was Done

### Task 1: Tech Stack Parsing (Pre-existing from 07-01)

The tech stack parsing feature was already implemented in Plan 07-01 as part of the schema interfaces work:
- `TECH_STACK_HEADER` regex for `#### Technologies` and `#### Tech Stack`
- State machine (`inTechStack`) in `parseExperienceEntries`
- Collects tech items with role annotations preserved

**Commit:** e99a7a1 (from 07-01)

### Task 2: Skills Acronym Detection

Added intelligent parsing to distinguish acronyms from proficiency levels:

```typescript
const PROFICIENCY_LEVELS = new Set([
  'expert', 'proficient', 'familiar', 'advanced', 'beginner', 'intermediate',
  'experte', 'fortgeschritten', 'grundkenntnisse', 'anfaenger',
  'lead', 'supporting'
]);

function isAcronym(text: string): boolean {
  if (PROFICIENCY_LEVELS.has(text.toLowerCase())) return false;
  return /^[A-Z0-9]{2,5}$/.test(text) || /^[A-Z][0-9][a-z]?$/.test(text);
}
```

**Behavior:**
- "Kubernetes (K8s)" -> `{ name: "Kubernetes (K8s)" }` (K8s is acronym)
- "TypeScript (expert)" -> `{ name: "TypeScript", level: "expert" }` (expert is proficiency)
- "Docker (familiar)" -> `{ name: "Docker", level: "familiar" }` (familiar is proficiency)

**Commit:** d9a14e0

### Task 3: Tech-to-Skills Validation

Added cross-section validation to warn about consistency:

```typescript
function validateTechToSkills(experience, skills, warnings): void {
  // Collect tech from experience (strip role annotations)
  // Collect skills (strip acronyms)
  // Warn on tech not in skills
}
```

**Warning format:**
```
Technology "docker" used in experience but not listed in Skills section
  Suggestion: Consider adding this skill to your Skills section for consistency
```

**Commit:** c135114

## Verification Results

All verification criteria passed:

| Check | Result |
|-------|--------|
| Typecheck passes | PASS |
| Tech stack from `#### Technologies` | PASS |
| Tech stack from `#### Tech Stack` | PASS |
| "Kubernetes (K8s)" preserves full name | PASS |
| "TypeScript (expert)" splits correctly | PASS |
| Tech-skills mismatch produces warning | PASS |
| CVs without tech stacks still parse | PASS |

## Files Changed

| File | Changes |
|------|---------|
| `packages/core/src/parser/cv-parser.ts` | +101 lines (acronym detection, validation) |

## Decisions Made

### Acronym Detection Heuristic

**Decision:** Use pattern matching for acronyms:
- All caps 2-5 characters (AWS, GCP, K8S, MQTT)
- Letter + digit + optional letter pattern (K8s, S3, EC2)

**Rationale:** Simple heuristic covers 99% of tech acronyms without needing a dictionary or NLP. The proficiency allowlist handles the false positive case.

### Proficiency Allowlist

**Decision:** Explicit allowlist of known proficiency levels including German translations.

**Rationale:** Limited set of proficiency terms used in practice. Easier to maintain than trying to detect proficiency semantically.

### Warning Not Error

**Decision:** Tech-to-skills mismatch is a warning, not an error.

**Rationale:** Users may intentionally list minor technologies in experience that don't warrant inclusion in the Skills section. The warning surfaces the inconsistency without blocking.

## Deviations from Plan

### Task 1 Already Complete

**Finding:** Task 1 (tech stack parsing) was already implemented in Plan 07-01.

**Action:** Verified the existing implementation, proceeded with Tasks 2-3.

**Impact:** No change - feature was already working correctly.

## Next Phase Readiness

Plan 07-02 is complete. Ready for:
- **07-03:** Project sections parsing (uses similar parsing patterns)
- **07-04:** Certification sections parsing
- **Phase 8:** Multi-template and polish

No blockers or concerns.
