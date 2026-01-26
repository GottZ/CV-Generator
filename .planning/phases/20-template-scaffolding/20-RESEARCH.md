# Phase 20: Template Scaffolding - Research

**Researched:** 2026-01-26
**Domain:** Template scaffolding, file operations, CLI wizards, JSON schema validation
**Confidence:** HIGH

## Summary

This phase implements template scaffolding operations for creating, copying, customizing, and validating custom CV templates. The codebase already has extensive infrastructure:

1. **Template system**: Templates at `/templates/` with `config.json`, `template.njk`, `styles.css`
2. **Configuration cascade**: `@gottz/cv-templates` provides style resolution, color palettes, margin handling
3. **Wizard infrastructure**: Phase 18/19 provides `@inquirer/prompts` patterns, state management, non-interactive modes
4. **JSON schema**: Existing `template-config.schema.json` provides validation rules

The implementation requires NO new dependencies. All functionality can be built with Node.js `fs/promises`, existing wizard patterns, and the established template configuration system.

**Primary recommendation:** Extend existing patterns - use `fs.cp()` for template copying, reuse wizard infrastructure for prompts, leverage existing JSON schema for validation.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs/promises | native | Directory copy, file operations | Built-in, no dependencies needed |
| @inquirer/prompts | ^7.x | Interactive template wizard | Already used by Phase 18 wizard infrastructure |
| commander | ^13.x | CLI command structure | Already used for all CLI commands |
| picocolors | ^1.x | Terminal coloring | Already used throughout CLI |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | ^3.x | Runtime validation | Already used for wizard JSON schemas |
| ajv | (optional) | JSON Schema validation | If needing $schema validation against draft |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fs.cp() | fs-extra.copy() | fs-extra adds dependency; fs.cp() is native and sufficient |
| Custom validation | ajv | ajv better for full JSON Schema draft compliance but overkill for simple structure checks |
| Handlebars templates | Simple string replace | Templates have no variables to replace; config.json just needs name updates |

**Installation:**
```bash
# No new packages needed - all dependencies already exist
```

## Architecture Patterns

### Recommended Project Structure

Template scaffolding follows existing patterns:

```
packages/cli/src/
├── commands/
│   └── template.ts           # New: cvgen template [copy|validate|wizard]
├── template/                 # New module for template operations
│   ├── types.ts              # Template operation types
│   ├── copier.ts             # TPL-01: Template copy logic
│   ├── validator.ts          # TPL-05: Template validation
│   ├── prompts/              # TPL-02/03/04: Customization prompts
│   │   ├── colors.ts         # Color selection
│   │   ├── fonts.ts          # ATS-safe font selection
│   │   ├── margins.ts        # Margin selection
│   │   └── sections.ts       # Section visibility (TPL-08)
│   ├── wizard.ts             # TPL-06/07/09: Template wizard orchestrator
│   └── index.ts              # Public exports
└── lib/
    └── scaffolder.ts         # Existing - already has slugifyName()
```

### Pattern 1: Template Copy with fs.cp()

**What:** Node.js native recursive directory copy
**When to use:** TPL-01 template fork/copy operation

```typescript
// Source: Node.js fs/promises documentation
import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function copyTemplate(
  sourceId: string,
  targetId: string,
  templatesDir: string,
): Promise<void> {
  const sourcePath = path.join(templatesDir, sourceId);
  const targetPath = path.join(templatesDir, targetId);

  // Recursive copy with overwrite protection
  await cp(sourcePath, targetPath, {
    recursive: true,
    errorOnExist: true,  // Prevent accidental overwrite
    force: false,
  });

  // Update config.json with new name
  const configPath = path.join(targetPath, 'config.json');
  const config = JSON.parse(await readFile(configPath, 'utf-8'));
  config.name = formatTemplateName(targetId);  // "my-custom" -> "My Custom"
  delete config.private;  // Remove private flag from copies
  await writeFile(configPath, JSON.stringify(config, null, '\t'), 'utf-8');
}
```

### Pattern 2: Validation Using Existing Schema

**What:** Validate template structure against existing JSON schema
**When to use:** TPL-05 template validation command

```typescript
// Leverage existing template-config.schema.json
import { readFile, access, stat } from 'node:fs/promises';
import path from 'node:path';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateTemplate(
  templateId: string,
  templatesDir: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const templateDir = path.join(templatesDir, templateId);

  // Check required files exist
  const requiredFiles = ['config.json', 'template.njk', 'styles.css'];
  for (const file of requiredFiles) {
    const filePath = path.join(templateDir, file);
    try {
      await access(filePath);
    } catch {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Validate config.json structure
  const configPath = path.join(templateDir, 'config.json');
  try {
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Required fields
    if (!config.name) errors.push('config.json: missing "name" field');
    if (!config.description) errors.push('config.json: missing "description" field');

    // Validate style if present
    if (config.style) {
      validateStyleConfig(config.style, errors, warnings);
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      errors.push(`config.json: invalid JSON - ${e.message}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### Pattern 3: Wizard Reusing Phase 18 Infrastructure

