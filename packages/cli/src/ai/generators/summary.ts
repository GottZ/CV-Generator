/**
 * Standalone summary generator - not part of workflow state.
 * Reuses SummarizeOutputSchema from Phase 15.
 *
 * @module ai/generators/summary
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderRawPrompt } from '../prompts/index.ts';
import type { AIProvider } from '../providers/types.ts';
import { withRetry } from '../utils/retry.ts';
import {
	type SummarizeOutput,
	SummarizeOutputSchema,
} from '../workflow/schemas/summarize-output.ts';

/**
 * Options for standalone summary generation.
 */
export interface SummaryOptions {
	/** Optional target role to tailor summary for */
	targetRole?: string;
}

/**
 * Generate a professional summary from CV data.
 *
 * This is a standalone generator (AI-07) that is distinct from the
 * workflow summarize stage. It can be used independently without
 * going through the full analyze -> improve -> summarize workflow.
 *
 * @param cv - The CV data to generate summary from
 * @param locale - The locale code for the CV content
 * @param provider - The AI provider to use for generation
 * @param options - Optional generation options
 * @returns Generated summary with primary, alternative, key points and target roles
 *
 * @example
 * ```typescript
 * const result = await generateSummary(cv, 'en', provider, {
 *   targetRole: 'Senior Frontend Developer'
 * });
 * console.log(result.primary);
 * ```
 */
export async function generateSummary(
	cv: CVData,
	locale: string,
	provider: AIProvider,
	options: SummaryOptions = {},
): Promise<SummarizeOutput> {
	const prompt = renderRawPrompt('summary-gen', {
		cv_content: JSON.stringify(cv, null, 2),
		locale,
		target_role: options.targetRole,
	});

	const result = await withRetry(async () => {
		const { output } = await generateText({
			model: provider.model,
			prompt,
			output: Output.object({ schema: SummarizeOutputSchema }),
		});
		if (!output) {
			throw new Error('Summary generator: LLM returned no structured output');
		}
		return output;
	});

	return result;
}
