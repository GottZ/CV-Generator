# Requirements: CV Generator

**Defined:** 2026-01-22
**Core Value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Output Formats

- [ ] **OUT-01**: CLI generates PDF output via Puppeteer with ATS-optimized text layers
- [ ] **OUT-02**: CLI generates HTML output with fully embedded CSS (self-contained single file)
- [ ] **OUT-03**: CLI generates DOCX output with proper Word styles (Heading 1/2, Normal)
- [ ] **OUT-04**: Output files named `{name}_{template}.{format}` (e.g., `johndoe_modern.pdf`)
- [ ] **OUT-05**: Regeneration overwrites existing output files
- [ ] **OUT-06**: Output written to `/people/[name]/output/` directory
- [ ] **OUT-07**: PDF and DOCX include configurable header/footer for page identification (e.g., "Name - Page X of Y")
- [ ] **OUT-08**: HTML output base64 encodes images for self-contained file
- [ ] **OUT-09**: PDF output embeds images properly
- [ ] **OUT-10**: DOCX output embeds images properly

### Template System

- [ ] **TMPL-01**: Templates use single-column ATS-compliant layout
- [ ] **TMPL-02**: Templates use standard section headers (Work Experience, Education, Skills, etc.)
- [ ] **TMPL-03**: Templates use standard fonts only (Arial, Calibri, Times New Roman)
- [ ] **TMPL-04**: Three template themes available: Modern, Minimal, Classic
- [ ] **TMPL-05**: Templates support style variations (colors, fonts, margins) via configuration
- [ ] **TMPL-06**: Templates stored in `/templates/` directory with config.json per template

### CV Data Schema

- [ ] **DATA-01**: Schema supports contact information (name, email, phone, location, links)
- [ ] **DATA-02**: Schema supports professional summary section
- [ ] **DATA-03**: Schema supports work experience (company, role, dates, location, bullets)
- [ ] **DATA-04**: Schema supports education (institution, degree, field, dates, honors)
- [ ] **DATA-05**: Schema supports skills list with categories (languages, frameworks, databases, cloud, tools)
- [ ] **DATA-06**: Schema supports projects section (name, description, tech stack, GitHub link, outcome)
- [ ] **DATA-07**: Schema supports certifications (name, issuer, date, expiry date)
- [ ] **DATA-08**: Schema supports tech stack per job position
- [ ] **DATA-09**: Missing sections are skipped silently (no empty sections, no errors)
- [ ] **DATA-10**: Unknown sections trigger warning but generation continues without them
- [ ] **DATA-11**: Images stored in `/people/[name]/images/` directory
- [ ] **DATA-12**: Standard markdown image syntax supported (`![alt](./images/file.png)`)

### CLI Interface

- [ ] **CLI-01**: `build` command generates all formats for specified person and template
- [ ] **CLI-02**: `init` command scaffolds new CV directory with example markdown
- [ ] **CLI-03**: `validate` command checks markdown against schema without generating
- [ ] **CLI-04**: `list-templates` command shows available templates
- [ ] **CLI-05**: Clear error messages for malformed markdown input
- [ ] **CLI-06**: Helpful validation errors with fix suggestions

### ATS Optimization

- [ ] **ATS-01**: PDF text layers are copy-paste verifiable (no garbled characters)
- [ ] **ATS-02**: All contact info in main body (not headers/footers)
- [ ] **ATS-03**: No tables used for layout (CSS/flexbox only)
- [ ] **ATS-04**: Skills include both acronym and full form where applicable (e.g., "Kubernetes (K8s)")
- [ ] **ATS-05**: Semantic HTML structure (h1 for name, h2 for sections)
- [ ] **ATS-06**: Warning printed when images are included (ATS cannot parse image content)

### Repository

- [ ] **REPO-01**: README.md with installation and getting started guide
- [ ] **REPO-02**: MIT LICENSE (2026 Jan-Stefan Janetzky (GottZ) https://contact.GottZ.de)
- [ ] **REPO-03**: .gitignore protects `/people/` directory from commits

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Word frequency analysis (identify weak bullet points)
- **ADV-02**: Print-optimized CSS (@media print rules)
- **ADV-03**: Multi-language support (i18n for section headers)
- **ADV-04**: Custom section support (user-defined sections)

### CLI Enhancements

- **CLI-07**: `watch` command for live preview during editing
- **CLI-08**: Batch generation for all people in `/people/`
- **CLI-09**: Template scaffolding command for custom templates

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Web application UI | CLI is sufficient for v1, KISS principle |
| User authentication | Local tool, no accounts needed |
| Cloud storage/hosting | Local file system only |
| Real-time collaboration | Single-user workflow |
| AI/LLM content generation | User provides content, tool formats it |
| Multi-column layouts | Break ATS parsing, deliberately avoided |
| Skill bars/progress indicators | ATS cannot parse visual skill representations |
| Headers/footers for contact info | 25% of ATS ignore these (page ID headers allowed) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OUT-01 | TBD | Pending |
| OUT-02 | TBD | Pending |
| OUT-03 | TBD | Pending |
| OUT-04 | TBD | Pending |
| OUT-05 | TBD | Pending |
| OUT-06 | TBD | Pending |
| OUT-07 | TBD | Pending |
| OUT-08 | TBD | Pending |
| OUT-09 | TBD | Pending |
| OUT-10 | TBD | Pending |
| TMPL-01 | TBD | Pending |
| TMPL-02 | TBD | Pending |
| TMPL-03 | TBD | Pending |
| TMPL-04 | TBD | Pending |
| TMPL-05 | TBD | Pending |
| TMPL-06 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| DATA-04 | TBD | Pending |
| DATA-05 | TBD | Pending |
| DATA-06 | TBD | Pending |
| DATA-07 | TBD | Pending |
| DATA-08 | TBD | Pending |
| DATA-09 | TBD | Pending |
| DATA-10 | TBD | Pending |
| DATA-11 | TBD | Pending |
| DATA-12 | TBD | Pending |
| CLI-01 | TBD | Pending |
| CLI-02 | TBD | Pending |
| CLI-03 | TBD | Pending |
| CLI-04 | TBD | Pending |
| CLI-05 | TBD | Pending |
| CLI-06 | TBD | Pending |
| ATS-01 | TBD | Pending |
| ATS-02 | TBD | Pending |
| ATS-03 | TBD | Pending |
| ATS-04 | TBD | Pending |
| ATS-05 | TBD | Pending |
| ATS-06 | TBD | Pending |
| REPO-01 | TBD | Pending |
| REPO-02 | TBD | Pending |
| REPO-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 0
- Unmapped: 41 (pending roadmap creation)

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after initial definition*
