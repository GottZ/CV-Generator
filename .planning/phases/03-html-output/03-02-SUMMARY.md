# Phase 03 Plan 02: Image Processing Utilities Summary

**Completed:** 2026-01-22
**Duration:** ~5 minutes

## One-liner

Sharp-based image processor with JPEG-to-WebP conversion and HTML embedder for base64 data URI injection.

## What Was Built

### Image Processor (`packages/cli/src/lib/image-processor.ts`)

Core image processing module using Sharp library:

- **processImage()**: Reads image, detects format, converts JPEG to WebP (85% quality), returns base64 with metadata
- **toDataUri()**: Converts ProcessedImage to data URI string (`data:mime;base64,...`)
- **isAllowedFormat()**: Validates file extension against allowed formats
- **ALLOWED_FORMATS**: Constant array of `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`

Key behaviors:
- Photos (JPEG source) converted to WebP for smaller file size (~60% reduction typical)
- Graphics (PNG/GIF/WebP) kept as-is to preserve transparency and sharp edges
- Invalid formats rejected with clear error message listing allowed formats

### HTML Embedder (`packages/cli/src/lib/html-embedder.ts`)

HTML transformation module for embedding images:

- **embedImages()**: Finds `<img src="./images/...">` tags, replaces with base64 data URIs
- Returns `EmbedResult` with transformed HTML, counts, and warnings

Key behaviors:
- Matches rendered img tags (markdown already processed to HTML)
- Fails build on missing images (throws Error with path)
- Returns ATS warning when any images detected
- Tracks conversion statistics (processed count, converted count)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| ff7da28 | feat | Create image processor with Sharp |
| 0f89b58 | feat | Create HTML embedder for image embedding |

## Files Changed

### Created
- `packages/cli/src/lib/image-processor.ts` (77 lines)
- `packages/cli/src/lib/html-embedder.ts` (81 lines)

### Modified
- `packages/cli/package.json` (added sharp dependency)
- `bun.lock` (updated lockfile)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Sharp for image processing | 4-5x faster than ImageMagick, native bindings, excellent TypeScript support |
| JPEG->WebP, keep PNG | Photos benefit from WebP compression; PNGs are typically graphics needing transparency |
| 85% WebP quality | Good balance of quality and file size for CV images |
| Regex for img tag matching | Simple and reliable for `<img src="./images/...">` pattern |
| Fail on missing images | Per CONTEXT.md - build should fail, not silently skip |
| Return warnings array | Caller decides how to display ATS warning (console, log, etc.) |

## Requirements Delivered

| Requirement | How Addressed |
|-------------|---------------|
| OUT-08 | Self-contained HTML with embedded images as data URIs |
| ATS-06 | Returns warning when images detected (ATS cannot parse images) |

## Verification

All verification criteria met:

- [x] `bun run typecheck` passes without errors
- [x] image-processor.ts exports processImage, toDataUri, ProcessedImage
- [x] html-embedder.ts exports embedImages, EmbedResult
- [x] Both files have proper TypeScript types
- [x] Image processor converts JPEG to WebP, keeps PNG as-is
- [x] HTML embedder finds `<img src="./images/...">` tags
- [x] HTML embedder fails on missing images (throws Error)
- [x] HTML embedder returns ATS warning when images found

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript strict mode handling for regex groups**
- **Found during:** Task 2
- **Issue:** Regex match groups return `string | undefined`, TypeScript strict mode requires handling
- **Fix:** Added nullish coalescing (`?? ''`) for filename variable from regex match
- **Files modified:** html-embedder.ts
- **Commit:** 0f89b58

**2. [Rule 3 - Blocking] Biome formatting (single quotes)**
- **Found during:** Task 1
- **Issue:** Biome requires single quotes, initial code used double quotes
- **Fix:** Ran `bun run lint:fix` to auto-format
- **Files modified:** image-processor.ts
- **Commit:** ff7da28

## Next Phase Readiness

Ready to proceed with:
- 03-03: Output writer for writing HTML files to disk
- 03-04: Build command implementation using these utilities

Dependencies satisfied:
- Sharp installed and working
- Image processing pipeline complete
- HTML embedding pipeline complete