**What:** Template wizard using established @inquirer/prompts patterns
**When to use:** TPL-06/07/08/09 template wizard

```typescript
// Follows existing wizard/menu.ts and wizard/prompts/ patterns
import { select, input, confirm, Separator } from '@inquirer/prompts';
import pc from 'picocolors';

// Reuse pattern from wizard/menu.ts
export async function selectBaseTemplate(
  templates: DiscoveredTemplate[],
): Promise<string> {
  const choices = templates.map(t => ({
    value: t.id,
    name: `${t.config.name} - ${t.config.description}`,
  }));

  return select({
    message: 'Select base template to customize:',
    choices,
  });
}

// Color selection with preview
export async function selectAccentColor(): Promise<string> {
  const presets = [
    { value: '#2563eb', name: 'Blue (default)' },
    { value: '#059669', name: 'Green' },
    { value: '#7c3aed', name: 'Purple' },
    { value: '#dc2626', name: 'Red' },
    { value: 'custom', name: 'Enter custom hex color...' },
  ];

  const selection = await select({
    message: 'Select accent color:',
    choices: presets,
  });

  if (selection === 'custom') {
    return input({
      message: 'Enter hex color (e.g., #3b82f6):',
      validate: validateHexColor,
    });
  }

  return selection;
}
```

### Pattern 4: Section Visibility Configuration

**What:** Allow users to show/hide optional CV sections in template
**When to use:** TPL-08 section visibility

```typescript
// Section visibility stored in config.json
interface TemplateSectionConfig {
  showProjects?: boolean;
  showCertifications?: boolean;
  showSummary?: boolean;
}

// Checkbox multi-select for sections
import { checkbox } from '@inquirer/prompts';

export async function selectVisibleSections(): Promise<TemplateSectionConfig> {
  const sections = await checkbox({
    message: 'Select sections to show:',
    choices: [
      { value: 'summary', name: 'Summary', checked: true },
      { value: 'projects', name: 'Projects', checked: true },
      { value: 'certifications', name: 'Certifications', checked: true },
    ],
  });

  return {
    showSummary: sections.includes('summary'),
    showProjects: sections.includes('projects'),
    showCertifications: sections.includes('certifications'),
  };
}
```

### Anti-Patterns to Avoid

- **String template processing for file copies:** Template files don't need variable interpolation - just copy and update config.json name
- **Custom JSON validation logic:** Leverage existing schema; use simple checks for structure
- **New prompt library:** Use @inquirer/prompts already in use; don't add new UI dependencies
- **Complex color derivation:** The existing `@gottz/cv-templates` color system handles derivation in CSS; just store hex values

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive directory copy | Custom recursive walker | `fs.cp({ recursive: true })` | Native since Node 16.7, handles edge cases |
| Color validation | Regex parsing | Existing `isValidHexColor()` in config/colors.ts | Already tested and used |
| Margin resolution | Custom parsing | Existing `resolveMargin()` in config/margins.ts | Handles named/numeric, clamping |
| Template discovery | Glob patterns | Existing `discoverTemplates()` in engine/loader.ts | Already filters private, validates config |
| Font validation | Free-form validation | Predefined ATS-safe font list | See Common Pitfalls - fonts must be web-safe |

**Key insight:** The codebase already has template configuration infrastructure. Phase 20 is about exposing it through CLI commands and wizard, not rebuilding it.

## Common Pitfalls

### Pitfall 1: Non-ATS-Safe Font Selection

**What goes wrong:** Users select decorative or web-only fonts that break ATS parsing
**Why it happens:** Free-form font input without validation
**How to avoid:** Provide curated list of ATS-safe fonts; validate against allowlist
**Warning signs:** Font stack includes single fonts, script/decorative fonts, or fonts without fallbacks

**ATS-safe fonts to allow:**
```typescript
const ATS_SAFE_FONTS = [
  { value: 'Arial, Helvetica, sans-serif', name: 'Arial (recommended)' },
  { value: "'Times New Roman', Times, serif", name: 'Times New Roman' },
  { value: 'Georgia, serif', name: 'Georgia' },
  { value: 'Calibri, Helvetica, sans-serif', name: 'Calibri' },
  { value: 'Verdana, sans-serif', name: 'Verdana' },
  { value: "'Trebuchet MS', sans-serif", name: 'Trebuchet MS' },
  { value: 'Tahoma, sans-serif', name: 'Tahoma' },
  { value: 'Garamond, serif', name: 'Garamond' },
];
```

