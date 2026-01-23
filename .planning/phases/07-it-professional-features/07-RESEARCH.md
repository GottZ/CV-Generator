# Phase 7: IT Professional Features - Research

**Researched:** 2026-01-23
**Domain:** CV schema extension, markdown parsing, template rendering for IT-specific sections
**Confidence:** HIGH

## Summary

Phase 7 extends the existing CV schema and rendering pipeline to support IT-specific content: projects section, certifications section, tech stacks per job, and acronym support for skills. This is primarily a pattern replication phase - the codebase already has established patterns for schema types, section parsing, localization, template rendering (Nunjucks), and DOCX generation (section builders).

The implementation follows the existing architecture: TypeScript interfaces in `@gottz/cv-core`, parser extensions in `cv-parser.ts` and `sections.ts`, i18n additions in `@gottz/cv-templates`, Nunjucks template updates in `templates/base/`, and DOCX section builders in `docx-sections.ts`. No new external libraries are required - all work uses the existing stack (gray-matter, nunjucks, marked, docx, dayjs).

Key decisions from CONTEXT.md constrain the research: Projects require only name (all other fields optional), certifications require name/issuer/date, tech stacks use `#### Technologies` or `#### Tech Stack` subsections in markdown, and skills acronyms use parenthetical format "Kubernetes (K8s)". All new sections are optional to preserve backward compatibility with existing CVs.

**Primary recommendation:** Replicate existing patterns - add interfaces to schema/, extend parser functions, add i18n translations, update Nunjucks template, add DOCX section builders. Follow the WorkExperience and Education patterns exactly, as they demonstrate the established approach for complex sections with multiple fields.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (existing) gray-matter | ^4.0.3 | Frontmatter parsing | Already in project, handles YAML frontmatter |
| (existing) nunjucks | ^3.2.4 | Template rendering | Already in project, powers HTML generation |
| (existing) marked | ^17.0.1 | Markdown to HTML | Already in project, inline markdown support |
| (existing) docx | ^9.5.1 | DOCX generation | Already in project, programmatic Word docs |
| (existing) dayjs | ^1.11.x | Date formatting | Already in project, handles date display |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No new dependencies | - | - | All features implemented with existing stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual URL parsing | url-parse library | Adds dependency; simple regex sufficient for stripping https:// |
| Acronym dictionary | External data source | Per CONTEXT.md, theme provides mapping; simple Map in i18n |

**Installation:**
```bash
# No new dependencies required
bun install # Existing dependencies sufficient
```

## Architecture Patterns

### Recommended Project Structure
```
packages/core/
  src/
    schema/
      project.ts           # NEW: Project interface
      certification.ts     # NEW: Certification interface
      cv.ts                # MODIFY: Add projects, certifications fields
      experience.ts        # MODIFY: Add techStack field (already has placeholder)
      index.ts             # MODIFY: Export new types
    parser/
      sections.ts          # MODIFY: Add projects, certifications section mappings
      cv-parser.ts         # MODIFY: Add parseProjectEntries, parseCertificationEntries

packages/templates/
  src/
    i18n/
      en.ts                # Already has projects/certifications (Phase 1 prep)
      de.ts                # Already has projects/certifications (Phase 1 prep)
    render.ts              # MODIFY: Add projects, certifications to context

templates/base/
  template.njk             # MODIFY: Add projects, certifications sections

packages/cli/
  src/
    lib/
      docx-sections.ts     # MODIFY: Add buildProjectsSection, buildCertificationsSection
```

