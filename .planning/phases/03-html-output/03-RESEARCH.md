# Phase 3: HTML Output - Research

**Researched:** 2026-01-22
**Domain:** CLI build command, image processing, file watching
**Confidence:** HIGH

## Summary

Phase 3 requires building a CLI build command that generates self-contained HTML files with embedded CSS and base64-encoded images. The research covers four key domains: CLI argument parsing, image processing/encoding, file watching for development mode, and terminal output formatting.

The Node.js/Bun ecosystem provides mature, well-tested solutions for all requirements. Commander.js remains the standard for CLI building with excellent TypeScript support. Sharp is the definitive image processing library supporting format detection and WebP conversion. Chokidar v5 is the standard for file watching with proper cross-platform support. For terminal colors, picocolors provides the best balance of size and functionality.

**Primary recommendation:** Use Commander.js for CLI, Sharp for image processing, Chokidar for file watching, and picocolors for terminal colors. All CSS inlining happens via the existing Nunjucks template (CSS is already passed to the template context).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | ^12.0.0 | CLI argument parsing | De facto standard, 25M+ weekly downloads, excellent TypeScript support |
| sharp | ^0.33.0 | Image processing, format detection, WebP conversion | Fastest Node.js image library, 4-5x faster than ImageMagick |
| chokidar | ^5.0.0 | File system watching | Most reliable cross-platform watcher, 30M+ repos use it |
| picocolors | ^1.1.0 | Terminal colors | Smallest and fastest, zero dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fuse.js | ^7.0.0 | Fuzzy string matching | Template name suggestions ("Did you mean 'modern'?") |
| mime-types | ^2.1.0 | MIME type from extension | Generating data URI prefixes |
| lodash.debounce | ^4.0.8 | Watch debouncing | Handling rapid file changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| commander | yargs | yargs is more verbose, commander has cleaner TypeScript API |
| commander | util.parseArgs (built-in) | Built-in lacks subcommands, help generation |
| sharp | file-type + jimp | file-type for detection only; jimp is slower, less format support |
| chokidar | Bun.fs.watch | Bun's watcher is basic, lacks cross-platform normalization |
| picocolors | chalk | chalk is larger (44KB vs 6KB), picocolors sufficient for our needs |
| picocolors | ansis | ansis is similar size but picocolors is more widely used |

**Installation:**
```bash
bun add commander sharp chokidar picocolors fuse.js mime-types lodash.debounce
bun add -d @types/lodash.debounce
```

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/
  src/
    index.ts            # CLI entry point
    commands/
      build.ts          # Build command implementation
    lib/
      image-processor.ts    # Sharp-based image handling
      file-watcher.ts       # Chokidar wrapper for watch mode
      output-writer.ts      # File writing with directory creation
      console.ts            # Colored console output utilities
      fuzzy-matcher.ts      # Template suggestion helper
    types.ts            # CLI-specific types
```

### Pattern 1: Commander.js Command Setup
**What:** Structure CLI with subcommands and typed options
**When to use:** All CLI entry points
**Example:**
```typescript
// Source: https://github.com/tj/commander.js
import { Command } from 'commander';

interface BuildOptions {
  format?: string;
  locale?: string;
  watch?: string | boolean;
  parallel?: boolean;
  quiet?: boolean;
  json?: boolean;
}

const program = new Command();

program
  .name('cvgen')
  .description('CV Generator - Build professional CVs from markdown')
  .version('0.1.0');

program
  .command('build')
  .description('Build CV output files')
  .argument('<name>', 'Person directory name (e.g., johndoe)')
  .argument('<template>', 'Template ID to use (e.g., modern)')
  .option('--format <formats>', 'Output formats (comma-separated: html,pdf,docx)', 'html,pdf,docx')
  .option('--locale <locales>', 'Locales to build (comma-separated)')
  .option('--watch [filter]', 'Watch for changes and rebuild')
  .option('--parallel', 'Build formats in parallel')
  .option('--sequential', 'Build formats sequentially (default)')
  .option('--quiet', 'Suppress non-error output')
  .option('--json', 'Output results as JSON')
  .action(async (name: string, template: string, options: BuildOptions) => {
    // Build implementation
  });

