# Phase 13 Context: Full Test Suite

**Created:** 2026-01-25
**Phase:** 13 - Full Test Suite
**Status:** Decisions captured

---

## Scope Boundary

This phase implements automated test coverage for PDF quality:
- TEST-01: Visual regression tests detect layout changes
- TEST-02: Text extraction tests verify ATS-readable content
- TEST-03: Structural tests verify page count expectations
- TEST-04: Structural tests verify PDF metadata presence
- TEST-05: Structural tests verify file size sanity
- TEST-08: Tests catch Puppeteer dependency update regressions

---

## Decisions

### Test Output Artifacts

**What to save on failure:**
- Everything + HTML: Save the actual PDF file, all comparison images (diff, actual, expected), plus the intermediate HTML for inspection
- Rationale: Maximum debuggability when something breaks

**Storage location:**
- `tests/output/` directory (gitignored)
- Local only, not committed to repository
- Matches existing pattern from Phase 12 parity tests

**Cleanup behavior:**
- Always clean `tests/output/` contents before each test run
- Prevents confusion from stale artifacts
- Fresh state for each run

**When to save:**
- Failures only
- Passing tests leave no artifacts
- Makes it easy to spot problems - non-empty output directory means something failed

---

## Deferred Ideas

None captured during discussion.

---

## Implementation Guidance

For researchers/planners:
1. Artifact saving logic should be centralized (test utility function)
2. HTML intermediate output requires capturing it during PDF generation
3. Diff images require visual comparison tooling (Playwright screenshots)
4. Cleanup should happen in test setup/beforeAll, not afterAll

---

*Context captured: 2026-01-25*
