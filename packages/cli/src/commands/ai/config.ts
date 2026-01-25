/**
 * AI config subcommand.
 * Shows current AI configuration with sources for debugging.
 */

import {
	type AIConfig,
	getAIEnvConfig,
	getAvailableProviders,
	hasApiKey,
	loadAIConfig,
	type ProviderType,
} from '../../ai/index.ts';
import {
	createConsole,
	type JsonOutput,
	outputJson,
} from '../../lib/console.ts';

export interface ConfigOptions {
	quiet?: boolean;
	json?: boolean;
}

/**
 * Display current AI configuration.
 */
export async function configAction(options: ConfigOptions): Promise<void> {
	const cons = createConsole({ quiet: options.quiet, json: options.json });
	const cwd = process.cwd();

	// Load full config
	const config = await loadAIConfig(cwd);
	const envConfig = getAIEnvConfig();
	const availableProviders = getAvailableProviders(config);

	if (options.json) {
		const output: JsonOutput & {
			config: AIConfig;
			availableProviders: ProviderType[];
			sources: Record<string, string>;
		} = {
			status: 'success',
			config,
			availableProviders,
			sources: getConfigSources(config, envConfig),
		};
		outputJson(output);
		return;
	}

	// Display configuration
	cons.info('AI Configuration\n');

	// Provider
	if (config.provider) {
		cons.info(
			`Provider: ${config.provider}${getSource(config.provider, envConfig.provider, 'CVGEN_AI_PROVIDER')}`,
		);
	} else {
		cons.info('Provider: (not set, will prompt on first use)');
	}

	// Available providers
	if (availableProviders.length > 0) {
		cons.info(`Available: ${availableProviders.join(', ')}`);
	} else {
		cons.warn('No providers configured. Set API keys or configure Ollama.');
	}

	cons.info('');

	// OpenAI
	cons.info('OpenAI:');
	if (hasApiKey(config, 'openai')) {
		cons.success('  API Key: configured');
	} else {
		cons.info('  API Key: not set (OPENAI_API_KEY)');
	}
	cons.info(`  Model: ${config.openai?.model ?? 'gpt-4o (default)'}`);

	// Anthropic
	cons.info('\nAnthropic:');
	if (hasApiKey(config, 'anthropic')) {
		cons.success('  API Key: configured');
	} else {
		cons.info('  API Key: not set (ANTHROPIC_API_KEY)');
	}
	cons.info(
		`  Model: ${config.anthropic?.model ?? 'claude-sonnet-4-20250514 (default)'}`,
	);

	// Ollama
	cons.info('\nOllama:');
	cons.info(
		`  Endpoint: ${config.ollama?.endpoint ?? 'http://localhost:11434/api (default)'}`,
	);
	cons.info(`  Model: ${config.ollama?.model ?? 'llama3.2 (default)'}`);

	// Setup hints
	if (availableProviders.length === 0) {
		cons.info('\nTo get started:');
		cons.info('  export OPENAI_API_KEY=sk-...');
		cons.info('  export ANTHROPIC_API_KEY=sk-ant-...');
		cons.info('  Or start Ollama: ollama serve');
	}
}

/**
 * Get source annotation for a config value.
 */
function getSource(value: unknown, envValue: unknown, envKey: string): string {
	if (envValue !== undefined && value === envValue) {
		return ` (from ${envKey})`;
	}
	return ' (from config file)';
}

/**
 * Get config sources for JSON output.
 */
function getConfigSources(
	config: AIConfig,
	envConfig: AIConfig,
): Record<string, string> {
	const sources: Record<string, string> = {};

	if (config.provider) {
		sources.provider = envConfig.provider ? 'environment' : 'config';
	}
	if (config.openai?.apiKey) {
		sources['openai.apiKey'] = process.env.OPENAI_API_KEY
			? 'environment'
			: 'config';
	}
	if (config.anthropic?.apiKey) {
		sources['anthropic.apiKey'] = process.env.ANTHROPIC_API_KEY
			? 'environment'
			: 'config';
	}

	return sources;
}