### Pattern 1: Schema Interface (Replicating Education/Experience Pattern)
**What:** TypeScript interfaces for new data types with required and optional fields
**When to use:** Defining Project and Certification types
**Example:**
```typescript
// Source: Existing patterns in education.ts, experience.ts

/**
 * Single project entry.
 * Per CONTEXT.md: Name only required; all other fields optional.
 */
export interface Project {
  /** Project name (required) */
  name: string;
  /** Project description */
  description?: string;
  /** Technologies used */
  techStack?: string[];
  /** Project links (GitHub, demo, etc.) */
  links?: ProjectLink[];
  /** Project outcome/result */
  outcome?: string;
  /** Role on project (e.g., "Lead Developer", "Contributor") */
  role?: string;
  /** Project type: personal, professional, open-source, freelance */
  type?: 'personal' | 'professional' | 'open-source' | 'freelance';
  /** Start date (ISO format) */
  startDate?: string;
  /** End date (ISO format, or "present") */
  endDate?: string;
  /** Highlight flag for promoting to top of list */
  highlight?: boolean;
}

/**
 * Project link with URL and optional type/label.
 */
export interface ProjectLink {
  /** Link URL (required) */
  url: string;
  /** Link type: github, demo, npm, docs, etc. */
  type?: string;
  /** Display name (overrides auto-formatting if provided) */
  label?: string;
}

/**
 * Single certification entry.
 * Per CONTEXT.md: name, issuer, date required; expiry/url/id optional.
 */
export interface Certification {
  /** Certification name including level (e.g., "AWS SAA - Associate") */
  name: string;
  /** Issuing organization */
  issuer: string;
  /** Date earned (ISO format) */
  date: string;
  /** Expiry date (ISO format, optional) */
  expiryDate?: string;
  /** Verification URL */
  verificationUrl?: string;
  /** Credential ID */
  credentialId?: string;
  /** Logo image path */
  logo?: string;
}
```

### Pattern 2: Parser Section Extraction (Replicating parseExperienceEntries)
**What:** Parse markdown content into typed arrays
**When to use:** Processing Projects and Certifications sections
**Example:**
```typescript
// Source: Existing cv-parser.ts parseExperienceEntries pattern

/**
 * Parse project entries separated by ---.
 * Format mirrors experience entries but with project-specific fields.
 *
 * Expected markdown:
 * ### Project Name
 * *dates | role | type*
 *
 * Description paragraph.
 *
 * #### Technologies
 * - React
 * - TypeScript
 *
 * #### Links
 * - github: https://github.com/user/repo
 * - demo: https://example.com
 *
 * **Outcome:** Result achieved
 */
function parseProjectEntries(content: string): Project[] {
  const entries = content.split(/^---$/m).filter((e) => e.trim());

  return entries.map((entry) => {
    const project: Project = { name: '' };
    // Parse similar to experience: header, meta line, content sections
    // ...
    return project;
  });
}

/**
 * Parse certification entries separated by ---.
 *
 * Expected markdown:
 * ### AWS Solutions Architect - Associate
 * *Amazon Web Services | 2023-05 | expires 2026-05*
 *
 * Credential ID: ABC123
 * https://verify.aws.com/ABC123
 */
function parseCertificationEntries(content: string): Certification[] {
  const entries = content.split(/^---$/m).filter((e) => e.trim());

  return entries.map((entry) => {
    const cert: Certification = { name: '', issuer: '', date: '' };
    // Parse header as name, meta line for issuer/dates
    // ...
    return cert;
  });
}
```

### Pattern 3: Tech Stack Subsection in Experience (Extending parseExperienceEntries)
**What:** Parse `#### Technologies` or `#### Tech Stack` subsections within job entries
**When to use:** Adding per-job tech stacks to WorkExperience
**Example:**
```typescript
// Source: Extending existing parseExperienceEntries in cv-parser.ts

// Within parseExperienceEntries, after bullets parsing:
for (const line of lines) {
  const trimmed = line.trim();

  // Check for Technologies/Tech Stack subsection
  if (trimmed.match(/^####\s+(Technologies|Tech Stack)\s*$/i)) {
    // Switch to tech stack parsing mode
    inTechStack = true;
    continue;
  }

  // Parse tech stack items (bullet list)
  if (inTechStack && trimmed.startsWith('- ')) {
    const tech = trimmed.slice(2).trim();
    // Handle optional role: "React (lead)" -> { name: "React", role: "lead" }
    experience.techStack = experience.techStack ?? [];
    experience.techStack.push(tech);
  }
}
```

