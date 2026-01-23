# Requirements: CV Generator

**Defined:** 2026-01-22
**Core Value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Output Formats

- [x] **OUT-01**: CLI generates PDF output via Puppeteer with ATS-optimized text layers
- [x] **OUT-02**: CLI generates HTML output with fully embedded CSS (self-contained single file)
- [ ] **OUT-03**: CLI generates DOCX output with proper Word styles (Heading 1/2, Normal)
- [x] **OUT-04**: Output files named `{name}_{template}.{format}` (e.g., `johndoe_modern.pdf`)
- [x] **OUT-05**: Regeneration overwrites existing output files
- [x] **OUT-06**: Output written to `/people/[name]/output/` directory
- [x] **OUT-07**: PDF and DOCX include configurable header/footer for page identification (e.g., "Name - Page X of Y")
- [x] **OUT-08**: HTML output base64 encodes images for self-contained file
- [x] **OUT-09**: PDF output embeds images properly
- [ ] **OUT-10**: DOCX output embeds images properly

### Template System

- [x] **TMPL-01**: Templates use single-column ATS-compliant layout
- [x] **TMPL-02**: Templates use standard section headers (Work Experience, Education, Skills, etc.)
- [x] **TMPL-03**: Templates use standard fonts only (Arial, Calibri, Times New Roman)
- [ ] **TMPL-04**: Three template themes available: Modern, Minimal, Classic
- [ ] **TMPL-05**: Templates support style variations (colors, fonts, margins) via configuration
- [x] **TMPL-06**: Templates stored in `/templates/` directory with config.json per template

### CV Data Schema

- [x] **DATA-01**: Schema supports contact information (name, email, phone, location, links)
- [x] **DATA-02**: Schema supports professional summary section
- [x] **DATA-03**: Schema supports work experience (company, role, dates, location, bullets)
- [x] **DATA-04**: Schema supports education (institution, degree, field, dates, honors)
- [x] **DATA-05**: Schema supports skills list with categories (languages, frameworks, databases, cloud, tools)
- [ ] **DATA-06**: Schema supports projects section (name, description, tech stack, GitHub link, outcome)
- [ ] **DATA-07**: Schema supports certifications (name, issuer, date, expiry date)
- [ ] **DATA-08**: Schema supports tech stack per job position
- [x] **DATA-09**: Missing sections are skipped silently (no empty sections, no errors)
- [x] **DATA-10**: Unknown sections trigger warning but generation continues without them
- [x] **DATA-11**: Images stored in `/people/[name]/images/` directory
- [x] **DATA-12**: Standard markdown image syntax supported (`![alt](./images/file.png)`)

### CLI Interface

- [x] **CLI-01**: `build` command generates all formats for specified person and template
- [x] **CLI-02**: `init` command scaffolds new CV directory with example markdown
- [x] **CLI-03**: `validate` command checks markdown against schema without generating
- [x] **CLI-04**: `list-templates` command shows available templates
- [x] **CLI-05**: Clear error messages for malformed markdown input
- [x] **CLI-06**: Helpful validation errors with fix suggestions

### ATS Optimization

- [x] **ATS-01**: PDF text layers are copy-paste verifiable (no garbled characters)
- [x] **ATS-02**: All contact info in main body (not headers/footers)
- [x] **ATS-03**: No tables used for layout (CSS/flexbox only)
- [ ] **ATS-04**: Skills include both acronym and full form where applicable (e.g., "Kubernetes (K8s)")
- [x] **ATS-05**: Semantic HTML structure (h1 for name, h2 for sections)
- [x] **ATS-06**: Warning printed when images are included (ATS cannot parse image content)

### Repository

- [ ] **REPO-01**: README.md with installation and getting started guide
- [x] **REPO-02**: MIT LICENSE (2026 Jan-Stefan Janetzky (GottZ) https://contact.GottZ.de)
- [x] **REPO-03**: .gitignore protects `/people/` directory from commits

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
| OUT-01 | Phase 4 | Pending |
| OUT-02 | Phase 3 | Complete |
| OUT-03 | Phase 5 | Pending |
| OUT-04 | Phase 3 | Complete |
| OUT-05 | Phase 3 | Complete |
| OUT-06 | Phase 3 | Complete |
| OUT-07 | Phase 4 | Pending |
| OUT-08 | Phase 3 | Complete |
| OUT-09 | Phase 4 | Pending |
| OUT-10 | Phase 5 | Pending |
| TMPL-01 | Phase 2 | Complete |
| TMPL-02 | Phase 2 | Complete |
| TMPL-03 | Phase 2 | Complete |
| TMPL-04 | Phase 8 | Pending |
| TMPL-05 | Phase 8 | Pending |
| TMPL-06 | Phase 2 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| DATA-06 | Phase 7 | Pending |
| DATA-07 | Phase 7 | Pending |
| DATA-08 | Phase 7 | Pending |
| DATA-09 | Phase 1 | Complete |
| DATA-10 | Phase 1 | Complete |
| DATA-11 | Phase 3 | Complete |
| DATA-12 | Phase 3 | Complete |
| CLI-01 | Phase 6 | Complete |
| CLI-02 | Phase 6 | Complete |
| CLI-03 | Phase 6 | Complete |
| CLI-04 | Phase 6 | Complete |
| CLI-05 | Phase 6 | Complete |
| CLI-06 | Phase 6 | Complete |
| ATS-01 | Phase 4 | Pending |
| ATS-02 | Phase 2 | Complete |
| ATS-03 | Phase 2 | Complete |
| ATS-04 | Phase 4 | Pending |
| ATS-05 | Phase 2 | Complete |
| ATS-06 | Phase 3 | Complete |
| REPO-01 | Phase 8 | Pending |
| REPO-02 | Phase 1 | Complete |
| REPO-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

**Requirements per Phase:**
| Phase | Count | Requirements |
|-------|-------|--------------|
| Phase 1 | 9 | DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-09, DATA-10, REPO-02, REPO-03 |
| Phase 2 | 7 | TMPL-01, TMPL-02, TMPL-03, TMPL-06, ATS-02, ATS-03, ATS-05 |
| Phase 3 | 8 | OUT-02, OUT-04, OUT-05, OUT-06, OUT-08, DATA-11, DATA-12, ATS-06 |
| Phase 4 | 5 | OUT-01, OUT-07, OUT-09, ATS-01, ATS-04 |
| Phase 5 | 2 | OUT-03, OUT-10 |
| Phase 6 | 6 | CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06 |
| Phase 7 | 3 | DATA-06, DATA-07, DATA-08 |
| Phase 8 | 3 | TMPL-04, TMPL-05, REPO-01 |

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-23 (Phase 6 complete: 36 requirements delivered)*
