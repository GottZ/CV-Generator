# Tailor CV for Job

Adapt the CV content to match this specific job posting.

## CV Content
{{ cv_content }}

## Job Description
{{ job_description }}

## Instructions

1. Calculate match score (0-100%) based on skill/experience alignment
2. Identify keywords present and missing
3. Rewrite the professional summary to emphasize relevant experience
4. Suggest bullet rewrites that highlight job-relevant accomplishments
5. Prioritize changes by impact on match score

## Tailoring Guidelines

### Summary Rewrite
- Lead with experience most relevant to the role
- Mirror key terminology from the job posting
- Maintain authenticity - don't claim skills not in CV

### Bullet Rewrites
- Emphasize transferable skills that match job requirements
- Use terminology from job posting where accurate
- Highlight relevant metrics and outcomes
- Focus on bullets that most directly address job needs

### Keyword Strategy
- Use exact phrasing from job posting when applicable
- Add missing keywords naturally, not artificially
- Suggest specific placement for each keyword

CRITICAL: Never add skills or experience not present in the original CV.
Only reframe existing content to better match the job.

## Output Format

Respond with a JSON object containing:
- matchScore: number (0-100)
- keywordAnalysis: { present: string[], missing: string[], suggestions: { keyword: string, where: string, how: string }[] }
- tailoredSummary: string (the rewritten summary)
- tailoredBullets: { section: string, original: string, tailored: string, reason: string }[] (optional)