### Pattern 4: Nunjucks Template Section (Replicating Skills Section)
**What:** Render new sections in HTML template
**When to use:** Adding Projects and Certifications to template.njk
**Example:**
```jinja2
{# Source: Existing patterns in templates/base/template.njk #}

{# Projects section #}
{% if projects and projects | length > 0 %}
<section class="section projects">
  <h2>{{ 'projects' | sectionHeader(locale) }}</h2>
  {% for project in projects %}
  <article class="entry project-entry">
    <div class="entry-header">
      <h3 class="entry-title">{{ project.name }}</h3>
      {% if project.startDate %}
      <span class="date-range">{{ project.startDate | formatDate(locale) }}{% if project.endDate %} - {{ project.endDate | formatDate(locale) }}{% endif %}</span>
      {% endif %}
    </div>
    {% if project.role %}<div class="entry-role">{{ project.role }}</div>{% endif %}
    {% if project.description %}<p class="project-description">{{ project.description | md | safe }}</p>{% endif %}
    {% if project.techStack and project.techStack | length > 0 %}
    <div class="tech-stack">
      {% for tech in project.techStack %}
      <span class="tech-tag">{{ tech }}</span>
      {% endfor %}
    </div>
    {% endif %}
    {% if project.outcome %}<div class="project-outcome">{{ project.outcome | md | safe }}</div>{% endif %}
    {% if project.links and project.links | length > 0 %}
    <div class="project-links">
      {% for link in project.links %}
      <a href="{{ link.url }}" class="project-link">{{ link.label or formatLinkUrl(link.url) }}</a>
      {% endfor %}
    </div>
    {% endif %}
  </article>
  {% endfor %}
</section>
{% endif %}

{# Certifications section #}
{% if certifications and certifications | length > 0 %}
<section class="section certifications">
  <h2>{{ 'certifications' | sectionHeader(locale) }}</h2>
  {% for cert in certifications %}
  <article class="entry certification-entry">
    <div class="entry-header">
      <h3 class="entry-title">{{ cert.name }}</h3>
      <span class="date-range">{{ cert.date | formatDate(locale) }}{% if cert.expiryDate %} - {{ cert.expiryDate | formatDate(locale) }}{% endif %}</span>
    </div>
    <div class="entry-issuer">{{ cert.issuer }}</div>
    {% if cert.credentialId %}<div class="credential-id">ID: {{ cert.credentialId }}</div>{% endif %}
    {% if cert.verificationUrl %}<a href="{{ cert.verificationUrl }}" class="verification-link">Verify</a>{% endif %}
  </article>
  {% endfor %}
</section>
{% endif %}
```

