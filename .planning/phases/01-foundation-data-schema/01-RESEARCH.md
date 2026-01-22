# Phase 1: Foundation + Data Schema - Research

**Researched:** 2026-01-22
**Domain:** TypeScript project setup with Bun, CV data schema design, markdown frontmatter parsing
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational TypeScript project with Bun runtime, defines the CVData interface that all other components depend on, and implements the markdown parser for extracting structured data from CV files.

The standard approach for this phase is:
1. Initialize a Bun monorepo workspace structure with `packages/core` and `packages/cli`
2. Use Biome for linting and formatting (fast, Rust-based, replaces ESLint+Prettier)
3. Define TypeScript interfaces for CVData following JSON Resume schema patterns
4. Use gray-matter for YAML frontmatter extraction and marked for markdown body parsing
5. Implement multi-language support using language-tagged sections

**Primary recommendation:** Use Bun workspaces with a flat `packages/` structure, Biome for tooling, and design the schema with explicit TypeScript interfaces before implementing any parsing logic.

## Standard Stack

The established libraries/tools for Phase 1:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bun | 1.2+ | Runtime, package manager, test runner | All-in-one JavaScript runtime, native TypeScript support, faster than Node.js |
| @types/bun | latest | Bun TypeScript definitions | Required for `Bun` global access |
| gray-matter | ^4.0.3 | YAML frontmatter extraction | Industry standard, used by Gatsby, Astro, VitePress |
| marked | ^17.0.1 | Markdown to HTML parsing | Most popular, fast, zero dependencies |
| biome | ^1.9+ | Linting + formatting | Rust-based, replaces ESLint+Prettier, 10-100x faster |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tsconfig/bun | latest | Bun-optimized tsconfig | Optional - extends base tsconfig for stricter settings |
| @types/gray-matter | latest | TypeScript types for gray-matter | Required for typed frontmatter parsing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter | @11ty/gray-matter | 11ty fork is more actively maintained but less ecosystem adoption |
| marked | remark/unified | More powerful AST manipulation but overkill for simple markdown-to-HTML |
| Biome | ESLint+Prettier | More ecosystem plugins but 10-100x slower, two tools instead of one |
| TypeScript interfaces | Zod schemas | Runtime validation but adds complexity; can add later for validation |

**Installation:**
```bash
# Initialize monorepo
bun init -y

# Core dependencies
bun add gray-matter marked

# Development dependencies
bun add -d @types/bun @types/gray-matter @biomejs/biome typescript
```

## Architecture Patterns

### Recommended Project Structure
```
cvgen/
├── packages/
│   ├── core/                    # @gottz/cv-core
│   │   ├── src/
│   │   │   ├── schema/          # TypeScript interfaces
│   │   │   │   ├── index.ts     # Re-exports
│   │   │   │   ├── cv.ts        # CVData interface
│   │   │   │   ├── contact.ts   # Contact-related types
│   │   │   │   ├── experience.ts # Work experience types
│   │   │   │   ├── education.ts # Education types
│   │   │   │   └── skills.ts    # Skills types
│   │   │   ├── parser/          # Markdown parsing
│   │   │   │   ├── index.ts     # Parser orchestration
│   │   │   │   ├── frontmatter.ts # gray-matter wrapper
│   │   │   │   ├── markdown.ts  # marked wrapper
│   │   │   │   ├── sections.ts  # Section extraction
│   │   │   │   └── languages.ts # Multi-language handling
│   │   │   └── index.ts         # Package entry
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                     # @gottz/cvgen (Phase 2+)
│       └── package.json
├── package.json                 # Workspace root
├── tsconfig.json               # Base TypeScript config
├── biome.json                  # Biome configuration
├── LICENSE                     # MIT license
├── .gitignore
└── README.md
```

### Pattern 1: Bun Workspaces Setup

**What:** Monorepo with shared node_modules and workspace references
**When to use:** Multiple related packages that need to share code

