---
phase: 14-ai-foundation
plan: 02
subsystem: ai-prompts
tags: [nunjucks, templates, prompts, cv-analysis]

dependency-graph:
  requires: []
  provides: [PROMPT-TEMPLATES, PROMPT-RENDERING, PROMPT-REGISTRY]
  affects: [15-multi-stage-workflow]

tech-stack:
  added: [nunjucks@^3.2.4]
  patterns: [template-rendering, context-validation, singleton-environment]

key-files:
  created:
    - packages/cli/src/ai/prompts/registry.ts
    - packages/cli/src/ai/prompts/index.ts
    - packages/cli/src/ai/prompts/templates/analyze.njk
    - packages/cli/src/ai/prompts/templates/improve.njk
    - packages/cli/src/ai/prompts/templates/summarize.njk
    - packages/cli/src/ai/prompts/templates/tailor.njk
  modified:
    - packages/cli/package.json

decisions:
  - id: nunjucks-for-prompts
    choice: Use Nunjucks for prompt templates (same as CV templates)
    rationale: Consistency with existing template engine; autoescape disabled for plain text
  - id: certifications-not-localized
    choice: Access cv.certifications directly (not cv.certifications[locale])
    rationale: Per schema.ts, certifications is Certification[] not Localized<Certification[]>

metrics:
  duration: ~7 minutes
  completed: 2026-01-25
---

# Phase 14 Plan 02: Prompt Template System Summary

**One-liner:** Nunjucks-based prompt template system with 4 templates (analyze, improve, summarize, tailor), registry metadata, and context-validated rendering.

## What Was Done

### Task 1: Create prompt registry

Created `/workspace/packages/cli/src/ai/prompts/registry.ts` with:
- `PromptMetadata` interface defining prompt configuration
- `PROMPTS` constant with 4 prompt definitions (stages 1-4)
- Helper functions: `getPromptList()`, `getPromptByName()`, `getPromptsByStage()`, `isValidPrompt()`

**Commit:** 6f8f346

### Task 2: Create prompt rendering infrastructure

Created `/workspace/packages/cli/src/ai/prompts/index.ts` with:
- `PromptContext` interface for template variables (cv, locale, jobDescription, previousAnalysis)
- `createPromptEnvironment()` configuring Nunjucks with autoescape: false
- `renderPrompt()` function with context validation
- `PromptError` class for error handling
- Custom filters: `join`, `truncate`

Added nunjucks and @types/nunjucks dependencies to cli package.

**Commit:** 323c00e

### Task 3: Create analyze prompt template (Stage 1)

Created `/workspace/packages/cli/src/ai/prompts/templates/analyze.njk` with:
- CV content interpolation: contact, summary, experience, education, skills, certifications, projects
- 5 analysis tasks: structure assessment, content gaps, achievement analysis, ATS compatibility, improvement priorities
- Fixed certifications access (not localized per schema)

**Commit:** 7a501b3

### Task 4: Create improve prompt template (Stage 2)

Created `/workspace/packages/cli/src/ai/prompts/templates/improve.njk` with:
- Previous analysis context support
- Work experience bullet enumeration
- STAR method guidance (Situation, Task, Action, Result)
- Guidelines for strong action verbs and quantifiable results

**Commit:** 1cac19d

### Task 5: Create summarize prompt template (Stage 3)

Created `/workspace/packages/cli/src/ai/prompts/templates/summarize.njk` with:
- Candidate information display
- Career highlights: experience count, recent roles
- Technical skills and certifications
- 4-part summary structure guidance
- Output format: primary, alternative, key points

**Commit:** 104bf0e (merged with 14-01 commit due to parallel execution)

### Task 6: Create tailor prompt template (Stage 4)

Created `/workspace/packages/cli/src/ai/prompts/templates/tailor.njk` with:
- Job description input requirement
- Keyword analysis task (required/preferred/soft skills)
- Experience, summary, and skills tailoring guidance
- Output format: match score, recommendations, rewrites

**Commit:** d2220bd (merged with 14-01 commit due to parallel execution)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added nunjucks dependency to cli package**