### Pitfall 2: Template Overwrite Without Confirmation

**What goes wrong:** User accidentally overwrites existing custom template
**Why it happens:** Copy operation doesn't check for existing target
**How to avoid:** Use `errorOnExist: true` in fs.cp(), prompt for confirmation if exists
**Warning signs:** Silent overwrites, lost customizations

```typescript
// Check before copy
try {
  await access(targetPath);
  const overwrite = await confirm({
    message: `Template "${targetId}" already exists. Overwrite?`,
    default: false,
  });
  if (!overwrite) {
    throw new Error('Operation cancelled');
  }
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  // Target doesn't exist, safe to copy
}
```

### Pitfall 3: Invalid Template Structure After Wizard

**What goes wrong:** Wizard generates template that fails validation
**Why it happens:** Missing required files or invalid config values
**How to avoid:** Always validate template after wizard completes; generate all required files
**Warning signs:** Template validation fails immediately after creation

### Pitfall 4: Broken CSS Variables

**What goes wrong:** Custom colors don't apply; template looks wrong
**Why it happens:** CSS custom properties not updated or malformed
**How to avoid:** Use existing `styleToCssVariables()` pattern; validate hex colors before storing
**Warning signs:** Colors revert to defaults, console shows invalid color warnings

### Pitfall 5: Template ID Collisions with Built-in Templates

**What goes wrong:** User names template "base" or "modern" and breaks system
**Why it happens:** No reserved name validation
**How to avoid:** Check against reserved template names
**Warning signs:** Built-in template disappears from list

```typescript
const RESERVED_TEMPLATE_IDS = ['base', 'modern', 'classic', 'minimal', '_shared'];

function validateTemplateId(id: string): string | true {
  const normalized = id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (RESERVED_TEMPLATE_IDS.includes(normalized)) {
    return `"${id}" is a reserved template name. Choose a different name.`;
  }
  if (normalized.startsWith('_')) {
    return 'Template names cannot start with underscore';
  }
  return true;
}
```

## Code Examples

Verified patterns from official sources and codebase:

### Template Copy Command Structure

```typescript
// packages/cli/src/commands/template.ts
import { Command } from 'commander';
import path from 'node:path';
import pc from 'picocolors';
import { copyTemplate } from '../template/copier.ts';
import { validateTemplate } from '../template/validator.ts';
import { runTemplateWizard } from '../template/wizard.ts';

export function createTemplateCommand(): Command {
  const template = new Command('template')
    .description('Manage CV templates');

  // TPL-01: cvgen template copy [source] [target]
  template
    .command('copy')
    .description('Create a copy of an existing template')
    .argument('<source>', 'Source template ID (e.g., modern)')
    .argument('<target>', 'Target template ID (e.g., my-custom)')
    .option('--templates-dir <dir>', 'Templates directory', './templates')
    .action(async (source, target, options) => {
      const templatesDir = path.resolve(options.templatesDir);
      await copyTemplate(source, target, templatesDir);
      console.log(pc.green(`Template copied to ${path.join(templatesDir, target)}/`));
    });

  // TPL-05: cvgen template validate [name]
  template
    .command('validate')
    .description('Validate a custom template structure')
    .argument('<name>', 'Template ID to validate')
    .option('--templates-dir <dir>', 'Templates directory', './templates')
    .action(async (name, options) => {
      const templatesDir = path.resolve(options.templatesDir);
      const result = await validateTemplate(name, templatesDir);

      if (result.valid) {
        console.log(pc.green(`Template "${name}" is valid`));
      } else {
        console.log(pc.red(`Template "${name}" has errors:`));
        for (const error of result.errors) {
          console.log(pc.red(`  - ${error}`));
        }
      }

      for (const warning of result.warnings) {
        console.log(pc.yellow(`  Warning: ${warning}`));
      }

      process.exit(result.valid ? 0 : 1);
    });

  // TPL-06: cvgen template wizard
  template
    .command('wizard')
    .description('Create a customized template through guided prompts')
    .option('--templates-dir <dir>', 'Templates directory', './templates')
    .action(async (options) => {
      const templatesDir = path.resolve(options.templatesDir);
      await runTemplateWizard(templatesDir);
    });

  return template;
}
```

### Config.json Generation

