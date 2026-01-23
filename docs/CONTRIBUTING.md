# Contributing to CV Generator

Thank you for your interest in contributing. This document provides guidelines for contributing to cvgen.

## Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/gottz/cvgen.git
cd cvgen
```

### 2. Install dependencies

```bash
bun install
```

### 3. Run type checking

```bash
bun run typecheck
```

### 4. Run tests

```bash
bun test
```

### 5. Run linting

```bash
bun run lint
```

## Project Structure

```
cvgen/
├── packages/
│   ├── cli/          # Command-line interface
│   │   └── src/
│   │       ├── commands/    # CLI commands (build, init, validate)
│   │       └── lib/         # Utilities (PDF, DOCX, spinner)
│   ├── core/         # Schema and parser
│   │   └── src/
│   │       ├── schema/      # TypeScript interfaces
│   │       └── parser/      # Markdown parser
│   └── templates/    # Template engine
│       └── src/
│           ├── engine/      # Nunjucks setup
│           └── filters/     # Custom template filters
├── templates/        # Built-in templates
│   ├── base/         # Base template (foundation)
│   ├── modern/       # Modern template
│   ├── minimal/      # Minimal template
│   └── classic/      # Classic template
├── people/           # Example CVs
├── docs/             # Documentation
└── schemas/          # JSON schemas
```

## Making Changes

### Code Style

- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `bun run lint` before committing
- Use TypeScript with strict mode
- Write descriptive commit messages
- Use tabs for indentation (Biome default)

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting: `bun run lint`
5. Run type checking: `bun run typecheck`
6. Run tests: `bun test`
7. Commit with a descriptive message
8. Push to your fork
9. Open a Pull Request

### Commit Messages

Follow conventional commits format:

| Prefix | Usage |
|--------|-------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `refactor:` | Code refactoring |
| `test:` | Test additions/changes |
| `chore:` | Build/tooling changes |

Examples:
- `feat: add support for custom date formats`
- `fix: handle empty skills section gracefully`
- `docs: update CLI reference with new flags`

## Adding Templates

### 1. Copy an existing template

```bash
cp -r templates/modern templates/my-template
```

### 2. Modify the files

- `config.json` - Template metadata
- `template.njk` - HTML structure
- `styles.css` - Styling

### 3. Ensure ATS compliance

- Single-column layout
- Standard fonts (Arial, Times New Roman)
- Semantic HTML structure
- No tables for layout

### 4. Test with example CV

```bash
cvgen build alex-chen my-template
```

### 5. Update list-templates output

Templates are auto-discovered from the `/templates/` directory.

## Adding New Sections

To add support for a new CV section type:

### 1. Update schema (packages/core)

Add the new section type to `src/schema/types.ts`

### 2. Update parser (packages/core)

Add parsing logic to `src/parser/sections.ts`

### 3. Update templates

Add rendering for the new section in `templates/*/template.njk`

### 4. Update DOCX builder (packages/cli)

Add section builder in `src/lib/docx-sections.ts`

### 5. Add tests

Cover parsing, rendering, and DOCX generation

### 6. Update documentation

Document the new section in `docs/MARKDOWN.md`

## Reporting Issues

Before opening an issue:

1. Search existing issues
2. Check if it's a known limitation

When creating an issue, include:

- cvgen version (`cvgen --version`)
- Bun version (`bun --version`)
- Operating system
- Reproduction steps
- Expected vs actual behavior
- Relevant error messages

## Questions?

- Open a discussion on GitHub
- Check the [FAQ](./FAQ.md)
- Review existing issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
