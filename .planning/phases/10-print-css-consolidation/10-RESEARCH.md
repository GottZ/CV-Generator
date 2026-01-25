# Phase 10: Print CSS Consolidation - Research Findings

**Phase Goal:** Establish a single source of truth for print CSS, eliminating duplication across three locations and preventing maintenance conflicts.

**Research Date:** 2026-01-23
**Researcher:** Claude (gsd-phase-researcher)

---

## 1. Current State Audit

### 1.1 Location A: `templates/_shared/partials/_print.css` (85 lines)

**Full content analysis:**

```css
/* Print styles for PDF generation */
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  body {
    background: white;
  }

  .cv-page {
    box-shadow: none;
    margin: 0;
    width: 100%;
    min-height: auto;
    padding: 0;  /* Remove padding - Puppeteer margins handle page spacing */
  }

  /* Pagination rules */
  .section {
    break-inside: auto;
    page-break-inside: auto;
    orphans: 3;
    widows: 3;
  }

  .section h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  .entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .entry.long-entry {
    break-inside: auto;
    page-break-inside: auto;
  }

  .bullet-list {
    break-inside: auto;
    page-break-inside: auto;
  }

  .bullet-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .skill-category {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .contact {
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: avoid;
    page-break-after: avoid;
  }

  /* ATS/Link handling */
  a[href]::after {
    content: none;  /* Don't show URL - ATS parses href directly */
  }

  /* Hide interactive elements */
  .theme-toggle {
    display: none !important;
  }
}
```

**Key observation:** This file is NOT currently imported by any template. Each template duplicates these rules inline.

### 1.2 Location B: Template `styles.css` Files

All four templates (base, modern, minimal, classic) contain **identical** print CSS at the end of their `styles.css` files:

| Template | Lines | @page Rule | @media print Rules |
|----------|-------|------------|-------------------|
| base/styles.css | 469-529 | `@page { size: A4 portrait; margin: 0; }` | Full set (body, .cv-page, .section, .entry, .bullet-item, .contact, a[href], .theme-toggle) |
| modern/styles.css | 455-513 | Same | Same |
| minimal/styles.css | 455-513 | Same | Same |
| classic/styles.css | 454-512 | Same | Same |

**Exact duplicate rules across all templates:**
```css
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  body { background: white; }

  .cv-page {
    box-shadow: none;
    margin: 0;
    width: 100%;
    min-height: auto;
    /* NOTE: No padding: 0 in template CSS (differs from _print.css) */
  }

  .section {
    break-inside: auto;
    page-break-inside: auto;
    orphans: 3;
    widows: 3;
  }

  .section h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  .entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .bullet-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .contact {
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: avoid;
    /* NOTE: Missing page-break-after: avoid (differs from _print.css) */
  }

  a[href]::after {
    content: none;
  }

  .theme-toggle {
    display: none !important;
  }
}
```

**Notable differences from _print.css:**
1. Templates are **missing** `.cv-page { padding: 0; }`
2. Templates are **missing** `.entry.long-entry` exception rule
3. Templates are **missing** `.bullet-list` rule
4. Templates are **missing** `.skill-category` rule
5. Templates are **missing** `page-break-after: avoid` on `.contact`

### 1.3 Location C: `ATS_PRINT_CSS` in pdf-generator.ts (Lines 67-118)

