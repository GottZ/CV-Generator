/**
 * Ollama provider wrapper.
 * Uses ollama-ai-provider-v2 for local LLM support.
 */

import { createOllama } from 'ollama-ai-provider-v2';
import type { AIProvider, CreateProviderOptions } from './types.ts';

const DEFAULT_ENDPOINT = 'http://localhost:11434/api';
const DEFAULT_MODEL = 'llama3.2';

/**
 * Create Ollama provider instance.
 * Connects to local Ollama server at specified endpoint.
 */
export function createOllamaProvider(
	options: CreateProviderOptions = {},
): AIProvider {
	const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

	const ollama = createOllama({
		baseURL: endpoint,
	});

	const modelId = options.model ?? DEFAULT_MODEL;

	return {
		type: 'ollama',
		model: ollama(modelId),
		modelId,
	};
}

/**
 * Check if Ollama server is reachable.
 * Per RESEARCH.md Pitfall 2: Handle connection refused gracefully.
 */
export async function checkOllamaConnection(
	endpoint: string = DEFAULT_ENDPOINT,
): Promise<boolean> {
	try {
		// Strip /api suffix for tags endpoint
		const baseUrl = endpoint.replace(/\/api\/?$/, '');
		const response = await fetch(`${baseUrl}/api/tags`, {
			method: 'GET',
			signal: AbortSignal.timeout(3000),
		});
		return response.ok;
	} catch {
		return false;
	}
}