program.parseAsync(process.argv);
```

### Pattern 2: Sharp Image Processing Pipeline
**What:** Detect format, optionally convert to WebP, encode as base64
**When to use:** Processing images for HTML embedding
**Example:**
```typescript
// Source: https://sharp.pixelplumbing.com/api-input
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

interface ProcessedImage {
  base64: string;
  mimeType: string;
  originalFormat: string;
  wasConverted: boolean;
}

async function processImageForHtml(imagePath: string): Promise<ProcessedImage> {
  const buffer = await readFile(imagePath);
  const metadata = await sharp(buffer).metadata();
  const originalFormat = metadata.format ?? 'unknown';

  // Decision: WebP for photos (JPEG), keep PNG for graphics
  const isPhoto = originalFormat === 'jpeg' || originalFormat === 'jpg';

  let outputBuffer: Buffer;
  let mimeType: string;
  let wasConverted = false;

  if (isPhoto) {
    // Convert photos to WebP for smaller file size
    outputBuffer = await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer();
    mimeType = 'image/webp';
    wasConverted = true;
  } else {
    // Keep PNG, GIF, WebP as-is
    outputBuffer = buffer;
    mimeType = `image/${originalFormat}`;
  }

  const base64 = outputBuffer.toString('base64');

  return {
    base64,
    mimeType,
    originalFormat,
    wasConverted,
  };
}

function toDataUri(processed: ProcessedImage): string {
  return `data:${processed.mimeType};base64,${processed.base64}`;
}
```

### Pattern 3: Chokidar Watch Mode
**What:** Watch files and directories for changes with debouncing
**When to use:** Development mode with `--watch` flag
**Example:**
```typescript
// Source: https://github.com/paulmillr/chokidar
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

interface WatchOptions {
  peopleDir: string;
  templatesDir: string;
  filter?: { cv?: string; template?: string };
  onRebuild: (changed: string) => Promise<void>;
}

function createWatcher(options: WatchOptions): chokidar.FSWatcher {
  const { peopleDir, templatesDir, filter, onRebuild } = options;

  const paths = [
    filter?.cv ? `${peopleDir}/${filter.cv}/**/*` : `${peopleDir}/**/*`,
    filter?.template ? `${templatesDir}/${filter.template}/**/*` : `${templatesDir}/**/*`,
  ];

  // Debounce rebuilds to handle rapid successive changes
  const debouncedRebuild = debounce(onRebuild, 300, { leading: false, trailing: true });

  const watcher = chokidar.watch(paths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
    ignored: [
      '**/output/**',      // Don't watch output directory
      '**/node_modules/**',
      '**/.git/**',
    ],
  });

  watcher
    .on('add', path => debouncedRebuild(path))
    .on('change', path => debouncedRebuild(path))
    .on('unlink', path => debouncedRebuild(path))
    .on('error', error => console.error('Watch error:', error));

  return watcher;
}
```

### Pattern 4: Bun File I/O for Output
**What:** Write HTML files using Bun's optimized file APIs
**When to use:** Writing output files
**Example:**
```typescript
// Source: https://bun.com/docs/runtime/file-io
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

interface WriteResult {
  path: string;
  bytes: number;
  overwritten: boolean;
}

async function writeOutput(
  outputDir: string,
  filename: string,
  content: string,
): Promise<WriteResult> {
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, filename);

  // Check if file exists before writing
  const existingFile = Bun.file(outputPath);
  const overwritten = await existingFile.exists();

  // Bun.write is optimized for file writing
  const bytes = await Bun.write(outputPath, content);

  return {
    path: outputPath,
    bytes,
    overwritten,
  };
}
```

### Pattern 5: Terminal Color Output
**What:** Colored, TTY-aware console output
**When to use:** All user-facing messages
**Example:**
```typescript
// Source: https://github.com/alexeyraspopov/picocolors
import pc from 'picocolors';

interface ConsoleOptions {
  quiet?: boolean;
  json?: boolean;
}

