/**
 * AI configuration cascade system.
 * Priority (lowest to highest):
 * 1. Defaults
 * 2. Config file (.cvgenrc or config.json ai section)
 * 3. Environment variables (CVGEN_AI_* and standard API keys)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AIConfig, ProviderType } from './types.ts';

/** Default configuration values */
const DEFAULTS: AIConfig = {
	openai: { model: 'gpt-4o' },
	anthropic: { model: 'claude-sonnet-4-20250514' },
	ollama: { endpoint: 'http://localhost:11434/api', model: 'llama3.2' },
};

/**
 * Environment variable mappings for AI config.
 * Per CONTEXT.md: Standard API keys use OPENAI_API_KEY, etc.
 * CVGEN-prefixed vars for other settings.
 */
const AI_ENV_MAPPINGS: Record<string, (value: string) => Partial<AIConfig>> = {
	// Standard API keys (not prefixed)
	OPENAI_API_KEY: (v) => ({ openai: { apiKey: v } }),
	ANTHROPIC_API_KEY: (v) => ({ anthropic: { apiKey: v } }),
	// CVGEN-prefixed settings
	CVGEN_AI_PROVIDER: (v) => ({ provider: v as ProviderType }),
	CVGEN_AI_OPENAI_MODEL: (v) => ({
		openai: { model: v.includes(',') ? v.split(',').map((m) => m.trim()) : v },
	}),
	CVGEN_AI_ANTHROPIC_MODEL: (v) => ({
		anthropic: {
			model: v.includes(',') ? v.split(',').map((m) => m.trim()) : v,
		},
	}),
	CVGEN_AI_OLLAMA_ENDPOINT: (v) => ({ ollama: { endpoint: v } }),
	CVGEN_AI_OLLAMA_MODEL: (v) => ({
		ollama: { model: v.includes(',') ? v.split(',').map((m) => m.trim()) : v },
	}),
};

/**
 * Get AI config from environment variables.
 */
export function getAIEnvConfig(): AIConfig {
	const config: AIConfig = {};

	for (const [envKey, mapper] of Object.entries(AI_ENV_MAPPINGS)) {
		const value = process.env[envKey];
		if (value) {
			const partial = mapper(value);
			mergeAIConfigs(config, partial);
		}
	}

	return config;
}

/**
 * Deep merge AI configs, mutating target.
 */
export function mergeAIConfigs(
	target: AIConfig,
	source: Partial<AIConfig>,
): AIConfig {
	if (source.provider) target.provider = source.provider;

	if (source.openai) {
		target.openai = { ...target.openai, ...source.openai };
	}
	if (source.anthropic) {
		target.anthropic = { ...target.anthropic, ...source.anthropic };
	}
	if (source.ollama) {
		target.ollama = { ...target.ollama, ...source.ollama };
	}

	return target;
}

/**
 * Load AI config from config file (config.json or .cvgenrc).
 */
async function loadConfigFile(projectRoot: string): Promise<AIConfig | null> {
	// Try config.json first
	const configJsonPath = path.join(projectRoot, 'config.json');
	try {
		const content = await readFile(configJsonPath, 'utf-8');
		const config = JSON.parse(content) as { ai?: AIConfig };
		return config.ai ?? null;
	} catch {
		// config.json not found or invalid, try .cvgenrc
	}

	// Try .cvgenrc
	const cvgenrcPath = path.join(projectRoot, '.cvgenrc');
	try {
		const content = await readFile(cvgenrcPath, 'utf-8');
		const config = JSON.parse(content) as { ai?: AIConfig };
		return config.ai ?? null;
	} catch {
		// .cvgenrc not found or invalid
		return null;
	}
}

/**
 * Load complete AI configuration with cascade.
 * Returns merged config with all levels applied.
 */
export async function loadAIConfig(projectRoot: string): Promise<AIConfig> {
	// Start with defaults
	const config: AIConfig = JSON.parse(JSON.stringify(DEFAULTS));

	// Apply config file settings
	const fileConfig = await loadConfigFile(projectRoot);
	if (fileConfig) {
		mergeAIConfigs(config, fileConfig);
	}

	// Apply environment variables (highest priority)
	const envConfig = getAIEnvConfig();
	mergeAIConfigs(config, envConfig);

	return config;
}

/**
 * Normalize model config to array for internal use.
 */
export function normalizeModel(model: string | string[] | undefined): string[] {
	if (!model) return [];
	if (Array.isArray(model)) return model;
	return model.includes(',') ? model.split(',').map((m) => m.trim()) : [model];
}

/**
 * Get primary (first) model from config.
 */
export function getPrimaryModel(
	model: string | string[] | undefined,
): string | undefined {
	const models = normalizeModel(model);
	return models[0];
}

/**
 * Check if a provider has API key configured.
 */
export function hasApiKey(config: AIConfig, provider: ProviderType): boolean {
	switch (provider) {
		case 'openai':
			return Boolean(config.openai?.apiKey || process.env.OPENAI_API_KEY);
		case 'anthropic':
			return Boolean(config.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY);
		case 'ollama':
			return true; // Ollama doesn't require API key
	}
}
