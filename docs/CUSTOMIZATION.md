# Template Customization

Customize template appearance via configuration files.

## Configuration Cascade

Configuration is merged from multiple sources (lowest to highest priority):

1. **Template defaults** - Built into template CSS
2. **Global config** - `/config.json` in project root
3. **Template config** - `/templates/<name>/config.json`
4. **Environment variables** - `CVGEN_*` variables
5. **Frontmatter** - `style` field in cv.md

Higher priority values override lower ones.

## Configuration Options

### Accent Color

Primary color used for links, dividers, and highlights.

```json
{
  "style": {
    "accentColor": "#2563eb"
  }
}
```

Must be hex format: `#RRGGBB`

### Fonts

Override heading and body font families:

```json
{
  "style": {
    "fontHeading": "'Times New Roman', Times, serif",
    "fontBody": "Arial, Helvetica, sans-serif"
  }
}
```

**Important:** Use web-safe fonts for ATS compatibility:
- Arial, Helvetica, sans-serif
- 'Times New Roman', Times, serif
- Calibri (Windows)
- Georgia, serif

### Margins

Page margins as named size or millimeters:

```json
{
  "style": {
    "margins": "wide"
  }
}
```

| Name | Value |
|------|-------|
| `narrow` | 15mm |
| `normal` | 20mm |
| `wide` | 30mm |

Or specify exact value: `"margins": 25` (interpreted as mm)

## Global Configuration

Create `/config.json` in project root:

```json
{
  "style": {
    "accentColor": "#dc2626",
    "fontBody": "Calibri, Arial, sans-serif"
  }
}
```

Applies to all templates unless overridden.

## Per-Template Configuration

Edit `/templates/<name>/config.json`:

```json
{
  "$schema": "../../schemas/template-config.schema.json",
  "name": "Modern",
  "description": "Bold, geometric design with generous whitespace",
  "style": {
    "accentColor": "#2563eb",
    "margins": "wide"
  }
}
```

The `$schema` field enables IDE autocomplete for config options.

## Per-Person Configuration

Add `style` field to cv.md frontmatter:

```yaml
---
name: John Doe
email: john@example.com
style:
  accentColor: "#059669"
  margins: "narrow"
---
```

This overrides all other configuration sources.

## Environment Variables

Override any config via environment:

```bash
export CVGEN_ACCENT_COLOR="#7c3aed"
export CVGEN_MARGINS="narrow"
cvgen build john-doe modern
```

| Variable | Description |
|----------|-------------|
| `CVGEN_ACCENT_COLOR` | Primary accent color |
| `CVGEN_FONT_HEADING` | Heading font family |
| `CVGEN_FONT_BODY` | Body font family |
| `CVGEN_MARGINS` | Page margins |

## Creating Custom Templates

### 1. Copy an existing template

```bash
cp -r templates/modern templates/my-template
```

### 2. Edit `config.json`

```json
{
  "$schema": "../../schemas/template-config.schema.json",
  "name": "My Template",
  "description": "Custom design for my needs",
  "atsCompliant": true,
  "style": {
    "accentColor": "#0ea5e9"
  }
}
```

### 3. Modify `styles.css`

Templates use CSS custom properties that can be overridden:

```css
:root {
  --accent-color: #0ea5e9;
  --font-heading: 'Arial', sans-serif;
  --font-body: 'Arial', sans-serif;
  --page-margin: 20mm;
}
```

The config cascade automatically generates CSS variable overrides.

### 4. (Optional) Modify `template.njk`

For structural changes, edit the Nunjucks template. Available variables:

- `cv.contact` - Contact information
- `cv.summary` - Professional summary
- `cv.experience` - Work history
- `cv.education` - Education
- `cv.skills` - Skills by category
- `cv.projects` - Portfolio projects
- `cv.certifications` - Certifications
- `locale` - Current language code

### 5. Test your template

```bash
cvgen build alex-chen my-template
```

## ATS Compliance Guidelines

When creating custom templates, maintain ATS compliance:

- **Single-column layout** - No multi-column designs
- **Standard fonts** - Arial, Times New Roman, Calibri
- **Semantic HTML** - h1 for name, h2 for sections
- **No tables for layout** - Tables confuse ATS parsers
- **Plain text sections** - Important content must be in text, not images
- **No headers/footers** - Some ATS skip these areas

## Examples

### Corporate Style

```json
{
  "style": {
    "accentColor": "#1e3a5f",
    "fontHeading": "'Times New Roman', Times, serif",
    "fontBody": "Arial, Helvetica, sans-serif",
    "margins": "normal"
  }
}
```

### Creative Style

```json
{
  "style": {
    "accentColor": "#7c3aed",
    "fontHeading": "Georgia, serif",
    "fontBody": "Arial, Helvetica, sans-serif",
    "margins": "wide"
  }
}
```

### Compact Style

```json
{
  "style": {
    "margins": "narrow",
    "fontBody": "Arial, Helvetica, sans-serif"
  }
}
```
