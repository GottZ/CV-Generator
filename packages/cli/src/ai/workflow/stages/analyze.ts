/**
 * Analyze stage implementation.
 * Stage 1: Analyze CV structure and identify improvement opportunities.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderPrompt } from '../../prompts/index.ts';
import type { AIProvider } from '../../providers/types.ts';
import { type AnalyzeOutput, AnalyzeOutputSchema } from '../schemas/index.ts';

/**
 * Input for the Analyze stage.
 */
export interface AnalyzeStageInput {
	cv: CVData;
	locale: string;
	provider: AIProvider;
}

/**
 * Run the Analyze stage.
 * Analyzes CV structure, identifies gaps, and prioritizes improvements.
 *
 * @param input - Stage input with CV and provider
 * @returns Structured analyze output with sections, gaps, and priorities
 */
export async function runAnalyzeStage(
	input: AnalyzeStageInput,
): Promise<AnalyzeOutput> {
	const prompt = renderPrompt('analyze', {
		cv: input.cv,
		locale: input.locale,
	});

	const { output } = await generateText({
		model: input.provider.model,
		system:
			'You are an expert CV consultant analyzing a CV for structure, content gaps, and improvement opportunities. Provide detailed, actionable feedback.',
		prompt,
		output: Output.object({
			schema: AnalyzeOutputSchema,
		}),
	});

	if (!output) {
		throw new Error('Analyze stage: LLM returned no structured output');
	}

	return output;
}
