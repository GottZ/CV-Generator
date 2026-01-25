/**
 * AI module public API.
 * Provides provider abstraction, configuration, and state management.
 */

// Configuration
export {
	getAIEnvConfig,
	getPrimaryModel,
	hasApiKey,
	loadAIConfig,
	mergeAIConfigs,
	normalizeModel,
} from './config.ts';
// Prompts
export {
	getPromptList,
	getPromptMetadata,
	getPromptsByStage,
	isValidPrompt,
	type PromptContext,
	PromptError,
	type PromptMetadata,
	renderPrompt,
} from './prompts/index.ts';
// Providers
export {
	createProvider,
	getAvailableProviders,
	ProviderConfigError,
} from './providers/index.ts';
export { checkOllamaConnection } from './providers/ollama.ts';
export type { AIProvider, CreateProviderOptions } from './providers/types.ts';
// State
export {
	getLastModel,
	getLastProvider,
	getProjectState,
	setLastModel,
	setLastProvider,
} from './state.ts';
// Types
export type {
	AIConfig,
	OllamaConfig,
	ProviderConfig,
	ProviderType,
	ResolvedProvider,
} from './types.ts';