function createConsole(options: ConsoleOptions) {
  const isTTY = process.stdout.isTTY && !options.json;

  return {
    success(message: string) {
      if (options.quiet || options.json) return;
      console.log(isTTY ? pc.green(`\u2713 ${message}`) : `OK: ${message}`);
    },

    warn(message: string) {
      if (options.json) return;
      console.warn(isTTY ? pc.yellow(`\u26A0 ${message}`) : `WARN: ${message}`);
    },

    error(message: string) {
      if (options.json) {
        // Errors always shown, even in JSON mode (to stderr)
        console.error(JSON.stringify({ error: message }));
      } else {
        console.error(isTTY ? pc.red(`\u2717 ${message}`) : `ERROR: ${message}`);
      }
    },

    info(message: string) {
      if (options.quiet || options.json) return;
      console.log(isTTY ? pc.cyan(message) : message);
    },
  };
}
```

### Pattern 6: Fuzzy Template Matching
**What:** Suggest similar template names on not-found error
**When to use:** Template lookup errors
**Example:**
```typescript
// Source: https://www.fusejs.io/
import Fuse from 'fuse.js';

function suggestTemplate(input: string, available: string[]): string | null {
  const fuse = new Fuse(available, {
    threshold: 0.4, // Lower = stricter matching
    distance: 100,
  });

  const results = fuse.search(input);
  return results.length > 0 ? results[0].item : null;
}