**Root package.json:**
```json
{
  "name": "cvgen-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "bun run --filter '*' typecheck",
    "test": "bun test"
  }
}
```

**packages/core/package.json:**
```json
{
  "name": "@gottz/cv-core",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "marked": "^17.0.1"
  },
  "devDependencies": {
    "@types/gray-matter": "^4.0.4",
    "typescript": "^5.7.0"
  }
}
```

### Pattern 2: Multi-Language Schema Design

**What:** Schema structure supporting multiple languages per field/section
**When to use:** CVs that need German and English versions in single file

**Example:**
```typescript
// Source: CONTEXT.md decisions
type Locale = string; // Extensible: 'en', 'de', 'fr', etc.

interface Localized<T> {
  [locale: Locale]: T;
}

interface CVData {
  // Frontmatter data (contact, metadata)
  contact: Contact;

  // Body sections with multi-language support
  summary: Localized<string>;
  experience: Localized<WorkExperience[]>;
  education: Localized<Education[]>;
  skills: Localized<SkillCategory[]>;

  // Optional sections
  projects?: Localized<Project[]>;
  certifications?: Certification[];  // Usually not localized
}
```

### Pattern 3: Section Extraction with Language Tags

**What:** Parse markdown sections with language annotations
**When to use:** Extracting language-specific content from markdown body

**Markdown format (from CONTEXT.md):**
```markdown
---
name: Jan-Stefan Janetzky
email: contact@gottz.de
---

## Summary `en`

Experienced software engineer with 10+ years...

## Zusammenfassung `de`

Erfahrener Softwareentwickler mit 10+ Jahren...

## Work Experience `en`

---
### Senior Developer at TechCorp
*2020-01 - present | Berlin, Germany*

- Led team of 5 developers
- Implemented CI/CD pipeline

---
### Developer at StartupCo
*2018-06 - 2020-01 | Munich, Germany*

- Built REST APIs
```

**Extraction pattern:**
```typescript
// Source: Marked documentation - custom tokenizer pattern
interface SectionMatch {
  header: string;
  language: string;
  content: string;
  entries: string[]; // Split by '---' delimiter
}

function extractSections(markdown: string): SectionMatch[] {
  // Match ## Header `lang` pattern
  const sectionRegex = /^##\s+(.+?)\s+`(\w+)`\s*$/gm;
  // ... extraction logic
}
```

### Pattern 4: Error Collection Pattern

**What:** Collect all validation errors before reporting
**When to use:** Parser should report all issues, not fail on first error

**Example:**
```typescript
// Source: CONTEXT.md - "Error reporting: Collect all errors, display together"
interface ParseError {
  type: 'error' | 'warning';
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  context?: string; // Snippet of problematic content
}

interface ParseResult<T> {
  data: T | null;
  errors: ParseError[];
  warnings: ParseError[];
}

function parseCV(markdown: string): ParseResult<CVData> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  // ... parsing logic that pushes to errors/warnings

  return {
    data: errors.length === 0 ? parsedData : null,
    errors,
    warnings
  };
}
```

### Anti-Patterns to Avoid
- **Hand-rolling YAML parsing:** Use gray-matter, not regex or manual parsing
- **Fail-fast validation:** Collect all errors, report together (per CONTEXT.md)
- **Implicit language defaults:** Require explicit language tags on all sections
- **Flat skill lists:** Use categorized skills with optional proficiency

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Regex extraction | gray-matter | Edge cases: multi-line values, nested objects, escaping |
| Markdown to HTML | Custom parser | marked | Full GFM support, extensible, battle-tested |
| Date parsing | Custom regex | Native Date with ISO format | Locale handling, validation complexity |
| TypeScript config | Manual tsconfig | `bun init` + @tsconfig/bun | Bun-specific settings like `allowImportingTsExtensions` |
| Linting rules | Custom ESLint config | Biome defaults | 340+ rules, TypeScript-aware, fast |

**Key insight:** The foundation phase should use established tools with minimal customization. Custom behavior comes in the parser logic, not the underlying utilities.

