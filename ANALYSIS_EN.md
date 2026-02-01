# Project Complexity Analysis: CV-Generator

**Analysis Date:** 2026-02-01
**Analyzed by:** Claude (Opus 4.5)
**Repository:** GottZ/CV-Generator

---

## 1. Project Metrics

| Metric | Value |
|--------|-------|
| TypeScript Source Code | **~21,533 lines** (160 files) |
| HTML/CSS Templates | **~2,900 lines** (Nunjucks + CSS) |
| Integration Tests | **~1,831 lines** (Playwright) |
| Planning/Documentation Markdown | **~72,195 lines** |
| JSON Configurations | **~344 lines** |
| Git Commits (visible) | **50** |
| Packages (Monorepo) | **3** (@gottz/cvgen, @gottz/cv-core, @gottz/cv-templates) |
| Milestones | **3** (v1.0, v1.1, v1.2) |
| Development Phases | **20** |
| Plans | **65+** |
| Requirements Implemented | **108** (41 + 20 + 47) |
| Direct Dependencies | **30+** |

---

## 2. Technical Complexity Domains

The project integrates **at least 12 distinct technical domains** into a cohesive system:

### 2.1 Monorepo Architecture & Build System

- Bun workspaces with 3 packages and clean dependency graph
- ESM modules, TypeScript strict mode, no traditional build step (Bun shebang)
- Biome for linting and formatting

### 2.2 CLI Framework (Commander.js)

- 7 main commands + 10 AI subcommands + wizard subcommands
- Fuzzy matching (Fuse.js), spinners (Ora), progress indicators
- Colored terminal output (Picocolors)

### 2.3 Markdown Parser with Schema Validation

- Custom parser for CV-specific Markdown
- YAML frontmatter parsing (gray-matter), section extraction
- Zod 4 schema validation with type inference
- Multi-language support (EN/DE)

### 2.4 Template Engine (Nunjucks)

- 3 complete CV templates (Modern, Minimal, Classic)
- Shared macros/partials, custom filters
- Configurable styling (colors, fonts, margins)
- i18n layer with Dayjs date formatting

### 2.5 PDF Generation Pipeline

- Puppeteer for HTML-to-PDF conversion
- Two-pass generation (sparse last page elimination)
- PDF bookmarks via pdf-lib, metadata injection
- CSS fragmentation for correct pagination
- Flexbox-to-block conversion for break properties

### 2.6 DOCX Generation

- CSS-to-DOCX style extraction for visual parity
- Section-based document generation (docx library)
- Cross-format consistency

### 2.7 AI/LLM Integration (Vercel AI SDK)

- 3 providers (Anthropic Claude, OpenAI, Ollama) with unified abstraction
- 4-stage workflow with persistent state (.ai-state.json)
- 5 content generators: Bullets, Summary, Keywords, Improve, Tailor
- Nunjucks-based prompt templates
- Structured output via Zod schemas

### 2.8 Review System

- Git-add-p style accept/edit/skip/regenerate interface
- Diff display (side-by-side or inline, based on terminal width)
- Weak bullet detection (4 categories: lacks_quantification, missing_outcome, too_generic, passive_voice)
- External editor integration ($VISUAL/$EDITOR/vi fallback)
- Regeneration with temperature bumping and Jaccard deduplication

### 2.9 Interactive Wizard (Inquirer)

- Complete CV creation via guided prompts
- Input validation, defaults, back navigation
- Markdown writer, summary display
- STAR method for achievement bullets

### 2.10 Non-Interactive Mode

- TTY detection with automatic mode switching
- Flag-based input, JSON input, stdin support
- Dry-run mode, state builder with conflict detection
- CI/CD-ready output (stderr/stdout separation)

### 2.11 Test Infrastructure

- Playwright visual regression (pixel comparison, 1% tolerance)
- Text extraction tests (ATS verification)
- Structural HTML validation
- Print parity tests (browser Ctrl+P = CLI PDF)
- Docker container for consistent font rendering

### 2.12 CI/CD

- GitHub Actions pipeline
- Docker-based test environment (Chromium + fonts)
- Artifact upload on failures
- JUnit reports

