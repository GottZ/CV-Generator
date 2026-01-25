/**
 * Provider abstraction types.
 * Wraps AI SDK providers with unified interface.
 */

import type { LanguageModel } from 'ai';
import type { ProviderType } from '../types.ts';

/**
 * Unified provider wrapper returned by factory.
 */
export interface AIProvider {
	type: ProviderType;
	model: LanguageModel;
	modelId: string;
}

/**
 * Options for creating a provider.
 */
export interface CreateProviderOptions {
	apiKey?: string;
	model?: string;
	endpoint?: string; // Ollama only
}