```typescript
// Generate config.json for new template
import type { TemplateConfig, StyleConfig } from '@gottz/cv-templates';

export function generateTemplateConfig(
  name: string,
  baseTemplate: string,
  style: StyleConfig,
  sections?: TemplateSectionConfig,
): TemplateConfig {
  return {
    name,
    description: `Custom template based on ${baseTemplate}`,
    atsCompliant: true,
    singleColumn: true,
    style,
    // Section visibility can be handled by template conditionals
    // stored in sectionHeaders or custom field
  };
}
```

### Complete Wizard Flow

```typescript
// packages/cli/src/template/wizard.ts
export async function runTemplateWizard(templatesDir: string): Promise<void> {
  console.log(pc.cyan('\nTemplate Wizard'));
  console.log(pc.dim('Create a customized CV template\n'));

  // 1. Select base template (TPL-07)
  const templates = await discoverTemplates(templatesDir);
  const publicTemplates = templates.filter(t => !t.config.private);
  const baseId = await selectBaseTemplate(publicTemplates);

  // 2. Name new template
  const targetId = await input({
    message: 'New template name (kebab-case):',
    validate: validateTemplateId,
  });

  // 3. Customize colors (TPL-02)
  const accentColor = await selectAccentColor();

  // 4. Customize fonts (TPL-03)
  const fonts = await selectFonts();

  // 5. Customize margins (TPL-04)
  const margins = await selectMargins();

  // 6. Section visibility (TPL-08)
  const sections = await selectVisibleSections();

  // 7. Copy base and apply customizations (TPL-09)
  await copyTemplate(baseId, targetId, templatesDir);
  await applyCustomizations(targetId, templatesDir, {
    accentColor,
    fontHeading: fonts.heading,
    fontBody: fonts.body,
    margins,
  });

  // 8. Validate result
  const result = await validateTemplate(targetId, templatesDir);
  if (!result.valid) {
    console.log(pc.red('Warning: Generated template has validation issues:'));
    for (const error of result.errors) {
      console.log(pc.red(`  - ${error}`));
    }
  }

  console.log(pc.green(`\nTemplate created at ${path.join(templatesDir, targetId)}/`));
  console.log(pc.dim(`Use with: cvgen build <name> --template ${targetId}`));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fs-extra.copy() | fs.cp() | Node 16.7+ (2021) | No external dependency needed |
| Callback-based fs | fs/promises | Node 14+ (2020) | Clean async/await code |
| Custom validation | JSON Schema + Zod | 2020+ | Type-safe, declarative |
| readline prompts | @inquirer/prompts | 2023+ | Modern ESM, better UX |

**Deprecated/outdated:**
- `fs.copyFileSync` for directories: Use `fs.cp()` with `recursive: true`
- Yeoman generators: Overkill for simple template operations; native fs sufficient
- fs-extra: Useful but Node.js native now covers most use cases

## Open Questions

Things that couldn't be fully resolved:

1. **Section visibility implementation**
   - What we know: Templates use Nunjucks conditionals; can show/hide via template context
   - What's unclear: Whether to store visibility in config.json or as separate mechanism
   - Recommendation: Store in config.json under `sections` key; template reads and applies

2. **Template preview**
   - What we know: Users want to preview before confirming
   - What's unclear: Whether to render actual PDF or show text summary
   - Recommendation: Phase 1 shows text summary of customizations; preview rendering is future enhancement

3. **Nunjucks validation**
   - What we know: No standalone Nunjucks syntax validator exists
   - What's unclear: How to validate template.njk for syntax errors
   - Recommendation: Try-render with sample data; catch and report Nunjucks errors

## Sources

### Primary (HIGH confidence)

- Node.js fs/promises documentation - `fs.cp()` API, options
- Codebase: `/workspace/packages/templates/src/config/` - Existing color, margin, style infrastructure
- Codebase: `/workspace/packages/cli/src/wizard/` - Established wizard patterns
- Codebase: `/workspace/schemas/template-config.schema.json` - Existing validation schema

### Secondary (MEDIUM confidence)

- [fs-extra copy documentation](https://github.com/jprichardson/node-fs-extra/blob/master/docs/copy.md) - Copy patterns and options
- [ATS-Friendly Fonts Guide](https://enhancv.com/blog/ats-friendly-fonts/) - Font recommendations for 2026
- [ajv-cli documentation](https://github.com/ajv-validator/ajv-cli) - JSON Schema CLI validation

### Tertiary (LOW confidence)

- [Mozilla Nunjucks issue #1264](https://github.com/mozilla/nunjucks/issues/1264) - No standalone validator exists
- Web search results for template scaffolding patterns - General patterns, not specific to this codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; all infrastructure exists
- Architecture: HIGH - Follows established codebase patterns
- Pitfalls: HIGH - Based on existing codebase conventions and ATS research
- Don't Hand-Roll: HIGH - Verified existing code provides these utilities

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable domain)
