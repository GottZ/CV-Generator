# Features Research: CV/Resume Generator CLI Tool

**Domain:** CLI-based markdown-to-multi-format CV/resume generator
**Researched:** 2026-01-22
**Target:** IT professionals
**Confidence:** HIGH (verified across multiple authoritative sources)

---

## Table Stakes

Features users expect. Missing these means the tool feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-format output (PDF, HTML, DOCX)** | Industry standard - recruiters need all three formats | Medium | PDF for sending/printing, DOCX for ATS/recruiter uploads, HTML for portfolios |
| **Markdown input parsing** | Core value proposition - must actually work | Low | Standard markdown plus potential extensions for CV-specific sections |
| **Template system** | Users expect to choose/customize appearance | Medium | Minimum 3-5 templates; must support style variations |
| **ATS-compatible output** | 97%+ of Fortune 500 use ATS - invisible resumes are useless | High | Single-column layouts, standard fonts, parseable text, proper headings |
| **Clean contact info section** | Every resume needs name, email, phone, links | Low | GitHub, LinkedIn, portfolio URL support essential for IT professionals |
| **Work experience section** | Core resume content | Low | Company, title, dates, bullet points with achievements |
| **Education section** | Standard expectation | Low | Degree, institution, dates, optional GPA/honors |
| **Skills section** | Critical for IT professionals and ATS keyword matching | Low | Support for categorization (languages, frameworks, tools) |
| **Consistent date formatting** | Professional polish; ATS parsing requirement | Low | ISO 8601 support; flexible (2024-06 or "June 2024") |
| **Overwrite on regeneration** | Expected workflow - regenerate, don't accumulate | Low | Match PROJECT.md requirement |
| **Error handling for malformed input** | Tool must not silently fail | Low | Clear error messages pointing to line/section |

### Complexity Notes
- Multi-format output is medium complexity because PDF/DOCX generation requires external tools (wkhtmltopdf, Pandoc, or Puppeteer)
- ATS compatibility is high complexity because it requires research and testing against actual ATS systems

---

## Differentiators

Features that set this tool apart from alternatives. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **iCIMS expert-grade optimization** | Most tools claim "ATS-friendly" but don't test against specific systems | High | Requires research on iCIMS-specific parsing rules |
| **IT-professional data schema** | Generic tools don't understand tech stacks, projects, certifications | Medium | Custom schema fields for tech context |
| **Single-file HTML with embedded CSS** | Portable, can be embedded in portfolios via `<object>` tag | Low | CSS inlined, no external dependencies |
| **Git-friendly markdown workflow** | Track CV versions, diff changes, branch for different positions | Low | Already inherent in markdown approach |
| **Per-person directory structure** | Supports teams/agencies managing multiple CVs | Low | `/people/[name]/` organization |
| **Template name in output filename** | Clear identification of source template | Low | `[name]-[template].pdf` pattern |
| **Word frequency analysis (stats)** | Help users optimize keyword usage | Low | Count skills mentions, flag underrepresentation |
| **Multiple language support** | Same CV data, different language templates | Medium | Useful for EU/international job seekers |
| **Quantified achievements highlighting** | Help users identify weak bullet points | Medium | Parse for numbers/metrics, flag generic statements |
| **Project section with tech context** | IT professionals often have side projects, open source | Low | GitHub links, tech stack, outcome |
| **Certifications section** | Critical for IT (AWS, GCP, Cisco, etc.) | Low | Vendor, cert name, date, expiry |
| **Print-optimized CSS** | HTML prints beautifully via browser | Low | `@media print` rules, proper page breaks |
| **Reference DOCX template customization** | Users can brand the Word output | Medium | Pandoc `--reference-doc` workflow |

### Differentiator Priority (Recommended)

**High priority (build first):**
1. iCIMS optimization - core value proposition per PROJECT.md
2. IT-professional data schema - target audience need
3. Single-file HTML - explicit requirement

**Medium priority (build second):**
4. Project section with tech context
5. Certifications section
6. Print-optimized CSS

