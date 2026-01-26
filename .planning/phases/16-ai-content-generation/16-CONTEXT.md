# Phase 16: AI Content Generation - Context

**Created:** 2026-01-26
**Status:** Ready for research and planning

---

## 1. Output Presentation

### Format and Destination
- Output in **cv.md format** (exact format needed for CV generation)
- **Stdout by default**, `--output` flag writes to file
- Suggestions **grouped by priority** (High / Medium / Low impact)
- **Quality labels** with traffic light colors: Green = Strong, Yellow = Good, Red = Needs review

### Comparison Display
- **Side-by-side** comparison when terminal width >= 120 columns
- **Inline diff** below 120 columns
- Original content shown alongside suggestions for `ai improve`

### Error Handling
- **Summary at end**: Generate what's possible, list all warnings at bottom
- **Exit code 1** for partial failures (distinct from success=0 and full failure=2)
- **Actionable warnings**: Every warning includes suggested fix
- **Auto-retry** for API errors: 2-3 attempts with backoff before surfacing error

---

## 2. Bullet Generation

### Bullet Count
- **Range: 3-8 bullets per role**
- Count varies by complexity (tenure + seniority + scope of responsibilities)
- **TTY mode**: Show preset options for user to choose bullet count
- **Non-TTY mode**: Auto-determine based on complexity

### Sparse Role Handling
- **TTY mode**: Prompt with free text: "Describe your key responsibilities"
- **Non-TTY mode**: Skip with warning

### Job Context
- Generic bullets by default
- **`--tailored` flag** uses job description context when provided

### STAR Method
- Use STAR internally for generation
- **`--show-star` flag** reveals STAR breakdown
- Also include STAR as **markdown comments** in output

---

## 3. Keyword Optimization

### Presentation
- **List grouped by section** (where keywords should go: skills, experience, summary)
- **Prioritize required** keywords over preferred (sort by importance, no explicit labels)
- **Prominent score** at top showing keyword coverage percentage with breakdown

### Placement Suggestions
- Show **rewritten content** with keyword integrated
- Include **2-3 lines surrounding context** for each change
- Use **exact phrasing from job posting** (if job says "Machine Learning", use that phrase)

### Matching Behavior
- **Fuzzy matching by default** (abbreviations, case variations, synonyms)
- **`--exact` flag** for strict matching

### Edge Cases
- **High coverage (>90%)**: Celebrate with success message, suggest any remaining minor additions
- Uses job description handling rules (see section 4)

---

## 4. Job Description Handling

### Input Sources
- **Local files**: .txt, .md, .pdf
- **URLs**: Fetch and parse job postings
- **Stdin**: Piped input, EOF (Ctrl+D) to end

### URL Handling
- **Follow up to 5 redirects** automatically
- **Fail with help** if site blocks scraping (instructions to save posting manually)

### Caching
- **Auto-save** to `/people/[name]/jobs/` directory
- **Naming**: Date-based format (e.g., `2026-01-26-job.md`)

### PDF Processing
- **Try text extraction** using unpdf
- **Fall back** to asking user to convert if extraction fails

### Short Postings (<100 words)
- **Prompt for more** details in TTY mode
- Accept "I'm done" or empty input to proceed anyway

---

## Deferred Ideas

None captured during discussion.

---

## Next Steps

1. `/gsd:research-phase 16` - Research implementation approaches
2. `/gsd:plan-phase 16` - Create execution plans

---

*Generated from /gsd:discuss-phase 16*
