# Phase 8: Multi-Template + Polish - Research

**Researched:** 2026-01-23
**Domain:** Template theming, CSS configuration, documentation
**Confidence:** HIGH

## Summary

Phase 8 delivers three template themes (Modern, Minimal, Classic) with configurable styling via config.json, plus comprehensive documentation. The existing template system provides a solid foundation with Nunjucks templating, CSS custom properties, and style extraction for DOCX generation.

The research validates that:
1. **OKLCH color space** is the recommended approach for deriving color palettes from a single accent color in 2026
2. **Nunjucks macros** provide the best mechanism for shared template components while maintaining isolation
3. **JSON Schema** enables IDE autocomplete for config.json files
4. **ATS-compliant design** allows visual variety through color accents, font pairing, and section dividers while maintaining parseability

**Primary recommendation:** Use OKLCH for color derivation, CSS custom properties cascade for config inheritance, and Nunjucks macros for shared template components. Document comprehensively with JSON Schema for IDE support.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nunjucks | existing | Template engine | Already in use, supports inheritance and macros |
| dayjs | existing | Date formatting | Already in use, locale-aware formatting |
| marked | existing | Markdown parsing | Already in use for bullet points |
| docx | 9.5.1 | DOCX generation | Already in use, inherits styles from CSS |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| json-schema | 2020-12 | Config validation | IDE autocomplete, schema definition |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OKLCH color derivation | HSL | OKLCH has perceptual uniformity; HSL produces muddy colors |
| CSS custom properties | PostCSS variables | CSS custom properties work natively, no build step |
| Nunjucks macros | Nunjucks includes | Macros have isolated scope, includes leak variables |

**Installation:**
No new dependencies required. All functionality uses existing stack plus native CSS features.

## Architecture Patterns

### Recommended Project Structure
```
/templates/
├── _shared/               # Underscore prefix = private resources
│   ├── base.njk          # Base layout (optional inheritance)
│   ├── macros/           # Shared Nunjucks macros
│   │   ├── contact.njk   # Contact block macro
│   │   ├── section.njk   # Section wrapper macro
│   │   └── entry.njk     # Experience/education entry macro
│   └── partials/         # CSS partials for import
│       ├── _reset.css    # Reset/normalize styles
│       ├── _print.css    # Print media rules
│       └── _theme.css    # Theme toggle logic
├── modern/
│   ├── config.json       # Template configuration
│   ├── template.njk      # Template markup
│   └── styles.css        # Template-specific styles
├── minimal/
│   └── ...
└── classic/
    └── ...

/config.json              # Global config (optional)

/docs/
├── MARKDOWN.md           # CV markdown format specification
├── CLI.md                # CLI reference
├── CUSTOMIZATION.md      # Template customization guide
├── CONTRIBUTING.md       # Contribution guidelines
├── FAQ.md                # Frequently asked questions
└── CHANGELOG.md          # Version history
```

### Pattern 1: Config Cascade
**What:** Configuration merging from global to person-specific
**When to use:** Any configurable template property
**Example:**
```typescript
// Config cascade priority (lowest to highest):
// 1. Template defaults (in styles.css :root)
// 2. Global config (/config.json)
// 3. Template config (/templates/{name}/config.json)
// 4. Environment variables (CVGEN_ACCENT_COLOR, etc.)
// 5. Person frontmatter (cv.md)

interface TemplateConfig {
  name: string;
  description: string;
  atsCompliant?: boolean;
  singleColumn?: boolean;
  private?: boolean;           // Hide from list-templates
  minVersion?: string;         // Minimum cvgen version

  // Style overrides
  style?: {
    accentColor?: string;      // Primary accent color
    fontHeading?: string;      // Heading font family
    fontBody?: string;         // Body font family
    margins?: string | number; // "narrow" | "normal" | "wide" | mm value

    // Full palette (derived from accent if partial)
    colors?: {
      heading?: string;
      body?: string;
      muted?: string;
      border?: string;
      background?: string;
    };
  };

  // Locale-specific overrides
  locales?: {
    [locale: string]: {
      dateFormat?: string;     // dayjs format string
    };
  };
}
```

