# Architecture Research

**Project:** CV/Resume Generator CLI Tool
**Researched:** 2026-01-22
**Confidence:** HIGH (based on established patterns in document generation tools)

## High-Level Architecture

```
                        +------------------+
                        |   CLI Interface  |
                        |   (Commander.js) |
                        +--------+---------+
                                 |
                                 v
+----------------+      +--------+---------+      +------------------+
|  /people/      |      |   Core Pipeline  |      |   /templates/    |
|  [name]/       +----->+                  +<-----+   [template]/    |
|  cv.md         |      |   Orchestrator   |      |   styles/        |
+----------------+      +--------+---------+      +------------------+
                                 |
              +------------------+------------------+
              |                  |                  |
              v                  v                  v
      +-------+------+   +-------+------+   +------+-------+
      |  PDF         |   |  HTML        |   |  DOCX        |
      |  Renderer    |   |  Renderer    |   |  Renderer    |
      |  (Puppeteer) |   |  (Embedded)  |   |  (docx lib)  |
      +-------+------+   +-------+------+   +------+-------+
              |                  |                  |
              v                  v                  v
      +-------+------+   +-------+------+   +------+-------+
      |  output.pdf  |   |  output.html |   |  output.docx |
      +--------------+   +--------------+   +--------------+
```

## Core Components

### 1. CLI Interface Layer

**Responsibility:** Parse commands, options, validate input paths, orchestrate execution.

**Boundaries:**
- Receives: User commands, flags, file paths
- Outputs: Calls to Core Pipeline, user feedback (progress, errors)
- Does NOT: Process markdown, apply templates, generate documents

**Implementation:**
- Commander.js for argument parsing (industry standard)
- Chalk for colored output
- Ora for progress spinners

**Commands:**
```
cv-gen build <name> [--template=modern] [--format=pdf,html,docx] [--output=./out]
cv-gen list-templates
cv-gen validate <name>
cv-gen init <name>
```

### 2. Data Layer (Parser)

**Responsibility:** Extract structured data from markdown CV files.

**Sub-components:**

#### 2a. Frontmatter Extractor
- Uses gray-matter library (battle-tested, used by Gatsby, Astro, etc.)
- Extracts YAML metadata: name, contact, summary, target role
- Returns `{ data: Object, content: string }`

#### 2b. Markdown Parser
- Uses marked (for speed) or unified/remark (for extensibility)
- **Recommendation:** Use marked for this project (simpler, faster, sufficient)
- Converts markdown sections to HTML fragments

#### 2c. Schema Validator
- Validates frontmatter against expected schema
- Ensures required sections exist
- Provides helpful error messages for missing/malformed data

**Boundaries:**
- Receives: Raw markdown file content
- Outputs: Structured CV data object
- Does NOT: Know about templates, output formats

**Data Structure Output:**
```typescript
interface CVData {
  meta: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    targetRole?: string;
  };
  sections: {
    summary?: string;      // HTML string
    experience: Experience[];
    education: Education[];
    skills: string[] | SkillCategory[];
    certifications?: Certification[];
    projects?: Project[];
    [custom: string]: any; // Allow custom sections
  };
  raw: {
    frontmatter: string;
    content: string;
  };
}
```

### 3. Template Engine Layer

**Responsibility:** Apply design templates to structured CV data.

**Sub-components:**

#### 3a. Template Loader
- Discovers templates from `/templates/` directory
- Loads template config (layout options, required sections)
- Caches templates for performance

#### 3b. Template Processor
- **Recommendation:** Handlebars (logic-less, precompilable, helpers/partials)
- Injects CV data into template placeholders
- Produces intermediate HTML with inline CSS

#### 3c. Style Processor
- Loads template-specific CSS
- For HTML output: Embeds CSS in `<style>` tags (self-contained)
- For PDF output: Applies CSS via Puppeteer
- For DOCX output: Maps CSS concepts to DOCX styling

**Boundaries:**
- Receives: CVData object, template name
- Outputs: Styled HTML string (intermediate representation)
- Does NOT: Write files, know about ATS requirements

**Template Structure:**
```
/templates/
  /modern/
    template.hbs       # Handlebars template
    styles.css         # Template styles
    config.json        # Template metadata, options
  /ats-optimized/
    template.hbs
    styles.css
    config.json
```

### 4. Renderer Layer

Three separate renderers, all consuming the same intermediate HTML.

#### 4a. HTML Renderer

**Responsibility:** Produce self-contained HTML file.

