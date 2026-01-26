/**
 * Tailor stage implementation.
 * Stage 4: Adapt CV content for a specific job description.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderPrompt } from '../../prompts/index.ts';
import type { AIProvider } from '../../providers/types.ts';
import {
	type AnalyzeOutput,
	type ImproveOutput,
	type SummarizeOutput,
	type TailorOutput,
	TailorOutputSchema,
} from '../schemas/index.ts';

/**
 * Input for the Tailor stage.
 */
export interface TailorStageInput {
	cv: CVData;
	locale: string;
	provider: AIProvider;
	jobDescription: string;
	analyzeResult: AnalyzeOutput;
	improveResult?: ImproveOutput;
	summarizeResult?: SummarizeOutput;
}

/**
 * Run the Tailor stage.
 * Analyzes the CV against a job description, identifies keyword matches,
 * and provides tailored content suggestions.
 *
 * @param input - Stage input with CV, provider, job description, and previous results
 * @returns Structured tailor output with match score and suggestions
 */
export async function runTailorStage(
	input: TailorStageInput,
): Promise<TailorOutput> {
	if (!input.jobDescription || input.jobDescription.trim() === '') {
		throw new Error('Tailor stage requires a job description');
	}

	const prompt = renderPrompt('tailor', {
		cv: input.cv,
		locale: input.locale,
		jobDescription: input.jobDescription,
		previousAnalysis: JSON.stringify(
			{
				analysis: input.analyzeResult,
				improvements: input.improveResult,
				summary: input.summarizeResult,
			},
			null,
			2,
		),
	});

	const { output } = await generateText({
		model: input.provider.model,
		system:
			'You are an expert CV consultant tailoring CVs for specific job postings. Analyze keyword matches, suggest improvements, and rewrite content to maximize ATS compatibility and recruiter appeal.',
		prompt,
		output: Output.object({
			schema: TailorOutputSchema,
		}),
	});

	if (!output) {
		throw new Error('Tailor stage: LLM returned no structured output');
	}

	return output;
}
