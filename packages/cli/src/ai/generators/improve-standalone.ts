/**
 * Standalone improvement generator with priority grouping.
 * Separate from workflow improve stage for richer standalone use.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { renderRawPrompt } from '../prompts/index.ts';
import type { AIProvider } from '../providers/types.ts';
import { withRetry } from '../utils/retry.ts';

const ImprovementSchema = z.object({
	section: z.string().describe('CV section containing the bullet'),
	original: z.string(),
	improved: z.string(),
	reasoning: z
		.string()
		.describe('Specific feedback on why this needs improvement'),
	priority: z.enum(['high', 'medium', 'low']),
	metrics: z.array(z.string()).optional(),
	weaknessType: z
		.string()
		.optional()
		.describe(
			'lacks_quantification, missing_outcome, too_generic, passive_voice',
		),
});

export const ImprovementsOutputSchema = z.object({
	improvements: z.array(ImprovementSchema),
	summary: z.object({
		total: z.number(),
		high: z.number(),
		medium: z.number(),
		low: z.number(),
	}),
	overallAssessment: z
		.string()
		.describe('Brief assessment of CV content quality'),
});

export type ImprovementsOutput = z.infer<typeof ImprovementsOutputSchema>;
export type Improvement = z.infer<typeof ImprovementSchema>;

export async function generateImprovements(
	cv: CVData,
	locale: string,
	provider: AIProvider,
): Promise<ImprovementsOutput> {
	const prompt = renderRawPrompt('improve-standalone', {
		cv_content: JSON.stringify(cv, null, 2),
		locale,
	});

	const result = await withRetry(async () => {
		const { output } = await generateText({
			model: provider.model,
			system:
				'You are an expert CV writer. Analyze CV content and suggest improvements using the STAR method. Prioritize suggestions by impact potential.',
			prompt,
			output: Output.object({ schema: ImprovementsOutputSchema }),
		});

		if (!output) {
			throw new Error('Improve stage: LLM returned no structured output');
		}

		return output;
	});

	return result;
}
