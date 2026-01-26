/**
 * Standalone bullet generator - not part of workflow state.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderPrompt } from '../prompts/index.ts';
import type { AIProvider } from '../providers/types.ts';
import { withRetry } from '../utils/retry.ts';
import {
	type BulletsOutput,
	BulletsOutputSchema,
} from '../workflow/schemas/bullets-output.ts';

export interface BulletsOptions {
	showStar?: boolean;
	tailored?: boolean;
	jobDescription?: string;
}

/**
 * Generate STAR-formatted achievement bullets for CV work experience.
 *
 * This is a standalone generator (AI-06) that produces high-quality
 * achievement bullets using the STAR method. Unlike the workflow
 * improve stage, this generates complete bullets from scratch.
 *
 * @param cv - The CV data to generate bullets from
 * @param locale - The locale code for the CV content
 * @param provider - The AI provider to use for generation
 * @param options - Generation options (showStar, tailored, jobDescription)
 * @returns Generated bullets with quality assessment
 *
 * @example
 * ```typescript
 * const result = await generateBullets(cv, 'en', provider, {
 *   showStar: true,
 *   tailored: true,
 *   jobDescription: 'Senior Frontend Developer at...'
 * });
 * for (const role of result.roles) {
 *   console.log(`${role.role} at ${role.company}`);
 *   for (const bullet of role.bullets) {
 *     console.log(`- ${bullet.text}`);
 *   }
 * }
 * ```
 */
export async function generateBullets(
	cv: CVData,
	locale: string,
	provider: AIProvider,
	options: BulletsOptions = {},
): Promise<BulletsOutput> {
	const prompt = renderPrompt('bullets', {
		cv,
		locale,
		jobDescription: options.jobDescription,
		options: {
			showStar: options.showStar,
			tailored: options.tailored,
		},
	});

	const result = await withRetry(async () => {
		const { output } = await generateText({
			model: provider.model,
			prompt,
			output: Output.object({ schema: BulletsOutputSchema }),
		});

		if (!output) {
			throw new Error('Bullets generator: LLM returned no structured output');
		}

		return output;
	});

	return result;
}