---

## 3. Architecture Overview

```
┌─────────────────────────────────────┐
│      CLI Layer (@gottz/cvgen)       │
│  Commands: build, init, validate... │
│  AI Workflows & Interactive Wizard  │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────────┐  ┌──────────────┐
   │ Core Parser │  │   Renderer   │
   │  (@gottz/   │  │  (@gottz/cv- │
   │  cv-core)   │  │  templates)  │
   │             │  │              │
   │ - CV Parser │  │ - Nunjucks   │
   │ - Schema    │  │ - Config     │
   │ - Types     │  │ - i18n       │
   └─────────────┘  └──────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │      Output Generation      │
   │  - HTML + PDF (Puppeteer)   │
   │  - DOCX (docx library)     │
   │  - Metadata & Bookmarks    │
   └─────────────────────────────┘
```

**Data Flow:**
```
Markdown + YAML → [Core Parser] → Typed CV Data
→ [Renderer + Template + i18n] → HTML String
→ [PDF Generator | DOCX Generator | HTML Writer] → Output File
```

---

## 4. Effort Estimation

### 4.1 Detailed Breakdown

| Area | Senior (8+ yrs) | Mid-Level (4–6 yrs) | Rationale |
|------|:-:|:-:|-----------|
| Project setup, architecture, monorepo | 8–12 | 16–20 | Workspace config, TypeScript, linting, package structure |
| Core parser + schema | 16–24 | 30–40 | Custom Markdown parsing, Zod schemas, frontmatter, section normalization |
| Template engine + i18n | 12–16 | 20–28 | Nunjucks integration, filters, loader, config system, 2 languages |
| 3 HTML/CSS templates | 24–40 | 40–60 | Per template: layout, styling, print CSS, ATS optimization. Shared components. |
| PDF pipeline | 16–24 | 28–40 | Puppeteer, two-pass, bookmarks, metadata, pagination |
| DOCX generation | 12–20 | 24–32 | CSS style extraction, format parity, limited reference material |
| HTML output + image processing | 6–10 | 10–16 | Self-contained HTML, Base64 embedding, Sharp integration |
| CLI framework (all commands) | 12–16 | 20–28 | 7 commands, options, help text, fuzzy matching, spinners |
| AI subsystem (complete) | 40–60 | 70–100 | Provider abstraction, workflow state machine, 5 generators, prompt engineering, review UI |
| Wizard system | 30–40 | 50–70 | Prompts for all sections, validation, navigation, Markdown writer |
| Non-interactive mode | 12–16 | 20–28 | TTY detection, flag/JSON input, dry-run, state builder |
| Template scaffolding | 10–14 | 16–24 | Copy/validate, customization prompts, wizard |
| Test infrastructure | 20–30 | 35–50 | Playwright, visual regression, Docker CI, helpers, GitHub Actions |
| Configuration system | 8–12 | 14–20 | Cascade (4 levels), schema validation |
| Documentation | 12–16 | 16–24 | CLI docs, Markdown guide, customization, FAQ, contributing, changelog |
| Integration, debugging, edge cases | 20–30 | 40–60 | Cross-format parity, ATS testing, provider compatibility |

### 4.2 Total Estimate

| Developer Level | Hours | Approximate Duration (40h/week) |
|:----------------|------:|:--------------------------------|
| **Senior Developer** (8+ years) | **260 – 380** | **6.5 – 9.5 weeks** |
| **Mid-Level Developer** (4–6 years) | **450 – 640** | **11 – 16 weeks** |
| **Junior Developer** | Not realistically achievable | — |

---

## 5. Estimation Rationale

### 5.1 Primary Cost Drivers

**AI Subsystem (~25% of total effort)**

Multi-provider abstraction with 3 LLM vendors, a 4-stage workflow with state persistence, 5 separate content generators, iterative prompt engineering, and a review system with accept/edit/skip/regenerate. This is effectively a standalone application within the application.

**PDF/DOCX Pipeline (~15%)**

Converting HTML to PDF with correct pagination (CSS fragmentation, two-pass generation, sparse page elimination) is notoriously difficult. DOCX generation with style parity derived from CSS is a poorly documented domain requiring significant trial-and-error.

