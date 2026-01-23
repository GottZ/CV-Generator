---
phase: 08
plan: 05
subsystem: configuration
tags: [config, cascade, margins, colors, css-variables]

dependency-graph:
  requires: ["08-01"]
  provides: ["config-cascade", "style-resolution", "css-variables"]
  affects: ["08-06"]

tech-stack:
  added: []
  patterns:
    - "config-cascade-priority"
    - "css-custom-properties-injection"
    - "env-var-mapping"

files:
  created:
    - packages/templates/src/config/margins.ts
    - packages/templates/src/config/colors.ts
    - packages/templates/src/config/index.ts
  modified:
    - packages/templates/src/types.ts
    - packages/templates/src/index.ts
    - packages/templates/src/render.ts

decisions:
  - id: config-cascade-priority
    choice: "template defaults < global config < env vars < frontmatter"
    rationale: "Most specific wins; frontmatter is most immediate to user"
  - id: env-var-prefix
    choice: "CVGEN_ prefix for all environment variables"
    rationale: "Namespaced to avoid collisions with other tools"
  - id: css-prepend
    choice: "Prepend CSS variable overrides BEFORE template CSS"
    rationale: "Templates can reference variables in their own CSS"
  - id: invalid-config-warning
    choice: "Invalid config produces warning but doesn't break generation"
    rationale: "Graceful degradation; user can still generate CV with defaults"

metrics:
  duration: "~6 minutes"
  completed: "2026-01-23"
---

# Phase 08 Plan 05: Configuration Cascade Summary

Configuration cascade system enabling multi-level style customization with proper priority ordering.

## One-Liner

Config cascade merging template/global/env/frontmatter with CSS variable injection for style customization.

## What Was Built

### Margin Resolution Module (`margins.ts`)
- **NAMED_MARGINS**: narrow=15mm, normal=20mm, wide=30mm
- **resolveMargin()**: Accepts string ('narrow'/'normal'/'wide') or number, clamps to 10-40mm range
- **marginToCss()**: Converts mm value to CSS value string

### Color Derivation Module (`colors.ts`)
- **ColorPalette interface**: accent, heading, body, muted, border, background, surface
- **DEFAULT_PALETTES**: Pre-defined palettes for modern, minimal, classic templates
- **hexToRgb(), rgbToHex()**: Color format conversion utilities
- **isValidHexColor()**: Validates #xxxxxx format
- **mergeColors()**: Merges partial overrides with base palette, validates each color

### Config Cascade Module (`config/index.ts`)
- **Priority order**: template defaults < global config < env vars < frontmatter
- **ENV_MAPPINGS**: CVGEN_ACCENT_COLOR, CVGEN_FONT_HEADING, CVGEN_FONT_BODY, CVGEN_MARGINS
- **loadGlobalConfig()**: Reads /config.json style field from project root
- **getEnvConfig()**: Reads CVGEN_* environment variables
- **mergeStyleConfigs()**: Deep merges multiple configs in priority order
- **resolveStyle()**: Produces ResolvedStyle with all values resolved and validated
- **styleToCssVariables()**: Generates CSS custom property block

### Type Definitions (`types.ts`)
- **StyleConfig**: Partial style config that can appear at any cascade level
- **ResolvedStyle**: Fully resolved style after cascade with all values guaranteed
- **RenderOptions**: Extended with styleConfig and projectRoot options

### Render Integration (`render.ts`)
- Both `renderCV()` and `createRenderer()` updated with cascade support
- CSS variable overrides prepended BEFORE template CSS
- Warnings logged for invalid config values (but generation continues)

## Verification Results

| Check | Result |
|-------|--------|
| `bun run typecheck` passes | PASS |
| `resolveMargin('wide')` returns 30 | PASS |
| `resolveMargin(25)` returns 25 | PASS |
| `getEnvConfig()` reads CVGEN_ACCENT_COLOR | PASS |
| `resolveStyle()` merges configs correctly | PASS |
| `styleToCssVariables()` generates valid CSS | PASS |
| Rendering with custom styleConfig applies overrides | PASS |

## API Examples

```typescript
// Using environment variables
process.env.CVGEN_ACCENT_COLOR = '#ff5500';
const envConfig = getEnvConfig();
// { accentColor: '#ff5500' }

// Resolving margins
resolveMargin('wide');    // 30
resolveMargin(25);        // 25
resolveMargin('invalid'); // 20 (default)

// Full style resolution
const resolved = resolveStyle(
  templateConfig,           // from template config.json
  await loadGlobalConfig(projectRoot),  // from /config.json
  frontmatterStyle,         // from CV markdown frontmatter
  warnings                  // collects invalid config warnings
);

// Generate CSS
const cssVars = styleToCssVariables(resolved);
// :root { --color-accent: #ff5500; --font-heading: Arial...; --page-margin: 20mm; }
```

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change |
|------|--------|
| `packages/templates/src/config/margins.ts` | Created: margin resolution |
| `packages/templates/src/config/colors.ts` | Created: color utilities |
| `packages/templates/src/config/index.ts` | Created: cascade logic |
| `packages/templates/src/types.ts` | Added StyleConfig, ResolvedStyle, extended RenderOptions |
| `packages/templates/src/index.ts` | Export config module |
| `packages/templates/src/render.ts` | Integrate cascade, prepend CSS variables |

## Commits

| Hash | Message |
|------|---------|
| a0a3252 | feat(08-05): add color derivation module |
| 8734a65 | feat(08-05): add config cascade module |
| 1552829 | feat(08-05): integrate config cascade with render.ts |

Note: margins.ts was created in an earlier plan (08-02) commit 211522c.

## Next Phase Readiness

Ready for 08-06 (Polish and Documentation). Config cascade provides:
- Environment variable support for CI/CD customization
- Global config.json for project-wide defaults
- Frontmatter overrides for per-CV customization
- CSS variable injection for template theming