### Pattern 2: OKLCH Color Derivation
**What:** Derive full color palette from single accent color
**When to use:** User provides only accent color in config
**Example:**
```css
/* Source: MDN OKLCH documentation, Evil Martians research */

:root {
  /* User provides accent (or we use default) */
  --accent-oklch: 60% 0.2 250;

  /* Derive palette using OKLCH arithmetic */
  --color-accent: oklch(var(--accent-oklch));
  --color-accent-light: oklch(calc(60% + 15%) 0.15 250);
  --color-accent-dark: oklch(calc(60% - 20%) 0.25 250);

  /* Derive neutral palette from accent hue */
  --color-heading: oklch(15% 0.01 250);
  --color-body: oklch(25% 0.01 250);
  --color-muted: oklch(45% 0.01 250);
  --color-border: oklch(85% 0.02 250);
  --color-background: oklch(98% 0.01 250);
}

/* Fallback for older browsers */
@supports not (color: oklch(0% 0 0)) {
  :root {
    --color-accent: #2563eb;
    /* ... hex fallbacks ... */
  }
}
```

### Pattern 3: Nunjucks Macro Inheritance
**What:** Shared macros imported in base template, available to all
**When to use:** Reusable components across templates
**Example:**
```nunjucks
{# /templates/_shared/macros/section.njk #}
{% macro section(title, locale, class='') %}
<section class="section {{ class }}">
  <h2>{{ title | sectionHeader(locale) }}</h2>
  {{ caller() }}
</section>
{% endmacro %}

{# /templates/modern/template.njk #}
{% from "../_shared/macros/section.njk" import section %}

{% call section('experience', locale, 'experience') %}
  {# Section content here #}
{% endcall %}
```

### Pattern 4: Template-Specific Presentation
**What:** Each template defines unique visual elements
**When to use:** Section dividers, photo styles, bullet styles
**Example:**
```css
/* Modern: Bold colored bars */
.modern h2 {
  border-bottom: 3px solid var(--color-accent);
  padding-bottom: var(--spacing-sm);
}

/* Minimal: Hairline or none */
.minimal h2 {
  border-bottom: 1px solid var(--color-border);
}

/* Classic: Traditional double rule */
.classic h2 {
  border-top: 1px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
  padding: var(--spacing-xs) 0;
}
```

### Anti-Patterns to Avoid
- **Leaky includes:** Don't use `{% include %}` for components that need isolated scope; use macros instead
- **Hard-coded colors:** Never hard-code hex values in CSS; always use custom properties
- **Breaking ATS:** Don't use tables, multi-column layouts, or complex CSS that breaks text extraction
- **Platform-specific fonts:** Stick to web-safe fonts (Arial, Times New Roman) for ATS; system fonts can be added as optional enhancement

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color palette generation | Custom HSL math | OKLCH with CSS calc() | Perceptually uniform, browser-native |
| Config file validation | Custom validators | JSON Schema + $schema | IDE autocomplete, standard format |
| Date formatting variations | Custom formatters | dayjs locales | Already in use, well-tested |
| Template discovery | Manual file scanning | Existing discoverTemplates() | Already implemented, handles edge cases |
| CSS variables cascade | JavaScript merging | Native CSS cascade + data attributes | Browser handles specificity correctly |

**Key insight:** The existing codebase already has robust infrastructure for template loading, CSS extraction for DOCX, and i18n. Extend rather than replace.

## Common Pitfalls

### Pitfall 1: ATS-Breaking Visual Elements
**What goes wrong:** Adding tables, columns, or graphics that break ATS parsing
**Why it happens:** Desire for visual appeal overrides ATS requirements
**How to avoid:** All visual variety must be achievable with:
- Single-column layout (flexbox for internal alignment only)
- Standard fonts (Arial, Calibri, Times New Roman, Helvetica)
- Color accents on text and borders (not backgrounds that obscure text)
- Simple bullet characters (unicode bullet, dash, em-dash)
**Warning signs:** Any CSS that uses `display: table`, `columns`, or `position: absolute`

### Pitfall 2: Color Derivation Breaking on Edge Cases
**What goes wrong:** Derived colors become unreadable (too light/dark)
**Why it happens:** Linear math on non-perceptual color spaces
**How to avoid:**
- Use OKLCH for all derivations (perceptually uniform)
- Clamp lightness values to safe ranges (15%-95%)
- Test with extreme accent colors (pure red, yellow, etc.)
**Warning signs:** Contrast ratio drops below 4.5:1 for body text

### Pitfall 3: Config Cascade Order Confusion
**What goes wrong:** User config overridden by unexpected source
**Why it happens:** Unclear precedence rules, inconsistent merging
**How to avoid:**
- Document cascade order clearly (global < template < env < frontmatter)
- Deep merge objects, don't replace entirely
- Log which config sources are loaded in verbose mode
**Warning signs:** User reports "my config isn't being applied"

