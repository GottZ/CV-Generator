# CV Generator

Generate ATS-optimized CVs from markdown.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **ATS-Optimized**: Single-column layouts, standard fonts, semantic HTML structure
- **Multiple Formats**: Generate HTML, PDF, and DOCX from a single markdown source
- **Three Templates**: Modern (bold/geometric), Minimal (clean/spacious), Classic (traditional/formal)
- **Multi-Language**: Support for English and German section headers and date formats
- **Customizable**: Override colors, fonts, and margins via configuration
- **IT Professional**: Projects, certifications, and tech stack per job position

## Quick Start

```bash
# Install globally
bun add -g @gottz/cvgen

# Create a new CV
cvgen init john-doe

# Edit your CV
cd people/john-doe
# Edit cv.md with your information

# Generate all formats
cvgen build john-doe modern
```

Your CV will be generated in `people/john-doe/output/`:
- `john-doe_modern_en.html` - Self-contained HTML with embedded CSS
- `john-doe_modern_en.pdf` - Print-ready PDF with bookmarks
- `john-doe_modern_en.docx` - Word document with proper heading styles

## Templates

| Template | Style | Best For |
|----------|-------|----------|
| **modern** | Bold, geometric, generous whitespace | Tech, creative roles |
| **minimal** | Clean, airy, wide margins for notes | Print-focused, interviews |
| **classic** | Traditional, formal, centered header | Corporate, finance, law |

All templates are ATS-compliant with single-column layouts and standard fonts.

## Commands

### `cvgen build <name> <template>`

Generate CV in all formats.

```bash
# Generate with specific template
cvgen build john-doe modern

# Generate specific formats only
cvgen build john-doe minimal --format html,pdf

# Skip DOCX generation
cvgen build john-doe classic --no-docx

# Dry run (show what would be generated)
cvgen build john-doe modern --dry-run
```

### `cvgen init <name>`

Create a new CV directory with example content.

```bash
cvgen init jane-smith
```

### `cvgen validate <name>`

Check CV markdown without generating files.

```bash
cvgen validate john-doe
```

### `cvgen list-templates`

Show available templates.

```bash
cvgen list-templates
```

## Documentation

- [CV Markdown Format](./docs/MARKDOWN.md) - Syntax for writing your CV
- [CLI Reference](./docs/CLI.md) - Complete command documentation
- [Template Customization](./docs/CUSTOMIZATION.md) - Colors, fonts, and margins
- [FAQ](./docs/FAQ.md) - Frequently asked questions

## Requirements

- [Bun](https://bun.sh/) 1.0+
- Chrome/Chromium (for PDF generation via Puppeteer)

## Development

### Running the CLI

When developing locally, use the convenience script instead of the full path:

```bash
# Instead of: bun run packages/cli/src/index.ts build jane modern
bun run cvgen build jane modern

# All commands work the same
bun run cvgen --help
bun run cvgen init john-doe
bun run cvgen ai analyze jane
```

### Running Tests

Tests run in Docker to ensure consistent font rendering across all environments (local development and CI). Font rendering differences between operating systems can cause visual regression tests to fail even when the code is correct.

```bash
# Run tests locally (same environment as CI)
docker compose -f docker-compose.test.yml run --rm test
```

Tests include:
- Visual regression tests for all three templates (Modern, Minimal, Classic)
- Page count assertions for single and multi-page CVs
- PDF metadata validation

### Updating Baseline Snapshots

After intentional CSS changes that affect visual output, update the baseline snapshots:

```bash
docker compose -f docker-compose.test.yml run --rm test npx playwright test --update-snapshots
```

Review the diff before committing to ensure changes are expected. The snapshot files are located in `tests/pdf-*.spec.ts-snapshots/`.

### CI

Tests run automatically on every pull request via GitHub Actions. The workflow:

1. Builds the Docker test container
2. Runs all Playwright tests
3. On failure, uploads artifacts for debugging:
   - **playwright-report**: Full HTML report with test results
   - **snapshot-diffs**: Visual diff images showing what changed

To view artifacts from a failed run: Go to the Actions tab, select the failed workflow run, and scroll to the Artifacts section at the bottom.

## License

MIT - See [LICENSE](./LICENSE)

---

Made with care for IT professionals who deserve better CVs.
