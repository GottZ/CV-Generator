# Phase 7: IT Professional Features - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend CV schema and rendering to support IT-specific content: projects section, certifications section, and tech stacks per job position. Also add acronym support for skills. All new sections are optional — existing CVs without them continue to work.

</domain>

<decisions>
## Implementation Decisions

### Projects Section

**Structure:**
- Name only required; all other fields optional (description, tech stack, links, dates, outcome, role, type)
- Optional `highlight` flag promotes projects to top of list
- Default ordering: highlighted first, then chronological (newest first)
- Optional `role` field: "Lead Developer", "Contributor", etc.
- Optional `type` field: personal, professional, open-source, freelance

**Display:**
- Outcomes displayed as highlighted callout (visually distinct from description)
- Tech stack: theme-controlled display, default is small tags/badges after description
- Dates: theme-controlled format, default matches work experience format
- Section position: controlled by theme's section order

**Links:**
- Array of links supported (multiple per project)
- Each link: URL + optional type + optional display name
- Display: icon (if theme provides) + cleaned URL (no `https://`, no trailing slash)
- User-specified display name renders exactly as written, overriding auto-formatting
- Link type detection: theme provides auto-detect list for common domains (github.com, etc.)
- User can specify explicit link type to override auto-detection

**Minimal valid project:** Name + tech stack only (no description allowed)

### Certifications Section

**Structure:**
- Required: name (includes level/tier naturally, e.g., "AWS SAA - Associate"), issuer, date earned
- Optional: expiry date, verification URL, credential ID, logo image

**Display:**
- Expiry: theme controls display — can show date, status badge (Active/Expired), both, or omit
- Ordering: markdown order (user controls)
- Grouping by issuer: theme option (not automatic)
- Date format: CV provides ISO dates, theme controls display format via dayjs
- Logo: displayed if user provides image

**Validation:**
- Parser warns on expired certifications but includes them in output

### Tech Stack per Job

**Markdown format:**
- Dedicated `#### Technologies` or `#### Tech Stack` subsection under job entry
- Parser normalizes both headings to same type
- Same format works in Projects section (unified approach)

**Content:**
- Optional proficiency/role levels: "React (lead)", "PostgreSQL (supporting)"
- Optional categories: user can group by Languages, Frameworks, etc.
- Flat list also valid (no categories required)

**Display:**
- Theme decides: tags/badges or comma-separated or other
- Theme decides: placement before or after bullets

**Validation:**
- Warning if job tech not found in Skills section (allows mismatch but surfaces it)

### Skills Acronyms

**Format:**
- Parenthetical preferred: "Kubernetes (K8s)"
- Theme decides exact display format

**Expansion:**
- Theme provides known acronym mapping list
- Per-skill override: individual skills can opt out of expansion
- Scope: Skills section only (not tech stacks in jobs/projects)

**Validation:**
- Warning for unknown acronyms (no expansion found in theme's list)

### Claude's Discretion
- Exact schema field names and types
- Parser implementation details
- Template example code structure
- Error message wording

</decisions>

<specifics>
## Specific Ideas

- Link display: "github.com/user/repo" not "https://github.com/user/repo/"
- Cert levels in name naturally: "AWS Solutions Architect - Associate" not separate field
- Tech subsection headings: both "Technologies" and "Tech Stack" normalized
- Highlight flag for tailoring CVs to specific job applications

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-it-professional-features*
*Context gathered: 2026-01-23*
