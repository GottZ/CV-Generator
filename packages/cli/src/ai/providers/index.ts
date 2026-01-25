/**
 * Provider factory for creating AI providers.
 * Pattern from RESEARCH.md: Single factory creates any provider from config.
 */

import { getPrimaryModel, hasApiKey } from '../config.ts';
import type { AIConfig, ProviderType } from '../types.ts';
import { createAnthropicProvider } from './anthropic.ts';
import { createOllamaProvider } from './ollama.ts';
import { createOpenAIProvider } from './openai.ts';
import type { AIProvider, CreateProviderOptions } from './types.ts';

export type { AIProvider, CreateProviderOptions } from './types.ts';

/**
 * Create provider instance from configuration.
 * Throws if provider requires API key and none is configured.
 */
export function createProvider(
	config: AIConfig,
	providerOverride?: ProviderType,
): AIProvider {
	const providerType = providerOverride ?? config.provider ?? 'openai';

	// Check API key before attempting to create provider
	if (!hasApiKey(config, providerType)) {
		throw new ProviderConfigError(providerType, 'API key not configured');
	}

	const options = getProviderOptions(config, providerType);

	switch (providerType) {
		case 'openai':
			return createOpenAIProvider(options);
		case 'anthropic':
			return createAnthropicProvider(options);
		case 'ollama':
			return createOllamaProvider(options);
		default:
			throw new ProviderConfigError(providerType, 'Unknown provider type');
	}
}

/**
 * Extract provider-specific options from config.
 */
function getProviderOptions(
	config: AIConfig,
	provider: ProviderType,
): CreateProviderOptions {
	switch (provider) {
		case 'openai':
			return {
				apiKey: config.openai?.apiKey,
				model: getPrimaryModel(config.openai?.model),
			};
		case 'anthropic':
			return {
				apiKey: config.anthropic?.apiKey,
				model: getPrimaryModel(config.anthropic?.model),
			};
		case 'ollama':
			return {
				endpoint: config.ollama?.endpoint,
				model: getPrimaryModel(config.ollama?.model),
			};
	}
}

/**
 * Get list of providers that have credentials configured.
 * Used for prompting user to select when multiple are available.
 */
export function getAvailableProviders(config: AIConfig): ProviderType[] {
	const available: ProviderType[] = [];

	if (hasApiKey(config, 'openai')) available.push('openai');
	if (hasApiKey(config, 'anthropic')) available.push('anthropic');
	if (hasApiKey(config, 'ollama')) available.push('ollama');

	return available;
}

/**
 * Error thrown when provider configuration is invalid.
 */
export class ProviderConfigError extends Error {
	constructor(
		public readonly provider: ProviderType | string,
		message: string,
	) {
		super(`Provider ${provider}: ${message}`);
		this.name = 'ProviderConfigError';
	}
}