### Pattern 5: DOCX Section Builder (Replicating buildExperienceSection)
**What:** Generate Paragraph arrays for new sections
**When to use:** Adding Projects and Certifications to DOCX output
**Example:**
```typescript
// Source: Existing docx-sections.ts buildExperienceSection pattern

/**
 * Build projects section paragraphs.
 */
function buildProjectsSection(
  projects: Project[],
  locale: string,
  styles: DocxStyleConfig,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Section header (Heading 2)
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
      children: [
        new TextRun({
          text: getSectionHeader('projects', locale),
          size: styles.fontSizes.section,
          color: styles.colors.heading,
          font: styles.fonts.heading,
          bold: true,
        }),
      ],
    }),
  );

  for (const project of projects) {
    // Project name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: project.name,
            bold: true,
            size: styles.fontSizes.subsection,
            color: styles.colors.heading,
            font: styles.fonts.heading,
          }),
          ...(project.role ? [new TextRun({
            text: ` | ${project.role}`,
            size: styles.fontSizes.body,
            color: styles.colors.body,
            font: styles.fonts.body,
          })] : []),
        ],
        spacing: { before: SPACING.beforeEntry },
      }),
    );

    // Dates (if present)
    if (project.startDate) {
      const dateStr = project.endDate
        ? `${project.startDate} - ${project.endDate}`
        : project.startDate;
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: dateStr,
              italics: true,
              size: styles.fontSizes.small,
              color: styles.colors.muted,
              font: styles.fonts.body,
            }),
          ],
          spacing: { after: SPACING.afterDateLine },
        }),
      );
    }

    // Description
    if (project.description) {
      paragraphs.push(
        new Paragraph({
          children: textWithBreaks(project.description, {
            size: styles.fontSizes.body,
            color: styles.colors.body,
            font: styles.fonts.body,
          }),
          spacing: { after: SPACING.afterParagraph },
        }),
      );
    }

    // Tech stack (comma-separated for DOCX)
    if (project.techStack && project.techStack.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.techStack.join(', '),
              size: styles.fontSizes.small,
              color: styles.colors.muted,
              font: styles.fonts.body,
            }),
          ],
          spacing: { after: SPACING.afterBullet },
        }),
      );
    }

    // Outcome (highlighted callout)
    if (project.outcome) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Outcome: ${project.outcome}`,
              bold: true,
              size: styles.fontSizes.body,
              color: styles.colors.accent,
              font: styles.fonts.body,
            }),
          ],
          spacing: { after: SPACING.afterBullet },
        }),
      );
    }

    // Links
    if (project.links && project.links.length > 0) {
      const linkText = project.links
        .map(l => l.label || formatLinkUrl(l.url))
        .join(' | ');
      paragraphs.push(
        new Paragraph({
          children: project.links.map((link, i) => [
            ...(i > 0 ? [new TextRun({ text: ' | ', size: styles.fontSizes.small })] : []),
            new ExternalHyperlink({
              children: [new TextRun({
                text: link.label || formatLinkUrl(link.url),
                style: 'Hyperlink',
                size: styles.fontSizes.small,
                color: styles.colors.accent,
              })],
              link: link.url,
            }),
          ]).flat(),
          spacing: { after: SPACING.afterBullet },
        }),
      );
    }
  }

  return paragraphs;
}
```

### Pattern 6: URL Formatting for Links
**What:** Strip https://, trailing slashes from URLs for clean display
**When to use:** Displaying project links per CONTEXT.md requirement
**Example:**
```typescript
// Source: New utility function for link display

/**
 * Format URL for display: remove https://, trailing slash.
 * Per CONTEXT.md: "github.com/user/repo" not "https://github.com/user/repo/"
 */
function formatLinkUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')  // Remove protocol
    .replace(/\/$/, '');           // Remove trailing slash
}

// Usage in template filter:
env.addFilter('formatLinkUrl', formatLinkUrl);

// Usage in Nunjucks:
// {{ link.url | formatLinkUrl }}
```

### Pattern 7: Skills Acronym Handling
**What:** Parse and preserve "Name (Acronym)" format in skills
**When to use:** ATS-04 requirement for skills display
**Example:**
```typescript
// Source: The existing skills parser already handles this pattern!
// In cv-parser.ts parseSkillCategories():

// - Skill (optional level)
else if (trimmed.startsWith('- ') && currentCategory) {
  const skillText = trimmed.slice(2);
  // Check for level in parentheses at end
  const levelMatch = skillText.match(/^(.+?)\s*\(([^)]+)\)$/);
  // ...
}

// The pattern "Kubernetes (K8s)" would be parsed as:
// { name: "Kubernetes", level: "K8s" }
//
// But per CONTEXT.md, acronyms should stay in name field, not level.
// Need to distinguish: "TypeScript (expert)" vs "Kubernetes (K8s)"
//
// Solution: If parenthetical is a known acronym, keep full string as name.
// Theme provides acronym mapping list.

/**
 * Check if parenthetical content is an acronym (not a proficiency level).
 * Acronyms are typically 2-4 uppercase letters or contain numbers.
 */