## Common Pitfalls

### Pitfall 1: Incorrect TypeScript Configuration for Bun

**What goes wrong:** TypeScript errors on valid Bun code (top-level await, .ts imports, JSX)
**Why it happens:** Default tsconfig doesn't enable Bun-specific features
**How to avoid:** Use `bun init` generated tsconfig or extend `@tsconfig/bun`
**Warning signs:** Errors like "Top-level 'await' expressions are only allowed when the 'module' option is set to..."

**Correct tsconfig.json:**
```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Pitfall 2: gray-matter Not Returning Expected Types

**What goes wrong:** `matter(content).data` is typed as `any`, losing type safety
**Why it happens:** gray-matter returns generic object, not typed data
**How to avoid:** Create typed wrapper function with explicit return type
**Warning signs:** No autocomplete on frontmatter properties

**Solution:**
```typescript
import matter from 'gray-matter';

interface Frontmatter {
  name: string;
  email: string;
  phone?: string;
  // ... rest of contact fields
}

function parseFrontmatter(content: string): Frontmatter {
  const { data } = matter(content);
  // Validation logic here
  return data as Frontmatter;
}
```

### Pitfall 3: Section Delimiter Collision

**What goes wrong:** `---` in work experience bullets breaks entry parsing
**Why it happens:** YAML frontmatter and entry delimiters both use `---`
**How to avoid:** Use gray-matter's delimiter handling; only parse `---` delimiters after frontmatter extraction
**Warning signs:** Incomplete work experience entries, strange parsing errors

**Prevention:**
```typescript
// First: extract frontmatter (consumes opening/closing ---)
const { data: frontmatter, content: body } = matter(rawMarkdown);

// Then: parse body sections with --- as entry delimiter
// At this point, --- only appears between entries, not as frontmatter
```

### Pitfall 4: Language Tag Not Captured

**What goes wrong:** Section headers lose their language annotation after marked parsing
**Why it happens:** marked converts `## Summary \`en\`` to `<h2>Summary <code>en</code></h2>`
**How to avoid:** Extract sections with language tags BEFORE marked parsing
**Warning signs:** All sections default to unknown language

**Correct order:**
```typescript
// 1. Extract frontmatter
const { content: body } = matter(rawMarkdown);

// 2. Extract sections with language tags (custom parser)
const sections = extractSections(body);

// 3. THEN parse markdown content within each section
for (const section of sections) {
  section.htmlContent = marked.parse(section.content);
}
```

### Pitfall 5: Missing Locale Completeness

**What goes wrong:** German CV generated with missing sections (no fallback to English)
**Why it happens:** Template expects all sections in target language
**How to avoid:** Per CONTEXT.md: warn and omit section for that language (no fallback)
**Warning signs:** Empty sections in output, silent data loss

