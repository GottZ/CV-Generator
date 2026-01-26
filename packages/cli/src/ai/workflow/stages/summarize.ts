/**
 * Summarize stage implementation.
 * Stage 3: Generate professional summary from CV content and previous analysis.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderPrompt } from '../../prompts/index.ts';
import type { AIProvider } from '../../providers/types.ts';
import {
	type AnalyzeOutput,
	type ImproveOutput,
	type SummarizeOutput,
	SummarizeOutputSchema,
} from '../schemas/index.ts';

/**
 * Input for the Summarize stage.
 */
export interface SummarizeStageInput {
	cv: CVData;
	locale: string;
	provider: AIProvider;
	analyzeResult: AnalyzeOutput;
	improveResult?: ImproveOutput; // Optional - can summarize without improvements
}

/**
 * Run the Summarize stage.
 * Uses previous analysis and optional improvements as context
 * to generate targeted professional summaries.
 *
 * @param input - Stage input with CV, provider, and previous results
 * @returns Structured summarize output with primary and alternative summaries
 */
export async function runSummarizeStage(
	input: SummarizeStageInput,
): Promise<SummarizeOutput> {
	// Build context from previous stages
	const previousContext = {
		analysis: JSON.stringify(input.analyzeResult, null, 2),
		improvements: input.improveResult
			? JSON.stringify(input.improveResult, null, 2)
			: undefined,
	};

	const prompt = renderPrompt('summarize', {
		cv: input.cv,
		locale: input.locale,
		previousAnalysis: previousContext.analysis,
		options: { improvements: previousContext.improvements },
	});

	const { output } = await generateText({
		model: input.provider.model,
		system:
			'You are an expert CV writer creating professional summaries. Write concise, impactful summaries that highlight key achievements and position the candidate for their target roles.',
		prompt,
		output: Output.object({
			schema: SummarizeOutputSchema,
		}),
	});

	if (!output) {
		throw new Error('Summarize stage: LLM returned no structured output');
	}

	return output;
}
