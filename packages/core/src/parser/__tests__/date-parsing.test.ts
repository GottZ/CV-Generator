/**
 * Tests for date parsing in cv-parser.ts.
 * Verifies that year-only (YYYY), month (YYYY-MM), and full (YYYY-MM-DD) dates
 * are parsed correctly in experience, education, and project entries.
 */

import { describe, expect, it } from 'bun:test';
import { parseCV } from '../cv-parser.ts';

describe('date parsing', () => {
	describe('experience entries', () => {
		it('parses year-only dates (YYYY - present)', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Experience \`en\`

### Developer at Company
*2001 - present*

- Did some work
`;
			const result = parseCV(markdown);
			expect(result.data).not.toBeNull();
			const experience = result.data?.experience?.en?.[0];
			expect(experience?.startDate).toBe('2001');
			expect(experience?.endDate).toBe('present');
		});

		it('parses YYYY-MM dates', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Experience \`en\`

### Developer at Company
*2024-01 - 2024-06*

- Did some work
`;
			const result = parseCV(markdown);
			const experience = result.data?.experience?.en?.[0];
			expect(experience?.startDate).toBe('2024-01');
			expect(experience?.endDate).toBe('2024-06');
		});

		it('parses YYYY-MM-DD dates', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Experience \`en\`

### Developer at Company
*2024-01-15 - 2024-06-30*

- Did some work
`;
			const result = parseCV(markdown);
			const experience = result.data?.experience?.en?.[0];
			expect(experience?.startDate).toBe('2024-01-15');
			expect(experience?.endDate).toBe('2024-06-30');
		});

		it('parses year-only with location', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Experience \`en\`

### Developer at Company
*2001 - present | Berlin, Germany*

- Did some work
`;
			const result = parseCV(markdown);
			const experience = result.data?.experience?.en?.[0];
			expect(experience?.startDate).toBe('2001');
			expect(experience?.endDate).toBe('present');
			expect(experience?.location).toBe('Berlin, Germany');
		});
	});

	describe('education entries', () => {
		it('parses year-only dates (YYYY - heute)', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Education \`en\`

### Self-Taught at University of Life
*2001 - heute*

Autodidactic education.
`;
			const result = parseCV(markdown);
			expect(result.data).not.toBeNull();
			const education = result.data?.education?.en?.[0];
			expect(education?.startDate).toBe('2001');
			expect(education?.endDate).toBe('heute');
		});

		it('parses YYYY-MM dates in education', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Education \`en\`

### BSc at University
*2020-09 - 2024-06*

Computer Science degree.
`;
			const result = parseCV(markdown);
			const education = result.data?.education?.en?.[0];
			expect(education?.startDate).toBe('2020-09');
			expect(education?.endDate).toBe('2024-06');
		});

		it('parses year-only with location', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Education \`en\`

### Degree at University
*2001 - 2004 | Berlin, Germany*

Some notes.
`;
			const result = parseCV(markdown);
			const education = result.data?.education?.en?.[0];
			expect(education?.startDate).toBe('2001');
			expect(education?.endDate).toBe('2004');
			expect(education?.location).toBe('Berlin, Germany');
		});
	});

	describe('project entries', () => {
		it('parses year-only dates in projects', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Projects \`en\`

### My Project
*2020 - present | personal*

A cool project.
`;
			const result = parseCV(markdown);
			expect(result.data).not.toBeNull();
			const project = result.data?.projects?.en?.[0];
			expect(project?.startDate).toBe('2020');
			expect(project?.endDate).toBe('present');
			expect(project?.type).toBe('personal');
		});

		it('parses YYYY-MM dates in projects', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Projects \`en\`

### My Project
*2024-01 - 2024-06 | open-source*

A cool project.
`;
			const result = parseCV(markdown);
			const project = result.data?.projects?.en?.[0];
			expect(project?.startDate).toBe('2024-01');
			expect(project?.endDate).toBe('2024-06');
		});
	});

	describe('mixed date formats', () => {
		it('handles mixed date formats in same CV', () => {
			const markdown = `---
name: Test Person
email: test@example.com
---

## Experience \`en\`

### Senior Dev at Current Co
*2023-06 - present*

- Current role

---

### Junior Dev at Startup
*2020 - 2023-05*

- Previous role

## Education \`en\`

### Self-Study at Home
*2001 - present*

Ongoing learning.

---

### BSc at University
*2016-09 - 2020-06*

Degree.
`;
			const result = parseCV(markdown);
			expect(result.data).not.toBeNull();

			// Check experience
			const exp = result.data?.experience?.en;
			expect(exp?.[0]?.startDate).toBe('2023-06');
			expect(exp?.[0]?.endDate).toBe('present');
			expect(exp?.[1]?.startDate).toBe('2020');
			expect(exp?.[1]?.endDate).toBe('2023-05');

			// Check education
			const edu = result.data?.education?.en;
			expect(edu?.[0]?.startDate).toBe('2001');
			expect(edu?.[0]?.endDate).toBe('present');
			expect(edu?.[1]?.startDate).toBe('2016-09');
			expect(edu?.[1]?.endDate).toBe('2020-06');
		});
	});
});
