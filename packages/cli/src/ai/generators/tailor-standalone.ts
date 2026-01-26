/**
 * Standalone tailor generator - works without workflow state dependency.
 * Reuses TailorOutputSchema from Phase 15.
 */

import type { CVData } from '@gottz/cv-core';
import { generateObject } from 'ai';
import type { AIProvider } from '../providers/types.ts';
import { withRetry } from '../utils/retry.ts';
import {
	type TailorOutput,
	TailorOutputSchema,
} from '../workflow/schemas/tailor-output.ts';

/**
 * Tailor a CV for a specific job description.
 *
 * Uses the standalone tailor prompt template to generate job-specific
 * tailoring suggestions without requiring prior workflow stages.
 *
 * @param cv - The CV data to tailor
 * @param locale - The locale of the CV content
 * @param provider - The AI provider to use
 * @param jobDescription - The job description to tailor for
 * @returns Tailoring suggestions including match score, keywords, and rewrites
 *
 * @example
 * ```typescript
 * const result = await tailorCV(cv, 'en', provider, jobDescription);
 * console.log(`Match: ${result.matchScore}%`);
 * ```
 */
export async function tailorCV(
	cv: CVData,
	locale: string,
	provider: AIProvider,
	jobDescription: string,
): Promise<TailorOutput> {
	const prompt = buildTailorPrompt(cv, locale, jobDescription);

	const result = await withRetry(async () => {
		const { object } = await generateObject({
			model: provider.model,
			schema: TailorOutputSchema,
			prompt,
		});
		return object;
	});

	return result;
}

/**
 * Build the tailor prompt from CV data and job description.
 */
function buildTailorPrompt(
	cv: CVData,
	locale: string,
	jobDescription: string,
): string {
	const lines: string[] = [];

	lines.push('# Tailor CV for Job');
	lines.push('');
	lines.push('Adapt the CV content to match this specific job posting.');
	lines.push('');
	lines.push('## CV Content');
	lines.push(JSON.stringify(cv, null, 2));
	lines.push('');
	lines.push('## Job Description');
	lines.push(jobDescription);
	lines.push('');
	lines.push(`## Locale: ${locale}`);
	lines.push('');
	lines.push('## Instructions');
	lines.push('');
	lines.push(
		'1. Calculate match score (0-100%) based on skill/experience alignment',
	);
	lines.push('2. Identify keywords present and missing');
	lines.push(
		'3. Rewrite the professional summary to emphasize relevant experience',
	);
	lines.push(
		'4. Suggest bullet rewrites that highlight job-relevant accomplishments',
	);
	lines.push('5. Prioritize changes by impact on match score');
	lines.push('');
	lines.push('## Tailoring Guidelines');
	lines.push('');
	lines.push('### Summary Rewrite');
	lines.push('- Lead with experience most relevant to the role');
	lines.push('- Mirror key terminology from the job posting');
	lines.push("- Maintain authenticity - don't claim skills not in CV");
	lines.push('');
	lines.push('### Bullet Rewrites');
	lines.push('- Emphasize transferable skills that match job requirements');
	lines.push('- Use terminology from job posting where accurate');
	lines.push('- Highlight relevant metrics and outcomes');
	lines.push('- Focus on bullets that most directly address job needs');
	lines.push('');
	lines.push('### Keyword Strategy');
	lines.push('- Use exact phrasing from job posting when applicable');
	lines.push('- Add missing keywords naturally, not artificially');
	lines.push('- Suggest specific placement for each keyword');
	lines.push('');
	lines.push(
		'CRITICAL: Never add skills or experience not present in the original CV.',
	);
	lines.push('Only reframe existing content to better match the job.');

	return lines.join('\n');
}
