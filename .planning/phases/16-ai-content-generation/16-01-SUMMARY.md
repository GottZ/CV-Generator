# Phase 16 Plan 01: Core Utility Infrastructure Summary

**Completed:** 2026-01-26
**Duration:** ~6 minutes
**Status:** Complete

## One-liner

Retry utility with exponential backoff, multi-source job description loader (file/URL/stdin), and cv.md output formatters for standalone AI generators.

## What Was Built

### Retry Utility (`packages/cli/src/ai/utils/retry.ts`)
- `withRetry<T>()` - Execute async functions with automatic retry on transient errors
- `isRetryableError()` - Detect rate limits, timeouts, connection errors, 503, 429
- Exponential backoff: delay = baseDelay * 2^(attempt-1), capped at maxDelay
- Configurable: maxAttempts (default 3), baseDelayMs (default 1000), maxDelayMs (default 10000)

### Job Description Loader (`packages/cli/src/ai/utils/job-description.ts`)
- `loadJobDescription()` - Unified loader for file, URL, and stdin sources
- File support: .txt, .md, .pdf formats
- PDF extraction via `unpdf` with helpful fallback messages
- URL fetching with redirect handling (up to 5 hops) and retry logic
- Blocked site detection with actionable instructions for users
- `JobDescriptionSource` type with metadata (filename, url, fetchedAt)

### cv.md Formatters (`packages/cli/src/ai/display/cv-format.ts`)
- `formatBulletsAsCvMd()` - Work Experience section with role headers and bullets
- `formatSummaryAsCvMd()` - Summary section with locale tag
- `formatKeywordsAsCvMd()` - Keyword placement suggestions grouped by section
- `formatCompleteCvMd()` - Full document assembly from multiple sections
- STAR breakdown as markdown comments when `showStar: true`
- Types: `RoleBullets`, `RoleBullet`, `StarBreakdown`, `KeywordPlacement`

### Barrel Exports
- `packages/cli/src/ai/utils/index.ts` - Exports retry and job-description utilities
- `packages/cli/src/ai/display/index.ts` - Exports cv-format, diff-display, and quality-labels

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ai/utils/retry.ts` | Retry with exponential backoff for API calls |
| `packages/cli/src/ai/utils/job-description.ts` | Load job descriptions from multiple sources |
| `packages/cli/src/ai/display/cv-format.ts` | cv.md output formatting |
| `packages/cli/src/ai/utils/index.ts` | Utils barrel export |
| `packages/cli/src/ai/display/index.ts` | Display barrel export |

## Commits

| Hash | Message |
|------|---------|
| 6d8ff38 | feat(16-01): create retry utility with exponential backoff |
| a2bc002 | feat(16-01): create job description loader for multiple sources |
| 2ccea34 | feat(16-01): create cv.md output formatter |

## Decisions Made

1. **Exponential backoff formula** - `baseDelay * 2^(attempt-1)` with cap at maxDelay (standard approach)
2. **Dynamic unpdf import** - Imported dynamically to avoid bundling issues
3. **HTML text extraction** - Simple regex-based extraction sufficient for job postings
4. **Blocked site detection** - Check for captcha, access denied, robot keywords in response
5. **STAR as markdown comments** - Keeps STAR hidden by default, visible in source

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed lint errors in diff-display.ts**
- **Found during:** Task 1 commit
- **Issue:** Pre-existing diff-display.ts had lint errors blocking commit
- **Fix:** Installed `diff` package which resolved import issues
- **Files:** packages/cli/src/ai/display/diff-display.ts
- **Commit:** Part of 6d8ff38

**2. [Rule 3 - Blocking] Installed diff package**
- **Found during:** Task 1
- **Issue:** diff package referenced but not installed
- **Fix:** Added diff@8.0.3 and @types/diff@8.0.0
- **Files:** bun.lock, packages/cli/package.json (not committed in this plan)

## Verification Results

- [x] `bun run typecheck` passes
- [x] `bun run lint` passes
- [x] All three utility modules exist and export their functions
- [x] Barrel exports in utils/index.ts and display/index.ts re-export all functions
- [x] `withRetry` function exported and callable with async functions
- [x] `isRetryableError` correctly identifies transient errors
- [x] `loadJobDescription` handles file, URL, and stdin sources
- [x] `formatBulletsAsCvMd` produces valid cv.md experience section format
- [x] `formatSummaryAsCvMd` produces valid cv.md summary section format

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| diff | 8.0.3 | Text comparison for improvements (installed but not committed) |
| @types/diff | 8.0.0 | TypeScript types for diff (installed but not committed) |

## Next Steps

This plan provides utility infrastructure for:
- **16-02**: Bullet generation command (`cvgen ai bullets`)
- **16-03**: Summary generation command (`cvgen ai summary`)
- **16-04**: Keyword analysis command (`cvgen ai keywords`)
- **16-05**: Standalone improve command

All generator commands will use these utilities:
- `withRetry` for API calls
- `loadJobDescription` for job context
- `formatBulletsAsCvMd` / `formatSummaryAsCvMd` for output
