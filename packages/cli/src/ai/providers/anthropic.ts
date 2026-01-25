/**
 * Anthropic provider wrapper.
 * Uses @ai-sdk/anthropic which auto-reads ANTHROPIC_API_KEY.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import type { AIProvider, CreateProviderOptions } from './types.ts';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * Create Anthropic provider instance.
 * API key is read from options or ANTHROPIC_API_KEY env var.
 */
export function createAnthropicProvider(
	options: CreateProviderOptions = {},
): AIProvider {
	const anthropic = createAnthropic({
		apiKey: options.apiKey, // If undefined, SDK reads from ANTHROPIC_API_KEY
	});

	const modelId = options.model ?? DEFAULT_MODEL;

	return {
		type: 'anthropic',
		model: anthropic(modelId),
		modelId,
	};
}