**3 Complete Templates (~10%)**

Each template requires layout design, print CSS (which behaves fundamentally differently from screen CSS), ATS compatibility, and cross-format consistency. Print parity (browser Ctrl+P = CLI PDF) is its own testing challenge.

**Wizard + Non-Interactive Mode (~15%)**

Two completely separate execution paths (interactive vs. non-interactive) for the same functionality, with STAR method integration, AI enhancement, and full validation.

**Test Infrastructure (~8%)**

Visual regression testing with pixel comparison, Docker-based CI for font consistency, and multiple test types (visual, structural, text extraction, parity).

### 5.2 Why a Junior Developer Would Struggle

- Too many specialized domains (PDF pagination, LLM integration, print CSS, DOCX specification)
- Non-obvious problems without established Stack Overflow solutions
- Architectural decisions with long-term consequences (monorepo design, provider abstraction)
- State management complexity in the AI workflow

---

## 6. Required Skills

### 6.1 Must-Have

| Skill | Application Area |
|-------|-----------------|
| **TypeScript** (advanced) | Strict mode, Zod, ESM, generics, discriminated unions |
| **Node.js/Bun Runtime** | Filesystem APIs, streams, child processes |
| **CLI Design** | Commander.js, Inquirer, terminal UX patterns |
| **HTML/CSS** | Print CSS, CSS fragmentation, ATS-friendly layouts |
| **Template Engines** | Nunjucks (Jinja2-like), macros, partials |
| **PDF Generation** | Puppeteer, pdf-lib, browser automation |
| **Testing** | Playwright, visual regression, Docker-based CI |

### 6.2 Should-Have

| Skill | Application Area |
|-------|-----------------|
| **LLM/AI Integration** | Vercel AI SDK, prompt engineering, structured output |
| **DOCX Specification** | Open XML format, programmatic document generation |
| **Monorepo Management** | Workspace configuration, package boundaries |
| **ATS Systems** | Understanding of iCIMS and similar systems |
| **Image Processing** | Sharp, Base64 encoding |

### 6.3 Nice-to-Have

| Skill | Application Area |
|-------|-----------------|
| **Docker** | Containers for test consistency |
| **GitHub Actions** | CI/CD pipeline design |
| **Fuzzy Search** | Fuse.js integration |
| **i18n Patterns** | Multilingual support |

---

## 7. Required Expertise Level

**Recommendation: Senior Level (8+ years of experience)**

### Rationale

1. **Architectural Maturity:** The monorepo with 3 cleanly separated packages, the clean dependency chain (`cli → core + templates`), and the plugin architecture for LLM providers require architectural thinking that typically comes only with several years of experience.

2. **Cross-Domain Competence:** A single developer must master CLI design, PDF rendering, DOCX generation, template engineering, AI integration, and test infrastructure. This breadth is atypical for mid-level positions.

3. **Non-Obvious Problems:** Two-pass PDF generation, CSS fragmentation for print, flexbox-to-block conversion for break properties, ATS parseability — these are problems known only through experience. There is minimal reference material available.

4. **State Machine Design:** The 4-stage AI workflow with persistence, resume capability, and inter-stage data flow requires strong abstraction skills.

5. **UX Decisions:** The review system (git-add-p style), terminal-width-adaptive diff display, correct stderr/stdout separation for CI/CD compatibility — these are design decisions that require developer experience.

---

## 8. Context

The project was implemented in **~4 days** (January 22–26, 2026) according to the git history and milestone documentation. This is consistent with intensive AI-assisted development, where an experienced human makes architectural decisions while the AI handles the bulk of the implementation.

The 72,195 lines of planning documentation (3.4x more than the actual code) are a typical artifact of an AI-assisted workflow using a structured phase-plan-execute-verify methodology.

**Without AI assistance**, the same result would require an estimated **260–380 hours (senior)** or **450–640 hours (mid-level)** — roughly **7–10 weeks full-time** for an experienced solo developer.

---

*Generated on 2026-02-01 through analysis of the complete git repository, commit history, source code, and project documentation.*