function isAcronym(text: string): boolean {
  // Known proficiency levels to exclude
  const PROFICIENCY_LEVELS = new Set([
    'expert', 'proficient', 'familiar', 'advanced', 'beginner',
    'experte', 'fortgeschritten', 'grundkenntnisse', // German
  ]);

  const lower = text.toLowerCase();
  if (PROFICIENCY_LEVELS.has(lower)) {
    return false;
  }

  // Acronyms: short uppercase strings, or alphanumeric (K8s, S3, EC2)
  return /^[A-Z0-9]{2,5}$/.test(text) || /^[A-Za-z][0-9][a-z]?$/.test(text);
}
```

### Anti-Patterns to Avoid
- **Duplicating existing code:** The existing parseSkillCategories already handles parentheticals. Extend, don't duplicate.
- **Breaking backward compatibility:** All new sections MUST be optional. Existing CVs without projects/certifications must continue to work.
- **Hard-coding section order:** Templates control section ordering; schema just provides data.
- **Ignoring localization:** All section parsing must respect the `## Section `lang`` pattern.
- **New dependencies for simple tasks:** URL parsing and acronym detection don't need external libraries.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date formatter | dayjs via existing `formatDate` filter | Already handles locale, "present" keyword |
| Markdown in descriptions | HTML string building | marked via existing `md` filter | Already configured for ATS-safe output |
| Section i18n | Hardcoded strings | getSectionHeader() | Already supports en/de, extensible |
| DOCX text with newlines | Manual TextRun splitting | textWithBreaks() utility | Already handles \n, \r\n, empty lines |
| Entry delimiter parsing | Custom split logic | Existing `split(/^---$/m)` pattern | Already proven in experience/education |

**Key insight:** Phase 7 is almost entirely pattern replication. The codebase already solved these problems for experience, education, and skills. Projects and certifications follow the same patterns.

## Common Pitfalls

### Pitfall 1: Skills Acronym vs Proficiency Level Confusion
**What goes wrong:** "Kubernetes (K8s)" parsed as skill with level "K8s" instead of full name
**Why it happens:** Existing parser treats all parentheticals as proficiency levels
**How to avoid:** Add acronym detection heuristic; preserve full string when parenthetical is acronym
**Warning signs:** Skills display showing "Kubernetes" with level "K8s" instead of "Kubernetes (K8s)"

### Pitfall 2: Tech Stack Section Not Detected
**What goes wrong:** `#### Technologies` subsection ignored, tech stack missing from experience
**Why it happens:** Parser only looks at ### headers, not #### subsections
**How to avoid:** Extend parseExperienceEntries to detect #### Technologies/Tech Stack
**Warning signs:** Tech stacks in markdown not appearing in parsed data

### Pitfall 3: Breaking Existing CVs
**What goes wrong:** CVs without projects/certifications fail to parse or render
**Why it happens:** Required fields added to schema, templates not checking for undefined
**How to avoid:** All new fields optional, all template conditionals check for existence
**Warning signs:** Build errors on existing testuser CV

### Pitfall 4: Link URLs Not Cleaned
**What goes wrong:** Project links show "https://github.com/..." instead of "github.com/..."
**Why it happens:** Forgot to apply URL formatting per CONTEXT.md
**How to avoid:** Add formatLinkUrl filter, use it in templates
**Warning signs:** Long URLs with https:// in rendered output

### Pitfall 5: Certifications Expiry Warning Not Implemented
**What goes wrong:** Expired certifications silently included without warning
**Why it happens:** Parser validation doesn't check dates
**How to avoid:** Add expiry check in parseCertificationEntries, push warning if expired
**Warning signs:** No console warning for certs with past expiry dates

### Pitfall 6: Missing German Section Mappings
**What goes wrong:** German `## Projekte` section not recognized
**Why it happens:** SECTION_MAPPINGS in sections.ts missing German variants
**How to avoid:** Add projekte, zertifizierungen, technologien mappings
**Warning signs:** Unknown section warnings for German CV sections

### Pitfall 7: DOCX Section Builder Missing
**What goes wrong:** DOCX output doesn't include projects/certifications
**Why it happens:** buildDocumentContent in docx-sections.ts not updated
**How to avoid:** Add buildProjectsSection, buildCertificationsSection, call from main builder
**Warning signs:** DOCX missing sections that appear in HTML

## Code Examples

Verified patterns from official sources:

### Section Mappings Extension
```typescript
// Source: Extending sections.ts SECTION_MAPPINGS

const SECTION_MAPPINGS: Record<string, string> = {
  // ... existing mappings ...

  // English - New
  projects: 'projects',
  'personal projects': 'projects',
  portfolio: 'projects',
  certifications: 'certifications',
  certificates: 'certifications',

  // German - New
  projekte: 'projects',
  'persönliche projekte': 'projects',
  zertifizierungen: 'certifications',
  zertifikate: 'certifications',

  // Tech stack subsection normalization (for parser)
  technologies: 'techstack',
  'tech stack': 'techstack',
  technologien: 'techstack',
};
```

### CVData Interface Extension
```typescript
// Source: Extending cv.ts CVData interface

export interface CVData {
  contact: Contact;
  summary?: Localized<string>;
  experience?: Localized<WorkExperience[]>;
  education?: Localized<Education[]>;
  skills?: Localized<SkillCategory[]>;

  // Phase 7 additions
  projects?: Localized<Project[]>;
  certifications?: Certification[]; // Not localized per CONTEXT.md decision
}
```

### Render Context Extension
```typescript
// Source: Extending render.ts context building

const context = {
  contact: cv.contact,
  summary: cv.summary?.[locale],
  experience: cv.experience?.[locale],
  education: cv.education?.[locale],
  skills: cv.skills?.[locale],

  // Phase 7 additions
  projects: cv.projects?.[locale],
  certifications: cv.certifications, // Not localized
  locale,
  css,
};
```

### Certification Expiry Warning
```typescript
// Source: Add to cv-parser.ts during certification parsing

function parseCertificationEntries(
  content: string,
  warnings: ParseError[],
  startLine: number,
): Certification[] {
  const entries = content.split(/^---$/m).filter((e) => e.trim());

  return entries.map((entry, index) => {
    const cert: Certification = { name: '', issuer: '', date: '' };
    // ... parse entry ...

    // Expiry validation per CONTEXT.md
    if (cert.expiryDate) {
      const expiry = dayjs(cert.expiryDate);
      if (expiry.isValid() && expiry.isBefore(dayjs())) {
        warnings.push({
          type: 'warning',
          line: startLine + index,
          message: `Certification "${cert.name}" has expired (${cert.expiryDate})`,
          suggestion: 'Consider removing or noting the expiration status',
        });
      }
    }

    return cert;
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate schema for each section | Unified Localized<T> pattern | Project start | Consistent multi-language support |
| HTML-to-DOCX conversion | Direct DOCX from CVData | Phase 5 | Reliable, typed document generation |
| Manual section header strings | i18n getSectionHeader() | Phase 2 | Easy localization |

**Deprecated/outdated:**
- None for this phase - building on established patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Project Ordering with Highlights**
   - What we know: CONTEXT.md specifies highlighted first, then chronological
   - What's unclear: Should sorting happen in parser or template?
   - Recommendation: Sort in parser (modify parseProjectEntries to reorder), keeps templates simple

2. **Certifications Localization**
   - What we know: Cert names are typically not localized (AWS SAA is AWS SAA everywhere)
   - What's unclear: Should issuers be localizable? ("Amazon Web Services" vs German variant?)
   - Recommendation: Keep certifications non-localized as implemented; user can write locale-specific variant in name if needed

3. **Tech Stack Validation vs Skills**
   - What we know: CONTEXT.md says warn if job tech not in Skills section
   - What's unclear: When to run validation - during parsing or as separate step?
   - Recommendation: Add to parseCV as warning (like unknown section warning), after all sections parsed

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns in `/workspace/packages/core/src/schema/`
- Existing parser in `/workspace/packages/core/src/parser/cv-parser.ts`
- Existing template in `/workspace/templates/base/template.njk`
- Existing DOCX builder in `/workspace/packages/cli/src/lib/docx-sections.ts`
- Phase 7 CONTEXT.md decisions

### Secondary (MEDIUM confidence)
- Phase 5 RESEARCH.md for DOCX patterns
- Prior i18n implementation in `/workspace/packages/templates/src/i18n/`

### Tertiary (LOW confidence)
- None - all patterns verified in existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all existing libraries
- Architecture: HIGH - Pattern replication from existing codebase
- Pitfalls: HIGH - Based on analysis of existing implementation patterns
- Schema design: HIGH - CONTEXT.md locked decisions

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain, existing patterns)