**Lower priority (consider for v2):**
7. Word frequency analysis
8. Multiple language support
9. Quantified achievements highlighting

---

## Anti-Features

Things to deliberately NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **AI/LLM content generation** | Out of scope per PROJECT.md; commoditized feature; adds complexity | User provides content - tool focuses on formatting/output |
| **Multi-column layouts** | Confuse ATS parsers; look good but reduce job matches | Single-column designs with visual hierarchy via typography |
| **Graphics, icons, skill bars** | ATS cannot parse images; skill bars are meaningless (what's 4/5 JavaScript?) | Text-based skill lists; let achievements speak |
| **Fancy fonts or custom typography** | ATS may not render; reduces cross-platform consistency | Standard fonts: Arial, Calibri, Georgia, Garamond |
| **Headers/footers with content** | Many ATS systems ignore header/footer content entirely | All content in main body; page numbers only if needed |
| **Tables for layout** | ATS reads left-to-right, may scramble table content | CSS/HTML structure for visual layout, linear markdown source |
| **Text boxes** | Similar to tables - ATS parsing issues | Standard paragraph/list structure |
| **Color-dependent information** | Prints to B&W; accessibility concerns | Color as enhancement only, content readable without |
| **Photographs** | US hiring - potential discrimination concerns; ATS ignores | Omit or make optional (some EU countries expect photos) |
| **Web application UI** | Explicitly out of scope; adds massive complexity | CLI is sufficient - clean separation of concerns |
| **Cloud storage/accounts** | Out of scope; privacy concerns; unnecessary complexity | Local filesystem only |
| **Job board integration** | Out of scope; constantly changing APIs; maintenance burden | Generate files user uploads manually |
| **Keyword stuffing support** | Modern ATS detects this; hurts human readability | Natural keyword usage; quality over quantity |
| **Creative job titles** | "Marketing Ninja" confuses ATS looking for "Marketing Manager" | Standard, searchable job titles |
| **Infographics/charts** | Cannot be parsed; space-inefficient | Quantified achievements in text: "increased sales 40%" |
| **Real-time collaboration** | Explicitly out of scope; markdown + git handles this fine | Single-user workflow; use git for collaboration |

### Anti-Feature Rationale

The core insight: **ATS optimization and visual design are often at odds**. This tool prioritizes ATS scoring over visual creativity. A beautiful resume that gets filtered out is worthless.

From research: "While you might think creative visuals can make your resume stand out, these elements can harm your chances of getting past AI scanners." ([Enhancv](https://enhancv.com/blog/optimize-resume-for-ai/))

---

## IT Professional Specific Features

Features specifically valuable for IT/developer CVs.

| Feature | Why Valuable for IT | Complexity | Implementation Notes |
|---------|---------------------|------------|---------------------|
| **Technical skills taxonomy** | IT skills have categories (languages, frameworks, databases, cloud, tools) | Low | Structured schema with skill categories |
| **Project section** | Developers have side projects, open source contributions | Low | Repo link, tech stack, outcome, role |
| **GitHub/GitLab profile link** | 71% of hiring managers check GitHub before interviews | Low | Contact section field |
| **Tech stack per job** | IT roles involve specific technologies; recruiters search for these | Low | Per-position technology list |
| **Certifications with expiry** | IT certs expire (AWS, GCP, etc.); currency matters | Low | Date achieved + expiration date |
| **Contributions section** | Open source contributions demonstrate skills | Low | Project name, contribution type, link |
| **Portfolio/personal site link** | Expected for developers | Low | URL in contact section |
| **Keywords both forms** | "Enterprise Resource Planning (ERP)" - include both for ATS | Low | Schema guidance/documentation |
| **Version control metadata** | Track which version sent to which company | Low | Git tags + output filenames |

### IT Skills Categories (Schema Design)

Recommended taxonomy for IT professional skills section:

```
skills:
  languages:
    - Python
    - TypeScript
    - Go
  frameworks:
    - React
    - FastAPI
    - Django
  databases:
    - PostgreSQL
    - MongoDB
    - Redis
  cloud:
    - AWS (EC2, Lambda, S3)
    - GCP
  tools:
    - Docker
    - Kubernetes
    - Terraform
  practices:
    - CI/CD
    - TDD
    - Agile/Scrum
```

---

## ATS Optimization Features

Features related to iCIMS and ATS scoring. This is a core differentiator per PROJECT.md.

| Feature | ATS Impact | Complexity | Implementation Notes |
|---------|------------|------------|---------------------|
| **Standard section headings** | ATS looks for "Work Experience", "Education", "Skills" | Low | Enforce/suggest standard headings in schema |
| **Single-column layout** | Multi-column confuses parsers reading left-to-right | Low | Template design constraint |
| **Parseable text (no images)** | ATS extracts text; images are invisible | Low | All content as actual text |
| **Chronological/hybrid format** | Easiest for ATS to parse | Low | Schema encourages reverse-chrono order |
| **Standard fonts** | Arial, Calibri, Times New Roman parse reliably | Low | Template CSS constraint |
| **Clean hierarchy** | H1 for name, H2 for sections, proper nesting | Low | Markdown structure maps to HTML hierarchy |
| **Consistent date format** | Mixed formats confuse parsers | Low | Enforce format in schema |
| **Both acronym and full form** | "Search Engine Optimization (SEO)" catches both searches | Low | Documentation guidance |
| **DOCX output option** | Some ATS parse DOCX better than PDF | Medium | Pandoc conversion |
| **PDF from text (not scanned)** | Scanned PDFs are images, not text | Low | Generate PDF from HTML/CSS, not images |
| **No password protection** | Blocks ATS text extraction | Low | Never add PDF security |
| **Contact info in main body** | Headers/footers often ignored | Low | Template design constraint |
| **Quantified achievements** | ATS and humans both value metrics | Low | Schema examples; documentation guidance |
| **Standard job titles** | "Software Engineer" not "Code Wizard" | Low | Documentation guidance |

### ATS Scoring Targets

Research indicates:
- **80+**: Well-optimized, likely to pass screening
- **70-79**: May pass but room for improvement
- **Below 60**: Significant optimization needed

From [Resume Adapter](https://www.resumeadapter.com/blog/ats-optimization-hub): "A score of 70 is borderline - it can pass basic filters, but aim for 85+ to consistently reach recruiters."

### iCIMS-Specific Considerations

iCIMS is described as "notoriously rigid" ([Joveo](https://www.joveo.com/pillar_page/icims-recruitment-ultimate-guide/)). Key requirements:
- Match keywords exactly as listed in job posting
- No formatting errors (they are not forgiven)
- Test across multiple ATS platforms (iCIMS, Greenhouse, Taleo, Lever)

### File Format Recommendations

From testing reported by [Enhancv](https://enhancv.com/blog/busting-ats-myths/):
- Google Docs -> PDF: 96% parsing accuracy
- Google Docs -> DOC: 95% parsing accuracy
- MS Office -> DOC: 88% parsing accuracy
- MS Office -> PDF: 85% parsing accuracy

**Recommendation:** Support all three formats (PDF, HTML, DOCX); document when to use each:
- **PDF**: Default for most applications; preserves formatting
- **DOCX**: When portal explicitly requests Word; some ATS parse better
- **HTML**: For portfolio embedding; not for ATS submission

---

## Feature Dependencies

Which features depend on others.

```
Core Pipeline (must build in order):
  Markdown Parser
      |
      v
  Data Schema Validation
      |
      v
  Template Engine
      |
      +---> HTML Output
      |         |
      |         +---> PDF Output (from HTML via Puppeteer/wkhtmltopdf)
      |         |
      |         +---> Print CSS (@media print)
      |
      +---> DOCX Output (via Pandoc, parallel path)

Template System:
  Template Files
      |
      v
  Style Variables (colors, fonts, margins)
      |
      v
  ATS Constraints (single-column, standard fonts)

IT-Specific Features:
  Basic Schema
      |
      +---> Skills Taxonomy
      |
      +---> Projects Section
      |
      +---> Certifications Section
      |
      +---> Tech Stack per Job

No dependencies (can build anytime):
  - Word frequency analysis (reads markdown directly)
  - Git-friendly workflow (inherent in markdown)
  - Per-person directory structure (filesystem convention)
```

### Build Order Recommendation

**Phase 1: Core Pipeline**
1. Markdown parser + basic schema
2. HTML output with embedded CSS
3. Single template (ATS-optimized)

**Phase 2: Multi-Format**
4. PDF generation from HTML
5. DOCX generation via Pandoc
6. Reference DOCX customization

**Phase 3: IT Professional Features**
7. Extended schema (projects, certs, tech stacks)
8. Skills taxonomy
9. Additional templates

**Phase 4: Polish**
10. Word frequency analysis
11. Print CSS optimization
12. Documentation/examples

---

## MVP Feature Recommendation

For MVP, prioritize these features:

### Must Have (MVP)
1. Markdown parsing with basic schema (work, education, skills, contact)
2. Single ATS-optimized template
3. HTML output with embedded CSS
4. PDF output
5. DOCX output
6. Per-person directory structure
7. Error handling for malformed input

### Should Have (Fast Follow)
8. IT-specific schema extensions (projects, certs, tech stack per job)
9. Skills taxonomy/categorization
10. Second template option
11. Style variables (colors, fonts)

### Defer to Post-MVP
- Word frequency analysis
- Multiple language support
- Quantified achievements analysis
- Additional templates beyond 2-3

---

## Sources

### ATS and Resume Best Practices
- [Scale.jobs - ATS Resume Format 2026](https://scale.jobs/blog/ats-resume-format-2026-design-guide)
- [Smallpdf - ATS PDF Reading](https://smallpdf.com/blog/do-applicant-tracking-systems-prefer-resumes-in-pdf-format)
- [Jobscan - ATS Formatting Mistakes](https://www.jobscan.co/blog/ats-formatting-mistakes/)
- [Enhancv - Busting ATS Myths](https://enhancv.com/blog/busting-ats-myths/)
- [Careerflow - ATS Mistakes to Avoid](https://www.careerflow.ai/blog/ats-resume-mistakes-to-avoid)
- [Resume Adapter - ATS Optimization Hub](https://www.resumeadapter.com/blog/ats-optimization-hub)
- [Joveo - iCIMS Ultimate Guide](https://www.joveo.com/pillar_page/icims-recruitment-ultimate-guide/)

### Markdown Resume Tools
- [there4/markdown-resume (GitHub)](https://github.com/there4/markdown-resume)
- [mikepqr/resume.md (GitHub)](https://github.com/mikepqr/resume.md)
- [mszep/pandoc_resume](https://mszep.github.io/pandoc_resume/)
- [roguh/pandoc-resume (GitHub)](https://github.com/roguh/pandoc-resume)

### Developer Resume Best Practices
- [Tech Interview Handbook - Resume Guide](https://www.techinterviewhandbook.org/resume/)
- [Enhancv - GitHub on Resume](https://enhancv.com/blog/github-on-resume/)
- [BeamJobs - Software Engineer Resume Examples](https://www.beamjobs.com/resumes/software-engineer-resume-examples)

### JSON Resume Standard
- [JSON Resume Schema](https://jsonresume.org/schema)
- [JSON Resume Documentation](https://docs.jsonresume.org/schema)

### HTML Resume Approaches
- [Dev.to - Interactive Resume with HTML/CSS](https://dev.to/alvaromontoro/developing-an-interactive-resume-with-html-and-css-5007)
- [Mark Vincze - CV with Modern HTML/CSS](https://blog.markvincze.com/how-i-created-my-cv-with-modern-html-and-css/)

### Pandoc Workflows
- [Creating a Maintainable Resume with Markdown and Pandoc](https://blog.genezini.com/p/creating-a-maintainable-resume-with-markdown-and-pandoc/)
- [Simple Markdown Resume Workflow](https://sdsawtelle.github.io/blog/output/simple-markdown-resume-with-pandoc-and-wkhtmltopdf.html)
