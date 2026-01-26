/**
 * Improve stage implementation.
 * Stage 2: Generate improved achievement bullets using STAR method.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderPrompt } from '../../prompts/index.ts';
import type { AIProvider } from '../../providers/types.ts';
import {
	type AnalyzeOutput,
	type ImproveOutput,
	ImproveOutputSchema,
} from '../schemas/index.ts';

/**
 * Input for the Improve stage.
 */
export interface ImproveStageInput {
	cv: CVData;
	locale: string;
	provider: AIProvider;
	analyzeResult: AnalyzeOutput;
}

/**
 * Run the Improve stage.
 * Uses previous analysis to generate STAR-formatted bullet improvements.
 *
 * @param input - Stage input with CV, provider, and analyze results
 * @returns Structured improve output with job improvements
 */
export async function runImproveStage(
	input: ImproveStageInput,
): Promise<ImproveOutput> {
	const prompt = renderPrompt('improve', {
		cv: input.cv,
		locale: input.locale,
		previousAnalysis: JSON.stringify(input.analyzeResult, null, 2),
	});

	const { output } = await generateText({
		model: input.provider.model,
		system:
			'You are an expert CV writer. Improve achievement bullets using the STAR method (Situation, Task, Action, Result). Focus on quantifiable metrics and strong action verbs.',
		prompt,
		output: Output.object({
			schema: ImproveOutputSchema,
		}),
	});

	if (!output) {
		throw new Error('Improve stage: LLM returned no structured output');
	}

	return output;
}