**Implementation:**
- Embeds CSS directly in `<style>` tag (not object tag - that's for embedding external documents)
- Optionally converts images to base64 data URIs
- Produces single-file HTML that works anywhere

**ATS Considerations:**
- Plain text must be extractable
- No complex JavaScript that hides content
- Semantic HTML structure

#### 4b. PDF Renderer

**Responsibility:** Produce ATS-optimized PDF.

**Implementation:**
- **Recommendation:** Puppeteer (or Playwright) over wkhtmltopdf
- wkhtmltopdf uses older WebKit, has rendering quirks
- Puppeteer uses current Chromium, better CSS support
- Generates text-layer PDF (not rasterized)

**ATS Considerations (Critical for iCIMS):**
- Full text layer (selectable, searchable)
- Single-column layout (no tables/columns that break parsing)
- Standard section headings (Summary, Experience, Education, Skills)
- System-safe fonts (Arial, Calibri, Times New Roman)
- No headers/footers for contact info (main body only)
- Standard bullet points (Unicode bullet or hyphen)

**PDF Generation Settings:**
```typescript
const pdfOptions = {
  format: 'Letter',        // or 'A4'
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  displayHeaderFooter: false,  // ATS: keep contact in body
};
```

#### 4c. DOCX Renderer

**Responsibility:** Produce ATS-optimized Word document.

**Implementation Options:**
1. **docx library** (dolanmiu/docx) - Programmatic DOCX creation
2. **remark-docx** - Markdown to DOCX via remark ecosystem
3. **html-to-docx** - Convert intermediate HTML to DOCX

**Recommendation:** Use docx library directly
- Full control over DOCX structure
- Better ATS compatibility (avoid HTML conversion quirks)
- Can ensure no tables, proper section structure

**ATS Considerations:**
- No tables or text boxes
- Standard section headings
- Simple formatting only
- .docx format (not .doc)

### 5. Output Layer

**Responsibility:** Write generated files to filesystem.

**Implementation:**
- Creates output directory structure
- Names files appropriately: `{name}_{template}.{format}`
- Handles overwrites gracefully
- Reports success/failure

**Boundaries:**
- Receives: Generated document buffer/string, output path, format
- Outputs: Written files
- Does NOT: Generate content, decide file names (receives them)

## Data Flow

### Complete Pipeline Flow

```
1. CLI PARSE
   User runs: cv-gen build john-doe --template=modern --format=pdf,html,docx

2. INPUT RESOLUTION
   CLI resolves: /people/john-doe/cv.md
   CLI resolves: /templates/modern/

3. MARKDOWN PARSING
   Parser reads: cv.md
   gray-matter extracts: frontmatter (YAML) + content (Markdown)
   marked converts: Markdown -> HTML fragments

4. SCHEMA VALIDATION
   Validator checks: Required fields present
   Validator checks: Data types correct
   Returns: CVData object or validation errors

5. TEMPLATE APPLICATION
   Template Engine loads: /templates/modern/template.hbs
   Template Engine loads: /templates/modern/styles.css
   Handlebars renders: CVData -> Styled HTML

6. RENDERING (parallel for each format)
   PDF Renderer: HTML -> Puppeteer -> PDF buffer
   HTML Renderer: HTML -> Embed styles -> HTML string
   DOCX Renderer: CVData -> docx library -> DOCX buffer

7. OUTPUT
   Writer creates: /output/john-doe_modern.pdf
   Writer creates: /output/john-doe_modern.html
   Writer creates: /output/john-doe_modern.docx
```

### Data Transformation Stages

```
cv.md (raw markdown)
    |
    v
{ frontmatter: YAML, content: Markdown }  (gray-matter output)
    |
    v
CVData {                                   (structured data)
  meta: { name, email, ... },
  sections: { summary, experience, ... }
}
    |
    v
StyledHTML (string)                        (template output)
    |
    +---> PDF Buffer (Puppeteer)
    |
    +---> HTML String (self-contained)
    |
    +---> DOCX Buffer (docx library)
```

## Suggested Build Order

Based on component dependencies, build in this order:

### Phase 1: Foundation (No Dependencies)

1. **Project Setup**
   - TypeScript configuration
   - ESLint, Prettier
   - Package.json with CLI bin configuration
   - Basic directory structure

2. **Data Layer - Schema & Types**
   - Define CVData TypeScript interfaces
   - Define validation schema (Zod or Joi)
   - This drives all other components

### Phase 2: Input Pipeline

3. **Parser Module**
   - gray-matter integration
   - marked integration
   - Returns CVData from markdown

4. **Validator Module**
   - Validates CVData against schema
   - Helpful error messages

**Checkpoint:** Can parse markdown and validate structure

### Phase 3: Template System

5. **Template Loader**
   - Discover templates from /templates/
   - Load template configs

6. **Template Processor**
   - Handlebars setup
   - Render CVData to HTML

**Checkpoint:** Can render markdown to styled HTML

### Phase 4: Renderers (Parallel Development Possible)

7. **HTML Renderer** (simplest - start here)
   - Embed CSS
   - Self-contained output

8. **PDF Renderer**
   - Puppeteer setup
   - ATS optimization

9. **DOCX Renderer**
   - docx library setup
   - ATS optimization

**Checkpoint:** All three output formats working

### Phase 5: CLI & Polish

10. **CLI Interface**
    - Commander.js commands
    - Progress feedback
    - Error handling

11. **Integration & Testing**
    - End-to-end tests
    - ATS validation testing

### Dependency Graph

```
Types/Schema (must be first)
    |
    +---> Parser (needs types)
    |         |
    |         +---> Validator (needs parser output)
    |
    +---> Template Loader (needs types)
              |
              +---> Template Processor (needs loader)
                        |
                        +---> HTML Renderer (needs processor output)
                        |
                        +---> PDF Renderer (needs processor output)
                        |
                        +---> DOCX Renderer (needs types + processor output)

CLI (can start early, depends on all for integration)
```

## File Structure

Recommended project layout:

```
cv-generator/
├── src/
│   ├── index.ts              # Entry point
│   ├── cli/
│   │   ├── index.ts          # CLI setup
│   │   ├── commands/
│   │   │   ├── build.ts      # Build command
│   │   │   ├── validate.ts   # Validate command
│   │   │   ├── list.ts       # List templates
│   │   │   └── init.ts       # Initialize new CV
│   │   └── ui.ts             # Chalk, Ora helpers
│   │
│   ├── parser/
│   │   ├── index.ts          # Parser orchestration
│   │   ├── frontmatter.ts    # gray-matter wrapper
│   │   ├── markdown.ts       # marked wrapper
│   │   └── validator.ts      # Schema validation
│   │
│   ├── template/
│   │   ├── index.ts          # Template orchestration
│   │   ├── loader.ts         # Template discovery/loading
│   │   └── processor.ts      # Handlebars rendering
│   │
│   ├── renderers/
│   │   ├── index.ts          # Renderer factory
│   │   ├── html.ts           # HTML renderer
│   │   ├── pdf.ts            # PDF renderer (Puppeteer)
│   │   └── docx.ts           # DOCX renderer
│   │
│   ├── output/
│   │   └── writer.ts         # File writing
│   │
│   └── types/
│       ├── index.ts          # Type exports
│       ├── cv.ts             # CVData interfaces
│       └── template.ts       # Template interfaces
│
├── templates/
│   ├── modern/
│   │   ├── template.hbs
│   │   ├── styles.css
│   │   └── config.json
│   ├── ats-optimized/
│   │   ├── template.hbs
│   │   ├── styles.css
│   │   └── config.json
│   └── minimal/
│       └── ...
│
├── people/                   # User CV data (gitignored in real use)
│   └── example/
│       └── cv.md
│
├── bin/
│   └── cv-gen.js             # CLI executable entry
│
├── tests/
│   ├── unit/
│   │   ├── parser.test.ts
│   │   ├── template.test.ts
│   │   └── renderers/
│   ├── integration/
│   │   └── pipeline.test.ts
│   └── fixtures/
│       └── sample-cv.md
│
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## ATS Optimization Architecture

Since iCIMS expert-grade scoring is a requirement, ATS optimization must be built into the architecture, not bolted on.

### ATS-Aware Components

1. **Schema Definition**
   - Enforce standard section names (Summary, Experience, Education, Skills)
   - Require contact info fields

2. **Template Design**
   - Single-column layouts only
   - No tables, no text boxes
   - Semantic HTML (h1, h2, ul, p)

3. **PDF Renderer**
   - Text layer must be extractable
   - No flattening/rasterization
   - Standard fonts only

4. **DOCX Renderer**
   - Simple formatting
   - No tables
   - Standard bullet characters

### ATS Validation Module (Future Enhancement)

Consider adding an ATS validation step that checks:
- [ ] Contact info in main body (not header/footer)
- [ ] Standard section headings
- [ ] No tables or columns
- [ ] Text extractable from PDF
- [ ] Keyword density for target role

## Technology Decisions Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| CLI | Commander.js | Industry standard, well-documented |
| Frontmatter | gray-matter | Battle-tested, used by major SSGs |
| Markdown | marked | Fast, simple, sufficient for this use case |
| Validation | Zod | TypeScript-first, great error messages |
| Templates | Handlebars | Logic-less, precompilable, partials |
| PDF | Puppeteer | Modern Chromium, text-layer PDFs |
| DOCX | docx (dolanmiu) | Full control, ATS-safe structure |
| Output | chalk + ora | Industry standard CLI feedback |

## Sources

- [markdown-resume (there4)](https://github.com/there4/markdown-resume) - PHP architecture reference
- [markdown-resume-js](https://github.com/c0bra/markdown-resume-js) - Node.js architecture reference
- [OpenResume](https://github.com/xitanggg/open-resume) - React-based resume builder architecture
- [gray-matter](https://github.com/jonschlinkert/gray-matter) - Frontmatter parsing
- [iCIMS Developer Resources](https://developer-community.icims.com/applications/applicant-tracking/binary-files) - ATS parsing requirements
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - CLI architecture patterns
- [Playwright vs Puppeteer (BrowserStack)](https://www.browserstack.com/guide/playwright-vs-puppeteer) - PDF generation comparison
- [docx library](https://github.com/dolanmiu/docx) - DOCX generation
- [remark-docx](https://github.com/inokawa/remark-docx) - Alternative DOCX approach
- [Template Engine Comparison (npm-compare)](https://npm-compare.com/ejs,handlebars,nunjucks,pug) - Handlebars selection rationale
