# Printing CVs from Browser

This guide explains how to print your CV directly from the HTML output in a web browser, achieving equivalent results to the CLI-generated PDF.

## Quick Start

1. Generate HTML: `bun run gen --format html`
2. Open the HTML file in Chrome (or Chromium-based browser)
3. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS)
4. Select "Save as PDF"
5. Click Save

## Why Chrome?

The CV Generator uses **Puppeteer** (which runs Chrome/Chromium) to generate PDFs. For maximum compatibility and consistent output, we recommend printing from Chrome or any Chromium-based browser (Edge, Brave, etc.).

**Key benefit:** Chrome's print engine matches the CLI PDF generation, so page breaks, fonts, and layout will be nearly identical.

Other browsers (Firefox, Safari) may work but could produce slightly different pagination.

## Step-by-Step Instructions

### Windows / Linux

1. **Generate HTML output:**
   ```bash
   bun run gen --format html
   # Or: bun run gen --format all (generates both HTML and PDF)
   ```

2. **Locate the HTML file:**
   - Default output: `./output/[name]/[name]-cv.html`
   - Or check your configured output directory

3. **Open in Chrome:**
   - Right-click the HTML file and select "Open with > Chrome"
   - Or drag the file into a Chrome window
   - Or type the file path in Chrome's address bar

4. **Open print dialog:**
   - Press `Ctrl+P`
   - Or click the three-dot menu > Print

5. **Configure print settings** (see [Print Dialog Settings](#print-dialog-settings) below)

6. **Save as PDF:**
   - Destination: "Save as PDF"
   - Click "Save"
   - Choose your save location

### macOS

1. **Generate HTML output:**
   ```bash
   bun run gen --format html
   ```

2. **Locate the HTML file:**
   - Default output: `./output/[name]/[name]-cv.html`

3. **Open in Chrome:**
   - Right-click the HTML file and select "Open With > Google Chrome"
   - Or drag the file into a Chrome window

4. **Open print dialog:**
   - Press `Cmd+P`
   - Or click Chrome menu > Print

5. **Configure print settings** (see [Print Dialog Settings](#print-dialog-settings) below)

6. **Save as PDF:**
   - Click "Save as PDF" in the destination dropdown
   - Click "Save"

## Print Dialog Settings

For best results, use these settings in Chrome's print dialog:

| Setting | Recommended Value | Notes |
|---------|------------------|-------|
| **Destination** | Save as PDF | Not "Print to PDF" on some systems |
| **Pages** | All | Unless you want specific pages |
| **Layout** | Portrait | CV is designed for portrait |
| **Paper size** | A4 or Letter | Match your target region |
| **Scale** | 100% | Default; do not change |
| **Margins** | Default | The CV has its own margins |
| **Background graphics** | Enabled | Required for visual styling |

### Critical Settings

- **Scale must be 100%** - Changing scale will break pagination
- **Background graphics must be enabled** - Otherwise you lose colors, icons, and visual elements
- **Margins: Default** - The CV CSS handles margins; browser margins will add extra whitespace

## Known Differences

Browser-printed PDFs are functionally equivalent to CLI-generated PDFs, but there are some minor differences:

### 1. Footer

| CLI PDF | Browser Print |
|---------|---------------|
| Includes footer with name and page number | No footer |

**Workaround:** Not needed for most use cases. The footer is a convenience feature, not required content.

### 2. ATS Text Extraction

| CLI PDF | Browser Print |
|---------|---------------|
| Ligature disabling CSS applied | Standard text rendering |

**Impact:** ATS systems might extract text slightly differently. For maximum ATS compatibility, use the CLI-generated PDF.

**Workaround:** Use `bun run gen --format pdf` for formal job applications.

### 3. Two-Pass Optimization

| CLI PDF | Browser Print |
|---------|---------------|
| Content may be redistributed to avoid sparse last page | Uses natural page breaks |

**Impact:** In some cases, the CLI may produce a more evenly distributed multi-page CV. Browser print uses natural CSS page breaks.

**Workaround:** None needed - page counts match in our testing.

## Troubleshooting

### Page breaks in wrong places

- Ensure you're using Chrome (not Firefox or Safari)
- Check that scale is set to 100%
- Verify "Background graphics" is enabled

### Content cut off at edges

- Ensure margins are set to "Default" not "None"
- Check that paper size matches (A4 vs Letter)

### Colors or styling missing

- Enable "Background graphics" in print settings
- This is the most common issue

### Fonts look different

- Chrome should use the same fonts as CLI generation
- If fonts differ, the system may be missing required fonts
- The CV uses standard web-safe fonts as fallback

### Extra blank pages

- Check for extra whitespace in your markdown content
- Verify the page count matches between HTML preview and print

## When to Use CLI PDF vs Browser Print

| Use Case | Recommended |
|----------|-------------|
| Formal job application | CLI PDF (`bun run gen --format pdf`) |
| Quick printing for interview | Browser print (either works) |
| Sharing electronically | CLI PDF (smaller file size, footer) |
| Printing at a print shop | Either (bring both for safety) |
| ATS submission | CLI PDF (ligature handling) |
| Personal archive | Either works |

**General guidance:** Use CLI PDF for formal submissions. Browser print is fine for quick prints and personal use.

## Technical Details

### CSS Print Support

The CV templates use CSS `@media print` rules that:
- Convert layouts to block display for proper page breaks
- Apply `break-inside: avoid` to keep sections together
- Set orphans/widows control for clean page breaks
- Match the CLI Puppeteer PDF settings

### Page Size

The CV CSS uses:
```css
@page {
  size: A4;
  margin: 20mm 0;
}
```

This matches the Puppeteer PDF generation settings.

### Supported Browsers

| Browser | Support Level |
|---------|--------------|
| Chrome | Full (recommended) |
| Edge | Full (Chromium-based) |
| Brave | Full (Chromium-based) |
| Firefox | Partial (may have pagination differences) |
| Safari | Partial (may have pagination differences) |

## See Also

- [CLI Documentation](./CLI.md) - Full CLI reference
- [Customization Guide](./CUSTOMIZATION.md) - Template customization
- [FAQ](./FAQ.md) - Frequently asked questions