- **Found during:** Task 2
- **Issue:** nunjucks was in templates package but not cli package
- **Fix:** Added nunjucks@^3.2.4 and @types/nunjucks@^3.2.6 to cli/package.json
- **Files modified:** packages/cli/package.json
- **Commit:** 323c00e

**2. [Rule 1 - Bug] Fixed certifications access in templates**

- **Found during:** Task 3
- **Issue:** Plan used cv.certifications[locale] but certifications is not localized per schema
- **Fix:** Changed to cv.certifications in analyze.njk and summarize.njk
- **Files modified:** analyze.njk, summarize.njk
- **Commits:** 7a501b3, 104bf0e

### Parallel Execution Note

Tasks 5-6 were committed alongside 14-01 plan work due to parallel session execution. The files are correct and complete, just merged into different commit messages.

## Verification Results

| Check | Status |
|-------|--------|
| bun run typecheck passes | PASS |
| registry.ts exports PROMPTS with 4 entries | PASS |
| index.ts exports renderPrompt | PASS |
| All 4 .njk templates exist | PASS |
| Templates contain cv.* variables | PASS |
| renderPrompt renders with mock data | PASS |
| Context validation throws on missing jobDescription | PASS |

## Files Changed

| File | Change |
|------|--------|
| packages/cli/package.json | Modified - added nunjucks, @types/nunjucks |
| packages/cli/src/ai/prompts/registry.ts | Created - prompt metadata registry |
| packages/cli/src/ai/prompts/index.ts | Created - rendering infrastructure |
| packages/cli/src/ai/prompts/templates/analyze.njk | Created - Stage 1 analysis prompt |
| packages/cli/src/ai/prompts/templates/improve.njk | Created - Stage 2 improvement prompt |
| packages/cli/src/ai/prompts/templates/summarize.njk | Created - Stage 3 summary prompt |
| packages/cli/src/ai/prompts/templates/tailor.njk | Created - Stage 4 tailoring prompt |

## Key Code

### Prompt registry

```typescript
export const PROMPTS: Record<string, PromptMetadata> = {
  analyze: {
    name: 'analyze',
    description: 'Analyze CV structure, identify gaps, and find improvement opportunities',
    stage: 1,
    requiresCV: true,
    requiresJobDescription: false,
    templateFile: 'analyze.njk',
  },
  // ... improve, summarize, tailor
};
```

### Prompt rendering

```typescript
export function renderPrompt(promptName: string, context: PromptContext): string {
  const metadata = getPromptByName(promptName);
  if (!metadata) {
    throw new PromptError(promptName, `Unknown prompt: ${promptName}`);
  }
  validatePromptContext(metadata, context);
  const env = getPromptEnvironment();
  return env.render(metadata.templateFile, context);
}
```

### Template example (analyze.njk)

```nunjucks
### Work Experience
{% if cv.experience and cv.experience[locale] %}
{% for job in cv.experience[locale] %}
**{{ job.role }}** at {{ job.company }}
{{ job.startDate }}{% if job.endDate %} - {{ job.endDate }}{% else %} - Present{% endif %}
{% if job.bullets %}
{% for bullet in job.bullets %}
- {{ bullet }}
{% endfor %}
{% endif %}
{% endfor %}
{% endif %}
```

## Test Results

```
=== Test 1: List prompts ===
Found 4 prompts:
  - analyze (stage 1)
  - improve (stage 2)
  - summarize (stage 3)
  - tailor (stage 4)

=== Test 2: Render analyze prompt ===
Rendered 1443 characters

=== Test 3: Render tailor prompt ===
Rendered 2175 characters
Contains job description: true

=== Test 4: Error handling ===
Correctly threw error: Prompt tailor: Job description is required for tailor prompt

=== All tests passed ===
```

## Next Steps

Phase 15 (Multi-Stage Workflow) will implement:
- `cvgen ai` command infrastructure
- Multi-stage prompt execution with analysis chaining
- Prompt export for manual LLM use
- API integration with staged context passing
