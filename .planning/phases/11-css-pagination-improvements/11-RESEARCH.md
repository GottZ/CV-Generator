# Phase 11: CSS Pagination Improvements - Research

**Researched:** 2026-01-24
**Domain:** CSS fragmentation, print pagination, Puppeteer PDF generation
**Confidence:** HIGH

## Summary

This research investigates CSS fragmentation properties for implementing professional print pagination in CV templates. The phase builds on Phase 10's consolidated print CSS foundation to add pagination rules that prevent orphaned headers, split entries, widow lines, and near-empty last pages.

**Key findings:** CSS fragmentation properties (`break-inside`, `break-after`, `orphans`, `widows`) are well-supported in Chromium and work reliably with Puppeteer. The primary challenge is that flexbox containers prevent page-break properties from working - the established workaround is converting flex layouts to `display: block` within `@media print`. Legacy `page-break-*` properties should be used alongside modern `break-*` properties for maximum compatibility.

**Primary recommendation:** Implement pagination rules in `_print.css` using both modern and legacy CSS properties, convert flexbox containers to block display for print, and use padding (not margin) for element spacing to avoid accumulation at page breaks.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Fragmentation Module Level 3 | W3C Spec | Page break control | Native browser support, no dependencies |
| `@media print` | CSS2+ | Print-specific styles | Universal browser support |
| `@page` | CSS Paged Media | Page sizing/margins | Puppeteer respects via preferCSSPageSize |

### Already In Use
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Puppeteer | 24.36.0 | PDF generation | Uses `preferCSSPageSize: true` |
| Playwright | 1.57.0 | Visual regression | Print media emulation for testing |

### No Additions Needed
This phase requires no new dependencies - all pagination is achieved through CSS properties already supported by the Puppeteer/Chromium rendering engine.

## Architecture Patterns

### CSS Fragmentation Property Hierarchy

The W3C CSS Fragmentation specification defines clear precedence for break properties:

```css
/* Priority order (highest to lowest): */
1. break-before/break-after: always/page/column  /* Forced breaks */
2. break-inside: avoid                           /* Prevent breaks */
3. break-after: avoid                            /* Avoid breaks after */
4. orphans/widows                                /* Line minimums */
```

### Pattern 1: Dual-Property Approach (Legacy + Modern)

**What:** Use both legacy `page-break-*` and modern `break-*` properties
**When to use:** Always, for maximum browser/Puppeteer compatibility
**Example:**
```css
/* Source: MDN CSS Fragmentation docs */
.entry {
  /* Modern property */
  break-inside: avoid;
  /* Legacy fallback (treated as alias by modern browsers) */
  page-break-inside: avoid;
}

.section h2 {
  break-after: avoid;
  page-break-after: avoid;
}
```

### Pattern 2: Flexbox-to-Block Print Conversion

**What:** Override flexbox layouts to block display in print context
**When to use:** Any flexbox container that needs internal page breaks to work
**Example:**
```css
/* Source: IPython Issue #5115 - verified fix */
@media print {
  /* Flexbox prevents break properties from working */
  .skill-list,
  .tech-stack,
  .contact-info,
  .entry-header {
    display: block;
  }

  /* Inline-flex to inline for tag lists */
  .skill,
  .tech-tag {
    display: inline;
  }
}
```

### Pattern 3: Header-Content Cohesion

**What:** Keep section headers attached to following content
**When to use:** Prevent orphaned headers at page bottom
**Example:**
```css
/* Source: CSS-Tricks Print Stylesheet Guide */
@media print {
  /* Section headers must stay with content */
  h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* Minimum lines before break allowed */
  p, .bullet-item {
    orphans: 2;
    widows: 2;
  }
}
```

### Pattern 4: Atomic Units vs. Breakable Containers