```typescript
const ATS_PRINT_CSS = `
@media print {
	/* Disable ligatures for ATS text extraction (ATS-01) */
	* {
		font-variant-ligatures: none !important;
		font-feature-settings: "liga" 0, "clig" 0 !important;
	}

	/* Force light mode for PDF */
	:root {
		color-scheme: light !important;
	}

	/* Improved pagination - sections can span pages */
	.section {
		break-inside: auto;
		page-break-inside: auto;
		orphans: 3;
		widows: 3;
	}

	/* Section headers stay with content */
	.section h2 {
		break-after: avoid;
		page-break-after: avoid;
	}

	/* Entries stay intact when reasonable */
	.entry {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	/* Bullet items stay intact */
	.bullet-item {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	/* Contact stays together */
	.contact {
		break-inside: avoid;
		page-break-inside: avoid;
		break-after: avoid;
	}

	/* Remove interactive elements */
	.theme-toggle {
		display: none !important;
	}
}
`;
```

**Key observation:** This CSS is injected via `page.addStyleTag()` AFTER the HTML loads, meaning it overrides the template CSS with `!important` declarations.

**Rules unique to ATS_PRINT_CSS:**
1. `* { font-variant-ligatures: none !important; font-feature-settings: "liga" 0, "clig" 0 !important; }` - **ATS-specific, should stay here**
2. `:root { color-scheme: light !important; }` - **PDF-specific, should stay here**

**Rules duplicated that can be removed:**
1. All `.section` rules
2. All `.section h2` rules
3. All `.entry` rules
4. All `.bullet-item` rules
5. All `.contact` rules
6. `.theme-toggle` rule

---

## 2. Import Structure Analysis

### 2.1 How Templates Currently Load CSS

**Flow:**
```
Template config.json → loader.ts discovers template
                           ↓
render.ts reads styles.css (template.stylesPath)
                           ↓
styleOverrides + baseCss combined
                           ↓
Injected inline in template.njk via {{ css | safe }}
                           ↓
pdf-generator.ts ADDS ATS_PRINT_CSS after page load
```

**Key code locations:**

1. **packages/templates/src/engine/loader.ts** (line 41):
   ```typescript
   stylesPath: path.join(templatesDir, entry.name, 'styles.css'),
   ```

2. **packages/templates/src/render.ts** (line 32):
   ```typescript
   const baseCss = await readFile(template.stylesPath, 'utf-8');
   ```

3. **Template injection** (template.njk line 7-9):
   ```html
   <style>
     {{ css | safe }}
   </style>
   ```

4. **ATS CSS injection** (pdf-generator.ts line 238):
   ```typescript
   await page.addStyleTag({ content: ATS_PRINT_CSS });
   ```

### 2.2 Shared Partials Not Currently Used

The `_shared/partials/` files exist but are **not imported** by any template:
- `_print.css` (85 lines) - NOT USED
- `_reset.css` (16 lines) - NOT USED
- `_theme.css` (83 lines) - NOT USED

Each template duplicates all this functionality in its own `styles.css`.

### 2.3 Recommended Import Mechanism

**Option A: CSS @import (Not Recommended)**
```css
/* At top of styles.css */
@import '../_shared/partials/_print.css';
```
Issue: Requires runtime file resolution, complicates build process.

**Option B: Build-time concatenation (Recommended)**
Modify `render.ts` to concatenate shared CSS files:
```typescript
const sharedPrintCss = await readFile(
  path.join(templatesDir, '_shared/partials/_print.css'),
  'utf-8'
);
const baseCss = await readFile(template.stylesPath, 'utf-8');
const css = `${styleOverrides}\n\n${baseCss}\n\n${sharedPrintCss}`;
```

**Advantages of Option B:**
1. No change to template files needed
2. Single source of truth in `_print.css`
3. Print CSS loaded AFTER template CSS (correct cascade order)
4. Works with existing inline injection mechanism

---

## 3. Puppeteer PDF Settings Analysis

### 3.1 Current PDF Margin Settings (pdf-generator.ts lines 193-199)

```typescript
const DEFAULT_MARGINS = {
	top: '20mm',
	bottom: '20mm',
	left: '25mm',
	right: '25mm',
};
```

### 3.2 Current @page Rules in CSS

```css
@page {
  size: A4 portrait;
  margin: 0;  /* Puppeteer handles margins */
}
```

### 3.3 Analysis of Margin Handling

**Current behavior:**
1. CSS `@page { margin: 0 }` removes CSS page margins
2. Puppeteer adds margins via PDF generation options (20/25mm)
3. This is correct: Puppeteer margins are more reliable than @page margins

**Matching @page rules (if needed):**
```css
@page {
  size: A4 portrait;
  margin: 0;  /* Keep at 0 - Puppeteer handles actual margins */
}
```

**Important:** The current approach is correct. Do NOT add margins to @page rule - let Puppeteer handle them via `pdf()` options.

### 3.4 Footer Space Calculation

The footer template uses `padding: 0 25mm` (matching left/right margins):
```typescript
padding: 0 25mm;  // Same as left/right PDF margins
```

This ensures footer content aligns with page content.

---

## 4. Phase 9 Test Baseline Inventory

### 4.1 Available Baseline Snapshots

| Template | Fixture | Snapshot File | Size |
|----------|---------|---------------|------|
| Modern | single-page | `modern-single-page-chromium-linux.png` | 132KB |
| Modern | multi-page | `modern-multi-page-chromium-linux.png` | 552KB |
| Minimal | single-page | `minimal-single-page-chromium-linux.png` | 104KB |
| Minimal | multi-page | `minimal-multi-page-chromium-linux.png` | 428KB |
| Classic | single-page | `classic-single-page-chromium-linux.png` | 124KB |
| Classic | multi-page | `classic-multi-page-chromium-linux.png` | 504KB |

### 4.2 Test Files for Regression Detection

| Test File | Description | Key Assertions |
|-----------|-------------|----------------|
| `tests/pdf-modern.spec.ts` | Modern template visual tests | 2 screenshots (single/multi), page count |
| `tests/pdf-minimal.spec.ts` | Minimal template visual tests | 2 screenshots (single/multi), page count |
| `tests/pdf-classic.spec.ts` | Classic template visual tests | 2 screenshots (single/multi), page count |

### 4.3 How to Run Regression Tests

```bash
# Run in Docker for consistent font rendering
docker compose -f docker-compose.test.yml run --rm test

# Update snapshots if intentional changes
docker compose -f docker-compose.test.yml run --rm test -- --update-snapshots
```

### 4.4 Test Configuration (playwright.config.ts)

- `maxDiffPixelRatio: 0.01` (1% tolerance for minor rendering differences)
- `workers: 1` (sequential for determinism)
- `--font-render-hinting=none` (disable hinting for consistency)

---

## 5. Template Differences Analysis

### 5.1 Template-Specific Screen CSS (NOT print-specific)

| Template | Notable Screen-Only Differences |
|----------|--------------------------------|
| Base | Default fonts (Arial), standard spacing |
| Modern | Bold accent bar dividers (3px), geometric design |
| Minimal | Wide 30mm margins, Times New Roman font, en-dash bullets |
| Classic | Centered header, double-rule borders, mixed fonts |

### 5.2 Print CSS Differences Analysis

**All templates currently have IDENTICAL print CSS.** There are no legitimate template-specific print CSS rules.

The print CSS should:
- Reset backgrounds to white
- Remove shadows
- Control pagination (break-inside, orphans, widows)
- Hide interactive elements
- Suppress URL printing

These are universal concerns - no template needs different print behavior.

### 5.3 Rules That MUST Stay Template-Specific

**None identified.** All print CSS rules are generic and should be consolidated.

### 5.4 Rules That MUST Stay in ATS_PRINT_CSS

Only these rules should remain in pdf-generator.ts:

```typescript
const ATS_PRINT_CSS = `
@media print {
	/* Disable ligatures for ATS text extraction (ATS-01) */
	* {
		font-variant-ligatures: none !important;
		font-feature-settings: "liga" 0, "clig" 0 !important;
	}

	/* Force light mode for PDF (prevents dark mode leaking into PDF) */
	:root {
		color-scheme: light !important;
	}
}
`;
```

---

## 6. Consolidation Strategy

### 6.1 Recommended Architecture

```
BEFORE (3 locations):
├── templates/_shared/partials/_print.css  (unused)
├── templates/*/styles.css                 (duplicated print CSS)
└── pdf-generator.ts ATS_PRINT_CSS         (duplicated + ATS rules)

AFTER (1 source of truth):
├── templates/_shared/partials/_print.css  (ALL print rules)
├── templates/*/styles.css                 (NO print CSS)
└── pdf-generator.ts ATS_PRINT_CSS         (ONLY ATS-specific rules)
```

### 6.2 Implementation Steps

1. **Update `_print.css`** - Ensure it contains the complete, canonical set of print rules (use existing _print.css as base, it's already the most complete)

2. **Modify render.ts** - Load and append `_print.css` after template CSS:
   ```typescript
   const printCssPath = path.join(templatesDir, '_shared/partials/_print.css');
   const printCss = await readFile(printCssPath, 'utf-8');
   const css = `${styleOverrides}\n\n${baseCss}\n\n${printCss}`;
   ```

3. **Remove print CSS from templates** - Delete `@page` and `@media print` blocks from all template `styles.css` files

4. **Simplify ATS_PRINT_CSS** - Remove pagination rules, keep only ATS-specific:
   - Ligature disabling
   - Light mode forcing

5. **Run visual regression tests** - Verify no changes to rendered output

### 6.3 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Screen display changes | Test with `@media print` isolation |
| PDF output changes | Baseline comparison via Phase 9 tests |
| Load order issues | Append print CSS AFTER template CSS |
| Missing rules | Compare before/after with diff tool |

---

## 7. Key Questions Answered

### Q1: What EXACTLY is in each of the three locations today?

**Answer:** All three locations contain similar but subtly different pagination rules. `_print.css` is the most complete but unused. Template CSS files are identical copies. `ATS_PRINT_CSS` has fewer rules but adds ATS-specific ligature handling.

### Q2: How do templates currently import shared CSS?

**Answer:** They don't. Templates duplicate all CSS inline. The render.ts reads only the template's `styles.css` file and injects it inline. Shared partials exist but are unused.

### Q3: What are the current PDF margin settings?

**Answer:** Puppeteer uses 20mm top/bottom, 25mm left/right. CSS @page has `margin: 0` because Puppeteer handles margins. This is correct and should not change.

### Q4: What tests exist from Phase 9?

**Answer:** 6 visual baseline snapshots (2 per template) plus page count assertions. Run via Docker for font consistency. Tests compare HTML rendered with print media emulation.

### Q5: Are there legitimate template-specific print differences?

**Answer:** No. All templates have identical print CSS. Consolidation is safe - no template needs different print behavior.

---

## 8. Recommendations for Planning

### 8.1 Effort Estimate

- Modify render.ts to load _print.css: 15 minutes
- Remove print CSS from 4 template files: 30 minutes
- Simplify ATS_PRINT_CSS: 15 minutes
- Run tests and verify: 30 minutes
- Update baselines if needed: 15 minutes

**Total: ~2 hours** (aligns with SUMMARY.md estimate of 2-3 hours)

### 8.2 Testing Checklist

- [ ] All 6 baseline snapshots pass (no visual changes)
- [ ] PDF page counts unchanged
- [ ] Screen display unchanged (no @media print leakage)
- [ ] Browser Ctrl+P output matches expectations
- [ ] ATS text extraction still works (ligatures disabled)

### 8.3 Files to Modify

| File | Action |
|------|--------|
| `packages/templates/src/render.ts` | Add _print.css loading |
| `templates/_shared/partials/_print.css` | Verify completeness (already good) |
| `templates/base/styles.css` | Remove @page and @media print blocks |
| `templates/modern/styles.css` | Remove @page and @media print blocks |
| `templates/minimal/styles.css` | Remove @page and @media print blocks |
| `templates/classic/styles.css` | Remove @page and @media print blocks |
| `packages/cli/src/lib/pdf-generator.ts` | Simplify ATS_PRINT_CSS to ligatures only |

### 8.4 Success Criteria Verification

| Criterion | How to Verify |
|-----------|---------------|
| All print CSS in `_print.css` | grep -r "@media print" templates/*/styles.css returns empty |
| ATS_PRINT_CSS contains only ATS rules | Code review: only ligature and color-scheme rules |
| Screen display unchanged | Visual regression tests pass |
| @page margins match Puppeteer | Already correct: @page margin: 0, Puppeteer handles margins |

---

## 9. Summary

**Current state:** Print CSS is duplicated across 3 locations with subtle inconsistencies. `_print.css` exists but is unused.

**Target state:** Single source of truth in `_print.css`, loaded by render.ts after template CSS. Templates have no print CSS. ATS_PRINT_CSS has only ligature/color-scheme rules.

**Risk level:** LOW - All templates have identical print CSS, existing tests catch regressions, implementation is straightforward file manipulation.

**Confidence:** HIGH - Complete audit performed, all rules documented, clear implementation path identified.
