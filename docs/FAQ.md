# Frequently Asked Questions

## General

### What is ATS and why does it matter?

ATS (Applicant Tracking System) is software that scans resumes before human review. Many companies use ATS systems like iCIMS, Workday, Greenhouse, or Taleo.

CVs that aren't ATS-optimized may be rejected or incorrectly parsed, losing information. cvgen ensures your CV is machine-readable while looking professional.

### Which template should I use?

| Template | Best For |
|----------|----------|
| **modern** | Tech companies, startups, creative roles |
| **minimal** | Traditional companies, print-focused (interviews with note space) |
| **classic** | Finance, law, consulting, corporate environments |

All three are ATS-compliant. Choose based on your target industry and personal preference.

### Should I include a photo?

It depends on your region:

- **USA/UK**: Generally no - photos can introduce bias
- **Europe (Germany, etc.)**: Often expected
- **Asia**: Often expected

If you include a photo, be aware that ATS systems cannot parse image content. The photo is purely for human reviewers.

### How long should my CV be?

- **Early career (0-5 years)**: 1 page
- **Mid career (5-15 years)**: 1-2 pages
- **Senior (15+ years)**: 2 pages maximum

cvgen generates single-page PDFs by default. If your content exceeds one page, consider trimming older/less relevant experience.

## Technical

### Why is Bun required?

cvgen is built with [Bun](https://bun.sh/), a fast JavaScript runtime. Bun provides:
- Fast startup and execution
- Built-in TypeScript support
- Native ESM module resolution

Install Bun: `curl -fsSL https://bun.sh/install | bash`

### Why is Puppeteer required?

Puppeteer controls a headless Chrome browser to convert HTML to PDF. This ensures:
- High-quality typography
- Accurate layout rendering
- Consistent cross-platform output

Chrome/Chromium must be installed. Puppeteer will attempt to download it automatically if needed.

### Can I use custom fonts?

Yes, but with caveats:

| Format | Custom Font Support |
|--------|---------------------|
| HTML | Any web font works |
| PDF | Font must be installed on system |
| DOCX | Use standard fonts only |

For ATS compatibility, stick to standard fonts (Arial, Times New Roman, Calibri).

### Why are my images showing a warning?

ATS systems cannot parse image content. The warning reminds you that any text in images (like your name on a logo) won't be searchable.

This is informational only - images are still included in output.

### Why does DOCX look different from PDF?

DOCX is generated directly from CV data (not from HTML). Some CSS features don't translate to Word format:
- Gradients and shadows
- Complex borders
- Custom fonts (uses Arial/Times fallback)

This is expected behavior. The content is identical; only styling differs slightly.

## Troubleshooting

### "Template not found"

Check available templates:
```bash
cvgen list-templates
```

Template names are case-sensitive: `modern`, `minimal`, `classic`.

### "Person not found"

Ensure the directory exists under `/people/`:
```bash
ls people/
```

Names are slugified: "John Doe" becomes `john-doe`.

cvgen will suggest similar names if you misspell.

### "CV file not found"

Ensure `cv.md` exists in the person directory:
```bash
ls people/john-doe/
```

Should show:
```
cv.md
images/
```

### PDF generation fails

1. **Ensure Chrome/Chromium is installed**
   ```bash
   which google-chrome || which chromium
   ```

2. **Check for Puppeteer errors**
   ```bash
   npx puppeteer browsers install chrome
   ```

3. **Try with increased timeout**
   PDF generation can be slow on first run while Chrome downloads.

### DOCX won't open

Ensure the DOCX file completed generation:
```bash
ls -la people/john-doe/output/
```

If file size is 0 or very small, generation failed. Check for error messages.

### Changes not appearing

1. **Clear output directory**
   ```bash
   rm -rf people/john-doe/output/
   ```

2. **Rebuild**
   ```bash
   cvgen build john-doe modern
   ```

3. **Check you're editing the right file**
   ```bash
   cat people/john-doe/cv.md
   ```

### Parse errors

Common causes:
- Invalid YAML in frontmatter (check indentation)
- Missing section language tag
- Incorrect date format (use YYYY-MM or YYYY)

Validate your CV:
```bash
cvgen validate john-doe
```

## Workflow

### How do I maintain multiple CV versions?

Create separate directories:
```
people/
├── john-doe-tech/      # Tech-focused CV
├── john-doe-manager/   # Management-focused CV
└── john-doe-full/      # Complete CV
```

### How do I translate my CV?

Add sections for each language:
```markdown
## Summary `en`
English summary...

## Zusammenfassung `de`
German summary...
```

Then generate for each locale:
```bash
cvgen build john-doe modern --locale en
cvgen build john-doe modern --locale de
```

### How do I customize colors for one person?

Add `style` to frontmatter:
```yaml
---
name: John Doe
style:
  accentColor: "#059669"
---
```

This overrides template and global configuration.
