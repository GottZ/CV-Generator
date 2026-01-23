# CV Markdown Format

This document specifies the markdown format for cvgen CV files.

## File Structure

CV files are named `cv.md` and located in `/people/<name>/cv.md`.

```markdown
---
name: John Doe
email: john@example.com
phone: +1 234 567 8900
location: San Francisco, CA
links:
  - type: linkedin
    url: https://linkedin.com/in/johndoe
  - type: github
    url: https://github.com/johndoe
---

## Summary `en`

Your professional summary goes here...

## Experience `en`

### Senior Developer at Tech Corp
*2020-01 - present | San Francisco, CA*

- Led development of microservices architecture
- Reduced deployment time by 60%

#### Technologies
- Kubernetes
- TypeScript
- PostgreSQL

---

### Developer at StartupCo
*2018-06 - 2019-12 | New York, NY*

...
```

## Frontmatter

The YAML frontmatter contains contact information:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Full name |
| `email` | No | Email address |
| `phone` | No | Phone number |
| `location` | No | City, State/Country |
| `links` | No | Array of {type, url, label?} |
| `photo` | No | Path to photo image |
| `slug` | No | Custom filename slug (defaults to directory name) |

### Links

```yaml
links:
  - type: linkedin
    url: https://linkedin.com/in/johndoe
  - type: github
    url: https://github.com/johndoe
    label: "GitHub Profile"  # Optional custom label
  - type: portfolio
    url: https://johndoe.dev
```

Supported link types:
- `linkedin` - LinkedIn profile
- `github` - GitHub profile
- `portfolio` - Personal website
- `url` - Generic link (use label for display text)

## Sections

Sections start with `## Section Name` and optionally include a language tag:

```markdown
## Experience `en`
## Berufserfahrung `de`
```

### Supported Sections

| English | German | Description |
|---------|--------|-------------|
| Summary | Zusammenfassung | Professional summary |
| Experience | Berufserfahrung | Work history |
| Education | Ausbildung | Education history |
| Skills | Kenntnisse | Skills by category |
| Projects | Projekte | Portfolio projects |
| Certifications | Zertifizierungen | Professional certifications |

### Summary

Plain text or markdown. No special formatting required.

```markdown
## Summary `en`

Results-driven software engineer with 8+ years of experience building
scalable web applications. Passionate about clean code and mentoring
junior developers.
```

### Experience

Each job is a level-3 heading with metadata line:

```markdown
## Experience `en`

### Job Title at Company Name
*start-date - end-date | location*

- Achievement bullet point
- Another achievement with **bold** for emphasis
- Quantified result: improved X by Y%

#### Technologies
- Tech 1
- Tech 2
- Tech 3

---

### Previous Job Title at Other Company
*2018-06 - 2019-12 | New York, NY*

- Description of responsibilities
- Key accomplishments
```

**Date formats:** `YYYY-MM`, `YYYY`, or `present`

**Tech stack:** Use `#### Technologies` or `#### Tech Stack` subsection to list technologies used in the role. These are cross-referenced with your Skills section.

### Education

Similar to experience:

```markdown
## Education `en`

### Degree Name, Field of Study
*start-date - end-date*

Institution Name
Location (optional)

Honors, GPA, or relevant coursework (optional)

---

### Bachelor of Science, Computer Science
*2014-09 - 2018-06*

Stanford University
Stanford, CA

Dean's List, GPA 3.8/4.0
```

### Skills

Skills are grouped by category:

```markdown
## Skills `en`

### Programming Languages
- TypeScript (Expert)
- Python
- Go (Proficient)
- Rust (Learning)

### Cloud & Infrastructure
- AWS (Certified)
- Kubernetes (K8s)
- Terraform
- Docker

### Databases
- PostgreSQL
- MongoDB
- Redis
```

**Proficiency levels** in parentheses are optional. Recognized levels:
- Expert, Proficient, Intermediate, Beginner
- German equivalents: Experte, Fortgeschritten, Mittelstufe, Anfanger

**Acronym handling:** Acronyms like K8s, AWS, GCP are automatically preserved as full names (not expanded).

### Projects