**What:** Define which elements are atomic (no internal breaks) vs. breakable
**When to use:** Based on CONTEXT.md decisions about content structure
**Example:**
```css
@media print {
  /* Atomic units - never break inside */
  .entry,
  .skill-category,
  .certification-entry,
  .contact {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Breakable containers - can break between children */
  .section,
  .bullet-list {
    break-inside: auto;
    page-break-inside: auto;
  }

  /* Individual items within lists are atomic */
  .bullet-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

### Pattern 5: Padding Over Margin for Page Breaks

**What:** Use padding instead of margin for element spacing
**When to use:** To avoid margin accumulation at page break points
**Example:**
```css
/* Source: SUMMARY.md research findings */
@media print {
  /* Use padding to avoid margin collapse issues at page breaks */
  .entry {
    padding-bottom: var(--spacing-md);
    margin-bottom: 0; /* Avoid margin accumulation */
  }
}
```

### Anti-Patterns to Avoid

- **Forcing entire sections to new pages:** Using `break-before: always` on sections wastes space and creates many near-empty pages
- **Overly aggressive break-avoidance:** Too many `break-inside: avoid` rules can cause content overflow or massive gaps
- **Ignoring flexbox context:** Applying break properties to flex children without converting container to block
- **Using margins for spacing in print:** Margins can accumulate unpredictably at page breaks

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page break detection | JavaScript page counting | CSS orphans/widows | Browser handles naturally |
| Content reflow | Custom layout algorithm | CSS break-inside: avoid | Native browser pagination |
| Dynamic spacing | JS-based gap calculation | CSS padding + block display | Consistent cross-platform |
| Near-empty page detection | Page counting + reflow | Sensible orphan/widow values | Edge cases are rare, manual tuning sufficient |

**Key insight:** CSS fragmentation properties are hints, not commands. The browser will do its best but may ignore rules when mathematically impossible (e.g., single-line paragraph can't have orphans: 3). Design for reasonable defaults, not perfect edge cases.

## Common Pitfalls

### Pitfall 1: Flexbox Breaks Page-Break Properties
**What goes wrong:** `page-break-inside: avoid` and `break-inside: avoid` are silently ignored when the element is a flex item
**Why it happens:** CSS spec behavior - fragmentation doesn't apply to flex formatting context
**How to avoid:** Convert flex containers to `display: block` in @media print
**Warning signs:** Page breaks occur mid-entry despite having break-inside: avoid

**Verified via:** [IPython Issue #5115](https://github.com/ipython/ipython/issues/5115) - fix confirmed working

### Pitfall 2: break-inside Ignored for inline-block
**What goes wrong:** Block elements inside inline-block containers don't respect break properties
**Why it happens:** W3C spec excludes inline-block from break property applicability
**How to avoid:** Ensure parent containers are block-level in print context
**Warning signs:** Content splits despite avoid rules on items

**Verified via:** [Puppeteer Issue #6366](https://github.com/puppeteer/puppeteer/issues/6366) - confirmed user configuration issue

### Pitfall 3: Orphan/Widow Values as Preferences, Not Rules
**What goes wrong:** Single-line elements ignore orphans: 3 rule
**Why it happens:** Browser cannot create lines that don't exist
**How to avoid:** Use reasonable values (2-3 lines) and accept browser judgment
**Warning signs:** Expecting rigid enforcement of line counts

**Source:** [MDN orphans documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/orphans)

### Pitfall 4: Firefox Lacks orphans/widows Support
**What goes wrong:** Testing in Firefox shows no orphan/widow control
**Why it happens:** Firefox still hasn't implemented these CSS 2.1 properties (20+ year bug)
**How to avoid:** Test with Puppeteer/Chromium specifically, not Firefox
**Warning signs:** Inconsistent behavior between browsers

**Browser support:** 83% coverage on [caniuse.com](https://caniuse.com/css-widows-orphans) - Chrome, Safari, Edge all support; Firefox does not

### Pitfall 5: Margin Accumulation at Page Breaks
**What goes wrong:** Large gaps appear at top of pages after breaks
**Why it happens:** Margins don't collapse across page boundaries like they do within a page
**How to avoid:** Use padding for spacing instead of margin in print styles
**Warning signs:** Inconsistent vertical spacing on different pages

**Source:** SUMMARY.md research - established best practice

### Pitfall 6: @page Margins vs Puppeteer Margins Conflict
**What goes wrong:** Double margins or unexpected content clipping
**Why it happens:** Both CSS @page and Puppeteer pdf() options can set margins
**How to avoid:** Set `@page { margin: 0 }` and let Puppeteer handle margins via pdf() options
**Warning signs:** Content appears "under" margins or excessive whitespace

**Current implementation:** Already correct - `@page { margin: 0 }` with Puppeteer margins of 20/25mm

## Code Examples

### Complete Print CSS Block for Pagination
```css
/* Source: Synthesis of MDN docs, IPython fix, and project requirements */
@media print {
  /* === Flexbox-to-Block Conversion === */
  /* Required for break properties to work */
  main {
    display: block;
  }

  .contact-info,
  .skill-list,
  .tech-stack,
  .entry-header {
    display: block;
  }

  .skill,
  .tech-tag,
  .contact-item {
    display: inline;
    margin-right: 8px;
  }

  /* === Section-Level Rules === */
  /* Sections CAN span pages */
  .section {
    break-inside: auto;
    page-break-inside: auto;
  }

  /* Section headers stay with content */
  .section h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* === Entry-Level Rules (Atomic Units) === */
  .entry,
  .experience-entry,
  .education-entry,
  .project-entry,
  .certification-entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Long entries can break - use .long-entry class */
  .entry.long-entry {
    break-inside: auto;
    page-break-inside: auto;
  }

  /* === Bullet Lists === */
  /* Lists can break between items */
  .bullet-list {
    break-inside: auto;
    page-break-inside: auto;
  }

  /* Individual bullets are atomic */
  .bullet-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* === Skills Section === */
  /* Categories are atomic */
  .skill-category {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* === Contact Header === */
  .contact {
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: avoid;
    page-break-after: avoid;
  }

  /* === Orphan/Widow Control === */
  p, .summary-text, .project-description {
    orphans: 2;
    widows: 2;
  }
}
```

### Entry-Header to Block Conversion Detail
```css
/* Source: Verified against template markup in entry.njk */
@media print {
  /* entry-header uses flexbox for title/date alignment */
  .entry-header {
    display: block;
  }

  /* Make date appear on same line as title using inline */
  .entry-title {
    display: inline;
  }

  .date-range {
    display: inline;
    float: right;  /* Maintain right-alignment */
  }
}
```

### Long Entry Detection Pattern
```css
/* For entries with 15+ bullets, allow internal breaks */
@media print {
  /* Apply via JavaScript or template logic based on bullet count */
  .entry.long-entry .bullet-list {
    break-inside: auto;
    page-break-inside: auto;
  }

  /* But keep individual bullets atomic */
  .entry.long-entry .bullet-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `page-break-*` only | Both `break-*` and `page-break-*` | CSS Break Level 3 | Better column/region support |
| Flexbox for all layouts | Block in print, flex for screen | Always needed for print | Enables break properties |
| Margin-based spacing | Padding-based spacing in print | Best practice | Avoids accumulation issues |
| Paged.js polyfill | Native CSS + Puppeteer | Puppeteer matured | No runtime dependency needed |

**Deprecated/outdated:**
- **Paged.js:** Only needed for complex paged media features not used in CVs (margin boxes, running headers)
- **JavaScript pagination:** Browser CSS is sufficient for CV-length documents
- **Float-based layouts:** Outdated; use block with inline children for print

## Open Questions

### 1. Long Entry Threshold
- **What we know:** CONTEXT.md says 15+ bullets triggers long-entry treatment
- **What's unclear:** Should this be automatic (CSS `:has()` count) or manual (template logic)?
- **Recommendation:** Add template logic during render to count bullets and add `.long-entry` class; CSS `:has()` not well-supported in print context

### 2. Near-Empty Last Page Detection
- **What we know:** PAG-07 requires avoiding near-empty (<20% filled) last pages
- **What's unclear:** CSS cannot detect page fill percentage; this is a suggestion to browser
- **Recommendation:** Rely on sensible orphan/widow values and accept browser judgment; manual review for edge cases

### 3. Two-Column Layout Pagination
- **What we know:** CONTEXT.md mentions "each column paginates independently"
- **What's unclear:** No templates currently use two-column layout
- **Recommendation:** Document pattern but defer implementation until two-column template exists

## Sources

### Primary (HIGH confidence)
- [MDN CSS Fragmentation](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fragmentation) - Complete property reference
- [MDN break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-inside) - Property details and examples
- [MDN orphans](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/orphans) - Orphan line control
- [Puppeteer PDFOptions](https://pptr.dev/api/puppeteer.pdfoptions) - preferCSSPageSize behavior

### Secondary (MEDIUM confidence)
- [IPython Issue #5115](https://github.com/ipython/ipython/issues/5115) - Flexbox fix verified working
- [Puppeteer Issue #6366](https://github.com/puppeteer/puppeteer/issues/6366) - inline-block issue confirmed user error
- [caniuse CSS widows & orphans](https://caniuse.com/css-widows-orphans) - 83% browser support (Firefox excluded)
- [CSS-Tricks page-break](https://css-tricks.com/almanac/properties/p/page-break/) - Legacy property reference

### Tertiary (LOW confidence)
- WebSearch results on near-empty page avoidance - no authoritative solutions found; CSS provides hints only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native CSS, well-documented W3C spec
- Architecture: HIGH - Patterns verified against MDN and IPython fix
- Pitfalls: HIGH - Multiple GitHub issues document actual problems

**Research date:** 2026-01-24
**Valid until:** 2026-04-24 (90 days - CSS fragmentation is stable spec)

---

## Implementation Notes for Planner

### Files to Modify
1. `templates/_shared/partials/_print.css` - Add/update pagination rules (single source of truth)

### No Other Files Needed
- Templates already use correct class names (`.entry`, `.bullet-item`, `.skill-category`, etc.)
- Puppeteer config already has correct settings (`preferCSSPageSize: true`)
- `ATS_PRINT_CSS` already simplified (Phase 10)

### Testing Strategy
1. Use existing `multi-page-cv.md` fixture - designed to span 3+ pages
2. Run visual regression tests in Docker for font consistency
3. Update baseline snapshots if pagination changes improve layout
4. Manual verification for subjective improvements (page break placement)

### Success Verification
- PAG-01 to PAG-05: Visual inspection of multi-page PDF
- PAG-06: Already satisfied (Puppeteer margins)
- PAG-07: Subjective assessment - accept reasonable browser decisions
