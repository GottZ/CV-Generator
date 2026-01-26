/**
 * Keyword analysis generator - uses LLM for extraction plus local matching.
 */

import type { CVData } from '@gottz/cv-core';
import { generateText, Output } from 'ai';
import { renderPrompt } from '../prompts/index.ts';
import type { AIProvider } from '../providers/types.ts';
import { withRetry } from '../utils/retry.ts';
import {
	type KeywordsOutput,
	KeywordsOutputSchema,
} from '../workflow/schemas/keywords-output.ts';

export interface KeywordsOptions {
	exact?: boolean;
}

export async function analyzeKeywords(
	cv: CVData,
	locale: string,
	provider: AIProvider,
	jobDescription: string,
	options: KeywordsOptions = {},
): Promise<KeywordsOutput> {
	const prompt = renderPrompt('keywords', {
		cv,
		locale,
		jobDescription,
		options: {
			match_mode: options.exact ? 'exact' : 'fuzzy',
			exact_matching: options.exact,
		},
	});

	const result = await withRetry(async () => {
		const { output } = await generateText({
			model: provider.model,
			system:
				'You are an expert ATS keyword analyzer. Analyze CVs against job postings to identify missing keywords and suggest natural integrations. Be precise about keyword matching and provide actionable placement suggestions.',
			prompt,
			output: Output.object({ schema: KeywordsOutputSchema }),
		});

		if (!output) {
			throw new Error('Keywords analysis: LLM returned no structured output');
		}

		return output;
	});

	return result;
}
