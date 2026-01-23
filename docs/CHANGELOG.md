# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Three template themes: Modern, Minimal, Classic
- Configuration cascade (global, template, env, frontmatter)
- Customizable colors, fonts, and margins
- Shared template infrastructure with macros and partials
- Comprehensive documentation

## [0.1.0] - 2026-01-23

### Added
- Initial release
- HTML, PDF, DOCX output formats
- Multi-language support (EN, DE)
- Projects and Certifications sections
- Tech stack per job position with skills cross-referencing
- CLI commands: build, init, validate, list-templates
- Base template with ATS-optimized layout
- PDF features: metadata, bookmarks, page numbers
- DOCX features: Navigation Pane headings, native page numbers
- Fuzzy matching for person and template names
- Dry-run mode to preview output
- Watch mode for development
- JSON output for scripting
- Image embedding (base64 in HTML, embedded in DOCX)

### Technical
- Bun runtime with TypeScript
- Commander.js for CLI
- Puppeteer for PDF generation
- docx library for Word documents
- Nunjucks for templating
- Biome for linting