**Correct behavior (from CONTEXT.md):**
- Missing section in target language: warn and skip (don't render empty)
- `(same as en)` marker: explicitly inherit from source language
- Missing inherit source: warn and omit

## Code Examples

Verified patterns from official sources:

### gray-matter Usage
```typescript
// Source: https://github.com/jonschlinkert/gray-matter
import matter from 'gray-matter';

const input = `---
name: Jane Developer
email: jane@example.com
phone: "+49 123 456789"
location: Berlin, Germany
links:
  - type: linkedin
    url: https://linkedin.com/in/janedev
  - type: github
    url: https://github.com/janedev
---

## Summary \`en\`

Experienced software engineer...
`;

const { data, content } = matter(input);
// data = { name: 'Jane Developer', email: '...', ... }
// content = '\n## Summary `en`\n\nExperienced software engineer...'
```

### marked Basic Usage
```typescript
// Source: https://marked.js.org/
import { marked } from 'marked';

// Configure once
marked.use({
  gfm: true,      // GitHub Flavored Markdown
  breaks: false,  // Don't convert \n to <br>
});

// Parse markdown
const html = marked.parse('**Bold** and *italic*');
// html = '<p><strong>Bold</strong> and <em>italic</em></p>'
```

### Bun Test Example
```typescript
// Source: https://bun.sh/docs/test/writing
import { describe, test, expect } from 'bun:test';
import { parseCV } from '../src/parser';

describe('CV Parser', () => {
  test('extracts frontmatter contact info', () => {
    const markdown = `---
name: Jane Developer
email: jane@example.com
---
Content here`;

    const result = parseCV(markdown);

    expect(result.data?.contact.name).toBe('Jane Developer');
    expect(result.data?.contact.email).toBe('jane@example.com');
  });

  test('collects multiple errors without failing early', () => {
    const markdown = `---
email: not-an-email
---
## Work Experience
No language tag`;

    const result = parseCV(markdown);

    expect(result.errors.length).toBeGreaterThan(0);
    // Errors collected, not thrown
  });
});
```

### Biome Configuration
```json
// biome.json - Source: https://biomejs.dev/guides/getting-started/
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single"
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Node.js + npm | Bun (runtime + package manager + test runner) | 2023+ | 4x faster startup, native TypeScript |
| ESLint + Prettier | Biome | 2023+ | 10-100x faster, single tool |
| tsup for building | Bun native bundler / bunup | 2025+ | Zero-config, faster builds |
| Vitest/Jest | Bun test runner | 2023+ | Native, Jest-compatible, 2x faster |
| `module: "ESNext"` | `module: "Preserve"` | TypeScript 5.4+ | Better for bundlers like Bun |

**Deprecated/outdated:**
- **wkhtmltopdf:** Deprecated, use Puppeteer (Phase 3)
- **PhantomJS:** Abandoned since 2018
- **ESLint + Prettier combo:** Still works but Biome is faster and simpler
- **`moduleResolution: "node"`:** Use `"bundler"` for modern setups

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Date Formatting Output**
   - What we know: ISO format in schema (YYYY-MM-DD or YYYY-MM), locale-aware at render
   - What's unclear: Exact render format strings for German vs American dates
   - Recommendation: Define in Phase 3 (templates), keep schema simple with ISO dates

2. **Proficiency Level Values**
   - What we know: Skills have optional proficiency levels (per CONTEXT.md)
   - What's unclear: Exact enum values (e.g., beginner/intermediate/expert vs 1-5)
   - Recommendation: Claude's discretion per CONTEXT.md; suggest text-based levels

3. **Inherit Marker Syntax**
   - What we know: `(same as en)` or similar supported
   - What's unclear: Exact parser implementation for this marker
   - Recommendation: Implement as special content string, detect in parser

## Sources

### Primary (HIGH confidence)
- [Bun Workspaces Documentation](https://bun.sh/docs/guides/install/workspaces) - Monorepo setup
- [Bun TypeScript Documentation](https://bun.sh/docs/typescript) - tsconfig recommendations
- [Biome Getting Started](https://biomejs.dev/guides/getting-started/) - Installation and config
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter) - API documentation
- [marked Documentation](https://marked.js.org/) - Usage patterns
- [JSON Resume Schema](https://jsonresume.org/schema) - Reference schema structure

### Secondary (MEDIUM confidence)
- [Building TypeScript Library with Bun 2026](https://dev.to/arshadyaseen/building-a-typescript-library-in-2026-with-bunup-3bmg) - Modern patterns
- [Node Test Runner vs Bun](https://dev.to/boscodomingo/node-test-runner-vs-bun-test-runner-with-typescript-and-esm-44ih) - Performance comparison
- [Biome vs ESLint Comparison](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/) - Tooling decisions

### Tertiary (LOW confidence)
- General TypeScript interface vs type patterns - Best practices well-established

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools verified with official documentation
- Architecture: HIGH - Based on established monorepo patterns and CONTEXT.md decisions
- Pitfalls: HIGH - Based on official documentation and prior project research

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable tooling, well-established patterns)
