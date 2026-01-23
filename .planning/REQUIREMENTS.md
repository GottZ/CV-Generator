# Requirements: CV Generator v1.1

**Defined:** 2026-01-23
**Core Value:** Generate recruiter-ready, ATS-parseable CVs from markdown that score well on iCIMS and similar applicant tracking systems while maintaining visual professionalism.

## v1.1 Requirements

Requirements for improved PDF pagination, HTML print parity, and automated testing.

### PDF Pagination

- [ ] **PAG-01**: Job entries do not split across page breaks (break-inside: avoid)
- [ ] **PAG-02**: Education blocks do not split across page breaks
- [ ] **PAG-03**: Skills sections do not split across page breaks
- [ ] **PAG-04**: Section headers are not orphaned at page bottom (stay with content)
- [ ] **PAG-05**: Minimum 2 lines before/after page breaks (orphans/widows control)
- [ ] **PAG-06**: Consistent page margins via @page CSS rules
- [ ] **PAG-07**: No near-empty last pages (content fits on previous page when possible)

### Print CSS Parity

- [ ] **PRINT-01**: HTML prints with same pagination as PDF output
- [ ] **PRINT-02**: Unified @media print stylesheet (single source of truth)
- [ ] **PRINT-03**: @page rules match Puppeteer PDF settings
- [ ] **PRINT-04**: Print-specific layout adjustments do not affect screen display
- [ ] **PRINT-05**: All 3 templates (Modern, Minimal, Classic) have print parity

### Automated Testing

- [ ] **TEST-01**: Visual regression tests detect layout changes in PDF output
- [ ] **TEST-02**: Text extraction tests verify ATS-readable content in PDFs
- [ ] **TEST-03**: Structural tests verify page count expectations
- [ ] **TEST-04**: Structural tests verify PDF metadata presence
- [ ] **TEST-05**: Structural tests verify file size sanity (not empty, not bloated)
- [ ] **TEST-06**: Tests run in CI with consistent environment (Docker)
- [ ] **TEST-07**: Baseline snapshots exist for all 3 templates
- [ ] **TEST-08**: Tests catch Puppeteer dependency update regressions

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Advanced Pagination

- **PAG-ADV-01**: Smart content fitting algorithm to minimize whitespace
- **PAG-ADV-02**: Automatic section reordering to optimize page usage

### CLI Enhancements

- **CLI-07**: Watch mode for live preview during editing
- **CLI-08**: Batch generation for all people in `/people/`
- **CLI-09**: Template scaffolding command for custom templates

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Pixel-identical print output | Browser differences make this impossible; targeting "visually equivalent" |
| Smart content fitting algorithm | HIGH complexity, diminishing returns for CV use case |
| Multi-column print layouts | Breaks ATS parsing, conflicts with core value |
| Custom page sizes | Standard Letter/A4 sufficient for CVs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAG-01 | TBD | Pending |
| PAG-02 | TBD | Pending |
| PAG-03 | TBD | Pending |
| PAG-04 | TBD | Pending |
| PAG-05 | TBD | Pending |
| PAG-06 | TBD | Pending |
| PAG-07 | TBD | Pending |
| PRINT-01 | TBD | Pending |
| PRINT-02 | TBD | Pending |
| PRINT-03 | TBD | Pending |
| PRINT-04 | TBD | Pending |
| PRINT-05 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |
| TEST-03 | TBD | Pending |
| TEST-04 | TBD | Pending |
| TEST-05 | TBD | Pending |
| TEST-06 | TBD | Pending |
| TEST-07 | TBD | Pending |
| TEST-08 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 20 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 20

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after initial definition*
