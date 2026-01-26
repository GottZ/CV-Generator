---
phase: 20-template-scaffolding
plan: 03
subsystem: cli
tags: [typescript, prompts, inquirer, template-wizard, customization]

# Dependency graph
requires:
  - phase: 20-02
    provides: types.ts (SectionVisibility), constants.ts (ATS_SAFE_FONTS, COLOR_PRESETS, MARGIN_OPTIONS), barrel export
provides:
  - selectAccentColor prompt with preset + custom hex validation
  - selectFonts, selectHeadingFont, selectBodyFont for ATS-safe font selection
  - selectMargins with named size options
  - selectVisibleSections checkbox for optional sections
  - Barrel export at prompts/index.ts
affects: [20-04, 20-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@inquirer/prompts patterns for template customization"
    - "Checkbox multi-select for section visibility"
    - "Custom input with hex validation fallback"

key-files:
  created:
    - packages/cli/src/template/prompts/colors.ts
    - packages/cli/src/template/prompts/fonts.ts
    - packages/cli/src/template/prompts/margins.ts
    - packages/cli/src/template/prompts/sections.ts
    - packages/cli/src/template/prompts/index.ts
  modified:
    - packages/cli/src/template/index.ts

key-decisions:
  - "Color prompt uses select for presets + input fallback for custom hex"
  - "Font prompts have no custom input - ATS-safe fonts only per RESEARCH.md Pitfall 1"
  - "Margins use named sizes (narrow/normal/wide), cv-templates resolves to mm"
  - "Sections checkbox defaults all optional sections to visible"

patterns-established:
  - "Template prompts module: packages/cli/src/template/prompts/"
  - "Combined prompt pattern: selectFonts() for sequential prompts"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 20 Plan 03: Template Customization Prompts Summary

**Interactive prompts for color, font, margin, and section visibility selection using @inquirer/prompts patterns**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T14:39:20Z
- **Completed:** 2026-01-26T14:41:28Z
- **Tasks:** 5/5
- **Files created:** 5

## Accomplishments

- Color selection prompt with 8 presets + custom hex input validated by isValidHexColor
- Font selection prompts restricted to 8 ATS-safe fonts (no custom input)
- Margin selection with named sizes (narrow/normal/wide) for simplicity
- Section visibility checkbox for 3 optional sections (Experience/Education/Skills always shown)
- Barrel export integrating all prompts into template module API

## Task Commits

1. **Task 1: Create color selection prompt** - `4ae7828`
2. **Task 2: Create font selection prompts** - `fbc7379`
3. **Task 3: Create margin selection prompt** - `1174f77`
4. **Task 4: Create section visibility prompt** - `35c91c2`
5. **Task 5: Create prompts barrel export** - `89b459f`

## Files Created/Modified

### Created
- `packages/cli/src/template/prompts/colors.ts` - selectAccentColor with preset + custom
- `packages/cli/src/template/prompts/fonts.ts` - selectHeadingFont, selectBodyFont, selectFonts
- `packages/cli/src/template/prompts/margins.ts` - selectMargins with named sizes
- `packages/cli/src/template/prompts/sections.ts` - selectVisibleSections checkbox
- `packages/cli/src/template/prompts/index.ts` - Barrel export

### Modified
- `packages/cli/src/template/index.ts` - Added prompts exports

## Decisions Made

- **Color preset + custom pattern:** Using select for common colors with input fallback for custom hex. Custom input accepts with or without # prefix and normalizes output.

- **No custom font input:** Per 20-RESEARCH.md Pitfall 1, only ATS-safe fonts allowed. This prevents users from accidentally choosing fonts that break ATS parsing.

- **Named margins over numeric:** Users select "narrow", "normal", or "wide" rather than entering mm values. cv-templates resolveMargin handles conversion, keeping wizard simple.

- **Core sections always visible:** Experience, Education, and Skills are required for ATS compatibility. Only Summary, Projects, and Certifications are configurable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Import order lint:** Biome required @gottz/cv-templates import before @inquirer/prompts in colors.ts. Fixed by reordering imports before commit.

## Verification Results

```
$ bun -e "import * as p from './packages/cli/src/template/prompts/index.ts'; console.log(Object.keys(p))"
[ "selectAccentColor", "selectBodyFont", "selectFonts", "selectHeadingFont", "selectMargins", "selectVisibleSections" ]

$ bun -e "import { selectAccentColor } from './packages/cli/src/template/index.ts'; console.log('selectAccentColor:', typeof selectAccentColor)"
selectAccentColor: function
```

## Next Phase Readiness

- All prompts ready for template wizard integration (Plan 04)
- Reuses existing constants from Plan 02 (ATS_SAFE_FONTS, COLOR_PRESETS, MARGIN_OPTIONS)
- Follows @inquirer/prompts patterns established in Phase 18 wizard
- Clean import path: `import { selectAccentColor, selectFonts } from '../template'`

---
*Phase: 20-template-scaffolding*
*Completed: 2026-01-26*
