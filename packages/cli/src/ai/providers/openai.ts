/**
 * OpenAI provider wrapper.
 * Uses @ai-sdk/openai which auto-reads OPENAI_API_KEY.
 */

import { createOpenAI } from '@ai-sdk/openai';
import type { AIProvider, CreateProviderOptions } from './types.ts';

const DEFAULT_MODEL = 'gpt-4o';

/**
 * Create OpenAI provider instance.
 * API key is read from options or OPENAI_API_KEY env var.
 */
export function createOpenAIProvider(
	options: CreateProviderOptions = {},
): AIProvider {
	const openai = createOpenAI({
		apiKey: options.apiKey, // If undefined, SDK reads from OPENAI_API_KEY
	});

	const modelId = options.model ?? DEFAULT_MODEL;

	return {
		type: 'openai',
		model: openai(modelId),
		modelId,
	};
}
