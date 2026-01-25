/**
 * AI configuration types.
 * Per CONTEXT.md: Support OpenAI, Anthropic, and Ollama providers.
 */

export type ProviderType = 'openai' | 'anthropic' | 'ollama';

/**
 * Per-provider configuration.
 * Model can be string (single) or array (multiple use-cases) per CONTEXT.md.
 */
export interface ProviderConfig {
	apiKey?: string;
	model?: string | string[];
}

/**
 * Ollama-specific configuration with endpoint.
 */
export interface OllamaConfig extends ProviderConfig {
	endpoint?: string; // Default: http://localhost:11434/api
}

/**
 * Complete AI configuration structure.
 * Extends existing config cascade pattern.
 */
export interface AIConfig {
	provider?: ProviderType;
	openai?: ProviderConfig;
	anthropic?: ProviderConfig;
	ollama?: OllamaConfig;
}

/**
 * Resolved provider information after factory creation.
 */
export interface ResolvedProvider {
	type: ProviderType;
	modelId: string;
	// The actual model instance is returned by createProvider, not stored here
}