### Pitfall 4: Nunjucks Macro Scope Leakage
**What goes wrong:** Variables from parent template leak into macros
**Why it happens:** Using includes instead of macros, or forgetting macro imports
**How to avoid:**
- Use macros for all reusable components
- Import macros explicitly in each template that uses them
- Don't rely on caller context for styling (pass classes as parameters)
**Warning signs:** Template behavior changes unexpectedly when surrounding code changes

### Pitfall 5: DOCX Style Divergence
**What goes wrong:** DOCX output looks different from HTML/PDF
**Why it happens:** CSS features not mapped to DOCX equivalents
**How to avoid:**
- Extend existing docx-style-extractor.ts for new style properties
- Test all three formats for each template
- Accept that some CSS (gradients, shadows) cannot be replicated
**Warning signs:** User sees visual differences between formats

### Pitfall 6: Documentation Drift
**What goes wrong:** README examples don't match actual CLI behavior
**Why it happens:** Code changes without documentation updates
**How to avoid:**
- Generate CLI examples from actual --help output
- Include verification step in phase plan
- Cross-reference examples with integration tests
**Warning signs:** User follows README and gets errors

## Code Examples

### Config.json Schema Definition
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://cvgen.dev/schemas/template-config.json",
  "title": "CV Generator Template Configuration",
  "type": "object",
  "required": ["name", "description"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Display name of the template"
    },
    "description": {
      "type": "string",
      "description": "Brief description of the template style"
    },
    "atsCompliant": {
      "type": "boolean",
      "default": true,
      "description": "Whether template follows ATS optimization rules"
    },
    "private": {
      "type": "boolean",
      "default": false,
      "description": "Hide from list-templates command"
    },
    "minVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Minimum cvgen version required"
    },
    "style": {
      "type": "object",
      "description": "Style overrides",
      "properties": {
        "accentColor": {
          "type": "string",
          "pattern": "^#[0-9a-fA-F]{6}$",
          "description": "Primary accent color (hex)"
        },
        "fontHeading": {
          "type": "string",
          "description": "Heading font family"
        },
        "fontBody": {
          "type": "string",
          "description": "Body text font family"
        },
        "margins": {
          "oneOf": [
            { "type": "string", "enum": ["narrow", "normal", "wide"] },
            { "type": "number", "minimum": 5, "maximum": 50 }
          ],
          "description": "Page margins (named size or mm value)"
        }
      }
    }
  }
}
```

### Template-Specific CSS Variables
```css
/* /templates/modern/styles.css */
:root {
  /* Modern: Bold, geometric, high contrast */
  --font-heading: Arial, Helvetica, sans-serif;
  --font-body: Arial, Helvetica, sans-serif;

  /* Accent-derived palette */
  --color-accent: #2563eb;
  --color-heading: #0f172a;
  --color-body: #1e293b;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --color-background: #ffffff;

  /* Modern: Generous whitespace */
  --page-margin: 25mm;
  --spacing-section: 28px;
  --spacing-entry: 20px;

  /* Modern-specific: Bold section dividers */
  --divider-color: var(--color-accent);
  --divider-width: 3px;

  /* Bullet style: filled circle */
  --bullet-char: '\2022';
}

/* Photo style: rounded */
.photo { border-radius: 12px; }
```

```css
/* /templates/minimal/styles.css */
:root {
  /* Minimal: Single font, pure hierarchy */
  --font-heading: 'Times New Roman', Times, serif;
  --font-body: 'Times New Roman', Times, serif;

  /* Subtle, printable colors */
  --color-accent: #1a365d;
  --color-heading: #1a1a1a;
  --color-body: #333333;
  --color-muted: #666666;
  --color-border: #d1d5db;
  --color-background: #ffffff;

  /* Minimal: Airy, room for notes */
  --page-margin: 30mm;
  --spacing-section: 24px;
  --spacing-entry: 16px;

  /* Minimal: Hairline or no dividers */
  --divider-color: var(--color-border);
  --divider-width: 1px;

  /* Bullet style: en-dash */
  --bullet-char: '\2013';
}