// Usage in error handling:
function templateNotFoundError(templateId: string, available: string[]): Error {
  const suggestion = suggestTemplate(templateId, available);
  let message = `Template "${templateId}" not found.`;

  if (suggestion) {
    message += ` Did you mean "${suggestion}"?`;
  }

  if (available.length > 0) {
    message += ` Available: ${available.join(', ')}`;
  }

  return new Error(message);
}
```

### Anti-Patterns to Avoid
- **Manual base64 encoding without Buffer:** Use `buffer.toString('base64')`, not custom implementations
- **Synchronous file operations in watch callbacks:** Always use async I/O to avoid blocking
- **Watching output directory:** Leads to infinite rebuild loops
- **Hardcoded ANSI codes:** Use picocolors for portability
- **Building sharp pipelines without error handling:** Sharp operations can fail on corrupt images

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image format detection | Magic byte checking | `sharp(buffer).metadata().format` | Sharp already does this reliably |
| Image to base64 | Custom encoding | `buffer.toString('base64')` | Node.js Buffer handles this |
| WebP conversion | ImageMagick subprocess | `sharp(buffer).webp()` | Sharp is 4-5x faster, no external deps |
| File watching | `fs.watch` directly | chokidar | Raw fs.watch has cross-platform bugs |
| CLI parsing | Manual argv parsing | commander | Commander handles edge cases, help, errors |
| Fuzzy matching | Levenshtein implementation | fuse.js | Well-tested, configurable thresholds |
| Debouncing | setTimeout wrapper | lodash.debounce | Handles edge cases (cancel, flush, leading/trailing) |
| MIME types | Extension mapping object | mime-types | Complete database, maintained |
| TTY detection | Custom checks | `process.stdout.isTTY` + picocolors | Handles all edge cases |

**Key insight:** Image processing and CLI building have many edge cases. Libraries like Sharp and Commander have years of battle-testing that custom code won't match.

## Common Pitfalls

### Pitfall 1: Watch Mode Infinite Loops
**What goes wrong:** Watching the output directory causes rebuilds to trigger rebuilds
**Why it happens:** Output files are written to watched paths
**How to avoid:** Always ignore output directories in chokidar config
**Warning signs:** Build command runs endlessly, CPU spikes

### Pitfall 2: Sharp Memory Issues with Large Images
**What goes wrong:** Processing very large images exhausts memory
**Why it happens:** Sharp loads images into memory for processing
**How to avoid:** Check image dimensions before processing, set reasonable limits
**Warning signs:** Process crashes with OOM, slow processing

### Pitfall 3: Base64 Size Bloat
**What goes wrong:** HTML files become excessively large
**Why it happens:** Base64 encoding increases size by ~33%
**How to avoid:** Convert photos to WebP first (60%+ size reduction typical), warn on large images
**Warning signs:** HTML files over 5MB, slow browser rendering

### Pitfall 4: Race Conditions in Watch Mode
**What goes wrong:** Multiple rapid changes cause overlapping builds
**Why it happens:** File saves trigger multiple events
**How to avoid:** Debounce rebuild callbacks, use `awaitWriteFinish` option
**Warning signs:** Corrupted output, incomplete builds

### Pitfall 5: TTY Color Detection in CI
**What goes wrong:** Colors show as ANSI codes in CI logs
**Why it happens:** CI environments may have `isTTY=false` but support colors
**How to avoid:** Respect `FORCE_COLOR` environment variable, use `--no-color` flag
**Warning signs:** `[32m` appearing in logs

### Pitfall 6: Image Path Resolution
**What goes wrong:** Images not found despite correct relative paths in markdown
**Why it happens:** Paths resolved relative to wrong directory
**How to avoid:** Always resolve from person's directory, not CWD
**Warning signs:** "Image not found" errors with seemingly correct paths

## Code Examples

Verified patterns from official sources:

### Build Command Output Generation
```typescript
// Complete build flow for HTML output
async function buildHtml(
  personDir: string,
  templateId: string,
  locale: string,
  options: { quiet?: boolean },
): Promise<BuildResult> {
  const console = createConsole(options);

  // 1. Parse CV
  const cvPath = path.join(personDir, 'cv.md');
  const cvContent = await Bun.file(cvPath).text();
  const parseResult = parseCV(cvContent);

  if (parseResult.errors.length > 0) {
    throw new BuildError('Parse error', parseResult.errors, 1);
  }

  // 2. Render template
  const templatesDir = path.join(process.cwd(), 'templates');
  const renderResult = await renderCV(parseResult.data!, {
    templateId,
    locale,
  }, templatesDir);

  // 3. Process images and replace in HTML
  const imagesDir = path.join(personDir, 'images');
  const html = await embedImages(renderResult.html, imagesDir, console);

  // 4. Determine output filename
  const slug = parseResult.data!.contact.slug?.trim() || path.basename(personDir);
  const filename = `${slug}_${templateId}_${locale}.html`;

  // 5. Write output
  const outputDir = path.join(personDir, 'output');
  const result = await writeOutput(outputDir, filename, html);

  // 6. Report success
  const sizeKB = Math.round(result.bytes / 1024);
  const action = result.overwritten ? 'Overwrote existing' : 'Generated';
  console.success(`${action} ${filename} (${sizeKB}KB)`);

  return result;
}
```

### Image Embedding with ATS Warning
```typescript
// Process markdown image syntax and embed as base64
async function embedImages(
  html: string,
  imagesDir: string,
  console: ReturnType<typeof createConsole>,
): Promise<string> {
  // Match markdown images: ![alt](./images/file.png)
  const imageRegex = /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g;
  const matches = [...html.matchAll(imageRegex)];

  if (matches.length === 0) {
    return html;
  }

  // ATS warning per ATS-06
  console.warn('Images detected. ATS systems cannot parse image content.');

  let result = html;

  for (const match of matches) {
    const [fullMatch, alt, filename] = match;
    const imagePath = path.join(imagesDir, filename);

    // Validate image exists (fail build per CONTEXT.md)
    const file = Bun.file(imagePath);
    if (!(await file.exists())) {
      throw new BuildError(`Image not found: ${imagePath}`, [], 3);
    }

    // Validate format
    const ext = path.extname(filename).toLowerCase();
    const allowedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    if (!allowedFormats.includes(ext)) {
      throw new BuildError(
        `Unsupported image format: ${ext}. Allowed: ${allowedFormats.join(', ')}`,
        [],
        3,
      );
    }

    // Process image
    const processed = await processImageForHtml(imagePath);
    const dataUri = toDataUri(processed);

    // Replace in HTML (as img tag since markdown already rendered)
    // Actually the markdown is rendered, so we need to handle the img tag
    result = result.replace(
      new RegExp(`<img[^>]*src="\\.\/images\/${escapeRegex(filename)}"[^>]*>`, 'g'),
      `<img src="${dataUri}" alt="${alt}">`,
    );
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### JSON Output Mode
```typescript
// Machine-readable output for CI
interface JsonOutput {
  status: 'success' | 'error';
  files?: Array<{ path: string; bytes: number; overwritten: boolean }>;
  errors?: Array<{ code: number; message: string; line?: number }>;
  warnings?: string[];
}

function outputJson(result: JsonOutput): void {
  console.log(JSON.stringify(result, null, 2));
}

// Usage in build command
if (options.json) {
  if (errors.length > 0) {
    outputJson({
      status: 'error',
      errors: errors.map(e => ({ code: e.code, message: e.message, line: e.line })),
      warnings,
    });
    process.exit(errors[0].code);
  } else {
    outputJson({
      status: 'success',
      files: results,
      warnings,
    });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chokidar v3 with glob support | chokidar v5 ESM-only, no globs | Nov 2025 | Must use path arrays, not globs |
| chalk for colors | picocolors/ansis | 2024 | Smaller bundles, faster |
| ImageMagick subprocess | sharp native bindings | 2020+ | 4-5x faster, no external deps |
| manual CLI parsing | commander with TypeScript | Ongoing | Better type safety, auto-help |

**Deprecated/outdated:**
- **chokidar glob patterns**: Removed in v4/v5, use explicit path arrays
- **chalk v4 CJS**: chalk v5 is ESM-only, consider picocolors for simpler migration
- **node-base64-image**: Unnecessary, Buffer.toString('base64') is sufficient

## Open Questions

Things that couldn't be fully resolved:

1. **Photo vs Graphic Detection Heuristic**
   - What we know: Unique color count can differentiate (photos have more), edge density differs
   - What's unclear: Exact thresholds that work reliably
   - Recommendation: Start with file extension heuristic (JPEG = photo, PNG = graphic), add sharp.stats() entropy analysis if needed

2. **Maximum Image Size Limit**
   - What we know: Base64 bloats by 33%, large images slow browsers
   - What's unclear: What's the right limit for CV use case
   - Recommendation: Warn on images >500KB source, fail on >2MB. User can resize externally.

3. **Watch Mode New Person Detection**
   - What we know: CONTEXT.md says "Watch detects new people and builds them when required files appear"
   - What's unclear: What constitutes "required files appear" - cv.md only? cv.md + images?
   - Recommendation: Trigger build when cv.md is created/modified, not on images alone

## Sources

### Primary (HIGH confidence)
- [Sharp API - Output](https://sharp.pixelplumbing.com/api-output/) - WebP/PNG conversion options
- [Sharp API - Input](https://sharp.pixelplumbing.com/api-input/) - Metadata and format detection
- [Commander.js GitHub](https://github.com/tj/commander.js) - CLI command structure
- [Chokidar GitHub](https://github.com/paulmillr/chokidar) - File watching API
- [Bun File I/O](https://bun.com/docs/runtime/file-io) - Bun.file() and Bun.write() APIs
- [Node.js TTY Documentation](https://nodejs.org/api/tty.html) - isTTY and color detection

### Secondary (MEDIUM confidence)
- [picocolors GitHub](https://github.com/alexeyraspopov/picocolors) - Terminal color library
- [Fuse.js Documentation](https://www.fusejs.io/) - Fuzzy search configuration
- [mime-types npm](https://www.npmjs.com/package/mime-types) - MIME type lookups
- [lodash.debounce npm](https://www.npmjs.com/package/lodash.debounce) - Debounce implementation

### Tertiary (LOW confidence)
- ImageMagick discussion on color counting for cartoon detection (heuristic only)
- Various blog posts on photo vs graphic detection algorithms

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official documentation
- Architecture: HIGH - Patterns from official docs and established practices
- Pitfalls: HIGH - Based on documented issues and known edge cases
- Photo/graphic heuristic: LOW - No authoritative source, needs validation

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain)
