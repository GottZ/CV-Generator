# CLI Reference

Complete documentation for the cvgen command-line interface.

## Global Options

```
--version, -V    Show version number
--help, -h       Show help for a command
```

## Commands

### `cvgen build <name> <template>`

Generate CV files in HTML, PDF, and DOCX formats.

**Arguments:**
- `<name>` - Person name (directory under `/people/`)
- `<template>` - Template to use (modern, minimal, classic, or 'auto')

**Options:**

| Flag | Description |
|------|-------------|
| `--format <formats>` | Output formats (comma-separated: html,pdf,docx) |
| `--no-pdf` | Skip PDF generation |
| `--no-docx` | Skip DOCX generation |
| `--html-only` | Generate HTML only (skip PDF and DOCX) |
| `--locale <locales>` | Locales to build (comma-separated, default: all in CV) |
| `--dry-run` | Show what would be generated without writing files |
| `--watch [filter]` | Watch for changes and rebuild |
| `--quiet` | Suppress progress output |
| `--json` | Output results as JSON |
| `--people-dir <dir>` | Custom people directory (default: ./people) |
| `--template-dir <dir>` | Custom templates directory (default: ./templates) |

**Examples:**

```bash
# Generate all formats with modern template
cvgen build john-doe modern

# Generate only HTML and PDF
cvgen build john-doe minimal --format html,pdf

# Skip DOCX generation
cvgen build john-doe classic --no-docx

# Generate only HTML
cvgen build john-doe modern --html-only

# German language output
cvgen build john-doe modern --locale de

# Build multiple locales
cvgen build john-doe modern --locale en,de

# See what would be generated
cvgen build john-doe modern --dry-run

# Machine-readable output
cvgen build john-doe modern --json

# Watch mode - rebuild on file changes
cvgen build john-doe modern --watch

# Auto-select template (if only one available)
cvgen build john-doe auto
```

**Output:**

Files are written to `/people/<name>/output/`:
- `<name>_<template>_<locale>.html`
- `<name>_<template>_<locale>.pdf`
- `<name>_<template>_<locale>.docx`

### `cvgen init <name>`

Create a new CV directory with example content.

**Arguments:**
- `<name>` - Person name (will be slugified: "John Doe" -> "john-doe")

**Options:**

| Flag | Description |
|------|-------------|
| `--quiet` | Suppress progress output |
| `--json` | Output results as JSON |

**Examples:**

```bash
# Create new CV directory
cvgen init john-doe

# Create with spaces (automatically slugified)
cvgen init "Jane Smith"

# Interactive mode (prompts for name)
cvgen init
```

**Creates:**

```
people/
└── john-doe/
    ├── cv.md           # Example CV markdown
    └── images/
        └── photo.jpg   # Placeholder photo
```

### `cvgen validate <name>`

Check CV markdown structure without generating files.

**Arguments:**
- `<name>` - Person name to validate

**Options:**

| Flag | Description |
|------|-------------|
| `--locale <locale>` | Validate specific locale only |
| `--quiet` | Show only errors |
| `--json` | Output results as JSON |

**Examples:**

```bash
# Validate CV structure
cvgen validate john-doe

# Validate specific locale
cvgen validate john-doe --locale en

# Get validation result as JSON
cvgen validate john-doe --json
```

**Output:**

Shows validation summary with:
- Number of sections found
- Number of jobs, degrees, skill categories
- Available locales
- Any warnings (unknown sections, expired certifications)

### `cvgen list-templates`

Display available templates.

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--quiet` | Suppress non-error output |

**Examples:**

```bash
# Show templates in table format
cvgen list-templates

# Get templates as JSON
cvgen list-templates --json
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (parse error, validation failed) |
| 2 | Template error (not found, invalid) |
| 3 | File error (person not found, cv.md missing) |
| 130 | User cancelled (Ctrl+C) |

## Environment Variables

Override template styles via environment variables:

| Variable | Description |
|----------|-------------|
| `CVGEN_ACCENT_COLOR` | Override accent color (#hex format) |
| `CVGEN_FONT_HEADING` | Override heading font family |
| `CVGEN_FONT_BODY` | Override body font family |
| `CVGEN_MARGINS` | Override page margins (narrow/normal/wide or mm) |

**Examples:**

```bash
# Use red accent color
CVGEN_ACCENT_COLOR="#dc2626" cvgen build john-doe modern

# Use narrow margins
CVGEN_MARGINS="narrow" cvgen build john-doe minimal

# Combine multiple overrides
CVGEN_ACCENT_COLOR="#059669" CVGEN_FONT_BODY="Calibri, Arial, sans-serif" cvgen build john-doe modern
```

Environment variables override global and template configuration, but are overridden by frontmatter style settings. See [Customization](./CUSTOMIZATION.md) for the full configuration cascade.