/* Photo style: square */
.photo { border-radius: 0; }
```

```css
/* /templates/classic/styles.css */
:root {
  /* Classic: Business formal */
  --font-heading: 'Times New Roman', Times, serif;
  --font-body: Arial, Helvetica, sans-serif;

  /* Professional, subdued colors */
  --color-accent: #1e40af;
  --color-heading: #1f2937;
  --color-body: #374151;
  --color-muted: #6b7280;
  --color-border: #d1d5db;
  --color-background: #ffffff;

  /* Classic: Compact, balanced */
  --page-margin: 20mm;
  --spacing-section: 20px;
  --spacing-entry: 14px;

  /* Classic: Traditional rule */
  --divider-color: var(--color-border);
  --divider-width: 1px;

  /* Bullet style: traditional bullet */
  --bullet-char: '\2022';
}

/* Photo style: oval */
.photo { border-radius: 50%; }
```

### Margin Configuration Processing
```typescript
// Source: CONTEXT.md decision on margin configuration

type MarginConfig = 'narrow' | 'normal' | 'wide' | number;

const NAMED_MARGINS: Record<string, number> = {
  narrow: 15,  // mm
  normal: 20,  // mm
  wide: 30,    // mm
};

function resolveMargin(config: MarginConfig): number {
  if (typeof config === 'number') {
    // Clamp to reasonable range
    return Math.max(10, Math.min(40, config));
  }
  return NAMED_MARGINS[config] ?? NAMED_MARGINS.normal;
}
```

### README Structure Example
```markdown
# CV Generator

[![Version](https://img.shields.io/npm/v/@gottz/cvgen)](https://npmjs.com/package/@gottz/cvgen)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/gottz/cvgen/ci.yml)](https://github.com/gottz/cvgen/actions)

Generate ATS-optimized CVs from markdown.

## Quick Start

\`\`\`bash
# Install
bun add -g @gottz/cvgen

# Create your CV
cvgen init john-doe
cd people/john-doe
# Edit cv.md with your information

# Generate all formats
cvgen build john-doe modern
\`\`\`

## Templates

| Template | Style | Best For |
|----------|-------|----------|
| modern | Bold, geometric | Tech/creative roles |
| minimal | Clean, spacious | Print-focused |
| classic | Traditional | Corporate/formal |

![Template comparison](./docs/images/template-comparison.png)

## Documentation

- [CV Markdown Format](./docs/MARKDOWN.md)
- [CLI Reference](./docs/CLI.md)
- [Template Customization](./docs/CUSTOMIZATION.md)
- [FAQ](./docs/FAQ.md)

## License

MIT - See [LICENSE](./LICENSE)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL color manipulation | OKLCH color space | 2023-2024 | Perceptually uniform palettes |
| Hand-coded CSS themes | CSS custom properties cascade | Standard | Native browser support |
| Nunjucks includes | Nunjucks macros | Best practice | Isolated component scope |
| Manual config validation | JSON Schema + $schema | Standard | IDE autocomplete |

**Deprecated/outdated:**
- HSL for palette generation: produces muddy/washed colors
- Hand-rolling config validation: JSON Schema is standard

## Open Questions

1. **Template scaffolding command**
   - What we know: User context mentions considering it (Claude's discretion)
   - What's unclear: Whether it's needed for v1 or can be deferred
   - Recommendation: Document manual copy workflow; scaffold command is nice-to-have for v1

2. **External template installation**
   - What we know: CONTEXT.md mentions npm packages and git URLs
   - What's unclear: Exact installation workflow, version resolution
   - Recommendation: Document intended behavior; implementation may be v2 scope

3. **Custom Nunjucks filters**
   - What we know: CONTEXT.md mentions templates can register custom filters
   - What's unclear: Registration mechanism (config.json vs JS file)
   - Recommendation: Support JS file in template directory (`filters.js`) for v1

## Sources

### Primary (HIGH confidence)
- MDN Web Docs - OKLCH color function documentation
- MDN Web Docs - CSS custom properties and cascade
- Evil Martians - OKLCH research and migration guide
- Nunjucks official documentation - macros and template inheritance
- VS Code documentation - JSON Schema integration

### Secondary (MEDIUM confidence)
- Web search: ATS resume design best practices 2026 - confirmed single-column, standard fonts
- Web search: Shields.io badges - verified badge syntax and best practices
- dolanmiu/docx documentation - verified style inheritance behavior

### Tertiary (LOW confidence)
- Template comparison aesthetics - subjective, based on design principles

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing codebase provides foundation, no new libraries needed
- Architecture: HIGH - Nunjucks macros and CSS custom properties are well-documented
- Pitfalls: MEDIUM - some pitfalls are project-specific, based on existing code patterns

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain, minimal external dependencies)