```markdown
## Projects `en`

### Project Name
*2023-01 - present | Lead Developer | open-source | highlight*

Project description explaining what it does and your role.

#### Technologies
- React
- Node.js
- GraphQL

#### Links
- github: https://github.com/user/project
- demo: https://project.example.com

**Outcome:** Achieved X improvement in Y metric, 1000+ GitHub stars

---

### Another Project
*2022-06 - 2022-12 | Solo Developer*

Description of this project...
```

**Metadata line format:** `*dates | role | type | highlight*`
- `dates`: Required, same format as experience
- `role`: Optional, your role on the project
- `type`: Optional (open-source, commercial, personal, etc.)
- `highlight`: Optional flag to promote project to top of list

### Certifications

```markdown
## Certifications

### AWS Solutions Architect - Associate
*Amazon Web Services | 2023-05 | expires 2026-05*

Credential ID: ABC123XYZ
https://verify.aws.com/ABC123XYZ

---

### Certified Kubernetes Administrator (CKA)
*Cloud Native Computing Foundation | 2024-01*

No expiration date for this certification.
```

**Metadata line format:** `*issuer | issue-date | expires expiry-date*`

Certifications are NOT localized (certification names are universal). Expired certifications produce a warning but are still included in output.

## Entry Separator

Use `---` (three dashes on its own line) to separate multiple entries within a section.

```markdown
### First Job at Company A
*2022-01 - present*

- Responsibilities...

---

### Previous Job at Company B
*2020-01 - 2021-12*

- Responsibilities...
```

## Images

Store images in `/people/<name>/images/`:

```yaml
---
name: John Doe
photo: ./images/headshot.jpg
---
```

Supported formats: JPEG, PNG, WebP

**Note:** Images are embedded in HTML (base64) and DOCX. A warning is displayed since ATS systems cannot parse image content. For pure ATS submissions, consider omitting the photo.

## Multi-Language Support

Include sections for each language:

```markdown
## Summary `en`
English summary here...

## Zusammenfassung `de`
German summary here...

## Experience `en`
English experience entries...

## Berufserfahrung `de`
German experience entries...
```

Use `--locale` flag to generate for a specific language:

```bash
# Generate English version only
cvgen build john-doe modern --locale en

# Generate German version only
cvgen build john-doe modern --locale de

# Generate both (default if both present in CV)
cvgen build john-doe modern
```

## Complete Example

```markdown
---
name: Jane Smith
email: jane@example.com
phone: +1 555 123 4567
location: New York, NY
photo: ./images/photo.jpg
links:
  - type: linkedin
    url: https://linkedin.com/in/janesmith
  - type: github
    url: https://github.com/janesmith
---

## Summary `en`

Full-stack developer with 5 years of experience building web applications.
Specialized in React and Node.js with a focus on performance optimization.

## Experience `en`

### Senior Software Engineer at TechCorp
*2022-01 - present | New York, NY*

- Led migration to microservices, reducing deployment time by 50%
- Mentored team of 4 junior developers
- Implemented CI/CD pipeline using GitHub Actions

#### Technologies
- TypeScript
- React
- Node.js
- PostgreSQL

---

### Software Developer at StartupCo
*2019-06 - 2021-12 | San Francisco, CA*

- Built customer-facing dashboard from scratch
- Optimized database queries, improving response time by 40%

#### Technologies
- JavaScript
- Vue.js
- Python

## Education `en`

### Bachelor of Science, Computer Science
*2015-09 - 2019-05*

University of California, Berkeley
Dean's List, GPA 3.7/4.0

## Skills `en`

### Languages
- TypeScript (Expert)
- JavaScript (Expert)
- Python (Proficient)
- Go

### Frontend
- React
- Vue.js
- HTML/CSS

### Backend
- Node.js
- Express
- GraphQL

### Infrastructure
- AWS
- Docker
- Kubernetes

## Projects `en`

### Personal Portfolio Generator
*2023-06 - present | Solo Developer | open-source | highlight*

CLI tool for generating static portfolio sites from markdown.

#### Technologies
- TypeScript
- Bun

#### Links
- github: https://github.com/janesmith/portfolio-gen

## Certifications

### AWS Certified Developer - Associate
*Amazon Web Services | 2023-03 | expires 2026-03*

Credential ID: AWS-DEV-12345
```
